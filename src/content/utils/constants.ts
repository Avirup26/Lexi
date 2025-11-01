// Constants for Lexi

// Brand colors (warm palette)
export const COLORS = {
  PRIMARY: '#f97316',      // Warm orange
  SECONDARY: '#0d9488',    // Teal
  ACCENT: '#a855f7',       // Purple
  SUCCESS: '#10b981',      // Green
  WARNING: '#f59e0b',      // Amber
  ERROR: '#ef4444',        // Red
  TEXT_DARK: '#1f2937',    // Dark gray
  TEXT_LIGHT: '#6b7280',   // Light gray
  BG_LIGHT: '#f9fafb',     // Very light gray
  BG_WHITE: '#ffffff',
} as const;

// Animation durations (in milliseconds)
export const ANIMATION = {
  FAST: 200,
  NORMAL: 300,
  SLOW: 500,
  TOOLTIP_DELAY: 500,
  TOOLTIP_HIDE_DELAY: 300,
} as const;

// Storage limits
export const LIMITS = {
  MAX_VOCABULARY_SIZE: 1000,
  MAX_TRANSLATION_HISTORY: 100,
  MAX_ARTICLES: 50,
  MAX_SUMMARIES: 20,
} as const;

// CSS class names
export const CLASS_NAMES = {
  HIGHLIGHT: 'lexi-highlight',
  TOOLTIP: 'lexi-tooltip',
  MODAL: 'lexi-modal',
  TOGGLE: 'lexi-toggle',
  OVERLAY: 'lexi-overlay',
} as const;

// Z-index layers
export const Z_INDEX = {
  HIGHLIGHT: 1,
  TOOLTIP: 10000,
  TOGGLE: 10001,
  MODAL: 10002,
  OVERLAY: 9999,
} as const;

// Reading levels
export const READING_LEVELS = ['beginner', 'intermediate', 'advanced'] as const;

// Language codes
export const LANGUAGES = {
  'en': 'English',
  'es': 'Spanish',
  'fr': 'French',
  'de': 'German',
  'it': 'Italian',
  'pt': 'Portuguese',
  'ja': 'Japanese',
  'ko': 'Korean',
  'zh': 'Chinese',
} as const;

export const DEFAULT_SETTINGS = {
  targetLanguage: 'es',
  nativeLanguage: 'en',
  readingLevel: 'beginner' as const,
  theme: 'light' as const,
};
