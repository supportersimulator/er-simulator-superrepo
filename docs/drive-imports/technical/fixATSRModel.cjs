#!/usr/bin/env node

/**
 * Fix ATSR Tool - Upgrade Model Quality
 *
 * This script upgrades the AI model from gpt-4o-mini to gpt-4o
 * to restore the powerful output quality you had before.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BACKUP_PATH = path.join(__dirname, '../apps-script-backup/Code.gs');

console.log('🔧 ATSR Model Quality Fix\n');
console.log('════════════════════════════════════════════════════\n');

// Read the current Apps Script code
console.log('📖 Reading current Apps Script...');
let code = fs.readFileSync(BACKUP_PATH, 'utf8');

// Check current model
const currentModelMatch = code.match(/const DEFAULT_MODEL = '([^']+)'/);
if (currentModelMatch) {
  console.log(`   Current model: ${currentModelMatch[1]}`);
}

// Upgrade the model
console.log('\n🚀 Upgrading model quality...');

// Option 1: gpt-4o (great quality, fast, cost-effective)
code = code.replace(
  /const DEFAULT_MODEL = 'gpt-4o-mini'/,
  "const DEFAULT_MODEL = 'gpt-4o'"
);

// Also increase max tokens for better responses
code = code.replace(
  /const MAX_TOKENS = 3000/,
  'const MAX_TOKENS = 4000'
);

// Save the fixed version
const outputPath = path.join(__dirname, 'Code_FIXED.gs');
fs.writeFileSync(outputPath, code);

console.log('✅ Model upgraded: gpt-4o-mini → gpt-4o');
console.log('✅ Max tokens increased: 3000 → 4000');
console.log(`\n💾 Fixed code saved to: ${outputPath}\n`);

// Show model comparison
console.log('════════════════════════════════════════════════════');
console.log('📊 MODEL COMPARISON');
console.log('════════════════════════════════════════════════════\n');
console.log('❌ OLD (gpt-4o-mini):');
console.log('   • Quality: Basic');
console.log('   • Cost: ~$0.15 per 1M input tokens');
console.log('   • Speed: Very fast');
console.log('   • Output: Generic, less creative\n');

console.log('✅ NEW (gpt-4o):');
console.log('   • Quality: Excellent');
console.log('   • Cost: ~$2.50 per 1M input tokens');
console.log('   • Speed: Fast');
console.log('   • Output: Rich, creative, medically accurate\n');

console.log('💡 ALTERNATIVE (o1-preview):');
console.log('   • Quality: Best (reasoning model)');
console.log('   • Cost: ~$15 per 1M input tokens');
console.log('   • Speed: Slower (deep thinking)');
console.log('   • Output: Exceptional quality, clinical reasoning\n');

console.log('════════════════════════════════════════════════════');
console.log('📋 NEXT STEPS');
console.log('════════════════════════════════════════════════════\n');

console.log('Option A: Deploy via API (Automated)');
console.log('--------------------------------------');
console.log('1. Run: node scripts/deployAppsScript.cjs');
console.log('2. The script will push the fixed code');
console.log('3. Refresh your Google Sheet\n');

console.log('Option B: Manual Copy-Paste');
console.log('----------------------------');
console.log('1. Open Apps Script editor');
console.log('2. Open: scripts/Code_FIXED.gs');
console.log('3. Copy ALL code from Code_FIXED.gs');
console.log('4. Paste into Code.gs (replace all)');
console.log('5. Save and close');
console.log('6. Refresh Google Sheet\n');

console.log('Option C: Upgrade to o1-preview (Best Quality)');
console.log('-----------------------------------------------');
console.log('1. Edit line 54 in Code_FIXED.gs:');
console.log('   const DEFAULT_MODEL = \'o1-preview\';');
console.log('2. Deploy using Option A or B above\n');

console.log('════════════════════════════════════════════════════');
console.log('🧪 TESTING');
console.log('════════════════════════════════════════════════════\n');
console.log('After deployment:');
console.log('1. Open Google Sheet');
console.log('2. Click: ER Simulator → ATSR — Titles & Summary');
console.log('3. Enter a row number (e.g., 10)');
console.log('4. Compare output quality - should be MUCH better!\n');

console.log('════════════════════════════════════════════════════\n');

// Ask user which option they want
console.log('🤔 What would you like to do?');
console.log('   A) Deploy via API now');
console.log('   B) I\'ll copy-paste manually');
console.log('   C) Upgrade to o1-preview first\n');
