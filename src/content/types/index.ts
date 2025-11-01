// Type definitions for Lexi

export interface UserSettings {
  targetLanguage: string;
  nativeLanguage: string;
  readingLevel: 'beginner' | 'intermediate' | 'advanced';
  theme: 'light' | 'dark';
}

export interface WordData {
  word: string;
  translation: string;
  sourceLang: string;
  targetLang: string;
  timestamp: number;
  reviewCount: number;
  practiced: boolean;
  articleUrl: string;
}

export interface ArticleData {
  url: string;
  title: string;
  timestamp: number;
  wordCount: number;
  wordsLookedUp: string[];
}

export interface PracticeSession {
  word: string;
  sentence: string;
  feedback: string;
  rewrittenSentence?: string;
  timestamp: number;
}

export interface SummaryData {
  url: string;
  original: string;
  summary: string;
  type: 'key-points' | 'tl;dr' | 'teaser' | 'headline';
  length: 'short' | 'medium' | 'long';
  timestamp: number;
}

export interface LearningStats {
  articlesRead: number;
  wordsLearned: number;
  practiceSessions: number;
  currentStreak: number;
  lastActiveDate: string;
}

export interface TranslationResult {
  original: string;
  translation: string;
  sourceLang: string;
  targetLang: string;
}

export interface GrammarResult {
  corrections: Array<{
    type: string;
    message: string;
    offset: number;
    length: number;
  }>;
  correctedText: string;
}
