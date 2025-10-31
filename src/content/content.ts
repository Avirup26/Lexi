// Content script for Lexi - runs on every webpage
console.log('Lexi content script loaded');

let currentOverlay: HTMLElement | null = null;
let lastMouseX = 0;
let lastMouseY = 0;
let isTranslating = false;

// Listen for text selection
document.addEventListener('mouseup', (event: MouseEvent) => {
  // Ignore clicks inside Lexi overlay
  const target = event.target as HTMLElement;
  if (target.closest('.lexi-overlay')) {
    console.log('Click inside Lexi overlay, ignoring');
    return;
  }
  
  // Don't create new overlay if we're currently translating
  if (isTranslating) {
    console.log('Translation in progress, ignoring mouseup');
    return;
  }
  
  lastMouseX = event.clientX;
  lastMouseY = event.clientY;
  
  setTimeout(() => {
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim();
    
    if (selectedText && selectedText.length > 0) {
      showLexiOverlay(selectedText, lastMouseX, lastMouseY);
    }
  }, 10);
});

// Listen for messages from popup or background script
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'TRANSLATE_TEXT') {
    // Handle translation request
    console.log('Translation requested:', message.text);
    sendResponse({ success: true });
  }
  
  if (message.type === 'SHOW_TRANSLATION') {
    // Show translation widget
    createTranslationWidget(message.original, message.translation);
    sendResponse({ success: true });
  }
  
  return true; // Keep message channel open for async response
});

