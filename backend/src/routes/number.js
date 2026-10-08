const express = require('express');
const router = express.Router();
const config = require('../config');
const { normalizeNumber } = require('../services/numbers');
const { findBrandByOfficialNumber, findBrandByNameOrAlias } = require('../services/brands');
const { getReportCount, getReportsForNumber } = require('../services/reports');
const { detect } = require('../engine');

router.get('/:n', async (req, res, next) => {
  try {
    const rawNumber = decodeURIComponent(req.params.n);
    const norm = normalizeNumber(rawNumber);

    if (!norm.valid || !norm.normalized) {
      return res.status(400).json({
        ok: false,
        error: 'Invalid phone number format.'
      });
    }
    const normalizedNumber = norm.normalized;

    // Check if official for any brand
    const officialBrand = await findBrandByOfficialNumber(normalizedNumber);
    const reportCount = await getReportCount(normalizedNumber);
    const reports = await getReportsForNumber(normalizedNumber, 10);

    // If reports contain a commonly reported brand name, check if we should associate it
    let brandRecord = officialBrand;
    if (!brandRecord && reports.length > 0 && reports[0].brand) {
      brandRecord = await findBrandByNameOrAlias(reports[0].brand);
    }

    const detectionResult = detect({
      number: normalizedNumber,
      brandRecord,
      reportCount,
      typeOfNumber: norm.type,
      claimedBrandName: brandRecord ? brandRecord.name : (reports[0]?.brand || null)
    });

    const normalizedScore = Number((detectionResult.score / 100).toFixed(2));
    const detailUrl = `${config.frontendUrl}/number/${encodeURIComponent(normalizedNumber)}`;

    return res.json({
      ok: true,
      number: normalizedNumber,
      verdict: detectionResult.verdict,
      verdictCode: detectionResult.verdictCode,
      score: normalizedScore,
      reasons: detectionResult.reasons,
      reportCount,
      brand: brandRecord ? brandRecord.name : null,
      officialNumber: (brandRecord && brandRecord.official_numbers && brandRecord.official_numbers[0]) || null,
      detailUrl,
      advice: detectionResult.advice,
      reports: reports.map(r => ({
        note: r.note,
        source: r.source,
        brand: r.brand,
        createdAt: r.createdAt
      }))
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
