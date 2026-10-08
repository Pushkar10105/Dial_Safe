const assert = require('assert');
const { normalizeNumber, extractNumber, maskNumber } = require('../src/services/numbers');
const { detect, VERDICTS, VERDICT_CODES } = require('../src/engine');

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

console.log('\n--- Running DialSafe Backend Unit Tests ---\n');

// 1. Number Normalization Tests
console.log('1. Numbers Service:');

test('normalizes 10-digit mobile number', () => {
  const res = normalizeNumber('9876543210');
  assert.strictEqual(res.valid, true);
  assert.strictEqual(res.normalized, '+919876543210');
  assert.strictEqual(res.type, 'mobile');
});

test('normalizes mobile with +91 and spaces', () => {
  const res = normalizeNumber('+91 98765 43210');
  assert.strictEqual(res.valid, true);
  assert.strictEqual(res.normalized, '+919876543210');
  assert.strictEqual(res.type, 'mobile');
});

test('normalizes mobile with leading 0', () => {
  const res = normalizeNumber('09876543210');
  assert.strictEqual(res.valid, true);
  assert.strictEqual(res.normalized, '+919876543210');
  assert.strictEqual(res.type, 'mobile');
});

test('normalizes mobile with leading 91 without plus', () => {
  const res = normalizeNumber('919876543210');
  assert.strictEqual(res.valid, true);
  assert.strictEqual(res.normalized, '+919876543210');
  assert.strictEqual(res.type, 'mobile');
});

test('normalizes toll-free 1800 number', () => {
  const res = normalizeNumber('1800-111-222');
  assert.strictEqual(res.valid, true);
  assert.strictEqual(res.normalized, '1800111222');
  assert.strictEqual(res.type, 'tollfree');
});

test('normalizes toll-free 1860 number', () => {
  const res = normalizeNumber('+91 1860 233 4567');
  assert.strictEqual(res.valid, true);
  assert.strictEqual(res.normalized, '18602334567');
  assert.strictEqual(res.type, 'tollfree');
});

test('normalizes landline with STD code', () => {
  const res = normalizeNumber('011-23456789');
  assert.strictEqual(res.valid, true);
  assert.strictEqual(res.normalized, '01123456789');
  assert.strictEqual(res.type, 'landline');
});

test('rejects invalid short or letters number', () => {
  assert.strictEqual(normalizeNumber('12345').valid, false);
  assert.strictEqual(normalizeNumber('abcdefghij').valid, false);
  assert.strictEqual(normalizeNumber('').valid, false);
  assert.strictEqual(normalizeNumber(null).valid, false);
});

// 2. Number Extraction & Masking Tests
console.log('\n2. Extraction & Masking:');

test('extracts phone number from message text', () => {
  const text = 'Urgent call me on +91 98765 43210 for account verification';
  const extracted = extractNumber(text);
  assert.strictEqual(extracted, '+919876543210');
});

test('masks mobile number for privacy', () => {
  const masked = maskNumber('+919876543210');
  assert.strictEqual(masked, '+91 98xxx xx210');
});

// 3. Detection Engine Pure Logic Tests
console.log('\n3. Detection Engine:');

test('returns Verified official when number matches brand official list', () => {
  const brand = {
    name: 'Zomato',
    official_numbers: ['+918069696969'],
    source_url: 'https://zomato.com'
  };
  const res = detect({
    number: '+918069696969',
    brandRecord: brand,
    reportCount: 0,
    typeOfNumber: 'landline'
  });
  assert.strictEqual(res.verdict, VERDICTS.VERIFIED);
  assert.strictEqual(res.verdictCode, VERDICT_CODES.VERIFIED);
  assert.strictEqual(res.score, 0);
  assert(res.reasons.length > 0);
});

test('official number wins even if reports exist (anti-poisoning rule)', () => {
  const brand = {
    name: 'Zomato',
    official_numbers: ['+918069696969'],
    source_url: 'https://zomato.com'
  };
  const res = detect({
    number: '+918069696969',
    brandRecord: brand,
    reportCount: 15,
    typeOfNumber: 'landline'
  });
  assert.strictEqual(res.verdict, VERDICTS.VERIFIED);
});

test('returns High risk when brand is claimed but number is not in official list', () => {
  const brand = {
    name: 'Zomato',
    official_numbers: ['+918069696969'],
    source_url: 'https://zomato.com'
  };
  const res = detect({
    number: '+919876543210',
    brandRecord: brand,
    reportCount: 0,
    typeOfNumber: 'mobile'
  });
  assert.strictEqual(res.verdict, VERDICTS.HIGH_RISK);
  assert.strictEqual(res.verdictCode, VERDICT_CODES.HIGH_RISK);
  assert(res.score >= 80);
});

test('returns High risk when number has 3 or more reports', () => {
  const res = detect({
    number: '+919876543210',
    brandRecord: null,
    reportCount: 4,
    typeOfNumber: 'mobile'
  });
  assert.strictEqual(res.verdict, VERDICTS.HIGH_RISK);
  assert.strictEqual(res.verdictCode, VERDICT_CODES.HIGH_RISK);
});

test('returns Suspicious when number has 1-2 reports', () => {
  const res = detect({
    number: '+919876543210',
    brandRecord: null,
    reportCount: 1,
    typeOfNumber: 'mobile'
  });
  assert.strictEqual(res.verdict, VERDICTS.SUSPICIOUS);
  assert.strictEqual(res.verdictCode, VERDICT_CODES.SUSPICIOUS);
});

test('returns Suspicious when mobile number claims to be company care line', () => {
  const res = detect({
    number: '+919876543210',
    brandRecord: null,
    reportCount: 0,
    typeOfNumber: 'mobile',
    claimedBrandName: 'Unknown Corp'
  });
  assert.strictEqual(res.verdict, VERDICTS.SUSPICIOUS);
});

test('returns Unknown for unconfirmed number with no brand and 0 reports', () => {
  const res = detect({
    number: '+919876543210',
    brandRecord: null,
    reportCount: 0,
    typeOfNumber: 'mobile'
  });
  assert.strictEqual(res.verdict, VERDICTS.UNKNOWN);
  assert.strictEqual(res.verdictCode, VERDICT_CODES.UNKNOWN);
});

test('HARD RULE: Verdict is NEVER "safe" under any circumstances', () => {
  const cases = [
    { number: '+918069696969', brandRecord: { name: 'Z', official_numbers: ['+918069696969'], source_url: 'u' }, reportCount: 0 },
    { number: '+919876543210', brandRecord: null, reportCount: 0 }
  ];
  for (const c of cases) {
    const res = detect(c);
    assert.notStrictEqual(res.verdict.toLowerCase(), 'safe');
    assert.notStrictEqual(res.verdictCode.toLowerCase(), 'safe');
  }
});

console.log(`\nResults: ${passed} passed, ${failed} failed.\n`);
if (failed > 0) {
  process.exit(1);
} else {
  console.log('All unit tests passed successfully!');
  process.exit(0);
}
