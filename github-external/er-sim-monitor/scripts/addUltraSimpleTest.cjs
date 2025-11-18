#!/usr/bin/env node

/**
 * Add an ULTRA SIMPLE test that just returns "Hello" - no spreadsheet access at all
 * This will tell us if google.script.run works AT ALL
 */

const fs = require('fs');
const path = require('path');

const phase2Path = path.join(__dirname, '../apps-script-deployable/Categories_Pathways_Feature_Phase2.gs');

console.log('\n🧪 ADDING ULTRA SIMPLE TEST (NO SPREADSHEET ACCESS)\n');
console.log('═══════════════════════════════════════════════════════════════\n');

let code = fs.readFileSync(phase2Path, 'utf8');

// Add ultra simple function right after testCacheSimple
const insertAfter = `function testCacheSimple() {
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
}`;

const ultraSimpleFunction = `

/**
 * ULTRA SIMPLE TEST: Returns immediately, no spreadsheet access
 */
function testHello() {
  Logger.log('🧪 testHello() called');
  return {
    success: true,
    message: 'Hello from Apps Script!',
    timestamp: new Date().toISOString()
  };
}`;

code = code.replace(insertAfter, insertAfter + ultraSimpleFunction);
console.log('   ✅ Added testHello() backend function\n');

// Add ultra simple button and JavaScript function
const oldTestButton = `    '<div style="text-align:center;margin:15px 0">' +
    '  <button onclick="testSimple()" style="background:#ff9800;color:#000;border:none;padding:10px 20px;border-radius:6px;font-weight:bold;cursor:pointer;">🧪 TEST COMMUNICATION</button>' +
    '</div>'`;

const newTestButtons = `    '<div style="text-align:center;margin:15px 0;display:flex;gap:10px;justify-content:center">' +
    '  <button onclick="testHello()" style="background:#ff0080;color:#fff;border:none;padding:10px 20px;border-radius:6px;font-weight:bold;cursor:pointer;">👋 TEST HELLO</button>' +
    '  <button onclick="testSimple()" style="background:#ff9800;color:#000;border:none;padding:10px 20px;border-radius:6px;font-weight:bold;cursor:pointer;">🧪 TEST COMMUNICATION</button>' +
    '</div>'`;

code = code.replace(oldTestButton, newTestButtons);
console.log('   ✅ Added TEST HELLO button (pink)\n');

// Add testHello JavaScript function after testSimple
const insertAfterJS = `    'function testSimple() {' +
    '  addLog("🧪 Testing simple communication...", "info");' +
    '  google.script.run' +
    '    .withSuccessHandler(function(result) {' +
    '      if (result.success) {' +
    '        addLog("✅ SUCCESS! Communication works!", "success");' +
    '        addLog("Sheet: " + result.sheetName, "success");' +
    '        addLog("Rows: " + result.rowCount, "success");' +
    '        addLog("", "info");' +
    '        addLog("💡 Now try the full cache process", "info");' +
    '      } else {' +
    '        addLog("❌ Error: " + result.error, "warning");' +
    '      }' +
    '    })' +
    '    .withFailureHandler(function(error) {' +
    '      addLog("❌ Communication failed: " + error.message, "warning");' +
    '    })' +
    '    .testCacheSimple();' +
    '}'`;

const testHelloJS = ` +
    'function testHello() {' +
    '  addLog("👋 Testing ULTRA SIMPLE hello...", "info");' +
    '  try {' +
    '    google.script.run' +
    '      .withSuccessHandler(function(result) {' +
    '        addLog("✅ SUCCESS! Backend responded!", "success");' +
    '        addLog("Message: " + result.message, "success");' +
    '        addLog("Time: " + result.timestamp, "success");' +
    '      })' +
    '      .withFailureHandler(function(error) {' +
    '        addLog("❌ FAILED: " + error.message, "warning");' +
    '      })' +
    '      .testHello();' +
    '  } catch (e) {' +
    '    addLog("❌ JavaScript error: " + e.message, "warning");' +
    '  }' +
    '}'`;

code = code.replace(insertAfterJS, insertAfterJS + testHelloJS);
console.log('   ✅ Added testHello() JavaScript function\n');

// Also add browser console logging
const oldAddLog = `    'function addLog(message, type) {' +
    '  var logs = document.getElementById("logs");' +
    '  var elapsed = Math.floor((Date.now() - startTime) / 1000);' +
    '  var mins = Math.floor(elapsed / 60);' +
    '  var secs = elapsed % 60;' +
    '  var timestamp = mins.toString().padStart(2, "0") + ":" + secs.toString().padStart(2, "0");' +
    '  var line = document.createElement("div");' +
    '  line.className = "log-line " + (type || "");' +
    '  line.innerHTML = "<span class=\\"timestamp\\">[" + timestamp + "]</span>" + message;' +
    '  logs.appendChild(line);' +
    '  logs.scrollTop = logs.scrollHeight;' +
    '}'`;

const newAddLog = `    'function addLog(message, type) {' +
    '  console.log("[CACHE MODAL] " + message);' +
    '  var logs = document.getElementById("logs");' +
    '  var elapsed = Math.floor((Date.now() - startTime) / 1000);' +
    '  var mins = Math.floor(elapsed / 60);' +
    '  var secs = elapsed % 60;' +
    '  var timestamp = mins.toString().padStart(2, "0") + ":" + secs.toString().padStart(2, "0");' +
    '  var line = document.createElement("div");' +
    '  line.className = "log-line " + (type || "");' +
    '  line.innerHTML = "<span class=\\"timestamp\\">[" + timestamp + "]</span>" + message;' +
    '  logs.appendChild(line);' +
    '  logs.scrollTop = logs.scrollHeight;' +
    '}'`;

code = code.replace(oldAddLog, newAddLog);
console.log('   ✅ Added browser console.log() to all messages\n');

fs.writeFileSync(phase2Path, code, 'utf8');

console.log('═══════════════════════════════════════════════════════════════');
console.log('✅ ULTRA SIMPLE TEST ADDED!\n');
console.log('📋 How to test:\n');
console.log('   1. Deploy to TEST');
console.log('   2. Open cache modal');
console.log('   3. Open browser console (F12)');
console.log('   4. Click pink "👋 TEST HELLO" button');
console.log('   5. Watch BOTH the modal logs AND browser console\n');
console.log('🎯 This will tell us:\n');
console.log('   • If JavaScript is executing (console.log will show)');
console.log('   • If google.script.run works at all (no spreadsheet access)');
console.log('   • Exact error messages if it fails\n');
console.log('═══════════════════════════════════════════════════════════════\n');
