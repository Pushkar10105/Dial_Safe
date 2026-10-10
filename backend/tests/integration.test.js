const http = require('http');
const assert = require('assert');
const app = require('../src/server');

const server = http.createServer(app);

server.listen(0, async () => {
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`\n--- Running DialSafe Express Route Integration Tests on port ${port} ---\n`);

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
            body: data
          });
        });
      });
      req.on('error', reject);
      if (options.body) {
        req.write(options.body);
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
    await it('GET / returns status running', async () => {
      const res = await request('/');
      assert.strictEqual(res.status, 200);
      const json = JSON.parse(res.body);
      assert.strictEqual(json.status, 'running');
    });

    await it('GET /health returns health check json', async () => {
      const res = await request('/health');
      assert.strictEqual(res.status, 200);
      const json = JSON.parse(res.body);
      assert.strictEqual(json.ok, true);
      assert(typeof json.db === 'boolean');
      assert(typeof json.time === 'string');
    });

    await it('POST /whatsapp returns TwiML XML', async () => {
      const res = await request('/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'From=whatsapp%3A%2B919876543210&Body=hi'
      });
      assert.strictEqual(res.status, 200);
      assert(res.headers['content-type'].includes('text/xml'));
      assert(res.body.includes('<Response><Message>') && res.body.includes('</Message></Response>'));
    });

    await it('POST /check rejects empty body with 400', async () => {
      const res = await request('/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      assert.strictEqual(res.status, 400);
      const json = JSON.parse(res.body);
      assert.strictEqual(json.ok, false);
    });

    await it('POST /check rejects invalid phone numbers with 400', async () => {
      const res = await request('/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number: '12345' })
      });
      assert.strictEqual(res.status, 400);
      const json = JSON.parse(res.body);
      assert.strictEqual(json.ok, false);
      assert(json.error.includes('Invalid'));
    });

    await it('POST /report rejects missing phone number with 400', async () => {
      const res = await request('/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: 'scam' })
      });
      assert.strictEqual(res.status, 400);
      const json = JSON.parse(res.body);
      assert.strictEqual(json.ok, false);
    });

    console.log(`\nResults: ${passed} passed, ${failed} failed.\n`);
  } finally {
    server.close();
    process.exit(failed > 0 ? 1 : 0);
  }
});
