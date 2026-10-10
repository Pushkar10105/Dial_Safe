import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  Shell,
  VerdictCard,
  BackPill,
  SkeletonDetail,
  SlowServerNotice,
} from '../components/dialsafe.jsx'
import { getNumberDetails, formatNumber } from '../lib/api.js'

export default function NumberDetailPage({ onOpenVoice }) {
  const { n } = useParams()
  const rawNumber = decodeURIComponent(n || '')

  const [loading, setLoading] = useState(true)
  const [showSkeleton, setShowSkeleton] = useState(false)
  const [result, setResult] = useState(null)
  const [secondsElapsed, setSecondsElapsed] = useState(0)

  useEffect(() => {
    let isMounted = true
    setLoading(true)
    setShowSkeleton(false)
    setSecondsElapsed(0)
    const startTime = Date.now()

    const interval = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1)
    }, 1000)

    const skeletonTimer = setTimeout(() => {
      if (isMounted) setShowSkeleton(true)
    }, 200)

    getNumberDetails(rawNumber)
      .then((data) => {
        const elapsed = Date.now() - startTime
        const delayRemaining = elapsed < 200 ? 0 : 0

        setTimeout(() => {
          if (isMounted) {
            setResult(data)
            setLoading(false)
          }
        }, delayRemaining)
      })
      .catch(() => {
        if (isMounted) {
          setResult(null)
          setLoading(false)
        }
      })

    return () => {
      isMounted = false
      clearInterval(interval)
      clearTimeout(skeletonTimer)
    }
  }, [rawNumber])

  return (
    <Shell onOpenVoice={onOpenVoice}>
      <div className="inner-page" style={{ maxWidth: 840, margin: '0 auto', padding: '50px 0' }}>
        <BackPill href="/" label="Check another number" />

        <p className="eyebrow">Number Verification Result</p>
        <h1>Here&apos;s what we found.</h1>
        <p className="page-lede">
          Detailed assessment for <strong>{formatNumber(rawNumber)}</strong>. Always verify contacts
          on the company&apos;s official website or application before sharing sensitive data.
        </p>

        {loading && (
          <>
            <SkeletonDetail />
            <SlowServerNotice
              secondsElapsed={secondsElapsed}
              onRetry={() => window.location.reload()}
            />
          </>
        )}

        {!loading && result && (
          <VerdictCard result={result} />
        )}

        {!loading && !result && (
          <div
            style={{
              background: 'var(--paper)',
              borderRadius: 'var(--radius-card)',
              padding: 40,
              border: '1px solid var(--line)',
              textAlign: 'center',
              marginTop: 24,
            }}
          >
            <h2>Unable to load details</h2>
            <p style={{ color: 'var(--muted)', fontSize: 16, margin: '12px auto 24px', maxWidth: 480 }}>
              We could not retrieve assessment details for this number. Check the number and try again.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/#check" className="button button-outline">
                Check another number
              </Link>
              <Link to={`/report?number=${encodeURIComponent(rawNumber)}`} className="button button-dark">
                Report this number
              </Link>
            </div>
          </div>
        )}
      </div>
    </Shell>
  )
}
