// Word Card - Expanded card modal on click

import { translateText } from '../services/translationService';
import { speak } from '../services/ttsService';
import { addWord } from '../storage/vocabularyStorage';
import { addWordToArticle } from '../storage/articlesStorage';
import { createElement } from '../utils/domHelpers';
import { getOptimalModalPosition } from '../utils/positionHelpers';
import { CLASS_NAMES, Z_INDEX, ANIMATION } from '../utils/constants';
import type { WordData } from '../types';

let currentCard: HTMLElement | null = null;
let currentOverlay: HTMLElement | null = null;

/**
 * Initialize word card
 */
export function initializeWordCard(): void {
  document.addEventListener('click', handleClick);
  document.addEventListener('keydown', handleKeyDown);
}

/**
 * Handle click on highlighted word
 */
function handleClick(event: Event): void {
  const target = event.target as HTMLElement;
  
  // Close card if clicking outside
  if (currentCard && !currentCard.contains(target) && !target.classList.contains(CLASS_NAMES.HIGHLIGHT)) {
    hideWordCard();
    return;
  }

  if (!target.classList.contains(CLASS_NAMES.HIGHLIGHT)) {
    return;
  }

  event.stopPropagation();
  const word = target.dataset.word || target.textContent || '';
  if (word) {
    showWordCard(word);
  }
}

/**
 * Handle keyboard
 */
function handleKeyDown(event: KeyboardEvent): void {
  if (event.key === 'Escape' && currentCard) {
    hideWordCard();
  }
}

/**
 * Show word card modal
 */
export async function showWordCard(word: string): Promise<void> {
  try {
    // Get translation
    const settings = await chrome.storage.local.get(['settings']);
    const sourceLang = settings?.settings?.nativeLanguage || 'en';
    const targetLang = settings?.settings?.targetLanguage || 'es';

    const translation = await translateText(word, sourceLang, targetLang);

    // Create overlay
    currentOverlay = createOverlay();
    document.body.appendChild(currentOverlay);

    // Create card
    const card = createCardElement(word, translation, sourceLang, targetLang);
    currentCard = card;

    // Position card
    const position = getOptimalModalPosition(500, 400);
    card.style.left = `${position.x}px`;
    card.style.top = `${position.y}px`;

    document.body.appendChild(card);

    // Fade in
    requestAnimationFrame(() => {
      if (currentOverlay) currentOverlay.style.opacity = '0.5';
      if (currentCard) currentCard.style.opacity = '1';
    });

  } catch (error) {
    console.error('Error showing word card:', error);
  }
}

/**
 * Create overlay element
 */
function createOverlay(): HTMLElement {
  const overlay = createElement('div', 'lexi-card-overlay');
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: ${Z_INDEX.OVERLAY};
    opacity: 0;
    transition: opacity ${ANIMATION.NORMAL}ms ease;
  `;
  
  overlay.addEventListener('click', hideWordCard);
  
  return overlay;
}

/**
 * Create card element
 */
function createCardElement(
  word: string,
  translation: string,
  sourceLang: string,
  targetLang: string
): HTMLElement {
  const card = createElement('div', 'lexi-word-card');

  const exampleSentence = generateExampleSentence(word);

  card.innerHTML = `
    <div class="lexi-card-header">
      <h2 class="lexi-card-title">Word Details</h2>
      <button class="lexi-card-close" id="lexi-card-close">×</button>
    </div>
    
    <div class="lexi-card-body">
      <div class="lexi-card-word-section">
        <div class="lexi-word-item">
          <span class="lexi-word-flag">🔤</span>
          <span class="lexi-word-text">${escapeHtml(word)}</span>
          <button class="lexi-word-speak" data-word="${escapeHtml(word)}" data-lang="${sourceLang}">
            🔊 ${getLangCode(sourceLang)}
          </button>
        </div>
        
        <div class="lexi-arrow">→</div>
        
        <div class="lexi-word-item">
          <span class="lexi-word-flag">🌐</span>
          <span class="lexi-word-text lexi-translation-text">${escapeHtml(translation)}</span>
          <button class="lexi-word-speak" data-word="${escapeHtml(translation)}" data-lang="${targetLang}">
            🔊 ${getLangCode(targetLang)}
          </button>
        </div>
      </div>
      
      <div class="lexi-card-example">
        <h3 class="lexi-example-title">Example Sentence</h3>
        <p class="lexi-example-text">${escapeHtml(exampleSentence)}</p>
      </div>
      
      <div class="lexi-card-actions">
        <button class="lexi-card-btn lexi-card-btn-primary" id="lexi-card-practice">
          ✍️ Practice Writing
        </button>
        <button class="lexi-card-btn lexi-card-btn-secondary" id="lexi-card-add">
          + Add to Vocabulary
        </button>
        <button class="lexi-card-btn lexi-card-btn-success" id="lexi-card-got-it">
          ✓ Got it!
        </button>
      </div>
    </div>
  `;

  applyCardStyles(card);
  attachCardListeners(card, word, translation, sourceLang, targetLang);

  return card;
}

/**
 * Apply card styles
 */
function applyCardStyles(card: HTMLElement): void {
  const styles = `
    position: fixed;
    background: white;
    border-radius: 16px;
    width: 500px;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    z-index: ${Z_INDEX.MODAL};
    opacity: 0;
    transition: opacity ${ANIMATION.NORMAL}ms ease;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;
  card.style.cssText = styles;
}

