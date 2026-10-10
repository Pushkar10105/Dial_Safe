import React, { useState, useEffect } from 'react';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  X, 
  ArrowRight, 
  Sparkles,
  Settings,
  Send
} from 'lucide-react';
import { 
  SUPPORTED_LANGUAGES, 
  startListening, 
  stopListening, 
  speakText, 
  stopSpeaking 
} from '../services/speech';
import { processVoiceQuery } from '../services/gemini';

export default function VoiceAssistantModal({ isOpen, onClose, onCheckNumber }) {
  const [selectedLang, setSelectedLang] = useState('hi'); // Default to Hindi for elderly accessibility
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [voiceOutputEnabled, setVoiceOutputEnabled] = useState(true);
  const [userTranscript, setUserTranscript] = useState('');
  const [botResponse, setBotResponse] = useState('');
  const [foundNumber, setFoundNumber] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [textInput, setTextInput] = useState('');
  const [geminiApiKey, setGeminiApiKey] = useState(
    () => (typeof localStorage !== 'undefined' ? localStorage.getItem('dialsafe_gemini_key') || '' : '')
  );
  const [showKeyInput, setShowKeyInput] = useState(false);

  const langConfig = SUPPORTED_LANGUAGES[selectedLang] || SUPPORTED_LANGUAGES.en;

  // Initialize or reset when modal opens or closes
  useEffect(() => {
    if (isOpen) {
      // Display initial welcome text silently (NO auto-blaring speech on open)
      setBotResponse(langConfig.welcomeText);
      setUserTranscript('');
      setFoundNumber(null);
      setErrorMessage('');
      setIsListening(false);
      setIsSpeaking(false);
      setIsProcessing(false);
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
  }, [isOpen]);

  // When language switches, update welcome text silently without auto-speaking
  const handleLanguageChange = (langKey) => {
    stopSpeaking();
    stopListening();
    setIsListening(false);
    setIsSpeaking(false);
    setSelectedLang(langKey);
    const newConfig = SUPPORTED_LANGUAGES[langKey] || SUPPORTED_LANGUAGES.en;
    setBotResponse(newConfig.welcomeText);
    setUserTranscript('');
    setFoundNumber(null);
    setErrorMessage('');
  };

  if (!isOpen) return null;

  const handleStartListening = () => {
    stopSpeaking();
    setIsSpeaking(false);
    setErrorMessage('');
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
        const errStr = String(err || '');
        if (errStr.includes('not-allowed') || errStr.includes('denied')) {
          setErrorMessage(langConfig.micErrorText);
        } else if (errStr.includes('no-speech')) {
          setErrorMessage('No voice detected. Please try tapping the mic and speaking again.');
        } else {
          setErrorMessage(`Mic note: ${errStr}. You can also type your question below.`);
        }
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
    if (!text || !text.trim()) return;
    setIsProcessing(true);
    setErrorMessage('');
    stopSpeaking();
    setIsSpeaking(false);

    try {
      const result = await processVoiceQuery({
        text: text.trim(),
        lang: selectedLang,
        apiKey: geminiApiKey
      });

      setBotResponse(result.replyText);
      setFoundNumber(result.foundNumber || null);
      setIsProcessing(false);

      // Speak response aloud only if voice output is enabled
      if (voiceOutputEnabled && result.replyText) {
        setIsSpeaking(true);
        speakText(result.replyText, selectedLang, () => {
          setIsSpeaking(false);
        });
      }
    } catch {
      setIsProcessing(false);
      setErrorMessage('Could not process speech. Please try again or type below.');
    }
  };

  const handleQuickPrompt = (promptText) => {
    setUserTranscript(promptText);
    handleQueryText(promptText);
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    const query = textInput.trim();
    setTextInput('');
    setUserTranscript(query);
    handleQueryText(query);
  };

  const toggleSoundOutput = () => {
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
    }
    setVoiceOutputEnabled(!voiceOutputEnabled);
  };

  const handlePlayCurrentResponse = () => {
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
      return;
    }
    if (botResponse) {
      setIsSpeaking(true);
      speakText(botResponse, selectedLang, () => {
        setIsSpeaking(false);
      });
    }
  };

  const handleSaveApiKey = (key) => {
    setGeminiApiKey(key);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('dialsafe_gemini_key', key);
    }
    setShowKeyInput(false);
  };

  const handleNavigateToNumber = () => {
    if (foundNumber && onCheckNumber) {
      stopSpeaking();
      stopListening();
      onCheckNumber(foundNumber);
    }
  };

  return (
    <div 
      className="modal-overlay" 
      id="voice-assistant-modal-overlay" 
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="voice-modal-title"
    >
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '620px' }}
      >
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              background: 'var(--cream)',
              border: '1.5px solid var(--ink)',
              display: 'grid',
              placeItems: 'center',
              fontSize: '20px'
            }}>
              🎙️
            </div>
            <div>
              <h3 id="voice-modal-title" style={{ fontSize: '19px', color: 'var(--ink)' }}>
                DialSafe Voice Assistant
              </h3>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--muted)' }}>
                Multilingual elder-friendly safety assistance
              </p>
            </div>
          </div>
          <button 
            type="button" 
            className="modal-close-btn" 
            onClick={onClose}
            aria-label="Close Assistant"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body voice-assistant-ui">
          {/* Language Selector Bar */}
          <div className="voice-language-bar" role="tablist" aria-label="Select Assistant Language">
            {Object.keys(SUPPORTED_LANGUAGES).map((lKey) => {
              const langItem = SUPPORTED_LANGUAGES[lKey];
              const isActive = selectedLang === lKey;
              return (
                <button
                  key={lKey}
                  type="button"
                  className={`lang-btn ${isActive ? 'active' : ''}`}
                  onClick={() => handleLanguageChange(lKey)}
                  id={`lang-btn-${lKey}`}
                  role="tab"
                  aria-selected={isActive}
                >
                  {langItem.nativeLabel} ({langItem.label})
                </button>
              );
            })}
          </div>

          {/* Central Hero Microphone */}
          <div className="mic-hero-section">
            <div className="mic-wrapper">
              {isListening && <div className="mic-wave-ring" aria-hidden="true" />}
              <button
                type="button"
                className={`mic-button ${isListening ? 'listening' : ''}`}
                onClick={isListening ? handleStopListening : handleStartListening}
                id="voice-mic-main-btn"
                title={isListening ? 'Tap to finish speaking' : 'Tap to speak'}
                aria-label={isListening ? 'Stop listening' : 'Start microphone'}
              >
                {isListening ? (
                  <MicOff size={34} strokeWidth={2.2} />
                ) : (
                  <Mic size={34} strokeWidth={2.2} />
                )}
              </button>
            </div>

            <div className="voice-state-text">
              {isListening ? (
                <span style={{ color: 'var(--orange)' }}>{langConfig.listeningText}</span>
              ) : isProcessing ? (
                <span>{langConfig.processingText}</span>
              ) : isSpeaking ? (
                <span style={{ color: 'var(--orbit)' }}>Speaking answer aloud...</span>
              ) : (
                <span>Tap microphone to ask your question</span>
              )}
            </div>

            <div className="voice-state-hint">
              {isListening 
                ? 'Tap the mic again when you finish speaking' 
                : 'Ask for any brand helpline (e.g., SBI, Zomato) or check a number'}
            </div>
          </div>

          {/* Quick Prompts for Elderly & Demo Users */}
          <div className="voice-chips-container">
            {selectedLang === 'hi' && (
              <>
                <button 
                  type="button" 
                  className="lang-chip" 
                  onClick={() => handleQuickPrompt('जोमैटो का असली कस्टमर केयर नंबर क्या है?')}
                >
                  "जोमैटो का नंबर?"
                </button>
                <button 
                  type="button" 
                  className="lang-chip" 
                  onClick={() => handleQuickPrompt('एसबीआई का हेल्पलाइन नंबर बताओ')}
                >
                  "SBI हेल्पलाइन?"
                </button>
                <button 
                  type="button" 
                  className="lang-chip" 
                  onClick={() => handleQuickPrompt('+91 99999 88888 नंबर चेक करो')}
                >
                  "संदिग्ध नंबर चेक"
                </button>
              </>
            )}
            {selectedLang === 'ta' && (
              <>
                <button 
                  type="button" 
                  className="lang-chip" 
                  onClick={() => handleQuickPrompt('Zomato வாடிக்கையாளர் சேவை எண் என்ன?')}
                >
                  "Zomato எண்?"
                </button>
                <button 
                  type="button" 
                  className="lang-chip" 
                  onClick={() => handleQuickPrompt('SBI வங்கி வாடிக்கையாளர் எண்')}
                >
                  "SBI உதவி எண்"
                </button>
                <button 
                  type="button" 
                  className="lang-chip" 
                  onClick={() => handleQuickPrompt('+91 98765 43210 எண் மோசடியா?')}
                >
                  "எண் சரிபார்ப்பு"
                </button>
              </>
            )}
            {selectedLang === 'en' && (
              <>
                <button 
                  type="button" 
                  className="lang-chip" 
                  onClick={() => handleQuickPrompt('What is official customer care for Zomato?')}
                >
                  "Zomato customer care?"
                </button>
                <button 
                  type="button" 
                  className="lang-chip" 
                  onClick={() => handleQuickPrompt('What is the SBI helpline number?')}
                >
                  "SBI helpline?"
                </button>
                <button 
                  type="button" 
                  className="lang-chip" 
                  onClick={() => handleQuickPrompt('Check +91 98765 43210')}
                >
                  "Check +91 98765..."
                </button>
              </>
            )}
          </div>

          {/* Fallback Type-to-Ask Input */}
          <form onSubmit={handleManualSubmit} style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder={
                selectedLang === 'hi' 
                  ? 'या यहाँ लिखें (उदा. SBI हेल्पलाइन, जोमैटो)...' 
                  : selectedLang === 'ta' 
                  ? 'அல்லது இங்கே தட்டச்சு செய்யவும் (SBI, Zomato)...' 
                  : 'Or type query (e.g. SBI helpline, Zomato care)...'
              }
              style={{
                flex: 1,
                padding: '12px 16px',
                borderRadius: 'var(--radius-pill)',
                border: '1.5px solid var(--line)',
                background: 'var(--paper)',
                color: 'var(--ink)',
                fontSize: '15px',
                outline: 'none'
              }}
            />
            <button
              type="submit"
              className="button button-dark"
              style={{ 
                minHeight: '44px', 
                padding: '0 20px', 
                borderRadius: 'var(--radius-pill)',
                fontSize: '14px',
                gap: '6px'
              }}
            >
              <span>Ask</span>
              <Send size={15} />
            </button>
          </form>

          {/* Error Notice */}
          {errorMessage && (
            <div style={{ 
              padding: '10px 14px', 
              background: '#FCE8E6', 
              border: '1px solid #B3261E', 
              borderRadius: '16px', 
              color: '#B3261E', 
              fontSize: '13px',
              fontWeight: 500
            }}>
              {errorMessage}
            </div>
          )}

          {/* Conversation Display */}
          <div className="voice-conversation-box">
            {userTranscript && (
              <div className="transcript-user-bubble">
                <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600, marginBottom: '2px' }}>
                  You Said / आपकी बात:
                </div>
                <div style={{ fontWeight: 600 }}>"{userTranscript}"</div>
              </div>
            )}

            {botResponse && (
              <div className="transcript-assistant-bubble">
                <div className="transcript-assistant-header">
                  <span className="transcript-label">
                    <Sparkles size={14} />
                    DialSafe Assistant
                  </span>
                  
                  <button
                    type="button"
                    className={`voice-sound-toggle ${isSpeaking ? 'speaking' : ''}`}
                    onClick={handlePlayCurrentResponse}
                    title={isSpeaking ? 'Mute current audio' : 'Listen aloud'}
                  >
                    {isSpeaking ? (
                      <>
                        <VolumeX size={15} />
                        <span>Mute</span>
                      </>
                    ) : (
                      <>
                        <Volume2 size={15} />
                        <span>Listen</span>
                      </>
                    )}
                  </button>
                </div>

                <div style={{ fontSize: '15px', lineHeight: 1.5, color: 'var(--ink)' }}>
                  {botResponse}
                </div>

                {/* Direct Action Link if a number was identified */}
                {foundNumber && (
                  <button
                    type="button"
                    className="transcript-action-btn"
                    onClick={handleNavigateToNumber}
                  >
                    <span>Check {foundNumber} in DialSafe</span>
                    <ArrowRight size={14} />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Footer Controls & Gemini API key toggle */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            paddingTop: '6px',
            borderTop: '1px solid var(--line)',
            fontSize: '13px'
          }}>
            <button
              type="button"
              className="voice-sound-toggle"
              onClick={toggleSoundOutput}
              title="Toggle automatic spoken audio for responses"
            >
              {voiceOutputEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
              <span>Voice Audio: {voiceOutputEnabled ? 'On' : 'Off'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowKeyInput(!showKeyInput)}
              style={{ 
                background: 'none', 
                border: 'none', 
                color: 'var(--muted)', 
                fontSize: '12px', 
                cursor: 'pointer', 
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Settings size={13} />
              <span>{geminiApiKey ? 'Gemini API Active' : 'Gemini Key (Optional)'}</span>
            </button>
          </div>

          {/* Gemini Key Config Accordion */}
          {showKeyInput && (
            <div style={{ 
              background: 'var(--cream)', 
              padding: '12px 14px', 
              borderRadius: '16px', 
              border: '1px solid var(--line)',
              display: 'flex', 
              gap: '8px',
              animation: 'backdropFade 150ms ease-out both'
            }}>
              <input
                type="password"
                placeholder="Paste optional Google Gemini API key..."
                defaultValue={geminiApiKey}
                id="gemini-key-input"
                style={{ 
                  flex: 1, 
                  padding: '8px 12px', 
                  borderRadius: 'var(--radius-pill)', 
                  border: '1px solid var(--line)',
                  fontSize: '13px',
                  background: 'var(--white)',
                  color: 'var(--ink)'
                }}
              />
              <button
                type="button"
                className="button button-dark"
                style={{ minHeight: '36px', padding: '0 16px', fontSize: '13px' }}
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
