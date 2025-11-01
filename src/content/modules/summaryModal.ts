// Summary Modal - Article summarizer

import { summarize, extractArticleContent } from '../services/summarizerService';
import { updateData } from '../storage/storageManager';
import { createElement } from '../utils/domHelpers';
import { Z_INDEX, ANIMATION, LIMITS } from '../utils/constants';
import type { SummaryData } from '../types';

let summaryModal: HTMLElement | null = null;

/**
 * Initialize summary modal
 */
export function initializeSummaryModal(): void {
  // Listen for summary button click
  document.addEventListener('open-summary-modal', showSummaryModal);
}

/**
 * Show summary modal
 */
export function showSummaryModal(): void {
  if (summaryModal) return;

  summaryModal = createSummaryModal();
  document.body.appendChild(summaryModal);

  // Fade in
  requestAnimationFrame(() => {
    if (summaryModal) {
      summaryModal.style.opacity = '1';
    }
  });
}

/**
 * Create summary modal
 */
function createSummaryModal(): HTMLElement {
  const modal = createElement('div', 'lexi-summary-modal');

  modal.innerHTML = `
    <div class="lexi-summary-overlay"></div>
    <div class="lexi-summary-container">
      <div class="lexi-summary-header">
        <h2>📝 Quick Summary</h2>
        <button class="lexi-summary-close" id="lexi-summary-close">×</button>
      </div>
      
      <div class="lexi-summary-body">
        <div class="lexi-summary-options">
          <div class="lexi-summary-option">
            <label>Summary Type</label>
            <select id="lexi-summary-type">
              <option value="key-points">Key Points</option>
              <option value="tl;dr">TL;DR</option>
              <option value="teaser">Teaser</option>
              <option value="headline">Headline</option>
            </select>
          </div>
          
          <div class="lexi-summary-option">
            <label>Length</label>
            <select id="lexi-summary-length">
              <option value="short">Short</option>
              <option value="medium">Medium</option>
              <option value="long">Long</option>
            </select>
          </div>
        </div>
        
        <button class="lexi-summary-btn" id="lexi-generate-btn">
          ✨ Generate Summary
        </button>
        
        <div id="lexi-summary-result" class="lexi-summary-result"></div>
      </div>
    </div>
  `;

  applyModalStyles(modal);
  attachListeners(modal);

  return modal;
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
    opacity: 0;
    transition: opacity ${ANIMATION.NORMAL}ms ease;
  `;
  modal.style.cssText = styles;
}

/**
 * Attach event listeners
 */
function attachListeners(modal: HTMLElement): void {
  // Close button
  const closeBtn = modal.querySelector('#lexi-summary-close');
  closeBtn?.addEventListener('click', hideSummaryModal);

  // Overlay click
  const overlay = modal.querySelector('.lexi-summary-overlay');
  overlay?.addEventListener('click', hideSummaryModal);

  // Generate button
  const generateBtn = modal.querySelector('#lexi-generate-btn');
  generateBtn?.addEventListener('click', handleGenerateSummary);
}

/**
 * Handle generate summary
 */
async function handleGenerateSummary(): Promise<void> {
  const typeSelect = document.getElementById('lexi-summary-type') as HTMLSelectElement;
  const lengthSelect = document.getElementById('lexi-summary-length') as HTMLSelectElement;
  const resultDiv = document.getElementById('lexi-summary-result');
  const generateBtn = document.getElementById('lexi-generate-btn') as HTMLButtonElement;

  if (!typeSelect || !lengthSelect || !resultDiv || !generateBtn) return;

  const type = typeSelect.value as 'key-points' | 'tl;dr' | 'teaser' | 'headline';
  const length = lengthSelect.value as 'short' | 'medium' | 'long';

  // Show loading
  generateBtn.disabled = true;
  generateBtn.textContent = '⏳ Generating...';
  resultDiv.innerHTML = '<div class="lexi-summary-loading">Analyzing article...</div>';
  resultDiv.style.display = 'block';

  try {
    // Extract article content
    const content = extractArticleContent();
    
    if (content.length < 100) {
      throw new Error('Not enough content to summarize. Try selecting a longer article.');
    }

    // Generate summary
    const summary = await summarize(content, type, length);

    // Display result
    displaySummary(summary, type);

    // Save to storage
    await saveSummary(content, summary, type, length);

  } catch (error) {
    resultDiv.innerHTML = `
      <div class="lexi-summary-error">
        ❌ ${(error as Error).message || 'Summarization failed'}
      </div>
    `;
  } finally {
    generateBtn.disabled = false;
    generateBtn.textContent = '✨ Generate Summary';
  }
}

/**
 * Display summary
 */
function displaySummary(summary: string, type: string): void {
  const resultDiv = document.getElementById('lexi-summary-result');
  if (!resultDiv) return;

  const typeLabels: Record<string, string> = {
    'key-points': '🎯 Key Points',
    'tl;dr': '⚡ TL;DR',
    'teaser': '📖 Teaser',
    'headline': '📰 Headline',
  };

  resultDiv.innerHTML = `
    <div class="lexi-summary-content">
      <h3>${typeLabels[type] || 'Summary'}</h3>
      <div class="lexi-summary-text">${escapeHtml(summary)}</div>
      <div class="lexi-summary-actions">
        <button class="lexi-summary-action-btn" id="lexi-copy-summary">
          📋 Copy
        </button>
        <button class="lexi-summary-action-btn" id="lexi-save-summary">
          💾 Save to Dashboard
        </button>
      </div>
    </div>
  `;

  // Attach action listeners
  const copyBtn = resultDiv.querySelector('#lexi-copy-summary');
  copyBtn?.addEventListener('click', () => copySummary(summary));

  const saveBtn = resultDiv.querySelector('#lexi-save-summary');
  saveBtn?.addEventListener('click', () => {
    if (saveBtn) {
      saveBtn.textContent = '✓ Saved';
      (saveBtn as HTMLButtonElement).disabled = true;
    }
  });
}

/**
 * Copy summary to clipboard
 */
async function copySummary(summary: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(summary);
    const copyBtn = document.getElementById('lexi-copy-summary');
    if (copyBtn) {
      const originalText = copyBtn.textContent;
      copyBtn.textContent = '✓ Copied';
      setTimeout(() => {
        copyBtn.textContent = originalText;
      }, 2000);
    }
  } catch (error) {
    console.error('Copy failed:', error);
  }
}

/**
 * Save summary to storage
 */
async function saveSummary(
  original: string,
  summary: string,
  type: 'key-points' | 'tl;dr' | 'teaser' | 'headline',
  length: 'short' | 'medium' | 'long'
): Promise<void> {
  const summaryData: SummaryData = {
    url: window.location.href,
    original: original.substring(0, 500), // Store excerpt
    summary,
    type,
    length,
    timestamp: Date.now(),
  };

  await updateData<SummaryData[]>('summaries', (current) => {
    const summaries = current || [];
    summaries.unshift(summaryData);
    
    // Limit summaries
    if (summaries.length > LIMITS.MAX_SUMMARIES) {
      summaries.splice(LIMITS.MAX_SUMMARIES);
    }
    
    return summaries;
  });
}

/**
 * Hide summary modal
 */
export function hideSummaryModal(): void {
  if (summaryModal) {
    summaryModal.style.opacity = '0';
    setTimeout(() => {
      summaryModal?.remove();
      summaryModal = null;
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
