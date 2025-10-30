import React, { useState, useEffect } from 'react';

interface AICapabilities {
  'Prompt API': boolean;
  'Translator API': boolean;
  'Summarizer API': boolean;
  'Writer API': boolean;
  'Rewriter API': boolean;
  'Proofreader API': boolean;
}

const PopupApp: React.FC = () => {
  const [capabilities, setCapabilities] = useState<AICapabilities>({
    'Prompt API': false,
    'Translator API': false,
    'Summarizer API': false,
    'Writer API': false,
    'Rewriter API': false,
    'Proofreader API': false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for Chrome AI API availability using official 2025 methods
    const checkCapabilities = async () => {
      const caps: AICapabilities = {
        'Prompt API': false,
        'Translator API': false,
        'Summarizer API': false,
        'Writer API': false,
        'Rewriter API': false,
        'Proofreader API': false,
      };

      try {
        // Check Prompt API (Gemini Nano)
        if ('ai' in self && 'languageModel' in (self as any).ai) {
          try {
            const canCreate = await (self as any).ai.languageModel.capabilities();
            caps['Prompt API'] = canCreate?.available === 'readily' || canCreate?.available === 'after-download';
          } catch (e) {
            caps['Prompt API'] = false;
          }
        }

        // Check Translator API
        if ('translation' in self && 'canTranslate' in (self as any).translation) {
          try {
            const canTranslate = await (self as any).translation.canTranslate({
              sourceLanguage: 'en',
              targetLanguage: 'es',
            });
            caps['Translator API'] = canTranslate === 'readily' || canTranslate === 'after-download';
          } catch (e) {
            caps['Translator API'] = 'createTranslator' in (self as any).translation;
          }
        } else if ('translation' in self) {
          caps['Translator API'] = true;
        }

        // Check Summarizer API
        if ('ai' in self && 'summarizer' in (self as any).ai) {
          try {
            const canSummarize = await (self as any).ai.summarizer.capabilities();
            caps['Summarizer API'] = canSummarize?.available === 'readily' || canSummarize?.available === 'after-download';
          } catch (e) {
            caps['Summarizer API'] = 'create' in (self as any).ai.summarizer;
          }
        }

        // Check Writer API
        if ('ai' in self && 'writer' in (self as any).ai) {
          try {
            const canWrite = await (self as any).ai.writer.capabilities();
            caps['Writer API'] = canWrite?.available === 'readily' || canWrite?.available === 'after-download';
          } catch (e) {
            caps['Writer API'] = 'create' in (self as any).ai.writer;
          }
        }

        // Check Rewriter API
        if ('ai' in self && 'rewriter' in (self as any).ai) {
          try {
            const canRewrite = await (self as any).ai.rewriter.capabilities();
            caps['Rewriter API'] = canRewrite?.available === 'readily' || canRewrite?.available === 'after-download';
          } catch (e) {
            caps['Rewriter API'] = 'create' in (self as any).ai.rewriter;
          }
        }

        // Check Proofreader API (Language Detector)
        if ('ai' in self && 'languageDetector' in (self as any).ai) {
          try {
            const canDetect = await (self as any).ai.languageDetector.capabilities();
            caps['Proofreader API'] = canDetect?.available === 'readily' || canDetect?.available === 'after-download';
          } catch (e) {
            caps['Proofreader API'] = 'create' in (self as any).ai.languageDetector;
          }
        }
      } catch (error) {
        console.error('Error checking AI capabilities:', error);
      }

      setCapabilities(caps);
      setLoading(false);
    };

    checkCapabilities();
  }, []);

  const openDashboard = () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('dashboard.html') });
  };

  const openOptions = () => {
    chrome.runtime.openOptionsPage();
  };

  return (
    <div className="w-[380px] h-[500px] bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-indigo-600 text-white p-6 shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
            <span className="text-2xl">📚</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold">Lexi</h1>
            <p className="text-blue-100 text-sm">Learn Languages Anywhere</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        {/* Available Chrome AI APIs */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <h2 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <span>🤖</span>
            <span>Available Chrome AI APIs</span>
          </h2>
          {loading ? (
            <div className="text-center py-4">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
              <p className="text-xs text-gray-500 mt-2">Checking capabilities...</p>
            </div>
          ) : (
            <div className="space-y-2">
              {Object.entries(capabilities).map(([apiName, available]) => (
                <div
                  key={apiName}
                  className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <span className="text-sm text-gray-700 font-medium">{apiName}</span>
                  <span className="text-lg">
                    {available ? (
                      <span className="text-green-500" title="Available">✅</span>
                    ) : (
                      <span className="text-gray-300" title="Not Available">–</span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          )}
          
          {/* API Status Summary */}
          {!loading && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-600 text-center">
                {Object.values(capabilities).filter(Boolean).length} of {Object.keys(capabilities).length} APIs available
              </p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="space-y-2">
          <button
            onClick={openDashboard}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-4 rounded-lg shadow-md transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <span>📊</span>
            <span>Open Dashboard</span>
          </button>

          <button
            onClick={openOptions}
            className="w-full bg-white hover:bg-gray-50 text-gray-700 font-medium py-3 px-4 rounded-lg shadow-md border border-gray-200 transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <span>⚙️</span>
            <span>Settings</span>
          </button>
        </div>

        {/* Privacy Notice */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <span className="text-green-600 text-lg">🔒</span>
            <div>
              <h3 className="text-xs font-semibold text-green-800 mb-1">
                Privacy First
              </h3>
              <p className="text-xs text-green-700">
                All processing happens locally using Chrome's built-in AI. Your data never leaves your device.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pt-2">
          <p className="text-xs text-gray-500">
            Powered by Chrome Built-in AI
          </p>
        </div>
      </div>
    </div>
  );
};

export default PopupApp;
