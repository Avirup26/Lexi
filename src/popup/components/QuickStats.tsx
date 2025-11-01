// Quick Stats Component

import React, { useState, useEffect } from 'react';

interface Stats {
  wordsLearned: number;
  currentStreak: number;
  articlesRead: number;
}

const QuickStats: React.FC = () => {
  const [stats, setStats] = useState<Stats>({
    wordsLearned: 0,
    currentStreak: 0,
    articlesRead: 0,
  });

  useEffect(() => {
    loadStats();
    
    // Refresh stats every 5 seconds
    const interval = setInterval(loadStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadStats = () => {
    chrome.storage.local.get(['stats', 'vocabulary'], (result) => {
      const storageStats = result.stats || {};
      const vocabulary = result.vocabulary || [];
      
      setStats({
        wordsLearned: vocabulary.length,
        currentStreak: storageStats.currentStreak || 0,
        articlesRead: storageStats.articlesRead || 0,
      });
    });
  };

  return (
    <div className="quick-stats">
      <h3 className="stats-title">Your Progress</h3>
      <div className="stats-grid">
        <div className="stat-item">
          <div className="stat-icon">🔥</div>
          <div className="stat-content">
            <div className="stat-value">{stats.currentStreak}</div>
            <div className="stat-label">Day Streak</div>
          </div>
        </div>
        
        <div className="stat-item">
          <div className="stat-icon">📖</div>
          <div className="stat-content">
            <div className="stat-value">{stats.wordsLearned}</div>
            <div className="stat-label">Words Learned</div>
          </div>
        </div>
        
        <div className="stat-item">
          <div className="stat-icon">📰</div>
          <div className="stat-content">
            <div className="stat-value">{stats.articlesRead}</div>
            <div className="stat-label">Articles Read</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickStats;
