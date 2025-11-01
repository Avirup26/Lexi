// Selection Widget - Floating toolbar for selected text

import { translateText } from '../services/translationService';
import { speak } from '../services/ttsService';
import { rewriteText } from '../services/rewriterService';
import { createElement } from '../utils/domHelpers';
import { Z_INDEX, ANIMATION } from '../utils/constants';

let selectionWidget: HTMLElement | null = null;
let selectedText = '';
let selectionRange: Range | null = null;

/**
 * Initialize selection widget
 */
export function initializeSelectionWidget(): void {
  document.addEventListener('mouseup', handleMouseUp);
  document.addEventListener('keyup', handleKeyUp);
  document.addEventListener('mousedown', handleMouseDown);
}

/**
 * Handle mouse up (text selection)
 */
function handleMouseUp(event: MouseEvent): void {
  setTimeout(() => {
    const selection = window.getSelection();
    const text = selection?.toString().trim();

    if (text && text.length > 0 && text.length < 1000) {
      selectedText = text;
      
      // Save the range
      if (selection && selection.rangeCount > 0) {
        selectionRange = selection.getRangeAt(0).cloneRange();
      }

      // Don't show if clicking inside the widget itself
      const target = event.target as HTMLElement;
      if (target.closest('.lexi-selection-widget')) {
        return;
      }

      showSelectionWidget(event.clientX, event.clientY);
    } else {
      hideSelectionWidget();
    }
  }, 10);
}

/**
 * Handle key up (text selection via keyboard)
 */
function handleKeyUp(event: KeyboardEvent): void {
  // Only check on shift key releases (common for selection)
  if (event.shiftKey || event.key === 'Shift') {
    const selection = window.getSelection();
    const text = selection?.toString().trim();

    if (text && text.length > 0 && text.length < 1000) {
      selectedText = text;
      
      if (selection && selection.rangeCount > 0) {
        selectionRange = selection.getRangeAt(0).cloneRange();
        
        // Get position from selection
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        showSelectionWidget(rect.left + rect.width / 2, rect.top - 10);
      }
    }
  }
}

/**
 * Handle mouse down (hide widget when clicking outside)
 */
function handleMouseDown(event: MouseEvent): void {
  const target = event.target as HTMLElement;
  if (selectionWidget && !target.closest('.lexi-selection-widget')) {
    // Delay to allow button clicks
    setTimeout(() => {
      const selection = window.getSelection();
      if (!selection || selection.toString().trim().length === 0) {
        hideSelectionWidget();
      }
    }, 100);
  }
}

/**
 * Show selection widget at position
 */
function showSelectionWidget(x: number, y: number): void {
  if (selectionWidget) {
    hideSelectionWidget();
  }

  selectionWidget = createSelectionWidget();
  document.body.appendChild(selectionWidget);

  // Position above selection
  const widgetWidth = 300;
  const widgetHeight = 60;
  const padding = 10;

  let left = x - widgetWidth / 2;
  let top = y - widgetHeight - padding;

  // Keep within viewport
  if (left < padding) left = padding;
  if (left + widgetWidth > window.innerWidth - padding) {
    left = window.innerWidth - widgetWidth - padding;
  }
  if (top < padding) {
    top = y + padding + 20; // Show below if no space above
  }

  selectionWidget.style.left = `${left + window.scrollX}px`;
  selectionWidget.style.top = `${top + window.scrollY}px`;

  // Fade in
  requestAnimationFrame(() => {
    if (selectionWidget) {
      selectionWidget.style.opacity = '1';
      selectionWidget.style.transform = 'translateY(0) scale(1)';
    }
  });
}

/**
 * Create selection widget element
 */
function createSelectionWidget(): HTMLElement {
  const widget = createElement('div', 'lexi-selection-widget');

  widget.innerHTML = `
    <div class="lexi-selection-actions">
      <button class="lexi-selection-btn lexi-selection-translate" title="Translate">
        <span class="lexi-selection-icon">🌐</span>
        <span class="lexi-selection-label">Translate</span>
      </button>
      
      <button class="lexi-selection-btn lexi-selection-speak" title="Speak">
        <span class="lexi-selection-icon">🔊</span>
        <span class="lexi-selection-label">Speak</span>
      </button>
      
      <button class="lexi-selection-btn lexi-selection-rewrite" title="Rewrite">
        <span class="lexi-selection-icon">✨</span>
        <span class="lexi-selection-label">Rewrite</span>
      </button>
    </div>
    <div class="lexi-selection-result" style="display: none;"></div>
  `;

  applyWidgetStyles(widget);
  attachWidgetListeners(widget);

  return widget;
}

/**
 * Apply widget styles
 */
function applyWidgetStyles(widget: HTMLElement): void {
  const styles = `
    position: absolute;
    z-index: ${Z_INDEX.TOOLTIP};
    background: white;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
    padding: 8px;
    opacity: 0;
    transform: translateY(-5px) scale(0.95);
    transition: all ${ANIMATION.FAST}ms cubic-bezier(0.4, 0, 0.2, 1);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    min-width: 300px;
  `;
  widget.style.cssText = styles;
}

