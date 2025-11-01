// Popup App - New simplified design for immersive reading mode

import React from 'react';
import LevelSelector from './components/LevelSelector';
import LanguageSelector from './components/LanguageSelector';
import QuickStats from './components/QuickStats';

const PopupApp: React.FC = () => {
  const openDashboard = () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('dashboard.html') });
  };

  const openOptions = () => {
    chrome.runtime.openOptionsPage();
  };

  return (
    <div className="popup-container">
      {/* Header */}
      <div className="popup-header">
        <div className="popup-logo">
          <span className="logo-icon">📚</span>
          <div className="logo-text">
            <h1 className="logo-title">Lexi</h1>
            <p className="logo-subtitle">Learn languages by reading</p>
          </div>
        </div>
      </div>

      {/* Settings */}
      <div className="popup-settings">
        <LevelSelector />
        <LanguageSelector type="native" />
        <LanguageSelector type="target" />
      </div>

      {/* Stats */}
      <div className="popup-stats">
        <QuickStats />
      </div>

      {/* Actions */}
      <div className="popup-actions">
        <button onClick={openDashboard} className="action-btn action-btn-primary">
          <span className="btn-icon">📊</span>
          <span className="btn-text">Open Dashboard</span>
        </button>

        <button onClick={openOptions} className="action-btn action-btn-secondary">
          <span className="btn-icon">⚙️</span>
          <span className="btn-text">Settings</span>
        </button>
      </div>

      {/* Privacy Notice */}
      <div className="popup-privacy">
        <div className="privacy-icon">🔒</div>
        <div className="privacy-text">
          <strong>100% Offline AI</strong>
          <p>Your data never leaves your browser</p>
        </div>
      </div>

      {/* Getting Started Tip */}
      <div className="popup-tip">
        <p>💡 <strong>Tip:</strong> Visit any website and toggle "Immersive Mode" to start learning!</p>
      </div>
    </div>
  );
};

export default PopupApp;
