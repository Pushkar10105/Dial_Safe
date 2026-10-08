const express = require('express');
const router = express.Router();
const config = require('../config');
const { extractNumber, normalizeNumber } = require('../services/numbers');
const { findBrandByNameOrAlias, findBrandByOfficialNumber, getBrandWithFakeNumbers } = require('../services/brands');
const { getReportCount } = require('../services/reports');
const { logCheck } = require('../services/checks');
const { detect } = require('../engine');

router.post('/', async (req, res, next) => {
  try {
    const { text, channel = 'web', reporterId } = req.body || {};

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({
        ok: false,
        error: 'Message text is required.'
      });
    }

    const trimmed = text.trim();
    const foundNumber = extractNumber(trimmed);

    // If text contains a phone number -> Route as NUMBER CHECK
    if (foundNumber) {
      const remainingText = trimmed.replace(foundNumber, '').trim();
      let brandRecord = null;
      if (remainingText) {
        brandRecord = await findBrandByNameOrAlias(remainingText);
      }

      const officialBrandMatch = await findBrandByOfficialNumber(foundNumber);
      if (officialBrandMatch && !brandRecord) {
        brandRecord = officialBrandMatch;
      }

      const reportCount = await getReportCount(foundNumber);
      const detectionResult = detect({
        number: foundNumber,
        brandRecord,
        reportCount,
        claimedBrandName: brandRecord ? brandRecord.name : (remainingText || null)
      });

      const normalizedScore = Number((detectionResult.score / 100).toFixed(2));
      const detailUrl = `${config.frontendUrl}/number/${encodeURIComponent(foundNumber)}`;

      logCheck({
        number: foundNumber,
        brand: brandRecord ? brandRecord.name : null,
        verdict: detectionResult.verdictCode,
        score: detectionResult.score,
        channel
      }).catch(err => console.warn('[MESSAGE CHECK] Log error:', err.message));

      return res.json({
        ok: true,
        type: 'check',
        number: foundNumber,
        verdict: detectionResult.verdict,
        verdictCode: detectionResult.verdictCode,
        score: normalizedScore,
        reasons: detectionResult.reasons,
        reportCount,
        brand: brandRecord ? brandRecord.name : null,
        officialNumber: brandRecord && brandRecord.official_numbers ? brandRecord.official_numbers[0] : null,
        detailUrl,
        advice: detectionResult.advice
      });
    }

    // Otherwise -> Route as BRAND LOOKUP
    const brandData = await getBrandWithFakeNumbers(trimmed);
    if (brandData) {
      return res.json({
        ok: true,
        type: 'brand',
        ...brandData
      });
    }

    // Unrecognized brand or message
    return res.json({
      ok: true,
      type: 'unrecognized',
      message: 'Not in our verified brand list. Please check the company\'s official website or app.'
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
