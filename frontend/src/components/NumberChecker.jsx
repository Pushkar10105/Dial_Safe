import React, { useState } from 'react';
import { checkNumber } from '../services/api';
import VerdictCard from './VerdictCard';

export default function NumberChecker({ 
  brands = [], 
  onOpenVoiceAssistant, 
  onOpenReportModal,
  externalQuery = null 
}) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  // Handle checking
  const handleCheck = async (e) => {
    if (e) e.preventDefault();
    if (!phoneNumber.trim()) {
      setError('Please enter a phone number to verify.');
      return;
    }

    setError('');
    setIsLoading(true);
    setResult(null);

    try {
      const data = await checkNumber(phoneNumber.trim(), selectedBrand);
      setResult(data);
    } catch (err) {
      setError(err.message || 'Verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Quick sample queries
  const setQuickSample = (num, brandName = '') => {
    setPhoneNumber(num);
    setSelectedBrand(brandName);
    setError('');
  };

  return (
    <section className="section" id="checker" style={{ paddingTop: '10px' }}>
      <div className="container">
        {/* Main Checker Glass Card */}
        <div className="glass-panel checker-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
            <h2 style={{ fontSize: '24px' }}>Verify Customer Care Number</h2>
            <button
              type="button"
              className="btn btn-voice btn-sm"
              onClick={onOpenVoiceAssistant}
              id="checker-voice-shortcut-btn"
            >
              🎙️ Speak to Verify (हिन्दी / தமிழ் / Eng)
            </button>
          </div>

          <p style={{ marginBottom: '20px', fontSize: '15px' }}>
            Enter a phone number to check if it matches official records, has been reported as fraudulent, or is masquerading as a company helpline.
          </p>

          <form onSubmit={handleCheck} className="checker-form">
            <div className="input-group">
              <input
                type="text"
                className="input-field"
                placeholder="Enter phone number (e.g. +91 98765 43210 or 1800 1234)"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                id="checker-number-input"
              />

              <select
                className="input-select"
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                id="checker-brand-select"
              >
                <option value="">Optional: Claimed Brand</option>
                {brands.map((b) => (
                  <option key={b.id || b.name} value={b.name}>
                    {b.name}
                  </option>
                ))}
              </select>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={isLoading}
                id="checker-submit-btn"
                style={{ minWidth: '130px' }}
              >
                {isLoading ? 'Checking...' : 'Check Number'}
              </button>
            </div>

            {error && (
              <div style={{ color: '#f87171', fontSize: '14px', marginTop: '4px' }}>
                ⚠️ {error}
              </div>
            )}
          </form>

          {/* Quick Test Samples */}
          <div style={{ marginTop: '18px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-subtle)' }}>Try demo samples:</span>
            <button
              type="button"
              className="lang-chip"
              onClick={() => setQuickSample('+918069696969', 'Zomato')}
            >
              Official Zomato (+918069696969)
            </button>
            <button
              type="button"
              className="lang-chip"
              onClick={() => setQuickSample('+919999988888', 'Zomato')}
            >
              Fake Zomato Helpline
            </button>
            <button
              type="button"
              className="lang-chip"
              onClick={() => setQuickSample('18001234', 'State Bank of India')}
            >
              SBI Toll-Free (18001234)
            </button>
            <button
              type="button"
              className="lang-chip"
              onClick={() => setQuickSample('+919876543210', '')}
            >
              Unknown Mobile
            </button>
          </div>

          {/* Result Card */}
          {result && (
            <VerdictCard
              result={result}
              onReportClick={(num, br) => onOpenReportModal(num, br)}
            />
          )}
        </div>
      </div>
    </section>
  );
}
