import React, { useState } from 'react';
import { reportScam } from '../services/api';

export default function ReportModal({ isOpen, onClose, initialNumber = '', initialBrand = '', onSuccess }) {
  const [number, setNumber] = useState(initialNumber);
  const [brand, setBrand] = useState(initialBrand);
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!number.trim()) {
      setError('Phone number is required.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await reportScam(number.trim(), brand.trim(), note.trim());
      setSubmitted(true);
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message || 'Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSubmitted(false);
    setNote('');
    onClose();
  };

  return (
    <div className="modal-overlay" id="report-modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
        <div className="modal-header">
          <h3 style={{ fontSize: '18px', color: '#fff' }}>Report Suspected Scam Number</h3>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="modal-body">
          {submitted ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: '42px', marginBottom: '14px' }}>🛡️</div>
              <h4 style={{ fontSize: '20px', color: '#10b981', marginBottom: '8px' }}>Report Submitted</h4>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '24px' }}>
                Thank you! Your report has been added to our shared database and will protect others from fake customer care scams.
              </p>
              <button type="button" className="btn btn-primary" onClick={handleReset}>
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                Help protect others by flagging fraudulent numbers, fake support lines, and OTP phishing attempts.
              </p>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#cbd5e1' }}>
                  Phone Number *
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. +91 98765 43210"
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                  required
                  id="report-input-number"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#cbd5e1' }}>
                  Claimed Company / Brand (Optional)
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Zomato, SBI, Amazon"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  id="report-input-brand"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#cbd5e1' }}>
                  Incident Description (Optional)
                </label>
                <textarea
                  className="input-field"
                  rows={3}
                  placeholder="e.g. Asked for UPI PIN or OTP claiming to refund an order..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  id="report-input-note"
                  style={{ width: '100%', resize: 'none' }}
                />
              </div>

              {error && (
                <div style={{ color: '#f87171', fontSize: '13px' }}>
                  ⚠️ {error}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={onClose}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting} id="report-submit-btn">
                  {isSubmitting ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
