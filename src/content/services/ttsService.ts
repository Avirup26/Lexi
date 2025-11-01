// Text-to-Speech Service - Wrapper for Web Speech API

/**
 * Speak text in specified language
 */
export function speak(text: string, languageCode: string): void {
  try {
    // Check if speech synthesis is available
    if (!('speechSynthesis' in window)) {
      alert('Text-to-speech not supported in your browser');
      return;
    }

    // Stop any ongoing speech
    stopSpeaking();

    // Wait for voices to load
    let voices = window.speechSynthesis.getVoices();
    
    const speakWithVoice = () => {
      // Create utterance
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = languageCode;
      utterance.rate = 0.85; // Slightly slower for language learning
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      // Try to find a voice for the language
      voices = window.speechSynthesis.getVoices();
      const matchingVoice = voices.find(voice => 
        voice.lang.startsWith(languageCode) || 
        voice.lang.startsWith(languageCode.split('-')[0])
      );
      
      if (matchingVoice) {
        utterance.voice = matchingVoice;
      }

      // Add event listeners
      utterance.onend = () => {
        console.log('Speech finished');
      };
      
      utterance.onerror = (event) => {
        console.error('Speech error:', event);
      };

      // Speak
      window.speechSynthesis.speak(utterance);
    };

    // If voices aren't loaded yet, wait for them
    if (voices.length === 0) {
      window.speechSynthesis.addEventListener('voiceschanged', speakWithVoice, { once: true });
      // Timeout fallback
      setTimeout(speakWithVoice, 100);
    } else {
      speakWithVoice();
    }
  } catch (error) {
    console.error('Text-to-speech error:', error);
    alert('Failed to speak text');
  }
}

/**
 * Stop any ongoing speech
 */
export function stopSpeaking(): void {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

/**
 * Check if TTS is available
 */
export function isTTSAvailable(): boolean {
  return 'speechSynthesis' in window;
}

/**
 * Get available voices for a language
 */
export function getVoicesForLanguage(languageCode: string): SpeechSynthesisVoice[] {
  if (!('speechSynthesis' in window)) {
    return [];
  }

  const voices = window.speechSynthesis.getVoices();
  return voices.filter(voice => voice.lang.startsWith(languageCode));
}

/**
 * Initialize voices (needed on some browsers)
 */
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
