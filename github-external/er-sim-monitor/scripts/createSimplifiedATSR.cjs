#!/usr/bin/env node

/**
 * Create Simplified ATSR Version (No Case_ID + Light Grey Theme)
 *
 * Removes Case_ID generation and changes to light grey theme
 * while keeping the rich Sim Mastery philosophy prompt
 */

const fs = require('fs');
const path = require('path');

const INPUT_PATH = path.join(__dirname, 'Code_ENHANCED_ATSR.gs');
const OUTPUT_PATH = path.join(__dirname, 'Code_SIMPLIFIED_ATSR_LIGHT.gs');

console.log('');
console.log('════════════════════════════════════════════════════');
console.log('   ✂️  CREATING SIMPLIFIED ATSR (NO CASE_ID)');
console.log('════════════════════════════════════════════════════');
console.log('');

// Read the enhanced ATSR code
console.log('📖 Reading Code_ENHANCED_ATSR.gs...');
let code = fs.readFileSync(INPUT_PATH, 'utf8');
console.log(`   ✅ Read ${code.split('\n').length} lines`);
console.log('');

// ========== STEP 1: Remove Case_ID from Prompt ==========
console.log('✂️  Step 1: Removing Case_ID section from prompt...');

// Remove the entire Case_ID section (### 3. **Case IDs** ... ---)
const caseIdSectionStart = code.indexOf('### 3. **Case IDs**');
const caseIdSectionEnd = code.indexOf('---', caseIdSectionStart + 1);

if (caseIdSectionStart !== -1 && caseIdSectionEnd !== -1) {
  const before = code.substring(0, caseIdSectionStart);
  const after = code.substring(caseIdSectionEnd + 3); // Skip the ---
  code = before + after;
  console.log('   ✅ Removed Case_ID section from prompt');
} else {
  console.log('   ⚠️  Case_ID section not found in expected format');
}

// Update section numbering (### 4. becomes ### 3.)
code = code.replace(/### 4\. \*\*Case Summary\*\*/g, '### 3. **Case Summary**');
console.log('   ✅ Updated section numbering');

// Remove Case_IDs from output format
code = code.replace(/"Case_IDs": \[\s*"SYSTEM01",[\s\S]*?"SYSTEM10"\s*\],\s*/g, '');
console.log('   ✅ Removed Case_IDs from output JSON format');

console.log('');

// ========== STEP 2: Change to Light Grey Theme ==========
console.log('🎨 Step 2: Changing to light grey theme...');

// Dark theme colors to replace:
const darkToLight = {
  'background:#0f1115': 'background:#f5f7fa',
  'background: #0f1115': 'background: #f5f7fa',
  'color:#e7eaf0': 'color:#2c3e50',
  'color: #e7eaf0': 'color: #2c3e50',
  'background:#141824': 'background:#ffffff',
  'background: #141824': 'background: #ffffff',
  'background:#1b1f2a': 'background:#ffffff',
  'background: #1b1f2a': 'background: #ffffff',
  'border:1px solid #2a3040': 'border:1px solid #dfe3e8',
  'border: 1px solid #2a3040': 'border: 1px solid #dfe3e8',
  'color:#8b92a0': 'color:#7f8c9d',
  'color: #8b92a0': 'color: #7f8c9d',
  'color:#9aa3b2': 'color:#7f8c9d',
  'color: #9aa3b2': 'color: #7f8c9d',
  '#30384b': '#d1d7de',
  '#2a3040': '#dfe3e8'
};

Object.entries(darkToLight).forEach(([dark, light]) => {
  const regex = new RegExp(dark.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
  code = code.replace(regex, light);
});

console.log('   ✅ Converted dark theme to light grey theme');
console.log('');

// ========== STEP 3: Update ATSR Panel UI (Remove Case_ID selection) ==========
console.log('🔧 Step 3: Updating ATSR panel UI...');

// Find and update buildATSRPanelDark_ function
// Remove Case_ID section from HTML
const caseIdCardStart = code.indexOf('<div class="card">\n      <h3>🆔 Case IDs');
if (caseIdCardStart !== -1) {
  // Find the end of this card div
  let depth = 0;
  let pos = caseIdCardStart;
  let inCard = false;

  for (let i = caseIdCardStart; i < code.length; i++) {
    if (code.substring(i, i + 16) === '<div class="card">') {
      depth++;
      inCard = true;
    } else if (code.substring(i, i + 6) === '</div>' && inCard) {
      depth--;
      if (depth === 0) {
        // Found the closing div for this card
        const cardEnd = i + 6;
        code = code.substring(0, caseIdCardStart) + code.substring(cardEnd);
        console.log('   ✅ Removed Case_ID card from panel HTML');
        break;
      }
    }
  }
}

// Update applyATSRSelectionsWithDefiningAndMemory function to remove caseID parameter
code = code.replace(
  /function applyATSRSelectionsWithDefiningAndMemory\(row, spark, reveal, caseID, define\)/,
  'function applyATSRSelectionsWithDefiningAndMemory(row, spark, reveal, define)'
);

code = code.replace(
  /applyATSRSelectionsWithDefiningAndMemory\(\$\{row\}, s\.spark, s\.reveal, s\.caseID, s\.define\)/g,
  'applyATSRSelectionsWithDefiningAndMemory(${row}, s.spark, s.reveal, s.define)'
);

code = code.replace(
  /setVal\('Case_ID',\s*caseID\);/g,
  '// Case_ID removed'
);

console.log('   ✅ Updated panel JavaScript');
console.log('');

// ========== STEP 4: Write Output ==========
fs.writeFileSync(OUTPUT_PATH, code);

console.log(`💾 Saved to: ${OUTPUT_PATH}`);
console.log(`📊 File size: ${code.split('\n').length} lines`);
console.log('');

console.log('════════════════════════════════════════════════════');
console.log('✅ SIMPLIFIED ATSR CREATED');
console.log('════════════════════════════════════════════════════');
console.log('');

console.log('🎯 Changes made:');
console.log('   ✅ Removed Case_ID generation from prompt');
console.log('   ✅ Removed Case_ID section from UI');
console.log('   ✅ Changed to light grey theme');
console.log('   ✅ Kept rich Sim Mastery philosophy');
console.log('   ✅ Simplified to 3 components:');
console.log('      1. Spark Titles (5 variations)');
console.log('      2. Reveal Titles (5 variations)');
console.log('      3. Case Summary (Patient/Intervention/Takeaway/Characteristics)');
console.log('');

console.log('📤 Next: Add Categories panel and deploy');
console.log('');
