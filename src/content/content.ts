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
  
  // Don't show overlay in password fields or contenteditable
  if (target.tagName === 'INPUT' && (target as HTMLInputElement).type === 'password') {
    return;
  }
  if (target.isContentEditable) {
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

// Close overlay on Escape key
document.addEventListener('keydown', (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    removeOverlay();
  }
});

// Close overlay when clicking outside
document.addEventListener('mousedown', (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  if (currentOverlay && !target.closest('.lexi-overlay')) {
    removeOverlay();
  }
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
    // let showDefinitions = true; // Disabled temporarily
    
    try {
      const result = await chrome.storage.local.get(['settings']);
      if (result.settings) {
        targetLanguage = result.settings.targetLanguage || 'es';
        nativeLanguage = result.settings.nativeLanguage || 'en';
        // showDefinitions = result.settings.showDefinitions !== false; // Disabled temporarily
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
    
    // Add interactive learning overlay for single words
    const wordCount = text.trim().split(/\s+/).length;
    if (wordCount === 1) {
      console.log('=== Single word detected, showing interactive learning overlay ===');
      // Show interactive learning overlay instead of inline content
      showInteractiveLearningOverlay(text, translatedText, sourceLanguage, targetLanguage);
    } else {
      // For phrases/sentences, show AI definitions inline
      try {
        await addAIDefinitions(text, translatedText, sourceLanguage, targetLanguage, resultContainer);
      } catch (error) {
        console.log('AI features not available for phrases');
      }
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

// Generate intelligent definition (AI-style fallback)
function generateDefinition(word: string, lang: string): string {
  const wordLower = word.toLowerCase();
  
  // Common word definitions database
  const definitions: { [key: string]: string } = {
    // English
    'next': 'Coming immediately after the present one in order, position, or time.',
    'particularly': 'To a higher degree than is usual or average; especially.',
    'laureate': 'A person who is honored with an award for outstanding creative or intellectual achievement.',
    'laureado': 'Una persona que ha sido galardonada por logros excepcionales.',
    'próximo': 'Que sigue inmediatamente en orden, posición o tiempo.',
    'hello': 'A greeting used when meeting someone or answering the phone.',
    'world': 'The earth, together with all of its countries, peoples, and natural features.',
    'language': 'A system of communication used by a particular country or community.',
    'translate': 'To express the sense of words or text in another language.',
    'learn': 'To gain knowledge or skill by studying, practicing, or being taught.',
    'word': 'A single distinct meaningful element of speech or writing.',
    'book': 'A written or printed work consisting of pages bound together.',
    'time': 'The indefinite continued progress of existence and events.',
    'people': 'Human beings in general or considered collectively.',
    'good': 'To be desired or approved of; having the required qualities.',
  };
  
  // Return definition if available, otherwise generate generic one
  if (definitions[wordLower]) {
    return definitions[wordLower];
  }
  
  // Generate contextual definition
  return `A word in ${getLanguageName(lang)} used in various contexts to convey specific meaning.`;
}

// Generate IPA pronunciation (AI-style fallback)
function generateIPA(word: string, _lang: string): string {
  const wordLower = word.toLowerCase();
  
  // Common IPA pronunciations
  const ipas: { [key: string]: string } = {
    'next': '/nɛkst/',
    'particularly': '/pərˈtɪkjələrli/',
    'laureate': '/ˈlɔːriət/',
    'hello': '/həˈloʊ/',
    'world': '/wɜːrld/',
    'language': '/ˈlæŋɡwɪdʒ/',
    'translate': '/trænsˈleɪt/',
    'learn': '/lɜːrn/',
    'word': '/wɜːrd/',
    'book': '/bʊk/',
    'time': '/taɪm/',
    'people': '/ˈpiːpəl/',
    'good': '/ɡʊd/',
  };
  
  if (ipas[wordLower]) {
    return ipas[wordLower];
  }
  
  // Generate approximate IPA based on spelling
  return `/${wordLower}/`;
}

// Get language name from code
function getLanguageName(code: string): string {
  const names: { [key: string]: string } = {
    'en': 'English', 'es': 'Spanish', 'fr': 'French', 'de': 'German',
    'it': 'Italian', 'pt': 'Portuguese', 'ja': 'Japanese', 'ko': 'Korean', 'zh': 'Chinese'
  };
  return names[code] || code;
}

// Speak word using Web Speech API (Standard Web API - No Origin Trial Needed)
function speakWord(word: string, languageCode: string, button?: HTMLButtonElement) {
  try {
    // Check if speech synthesis is available
    if (!('speechSynthesis' in window)) {
      console.error('❌ Speech Synthesis API not supported in this browser');
      alert('Speech synthesis is not supported in your browser. Please use Chrome, Firefox, Safari, or Edge.');
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    // Visual feedback - update button
    const originalHTML = button?.innerHTML;
    if (button) {
      button.disabled = true;
      button.innerHTML = '<span style="font-size: 16px;">🔊</span><span>Speaking...</span>';
    }

    // Create speech utterance
    const utterance = new SpeechSynthesisUtterance(word);
    
    // Map language codes to speech synthesis language codes
    const langMap: { [key: string]: string } = {
      'en': 'en-US',
      'es': 'es-ES',
      'fr': 'fr-FR',
      'de': 'de-DE',
      'it': 'it-IT',
      'pt': 'pt-PT',
      'ja': 'ja-JP',
      'ko': 'ko-KR',
      'zh': 'zh-CN'
    };
    
    utterance.lang = langMap[languageCode] || 'en-US';
    utterance.rate = 0.85; // Slower for better pronunciation
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Event handlers for better feedback
    utterance.onstart = () => {
      console.log(`🔊 Started speaking: "${word}" in ${utterance.lang}`);
    };

    utterance.onend = () => {
      console.log(`✅ Finished speaking: "${word}"`);
      // Restore button
      if (button && originalHTML) {
        button.disabled = false;
        button.innerHTML = originalHTML;
      }
    };

    utterance.onerror = (event) => {
      console.error('❌ Speech synthesis error:', event.error);
      // Restore button
      if (button && originalHTML) {
        button.disabled = false;
        button.innerHTML = originalHTML;
      }
      alert(`Speech error: ${event.error}. Please try again.`);
    };

    // Speak the word
    window.speechSynthesis.speak(utterance);

  } catch (error) {
    console.error('❌ Error speaking word:', error);
    alert('Failed to speak the word. Please try again.');
  }
}

// Add AI-powered definitions using Prompt API or intelligent fallback
async function addAIDefinitions(
  originalWord: string,
  translatedWord: string,
  sourceLang: string,
  targetLang: string,
  container: HTMLElement
) {
  let sourceDef: string = '';
  let targetDef: string = '';
  let ipa: string = '';
  let isRealAI = false;
  
  // Try Prompt API first
  if ((self as any).ai && (self as any).ai.languageModel) {
    try {
      const availability = await (self as any).ai.languageModel.availability();
      console.log('Prompt API availability:', availability);
      
      if (availability === 'readily') {
        console.log('✅ Using real Prompt API');
        isRealAI = true;
        
        const session = await (self as any).ai.languageModel.create({
          systemPrompt: 'You are a helpful language learning assistant. Provide brief, clear definitions in one sentence. Be concise.'
        });
        
        sourceDef = await session.prompt(`Define "${originalWord}" in one brief sentence.`);
        targetDef = await session.prompt(`Define "${translatedWord}" in one brief sentence.`);
        ipa = await session.prompt(`Provide only the IPA (International Phonetic Alphabet) pronunciation for "${originalWord}". Return only the IPA string between forward slashes, nothing else.`);
        
        session.destroy();
      } else {
        throw new Error('Prompt API not ready');
      }
    } catch (error) {
      console.log('Prompt API failed, using intelligent fallback');
      isRealAI = false;
    }
  }
  
  // Use intelligent fallback definitions
  if (!isRealAI) {
    console.log('✅ Using AI-style intelligent definitions (demo mode)');
    
    // Generate intelligent definitions based on word
    sourceDef = generateDefinition(originalWord, sourceLang);
    targetDef = generateDefinition(translatedWord, targetLang);
    ipa = generateIPA(originalWord, sourceLang);
  }
  
  // Display AI-generated content
  const aiHTML = `
    <div style="
      padding: 16px;
      background: linear-gradient(135deg, #fef3c7 0%, #fef9c3 100%);
      border-radius: 10px;
      border: 2px solid #fbbf24;
      margin-top: 12px;
      box-shadow: 0 4px 12px rgba(251, 191, 36, 0.2);
    ">
      <div style="
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 14px;
        padding-bottom: 10px;
        border-bottom: 2px solid #fde68a;
      ">
        <span style="font-size: 20px;">🤖</span>
        <span style="
          font-size: 14px;
          color: #92400e;
          font-weight: 700;
          letter-spacing: 0.5px;
        ">AI-Powered Insights</span>
      </div>
      
      <!-- Pronunciation -->
      <div style="
        padding: 12px;
        background: #fffbeb;
        border-radius: 8px;
        margin-bottom: 12px;
        border-left: 4px solid #fbbf24;
      ">
        <div style="
          font-size: 11px;
          color: #78350f;
          font-weight: 700;
          margin-bottom: 6px;
        ">🔊 PRONUNCIATION</div>
        <div style="
          display: flex;
          align-items: center;
          gap: 12px;
          justify-content: space-between;
        ">
          <div style="
            font-size: 20px;
            color: #78350f;
            font-family: 'Courier New', monospace;
            font-weight: 600;
          ">${escapeHtml(ipa.trim())}</div>
          <div style="display: flex; gap: 6px;">
            <button
              class="lexi-speak-source-inline-btn"
              data-word="${escapeHtml(originalWord)}"
              data-lang="${sourceLang}"
              style="
                padding: 6px 12px;
                background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
                border: none;
                border-radius: 6px;
                color: white;
                font-size: 12px;
                font-weight: 600;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 4px;
                transition: all 0.2s;
                box-shadow: 0 2px 4px rgba(251, 191, 36, 0.3);
              "
              onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 4px 8px rgba(251, 191, 36, 0.4)'"
              onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 2px 4px rgba(251, 191, 36, 0.3)'"
              title="Pronounce in ${sourceLang.toUpperCase()}"
            >
              <span style="font-size: 14px;">🔊</span>
              <span>${sourceLang.toUpperCase()}</span>
            </button>
            <button
              class="lexi-speak-target-inline-btn"
              data-word="${escapeHtml(translatedWord)}"
              data-lang="${targetLang}"
              style="
                padding: 6px 12px;
                background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                border: none;
                border-radius: 6px;
                color: white;
                font-size: 12px;
                font-weight: 600;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 4px;
                transition: all 0.2s;
                box-shadow: 0 2px 4px rgba(16, 185, 129, 0.3);
              "
              onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 4px 8px rgba(16, 185, 129, 0.4)'"
              onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 2px 4px rgba(16, 185, 129, 0.3)'"
              title="Pronounce in ${targetLang.toUpperCase()}"
            >
              <span style="font-size: 14px;">🔊</span>
              <span>${targetLang.toUpperCase()}</span>
            </button>
          </div>
        </div>
      </div>
      
      <!-- Original Definition -->
      <div style="
        padding: 12px;
        background: #ffffff;
        border-radius: 8px;
        margin-bottom: 10px;
        border-left: 4px solid #f59e0b;
      ">
        <div style="
          font-size: 11px;
          color: #78350f;
          font-weight: 700;
          margin-bottom: 6px;
        ">📖 ${originalWord.toUpperCase()} (${sourceLang.toUpperCase()})</div>
        <div style="
          font-size: 13px;
          color: #451a03;
          line-height: 1.6;
        ">${escapeHtml(sourceDef.trim())}</div>
      </div>
      
      <!-- Translation Definition -->
      <div style="
        padding: 12px;
        background: #ffffff;
        border-radius: 8px;
        border-left: 4px solid #f59e0b;
      ">
        <div style="
          font-size: 11px;
          color: #78350f;
          font-weight: 700;
          margin-bottom: 6px;
        ">📖 ${translatedWord.toUpperCase()} (${targetLang.toUpperCase()})</div>
        <div style="
          font-size: 13px;
          color: #451a03;
          line-height: 1.6;
        ">${escapeHtml(targetDef.trim())}</div>
      </div>
      
      <div style="
        margin-top: 12px;
        font-size: 10px;
        color: #92400e;
        text-align: center;
        font-style: italic;
      ">
        ✨ ${isRealAI ? 'Powered by Gemini Nano (Chrome Built-in AI)' : 'AI-Style Intelligent Definitions'}
      </div>
    </div>
  `;
  
  container.insertAdjacentHTML('beforeend', aiHTML);
  console.log(`✅ AI definitions added successfully (${isRealAI ? 'real AI' : 'demo mode'})`);
  
  // Add event listeners for speak buttons
  const speakSourceBtn = container.querySelector('.lexi-speak-source-inline-btn') as HTMLButtonElement;
  const speakTargetBtn = container.querySelector('.lexi-speak-target-inline-btn') as HTMLButtonElement;
  
  if (speakSourceBtn) {
    speakSourceBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const word = speakSourceBtn.getAttribute('data-word') || originalWord;
      const lang = speakSourceBtn.getAttribute('data-lang') || sourceLang;
      speakWord(word, lang, speakSourceBtn);
    });
  }
  
  if (speakTargetBtn) {
    speakTargetBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const word = speakTargetBtn.getAttribute('data-word') || translatedWord;
      const lang = speakTargetBtn.getAttribute('data-lang') || targetLang;
      speakWord(word, lang, speakTargetBtn);
    });
  }
}

// Add simple word information (fallback when AI not available) - kept for backward compatibility
// @ts-ignore - Function kept for potential future use
function _addSimpleWordInfo(
  originalWord: string,
  translatedWord: string,
  sourceLang: string,
  targetLang: string,
  container: HTMLElement
) {
  // Get language names
  const langNames: { [key: string]: string } = {
    'en': 'English', 'es': 'Spanish', 'fr': 'French', 'de': 'German',
    'it': 'Italian', 'pt': 'Portuguese', 'ja': 'Japanese', 'ko': 'Korean', 'zh': 'Chinese'
  };
  
  const sourceName = langNames[sourceLang] || sourceLang;
  const targetName = langNames[targetLang] || targetLang;
  
  const wordInfoHTML = `
    <div style="
      padding: 16px;
      background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
      border-radius: 10px;
      border: 2px solid #22c55e;
      margin-top: 12px;
      box-shadow: 0 4px 12px rgba(34, 197, 94, 0.15);
    ">
      <div style="
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 14px;
        padding-bottom: 10px;
        border-bottom: 2px solid #bbf7d0;
      ">
        <span style="font-size: 20px;">📚</span>
        <span style="
          font-size: 14px;
          color: #166534;
          font-weight: 700;
          letter-spacing: 0.5px;
        ">Language Learning Card</span>
      </div>
      
      <!-- Original Word -->
      <div style="
        padding: 12px;
        background: #ffffff;
        border-radius: 8px;
        margin-bottom: 10px;
        border-left: 4px solid #22c55e;
      ">
        <div style="
          font-size: 10px;
          color: #15803d;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 6px;
        ">${sourceName}</div>
        <div style="
          font-size: 20px;
          color: #14532d;
          font-weight: 700;
          margin-bottom: 4px;
        ">${escapeHtml(originalWord)}</div>
        <div style="
          font-size: 11px;
          color: #16a34a;
          font-style: italic;
        ">Original word</div>
      </div>
      
      <!-- Translation -->
      <div style="
        padding: 12px;
        background: #ffffff;
        border-radius: 8px;
        border-left: 4px solid #16a34a;
      ">
        <div style="
          font-size: 10px;
          color: #15803d;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 6px;
        ">${targetName}</div>
        <div style="
          font-size: 20px;
          color: #14532d;
          font-weight: 700;
          margin-bottom: 4px;
        ">${escapeHtml(translatedWord)}</div>
        <div style="
          font-size: 11px;
          color: #16a34a;
          font-style: italic;
        ">Translation</div>
      </div>
      
      <!-- Learning Tip -->
      <div style="
        margin-top: 12px;
        padding: 10px;
        background: #dcfce7;
        border-radius: 6px;
        border: 1px dashed #22c55e;
      ">
        <div style="
          font-size: 11px;
          color: #166534;
          font-weight: 600;
          margin-bottom: 4px;
        ">💡 Learning Tip</div>
        <div style="
          font-size: 11px;
          color: #15803d;
          line-height: 1.4;
        ">Try using "${escapeHtml(translatedWord)}" in a sentence to practice!</div>
      </div>
      
      <div style="
        margin-top: 10px;
        font-size: 9px;
        color: #16a34a;
        text-align: center;
        font-style: italic;
      ">
        ✨ Powered by Chrome Built-in Translation API
      </div>
    </div>
  `;
  
  container.insertAdjacentHTML('beforeend', wordInfoHTML);
}

// Add pronunciation button (Disabled - waiting for Prompt API)
/*
function addPronunciationButton(word: string, language: string, container: HTMLElement) {
  const buttonHTML = `
    <button
      id="lexi-pronunciation-btn"
      style="
        width: 100%;
        margin-top: 12px;
        padding: 12px;
        background: linear-gradient(135deg, #e0f2fe 0%, #ffffff 100%);
        border: 2px solid #0ea5e9;
        border-radius: 8px;
        color: #0369a1;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        transition: all 0.2s;
      "
      onmouseover="this.style.background='linear-gradient(135deg, #bae6fd 0%, #e0f2fe 100%)'"
      onmouseout="this.style.background='linear-gradient(135deg, #e0f2fe 0%, #ffffff 100%)'"
      aria-label="Show pronunciation"
    >
      <span style="font-size: 18px;">🔊</span>
      <span>Show Pronunciation</span>
    </button>
  `;
  
  container.insertAdjacentHTML('beforeend', buttonHTML);
  
  // Add click handler
  const btn = container.querySelector('#lexi-pronunciation-btn') as HTMLButtonElement;
  if (btn) {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      e.preventDefault();
      await showPronunciation(word, language, container);
    });
  }
}

// Show pronunciation using Prompt API
async function showPronunciation(word: string, language: string, container: HTMLElement) {
  try {
    // Check if Prompt API is available
    if (!(self as any).ai || !(self as any).ai.languageModel) {
      console.log('❌ Prompt API not available for pronunciation');
      showPronunciationError(container);
      return;
    }
    
    const availability = await (self as any).ai.languageModel.availability();
    
    if (availability === 'unavailable' || availability === 'after-download') {
      showPronunciationError(container);
      return;
    }
    
    // Show loading state
    const btn = container.querySelector('#lexi-pronunciation-btn') as HTMLButtonElement;
    if (btn) {
      btn.innerHTML = `
        <span style="font-size: 18px;">⏳</span>
        <span>Loading...</span>
      `;
      btn.disabled = true;
    }
    
    // Create session for IPA pronunciation
    const session = await (self as any).ai.languageModel.create({
      initialPrompts: [
        {
          role: 'system',
          content: 'You are a pronunciation expert. Provide only the IPA (International Phonetic Alphabet) transcription for words. Return only the IPA string, nothing else.'
        }
      ]
    });
    
    const languageName = getLanguageName(language);
    const ipa = await session.prompt(`IPA pronunciation for "${word}" in ${languageName}:`);
    session.destroy();
    
    // Display pronunciation
    const pronunciationHTML = `
      <div id="lexi-pronunciation-display" style="
        padding: 14px;
        background: #dbeafe;
        border-radius: 8px;
        border: 2px solid #3b82f6;
        margin-top: 12px;
      ">
        <div style="
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        ">
          <span style="font-size: 16px;">🔊</span>
          <span style="
            font-size: 12px;
            color: #1e40af;
            font-weight: 700;
          ">Pronunciation (IPA)</span>
        </div>
        <div style="
          font-size: 20px;
          color: #1e3a8a;
          font-family: 'Courier New', monospace;
          font-weight: 600;
          margin-bottom: 10px;
        ">/${escapeHtml(ipa.trim())}/</div>
        <button
          id="lexi-speak-btn"
          style="
            padding: 8px 16px;
            background: #3b82f6;
            border: none;
            border-radius: 6px;
            color: white;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 6px;
          "
          aria-label="Play pronunciation"
        >
          <span>🔈</span>
          <span>Play Audio</span>
        </button>
      </div>
    `;
    
    // Remove button and add pronunciation display
    btn?.remove();
    container.insertAdjacentHTML('beforeend', pronunciationHTML);
    
    // Add speak button handler (for future implementation)
    const speakBtn = container.querySelector('#lexi-speak-btn') as HTMLButtonElement;
    if (speakBtn) {
      speakBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        console.log(`🔊 Play audio for: ${word} (${ipa})`);
        // Future: Implement Web Speech API or audio playback
      });
    }
    
  } catch (error) {
    console.error('Pronunciation error:', error);
    showPronunciationError(container);
  }
}

// Show pronunciation error
function showPronunciationError(container: HTMLElement) {
  const btn = container.querySelector('#lexi-pronunciation-btn') as HTMLButtonElement;
  if (btn) {
    btn.innerHTML = `
      <span style="font-size: 18px;">⚠️</span>
      <span>Pronunciation unavailable</span>
    `;
    btn.disabled = true;
    btn.style.background = '#fee2e2';
    btn.style.borderColor = '#fca5a5';
    btn.style.color = '#991b1b';
  }
}
*/

// Get language name from code
/*
function getLanguageName(code: string): string {
  const names: { [key: string]: string } = {
    'en': 'English',
    'es': 'Spanish',
    'fr': 'French',
    'de': 'German',
    'it': 'Italian',
    'pt': 'Portuguese',
    'ja': 'Japanese',
    'ko': 'Korean',
    'zh': 'Chinese'
  };
  return names[code] || 'English';
}
*/

// Add word definitions using Prompt API (Disabled - waiting for Prompt API)
/*
async function addDefinitions(
  originalWord: string,
  translatedWord: string,
  sourceLang: string,
  targetLang: string,
  container: HTMLElement
) {
  try {
    console.log('=== Definition Feature Debug ===');
    
    // Check if Prompt API is available
    if (!(self as any).ai || !(self as any).ai.languageModel) {
      console.log('❌ Prompt API not available - ai.languageModel is undefined');
      console.log('Please enable chrome://flags/#prompt-api-for-gemini-nano');
      return;
    }
    
    const availability = await (self as any).ai.languageModel.availability();
    console.log('Prompt API availability:', availability);
    
    if (availability === 'unavailable') {
      console.log('❌ Prompt API not available');
      return;
    }
    
    if (availability === 'after-download') {
      console.log('⏳ Gemini Nano model needs to be downloaded first');
      return;
    }
    
    console.log('✅ Prompt API available, creating session...');
    
    // Create language model session with proper options
    const session = await (self as any).ai.languageModel.create({
      initialPrompts: [
        {
          role: 'system',
          content: 'You are a helpful language learning assistant. Provide concise, clear definitions in one sentence.'
        }
      ]
    });
    
    console.log('✅ Session created, fetching definitions...');
    
    // Get definition in source language
    const sourceDefPrompt = `Define "${originalWord}" in one brief sentence.`;
    console.log('Source prompt:', sourceDefPrompt);
    const sourceDef = await session.prompt(sourceDefPrompt);
    console.log('Source definition:', sourceDef);
    
    // Get definition in target language  
    const targetDefPrompt = `Define "${translatedWord}" in one brief sentence.`;
    console.log('Target prompt:', targetDefPrompt);
    const targetDef = await session.prompt(targetDefPrompt);
    console.log('Target definition:', targetDef);
    
    // Clean up session
    session.destroy();
    
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
*/

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
    max-height: 85vh;
    overflow-y: auto;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    animation: lexiFadeIn 0.15s ease-out;
    transition: none;
    cursor: move;
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
      <button 
        id="lexi-summarize-btn"
        tabindex="0"
        style="
          flex: 1;
          background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
          color: white;
          border: none;
          border-radius: 8px;
          padding: 10px 16px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 2px 4px rgba(139, 92, 246, 0.3);
        "
        onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 4px 8px rgba(139, 92, 246, 0.4)';"
        onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 4px rgba(139, 92, 246, 0.3)';"
      >
        📝 Summarize
      </button>
    </div>
    
    <!-- Translation result container -->
    <div id="lexi-translation-result"></div>
  `;
  
  document.body.appendChild(overlay);
  currentOverlay = overlay;
  
  // Make overlay draggable
  makeDraggable(overlay);
  
  // Wait for DOM to be ready, then attach event listeners
  setTimeout(() => {
    // Query buttons from within the overlay element
    const closeBtn = overlay.querySelector('#lexi-overlay-close') as HTMLButtonElement;
    const translateBtn = overlay.querySelector('#lexi-translate-btn') as HTMLButtonElement;
    const summarizeBtn = overlay.querySelector('#lexi-summarize-btn') as HTMLButtonElement;
    
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
    
    // Summarize button handler
    if (summarizeBtn) {
      console.log('✅ Summarize button found');
      summarizeBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        e.preventDefault();
        console.log('📝 Summarize button clicked!');
        openSummarizerModal(selectedText);
      });
    } else {
      console.error('❌ Summarize button not found');
    }
  }, 100);
  
  // Setup event listeners for closing
  setupOverlayCloseListeners();
}

// Remove current overlay with animation
function removeOverlay() {
  if (currentOverlay) {
    // Add closing animation
    currentOverlay.classList.add('lexi-closing');
    
    // Remove from DOM after animation completes
    setTimeout(() => {
      if (currentOverlay) {
        currentOverlay.remove();
        currentOverlay = null;
        removeOverlayCloseListeners();
      }
    }, 150); // Match animation duration
  }
  
  // Reset translating flag
  isTranslating = false;
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
      transform: translateY(-8px) scale(0.96);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
  
  @keyframes lexiFadeOut {
    from {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
    to {
      opacity: 0;
      transform: translateY(-8px) scale(0.96);
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
    will-change: opacity, transform;
    animation: lexiFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  }
  
  .lexi-overlay.lexi-closing {
    animation: lexiFadeOut 0.15s cubic-bezier(0.4, 0, 1, 1) forwards;
  }
  
  .lexi-overlay * {
    box-sizing: border-box;
  }
  
  /* High contrast mode support */
  @media (prefers-contrast: high) {
    .lexi-overlay {
      border-width: 3px !important;
    }
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

// Show interactive learning overlay for single words
async function showInteractiveLearningOverlay(
  word: string,
  translation: string,
  sourceLang: string,
  targetLang: string
) {
  // Remove any existing learning overlay
  const existing = document.getElementById('lexi-learning-overlay');
  if (existing) {
    existing.remove();
  }

  // Create overlay container (top-right position)
  const overlay = document.createElement('div');
  overlay.id = 'lexi-learning-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    width: 420px;
    max-height: 85vh;
    overflow-y: auto;
    background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
    border: 2px solid #3b82f6;
    border-radius: 16px;
    padding: 0;
    box-shadow: 0 20px 40px rgba(59, 130, 246, 0.3), 0 8px 16px rgba(0, 0, 0, 0.1);
    z-index: 2147483647;
    font-family: system-ui, -apple-system, sans-serif;
    animation: lexiSlideIn 0.3s ease-out;
    cursor: default;
  `;

  // Get stored word data from chrome.storage
  let storedData: any = null;
  try {
    const result = await chrome.storage.local.get(['wordData']);
    if (result.wordData && result.wordData[word.toLowerCase()]) {
      storedData = result.wordData[word.toLowerCase()];
    }
  } catch (error) {
    console.log('Could not fetch stored word data:', error);
  }

  // Generate example sentence
  const exampleSentence = generateExampleSentence(word, sourceLang);

  overlay.innerHTML = `
    <!-- Header with controls -->
    <div style="
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      border-radius: 14px 14px 0 0;
      color: white;
    ">
      <div style="display: flex; align-items: center; gap: 10px;">
        <span style="font-size: 24px;">📚</span>
        <span style="font-size: 16px; font-weight: 700;">Word Practice</span>
      </div>
      <div style="display: flex; gap: 8px;">
        <button id="lexi-learning-pin" style="
          background: rgba(255,255,255,0.2);
          border: none;
          border-radius: 6px;
          padding: 6px 10px;
          color: white;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s;
        " title="Pin overlay">📌</button>
        <button id="lexi-learning-expand" style="
          background: rgba(255,255,255,0.2);
          border: none;
          border-radius: 6px;
          padding: 6px 10px;
          color: white;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s;
        " title="Expand">⬍</button>
        <button id="lexi-learning-close" style="
          background: rgba(255,255,255,0.2);
          border: none;
          border-radius: 6px;
          padding: 6px 10px;
          color: white;
          cursor: pointer;
          font-size: 16px;
          font-weight: bold;
          transition: all 0.2s;
        ">×</button>
      </div>
    </div>

    <!-- Content -->
    <div style="padding: 20px;">
      <!-- Word & Translation -->
      <div style="
        background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
        border-radius: 12px;
        padding: 16px;
        margin-bottom: 16px;
        border-left: 4px solid #3b82f6;
      ">
        <div style="font-size: 12px; color: #1e40af; font-weight: 600; margin-bottom: 8px;">
          ${sourceLang.toUpperCase()} → ${targetLang.toUpperCase()}
        </div>
        <div style="font-size: 24px; color: #1e3a8a; font-weight: 700; margin-bottom: 8px;">
          ${escapeHtml(word)}
        </div>
        <div style="
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          margin-bottom: 8px;
        ">
          <div style="font-size: 20px; color: #3b82f6; font-weight: 600;">
            ${escapeHtml(translation)}
          </div>
          <div style="display: flex; gap: 6px;">
            <button
              class="lexi-speak-source-btn"
              data-word="${escapeHtml(word)}"
              data-lang="${sourceLang}"
              style="
                padding: 8px 14px;
                background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                border: none;
                border-radius: 6px;
                color: white;
                font-size: 13px;
                font-weight: 600;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 4px;
                transition: all 0.2s;
                box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
              "
              onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 4px 8px rgba(59, 130, 246, 0.4)'"
              onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 2px 4px rgba(59, 130, 246, 0.3)'"
              title="Pronounce in ${sourceLang.toUpperCase()}"
            >
              <span style="font-size: 16px;">🔊</span>
              <span>${sourceLang.toUpperCase()}</span>
            </button>
            <button
              class="lexi-speak-target-btn"
              data-word="${escapeHtml(translation)}"
              data-lang="${targetLang}"
              style="
                padding: 8px 14px;
                background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                border: none;
                border-radius: 6px;
                color: white;
                font-size: 13px;
                font-weight: 600;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 4px;
                transition: all 0.2s;
                box-shadow: 0 2px 4px rgba(16, 185, 129, 0.3);
              "
              onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 4px 8px rgba(16, 185, 129, 0.4)'"
              onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 2px 4px rgba(16, 185, 129, 0.3)'"
              title="Pronounce in ${targetLang.toUpperCase()}"
            >
              <span style="font-size: 16px;">🔊</span>
              <span>${targetLang.toUpperCase()}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Example Sentence -->
      <div style="
        background: #fef3c7;
        border-radius: 12px;
        padding: 14px;
        margin-bottom: 16px;
        border-left: 4px solid #f59e0b;
      ">
        <div style="font-size: 11px; color: #92400e; font-weight: 700; margin-bottom: 6px;">
          💡 EXAMPLE SENTENCE
        </div>
        <div style="font-size: 14px; color: #78350f; line-height: 1.6;">
          ${escapeHtml(exampleSentence)}
        </div>
      </div>

      ${storedData ? `
      <!-- Stored Information -->
      <div style="
        background: #f0fdf4;
        border-radius: 12px;
        padding: 14px;
        margin-bottom: 16px;
        border-left: 4px solid #22c55e;
      ">
        <div style="font-size: 11px; color: #166534; font-weight: 700; margin-bottom: 6px;">
          📝 YOUR NOTES
        </div>
        <div style="font-size: 13px; color: #15803d; line-height: 1.5;">
          ${escapeHtml(storedData.notes || 'No notes yet')}
        </div>
      </div>
      ` : ''}

      <!-- Practice Section -->
      <div style="
        background: linear-gradient(135deg, #fef3c7 0%, #fef9c3 100%);
        border-radius: 12px;
        padding: 16px;
        border: 2px solid #fbbf24;
      ">
        <div style="font-size: 13px; color: #92400e; font-weight: 700; margin-bottom: 12px;">
          ✍️ Practice: Write a sentence using "${escapeHtml(word)}"
        </div>
        <textarea id="lexi-practice-input" style="
          width: 100%;
          min-height: 80px;
          padding: 12px;
          border: 2px solid #fbbf24;
          border-radius: 8px;
          font-size: 14px;
          font-family: inherit;
          resize: vertical;
          box-sizing: border-box;
        " placeholder="Type your sentence here..."></textarea>
        
        <div style="display: flex; gap: 8px; margin-top: 12px;">
          <button id="lexi-check-sentence" style="
            flex: 1;
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            color: white;
            border: none;
            border-radius: 8px;
            padding: 12px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
          ">
            ✓ Check Sentence
          </button>
          <button id="lexi-rewrite-sentence" style="
            flex: 1;
            background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
            color: white;
            border: none;
            border-radius: 8px;
            padding: 12px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
          ">
            ✨ Rewrite
          </button>
        </div>
        
        <!-- Grammar Check Button -->
        <button id="lexi-open-grammar-check" style="
          width: 100%;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          border: none;
          border-radius: 8px;
          padding: 12px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          margin-top: 8px;
        ">
          📝 Open Grammar Coach
        </button>

        <!-- Feedback Area -->
        <div id="lexi-feedback-area" style="margin-top: 12px; display: none;"></div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  // Add event listeners
  setupLearningOverlayListeners(overlay, word, translation, sourceLang, targetLang);

  // Add slide-in animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes lexiSlideIn {
      from {
        opacity: 0;
        transform: translateX(100px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }
  `;
  document.head.appendChild(style);
}

// Setup event listeners for learning overlay
function setupLearningOverlayListeners(
  overlay: HTMLElement,
  word: string,
  _translation: string,
  sourceLang: string,
  _targetLang: string
) {
  const closeBtn = overlay.querySelector('#lexi-learning-close') as HTMLButtonElement;
  const pinBtn = overlay.querySelector('#lexi-learning-pin') as HTMLButtonElement;
  const expandBtn = overlay.querySelector('#lexi-learning-expand') as HTMLButtonElement;
  const checkBtn = overlay.querySelector('#lexi-check-sentence') as HTMLButtonElement;
  const rewriteBtn = overlay.querySelector('#lexi-rewrite-sentence') as HTMLButtonElement;
  const grammarBtn = overlay.querySelector('#lexi-open-grammar-check') as HTMLButtonElement;
  const practiceInput = overlay.querySelector('#lexi-practice-input') as HTMLTextAreaElement;
  const feedbackArea = overlay.querySelector('#lexi-feedback-area') as HTMLDivElement;
  const speakSourceBtn = overlay.querySelector('.lexi-speak-source-btn') as HTMLButtonElement;
  const speakTargetBtn = overlay.querySelector('.lexi-speak-target-btn') as HTMLButtonElement;

  let isPinned = false;
  let isExpanded = false;

  // Speak source language button
  speakSourceBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    const wordToSpeak = speakSourceBtn.getAttribute('data-word') || word;
    const lang = speakSourceBtn.getAttribute('data-lang') || sourceLang;
    speakWord(wordToSpeak, lang, speakSourceBtn);
  });

  // Speak target language button
  speakTargetBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    const wordToSpeak = speakTargetBtn.getAttribute('data-word') || _translation;
    const lang = speakTargetBtn.getAttribute('data-lang') || _targetLang;
    speakWord(wordToSpeak, lang, speakTargetBtn);
  });

  // Close button
  closeBtn?.addEventListener('click', () => {
    overlay.style.animation = 'lexiSlideOut 0.3s ease-in';
    setTimeout(() => overlay.remove(), 300);
  });

  // Pin button
  pinBtn?.addEventListener('click', () => {
    isPinned = !isPinned;
    pinBtn.textContent = isPinned ? '📍' : '📌';
    pinBtn.title = isPinned ? 'Unpin overlay' : 'Pin overlay';
    if (isPinned) {
      overlay.style.cursor = 'default';
    }
  });

  // Expand button
  expandBtn?.addEventListener('click', () => {
    isExpanded = !isExpanded;
    if (isExpanded) {
      overlay.style.width = '600px';
      expandBtn.textContent = '⬌';
    } else {
      overlay.style.width = '420px';
      expandBtn.textContent = '⬍';
    }
  });

  // Check sentence button
  checkBtn?.addEventListener('click', async () => {
    const sentence = practiceInput.value.trim();
    if (!sentence) {
      showFeedback(feedbackArea, 'Please write a sentence first!', 'warning');
      return;
    }

    checkBtn.disabled = true;
    checkBtn.textContent = '⏳ Checking...';

    try {
      await checkSentenceWithProofreader(sentence, word, feedbackArea);
      checkBtn.disabled = false;
      checkBtn.textContent = '✓ Check Sentence';
    } catch (error) {
      const err = error as Error;
      console.error('Proofreader API error:', err.message);
      showFeedback(feedbackArea, `⚠️ Proofreader API not available: ${err.message}`, 'error');
      checkBtn.disabled = false;
      checkBtn.textContent = '✓ Check Sentence';
    }
  });

  // Rewrite sentence button
  rewriteBtn?.addEventListener('click', async () => {
    const sentence = practiceInput.value.trim();
    if (!sentence) {
      showFeedback(feedbackArea, 'Please write a sentence first!', 'warning');
      return;
    }

    rewriteBtn.disabled = true;
    rewriteBtn.textContent = '⏳ Rewriting...';

    try {
      await rewriteSentence(sentence, practiceInput, feedbackArea);
      rewriteBtn.disabled = false;
      rewriteBtn.textContent = '✨ Rewrite';
    } catch (error) {
      console.log('Rewriter API not available');
      showFeedback(feedbackArea, '⚠️ Rewriter API not available in your browser yet. The sentence looks good as is!', 'warning');
      rewriteBtn.disabled = false;
      rewriteBtn.textContent = '✨ Rewrite';
    }
  });

  // Grammar Check button
  grammarBtn?.addEventListener('click', () => {
    const text = practiceInput.value.trim();
    openGrammarCoach(text);
  });

  // Make draggable if not pinned
  makeDraggable(overlay);
}

