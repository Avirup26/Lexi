// Text-to-Speech Service - Wrapper for Web Speech API

// Map language codes to proper locale codes
const LANGUAGE_LOCALE_MAP: Record<string, string> = {
  'en': 'en-US',
  'es': 'es-ES',
  'fr': 'fr-FR',
  'de': 'de-DE',
  'it': 'it-IT',
  'pt': 'pt-BR',
  'zh': 'zh-CN',
  'ja': 'ja-JP',
  'ko': 'ko-KR',
  'ar': 'ar-SA',
  'hi': 'hi-IN'
};

// Speak text in specified language
export function speak(text: string, languageCode: string): void {
  try {
    if (!('speechSynthesis' in window)) {
      alert('Text-to-speech not supported in your browser');
      return;
    }

    stopSpeaking();

    let voices = window.speechSynthesis.getVoices();
    
    const speakWithVoice = () => {
      voices = window.speechSynthesis.getVoices();
      
      const fullLocale = LANGUAGE_LOCALE_MAP[languageCode] || languageCode;
      const langPrefix = languageCode.split('-')[0];
      
      // Find best matching voice - prefer exact locale match, then language match
      let matchingVoice = voices.find(voice => 
        voice.lang.toLowerCase() === fullLocale.toLowerCase()
      );
      
      if (!matchingVoice) {
        matchingVoice = voices.find(voice => 
          voice.lang.toLowerCase().startsWith(langPrefix.toLowerCase())
        );
      }
      
      // Filter out English accents for non-English languages
      if (languageCode !== 'en' && matchingVoice) {
        const nativeVoices = voices.filter(voice => 
          voice.lang.toLowerCase().startsWith(langPrefix.toLowerCase()) &&
          !voice.name.toLowerCase().includes('english')
        );
        
        if (nativeVoices.length > 0) {
          matchingVoice = nativeVoices[0];
        }
      }
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = fullLocale;
      utterance.rate = 0.85;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      
      if (matchingVoice) {
        utterance.voice = matchingVoice;
      }

      utterance.onend = () => {};
      utterance.onerror = () => {};

      window.speechSynthesis.speak(utterance);
    };

    if (voices.length === 0) {
      window.speechSynthesis.addEventListener('voiceschanged', speakWithVoice, { once: true });
      setTimeout(speakWithVoice, 100);
    } else {
      speakWithVoice();
    }
  } catch (error) {
    alert('Failed to speak text');
  }
}

// Stop any ongoing speech
export function stopSpeaking(): void {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

// Check if TTS is available
export function isTTSAvailable(): boolean {
  return 'speechSynthesis' in window;
}

// Get available voices for a language
export function getVoicesForLanguage(languageCode: string): SpeechSynthesisVoice[] {
  if (!('speechSynthesis' in window)) {
    return [];
  }

  const voices = window.speechSynthesis.getVoices();
  return voices.filter(voice => voice.lang.startsWith(languageCode));
}

// Initialize voices (needed on some browsers)
export function initializeVoices(): Promise<void> {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) {
      resolve();
      return;
    }

    // Voices might load asynchronously
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      resolve();
      return;
    }

    // Wait for voices to load
    window.speechSynthesis.addEventListener('voiceschanged', () => {
      resolve();
    }, { once: true });

    // Timeout after 2 seconds
    setTimeout(resolve, 2000);
  });
}
