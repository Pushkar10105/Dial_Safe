const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');
const config = require('./config');
const { normalizeNumber } = require('./services/numbers');

let pool = null;
let isConfigured = false;

// Load seed data for in-memory fallback
let memoryBrands = [];
let memoryReports = [];
let memoryChecks = [];

function initMemoryStore() {
  try {
    const brandsPath = path.resolve(__dirname, '../db/seed/brands.json');
    if (fs.existsSync(brandsPath)) {
      const raw = JSON.parse(fs.readFileSync(brandsPath, 'utf8'));
      memoryBrands = raw.map((b, idx) => ({
        id: idx + 1,
        name: b.name,
        aliases: b.aliases || [],
        official_numbers: (b.official_numbers || []).map(num => {
          const norm = normalizeNumber(num);
          return norm.valid && norm.normalized ? norm.normalized : num;
        }),
        source_url: b.source_url || '',
        last_checked: b.last_checked || '2026-10-10'
      }));
    }

    const reportsPath = path.resolve(__dirname, '../db/seed/sample_reports.json');
    if (fs.existsSync(reportsPath)) {
      const rawReports = JSON.parse(fs.readFileSync(reportsPath, 'utf8'));
      memoryReports = rawReports.map((r, idx) => {
        const norm = normalizeNumber(r.number);
        const normNum = norm.valid && norm.normalized ? norm.normalized : r.number;
        return {
          id: idx + 1,
          number: normNum,
          brand: r.brand || null,
          note: r.note || '',
          source: r.source || 'sample',
          reporter_key: null,
          created_at: new Date()
        };
      });
    }
  } catch (err) {
    console.warn('[DB In-Memory] Error initializing seed store:', err.message);
  }
}

if (config.databaseUrl) {
  const needsSsl = config.databaseUrl.includes('sslmode=require') || 
                   config.nodeEnv === 'production' || 
                   !config.databaseUrl.includes('localhost');

  pool = new Pool({
    connectionString: config.databaseUrl,
    ssl: needsSsl ? { rejectUnauthorized: false } : false,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000
  });

  pool.on('error', (err) => {
    console.error('[DB] Unexpected error on idle client:', err.message);
  });

  isConfigured = true;
} else {
  console.warn('[DB NOTICE] DATABASE_URL is not set. Using built-in in-memory fallback (seeded with 22 brands & sample reports).');
  initMemoryStore();
}

/**
 * Executes a query against PostgreSQL or in-memory fallback.
 */
