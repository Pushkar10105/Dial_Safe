import React, { useState, useEffect, useRef } from 'react';
import { 
  SUPPORTED_LANGUAGES, 
  startListening, 
  stopListening, 
  speakText, 
  stopSpeaking,
  isSpeechRecognitionSupported 
} from '../services/speech';
import { processVoiceQuery } from '../services/gemini';

export default function VoiceAssistantModal({ isOpen, onClose, onCheckNumber }) {
  const [selectedLang, setSelectedLang] = useState('hi'); // Default to Hindi for elderly accessibility
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [userTranscript, setUserTranscript] = useState('');
  const [botResponse, setBotResponse] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [geminiApiKey, setGeminiApiKey] = useState(
    localStorage.getItem('dialsafe_gemini_key') || ''
  );
  const [showKeyInput, setShowKeyInput] = useState(false);

  const langConfig = SUPPORTED_LANGUAGES[selectedLang] || SUPPORTED_LANGUAGES.en;

  // Speak welcome message whenever modal opens or language changes
  useEffect(() => {
    if (isOpen) {
      const welcome = langConfig.welcomeText;
      setBotResponse(welcome);
      setUserTranscript('');
      setErrorMessage('');
      setIsSpeaking(true);
      speakText(welcome, selectedLang, () => {
        setIsSpeaking(false);
      });
    } else {
      stopSpeaking();
      stopListening();
      setIsListening(false);
      setIsSpeaking(false);
    }

    return () => {
      stopSpeaking();
      stopListening();
    };
  }, [isOpen, selectedLang]);

  if (!isOpen) return null;

  const handleLanguageChange = (langKey) => {
    stopSpeaking();
    stopListening();
    setIsListening(false);
    setSelectedLang(langKey);
  };

  const handleStartListening = () => {
    stopSpeaking();
    setIsSpeaking(false);
    setErrorMessage('');
    setUserTranscript('');
    setIsListening(true);

    startListening({
      lang: selectedLang,
      onResult: async (transcript) => {
        setIsListening(false);
        setUserTranscript(transcript);
        await handleQueryText(transcript);
      },
      onError: (err) => {
        setIsListening(false);
        setErrorMessage(
          typeof err === 'string' && err.includes('not-allowed')
            ? langConfig.micErrorText
            : `Mic note: ${err}. Try speaking again or typing below.`
        );
      },
      onEnd: () => {
        setIsListening(false);
      }
    });
  };

  const handleStopListening = () => {
    stopListening();
    setIsListening(false);
  };

  const handleQueryText = async (text) => {
    if (!text.trim()) return;
    setIsProcessing(true);
    setErrorMessage('');

    try {
      const result = await processVoiceQuery({
        text,
        lang: selectedLang,
        apiKey: geminiApiKey
      });

      setBotResponse(result.replyText);
      setIsProcessing(false);
      setIsSpeaking(true);

      // Speak result aloud
      speakText(result.replyText, selectedLang, () => {
        setIsSpeaking(false);
      });

      // If a number was identified, inform parent checker
      if (result.foundNumber && onCheckNumber) {
        onCheckNumber(result.foundNumber, result.matchedBrand || '');
      }
    } catch (err) {
      setIsProcessing(false);
      setErrorMessage('Could not process speech. Please try again.');
    }
  };

  const handleQuickPrompt = (promptText) => {
    setUserTranscript(promptText);
    handleQueryText(promptText);
  };

  const handleSaveApiKey = (key) => {
    setGeminiApiKey(key);
    localStorage.setItem('dialsafe_gemini_key', key);
    setShowKeyInput(false);
  };

  return (
    <div className="modal-overlay" id="voice-assistant-modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '24px' }}>🎙️</span>
            <div>
              <h3 style={{ fontSize: '18px', color: '#fff' }}>DialSafe Voice Assistant</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Elderly-friendly multilingual voice assistance
              </p>
            </div>
          </div>
          <button 
            type="button" 
            className="modal-close-btn" 
            onClick={onClose}
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body voice-assistant-ui">
          {/* Language Selector */}
          <div className="voice-language-bar">
            {Object.keys(SUPPORTED_LANGUAGES).map((lKey) => (
              <button
                key={lKey}
                type="button"
                className={`lang-btn ${selectedLang === lKey ? 'active' : ''}`}
                onClick={() => handleLanguageChange(lKey)}
                id={`lang-btn-${lKey}`}
              >
                {SUPPORTED_LANGUAGES[lKey].nativeLabel} ({SUPPORTED_LANGUAGES[lKey].label})
              </button>
            ))}
          </div>

          {/* Status Label */}
          <div className="voice-state-text">
            {isListening
              ? langConfig.listeningText
              : isSpeaking
              ? 'Speaking... / बोल रहा हूँ...'
              : isProcessing
              ? langConfig.processingText
              : 'Tap the microphone to speak'}
          </div>

          {/* Big Accessible Mic Button */}
          <div className="mic-wrapper">
            {isListening && <div className="mic-wave-ring" />}
            <button
              type="button"
              className={`mic-button ${isListening ? 'listening' : ''}`}
              onClick={isListening ? handleStopListening : handleStartListening}
              id="voice-mic-main-btn"
              title="Click to speak"
              aria-label="Microphone Button"
            >
              <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" y1="19" x2="12" y2="23"/>
                <line x1="8" y1="23" x2="16" y2="23"/>
              </svg>
            </button>
          </div>

          <p style={{ fontSize: '13px', color: 'var(--text-subtle)', marginBottom: '14px' }}>
            {isListening ? 'Tap again when finished speaking' : 'Tap to speak your question or phone number'}
          </p>

          {/* Quick Prompts for Elderly Users */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '16px' }}>
            {selectedLang === 'hi' && (
              <>
                <button type="button" className="lang-chip" onClick={() => handleQuickPrompt('जोमैटो का असली कस्टमर केयर नंबर क्या है?')}>
                  "जोमैटो का नंबर?"
                </button>
                <button type="button" className="lang-chip" onClick={() => handleQuickPrompt('एसबीआई का हेल्पलाइन नंबर बताओ')}>
                  "SBI हेल्पलाइन?"
                </button>
                <button type="button" className="lang-chip" onClick={() => handleQuickPrompt('+91 99999 88888 नंबर चेक करो')}>
                  "संदिग्ध नंबर चेक"
                </button>
              </>
            )}
            {selectedLang === 'ta' && (
              <>
                <button type="button" className="lang-chip" onClick={() => handleQuickPrompt('Zomato வாடிக்கையாளர் சேவை எண் என்ன?')}>
                  "Zomato எண்?"
                </button>
                <button type="button" className="lang-chip" onClick={() => handleQuickPrompt('SBI வங்கி வாடிக்கையாளர் எண்')}>
                  "SBI உதவி எண்"
                </button>
                <button type="button" className="lang-chip" onClick={() => handleQuickPrompt('+91 98765 43210 எண் மோசடியா?')}>
                  "எண் சரிபார்ப்பு"
                </button>
              </>
            )}
            {selectedLang === 'en' && (
              <>
                <button type="button" className="lang-chip" onClick={() => handleQuickPrompt('What is official customer care for Zomato?')}>
                  "Zomato care number?"
                </button>
                <button type="button" className="lang-chip" onClick={() => handleQuickPrompt('What is SBI helpline number?')}>
                  "SBI helpline?"
                </button>
                <button type="button" className="lang-chip" onClick={() => handleQuickPrompt('Check +91 98765 43210')}>
                  "Check +91 98765..."
                </button>
              </>
            )}
          </div>

          {/* Error Notice */}
          {errorMessage && (
            <div style={{ padding: '10px 14px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', color: '#fca5a5', fontSize: '13px', marginBottom: '12px' }}>
              {errorMessage}
            </div>
          )}

          {/* Live Transcript & Bot Response */}
          <div className="voice-transcript-box">
            {userTranscript && (
              <div style={{ marginBottom: '10px' }}>
                <div className="transcript-label">You Said / आपकी बात:</div>
                <div className="transcript-content" style={{ fontWeight: '600' }}>
                  "{userTranscript}"
                </div>
              </div>
            )}

            {botResponse && (
              <div className="transcript-reply">
                <div className="transcript-label">DialSafe Assistant Reply:</div>
                <div className="transcript-content" style={{ color: '#fff', fontSize: '15px' }}>
                  {botResponse}
                </div>
              </div>
            )}
          </div>

          {/* Gemini API Key config toggle (Optional) */}
          <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => setShowKeyInput(!showKeyInput)}
              style={{ background: 'none', border: 'none', color: 'var(--text-subtle)', fontSize: '12px', cursor: 'pointer', textDecoration: 'underline' }}
            >
              {geminiApiKey ? '⚙️ Gemini API Key Active (Tap to change)' : '⚙️ Optional: Add Google Gemini API Key'}
            </button>
            {isSpeaking && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={stopSpeaking}
              >
                Mute Speech
              </button>
            )}
          </div>

          {showKeyInput && (
            <div style={{ marginTop: '10px', display: 'flex', gap: '8px' }}>
              <input
                type="password"
                className="input-field"
                placeholder="Paste Gemini API Key..."
                defaultValue={geminiApiKey}
                id="gemini-key-input"
                style={{ padding: '8px 12px', fontSize: '13px' }}
              />
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => {
                  const input = document.getElementById('gemini-key-input');
                  if (input) handleSaveApiKey(input.value.trim());
                }}
              >
                Save
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
