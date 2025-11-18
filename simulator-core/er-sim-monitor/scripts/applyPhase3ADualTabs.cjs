#!/usr/bin/env node

/**
 * Script to apply Phase 3A dual-tab UI to Phase 2 file
 *
 * This script:
 * 1. Reads the Phase3A file to get the new buildBirdEyeViewUI_ function
 * 2. Replaces the old function in Phase2 file with the new one
 * 3. Preserves all other code
 */

const fs = require('fs');
const path = require('path');

console.log('\n🔄 APPLYING PHASE 3A: DUAL-TAB UI\n');
console.log('═══════════════════════════════════════════════════════════════\n');

const phase2Path = path.join(__dirname, '../apps-script-deployable/Categories_Pathways_Feature_Phase2.gs');
const phase3aPath = path.join(__dirname, '../apps-script-deployable/Categories_Pathways_Feature_Phase3A.gs');

// Read files
const phase2Content = fs.readFileSync(phase2Path, 'utf8');
const phase3aContent = fs.readFileSync(phase3aPath, 'utf8');

console.log('📄 Files loaded:');
console.log(`   Phase2: ${(phase2Content.length / 1024).toFixed(1)} KB`);
console.log(`   Phase3A: ${(phase3aContent.length / 1024).toFixed(1)} KB\n`);

// Extract the new buildBirdEyeViewUI_ function from Phase3A
const newFunctionMatch = phase3aContent.match(/function buildBirdEyeViewUI_\(analysis\) \{[\s\S]+?^}/m);
if (!newFunctionMatch) {
  console.error('❌ Could not find buildBirdEyeViewUI_ function in Phase3A file');
  process.exit(1);
}

const newFunction = newFunctionMatch[0];
console.log(`✅ Extracted new buildBirdEyeViewUI_ function (${(newFunction.length / 1024).toFixed(1)} KB)\n`);

// Find and replace the old function in Phase2
// The function starts at "function buildBirdEyeViewUI_(analysis) {" and ends at the closing "}" before the next section marker
const oldFunctionRegex = /function buildBirdEyeViewUI_\(analysis\) \{[\s\S]+?^}\s+(?=\/\/ ==========)/m;

const oldFunctionMatch = phase2Content.match(oldFunctionRegex);
if (!oldFunctionMatch) {
  console.error('❌ Could not find buildBirdEyeViewUI_ function in Phase2 file');
  console.error('   This might mean the function structure has changed.');
  process.exit(1);
}

console.log(`✅ Found old buildBirdEyeViewUI_ function (${(oldFunctionMatch[0].length / 1024).toFixed(1)} KB)\n`);

// Replace old function with new function
const updatedContent = phase2Content.replace(oldFunctionRegex, newFunction + '\n\n');

// Write back to Phase2 file
fs.writeFileSync(phase2Path, updatedContent, 'utf8');

console.log('═══════════════════════════════════════════════════════════════');
console.log('✅ DUAL-TAB UI APPLIED SUCCESSFULLY\n');
console.log('📋 Changes made:');
console.log('   • Replaced buildBirdEyeViewUI_ with dual-tab version');
console.log('   • Added browser-style tab switcher');
console.log('   • Created Categories tab with system cards');
console.log('   • Created Pathways tab with pathway opportunities');
console.log('   • Added tab switching JavaScript\n');
console.log('🎯 New features:');
console.log('   • 📁 Categories tab: System-based organization');
console.log('   • 🧩 Pathways tab: Intelligent pathway opportunities');
console.log('   • Clean visual separation of organizational modes');
console.log('   • Foundation for AI logic type discovery\n');
console.log('🚀 Next steps:');
console.log('   1. Deploy to Google Sheets: node scripts/deployPhase2A.cjs');
console.log('   2. Test dual-tab interface in Google Sheets');
console.log('   3. Verify Categories tab shows all systems');
console.log('   4. Verify Pathways tab shows opportunities\n');
console.log('═══════════════════════════════════════════════════════════════\n');
