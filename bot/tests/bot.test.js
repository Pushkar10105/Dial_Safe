/**
 * tests/bot.test.js — Unit tests for the DialSafe WhatsApp bot.
 *
 * Tests cover:
 *  1. formatters.js — all formatting functions
 *  2. router.js intent classification — mocked backend client
 *
 * No Twilio or backend required. Uses Node's built-in assert module.
 */

const assert = require('assert');

// ── Module stubs ──────────────────────────────────────────────────────────
// Stub the client module so tests don't hit the real backend.
// We use a simple require-cache override before importing router.

const FAKE_CHECK_RESULT = {
  ok: true,
  type: 'check',
  number: '+919876543210',
  verdict: 'High risk',
  verdictCode: 'high_risk',
  score: 0.85,
  reasons: ['Not in official number list for Zomato', 'Reported 3 time(s) as suspicious.'],
  reportCount: 3,
  brand: 'Zomato',
  officialNumber: null,
  advice: ['Do not share OTPs, PINs, or banking details.', 'Report cyber fraud at cybercrime.gov.in or call 1930.'],
  detailUrl: 'http://localhost:5173/number/%2B919876543210',
};

const FAKE_BRAND_RESULT = {
  ok: true,
  type: 'brand',
  brand: 'Swiggy',
  officialNumbers: ['+918069012345'],
  sourceUrl: 'https://www.swiggy.com/contact',
  lastChecked: '2026-10-08',
  knownFakeNumbers: [],
};

const FAKE_UNRECOGNIZED_RESULT = {
  ok: true,
  type: 'unrecognized',
  message: 'Not in our verified brand list.',
};

const FAKE_REPORT_RESULT = {
  ok: true,
  reportCount: 4,
};

// Inject stub into require cache before importing router
require.cache[require.resolve('../src/client')] = {
  id: require.resolve('../src/client'),
  filename: require.resolve('../src/client'),
  loaded: true,
  exports: {
    postMessage: async (text) => {
      // Simulate number-check if text contains a digit sequence
      if (/\d{5}/.test(text)) return FAKE_CHECK_RESULT;
      if (/swiggy/i.test(text)) return FAKE_BRAND_RESULT;
      return FAKE_UNRECOGNIZED_RESULT;
    },
    reportNumber: async (_number, _brand, _note) => FAKE_REPORT_RESULT,
    checkNumber:  async () => FAKE_CHECK_RESULT,
    getBrand:     async () => FAKE_BRAND_RESULT,
  },
};

// Now import modules that depend on the stubbed client
const formatters = require('../src/formatters');
const { routeMessage } = require('../src/router');

// ── Test harness ──────────────────────────────────────────────────────────
let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
    failed++;
  }
}

