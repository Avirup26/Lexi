// Word Frequency - Determine word difficulty based on frequency

// Top 1000 most common words (beginner level)
export const BEGINNER_WORDS = new Set([
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
  'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
  'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
  'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what',
  'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me',
  'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know', 'take',
  'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see', 'other',
  'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also',
  'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well', 'way',
  'even', 'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most', 'us',
  // Add more common words...
  'is', 'are', 'was', 'were', 'been', 'has', 'had', 'does', 'did', 'done',
  'am', 'going', 'where', 'here', 'why', 'how', 'much', 'many', 'more', 'very',
  'should', 'must', 'may', 'might', 'can', 'could', 'would', 'should', 'need', 'want',
]);

// Words 1001-5000 (intermediate level)
export const INTERMEDIATE_WORDS = new Set([
  'government', 'administration', 'policy', 'economic', 'social', 'political',
  'develop', 'system', 'program', 'community', 'issue', 'service', 'national',
  'public', 'process', 'information', 'change', 'include', 'provide', 'continue',
  'require', 'individual', 'particular', 'available', 'important', 'support',
  'different', 'however', 'increase', 'become', 'significant', 'interest',
  // Add more intermediate words...
]);

/**
 * Get word difficulty level
 */
export function getWordDifficulty(word: string): 'beginner' | 'intermediate' | 'advanced' {
  const normalized = word.toLowerCase().trim();

  if (BEGINNER_WORDS.has(normalized)) {
    return 'beginner';
  }

  if (INTERMEDIATE_WORDS.has(normalized)) {
    return 'intermediate';
  }

  return 'advanced';
}

/**
 * Check if word should be highlighted based on user level
 */
export function shouldHighlight(word: string, userLevel: 'beginner' | 'intermediate' | 'advanced'): boolean {
  const difficulty = getWordDifficulty(word);

  // Beginners see intermediate and advanced words
  if (userLevel === 'beginner') {
    return difficulty === 'intermediate' || difficulty === 'advanced';
  }

  // Intermediate users see only advanced words
  if (userLevel === 'intermediate') {
    return difficulty === 'advanced';
  }

  // Advanced users see nothing (or rare/technical words)
  return false;
}

/**
 * Check if word is valid for highlighting
 */
export function isValidWord(word: string): boolean {
  // Must be at least 3 characters
  if (word.length < 3) {
    return false;
  }

  // Must contain at least one letter
  if (!/[a-zA-Z]/.test(word)) {
    return false;
  }

  // Should not be a number
  if (/^\d+$/.test(word)) {
    return false;
  }

  // Should not be all punctuation
  if (/^[^a-zA-Z0-9]+$/.test(word)) {
    return false;
  }

  return true;
}

/**
 * Clean word for comparison
 */
export function normalizeWord(word: string): string {
  return word
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .trim();
}

/**
 * Extract words from text
 */
export function extractWords(text: string): string[] {
  // Split on whitespace and punctuation
  const words = text.split(/\s+|[.,;:!?()[\]{}]/);
  
  return words
    .filter(isValidWord)
    .map(normalizeWord)
    .filter(word => word.length > 0);
}
