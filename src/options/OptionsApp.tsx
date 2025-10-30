import React, { useState, useEffect } from 'react';

interface Settings {
  targetLanguage: string;
  nativeLanguage: string;
  autoTranslate: boolean;
  showDefinitions: boolean;
  theme: 'light' | 'dark' | 'auto';
}

const OptionsApp: React.FC = () => {
  const [settings, setSettings] = useState<Settings>({
    targetLanguage: 'es',
    nativeLanguage: 'en',
    autoTranslate: false,
    showDefinitions: true,
    theme: 'light',
  });

  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Load settings from chrome.storage.local
    chrome.storage.local.get(['settings'], (result) => {
      if (result.settings) {
        setSettings(result.settings);
      }
    });
  }, []);

  const handleSave = () => {
    chrome.storage.local.set({ settings }, () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  };

  const updateSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-primary-600 to-indigo-600 rounded-full flex items-center justify-center">
              <span className="text-2xl">⚙️</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
              <p className="text-gray-600">Customize your Lexi experience</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
          {/* Language Settings */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Language Preferences</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Language (Learning)
                </label>
                <select
                  value={settings.targetLanguage}
                  onChange={(e) => updateSetting('targetLanguage', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                  <option value="it">Italian</option>
                  <option value="pt">Portuguese</option>
                  <option value="ja">Japanese</option>
                  <option value="ko">Korean</option>
                  <option value="zh">Chinese</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Native Language
                </label>
                <select
                  value={settings.nativeLanguage}
                  onChange={(e) => updateSetting('nativeLanguage', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                  <option value="it">Italian</option>
                  <option value="pt">Portuguese</option>
                </select>
              </div>
            </div>
          </div>

          {/* Feature Settings */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Features</h2>
            
            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.autoTranslate}
                  onChange={(e) => updateSetting('autoTranslate', e.target.checked)}
                  className="w-5 h-5 text-primary-600 rounded focus:ring-2 focus:ring-primary-500"
                />
                <div>
                  <span className="font-medium text-gray-800">Auto-translate selected text</span>
                  <p className="text-sm text-gray-600">Automatically translate text when you select it</p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.showDefinitions}
                  onChange={(e) => updateSetting('showDefinitions', e.target.checked)}
                  className="w-5 h-5 text-primary-600 rounded focus:ring-2 focus:ring-primary-500"
                />
                <div>
                  <span className="font-medium text-gray-800">Show word definitions</span>
                  <p className="text-sm text-gray-600">Display definitions for translated words</p>
                </div>
              </label>
            </div>
          </div>

          {/* Theme Settings */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Appearance</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Theme
              </label>
              <select
                value={settings.theme}
                onChange={(e) => updateSetting('theme', e.target.value as 'light' | 'dark' | 'auto')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="auto">Auto (System)</option>
              </select>
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-4 border-t border-gray-200">
            <button
              onClick={handleSave}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-4 rounded-lg shadow-md transition-colors duration-200"
            >
              {saved ? '✓ Saved!' : 'Save Settings'}
            </button>
          </div>
        </div>

        {/* Privacy Notice */}
        <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <span className="text-green-600 text-lg">🔒</span>
            <div>
              <h3 className="text-sm font-semibold text-green-800 mb-1">
                Privacy First
              </h3>
              <p className="text-xs text-green-700">
                All settings are stored locally on your device using chrome.storage.local. 
                No data is sent to external servers.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default OptionsApp;
