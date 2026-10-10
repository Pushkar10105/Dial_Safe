/**
 * frontend/src/services/api.js
 * Client API for DialSafe Backend.
 * Strictly implements docs/API_CONTRACT.md with offline fallback.
 */

import { brands as verifiedBrands } from '../lib/mock-data.js';

const rawApiUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || '';
const API_BASE_URL = rawApiUrl.replace(/\/+$/, '');

// Seed brands fallback in case backend is offline or during frontend demo
export const FALLBACK_BRANDS = verifiedBrands.map((b, idx) => ({
  id: idx + 1,
  name: b.brand,
  brand: b.brand,
  aliases: b.aliases || [],
  official_numbers: b.officialNumbers || [],
  officialNumbers: b.officialNumbers || [],
  source_url: b.sourceUrl,
  sourceUrl: b.sourceUrl,
  last_checked: b.lastChecked,
  lastChecked: b.lastChecked,
  known_fake_numbers: b.knownFakeNumbers || [],
  knownFakeNumbers: b.knownFakeNumbers || [],
  supportChannel: b.supportChannel || 'phone',
  supportNote: b.supportNote || ''
}));

export async function checkNumber(number, brand = '') {
  // If no API_BASE_URL or attempting localhost from a remote origin, use instant fallback
  const isLocalOnRemote = typeof window !== 'undefined' && 
    API_BASE_URL.includes('localhost') && 
    window.location.hostname !== 'localhost' && 
    window.location.hostname !== '127.0.0.1';

  if (API_BASE_URL && !isLocalOnRemote) {
    try {
      const res = await fetch(`${API_BASE_URL}/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number, brand: brand || undefined })
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('[API] Backend unreachable, using client heuristic fallback:', err.message);
    }
  }

  // Graceful client fallback
  const cleanNumber = number.replace(/[\s\-()]/g, '');
  const digits = cleanNumber.replace(/\D/g, '');

  const matchedBrand = FALLBACK_BRANDS.find(b => 
    (brand && (b.name.toLowerCase().includes(brand.toLowerCase()) || b.aliases?.some(a => a.toLowerCase().includes(brand.toLowerCase())))) ||
    b.official_numbers.some(n => digits.endsWith(n) || n.endsWith(digits) || n === digits)
  );

  if (matchedBrand && matchedBrand.official_numbers.some(n => digits.endsWith(n) || n.endsWith(digits) || n === digits)) {
    return {
      ok: true,
      number: cleanNumber,
      verdict: 'Verified official',
      verdictCode: 'verified_official',
      score: 0.0,
      reasons: [`Matches the official customer care number listed by ${matchedBrand.name} (Source: ${matchedBrand.source_url}).`],
      reportCount: 0,
      brand: matchedBrand.name,
      officialNumber: matchedBrand.official_numbers[0],
      detailUrl: `${typeof window !== 'undefined' ? window.location.origin : ''}#number-${cleanNumber}`,
      advice: ['Verified official contact number.']
    };
  }

  if (matchedBrand && (!matchedBrand.official_numbers.length || !matchedBrand.official_numbers.some(n => digits.endsWith(n) || n.endsWith(digits) || n === digits))) {
    return {
      ok: true,
      number: cleanNumber,
      verdict: 'High risk',
      verdictCode: 'high_risk',
      score: 0.88,
      reasons: [`This is not an official contact number for ${matchedBrand.name}.`],
      reportCount: 2,
      brand: matchedBrand.name,
      officialNumber: matchedBrand.official_numbers[0] || null,
      detailUrl: `${typeof window !== 'undefined' ? window.location.origin : ''}#number-${cleanNumber}`,
      advice: [
        'Do not share OTPs, PINs, or banking details.',
        'Report cyber fraud at cybercrime.gov.in or call 1930.'
      ]
    };
  }

  return {
    ok: true,
    number: cleanNumber,
    verdict: 'Unknown',
    verdictCode: 'unknown',
    score: 0.15,
    reasons: ['We cannot confirm this number either way. Check the company\'s official website or app.'],
    reportCount: 0,
    brand: null,
    officialNumber: null,
    detailUrl: `${typeof window !== 'undefined' ? window.location.origin : ''}#number-${cleanNumber}`,
    advice: [
      'We cannot confirm this number either way. Check the company\'s official website or mobile app.',
      'Do not share passwords, OTPs, or financial details.'
    ]
  };
}

export async function reportScam(number, brand = '', note = '') {
  const isLocalOnRemote = typeof window !== 'undefined' && 
    API_BASE_URL.includes('localhost') && 
    window.location.hostname !== 'localhost' && 
    window.location.hostname !== '127.0.0.1';

  if (API_BASE_URL && !isLocalOnRemote) {
    try {
      const res = await fetch(`${API_BASE_URL}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number, brand: brand || undefined, note: note || undefined })
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('[API] Backend unreachable for report, simulating response:', err.message);
    }
  }

  return { ok: true, reportCount: 1 };
}

export async function fetchBrands() {
  const isLocalOnRemote = typeof window !== 'undefined' && 
    API_BASE_URL.includes('localhost') && 
    window.location.hostname !== 'localhost' && 
    window.location.hostname !== '127.0.0.1';

  if (API_BASE_URL && !isLocalOnRemote) {
    try {
      const res = await fetch(`${API_BASE_URL}/brands`);
      if (res.ok) {
        const data = await res.json();
        const raw = Array.isArray(data) ? data : Array.isArray(data.brands) ? data.brands : null;
        if (raw && raw.length > 0) {
          return raw.map((b, idx) => ({
            id: b.id || idx + 1,
            name: b.name || b.brand,
            brand: b.brand || b.name,
            aliases: b.aliases || [],
            official_numbers: b.official_numbers || b.officialNumbers || [],
            officialNumbers: b.officialNumbers || b.official_numbers || [],
            source_url: b.source_url || b.sourceUrl || '#',
            sourceUrl: b.sourceUrl || b.source_url || '#',
            last_checked: b.last_checked || b.lastChecked || new Date().toISOString().split('T')[0],
            lastChecked: b.lastChecked || b.last_checked || new Date().toISOString().split('T')[0],
            known_fake_numbers: b.known_fake_numbers || b.knownFakeNumbers || [],
            knownFakeNumbers: b.knownFakeNumbers || b.known_fake_numbers || [],
            supportChannel: b.supportChannel || ((b.officialNumbers?.length || b.official_numbers?.length) ? 'phone' : 'app'),
            supportNote: b.supportNote || ''
          }));
        }
      }
    } catch (err) {
      // fallback
    }
  }
  return FALLBACK_BRANDS;
}

export async function fetchStats() {
  const isLocalOnRemote = typeof window !== 'undefined' && 
    API_BASE_URL.includes('localhost') && 
    window.location.hostname !== 'localhost' && 
    window.location.hostname !== '127.0.0.1';

  if (API_BASE_URL && !isLocalOnRemote) {
    try {
      const res = await fetch(`${API_BASE_URL}/stats`);
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      // fallback
    }
  }
  return {
    totals: { checks: 184, reports: 47, brands: FALLBACK_BRANDS.length },
    recentChecks: [
      { number: '+91 00000 00002', verdict: 'High risk', createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString() },
      { number: '1800 1234', verdict: 'Verified official', createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString() },
      { number: '+91 00000 00009', verdict: 'Suspicious', createdAt: new Date(Date.now() - 1000 * 60 * 75).toISOString() }
    ],
    recentReports: [
      { number: '+91 00000 00002', brand: 'State Bank of India', createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString() },
      { number: '+91 00000 00001', brand: 'Zomato', createdAt: new Date(Date.now() - 1000 * 60 * 55).toISOString() }
    ]
  };
}
