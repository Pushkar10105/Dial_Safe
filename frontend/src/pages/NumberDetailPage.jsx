import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
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
    const startTime = Date.now()

    const interval = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1)
    }, 1000)

    const skeletonTimer = setTimeout(() => {
      if (loading) setShowSkeleton(true)
    }, 200)

    getNumberDetails(rawNumber)
      .then((data) => {
        const elapsed = Date.now() - startTime
        const delayRemaining = showSkeleton && elapsed < 400 ? 400 - elapsed : 0

        setTimeout(() => {
          if (isMounted) {
            setResult(data)
            setLoading(false)
          }
        }, delayRemaining)
      })
      .catch(() => {
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
      clearInterval(interval)
      clearTimeout(skeletonTimer)
    }
  }, [rawNumber, showSkeleton, loading])

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
      </div>
    </Shell>
  )
}
