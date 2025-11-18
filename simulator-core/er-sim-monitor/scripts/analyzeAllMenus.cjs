#!/usr/bin/env node

/**
 * ANALYZE ALL MENUS IN THE SPREADSHEET
 * Check what menus exist and consolidate them
 */

const fs = require('fs');
const path = require('path');

console.log('\n📋 ANALYZING MENUS IN TEST ENVIRONMENT\n');
console.log('═══════════════════════════════════════════════════════════════\n');

// Check the code we just deployed
const deployedCodePath = path.join(__dirname, '../backups/ATSR_Title_Generator_Feature_IMPROVED.gs');
const deployedCode = fs.readFileSync(deployedCodePath, 'utf8');

console.log('📦 GPT Formatter (Currently Deployed Code):\n');

// Find onOpen function
const onOpenMatch = deployedCode.match(/function onOpen\(\)[^{]*\{([^}]*(?:\{[^}]*\}[^}]*)*)\}/);
if (onOpenMatch) {
  const onOpenBody = onOpenMatch[0];
  
  // Extract menu names
  const menuMatches = [...onOpenBody.matchAll(/createMenu\(['"]([^'"]+)['"]\)/g)];
  const itemMatches = [...onOpenBody.matchAll(/addItem\(['"]([^'"]+)['"],\s*['"]([^'"]+)['"]\)/g)];
  
  console.log('   Menus Created:\n');
  menuMatches.forEach((match, index) => {
    console.log(`   ${index + 1}. ${match[1]}`);
  });
  
  console.log('\n   Menu Items:\n');
  itemMatches.forEach((match, index) => {
    console.log(`   ${index + 1}. ${match[1]} → ${match[2]}()`);
  });
  
  console.log('\n');
}

console.log('═══════════════════════════════════════════════════════════════\n');

// Check what functions are available in the deployed code
console.log('🔍 Available Functions in Deployed Code:\n');

const functionMatches = [...deployedCode.matchAll(/^function\s+(\w+)/gm)];
const functions = functionMatches.map(m => m[1]).filter(f => !f.startsWith('_'));

console.log('   Main Functions:\n');
functions.forEach((func, index) => {
  if (func.startsWith('run') || func.startsWith('open') || func.startsWith('show')) {
    console.log(`   - ${func}()`);
  }
});

console.log('\n═══════════════════════════════════════════════════════════════\n');

console.log('💡 MENU CONSOLIDATION RECOMMENDATIONS:\n');
console.log('   Current menu: "🧪 TEST Tools"\n');
console.log('   Suggests this is a test-specific menu.\n');
console.log('\n   Options:\n');
console.log('   1. Keep "🧪 TEST Tools" (current)\n');
console.log('   2. Rename to "🧠 Sim Builder" (more professional)\n');
console.log('   3. Create single unified menu with all features\n');
console.log('\n   Which would you prefer?\n');
console.log('═══════════════════════════════════════════════════════════════\n');

