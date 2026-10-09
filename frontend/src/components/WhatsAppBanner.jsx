import React from 'react';

export default function WhatsAppBanner() {
  const whatsappUrl = 'https://wa.me/14155238886?text=join%20dialsafe';

  return (
    <section className="section" id="whatsapp">
      <div className="container">
        <div className="whatsapp-section">
          <div className="whatsapp-content">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <span style={{ fontSize: '26px' }}>💬</span>
              <span style={{ textTransform: 'uppercase', fontSize: '13px', fontWeight: '700', letterSpacing: '0.08em', color: '#34d399' }}>
                WhatsApp Bot Integration
              </span>
            </div>

            <h2 style={{ fontSize: '28px', color: '#fff', marginBottom: '14px' }}>
              Verify Numbers Directly on WhatsApp
            </h2>

            <p style={{ color: '#d1fae5', fontSize: '15px', marginBottom: '22px', lineHeight: '1.6' }}>
              Forward any suspicious SMS, message, or phone number directly to our WhatsApp bot. Get instant fraud verdicts, safety advice, and official care lines without installing any app.
            </p>

            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="whatsapp-btn"
                id="whatsapp-cta-btn"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19.01L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 14.99 3.8 13.47 3.8 11.91C3.81 7.37 7.5 3.67 12.05 3.67Z"/>
                </svg>
                <span>Chat on WhatsApp</span>
              </a>

              <span style={{ fontSize: '13px', color: '#a7f3d0' }}>
                Join Twilio Sandbox code: <code>join &lt;sandbox-code&gt;</code>
              </span>
            </div>
          </div>

          {/* Simple Visual QR Code Simulation */}
          <div style={{ background: '#fff', padding: '16px', borderRadius: '16px', textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.4)' }}>
            <svg width="130" height="130" viewBox="0 0 100 100" fill="#0f172a">
              <path d="M0 0h35v35H0zM5 5h25v25H5zM10 10h15v15H10zM65 0h35v35H65zM70 5h25v25H70zM75 10h15v15H75zM0 65h35v35H0zM5 70h25v25H5zM10 75h15v15H10zM45 10h10v10H45zM45 25h10v10H45zM10 45h10v10H10zM25 45h10v10H25zM45 45h10v10H45zM65 45h10v10H65zM80 45h10v10H80zM45 65h10v10H45zM65 65h10v10H65zM80 65h10v10H80zM45 80h10v20H45zM65 80h35v10H65zM75 90h15v10H75z" />
            </svg>
            <div style={{ fontSize: '11px', color: '#0f172a', fontWeight: '700', marginTop: '6px' }}>
              Scan with WhatsApp
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
