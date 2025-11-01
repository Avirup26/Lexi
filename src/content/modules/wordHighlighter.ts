// Word Highlighter - Scan page and highlight difficult words

import { shouldHighlight, isValidWord, normalizeWord } from '../utils/wordFrequency';
import { findTextNodes, wrapWord, removeHighlights } from '../utils/domHelpers';
import { CLASS_NAMES } from '../utils/constants';

let observer: MutationObserver | null = null;
let isHighlighting = false;

/**
 * Initialize word highlighter
 */
export function initializeHighlighter(): void {
  // Listen for immersive mode changes
  document.addEventListener('immersive-mode-changed', (e: Event) => {
    const customEvent = e as CustomEvent;
    if (customEvent.detail.enabled) {
      highlightWords(customEvent.detail.level);
      startObserving();
    } else {
      removeAllHighlights();
      stopObserving();
    }
  });

  // Listen for level changes
  document.addEventListener('reading-level-changed', (e: Event) => {
    const customEvent = e as CustomEvent;
    removeAllHighlights();
    highlightWords(customEvent.detail.level);
  });
}

/**
 * Highlight words based on reading level
 */
export function highlightWords(level: 'beginner' | 'intermediate' | 'advanced'): void {
  if (isHighlighting) return;
  isHighlighting = true;

  try {
    // Find main content areas
    const contentAreas = getContentAreas();

    for (const area of contentAreas) {
      const textNodes = findTextNodes(area);

      for (const textNode of textNodes) {
        highlightTextNode(textNode, level);
      }
    }
  } finally {
    isHighlighting = false;
  }
}

/**
 * Get main content areas (avoid nav, header, etc.)
 */
function getContentAreas(): Element[] {
  const areas: Element[] = [];

  // Try common content selectors
  const selectors = [
    'article',
    'main',
    '[role="main"]',
    '.content',
    '.post',
    '.article',
  ];

  for (const selector of selectors) {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => areas.push(el));
  }

  // Fallback to body if no content areas found
  if (areas.length === 0) {
    // Get all paragraphs
    const paragraphs = document.querySelectorAll('p');
    paragraphs.forEach(p => {
      if (!isInExcludedArea(p)) {
        areas.push(p);
      }
    });
  }

  return areas;
}

/**
 * Check if element is in excluded area
 */
function isInExcludedArea(element: Element): boolean {
  const excludedTags = ['nav', 'header', 'footer', 'aside', 'button', 'form'];
  
  let current: Element | null = element;
  while (current) {
    if (excludedTags.includes(current.tagName.toLowerCase())) {
      return true;
    }
    if (current.hasAttribute('role') && 
        ['navigation', 'banner', 'contentinfo', 'complementary'].includes(current.getAttribute('role')!)) {
      return true;
    }
    current = current.parentElement;
  }
  
  return false;
}

/**
 * Highlight words in text node
 */
function highlightTextNode(
  textNode: Text,
  level: 'beginner' | 'intermediate' | 'advanced'
): void {
  const text = textNode.textContent || '';
  const words = extractUniqueWords(text);

  for (const word of words) {
    if (isValidWord(word) && shouldHighlight(word, level)) {
      wrapWord(textNode, word, CLASS_NAMES.HIGHLIGHT);
    }
  }
}

/**
 * Extract unique words from text
 */
function extractUniqueWords(text: string): string[] {
  const words = text.match(/\b[a-zA-Z]{3,}\b/g) || [];
  const normalized = words.map(normalizeWord);
  return Array.from(new Set(normalized));
}

/**
 * Remove all highlights
 */
export function removeAllHighlights(): void {
  removeHighlights(CLASS_NAMES.HIGHLIGHT);
  
  // Also normalize merged text nodes
  normalizeTextNodes();
}

/**
 * Normalize text nodes (merge adjacent text nodes)
 */
function normalizeTextNodes(): void {
  const contentAreas = getContentAreas();
  for (const area of contentAreas) {
    area.normalize();
  }
}

/**
 * Start observing DOM changes
 */
function startObserving(): void {
  if (observer) return;

  observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        // New content added, highlight it
        for (const node of Array.from(mutation.addedNodes)) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            if (!isInExcludedArea(element)) {
              const textNodes = findTextNodes(element);
              const level = getCurrentLevel();
              textNodes.forEach(textNode => highlightTextNode(textNode, level));
            }
          }
        }
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

/**
 * Stop observing DOM changes
 */
function stopObserving(): void {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
}

/**
 * Get current reading level from toggle
 */
function getCurrentLevel(): 'beginner' | 'intermediate' | 'advanced' {
  // Try to get from select element
  const levelSelect = document.getElementById('lexi-level-select') as HTMLSelectElement;
  if (levelSelect) {
    return levelSelect.value as 'beginner' | 'intermediate' | 'advanced';
  }
  return 'beginner';
}

/**
 * Get all highlighted words on page
 */
export function getHighlightedWords(): string[] {
  const highlights = document.querySelectorAll(`.${CLASS_NAMES.HIGHLIGHT}`);
  const words = Array.from(highlights).map(el => el.textContent || '');
  return Array.from(new Set(words.map(normalizeWord)));
}

/**
 * Count highlighted words
 */
export function countHighlightedWords(): number {
  return document.querySelectorAll(`.${CLASS_NAMES.HIGHLIGHT}`).length;
}
