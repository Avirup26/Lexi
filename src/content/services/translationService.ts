// Translation Service - Wrapper for Chrome Translation API

import type { TranslationResult } from '../types';

/**
 * Translate text using Chrome's Translation API
 */
export async function translateText(
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<string> {
  try {
    // Check if Translation API is available
    if (!('translation' in self)) {
      throw new Error('Translation API not available');
    }

    const translator = await (self as any).translation.createTranslator({
      sourceLanguage: sourceLang,
      targetLanguage: targetLang,
    });

    const result = await translator.translate(text);
    translator.destroy?.();
    
    return result;
  } catch (error) {
    console.error('Translation error:', error);
    throw error;
  }
}

/**
 * Detect language of text
 */
export async function detectLanguage(text: string): Promise<string> {
  try {
    // Use language detection if available
    if ('translation' in self && 'detectLanguage' in (self as any).translation) {
      const result = await (self as any).translation.detectLanguage(text);
      return result.language || 'en';
    }
    
    // Fallback: assume English
    return 'en';
  } catch (error) {
    console.error('Language detection error:', error);
    return 'en';
  }
}

/**
 * Check if Translation API is available
 */
export async function isTranslationAvailable(): Promise<boolean> {
  try {
    if (!('translation' in self)) {
      return false;
    }

    // Try to check capabilities
    if ('canTranslate' in (self as any).translation) {
      const result = await (self as any).translation.canTranslate({
        sourceLanguage: 'en',
        targetLanguage: 'es',
      });
      return result === 'readily' || result === 'after-download';
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Translate and return full result object
 */
export async function translateWithMetadata(
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<TranslationResult> {
  const translation = await translateText(text, sourceLang, targetLang);
  
  return {
    original: text,
    translation,
    sourceLang,
    targetLang,
  };
}
