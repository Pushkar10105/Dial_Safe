// lib/mock-data.js
// Brand data with official numbers verified from each company's own website.
// Source URLs and last-checked dates stored per DATA_RULES.md.
// Brands without a public helpline number are marked with supportChannel: 'app'.

export const brands = [
  {
    brand: 'State Bank of India',
    aliases: ['sbi', 'state bank', 'sbi bank', 'sbi care', 'sbi helpline', 'sbi customer care', 'state bank of india', 'एसबीआई', 'स्टेट बैंक', 'स्टेट बैंक ऑफ इंडिया', 'एसबीआई हेल्पलाइन', 'எஸ்பிஐ'],
    officialNumbers: ['18001234', '18002100', '18001112211', '18004253800'],
    sourceUrl: 'https://sbi.co.in/web/customer-care',
    lastChecked: '2026-10-10',
    knownFakeNumbers: ['+91 00000 00002'],
    sample: false,
    supportChannel: 'phone'
  },
  {
    brand: 'HDFC Bank',
    aliases: ['hdfc', 'hdfc bank', 'hdfc care', 'hdfc helpline', 'hdfc customer care', 'एचडीएफसी', 'एचडीएफसी बैंक', 'எச்டிஎஃப்சி'],
    officialNumbers: ['18001600', '18002600'],
    sourceUrl: 'https://www.hdfcbank.com/personal/need-help/customer-care',
    lastChecked: '2026-10-10',
    knownFakeNumbers: [],
    sample: false,
    supportChannel: 'phone'
  },
  {
    brand: 'ICICI Bank',
    aliases: ['icici', 'icici bank', 'icici care', 'icici helpline', 'icici customer care', 'आईसीआईसीआई', 'आईसीआईसीआई बैंक', 'ஐசிஐசிஐ'],
    officialNumbers: ['18001024242', '18001200'],
    sourceUrl: 'https://www.icicibank.com/contactus',
    lastChecked: '2026-10-10',
    knownFakeNumbers: [],
    sample: false,
    supportChannel: 'phone'
  },
  {
    brand: 'Axis Bank',
    aliases: ['axis bank', 'axis', 'axis care', 'axis helpline', 'axis customer care', 'एक्सिस बैंक', 'एक्सिस', 'ஆக்சிஸ் வங்கி'],
    officialNumbers: ['18004030', '18008911'],
    sourceUrl: 'https://www.axisbank.com/contact-us',
    lastChecked: '2026-10-10',
    knownFakeNumbers: [],
    sample: false,
    supportChannel: 'phone'
  },
  {
    brand: 'Kotak Mahindra Bank',
    aliases: ['kotak', 'kotak mahindra', 'kotak bank', 'kotak care', 'kotak helpline', 'कोटक बैंक', 'कोटक महिंद्रा', 'கோடக் வங்கி'],
    officialNumbers: ['18004100', '18002090000'],
    sourceUrl: 'https://www.kotak.com/en/customer-care.html',
    lastChecked: '2026-10-10',
    knownFakeNumbers: [],
    sample: false,
    supportChannel: 'phone'
  },
  {
    brand: 'Punjab National Bank',
    aliases: ['pnb', 'punjab national bank', 'pnb care', 'pnb helpline', 'पीएनबी', 'पंजाब नेशनल बैंक', 'பிஎன்பி'],
    officialNumbers: ['18001800', '18002021'],
    sourceUrl: 'https://www.pnbindia.in/customer-care.html',
    lastChecked: '2026-10-10',
    knownFakeNumbers: [],
    sample: false,
    supportChannel: 'phone'
  },
  {
    brand: 'Paytm',
    aliases: ['paytm', 'paytm care', 'paytm payments bank', 'paytm customer care', 'paytm helpline', 'पेटीएम', 'पेटीम', 'பேடிஎம்'],
    officialNumbers: ['01204456456'],
    sourceUrl: 'https://paytm.com/care',
    lastChecked: '2026-10-10',
    knownFakeNumbers: ['+91 00000 00003'],
    sample: false,
    supportChannel: 'phone'
  },
  {
    brand: 'Google Pay',
    aliases: ['google pay', 'gpay', 'googlepay', 'google pay care', 'google pay helpline', 'गूगल पे', 'जीपे', 'गूगलपे', 'கூகிள் பே'],
    officialNumbers: ['18004190157'],
    sourceUrl: 'https://support.google.com/pay/answer/7625055',
    lastChecked: '2026-10-10',
    knownFakeNumbers: [],
    sample: false,
    supportChannel: 'phone'
  },
  {
    brand: 'PhonePe',
    aliases: ['phonepe', 'phone pe', 'phonepe care', 'phonepe helpline', 'phonepe customer care', 'फोनपे', 'फ़ोनपे', 'போன்பே'],
    officialNumbers: [],
    sourceUrl: 'https://www.phonepe.com/contact-us/',
    lastChecked: '2026-10-10',
    knownFakeNumbers: [],
    sample: false,
    supportChannel: 'app',
    supportNote: 'PhonePe provides customer support exclusively through the official PhonePe app (Profile → Help). Do NOT share your UPI PIN or banking passwords with anyone.'
  },
  {
    brand: 'Reliance Jio',
    aliases: ['jio', 'reliance jio', 'jio care', 'jio helpline', 'jio customer care', 'जियो', 'रिलायंस जियो', 'ஜியோ'],
    officialNumbers: ['198', '199', '18008899999'],
    sourceUrl: 'https://www.jio.com/help/contact-us#/',
    lastChecked: '2026-10-10',
    knownFakeNumbers: [],
    sample: false,
    supportChannel: 'phone'
  },
  {
    brand: 'Bharti Airtel',
    aliases: ['airtel', 'bharti airtel', 'airtel care', 'airtel helpline', 'airtel customer care', 'एयरटेल', 'भारती एयरटेल', 'ஏர்டெல்'],
    officialNumbers: ['121', '198'],
    sourceUrl: 'https://www.airtel.in',
    lastChecked: '2026-10-10',
    knownFakeNumbers: [],
    sample: false,
    supportChannel: 'phone'
  },
  {
    brand: 'Vodafone Idea (Vi)',
    aliases: ['vi', 'vodafone idea', 'vodafone', 'idea', 'vi care', 'vi helpline', 'वीआई', 'वोडाफोन', 'விஐ'],
    officialNumbers: ['199', '198'],
    sourceUrl: 'https://www.myvi.in',
    lastChecked: '2026-10-10',
    knownFakeNumbers: [],
    sample: false,
    supportChannel: 'phone'
  },
  {
    brand: 'Zomato',
    aliases: ['zomato', 'zomato care', 'zomato support', 'zomato delivery', 'zomato ltd', 'zomato helpline', 'zomato customer care', 'जोमैटो', 'ज़ोमैटो', 'जोमेटो', 'ஜொமேட்டோ'],
    officialNumbers: [],
    sourceUrl: 'https://www.zomato.com/contact',
    lastChecked: '2026-10-10',
    knownFakeNumbers: ['+91 00000 00001'],
    sample: false,
    supportChannel: 'app',
    supportNote: 'Zomato provides support exclusively through the official Zomato app (Profile → Help). Do NOT trust phone numbers found online claiming to be Zomato customer care.'
  },
  {
    brand: 'Swiggy',
    aliases: ['swiggy', 'swiggy care', 'swiggy support', 'swiggy instamart', 'swiggy helpline', 'swiggy customer care', 'स्विगी', 'स्वीगी', 'ஸ்விகி'],
    officialNumbers: [],
    sourceUrl: 'https://www.swiggy.com/support',
    lastChecked: '2026-10-10',
    knownFakeNumbers: [],
    sample: false,
    supportChannel: 'app',
    supportNote: 'Swiggy provides support exclusively through the official Swiggy app (Help & Support section) or via email at support@swiggy.in. Do NOT trust phone numbers found online.'
  },
  {
    brand: 'Blinkit',
    aliases: ['blinkit', 'grofers', 'blinkit care', 'blinkit helpline', 'ब्लिंकइट', 'ब्लिंकिट', 'பிலின்கிட்'],
    officialNumbers: [],
    sourceUrl: 'https://blinkit.com',
    lastChecked: '2026-10-10',
    knownFakeNumbers: [],
    sample: false,
    supportChannel: 'app',
    supportNote: 'Blinkit provides customer support exclusively through the official Blinkit mobile app (Profile → Customer Support). Do not call any phone numbers claiming to represent Blinkit.'
  },
  {
    brand: 'Zepto',
    aliases: ['zepto', 'zepto care', 'zepto support', 'zepto helpline', 'ज़ेप्टो', 'जेप्टो', 'செப்டோ'],
    officialNumbers: [],
    sourceUrl: 'https://www.zeptonow.com',
    lastChecked: '2026-10-10',
    knownFakeNumbers: [],
    sample: false,
    supportChannel: 'app',
    supportNote: 'Zepto provides customer assistance exclusively through the official Zepto app or via support@zeptonow.com. Beware of fraudulent phone numbers online.'
  },
  {
    brand: 'Flipkart',
    aliases: ['flipkart', 'flipkart care', 'flipkart support', 'flipkart customer service', 'flipkart helpline', 'फ्लिपकार्ट', 'फ्लिप कार्ट', 'பிளிப்கார்ட்'],
    officialNumbers: [],
    sourceUrl: 'https://www.flipkart.com/helpcentre',
    lastChecked: '2026-10-10',
    knownFakeNumbers: [],
    sample: false,
    supportChannel: 'app',
    supportNote: 'Flipkart provides support only through the official website/app (Account → 24x7 Customer Care → Chat with us). Do NOT call numbers found on third-party sites.'
  },
  {
    brand: 'Amazon India',
    aliases: ['amazon', 'amazon india', 'amazon care', 'amazon customer service', 'amazon helpline', 'अमेज़न', 'अमेजन', 'அமேசான்'],
    officialNumbers: [],
    sourceUrl: 'https://www.amazon.in/contact-us',
    lastChecked: '2026-10-10',
    knownFakeNumbers: [],
    sample: false,
    supportChannel: 'app',
    supportNote: 'Amazon India provides customer support through the official Amazon app or website (Customer Service → Contact Us for chat or callback). Do NOT trust numbers found online.'
  },
  {
    brand: 'Meesho',
    aliases: ['meesho', 'meesho care', 'meesho support', 'meesho helpline', 'मीशो', 'மீஷோ'],
    officialNumbers: [],
    sourceUrl: 'https://www.meesho.com',
    lastChecked: '2026-10-10',
    knownFakeNumbers: [],
    sample: false,
    supportChannel: 'app',
    supportNote: 'Meesho provides support exclusively through the official Meesho app (Help Centre). Do not call any phone numbers found on search engines or social media.'
  },
  {
    brand: 'IRCTC / Rail Madad',
    aliases: ['irctc', 'rail madad', 'indian railways', 'railway enquiry', 'railway customer care', 'आईआरसीटीसी', 'रेलवे', 'रेल मदद', 'ஐஆர்சிடிசி'],
    officialNumbers: ['139'],
    sourceUrl: 'https://www.irctc.co.in',
    lastChecked: '2026-10-10',
    knownFakeNumbers: [],
    sample: false,
    supportChannel: 'phone'
  },
  {
    brand: 'National Cyber Crime Helpline',
    aliases: ['cyber crime', 'cybercrime', 'cyber helpline', 'cyber police', '1930', 'साइबर क्राइम', 'साइबर अपराध', 'சைபர் கிரைம்'],
    officialNumbers: ['1930'],
    sourceUrl: 'https://cybercrime.gov.in/',
    lastChecked: '2026-10-10',
    knownFakeNumbers: [],
    sample: false,
    supportChannel: 'phone'
  },
  {
    brand: 'National Consumer Helpline',
    aliases: ['consumer helpline', 'national consumer helpline', 'consumer court', 'nch', '1915', 'उपभोक्ता हेल्पलाइन', 'நுகர்வோர் உதவி எண்'],
    officialNumbers: ['1915'],
    sourceUrl: 'https://consumerhelpline.gov.in',
    lastChecked: '2026-10-10',
    knownFakeNumbers: [],
    sample: false,
    supportChannel: 'phone'
  }
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

  // Check if number matches any known official number
  const officialMatch = brands.find(b =>
    b.officialNumbers.some(n => digits.endsWith(n) || n.endsWith(digits) || n === digits)
  )
  if (officialMatch) {
    return {
      number,
      verdict: 'Verified official',
      verdictCode: 'verified',
      score: 0,
      reasons: [`Matches the official customer care number listed by ${officialMatch.brand} (Source: ${officialMatch.sourceUrl}).`],
      reportCount: 0,
      brand: officialMatch.brand,
      officialNumber: officialMatch.officialNumbers[0],
      detailUrl: `/number/${encodeURIComponent(number)}`,
      reports: []
    }
  }

  // Check if number matches a known fake
  const fakeMatch = brands.find(b =>
    b.knownFakeNumbers.some(f => f.replace(/\D/g, '') === digits)
  )
  if (fakeMatch) {
    return {
      number,
      verdict: 'High risk',
      verdictCode: 'high_risk',
      score: 95,
      reasons: [
        `This number has been flagged as a known fake for ${fakeMatch.brand}.`,
        'Multiple reports of this number impersonating official support.',
        'Do not share OTPs, PINs, or bank details.'
      ],
      reportCount: 14,
      brand: fakeMatch.brand,
      officialNumber: fakeMatch.officialNumbers[0] || null,
      detailUrl: `/number/${encodeURIComponent(number)}`,
      reports: [
        { note: 'Caller pretended to be support and requested bank OTP', createdAt: '2026-10-09T08:30:00Z' },
        { note: 'Demanded remote app installation for refund', createdAt: '2026-10-08T14:15:00Z' }
      ]
    }
  }

  // Heuristic based on last digit for demo variety
  const last = digits.slice(-1)
  if (['2', '4', '6', '8'].includes(last)) {
    return {
      number,
      verdict: 'High risk',
      verdictCode: 'high_risk',
      score: 92,
      reasons: [
        'Reported 14 times as suspected fraud by callers',
        'Not listed in official customer care database for the claimed company',
        'Multiple reports mention unsolicited requests for OTPs or PINs'
      ],
      reportCount: 14,
      brand: claimedBrand || null,
      officialNumber: null,
      detailUrl: `/number/${encodeURIComponent(number)}`,
      reports: [
        { note: 'Caller pretended to be support and requested bank OTP', createdAt: '2026-10-09T08:30:00Z' },
        { note: 'Demanded remote app installation for refund', createdAt: '2026-10-08T14:15:00Z' }
      ]
    }
  }
  if (last === '9') {
    return {
      number,
      verdict: 'Suspicious',
      verdictCode: 'suspicious',
      score: 64,
      reasons: [
        'Personal mobile number format claiming to be institutional helpline',
        'Recent community report flagged suspicious transaction inquiry'
      ],
      reportCount: 2,
      brand: claimedBrand || null,
      officialNumber: null,
      detailUrl: `/number/${encodeURIComponent(number)}`,
      reports: [
        { note: 'Called claiming to resolve pending account issue', createdAt: '2026-10-09T02:10:00Z' }
      ]
    }
  }

  return {
    number,
    verdict: 'Unknown',
    verdictCode: 'unknown',
    score: 25,
    reasons: [
      'We cannot confirm this number either way in our verified database',
      "Always verify contact numbers directly on the company's official website or mobile app before sharing details"
    ],
    reportCount: 0,
    brand: null,
    officialNumber: null,
    detailUrl: `/number/${encodeURIComponent(number)}`,
    reports: []
  }
}

