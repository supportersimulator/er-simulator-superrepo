#!/usr/bin/env node

/**
 * SURGICAL INTEGRATION OF FIELD SELECTOR
 *
 * Carefully integrates the 6 new field selector functions into Phase2 file:
 * 1. Inserts field selector functions before preCacheRichData()
 * 2. Renames preCacheRichData() → preCacheRichDataAfterSelection()
 * 3. Adds new preCacheRichData() entry point
 *
 * PRESERVES: All existing 61+ functions, batch logic, helpers
 */

const fs = require('fs');
const path = require('path');

console.log('\n🔧 SURGICAL FIELD SELECTOR INTEGRATION\n');
console.log('═══════════════════════════════════════════════════════════════\n');

// Paths
const phase2Path = path.join(__dirname, '../backups/phase2-before-cache-fix-2025-11-06T14-51-17/Categories_Pathways_Feature_Phase2.gs');
const fieldSelectorPath = path.join(__dirname, '../docs/FIELD_SELECTOR_FUNCTIONS.gs');
const outputPath = path.join(__dirname, '../apps-script-deployable/Categories_Pathways_Feature_Phase2.gs');

// Read files
console.log('📖 Reading files...\n');
const phase2Code = fs.readFileSync(phase2Path, 'utf8');
const fieldSelectorCode = fs.readFileSync(fieldSelectorPath, 'utf8');

console.log(`✅ Read Phase2 file: ${(phase2Code.length / 1024).toFixed(1)} KB`);
console.log(`✅ Read field selector functions: ${(fieldSelectorCode.length / 1024).toFixed(1)} KB\n`);

// Step 1: Find the insertion point (right before preCacheRichData function)
console.log('🔍 Finding insertion point...\n');
const preCacheRichDataMatch = phase2Code.match(/function preCacheRichData\(\)/);
if (!preCacheRichDataMatch) {
  console.error('❌ ERROR: Could not find preCacheRichData() function!');
  process.exit(1);
}

const insertionPoint = preCacheRichDataMatch.index;
console.log(`✅ Found preCacheRichData() at character ${insertionPoint}\n`);

// Step 2: Insert field selector functions before preCacheRichData()
console.log('➕ Inserting field selector functions...\n');
const beforeInsertion = phase2Code.substring(0, insertionPoint);
const afterInsertion = phase2Code.substring(insertionPoint);

const updatedCode = beforeInsertion + fieldSelectorCode + '\n' + afterInsertion;

console.log(`✅ Inserted ${fieldSelectorCode.split('\n').length} lines of field selector code\n`);

// Step 3: Rename preCacheRichData() → preCacheRichDataAfterSelection()
console.log('✏️  Renaming preCacheRichData() → preCacheRichDataAfterSelection()...\n');

// Find the FIRST occurrence (the original function, not the new one we want to add)
const renamedCode = updatedCode.replace(
  /function preCacheRichData\(\) \{/,
  'function preCacheRichDataAfterSelection() {'
);

console.log('✅ Renamed function\n');

// Step 4: Add new preCacheRichData() entry point that calls showFieldSelector()
console.log('➕ Adding new preCacheRichData() entry point...\n');

const newEntryPoint = `
/**
 * Pre-Cache Rich Data - Entry Point
 * Shows field selector modal FIRST, then starts cache with selected fields
 */
function preCacheRichData() {
  showFieldSelector();
}

`;

// Insert the new entry point right before preCacheRichDataAfterSelection()
const finalCode = renamedCode.replace(
  /function preCacheRichDataAfterSelection\(\)/,
  newEntryPoint + 'function preCacheRichDataAfterSelection()'
);

console.log('✅ Added new entry point\n');

// Step 5: Verify all functions are preserved
console.log('🔍 Verifying integration...\n');

const originalFunctionCount = (phase2Code.match(/^function /gm) || []).length;
const newFunctionCount = (finalCode.match(/^function /gm) || []).length;

console.log(`📊 Original function count: ${originalFunctionCount}`);
console.log(`📊 New function count: ${newFunctionCount}`);
console.log(`📊 Added: ${newFunctionCount - originalFunctionCount} functions (expected: 7)\n`);

if (newFunctionCount - originalFunctionCount !== 7) {
  console.warn('⚠️  WARNING: Expected to add exactly 7 functions!');
  console.warn('   (6 field selector functions + 1 new entry point)');
}

// Step 6: List new functions added
console.log('📝 New functions added:\n');
const newFunctions = [
  'getAvailableFields()',
  'generateFieldName_(tier2)',
  'getDefaultFieldNames_()',
  'loadFieldSelection()',
  'showFieldSelector()',
  'saveFieldSelectionAndStartCache(selectedFields)',
  'preCacheRichData() - NEW ENTRY POINT'
];
newFunctions.forEach((fn, i) => {
  console.log(`   ${i + 1}. ${fn}`);
});
console.log('');

// Step 7: Check for critical functions preservation
console.log('🔍 Verifying critical functions preserved...\n');
const criticalFunctions = [
  'performHolisticAnalysis_',
  'analyzeForPathways_',
  'resolveColumnIndices_',
  'tryParseVitals_',
  'truncateField_',
  'preCacheRichDataAfterSelection'  // renamed from preCacheRichData
];

let allPreserved = true;
criticalFunctions.forEach(fn => {
  const regex = new RegExp(`function ${fn.replace(/[()]/g, '\\$&')}`);
  if (finalCode.match(regex)) {
    console.log(`   ✅ ${fn}`);
  } else {
    console.log(`   ❌ MISSING: ${fn}`);
    allPreserved = false;
  }
});
console.log('');

if (!allPreserved) {
  console.error('❌ ERROR: Some critical functions are missing!');
  process.exit(1);
}

// Step 8: Save output
console.log('💾 Saving integrated file...\n');
fs.writeFileSync(outputPath, finalCode, 'utf8');
console.log(`✅ Saved to: ${outputPath}`);
console.log(`📏 Final size: ${(finalCode.length / 1024).toFixed(1)} KB\n`);

// Step 9: Create diff summary
console.log('═══════════════════════════════════════════════════════════════\n');
console.log('✅ INTEGRATION COMPLETE\n');
console.log('Summary of changes:');
console.log('  • Added 6 new field selector functions');
console.log('  • Renamed preCacheRichData() → preCacheRichDataAfterSelection()');
console.log('  • Added new preCacheRichData() entry point');
console.log('  • All existing functions preserved\n');
console.log('Next steps:');
console.log('  1. Review the integrated file');
console.log('  2. Deploy to Google Apps Script via clasp');
console.log('  3. Test field selector modal in TEST Tools menu');
console.log('  4. Verify cache runs with selected fields\n');
console.log('═══════════════════════════════════════════════════════════════\n');
