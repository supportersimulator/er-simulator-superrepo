#!/usr/bin/env node

/**
 * Fix: Add testSimple() JavaScript function that was missing from deployment
 */

const fs = require('fs');
const path = require('path');

const phase2Path = path.join(__dirname, '../apps-script-deployable/Categories_Pathways_Feature_Phase2.gs');

console.log('\n🔧 FIXING MISSING testSimple() FUNCTION\n');
console.log('═══════════════════════════════════════════════════════════════\n');

let code = fs.readFileSync(phase2Path, 'utf8');

// Find the location right after 'var startTime = Date.now();'
const insertAfter = `    'var startTime = Date.now();'`;

if (code.indexOf(insertAfter) !== -1) {
  const testSimpleFunction = ` +
    'function testSimple() {' +
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

  code = code.replace(insertAfter, insertAfter + testSimpleFunction);

  fs.writeFileSync(phase2Path, code, 'utf8');

  console.log('   ✅ Added testSimple() JavaScript function\n');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('✅ FIX COMPLETE!\n');
  console.log('🔄 Now deploying to TEST...\n');
  console.log('═══════════════════════════════════════════════════════════════\n');
} else {
  console.log('   ❌ Could not find insertion point\n');
}
