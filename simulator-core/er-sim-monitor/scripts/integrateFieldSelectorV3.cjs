#!/usr/bin/env node

/**
 * SURGICAL FIELD SELECTOR INTEGRATION - V3 (Simplest)
 *
 * Dead simple approach:
 * 1. Read Phase2 file line by line
 * 2. Insert field selector code before line 2967
 * 3. Add new preCacheRichData() entry point after field selector code
 * 4. Rename the existing preCacheRichData() to preCacheRichDataAfterSelection()
 */

const fs = require('fs');
const path = require('path');

console.log('\n🔧 SURGICAL FIELD SELECTOR INTEGRATION V3\n');
console.log('═══════════════════════════════════════════════════════════════\n');

// Paths
const phase2Path = path.join(__dirname, '../backups/phase2-before-cache-fix-2025-11-06T14-51-17/Categories_Pathways_Feature_Phase2.gs');
const fieldSelectorPath = path.join(__dirname, '../docs/FIELD_SELECTOR_FUNCTIONS.gs');
const outputPath = path.join(__dirname, '../apps-script-deployable/Categories_Pathways_Feature_Phase2.gs');

// Read files
console.log('📖 Reading files...\n');
const phase2Lines = fs.readFileSync(phase2Path, 'utf8').split('\n');
const fieldSelectorCode = fs.readFileSync(fieldSelectorPath, 'utf8');

console.log(`✅ Read Phase2 file: ${phase2Lines.length} lines`);
console.log(`✅ Read field selector code\n`);

// Step 1: Find preCacheRichData() line
console.log('🔍 Finding preCacheRichData()...\n');
let preCacheLineNum = -1;
for (let i = 0; i < phase2Lines.length; i++) {
  if (phase2Lines[i].trim() === 'function preCacheRichData() {') {
    preCacheLineNum = i;
    break;
  }
}

if (preCacheLineNum === -1) {
  console.error('❌ Could not find preCacheRichData()!');
  process.exit(1);
}

console.log(`✅ Found at line ${preCacheLineNum + 1}\n`);

// Step 2: Build the new file
console.log('🔨 Building integrated file...\n');

const newEntryPoint = `
/**
 * Pre-Cache Rich Data - Entry Point
 * Shows field selector modal FIRST, then starts cache with selected fields
 */
function preCacheRichData() {
  showFieldSelector();
}
`;

const result = [
  // Everything before preCacheRichData
  ...phase2Lines.slice(0, preCacheLineNum),
  // Field selector code
  ...fieldSelectorCode.split('\n'),
  // New entry point
  ...newEntryPoint.split('\n'),
  // Rename old preCacheRichData to preCacheRichDataAfterSelection
  'function preCacheRichDataAfterSelection() {',
  // Rest of the original preCacheRichData function
  ...phase2Lines.slice(preCacheLineNum + 1)
].join('\n');

console.log('✅ Integrated successfully\n');

// Step 3: Verify
console.log('🔍 Verifying...\n');

const checks = {
  'getAvailableFields': result.includes('function getAvailableFields()'),
  'showFieldSelector': result.includes('function showFieldSelector()'),
  'saveFieldSelectionAndStartCache': result.includes('function saveFieldSelectionAndStartCache('),
  'preCacheRichData (new)': result.match(/function preCacheRichData\(\) \{\s+showFieldSelector\(\);/),
  'preCacheRichDataAfterSelection': result.includes('function preCacheRichDataAfterSelection()'),
  'performHolisticAnalysis_': result.includes('function performHolisticAnalysis_()'),
  'resolveColumnIndices_': result.includes('function resolveColumnIndices_(')
};

let allGood = true;
Object.keys(checks).forEach(key => {
  if (checks[key]) {
    console.log(`   ✅ ${key}`);
  } else {
    console.log(`   ❌ MISSING: ${key}`);
    allGood = false;
  }
});
console.log('');

if (!allGood) {
  console.error('❌ Verification failed!');
  process.exit(1);
}

// Step 4: Save
console.log('💾 Saving...\n');
fs.writeFileSync(outputPath, result, 'utf8');

const finalLines = result.split('\n').length;
console.log(`✅ Saved: ${finalLines} lines (${(result.length / 1024).toFixed(1)} KB)\n`);

console.log('═══════════════════════════════════════════════════════════════\n');
console.log('✅ INTEGRATION COMPLETE!\n');
console.log('Summary:');
console.log('  • Field selector functions added');
console.log('  • New preCacheRichData() entry point created');
console.log('  • Original renamed to preCacheRichDataAfterSelection()');
console.log('  • All critical functions verified present\n');
console.log('Next: Deploy to Google Apps Script\n');
console.log('═══════════════════════════════════════════════════════════════\n');
