/**
 * detection/src/scoring.js
 * Risk scoring aggregation and verdict mapping.
 * Enforces DialSafe strict verdicts and anti-hallucination rules.
 */

const { VERDICTS, VERDICT_CODES, SAFETY_ADVICE } = require('./rules');

/**
 * Combines triggered risk signals and returns a final risk assessment.
 *
 * @param {Object} params
 * @param {Object|null} params.officialMatch - Result from checkOfficialMatch
 * @param {Array<Object>} params.triggeredRules - List of triggered heuristic rules
 * @param {number} params.reportCount - Total community reports for number
 * @returns {{
 *   verdict: string,
 *   verdictCode: string,
 *   score: number,
 *   reasons: string[],
 *   advice: string[]
 * }}
 */
function aggregateScoreAndVerdict({ officialMatch, triggeredRules = [], reportCount = 0 }) {
  // Case 1: Exact official number match
  if (officialMatch) {
    return {
      verdict: VERDICTS.VERIFIED,
      verdictCode: VERDICT_CODES.VERIFIED,
      score: 0.0,
      reasons: [officialMatch.reason],
      advice: officialMatch.advice || SAFETY_ADVICE.VERIFIED
    };
  }

  // Case 2: No rules triggered and zero reports -> Fallback to UNKNOWN
  // "Unknown is a valid and honest answer. Never output 'safe'."
  if (triggeredRules.length === 0 && reportCount === 0) {
    return {
      verdict: VERDICTS.UNKNOWN,
      verdictCode: VERDICT_CODES.UNKNOWN,
      score: 0.15,
      reasons: [
        'We cannot confirm this number either way. Check the company\'s official website or app.'
      ],
      advice: SAFETY_ADVICE.UNKNOWN
    };
  }

  // Case 3: Calculate composite risk score
  // We use max weighted risk with scaling for additional corroborating signals
  const reasons = [];
  let maxRisk = 0;

  for (const rule of triggeredRules) {
    if (rule.reason && !reasons.includes(rule.reason)) {
      reasons.push(rule.reason);
    }
    if (rule.riskWeight && rule.riskWeight > maxRisk) {
      maxRisk = rule.riskWeight;
    }
  }

  // Corroborating boost if multiple distinct signals triggered
  if (triggeredRules.length > 1) {
    maxRisk = Math.min(0.98, maxRisk + (triggeredRules.length - 1) * 0.04);
  }

  // Round score to 2 decimal places (0.00 - 1.00)
  const finalScore = Number(maxRisk.toFixed(2));

  // Determine canonical verdict based on score thresholds and critical rules
  let verdict;
  let verdictCode;
  let advice;

  const hasHighRiskSignal = triggeredRules.some(
    r => r.ruleId === 'KNOWN_FAKE' || r.ruleId === 'REPORTS_SEVERE' || r.ruleId === 'REPORTS_HIGH' || r.ruleId === 'BRAND_MISMATCH'
  );

  if (hasHighRiskSignal || finalScore >= 0.75) {
    verdict = VERDICTS.HIGH_RISK;
    verdictCode = VERDICT_CODES.HIGH_RISK;
    advice = SAFETY_ADVICE.HIGH_RISK;
  } else if (finalScore >= 0.40 || reportCount >= 1) {
    verdict = VERDICTS.SUSPICIOUS;
    verdictCode = VERDICT_CODES.SUSPICIOUS;
    advice = SAFETY_ADVICE.SUSPICIOUS;
  } else {
    verdict = VERDICTS.UNKNOWN;
    verdictCode = VERDICT_CODES.UNKNOWN;
    advice = SAFETY_ADVICE.UNKNOWN;
  }

  // Guaranteed anti-hallucination check: ensure verdict is never 'safe'
  if (verdict.toLowerCase().includes('safe')) {
    verdict = VERDICTS.UNKNOWN;
    verdictCode = VERDICT_CODES.UNKNOWN;
  }

  return {
    verdict,
    verdictCode,
    score: finalScore,
    reasons,
    advice
  };
}

module.exports = {
  aggregateScoreAndVerdict
};
