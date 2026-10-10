/**
 * tests/run-all.js
 * DialSafe Unified Test Suite Runner (Member 5 role)
 * Runs detection tests, backend tests, and bot unit tests in a single command.
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('========================================================');
console.log('       DIALSAFE UNIFIED TEST SUITE (ALL MODULES)        ');
console.log('========================================================\n');

const suites = [
  { name: '1. Detection Engine Unit Tests', dir: 'detection', cmd: 'npm test' },
  { name: '2. Backend Unit Tests', dir: 'backend', cmd: 'node tests/test.js' },
  { name: '3. WhatsApp Bot Unit Tests', dir: 'bot', cmd: 'npm test' },
];

let allPassed = true;

for (const suite of suites) {
  console.log(`>>> Running: ${suite.name}...`);
  try {
    execSync(suite.cmd, {
      cwd: path.resolve(__dirname, '..', suite.dir),
      stdio: 'inherit'
    });
    console.log(`[PASS] ${suite.name}\n`);
  } catch (err) {
    console.error(`[FAIL] ${suite.name}\n`);
    allPassed = false;
  }
}

console.log('========================================================');
if (allPassed) {
  console.log(' ALL SUITES PASSED! DialSafe core logic is verified.');
} else {
  console.error(' SOME TESTS FAILED. Review output above.');
  process.exit(1);
}
console.log('========================================================');
