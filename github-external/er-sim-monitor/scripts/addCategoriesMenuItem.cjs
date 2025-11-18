#!/usr/bin/env node

/**
 * Add Categories & Pathways Menu Item
 */

const fs = require('fs');
const path = require('path');

const INPUT_PATH = path.join(__dirname, 'Code_FINAL_WITH_BOTH_PANELS.gs');
const OUTPUT_PATH = path.join(__dirname, 'Code_COMPLETE_LIGHT.gs');

console.log('📝 Adding Categories & Pathways menu item...');

let code = fs.readFileSync(INPUT_PATH, 'utf8');
const lines = code.split('\n');

// Find the ATSR menu item line
const atsrIdx = lines.findIndex(line => line.includes("addItem(`${ICONS.wand} ATSR"));

if (atsrIdx === -1) {
  console.error('❌ Could not find ATSR menu item');
  process.exit(1);
}

// Insert Categories menu item after ATSR
const newMenuItem = "    .addItem('📂 Categories & Pathways', 'openCategoriesPathwaysPanel')";
lines.splice(atsrIdx + 1, 0, newMenuItem);

code = lines.join('\n');
fs.writeFileSync(OUTPUT_PATH, code);

console.log('✅ Added menu item');
console.log(`💾 Saved to: ${OUTPUT_PATH}`);
console.log(`📊 Total: ${lines.length} lines`);
