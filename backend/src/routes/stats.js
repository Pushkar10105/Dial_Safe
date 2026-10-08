const express = require('express');
const router = express.Router();
const { getTotalChecksCount, getRecentChecks } = require('../services/checks');
const { getTotalReportsCount, getRecentReports } = require('../services/reports');
const { getAllBrands } = require('../services/brands');
const { maskNumber } = require('../services/numbers');

router.get('/', async (req, res, next) => {
  try {
    const [totalChecks, totalReports, allBrands, recentChecks, recentReports] = await Promise.all([
      getTotalChecksCount(),
      getTotalReportsCount(),
      getAllBrands(),
      getRecentChecks(10),
      getRecentReports(10)
    ]);

    return res.json({
      ok: true,
      totals: {
        checks: totalChecks,
        reports: totalReports,
        brands: allBrands.length
      },
      recentChecks: recentChecks.map(c => ({
        number: c.number,
        maskedNumber: maskNumber(c.number),
        verdict: c.verdict,
        createdAt: c.createdAt
      })),
      recentReports: recentReports.map(r => ({
        number: r.number,
        maskedNumber: maskNumber(r.number),
        brand: r.brand,
        source: r.source,
        createdAt: r.createdAt
      }))
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
