const http = require('http');
const assert = require('assert');
const app = require('../src/server');
const db = require('../src/db');

const server = http.createServer(app);

server.listen(0, async () => {
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`\n--- Running DialSafe Live Database End-to-End Tests on port ${port} ---\n`);

  let passed = 0;
  let failed = 0;

  async function request(path, options = {}) {
    return new Promise((resolve, reject) => {
      const url = new URL(path, baseUrl);
      const req = http.request(url, options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data ? JSON.parse(data) : {}
          });
        });
      });
      req.on('error', reject);
      if (options.body) {
        req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
      }
      req.end();
    });
  }

  async function it(name, fn) {
    try {
      await fn();
      console.log(`  ✓ ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ✗ ${name}`);
      console.error(`    ${err.message}`);
      failed++;
    }
  }

  try {
    await it('GET /health verifies live database connection (db: true)', async () => {
      const res = await request('/health');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.ok, true);
      assert.strictEqual(res.body.db, true, 'Database should be connected and report true');
    });

    await it('GET /brands lists seeded brands', async () => {
      const res = await request('/brands');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.ok, true);
      assert(Array.isArray(res.body.brands));
      assert(res.body.brands.length >= 5);
      const zomato = res.body.brands.find(b => b.name === 'Zomato');
      assert(zomato, 'Zomato brand should exist');
    });

    await it('GET /brand/Zomato returns brand details and verified contact info', async () => {
      const res = await request('/brand/Zomato');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.ok, true);
      assert.strictEqual(res.body.brand, 'Zomato');
      assert.strictEqual(res.body.sourceUrl, 'https://www.zomato.com/contact');
    });

    await it('POST /check on sample scam number returns High risk verdict', async () => {
      const res = await request('/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: { number: '+91 00000 00001', brand: 'Zomato' }
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.ok, true);
      assert.strictEqual(res.body.verdict, 'High risk');
      assert.strictEqual(res.body.verdictCode, 'high_risk');
      assert(res.body.reportCount >= 3, 'Report count should reflect sample reports');
      assert(res.body.reasons.length > 0);
      assert(res.body.advice.length > 0);
    });

    await it('POST /check on unknown number returns Unknown verdict (never safe)', async () => {
      const res = await request('/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: { number: '+91 98888 77777' }
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.ok, true);
      assert.strictEqual(res.body.verdict, 'Unknown');
      assert.notStrictEqual(res.body.verdict.toLowerCase(), 'safe');
    });

    await it('POST /report registers a new scam report in the live database', async () => {
      const res = await request('/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: {
          number: '+91 99999 88888',
          brand: 'Swiggy',
          note: 'Fake refund call asking for bank OTP',
          source: 'web'
        }
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.ok, true);
      assert(res.body.reportCount >= 1);
    });

    await it('GET /stats aggregates live counts and recent events', async () => {
      const res = await request('/stats');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.ok, true);
      assert(res.body.totals.brands >= 5);
      assert(res.body.totals.reports >= 7);
      assert(Array.isArray(res.body.recentReports));
      assert(Array.isArray(res.body.recentChecks));
    });

    console.log(`\nLive E2E Results: ${passed} passed, ${failed} failed.\n`);
  } finally {
    server.close();
    await db.close();
    process.exit(failed > 0 ? 1 : 0);
  }
});
