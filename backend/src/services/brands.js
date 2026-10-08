const db = require('../db');

/**
 * Find a brand by name or alias (case-insensitive exact match first, then substring).
 * @param {string} inputName
 * @returns {Promise<Object|null>}
 */
async function findBrandByNameOrAlias(inputName) {
  if (!inputName || typeof inputName !== 'string') return null;
  const term = inputName.trim().toLowerCase();
  if (!term) return null;

  // 1. Exact match on brand name or any alias
  const exactSql = `
    SELECT id, name, aliases, official_numbers, source_url, last_checked
    FROM brands
    WHERE LOWER(name) = $1
       OR $1 = ANY(aliases)
    LIMIT 1;
  `;
  const exactRes = await db.query(exactSql, [term]);
  if (exactRes.rows.length > 0) {
    return exactRes.rows[0];
  }

  // 2. Substring match (e.g. user typed "zomato customer support")
  const subSql = `
    SELECT id, name, aliases, official_numbers, source_url, last_checked
    FROM brands
    WHERE $1 LIKE ('%' || LOWER(name) || '%')
       OR EXISTS (
         SELECT 1 FROM unnest(aliases) a WHERE $1 LIKE ('%' || LOWER(a) || '%')
       )
    LIMIT 1;
  `;
  const subRes = await db.query(subSql, [term]);
  if (subRes.rows.length > 0) {
    return subRes.rows[0];
  }

  return null;
}

/**
 * Searches all brands to see if the number belongs to any official brand.
 * @param {string} normalizedNumber
 * @returns {Promise<Object|null>}
 */
async function findBrandByOfficialNumber(normalizedNumber) {
  if (!normalizedNumber) return null;
  const sql = `
    SELECT id, name, aliases, official_numbers, source_url, last_checked
    FROM brands
    WHERE $1 = ANY(official_numbers)
    LIMIT 1;
  `;
  const res = await db.query(sql, [normalizedNumber]);
  return res.rows.length > 0 ? res.rows[0] : null;
}

/**
 * Returns all verified brands for listing/autocomplete.
 * @returns {Promise<Array<{ name: string, aliases: string[] }>>}
 */
async function getAllBrands() {
  const sql = `
    SELECT name, aliases, official_numbers, source_url, last_checked
    FROM brands
    ORDER BY name ASC;
  `;
  const res = await db.query(sql);
  return res.rows;
}

/**
 * Retrieves full details for a brand including top known fake/reported numbers.
 * @param {string} name
 * @returns {Promise<Object|null>}
 */
async function getBrandWithFakeNumbers(name) {
  const brand = await findBrandByNameOrAlias(name);
  if (!brand) return null;

  const fakeSql = `
    SELECT 
      number,
      COUNT(*)::int AS report_count,
      BOOL_AND(source = 'sample') AS is_sample
    FROM reports
    WHERE LOWER(brand) = LOWER($1)
    GROUP BY number
    ORDER BY report_count DESC
    LIMIT 10;
  `;
  const fakeRes = await db.query(fakeSql, [brand.name]);

  const knownFakeNumbers = fakeRes.rows.map(row => ({
    number: row.number,
    reportCount: row.report_count,
    isSample: row.is_sample
  }));

  // Format last_checked to YYYY-MM-DD
  const lastCheckedDate = brand.last_checked instanceof Date 
    ? brand.last_checked.toISOString().split('T')[0] 
    : String(brand.last_checked);

  return {
    brand: brand.name,
    officialNumbers: brand.official_numbers || [],
    sourceUrl: brand.source_url,
    lastChecked: lastCheckedDate,
    knownFakeNumbers
  };
}

module.exports = {
  findBrandByNameOrAlias,
  findBrandByOfficialNumber,
  getAllBrands,
  getBrandWithFakeNumbers
};
