// lib/mock-data.js
// Obvious sample placeholders adhering to AGENTS.md and DATA_RULES.md

export const brands = [
  { brand: 'Sample Bank', officialNumbers: ['+91 90000 00001'], sourceUrl: 'https://example.com/sample-bank-care', lastChecked: '2026-10-09', knownFakeNumbers: ['+91 90000 00002'], sample: true },
  { brand: 'Sample Food Delivery', officialNumbers: ['+91 90000 00003'], sourceUrl: 'https://example.com/sample-food-care', lastChecked: '2026-10-09', knownFakeNumbers: ['+91 90000 00004'], sample: true },
  { brand: 'Sample E-Commerce', officialNumbers: ['+91 90000 00005'], sourceUrl: 'https://example.com/sample-shop-care', lastChecked: '2026-10-09', knownFakeNumbers: ['+91 90000 00006'], sample: true },
  { brand: 'Sample Payments App', officialNumbers: ['+91 90000 00007'], sourceUrl: 'https://example.com/sample-pay-care', lastChecked: '2026-10-09', knownFakeNumbers: ['+91 90000 00008'], sample: true },
]

export function parseVerdict(verdictStr) {
  const n = (verdictStr || '').trim().toLowerCase()
  if (n.includes('verified')) return { label: 'Verified official', code: 'verified' }
  if (n.includes('high') || n.includes('risk')) return { label: 'High risk', code: 'high_risk' }
  if (n.includes('suspicious')) return { label: 'Suspicious', code: 'suspicious' }
  return { label: 'Unknown', code: 'unknown' }
}

export function resultFor(number, claimedBrand) {
  const digits = number.replace(/\D/g, '')
  const last = digits.slice(-1)
  if (['1','3','5','7'].includes(last)) {
    return { number, verdict: 'Verified official', verdictCode: 'verified', score: 10, reasons: ['Matches listed official customer care contact from company records', 'Verified source URL available with documented check date'], reportCount: 0, brand: claimedBrand || 'Sample Bank', officialNumber: number, detailUrl: `/number/${encodeURIComponent(number)}`, reports: [] }
  }
  if (['2','4','6','8'].includes(last)) {
    return { number, verdict: 'High risk', verdictCode: 'high_risk', score: 92, reasons: ['Reported 14 times as suspected fraud by callers', 'Not listed in official customer care database for the claimed company', 'Multiple reports mention unsolicited requests for OTPs or PINs'], reportCount: 14, brand: claimedBrand || 'Sample Bank', officialNumber: '+91 90000 00001', detailUrl: `/number/${encodeURIComponent(number)}`, reports: [{ note: 'Caller pretended to be support and requested bank OTP', createdAt: '2026-10-09T08:30:00Z' }, { note: 'Demanded remote app installation for refund', createdAt: '2026-10-08T14:15:00Z' }] }
  }
  if (last === '9') {
    return { number, verdict: 'Suspicious', verdictCode: 'suspicious', score: 64, reasons: ['Personal mobile number format claiming to be institutional helpline', 'Recent community report flagged suspicious transaction inquiry'], reportCount: 2, brand: claimedBrand || null, officialNumber: null, detailUrl: `/number/${encodeURIComponent(number)}`, reports: [{ note: 'Called claiming to resolve pending account issue', createdAt: '2026-10-09T02:10:00Z' }] }
  }
  return { number, verdict: 'Unknown', verdictCode: 'unknown', score: 25, reasons: ["We cannot confirm this number either way in our verified database", "Always verify contact numbers directly on the company's official website or mobile app before sharing details"], reportCount: 0, brand: null, officialNumber: null, detailUrl: `/number/${encodeURIComponent(number)}`, reports: [] }
}

export const mockCheck = (number, brand) => resultFor(number, brand)

export const mockBrand = (name) => {
  const decoded = decodeURIComponent(name).toLowerCase()
  return brands.find(b => b.brand.toLowerCase() === decoded) || { brand: decodeURIComponent(name), officialNumbers: ['+91 90000 00001'], sourceUrl: 'https://example.com/official', lastChecked: '2026-10-09', knownFakeNumbers: [], sample: true }
}

export const mockStats = () => ({
  totals: { checks: 184, reports: 47, brands: brands.length },
  recentChecks: [
    { number: '+91 90000 00002', verdict: 'High risk', verdictCode: 'high_risk', score: 92, createdAt: 'Just now', reportCount: 14 },
    { number: '+91 90000 00001', verdict: 'Verified official', verdictCode: 'verified', score: 10, createdAt: '12m ago', reportCount: 0 },
    { number: '+91 90000 00009', verdict: 'Suspicious', verdictCode: 'suspicious', score: 64, createdAt: '45m ago', reportCount: 2 },
    { number: '+91 90000 00000', verdict: 'Unknown', verdictCode: 'unknown', score: 25, createdAt: '1h ago', reportCount: 0 },
  ],
  recentReports: [
    { number: '+91 90000 00002', brand: 'Sample Bank', createdAt: '10m ago' },
    { number: '+91 90000 00004', brand: 'Sample Food Delivery', createdAt: '35m ago' },
    { number: '+91 90000 00006', brand: 'Sample E-Commerce', createdAt: '2h ago' },
  ],
})
