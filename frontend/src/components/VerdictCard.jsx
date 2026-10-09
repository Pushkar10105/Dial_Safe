import React from 'react';

export default function VerdictCard({ result, onReportClick }) {
  if (!result) return null;

  const {
    number,
    verdict,
    verdictCode,
    score = 0,
    reasons = [],
    reportCount = 0,
    brand,
    officialNumber,
    advice = []
  } = result;

  // Determine css class based on verdict
  let statusClass = 'unknown';
  if (verdict === 'Verified official') statusClass = 'verified';
  else if (verdict === 'High risk') statusClass = 'high-risk';
  else if (verdict === 'Suspicious') statusClass = 'suspicious';

  const riskPercentage = Math.round(score * 100);

  return (
    <div className={`verdict-box ${statusClass}`} id="verdict-card">
      {/* Header */}
      <div className="verdict-header">
        <div>
          <span className={`verdict-badge ${statusClass}`} id="verdict-badge">
            {verdict}
          </span>
          <div className="verdict-number" style={{ marginTop: '8px' }}>
            {number}
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Risk Score: <strong>{riskPercentage}%</strong>
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Community Reports: <strong>{reportCount}</strong>
          </div>
        </div>
      </div>

      {/* Brand affiliation if detected */}
      {brand && (
        <div style={{ margin: '10px 0', fontSize: '14px', color: '#cbd5e1' }}>
          Claimed/Associated Brand: <strong style={{ color: '#fff' }}>{brand}</strong>
        </div>
      )}

      {/* Official helpline info if known */}
      {officialNumber && (
        <div style={{ margin: '12px 0', padding: '12px 16px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '10px' }}>
          <span style={{ fontSize: '13px', color: '#34d399', fontWeight: '600' }}>
            Official Helpline for {brand || 'Brand'}:
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
            <span style={{ fontSize: '18px', fontWeight: '700', color: '#fff' }}>{officialNumber}</span>
            <a href={`tel:${officialNumber}`} className="btn btn-secondary btn-sm" style={{ padding: '4px 10px' }}>
              Call Official Line
            </a>
          </div>
        </div>
      )}

      {/* Reasons List */}
      {reasons.length > 0 && (
        <div style={{ marginTop: '14px' }}>
          <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Verification Analysis:
          </div>
          <ul className="verdict-reasons">
            {reasons.map((reason, idx) => (
              <li key={idx} className="reason-item">
                <span style={{ color: statusClass === 'high-risk' ? '#f43f5e' : statusClass === 'verified' ? '#10b981' : '#f59e0b' }}>
                  •
                </span>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* High-Risk Emergency Callout (Strict AGENTS.md compliance: 1930 / cybercrime.gov.in) */}
      {verdict === 'High risk' && (
        <div className="emergency-callout" id="high-risk-alert-banner">
          <div className="emergency-info">
            <span className="emergency-icon">🚨</span>
            <div>
              <div className="emergency-title">URGENT FRAUD ADVISORY</div>
              <div className="emergency-desc">
                Do not share any OTP, PIN, or banking passwords. If you were scammed, report immediately.
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <a href="tel:1930" className="emergency-btn">
              Call 1930 Helpline
            </a>
            <a href="https://cybercrime.gov.in" target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm" style={{ borderColor: 'rgba(239, 68, 68, 0.4)' }}>
              cybercrime.gov.in ↗
            </a>
          </div>
        </div>
      )}

      {/* Safety Advice */}
      {advice.length > 0 && verdict !== 'High risk' && (
        <div style={{ marginTop: '14px', fontSize: '13px', color: 'var(--text-muted)' }}>
          {advice.map((adv, idx) => (
            <div key={idx} style={{ marginTop: '4px' }}>ℹ️ {adv}</div>
          ))}
        </div>
      )}

      {/* Action Footer */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '18px', paddingTop: '14px', borderTop: '1px solid var(--border-glass)' }}>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => onReportClick(number, brand)}
        >
          Flag as Scam
        </button>
      </div>
    </div>
  );
}
