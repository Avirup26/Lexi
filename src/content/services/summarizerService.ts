// Summarizer Service - Wrapper for Chrome Summarizer API

/**
 * Summarize text using Chrome's Summarizer API
 */
export async function summarize(
  text: string,
  type: 'key-points' | 'tl;dr' | 'teaser' | 'headline',
  length: 'short' | 'medium' | 'long'
): Promise<string> {
  try {
    // Check if Summarizer API is available
    if (!(self as any).Summarizer) {
      throw new Error('Summarizer API not available');
    }

    // Check availability
    const availability = await (self as any).Summarizer.availability();
    if (availability !== 'readily' && availability !== 'available') {
      throw new Error(`Summarizer not ready. Status: ${availability}`);
    }

    // Create summarizer instance
    const summarizer = await (self as any).Summarizer.create({
      type: type,
      format: 'markdown',
      length: length,
    });

    // Generate summary
    const result = await summarizer.summarize(text);

    // Clean up
    summarizer.destroy?.();

    return result;
  } catch (error) {
    console.error('Summarization error:', error);
    throw error;
  }
}

/**
 * Check if Summarizer API is available
 */
export async function isSummarizerAvailable(): Promise<boolean> {
  try {
    if (!(self as any).Summarizer) {
      return false;
    }

    const availability = await (self as any).Summarizer.availability();
    return availability === 'readily' || availability === 'available';
  } catch {
    return false;
  }
}

/**
 * Get quick summary (TL;DR, short)
 */
export async function getQuickSummary(text: string): Promise<string> {
  return summarize(text, 'tl;dr', 'short');
}

/**
 * Get key points from text
 */
export async function getKeyPoints(text: string): Promise<string> {
  return summarize(text, 'key-points', 'medium');
}

/**
 * Get headline/title for text
 */
export async function getHeadline(text: string): Promise<string> {
  return summarize(text, 'headline', 'short');
}

/**
 * Extract main article content from page
 */
export function extractArticleContent(): string {
  // Try to find main content
  const article = document.querySelector('article');
  if (article) {
    return article.innerText.trim();
  }

  // Fallback: look for main
  const main = document.querySelector('main');
  if (main) {
    return main.innerText.trim();
  }

  // Fallback: get all paragraphs
  const paragraphs = Array.from(document.querySelectorAll('p'));
  const text = paragraphs
    .map(p => p.innerText.trim())
    .filter(t => t.length > 50)
    .join('\n\n');

  return text;
}
