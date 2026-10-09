import React from 'react';

export default function Navbar({ onOpenVoiceAssistant, onOpenReportModal }) {
  return (
    <nav className="navbar" id="navbar">
      <div className="container nav-container">
        <a href="#" className="brand-logo" id="nav-brand-logo">
          <div className="logo-badge">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/>
            </svg>
          </div>
          <span>DialSafe</span>
        </a>

        <div className="nav-links">
          <a href="#checker" className="nav-link">Number Checker</a>
          <a href="#brands" className="nav-link">Official Brands</a>
          <a href="#dashboard" className="nav-link">Live Activity</a>
          <a href="#whatsapp" className="nav-link">WhatsApp Bot</a>
          <button 
            type="button" 
            className="btn btn-secondary btn-sm"
            onClick={onOpenReportModal}
            id="nav-report-btn"
          >
            Report Scam
          </button>
        </div>

        <button 
          type="button" 
          className="btn btn-voice btn-sm"
          onClick={onOpenVoiceAssistant}
          id="nav-voice-assistant-btn"
          title="Open AI Voice Assistant in English, Hindi, or Tamil"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
            <line x1="12" y1="19" x2="12" y2="23"/>
            <line x1="8" y1="23" x2="16" y2="23"/>
          </svg>
          <span>Voice Bot (हिन्दी / தமிழ்)</span>
        </button>
      </div>
    </nav>
  );
}
