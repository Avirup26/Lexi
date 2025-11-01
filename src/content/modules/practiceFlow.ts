// Practice Flow - Practice modal after reading

import { checkGrammar } from '../services/proofreaderService';
import { rewriteText } from '../services/rewriterService';
import { markPracticed } from '../storage/vocabularyStorage';
import { incrementPracticeSessions, incrementWordsLearned } from '../storage/statsStorage';
import { createElement } from '../utils/domHelpers';
import { Z_INDEX, ANIMATION } from '../utils/constants';

let practiceModal: HTMLElement | null = null;
let practiceWords: Array<{ word: string; translation: string; sourceLang: string; targetLang: string }> = [];
let currentWordIndex = 0;

/**
 * Initialize practice flow
 */
export function initializePracticeFlow(): void {
  // Listen for article completion
  document.addEventListener('article-read-complete', handleArticleComplete);
  
  // Listen for manual practice start
  document.addEventListener('start-practice', (e: Event) => {
    const customEvent = e as CustomEvent;
    if (customEvent.detail.words) {
      startPractice(customEvent.detail.words);
    }
  });
}

/**
 * Handle article reading completion
 */
async function handleArticleComplete(event: Event): Promise<void> {
  const customEvent = event as CustomEvent;
  const wordsLookedUp = customEvent.detail.articleData?.wordsLookedUp || [];
  
  if (wordsLookedUp.length === 0) return;

  // Get last 3-5 words
  const recentWords = wordsLookedUp.slice(-5);
  
  // Show practice prompt after delay
  setTimeout(() => {
    showPracticePrompt(recentWords.length);
  }, 2000);
}

/**
 * Show practice prompt
 */
function showPracticePrompt(wordCount: number): void {
  const prompt = createElement('div', 'lexi-practice-prompt');
  
  prompt.innerHTML = `
    <div class="lexi-prompt-content">
      <h3>🎉 Great job reading!</h3>
      <p>You looked up ${wordCount} word${wordCount > 1 ? 's' : ''}. Want to practice them?</p>
      <div class="lexi-prompt-actions">
        <button class="lexi-prompt-btn lexi-prompt-btn-primary" id="lexi-practice-yes">
          ✍️ Practice Now
        </button>
        <button class="lexi-prompt-btn lexi-prompt-btn-secondary" id="lexi-practice-later">
          Maybe Later
        </button>
      </div>
    </div>
  `;

  applyPromptStyles(prompt);
  document.body.appendChild(prompt);

  // Attach listeners
  const yesBtn = prompt.querySelector('#lexi-practice-yes');
  const laterBtn = prompt.querySelector('#lexi-practice-later');

  yesBtn?.addEventListener('click', async () => {
    prompt.remove();
    // Get vocabulary and start practice
    const { vocabulary } = await chrome.storage.local.get(['vocabulary']);
    const recentWords = (vocabulary || []).slice(0, 5).map((v: any) => ({
      word: v.word,
      translation: v.translation,
      sourceLang: v.sourceLang,
      targetLang: v.targetLang,
    }));
    startPractice(recentWords);
  });

  laterBtn?.addEventListener('click', () => {
    prompt.remove();
  });

  // Auto-hide after 10 seconds
  setTimeout(() => {
    if (document.body.contains(prompt)) {
      prompt.remove();
    }
  }, 10000);
}

/**
 * Apply prompt styles
 */
function applyPromptStyles(prompt: HTMLElement): void {
  const styles = `
    position: fixed;
    bottom: 80px;
    right: 20px;
    background: white;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
    z-index: ${Z_INDEX.MODAL};
    max-width: 350px;
    animation: slideInUp 0.3s ease;
  `;
  prompt.style.cssText = styles;
}

/**
 * Start practice session
 */
export function startPractice(words: Array<{ word: string; translation: string; sourceLang: string; targetLang: string }>): void {
  practiceWords = words.slice(0, 5); // Max 5 words
  currentWordIndex = 0;
  
  createPracticeModal();
  showWordPractice();
}

/**
 * Create practice modal
 */
