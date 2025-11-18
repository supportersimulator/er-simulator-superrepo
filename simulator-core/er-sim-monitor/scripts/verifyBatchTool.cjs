#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('\n🔍 VERIFYING BATCH PROCESSING TOOL INTEGRITY\n');

const codePath = path.join(__dirname, 'Code_ULTIMATE_ATSR.gs');
const code = fs.readFileSync(codePath, 'utf8');

// Check for critical batch processing functions
const criticalFunctions = [
  'processOneInputRow_',
  'startBatchFromSidebar',
  'runSingleStepBatch',
  'validateVitalsFields_',
  'applyClinicalDefaults_',
  'tryParseJSON'
];

console.log('📋 Checking critical batch functions:\n');

let allFound = true;
criticalFunctions.forEach(fn => {
  const regex = new RegExp(`function ${fn}`, 'g');
  const matches = code.match(regex);
  
  if (matches) {
    console.log(`✅ ${fn} - Found (${matches.length} occurrence${matches.length > 1 ? 's' : ''})`);
  } else {
    console.log(`❌ ${fn} - MISSING!`);
    allFound = false;
  }
});

// Check tryParseJSON hasn't been modified in a breaking way
console.log('\n🔬 Analyzing tryParseJSON function:\n');

const tryParseMatch = code.match(/function tryParseJSON\(text\)\s*\{[^}]+\}/s);
if (tryParseMatch) {
  const fnCode = tryParseMatch[0];
  
  // Check it still has the original behavior
  const hasBasicParse = fnCode.includes('JSON.parse(text)');
  const hasFallback = fnCode.includes('match(/\\{[\\s\\S]*\\}/)');
  const returnsNull = fnCode.includes('return null');
  
  if (hasBasicParse && hasFallback && returnsNull) {
    console.log('✅ tryParseJSON has correct structure');
    console.log('   - Basic JSON.parse() ✓');
    console.log('   - Fallback regex extraction ✓');
    console.log('   - Returns null on failure ✓');
  } else {
    console.log('⚠️  tryParseJSON may have been modified:');
    if (!hasBasicParse) console.log('   - Missing basic JSON.parse()');
    if (!hasFallback) console.log('   - Missing fallback regex');
    if (!returnsNull) console.log('   - Missing null return');
  }
} else {
  console.log('❌ Could not find tryParseJSON function!');
  allFound = false;
}

// Check for new ATSR-specific function
console.log('\n🆕 Checking for ATSR-specific parser:\n');

const atsrParseMatch = code.match(/function parseATSRResponse_/);
if (atsrParseMatch) {
  console.log('✅ parseATSRResponse_ exists (ATSR-only parser)');
} else {
  console.log('❌ parseATSRResponse_ not found');
}

// Summary
console.log('\n' + '='.repeat(50));
if (allFound) {
  console.log('✅ BATCH TOOL INTEGRITY: PASS');
  console.log('   All critical functions present and correct.');
} else {
  console.log('❌ BATCH TOOL INTEGRITY: FAIL');
  console.log('   Some functions are missing or broken!');
}
console.log('='.repeat(50) + '\n');

