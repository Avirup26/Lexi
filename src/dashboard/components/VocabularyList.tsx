// Vocabulary List Component

import React, { useState, useEffect } from 'react';

interface VocabWord {
  word: string;
  translation: string;
  sourceLang: string;
  targetLang: string;
  timestamp: number;
  reviewCount: number;
  practiced: boolean;
}

const VocabularyList: React.FC = () => {
  const [vocabulary, setVocabulary] = useState<VocabWord[]>([]);

  useEffect(() => {
    loadVocabulary();
  }, []);

  const loadVocabulary = () => {
    chrome.storage.local.get(['vocabulary'], (result) => {
      const vocab = result.vocabulary || [];
      setVocabulary(vocab.slice(0, 15)); // Top 15
    });
  };

  const unpracticedCount = vocabulary.filter(v => !v.practiced).length;

  if (vocabulary.length === 0) {
    return (
      <div className="feature-card">
        <div className="feature-card-header">
          <h3 className="feature-card-title">📖 Vocabulary</h3>
        </div>
        <div className="feature-card-body">
          <div className="empty-state">
            <p>Build your vocabulary by looking up words!</p>
            <p className="empty-state-hint">
              Single-word translations are automatically saved.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="feature-card">
      <div className="feature-card-header">
        <h3 className="feature-card-title">📖 Vocabulary</h3>
        <span className="feature-card-badge">{vocabulary.length}</span>
      </div>
      <div className="feature-card-body">
        {unpracticedCount > 0 && (
          <div className="vocabulary-alert">
            <span className="alert-icon">✍️</span>
            <span className="alert-text">
              {unpracticedCount} word{unpracticedCount > 1 ? 's' : ''} to practice
            </span>
          </div>
        )}
        <div className="vocabulary-list">
          {vocabulary.map((word, index) => (
            <div key={index} className="vocabulary-item">
              <div className="vocabulary-content">
                <div className="vocabulary-word">
                  {word.word}
                  {word.practiced && (
                    <span className="vocabulary-check">✓</span>
                  )}
                </div>
                <div className="vocabulary-translation">{word.translation}</div>
              </div>
              <div className="vocabulary-meta">
                <span className="vocabulary-review-count">
                  {word.reviewCount > 0 ? `Reviewed ${word.reviewCount}×` : 'New'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VocabularyList;
