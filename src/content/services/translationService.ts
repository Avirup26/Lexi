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
    // Check if Translator API is available
    if (!('Translator' in self)) {
      throw new Error('Translator API not available');
    }

    // Check if same language
    if (sourceLang === targetLang) {
      return text;
    }

    // Check availability
    const translatorCapabilities = await (self as any).Translator.availability({
      sourceLanguage: sourceLang,
      targetLanguage: targetLang,
    });

    console.log('[Lexi] Translator capability:', translatorCapabilities);

    if (translatorCapabilities === 'no') {
      throw new Error(`Translation from ${sourceLang} to ${targetLang} not supported`);
    }

    // Create translator
    const translator = await (self as any).Translator.create({
      sourceLanguage: sourceLang,
      targetLanguage: targetLang,
    });

    const result = await translator.translate(text);
    
    if (translator.destroy) {
      translator.destroy();
    }
    
    return result || text;
  } catch (error) {
    console.error('[Lexi] Translation error:', error);
    const errorMsg = error instanceof Error ? error.message : 'Translation failed';
    throw new Error(errorMsg);
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
