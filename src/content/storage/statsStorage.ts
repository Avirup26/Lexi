// Stats Storage - Track learning statistics

import { loadData, saveData, updateData } from './storageManager';
import type { LearningStats } from '../types';

const STATS_KEY = 'stats';

const DEFAULT_STATS: LearningStats = {
  articlesRead: 0,
  wordsLearned: 0,
  practiceSessions: 0,
  currentStreak: 0,
  lastActiveDate: '',
};

/**
 * Get current stats
 */
export async function getStats(): Promise<LearningStats> {
  const stats = await loadData<LearningStats>(STATS_KEY);
  return stats || { ...DEFAULT_STATS };
}

/**
 * Update stats
 */
export async function updateStats(updates: Partial<LearningStats>): Promise<LearningStats> {
  return await updateData<LearningStats>(STATS_KEY, (current) => {
    return {
      ...(current || DEFAULT_STATS),
      ...updates,
    };
  });
}

/**
 * Increment streak if user is active today
 */
export async function incrementStreak(): Promise<number> {
  const today = new Date().toISOString().split('T')[0];
  const stats = await getStats();

  // Check if already active today
  if (stats.lastActiveDate === today) {
    return stats.currentStreak;
  }

  // Check if streak continues
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const isConsecutive = stats.lastActiveDate === yesterday;

  const newStreak = isConsecutive ? stats.currentStreak + 1 : 1;

  await updateStats({
    currentStreak: newStreak,
    lastActiveDate: today,
  });

  return newStreak;
}

/**
 * Reset streak
 */
export async function resetStreak(): Promise<void> {
  await updateStats({
    currentStreak: 0,
    lastActiveDate: '',
  });
}

/**
 * Increment articles read
 */
export async function incrementArticlesRead(): Promise<void> {
  await updateData<LearningStats>(STATS_KEY, (current) => {
    const stats = current || DEFAULT_STATS;
    return {
      ...stats,
      articlesRead: stats.articlesRead + 1,
    };
  });
  await incrementStreak();
}

/**
 * Increment words learned
 */
export async function incrementWordsLearned(count: number = 1): Promise<void> {
  await updateData<LearningStats>(STATS_KEY, (current) => {
    const stats = current || DEFAULT_STATS;
    return {
      ...stats,
      wordsLearned: stats.wordsLearned + count,
    };
  });
}

/**
 * Increment practice sessions
 */
export async function incrementPracticeSessions(): Promise<void> {
  await updateData<LearningStats>(STATS_KEY, (current) => {
    const stats = current || DEFAULT_STATS;
    return {
      ...stats,
      practiceSessions: stats.practiceSessions + 1,
    };
  });
  await incrementStreak();
}

/**
 * Clear all stats
 */
export async function clearStats(): Promise<void> {
  await saveData(STATS_KEY, DEFAULT_STATS);
}