function createPracticeModal(): void {
  practiceModal = createElement('div', 'lexi-practice-modal');
  
  practiceModal.innerHTML = `
    <div class="lexi-practice-overlay"></div>
    <div class="lexi-practice-container">
      <div class="lexi-practice-header">
        <h2>✍️ Writing Practice</h2>
        <button class="lexi-practice-close" id="lexi-practice-close">×</button>
      </div>
      
      <div class="lexi-practice-progress" id="lexi-practice-progress"></div>
      
      <div class="lexi-practice-body" id="lexi-practice-body"></div>
      
      <div class="lexi-practice-actions" id="lexi-practice-actions"></div>
    </div>
  `;

  applyModalStyles(practiceModal);
  document.body.appendChild(practiceModal);

  // Close button
  const closeBtn = practiceModal.querySelector('#lexi-practice-close');
  closeBtn?.addEventListener('click', closePractice);

  // Overlay click
  const overlay = practiceModal.querySelector('.lexi-practice-overlay');
  overlay?.addEventListener('click', closePractice);
}

/**
 * Apply modal styles
 */
function applyModalStyles(modal: HTMLElement): void {
  const styles = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: ${Z_INDEX.MODAL};
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;
  modal.style.cssText = styles;
}

/**
 * Show word practice
 */
function showWordPractice(): void {
  if (!practiceModal || currentWordIndex >= practiceWords.length) {
    showCompletionScreen();
    return;
  }

  const word = practiceWords[currentWordIndex];
  
  // Update progress
  updateProgress();
  
  // Update body
  const body = practiceModal.querySelector('#lexi-practice-body');
  if (body) {
    body.innerHTML = `
      <div class="lexi-practice-word">
        <h3>Write a sentence using:</h3>
        <div class="lexi-practice-target-word">"${escapeHtml(word.word)}"</div>
        <div class="lexi-practice-translation">(${escapeHtml(word.translation)})</div>
      </div>
      
      <textarea 
        id="lexi-practice-input"
        class="lexi-practice-textarea"
        placeholder="Type your sentence here..."
        rows="4"
      ></textarea>
      
      <div id="lexi-practice-feedback" class="lexi-practice-feedback"></div>
    `;
  }

  // Update actions
  const actions = practiceModal.querySelector('#lexi-practice-actions');
  if (actions) {
    actions.innerHTML = `
      <button class="lexi-practice-btn lexi-practice-btn-primary" id="lexi-check-btn">
        ✓ Check Grammar
      </button>
      <button class="lexi-practice-btn lexi-practice-btn-secondary" id="lexi-rewrite-btn" style="display: none;">
        ✨ See Better Phrasing
      </button>
      <button class="lexi-practice-btn lexi-practice-btn-success" id="lexi-next-btn" style="display: none;">
        Next Word →
      </button>
    `;

    // Attach action listeners
    const checkBtn = actions.querySelector('#lexi-check-btn');
    const rewriteBtn = actions.querySelector('#lexi-rewrite-btn');
    const nextBtn = actions.querySelector('#lexi-next-btn');

    checkBtn?.addEventListener('click', handleCheckGrammar);
    rewriteBtn?.addEventListener('click', handleRewrite);
    nextBtn?.addEventListener('click', handleNextWord);
  }
}

/**
 * Update progress indicator
 */
function updateProgress(): void {
  const progress = practiceModal?.querySelector('#lexi-practice-progress');
  if (progress) {
    progress.textContent = `${currentWordIndex + 1} / ${practiceWords.length}`;
  }
}

/**
 * Handle check grammar
 */