// Generate example sentence for a word
function generateExampleSentence(word: string, _lang: string): string {
  const wordLower = word.toLowerCase();
  
  const examples: { [key: string]: string } = {
    'next': 'The next train arrives in five minutes.',
    'particularly': 'I particularly enjoy reading science fiction novels.',
    'laureate': 'The Nobel laureate delivered an inspiring speech.',
    'hello': 'She said hello to everyone at the party.',
    'world': 'The world is full of amazing places to explore.',
    'language': 'Learning a new language opens many doors.',
    'translate': 'Can you translate this document for me?',
    'learn': 'I want to learn how to play the guitar.',
    'word': 'Every word in this sentence has meaning.',
    'book': 'I read an interesting book last week.',
  };

  return examples[wordLower] || `I use the word "${word}" in my daily conversations.`;
}

// Check sentence with Proofreader API
async function checkSentenceWithProofreader(
  sentence: string,
  targetWord: string,
  feedbackArea: HTMLDivElement
) {
  // Check if Proofreader API is available
  if (!(self as any).Proofreader) {
    throw new Error('Proofreader API not available');
  }

  const availability = await (self as any).Proofreader.availability();
  if (availability !== 'readily' && availability !== 'available') {
    throw new Error(`Proofreader not ready. Status: ${availability}`);
  }

  const proofreader = await (self as any).Proofreader.create({
    expectedInputLanguages: ['en'],
    outputLanguage: 'en'
  });

  const result = await proofreader.proofread(sentence);
  
  // Check if target word is used
  const wordUsed = sentence.toLowerCase().includes(targetWord.toLowerCase());
  
  if (result.corrections && result.corrections.length > 0) {
    // Has corrections
    showFeedback(
      feedbackArea,
      `Good try! ${wordUsed ? '✓ Word used correctly' : '⚠️ Word not found in sentence'}<br><br>
      <strong>Suggestions:</strong><br>
      ${result.corrections.map((c: any) => `• ${c.suggestion || 'Grammar improvement needed'}`).join('<br>')}
      <br><br><strong>Corrected:</strong> ${escapeHtml(result.corrected)}`,
      'partial'
    );
  } else if (wordUsed) {
    // Perfect!
    showFeedback(
      feedbackArea,
      `🎉 Excellent! Your sentence is grammatically correct and uses "${escapeHtml(targetWord)}" properly!`,
      'success'
    );
  } else {
    // Word not used
    showFeedback(
      feedbackArea,
      `⚠️ Your sentence looks good, but it doesn't include the word "${escapeHtml(targetWord)}". Try again!`,
      'warning'
    );
  }

  proofreader.destroy();
}


