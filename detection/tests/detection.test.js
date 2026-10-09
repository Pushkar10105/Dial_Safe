/**
 * detection/tests/detection.test.js
 * Comprehensive unit test suite for Member 4's Detection Engine.
 * Run with: node tests/detection.test.js
 */

const assert = require('assert');
const {
  detect,
  normalizeNumber,
  extractNumber,
  maskNumber,
  matchBrand,
  cleanBrandQuery,
  VERDICTS,
  VERDICT_CODES,
  SAFETY_ADVICE
} = require('../src');

let passedCount = 0;
let failedCount = 0;

function test(name, fn) {
  try {
    fn();
    passedCount++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    failedCount++;
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
  }
}

console.log('\n=== DialSafe Detection Engine Test Suite ===\n');

// -------------------------------------------------------------
// 1. NUMBER NORMALISATION & VALIDATION TESTS
// -------------------------------------------------------------
console.log('--- 1. Number Normalisation ---');

test('normalises standard 10-digit mobile with +91 prefix', () => {
  const res = normalizeNumber('+91 98765 43210');
  assert.strictEqual(res.valid, true);
  assert.strictEqual(res.normalized, '+919876543210');
  assert.strictEqual(res.type, 'mobile');
});

test('normalises 10-digit mobile with leading 0', () => {
  const res = normalizeNumber('09876543210');
  assert.strictEqual(res.valid, true);
  assert.strictEqual(res.normalized, '+919876543210');
  assert.strictEqual(res.type, 'mobile');
});

test('normalises raw 10-digit mobile without prefix', () => {
  const res = normalizeNumber('9876543210');
  assert.strictEqual(res.valid, true);
  assert.strictEqual(res.normalized, '+919876543210');
  assert.strictEqual(res.type, 'mobile');
});

test('normalises toll-free 1800 number with dashes and spaces', () => {
  const res = normalizeNumber('1800-111-222');
  assert.strictEqual(res.valid, true);
  assert.strictEqual(res.normalized, '1800111222');
  assert.strictEqual(res.type, 'tollfree');
});

test('normalises toll-free 1860 number with +91 prefix', () => {
  const res = normalizeNumber('+91 1860 123 4567');
  assert.strictEqual(res.valid, true);
  assert.strictEqual(res.normalized, '18601234567');
  assert.strictEqual(res.type, 'tollfree');
});

test('normalises AGENTS.md sample test pattern (+91 00000 00000)', () => {
  const res = normalizeNumber('+91 00000 00000');
  assert.strictEqual(res.valid, true);
  assert.strictEqual(res.normalized, '+910000000000');
  assert.strictEqual(res.type, 'mobile');
});

test('normalises Indian landline with STD code (011)', () => {
  const res = normalizeNumber('011-23456789');
  assert.strictEqual(res.valid, true);
  assert.strictEqual(res.normalized, '01123456789');
  assert.strictEqual(res.type, 'landline');
});

test('rejects malformed numbers and non-digits', () => {
  const res1 = normalizeNumber('12345');
  assert.strictEqual(res1.valid, false);

  const res2 = normalizeNumber('abcdefghij');
  assert.strictEqual(res2.valid, false);

  const res3 = normalizeNumber(null);
  assert.strictEqual(res3.valid, false);
});

// -------------------------------------------------------------
// 2. NUMBER EXTRACTION & MASKING
// -------------------------------------------------------------
console.log('\n--- 2. Extraction & Masking ---');

test('extracts phone number from WhatsApp bot message', () => {
  const text = 'Hello, can you check +91 98765 43210 for Zomato?';
  const extracted = extractNumber(text);
  assert.strictEqual(extracted, '+919876543210');
});

test('extracts toll-free number from message', () => {
  const text = 'Is 1800 123 4567 really their helpline?';
  const extracted = extractNumber(text);
  assert.strictEqual(extracted, '18001234567');
});

test('masks phone number for privacy display', () => {
  const masked = maskNumber('+919876543210');
  assert.strictEqual(masked, '+91 98xxx xx210');
});

// -------------------------------------------------------------
// 3. BRAND MATCHING & ALIASES
// -------------------------------------------------------------
console.log('\n--- 3. Brand Matching ---');

const mockBrands = [
  {
    id: 1,
    name: 'Zomato',
    aliases: ['zomato', 'zomato care', 'zomato support', 'zomato delivery'],
    official_numbers: ['+918069696969'],
    source_url: 'https://www.zomato.com/contact'
  },
  {
    id: 2,
    name: 'State Bank of India',
    aliases: ['sbi', 'sbi bank', 'state bank'],
    official_numbers: ['18001234', '18002100'],
    source_url: 'https://sbi.co.in'
  }
];

test('matches brand by exact name', () => {
  const match = matchBrand('Zomato', mockBrands);
  assert.ok(match);
  assert.strictEqual(match.name, 'Zomato');
});

test('matches brand by alias ("sbi")', () => {
  const match = matchBrand('sbi', mockBrands);
  assert.ok(match);
  assert.strictEqual(match.name, 'State Bank of India');
});

test('matches brand by noisy query ("zomato customer care")', () => {
  const match = matchBrand('zomato customer care', mockBrands);
  assert.ok(match);
  assert.strictEqual(match.name, 'Zomato');
});

test('returns null for unlisted brand', () => {
  const match = matchBrand('Unknown Startup XYZ', mockBrands);
  assert.strictEqual(match, null);
});

