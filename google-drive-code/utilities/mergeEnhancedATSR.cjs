#!/usr/bin/env node

/**
 * Merge Enhanced ATSR Function into Code_FIXED.gs
 *
 * Replaces lines 1935-1999 (old runATSRTitleGenerator function)
 * with the enhanced version that has the rich Sim Mastery philosophy prompt
 */

const fs = require('fs');
const path = require('path');

const CODE_FIXED_PATH = path.join(__dirname, 'Code_FIXED.gs');
const ENHANCED_ATSR_PATH = path.join(__dirname, 'ATSR_Enhanced_Function.gs');
const OUTPUT_PATH = path.join(__dirname, 'Code_ENHANCED_ATSR.gs');

console.log('🔧 Merging Enhanced ATSR into Code_FIXED.gs\n');

// Read files
const codeFixed = fs.readFileSync(CODE_FIXED_PATH, 'utf8').split('\n');
const enhancedATSR = fs.readFileSync(ENHANCED_ATSR_PATH, 'utf8').split('\n');

// Extract just the function from ATSR_Enhanced_Function.gs (skip header comments)
const functionStart = enhancedATSR.findIndex(line => line.startsWith('function runATSRTitleGenerator'));
const enhancedFunction = enhancedATSR.slice(functionStart);

console.log(`📖 Read Code_FIXED.gs: ${codeFixed.length} lines`);
console.log(`📖 Read Enhanced ATSR function: ${enhancedFunction.length} lines`);
console.log('');

// Find the ATSR function in Code_FIXED.gs
const oldFunctionStart = codeFixed.findIndex(line => line.startsWith('function runATSRTitleGenerator'));
const oldFunctionEnd = codeFixed.findIndex((line, idx) => {
  return idx > oldFunctionStart && line === '}' && codeFixed[idx-1].includes('ui.showModalDialog');
});

console.log(`🔍 Found old ATSR function:`);
console.log(`   Lines ${oldFunctionStart + 1} - ${oldFunctionEnd + 1}`);
console.log(`   (${oldFunctionEnd - oldFunctionStart + 1} lines)`);
console.log('');

// Build new file
const newFile = [
  ...codeFixed.slice(0, oldFunctionStart),
  ...enhancedFunction,
  ...codeFixed.slice(oldFunctionEnd + 1)
];

console.log(`✨ Created enhanced version:`);
console.log(`   Old function: ${oldFunctionEnd - oldFunctionStart + 1} lines`);
console.log(`   New function: ${enhancedFunction.length} lines`);
console.log(`   Total file: ${newFile.length} lines`);
console.log('');

// Write output
fs.writeFileSync(OUTPUT_PATH, newFile.join('\n'));

console.log(`💾 Saved to: ${OUTPUT_PATH}`);
console.log('');
console.log('════════════════════════════════════════════════════');
console.log('✅ MERGE COMPLETE');
console.log('════════════════════════════════════════════════════');
console.log('');
console.log('📋 What changed:');
console.log('   ❌ OLD: Simple 33-line prompt with basic rules');
console.log('   ✅ NEW: Rich 334-line prompt with Sim Mastery philosophy');
console.log('');
console.log('🎯 Key improvements:');
console.log('   • Emotionally resonant language and examples');
console.log('   • Detailed quality criteria for each component');
console.log('   • Human-centered patient descriptors');
console.log('   • Clinical pearl emphasis in Reveal Titles');
console.log('   • Marketing genius-level Spark Titles');
console.log('   • Comprehensive tone & style guidelines');
console.log('');
console.log('📤 Next step:');
console.log('   node scripts/deployEnhancedATSR.cjs');
console.log('');
