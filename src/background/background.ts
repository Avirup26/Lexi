// Background service worker for Lexi
console.log('Lexi background service worker started');

// Initialize extension on install
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('Lexi installed for the first time');
    
    // Set default settings
    chrome.storage.local.set({
      settings: {
        targetLanguage: 'es',
        nativeLanguage: 'en',
        autoTranslate: false,
        showDefinitions: true,
        theme: 'light',
      },
      vocabulary: [],
      translationHistory: [],
    });
    
    // Open welcome page
    chrome.tabs.create({ url: chrome.runtime.getURL('dashboard.html') });
  } else if (details.reason === 'update') {
    console.log('Lexi updated to version', chrome.runtime.getManifest().version);
  }
});

// Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received message:', message);
  
  if (message.type === 'TEXT_SELECTED') {
    // Handle text selection from content script
    handleTextSelection(message.text, sender.tab?.id);
    sendResponse({ success: true });
  }
  
  if (message.type === 'TRANSLATE') {
    // Handle translation request
    handleTranslation(message.text, message.targetLang, message.sourceLang)
      .then((result) => sendResponse(result))
      .catch((error) => sendResponse({ error: error.message }));
    return true; // Keep channel open for async response
  }
  
  if (message.type === 'SAVE_VOCABULARY') {
    // Save word to vocabulary
    saveToVocabulary(message.word, message.translation, message.context);
    sendResponse({ success: true });
  }
  
  return true;
});

// Handle text selection
async function handleTextSelection(text: string, tabId?: number) {
  console.log('Text selected:', text);
  
  // Get user settings
  const { settings } = await chrome.storage.local.get(['settings']);
  
  if (settings?.autoTranslate && tabId) {
    // Auto-translate if enabled
    const translation = await translateText(text, settings.targetLanguage, settings.nativeLanguage);
    
    // Send translation back to content script
    chrome.tabs.sendMessage(tabId, {
      type: 'SHOW_TRANSLATION',
      original: text,
      translation: translation,
    });
  }
}

// Translate text using Chrome's built-in Translation API
async function translateText(text: string, targetLang: string, sourceLang: string): Promise<string> {
  try {
    // Check if Translation API is available
    if ('translation' in self && 'createTranslator' in (self as any).translation) {
      const translator = await (self as any).translation.createTranslator({
        sourceLanguage: sourceLang,
        targetLanguage: targetLang,
      });
      
      const result = await translator.translate(text);
      return result;
    } else {
      throw new Error('Translation API not available');
    }
  } catch (error) {
    console.error('Translation error:', error);
    return `Translation unavailable: ${error}`;
  }
}

// Handle translation request
async function handleTranslation(text: string, targetLang: string, sourceLang: string) {
  try {
    const translation = await translateText(text, targetLang, sourceLang);
    
    // Save to history
    const { translationHistory = [] } = await chrome.storage.local.get(['translationHistory']);
    translationHistory.unshift({
      original: text,
      translation,
      sourceLang,
      targetLang,
      timestamp: Date.now(),
    });
    
    // Keep only last 100 translations
    if (translationHistory.length > 100) {
      translationHistory.pop();
    }
    
    await chrome.storage.local.set({ translationHistory });
    
    return { success: true, translation };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

// Save word to vocabulary
async function saveToVocabulary(word: string, translation: string, context?: string) {
  const { vocabulary = [] } = await chrome.storage.local.get(['vocabulary']);
  
  vocabulary.push({
    word,
    translation,
    context,
    timestamp: Date.now(),
    reviewCount: 0,
  });
  
  await chrome.storage.local.set({ vocabulary });
}

// Context menu for quick translation (optional)
chrome.contextMenus?.create({
  id: 'translate-selection',
  title: 'Translate with Lexi',
  contexts: ['selection'],
});

chrome.contextMenus?.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'translate-selection' && info.selectionText) {
    handleTextSelection(info.selectionText, tab?.id);
  }
});

export {};
