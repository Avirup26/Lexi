// Hover Tooltip - Show translation on hover

import { translateText } from '../services/translationService';
import { speak } from '../services/ttsService';
import { addWord } from '../storage/vocabularyStorage';
import { addWordToArticle } from '../storage/articlesStorage';
import { createElement } from '../utils/domHelpers';
import { getOptimalTooltipPosition } from '../utils/positionHelpers';
import { CLASS_NAMES, Z_INDEX, ANIMATION } from '../utils/constants';
import type { WordData } from '../types';

let currentTooltip: HTMLElement | null = null;
let hoverTimeout: number | null = null;
let hideTimeout: number | null = null;
let currentWord: string | null = null;

/**
 * Initialize hover tooltip
 */
export function initializeHoverTooltip(): void {
  document.addEventListener('mouseover', handleMouseOver);
  document.addEventListener('mouseout', handleMouseOut);
}

/**
 * Handle mouse over highlighted word
 */
function handleMouseOver(event: Event): void {
  const target = event.target as HTMLElement;
  
  if (!target.classList.contains(CLASS_NAMES.HIGHLIGHT)) {
    return;
  }

  const word = target.dataset.word || target.textContent || '';
  if (!word) return;

  // Clear existing timeouts
  if (hideTimeout) {
    clearTimeout(hideTimeout);
    hideTimeout = null;
  }

  // If tooltip already showing for this word, don't create new one
  if (currentTooltip && currentWord === word) {
    return;
  }

  // Delay before showing tooltip
  hoverTimeout = window.setTimeout(() => {
    showTooltip(word, target);
  }, ANIMATION.TOOLTIP_DELAY);
}

/**
 * Handle mouse out
 */
function handleMouseOut(event: Event): void {
  const target = event.target as HTMLElement;
  
  if (!target.classList.contains(CLASS_NAMES.HIGHLIGHT)) {
    return;
  }

  // Clear hover timeout
  if (hoverTimeout) {
    clearTimeout(hoverTimeout);
    hoverTimeout = null;
  }

  // Delay before hiding tooltip
  hideTimeout = window.setTimeout(() => {
    hideTooltip();
  }, ANIMATION.TOOLTIP_HIDE_DELAY);
}

/**
 * Show tooltip with translation
 */
export async function showTooltip(word: string, targetElement: HTMLElement): Promise<void> {
  try {
    currentWord = word;

    // Get translation
    const settings = await chrome.storage.local.get(['settings']);
    const sourceLang = settings?.settings?.nativeLanguage || 'en';
    const targetLang = settings?.settings?.targetLanguage || 'es';

    const translation = await translateText(word, sourceLang, targetLang);

    // Create tooltip element
    const tooltip = createTooltipElement(word, translation, sourceLang, targetLang);
    currentTooltip = tooltip;

    // Position tooltip
    const targetRect = targetElement.getBoundingClientRect();
    const position = getOptimalTooltipPosition(targetRect, 250, 120);

    tooltip.style.left = `${position.x}px`;
    tooltip.style.top = `${position.y}px`;

    // Add to document
    document.body.appendChild(tooltip);

    // Fade in
    requestAnimationFrame(() => {
      tooltip.style.opacity = '1';
    });

    // Prevent tooltip from hiding when hovering over it
    tooltip.addEventListener('mouseenter', () => {
      if (hideTimeout) {
        clearTimeout(hideTimeout);
        hideTimeout = null;
      }
    });

    tooltip.addEventListener('mouseleave', () => {
      hideTimeout = window.setTimeout(() => {
        hideTooltip();
      }, ANIMATION.TOOLTIP_HIDE_DELAY);
    });

  } catch (error) {
    console.error('Error showing tooltip:', error);
  }
}

/**
 * Create tooltip element
 */
function createTooltipElement(
  word: string,
  translation: string,
  sourceLang: string,
  targetLang: string
): HTMLElement {
  const tooltip = createElement('div', CLASS_NAMES.TOOLTIP);

  tooltip.innerHTML = `
    <div class="lexi-tooltip-word">
      <span class="lexi-tooltip-original">${escapeHtml(word)}</span>
      <button class="lexi-tooltip-speak" data-word="${escapeHtml(word)}" data-lang="${sourceLang}" title="Speak">
        🔊
      </button>
    </div>
    <div class="lexi-tooltip-translation">
      <span class="lexi-tooltip-translated">${escapeHtml(translation)}</span>
      <button class="lexi-tooltip-speak" data-word="${escapeHtml(translation)}" data-lang="${targetLang}" title="Speak">
        🔊
      </button>
    </div>
    <button class="lexi-tooltip-add" data-word="${escapeHtml(word)}" data-translation="${escapeHtml(translation)}">
      + Add to Vocabulary
    </button>
  `;

  applyTooltipStyles(tooltip);
  attachTooltipListeners(tooltip, word, translation, sourceLang, targetLang);

  return tooltip;
}

/**
 * Apply tooltip styles
 */
function applyTooltipStyles(tooltip: HTMLElement): void {
  const styles = `
    position: fixed;
    background: white;
    border-radius: 8px;
    padding: 12px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
    z-index: ${Z_INDEX.TOOLTIP};
    opacity: 0;
    transition: opacity ${ANIMATION.FAST}ms ease;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    min-width: 200px;
    max-width: 300px;
  `;
  tooltip.style.cssText = styles;
}

/**
 * Attach event listeners to tooltip
 */
function attachTooltipListeners(
  tooltip: HTMLElement,
  word: string,
  translation: string,
  sourceLang: string,
  targetLang: string
): void {
  // Speak buttons
  const speakButtons = tooltip.querySelectorAll('.lexi-tooltip-speak');
  speakButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const target = e.currentTarget as HTMLElement;
      const textToSpeak = target.dataset.word || '';
      const lang = target.dataset.lang || 'en';
      speak(textToSpeak, lang);
    });
  });

  // Add to vocabulary button
  const addButton = tooltip.querySelector('.lexi-tooltip-add');
  addButton?.addEventListener('click', async (e) => {
    e.stopPropagation();
    await handleAddToVocabulary(word, translation, sourceLang, targetLang);
    
    // Update button text
    if (addButton) {
      addButton.textContent = '✓ Added';
      (addButton as HTMLButtonElement).disabled = true;
    }
  });
}

/**
 * Handle add to vocabulary
 */
async function handleAddToVocabulary(
  word: string,
  translation: string,
  sourceLang: string,
  targetLang: string
): Promise<void> {
  const wordData: WordData = {
    word,
    translation,
    sourceLang,
    targetLang,
    timestamp: Date.now(),
    reviewCount: 0,
    practiced: false,
    articleUrl: window.location.href,
  };

  await addWord(wordData);
  await addWordToArticle(window.location.href, word);
}

/**
 * Hide tooltip
 */
export function hideTooltip(): void {
  if (currentTooltip) {
    currentTooltip.style.opacity = '0';
    setTimeout(() => {
      currentTooltip?.remove();
      currentTooltip = null;
      currentWord = null;
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