/**
 * Attach card event listeners
 */
function attachCardListeners(
  card: HTMLElement,
  word: string,
  translation: string,
  sourceLang: string,
  targetLang: string
): void {
  // Close button
  const closeBtn = card.querySelector('#lexi-card-close');
  closeBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    hideWordCard();
  });

  // Speak buttons
  const speakButtons = card.querySelectorAll('.lexi-word-speak');
  speakButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const target = e.currentTarget as HTMLElement;
      const textToSpeak = target.dataset.word || '';
      const lang = target.dataset.lang || 'en';
      speak(textToSpeak, lang);
    });
  });

  // Practice button
  const practiceBtn = card.querySelector('#lexi-card-practice');
  practiceBtn?.addEventListener('click', async (e) => {
    e.stopPropagation();
    await handlePractice(word, translation, sourceLang, targetLang);
  });

  // Add to vocabulary button
  const addBtn = card.querySelector('#lexi-card-add');
  addBtn?.addEventListener('click', async (e) => {
    e.stopPropagation();
    await handleAddToVocabulary(word, translation, sourceLang, targetLang);
    if (addBtn) {
      addBtn.textContent = '✓ Added';
      (addBtn as HTMLButtonElement).disabled = true;
    }
  });

  // Got it button
  const gotItBtn = card.querySelector('#lexi-card-got-it');
  gotItBtn?.addEventListener('click', async (e) => {
    e.stopPropagation();
    await handleAddToVocabulary(word, translation, sourceLang, targetLang);
    hideWordCard();
  });
}

/**
 * Handle practice button
 */
async function handlePractice(
  word: string,
  translation: string,
  sourceLang: string,
  targetLang: string
): Promise<void> {
  // Emit event to open practice flow
  document.dispatchEvent(new CustomEvent('start-practice', {
    detail: {
      words: [{ word, translation, sourceLang, targetLang }]
    }
  }));
  
  hideWordCard();
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
 * Hide word card
 */
export function hideWordCard(): void {
  if (currentCard) {
    currentCard.style.opacity = '0';
  }
  if (currentOverlay) {
    currentOverlay.style.opacity = '0';
  }

  setTimeout(() => {
    currentCard?.remove();
    currentOverlay?.remove();
    currentCard = null;
    currentOverlay = null;
  }, ANIMATION.NORMAL);
}

/**
 * Generate example sentence
 */
function generateExampleSentence(word: string): string {
  const templates = [
    `I use the word "${word}" in my daily conversations.`,
    `The word "${word}" is commonly used in this context.`,
    `Learning "${word}" will help improve your vocabulary.`,
    `You can find "${word}" used frequently in articles.`,
  ];
  
  return templates[Math.floor(Math.random() * templates.length)];
}

/**
 * Get language code display
 */
function getLangCode(lang: string): string {
  const codes: Record<string, string> = {
    'en': 'EN',
    'es': 'ES',
    'fr': 'FR',
    'de': 'DE',
    'it': 'IT',
    'pt': 'PT',
    'ja': 'JA',
    'ko': 'KO',
    'zh': 'ZH',
  };
  return codes[lang] || lang.toUpperCase();
}

/**
 * Escape HTML
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
