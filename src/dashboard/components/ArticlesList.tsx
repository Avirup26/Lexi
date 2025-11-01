// Articles List Component

import React, { useState, useEffect } from 'react';

interface Article {
  url: string;
  title: string;
  timestamp: number;
  wordCount: number;
  wordsLookedUp: string[];
}

const ArticlesList: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);

  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = () => {
    chrome.storage.local.get(['articles'], (result) => {
      const arts = result.articles || [];
      setArticles(arts.slice(0, 10)); // Last 10
    });
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const openArticle = (url: string) => {
    window.open(url, '_blank');
  };

  if (articles.length === 0) {
    return (
      <div className="feature-card">
        <div className="feature-card-header">
          <h3 className="feature-card-title">📰 Articles Read</h3>
        </div>
        <div className="feature-card-body">
          <div className="empty-state">
            <p>No articles tracked yet.</p>
            <p className="empty-state-hint">
              Read with Immersive Mode to track your progress!
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="feature-card">
      <div className="feature-card-header">
        <h3 className="feature-card-title">📰 Articles Read</h3>
        <span className="feature-card-badge">{articles.length}</span>
      </div>
      <div className="feature-card-body">
        <div className="articles-list">
          {articles.map((article, index) => (
            <div 
              key={index} 
              className="article-item"
              onClick={() => openArticle(article.url)}
            >
              <div className="article-content">
                <div className="article-title">{article.title}</div>
                <div className="article-meta">
                  <span className="article-date">{formatDate(article.timestamp)}</span>
                  <span className="article-separator">•</span>
                  <span className="article-words">{article.wordCount} words</span>
                  {article.wordsLookedUp.length > 0 && (
                    <>
                      <span className="article-separator">•</span>
                      <span className="article-lookups">
                        {article.wordsLookedUp.length} looked up
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div className="article-arrow">→</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ArticlesList;