// -------------------------------------------------------------
// 4. DETECTION HEURISTICS & VERDICTS
// -------------------------------------------------------------
console.log('\n--- 4. Detection Verdicts & Heuristics ---');

test('Rule 1: Official number match returns "Verified official" with score 0.0', () => {
  const result = detect({
    number: '+918069696969',
    brandRecord: mockBrands[0],
    reportCount: 0
  });

  assert.strictEqual(result.verdict, VERDICTS.VERIFIED);
  assert.strictEqual(result.verdictCode, VERDICT_CODES.VERIFIED);
  assert.strictEqual(result.score, 0.0);
  assert.ok(result.reasons[0].includes('Matches the official customer care number'));
});

test('Rule 2: Brand mismatch (fake helpline claiming to be Zomato) returns "High risk"', () => {
  const result = detect({
    number: '+919999988888',
    brandRecord: mockBrands[0],
    claimedBrandName: 'Zomato',
    reportCount: 0
  });

  assert.strictEqual(result.verdict, VERDICTS.HIGH_RISK);
  assert.strictEqual(result.verdictCode, VERDICT_CODES.HIGH_RISK);
  assert.ok(result.score >= 0.85);
  assert.ok(result.reasons.some(r => r.includes('not an official contact number')));
  assert.ok(result.advice.some(a => a.includes('1930')));
});

test('Rule 3: Known fake number flagged in advisory returns "High risk" score >= 0.95', () => {
  const result = detect({
    number: '+919123456789',
    knownFakeNumbers: ['+919123456789'],
    reportCount: 0
  });

  assert.strictEqual(result.verdict, VERDICTS.HIGH_RISK);
  assert.strictEqual(result.verdictCode, VERDICT_CODES.HIGH_RISK);
  assert.ok(result.score >= 0.95);
  assert.ok(result.reasons.some(r => r.includes('fraudulent number flagged in')));
});

test('Rule 4: Community reports >= 3 returns "High risk"', () => {
  const result = detect({
    number: '+919876543210',
    reportCount: 4
  });

  assert.strictEqual(result.verdict, VERDICTS.HIGH_RISK);
  assert.strictEqual(result.verdictCode, VERDICT_CODES.HIGH_RISK);
  assert.ok(result.score >= 0.80);
  assert.ok(result.reasons.some(r => r.includes('Reported 4 times')));
});

test('Rule 5: Community reports 1-2 returns "Suspicious"', () => {
  const result = detect({
    number: '+919876543210',
    reportCount: 2
  });

  assert.strictEqual(result.verdict, VERDICTS.SUSPICIOUS);
  assert.strictEqual(result.verdictCode, VERDICT_CODES.SUSPICIOUS);
  assert.ok(result.score >= 0.50 && result.score < 0.75);
  assert.ok(result.reasons.some(r => r.includes('Reported 2 time(s)')));
});

test('Rule 6: Personal mobile claiming to be bank helpline returns "Suspicious" with reason', () => {
  const result = detect({
    number: '+919876543210',
    typeOfNumber: 'mobile',
    claimedBrandName: 'State Bank of India',
    reportCount: 0
  });

  assert.ok(result.verdict === VERDICTS.SUSPICIOUS || result.verdict === VERDICTS.HIGH_RISK);
  assert.ok(result.reasons.some(r => r.includes('personal mobile number is being used as a care line')));
});

test('Rule 7: Fallback to "Unknown" when no signals exist (NEVER says "safe")', () => {
  const result = detect({
    number: '+919876543210',
    brandRecord: null,
    reportCount: 0
  });

  assert.strictEqual(result.verdict, VERDICTS.UNKNOWN);
  assert.strictEqual(result.verdictCode, VERDICT_CODES.UNKNOWN);
  assert.strictEqual(result.score, 0.15);
  assert.ok(result.reasons[0].includes('cannot confirm'));
});

// -------------------------------------------------------------
// 5. ANTI-HALLUCINATION & PROJECT SAFETY CONSTRAINTS
// -------------------------------------------------------------
console.log('\n--- 5. Anti-Hallucination & Safety Constraints ---');

test('CRITICAL: Verdict is NEVER "safe"', () => {
  const testInputs = [
    { number: '+919876543210', reportCount: 0 },
    { number: '+918069696969', brandRecord: mockBrands[0], reportCount: 0 },
    { number: '+919999988888', brandRecord: mockBrands[0], reportCount: 10 },
    { number: '18001234', brandRecord: mockBrands[1], reportCount: 0 }
  ];

  for (const input of testInputs) {
    const res = detect(input);
    assert.notStrictEqual(res.verdict.toLowerCase(), 'safe');
    assert.strictEqual(
      [VERDICTS.VERIFIED, VERDICTS.HIGH_RISK, VERDICTS.SUSPICIOUS, VERDICTS.UNKNOWN].includes(res.verdict),
      true
    );
  }
});

test('High-risk advice always includes national cybercrime 1930 / cybercrime.gov.in', () => {
  const result = detect({
    number: '+919876543210',
    reportCount: 5
  });

  assert.strictEqual(result.verdict, VERDICTS.HIGH_RISK);
  assert.ok(result.advice.some(a => a.includes('1930') && a.includes('cybercrime.gov.in')));
  assert.ok(result.advice.some(a => a.includes('OTPs') || a.includes('PINs')));
});

console.log(`\n========================================`);
console.log(`Summary: ${passedCount} passed, ${failedCount} failed`);
console.log(`========================================\n`);

if (failedCount > 0) {
  process.exit(1);
}