/**
 * Attach event listeners to widget buttons
 */
function attachWidgetListeners(widget: HTMLElement): void {
  const translateBtn = widget.querySelector('.lexi-selection-translate');
  const speakBtn = widget.querySelector('.lexi-selection-speak');
  const rewriteBtn = widget.querySelector('.lexi-selection-rewrite');

  translateBtn?.addEventListener('click', handleTranslate);
  speakBtn?.addEventListener('click', handleSpeak);
  rewriteBtn?.addEventListener('click', handleRewrite);
}

/**
 * Handle translate button
 */
async function handleTranslate(): Promise<void> {
  if (!selectedText || !selectionWidget) return;

  const resultDiv = selectionWidget.querySelector('.lexi-selection-result') as HTMLElement;
  if (!resultDiv) return;

  resultDiv.style.display = 'block';
  resultDiv.innerHTML = '<div class="lexi-selection-loading">Translating...</div>';

  try {
    const settings = await chrome.storage.local.get(['settings']);
    const sourceLang = settings?.settings?.nativeLanguage || 'en';
    const targetLang = settings?.settings?.targetLanguage || 'es';

    const translation = await translateText(selectedText, sourceLang, targetLang);

    resultDiv.innerHTML = `
      <div class="lexi-selection-translation">
        <div class="lexi-selection-translation-header">
          <span class="lexi-selection-translation-label">Translation:</span>
          <button class="lexi-selection-speak-result" data-text="${escapeHtml(translation)}" data-lang="${targetLang}">
            🔊
          </button>
        </div>
        <div class="lexi-selection-translation-text">${escapeHtml(translation)}</div>
      </div>
    `;

    // Attach speak button for result
    const speakResultBtn = resultDiv.querySelector('.lexi-selection-speak-result');
    speakResultBtn?.addEventListener('click', (e) => {
      const btn = e.currentTarget as HTMLElement;
      const text = btn.dataset.text || '';
      const lang = btn.dataset.lang || 'en';
      speak(text, lang);
    });

  } catch (error) {
    resultDiv.innerHTML = '<div class="lexi-selection-error">Translation unavailable</div>';
  }
}

/**
 * Handle speak button
 */
async function handleSpeak(): Promise<void> {
  if (!selectedText) return;

  const settings = await chrome.storage.local.get(['settings']);
  const sourceLang = settings?.settings?.nativeLanguage || 'en';

  speak(selectedText, sourceLang);
}

/**
 * Handle rewrite button
 */
async function handleRewrite(): Promise<void> {
  if (!selectedText || !selectionWidget || !selectionRange) return;

  const resultDiv = selectionWidget.querySelector('.lexi-selection-result') as HTMLElement;
  if (!resultDiv) return;

  resultDiv.style.display = 'block';
  resultDiv.innerHTML = '<div class="lexi-selection-loading">Rewriting...</div>';

  try {
    const rewritten = await rewriteText(selectedText);

    resultDiv.innerHTML = `
      <div class="lexi-selection-rewrite">
        <div class="lexi-selection-rewrite-header">
          <span class="lexi-selection-rewrite-label">Rewritten:</span>
        </div>
        <div class="lexi-selection-rewrite-text">${escapeHtml(rewritten)}</div>
        <div class="lexi-selection-rewrite-actions">
          <button class="lexi-selection-apply-btn">Apply to Text</button>
          <button class="lexi-selection-copy-btn">Copy</button>
        </div>
      </div>
    `;

    // Apply button
    const applyBtn = resultDiv.querySelector('.lexi-selection-apply-btn');
    applyBtn?.addEventListener('click', () => {
      if (selectionRange) {
        replaceSelectedText(rewritten);
        hideSelectionWidget();
      }
    });

    // Copy button
    const copyBtn = resultDiv.querySelector('.lexi-selection-copy-btn');
    copyBtn?.addEventListener('click', async () => {
      await navigator.clipboard.writeText(rewritten);
      if (copyBtn) {
        const original = copyBtn.textContent;
        copyBtn.textContent = '✓ Copied';
        setTimeout(() => {
          copyBtn.textContent = original;
        }, 2000);
      }
    });

  } catch (error) {
    resultDiv.innerHTML = '<div class="lexi-selection-error">Rewrite unavailable</div>';
  }
}

/**
 * Replace selected text with new text
 */
function replaceSelectedText(newText: string): void {
  if (!selectionRange) return;

  try {
    selectionRange.deleteContents();
    const textNode = document.createTextNode(newText);
    selectionRange.insertNode(textNode);

    // Clear selection
    const selection = window.getSelection();
    selection?.removeAllRanges();
  } catch (error) {
    console.error('Error replacing text:', error);
  }
}

/**
 * Hide selection widget
 */
export function hideSelectionWidget(): void {
  if (selectionWidget) {
    selectionWidget.style.opacity = '0';
    selectionWidget.style.transform = 'translateY(-5px) scale(0.95)';
    setTimeout(() => {
      selectionWidget?.remove();
      selectionWidget = null;
      selectedText = '';
      selectionRange = null;
    }, ANIMATION.FAST);
  }
}

/**
 * Escape HTML
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
