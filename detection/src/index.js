/**
 * detection/src/index.js
 * Main entrypoint for DialSafe Detection Engine (Member 4).
 * Pure function interface with zero external dependencies.
 */

const { normalizeNumber, extractNumber, maskNumber } = require('./normalizer');
const { cleanBrandQuery, matchBrand } = require('./matcher');
const {
  VERDICTS,
  VERDICT_CODES,
  SAFETY_ADVICE,
  checkOfficialMatch,
  checkKnownFake,
  checkBrandMismatch,
  checkReportVolume,
  checkNumberTypeHeuristic,
  checkSuspiciousPatterns
} = require('./rules');
const { aggregateScoreAndVerdict } = require('./scoring');

/**
 * Evaluates the risk profile of a phone number.
 * Pure function: does not access databases or external networks.
 *
 * @param {Object} params
 * @param {string} params.number - Phone number (normalized or raw)
 * @param {Object|null} [params.brandRecord] - Matched brand record from DB/seed (if any)
 * @param {number} [params.reportCount=0] - Number of scam reports in database
 * @param {string|null} [params.typeOfNumber] - 'mobile' | 'tollfree' | 'landline' | null
 * @param {string|null} [params.claimedBrandName] - User-supplied brand query
 * @param {string[]} [params.knownFakeNumbers] - Known scam numbers list
 * @returns {{
 *   number: string,
 *   verdict: 'Verified official'|'High risk'|'Suspicious'|'Unknown',
 *   verdictCode: 'verified_official'|'high_risk'|'suspicious'|'unknown',
 *   score: number,
 *   reasons: string[],
 *   advice: string[]
 * }}
 */
function detect({
  number,
  brandRecord = null,
  reportCount = 0,
  typeOfNumber = null,
  claimedBrandName = null,
  knownFakeNumbers = []
}) {
  if (!number || typeof number !== 'string') {
    throw new Error('A valid phone number string is required for detection.');
  }

  // Ensure number is normalized
  const normResult = normalizeNumber(number);
  const targetNumber = normResult.valid && normResult.normalized ? normResult.normalized : number;
  const inferredType = typeOfNumber || normResult.type;

  // 1. Official match check (Fast-path: verdict = Verified official, score = 0.0)
  const officialMatch = checkOfficialMatch(targetNumber, brandRecord);
  if (officialMatch) {
    return {
      number: targetNumber,
      verdict: officialMatch.verdict,
      verdictCode: officialMatch.verdictCode,
      score: officialMatch.score,
      reasons: [officialMatch.reason],
      advice: officialMatch.advice
    };
  }

  // 2. Evaluate all heuristic risk rules
  const triggeredRules = [];

  // Check known scam list
  const knownFakeResult = checkKnownFake(targetNumber, brandRecord, knownFakeNumbers);
  if (knownFakeResult) {
    triggeredRules.push(knownFakeResult);
  }

  // Check claimed brand mismatch (number not in brand's official list)
  const mismatchResult = checkBrandMismatch(targetNumber, brandRecord, claimedBrandName);
  if (mismatchResult) {
    triggeredRules.push(mismatchResult);
  }

  // Check community reports
  const reportResult = checkReportVolume(reportCount);
  if (reportResult) {
    triggeredRules.push(reportResult);
  }

  // Check number type heuristics (e.g. mobile pretending to be corporate care)
  const typeResult = checkNumberTypeHeuristic(inferredType, claimedBrandName, brandRecord);
  if (typeResult) {
    triggeredRules.push(typeResult);
  }

  // Check suspicious or fake number patterns
  const patternResult = checkSuspiciousPatterns(targetNumber);
  if (patternResult) {
    triggeredRules.push(patternResult);
  }

  // 3. Aggregate score and determine canonical verdict
  const assessment = aggregateScoreAndVerdict({
    officialMatch: null,
    triggeredRules,
    reportCount
  });

  return {
    number: targetNumber,
    verdict: assessment.verdict,
    verdictCode: assessment.verdictCode,
    score: assessment.score,
    reasons: assessment.reasons,
    advice: assessment.advice
  };
}

module.exports = {
  detect,
  normalizeNumber,
  extractNumber,
  maskNumber,
  cleanBrandQuery,
  matchBrand,
  VERDICTS,
  VERDICT_CODES,
  SAFETY_ADVICE
};
