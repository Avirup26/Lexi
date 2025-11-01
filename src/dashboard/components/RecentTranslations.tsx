// Recent Translations Component

import React, { useState, useEffect } from 'react';

interface Translation {
  original: string;
  translation: string;
  sourceLang: string;
  targetLang: string;
  timestamp: number;
}

const RecentTranslations: React.FC = () => {
  const [translations, setTranslations] = useState<Translation[]>([]);

  useEffect(() => {
    loadTranslations();
  }, []);

  const loadTranslations = () => {
    chrome.storage.local.get(['translationHistory'], (result) => {
      const history = result.translationHistory || [];
      setTranslations(history.slice(0, 10)); // Last 10
    });
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  if (translations.length === 0) {
    return (
      <div className="feature-card">
        <div className="feature-card-header">
          <h3 className="feature-card-title">🌐 Recent Translations</h3>
        </div>
        <div className="feature-card-body">
          <div className="empty-state">
            <p>No translations yet.</p>
            <p className="empty-state-hint">
              Select text on any webpage to translate!
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="feature-card">
      <div className="feature-card-header">
        <h3 className="feature-card-title">🌐 Recent Translations</h3>
        <span className="feature-card-badge">{translations.length}</span>
      </div>
      <div className="feature-card-body">
        <div className="translations-list">
          {translations.map((trans, index) => (
            <div key={index} className="translation-item">
              <div className="translation-content">
                <div className="translation-original">{trans.original}</div>
                <div className="translation-arrow">→</div>
                <div className="translation-translated">{trans.translation}</div>
              </div>
              <div className="translation-meta">
                <span className="translation-time">{formatTime(trans.timestamp)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RecentTranslations;
