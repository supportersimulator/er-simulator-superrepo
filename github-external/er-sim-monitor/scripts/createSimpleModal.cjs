#!/usr/bin/env node

/**
 * CREATE ULTRA-SIMPLE MODAL TEST
 *
 * Replaces the complex modal with the absolute simplest possible version
 * to test if google.script.run communication works AT ALL.
 */

const fs = require('fs');
const path = require('path');

const phase2Path = path.join(__dirname, '../backups/phase2-before-cache-fix-2025-11-06T14-51-17/Categories_Pathways_Feature_Phase2.gs');

console.log('\n🔧 CREATING ULTRA-SIMPLE MODAL\n');

let code = fs.readFileSync(phase2Path, 'utf8');

// Find the preCacheRichData function
const funcStart = code.indexOf('function preCacheRichData() {');
const funcEnd = code.indexOf('\n/**', funcStart + 100); // Find next function

if (funcStart === -1 || funcEnd === -1) {
  console.log('❌ Could not find preCacheRichData() function');
  process.exit(1);
}

// Replace with ultra-simple version
const newFunction = `function preCacheRichData() {
  const html =
    '<!DOCTYPE html>' +
    '<html>' +
    '<head>' +
    '<style>' +
    'body { font-family: monospace; padding: 20px; background: #1a1a1a; color: #00ff00; }' +
    'button { padding: 10px 20px; margin: 10px; font-size: 16px; cursor: pointer; }' +
    '#status { margin: 20px 0; padding: 10px; background: #000; border: 1px solid #00ff00; }' +
    '</style>' +
    '</head>' +
    '<body>' +
    '<h3>🧪 Test Modal</h3>' +
    '<div id="status">Ready to test...</div>' +
    '<button onclick="testHello()">Test Hello</button>' +
    '<button onclick="startCache()">Start Cache</button>' +
    '<script>' +
    'function testHello() {' +
    '  document.getElementById("status").textContent = "Calling testHello()...";' +
    '  google.script.run' +
    '    .withSuccessHandler(function(r) {' +
    '      document.getElementById("status").textContent = "SUCCESS: " + r.message + " at " + r.timestamp;' +
    '    })' +
    '    .withFailureHandler(function(e) {' +
    '      document.getElementById("status").textContent = "FAILED: " + e.message;' +
    '    })' +
    '    .testHello();' +
    '}' +
    'function startCache() {' +
    '  document.getElementById("status").textContent = "Starting cache...";' +
    '  google.script.run' +
    '    .withSuccessHandler(function(r) {' +
    '      if (r.success) {' +
    '        document.getElementById("status").textContent = "CACHE SUCCESS: " + r.casesProcessed + " cases in " + r.elapsed + "s";' +
    '      } else {' +
    '        document.getElementById("status").textContent = "CACHE FAILED: " + r.error;' +
    '      }' +
    '    })' +
    '    .withFailureHandler(function(e) {' +
    '      document.getElementById("status").textContent = "CACHE FAILED: " + e.message;' +
    '    })' +
    '    .performCacheWithProgress();' +
    '}' +
    '</script>' +
    '</body>' +
    '</html>';

  const htmlOutput = HtmlService.createHtmlOutput(html)
    .setWidth(400)
    .setHeight(200);
  SpreadsheetApp.getUi().showModelessDialog(htmlOutput, '🧪 Simple Cache Test');
}
`;

// Replace the function
code = code.slice(0, funcStart) + newFunction + code.slice(funcEnd);

fs.writeFileSync(phase2Path, code, 'utf8');

console.log('✅ Created ultra-simple modal with:');
console.log('   • Minimal HTML (no fancy UI)');
console.log('   • Two simple buttons: Test Hello | Start Cache');
console.log('   • Direct status display (no logs, no animations)');
console.log('   • No setTimeout (test if that was the problem)');
console.log('   • Clear success/failure messages');
console.log('');
console.log('Next: Redeploy to TEST and try buttons');
