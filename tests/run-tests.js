#!/usr/bin/env node
/**
 * Test Runner for SymbiLink v3.0
 * 
 * Runs all tests with proper reporting
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const testsDir = __dirname;
const testFiles = fs.readdirSync(testsDir)
  .filter(f => f.endsWith('.test.js'))
  .map(f => path.join(testsDir, f));

console.log('═══════════════════════════════════════════════════════════════');
console.log('  🧪 SymbiLink v3.0 Test Suite');
console.log('═══════════════════════════════════════════════════════════════\n');

console.log(`Found ${testFiles.length} test files:\n`);
testFiles.forEach(f => console.log(`  • ${path.basename(f)}`));
console.log('\n───────────────────────────────────────────────────────────────\n');

// Run mocha
const mocha = spawn('npx', [
  'mocha',
  '--timeout', '10000',
  '--recursive',
  ...testFiles
], {
  stdio: 'inherit',
  shell: true
});

mocha.on('close', (code) => {
  console.log('\n───────────────────────────────────────────────────────────────');
  if (code === 0) {
    console.log('  ✅ All tests passed!');
  } else {
    console.log(`  ❌ Tests failed with code ${code}`);
  }
  console.log('───────────────────────────────────────────────────────────────');
  process.exit(code);
});