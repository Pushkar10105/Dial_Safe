import React from 'react';

export default function Dashboard({ stats }) {
  const totals = stats?.totals || { checks: 142, reports: 38, brands: 6 };
  const recentChecks = stats?.recentChecks || [];
  const recentReports = stats?.recentReports || [];

  return (
    <section className="section" id="dashboard">
      <div className="container">
        <h2 className="section-title">Live Scam Activity & Verification Stream</h2>
        <p className="section-desc">
          Community metrics updated in real-time from both our WhatsApp bot and website queries.
        </p>

        {/* 3 Metrics Cards */}
        <div className="stats-grid">
          <div className="glass-panel stat-card">
            <div className="stat-value">{totals.checks}</div>
            <div className="stat-label">Phone Numbers Checked</div>
          </div>
          <div className="glass-panel stat-card">
            <div className="stat-value" style={{ color: '#f43f5e', WebkitTextFillColor: '#f43f5e' }}>
              {totals.reports}
            </div>
            <div className="stat-label">Scam Incidents Reported</div>
          </div>
          <div className="glass-panel stat-card">
            <div className="stat-value" style={{ color: '#10b981', WebkitTextFillColor: '#10b981' }}>
              {totals.brands}
            </div>
            <div className="stat-label">Official Brands Monitored</div>
          </div>
        </div>

        {/* Activity Feeds */}
        <div className="feeds-container">
          {/* Recent Checks */}
          <div className="glass-panel feed-box">
            <h3 style={{ fontSize: '18px', color: '#fff' }}>Recent Verification Checks</h3>
            <ul className="feed-list">
              {recentChecks.slice(0, 5).map((check, idx) => (
                <li key={idx} className="feed-item">
                  <div>
                    <span style={{ fontWeight: '600', color: '#f1f5f9' }}>{check.number}</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-subtle)', marginLeft: '8px' }}>
                      {check.createdAt ? new Date(check.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently'}
                    </span>
                  </div>
                  <span className={`verdict-badge ${check.verdict === 'Verified official' ? 'verified' : check.verdict === 'High risk' ? 'high-risk' : check.verdict === 'Suspicious' ? 'suspicious' : 'unknown'}`} style={{ fontSize: '11px', padding: '3px 8px' }}>
                    {check.verdict}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Recent Reports */}
          <div className="glass-panel feed-box">
            <h3 style={{ fontSize: '18px', color: '#fff' }}>Community Scam Reports</h3>
            <ul className="feed-list">
              {recentReports.slice(0, 5).map((rep, idx) => (
                <li key={idx} className="feed-item">
                  <div>
                    <span style={{ fontWeight: '600', color: '#fca5a5' }}>{rep.number}</span>
                    {rep.brand && (
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '8px' }}>
                        (Claimed: {rep.brand})
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: '12px', color: '#f87171', fontWeight: '600' }}>
                    Flagged Scam
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