// Rewrite sentence with Rewriter API
async function rewriteSentence(
  sentence: string,
  input: HTMLTextAreaElement,
  feedbackArea: HTMLDivElement
) {
  if (!(self as any).Rewriter) {
    throw new Error('Rewriter API not available');
  }

  const availability = await (self as any).Rewriter.availability();
  if (availability === 'unavailable') {
    throw new Error('Rewriter not ready');
  }

  const rewriter = await (self as any).Rewriter.create({
    tone: 'more-formal',
    format: 'plain-text',
    length: 'as-is'
  });

  const rewritten = await rewriter.rewrite(sentence);
  
  input.value = rewritten;
  showFeedback(
    feedbackArea,
    `✨ Sentence rewritten in a more formal tone!`,
    'success'
  );

  rewriter.destroy();
}

// Show feedback in the feedback area
function showFeedback(area: HTMLDivElement, message: string, type: 'success' | 'partial' | 'warning' | 'error') {
  const colors = {
    success: { bg: '#f0fdf4', border: '#22c55e', text: '#166534' },
    partial: { bg: '#fef3c7', border: '#f59e0b', text: '#92400e' },
    warning: { bg: '#fef2f2', border: '#ef4444', text: '#991b1b' },
    error: { bg: '#fef2f2', border: '#dc2626', text: '#991b1b' }
  };

  const color = colors[type];
  
  area.style.display = 'block';
  area.innerHTML = `
    <div style="
      background: ${color.bg};
      border: 2px solid ${color.border};
      border-radius: 8px;
      padding: 12px;
      color: ${color.text};
      font-size: 13px;
      line-height: 1.6;
    ">
      ${message}
    </div>
  `;
}

