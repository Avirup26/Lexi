// Articles Storage - Track articles read

import { loadData, updateData } from './storageManager';
import { LIMITS } from '../utils/constants';
import type { ArticleData } from '../types';

const ARTICLES_KEY = 'articles';

/**
 * Add article to reading history
 */
export async function addArticle(articleData: ArticleData): Promise<void> {
  await updateData<ArticleData[]>(ARTICLES_KEY, (current) => {
    const articles = current || [];

    // Check if article already exists
    const existingIndex = articles.findIndex((a) => a.url === articleData.url);

    if (existingIndex >= 0) {
      // Update existing article
      articles[existingIndex] = {
        ...articles[existingIndex],
        ...articleData,
        timestamp: Date.now(),
      };
    } else {
      // Add new article
      articles.unshift(articleData);
    }

    // Limit articles
    if (articles.length > LIMITS.MAX_ARTICLES) {
      articles.splice(LIMITS.MAX_ARTICLES);
    }

    return articles;
  });
}

/**
 * Get all articles
 */
export async function getArticles(): Promise<ArticleData[]> {
  const articles = await loadData<ArticleData[]>(ARTICLES_KEY);
  return articles || [];
}

/**
 * Add word to article's lookup list
 */
export async function addWordToArticle(url: string, word: string): Promise<void> {
  await updateData<ArticleData[]>(ARTICLES_KEY, (current) => {
    const articles = current || [];
    const index = articles.findIndex((a) => a.url === url);

    if (index >= 0) {
      if (!articles[index].wordsLookedUp.includes(word)) {
        articles[index].wordsLookedUp.push(word);
      }
    }

    return articles;
  });
}

/**
 * Get article by URL
 */
export async function getArticle(url: string): Promise<ArticleData | null> {
  const articles = await getArticles();
  return articles.find((a) => a.url === url) || null;
}

/**
 * Get words looked up in current page
 */
export async function getWordsForCurrentPage(): Promise<string[]> {
  const url = window.location.href;
  const article = await getArticle(url);
  return article?.wordsLookedUp || [];
}

/**
 * Delete article
 */
export async function deleteArticle(url: string): Promise<void> {
  await updateData<ArticleData[]>(ARTICLES_KEY, (current) => {
    const articles = current || [];
    return articles.filter((a) => a.url !== url);
  });
}

/**
 * Clear all articles
 */
export async function clearArticles(): Promise<void> {
  await updateData<ArticleData[]>(ARTICLES_KEY, () => []);
}

/**
 * Get articles count
 */
export async function getArticlesCount(): Promise<number> {
  const articles = await getArticles();
  return articles.length;
}
