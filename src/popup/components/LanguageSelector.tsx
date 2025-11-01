// Language Selector Component

import React, { useState, useEffect } from 'react';

interface LanguageSelectorProps {
  type: 'target' | 'native';
  onChange?: (language: string) => void;
}

const languages = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', flag: '🇮🇹' },
  { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', flag: '🇰🇷' },
  { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
];

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ type, onChange }) => {
  const [language, setLanguage] = useState<string>(type === 'target' ? 'es' : 'en');

  useEffect(() => {
    // Load saved language
    chrome.storage.local.get(['settings'], (result) => {
      if (result.settings) {
        const key = type === 'target' ? 'targetLanguage' : 'nativeLanguage';
        if (result.settings[key]) {
          setLanguage(result.settings[key]);
        }
      }
    });
  }, [type]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLanguage = e.target.value;
    setLanguage(newLanguage);

    // Save to storage
    chrome.storage.local.get(['settings'], (result) => {
      const settings = result.settings || {};
      const key = type === 'target' ? 'targetLanguage' : 'nativeLanguage';
      chrome.storage.local.set({
        settings: { ...settings, [key]: newLanguage }
      });
    });

    // Notify parent
    onChange?.(newLanguage);
  };

  return (
    <div className="language-selector">
      <label className="selector-label">
        {type === 'target' ? '🌐 Learning' : '📖 Native Language'}
      </label>
      <select 
        value={language} 
        onChange={handleChange}
        className="selector-dropdown"
      >
        {languages.map(lang => (
          <option key={lang.code} value={lang.code}>
            {lang.flag} {lang.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default LanguageSelector;