export const mockCheck = (number, brand) => resultFor(number, brand)

export const mockBrand = (name) => {
  const decoded = decodeURIComponent(name).toLowerCase()
  const match = brands.find(b =>
    b.brand.toLowerCase() === decoded ||
    b.brand.toLowerCase().includes(decoded) ||
    (b.aliases && b.aliases.some(a => a.toLowerCase() === decoded || decoded.includes(a.toLowerCase())))
  )
  if (match) return match
  return {
    brand: decodeURIComponent(name),
    officialNumbers: [],
    sourceUrl: '#',
    lastChecked: '2026-10-10',
    knownFakeNumbers: [],
    sample: false,
    supportChannel: 'unknown',
    supportNote: "Brand not in our verified directory. Please check the company's official mobile app or website."
  }
}

export const mockStats = () => ({
  totals: { checks: 184, reports: 47, brands: brands.length },
  recentChecks: [
    { number: '+91 00000 00002', verdict: 'High risk', verdictCode: 'high_risk', score: 92, createdAt: 'Just now', reportCount: 14 },
    { number: '18001234', verdict: 'Verified official', verdictCode: 'verified', score: 0, createdAt: '12m ago', reportCount: 0 },
    { number: '+91 00000 00009', verdict: 'Suspicious', verdictCode: 'suspicious', score: 64, createdAt: '45m ago', reportCount: 2 },
    { number: '+91 00000 00000', verdict: 'Unknown', verdictCode: 'unknown', score: 25, createdAt: '1h ago', reportCount: 0 },
  ],
  recentReports: [
    { number: '+91 00000 00002', brand: 'State Bank of India', createdAt: '10m ago' },
    { number: '+91 00000 00001', brand: 'Zomato', createdAt: '35m ago' },
    { number: '+91 00000 00003', brand: 'Paytm', createdAt: '2h ago' },
  ],
})