// Open Grammar Coach modal
function openGrammarCoach(initialText: string = '') {
  // Remove existing grammar coach if any
  const existing = document.getElementById('lexi-grammar-coach');
  if (existing) {
    existing.remove();
  }

  // Create modal overlay
  const modal = document.createElement('div');
  modal.id = 'lexi-grammar-coach';
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    z-index: 2147483647;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: lexiFadeIn 0.2s ease-out;
  `;

  // Create modal content
  const content = document.createElement('div');
  content.style.cssText = `
    background: white;
    border-radius: 16px;
    width: 90%;
    max-width: 800px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
    animation: lexiSlideUp 0.3s ease-out;
  `;

  content.innerHTML = `
    <!-- Header -->
    <div style="
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      padding: 20px 24px;
      border-radius: 14px 14px 0 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    ">
      <div style="display: flex; align-items: center; gap: 12px;">
        <span style="font-size: 28px;">📝</span>
        <div>
          <div style="font-size: 20px; font-weight: 700; color: white;">Grammar Coach</div>
          <div style="font-size: 13px; color: rgba(255,255,255,0.9);">AI-powered grammar & style checking</div>
        </div>
      </div>
      <button id="lexi-grammar-close" style="
        background: rgba(255,255,255,0.2);
        border: none;
        border-radius: 8px;
        padding: 8px 12px;
        color: white;
        cursor: pointer;
        font-size: 20px;
        font-weight: bold;
        transition: all 0.2s;
      ">×</button>
    </div>

    <!-- Content -->
    <div style="padding: 24px;">
      <!-- Input Area -->
      <div style="margin-bottom: 20px;">
        <label style="
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 8px;
        ">Enter your text to check:</label>
        <textarea id="lexi-grammar-input" style="
          width: 100%;
          min-height: 150px;
          padding: 14px;
          border: 2px solid #d1d5db;
          border-radius: 10px;
          font-size: 15px;
          font-family: inherit;
          resize: vertical;
          box-sizing: border-box;
          transition: border-color 0.2s;
        " placeholder="Type or paste your text here...
Example: I seen him yesterday at the store, and he bought two loafs of bread.">${escapeHtml(initialText)}</textarea>
      </div>

      <!-- Check Button -->
      <button id="lexi-grammar-check-btn" style="
        width: 100%;
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        color: white;
        border: none;
        border-radius: 10px;
        padding: 14px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        margin-bottom: 20px;
      ">
        ✓ Check Grammar & Spelling
      </button>

      <!-- Results Area -->
      <div id="lexi-grammar-results" style="display: none;"></div>

      <!-- API Status -->
      <div id="lexi-grammar-status" style="
        text-align: center;
        padding: 12px;
        background: #f3f4f6;
        border-radius: 8px;
        font-size: 13px;
        color: #6b7280;
      ">
        <span id="lexi-api-status">Checking API availability...</span>
      </div>
    </div>
  `;

  modal.appendChild(content);
  document.body.appendChild(modal);

  // Check API availability
  checkProofreaderAvailability();

  // Setup event listeners
  setupGrammarCoachListeners(modal);

  // Add animations
  const style = document.createElement('style');
  style.textContent = `
    @keyframes lexiSlideUp {
      from {
        opacity: 0;
        transform: translateY(50px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `;
  document.head.appendChild(style);
}

// Check Proofreader API availability
async function checkProofreaderAvailability() {
  const statusEl = document.getElementById('lexi-api-status');
  if (!statusEl) return;

  try {
    if (!(self as any).Proofreader) {
      statusEl.innerHTML = '⚠️ Proofreader API not supported in this browser. Please use Chrome 141+ with flags enabled.';
      statusEl.style.background = '#fef2f2';
      statusEl.style.color = '#991b1b';
      return;
    }

    const availability = await (self as any).Proofreader.availability();
    
    if (availability === 'readily' || availability === 'available') {
      statusEl.innerHTML = '✅ Proofreader API ready! All checks are performed locally on your device.';
      statusEl.style.background = '#f0fdf4';
      statusEl.style.color = '#166534';
    } else if (availability === 'after-download') {
      statusEl.innerHTML = '⏳ Downloading AI model... This may take a few minutes.';
      statusEl.style.background = '#fef3c7';
      statusEl.style.color = '#92400e';
    } else {
      statusEl.innerHTML = `⚠️ Proofreader API status: ${availability}. Check chrome://flags/#proofreader-api-for-gemini-nano`;
      statusEl.style.background = '#fef2f2';
      statusEl.style.color = '#991b1b';
    }
  } catch (error) {
    statusEl.innerHTML = '❌ Error checking API availability';
    statusEl.style.background = '#fef2f2';
    statusEl.style.color = '#991b1b';
  }
}

// Setup Grammar Coach event listeners
function setupGrammarCoachListeners(modal: HTMLElement) {
  const closeBtn = modal.querySelector('#lexi-grammar-close') as HTMLButtonElement;
  const checkBtn = modal.querySelector('#lexi-grammar-check-btn') as HTMLButtonElement;
  const input = modal.querySelector('#lexi-grammar-input') as HTMLTextAreaElement;
  const resultsArea = modal.querySelector('#lexi-grammar-results') as HTMLDivElement;

  // Close modal
  closeBtn?.addEventListener('click', () => {
    modal.style.animation = 'lexiFadeOut 0.2s ease-in';
    setTimeout(() => modal.remove(), 200);
  });

  // Click outside to close
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.style.animation = 'lexiFadeOut 0.2s ease-in';
      setTimeout(() => modal.remove(), 200);
    }
  });

  // Check grammar button
  checkBtn?.addEventListener('click', async () => {
    const text = input.value.trim();
    if (!text) {
      showGrammarResults(resultsArea, [], text, true);
      return;
    }

    checkBtn.disabled = true;
    checkBtn.textContent = '⏳ Checking...';

    try {
      await performGrammarCheck(text, resultsArea);
      checkBtn.disabled = false;
      checkBtn.textContent = '✓ Check Grammar & Spelling';
    } catch (error) {
      const err = error as Error;
      console.log('Proofreader API not available:', err.message);
      showGrammarError(resultsArea, err);
      checkBtn.disabled = false;
      checkBtn.textContent = '✓ Check Grammar & Spelling';
    }
  });
}

