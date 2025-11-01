// Dashboard App - New immersive reading focused design

import React, { useState, useEffect } from 'react';
import StatsCards from './components/StatsCards';
import RecentTranslations from './components/RecentTranslations';
import VocabularyList from './components/VocabularyList';
import ArticlesList from './components/ArticlesList';
import SummariesList from './components/SummariesList';

const DashboardApp: React.FC = () => {
  const [streak, setStreak] = useState(0);
  const [level, setLevel] = useState<string>('beginner');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    chrome.storage.local.get(['stats', 'settings'], (result) => {
      const stats = result.stats || {};
      const settings = result.settings || {};
      
      setStreak(stats.currentStreak || 0);
      setLevel(settings.readingLevel || 'beginner');
    });
  };

  const openSettings = () => {
    chrome.runtime.openOptionsPage();
  };

  const refreshData = () => {
    window.location.reload();
  };

  const exportData = () => {
    chrome.storage.local.get(null, (data) => {
      const dataStr = JSON.stringify(data, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lexi-data-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <div className="dashboard-logo">
          <span className="dashboard-icon">📚</span>
          <div>
            <h1 className="dashboard-title">Lexi Dashboard</h1>
            <p className="dashboard-subtitle">Learn languages by reading the web</p>
          </div>
        </div>
        <div className="dashboard-streak">
          <span className="streak-icon">🔥</span>
          <div className="streak-content">
            <div className="streak-value">{streak}</div>
            <div className="streak-label">Day Streak</div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <section className="dashboard-section">
        <StatsCards />
      </section>

      {/* Main Content Grid */}
      <section className="dashboard-section">
        <div className="dashboard-grid">
          <RecentTranslations />
          <VocabularyList />
          <ArticlesList />
          <SummariesList />
        </div>
      </section>

      {/* Privacy Badge */}
      <section className="dashboard-section">
        <div className="privacy-badge">
          <div className="privacy-icon">🔒</div>
          <div className="privacy-content">
            <h3>Privacy First</h3>
            <div className="privacy-features">
              <span className="privacy-check">✓ 100% Local Storage</span>
              <span className="privacy-check">✓ Offline AI Processing</span>
              <span className="privacy-check">✓ Zero Tracking</span>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="dashboard-section">
        <div className="dashboard-actions">
          <button onClick={openSettings} className="dashboard-btn dashboard-btn-secondary">
            ⚙️ Settings
          </button>
          <button onClick={refreshData} className="dashboard-btn dashboard-btn-secondary">
            🔄 Refresh
          </button>
          <button onClick={exportData} className="dashboard-btn dashboard-btn-secondary">
            📊 Export Data
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="dashboard-footer">
        <p>Reading Level: <strong>{level.charAt(0).toUpperCase() + level.slice(1)}</strong></p>
        <p>Powered by Chrome Built-in AI • 100% Offline</p>
      </footer>
    </div>
  );
};

export default DashboardApp;
