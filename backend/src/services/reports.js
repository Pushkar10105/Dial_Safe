const db = require('../db');

/**
 * Returns the total count of reports for a given number.
 * @param {string} number
 * @returns {Promise<number>}
 */
async function getReportCount(number) {
  if (!number) return 0;
  const sql = `SELECT COUNT(*)::int AS count FROM reports WHERE number = $1;`;
  const res = await db.query(sql, [number]);
  return res.rows[0]?.count || 0;
}

/**
 * Checks if a recent duplicate report exists from the same reporter for the same number.
 * @param {string} number
 * @param {string|null} reporterKey
 * @param {number} windowMinutes
 * @returns {Promise<boolean>}
 */
async function hasRecentDuplicate(number, reporterKey, windowMinutes) {
  if (!reporterKey || windowMinutes <= 0) return false;
  const sql = `
    SELECT 1 FROM reports
    WHERE number = $1 
      AND reporter_key = $2
      AND created_at >= NOW() - ($3 || ' minutes')::interval
    LIMIT 1;
  `;
  const res = await db.query(sql, [number, reporterKey, windowMinutes]);
  return res.rows.length > 0;
}

/**
 * Inserts a new report into the database.
 * @param {Object} params
 * @param {string} params.number
 * @param {string|null} params.brand
 * @param {string|null} params.note
 * @param {string} params.source - 'web' | 'whatsapp' | 'sample'
 * @param {string|null} params.reporterKey
 * @returns {Promise<{ id: number, reportCount: number }>}
 */
async function createReport({ number, brand = null, note = null, source = 'web', reporterKey = null }) {
  const insertSql = `
    INSERT INTO reports (number, brand, note, source, reporter_key)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id;
  `;
  const res = await db.query(insertSql, [number, brand, note, source, reporterKey]);
  const newId = res.rows[0].id;
  const updatedCount = await getReportCount(number);
  return { id: newId, reportCount: updatedCount };
}

/**
 * Retrieves the recent reports for a specific number.
 * @param {string} number
 * @param {number} [limit=10]
 * @returns {Promise<Array<{ note: string, source: string, brand: string|null, createdAt: string }>>}
 */
async function getReportsForNumber(number, limit = 10) {
  const sql = `
    SELECT brand, note, source, created_at
    FROM reports
    WHERE number = $1
    ORDER BY created_at DESC
    LIMIT $2;
  `;
  const res = await db.query(sql, [number, limit]);
  return res.rows.map(row => ({
    note: row.note || '',
    source: row.source,
    brand: row.brand,
    createdAt: row.created_at.toISOString()
  }));
}

/**
 * Retrieves the most recent reports across the platform (for stats/dashboard).
 * @param {number} [limit=10]
 * @returns {Promise<Array<{ number: string, brand: string|null, source: string, createdAt: string }>>}
 */
async function getRecentReports(limit = 10) {
  const sql = `
    SELECT number, brand, source, created_at
    FROM reports
    ORDER BY created_at DESC
    LIMIT $1;
  `;
  const res = await db.query(sql, [limit]);
  return res.rows.map(row => ({
    number: row.number,
    brand: row.brand,
    source: row.source,
    createdAt: row.created_at.toISOString()
  }));
}

/**
 * Returns total count of all reports.
 * @returns {Promise<number>}
 */
async function getTotalReportsCount() {
  const sql = `SELECT COUNT(*)::int AS count FROM reports;`;
  const res = await db.query(sql);
  return res.rows[0]?.count || 0;
}

module.exports = {
  getReportCount,
  hasRecentDuplicate,
  createReport,
  getReportsForNumber,
  getRecentReports,
  getTotalReportsCount
};
