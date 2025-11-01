// Level Selector Component

import React, { useState, useEffect } from 'react';

interface LevelSelectorProps {
  onChange?: (level: 'beginner' | 'intermediate' | 'advanced') => void;
}

const LevelSelector: React.FC<LevelSelectorProps> = ({ onChange }) => {
  const [level, setLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');

  useEffect(() => {
    // Load saved level
    chrome.storage.local.get(['settings'], (result) => {
      if (result.settings?.readingLevel) {
        setLevel(result.settings.readingLevel);
      }
    });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLevel = e.target.value as 'beginner' | 'intermediate' | 'advanced';
    setLevel(newLevel);

    // Save to storage
    chrome.storage.local.get(['settings'], (result) => {
      const settings = result.settings || {};
      chrome.storage.local.set({
        settings: { ...settings, readingLevel: newLevel }
      });
    });

    // Notify parent
    onChange?.(newLevel);
  };

  return (
    <div className="level-selector">
      <label className="selector-label">
        📚 Reading Level
      </label>
      <select 
        value={level} 
        onChange={handleChange}
        className="selector-dropdown"
      >
        <option value="beginner">Beginner</option>
        <option value="intermediate">Intermediate</option>
        <option value="advanced">Advanced</option>
      </select>
      <p className="selector-hint">
        {level === 'beginner' && 'Shows intermediate and advanced words'}
        {level === 'intermediate' && 'Shows only advanced words'}
        {level === 'advanced' && 'Minimal highlighting'}
      </p>
    </div>
  );
};

export default LevelSelector;