// Handle translation using Chrome's built-in Translation API (Official API)
async function handleTranslation(text: string) {
  // Set translating flag to prevent new overlays
  isTranslating = true;
  
  // Find the result container in the current overlay
  const currentOverlayElement = document.getElementById('lexi-selection-overlay');
  if (!currentOverlayElement) {
    console.error('❌ No overlay found');
    isTranslating = false;
    return;
  }
  
  const resultContainer = currentOverlayElement.querySelector('#lexi-translation-result') as HTMLElement;
  if (!resultContainer) {
    console.error('❌ No result container found in overlay');
    isTranslating = false;
    return;
  }
  
  console.log('✅ Found result container in current overlay');
  
  // Show loading state
  resultContainer.innerHTML = `
    <div style="
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px;
      background: white;
      border-radius: 8px;
      border: 1px solid #e0f2fe;
      margin-top: 12px;
    ">
      <div style="
        width: 20px;
        height: 20px;
        border: 2px solid #0ea5e9;
        border-top-color: transparent;
        border-radius: 50%;
        animation: lexiSpin 0.8s linear infinite;
      "></div>
      <div style="color: #64748b; font-size: 13px;">
        Translating...
      </div>
    </div>
  `;
  
  try {
    // Debug: Log available APIs
    console.log('=== Translator API Debug ===');
    console.log('Chrome version:', navigator.userAgent);
    console.log('Translator in self:', 'Translator' in self);
    console.log('translation in self:', 'translation' in self);
    console.log('ai in self:', 'ai' in self);
    console.log('LanguageDetector in self:', 'LanguageDetector' in self);
    
    // Try to access the API
    if ('Translator' in self) {
      console.log('Translator object:', (self as any).Translator);
    }
    if ('translation' in self) {
      console.log('translation object:', (self as any).translation);
    }
    
    // Check if Translator API is available (Official API - Chrome 138+)
    if (!('Translator' in self)) {
      throw new Error('Translator API not available.\n\nRequired: Chrome 138+ (Stable/Canary)\n\nCurrent version: ' + navigator.userAgent.match(/Chrome\/(\d+)/)?.[1] + '\n\nThe Translator API is available from Chrome 138.\nPlease update your browser.');
    }
    
    console.log('✅ Translator API is available!');
    
    // Get settings from storage
    let targetLanguage = 'es'; // Default to Spanish
    let nativeLanguage = 'en'; // Default to English
    let showDefinitions = true;
    
    try {
      const result = await chrome.storage.local.get(['settings']);
      if (result.settings) {
        targetLanguage = result.settings.targetLanguage || 'es';
        nativeLanguage = result.settings.nativeLanguage || 'en';
        showDefinitions = result.settings.showDefinitions !== false;
      }
    } catch (e) {
      console.log('Using default settings');
    }
    
    let sourceLanguage = 'en'; // Will be auto-detected
    
    // Try to detect source language using Language Detector API
    let detectedLanguage = null;
    let detectionConfidence = 0;
    
    if ('LanguageDetector' in self) {
      try {
        console.log('Attempting language detection...');
        const detector = await (self as any).LanguageDetector.create();
        const detectionResults = await detector.detect(text);
        
        if (detectionResults && detectionResults.length > 0) {
          detectedLanguage = detectionResults[0].detectedLanguage;
          detectionConfidence = detectionResults[0].confidence;
          
          // Only use detected language if confidence is high enough
          if (detectionConfidence > 0.5) {
            sourceLanguage = detectedLanguage;
            console.log(`Language detected: ${sourceLanguage} (confidence: ${(detectionConfidence * 100).toFixed(1)}%)`);
          } else {
            console.log(`Low confidence detection: ${detectedLanguage} (${(detectionConfidence * 100).toFixed(1)}%), using default`);
          }
        }
      } catch (e) {
        console.log('Language detection failed:', e);
        // Continue with default source language
      }
    } else {
      console.log('LanguageDetector API not available');
    }
    
    // If source and target are the same, swap to native language
    if (sourceLanguage === targetLanguage) {
      console.log(`Source and target are both ${sourceLanguage}, swapping to native language...`);
      
      // If detected language is the target language, translate to native language
      targetLanguage = nativeLanguage;
      
      // If they're still the same, use opposite direction
      if (sourceLanguage === targetLanguage) {
        targetLanguage = sourceLanguage === 'en' ? 'es' : 'en';
      }
      
      console.log(`Translating ${sourceLanguage} → ${targetLanguage}`);
    }
    
    // Check translator availability (Official API)
    console.log(`Checking translation availability: ${sourceLanguage} → ${targetLanguage}`);
    const capabilities = await (self as any).Translator.availability({
      sourceLanguage: sourceLanguage,
      targetLanguage: targetLanguage,
    });
    
    console.log('Translator capabilities:', capabilities);
    
    if (capabilities === 'no') {
      throw new Error(`Translation not supported for ${sourceLanguage.toUpperCase()} → ${targetLanguage.toUpperCase()}\n\nTry a different language pair or check if the language pack is available.`);
    }
    
    // Create translator with download progress monitoring (Official API)
    const translator = await (self as any).Translator.create({
      sourceLanguage: sourceLanguage,
      targetLanguage: targetLanguage,
      monitor(m: any) {
        m.addEventListener('downloadprogress', (e: any) => {
          console.log(`Translation model download: ${Math.round(e.loaded * 100)}%`);
          // Update UI with download progress
          const progressText = resultContainer.querySelector('.lexi-progress-text');
          if (progressText) {
            progressText.textContent = `Downloading model... ${Math.round(e.loaded * 100)}%`;
          }
        });
      },
    });
    
    // Perform translation (Official API)
    const translatedText = await translator.translate(text);
    
    console.log('Translation successful:', translatedText);
    console.log(`Translated from ${sourceLanguage} to ${targetLanguage}`);
    
    // Display translation result
    let resultHTML = `
      <div style="
        padding: 16px;
        background: linear-gradient(135deg, #f0f9ff 0%, #ffffff 100%);
        border-radius: 10px;
        border: 2px solid #0ea5e9;
        margin-top: 12px;
        box-shadow: 0 2px 8px rgba(14, 165, 233, 0.15);
      ">
        <div style="
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 10px;
          padding-bottom: 10px;
          border-bottom: 1px solid #e0f2fe;
        ">
          <span style="font-size: 18px;">✅</span>
          <span style="
            font-size: 13px;
            color: #0ea5e9;
            font-weight: 700;
            letter-spacing: 0.3px;
          ">Translation (${sourceLanguage.toUpperCase()} → ${targetLanguage.toUpperCase()})</span>
        </div>
        <div style="
          font-size: 16px;
          color: #0f172a;
          line-height: 1.7;
          word-wrap: break-word;
          font-weight: 600;
        ">${escapeHtml(translatedText)}</div>
      </div>
    `;
    
    resultContainer.innerHTML = resultHTML;
    
    // Add definitions if enabled and text is a single word
    const wordCount = text.trim().split(/\s+/).length;
    console.log(`Word count: ${wordCount}, showDefinitions: ${showDefinitions}`);
    
    if (showDefinitions && wordCount === 1) {
      console.log('Fetching definitions for single word...');
      try {
        await addDefinitions(text, translatedText, sourceLanguage, targetLanguage, resultContainer);
      } catch (error) {
        console.error('Failed to add definitions:', error);
      }
    } else if (wordCount > 1) {
      console.log('Skipping definitions - multiple words detected');
    }
    
    // Clear translating flag after successful translation
    isTranslating = false;
    
  } catch (error) {
    console.error('Translation error:', error);
    
    // Display error message with proper formatting
    const errorMessage = error instanceof Error ? error.message : 'Translation failed';
    const errorLines = errorMessage.split('\n').map(line => escapeHtml(line));
    
    resultContainer.innerHTML = `
      <div style="
        padding: 14px;
        background: #fef2f2;
        border-radius: 8px;
        border: 1px solid #fecaca;
        margin-top: 12px;
      ">
        <div style="
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 8px;
        ">
          <span style="font-size: 16px;">⚠️</span>
          <span style="
            font-size: 12px;
            color: #dc2626;
            font-weight: 600;
          ">Translation Error</span>
        </div>
        <div style="
          font-size: 12px;
          color: #991b1b;
          line-height: 1.6;
          white-space: pre-wrap;
        ">${errorLines.join('\n')}</div>
      </div>
    `;
    
    // Clear translating flag after error
    isTranslating = false;
  }
}

