// Vocabulary Storage - CRUD operations for vocabulary

import { loadData, saveData, updateData } from './storageManager';
import { LIMITS } from '../utils/constants';
import type { WordData } from '../types';

const VOCABULARY_KEY = 'vocabulary';

/**
 * Add word to vocabulary
 */
export async function addWord(wordData: WordData): Promise<void> {
  await updateData<WordData[]>(VOCABULARY_KEY, (current) => {
    const vocabulary = current || [];
    
    // Check if word already exists
    const existingIndex = vocabulary.findIndex(
      (item) => item.word.toLowerCase() === wordData.word.toLowerCase()
    );

    if (existingIndex >= 0) {
      // Update existing word
      vocabulary[existingIndex] = {
        ...vocabulary[existingIndex],
        ...wordData,
        reviewCount: vocabulary[existingIndex].reviewCount + 1,
        timestamp: Date.now(),
      };
    } else {
      // Add new word
      vocabulary.unshift(wordData);
    }

    // Limit vocabulary size
    if (vocabulary.length > LIMITS.MAX_VOCABULARY_SIZE) {
      vocabulary.splice(LIMITS.MAX_VOCABULARY_SIZE);
    }

    return vocabulary;
  });
}

/**
 * Get all vocabulary
 */
export async function getVocabulary(): Promise<WordData[]> {
  const vocabulary = await loadData<WordData[]>(VOCABULARY_KEY);
  return vocabulary || [];
}

/**
 * Mark word as practiced
 */
export async function markPracticed(word: string): Promise<void> {
  await updateData<WordData[]>(VOCABULARY_KEY, (current) => {
    const vocabulary = current || [];
    const index = vocabulary.findIndex(
      (item) => item.word.toLowerCase() === word.toLowerCase()
    );

    if (index >= 0) {
      vocabulary[index].practiced = true;
      vocabulary[index].timestamp = Date.now();
    }

    return vocabulary;
  });
}

/**
 * Increment review count for word
 */
export async function incrementReviewCount(word: string): Promise<void> {
  await updateData<WordData[]>(VOCABULARY_KEY, (current) => {
    const vocabulary = current || [];
    const index = vocabulary.findIndex(
      (item) => item.word.toLowerCase() === word.toLowerCase()
    );

    if (index >= 0) {
      vocabulary[index].reviewCount += 1;
      vocabulary[index].timestamp = Date.now();
    }

    return vocabulary;
  });
}

/**
 * Get words that need practice
 */
export async function getWordsToPractice(): Promise<WordData[]> {
  const vocabulary = await getVocabulary();
  return vocabulary.filter((word) => !word.practiced || word.reviewCount < 3);
}

/**
 * Delete word from vocabulary
 */
export async function deleteWord(word: string): Promise<void> {
  await updateData<WordData[]>(VOCABULARY_KEY, (current) => {
    const vocabulary = current || [];
    return vocabulary.filter(
      (item) => item.word.toLowerCase() !== word.toLowerCase()
    );
  });
}

/**
 * Clear all vocabulary
 */
export async function clearVocabulary(): Promise<void> {
  await saveData(VOCABULARY_KEY, []);
}

/**
 * Get vocabulary count
 */
export async function getVocabularyCount(): Promise<number> {
  const vocabulary = await getVocabulary();
  return vocabulary.length;
}
