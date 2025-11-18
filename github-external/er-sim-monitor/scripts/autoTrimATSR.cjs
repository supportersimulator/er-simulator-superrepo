#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔬 AUTO-TRIMMING ATSR CODE\n');
console.log('Strategy: Dependency analysis → Remove unused → Deploy → Test\n');

const codePath = path.join(__dirname, 'Code_ATSR_Trimmed.gs');
const code = fs.readFileSync(codePath, 'utf8');

console.log(`📊 Starting size: ${code.split('\n').length} lines\n`);

// Parse all function definitions
const functionRegex = /function\s+(\w+)\s*\(/g;
const allFunctions = new Set();
let match;
while ((match = functionRegex.exec(code)) !== null) {
  allFunctions.add(match[1]);
}

console.log(`📋 Found ${allFunctions.size} total functions\n`);

// ATSR entry points (what we MUST keep)
const entryPoints = [
  'generateATSR',        // Main ATSR function
  'onOpen',              // Menu creator
  'showSettings',        // Settings dialog (if ATSR uses it)
];

// Build dependency tree starting from entry points
const needed = new Set();
const queue = [...entryPoints];

console.log('🔍 Building dependency tree from entry points:\n');
entryPoints.forEach(fn => console.log(`   - ${fn}`));
console.log('');

while (queue.length > 0) {
  const fnName = queue.shift();
  if (needed.has(fnName)) continue;

  needed.add(fnName);

  // Extract this function's body
  const fnRegex = new RegExp(`function\\s+${fnName}\\s*\\([^)]*\\)\\s*\\{`, 'g');
  const fnMatch = fnRegex.exec(code);

  if (!fnMatch) continue;

  // Find all function calls within this function
  // Look for functionName( or functionName_( patterns
  const bodyStart = fnMatch.index + fnMatch[0].length;
  let braceCount = 1;
  let bodyEnd = bodyStart;

  // Find matching closing brace
  for (let i = bodyStart; i < code.length && braceCount > 0; i++) {
    if (code[i] === '{') braceCount++;
    if (code[i] === '}') braceCount--;
    bodyEnd = i;
  }

  const fnBody = code.substring(bodyStart, bodyEnd);

  // Find function calls in this body
  const callRegex = /(\w+)\s*\(/g;
  let callMatch;
  while ((callMatch = callRegex.exec(fnBody)) !== null) {
    const calledFn = callMatch[1];
    if (allFunctions.has(calledFn) && !needed.has(calledFn)) {
      queue.push(calledFn);
    }
  }
}

console.log(`✅ Dependency analysis complete: ${needed.size} functions needed\n`);

// Functions we know ATSR needs (manual additions for safety)
const manualKeep = [
  'parseATSRResponse_',  // ATSR-specific parser
  'callOpenAI',          // OpenAI API
  'tryParseJSON',        // JSON parsing fallback
  'getOpenAIKey_',       // API key getter
  'getSettings_',        // Settings reader
  'saveSettings_',       // Settings writer
];

manualKeep.forEach(fn => {
  if (allFunctions.has(fn)) {
    needed.add(fn);
  }
});

console.log(`📦 Total functions to keep: ${needed.size}\n`);

// Functions we DEFINITELY want to remove (batch processing)
const definitelyRemove = [
  'processOneInputRow_',
  'validateVitalsFields_',
  'applyClinicalDefaults_',
  'processAllInputRows',
  'showBatchProcessor',
  'showInputConverter',
  'convertInputToMaster',
  'processInputRow',
  'validateInputRow',
  'extractVitalsFromInput',
  'formatVitalsJSON',
];

console.log('🗑️  Functions to remove (batch processing):\n');
definitelyRemove.forEach(fn => {
  if (allFunctions.has(fn) && !needed.has(fn)) {
    console.log(`   ❌ ${fn}`);
  }
});
console.log('');

// Remove functions not in needed set
let trimmedCode = code;
const removed = [];

allFunctions.forEach(fnName => {
  if (!needed.has(fnName)) {
    // Extract and remove this function
    const fnRegex = new RegExp(
      `function\\s+${fnName}\\s*\\([^)]*\\)\\s*\\{[\\s\\S]*?\\n\\}(?=\\n|$)`,
      'g'
    );

    const beforeLength = trimmedCode.length;
    trimmedCode = trimmedCode.replace(fnRegex, '');

    if (trimmedCode.length < beforeLength) {
      removed.push(fnName);
    }
  }
});

console.log(`✂️  Removed ${removed.length} unused functions\n`);

// Clean up extra blank lines
trimmedCode = trimmedCode.replace(/\n\n\n+/g, '\n\n');

// Save trimmed version
fs.writeFileSync(codePath, trimmedCode);

const finalLines = trimmedCode.split('\n').length;
const originalLines = code.split('\n').length;
const reduction = ((1 - finalLines / originalLines) * 100).toFixed(1);

console.log('━'.repeat(60));
console.log('📊 TRIMMING RESULTS:\n');
console.log(`   Original:  ${originalLines} lines`);
console.log(`   Trimmed:   ${finalLines} lines`);
console.log(`   Reduction: ${reduction}% smaller`);
console.log(`   Kept:      ${needed.size} functions`);
console.log(`   Removed:   ${removed.length} functions`);
console.log('━'.repeat(60));
console.log('\n✅ Saved trimmed code to Code_ATSR_Trimmed.gs\n');

console.log('🚀 Next: Deploy and test automatically\n');
