# detection/

Scam detection engine: phone number normalisation, brand alias matching, heuristic rule evaluation, and risk scoring.

**Owner role:** Member 4 (Detection Engine)  
**Strict Rule:** Read `/AGENTS.md` before making changes.

---

## 1. Overview

The Detection Engine evaluates whether a phone number poses fraud risk when someone checks it via the WhatsApp bot or website. It is designed as a **pure function library** with zero external dependencies and deterministic outputs.

### Hard Product Rules
1. **Verdicts are strictly limited to:**
   - `Verified official` (Green, score = 0.0)
   - `High risk` (Red, score = 0.75 - 1.0)
   - `Suspicious` (Yellow, score = 0.40 - 0.74)
   - `Unknown` (Grey, score = 0.15)
2. **Never output "safe".** "Unknown" is a valid and honest answer. A false "safe" is worse than no answer.
3. **High risk replies must include standard safety advice:**
   - Do not share OTPs, PINs, or banking details.
   - Report cyber fraud at **cybercrime.gov.in** or call **1930** (India's national cyber helpline).

---

## 2. Requirements & Installation

- **Runtime:** Node.js 18+ (tested on Node v24)
- **Dependencies:** 0 (zero external npm dependencies; uses built-in JavaScript and Node modules).

### Running Unit Tests

Run tests directly from the repo root or inside `detection/`:

```bash
# From workspace root
node detection/tests/detection.test.js

# Or from detection/
cd detection
npm test
```

---

## 3. Module Structure

```
detection/
├── package.json          # Module config and test script
├── README.md             # Documentation (this file)
├── src/
│   ├── index.js          # Main entrypoint: detect(), normalizer, matcher, constants
│   ├── normalizer.js     # Phone number parsing (+91, 1800, 0xx), extraction, masking
│   ├── matcher.js        # Brand query normalization, alias and token resolution
│   ├── rules.js          # Individual heuristic detection rules
│   └── scoring.js        # Score aggregation, thresholds, and verdict mapping
└── tests/
    └── detection.test.js # 24 unit tests covering rules, normalisation, and safety constraints
```

---

## 4. API Reference

### `detect(params)`

Evaluates the risk profile of a phone number.

**Input:**
```javascript
const { detect } = require('./detection');

const result = detect({
  number: '+919876543210',             // Normalized or raw phone number string
  brandRecord: {                       // Optional: Brand record from DB/seed
    id: 1,
    name: 'Zomato',
    official_numbers: ['+918069696969'],
    source_url: 'https://www.zomato.com/contact'
  },
  reportCount: 4,                      // Optional: Total community scam reports
  typeOfNumber: 'mobile',              // Optional: 'mobile' | 'tollfree' | 'landline'
  claimedBrandName: 'Zomato',          // Optional: User-supplied brand query
  knownFakeNumbers: []                 // Optional: Known scam numbers
});
```

**Output:**
```javascript
{
  number: '+919876543210',
  verdict: 'High risk',
  verdictCode: 'high_risk',
  score: 0.89,
  reasons: [
    'This is not an official contact number for Zomato.',
    'Reported 4 times as suspicious or fraudulent.'
  ],
  advice: [
    'Do not share OTPs, PINs, or banking details.',
    'Report cyber fraud at cybercrime.gov.in or call 1930.'
  ]
}
```

---

### `normalizeNumber(raw)`

Parses and validates Indian mobile numbers, toll-free lines, and landlines:
```javascript
const { normalizeNumber } = require('./detection');

normalizeNumber('+91 98765 43210');
// -> { valid: true, normalized: '+919876543210', type: 'mobile', error: null }

normalizeNumber('1800-111-222');
// -> { valid: true, normalized: '1800111222', type: 'tollfree', error: null }
```

### `extractNumber(text)`

Extracts the first phone number candidate from user chat text:
```javascript
const { extractNumber } = require('./detection');

extractNumber('Please check +91 98765 43210 for Flipkart');
// -> '+919876543210'
```

### `matchBrand(query, brandList)`

Matches user query against a list of brand objects with aliases:
```javascript
const { matchBrand } = require('./detection');

matchBrand('zomato care', brandList);
// -> Returns matched Zomato brand object
```

### `maskNumber(number)`

Masks phone number for privacy display:
```javascript
const { maskNumber } = require('./detection');

maskNumber('+919876543210');
// -> '+91 98xxx xx210'
```

---

## 5. Detection Heuristics

1. **Official Match (`OFFICIAL_MATCH`):** Number is listed in `brandRecord.official_numbers`.  
   - Verdict: `Verified official` | Score: `0.00`
2. **Known Fake (`KNOWN_FAKE`):** Number is found in scam advisories or `knownFakeNumbers`.  
   - Verdict: `High risk` | Score: `0.95`
3. **Brand Mismatch (`BRAND_MISMATCH`):** Caller claims brand affiliation, but number is not listed by that brand.  
   - Verdict: `High risk` | Score: `0.85`
4. **Community Reports (`REPORTS_HIGH` / `REPORTS_SEVERE`):**  
   - `>= 3 reports`: Verdict: `High risk` | Score: `0.80 - 0.98`  
   - `1 - 2 reports`: Verdict: `Suspicious` | Score: `0.55 - 0.70`
5. **Personal Mobile Helpline (`MOBILE_MASQUERADE`):** A standard 10-digit mobile number claiming to be the helpline of an enterprise.  
   - Verdict: `Suspicious` or contributes to `High risk`
6. **Honest Fallback (`UNKNOWN`):** Valid number with no records or reports.  
   - Verdict: `Unknown` | Score: `0.15` (Never says "safe").
