#!/usr/bin/env node

/**
 * CRITICAL FIX: Switch from Modal Dialog to Modeless Dialog
 * Modal dialogs have limited google.script.run support in some environments
 * Modeless dialogs (sidebars) have full support
 */

const fs = require('fs');
const path = require('path');

const phase2Path = path.join(__dirname, '../apps-script-deployable/Categories_Pathways_Feature_Phase2.gs');

console.log('\n🔧 SWITCHING FROM MODAL TO MODELESS DIALOG\n');
console.log('═══════════════════════════════════════════════════════════════\n');

let code = fs.readFileSync(phase2Path, 'utf8');

// Replace showModalDialog with showModelessDialog
const oldShowDialog = `  const htmlOutput = HtmlService.createHtmlOutput(html)
    .setWidth(900)
    .setHeight(500)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  SpreadsheetApp.getUi().showModalDialog(htmlOutput, '💾 Pre-Caching Rich Clinical Data');`;

const newShowDialog = `  const htmlOutput = HtmlService.createHtmlOutput(html)
    .setWidth(450)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  SpreadsheetApp.getUi().showModelessDialog(htmlOutput, '💾 Pre-Caching Rich Clinical Data');`;

if (code.indexOf(oldShowDialog) !== -1) {
  code = code.replace(oldShowDialog, newShowDialog);
  fs.writeFileSync(phase2Path, code, 'utf8');

  console.log('   ✅ Switched to showModelessDialog (sidebar-style)\n');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('✅ DIALOG TYPE CHANGED!\n');
  console.log('📋 What Changed:\n');
  console.log('   • FROM: showModalDialog (blocks spreadsheet, limited API)');
  console.log('   • TO: showModelessDialog (sidebar, full google.script.run support)\n');
  console.log('🎯 Why This Should Work:\n');
  console.log('   • Modeless dialogs have FULL google.script.run access');
  console.log('   • Modal dialogs are sandboxed more aggressively');
  console.log('   • Same UI, just appears as sidebar instead of centered popup\n');
  console.log('🔄 Now deploying to TEST...\n');
  console.log('═══════════════════════════════════════════════════════════════\n');
} else {
  console.log('   ⚠️  Could not find exact modal dialog code\n');
  console.log('   Searching for alternative pattern...\n');

  // Try simpler search
  if (code.indexOf('showModalDialog') !== -1) {
    code = code.replace(/showModalDialog/g, 'showModelessDialog');
    code = code.replace(/\.setHeight\(500\)/, ''); // Remove height for sidebar
    code = code.replace(/\.setWidth\(900\)/, '.setWidth(450)'); // Narrower for sidebar
    fs.writeFileSync(phase2Path, code, 'utf8');
    console.log('   ✅ Replaced via pattern matching\n');
  } else {
    console.log('   ❌ No modal dialog found\n');
  }
}
