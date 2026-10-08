const express = require('express');
const router = express.Router();
const { getBrandWithFakeNumbers, getAllBrands } = require('../services/brands');

// GET /brands (or mounted as GET / inside brands router)
router.get('/', async (req, res, next) => {
  try {
    const list = await getAllBrands();
    return res.json({
      ok: true,
      brands: list.map(b => ({
        name: b.name,
        aliases: b.aliases || [],
        officialNumbers: b.official_numbers || [],
        sourceUrl: b.source_url,
        lastChecked: b.last_checked instanceof Date ? b.last_checked.toISOString().split('T')[0] : b.last_checked
      }))
    });
  } catch (err) {
    next(err);
  }
});

// GET /brand/:name
router.get('/:name', async (req, res, next) => {
  try {
    const brandName = decodeURIComponent(req.params.name);
    const data = await getBrandWithFakeNumbers(brandName);

    if (!data) {
      return res.status(404).json({
        ok: false,
        error: 'Brand not in our verified list. Please check the company\'s own website or app.'
      });
    }

    return res.json({
      ok: true,
      ...data
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
