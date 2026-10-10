import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  Shell,
  CopyNumber,
  BackPill,
  SkeletonBrand,
  SlowServerNotice,
} from '../components/dialsafe.jsx'
import { getBrand, formatNumber } from '../lib/api.js'
import { ExternalLink, ShieldAlert } from 'lucide-react'

export default function BrandDetailPage({ onOpenVoice }) {
  const { name } = useParams()
  const brandName = decodeURIComponent(name || '')

  const [loading, setLoading] = useState(true)
  const [showSkeleton, setShowSkeleton] = useState(false)
  const [brand, setBrand] = useState(null)
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

    getBrand(brandName)
      .then((data) => {
        const elapsed = Date.now() - startTime
        const delayRemaining = showSkeleton && elapsed < 400 ? 400 - elapsed : 0

        setTimeout(() => {
          if (isMounted) {
            setBrand(data)
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
  }, [brandName, showSkeleton, loading])

  return (
    <Shell onOpenVoice={onOpenVoice}>
      <div className="inner-page" style={{ maxWidth: 840, margin: '0 auto', padding: '50px 0' }}>
        <BackPill href="/find" label="Find another company" />

        <p className="eyebrow">Verified Official Helpline</p>
        <h1>{brand ? brand.brand : brandName}</h1>

        {brand?.sample && (
          <span
            style={{
              display: 'inline-block',
              color: 'var(--muted)',
              fontSize: 14,
              border: '1px solid var(--line)',
              borderRadius: 999,
              padding: '3px 10px',
              marginBottom: 20,
            }}
          >
            Sample data record
          </span>
        )}

        {loading && (
          <>
            <SkeletonBrand />
            <SlowServerNotice
              secondsElapsed={secondsElapsed}
              onRetry={() => window.location.reload()}
            />
          </>
        )}

        {!loading && brand && (
          <>
            <div
              style={{
                background: 'var(--paper)',
                borderRadius: 'var(--radius-card)',
                padding: 36,
                border: '1px solid var(--line)',
                boxShadow: '0 4px 24px rgba(0,0,0,0.04)',
                marginTop: 20,
              }}
            >
              {brand.officialNumbers && brand.officialNumbers.length > 0 ? (
                <>
                  <h2 style={{ fontSize: 24, marginTop: 0 }}>Official contact number</h2>
                  {brand.officialNumbers.map((number) => (
                    <div
                      key={number}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderBottom: '1px solid var(--line)',
                        padding: '16px 0',
                        flexWrap: 'wrap',
                        gap: 12,
                      }}
                    >
                      <a
                        href={`tel:${number.replace(/\D/g, '')}`}
                        style={{ fontSize: 28, fontWeight: 700, color: 'var(--ink)' }}
                        className="tap-to-call"
                      >
                        {formatNumber(number)}
                      </a>
                      <CopyNumber number={number} />
                    </div>
                  ))}
                  <p style={{ color: 'var(--muted)', fontSize: 15, marginTop: 14 }}>
                    Tap the number to call directly. Always cross-verify on the company&apos;s own app or website.
                  </p>
                </>
              ) : (
                <div style={{ padding: '8px 0 16px' }}>
                  <div
                    style={{
                      background: 'rgba(234, 88, 12, 0.08)',
                      border: '1.5px solid rgba(234, 88, 12, 0.3)',
                      borderRadius: 16,
                      padding: '20px 24px',
                    }}
                  >
                    <h3 style={{ margin: '0 0 10px', color: '#c2410c', fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span>📱</span> In-App Support Only — No Public Phone Number
                    </h3>
                    <p style={{ margin: 0, fontSize: 15, color: 'var(--ink)', lineHeight: 1.6 }}>
                      {brand.supportNote || `${brand.brand} provides customer assistance exclusively through their official mobile app. Do not trust or call any phone numbers claiming to represent ${brand.brand} found on search engines or third-party websites.`}
                    </p>
                  </div>
                </div>
              )}

              <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                <a
                  href={brand.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontWeight: 700, textDecoration: 'underline', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  View source website <ExternalLink size={15} />
                </a>

                <span style={{ color: 'var(--muted)', fontSize: 14 }}>
                  Verified: {brand.lastChecked}
                </span>
              </div>
            </div>

            {brand.knownFakeNumbers && brand.knownFakeNumbers.length > 0 && (
              <div
                style={{
                  background: 'var(--paper)',
                  borderRadius: 'var(--radius-card)',
                  padding: 32,
                  marginTop: 32,
                  border: '1.5px solid var(--verdict-high-border)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--verdict-high-text)' }}>
                  <ShieldAlert size={22} />
                  <h2 style={{ fontSize: 22, margin: 0, color: 'var(--verdict-high-text)' }}>
                    Known fake numbers reported for {brand.brand}
                  </h2>
                </div>
                <p style={{ color: 'var(--muted)', fontSize: 15, margin: '8px 0 16px' }}>
                  These numbers have been identified in public advisories pretending to be this company.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {brand.knownFakeNumbers.map((fake) => (
                    <div
                      key={fake}
                      style={{
                        padding: '12px 18px',
                        background: 'var(--verdict-high-bg)',
                        borderRadius: 14,
                        color: 'var(--verdict-high-text)',
                        fontWeight: 700,
                        fontSize: 17,
                      }}
                    >
                      {formatNumber(fake)}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Shell>
  )
}
