import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  CircleAlert,
  FileWarning,
  Home,
  Search,
  ShieldQuestion,
  Copy,
  Check,
  Menu,
  X,
  ExternalLink,
  Phone,
  QrCode,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { checkNumber, formatNumber, validNumber } from '../lib/api.js'

/* ==========================================================================
   Logo Icon & Mark (Task 1: Original DialSafe Mark, No Mastercard circles)
   ========================================================================== */
export function LogoIcon({ size = 28, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`dialsafe-logo-icon ${className}`}
      aria-hidden="true"
    >
      {/* Base Badge in Ink Black */}
      <circle cx="16" cy="16" r="15" fill="#141413" />
      {/* Protective Shield in Light Signal Orange */}
      <path
        d="M16 5.5L23.5 8.7V13.8C23.5 18.5 20.3 22.8 16 24.5C11.7 22.8 8.5 18.5 8.5 13.8V8.7L16 5.5Z"
        stroke="#F37338"
        strokeWidth="1.6"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Phone Handset in Light Signal Orange */}
      <path
        d="M13.5 11C13 11 12.6 11.3 12.3 11.8C11.7 12.8 11.5 14.3 12.4 16.1C13.3 18.1 15.2 20 17.2 20.9C19 21.8 20.4 21.6 21.4 21C21.8 20.8 22 20.4 22 20V18.7C22 18.3 21.7 18 21.3 17.9L19.5 17.5C19.1 17.4 18.7 17.6 18.5 17.9L18 18.5C16.3 17.6 15.6 16.8 14.8 15.1L15.4 14.5C15.7 14.2 15.8 13.8 15.7 13.4L15.3 11.6C15.2 11.2 14.9 11 14.5 11H13.5Z"
        fill="#F37338"
      />
    </svg>
  )
}

export function Logo({ large = false }) {
  return (
    <Link to="/" className="logo" aria-label="DialSafe home">
      <LogoIcon size={large ? 38 : 28} />
      <span>DialSafe</span>
    </Link>
  )
}

/* ==========================================================================
   Navigation Bar (Floating pill with scroll easing shadow & search expand)
   ========================================================================== */
export function Navbar({ onOpenVoice }) {
  const location = useLocation()
  const pathname = location.pathname
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const searchInputRef = useRef(null)

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 8)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [searchOpen])

  // Close mobile menu on route change
  useEffect(() => {
    setMenuOpen(false)
    setSearchOpen(false)
  }, [pathname])

  const links = [
    ['/', 'Home', Home],
    ['/find', 'Find official number', Search],
    ['/report', 'Report a number', FileWarning],
    ['/dashboard', 'Activity', CircleAlert],
  ]

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/find?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const handleCheckClick = (e) => {
    if (pathname === '/') {
      if (e) e.preventDefault()
      const input = document.getElementById('phone-number')
      if (input) {
        input.scrollIntoView({ behavior: 'smooth', block: 'center' })
        setTimeout(() => input.focus(), 300)
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    }
  }

  return (
    <div className="topbar-wrapper">
      <header className={`topbar ${scrolled ? 'scrolled' : ''}`}>
        <Logo />

        <nav className="desktop-nav" aria-label="Main navigation">
          {links.map(([href, label]) => (
            <Link
              key={href}
              to={href}
              className={pathname === href ? 'active' : ''}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Expandable Nav Search (Section 7: 48px circle expands to input over 250ms) */}
        <div className="nav-search-container">
          {searchOpen ? (
            <form onSubmit={handleSearchSubmit} className="nav-search-expanded">
              <Search size={16} aria-hidden="true" />
              <input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search brand or number..."
                aria-label="Search brand or number"
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                aria-label="Close search"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}
              >
                <X size={16} />
              </button>
            </form>
          ) : (
            <button
              type="button"
              className="nav-search-btn"
              onClick={() => setSearchOpen(true)}
              aria-label="Open search input"
              title="Search"
            >
              <Search size={18} aria-hidden="true" />
            </button>
          )}
        </div>

        {onOpenVoice && (
          <button
            type="button"
            className="button button-outline"
            onClick={onOpenVoice}
            title="Multilingual Elder Voice Assistant"
            style={{ minHeight: 40, padding: '6px 14px', fontSize: 14 }}
          >
            <span>🎙️ Voice</span>
          </button>
        )}

        <Link
          className="button button-dark"
          style={{ minHeight: 44, padding: '8px 18px', fontSize: 15 }}
          to="/#check"
          onClick={handleCheckClick}
        >
          Check a number <ArrowRight size={16} aria-hidden="true" />
        </Link>

        {/* Mobile Menu Button with visible label "Menu" (Section 7 requirement) */}
        <button
          type="button"
          className="mobile-menu-btn"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-expanded={menuOpen}
          aria-label="Menu"
        >
          {menuOpen ? <X size={18} /> : <Menu size={18} />}
          <span>Menu</span>
        </button>
      </header>

      {/* Mobile Menu Overlay (200ms fade + 0.98 -> 1 scale) */}
      {menuOpen && (
        <div className="mobile-menu-overlay" onClick={() => setMenuOpen(false)}>
          <div className="mobile-menu-card" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Logo />
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label="Close menu"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8 }}
              >
                <X size={22} />
              </button>
            </div>
            <nav className="mobile-menu-links">
              {links.map(([href, label, Icon]) => (
                <Link
                  key={href}
                  to={href}
                  className={pathname === href ? 'active' : ''}
                >
                  <Icon size={20} aria-hidden="true" />
                  <span>{label}</span>
                </Link>
              ))}
              {onOpenVoice && (
                <button
                  type="button"
                  className="button button-outline"
                  onClick={() => {
                    setMenuOpen(false)
                    onOpenVoice()
                  }}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  🎙️ Voice Assistant (Elder Help)
                </button>
              )}
              <Link
                to="/#check"
                className="button button-dark"
                style={{ marginTop: 8 }}
                onClick={(e) => {
                  setMenuOpen(false)
                  handleCheckClick(e)
                }}
              >
                Check a number
              </Link>
            </nav>
          </div>
        </div>
      )}
    </div>
  )
}

