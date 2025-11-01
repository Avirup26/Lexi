// Immersive Toggle - Floating toggle button for immersive reading mode

import { loadData, saveData } from '../storage/storageManager';
import { Z_INDEX, CLASS_NAMES } from '../utils/constants';
import { translateText } from '../services/translationService';
import { speak } from '../services/ttsService';
import { rewriteText } from '../services/rewriterService';
import type { UserSettings } from '../types';

let toggleElement: HTMLElement | null = null;
let isExpanded = true;

/**
 * Initialize Lexi toggle
 */
export function initializeImmersiveMode(): void {
  createToggle();
}

/**
 * Create toggle UI
 */
function createToggle(): void {
  toggleElement = document.createElement('div');
  toggleElement.id = 'lexi-immersive-toggle';
  toggleElement.className = CLASS_NAMES.TOGGLE;
  
  toggleElement.innerHTML = `
    <div class="lexi-toggle-header" style="
      padding: 16px 20px;
      display: flex;
      align-items: center;
      gap: 12px;
      cursor: move;
      background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
      border-radius: 12px 12px 0 0;
      transition: all 0.3s ease;
    ">
      <div class="lexi-toggle-icon" style="font-size: 28px;">📚</div>
      <div style="flex: 1;">
        <div class="lexi-toggle-title" style="
          font-weight: 700;
          font-size: 17px;
          color: white;
        ">Lexi</div>
      </div>
      <button class="lexi-toggle-minimize" id="lexi-toggle-minimize" style="
        width: 32px;
        height: 32px;
        border: none;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 8px;
        cursor: pointer;
        font-size: 20px;
        color: white;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
      ">−</button>
    </div>
    
    <div class="lexi-toggle-content" id="lexi-toggle-content" style="
      padding: 14px;
      background: #f9fafb;
      max-height: calc(100vh - 180px);
      overflow-y: auto;
      overflow-x: hidden;
    ">
      <!-- Inner Container with subtle border -->
      <div style="
        background: #f9fafb;
      ">
        <!-- Language Settings Card -->
        <div style="
          background: white;
          border-radius: 10px;
          padding: 18px;
          margin-bottom: 14px;
          border: 1px solid #e5e7eb;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        ">
        <div style="font-size: 16px; font-weight: 600; color: #111827; margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">🌐 Language Settings</div>
        
        <div style="margin-bottom: 16px;">
          <label style="
            font-size: 14px;
            font-weight: 500;
            color: #6b7280;
            display: block;
            margin-bottom: 8px;
          ">Native Language</label>
          <select id="lexi-native-lang" style="
            width: calc(100% - 2px);
            padding: 11px 14px;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            font-size: 14px;
            background: white;
            cursor: pointer;
            color: #111827;
            font-weight: 400;
            transition: border-color 0.2s ease;
            box-sizing: border-box;
          ">
            <option value="en">🇺🇸 English</option>
            <option value="es">🇪🇸 Spanish</option>
            <option value="fr">🇫🇷 French</option>
            <option value="de">🇩🇪 German</option>
            <option value="it">🇮🇹 Italian</option>
            <option value="pt">🇵🇹 Portuguese</option>
            <option value="zh">🇨🇳 Chinese</option>
            <option value="ja">🇯🇵 Japanese</option>
            <option value="ko">🇰🇷 Korean</option>
            <option value="ar">🇸🇦 Arabic</option>
            <option value="hi">🇮🇳 Hindi</option>
          </select>
        </div>
        
        <div>
          <label style="
            font-size: 14px;
            font-weight: 500;
            color: #6b7280;
            display: block;
            margin-bottom: 8px;
          ">Target Language</label>
          <select id="lexi-target-lang" style="
            width: calc(100% - 2px);
            padding: 11px 14px;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            font-size: 14px;
            background: white;
            cursor: pointer;
            color: #111827;
            font-weight: 400;
            transition: border-color 0.2s ease;
            box-sizing: border-box;
          ">
            <option value="es">🇪🇸 Spanish</option>
            <option value="en">🇺🇸 English</option>
            <option value="fr">🇫🇷 French</option>
            <option value="de">🇩🇪 German</option>
            <option value="it">🇮🇹 Italian</option>
            <option value="pt">🇵🇹 Portuguese</option>
            <option value="zh">🇨🇳 Chinese</option>
            <option value="ja">🇯🇵 Japanese</option>
            <option value="ko">🇰🇷 Korean</option>
            <option value="ar">🇸🇦 Arabic</option>
            <option value="hi">🇮🇳 Hindi</option>
          </select>
        </div>
      </div>
      
        <!-- Selection Tools Card -->
        <div style="
          background: white;
          border-radius: 10px;
          padding: 18px;
          margin-bottom: 14px;
          border: 1px solid #e5e7eb;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        ">
        <div style="font-size: 16px; font-weight: 600; color: #111827; margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">📝 Selection Tools</div>
        
        <textarea id="lexi-selection-input" placeholder="Paste text to translate, speak, or rewrite..." style="
          width: calc(100% - 4px);
          min-height: 90px;
          padding: 12px 14px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          font-size: 14px;
          resize: vertical;
          font-family: inherit;
          color: #111827;
          transition: border-color 0.2s ease;
          margin-bottom: 16px;
          box-sizing: border-box;
        "></textarea>
        
        <button id="lexi-translate-btn" style="
          width: calc(100% - 4px);
          padding: 14px;
          background: #0d9488;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s ease;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-sizing: border-box;
        ">🌎 Translate</button>
        
        <div style="display: flex; gap: 10px; margin-bottom: 12px;">
          <button id="lexi-speak-native-btn" style="
            flex: 1;
            padding: 12px 8px;
            background: #3b82f6;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 4px;
            box-sizing: border-box;
          ">🔊 EN</button>
          <button id="lexi-speak-target-btn" style="
            flex: 1;
            padding: 12px 8px;
            background: #10b981;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 4px;
            box-sizing: border-box;
          ">🔊 ES</button>
        </div>
        
        <button id="lexi-rewrite-btn" style="
          width: calc(100% - 4px);
          padding: 14px;
          background: #a855f7;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-sizing: border-box;
        ">✨ Rewrite</button>
        
        <div id="lexi-result-box" style="
          display: none;
          padding: 18px;
          background: #fef3c7;
          border-radius: 12px;
          border-left: 4px solid #f59e0b;
          margin-top: 16px;
        ">
          <div id="lexi-result-text" style="font-size: 14px; color: #78350f; line-height: 1.7; font-weight: 500;"></div>
        </div>
      </div>
      
      <!-- Quick Summary Button -->
      <button class="lexi-summary-btn" id="lexi-summary-btn" style="
        width: calc(100% - 4px);
        padding: 12px;
        background: #7c3aed;
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        box-sizing: border-box;
        margin-top: 16px;
      ">
        ✨ Quick Summary
      </button>
      </div>
      <!-- End Inner Container -->
    </div>
    
    <!-- Resize Handle -->
    <div id="lexi-resize-handle" style="
      position: absolute;
      bottom: 0;
      right: 0;
      width: 20px;
      height: 20px;
      cursor: nwse-resize;
      background: linear-gradient(135deg, transparent 0%, transparent 50%, #94a3b8 50%, #94a3b8 100%);
      border-bottom-right-radius: 20px;
    "></div>
  `;

  applyStyles();
  document.body.appendChild(toggleElement);
  
  // Load saved language settings
  loadData<UserSettings>('settings').then(settings => {
    if (settings) {
      const nativeLang = document.getElementById('lexi-native-lang') as HTMLSelectElement;
      const targetLang = document.getElementById('lexi-target-lang') as HTMLSelectElement;
      
      if (nativeLang && settings.nativeLanguage) {
        nativeLang.value = settings.nativeLanguage;
      }
      
      if (targetLang && settings.targetLanguage) {
        targetLang.value = settings.targetLanguage;
      }
    }
  });

  attachEventListeners();
  makeDraggable();
  makeResizable();
  initializeLanguageLabels();
}