async function query(text, params = []) {
  if (pool && isConfigured) {
    return pool.query(text, params);
  }

  // Fallback in-memory query handler
  const normalizedText = text.trim();

  // 1. Health check
  if (/SELECT 1 AS alive/i.test(normalizedText)) {
    return { rows: [{ alive: 1 }] };
  }

  // 2. Brands queries
  if (/FROM brands/i.test(normalizedText)) {
    // Total count
    if (/COUNT\(\*\)::int AS total/i.test(normalizedText)) {
      return { rows: [{ total: memoryBrands.length }] };
    }

    // Exact match: LOWER(name) = $1 OR $1 = ANY(aliases)
    if (/LOWER\(name\) = \$1/i.test(normalizedText)) {
      const term = (params[0] || '').toLowerCase().trim();
      const match = memoryBrands.find(b => 
        b.name.toLowerCase() === term || 
        (Array.isArray(b.aliases) && b.aliases.some(a => a.toLowerCase() === term))
      );
      return { rows: match ? [match] : [] };
    }

    // Official number lookup: WHERE $1 = ANY(official_numbers)
    if (/WHERE\s+\$1\s*=\s*ANY\(official_numbers\)/i.test(normalizedText) && params.length >= 1) {
      const targetNum = params[0];
      const match = memoryBrands.find(b => 
        Array.isArray(b.official_numbers) && b.official_numbers.includes(targetNum)
      );
      return { rows: match ? [match] : [] };
    }

    // Substring match: $1 LIKE ('%' || LOWER(name) || '%')
    if (/\$1 LIKE/i.test(normalizedText)) {
      const term = (params[0] || '').toLowerCase().trim();
      const match = memoryBrands.find(b => 
        term.includes(b.name.toLowerCase()) || 
        (Array.isArray(b.aliases) && b.aliases.some(a => term.includes(a.toLowerCase())))
      );
      return { rows: match ? [match] : [] };
    }

    // By ID: WHERE id = $1
    if (/WHERE id = \$1/i.test(normalizedText)) {
      const id = parseInt(params[0], 10);
      const match = memoryBrands.find(b => b.id === id);
      return { rows: match ? [match] : [] };
    }

    // All brands sorted by name
    const sorted = [...memoryBrands].sort((a, b) => a.name.localeCompare(b.name));
    return { rows: sorted };
  }

  // 3. Reports queries
  if (/FROM reports/i.test(normalizedText) || /INTO reports/i.test(normalizedText)) {
    // Insert report
    if (/INSERT INTO reports/i.test(normalizedText)) {
      const [number, brand, note, source, reporterKey] = params;
      const norm = normalizeNumber(number);
      const normNum = norm.valid && norm.normalized ? norm.normalized : number;
      const newReport = {
        id: memoryReports.length + 1,
        number: normNum,
        brand: brand || null,
        note: note || '',
        source: source || 'web',
        reporter_key: reporterKey || null,
        created_at: new Date()
      };
      memoryReports.unshift(newReport);
      return { rows: [{ id: newReport.id }] };
    }

    // Group by report counts for brand: GROUP BY number
    if (/GROUP BY number/i.test(normalizedText)) {
      const brandName = (params[0] || '').toLowerCase().trim();
      const brandReports = memoryReports.filter(r => (r.brand || '').toLowerCase() === brandName);
      const countMap = {};
      brandReports.forEach(r => {
        countMap[r.number] = (countMap[r.number] || 0) + 1;
      });
      const rows = Object.entries(countMap).map(([num, count]) => ({
        number: num,
        report_count: count,
        is_sample: true
      })).sort((a, b) => b.report_count - a.report_count).slice(0, 10);
      return { rows };
    }

    // Count for number: SELECT COUNT(*)::int AS count FROM reports WHERE number = $1
    if (/COUNT\(\*\)::int AS count FROM reports WHERE number = \$1/i.test(normalizedText)) {
      const norm = normalizeNumber(params[0]);
      const targetNum = norm.valid && norm.normalized ? norm.normalized : params[0];
      const count = memoryReports.filter(r => r.number === targetNum).length;
      return { rows: [{ count }] };
    }

    // Duplicate check: WHERE number = $1 AND reporter_key = $2
    if (/reporter_key = \$2/i.test(normalizedText)) {
      const exists = memoryReports.some(r => r.number === params[0] && r.reporter_key === params[1]);
      return { rows: exists ? [{ 1: 1 }] : [] };
    }

    // Total reports count
    if (/COUNT\(\*\)::int AS (count|total) FROM reports/i.test(normalizedText) || /COUNT\(\*\)::int FROM reports/i.test(normalizedText)) {
      return { rows: [{ count: memoryReports.length, total: memoryReports.length }] };
    }

    // Reports for number: WHERE number = $1
    if (/WHERE number = \$1/i.test(normalizedText)) {
      const limit = params[1] || 10;
      const filtered = memoryReports
        .filter(r => r.number === params[0])
        .slice(0, limit);
      return { rows: filtered };
    }

    // Recent reports
    const limit = params[0] || 10;
    return { rows: memoryReports.slice(0, limit) };
  }

  // 4. Checks queries
  if (/FROM checks/i.test(normalizedText) || /INTO checks/i.test(normalizedText)) {
    if (/INSERT INTO checks/i.test(normalizedText)) {
      const [number, brand, verdict, score, channel] = params;
      const newCheck = {
        id: memoryChecks.length + 1,
        number,
        brand: brand || null,
        verdict,
        score: score || 0,
        channel: channel || 'web',
        created_at: new Date()
      };
      memoryChecks.unshift(newCheck);
      return { rows: [{ id: newCheck.id }] };
    }

    if (/COUNT\(\*\)::int AS (count|total) FROM checks/i.test(normalizedText) || /COUNT\(\*\)::int FROM checks/i.test(normalizedText)) {
      return { rows: [{ count: memoryChecks.length, total: memoryChecks.length }] };
    }

    const limit = params[0] || 10;
    return { rows: memoryChecks.slice(0, limit) };
  }

  return { rows: [] };
}

async function checkConnection() {
  if (pool && isConfigured) {
    try {
      const res = await pool.query('SELECT 1 AS alive');
      return res.rows.length > 0;
    } catch (err) {
      console.error('[DB] Connection check failed:', err.message);
      return false;
    }
  }
  // In-memory fallback is always alive
  return true;
}

async function close() {
  if (pool) {
    await pool.end();
  }
}

module.exports = {
  pool,
  query,
  checkConnection,
  close,
  isConfigured: () => isConfigured || true
};

