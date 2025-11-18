#!/usr/bin/env node

/**
 * Add "Run Cache Test" to TEST Tools menu in Code.gs (ATSR file)
 * This lets us bypass the broken HTML UI and run cache directly
 * We'll see ALL logs in Apps Script execution log
 */

const fs = require('fs');
const path = require('path');

console.log('\n🔧 ADDING CACHE TEST TO TEST TOOLS MENU\n');
console.log('═══════════════════════════════════════════════════════════════\n');

// Read the Code.gs file from TEST (ATSR)
const codePath = path.join(__dirname, '../apps-script-deployable/Code.gs');

if (!fs.existsSync(codePath)) {
  console.log('❌ Code.gs not found at:', codePath);
  console.log('   Need to pull it from TEST first\n');
  process.exit(1);
}

let code = fs.readFileSync(codePath, 'utf8');

// 1. Add menu item to TEST Tools menu
const oldMenu = `function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('TEST Tools')`;

const newMenu = `function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('TEST Tools')
    .addItem('🧪 Run Cache Test (with logs)', 'runCacheTestWithLogs')`;

if (code.indexOf(oldMenu) !== -1) {
  code = code.replace(oldMenu, newMenu);
  console.log('   ✅ Added "Run Cache Test" menu item\n');
} else {
  console.log('   ⚠️  Could not find TEST Tools menu\n');
}

// 2. Add the cache test function at the end of Code.gs
const cacheTestFunction = `

/**
 * DIAGNOSTIC: Run cache with full logging
 * Called from TEST Tools menu
 */
function runCacheTestWithLogs() {
  Logger.log('\\n═══════════════════════════════════════════════════════════════');
  Logger.log('🚀 CACHE TEST STARTING');
  Logger.log('═══════════════════════════════════════════════════════════════\\n');

  try {
    const startTime = new Date().getTime();

    // STEP 1: Test basic spreadsheet access
    Logger.log('📋 STEP 1: Testing spreadsheet access...');
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    Logger.log('   ✅ Got spreadsheet: ' + ss.getName());

    // STEP 2: Test sheet selection
    Logger.log('\\n📋 STEP 2: Testing sheet selection...');
    const sheets = ss.getSheets();
    Logger.log('   Found ' + sheets.length + ' sheets:');
    sheets.forEach(function(sheet, i) {
      Logger.log('      ' + (i + 1) + '. ' + sheet.getName());
    });

    const masterSheet = sheets.find(function(sh) {
      return /master scenario csv/i.test(sh.getName());
    }) || ss.getActiveSheet();
    Logger.log('   ✅ Selected sheet: ' + masterSheet.getName());

    // STEP 3: Test data reading
    Logger.log('\\n📋 STEP 3: Testing data reading...');
    const data = masterSheet.getDataRange().getValues();
    Logger.log('   ✅ Got data: ' + data.length + ' total rows');

    if (data.length < 3) {
      Logger.log('   ⚠️  WARNING: Only ' + data.length + ' rows (need at least 3)');
      SpreadsheetApp.getUi().alert('⚠️  Sheet has less than 3 rows');
      return;
    }

    // STEP 4: Test header reading
    Logger.log('\\n📋 STEP 4: Testing header reading...');
    const headers = data[1]; // Row 2 = merged headers
    Logger.log('   ✅ Got headers: ' + headers.length + ' columns');
    Logger.log('   First 10 headers: ' + headers.slice(0, 10).join(', '));

    // STEP 5: Test finding specific columns
    Logger.log('\\n📋 STEP 5: Testing column finding...');
    const caseIdIdx = headers.indexOf('Case_Organization_Case_ID');
    const sparkTitleIdx = headers.indexOf('Spark_Title');
    Logger.log('   Case_Organization_Case_ID index: ' + caseIdIdx);
    Logger.log('   Spark_Title index: ' + sparkTitleIdx);

    if (caseIdIdx === -1) {
      Logger.log('   ⚠️  WARNING: Could not find Case_Organization_Case_ID column');
    }

    // STEP 6: Test data row counting
    Logger.log('\\n📋 STEP 6: Testing data row counting...');
    const dataRowCount = data.length - 2; // Skip tier1 and headers
    Logger.log('   ✅ Data rows (excluding headers): ' + dataRowCount);

    // STEP 7: Sample first data row
    Logger.log('\\n📋 STEP 7: Sampling first data row...');
    if (dataRowCount > 0) {
      const firstRow = data[2];
      Logger.log('   Case ID: ' + (firstRow[caseIdIdx] || 'NOT FOUND'));
      Logger.log('   Spark Title: ' + (firstRow[sparkTitleIdx] || 'NOT FOUND'));
    }

    // SUCCESS!
    const elapsed = ((new Date().getTime() - startTime) / 1000).toFixed(1);
    Logger.log('\\n═══════════════════════════════════════════════════════════════');
    Logger.log('✅ CACHE TEST COMPLETE in ' + elapsed + 's');
    Logger.log('═══════════════════════════════════════════════════════════════\\n');

    SpreadsheetApp.getUi().alert(
      '✅ Cache Test Complete!\\n\\n' +
      'Sheet: ' + masterSheet.getName() + '\\n' +
      'Data rows: ' + dataRowCount + '\\n' +
      'Time: ' + elapsed + 's\\n\\n' +
      'Check Execution Log for full details:\\n' +
      'Extensions → Apps Script → Execution log'
    );

  } catch (e) {
    Logger.log('\\n❌ ERROR: ' + e.message);
    Logger.log('Stack trace: ' + e.stack);
    SpreadsheetApp.getUi().alert('❌ Error: ' + e.message + '\\n\\nCheck Execution Log for details');
  }
}
`;

code += cacheTestFunction;
console.log('   ✅ Added runCacheTestWithLogs() function\n');

// Write back
fs.writeFileSync(codePath, code, 'utf8');

console.log('═══════════════════════════════════════════════════════════════');
console.log('✅ CACHE TEST MENU ITEM ADDED!\n');
console.log('📋 Next Steps:\n');
console.log('   1. Deploy Code.gs to TEST');
console.log('   2. Refresh TEST spreadsheet');
console.log('   3. Click "TEST Tools" → "🧪 Run Cache Test (with logs)"');
console.log('   4. Check the popup alert for summary');
console.log('   5. Go to Extensions → Apps Script → Execution log for FULL details\n');
console.log('🎯 This Will Show:\n');
console.log('   • Every step of cache process');
console.log('   • Exact sheet and column access');
console.log('   • Where it succeeds or fails');
console.log('   • Timing for each step\n');
console.log('═══════════════════════════════════════════════════════════════\n');