/**
 * Apply CSS styles
 */
function applyStyles(): void {
  if (!toggleElement) return;

  const styles = `
    position: fixed;
    top: 90px;
    right: 20px;
    width: 380px;
    max-width: calc(100vw - 40px);
    max-height: calc(100vh - 110px);
    overflow: visible;
    background: #ffffff;
    border-radius: 12px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
    z-index: ${Z_INDEX.TOGGLE};
    font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  `;
  
  toggleElement.style.cssText = styles;
}

/**
 * Attach event listeners
 */
function attachEventListeners(): void {
  if (!toggleElement) return;

  // Native language select
  const nativeLang = document.getElementById('lexi-native-lang');
  nativeLang?.addEventListener('change', handleNativeLanguageChange);

  // Target language select
  const targetLang = document.getElementById('lexi-target-lang');
  targetLang?.addEventListener('change', handleTargetLanguageChange);

  // Minimize button
  const minimizeBtn = document.getElementById('lexi-toggle-minimize');
  minimizeBtn?.addEventListener('click', handleMinimize);
  minimizeBtn?.addEventListener('mouseenter', function() {
    (this as HTMLElement).style.background = 'rgba(255, 255, 255, 0.3)';
  });
  minimizeBtn?.addEventListener('mouseleave', function() {
    (this as HTMLElement).style.background = 'rgba(255, 255, 255, 0.2)';
  });

  // Summary button
  const summaryBtn = document.getElementById('lexi-summary-btn');
  summaryBtn?.addEventListener('click', handleSummaryClick);
  summaryBtn?.addEventListener('mouseenter', function() {
    (this as HTMLElement).style.transform = 'translateY(-2px)';
    (this as HTMLElement).style.boxShadow = '0 4px 12px rgba(168, 85, 247, 0.4)';
  });
  summaryBtn?.addEventListener('mouseleave', function() {
    (this as HTMLElement).style.transform = 'translateY(0)';
    (this as HTMLElement).style.boxShadow = '0 2px 8px rgba(168, 85, 247, 0.3)';
  });

  // Translate button
  const translateBtn = document.getElementById('lexi-translate-btn');
  translateBtn?.addEventListener('click', handleTranslate);
  translateBtn?.addEventListener('mouseenter', function() {
    (this as HTMLElement).style.transform = 'translateY(-1px)';
    (this as HTMLElement).style.boxShadow = '0 2px 8px rgba(13, 148, 136, 0.4)';
  });
  translateBtn?.addEventListener('mouseleave', function() {
    (this as HTMLElement).style.transform = 'translateY(0)';
    (this as HTMLElement).style.boxShadow = 'none';
  });

  // Speak native button
  const speakNativeBtn = document.getElementById('lexi-speak-native-btn');
  if (speakNativeBtn) {
    speakNativeBtn.addEventListener('click', handleSpeakNative, { once: false });
    speakNativeBtn.addEventListener('mouseenter', function() {
      (this as HTMLElement).style.transform = 'translateY(-1px)';
      (this as HTMLElement).style.boxShadow = '0 2px 8px rgba(59, 130, 246, 0.4)';
    });
    speakNativeBtn.addEventListener('mouseleave', function() {
      (this as HTMLElement).style.transform = 'translateY(0)';
      (this as HTMLElement).style.boxShadow = 'none';
    });
  }

  // Speak target button
  const speakTargetBtn = document.getElementById('lexi-speak-target-btn');
  if (speakTargetBtn) {
    speakTargetBtn.addEventListener('click', handleSpeakTarget, { once: false });
    speakTargetBtn.addEventListener('mouseenter', function() {
      (this as HTMLElement).style.transform = 'translateY(-1px)';
      (this as HTMLElement).style.boxShadow = '0 2px 8px rgba(16, 185, 129, 0.4)';
    });
    speakTargetBtn.addEventListener('mouseleave', function() {
      (this as HTMLElement).style.transform = 'translateY(0)';
      (this as HTMLElement).style.boxShadow = '0 2px 6px rgba(16, 185, 129, 0.3)';
    });
  }

  // Rewrite button
  const rewriteBtn = document.getElementById('lexi-rewrite-btn');
  rewriteBtn?.addEventListener('click', handleRewrite);
  rewriteBtn?.addEventListener('mouseenter', function() {
    (this as HTMLElement).style.transform = 'translateY(-1px)';
    (this as HTMLElement).style.boxShadow = '0 2px 8px rgba(139, 92, 246, 0.4)';
  });
  rewriteBtn?.addEventListener('mouseleave', function() {
    (this as HTMLElement).style.transform = 'translateY(0)';
    (this as HTMLElement).style.boxShadow = 'none';
  });
}

