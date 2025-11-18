#!/usr/bin/env node

/**
 * Add a simple test cache function that returns immediately
 * This will help us test if google.script.run communication works
 */

const fs = require('fs');
const path = require('path');

const phase2Path = path.join(__dirname, '../apps-script-deployable/Categories_Pathways_Feature_Phase2.gs');

console.log('\n🧪 ADDING SIMPLE TEST CACHE FUNCTION\n');
console.log('═══════════════════════════════════════════════════════════════\n');

let code = fs.readFileSync(phase2Path, 'utf8');

// Add a simple test function right after performCacheWithProgress
const testFunction = `

/**
 * SIMPLE TEST: Returns immediately to test if google.script.run works
 */
function testCacheSimple() {
  Logger.log('🧪 testCacheSimple() called');

  try {
    const sheet = pickMasterSheet_();
    const data = sheet.getDataRange().getValues();

    Logger.log('✅ Got data: ' + data.length + ' rows');

    return {
      success: true,
      message: 'Communication works!',
      rowCount: data.length,
      sheetName: sheet.getName()
    };
  } catch (e) {
    Logger.log('❌ Error: ' + e.message);
    return {
      success: false,
      error: e.message
    };
  }
}
`;

// Insert after performCacheWithProgress
const insertAfter = 'function performCacheWithProgress() {';
let insertIndex = code.indexOf(insertAfter);

if (insertIndex !== -1) {
  // Find the end of performCacheWithProgress function
  let braceCount = 0;
  let functionStart = code.indexOf('{', insertIndex);
  let i = functionStart;

  do {
    if (code[i] === '{') braceCount++;
    if (code[i] === '}') braceCount--;
    i++;
  } while (braceCount > 0 && i < code.length);

  code = code.slice(0, i) + testFunction + code.slice(i);
  console.log('   ✅ Added testCacheSimple() function\n');
} else {
  console.log('   ⚠️  Could not find insertion point\n');
}

// Now modify the preCacheRichData HTML to call testCacheSimple instead
console.log('📝 Adding test button to cache UI...\n');

const oldScript = `'    function addLog(message, type) {'`;
const newScript = `'    function testSimple() {' +
    '      addLog("🧪 Testing simple communication...", "info");' +
    '      google.script.run' +
    '        .withSuccessHandler(function(result) {' +
    '          if (result.success) {' +
    '            addLog("✅ SUCCESS! Communication works!", "success");' +
    '            addLog("Sheet: " + result.sheetName, "success");' +
    '            addLog("Rows: " + result.rowCount, "success");' +
    '            addLog("", "info");' +
    '            addLog("💡 Now try the full cache process", "info");' +
    '          } else {' +
    '            addLog("❌ Error: " + result.error, "warning");' +
    '          }' +
    '        })' +
    '        .withFailureHandler(function(error) {' +
    '          addLog("❌ Communication failed: " + error.message, "warning");' +
    '        })' +
    '        .testCacheSimple();' +
    '    }' +
    '    function addLog(message, type) {'`;

code = code.replace(oldScript, newScript);
console.log('   ✅ Added testSimple() JavaScript function to modal\n');

// Add a test button to the HTML
const oldHTML = `'<div class="log-container" id="logs"></div>' +`;
const newHTML = `'<div style="text-align:center;margin:15px 0">' +
    '  <button onclick="testSimple()" style="background:#ff9800;color:#000;border:none;padding:10px 20px;border-radius:6px;font-weight:bold;cursor:pointer;">🧪 TEST COMMUNICATION</button>' +
    '</div>' +
    '<div class="log-container" id="logs"></div>' +`;

code = code.replace(oldHTML, newHTML);
console.log('   ✅ Added TEST COMMUNICATION button to modal\n');

// Write back
fs.writeFileSync(phase2Path, code, 'utf8');

console.log('═══════════════════════════════════════════════════════════════');
console.log('✅ SIMPLE TEST CACHE FUNCTION ADDED!\n');
console.log('📋 How to use:\n');
console.log('   1. Deploy this updated code to TEST');
console.log('   2. Click "Pre-Cache Rich Data" button');
console.log('   3. Click the orange "🧪 TEST COMMUNICATION" button');
console.log('   4. Watch the logs\n');
console.log('🎯 This will tell us if:\n');
console.log('   • google.script.run communication works');
console.log('   • The script can access the spreadsheet data');
console.log('   • The issue is timeout or something else\n');
console.log('═══════════════════════════════════════════════════════════════\n');
