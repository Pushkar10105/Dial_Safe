import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import NumberChecker from './components/NumberChecker';
import BrandDirectory from './components/BrandDirectory';
import Dashboard from './components/Dashboard';
import WhatsAppBanner from './components/WhatsAppBanner';
import VoiceAssistantModal from './components/VoiceAssistantModal';
import ReportModal from './components/ReportModal';
import { fetchBrands, fetchStats } from './services/api';

export default function App() {
  const [brands, setBrands] = useState([]);
  const [stats, setStats] = useState(null);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportPrefill, setReportPrefill] = useState({ number: '', brand: '' });

  // Load initial brands and stats
  useEffect(() => {
    fetchBrands().then(data => setBrands(data));
    fetchStats().then(data => setStats(data));
  }, []);

  const handleOpenReportModal = (number = '', brand = '') => {
    setReportPrefill({ number, brand });
    setIsReportModalOpen(true);
  };

  const handleRefreshStats = () => {
    fetchStats().then(data => setStats(data));
  };

  return (
    <div className="app-layout" id="dialsafe-app">
      {/* Navigation */}
      <Navbar
        onOpenVoiceAssistant={() => setIsVoiceModalOpen(true)}
        onOpenReportModal={() => handleOpenReportModal()}
      />

      {/* Hero Section */}
      <header className="hero-section">
        <div className="container">
          <div className="hero-pill">
            🛡️ Protecting Citizens & Elders from Fake Helpline Scams
          </div>

          <h1 className="hero-title">
            Stop Fake Customer Care Scams Before You Dial
          </h1>

          <p className="hero-subtitle">
            Verify suspected phone numbers against official company records, check community scam reports, or find verified helplines for major services in India.
          </p>

          {/* Accessibility & Elder Care Multilingual Voice Banner */}
          <div className="voice-banner" id="elderly-voice-feature-banner">
            <div className="voice-banner-info">
              <div className="voice-banner-title">
                <span>🎙️</span>
                <strong>Elderly-Friendly Multilingual Voice Assistant</strong>
              </div>
              <p className="voice-banner-desc">
                Designed for seniors and anyone who prefers talking over typing. The AI assistant speaks to you, understands your voice in 3 languages, and guides you step-by-step.
              </p>
              <div className="voice-lang-chips">
                <span className="lang-chip">English (Indian)</span>
                <span className="lang-chip">हिन्दी (Hindi)</span>
                <span className="lang-chip">தமிழ் (Tamil)</span>
                <span className="lang-chip">Powered by Gemini AI</span>
              </div>
            </div>

            <button
              type="button"
              className="btn btn-voice"
              onClick={() => setIsVoiceModalOpen(true)}
              id="hero-start-voice-btn"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" y1="19" x2="12" y2="23"/>
                <line x1="8" y1="23" x2="16" y2="23"/>
              </svg>
              <span>Talk to Assistant</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Number Checker */}
      <main>
        <NumberChecker
          brands={brands}
          onOpenVoiceAssistant={() => setIsVoiceModalOpen(true)}
          onOpenReportModal={handleOpenReportModal}
        />

        {/* Verified Brands Directory */}
        <BrandDirectory
          brands={brands}
        />

        {/* Live Community Dashboard */}
        <Dashboard
          stats={stats}
        />

        {/* WhatsApp Channel Integration */}
        <WhatsAppBanner />
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border-glass)', padding: '40px 0', marginTop: '60px', textAlign: 'center', fontSize: '14px', color: 'var(--text-subtle)' }}>
        <div className="container">
          <p style={{ color: 'var(--text-muted)', marginBottom: '8px' }}>
            DialSafe Student Project — Built to protect citizens and elders from fake helpline fraud.
          </p>
          <p style={{ fontSize: '13px', color: '#94a3b8' }}>
            National Cybercrime Helpline: <strong>1930</strong> | Report Cyber Fraud: <a href="https://cybercrime.gov.in" target="_blank" rel="noopener noreferrer" style={{ color: '#38bdf8' }}>cybercrime.gov.in</a>
          </p>
        </div>
      </footer>

      {/* Floating Accessibility Voice Launcher (Elderly friendly quick access) */}
      <button
        type="button"
        className="floating-voice-launcher"
        onClick={() => setIsVoiceModalOpen(true)}
        id="floating-voice-btn"
        title="Open Voice Assistant in English, Hindi, or Tamil"
        aria-label="Open Voice Assistant"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
          <line x1="12" y1="19" x2="12" y2="23"/>
          <line x1="8" y1="23" x2="16" y2="23"/>
        </svg>
        <span>Voice Assistant (आवाज़)</span>
      </button>

      {/* Voice Assistant Modal */}
      <VoiceAssistantModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
      />

      {/* Scam Report Modal */}
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        initialNumber={reportPrefill.number}
        initialBrand={reportPrefill.brand}
        onSuccess={handleRefreshStats}
      />
    </div>
  );
}
