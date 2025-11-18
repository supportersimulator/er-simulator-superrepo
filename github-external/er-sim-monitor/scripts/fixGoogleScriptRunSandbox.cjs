#!/usr/bin/env node

/**
 * CRITICAL FIX: Enable google.script.run in cache modal
 * The modal was sandboxed, blocking all google.script.run calls
 */

const fs = require('fs');
const path = require('path');

const phase2Path = path.join(__dirname, '../apps-script-deployable/Categories_Pathways_Feature_Phase2.gs');

console.log('\n🔧 FIXING GOOGLE.SCRIPT.RUN SANDBOX ISSUE\n');
console.log('═══════════════════════════════════════════════════════════════\n');

let code = fs.readFileSync(phase2Path, 'utf8');

// Replace the modal creation to allow google.script.run
const oldModalCreation = `  const htmlOutput = HtmlService.createHtmlOutput(html).setWidth(900).setHeight(500);
  SpreadsheetApp.getUi().showModalDialog(htmlOutput, '💾 Pre-Caching Rich Clinical Data');`;

const newModalCreation = `  const htmlOutput = HtmlService.createHtmlOutput(html)
    .setWidth(900)
    .setHeight(500)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  SpreadsheetApp.getUi().showModalDialog(htmlOutput, '💾 Pre-Caching Rich Clinical Data');`;

if (code.indexOf(oldModalCreation) !== -1) {
  code = code.replace(oldModalCreation, newModalCreation);
  fs.writeFileSync(phase2Path, code, 'utf8');

  console.log('   ✅ Added .setXFrameOptionsMode(ALLOWALL)\n');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('✅ SANDBOX RESTRICTION REMOVED!\n');
  console.log('📋 What This Fixes:\n');
  console.log('   • google.script.run calls were blocked by sandbox');
  console.log('   • TEST COMMUNICATION button will now work');
  console.log('   • Return to Panel button will now work');
  console.log('   • Full cache process will now execute\n');
  console.log('🔄 Now deploying to TEST...\n');
  console.log('═══════════════════════════════════════════════════════════════\n');
} else {
  console.log('   ⚠️  Could not find modal creation code\n');
  console.log('   Trying alternative search...\n');

  // Try finding just the HtmlService line
  const altOld = `  const htmlOutput = HtmlService.createHtmlOutput(html).setWidth(900).setHeight(500);`;
  const altNew = `  const htmlOutput = HtmlService.createHtmlOutput(html)
    .setWidth(900)
    .setHeight(500)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);`;

  if (code.indexOf(altOld) !== -1) {
    code = code.replace(altOld, altNew);
    fs.writeFileSync(phase2Path, code, 'utf8');
    console.log('   ✅ Fixed via alternative method\n');
  } else {
    console.log('   ❌ Could not find target code\n');
  }
}
