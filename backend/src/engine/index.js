/**
 * Detection engine interface.
 * Pure function: takes normalized number and context, returns risk assessment.
 * NOTE: Designed to be replaced cleanly by Member 4's detection engine module.
 */

// Canonical verdicts strictly matching API Contract and AGENTS.md
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
 * Evaluates the risk level for a phone number based on database records and rules.
 * @param {Object} params
 * @param {string} params.number - Normalized phone number
 * @param {Object|null} params.brandRecord - Matched brand record from DB (if any)
 * @param {number} params.reportCount - Total reports for this number
 * @param {string|null} params.typeOfNumber - 'mobile' | 'tollfree' | 'landline' | null
 * @param {string|null} [params.claimedBrandName] - User-supplied brand query
 * @returns {{ verdict: string, verdictCode: string, score: number, reasons: string[], advice: string[] }}
 */
function detect({ number, brandRecord, reportCount = 0, typeOfNumber = null, claimedBrandName = null }) {
  const reasons = [];
  let verdict = VERDICTS.UNKNOWN;
  let verdictCode = VERDICT_CODES.UNKNOWN;
  let score = 15; // default unknown score (0-100 scale, normalized 0.15)
  let advice = SAFETY_ADVICE.UNKNOWN;

  // Rule 1: Number matches the official number of a brand
  if (brandRecord && Array.isArray(brandRecord.official_numbers) && brandRecord.official_numbers.includes(number)) {
    verdict = VERDICTS.VERIFIED;
    verdictCode = VERDICT_CODES.VERIFIED;
    score = 0;
    reasons.push(`Matches the official customer care number listed by ${brandRecord.name} (Source: ${brandRecord.source_url}).`);
    advice = SAFETY_ADVICE.VERIFIED;
    return { verdict, verdictCode, score, reasons, advice };
  }

  // Rule 2: A brand was claimed/found, but this number is NOT in the official list
  if (brandRecord && Array.isArray(brandRecord.official_numbers) && brandRecord.official_numbers.length > 0) {
    verdict = VERDICTS.HIGH_RISK;
    verdictCode = VERDICT_CODES.HIGH_RISK;
    score = 85;
    reasons.push(`This is not the official number for ${brandRecord.name}.`);
    if (reportCount > 0) {
      reasons.push(`Reported ${reportCount} time(s) as a suspected scam.`);
      score = Math.min(98, 85 + reportCount * 2);
    }
    advice = SAFETY_ADVICE.HIGH_RISK;
    return { verdict, verdictCode, score, reasons, advice };
  }

  // Rule 3: High report counts (3 or more)
  if (reportCount >= 3) {
    verdict = VERDICTS.HIGH_RISK;
    verdictCode = VERDICT_CODES.HIGH_RISK;
    score = Math.min(95, 75 + reportCount * 3);
    reasons.push(`Reported ${reportCount} times as suspicious or fraudulent.`);
    advice = SAFETY_ADVICE.HIGH_RISK;
    return { verdict, verdictCode, score, reasons, advice };
  }

  // Rule 4: Moderate report counts (1-2 reports)
  if (reportCount >= 1) {
    verdict = VERDICTS.SUSPICIOUS;
    verdictCode = VERDICT_CODES.SUSPICIOUS;
    score = 55;
    reasons.push(`Reported ${reportCount} time(s) by community members.`);
    advice = SAFETY_ADVICE.SUSPICIOUS;
    return { verdict, verdictCode, score, reasons, advice };
  }

  // Rule 5: Personal mobile number claiming to be a customer care line
  if (typeOfNumber === 'mobile' && claimedBrandName) {
    verdict = VERDICTS.SUSPICIOUS;
    verdictCode = VERDICT_CODES.SUSPICIOUS;
    score = 45;
    reasons.push(`A personal mobile number is claiming to be an official care line for '${claimedBrandName}'.`);
    advice = SAFETY_ADVICE.SUSPICIOUS;
    return { verdict, verdictCode, score, reasons, advice };
  }

  // Rule 6: Fallback to Unknown
  verdict = VERDICTS.UNKNOWN;
  verdictCode = VERDICT_CODES.UNKNOWN;
  score = 15;
  reasons.push('We can\'t confirm this number either way. Check the company\'s official website or app.');
  advice = SAFETY_ADVICE.UNKNOWN;

  return { verdict, verdictCode, score, reasons, advice };
}

module.exports = {
  detect,
  VERDICTS,
  VERDICT_CODES,
  SAFETY_ADVICE
};