async function handleCheckGrammar(): Promise<void> {
  const input = document.getElementById('lexi-practice-input') as HTMLTextAreaElement;
  const feedback = document.getElementById('lexi-practice-feedback');
  const checkBtn = document.getElementById('lexi-check-btn') as HTMLButtonElement;
  const rewriteBtn = document.getElementById('lexi-rewrite-btn') as HTMLButtonElement;
  const nextBtn = document.getElementById('lexi-next-btn') as HTMLButtonElement;

  if (!input || !feedback) return;

  const sentence = input.value.trim();
  if (!sentence) {
    feedback.innerHTML = '<div class="lexi-feedback-warning">⚠️ Please write a sentence first.</div>';
    return;
  }

  checkBtn.disabled = true;
  checkBtn.textContent = '⏳ Checking...';

  try {
    const result = await checkGrammar(sentence);
    
    if (result.corrections.length === 0) {
      feedback.innerHTML = '<div class="lexi-feedback-success">✅ Perfect! No grammar issues found.</div>';
    } else {
      feedback.innerHTML = `
        <div class="lexi-feedback-partial">
          📝 ${result.corrections.length} suggestion${result.corrections.length > 1 ? 's' : ''} found:
          <ul class="lexi-corrections-list">
            ${result.corrections.map(c => `<li>${escapeHtml(c.message || 'Suggestion')}</li>`).join('')}
          </ul>
        </div>
      `;
    }

    // Show rewrite and next buttons
    rewriteBtn.style.display = 'inline-block';
    nextBtn.style.display = 'inline-block';

  } catch (error) {
    feedback.innerHTML = '<div class="lexi-feedback-error">❌ Grammar check unavailable. Click Next to continue.</div>';
    nextBtn.style.display = 'inline-block';
  } finally {
    checkBtn.textContent = '✓ Check Grammar';
    checkBtn.disabled = false;
  }
}

/**
 * Handle rewrite
 */
async function handleRewrite(): Promise<void> {
  const input = document.getElementById('lexi-practice-input') as HTMLTextAreaElement;
  const feedback = document.getElementById('lexi-practice-feedback');
  const rewriteBtn = document.getElementById('lexi-rewrite-btn') as HTMLButtonElement;

  if (!input || !feedback) return;

  rewriteBtn.disabled = true;
  rewriteBtn.textContent = '⏳ Rewriting...';

  try {
    const rewritten = await rewriteText(input.value);
    
    feedback.innerHTML += `
      <div class="lexi-feedback-rewrite">
        <strong>✨ Better phrasing:</strong>
        <p class="lexi-rewritten-text">${escapeHtml(rewritten)}</p>
      </div>
    `;
  } catch (error) {
    feedback.innerHTML += '<div class="lexi-feedback-error">❌ Rewrite unavailable.</div>';
  } finally {
    rewriteBtn.textContent = '✨ See Better Phrasing';
    rewriteBtn.disabled = false;
  }
}

/**
 * Handle next word
 */
async function handleNextWord(): Promise<void> {
  const word = practiceWords[currentWordIndex];
  await markPracticed(word.word);
  
  currentWordIndex++;
  showWordPractice();
}

/**
 * Show completion screen
 */
async function showCompletionScreen(): Promise<void> {
  if (!practiceModal) return;

  // Update stats
  await incrementPracticeSessions();
  await incrementWordsLearned(practiceWords.length);

  const body = practiceModal.querySelector('#lexi-practice-body');
  const actions = practiceModal.querySelector('#lexi-practice-actions');

  if (body) {
    body.innerHTML = `
      <div class="lexi-practice-complete">
        <div class="lexi-confetti">🎉</div>
        <h3>Great Practice!</h3>
        <p>You practiced <strong>${practiceWords.length}</strong> word${practiceWords.length > 1 ? 's' : ''}!</p>
        <div class="lexi-practice-stats">
          +${practiceWords.length} words learned 📚
        </div>
      </div>
    `;
  }

  if (actions) {
    actions.innerHTML = `
      <button class="lexi-practice-btn lexi-practice-btn-success" id="lexi-done-btn">
        ✓ Done
      </button>
    `;

    const doneBtn = actions.querySelector('#lexi-done-btn');
    doneBtn?.addEventListener('click', closePractice);
  }
}

/**
 * Close practice modal
 */
export function closePractice(): void {
  if (practiceModal) {
    practiceModal.style.opacity = '0';
    setTimeout(() => {
      practiceModal?.remove();
      practiceModal = null;
      practiceWords = [];
      currentWordIndex = 0;
    }, ANIMATION.NORMAL);
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
