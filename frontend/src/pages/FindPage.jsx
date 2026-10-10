import React, { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Search, X, AlertCircle, ArrowRight } from 'lucide-react'
import {
  Shell,
  BrandCard,
  SkeletonFind,
  SlowServerNotice,
} from '../components/dialsafe.jsx'
import { getAllBrands } from '../lib/api.js'

export default function FindPage({ onOpenVoice }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialQuery = searchParams.get('q') || ''

  const [query, setQuery] = useState(initialQuery)
  const [brandsList, setBrandsList] = useState([])
  const [loading, setLoading] = useState(true)
  const [showSkeleton, setShowSkeleton] = useState(false)
  const [secondsElapsed, setSecondsElapsed] = useState(0)

  useEffect(() => {
    setQuery(searchParams.get('q') || '')
  }, [searchParams])

  useEffect(() => {
    let isMounted = true
    const startTime = Date.now()

    const interval = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1)
    }, 1000)

    const skeletonTimer = setTimeout(() => {
      if (loading) setShowSkeleton(true)
    }, 200)

    getAllBrands()
      .then((data) => {
        const elapsed = Date.now() - startTime
        const delayRemaining = showSkeleton && elapsed < 400 ? 400 - elapsed : 0

        setTimeout(() => {
          if (isMounted) {
            setBrandsList(data)
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
  }, [showSkeleton, loading])

  const handleQueryChange = (val) => {
    setQuery(val)
    if (val.trim()) {
      setSearchParams({ q: val.trim() }, { replace: true })
    } else {
      setSearchParams({}, { replace: true })
    }
  }

  const handleClear = () => {
    setQuery('')
    setSearchParams({}, { replace: true })
  }

  const cleanQuery = query.trim().toLowerCase()
  const filtered = brandsList.filter((b) => {
    if (!cleanQuery) return true
    const brandName = (b.brand || b.name || '').toLowerCase()
    const matchesName = brandName.includes(cleanQuery)
    const matchesAlias = Array.isArray(b.aliases) && b.aliases.some((a) => {
      const lowerA = a.toLowerCase()
      return lowerA.includes(cleanQuery) || cleanQuery.includes(lowerA)
    })
    const numbers = b.officialNumbers || b.official_numbers || []
    const matchesNumber = Array.isArray(numbers) && numbers.some((num) => String(num).includes(cleanQuery))
    return matchesName || matchesAlias || matchesNumber
  })

  return (
    <Shell onOpenVoice={onOpenVoice}>
      <div className="inner-page" style={{ maxWidth: 840, margin: '0 auto', padding: '50px 0' }}>
        <p className="eyebrow">Official Directory</p>
        <h1>Find a company&apos;s verified number.</h1>
        <p className="page-lede">
          Browse official contact helplines verified directly from corporate apps and websites.
        </p>

        {/* Search Input with inline icon and clear button */}
        <div style={{ position: 'relative', marginBottom: 32 }}>
          <label htmlFor="brand-search" style={{ display: 'block', fontWeight: 700, marginBottom: 8 }}>
            Search companies or services
          </label>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <input
              id="brand-search"
              className="search-input"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              placeholder="Search SBI, Zomato, Paytm, HDFC, Swiggy, Flipkart..."
              style={{ paddingRight: 48 }}
            />
            {query ? (
              <button
                type="button"
                onClick={handleClear}
                aria-label="Clear search"
                style={{
                  position: 'absolute',
                  right: 16,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--muted)',
                  padding: 4,
                }}
              >
                <X size={18} />
              </button>
            ) : (
              <span style={{ position: 'absolute', right: 18, color: 'var(--muted)', pointerEvents: 'none' }}>
                <Search size={18} />
              </span>
            )}
          </div>
        </div>

        {loading && (
          <>
            <SkeletonFind />
            <SlowServerNotice
              secondsElapsed={secondsElapsed}
              onRetry={() => window.location.reload()}
            />
          </>
        )}

        {!loading && (
          <>
            {filtered.length > 0 ? (
              <div className="brand-list">
                {filtered.map((brand) => (
                  <BrandCard key={brand.brand || brand.name} brand={brand} />
                ))}
              </div>
            ) : (
              <div
                className="empty-state"
                style={{
                  background: 'var(--paper)',
                  borderRadius: 'var(--radius-card)',
                  padding: '48px 32px',
                  textAlign: 'center',
                  border: '1px solid var(--line)',
                }}
              >
                <AlertCircle size={36} color="var(--muted)" style={{ margin: '0 auto 16px' }} />
                <h2 style={{ fontSize: 24, margin: '0 0 8px' }}>No company found</h2>
                <p style={{ color: 'var(--muted)', fontSize: 16, maxWidth: 440, margin: '0 auto 24px' }}>
                  Try a different spelling, or report the suspicious number you received to warn the community.
                </p>
                <Link to="/report" className="button button-dark">
                  Report a suspicious number <ArrowRight size={16} />
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </Shell>
  )
}
