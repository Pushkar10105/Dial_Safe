// lib/api.js
import { mockCheck, mockBrand, mockStats, brands, parseVerdict } from './mock-data.js'

const rawBaseUrl = import.meta.env.VITE_API_URL || ''
const API_BASE = rawBaseUrl.replace(/\/+$/, '')
const FORCE_MOCK = import.meta.env.VITE_USE_MOCK === 'true' || !API_BASE

const delay = ms => new Promise(r => setTimeout(r, ms))

async function fetchWithTimeout(url, options = {}, timeoutMs = 30000) {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeoutMs)
  try { return await fetch(url, { ...options, signal: controller.signal }) }
  finally { clearTimeout(id) }
}

export async function checkNumber(number, brand) {
  if (FORCE_MOCK) { await delay(350); return mockCheck(number, brand) }
  try {
    const res = await fetchWithTimeout(`${API_BASE}/check`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ number, brand }) })
    if (!res.ok) throw new Error(`${res.status}`)
    const data = await res.json()
    const { label, code } = parseVerdict(data.verdict)
    return { number: data.number || number, verdict: label, verdictCode: code, score: typeof data.score === 'number' ? Math.round(data.score <= 1 ? data.score * 100 : data.score) : 50, reasons: Array.isArray(data.reasons) && data.reasons.length > 0 ? data.reasons : ['No specific reasons recorded.'], reportCount: data.reportCount ?? 0, brand: data.brand || null, officialNumber: data.officialNumber || null, detailUrl: `/number/${encodeURIComponent(data.number || number)}`, reports: data.reports || [] }
  } catch { await delay(200); return mockCheck(number, brand) }
}

export async function getNumberDetails(n) {
  const decoded = decodeURIComponent(n)
  if (FORCE_MOCK) { await delay(300); return mockCheck(decoded) }
  try {
    const res = await fetchWithTimeout(`${API_BASE}/number/${encodeURIComponent(decoded)}`)
    if (!res.ok) throw new Error(`${res.status}`)
    const data = await res.json()
    const { label, code } = parseVerdict(data.verdict)
    return { number: data.number || decoded, verdict: label, verdictCode: code, score: typeof data.score === 'number' ? Math.round(data.score <= 1 ? data.score * 100 : data.score) : 50, reasons: Array.isArray(data.reasons) && data.reasons.length > 0 ? data.reasons : ['No specific reasons recorded.'], reportCount: data.reportCount ?? (data.reports ? data.reports.length : 0), brand: data.brand || null, officialNumber: data.officialNumber || null, detailUrl: `/number/${encodeURIComponent(data.number || decoded)}`, reports: Array.isArray(data.reports) ? data.reports : [] }
  } catch { await delay(200); return mockCheck(decoded) }
}

export async function getBrand(name) {
  const decoded = decodeURIComponent(name)
  if (FORCE_MOCK) { await delay(300); return mockBrand(decoded) }
  try {
    const res = await fetchWithTimeout(`${API_BASE}/brand/${encodeURIComponent(decoded)}`)
    if (!res.ok) throw new Error(`${res.status}`)
    const data = await res.json()
    return { brand: data.brand || decoded, officialNumbers: Array.isArray(data.officialNumbers) ? data.officialNumbers : [], sourceUrl: data.sourceUrl || '#', lastChecked: data.lastChecked || new Date().toISOString().split('T')[0], knownFakeNumbers: Array.isArray(data.knownFakeNumbers) ? data.knownFakeNumbers : [], sample: data.sample ?? false }
  } catch { await delay(200); return mockBrand(decoded) }
}

export async function getAllBrands() {
  if (FORCE_MOCK) { await delay(250); return brands }
  try {
    const res = await fetchWithTimeout(`${API_BASE}/brands`)
    if (!res.ok) return brands
    const data = await res.json()
    return Array.isArray(data) ? data : Array.isArray(data.brands) ? data.brands : brands
  } catch { return brands }
}

export async function getStats() {
  if (FORCE_MOCK) { await delay(350); return mockStats() }
  try {
    const res = await fetchWithTimeout(`${API_BASE}/stats`)
    if (!res.ok) throw new Error(`${res.status}`)
    const data = await res.json()
    return {
      totals: { checks: data.totals?.checks ?? 0, reports: data.totals?.reports ?? 0, brands: data.totals?.brands ?? brands.length },
      recentChecks: Array.isArray(data.recentChecks) ? data.recentChecks.map(item => { const { label, code } = parseVerdict(item.verdict); return { number: item.number, verdict: label, verdictCode: code, score: typeof item.score === 'number' ? Math.round(item.score <= 1 ? item.score * 100 : item.score) : 50, createdAt: item.createdAt || 'Recent', reportCount: item.reportCount ?? 0 } }) : [],
      recentReports: Array.isArray(data.recentReports) ? data.recentReports.map(item => ({ number: item.number, brand: item.brand || 'Unspecified', createdAt: item.createdAt || 'Recent' })) : [],
    }
  } catch { await delay(200); return mockStats() }
}

export async function reportNumber(payload) {
  if (FORCE_MOCK) { await delay(400); return { ok: true, reportCount: (mockCheck(payload.number).reportCount || 0) + 1 } }
  try {
    const res = await fetchWithTimeout(`${API_BASE}/report`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    if (!res.ok) throw new Error(`${res.status}`)
    const data = await res.json()
    return { ok: data.ok ?? true, reportCount: data.reportCount ?? 1 }
  } catch { await delay(300); return { ok: true, reportCount: (mockCheck(payload.number).reportCount || 0) + 1 } }
}

export function formatNumber(value) {
  if (!value) return ''
  const digits = value.replace(/\D/g, '')
  if (digits.length === 10) return `+91 ${digits.slice(0,5)} ${digits.slice(5)}`
  if (digits.length === 12 && digits.startsWith('91')) return `+91 ${digits.slice(2,7)} ${digits.slice(7)}`
  return value
}

export function validNumber(value) {
  if (!value) return false
  const digits = value.replace(/\D/g, '')
  return digits.length >= 7 && digits.length <= 15
}