/**
 * Handle native language change
 */
function handleNativeLanguageChange(event: Event): void {
  const target = event.target as HTMLSelectElement;
  const nativeLanguage = target.value;
  
  console.log('[Lexi] Native language changed to:', nativeLanguage);
  
  // Save to storage
  saveData('settings', { nativeLanguage });
  
  // Update speak button label
  const speakNativeBtn = document.getElementById('lexi-speak-native-btn');
  if (speakNativeBtn) {
    speakNativeBtn.textContent = `🔊 ${nativeLanguage.toUpperCase()}`;
  }
}

/**
 * Handle target language change
 */
function handleTargetLanguageChange(event: Event): void {
  const target = event.target as HTMLSelectElement;
  const targetLanguage = target.value;
  
  console.log('[Lexi] Target language changed to:', targetLanguage);
  
  // Save to storage
  saveData('settings', { targetLanguage });
  
  // Update speak button label
  const speakTargetBtn = document.getElementById('lexi-speak-target-btn');
  if (speakTargetBtn) {
    speakTargetBtn.textContent = `🔊 ${targetLanguage.toUpperCase()}`;
  }
}

/**
 * Initialize language labels on button load
 */
async function initializeLanguageLabels(): Promise<void> {
  try {
    const settings = await loadData<UserSettings>('settings');
    const nativeLang = settings?.nativeLanguage || 'en';
    const targetLang = settings?.targetLanguage || 'es';
    
    // Update native language dropdown
    const nativeLangSelect = document.getElementById('lexi-native-lang') as HTMLSelectElement;
    if (nativeLangSelect) {
      nativeLangSelect.value = nativeLang;
    }
    
    // Update target language dropdown
    const targetLangSelect = document.getElementById('lexi-target-lang') as HTMLSelectElement;
    if (targetLangSelect) {
      targetLangSelect.value = targetLang;
    }
    
    // Update speak button labels
    const speakNativeBtn = document.getElementById('lexi-speak-native-btn');
    if (speakNativeBtn) {
      speakNativeBtn.textContent = `🔊 ${nativeLang.toUpperCase()}`;
    }
    
    const speakTargetBtn = document.getElementById('lexi-speak-target-btn');
    if (speakTargetBtn) {
      speakTargetBtn.textContent = `🔊 ${targetLang.toUpperCase()}`;
    }
  } catch (error) {
    console.error('[Lexi] Failed to initialize language labels:', error);
  }
}

