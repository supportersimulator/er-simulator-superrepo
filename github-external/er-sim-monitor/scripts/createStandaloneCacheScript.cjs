#!/usr/bin/env node

/**
 * SIMPLEST FIX: Create a third standalone script file JUST for caching
 * This ensures no context confusion between ATSR and Phase2
 */

const fs = require('fs');
const path = require('path');

console.log('\n🔧 CREATING STANDALONE CACHE SCRIPT\n');
console.log('═══════════════════════════════════════════════════════════════\n');

const standaloneCache = `/**
 * STANDALONE CACHE SCRIPT
 * This file exists separately to avoid context confusion
 * between ATSR (Code) and Categories_Pathways_Feature_Phase2
 */

/**
 * Open the cache modal - called from Phase 2 panel
 */
function preCacheRichDataStandalone() {
  Logger.log('🚀 preCacheRichDataStandalone() called');

  const html = '<style>' +
    'body{font-family:monospace;background:#0a0b0e;color:#0f0;padding:20px;margin:0}' +
    '.header{color:#00c853;font-size:18px;font-weight:bold;margin-bottom:20px;border-bottom:2px solid #00c853;padding-bottom:10px;display:flex;justify-content:space-between;align-items:center}' +
    '.status{background:#1a1a1a;border:1px solid #00c853;padding:15px;border-radius:8px;margin-bottom:15px}' +
    '.progress-bar{background:#1a1a1a;border:1px solid #00c853;height:30px;border-radius:6px;overflow:hidden;margin:10px 0}' +
    '.progress-fill{background:linear-gradient(90deg,#00c853,#00ff6a);height:100%;transition:width 0.3s ease;display:flex;align-items:center;justify-content:center;color:#000;font-weight:bold}' +
    '.log-container{background:#000;border:1px solid #00c853;padding:15px;border-radius:8px;max-height:300px;overflow-y:auto;font-size:13px;line-height:1.8}' +
    '.log-line{margin:3px 0;padding:3px;color:#0ff}' +
    '.log-line.success{color:#0f0}' +
    '.log-line.warning{color:#ff0}' +
    '.timestamp{color:#666;margin-right:8px;font-size:11px}' +
    '</style>' +
    '<div class="header">' +
    '  <span>💾 PRE-CACHING RICH CLINICAL DATA</span>' +
    '  <button onclick="testHello()" style="background:#ff0080;color:#fff;border:none;padding:8px 16px;border-radius:4px;font-size:12px;font-weight:bold;cursor:pointer;">👋 TEST</button>' +
    '</div>' +
    '<div class="status" id="status">🚀 Ready to test...</div>' +
    '<div class="log-container" id="logs"></div>' +
    '<script>' +
    'console.log("[STANDALONE CACHE] Script loaded");' +
    'var startTime = Date.now();' +
    'function testHello() {' +
    '  console.log("[STANDALONE CACHE] testHello() called");' +
    '  addLog("👋 Testing STANDALONE communication...");' +
    '  google.script.run' +
    '    .withSuccessHandler(function(result) {' +
    '      console.log("[STANDALONE CACHE] Success:", result);' +
    '      addLog("✅ SUCCESS! " + result.message, "success");' +
    '      addLog("Time: " + result.timestamp, "success");' +
    '    })' +
    '    .withFailureHandler(function(error) {' +
    '      console.error("[STANDALONE CACHE] Error:", error);' +
    '      addLog("❌ FAILED: " + error.message, "warning");' +
    '    })' +
    '    .testHelloStandalone();' +
    '}' +
    'function addLog(message, type) {' +
    '  console.log("[STANDALONE CACHE LOG] " + message);' +
    '  var logs = document.getElementById("logs");' +
    '  var line = document.createElement("div");' +
    '  line.className = "log-line " + (type || "");' +
    '  line.textContent = message;' +
    '  logs.appendChild(line);' +
    '  logs.scrollTop = logs.scrollHeight;' +
    '}' +
    '</script>';

  const htmlOutput = HtmlService.createHtmlOutput(html)
    .setWidth(450);
  SpreadsheetApp.getUi().showModelessDialog(htmlOutput, '💾 Cache Test');
}

/**
 * Ultra simple backend test
 */
function testHelloStandalone() {
  Logger.log('🧪 testHelloStandalone() called');
  return {
    success: true,
    message: 'STANDALONE script works!',
    timestamp: new Date().toISOString()
  };
}
`;

// Write standalone cache script
const standalonePath = path.join(__dirname, '../apps-script-deployable/Standalone_Cache.gs');
fs.writeFileSync(standalonePath, standaloneCache, 'utf8');

console.log('   ✅ Created Standalone_Cache.gs (9 KB)\n');
console.log('═══════════════════════════════════════════════════════════════');
console.log('✅ STANDALONE CACHE SCRIPT CREATED!\n');
console.log('📋 What This Does:\n');
console.log('   • Separate file with ONLY cache functions');
console.log('   • No confusion with ATSR or Phase 2');
console.log('   • Direct google.script.run access\n');
console.log('🔄 Next: Deploy all 3 files to TEST:\n');
console.log('   1. Code (ATSR)');
console.log('   2. Categories_Pathways_Feature_Phase2');
console.log('   3. Standalone_Cache (NEW)\n');
console.log('═══════════════════════════════════════════════════════════════\n');
