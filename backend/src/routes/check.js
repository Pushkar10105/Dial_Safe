const express = require('express');
const router = express.Router();
const config = require('../config');
const { normalizeNumber } = require('../services/numbers');
const { findBrandByNameOrAlias, findBrandByOfficialNumber } = require('../services/brands');
const { getReportCount } = require('../services/reports');
const { logCheck } = require('../services/checks');
const { detect, VERDICTS, VERDICT_CODES, SAFETY_ADVICE } = require('../engine');

router.post('/', async (req, res, next) => {
  try {
    const { number, brand, channel = 'web' } = req.body || {};

    if (!number) {
      return res.status(400).json({
        ok: false,
        error: 'Phone number is required.'
      });
    }

    // 1. Normalize number
    const norm = normalizeNumber(number);
    if (!norm.valid || !norm.normalized) {
      return res.status(400).json({
        ok: false,
        error: 'Invalid phone number format. Please provide a valid 10-digit mobile, toll-free (1800/1860), or landline number.'
      });
    }
    const normalizedNumber = norm.normalized;

    // 2. Resolve brand if provided
    let brandRecord = null;
    let brandNotFoundNote = null;
    if (brand && typeof brand === 'string' && brand.trim()) {
      brandRecord = await findBrandByNameOrAlias(brand.trim());
      if (!brandRecord) {
        brandNotFoundNote = `Brand '${brand.trim()}' is not in our verified list.`;
      }
    }

    // 3. Official number lookup across ALL brands
    const officialBrandMatch = await findBrandByOfficialNumber(normalizedNumber);
    let crossBrandMismatchNote = null;

    if (officialBrandMatch) {
      if (!brandRecord) {
        // User didn't specify brand, but number is official for a known brand
        brandRecord = officialBrandMatch;
      } else if (brandRecord.id !== officialBrandMatch.id) {
        // User claimed brand A, but number actually belongs officially to brand B
        crossBrandMismatchNote = `This number is registered as the official care number for ${officialBrandMatch.name}, not ${brandRecord.name}.`;
        // Detection should evaluate against the claimed brand, but note the real owner
      }
    }

    // 4. Count reports from DB
    const reportCount = await getReportCount(normalizedNumber);

    // 5. Run detection engine
    const detectionResult = detect({
      number: normalizedNumber,
      brandRecord,
      reportCount,
      typeOfNumber: norm.type,
      claimedBrandName: brand ? brand.trim() : null
    });

    const reasons = [...detectionResult.reasons];
    if (brandNotFoundNote) {
      reasons.push(brandNotFoundNote);
    }
    if (crossBrandMismatchNote) {
      reasons.push(crossBrandMismatchNote);
    }

    // Normalize score to 0.0 - 1.0 range for API Contract (0 = safe, 1 = high risk)
    const normalizedScore = Number((detectionResult.score / 100).toFixed(2));

    // 6. Log check asynchronously
    logCheck({
      number: normalizedNumber,
      brand: brandRecord ? brandRecord.name : (brand ? brand.trim() : null),
      verdict: detectionResult.verdictCode,
      score: detectionResult.score,
      channel
    }).catch(err => console.warn('[CHECK] Check log error:', err.message));

    // 7. Response matching API_CONTRACT.md
    const officialNumber = (brandRecord && brandRecord.official_numbers && brandRecord.official_numbers.length > 0)
      ? brandRecord.official_numbers[0]
      : (officialBrandMatch && officialBrandMatch.official_numbers ? officialBrandMatch.official_numbers[0] : null);

    const detailUrl = `${config.frontendUrl}/number/${encodeURIComponent(normalizedNumber)}`;

    return res.json({
      ok: true,
      number: normalizedNumber,
      verdict: detectionResult.verdict,
      verdictCode: detectionResult.verdictCode,
      score: normalizedScore,
      reasons,
      reportCount,
      brand: brandRecord ? brandRecord.name : (brand ? brand.trim() : null),
      officialNumber,
      detailUrl,
      advice: detectionResult.advice
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
