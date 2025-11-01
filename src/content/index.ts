// Content Script - Main Entry Point

import { initializeImmersiveMode } from './modules/immersiveToggle';
import { initializeHighlighter, highlightWords, removeAllHighlights } from './modules/wordHighlighter';
import { initializeHoverTooltip } from './modules/hoverTooltip';
import { initializeWordCard } from './modules/wordCard';
import { initializeArticleDetector } from './modules/articleDetector';
import { initializePracticeFlow } from './modules/practiceFlow';
import { initializeSummaryModal } from './modules/summaryModal';

console.log('📚 Lexi content script loaded');

/**
 * Initialize all modules
 */
function initialize(): void {
  // Initialize core modules
  initializeImmersiveMode();
  initializeHighlighter();
  initializeHoverTooltip();
  initializeWordCard();
  initializeArticleDetector();
  initializePracticeFlow();
  initializeSummaryModal();

  // Setup cross-module event coordination
  setupEventCoordination();

  console.log('✅ Lexi initialized');
}

/**
 * Setup event coordination between modules
 */
function setupEventCoordination(): void {
  // Listen for immersive mode changes
  document.addEventListener('immersive-mode-changed', (e: Event) => {
    const customEvent = e as CustomEvent;
    if (customEvent.detail.enabled) {
      highlightWords(customEvent.detail.level);
    } else {
      removeAllHighlights();
    }
  });

  // Listen for reading level changes
  document.addEventListener('reading-level-changed', (e: Event) => {
    const customEvent = e as CustomEvent;
    removeAllHighlights();
    highlightWords(customEvent.detail.level);
  });

  // Add CSS for all modules
  injectStyles();
}

/**
 * Inject CSS styles
 */
