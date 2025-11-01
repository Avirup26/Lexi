// Proofreader Service - Wrapper for Chrome Proofreader API

import type { GrammarResult } from '../types';

/**
 * Check grammar using Chrome's Proofreader API
 */
export async function checkGrammar(text: string, language: string = 'en'): Promise<GrammarResult> {
  try {
    // Check if Proofreader API is available
    if (!(self as any).Proofreader) {
      throw new Error('Proofreader API not available');
    }

    // Check availability
    const availability = await (self as any).Proofreader.availability();
    if (availability !== 'readily' && availability !== 'available') {
      throw new Error(`Proofreader not ready. Status: ${availability}`);
    }

    // Create proofreader instance
    const proofreader = await (self as any).Proofreader.create({
      language: language,
    });

    // Check the text
    const result = await proofreader.check(text);

    // Clean up
    proofreader.destroy?.();

    // Format result
    return {
      corrections: result.corrections || [],
      correctedText: result.correctedText || text,
    };
  } catch (error) {
    console.error('Grammar check error:', error);
    throw error;
  }
}

/**
 * Check if Proofreader API is available
 */
export async function isProofreaderAvailable(): Promise<boolean> {
  try {
    if (!(self as any).Proofreader) {
      return false;
    }

    const availability = await (self as any).Proofreader.availability();
    return availability === 'readily' || availability === 'available';
  } catch {
    return false;
  }
}

/**
 * Get suggestion for correction
 */
export function getCorrectionMessage(correction: any): string {
  if (correction.type === 'spelling') {
    return `Spelling: "${correction.original}" → "${correction.suggestion}"`;
  } else if (correction.type === 'grammar') {
    return `Grammar: ${correction.message}`;
  }
  return correction.message || 'Suggestion available';
}

/**
 * Apply corrections to text
 */
export function applyCorrections(text: string, corrections: any[]): string {
  if (!corrections || corrections.length === 0) {
    return text;
  }

  // Sort corrections by offset (descending) to apply from end to start
  const sorted = [...corrections].sort((a, b) => b.offset - a.offset);

  let result = text;
  for (const correction of sorted) {
    if (correction.suggestion && correction.offset !== undefined && correction.length !== undefined) {
      const before = result.substring(0, correction.offset);
      const after = result.substring(correction.offset + correction.length);
      result = before + correction.suggestion + after;
    }
  }

  return result;
}
