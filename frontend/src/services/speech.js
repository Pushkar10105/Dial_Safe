/**
 * frontend/src/services/speech.js
 * Accessible Multilingual Speech Recognition (STT) and Speech Synthesis (TTS).
 * Supports English (en-IN), Hindi (hi-IN), and Tamil (ta-IN).
 */

export const SUPPORTED_LANGUAGES = {
  en: {
    code: 'en-IN',
    label: 'English',
    nativeLabel: 'English',
    welcomeText: 'Hello! I am DialSafe Voice Assistant. You can speak a phone number or ask for any company\'s official customer care number.',
    listeningText: 'Listening... Please speak now.',
    processingText: 'Understanding your request...',
    emergencyWarning: 'Warning! High risk detected. Never share OTP or PIN. Call national helpline 1930.',
    micErrorText: 'Microphone permission was denied or not supported. You can type in the box below.'
  },
  hi: {
    code: 'hi-IN',
    label: 'Hindi',
    nativeLabel: 'हिन्दी',
    welcomeText: 'नमस्ते! मैं डायलसेफ आवाज़ सहायक हूँ। आप किसी भी कंपनी का असली कस्टमर केयर नंबर पूछ सकते हैं या कोई फ़ोन नंबर चेक करवा सकते हैं।',
    listeningText: 'सुन रहा हूँ... कृपया बोलिए।',
    processingText: 'आपकी बात समझ रहा हूँ...',
    emergencyWarning: 'सावधान! यह नंबर अत्यधिक जोखिम भरा है। किसी को भी अपना बैंक ओटीपी (OTP) या पिन मत बताइए। तुरंत 1930 पर कॉल करें।',
    micErrorText: 'माइक्रोफ़ोन की अनुमति नहीं मिली। कृपया नीचे लिखकर भी पूछ सकते हैं।'
  },
  ta: {
    code: 'ta-IN',
    label: 'Tamil',
    nativeLabel: 'தமிழ்',
    welcomeText: 'வணக்கம்! நான் டயல்சேஃப் குரல் உதவியாளர். நீங்கள் நிறுவனத்தின் உண்மையான வாடிக்கையாளர் சேவை எண்ணைக் கேட்கலாம் அல்லது சந்தேகத்திற்கிடமான எண்ணைச் சரிபார்க்கலாம்.',
    listeningText: 'கேட்கிறேன்... தயவுசெய்து பேசுங்கள்.',
    processingText: 'செயலாக்குகிறது...',
    emergencyWarning: 'எச்சரிக்கை! அதிக ஆபத்து உள்ளது. உங்கள் ஓடிபி (OTP) அல்லது பின்னைப் பகிர வேண்டாம். உதவி எண் 1930-ஐ அழைக்கவும்.',
    micErrorText: 'மைக்ரோஃபோன் அணுகல் கிடைக்கவில்லை. கீழே தட்டச்சு செய்யலாம்.'
  }
};

let currentRecognition = null;

export function isSpeechRecognitionSupported() {
  return typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
}

export function isSpeechSynthesisSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

/**
 * Starts listening to microphone input in the given language.
 */
export function startListening({ lang = 'en', onResult, onError, onEnd }) {
  if (!isSpeechRecognitionSupported()) {
    if (onError) onError('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
    return null;
  }

  stopListening();

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();
  currentRecognition = recognition;

  const langConfig = SUPPORTED_LANGUAGES[lang] || SUPPORTED_LANGUAGES.en;
  recognition.lang = langConfig.code;
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onresult = (event) => {
    if (event.results && event.results[0] && event.results[0][0]) {
      const transcript = event.results[0][0].transcript;
      if (onResult) onResult(transcript);
    }
  };

  recognition.onerror = (event) => {
    console.warn('[Speech] Recognition error:', event.error);
    if (onError) onError(event.error);
  };

  recognition.onend = () => {
    if (onEnd) onEnd();
  };

  try {
    recognition.start();
  } catch (err) {
    console.warn('[Speech] Start failed:', err);
    if (onError) onError(err.message);
  }

  return recognition;
}

export function stopListening() {
  if (currentRecognition) {
    try {
      currentRecognition.stop();
    } catch (e) {
      // ignore
    }
    currentRecognition = null;
  }
}

/**
 * Speaks text aloud in natural voice tailored for elderly users (clear, gentle pace).
 */
export function speakText(text, lang = 'en', onEnd) {
  if (!isSpeechSynthesisSupported() || !text) {
    if (onEnd) onEnd();
    return;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  const langConfig = SUPPORTED_LANGUAGES[lang] || SUPPORTED_LANGUAGES.en;
  utterance.lang = langConfig.code;

  // Gentle, accessible speaking pace for elderly ears
  utterance.rate = 0.92;
  utterance.pitch = 1.0;

  // Choose appropriate regional voice if available
  const voices = window.speechSynthesis.getVoices();
  const matchedVoice = voices.find(v => v.lang.startsWith(langConfig.code.slice(0, 2)));
  if (matchedVoice) {
    utterance.voice = matchedVoice;
  }

  utterance.onend = () => {
    if (onEnd) onEnd();
  };

  utterance.onerror = (e) => {
    console.warn('[Speech] Synthesis error:', e);
    if (onEnd) onEnd();
  };

  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking() {
  if (isSpeechSynthesisSupported()) {
    window.speechSynthesis.cancel();
  }
}
