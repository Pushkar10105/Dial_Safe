import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Shell,
  SkeletonDashboard,
  SlowServerNotice,
} from '../components/dialsafe.jsx'
import { getStats, formatNumber } from '../lib/api.js'
import { CheckCircle2, CircleAlert, FileWarning, ShieldQuestion } from 'lucide-react'

export default function DashboardPage({ onOpenVoice }) {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showSkeleton, setShowSkeleton] = useState(false)
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

    getStats()
      .then((data) => {
        const elapsed = Date.now() - startTime
        const delayRemaining = elapsed < 200 ? 0 : 0

        setTimeout(() => {
          if (isMounted) {
            setStats(data)
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
  }, [])

  return (
    <Shell onOpenVoice={onOpenVoice}>
      <div className="inner-page" style={{ maxWidth: 960, margin: '0 auto', padding: '50px 0' }}>
        <p className="eyebrow">Real-Time Community Activity</p>
        <h1>System Status & Feed</h1>
        <p className="page-lede">
          Aggregate numbers and live fraud checks verified across WhatsApp and Web channels.
        </p>

        {loading && (
          <>
            <SkeletonDashboard />
            <SlowServerNotice
              secondsElapsed={secondsElapsed}
              onRetry={() => window.location.reload()}
            />
          </>
        )}

        {!loading && stats && (
          <>
            <div className="stats-grid">
              <div className="stats-card">
                <strong>{stats.totals.checks}</strong>
                <span>Numbers Checked</span>
              </div>
              <div className="stats-card">
                <strong>{stats.totals.reports}</strong>
                <span>Scam Reports Ingested</span>
              </div>
              <div className="stats-card">
                <strong>{stats.totals.brands}</strong>
                <span>Verified Brands</span>
              </div>
            </div>

            {/* Recent Checks Feed */}
            <section style={{ marginTop: 40 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h2 style={{ fontSize: 24, margin: 0 }}>Recent Number Checks</h2>
                <Link to="/#check" style={{ fontSize: 15, fontWeight: 700, textDecoration: 'underline' }}>
                  Run a check ↗
                </Link>
              </div>

              <div className="activity-list">
                {stats.recentChecks && stats.recentChecks.length > 0 ? (
                  stats.recentChecks.map((item, idx) => (
                    <div className="activity-row" key={`${item.number}-${idx}`}>
                      <div>
                        <Link
                          to={`/number/${encodeURIComponent(item.number)}`}
                          style={{ fontWeight: 700, fontSize: 17, color: 'var(--ink)' }}
                        >
                          {formatNumber(item.number)}
                        </Link>
                        <span style={{ display: 'block', fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>
                          {item.createdAt}
                        </span>
                      </div>

                      <div>
                        <span
                          className={`verdict-badge verdict-${item.verdictCode}`}
                          style={{ padding: '6px 14px', fontSize: 14 }}
                        >
                          {item.verdictCode === 'verified' && <CheckCircle2 size={16} />}
                          {item.verdictCode === 'high_risk' && <CircleAlert size={16} />}
                          {item.verdictCode === 'suspicious' && <FileWarning size={16} />}
                          {item.verdictCode === 'unknown' && <ShieldQuestion size={16} />}
                          <span>{item.verdict}</span>
                        </span>
                      </div>

                      <div style={{ textAlign: 'right', fontSize: 15, color: 'var(--muted)' }}>
                        <strong>{item.reportCount}</strong> {item.reportCount === 1 ? 'report' : 'reports'}
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: 24, textAlign: 'center', color: 'var(--muted)' }}>
                    No check activity yet. Be the first to check a number!
                  </div>
                )}
              </div>
            </section>

            {/* Recent Reports Feed */}
            <section style={{ marginTop: 48 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h2 style={{ fontSize: 24, margin: 0 }}>Recent Scam Reports</h2>
                <Link to="/report" style={{ fontSize: 15, fontWeight: 700, textDecoration: 'underline' }}>
                  Submit report ↗
                </Link>
              </div>

              <div className="activity-list">
                {stats.recentReports && stats.recentReports.length > 0 ? (
                  stats.recentReports.map((item, idx) => (
                    <div className="activity-row" key={`${item.number}-${idx}`}>
                      <Link
                        to={`/number/${encodeURIComponent(item.number)}`}
                        style={{ fontWeight: 700, fontSize: 17, color: 'var(--ink)' }}
                      >
                        {formatNumber(item.number)}
                      </Link>
                      <span style={{ fontSize: 16, color: 'var(--ink)' }}>
                        {item.brand}
                      </span>
                      <span style={{ textAlign: 'right', color: 'var(--muted)', fontSize: 14 }}>
                        {item.createdAt}
                      </span>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: 24, textAlign: 'center', color: 'var(--muted)' }}>
                    No scam reports recorded yet.
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </Shell>
  )
}
