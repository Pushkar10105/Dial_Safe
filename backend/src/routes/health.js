const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
  const dbAlive = await db.checkConnection();
  return res.json({
    ok: true,
    time: new Date().toISOString(),
    db: dbAlive
  });
});

module.exports = router;
