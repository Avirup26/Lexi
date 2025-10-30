# Lexi 📚

**Privacy-first, offline AI language-learning companion for every webpage**

Lexi is a Chrome Extension built for the Google Chrome Built-in AI Challenge. It leverages Chrome's built-in AI APIs to provide language learning features directly in your browser—completely offline and privacy-focused.

## ✨ Features

- **🌐 Translation** - Translate text using Chrome's built-in Translation API
- **📝 Summarization** - Summarize articles and content
- **✍️ Writing Assistant** - Get AI-powered writing help
- **🔄 Rewriter** - Rewrite text in different styles
- **✅ Proofreader** - Check grammar and spelling
- **💬 Prompt API** - General language model interactions
- **📊 Dashboard** - Track your learning progress
- **🔒 Privacy-First** - All data stored locally, no external servers

## 🛠️ Tech Stack

- **Vite** - Fast build tool
- **React** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Chrome Extension Manifest V3** - Latest extension standard
- **Chrome Built-in AI APIs** - Offline AI processing

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- Chrome Canary or Chrome Dev (for built-in AI APIs)
- Enable Chrome AI features in `chrome://flags`

### Installation

1. **Clone the repository**
   ```bash
   cd Lexi
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the extension**
   ```bash
   npm run build
   ```

4. **Load in Chrome**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` folder

### Development

```bash
npm run dev
```

This starts Vite in development mode. After making changes, rebuild and reload the extension in Chrome.

## 📁 Project Structure

```
Lexi/
├── public/
│   ├── manifest.json          # Extension manifest
│   └── icons/                 # Extension icons
├── src/
│   ├── popup/                 # Popup UI
│   │   ├── popup.tsx         # Entry point
│   │   └── Popup.tsx         # Main component
│   ├── dashboard/            # Dashboard page
│   │   ├── dashboard.tsx
│   │   └── Dashboard.tsx
│   ├── options/              # Options/Settings page
│   │   ├── options.tsx
│   │   └── Options.tsx
│   ├── content/              # Content script
│   │   ├── content.ts
│   │   └── content.css
│   ├── background/           # Background service worker
│   │   └── background.ts
│   └── index.css            # Global styles
├── popup.html               # Popup HTML
├── dashboard.html           # Dashboard HTML
├── options.html            # Options HTML
├── vite.config.ts          # Vite configuration
├── tailwind.config.js      # Tailwind configuration
├── tsconfig.json           # TypeScript configuration
├── package.json            # Dependencies
├── .gitignore             # Git ignore rules
└── README.md              # This file
```

## 🔧 Chrome Built-in AI APIs Used

- **Prompt API** (`ai.languageModel`) - General language model
- **Translation API** (`translation.createTranslator`) - Text translation
- **Summarization API** (`ai.summarizer`) - Content summarization
- **Writer API** (`ai.writer`) - Writing assistance
- **Rewriter API** (`ai.rewriter`) - Text rewriting
- **Proofreader API** (`ai.proofreader`) - Grammar checking

## 🔐 Privacy

Lexi is built with privacy as a core principle:

- ✅ All processing happens locally using Chrome's built-in AI
- ✅ No data is sent to external servers
- ✅ All user data stored in `chrome.storage.local`
- ✅ No tracking or analytics
- ✅ Completely offline functionality

## 📝 TODO

- [ ] Add placeholder icons (16x16, 32x32, 48x48, 128x128)
- [ ] Implement AI API integration for all features
- [ ] Add vocabulary management
- [ ] Create translation history view
- [ ] Add flashcard system for learning
- [ ] Implement spaced repetition algorithm
- [ ] Add export/import functionality
- [ ] Create onboarding flow
- [ ] Add keyboard shortcuts
- [ ] Implement dark mode

## 🤝 Contributing

This project is built for the Google Chrome Built-in AI Challenge. Contributions, issues, and feature requests are welcome!

## 📄 License

See LICENSE file for details.

## 🏆 Chrome Built-in AI Challenge

This extension is submitted for the Google Chrome Built-in AI Challenge, showcasing the power of on-device AI for privacy-focused language learning.

---

**Built with ❤️ for language learners everywhere**
