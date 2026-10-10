/**
 * frontend/src/services/gemini.js
 * Multilingual AI Voice Assistant backend powered by Google Gemini API
 * with strict DialSafe safety rules and local fallback.
 */

import { checkNumber, fetchBrands } from './api.js';

const SYSTEM_PROMPT = `
You are the DialSafe Elder-Care Safety Assistant. You protect elderly citizens and users from cyber fraud and fake customer care scams.
HARD RULES:
1. NEVER INVENT, GUESS, OR GENERATE PHONE NUMBERS. Only cite numbers present in verified context.
2. If a company uses APP-ONLY support (like Zomato, Swiggy, Flipkart), clearly tell the user they do NOT have a calling number and to only use the official app.
3. NEVER USE THE WORD "SAFE" OR CLAIM A NUMBER IS GUARANTEED SAFE.
4. If an unrecognized number or scam is mentioned, instruct the user:
   - NEVER share OTPs, bank passwords, or UPI PINs.
   - Call India's national cybercrime helpline 1930 or report at cybercrime.gov.in.
5. Keep replies concise (2 to 3 sentences maximum) because your response will be read aloud over voice.
6. Answer strictly in the language requested (English, Hindi, or Tamil).
`;

/**
 * Normalizes phone numbers for voice reading (e.g. "1800 1234" instead of "18001234")
 */
function formatForVoice(num) {
  if (!num) return '';
  const digits = String(num).replace(/\D/g, '');
  if (digits.startsWith('1800') && digits.length === 8) {
    return `1800 ${digits.slice(4)}`;
  }
  if (digits.startsWith('1800') && digits.length > 8) {
    return `1800 ${digits.slice(4, 7)} ${digits.slice(7)}`.trim();
  }
  if (digits.length === 10) {
    return `${digits.slice(0, 5)} ${digits.slice(5)}`;
  }
  return num;
}

/**
 * Robust multilingual brand finder
 */
export function findBrandInText(text, brandsList) {
  if (!text || !Array.isArray(brandsList)) return null;

  const raw = text.toLowerCase().trim();
  // Strip punctuation but keep letters, digits, and Indian scripts
  const clean = raw.replace(/[?,.!/\\()"'`~:;*&^%$#@+=_|\-]/g, ' ').replace(/\s+/g, ' ').trim();
  const tokens = clean.split(' ').filter(Boolean);

  // 1. Exact alias / brand substring search
  for (const b of brandsList) {
    const brandName = (b.name || b.brand || '').toLowerCase().trim();
    if (brandName && (clean.includes(brandName) || brandName.includes(clean))) {
      return b;
    }

    const aliases = b.aliases || [];
    for (const a of aliases) {
      const aliasLower = a.toLowerCase().trim();
      if (aliasLower && clean.includes(aliasLower)) {
        return b;
      }
    }
  }

  // 2. Token-based matching (handles individual words like "sbi", "zomato", "paytm", "पेटीएम", "एसबीआई")
  for (const b of brandsList) {
    const brandName = (b.name || b.brand || '').toLowerCase().trim();
    const aliases = (b.aliases || []).map(a => a.toLowerCase().trim());

    for (const token of tokens) {
      if (token.length >= 2) {
        if (aliases.includes(token) || brandName === token) {
          return b;
        }
      }
    }
  }

  // 3. Reverse token match for short queries (e.g. query is "sbi" or "zomato")
  for (const b of brandsList) {
    const aliases = (b.aliases || []).map(a => a.toLowerCase().trim());
    if (aliases.some(a => a.startsWith(clean) || clean.startsWith(a))) {
      return b;
    }
  }

  return null;
}

/**
 * Processes user voice query using Gemini API or local safety heuristics.
 */
export async function processVoiceQuery({ text, lang = 'en', apiKey = '' }) {
  const geminiKey = apiKey || (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY) || (typeof localStorage !== 'undefined' ? localStorage.getItem('dialsafe_gemini_key') : '') || '';
  const brands = await fetchBrands();

  // 1. Detect if text contains a phone number candidate
  const phoneMatch = text.match(/(?:\+91[\-\s]?)?[6-9]\d{9}\b|\b(?:1800|1860)\d{6,7}\b/);
  const foundNumber = phoneMatch ? phoneMatch[0].replace(/[\s\-]/g, '') : null;

  // 2. Detect if text mentions a brand
  const matchedBrand = findBrandInText(text, brands);

  // If Gemini API Key is available, call Google Gemini 1.5 Flash endpoint
  if (geminiKey) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;
      
      const contextInfo = `Verified Brands Directory:\n` + brands.map(b => {
        const numbers = b.official_numbers || b.officialNumbers || [];
        const channel = b.supportChannel || (numbers.length ? 'phone' : 'app');
        return `- ${b.name || b.brand}: Channel=${channel}, Numbers=${numbers.join(', ') || 'None (App Only)'}, Note=${b.supportNote || ''}`;
      }).join('\n');

      let queryContext = contextInfo;
      if (foundNumber) {
        const checkResult = await checkNumber(foundNumber, matchedBrand ? (matchedBrand.name || matchedBrand.brand) : '');
        queryContext += `\nVerification Result for ${foundNumber}: Verdict=${checkResult.verdict}, Reasons=${checkResult.reasons.join(', ')}`;
      }

      const prompt = `
${SYSTEM_PROMPT}

Target Language: ${lang === 'hi' ? 'Hindi (हिन्दी)' : lang === 'ta' ? 'Tamil (தமிழ்)' : 'English'}
Verified Context:
${queryContext}

User spoken inquiry: "${text}"

Respond in a warm, respectful, concise tone for an elderly person.
`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      if (response.ok) {
        const data = await response.json();
        const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (replyText) {
          const brandOfficialNumbers = matchedBrand ? (matchedBrand.official_numbers || matchedBrand.officialNumbers || []) : [];
          return {
            replyText: replyText.trim(),
            foundNumber: foundNumber || (brandOfficialNumbers.length ? brandOfficialNumbers[0] : null),
            matchedBrand: matchedBrand ? (matchedBrand.name || matchedBrand.brand) : null,
            source: 'gemini'
          };
        }
      }
    } catch (err) {
      console.warn('[Gemini] API error, falling back to local reasoning:', err.message);
    }
  }

  // Local Rule-Based Multi-lingual Fallback (Fast, Reliable, Zero Cost)
  return generateLocalFallbackResponse({ text, lang, foundNumber, matchedBrand });
}

