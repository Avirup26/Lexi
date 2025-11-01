// Stats Cards Component

import React, { useState, useEffect } from 'react';

interface Stats {
  articlesRead: number;
  wordsLearned: number;
  practiceSessions: number;
}

const StatsCards: React.FC = () => {
  const [stats, setStats] = useState<Stats>({
    articlesRead: 0,
    wordsLearned: 0,
    practiceSessions: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = () => {
    chrome.storage.local.get(['stats', 'vocabulary'], (result) => {
      const storageStats = result.stats || {};
      const vocabulary = result.vocabulary || [];

      setStats({
        articlesRead: storageStats.articlesRead || 0,
        wordsLearned: vocabulary.length,
        practiceSessions: storageStats.practiceSessions || 0,
      });
    });
  };

  return (
    <div className="stats-cards">
      <div className="stat-card stat-card-blue">
        <div className="stat-card-icon">📰</div>
        <div className="stat-card-content">
          <div className="stat-card-value">{stats.articlesRead}</div>
          <div className="stat-card-label">Articles Read</div>
        </div>
      </div>

      <div className="stat-card stat-card-green">
        <div className="stat-card-icon">📖</div>
        <div className="stat-card-content">
          <div className="stat-card-value">{stats.wordsLearned}</div>
          <div className="stat-card-label">Words Learned</div>
        </div>
      </div>

      <div className="stat-card stat-card-purple">
        <div className="stat-card-icon">✍️</div>
        <div className="stat-card-content">
          <div className="stat-card-value">{stats.practiceSessions}</div>
          <div className="stat-card-label">Practice Sessions</div>
        </div>
      </div>
    </div>
  );
};

export default StatsCards;
