import React, { useState } from 'react';

export default function BrandDirectory({ brands = [], onSelectNumber }) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredBrands = brands.filter((brand) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const nameMatch = brand.name.toLowerCase().includes(q);
    const aliasMatch = brand.aliases && brand.aliases.some(a => a.toLowerCase().includes(q));
    return nameMatch || aliasMatch;
  });

  return (
    <section className="section" id="brands">
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 className="section-title">Verified Official Customer Care Numbers</h2>
            <p className="section-desc">
              All numbers in this directory are verified directly from each company's official website or application.
            </p>
          </div>

          <div style={{ width: '100%', maxWidth: '320px' }}>
            <input
              type="text"
              className="input-field"
              placeholder="Search company (e.g. SBI, Zomato)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              id="brand-search-input"
            />
          </div>
        </div>

        <div className="brand-grid">
          {filteredBrands.map((brand) => (
            <div key={brand.id || brand.name} className="glass-panel brand-card">
              <div>
                <div className="brand-card-top">
                  <div className="brand-name">{brand.name}</div>
                  <span className="verdict-badge verified" style={{ fontSize: '11px', padding: '3px 8px' }}>
                    Verified
                  </span>
                </div>

                <div style={{ fontSize: '13px', color: 'var(--text-subtle)', marginBottom: '8px' }}>
                  Official Helpline(s):
                </div>

                {brand.official_numbers && brand.official_numbers.map((num, idx) => (
                  <a
                    key={idx}
                    href={`tel:${num}`}
                    className="official-number-pill"
                    title={`Call official ${brand.name} helpline`}
                  >
                    <span>📞 {num}</span>
                  </a>
                ))}

                {brand.known_fake_numbers && brand.known_fake_numbers.length > 0 && (
                  <div style={{ marginTop: '12px', padding: '8px 12px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.25)' }}>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: '#fca5a5', textTransform: 'uppercase' }}>
                      Known Fake Numbers Flagged:
                    </div>
                    <div style={{ fontSize: '12px', color: '#fee2e2', marginTop: '4px' }}>
                      {brand.known_fake_numbers.join(', ')}
                    </div>
                  </div>
                )}
              </div>

              <div style={{ marginTop: '18px', paddingTop: '12px', borderTop: '1px solid var(--border-glass)', fontSize: '12px', color: 'var(--text-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  Last verified: <strong>{brand.last_checked || '2026-10-01'}</strong>
                </div>
                {brand.source_url && (
                  <a
                    href={brand.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'var(--accent-secondary)' }}
                  >
                    Official Source ↗
                  </a>
                )}
              </div>
            </div>
          ))}

          {filteredBrands.length === 0 && (
            <div className="glass-panel" style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center' }}>
              <p style={{ fontSize: '16px', color: 'var(--text-muted)' }}>
                No verified brand found matching "{searchQuery}".
              </p>
              <p style={{ fontSize: '13px', color: 'var(--text-subtle)', marginTop: '8px' }}>
                Rule: If a brand is not in our list, we never guess. Check the company's official website or app.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