// Helper function to escape HTML (defined globally for reuse)
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Add word definitions using Prompt API
async function addDefinitions(
  originalWord: string,
  translatedWord: string,
  sourceLang: string,
  targetLang: string,
  container: HTMLElement
) {
  try {
    console.log('=== Definition Feature Debug ===');
    console.log('ai in self:', 'ai' in self);
    console.log('self.ai:', (self as any).ai);
    
    // Check if Prompt API is available
    if (!('ai' in self)) {
      console.log('❌ Prompt API (ai) not available in self');
      return;
    }
    
    const ai = (self as any).ai;
    console.log('ai object:', ai);
    console.log('languageModel in ai:', 'languageModel' in ai);
    
    if (!('languageModel' in ai)) {
      console.log('❌ languageModel not available in ai');
      return;
    }
    
    console.log('✅ Prompt API available, creating session...');
    
    // Create language model session
    const session = await ai.languageModel.create({
      systemPrompt: `You are a helpful language learning assistant. Provide concise, clear definitions.`
    });
    
    console.log('✅ Session created, fetching definitions...');
    
    // Get definition in source language
    const sourceDefPrompt = `Define the word "${originalWord}" in ${sourceLang === 'en' ? 'English' : sourceLang}. Give a brief, one-sentence definition.`;
    console.log('Source prompt:', sourceDefPrompt);
    const sourceDef = await session.prompt(sourceDefPrompt);
    console.log('Source definition:', sourceDef);
    
    // Get definition in target language
    const targetDefPrompt = `Define the word "${translatedWord}" in ${targetLang === 'en' ? 'English' : targetLang}. Give a brief, one-sentence definition.`;
    console.log('Target prompt:', targetDefPrompt);
    const targetDef = await session.prompt(targetDefPrompt);
    console.log('Target definition:', targetDef);
    
    // Append definitions to container
    const defHTML = `
      <div style="
        padding: 14px;
        background: #fef3c7;
        border-radius: 8px;
        border: 1px solid #fbbf24;
        margin-top: 12px;
      ">
        <div style="
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 8px;
        ">
          <span style="font-size: 16px;">📖</span>
          <span style="
            font-size: 12px;
            color: #92400e;
            font-weight: 700;
          ">Definitions</span>
        </div>
        <div style="margin-bottom: 10px;">
          <div style="
            font-size: 11px;
            color: #78350f;
            font-weight: 600;
            margin-bottom: 4px;
          ">${originalWord.toUpperCase()} (${sourceLang.toUpperCase()}):</div>
          <div style="
            font-size: 13px;
            color: #451a03;
            line-height: 1.5;
          ">${escapeHtml(sourceDef)}</div>
        </div>
        <div>
          <div style="
            font-size: 11px;
            color: #78350f;
            font-weight: 600;
            margin-bottom: 4px;
          ">${translatedWord.toUpperCase()} (${targetLang.toUpperCase()}):</div>
          <div style="
            font-size: 13px;
            color: #451a03;
            line-height: 1.5;
          ">${escapeHtml(targetDef)}</div>
        </div>
      </div>
    `;
    
    container.insertAdjacentHTML('beforeend', defHTML);
    console.log('Definitions added successfully');
    
  } catch (error) {
    console.error('Error fetching definitions:', error);
    // Silently fail - definitions are optional
  }
}