async function testAsync(name, fn) {
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

// ═══════════════════════════════════════════════════════════════════════════
// 1. Formatters
// ═══════════════════════════════════════════════════════════════════════════
console.log('\n--- 1. Formatters ---\n');

test('formatHelpReply contains welcome text', () => {
  const reply = formatters.formatHelpReply();
  assert.ok(reply.includes('DialSafe'), 'should mention DialSafe');
  assert.ok(reply.includes('1930'), 'should include cyber helpline 1930');
  assert.ok(reply.includes('help'), 'should include help keyword');
});

test('formatCheckReply: High risk — contains emoji, verdict, reasons, advice, detail link', () => {
  const reply = formatters.formatCheckReply(FAKE_CHECK_RESULT);
  assert.ok(reply.includes('🚨'), 'should show High risk emoji');
  assert.ok(reply.includes('High risk'), 'should state verdict');
  assert.ok(reply.includes('Not in official number list'), 'should include reason');
  assert.ok(reply.includes('OTP'), 'high-risk must warn about OTPs');
  assert.ok(reply.includes('1930'), 'high-risk must include 1930');
  assert.ok(reply.includes('cybercrime.gov.in'), 'high-risk must include cybercrime.gov.in');
  assert.ok(reply.includes('localhost:5173'), 'must include detail URL');
});

test('formatCheckReply: never contains the word "safe"', () => {
  const reply = formatters.formatCheckReply(FAKE_CHECK_RESULT).toLowerCase();
  assert.ok(!reply.includes(' safe'), 'reply must never say "safe"');
});

test('formatBrandReply contains brand name, official number, source', () => {
  const reply = formatters.formatBrandReply(FAKE_BRAND_RESULT);
  assert.ok(reply.includes('Swiggy'), 'should include brand name');
  assert.ok(reply.includes('+918069012345'), 'should include official number');
  assert.ok(reply.includes('swiggy.com'), 'should include sourceUrl');
  assert.ok(reply.includes('2026-10-08'), 'should include last-checked date');
});

test('formatReportReply: ok=true shows confirmation and report count', () => {
  const reply = formatters.formatReportReply(FAKE_REPORT_RESULT, '+919876543210');
  assert.ok(reply.includes('✅'), 'should have success emoji');
  assert.ok(reply.includes('4'), 'should show report count');
  assert.ok(reply.includes('1930'), 'should include cybercrime helpline');
});

test('formatReportReply: ok=false shows error message', () => {
  const reply = formatters.formatReportReply({ ok: false, reportCount: 0 }, '+919876543210');
  assert.ok(reply.includes('❌'), 'should show error emoji');
});

test('formatUnrecognizedReply contains guidance to check official website', () => {
  const reply = formatters.formatUnrecognizedReply('FakeBrand care');
  assert.ok(reply.includes('official website'), 'should direct to official website');
  assert.ok(!reply.toLowerCase().includes('safe'), 'should not claim number is safe');
});

test('formatErrorReply contains advisory text', () => {
  const reply = formatters.formatErrorReply();
  assert.ok(reply.includes('⚠️'), 'should show warning emoji');
  assert.ok(reply.includes('1930'), 'should include cyber helpline');
});

test('formatInvalidNumberReply contains the rejected input', () => {
  const reply = formatters.formatInvalidNumberReply('abc123');
  assert.ok(reply.includes('abc123'), 'should echo invalid input');
  assert.ok(reply.includes('valid'), 'should mention valid format');
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. Intent Router
// ═══════════════════════════════════════════════════════════════════════════
console.log('\n--- 2. Router ---\n');

(async () => {
  await testAsync('empty body → help reply', async () => {
    const reply = await routeMessage('', 'whatsapp:+910000000000');
    assert.ok(reply.includes('DialSafe'));
  });

  await testAsync('"hi" → help reply', async () => {
    const reply = await routeMessage('hi');
    assert.ok(reply.includes('DialSafe'));
  });

  await testAsync('"help" → help reply', async () => {
    const reply = await routeMessage('help');
    assert.ok(reply.includes('1930'));
  });

  await testAsync('"hello" → help reply', async () => {
    const reply = await routeMessage('hello');
    assert.ok(reply.includes('DialSafe'));
  });

  await testAsync('"menu" → help reply', async () => {
    const reply = await routeMessage('menu');
    assert.ok(reply.includes('DialSafe'));
  });

  await testAsync('"report 9876543210" → report confirmation', async () => {
    const reply = await routeMessage('report 9876543210 asked for OTP');
    assert.ok(reply.includes('✅') || reply.includes('Report'), 'should confirm report');
    assert.ok(reply.includes('1930'), 'report reply must include 1930');
  });

  await testAsync('"report" with no number → error guidance', async () => {
    const reply = await routeMessage('report random text');
    assert.ok(reply.includes('❌') || reply.includes('number'), 'should show error about missing number');
  });

  await testAsync('message containing a number → check reply', async () => {
    const reply = await routeMessage('Is 9876543210 legitimate?');
    // Stub returns FAKE_CHECK_RESULT for text with digits
    assert.ok(reply.includes('High risk') || reply.includes('🚨'));
  });

  await testAsync('brand lookup → brand reply', async () => {
    const reply = await routeMessage('swiggy care number');
    assert.ok(reply.includes('Swiggy'));
  });

  await testAsync('HARD RULE: no verdict reply says "safe"', async () => {
    const reply = (await routeMessage('9876543210')).toLowerCase();
    assert.ok(!reply.includes(' safe'), 'verdict reply must never say "safe"');
  });

  await testAsync('unrecognized brand → honest not-found reply', async () => {
    const reply = await routeMessage('totally unknown brand xyz');
    assert.ok(reply.toLowerCase().includes('not found') || reply.includes('official website'));
  });

  // Summary
  console.log(`\nResults: ${passed} passed, ${failed} failed.\n`);
  if (failed > 0) {
    console.error('Some tests failed!');
    process.exit(1);
  } else {
    console.log('All bot tests passed!');
    process.exit(0);
  }
})();
