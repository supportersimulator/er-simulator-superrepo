#!/usr/bin/env node

/**
 * FIX MODAL TIMING ISSUE
 *
 * The modal tries to call performCacheWithProgress() immediately when the script loads,
 * but google.script.run might not be ready yet. We need to wrap it in setTimeout.
 */

const fs = require('fs');
const path = require('path');

const phase2Path = path.join(__dirname, '../backups/phase2-before-cache-fix-2025-11-06T14-51-17/Categories_Pathways_Feature_Phase2.gs');

console.log('\n🔧 FIXING MODAL TIMING ISSUE\n');

let code = fs.readFileSync(phase2Path, 'utf8');

// Find the problematic section
const oldPattern = `'addLog("🔧 Starting holistic analysis engine...", "");' +
    'updateStatus("⏳ Processing all cases with full clinical context...");' +
    'google.script.run'`;

const newPattern = `'addLog("🔧 Starting holistic analysis engine...", "");' +
    'updateStatus("⏳ Processing all cases with full clinical context...");' +
    'setTimeout(function() {' +
    '  google.script.run'`;

if (!code.includes(oldPattern)) {
  console.log('❌ Could not find the exact pattern to fix');
  console.log('   The code might have already been fixed or changed.');
  process.exit(1);
}

// Replace the pattern
code = code.replace(oldPattern, newPattern);

// Now we need to close the setTimeout after .performCacheWithProgress();
const oldEnd = `'  .performCacheWithProgress();' +
    '</script>';`;

const newEnd = `'  .performCacheWithProgress();' +
    '}, 500);' +
    '</script>';`;

if (!code.includes(oldEnd)) {
  console.log('❌ Could not find the end pattern to fix');
  process.exit(1);
}

code = code.replace(oldEnd, newEnd);

fs.writeFileSync(phase2Path, code, 'utf8');

console.log('✅ Fixed modal timing issue:');
console.log('   • Wrapped google.script.run call in setTimeout(fn, 500ms)');
console.log('   • This gives google.script.run time to initialize');
console.log('');
console.log('Next: Redeploy to TEST');
