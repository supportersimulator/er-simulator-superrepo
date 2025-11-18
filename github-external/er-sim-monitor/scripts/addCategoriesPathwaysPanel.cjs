#!/usr/bin/env node

/**
 * Add Categories & Pathways Panel to Apps Script
 *
 * Adds the interactive panel code and menu item to Code_ENHANCED_ATSR.gs
 */

const fs = require('fs');
const path = require('path');

const CODE_PATH = path.join(__dirname, 'Code_ENHANCED_ATSR.gs');
const PANEL_PATH = path.join(__dirname, 'CategoriesPathwaysPanel.gs');
const OUTPUT_PATH = path.join(__dirname, 'Code_WITH_CATEGORIES.gs');

console.log('');
console.log('════════════════════════════════════════════════════');
console.log('   📂 ADDING CATEGORIES & PATHWAYS PANEL');
console.log('════════════════════════════════════════════════════');
console.log('');

// Read files
console.log('📖 Reading files...');
const code = fs.readFileSync(CODE_PATH, 'utf8');
const panel = fs.readFileSync(PANEL_PATH, 'utf8');

console.log(`   ✅ Read Code_ENHANCED_ATSR.gs (${code.split('\n').length} lines)`);
console.log(`   ✅ Read CategoriesPathwaysPanel.gs (${panel.split('\n').length} lines)`);
console.log('');

// Find where to insert the panel code (before the final menu setup)
const lines = code.split('\n');
const menuStartIdx = lines.findIndex(line => line.includes('function onOpen()'));

console.log(`🔍 Found onOpen() function at line ${menuStartIdx + 1}`);
console.log('');

// Find the menu creation section to add new menu item
const menuLines = lines.slice(menuStartIdx, menuStartIdx + 20);
const addSeparatorIdx = menuLines.findIndex(line => line.includes('.addSeparator()') && line.includes('Check API'));

if (addSeparatorIdx === -1) {
  console.error('❌ Could not find menu separator line');
  process.exit(1);
}

const insertIdx = menuStartIdx + addSeparatorIdx;

console.log('📝 Modifying menu...');

// Insert new menu item before the separator
const newMenuItem = `    .addItem('📂 Categories & Pathways', 'openCategoriesPathwaysPanel')`;

lines.splice(insertIdx, 0, newMenuItem);

console.log(`   ✅ Added menu item at line ${insertIdx + 1}`);
console.log('');

// Add panel code before onOpen function
console.log('📝 Adding panel code...');

const panelLines = panel.split('\n');
// Skip the header comments from panel file
const panelCodeStart = panelLines.findIndex(line => line.includes('// ========== MAIN MENU LAUNCHER'));
const panelCode = panelLines.slice(panelCodeStart);

lines.splice(menuStartIdx, 0, ...panelCode, '');

console.log(`   ✅ Added ${panelCode.length} lines of panel code`);
console.log('');

// Write output
const newCode = lines.join('\n');
fs.writeFileSync(OUTPUT_PATH, newCode);

console.log(`💾 Saved to: ${OUTPUT_PATH}`);
console.log('');
console.log(`📊 File size: ${newCode.split('\n').length} lines`);
console.log('');

console.log('════════════════════════════════════════════════════');
console.log('✅ PANEL ADDED SUCCESSFULLY');
console.log('════════════════════════════════════════════════════');
console.log('');

console.log('🎯 What was added:');
console.log('   ✅ Full interactive sidebar panel for Categories & Pathways');
console.log('   ✅ Menu item: 📂 Categories & Pathways');
console.log('   ✅ Dark-themed UI with visual space');
console.log('   ✅ View cases by category');
console.log('   ✅ View cases by pathway');
console.log('   ✅ Assign cases to categories/pathways');
console.log('   ✅ Interactive navigation');
console.log('');

console.log('📤 Next step:');
console.log('   node scripts/deployCategoriesPanel.cjs');
console.log('');
