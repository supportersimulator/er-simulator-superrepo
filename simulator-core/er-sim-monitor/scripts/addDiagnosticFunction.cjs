#!/usr/bin/env node

/**
 * Add a simple diagnostic function to test if the cache process can access data
 * This will help identify if the issue is timeout, data access, or something else
 */

const fs = require('fs');
const path = require('path');

const phase2Path = path.join(__dirname, '../apps-script-deployable/Categories_Pathways_Feature_Phase2.gs');

console.log('\n🔍 ADDING DIAGNOSTIC FUNCTION\n');
console.log('═══════════════════════════════════════════════════════════════\n');

let code = fs.readFileSync(phase2Path, 'utf8');

// Add a simple diagnostic function right before preCacheRichData
const diagnosticFunction = `
/**
 * DIAGNOSTIC: Test if we can access the data quickly
 * This runs BEFORE the full cache process to verify basic functionality
 */
function testCacheAccess() {
  try {
    Logger.log('🔍 DIAGNOSTIC TEST STARTED');

    const sheet = pickMasterSheet_();
    Logger.log('✅ Got sheet: ' + sheet.getName());

    const data = sheet.getDataRange().getValues();
    Logger.log('✅ Got data: ' + data.length + ' total rows');

    if (data.length < 3) {
      return {
        success: false,
        error: 'Sheet has less than 3 rows (need header rows + data)'
      };
    }

    const headers = data[1];
    Logger.log('✅ Got headers: ' + headers.length + ' columns');
    Logger.log('   First few headers: ' + headers.slice(0, 5).join(', '));

    // Test if we can find Case_Organization_Case_ID
    const caseIdIdx = headers.indexOf('Case_Organization_Case_ID');
    Logger.log('   Case_Organization_Case_ID index: ' + caseIdIdx);

    // Count actual data rows (skip row 1 = tier1, row 2 = merged headers)
    const dataRowCount = data.length - 2;
    Logger.log('✅ Data rows: ' + dataRowCount);

    // Sample first data row
    if (dataRowCount > 0) {
      const firstRow = data[2];
      Logger.log('✅ First data row sample:');
      Logger.log('   Case ID: ' + (firstRow[caseIdIdx] || 'NOT FOUND'));
      Logger.log('   Spark Title: ' + (firstRow[1] || 'NOT FOUND'));
    }

    Logger.log('🎉 DIAGNOSTIC TEST PASSED - Data is accessible!');

    return {
      success: true,
      sheetName: sheet.getName(),
      totalRows: data.length,
      headerCount: headers.length,
      dataRowCount: dataRowCount,
      caseIdIndex: caseIdIdx
    };

  } catch (e) {
    Logger.log('❌ DIAGNOSTIC TEST FAILED: ' + e.message);
    Logger.log('Stack: ' + e.stack);
    return {
      success: false,
      error: e.message,
      stack: e.stack
    };
  }
}

`;

// Insert diagnostic function before preCacheRichData
const insertBefore = 'function preCacheRichData() {';
const insertIndex = code.indexOf(insertBefore);

if (insertIndex !== -1) {
  code = code.slice(0, insertIndex) + diagnosticFunction + code.slice(insertIndex);
  console.log('   ✅ Added testCacheAccess() diagnostic function\n');
} else {
  console.log('   ⚠️  Could not find insertion point\n');
}

// Write back
fs.writeFileSync(phase2Path, code, 'utf8');

console.log('═══════════════════════════════════════════════════════════════');
console.log('✅ DIAGNOSTIC FUNCTION ADDED!\n');
console.log('📋 How to use:\n');
console.log('   1. Deploy this updated code to TEST');
console.log('   2. In Apps Script editor, run: testCacheAccess()');
console.log('   3. Check execution logs to see detailed diagnostic output\n');
console.log('🎯 This will help us identify:\n');
console.log('   • Can the script access the sheet?');
console.log('   • How many rows does it see?');
console.log('   • Are the headers correct?');
console.log('   • Can it find the Case_Organization_Case_ID column?');
console.log('   • Is the first data row accessible?\n');
console.log('═══════════════════════════════════════════════════════════════\n');
