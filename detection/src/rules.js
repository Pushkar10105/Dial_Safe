/**
 * detection/src/rules.js
 * Discrete heuristic rules and evaluation checks for scam detection.
 */

const VERDICTS = {
  VERIFIED: 'Verified official',
  HIGH_RISK: 'High risk',
  SUSPICIOUS: 'Suspicious',
  UNKNOWN: 'Unknown'
};

const VERDICT_CODES = {
  VERIFIED: 'verified_official',
  HIGH_RISK: 'high_risk',
  SUSPICIOUS: 'suspicious',
  UNKNOWN: 'unknown'
};

const SAFETY_ADVICE = {
  HIGH_RISK: [
    'Do not share OTPs, PINs, or banking details.',
    'Report cyber fraud at cybercrime.gov.in or call 1930.'
  ],
  SUSPICIOUS: [
    'Exercise caution. Verify this contact directly on the company\'s official website or app.',
    'Never share sensitive personal or payment information over unsolicited calls.'
  ],
  UNKNOWN: [
    'We cannot confirm this number either way. Check the company\'s official website or mobile app.',
    'Do not share passwords, OTPs, or financial details.'
  ],
  VERIFIED: [
    'Verified official contact number.'
  ]
};

/**
 * Rule 1: Checks if number is an exact match for a verified brand's official numbers.
 */
function checkOfficialMatch(number, brandRecord) {
  if (!brandRecord || !Array.isArray(brandRecord.official_numbers)) {
    return null;
  }

  const isOfficial = brandRecord.official_numbers.includes(number);
  if (isOfficial) {
    const sourceInfo = brandRecord.source_url ? ` (Source: ${brandRecord.source_url})` : '';
    return {
      ruleId: 'OFFICIAL_MATCH',
      verdict: VERDICTS.VERIFIED,
      verdictCode: VERDICT_CODES.VERIFIED,
      score: 0.0,
      reason: `Matches the official customer care number listed by ${brandRecord.name}${sourceInfo}.`,
      advice: SAFETY_ADVICE.VERIFIED
    };
  }

  return null;
}

/**
 * Rule 2: Checks if number is in known fake numbers list for the brand or advisory database.
 */
function checkKnownFake(number, brandRecord, knownFakeNumbers = []) {
  const fakeList = [
    ...(Array.isArray(knownFakeNumbers) ? knownFakeNumbers : []),
    ...(brandRecord && Array.isArray(brandRecord.known_fake_numbers) ? brandRecord.known_fake_numbers : [])
  ];

  if (fakeList.includes(number)) {
    const brandName = brandRecord ? brandRecord.name : 'the claimed service';
    return {
      ruleId: 'KNOWN_FAKE',
      triggered: true,
      riskWeight: 0.95,
      reason: `Known fraudulent number flagged in scam advisories for ${brandName}.`
    };
  }

  return null;
}

/**
 * Rule 3: Checks if a brand was queried/claimed, but number does NOT match official numbers.
 */
function checkBrandMismatch(number, brandRecord, claimedBrandName) {
  if (brandRecord && Array.isArray(brandRecord.official_numbers) && brandRecord.official_numbers.length > 0) {
    if (!brandRecord.official_numbers.includes(number)) {
      return {
        ruleId: 'BRAND_MISMATCH',
        triggered: true,
        riskWeight: 0.85,
        reason: `This is not an official contact number for ${brandRecord.name}.`
      };
    }
  }

  return null;
}

/**
 * Rule 4: Evaluates community report count thresholds.
 */
function checkReportVolume(reportCount = 0) {
  if (reportCount >= 5) {
    return {
      ruleId: 'REPORTS_SEVERE',
      triggered: true,
      riskWeight: Math.min(0.98, 0.85 + (reportCount - 5) * 0.02),
      reason: `Reported ${reportCount} times as suspicious or fraudulent.`
    };
  }

  if (reportCount >= 3) {
    return {
      ruleId: 'REPORTS_HIGH',
      triggered: true,
      riskWeight: 0.80,
      reason: `Reported ${reportCount} times as suspicious or fraudulent.`
    };
  }

  if (reportCount >= 1) {
    return {
      ruleId: 'REPORTS_MODERATE',
      triggered: true,
      riskWeight: 0.55,
      reason: `Reported ${reportCount} time(s) by community members.`
    };
  }

  return null;
}

/**
 * Rule 5: Personal mobile number masquerading as enterprise customer care.
 */
function checkNumberTypeHeuristic(typeOfNumber, claimedBrandName, brandRecord) {
  // If the number is a personal mobile number (+91 10-digit) and a brand was claimed
  if (typeOfNumber === 'mobile' && (claimedBrandName || brandRecord)) {
    const brandLabel = brandRecord ? brandRecord.name : claimedBrandName;
    return {
      ruleId: 'MOBILE_MASQUERADE',
      triggered: true,
      riskWeight: 0.45,
      reason: `A personal mobile number is being used as a care line for '${brandLabel}' instead of an official toll-free or corporate helpline.`
    };
  }

  return null;
}

/**
 * Rule 6: Obvious repetitive or suspicious number patterns.
 */
function checkSuspiciousPatterns(number) {
  if (!number || typeof number !== 'string') return null;

  // Pattern of all identical digits (e.g., +919999999999)
  const digitsOnly = number.replace(/\D/g, '');
  if (digitsOnly.length >= 10 && /^(\d)\1+$/.test(digitsOnly)) {
    return {
      ruleId: 'REPETITIVE_DIGITS',
      triggered: true,
      riskWeight: 0.65,
      reason: 'Repeated single-digit sequence detected; likely a placeholder or fake number.'
    };
  }

  return null;
}

module.exports = {
  VERDICTS,
  VERDICT_CODES,
  SAFETY_ADVICE,
  checkOfficialMatch,
  checkKnownFake,
  checkBrandMismatch,
  checkReportVolume,
  checkNumberTypeHeuristic,
  checkSuspiciousPatterns
};