/* ==========================================================================
   Footer Component (Warm Ink Black #141413, 4-column layout)
   ========================================================================== */
export function Footer() {
  const whatsappLink = import.meta.env.VITE_WHATSAPP_LINK || 'https://wa.me/910000000000'

  const handleFooterCheckClick = (e) => {
    if (window.location.pathname === '/') {
      e.preventDefault()
      const input = document.getElementById('phone-number')
      if (input) {
        input.scrollIntoView({ behavior: 'smooth', block: 'center' })
        setTimeout(() => input.focus(), 300)
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    }
  }

  return (
    <footer className="footer">
      <div className="footer-inner">
        <h2 className="footer-headline">Check before you call.</h2>

        <div className="footer-grid">
          <div className="footer-col">
            <h4>Check & Verify</h4>
            <ul>
              <li>
                <Link to="/#check" onClick={handleFooterCheckClick}>
                  Check a phone number
                </Link>
              </li>
              <li><Link to="/find">Official brand directory</Link></li>
              <li><Link to="/report">Report a scam number</Link></li>
              <li><Link to="/dashboard">Recent activity dashboard</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Cyber Safety</h4>
            <ul>
              <li>
                <a href="https://cybercrime.gov.in" target="_blank" rel="noopener noreferrer">
                  National Cyber Crime Portal ↗
                </a>
              </li>
              <li>
                <a href="tel:1930">
                  Call 1930 Helpline (India) ↗
                </a>
              </li>
              <li><span>Never share OTPs, PINs, or CVVs</span></li>
              <li><span>Verify helplines on official apps</span></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>WhatsApp Bot</h4>
            <ul>
              <li>
                <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                  Chat on WhatsApp ↗
                </a>
              </li>
              <li><span>Twilio Sandbox Verified</span></li>
              <li><span>Instant verification on chat</span></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>About DialSafe</h4>
            <ul>
              <li><span>Student safety project</span></li>
              <li><span>Shared database & verified records</span></li>
              <li><span>Risk estimate, not proof</span></li>
              <li><span>Due 10 October 2026</span></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© 2026 DialSafe. Built to protect citizens from fake customer care numbers.</p>
          <p>Results represent community risk estimates based on verified records and scam reports.</p>
        </div>
      </div>
    </footer>
  )
}

/* ==========================================================================
   Shell (Wrapper with Route Focus & Scroll Management)
   ========================================================================== */
export function Shell({ children, onOpenVoice }) {
  const location = useLocation()
  const { pathname, hash } = location

  // On route change: scroll to top or target hash, and manage focus
  useEffect(() => {
    if (hash) {
      const timer = setTimeout(() => {
        const el = document.querySelector(hash)
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' })
          const input = el.querySelector('input')
          if (input) {
            input.focus({ preventScroll: true })
          }
        }
      }, 50)
      return () => clearTimeout(timer)
    }

    window.scrollTo({ top: 0, behavior: 'instant' })
    const timer = setTimeout(() => {
      const h1 = document.querySelector('h1')
      if (h1) {
        h1.setAttribute('tabindex', '-1')
        h1.focus({ preventScroll: true })
      }
    }, 100)
    return () => clearTimeout(timer)
  }, [pathname, hash])

  return (
    <>
      <Navbar onOpenVoice={onOpenVoice} />
      <main className="route-container">{children}</main>
      <Footer />
    </>
  )
}

