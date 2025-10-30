import React from 'react';

const DashboardApp: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-primary-600 to-indigo-600 rounded-full flex items-center justify-center">
              <span className="text-2xl">📚</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Lexi Dashboard</h1>
              <p className="text-gray-600">Your Language Learning Journey</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Stats Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">📊</span>
              <h2 className="text-xl font-semibold text-gray-800">Statistics</h2>
            </div>
            <p className="text-gray-600">Track your learning progress and achievements.</p>
          </div>

          {/* Translation History */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">🌐</span>
              <h2 className="text-xl font-semibold text-gray-800">Translations</h2>
            </div>
            <p className="text-gray-600">View your translation history and saved phrases.</p>
          </div>

          {/* Vocabulary */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">📖</span>
              <h2 className="text-xl font-semibold text-gray-800">Vocabulary</h2>
            </div>
            <p className="text-gray-600">Build your vocabulary with saved words.</p>
          </div>

          {/* Writing Practice */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">✍️</span>
              <h2 className="text-xl font-semibold text-gray-800">Writing</h2>
            </div>
            <p className="text-gray-600">Practice writing with AI assistance.</p>
          </div>

          {/* Summaries */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">📝</span>
              <h2 className="text-xl font-semibold text-gray-800">Summaries</h2>
            </div>
            <p className="text-gray-600">Access your saved summaries and notes.</p>
          </div>

          {/* Settings */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">⚙️</span>
              <h2 className="text-xl font-semibold text-gray-800">Settings</h2>
            </div>
            <p className="text-gray-600">Customize your learning experience.</p>
          </div>
        </div>

        {/* Privacy Notice */}
        <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <span className="text-green-600 text-2xl">🔒</span>
            <div>
              <h3 className="text-lg font-semibold text-green-800 mb-2">
                Privacy First
              </h3>
              <p className="text-green-700">
                All your data is stored locally on your device. Lexi uses Chrome's built-in AI APIs 
                to process everything offline. Your learning data never leaves your browser.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardApp;