function generateLocalFallbackResponse({ lang, foundNumber, matchedBrand }) {
  const brandName = matchedBrand ? (matchedBrand.name || matchedBrand.brand) : '';
  const officialNumbers = matchedBrand ? (matchedBrand.official_numbers || matchedBrand.officialNumbers || []) : [];
  const isAppSupport = matchedBrand ? (matchedBrand.supportChannel === 'app' || officialNumbers.length === 0) : false;
  const primaryNumber = officialNumbers.length > 0 ? officialNumbers[0] : null;
  const spokenNumber = primaryNumber ? formatForVoice(primaryNumber) : '';

  // Scenario A: Number check query
  if (foundNumber) {
    const isOfficial = matchedBrand && officialNumbers.some(n => {
      const cleanDigits = n.replace(/\D/g, '');
      const testDigits = foundNumber.replace(/\D/g, '');
      return cleanDigits.endsWith(testDigits) || testDigits.endsWith(cleanDigits) || cleanDigits === testDigits;
    });

    if (isOfficial) {
      if (lang === 'hi') {
        return {
          replyText: `यह नंबर ${brandName} का आधिकारिक वेरिफाइड रिकॉर्ड है। आप इस पर संपर्क कर सकते हैं, लेकिन कभी भी बैंक ओटीपी या पिन साझा न करें।`,
          foundNumber,
          matchedBrand: brandName
        };
      }
      if (lang === 'ta') {
        return {
          replyText: `இந்த எண் ${brandName} நிறுவனத்தின் அதிகாரப்பூர்வ சரிபார்க்கப்பட்ட எண் ஆகும். ஓடிபி விவரங்களைப் பகிர வேண்டாம்.`,
          foundNumber,
          matchedBrand: brandName
        };
      }
      return {
        replyText: `This number matches the official verified customer care helpline for ${brandName}. Never share OTPs or banking PINs.`,
        foundNumber,
        matchedBrand: brandName
      };
    }

    // Number is unverified or mismatch
    if (lang === 'hi') {
      return {
        replyText: `सावधान! यह नंबर ${brandName || 'संबंधित कंपनी'} का आधिकारिक हेल्पलाइन नंबर नहीं है। किसी भी व्यक्ति को बैंक ओटीपी या यूपीआई पिन न दें। साइबर धोखाधड़ी पर 1930 पर कॉल करें।`,
        foundNumber,
        matchedBrand: brandName || null
      };
    }
    if (lang === 'ta') {
      return {
        replyText: `எச்சரிக்கை! இந்த எண் அதிகாரப்பூர்வ எண் அல்ல. யாரிடமும் ஓடிபி (OTP) அல்லது வங்கி விவரங்களைப் பகிர வேண்டாம். உதவி எண் 1930-ஐ அழைக்கவும்.`,
        foundNumber,
        matchedBrand: brandName || null
      };
    }
    return {
      replyText: `Warning! This number is not an official helpline for ${brandName || 'the company'}. Never share OTPs or banking PINs. Call 1930 if you suspect fraud.`,
      foundNumber,
      matchedBrand: brandName || null
    };
  }

  // Scenario B: Brand Helpline Lookup
  if (matchedBrand) {
    // Sub-scenario B1: Brand is App-Only (No phone helpline)
    if (isAppSupport) {
      if (lang === 'hi') {
        return {
          replyText: `${brandName} का कोई सार्वजनिक कस्टमर केयर फोन नंबर नहीं है। ${brandName} केवल अपने आधिकारिक मोबाइल ऐप के माध्यम से सहायता प्रदान करता है। इंटरनेट पर मिलने वाले किसी भी अनधिकृत नंबर पर कॉल न करें।`,
          foundNumber: null,
          matchedBrand: brandName
        };
      }
      if (lang === 'ta') {
        return {
          replyText: `${brandName} நிறுவனத்திற்கு பொது அழைப்பு உதவி எண் எதுவும் இல்லை. உதவி பெற அவர்களின் அதிகாரப்பூர்வ செயலியை மட்டுமே பயன்படுத்தவும். இணையத்தில் உள்ள எண்களை நம்ப வேண்டாம்.`,
          foundNumber: null,
          matchedBrand: brandName
        };
      }
      return {
        replyText: `${brandName} does not have an official phone helpline. Customer care is available exclusively inside their official mobile app. Do not call numbers found on search engines or third-party sites.`,
        foundNumber: null,
        matchedBrand: brandName
      };
    }

    // Sub-scenario B2: Brand has verified phone numbers (e.g. SBI, HDFC, ICICI, Paytm)
    if (lang === 'hi') {
      return {
        replyText: `${brandName} का आधिकारिक वेरिफाइड कस्टमर केयर नंबर ${spokenNumber} है। यह उनके आधिकारिक पोर्टल से सत्यापित है। कभी भी किसी के साथ बैंक ओटीपी या यूपीआई पिन साझा न करें।`,
        foundNumber: primaryNumber,
        matchedBrand: brandName
      };
    }
    if (lang === 'ta') {
      return {
        replyText: `${brandName} நிறுவனத்தின் அதிகாரப்பூர்வ உதவி எண்: ${spokenNumber} ஆகும். உங்கள் ஓடிபி (OTP) அல்லது கடவுச்சொல்லை யாரிடமும் பகிர வேண்டாம்.`,
        foundNumber: primaryNumber,
        matchedBrand: brandName
      };
    }
    return {
      replyText: `The official customer care number for ${brandName} is ${spokenNumber}. This number is verified from their corporate portal. Never share OTPs or PINs.`,
      foundNumber: primaryNumber,
      matchedBrand: brandName
    };
  }

  // Scenario C: General query fallback
  if (lang === 'hi') {
    return {
      replyText: `मैं डायलसेफ हूँ। आप किसी भी कंपनी का नाम (जैसे SBI, Zomato, Paytm या HDFC) बोलकर उनका असली कस्टमर केयर नंबर पूछ सकते हैं, या कोई संदिग्ध फ़ोन नंबर चेक करवा सकते हैं।`,
      foundNumber: null,
      matchedBrand: null
    };
  }
  if (lang === 'ta') {
    return {
      replyText: `நான் டயல்சேஃப். நிறுவனத்தின் பெயர் (SBI, Zomato, HDFC) அல்லது தொலைபேசி எண்ணைக் கூறினால், நான் உங்களுக்குச் சரிபார்த்துத் தருகிறேன்.`,
      foundNumber: null,
      matchedBrand: null
    };
  }
  return {
    replyText: `I am DialSafe. You can speak any company name (like SBI, Zomato, Paytm, or HDFC) to get their official helpline, or read out a phone number to check if it looks like a scam.`,
    foundNumber: null,
    matchedBrand: null
  };
}