/**
 * Handle minimize button
 */
function handleMinimize(): void {
  isExpanded = !isExpanded;
  const content = document.getElementById('lexi-toggle-content');
  const minimizeBtn = document.getElementById('lexi-toggle-minimize');
  const header = toggleElement?.querySelector('.lexi-toggle-header') as HTMLElement;
  
  if (content && minimizeBtn && toggleElement) {
    if (isExpanded) {
      // Expanded state
      content.style.display = 'block';
      minimizeBtn.textContent = '−';
      toggleElement.style.width = '380px';
      toggleElement.style.height = 'auto';
      if (header) {
        header.style.cursor = 'move';
        header.style.borderRadius = '12px 12px 0 0';
      }
    } else {
      // Minimized/collapsed state - just show compact header
      content.style.display = 'none';
      minimizeBtn.textContent = '+';
      toggleElement.style.width = '180px';
      toggleElement.style.height = 'auto';
      if (header) {
        header.style.cursor = 'default';
        header.style.borderRadius = '12px';
      }
    }
  }
}

/**
 * Handle summary button click
 */
function handleSummaryClick(): void {
  document.dispatchEvent(new CustomEvent('open-summary-modal'));
}

/**
 * Make toggle draggable (only when expanded)
 */
function makeDraggable(): void {
  if (!toggleElement) return;

  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let initialX = 0;
  let initialY = 0;

  const header = toggleElement.querySelector('.lexi-toggle-header') as HTMLElement;
  if (!header) return;

  header.addEventListener('mousedown', (e: MouseEvent) => {
    // Only allow dragging when expanded
    if (!isExpanded) return;
    
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    const rect = toggleElement!.getBoundingClientRect();
    initialX = rect.left;
    initialY = rect.top;
  });

  document.addEventListener('mousemove', (e: MouseEvent) => {
    if (!isDragging || !toggleElement || !isExpanded) return;

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    toggleElement.style.left = `${initialX + dx}px`;
    toggleElement.style.top = `${initialY + dy}px`;
    toggleElement.style.right = 'auto';
    toggleElement.style.bottom = 'auto';
  });

  document.addEventListener('mouseup', () => {
    isDragging = false;
  });
}

/**
 * Make toggle resizable
 */
