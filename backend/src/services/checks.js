const db = require('../db');

/**
 * Logs a check into the checks table.
 * Wrapped in try/catch to ensure check logging errors never block or break the API response.
 * @param {Object} params
 * @param {string} params.number
 * @param {string|null} params.brand
 * @param {string} params.verdict - 'verified_official' | 'high_risk' | 'suspicious' | 'unknown'
 * @param {number} params.score
 * @param {string} [params.channel='web']
 * @returns {Promise<number|null>}
 */
async function logCheck({ number, brand = null, verdict, score = 0, channel = 'web' }) {
  try {
    const sql = `
      INSERT INTO checks (number, brand, verdict, score, channel)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id;
    `;
    const res = await db.query(sql, [number, brand, verdict, Math.round(score), channel]);
    return res.rows[0]?.id || null;
  } catch (err) {
    console.warn('[CHECKS] Failed to log check asynchronously:', err.message);
    return null;
  }
}

/**
 * Retrieves the most recent checks (for stats/dashboard).
 * @param {number} [limit=10]
 * @returns {Promise<Array<{ number: string, brand: string|null, verdict: string, createdAt: string }>>}
 */
async function getRecentChecks(limit = 10) {
  const sql = `
    SELECT c.number, c.brand, c.verdict, c.created_at,
           COALESCE(r.report_count, 0)::int AS report_count
    FROM checks c
    LEFT JOIN (
      SELECT number, COUNT(*)::int AS report_count
      FROM reports
      GROUP BY number
    ) r ON r.number = c.number
    ORDER BY c.created_at DESC
    LIMIT $1;
  `;
  const res = await db.query(sql, [limit]);
  return res.rows.map(row => ({
    number: row.number,
    brand: row.brand,
    verdict: row.verdict,
    reportCount: row.report_count ?? 0,
    createdAt: row.created_at.toISOString()
  }));
}

/**
 * Returns total count of all checks.
 * @returns {Promise<number>}
 */
async function getTotalChecksCount() {
  const sql = `SELECT COUNT(*)::int AS count FROM checks;`;
  const res = await db.query(sql);
  return res.rows[0]?.count || 0;
}

module.exports = {
  logCheck,
  getRecentChecks,
  getTotalChecksCount
};
