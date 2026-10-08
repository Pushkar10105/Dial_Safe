const express = require('express');
const router = express.Router();
const config = require('../config');
const { normalizeNumber } = require('../services/numbers');
const { 
  getReportCount, 
  hasRecentDuplicate, 
  createReport 
} = require('../services/reports');

router.post('/', async (req, res, next) => {
  try {
    const { number, brand, note, source = 'web', reporterId } = req.body || {};

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
        error: 'Invalid phone number format.'
      });
    }
    const normalizedNumber = norm.normalized;

    // 2. Validate source
    const validSources = ['web', 'whatsapp', 'sample'];
    const safeSource = validSources.includes(source) ? source : 'web';

    // 3. Trim note
    const trimmedNote = note && typeof note === 'string' 
      ? note.trim().slice(0, 300) 
      : null;

    // 4. Reporter key determination
    let reporterKey = null;
    if (safeSource === 'whatsapp') {
      reporterKey = reporterId ? String(reporterId).trim() : null;
    } else {
      // web or sample
      reporterKey = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown-ip';
    }

    // 5. Duplicate guard check (unless DEMO_MODE is true or window is 0)
    if (!config.demoMode && config.duplicateWindowMinutes > 0 && reporterKey) {
      const isDuplicate = await hasRecentDuplicate(normalizedNumber, reporterKey, config.duplicateWindowMinutes);
      if (isDuplicate) {
        const count = await getReportCount(normalizedNumber);
        return res.json({
          ok: true,
          duplicate: true,
          reportCount: count,
          message: 'Report already registered recently. Thank you!'
        });
      }
    }

    // 6. Insert report
    const result = await createReport({
      number: normalizedNumber,
      brand: brand && typeof brand === 'string' ? brand.trim() : null,
      note: trimmedNote,
      source: safeSource,
      reporterKey
    });

    return res.json({
      ok: true,
      reportCount: result.reportCount
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
