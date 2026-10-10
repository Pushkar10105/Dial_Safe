import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Search, Phone } from 'lucide-react'
import {
  Shell,
  NumberForm,
  WhatsAppBand,
  LogoIcon,
} from '../components/dialsafe.jsx'

export default function Home({ onOpenVoice }) {
  const handleScrollToCheck = (e) => {
    if (e) e.preventDefault()
    const input = document.getElementById('phone-number')
    if (input) {
      input.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setTimeout(() => {
        input.focus()
      }, 300)
    } else {
      const form = document.getElementById('check')
      if (form) {
        form.scrollIntoView({ behavior: 'smooth', block: 'center' })
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    }
  }

  return (
    <Shell onOpenVoice={onOpenVoice}>
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Phone number verification</p>
          <h1>Know before you call.</h1>
          <p className="hero-lede">
            Check any phone number for scam warnings, or look up verified official customer care contacts.
          </p>
          <NumberForm />
        </div>

        {/* Orbit Arcs (Section 7: draws once on desktop home only with pathLength="1", hidden on mobile) */}
        <div className="hero-orbit" aria-hidden="true">
          <svg className="orbit-arc-svg" viewBox="0 0 440 440">
            {/* Outer Orbital Arc */}
            <path
              d="M 60 220 A 160 160 0 1 1 380 220 A 160 160 0 1 1 60 220"
              pathLength="1"
            />
            {/* Elliptical Cross Arc */}
            <path
              d="M 40 220 C 40 100 400 100 400 220 C 400 340 40 340 40 220"
              pathLength="1"
              style={{ animationDelay: '150ms' }}
            />
          </svg>
          <div className="orbit-core">
            <LogoIcon size={84} />
          </div>
        </div>
      </section>

      {/* Two Clear Choices (Section 7: 80ms stagger) */}
      <section className="choice-section">
        <div>
          <p className="eyebrow">Start here</p>
          <h2>One simple check can prevent a costly mistake.</h2>
          <p style={{ marginTop: 12, color: 'var(--muted)', fontSize: 17 }}>
            Fraudulent customer care numbers are a primary cause of online scams in India.
          </p>
        </div>

        <div className="choice-grid">
          <a
            className="choice-card dark-choice card-link"
            href="#check"
            onClick={handleScrollToCheck}
            style={{ cursor: 'pointer' }}
          >
            <span className="choice-icon" aria-hidden="true">
              <Search size={32} />
            </span>
            <h3>Check a number</h3>
            <p>See whether a phone number has reported scam signals before calling.</p>
            <span className="satellite-cta" aria-hidden="true">
              <ArrowRight size={20} />
            </span>
          </a>

          <Link className="choice-card card-link" to="/find">
            <span className="choice-icon" aria-hidden="true">
              <Phone size={32} />
            </span>
            <h3>Find official number</h3>
            <p>Fetch verified customer care helplines from official sources.</p>
            <span className="satellite-cta" aria-hidden="true">
              <ArrowRight size={20} />
            </span>
          </Link>
        </div>
      </section>

      {/* WhatsApp Bot Connection */}
      <WhatsAppBand />
    </Shell>
  )
}