// Show Lexi overlay near text selection
function showLexiOverlay(selectedText: string, mouseX: number, mouseY: number) {
  console.log('Lexi overlay injected'); // Debug logging
  
  // Don't create new overlay if translation is in progress
  if (isTranslating) {
    console.log('Translation in progress, not creating new overlay');
    return;
  }
  
  // Remove any existing overlays first
  const existingOverlays = document.querySelectorAll('.lexi-overlay');
  existingOverlays.forEach(old => {
    console.log('Removing old overlay');
    old.remove();
  });
  
  const overlay = document.createElement('div');
  overlay.id = 'lexi-selection-overlay';
  overlay.className = 'lexi-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-label', 'Lexi Translation Assistant');
  
  // Calculate position (offset from mouse to avoid covering selection)
  const offsetX = 10;
  const offsetY = 10;
  let left = mouseX + offsetX;
  let top = mouseY + offsetY;
  
  // Ensure overlay stays within viewport
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const overlayWidth = 320;
  const overlayHeight = 180;
  
  if (left + overlayWidth > viewportWidth) {
    left = mouseX - overlayWidth - offsetX;
  }
  if (top + overlayHeight > viewportHeight) {
    top = mouseY - overlayHeight - offsetY;
  }
  
  // Ensure minimum distance from edges
  left = Math.max(10, Math.min(left, viewportWidth - overlayWidth - 10));
  top = Math.max(10, Math.min(top, viewportHeight - overlayHeight - 10));
  
  overlay.style.cssText = `
    position: fixed;
    left: ${left}px;
    top: ${top}px;
    background: linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%);
    border: 2px solid #0ea5e9;
    border-radius: 12px;
    padding: 16px;
    box-shadow: 0 10px 25px rgba(14, 165, 233, 0.3), 0 4px 10px rgba(0, 0, 0, 0.1);
    z-index: 2147483647;
    min-width: 320px;
    max-width: 420px;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    animation: lexiFadeIn 0.15s ease-out;
    transition: none;
  `;
  
  const displayText = selectedText.length > 100 ? selectedText.substring(0, 100) + '...' : selectedText;
  const escapedDisplayText = escapeHtml(displayText);
  
  overlay.innerHTML = `
    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
      <div style="
        width: 32px;
        height: 32px;
        background: linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%);
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
      ">📚</div>
      <div style="flex: 1;">
        <div style="font-weight: 700; color: #0ea5e9; font-size: 16px;">Lexi</div>
        <div style="font-size: 11px; color: #64748b;">AI Language Assistant</div>
      </div>
      <button 
        id="lexi-overlay-close" 
        aria-label="Close"
        tabindex="0"
        style="
          background: none;
          border: none;
          cursor: pointer;
          font-size: 20px;
          color: #94a3b8;
          padding: 0;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          transition: all 0.2s;
        " 
        onmouseover="this.style.background='#f1f5f9'; this.style.color='#475569';" 
        onmouseout="this.style.background='none'; this.style.color='#94a3b8';"
      >×</button>
    </div>
    
    <div style="
      background: white;
      border-radius: 8px;
      padding: 14px;
      border: 1px solid #e0f2fe;
      margin-bottom: 12px;
    ">
      <div style="
        font-size: 15px; 
        color: #1e293b; 
        font-weight: 700; 
        line-height: 1.5;
        margin-bottom: 4px;
        word-wrap: break-word;
        max-height: 80px;
        overflow-y: auto;
      ">${escapedDisplayText}</div>
      <div style="font-size: 11px; color: #94a3b8; margin-top: 4px;">
        ${selectedText.length} character${selectedText.length !== 1 ? 's' : ''} selected
      </div>
    </div>
    
    <div style="display: flex; gap: 8px;">
      <button 
        id="lexi-translate-btn"
        tabindex="0"
        style="
          flex: 1;
          background: linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%);
          color: white;
          border: none;
          border-radius: 8px;
          padding: 10px 16px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 2px 4px rgba(14, 165, 233, 0.3);
        "
        onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 4px 8px rgba(14, 165, 233, 0.4)';"
        onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 4px rgba(14, 165, 233, 0.3)';"
      >
        🌐 Translate
      </button>
    </div>
    
    <!-- Translation result container -->
    <div id="lexi-translation-result"></div>
  `;
  
  document.body.appendChild(overlay);
  currentOverlay = overlay;
  
  // Wait for DOM to be ready, then attach event listeners
  setTimeout(() => {
    // Query buttons from within the overlay element
    const closeBtn = overlay.querySelector('#lexi-overlay-close') as HTMLButtonElement;
    const translateBtn = overlay.querySelector('#lexi-translate-btn') as HTMLButtonElement;
    
    if (closeBtn) {
      console.log('✅ Close button found');
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        console.log('Close button clicked');
        removeOverlay();
      });
      
      // Keyboard accessibility for close button
      closeBtn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          removeOverlay();
        }
      });
    } else {
      console.error('❌ Close button not found');
    }
    
    if (translateBtn) {
      console.log('✅ Translate button found');
      
      // Translation handler function
      const doTranslation = async () => {
        console.log('🌐 Translation triggered!');
        console.log('Selected text:', selectedText);
        console.log('isTranslating before:', isTranslating);
        try {
          await handleTranslation(selectedText);
          console.log('Translation completed');
        } catch (error) {
          console.error('Error in translate handler:', error);
          // Error will be displayed by handleTranslation function itself
        }
        console.log('isTranslating after:', isTranslating);
      };
      
      // Use click event for translation
      translateBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        e.preventDefault();
        console.log('🌐 Translate button clicked!');
        console.log('Event target:', e.target);
        await doTranslation();
      }, { capture: true });
      
      // Keyboard accessibility for translate button
      translateBtn.addEventListener('keydown', async (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          console.log('🌐 Translate button clicked (keyboard)!');
          console.log('Selected text:', selectedText);
          try {
            await handleTranslation(selectedText);
          } catch (error) {
            console.error('Error in translate keyboard handler:', error);
          }
        }
      });
      
      // Focus the translate button for keyboard accessibility
      translateBtn.focus();
      console.log('✅ Translate button focused');
    } else {
      console.error('❌ Translate button not found');
    }
  }, 100);
  
  // Setup event listeners for closing
  setupOverlayCloseListeners();
}