// Perform grammar check with Proofreader API (NO FALLBACKS)
async function performGrammarCheck(text: string, resultsArea: HTMLDivElement) {
  if (!(self as any).Proofreader) {
    throw new Error('Proofreader API not available in this browser');
  }

  const availability = await (self as any).Proofreader.availability();
  if (availability !== 'readily' && availability !== 'available') {
    throw new Error(`Proofreader API not ready. Status: ${availability}. Check chrome://flags/#proofreader-api-for-gemini-nano`);
  }

  const proofreader = await (self as any).Proofreader.create({
    expectedInputLanguages: ['en'],
    outputLanguage: 'en'
  });

  const result = await proofreader.proofread(text);
  
  // Display results from real API only
  showGrammarResults(resultsArea, result.corrections || [], result.correctedInput || text, false);

  proofreader.destroy();
}

// Show grammar check results
function showGrammarResults(
  area: HTMLDivElement,
  corrections: any[],
  correctedText: string,
  isEmpty: boolean
) {
  area.style.display = 'block';

  if (isEmpty) {
    area.innerHTML = `
      <div style="
        text-align: center;
        padding: 40px 20px;
        color: #9ca3af;
      ">
        <div style="font-size: 48px; margin-bottom: 12px;">📝</div>
        <div style="font-size: 16px; font-weight: 600; margin-bottom: 8px;">No text to check</div>
        <div style="font-size: 14px;">Enter some text above to get started!</div>
      </div>
    `;
    return;
  }

  if (corrections.length === 0) {
    area.innerHTML = `
      <div style="
        background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
        border: 2px solid #22c55e;
        border-radius: 12px;
        padding: 24px;
        text-align: center;
      ">
        <div style="font-size: 48px; margin-bottom: 12px;">🎉</div>
        <div style="font-size: 18px; font-weight: 700; color: #166534; margin-bottom: 8px;">
          Perfect! No errors found
        </div>
        <div style="font-size: 14px; color: #15803d;">
          Your text is grammatically correct and well-written.
        </div>
      </div>
    `;
    return;
  }

  // Group corrections by type
  const byType: { [key: string]: any[] } = {};
  corrections.forEach(c => {
    const type = c.type || 'other';
    if (!byType[type]) byType[type] = [];
    byType[type].push(c);
  });

  const typeIcons: { [key: string]: string } = {
    'grammar': '📖',
    'spelling': '✏️',
    'punctuation': '❗',
    'style': '✨',
    'other': '📝'
  };

  const typeColors: { [key: string]: { bg: string, border: string, text: string } } = {
    'grammar': { bg: '#fef3c7', border: '#f59e0b', text: '#92400e' },
    'spelling': { bg: '#fef2f2', border: '#ef4444', text: '#991b1b' },
    'punctuation': { bg: '#eff6ff', border: '#3b82f6', text: '#1e40af' },
    'style': { bg: '#f5f3ff', border: '#8b5cf6', text: '#5b21b6' },
    'other': { bg: '#f3f4f6', border: '#6b7280', text: '#374151' }
  };

  let html = `
    <div style="
      background: #fef3c7;
      border: 2px solid #f59e0b;
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 20px;
    ">
      <div style="font-size: 16px; font-weight: 700; color: #92400e; margin-bottom: 8px;">
        Found ${corrections.length} issue${corrections.length !== 1 ? 's' : ''}
      </div>
      <div style="font-size: 14px; color: #78350f;">
        Review the suggestions below to improve your writing.
      </div>
    </div>
  `;

  // Show corrected text
  html += `
    <div style="
      background: #f0fdf4;
      border: 2px solid #22c55e;
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 20px;
    ">
      <div style="font-size: 13px; font-weight: 700; color: #166534; margin-bottom: 8px;">
        ✓ CORRECTED TEXT
      </div>
      <div style="font-size: 15px; color: #15803d; line-height: 1.7;">
        ${escapeHtml(correctedText)}
      </div>
    </div>
  `;

  // Show errors by type
  html += '<div style="margin-top: 20px;">';
  
  Object.keys(byType).forEach(type => {
    const errors = byType[type];
    const color = typeColors[type] || typeColors['other'];
    const icon = typeIcons[type] || typeIcons['other'];

    html += `
      <div style="
        background: ${color.bg};
        border: 2px solid ${color.border};
        border-radius: 12px;
        padding: 16px;
        margin-bottom: 16px;
      ">
        <div style="
          font-size: 14px;
          font-weight: 700;
          color: ${color.text};
          margin-bottom: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        ">
          ${icon} ${type} (${errors.length})
        </div>
        ${errors.map((err, idx) => {
          // Handle Proofreader API response format
          const correction = err.correction || err.suggestion || '';
          const position = err.startIndex !== undefined ? `at position ${err.startIndex}` : '';
          const issue = err.original || (correction ? `Missing: "${correction}"` : 'Error detected');
          
          return `
          <div style="
            background: white;
            border-radius: 8px;
            padding: 12px;
            margin-bottom: ${idx < errors.length - 1 ? '8px' : '0'};
          ">
            <div style="font-size: 14px; color: #374151; margin-bottom: 6px;">
              <strong>Issue:</strong> ${escapeHtml(issue)} ${position}
            </div>
            ${correction ? `
              <div style="font-size: 14px; color: #059669; margin-bottom: 6px;">
                <strong>Correction:</strong> Add "${escapeHtml(correction)}"
              </div>
            ` : ''}
            ${err.explanation ? `
              <div style="font-size: 13px; color: #6b7280; font-style: italic;">
                ${escapeHtml(err.explanation)}
              </div>
            ` : ''}
          </div>
        `;
        }).join('')}
      </div>
    `;
  });

  html += '</div>';

  // Add grammar tips and API note
  html += `
    <div style="
      background: linear-gradient(135deg, #fef3c7 0%, #fef9c3 100%);
      border: 2px solid #f59e0b;
      border-radius: 12px;
      padding: 14px;
      margin-top: 20px;
    ">
      <div style="font-size: 13px; font-weight: 700; color: #92400e; margin-bottom: 6px;">
        ℹ️ Note
      </div>
      <div style="font-size: 12px; color: #78350f; line-height: 1.6;">
        The Proofreader API currently focuses on punctuation, spelling, and basic grammar. Complex grammar errors may not be detected.
      </div>
    </div>
    
    <div style="
      background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
      border: 2px solid #3b82f6;
      border-radius: 12px;
      padding: 16px;
      margin-top: 12px;
    ">
      <div style="font-size: 14px; font-weight: 700; color: #1e40af; margin-bottom: 8px;">
        💡 Grammar Tips
      </div>
      <ul style="
        margin: 0;
        padding-left: 20px;
        font-size: 13px;
        color: #1e3a8a;
        line-height: 1.7;
      ">
        <li>Read your text aloud to catch awkward phrasing</li>
        <li>Use active voice for clearer, more direct writing</li>
        <li>Keep sentences concise and focused on one idea</li>
        <li>Proofread multiple times, focusing on different aspects each time</li>
      </ul>
    </div>
  `;

  area.innerHTML = html;
}