function injectStyles(): void {
  const style = document.createElement('style');
  style.id = 'lexi-styles';
  style.textContent = `
    /* Highlight styles */
    .lexi-highlight {
      text-decoration: underline;
      text-decoration-color: #3b82f6;
      text-decoration-thickness: 2px;
      text-underline-offset: 2px;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .lexi-highlight:hover {
      text-decoration-color: #2563eb;
      text-decoration-style: solid;
      background: rgba(59, 130, 246, 0.1);
    }

    /* Toggle styles */
    .lexi-toggle-header {
      padding: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
      border-bottom: 1px solid #e5e7eb;
      cursor: move;
    }

    .lexi-toggle-icon {
      font-size: 24px;
    }

    .lexi-toggle-title {
      flex: 1;
      font-weight: 600;
      font-size: 14px;
      color: #1f2937;
    }

    .lexi-toggle-minimize {
      width: 24px;
      height: 24px;
      border: none;
      background: #f3f4f6;
      border-radius: 4px;
      cursor: pointer;
      font-size: 18px;
      color: #6b7280;
    }

    .lexi-toggle-minimize:hover {
      background: #e5e7eb;
    }

    .lexi-toggle-content {
      padding: 16px;
    }

    .lexi-toggle-switch-container {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
    }

    .lexi-toggle-label {
      font-size: 13px;
      font-weight: 500;
      color: #374151;
    }

    .lexi-switch {
      position: relative;
      display: inline-block;
      width: 48px;
      height: 24px;
    }

    .lexi-switch input {
      opacity: 0;
      width: 0;
      height: 0;
    }

    .lexi-slider {
      position: absolute;
      cursor: pointer;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: #d1d5db;
      transition: 0.3s;
      border-radius: 24px;
    }

    .lexi-slider:before {
      position: absolute;
      content: "";
      height: 18px;
      width: 18px;
      left: 3px;
      bottom: 3px;
      background-color: white;
      transition: 0.3s;
      border-radius: 50%;
    }

    input:checked + .lexi-slider {
      background-color: #f97316;
    }

    input:checked + .lexi-slider:before {
      transform: translateX(24px);
    }

    .lexi-toggle-level {
      margin-bottom: 16px;
    }

    .lexi-select {
      width: 100%;
      padding: 8px 12px;
      border: 2px solid #e5e7eb;
      border-radius: 6px;
      font-size: 13px;
      margin-top: 6px;
      background: white;
      cursor: pointer;
    }

    .lexi-select:focus {
      outline: none;
      border-color: #f97316;
    }

    .lexi-summary-btn {
      width: 100%;
      padding: 10px;
      background: #a855f7;
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .lexi-summary-btn:hover {
      background: #9333ea;
      transform: translateY(-1px);
    }

    /* Tooltip styles */
    .lexi-tooltip-word {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }

    .lexi-tooltip-original {
      font-weight: 600;
      font-size: 15px;
      color: #1f2937;
    }

    .lexi-tooltip-translation {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
      padding-bottom: 12px;
      border-bottom: 1px solid #e5e7eb;
    }

    .lexi-tooltip-translated {
      font-size: 14px;
      color: #f97316;
      font-weight: 500;
    }

    .lexi-tooltip-speak {
      padding: 4px 8px;
      background: #f3f4f6;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.2s;
    }

    .lexi-tooltip-speak:hover {
      background: #e5e7eb;
      transform: scale(1.1);
    }

    .lexi-tooltip-add {
      width: 100%;
      padding: 8px 12px;
      background: #f97316;
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .lexi-tooltip-add:hover {
      background: #ea580c;
    }

    .lexi-tooltip-add:disabled {
      background: #d1d5db;
      cursor: not-allowed;
    }

    /* Card styles */
    .lexi-card-header {
      padding: 20px;
      border-bottom: 1px solid #e5e7eb;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .lexi-card-title {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
      color: #1f2937;
    }

    .lexi-card-close {
      width: 32px;
      height: 32px;
      border: none;
      background: #f3f4f6;
      border-radius: 50%;
      cursor: pointer;
      font-size: 24px;
      color: #6b7280;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }

    .lexi-card-close:hover {
      background: #e5e7eb;
    }

    .lexi-card-body {
      padding: 24px;
    }

    .lexi-card-word-section {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 24px;
      padding: 16px;
      background: #f9fafb;
      border-radius: 12px;
    }

    .lexi-word-item {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .lexi-word-flag {
      font-size: 20px;
    }

    .lexi-word-text {
      flex: 1;
      font-size: 18px;
      font-weight: 600;
      color: #1f2937;
    }

    .lexi-translation-text {
      color: #f97316;
    }

    .lexi-arrow {
      font-size: 24px;
      color: #9ca3af;
    }

    .lexi-word-speak {
      padding: 6px 12px;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      cursor: pointer;
      font-size: 12px;
      transition: all 0.2s;
    }

    .lexi-word-speak:hover {
      background: #f3f4f6;
      transform: scale(1.05);
    }

    .lexi-card-example {
      margin-bottom: 24px;
    }

    .lexi-example-title {
      font-size: 13px;
      font-weight: 600;
      color: #6b7280;
      margin: 0 0 8px 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .lexi-example-text {
      font-size: 14px;
      line-height: 1.6;
      color: #374151;
      padding: 12px;
      background: #fef3c7;
      border-left: 3px solid #f59e0b;
      border-radius: 4px;
      margin: 0;
    }

    .lexi-card-actions {
      display: flex;
      gap: 12px;
    }

    .lexi-card-btn {
      flex: 1;
      padding: 12px;
      border: none;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .lexi-card-btn-primary {
      background: #a855f7;
      color: white;
    }

    .lexi-card-btn-primary:hover {
      background: #9333ea;
      transform: translateY(-1px);
    }

    .lexi-card-btn-secondary {
      background: #f97316;
      color: white;
    }

    .lexi-card-btn-secondary:hover {
      background: #ea580c;
      transform: translateY(-1px);
    }

    .lexi-card-btn-success {
      background: #10b981;
      color: white;
    }

    .lexi-card-btn-success:hover {
      background: #059669;
      transform: translateY(-1px);
    }

    /* Selection Widget */
    .lexi-selection-widget {
      background: white;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(0, 0, 0, 0.05);
      overflow: hidden;
    }

    .lexi-selection-actions {
      display: flex;
      gap: 0;
      padding: 4px;
    }

    .lexi-selection-btn {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      padding: 10px 8px;
      border: none;
      background: transparent;
      cursor: pointer;
      transition: all 0.2s;
      border-radius: 8px;
    }

    .lexi-selection-btn:hover {
      background: #f97316;
      transform: translateY(-1px);
    }

    .lexi-selection-btn:hover .lexi-selection-icon {
      transform: scale(1.15);
    }

    .lexi-selection-btn:hover .lexi-selection-label {
      color: white;
    }

    .lexi-selection-icon {
      font-size: 20px;
      transition: transform 0.2s;
    }

    .lexi-selection-label {
      font-size: 11px;
      font-weight: 600;
      color: #78350f;
      transition: color 0.2s;
    }

    .lexi-selection-result {
      border-top: 2px solid #fed7aa;
      padding: 12px;
      background: #fffbeb;
    }

    .lexi-selection-loading {
      text-align: center;
      color: #92400e;
      font-size: 13px;
      padding: 8px;
    }

    .lexi-selection-error {
      text-align: center;
      color: #dc2626;
      font-size: 13px;
      padding: 8px;
    }

    .lexi-selection-translation,
    .lexi-selection-rewrite {
      font-size: 13px;
    }

    .lexi-selection-translation-header,
    .lexi-selection-rewrite-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .lexi-selection-translation-label,
    .lexi-selection-rewrite-label {
      font-weight: 600;
      color: #92400e;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .lexi-selection-speak-result {
      background: #f97316;
      border: none;
      border-radius: 6px;
      padding: 4px 8px;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .lexi-selection-speak-result:hover {
      background: #ea580c;
      transform: scale(1.1);
    }

    .lexi-selection-translation-text,
    .lexi-selection-rewrite-text {
      color: #1f2937;
      line-height: 1.5;
      padding: 10px 12px;
      background: white;
      border-radius: 8px;
      border-left: 3px solid #f97316;
    }

    .lexi-selection-rewrite-actions {
      display: flex;
      gap: 8px;
      margin-top: 10px;
    }

    .lexi-selection-apply-btn,
    .lexi-selection-copy-btn {
      flex: 1;
      padding: 8px 12px;
      border: none;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .lexi-selection-apply-btn {
      background: #f97316;
      color: white;
    }

    .lexi-selection-apply-btn:hover {
      background: #ea580c;
      transform: translateY(-1px);
    }

    .lexi-selection-copy-btn {
      background: #fed7aa;
      color: #92400e;
    }

    .lexi-selection-copy-btn:hover {
      background: #fdba74;
    }

    /* Animation */
    @keyframes slideInUp {
      from {
        transform: translateY(20px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }
  `;

  document.head.appendChild(style);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}
