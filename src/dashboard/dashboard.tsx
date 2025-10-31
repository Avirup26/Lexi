import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import '../index.css';

interface DashboardData {
  translationHistory: any[];
  vocabulary: any[];
  summaries: any[];
  wordData: Record<string, any>;
  stats: {
    totalTranslations: number;
    totalWords: number;
    exercisesCompleted: number;
    currentStreak: number;
    lastActiveDate: string;
  };
}

const DashboardApp: React.FC = () => {
  const [data, setData] = useState<DashboardData>({
    translationHistory: [],
    vocabulary: [],
    summaries: [],
    wordData: {},
    stats: {
      totalTranslations: 0,
      totalWords: 0,
      exercisesCompleted: 0,
      currentStreak: 0,
      lastActiveDate: new Date().toISOString().split('T')[0]
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const result = await chrome.storage.local.get([
        'translationHistory',
        'vocabulary',
        'summaries',
        'wordData',
        'stats'
      ]);

      // Calculate stats if not stored
      const stats = result.stats || {
        totalTranslations: result.translationHistory?.length || 0,
        totalWords: result.vocabulary?.length || 0,
        exercisesCompleted: 0,
        currentStreak: calculateStreak(result.stats?.lastActiveDate),
        lastActiveDate: new Date().toISOString().split('T')[0]
      };

      setData({
        translationHistory: result.translationHistory || [],
        vocabulary: result.vocabulary || [],
        summaries: result.summaries || [],
        wordData: result.wordData || {},
        stats
      });

      // Update streak
      updateStreak(stats);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStreak = (lastActiveDate?: string): number => {
    if (!lastActiveDate) return 1;
    const today = new Date().toISOString().split('T')[0];
    const lastDate = new Date(lastActiveDate);
    const todayDate = new Date(today);
    const diffTime = todayDate.getTime() - lastDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 1 ? 1 : 0;
  };

  const updateStreak = async (currentStats: any) => {
    const today = new Date().toISOString().split('T')[0];
    if (currentStats.lastActiveDate !== today) {
      const newStreak = calculateStreak(currentStats.lastActiveDate) + currentStats.currentStreak;
      const updatedStats = {
        ...currentStats,
        currentStreak: newStreak,
        lastActiveDate: today
      };
      await chrome.storage.local.set({ stats: updatedStats });
      setData(prev => ({ ...prev, stats: updatedStats }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">📚</div>
          <p className="text-xl text-gray-600">Loading your learning journey...</p>
        </div>
      </div>
    );
  }

  const hasAnyData = data.translationHistory.length > 0 || data.vocabulary.length > 0 || data.summaries.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-lg border-b-4 border-blue-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform">
                <span className="text-3xl">📚</span>
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Lexi Dashboard</h1>
                <p className="text-gray-600 text-lg">Your Unified Learning Hub</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-r from-orange-400 to-red-500 text-white px-6 py-3 rounded-xl shadow-lg">
                <div className="text-center">
                  <div className="text-3xl font-bold">{data.stats.currentStreak}</div>
                  <div className="text-sm font-semibold">🔥 Day Streak</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard icon="🌐" label="Translations" value={data.stats.totalTranslations} color="blue" />
          <StatCard icon="📖" label="Words Learned" value={data.stats.totalWords} color="green" />
          <StatCard icon="✍️" label="Exercises" value={data.stats.exercisesCompleted} color="purple" />
          <StatCard icon="🔒" label="Privacy First" value="100%" color="emerald" isText />
        </div>

        {/* Welcome Message for New Users */}
        {!hasAnyData && (
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl p-8 mb-8 shadow-xl">
            <div className="text-center">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-3xl font-bold mb-3">Welcome to Lexi!</h2>
              <p className="text-xl mb-6 text-blue-100">Start your language learning journey today</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                <TipCard icon="🌐" title="Translate" description="Select any text on a webpage to translate it instantly" />
                <TipCard icon="✍️" title="Write" description="Practice writing with AI-powered assistance and feedback" />
                <TipCard icon="📝" title="Summarize" description="Get quick summaries of long articles and texts" />
              </div>
            </div>
          </div>
        )}

        {/* Feature Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Translations */}
          <FeatureCard
            icon="🌐"
            title="Recent Translations"
            color="blue"
            count={data.translationHistory.length}
            emptyMessage="No translations yet. Select text on any webpage to get started!"
          >
            {data.translationHistory.slice(0, 5).map((item, idx) => (
              <div key={idx} className="border-b border-gray-100 last:border-0 py-3">
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1">
                    <p className="text-gray-900 font-medium">{item.original?.substring(0, 50)}{item.original?.length > 50 ? '...' : ''}</p>
                    <p className="text-blue-600 text-sm mt-1">{item.translation?.substring(0, 50)}{item.translation?.length > 50 ? '...' : ''}</p>
                  </div>
                  <span className="text-xs text-gray-400">{new Date(item.timestamp).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </FeatureCard>

          {/* Vocabulary */}
          <FeatureCard
            icon="📖"
            title="Vocabulary"
            color="green"
            count={data.vocabulary.length}
            emptyMessage="Build your vocabulary by saving words you learn!"
          >
            {data.vocabulary.slice(0, 5).map((item, idx) => (
              <div key={idx} className="border-b border-gray-100 last:border-0 py-3">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-gray-900 font-semibold">{item.word}</p>
                    <p className="text-green-600 text-sm">{item.translation}</p>
                  </div>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">{item.reviewCount || 0} reviews</span>
                </div>
              </div>
            ))}
          </FeatureCard>

          {/* Summaries */}
          <FeatureCard
            icon="📝"
            title="Summaries"
            color="purple"
            count={data.summaries.length}
            emptyMessage="Use the summarizer to quickly understand long texts!"
          >
            {data.summaries.slice(0, 5).map((item, idx) => (
              <div key={idx} className="border-b border-gray-100 last:border-0 py-3">
                <div className="mb-2">
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-semibold">{item.type}</span>
                  <span className="text-xs text-gray-400 ml-2">{new Date(item.timestamp).toLocaleDateString()}</span>
                </div>
                <p className="text-gray-700 text-sm">{item.summary?.substring(0, 100)}{item.summary?.length > 100 ? '...' : ''}</p>
              </div>
            ))}
          </FeatureCard>

          {/* Word Practice */}
          <FeatureCard
            icon="✍️"
            title="Practice Sessions"
            color="amber"
            count={Object.keys(data.wordData).length}
            emptyMessage="Practice writing sentences with words you've learned!"
          >
            {Object.entries(data.wordData).slice(0, 5).map(([word, wordInfo]: [string, any], idx) => (
              <div key={idx} className="border-b border-gray-100 last:border-0 py-3">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-gray-900 font-semibold">{word}</p>
                    {wordInfo.notes && <p className="text-amber-600 text-sm mt-1">{wordInfo.notes.substring(0, 50)}</p>}
                  </div>
                </div>
              </div>
            ))}
          </FeatureCard>
        </div>

        {/* Privacy Badge */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-2xl p-8 shadow-lg">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center flex-shrink-0">
              <span className="text-3xl">🔒</span>
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-green-900 mb-3">
                🛡️ Privacy-First Learning
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-green-800">
                <div>
                  <div className="font-semibold mb-1">✅ 100% Local Storage</div>
                  <p className="text-sm text-green-700">All data stays on your device</p>
                </div>
                <div>
                  <div className="font-semibold mb-1">✅ Offline AI Processing</div>
                  <p className="text-sm text-green-700">Chrome's built-in AI APIs</p>
                </div>
                <div>
                  <div className="font-semibold mb-1">✅ Zero Tracking</div>
                  <p className="text-sm text-green-700">Your data never leaves your browser</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <QuickAction icon="⚙️" label="Settings" onClick={() => chrome.runtime.openOptionsPage()} />
          <QuickAction icon="🔄" label="Refresh" onClick={loadDashboardData} />
          <QuickAction icon="📊" label="Export Data" onClick={() => alert('Export feature coming soon!')} />
          <QuickAction icon="❓" label="Help" onClick={() => window.open('https://github.com/Avirup26/Lexi', '_blank')} />
        </div>
      </main>
    </div>
  );
};

// Stat Card Component
const StatCard: React.FC<{ icon: string; label: string; value: number | string; color: string; isText?: boolean }> = ({ icon, label, value, color, isText }) => {
  const colorClasses: Record<string, string> = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    emerald: 'from-emerald-500 to-emerald-600'
  };

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} text-white rounded-xl p-6 shadow-lg transform hover:scale-105 transition-all`}>
      <div className="text-4xl mb-2">{icon}</div>
      <div className={`${isText ? 'text-2xl' : 'text-3xl'} font-bold mb-1`}>{value}</div>
      <div className="text-sm font-semibold opacity-90">{label}</div>
    </div>
  );
};

// Feature Card Component
const FeatureCard: React.FC<{ icon: string; title: string; color: string; count: number; emptyMessage: string; children: React.ReactNode }> = ({ icon, title, color, count, emptyMessage, children }) => {
  const colorClasses: Record<string, string> = {
    blue: 'border-blue-500',
    green: 'border-green-500',
    purple: 'border-purple-500',
    amber: 'border-amber-500'
  };

  return (
    <div className={`bg-white rounded-xl shadow-lg border-t-4 ${colorClasses[color]} overflow-hidden`}>
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{icon}</span>
            <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          </div>
          <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-semibold">{count}</span>
        </div>
      </div>
      <div className="p-6 max-h-80 overflow-y-auto">
        {count === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 text-sm">{emptyMessage}</p>
            <p className="text-gray-400 text-xs mt-2">💡 Start using Lexi to see your progress here!</p>
          </div>
        ) : (
          <div>{children}</div>
        )}
      </div>
    </div>
  );
};

// Tip Card Component
const TipCard: React.FC<{ icon: string; title: string; description: string }> = ({ icon, title, description }) => (
  <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-4 border border-white border-opacity-30">
    <div className="text-3xl mb-2">{icon}</div>
    <h3 className="font-bold text-lg mb-1">{title}</h3>
    <p className="text-sm text-blue-100">{description}</p>
  </div>
);

// Quick Action Component
const QuickAction: React.FC<{ icon: string; label: string; onClick: () => void }> = ({ icon, label, onClick }) => (
  <button
    onClick={onClick}
    className="bg-white hover:bg-gray-50 rounded-xl p-4 shadow-md hover:shadow-lg transition-all transform hover:scale-105 border border-gray-200"
  >
    <div className="text-3xl mb-2">{icon}</div>
    <div className="text-sm font-semibold text-gray-700">{label}</div>
  </button>
);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <DashboardApp />
  </React.StrictMode>
);