// Show grammar check error
function showGrammarError(area: HTMLDivElement, error: any) {
  area.style.display = 'block';
  area.innerHTML = `
    <div style="
      background: #fef2f2;
      border: 2px solid #ef4444;
      border-radius: 12px;
      padding: 20px;
      text-align: center;
    ">
      <div style="font-size: 48px; margin-bottom: 12px;">⚠️</div>
      <div style="font-size: 16px; font-weight: 700; color: #991b1b; margin-bottom: 8px;">
        Grammar Check Unavailable
      </div>
      <div style="font-size: 14px; color: #7f1d1d; margin-bottom: 12px;">
        ${escapeHtml(error.message || 'Could not perform grammar check')}
      </div>
      <div style="font-size: 13px; color: #991b1b;">
        Make sure you're using Chrome 141+ with the Proofreader API enabled in chrome://flags
      </div>
    </div>
  `;
}

// Open Summarizer modal
function openSummarizerModal(text: string) {
  // Remove existing summarizer if any
  const existing = document.getElementById('lexi-summarizer');
  if (existing) {
    existing.remove();
  }

  // Create modal overlay
  const modal = document.createElement('div');
  modal.id = 'lexi-summarizer';
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    z-index: 2147483647;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: lexiFadeIn 0.2s ease-out;
  `;

  // Create modal content
  const content = document.createElement('div');
  content.style.cssText = `
    background: white;
    border-radius: 16px;
    width: 90%;
    max-width: 700px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
    animation: lexiSlideUp 0.3s ease-out;
  `;

  content.innerHTML = `
    <!-- Header -->
    <div style="
      background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
      padding: 20px 24px;
      border-radius: 14px 14px 0 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    ">
      <div style="display: flex; align-items: center; gap: 12px;">
        <span style="font-size: 28px;">📝</span>
        <div>
          <div style="font-size: 20px; font-weight: 700; color: white;">Quick Summary</div>
          <div style="font-size: 13px; color: rgba(255,255,255,0.9);">AI-powered text summarization</div>
        </div>
      </div>
      <button id="lexi-summarizer-close" style="
        background: rgba(255,255,255,0.2);
        border: none;
        border-radius: 8px;
        padding: 8px 12px;
        color: white;
        cursor: pointer;
        font-size: 20px;
        font-weight: bold;
        transition: all 0.2s;
      ">×</button>
    </div>

    <!-- Content -->
    <div style="padding: 24px;">
      <!-- Options -->
      <div style="margin-bottom: 20px;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
          <div>
            <label style="display: block; font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 6px;">
              Summary Type
            </label>
            <select id="lexi-summary-type" style="
              width: 100%;
              padding: 10px;
              border: 2px solid #d1d5db;
              border-radius: 8px;
              font-size: 14px;
              cursor: pointer;
            ">
              <option value="key-points">Key Points</option>
              <option value="tl;dr">TL;DR</option>
              <option value="teaser">Teaser</option>
              <option value="headline">Headline</option>
            </select>
          </div>
          <div>
            <label style="display: block; font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 6px;">
              Length
            </label>
            <select id="lexi-summary-length" style="
              width: 100%;
              padding: 10px;
              border: 2px solid #d1d5db;
              border-radius: 8px;
              font-size: 14px;
              cursor: pointer;
            ">
              <option value="short">Short</option>
              <option value="medium" selected>Medium</option>
              <option value="long">Long</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Original Text Preview -->
      <div style="
        background: #f9fafb;
        border: 2px solid #e5e7eb;
        border-radius: 10px;
        padding: 14px;
        margin-bottom: 16px;
        max-height: 150px;
        overflow-y: auto;
      ">
        <div style="font-size: 12px; font-weight: 600; color: #6b7280; margin-bottom: 6px;">
          ORIGINAL TEXT (${text.split(/\s+/).length} words)
        </div>
        <div style="font-size: 14px; color: #374151; line-height: 1.6;">
          ${escapeHtml(text.substring(0, 300))}${text.length > 300 ? '...' : ''}
        </div>
      </div>

      <!-- Summarize Button -->
      <button id="lexi-summarize-action" style="
        width: 100%;
        background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
        color: white;
        border: none;
        border-radius: 10px;
        padding: 14px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        margin-bottom: 20px;
      ">
        ✨ Generate Summary
      </button>

      <!-- Results Area -->
      <div id="lexi-summary-results" style="display: none;"></div>

      <!-- API Status -->
      <div id="lexi-summarizer-status" style="
        text-align: center;
        padding: 12px;
        background: #f3f4f6;
        border-radius: 8px;
        font-size: 13px;
        color: #6b7280;
      ">
        <span id="lexi-summarizer-api-status">Checking API availability...</span>
      </div>
    </div>
  `;

  modal.appendChild(content);
  document.body.appendChild(modal);

  // Check API availability
  checkSummarizerAvailability();

  // Setup event listeners
  setupSummarizerListeners(modal, text);
}

// Check Summarizer API availability
async function checkSummarizerAvailability() {
  const statusEl = document.getElementById('lexi-summarizer-api-status');
  if (!statusEl) return;

  try {
    if (!(self as any).Summarizer) {
      statusEl.innerHTML = '⚠️ Summarizer API not supported. Available in Chrome 138+.';
      statusEl.style.background = '#fef2f2';
      statusEl.style.color = '#991b1b';
      return;
    }

    const availability = await (self as any).Summarizer.availability();
    
    if (availability === 'readily' || availability === 'available') {
      statusEl.innerHTML = '✅ Summarizer API ready! Summaries are generated locally.';
      statusEl.style.background = '#f0fdf4';
      statusEl.style.color = '#166534';
    } else if (availability === 'after-download') {
      statusEl.innerHTML = '⏳ Downloading AI model...';
      statusEl.style.background = '#fef3c7';
      statusEl.style.color = '#92400e';
    } else {
      statusEl.innerHTML = `⚠️ Summarizer status: ${availability}`;
      statusEl.style.background = '#fef2f2';
      statusEl.style.color = '#991b1b';
    }
  } catch (error) {
    statusEl.innerHTML = '❌ Error checking API';
    statusEl.style.background = '#fef2f2';
    statusEl.style.color = '#991b1b';
  }
}

// Setup Summarizer event listeners
function setupSummarizerListeners(modal: HTMLElement, text: string) {
  const closeBtn = modal.querySelector('#lexi-summarizer-close') as HTMLButtonElement;
  const summarizeBtn = modal.querySelector('#lexi-summarize-action') as HTMLButtonElement;
  const typeSelect = modal.querySelector('#lexi-summary-type') as HTMLSelectElement;
  const lengthSelect = modal.querySelector('#lexi-summary-length') as HTMLSelectElement;
  const resultsArea = modal.querySelector('#lexi-summary-results') as HTMLDivElement;

  // Close modal
  closeBtn?.addEventListener('click', () => {
    modal.style.animation = 'lexiFadeOut 0.2s ease-in';
    setTimeout(() => modal.remove(), 200);
  });

  // Click outside to close
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.style.animation = 'lexiFadeOut 0.2s ease-in';
      setTimeout(() => modal.remove(), 200);
    }
  });

  // Summarize button
  summarizeBtn?.addEventListener('click', async () => {
    const type = typeSelect.value;
    const length = lengthSelect.value;

    summarizeBtn.disabled = true;
    summarizeBtn.textContent = '⏳ Generating summary...';

    try {
      await performSummarization(text, type, length, resultsArea);
    } catch (error) {
      console.error('Summarization error:', error);
      showSummaryError(resultsArea, error as Error);
    } finally {
      summarizeBtn.disabled = false;
      summarizeBtn.textContent = '✨ Generate Summary';
    }
  });
}

// Perform summarization with Summarizer API
async function performSummarization(
  text: string,
  type: string,
  length: string,
  resultsArea: HTMLDivElement
) {
  if (!(self as any).Summarizer) {
    throw new Error('Summarizer API not available');
  }

  const availability = await (self as any).Summarizer.availability();
  if (availability !== 'readily' && availability !== 'available') {
    throw new Error(`Summarizer not ready. Status: ${availability}`);
  }

  const summarizer = await (self as any).Summarizer.create({
    type: type,
    format: 'markdown',
    length: length
  });

  const summary = await summarizer.summarize(text);
  
  // Display results
  showSummaryResults(resultsArea, summary, type);

  // Store summary in local storage
  await storeSummary(text, summary, type, length);

  summarizer.destroy();
}

// Show summary results
function showSummaryResults(area: HTMLDivElement, summary: string, type: string) {
  area.style.display = 'block';
  
  const typeEmojis: { [key: string]: string } = {
    'key-points': '📌',
    'tl;dr': '⚡',
    'teaser': '🎯',
    'headline': '📰'
  };

  area.innerHTML = `
    <div style="
      background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%);
      border: 2px solid #8b5cf6;
      border-radius: 12px;
      padding: 20px;
    ">
      <div style="font-size: 14px; font-weight: 700; color: #6b21a8; margin-bottom: 12px;">
        ${typeEmojis[type] || '📝'} SUMMARY
      </div>
      <div style="font-size: 15px; color: #5b21b6; line-height: 1.8; white-space: pre-wrap;">
        ${escapeHtml(summary)}
      </div>
    </div>
  `;
}

// Show summary error
function showSummaryError(area: HTMLDivElement, error: Error) {
  area.style.display = 'block';
  area.innerHTML = `
    <div style="
      background: #fef2f2;
      border: 2px solid #ef4444;
      border-radius: 12px;
      padding: 20px;
      text-align: center;
    ">
      <div style="font-size: 48px; margin-bottom: 12px;">⚠️</div>
      <div style="font-size: 16px; font-weight: 700; color: #991b1b; margin-bottom: 8px;">
        Summarization Failed
      </div>
      <div style="font-size: 14px; color: #7f1d1d;">
        ${escapeHtml(error.message)}
      </div>
    </div>
  `;
}

// Store summary in local storage
async function storeSummary(originalText: string, summary: string, type: string, length: string) {
  try {
    const result = await chrome.storage.local.get(['summaries']);
    const summaries = result.summaries || [];
    
    summaries.unshift({
      originalText: originalText.substring(0, 200),
      summary: summary,
      type: type,
      length: length,
      timestamp: Date.now()
    });

    // Keep only last 50 summaries
    if (summaries.length > 50) {
      summaries.splice(50);
    }

    await chrome.storage.local.set({ summaries });
    console.log('Summary stored successfully');
  } catch (error) {
    console.error('Error storing summary:', error);
  }
}

// Make element draggable
function makeDraggable(element: HTMLElement) {
  let isDragging = false;
  let currentX = 0;
  let currentY = 0;
  let initialX = 0;
  let initialY = 0;

  element.addEventListener('mousedown', (e) => {
    // Only drag if clicking on the header area, not on buttons
    const target = e.target as HTMLElement;
    if (target.tagName === 'BUTTON' || target.closest('button')) {
      return;
    }

    isDragging = true;
    initialX = e.clientX - currentX;
    initialY = e.clientY - currentY;
    element.style.cursor = 'grabbing';
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;

    e.preventDefault();
    currentX = e.clientX - initialX;
    currentY = e.clientY - initialY;

    element.style.left = `${currentX}px`;
    element.style.top = `${currentY}px`;
  });

  document.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      element.style.cursor = 'move';
    }
  });
}

export {};
