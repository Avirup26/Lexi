# Lexi 📚

**Your AI-powered language learning companion for Chrome**

Lexi is a Chrome Extension built for the **Google Chrome Built-in AI Challenge** that transforms any webpage into an interactive language learning experience. It leverages Chrome's experimental built-in AI APIs to provide powerful language tools—completely offline and privacy-focused.

<div align="center">

[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-blue?style=flat&logo=googlechrome)](https://github.com/Avirup26/Lexi)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.2-blue?style=flat&logo=react)](https://reactjs.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

</div>

---

## ✨ Features

### 🌐 **Multi-Language Translation**
- Translate text between 11 languages (English, Spanish, French, German, Italian, Portuguese, Chinese, Japanese, Korean, Arabic, Hindi)
- Select native and target languages via intuitive dropdowns
- Real-time translation powered by Chrome's Translation API

### 🔊 **Text-to-Speech**
- Hear pronunciations in both native and target languages
- Support for multiple language voices
- Perfect for improving pronunciation and listening skills

### ✨ **AI Text Rewriter**
- Rewrite text in different styles using Chrome's Rewriter API
- Improve clarity and tone of your writing
- Great for language learners to see alternative phrasings

### 📝 **Smart Summarization**
- Summarize articles and lengthy content with AI
- Choose from multiple summary types: Key Points, TL;DR, Teaser, or Headline
- Adjustable length: Short, Medium, or Long
- Summarize current webpage or paste custom text

### 🎨 **Modern Draggable UI**
- Floating toggle box that works on any webpage
- Drag and resize to fit your workflow
- Clean, professional design with warm orange theme
- Collapsible interface to save screen space

### 🔒 **Privacy-First**
- All processing happens locally using Chrome's built-in AI
- No data sent to external servers
- All user data stored locally in `chrome.storage.local`
- No tracking or analytics
- Completely offline functionality

## 🛠️ Tech Stack

- **Vite** - Fast build tool
- **React** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Chrome Extension Manifest V3** - Latest extension standard
- **Chrome Built-in AI APIs** - Offline AI processing

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

1. **Node.js** (v18 or higher)
   - Download from [nodejs.org](https://nodejs.org/)
   - Verify installation: `node --version` and `npm --version`

2. **Chrome Canary or Chrome Dev** (required for built-in AI APIs)
   - Chrome Canary: [Download here](https://www.google.com/chrome/canary/)
   - Chrome Dev: [Download here](https://www.google.com/chrome/dev/)
   - Regular Chrome does NOT support these experimental APIs yet

3. **Enable Chrome AI Features**
   - Open `chrome://flags` in Chrome Canary/Dev
   - Search for and enable the following flags:
     - `#optimization-guide-on-device-model` → **Enabled BypassPerfRequirement**
     - `#prompt-api-for-gemini-nano` → **Enabled**
     - `#translation-api` → **Enabled**
     - `#summarization-api-for-gemini-nano` → **Enabled**
     - `#rewriter-api-for-gemini-nano` → **Enabled**
   - Restart Chrome after enabling flags

### Installation & Setup

Since the `dist` folder is not included in the repository (it's built from source), you'll need to build the extension yourself. Follow these steps:

#### 1️⃣ **Clone the Repository**
```bash
git clone https://github.com/Avirup26/Lexi.git
cd Lexi
```

#### 2️⃣ **Install Dependencies**
```bash
npm install
```
This will install all required packages including React, TypeScript, Vite, and Tailwind CSS.

#### 3️⃣ **Build the Extension**
```bash
npm run build
```
This command:
- Compiles TypeScript to JavaScript
- Bundles all React components
- Processes Tailwind CSS
- Creates the `dist` folder with the production-ready extension

**Expected output:**
```
✓ 69 modules transformed.
dist/popup.html
dist/dashboard.html
dist/options.html
dist/content/content.js
dist/background/background.js
...
✓ built in [time]
```

#### 4️⃣ **Load Extension in Chrome**

1. Open Chrome Canary/Dev and navigate to: `chrome://extensions/`
2. Toggle **"Developer mode"** ON (top-right corner)
3. Click **"Load unpacked"** button
4. Navigate to the `Lexi` folder and select the **`dist`** folder
5. The extension should now appear in your extensions list

#### 5️⃣ **Verify Installation**

- You should see the Lexi icon in your Chrome toolbar
- Click the icon to open the popup
- Visit any webpage and you should see the floating Lexi toggle box (📚 icon) in the top-right corner

### Development Mode

If you want to modify the code and see changes in real-time:

```bash
npm run dev
```

This starts Vite in development mode with hot module replacement. After making changes:
1. Run `npm run build` to rebuild
2. Go to `chrome://extensions/`
3. Click the refresh icon on the Lexi extension card

### Troubleshooting

**Extension doesn't appear after loading:**
- Make sure you selected the `dist` folder, not the root `Lexi` folder
- Check that the build completed successfully without errors
- Try reloading the extension from `chrome://extensions/`

**AI features not working:**
- Verify you're using Chrome Canary or Chrome Dev (NOT regular Chrome)
- Double-check that all flags in `chrome://flags` are enabled
- Restart Chrome after enabling flags
- Some AI models may take time to download on first use

**Build fails with errors:**
- Delete `node_modules` folder and `package-lock.json`
- Run `npm install` again
- Ensure Node.js version is 18 or higher

**Translation/Summarization not working:**
- Chrome's built-in AI models may need to download on first use
- Check your internet connection for initial model download
- Wait a few minutes and try again

## 📖 How to Use Lexi

### On Any Webpage

1. **Open any webpage** in Chrome Canary/Dev
2. Look for the **floating Lexi toggle box** (📚 icon) in the top-right corner
3. **Drag and resize** the box as needed
4. **Select your languages** from the dropdowns (Native Language and Target Language)

### Translation

1. Paste or type text into the textarea
2. Click the **🌎 Translate** button
3. See the translation appear in the yellow result box below

### Text-to-Speech

1. Enter text in the textarea
2. Click **🔊 EN** to hear it in your native language
3. Click **🔊 [LANG]** to hear it in your target language (button label changes based on selected language)

### Rewriting

1. Enter text you want to rewrite
2. Click **✨ Rewrite**
3. Get an AI-improved version of your text

### Summarization

1. Click the **✨ Quick Summary** button at the bottom
2. Choose summary type: Key Points, TL;DR, Teaser, or Headline
3. Choose length: Short, Medium, or Long
4. Either:
   - Leave the text area empty to summarize the current article
   - Paste custom text to summarize
5. Click **✨ Generate Summary**

### Collapsing the UI

- Click the **−** button in the header to minimize the toggle box
- Click the **+** button to expand it again

## 📁 Project Structure

```
Lexi/
├── public/
│   ├── manifest.json              # Extension manifest (Manifest V3)
│   └── icons/                     # Extension icons
├── src/
│   ├── popup/                     # Popup UI (extension icon click)
│   │   ├── popup.tsx
│   │   └── Popup.tsx
│   ├── dashboard/                 # Dashboard page
│   │   ├── dashboard.tsx
│   │   └── Dashboard.tsx
│   ├── options/                   # Options/Settings page
│   │   ├── options.tsx
│   │   └── Options.tsx
│   ├── content/                   # Content scripts (runs on webpages)
│   │   ├── index.ts              # Main content script entry
│   │   ├── modules/              # UI modules
│   │   │   ├── immersiveToggle.ts    # Floating toggle box
│   │   │   ├── summaryModal.ts       # Summary modal
│   │   │   ├── selectionWidget.ts    # Text selection widget
│   │   │   └── ...
│   │   ├── services/             # AI service integrations
│   │   │   ├── translationService.ts
│   │   │   ├── summarizerService.ts
│   │   │   ├── rewriterService.ts
│   │   │   ├── ttsService.ts
│   │   │   └── ...
│   │   ├── storage/              # Chrome storage management
│   │   ├── utils/                # Utility functions
│   │   └── types/                # TypeScript type definitions
│   ├── background/               # Background service worker
│   │   └── background.ts
│   └── index.css                # Global styles
├── dist/                         # Build output (created by npm run build)
│   ├── popup.html
│   ├── dashboard.html
│   ├── options.html
│   ├── content/content.js
│   ├── background/background.js
│   └── ...
├── popup.html                    # Popup HTML template
├── dashboard.html                # Dashboard HTML template
├── options.html                  # Options HTML template
├── vite.config.ts               # Vite build configuration
├── tailwind.config.js           # Tailwind CSS configuration
├── tsconfig.json                # TypeScript configuration
├── package.json                 # Dependencies and scripts
├── .gitignore                   # Git ignore rules
└── README.md                    # This file
```

**Note:** The `dist` folder is not tracked in git. It's generated when you run `npm run build`.

## 🔧 Chrome Built-in AI APIs Used

- **Prompt API** (`ai.languageModel`) - General language model
- **Translation API** (`translation.createTranslator`) - Text translation
- **Summarization API** (`ai.summarizer`) - Content summarization
- **Writer API** (`ai.writer`) - Writing assistance
- **Rewriter API** (`ai.rewriter`) - Text rewriting
- **Proofreader API** (`ai.proofreader`) - Grammar checking

## 🔐 Privacy & Security

Lexi is built with **privacy as the top priority**:

| Feature | Status |
|---------|--------|
| 🔒 Local AI Processing | ✅ All AI runs on-device via Chrome's built-in APIs |
| 🚫 No External Servers | ✅ Zero data sent to third-party servers |
| 💾 Local Storage Only | ✅ All user data stored in `chrome.storage.local` |
| 🔍 No Tracking | ✅ No analytics, telemetry, or user tracking |
| 📡 Offline Functionality | ✅ Works completely offline after initial setup |
| 🔐 Open Source | ✅ Full source code available for audit |

## 🏗️ Architecture Overview

Lexi is architected with a modular design:

### Content Scripts
- **immersiveToggle.ts** - Main floating UI component with language selection
- **summaryModal.ts** - Modal for AI-powered text summarization
- **selectionWidget.ts** - Context menu for selected text
- **wordHighlighter.ts** - Highlight and save vocabulary

### Services Layer
- **translationService.ts** - Chrome Translation API wrapper
- **summarizerService.ts** - Chrome Summarization API wrapper
- **rewriterService.ts** - Chrome Rewriter API wrapper
- **ttsService.ts** - Web Speech API for text-to-speech

### Storage Layer
- **storageManager.ts** - Unified interface for chrome.storage
- **vocabularyStorage.ts** - Manage saved words and phrases
- **statsStorage.ts** - Track learning statistics

### UI Components
- Modern, responsive design with Tailwind CSS
- Drag-and-drop functionality
- Resizable panels
- Collapsible interface

## 🛣️ Roadmap & Future Features

- [ ] **Vocabulary Flashcards** - Spaced repetition learning system
- [ ] **Translation History** - Track and review past translations
- [ ] **Reading Mode** - Highlight and translate inline on webpages
- [ ] **Pronunciation Practice** - Record and compare pronunciation
- [ ] **Language Detection** - Auto-detect source language
- [ ] **Custom Dictionaries** - Import personal word lists
- [ ] **Dark Mode** - Eye-friendly dark theme
- [ ] **Keyboard Shortcuts** - Quick access to features
- [ ] **Export/Import** - Backup and sync data across devices
- [ ] **Statistics Dashboard** - Visualize learning progress

## 🤝 Contributing

Contributions are welcome! This project is built for the **Google Chrome Built-in AI Challenge**.

### How to Contribute

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Code Style

- Use TypeScript for all new code
- Follow existing code patterns and naming conventions
- Keep functions small and focused (single responsibility)
- Add short, clear comments (3-5 words) for complex logic
- Test thoroughly in Chrome Canary before submitting

### Reporting Issues

Found a bug? Have a feature request? Please open an issue on GitHub with:
- Clear description of the problem/feature
- Steps to reproduce (for bugs)
- Expected vs actual behavior
- Chrome version and OS

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🏆 Chrome Built-in AI Challenge

This extension is a submission for the **Google Chrome Built-in AI Challenge**, demonstrating the power and potential of on-device AI for:
- Privacy-preserving language learning
- Offline-first applications
- Seamless integration with web browsing
- Accessible AI tools for everyone

## 🙏 Acknowledgments

- Google Chrome Team for the Built-in AI APIs
- React and Vite communities for amazing developer tools
- All language learners who inspired this project

## 📬 Contact

**Avirup Bhattacharjee**
- GitHub: [@Avirup26](https://github.com/Avirup26)
- Project Link: [https://github.com/Avirup26/Lexi](https://github.com/Avirup26/Lexi)

---

<div align="center">

**Built with ❤️ for language learners everywhere**

⭐ **Star this repo if you find it useful!** ⭐

</div>
