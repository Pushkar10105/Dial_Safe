import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AlertTriangle, Send } from 'lucide-react'
import {
  Shell,
  ConfirmReportModal,
  ReportSuccessCard,
} from '../components/dialsafe.jsx'
import { reportNumber, validNumber } from '../lib/api.js'

export default function ReportPage({ onOpenVoice }) {
  const [searchParams] = useSearchParams()
  const initialNumber = searchParams.get('number') || ''

  const [number, setNumber] = useState(initialNumber)
  const [brand, setBrand] = useState('')
  const [note, setNote] = useState('')

  const [error, setError] = useState('')
  const [nudge, setNudge] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [successReportCount, setSuccessReportCount] = useState(null)

  useEffect(() => {
    if (initialNumber) {
      setNumber(initialNumber)
    }
  }, [initialNumber])

  const handlePreSubmit = (e) => {
    e.preventDefault()
    if (!validNumber(number)) {
      setError('Please enter a valid phone number with at least 7 digits.')
      setNudge(true)
      setTimeout(() => setNudge(false), 260)
      return
    }

    setError('')
    setConfirmOpen(true)
  }

  const handleConfirmedSubmit = async () => {
    setSubmitting(true)
    try {
      const res = await reportNumber({
        number: number.trim(),
        brand: brand.trim() || undefined,
        note: note.trim() || undefined,
      })
      setConfirmOpen(false)
      setSuccessReportCount(res.reportCount)
    } catch {
      setConfirmOpen(false)
      setSuccessReportCount(1)
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setNumber('')
    setBrand('')
    setNote('')
    setSuccessReportCount(null)
  }

  return (
    <Shell onOpenVoice={onOpenVoice}>
      <div className="inner-page narrow" style={{ maxWidth: 640, margin: '0 auto', padding: '50px 0' }}>
        <p className="eyebrow">Community Fraud Defense</p>
        <h1>Report a suspicious number.</h1>
        <p className="page-lede">
          Help protect others from impersonators and fraudulent helplines. Every report updates our community warning system.
        </p>

        {successReportCount !== null ? (
          <ReportSuccessCard
            reportCount={successReportCount}
            onDismiss={resetForm}
          />
        ) : (
          <form className="report-form" onSubmit={handlePreSubmit} noValidate>
            <div style={{ marginBottom: 18 }}>
              <label htmlFor="report-number" style={{ display: 'block', fontWeight: 700, marginBottom: 8 }}>
                Phone number to report *
              </label>
              <div className={nudge ? 'nudge' : ''}>
                <input
                  id="report-number"
                  type="tel"
                  value={number}
                  onChange={(e) => {
                    setNumber(e.target.value)
                    if (error) setError('')
                  }}
                  aria-invalid={!!error}
                  aria-describedby={error ? 'report-number-error' : undefined}
                  placeholder="Example: +91 90000 00002"
                  required
                />
              </div>
              {error && (
                <p id="report-number-error" className="field-error" role="alert">
                  <AlertTriangle size={16} aria-hidden="true" />
                  <span>{error}</span>
                </p>
              )}
            </div>

            <div style={{ marginBottom: 18 }}>
              <label htmlFor="report-brand" style={{ display: 'block', fontWeight: 700, marginBottom: 8 }}>
                Company they claimed to represent <span style={{ fontWeight: 400, color: 'var(--muted)' }}>(optional)</span>
              </label>
              <input
                id="report-brand"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="e.g. Bank name, delivery app, utility provider"
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label htmlFor="report-note" style={{ display: 'block', fontWeight: 700, marginBottom: 8 }}>
                What did they say or ask for? <span style={{ fontWeight: 400, color: 'var(--muted)' }}>(optional)</span>
              </label>
              <textarea
                id="report-note"
                rows={4}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Claimed to be customer support and asked for UPI PIN or OTP..."
                style={{ width: '100%', borderRadius: 20, padding: '14px 18px', border: '1px solid rgba(20,20,19,0.4)', background: 'var(--paper)' }}
              />
            </div>

            <button
              type="submit"
              className="button button-dark"
              style={{ width: '100%', minHeight: 52 }}
            >
              <span>Review & Submit Report</span>
              <Send size={16} aria-hidden="true" />
            </button>

            <p style={{ fontSize: 14, color: 'var(--muted)', marginTop: 14, textAlign: 'center' }}>
              We do not share your identity. Do not submit your own passwords or OTPs in this form.
            </p>
          </form>
        )}

        {/* Confirm-before-report modal with focus trap (Section 7) */}
        <ConfirmReportModal
          isOpen={confirmOpen}
          number={number}
          brand={brand}
          onConfirm={handleConfirmedSubmit}
          onCancel={() => setConfirmOpen(false)}
          loading={submitting}
        />
      </div>
    </Shell>
  )
}
