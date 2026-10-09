/**
 * frontend/src/services/gemini.js
 * Multilingual AI Voice Assistant backend powered by Google Gemini API
 * with strict DialSafe safety rules and local fallback.
 */

import { checkNumber, fetchBrands } from './api';

const SYSTEM_PROMPT = `
You are the DialSafe Elder-Care Safety Assistant. You protect elderly citizens and users from cyber fraud and fake customer care scams.
HARD RULES:
1. NEVER INVENT, GUESS, OR GENERATE PHONE NUMBERS. Only cite numbers present in verified context.
2. NEVER USE THE WORD "SAFE" OR CLAIM A NUMBER IS GUARANTEED SAFE.
3. If an unrecognized number or scam is mentioned, instruct the user:
   - NEVER share OTPs, bank passwords, or UPI PINs.
   - Call India's national cybercrime helpline 1930 or report at cybercrime.gov.in.
4. Keep replies concise (2 to 3 sentences maximum) because your response will be read aloud over voice.
5. Answer strictly in the language requested (English, Hindi, or Tamil).
`;

/**
 * Processes user voice query using Gemini API or local safety heuristics.
 */
export async function processVoiceQuery({ text, lang = 'en', apiKey = '' }) {
  const geminiKey = apiKey || import.meta.env.VITE_GEMINI_API_KEY || localStorage.getItem('dialsafe_gemini_key') || '';
  const brands = await fetchBrands();

  // 1. Detect if text contains a phone number candidate
  const phoneMatch = text.match(/(?:\+91[\-\s]?)?[6-9]\d{9}\b|\b(?:1800|1860)\d{6,7}\b/);
  const foundNumber = phoneMatch ? phoneMatch[0].replace(/[\s\-]/g, '') : null;

  // 2. Detect if text mentions a brand
  const lowerText = text.toLowerCase();
  const matchedBrand = brands.find(b => 
    lowerText.includes(b.name.toLowerCase()) || 
    (b.aliases && b.aliases.some(a => lowerText.includes(a.toLowerCase())))
  );

  // If Gemini API Key is available, call Google Gemini 1.5 Flash endpoint
  if (geminiKey) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;
      
      let contextInfo = `Verified Brands available: ${JSON.stringify(brands.map(b => ({ name: b.name, official_numbers: b.official_numbers })))}`;
      if (foundNumber) {
        const checkResult = await checkNumber(foundNumber, matchedBrand ? matchedBrand.name : '');
        contextInfo += `\nVerification Result for ${foundNumber}: Verdict=${checkResult.verdict}, Reasons=${checkResult.reasons.join(', ')}`;
      }

      const prompt = `
${SYSTEM_PROMPT}

Target Language: ${lang === 'hi' ? 'Hindi (हिन्दी)' : lang === 'ta' ? 'Tamil (தமிழ்)' : 'English'}
Verified Context:
${contextInfo}

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
          return {
            replyText: replyText.trim(),
            foundNumber,
            matchedBrand: matchedBrand ? matchedBrand.name : null,
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

function generateLocalFallbackResponse({ text, lang, foundNumber, matchedBrand }) {
  // Scenario A: Number check query
  if (foundNumber) {
    if (matchedBrand && matchedBrand.official_numbers.includes(foundNumber)) {
      if (lang === 'hi') {
        return {
          replyText: `यह नंबर ${matchedBrand.name} का आधिकारिक नंबर है। यह उनके वेरिफाइड रिकॉर्ड से मेल खाता है।`,
          foundNumber,
          matchedBrand: matchedBrand.name
        };
      }
      if (lang === 'ta') {
        return {
          replyText: `இந்த எண் ${matchedBrand.name} நிறுவனத்தின் அதிகாரப்பூர்வ வாடிக்கையாளர் சேவை எண் ஆகும்.`,
          foundNumber,
          matchedBrand: matchedBrand.name
        };
      }
      return {
        replyText: `This number matches the official verified customer care helpline for ${matchedBrand.name}.`,
        foundNumber,
        matchedBrand: matchedBrand.name
      };
    }

    // Number is unverified or mismatch
    if (lang === 'hi') {
      return {
        replyText: `सावधान! यह नंबर ${matchedBrand ? matchedBrand.name : 'कंपनी'} का आधिकारिक नंबर नहीं है। कृपया किसी को भी बैंक ओटीपी या पिन न दें। किसी भी धोखाधड़ी पर 1930 पर कॉल करें।`,
        foundNumber,
        matchedBrand: matchedBrand ? matchedBrand.name : null
      };
    }
    if (lang === 'ta') {
      return {
        replyText: `எச்சரிக்கை! இந்த எண் அதிகாரப்பூர்வ எண் அல்ல. யாரிடமும் ஓடிபி (OTP) அல்லது வங்கி விவரங்களைப் பகிர வேண்டாம். உதவி எண் 1930-ஐ அழைக்கவும்.`,
        foundNumber,
        matchedBrand: matchedBrand ? matchedBrand.name : null
      };
    }
    return {
      replyText: `Warning! This number is not an official helpline for ${matchedBrand ? matchedBrand.name : 'the company'}. Never share OTPs or banking PINs. Call 1930 if you suspect fraud.`,
      foundNumber,
      matchedBrand: matchedBrand ? matchedBrand.name : null
    };
  }

  // Scenario B: Brand Helpline Lookup
  if (matchedBrand) {
    const careNumber = matchedBrand.official_numbers[0];
    if (lang === 'hi') {
      return {
        replyText: `${matchedBrand.name} का आधिकारिक कस्टमर केयर नंबर है: ${careNumber}। आप सुरक्षित रूप से इस नंबर पर संपर्क कर सकते हैं।`,
        foundNumber: careNumber,
        matchedBrand: matchedBrand.name
      };
    }
    if (lang === 'ta') {
      return {
        replyText: `${matchedBrand.name} நிறுவனத்தின் அதிகாரப்பூர்வ உதவி எண்: ${careNumber} ஆகும்.`,
        foundNumber: careNumber,
        matchedBrand: matchedBrand.name
      };
    }
    return {
      replyText: `The official customer care number for ${matchedBrand.name} is ${careNumber}. This number is verified from their official portal.`,
      foundNumber: careNumber,
      matchedBrand: matchedBrand.name
    };
  }

  // Scenario C: General query fallback
  if (lang === 'hi') {
    return {
      replyText: `मैं डायलसेफ हूँ। आप किसी भी कंपनी का नाम (जैसे जोमैटो या एसबीआई) बोलकर उनका असली नंबर पूछ सकते हैं, या कोई संदिग्ध फ़ोन नंबर चेक करवा सकते हैं।`,
      foundNumber: null,
      matchedBrand: null
    };
  }
  if (lang === 'ta') {
    return {
      replyText: `நான் டயல்சேஃப். நிறுவனத்தின் பெயர் அல்லது தொலைபேசி எண்ணைக் கூறினால், நான் உங்களுக்குச் சரிபார்த்துத் தருகிறேன்.`,
      foundNumber: null,
      matchedBrand: null
    };
  }
  return {
    replyText: `I am DialSafe. You can speak any company name (like Zomato or SBI) to get their official helpline, or read out a phone number to check if it looks like a scam.`,
    foundNumber: null,
    matchedBrand: null
  };
}
