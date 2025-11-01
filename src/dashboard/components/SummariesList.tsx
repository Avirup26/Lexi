// Summaries List Component

import React, { useState, useEffect } from 'react';

interface Summary {
  url: string;
  original: string;
  summary: string;
  type: 'key-points' | 'tl;dr' | 'teaser' | 'headline';
  length: 'short' | 'medium' | 'long';
  timestamp: number;
}

const SummariesList: React.FC = () => {
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    loadSummaries();
  }, []);

  const loadSummaries = () => {
    chrome.storage.local.get(['summaries'], (result) => {
      const sums = result.summaries || [];
      setSummaries(sums.slice(0, 10)); // Last 10
    });
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'key-points': '🎯 Key Points',
      'tl;dr': '⚡ TL;DR',
      'teaser': '📖 Teaser',
      'headline': '📰 Headline',
    };
    return labels[type] || type;
  };

  const toggleExpand = (index: number) => {
    setExpanded(expanded === index ? null : index);
  };

  if (summaries.length === 0) {
    return (
      <div className="feature-card">
        <div className="feature-card-header">
          <h3 className="feature-card-title">📝 Summaries</h3>
        </div>
        <div className="feature-card-body">
          <div className="empty-state">
            <p>No summaries yet.</p>
            <p className="empty-state-hint">
              Use the "Quick Summary" feature to summarize articles!
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="feature-card">
      <div className="feature-card-header">
        <h3 className="feature-card-title">📝 Summaries</h3>
        <span className="feature-card-badge">{summaries.length}</span>
      </div>
      <div className="feature-card-body">
        <div className="summaries-list">
          {summaries.map((summary, index) => (
            <div key={index} className="summary-item">
              <div 
                className="summary-header"
                onClick={() => toggleExpand(index)}
              >
                <div className="summary-type">{getTypeLabel(summary.type)}</div>
                <div className="summary-date">{formatDate(summary.timestamp)}</div>
                <div className="summary-toggle">
                  {expanded === index ? '▼' : '▶'}
                </div>
              </div>
              {expanded === index && (
                <div className="summary-content">
                  <div className="summary-text">{summary.summary}</div>
                  <a 
                    href={summary.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="summary-link"
                  >
                    View original article →
                  </a>
                </div>
              )}
              {expanded !== index && (
                <div className="summary-preview">
                  {summary.summary.substring(0, 100)}...
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SummariesList;
