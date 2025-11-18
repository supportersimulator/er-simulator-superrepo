#!/usr/bin/env node

/**
 * ADD RESET BUTTON TO FIELD SELECTOR
 *
 * Surgically adds "Reset to Default 27" button to field selector modal
 * WITHOUT modifying any other functionality
 */

const fs = require('fs');
const path = require('path');

console.log('\n🔧 ADDING RESET BUTTON TO FIELD SELECTOR\n');
console.log('═══════════════════════════════════════════════════════════════\n');

const integratedPath = path.join(__dirname, '../apps-script-deployable/Categories_Pathways_Feature_Phase2.gs');
const backupPath = path.join(__dirname, '../backups/phase2-before-reset-button-' + new Date().toISOString().slice(0,19).replace(/:/g, '-') + '.gs');

// Read integrated file
const content = fs.readFileSync(integratedPath, 'utf8');
const lines = content.split('\n');

console.log(`📖 Read integrated file: ${lines.length} lines\n`);

// Create backup
fs.writeFileSync(backupPath, content, 'utf8');
console.log(`✅ Backup created: ${path.basename(backupPath)}\n`);

// Find the location to add Reset button styles (after btn-continue:disabled)
let btnDisabledLineIndex = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes(".btn-continue:disabled") && lines[i].includes("opacity: 0.5")) {
    btnDisabledLineIndex = i;
    break;
  }
}

if (btnDisabledLineIndex === -1) {
  console.error('❌ Could not find btn-continue:disabled style!');
  process.exit(1);
}

console.log(`✅ Found btn-continue:disabled at line ${btnDisabledLineIndex + 1}\n`);

// Add Reset button styles after btn-continue:disabled
const resetButtonStyles = [
  "    '.btn-reset { background: white; color: #667eea; border: 2px solid #667eea; padding: 10px 20px; border-radius: 6px; font-size: 14px; font-weight: bold; cursor: pointer; transition: all 0.2s; margin-right: 10px; }' +",
  "    '.btn-reset:hover { background: #f0f0ff; transform: translateY(-1px); }' +"
];

lines.splice(btnDisabledLineIndex + 1, 0, ...resetButtonStyles);

console.log('✅ Added Reset button CSS styles\n');

// Find the footer div to add Reset button
let footerLineIndex = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('<div class="footer">')) {
    footerLineIndex = i;
    break;
  }
}

if (footerLineIndex === -1) {
  console.error('❌ Could not find footer div!');
  process.exit(1);
}

console.log(`✅ Found footer div at line ${footerLineIndex + 1}\n`);

// Find the line with the Continue button
let continueButtonLineIndex = -1;
for (let i = footerLineIndex; i < Math.min(footerLineIndex + 10, lines.length); i++) {
  if (lines[i].includes('btn-continue') && lines[i].includes('onclick="continueToCache()"')) {
    continueButtonLineIndex = i;
    break;
  }
}

if (continueButtonLineIndex === -1) {
  console.error('❌ Could not find Continue button!');
  process.exit(1);
}

console.log(`✅ Found Continue button at line ${continueButtonLineIndex + 1}\n`);

// Replace the button line to include both buttons
const oldButtonLine = lines[continueButtonLineIndex];
const newButtonsLine = oldButtonLine.replace(
  '  <button class="btn-continue" onclick="continueToCache()">Continue to Cache →</button>',
  '  <div style="display: flex; gap: 10px;">' +
  '<button class="btn-reset" onclick="resetToDefault27()">🔄 Reset to Default 27</button>' +
  '<button class="btn-continue" onclick="continueToCache()">Continue to Cache →</button>' +
  '</div>'
);

lines[continueButtonLineIndex] = newButtonsLine;

console.log('✅ Added Reset button to footer\n');

// Find the location to add resetToDefault27() function (before continueToCache function)
let continueToCacheFnIndex = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('function continueToCache()')) {
    continueToCacheFnIndex = i;
    break;
  }
}

if (continueToCacheFnIndex === -1) {
  console.error('❌ Could not find continueToCache() function!');
  process.exit(1);
}

console.log(`✅ Found continueToCache() at line ${continueToCacheFnIndex + 1}\n`);

// Add resetToDefault27() function before continueToCache
const resetFunction = [
  "    'function resetToDefault27() {' +",
  "    '  const defaultFields = ' + JSON.stringify(getDefaultFieldNames_()) + ';' +",
  "    '  for (const fields of Object.values(categoriesData)) {' +",
  "    '    fields.forEach(field => {' +",
  "    '      const checkbox = document.getElementById(field.name);' +",
  "    '      if (checkbox) {' +",
  "    '        checkbox.checked = defaultFields.includes(field.name);' +",
  "    '      }' +",
  "    '    });' +",
  "    '  }' +",
  "    '  updateCount();' +",
  "    '  alert(\"✅ Reset to original 27 default fields\");' +",
  "    '}' +"
];

lines.splice(continueToCacheFnIndex, 0, ...resetFunction);

console.log('✅ Added resetToDefault27() JavaScript function\n');

// Write updated content
const updatedContent = lines.join('\n');
fs.writeFileSync(integratedPath, updatedContent, 'utf8');

const sizeKB = Math.round(updatedContent.length / 1024);

console.log('✅ Updated integrated file written\n');
console.log('═══════════════════════════════════════════════════════════════\n');
console.log('✅ RESET BUTTON ADDED SUCCESSFULLY!\n');
console.log(`   Integrated file: ${sizeKB} KB\n`);
console.log('Changes made:\n');
console.log('   • Added .btn-reset CSS styles (white button with purple border)');
console.log('   • Added Reset button to footer (left of Continue button)');
console.log('   • Added resetToDefault27() JavaScript function');
console.log('   • Function checks/unchecks fields to match original 27\n');
console.log('Next step:\n');
console.log('   Deploy to TEST spreadsheet\n');
console.log('═══════════════════════════════════════════════════════════════\n');
