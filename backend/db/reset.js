const db = require('../src/db');
const { runSeed } = require('./seed');

async function resetDb() {
  console.log('[Reset] Truncating reports and checks tables...');

  if (!db.isConfigured()) {
    console.error('[Reset Error] DATABASE_URL is not configured in .env.');
    process.exit(1);
  }

  // Truncate checks and reports (resets autoincrement ids)
  await db.query(`
    TRUNCATE TABLE checks, reports RESTART IDENTITY;
  `);
  console.log('[Reset] Tables truncated successfully. Re-running seed...');

  await runSeed();
  console.log('[Reset] Database reset to clean demo state completed successfully.');
}

if (require.main === module) {
  resetDb()
    .then(async () => {
      await db.close();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error('[Reset Error]', err.message);
      await db.close();
      process.exit(1);
    });
}

module.exports = { resetDb };