function makeResizable(): void {
  if (!toggleElement) return;

  const resizeHandle = document.getElementById('lexi-resize-handle');
  if (!resizeHandle) return;

  let isResizing = false;
  let startX = 0;
  let startY = 0;
  let startWidth = 0;
  let startHeight = 0;

  resizeHandle.addEventListener('mousedown', (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    isResizing = true;
    startX = e.clientX;
    startY = e.clientY;
    
    const rect = toggleElement!.getBoundingClientRect();
    startWidth = rect.width;
    startHeight = rect.height;
  });

  document.addEventListener('mousemove', (e: MouseEvent) => {
    if (!isResizing || !toggleElement) return;

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    const newWidth = Math.max(350, startWidth + dx);
    const newHeight = Math.max(400, startHeight + dy);

    toggleElement.style.width = `${newWidth}px`;
    toggleElement.style.maxHeight = `${newHeight}px`;
  });

  document.addEventListener('mouseup', () => {
    isResizing = false;
  });
}

/**
 * Show toggle
 */
export function showToggle(): void {
  if (toggleElement) {
    toggleElement.style.display = 'block';
  }
}

/**
 * Hide toggle
 */
export function hideToggle(): void {
  if (toggleElement) {
    toggleElement.style.display = 'none';
  }
}

/**
 * Handle translate button click
 */
async function handleTranslate(): Promise<void> {
  const input = document.getElementById('lexi-selection-input') as HTMLTextAreaElement;
  const resultBox = document.getElementById('lexi-result-box') as HTMLElement;
  const resultText = document.getElementById('lexi-result-text') as HTMLElement;
  
  if (!input || !resultBox || !resultText) return;
  
  const text = input.value.trim();
  if (!text) {
    alert('Please enter some text to translate');
    return;
  }
  
  resultBox.style.display = 'block';
  resultText.innerHTML = '<div style="text-align: center; color: #92400e;">Translating...</div>';
  
  try {
    console.log('[Lexi] Translating:', text);
    const settings = await loadData<UserSettings>('settings');
    const sourceLang = settings?.nativeLanguage || 'en';
    const targetLang = settings?.targetLanguage || 'es';
    
    const translation = await translateText(text, sourceLang, targetLang);
    resultText.innerHTML = `<strong style="color: #92400e;">Translation:</strong><br>${translation}`;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Translation failed';
    resultText.innerHTML = `<div style="color: #dc2626;"><strong>Error:</strong> ${errorMsg}</div>`;
  }
}

/**
 * Handle speak native button click
 */
async function handleSpeakNative(): Promise<void> {
  const input = document.getElementById('lexi-selection-input') as HTMLTextAreaElement;
  
  if (!input) return;
  
  const text = input.value.trim();
  if (!text) {
    alert('Please enter some text to speak');
    return;
  }
  
  try {
    console.log('[Lexi] Speaking (native):', text);
    const settings = await loadData<UserSettings>('settings');
    const lang = settings?.nativeLanguage || 'en';
    speak(text, lang);
  } catch (error) {
    alert('Failed to speak text');
  }
}

/**
 * Handle speak target button click
 */
async function handleSpeakTarget(): Promise<void> {
  const input = document.getElementById('lexi-selection-input') as HTMLTextAreaElement;
  
  if (!input) return;
  
  const text = input.value.trim();
  if (!text) {
    alert('Please enter some text to speak');
    return;
  }
  
  try {
    console.log('[Lexi] Speaking (target):', text);
    const settings = await loadData<UserSettings>('settings');
    const lang = settings?.targetLanguage || 'es';
    speak(text, lang);
  } catch (error) {
    alert('Failed to speak text');
  }
}

/**
 * Handle rewrite button click
 */
async function handleRewrite(): Promise<void> {
  const input = document.getElementById('lexi-selection-input') as HTMLTextAreaElement;
  const resultBox = document.getElementById('lexi-result-box') as HTMLElement;
  const resultText = document.getElementById('lexi-result-text') as HTMLElement;
  
  if (!input || !resultBox || !resultText) return;
  
  const text = input.value.trim();
  if (!text) {
    alert('Please enter some text to rewrite');
    return;
  }
  
  resultBox.style.display = 'block';
  resultText.innerHTML = '<div style="text-align: center; color: #92400e;">Rewriting...</div>';
  
  try {
    console.log('[Lexi] Rewriting:', text);
    const rewritten = await rewriteText(text);
    resultText.innerHTML = `<strong style="color: #92400e;">Rewritten:</strong><br>${rewritten}`;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Rewrite failed';
    resultText.innerHTML = `<div style="color: #dc2626;"><strong>Error:</strong> ${errorMsg}</div>`;
  }
}
