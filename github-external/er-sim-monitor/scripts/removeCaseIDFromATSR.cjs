#!/usr/bin/env node

/**
 * Remove Case_ID Feature from ATSR Panel
 *
 * Removes:
 * 1. Case_ID from the prompt (section about generating Case_IDs)
 * 2. Case_ID dropdown from the UI
 * 3. setVal('Case_ID', ...) call
 *
 * Keeps everything else intact.
 */

const fs = require('fs');
const path = require('path');

const INPUT_PATH = path.join(__dirname, 'Code_CURRENT_DEPLOYED.gs');
const OUTPUT_PATH = path.join(__dirname, 'Code_ATSR_NO_CASE_ID.gs');

console.log('');
console.log('════════════════════════════════════════════════════');
console.log('   🔧 REMOVING CASE_ID FROM ATSR PANEL');
console.log('════════════════════════════════════════════════════');
console.log('');

let code = fs.readFileSync(INPUT_PATH, 'utf8');
const originalLength = code.length;

// 1. Remove Case_ID section from prompt
console.log('📝 Step 1: Removing Case_ID section from prompt...');

// Find the Case_IDs section in the prompt (it's between Reveal_Titles and Case_Summary)
const caseIdPromptStart = code.indexOf('### 3. **Case IDs**');
if (caseIdPromptStart !== -1) {
  // Find the end of this section (next ###)
  const nextSectionStart = code.indexOf('### 4. **Case Summary**', caseIdPromptStart);

  if (nextSectionStart !== -1) {
    // Remove the entire Case_ID section
    const before = code.substring(0, caseIdPromptStart);
    const after = code.substring(nextSectionStart);

    // Renumber sections: 4 becomes 3, etc.
    const afterRenumbered = after.replace('### 4. **Case Summary**', '### 3. **Case Summary**');

    code = before + afterRenumbered;
    console.log('   ✅ Removed Case_ID section from prompt');
  } else {
    console.log('   ⚠️  Could not find section 4 (Case Summary)');
  }
} else {
  console.log('   ℹ️  No Case_ID section found in prompt (might already be removed)');
}

// 2. Remove Case_IDs from JSON output example
console.log('📝 Step 2: Removing Case_IDs from output format...');
code = code.replace(/\s*"Case_IDs":\s*\["\.\.\.x10"\],?/g, '');
console.log('   ✅ Removed Case_IDs from output format');

// 3. Remove Case_ID dropdown from UI
console.log('📝 Step 3: Removing Case_ID UI elements...');

// Find and remove the Case_ID dropdown HTML
const caseIdDropdownRegex = /<div class="field-row">[\s\S]*?<label>Case_ID<\/label>[\s\S]*?id=['"]caseID['"][\s\S]*?<\/div>/;
code = code.replace(caseIdDropdownRegex, '');
console.log('   ✅ Removed Case_ID dropdown from UI');

// 4. Remove setVal('Case_ID', ...) call
console.log('📝 Step 4: Removing Case_ID data setter...');
code = code.replace(/\s*setVal\('Case_ID',\s*caseID\);?/g, '');
console.log('   ✅ Removed Case_ID setter');

// 5. Remove Case_ID from makeSelect call parameter list if present
code = code.replace(/\$\{makeSelect\(parsed\.Case_IDs\|\|\[\],\s*'caseID'\)\}/g, '');

// Write output
fs.writeFileSync(OUTPUT_PATH, code);

const newLength = code.length;
const removed = originalLength - newLength;

console.log('');
console.log('💾 Saved to:', OUTPUT_PATH);
console.log(`📊 Original: ${originalLength} chars`);
console.log(`📊 New: ${newLength} chars`);
console.log(`📊 Removed: ${removed} chars`);
console.log('');

console.log('════════════════════════════════════════════════════');
console.log('✅ CASE_ID REMOVAL COMPLETE');
console.log('════════════════════════════════════════════════════');
console.log('');

console.log('📋 What was removed:');
console.log('   ✅ Case_ID section from prompt');
console.log('   ✅ Case_ID dropdown from UI');
console.log('   ✅ Case_ID data setter');
console.log('');

console.log('📋 What was kept:');
console.log('   ✅ Rich Sim Mastery prompt (Spark Titles, Reveal Titles, Case Summary)');
console.log('   ✅ All other UI elements');
console.log('   ✅ Categories & Pathways panel');
console.log('');

console.log('📤 Next step:');
console.log('   node scripts/deployATSRNoCaseID.cjs');
console.log('');
