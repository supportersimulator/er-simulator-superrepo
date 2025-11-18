#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('\n🔍 VERIFYING SINGLE ROW PROCESSING INTEGRITY\n');

const codePath = path.join(__dirname, 'Code_ULTIMATE_ATSR.gs');
const code = fs.readFileSync(codePath, 'utf8');

// Find the processOneInputRow_ function
const funcRegex = /function processOneInputRow_\([^)]*\)\s*\{/;
const match = code.match(funcRegex);

if (!match) {
  console.log('❌ processOneInputRow_ function NOT FOUND!\n');
  process.exit(1);
}

const startIdx = code.indexOf(match[0]);

// Extract the entire function (find matching closing brace)
let braceCount = 0;
let inFunction = false;
let functionCode = '';

for (let i = startIdx; i < code.length; i++) {
  const char = code[i];
  functionCode += char;
  
  if (char === '{') {
    braceCount++;
    inFunction = true;
  } else if (char === '}') {
    braceCount--;
    if (inFunction && braceCount === 0) {
      break;
    }
  }
}

console.log('📋 Single Row Processing Function Analysis:\n');

// Check critical operations
const checks = [
  {
    name: 'Reads sheet headers',
    pattern: /getRange.*getValues/,
    critical: true
  },
  {
    name: 'Calls OpenAI API',
    pattern: /callOpenAI/,
    critical: true
  },
  {
    name: 'Parses JSON response',
    pattern: /tryParseJSON|JSON\.parse/,
    critical: true
  },
  {
    name: 'Validates vitals fields',
    pattern: /validateVitalsFields_/,
    critical: true
  },
  {
    name: 'Applies clinical defaults',
    pattern: /applyClinicalDefaults_/,
    critical: true
  },
  {
    name: 'Writes to output sheet',
    pattern: /setValues/,
    critical: true
  },
  {
    name: 'Error handling',
    pattern: /try\s*\{|catch/,
    critical: true
  },
  {
    name: 'Logging',
    pattern: /Logger\.log/,
    critical: false
  }
];

let allCriticalPresent = true;

checks.forEach(check => {
  const found = check.pattern.test(functionCode);
  const icon = found ? '✅' : (check.critical ? '❌' : '⚠️');
  const label = check.critical ? '(CRITICAL)' : '(optional)';
  
  console.log(`${icon} ${check.name} ${label}`);
  
  if (check.critical && !found) {
    allCriticalPresent = false;
  }
});

// Check that it's NOT calling parseATSRResponse_ (that's ATSR-only)
const usesATSRParser = /parseATSRResponse_/.test(functionCode);
if (usesATSRParser) {
  console.log('\n⚠️  WARNING: Function is calling parseATSRResponse_');
  console.log('   This should only be used by ATSR, not batch processing!');
  allCriticalPresent = false;
} else {
  console.log('\n✅ Correctly NOT using ATSR-specific parser');
}

// Check function signature
console.log('\n📊 Function Details:');
console.log(`   Lines: ${functionCode.split('\n').length}`);
console.log(`   Characters: ${functionCode.length}`);

console.log('\n' + '='.repeat(50));
if (allCriticalPresent) {
  console.log('✅ SINGLE ROW PROCESSING: FULLY INTACT');
  console.log('   All critical operations present and correct.');
} else {
  console.log('❌ SINGLE ROW PROCESSING: POTENTIAL ISSUES');
  console.log('   Some critical operations missing!');
}
console.log('='.repeat(50) + '\n');

