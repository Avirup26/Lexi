// Article Detector - Detect when user finishes reading

import { addArticle } from '../storage/articlesStorage';
import { getWordsForCurrentPage } from '../storage/articlesStorage';
import { incrementArticlesRead } from '../storage/statsStorage';
import type { ArticleData } from '../types';

let hasDetectedCompletion = false;
let scrollThreshold = 0.8; // 80% scrolled
let scrollCheckInterval: number | null = null;

/**
 * Initialize article detector
 */
export function initializeArticleDetector(): void {
  // Start monitoring scroll
  startScrollMonitoring();
  
  // Listen for immersive mode activation
  document.addEventListener('immersive-mode-changed', (e: Event) => {
    const customEvent = e as CustomEvent;
    if (customEvent.detail.enabled) {
      resetDetection();
    }
  });
}

/**
 * Start scroll monitoring
 */
function startScrollMonitoring(): void {
  if (scrollCheckInterval) return;

  window.addEventListener('scroll', handleScroll, { passive: true });
  
  // Also check periodically
  scrollCheckInterval = window.setInterval(checkScrollPosition, 2000);
}

/**
 * Handle scroll event
 */
function handleScroll(): void {
  checkScrollPosition();
}

/**
 * Check scroll position
 */
function checkScrollPosition(): void {
  if (hasDetectedCompletion) return;

  const scrollPosition = window.scrollY + window.innerHeight;
  const documentHeight = document.documentElement.scrollHeight;
  const scrollPercentage = scrollPosition / documentHeight;

  if (scrollPercentage >= scrollThreshold) {
    detectReadingCompletion();
  }
}

/**
 * Detect reading completion
 */
export async function detectReadingCompletion(): Promise<void> {
  if (hasDetectedCompletion) return;
  hasDetectedCompletion = true;

  console.log('📖 Article reading completed!');

  // Get article data
  const articleData = await gatherArticleData();
  
  // Save article
  await addArticle(articleData);
  await incrementArticlesRead();

  // Emit event
  document.dispatchEvent(new CustomEvent('article-read-complete', {
    detail: { articleData }
  }));
}

/**
 * Gather article data
 */
async function gatherArticleData(): Promise<ArticleData> {
  const url = window.location.href;
  const title = getArticleTitle();
  const wordCount = estimateWordCount();
  const wordsLookedUp = await getWordsForCurrentPage();

  return {
    url,
    title,
    timestamp: Date.now(),
    wordCount,
    wordsLookedUp,
  };
}

/**
 * Get article title
 */
function getArticleTitle(): string {
  // Try document title
  let title = document.title;

  // Try h1
  const h1 = document.querySelector('h1');
  if (h1 && h1.textContent) {
    title = h1.textContent.trim();
  }

  // Try og:title
  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) {
    const content = ogTitle.getAttribute('content');
    if (content) {
      title = content;
    }
  }

  return title;
}

/**
 * Estimate word count
 */
function estimateWordCount(): number {
  // Get main content
  const article = document.querySelector('article') || document.querySelector('main');
  const content = article?.textContent || document.body.textContent || '';
  
  // Count words (rough estimate)
  const words = content.trim().split(/\s+/);
  return words.length;
}

/**
 * Reset detection (for new page or re-reading)
 */
function resetDetection(): void {
  hasDetectedCompletion = false;
}

/**
 * Stop monitoring
 */
export function stopMonitoring(): void {
  window.removeEventListener('scroll', handleScroll);
  if (scrollCheckInterval) {
    clearInterval(scrollCheckInterval);
    scrollCheckInterval = null;
  }
}

/**
 * Set scroll threshold
 */
export function setScrollThreshold(threshold: number): void {
  scrollThreshold = Math.max(0, Math.min(1, threshold));
}
