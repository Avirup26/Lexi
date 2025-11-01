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
    <div class="lexi-summary-backdrop" style="
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 30px;
      animation: fadeIn 0.2s ease;
    "></div>
    <div class="lexi-summary-container" style="
      position: relative;
      background: white;
      border-radius: 16px;
      width: 100%;
      max-width: 560px;
      max-height: 85vh;
      overflow: hidden;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
      display: flex;
      flex-direction: column;
      animation: scaleIn 0.2s ease;
    ">
      <div class="lexi-summary-header" style="
        padding: 24px;
        background: linear-gradient(135deg, #a855f7 0%, #9333ea 100%);
        color: white;
        position: relative;
      ">
        <div style="font-size: 24px; font-weight: 700; margin-bottom: 4px; display: flex; align-items: center; gap: 10px;">
          <span>📝</span> Quick Summary
        </div>
        <div style="font-size: 14px; opacity: 0.9; font-weight: 400;">AI-powered text summarization</div>
        <button class="lexi-summary-close" id="lexi-summary-close" style="
          position: absolute;
          top: 16px;
          right: 16px;
          width: 40px;
          height: 40px;
          border: none;
          background: rgba(255, 255, 255, 0.2);
          color: white;
          border-radius: 8px;
          font-size: 20px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s ease;
        ">✕</button>
      </div>
      
      <div class="lexi-summary-body" style="background: #f9fafb; padding: 24px; overflow-y: auto; overflow-x: hidden; flex: 1;">
        <div class="lexi-summary-options" style="
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
          margin-bottom: 20px;
        ">
          <div class="lexi-summary-option">
            <label style="display: block; font-size: 14px; font-weight: 600; color: #374151; margin-bottom: 8px;">Summary Type</label>
            <select id="lexi-summary-type" style="
              width: 100%;
              padding: 11px 14px;
              border: 1px solid #d1d5db;
              border-radius: 8px;
              background: white;
              font-size: 15px;
              color: #111827;
              cursor: pointer;
              transition: all 0.2s ease;
              box-sizing: border-box;
            ">
                <option value="key-points">Key Points</option>
                <option value="tl;dr">TL;DR</option>
                <option value="teaser">Teaser</option>
                <option value="headline">Headline</option>
              </select>
          </div>
          
          <div class="lexi-summary-option">
            <label style="display: block; font-size: 14px; font-weight: 600; color: #374151; margin-bottom: 8px;">Length</label>
            <select id="lexi-summary-length" style="
              width: 100%;
              padding: 11px 14px;
              border: 1px solid #d1d5db;
              border-radius: 8px;
              background: white;
              font-size: 15px;
              color: #111827;
              cursor: pointer;
              transition: all 0.2s ease;
              box-sizing: border-box;
            ">
                <option value="short">Short</option>
                <option value="medium" selected>Medium</option>
                <option value="long">Long</option>
              </select>
          </div>
        </div>
        
        <div style="margin-bottom: 24px;">
          <div style="font-size: 14px; font-weight: 600; color: #374151; margin-bottom: 4px;">
            Original Text (Optional)
          </div>
          <div style="font-size: 13px; color: #9ca3af; margin-bottom: 8px;">
            Leave empty to summarize current article
          </div>
          <textarea id="lexi-summary-input" placeholder="Paste text here to summarize, or leave empty to summarize the current article..." style="
            width: 100%;
            min-height: 160px;
            max-height: 300px;
            padding: 13px 14px;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            background: white;
            font-size: 14px;
            line-height: 1.6;
            color: #111827;
            resize: vertical;
            font-family: inherit;
            transition: all 0.2s ease;
            box-sizing: border-box;
          "></textarea>
        </div>
        
        <div id="lexi-summary-result" class="lexi-summary-result" style="margin-top: 20px;"></div>
      </div>
      
      <div class="lexi-summary-footer" style="
        padding: 20px 24px;
        background: white;
        border-top: 1px solid #e5e7eb;
      ">
        <button class="lexi-summary-btn" id="lexi-generate-btn" style="
          width: 100%;
          padding: 15px;
          background: linear-gradient(135deg, #a855f7 0%, #9333ea 100%);
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s ease;
          box-sizing: border-box;
        ">
          <span>✨</span> Generate Summary
        </button>
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
  // Add keyframe animations if not already added
  if (!document.getElementById('lexi-summary-animations')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'lexi-summary-animations';
    styleSheet.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes scaleIn {
        from {
          opacity: 0;
          transform: scale(0.95);
        }
        to {
          opacity: 1;
          transform: scale(1);
        }
      }
      .lexi-summary-close:hover {
        background: rgba(255, 255, 255, 0.3) !important;
      }
      #lexi-generate-btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(168, 85, 247, 0.3);
      }
      #lexi-generate-btn:active {
        transform: translateY(0);
      }
      .lexi-summary-backdrop {
        cursor: pointer;
      }
      .lexi-summary-container {
        cursor: default;
      }
    `;
    document.head.appendChild(styleSheet);
  }

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
    font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
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

  // Backdrop click (close modal)
  const backdrop = modal.querySelector('.lexi-summary-backdrop');
  backdrop?.addEventListener('click', (e) => {
    if (e.target === backdrop) {
      hideSummaryModal();
    }
  });

  // Prevent clicks on container from closing modal
  const container = modal.querySelector('.lexi-summary-container');
  container?.addEventListener('click', (e) => {
    e.stopPropagation();
  });

  // Generate button
  const generateBtn = modal.querySelector('#lexi-generate-btn');
  generateBtn?.addEventListener('click', handleGenerateSummary);

  // ESC key to close
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      hideSummaryModal();
    }
  };
  document.addEventListener('keydown', handleEscape);
  
  // Store cleanup function
  (modal as any)._cleanup = () => {
    document.removeEventListener('keydown', handleEscape);
  };
}

/**
 * Handle generate summary
 */
async function handleGenerateSummary(): Promise<void> {
  const typeSelect = document.getElementById('lexi-summary-type') as HTMLSelectElement;
  const lengthSelect = document.getElementById('lexi-summary-length') as HTMLSelectElement;
  const inputTextarea = document.getElementById('lexi-summary-input') as HTMLTextAreaElement;
  const resultDiv = document.getElementById('lexi-summary-result');
  const generateBtn = document.getElementById('lexi-generate-btn') as HTMLButtonElement;

  if (!typeSelect || !lengthSelect || !resultDiv || !generateBtn) return;

  const type = typeSelect.value as 'key-points' | 'tl;dr' | 'teaser' | 'headline';
  const length = lengthSelect.value as 'short' | 'medium' | 'long';

  // Show loading
  generateBtn.disabled = true;
  generateBtn.textContent = '⏳ Generating...';
  resultDiv.innerHTML = '<div class="lexi-summary-loading">Analyzing text...</div>';
  resultDiv.style.display = 'block';

  try {
    // Get content from textarea if provided, otherwise extract from article
    let content = inputTextarea?.value.trim() || '';
    
    if (!content) {
      // Extract article content
      content = extractArticleContent();
    }
    
    if (content.length < 100) {
      throw new Error('Not enough content to summarize. Paste at least 100 characters of text.');
    }

    console.log('[Lexi] Summarizing', content.length, 'characters');

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
    // Call cleanup function if it exists
    if ((summaryModal as any)._cleanup) {
      (summaryModal as any)._cleanup();
    }
    
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
