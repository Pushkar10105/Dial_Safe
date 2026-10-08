const fs = require('fs');
const path = require('path');
const db = require('../src/db');
const { normalizeNumber } = require('../src/services/numbers');

async function runSeed() {
  console.log('[Seed] Starting database migration and seed process...');

  if (!db.isConfigured()) {
    console.error('[Seed Error] DATABASE_URL is not configured in .env. Exiting seed.');
    process.exit(1);
  }

  // 1. Run schema.sql
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  console.log('[Seed] Applying schema.sql...');
  await db.query(schemaSql);
  console.log('[Seed] Schema applied successfully.');

  // 2. Load and validate brands
  const brandsPath = path.join(__dirname, 'seed/brands.json');
  const brandsData = JSON.parse(fs.readFileSync(brandsPath, 'utf8'));
  console.log(`[Seed] Processing ${brandsData.length} brands...`);

  for (const brand of brandsData) {
    if (!brand.name || !brand.source_url) {
      throw new Error(`[Seed Error] Brand '${brand.name || 'Unnamed'}' missing name or source_url.`);
    }

    if (brand.source_url.includes('REPLACE')) {
      throw new Error(`[Seed Error] Brand '${brand.name}' contains placeholder source_url: ${brand.source_url}`);
    }

    // Normalize any official numbers
    const normalizedOfficials = [];
    if (Array.isArray(brand.official_numbers)) {
      for (const num of brand.official_numbers) {
        const norm = normalizeNumber(num);
        if (!norm.valid) {
          throw new Error(`[Seed Error] Invalid official number '${num}' for brand '${brand.name}'.`);
        }
        normalizedOfficials.push(norm.normalized);
      }
    }

    const aliases = (brand.aliases || []).map(a => a.toLowerCase().trim());
    const lastChecked = brand.last_checked || new Date().toISOString().split('T')[0];

    const upsertSql = `
      INSERT INTO brands (name, aliases, official_numbers, source_url, last_checked)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (name) DO UPDATE SET
        aliases = EXCLUDED.aliases,
        official_numbers = EXCLUDED.official_numbers,
        source_url = EXCLUDED.source_url,
        last_checked = EXCLUDED.last_checked;
    `;
    await db.query(upsertSql, [brand.name, aliases, normalizedOfficials, brand.source_url, lastChecked]);
  }
  console.log('[Seed] Brands seeded successfully.');

  // 3. Load and insert sample reports
  const reportsPath = path.join(__dirname, 'seed/sample_reports.json');
  const reportsData = JSON.parse(fs.readFileSync(reportsPath, 'utf8'));
  console.log(`[Seed] Processing ${reportsData.length} sample reports...`);

  for (const report of reportsData) {
    // Normalization check: sample test numbers like +91 00000 00001
    let normalized = report.number.replace(/\s+/g, '');
    const norm = normalizeNumber(report.number);
    if (norm.valid) {
      normalized = norm.normalized;
    }

    // Check if this report already exists to avoid redundant duplication
    const checkSql = `
      SELECT 1 FROM reports
      WHERE number = $1 AND note = $2 AND source = 'sample'
      LIMIT 1;
    `;
    const exists = await db.query(checkSql, [normalized, report.note]);
    if (exists.rows.length === 0) {
      const insertSql = `
        INSERT INTO reports (number, brand, note, source, reporter_key)
        VALUES ($1, $2, $3, 'sample', 'seed-script');
      `;
      await db.query(insertSql, [normalized, report.brand || null, report.note || '']);
    }
  }
  console.log('[Seed] Sample reports seeded successfully.');

  console.log('[Seed] Database initialization complete!');
}

if (require.main === module) {
  runSeed()
    .then(async () => {
      await db.close();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error('[Seed Error]', err.message);
      await db.close();
      process.exit(1);
    });
}

module.exports = { runSeed };