/* ==========================================================================
   Back Pill Button (Labelled "Back" pill on detail pages)
   ========================================================================== */
export function BackPill({ href, label = 'Back' }) {
  return (
    <Link to={href} className="back-pill">
      <span aria-hidden="true">←</span>
      <span>{label}</span>
    </Link>
  )
}

/* ==========================================================================
   Number Form with Nudge & Inline Validation & Spinner (Section 7)
   ========================================================================== */
export function NumberForm({ compact = false }) {
  const [value, setValue] = useState('')
  const [error, setError] = useState('')
  const [nudge, setNudge] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function submit(e) {
    e.preventDefault()
    if (!validNumber(value)) {
      setError('Enter a phone number with at least 7 digits.')
      setNudge(true)
      setTimeout(() => setNudge(false), 260)
      return
    }

    setError('')
    setLoading(true)

    try {
      const result = await checkNumber(value)
      navigate(result.detailUrl)
    } catch {
      navigate(`/number/${encodeURIComponent(value)}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className={`number-form ${compact ? 'compact' : ''}`} onSubmit={submit} id="check" noValidate>
      <label htmlFor="phone-number" style={{ display: 'block', fontWeight: 700, marginBottom: 8 }}>
        Phone number to check
      </label>

      <div className={`form-row ${nudge ? 'nudge' : ''}`}>
        <input
          id="phone-number"
          type="tel"
          inputMode="tel"
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            if (error) setError('')
          }}
          aria-invalid={!!error}
          aria-describedby={error ? 'number-error' : 'number-helper'}
          placeholder="Example: +91 90000 00001"
          disabled={loading}
        />

        <button
          className="button button-dark"
          disabled={loading}
          aria-busy={loading}
          type="submit"
          style={{ minWidth: 160 }}
        >
          {loading ? (
            <>
              <span className="spinner" aria-hidden="true" />
              <span>Checking…</span>
            </>
          ) : (
            <>
              <span>Check number</span>
              <ArrowRight size={18} aria-hidden="true" />
            </>
          )}
        </button>
      </div>

      {error ? (
        <p id="number-error" className="field-error" role="alert">
          <AlertTriangle size={16} aria-hidden="true" />
          <span>{error}</span>
        </p>
      ) : (
        <p id="number-helper" className="helper">
          Indian mobile numbers, 1800/1860 toll-free lines, or landlines with STD code.
        </p>
      )}
    </form>
  )
}

/* ==========================================================================
   Verdict Badge & Result Card (Section 7: 12px rise, drawn tick, no shake/pulse)
   ========================================================================== */
export function VerdictBadge({ verdict, verdictCode }) {
  return (
    <span className={`verdict-badge verdict-${verdictCode}`}>
      {verdictCode === 'verified' && (
        <svg
          className="verified-check-svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M20 6L9 17L4 12" />
        </svg>
      )}
      {verdictCode === 'high_risk' && <CircleAlert size={20} aria-hidden="true" />}
      {verdictCode === 'suspicious' && <FileWarning size={20} aria-hidden="true" />}
      {verdictCode === 'unknown' && <ShieldQuestion size={20} aria-hidden="true" />}
      <span>{verdict}</span>
    </span>
  )
}

export function VerdictCard({ result }) {
  const [reportCount, setReportCount] = useState(result.reportCount)
  const [flashUpdated, setFlashUpdated] = useState(false)

  const handleReportAdded = (newCount) => {
    setReportCount(newCount)
    setFlashUpdated(true)
    setTimeout(() => setFlashUpdated(false), 1250)
  }

  return (
    <section
      className={`verdict-card verdict-${result.verdictCode}`}
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="verdict-top">
        <VerdictBadge verdict={result.verdict} verdictCode={result.verdictCode} />
        <span className="score">
          Risk score: <strong>{result.score}/100</strong>
        </span>
      </div>

      <p className="estimate" style={{ marginTop: 10, color: 'var(--muted)', fontSize: 15 }}>
        This is a risk estimate based on verified records and reports, not mathematical proof.
      </p>

      {/* High-Risk Urgent Advisory (Hard requirement: never shake or pulse) */}
      {result.verdictCode === 'high_risk' && (
        <div className="urgent-advisory" role="alert">
          <div>
            <strong>Warning: High Risk of Fraud.</strong>
            <p style={{ margin: '6px 0 0' }}>
              Do not share OTPs, UPI PINs, passwords, or banking details with this caller.
            </p>
          </div>
          <div className="urgent-links">
            <a href="https://cybercrime.gov.in" target="_blank" rel="noopener noreferrer">
              Report at cybercrime.gov.in <ExternalLink size={14} />
            </a>
            <a href="tel:1930">
              Call 1930 Cyber Fraud Helpline <Phone size={14} />
            </a>
          </div>
        </div>
      )}

      <h2 style={{ fontSize: 22, margin: '28px 0 12px' }}>Why we reached this result</h2>
      <ul className="reasons">
        {result.reasons.slice(0, 5).map((reason, idx) => (
          <li key={idx} style={{ '--i': idx }}>
            {reason}
          </li>
        ))}
      </ul>

      <div
        style={{
          marginTop: 28,
          paddingTop: 20,
          borderTop: '1px solid var(--line)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className={`report-count-chip ${flashUpdated ? 'flash-updated' : ''}`}>
            {reportCount} {reportCount === 1 ? 'report' : 'reports'}
          </span>
          <span style={{ fontSize: 14, color: 'var(--muted)' }}>from community callers</span>
        </div>

        <Link
          to={`/report?number=${encodeURIComponent(result.number)}`}
          className="button button-outline"
          style={{ minHeight: 44, padding: '8px 18px', fontSize: 15 }}
        >
          Report this number
        </Link>
      </div>

      {result.officialNumber && (
        <div
          style={{
            marginTop: 24,
            background: 'var(--verdict-verified-bg)',
            border: '1.5px solid var(--verdict-verified-border)',
            borderRadius: 24,
            padding: 22,
          }}
        >
          <span style={{ display: 'block', fontSize: 14, fontWeight: 700, color: 'var(--verdict-verified-text)' }}>
            Official customer care number on record
          </span>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, flexWrap: 'wrap', gap: 12 }}>
            <a
              href={`tel:${result.officialNumber.replace(/\D/g, '')}`}
              style={{ fontSize: 26, fontWeight: 700, color: 'var(--ink)' }}
            >
              {formatNumber(result.officialNumber)}
            </a>
            <CopyNumber number={result.officialNumber} />
          </div>
        </div>
      )}
    </section>
  )
}

/* ==========================================================================
   Brand Card
   ========================================================================== */
export function BrandCard({ brand }) {
  const brandName = brand.brand || brand.name || ''
  const numbers = brand.officialNumbers || brand.official_numbers || []
  const hasPhone = numbers.length > 0 && !!numbers[0]

  return (
    <Link className="brand-card card-link" to={`/brand/${encodeURIComponent(brandName)}`}>
      <div>
        <h2>{brandName}</h2>
        {brand.sample && (
          <span
            style={{
              display: 'inline-block',
              color: 'var(--muted)',
              fontSize: 13,
              border: '1px solid var(--line)',
              borderRadius: 999,
              padding: '2px 8px',
              marginTop: 6,
            }}
          >
            Sample data
          </span>
        )}
      </div>

      <span style={{ fontSize: 16, fontWeight: 600, color: hasPhone ? 'var(--ink)' : 'var(--muted)' }}>
        {hasPhone ? formatNumber(numbers[0]) : 'In-App Support Only'}
      </span>

      <span className="satellite-cta" aria-hidden="true">
        <ArrowRight size={20} />
      </span>
    </Link>
  )
}

/* ==========================================================================
   Copy Number Button (Section 7: "Copied ✓" for 3s then revert)
   ========================================================================== */
export function CopyNumber({ number }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(number)
      } else {
        const textarea = document.createElement('textarea')
        textarea.value = number
        textarea.style.position = 'fixed'
        textarea.style.opacity = '0'
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
      }
    } catch {
      // Ignored: still display visual feedback
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 3000)
  }

  return (
    <button
      type="button"
      className="copy-button"
      onClick={handleCopy}
      aria-label={`Copy ${number} to clipboard`}
    >
      {copied ? (
        <>
          <Check size={16} strokeWidth={2.5} color="#1E7B3A" aria-hidden="true" />
          <span>Copied ✓</span>
        </>
      ) : (
        <>
          <Copy size={16} aria-hidden="true" />
          <span>Copy</span>
        </>
      )}
    </button>
  )
}

/* ==========================================================================
   Confirmation Modal (Section 7: Confirm before report with focus trap)
   ========================================================================== */
export function ConfirmReportModal({
  isOpen,
  number,
  brand,
  onConfirm,
  onCancel,
  loading = false,
}) {
  const modalRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return

    const timer = setTimeout(() => {
      if (modalRef.current) {
        const firstFocusable = modalRef.current.querySelector('button:not(:disabled)')
        if (firstFocusable) firstFocusable.focus()
      }
    }, 50)

    function handleKeyDown(e) {
      if (e.key === 'Escape') onCancel()
      if (e.key === 'Tab' && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll(
          'button:not(:disabled), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        if (focusable.length === 0) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]

        if (e.shiftKey && document.activeElement === first) {
          last.focus()
          e.preventDefault()
        } else if (!e.shiftKey && document.activeElement === last) {
          first.focus()
          e.preventDefault()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onCancel])

  if (!isOpen) return null

  const modalEl = (
    <div className="modal-backdrop" onClick={onCancel} role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="modal-card" ref={modalRef} onClick={(e) => e.stopPropagation()}>
        <h3 id="modal-title" style={{ marginTop: 0, fontSize: 24 }}>
          Confirm fraud report
        </h3>
        <p style={{ color: 'var(--ink)', fontSize: 16, margin: '14px 0 20px' }}>
          Are you sure you want to flag <strong>{number}</strong> {brand ? `(claiming to be ${brand})` : ''} as a suspected scam? This helps warn others.
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
          <button
            type="button"
            className="button button-outline"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="button"
            className="button button-dark"
            onClick={onConfirm}
            disabled={loading}
            aria-busy={loading}
          >
            {loading ? (
              <>
                <span className="spinner" aria-hidden="true" />
                <span>Sending report…</span>
              </>
            ) : (
              'Confirm & Report'
            )}
          </button>
        </div>
      </div>
    </div>
  )

  return typeof document !== 'undefined' ? createPortal(modalEl, document.body) : modalEl
}

/* ==========================================================================
   Report Success Card (Section 7: Drawn tick over 300ms, stays until dismissed)
   ========================================================================== */
export function ReportSuccessCard({ reportCount, onDismiss }) {
  return (
    <div className="success-card" role="status">
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <svg
          className="success-tick-svg"
          width="44"
          height="44"
          viewBox="0 0 44 44"
          fill="none"
          stroke="#1E7B3A"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="22" cy="22" r="20" stroke="#E6F4EA" strokeWidth="3" fill="#E6F4EA" />
          <path d="M13 22L19 28L31 16" />
        </svg>
        <div>
          <h2 style={{ fontSize: 24, margin: 0 }}>Thank you for reporting.</h2>
          <p style={{ margin: '6px 0 0', color: 'var(--muted)', fontSize: 16 }}>
            Your submission has been recorded. This number now has{' '}
            <strong style={{ color: 'var(--ink)' }}>{reportCount} reports</strong>.
          </p>
        </div>
      </div>

      <div style={{ marginTop: 28, display: 'flex', gap: 12 }}>
        <button type="button" className="button button-dark" onClick={onDismiss}>
          Report another number
        </button>
        <Link to="/" className="button button-outline">
          Back to Home
        </Link>
      </div>
    </div>
  )
}

/* ==========================================================================
   WhatsApp Banner & QR Code Dialog
   ========================================================================== */
export function WhatsAppBand() {
  const [showQR, setShowQR] = useState(false)
  const [qrLoading, setQrLoading] = useState(true)
  const whatsappLink = import.meta.env.VITE_WHATSAPP_LINK || 'https://wa.me/910000000000'

  const handleOpenQR = () => {
    setQrLoading(true)
    setShowQR(true)
  }

  useEffect(() => {
    if (!showQR) return

    const timer = setTimeout(() => {
      setQrLoading(false)
    }, 450)

    function handleKeyDown(e) {
      if (e.key === 'Escape') setShowQR(false)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [showQR])

  const qrModal = showQR ? (
    <div className="modal-backdrop" onClick={() => setShowQR(false)} role="dialog" aria-modal="true" style={{ padding: 20 }}>
      <div 
        className="modal-card" 
        style={{ 
          textAlign: 'center', 
          maxWidth: 460, 
          width: '100%',
          padding: '36px 32px 32px',
          position: 'relative',
          borderRadius: 36
        }} 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Floating Close Button in top right */}
        <button
          type="button"
          className="modal-close-btn"
          onClick={() => setShowQR(false)}
          aria-label="Close"
          style={{ position: 'absolute', top: 18, right: 18 }}
        >
          <X size={18} />
        </button>

        {/* Centered Icon Badge */}
        <div style={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          background: '#E6F4EA',
          border: '1.5px solid #34A853',
          display: 'grid',
          placeItems: 'center',
          color: '#1E7B3A',
          margin: '0 auto 14px'
        }}>
          <QrCode size={22} />
        </div>

        {/* Centered Title & Description */}
        <h3 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 700, color: 'var(--ink)' }}>
          Scan to chat on WhatsApp
        </h3>
        <p style={{ color: 'var(--muted)', fontSize: 15, margin: '0 auto 16px', maxWidth: 360, lineHeight: 1.45 }}>
          Point your smartphone camera to connect directly with the DialSafe WhatsApp verification bot.
        </p>

        {/* QR Code Container with Loading Skeleton & Scanning Beam */}
        <div className="qr-container-box">
          {qrLoading ? (
            <div className="qr-skeleton skeleton" aria-label="Loading QR code">
              <div className="qr-scan-line" aria-hidden="true" />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, zIndex: 2 }}>
                <span className="spinner" style={{ borderColor: 'rgba(20,20,19,0.2)', borderTopColor: 'var(--ink)' }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)' }}>Generating QR...</span>
              </div>
            </div>
          ) : (
            <div className="qr-code-rendered">
              <QRCodeSVG value={whatsappLink} size={200} />
            </div>
          )}
        </div>

        {/* Status Chip */}
        <div style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: 6, 
          background: 'var(--cream)', 
          padding: '6px 14px', 
          borderRadius: 'var(--radius-pill)', 
          border: '1px solid var(--line)', 
          fontSize: 13, 
          color: 'var(--muted)', 
          margin: '4px auto 22px' 
        }}>
          {qrLoading ? 'Connecting to Twilio Sandbox…' : 'Twilio WhatsApp Sandbox join instruction supported.'}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button 
            type="button" 
            className="button button-outline" 
            onClick={() => setShowQR(false)}
            style={{ minHeight: 46, padding: '0 20px', fontSize: 15 }}
          >
            Close
          </button>
          <a
            className="button button-dark"
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            style={{ minHeight: 46, padding: '0 22px', fontSize: 15, textDecoration: 'none' }}
          >
            Chat on WhatsApp <ArrowRight size={16} />
          </a>
        </div>
      </div>
    </div>
  ) : null

  return (
    <>
      <section className="whatsapp-band">
        <div>
          <h2 style={{ fontSize: 30 }}>Need quick help on WhatsApp?</h2>
          <p style={{ color: '#4A4844', fontSize: 18, margin: 0 }}>
            Send any phone number to DialSafe on WhatsApp for immediate verification.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button
            type="button"
            className="button button-outline"
            onClick={handleOpenQR}
            style={{ minHeight: 48 }}
          >
            <QrCode size={18} aria-hidden="true" />
            <span>Show QR Code</span>
          </button>
          <a
            className="button button-dark"
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            style={{ minHeight: 48 }}
          >
            Chat on WhatsApp <ArrowRight size={18} aria-hidden="true" />
          </a>
        </div>
      </section>

      {typeof document !== 'undefined' && qrModal ? createPortal(qrModal, document.body) : qrModal}
    </>
  )
}

/* ==========================================================================
   Skeleton Screens (Section 7 Layouts: Detail, Brand, Find, Dashboard)
   ========================================================================== */
export function SkeletonDetail() {
  return (
    <div className="skeleton-card" aria-hidden="true">
      <div className="skeleton" style={{ width: 180, height: 40, borderRadius: 999, marginBottom: 24 }} />
      <div className="skeleton" style={{ width: '70%', height: 44, borderRadius: 14, marginBottom: 20 }} />
      <div className="skeleton" style={{ width: '100%', height: 16, marginBottom: 10 }} />
      <div className="skeleton" style={{ width: '85%', height: 16, marginBottom: 28 }} />
      <div className="skeleton" style={{ width: 140, height: 36, borderRadius: 999 }} />
      <span className="sr-only">Loading number details…</span>
    </div>
  )
}

export function SkeletonBrand() {
  return (
    <div className="skeleton-card" aria-hidden="true">
      <div className="skeleton" style={{ width: 220, height: 48, borderRadius: 14, marginBottom: 24 }} />
      <div className="skeleton" style={{ width: '100%', height: 60, borderRadius: 20, marginBottom: 18 }} />
      <div className="skeleton" style={{ width: '50%', height: 16, marginBottom: 12 }} />
      <div className="skeleton" style={{ width: '35%', height: 16 }} />
      <span className="sr-only">Loading brand information…</span>
    </div>
  )
}

export function SkeletonFind() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }} aria-hidden="true">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="skeleton" style={{ height: 84, borderRadius: 24 }} />
      ))}
      <span className="sr-only">Loading official brand directory…</span>
    </div>
  )
}

export function SkeletonDashboard() {
  return (
    <div aria-hidden="true">
      <div className="stats-grid">
        <div className="skeleton" style={{ height: 130, borderRadius: 30 }} />
        <div className="skeleton" style={{ height: 130, borderRadius: 30 }} />
        <div className="skeleton" style={{ height: 130, borderRadius: 30 }} />
      </div>
      <div className="skeleton" style={{ height: 260, borderRadius: 28, marginTop: 32 }} />
      <span className="sr-only">Loading live dashboard…</span>
    </div>
  )
}

/* ==========================================================================
   Slow Server Notice (Section 7: 3s indeterminate line, 30s timeout)
   ========================================================================== */
export function SlowServerNotice({ secondsElapsed, onRetry }) {
  if (secondsElapsed < 3) return null

  if (secondsElapsed >= 30) {
    return (
      <div className="slow-server-notice" role="alert">
        <AlertTriangle size={24} color="#B3261E" />
        <p style={{ margin: '4px 0 10px', fontWeight: 600 }}>
          The server is taking too long to respond. Free cloud servers may take a minute to wake up.
        </p>
        {onRetry && (
          <button type="button" className="button button-dark" onClick={onRetry} style={{ minHeight: 40, padding: '8px 18px', fontSize: 14 }}>
            <RotateCcw size={14} /> Try again
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="slow-server-notice" role="status">
      <p style={{ margin: 0, fontSize: 15, fontWeight: 500 }}>
        Waking up the server. This can take up to 30 seconds. Please wait.
      </p>
      <div className="slow-server-bar" />
    </div>
  )
}
