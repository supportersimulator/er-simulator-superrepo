#!/usr/bin/env node

/**
 * SURGICAL FIELD SELECTOR INTEGRATION - V2 (Simplified)
 *
 * Much simpler approach:
 * 1. Read Phase2 file
 * 2. Insert field selector code before line 2967 (the preCacheRichData function)
 * 3. Rename the existing preCacheRichData() to preCacheRichDataAfterSelection()
 * 4. Add new preCacheRichData() entry point after field selector functions
 */

const fs = require('fs');
const path = require('path');

console.log('\n🔧 SURGICAL FIELD SELECTOR INTEGRATION V2\n');
console.log('═══════════════════════════════════════════════════════════════\n');

// Paths
const phase2Path = path.join(__dirname, '../backups/phase2-before-cache-fix-2025-11-06T14-51-17/Categories_Pathways_Feature_Phase2.gs');
const fieldSelectorPath = path.join(__dirname, '../docs/FIELD_SELECTOR_FUNCTIONS.gs');
const outputPath = path.join(__dirname, '../apps-script-deployable/Categories_Pathways_Feature_Phase2.gs');

// Read files
console.log('📖 Reading files...\n');
let phase2Lines = fs.readFileSync(phase2Path, 'utf8').split('\n');
const fieldSelectorCode = fs.readFileSync(fieldSelectorPath, 'utf8');

console.log(`✅ Read Phase2 file: ${phase2Lines.length} lines`);
console.log(`✅ Read field selector functions: ${fieldSelectorCode.split('\n').length} lines\n`);

// Step 1: Find line 2967 (preCacheRichData function)
console.log('🔍 Finding preCacheRichData() function...\n');
let preCacheLineNum = -1;
for (let i = 0; i < phase2Lines.length; i++) {
  if (phase2Lines[i].trim() === 'function preCacheRichData() {') {
    preCacheLineNum = i;
    break;
  }
}

if (preCacheLineNum === -1) {
  console.error('❌ ERROR: Could not find preCacheRichData() function!');
  process.exit(1);
}

console.log(`✅ Found preCacheRichData() at line ${preCacheLineNum + 1}\n`);

// Step 2: Insert field selector code BEFORE preCacheRichData
console.log('➕ Inserting field selector functions...\n');
const beforeLines = phase2Lines.slice(0, preCacheLineNum);
const afterLines = phase2Lines.slice(preCacheLineNum);

// Combine: before + field selector + after
const phase2WithFieldSelector = [
  ...beforeLines,
  ...fieldSelectorCode.split('\n'),
  '', // blank line for separation
  ...afterLines
].join('\n');

console.log('✅ Inserted field selector code\n');

// Step 3: Rename preCacheRichData() → preCacheRichDataAfterSelection()
// This renames the ORIGINAL function (now after the field selector code)
console.log('✏️  Renaming original preCacheRichData() → preCacheRichDataAfterSelection()...\n');

// Find the LAST occurrence of "function preCacheRichData()" (the original one)
const lines = phase2WithFieldSelector.split('\n');
let lastPreCacheIndex = -1;
for (let i = lines.length - 1; i >= 0; i--) {
  if (lines[i].trim() === 'function preCacheRichData() {') {
    lastPreCacheIndex = i;
    break;
  }
}

if (lastPreCacheIndex === -1) {
  console.error('❌ ERROR: Could not find preCacheRichData() to rename!');
  process.exit(1);
}

lines[lastPreCacheIndex] = 'function preCacheRichDataAfterSelection() {';
const renamedCode = lines.join('\n');

console.log(`✅ Renamed function at line ${lastPreCacheIndex + 1}\n`);

// Step 4: Add new preCacheRichData() entry point
// Insert it right after saveFieldSelectionAndStartCache() function
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

// Find the line with saveFieldSelectionAndStartCache closing brace
const finalLines = renamedCode.split('\n');
let insertPoint = -1;
for (let i = 0; i < finalLines.length; i++) {
  if (finalLines[i].includes('preCacheRichDataAfterSelection();') &&
      finalLines[i - 1].includes('start the cache process')) {
    // Found the line calling preCacheRichDataAfterSelection, insert after it
    insertPoint = i + 2; // After closing brace of saveFieldSelectionAndStartCache
    break;
  }
}

if (insertPoint === -1) {
  console.error('❌ ERROR: Could not find insertion point for new entry point!');
  process.exit(1);
}

finalLines.splice(insertPoint, 0, newEntryPoint);
const finalCode = finalLines.join('\n');

console.log(`✅ Added new entry point at line ${insertPoint + 1}\n`);

// Step 5: Verify
console.log('🔍 Verifying integration...\n');

const originalCount = phase2Lines.length;
const newCount = finalCode.split('\n').length;
const fieldSelectorLines = fieldSelectorCode.split('\n').length;
const newEntryLines = newEntryPoint.split('\n').length;

console.log(`📊 Original lines: ${originalCount}`);
console.log(`📊 Field selector lines added: ${fieldSelectorLines}`);
console.log(`📊 New entry point lines added: ${newEntryLines}`);
console.log(`📊 Final lines: ${newCount}`);
console.log(`📊 Expected: ${originalCount + fieldSelectorLines + newEntryLines}`);
console.log('');

// Check for key functions
const functionsToCheck = [
  'getAvailableFields',
  'generateFieldName_',
  'getDefaultFieldNames_',
  'loadFieldSelection',
  'showFieldSelector',
  'saveFieldSelectionAndStartCache',
  'preCacheRichData',
  'preCacheRichDataAfterSelection'
];

let allFound = true;
console.log('🔍 Checking for all required functions:\n');
functionsToCheck.forEach(fn => {
  const regex = new RegExp(`function ${fn}\\(`);
  if (finalCode.match(regex)) {
    console.log(`   ✅ ${fn}()`);
  } else {
    console.log(`   ❌ MISSING: ${fn}()`);
    allFound = false;
  }
});
console.log('');

if (!allFound) {
  console.error('❌ ERROR: Some functions are missing!');
  process.exit(1);
}

// Save
console.log('💾 Saving integrated file...\n');
fs.writeFileSync(outputPath, finalCode, 'utf8');
console.log(`✅ Saved to: ${outputPath}`);
console.log(`📏 Final size: ${(finalCode.length / 1024).toFixed(1)} KB\n`);

console.log('═══════════════════════════════════════════════════════════════\n');
console.log('✅ INTEGRATION COMPLETE\n');
console.log('Summary:');
console.log('  • Field selector functions inserted before preCacheRichData()');
console.log('  • Original preCacheRichData() renamed → preCacheRichDataAfterSelection()');
console.log('  • New preCacheRichData() entry point added');
console.log('  • All functions verified present\n');
console.log('Next step: Deploy to Google Apps Script via clasp\n');
console.log('═══════════════════════════════════════════════════════════════\n');