// Remove current overlay
function removeOverlay() {
  if (currentOverlay) {
    currentOverlay.remove();
    currentOverlay = null;
    removeOverlayCloseListeners();
  }
}

// Event handler references (need to be stored to remove later)
let escapeKeyHandler: ((event: KeyboardEvent) => void) | null = null;
let clickOutsideHandler: ((event: MouseEvent) => void) | null = null;

// Setup listeners to close overlay
function setupOverlayCloseListeners() {
  // Create and store escape key handler
  escapeKeyHandler = (event: KeyboardEvent) => {
    if (event.key === 'Escape' || event.key === 'Esc') {
      event.preventDefault();
      event.stopPropagation();
      removeOverlay();
    }
  };
  
  // Create and store click outside handler
  clickOutsideHandler = (event: MouseEvent) => {
    if (currentOverlay && !currentOverlay.contains(event.target as Node)) {
      removeOverlay();
    }
  };
  
  // Add listeners immediately
  document.addEventListener('keydown', escapeKeyHandler, true); // Use capture phase
  
  // Delay click listener to prevent immediate close
  setTimeout(() => {
    if (clickOutsideHandler) {
      document.addEventListener('click', clickOutsideHandler, true);
    }
  }, 100);
}

// Remove overlay close listeners
function removeOverlayCloseListeners() {
  if (escapeKeyHandler) {
    document.removeEventListener('keydown', escapeKeyHandler, true);
    escapeKeyHandler = null;
  }
  if (clickOutsideHandler) {
    document.removeEventListener('click', clickOutsideHandler, true);
    clickOutsideHandler = null;
  }
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
  @keyframes lexiFadeIn {
    from {
      opacity: 0;
      transform: translateY(-5px) scale(0.98);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
  
  @keyframes lexiSpin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
  
  .lexi-overlay {
    will-change: opacity;
  }
  
  .lexi-overlay * {
    box-sizing: border-box;
  }
`;
document.head.appendChild(style);

// Create floating translation widget (for future use)
function createTranslationWidget(text: string, translation: string) {
  const widget = document.createElement('div');
  widget.id = 'lexi-translation-widget';
  widget.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: white;
    border: 2px solid #0ea5e9;
    border-radius: 8px;
    padding: 16px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    z-index: 10000;
    max-width: 300px;
    font-family: system-ui, -apple-system, sans-serif;
  `;
  
  widget.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
      <strong style="color: #0ea5e9;">📚 Lexi</strong>
      <button id="lexi-close" style="background: none; border: none; cursor: pointer; font-size: 18px;">×</button>
    </div>
    <div style="margin-bottom: 8px;">
      <div style="font-size: 12px; color: #666; margin-bottom: 4px;">Original:</div>
      <div style="font-size: 14px;">${text}</div>
    </div>
    <div>
      <div style="font-size: 12px; color: #666; margin-bottom: 4px;">Translation:</div>
      <div style="font-size: 14px; font-weight: 500;">${translation}</div>
    </div>
  `;
  
  document.body.appendChild(widget);
  
  // Close button handler
  document.getElementById('lexi-close')?.addEventListener('click', () => {
    widget.remove();
  });
  
  // Auto-remove after 10 seconds
  setTimeout(() => {
    widget.remove();
  }, 10000);
}

export {};
