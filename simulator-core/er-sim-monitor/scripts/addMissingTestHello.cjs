#!/usr/bin/env node

/**
 * ADD MISSING testHello() FUNCTION
 *
 * The modal UI calls testHello() but this function doesn't exist.
 * This script adds it to Phase2.
 */

const fs = require('fs');
const path = require('path');

const phase2Path = path.join(__dirname, '../backups/phase2-before-cache-fix-2025-11-06T14-51-17/Categories_Pathways_Feature_Phase2.gs');

console.log('\n📝 ADDING MISSING testHello() FUNCTION\n');

const code = fs.readFileSync(phase2Path, 'utf8');

// Find where testCacheSimple is defined
const testCacheSimpleIndex = code.indexOf('function testCacheSimple()');

if (testCacheSimpleIndex === -1) {
  console.log('❌ Could not find testCacheSimple() function');
  process.exit(1);
}

// Insert testHello() right before testCacheSimple()
const testHelloFunction = `/**
 * ULTRA SIMPLE TEST: Returns immediately with timestamp
 */
function testHello() {
  Logger.log('👋 testHello() called');
  return {
    success: true,
    message: 'Hello from backend!',
    timestamp: new Date().toISOString()
  };
}

`;

const updatedCode = code.slice(0, testCacheSimpleIndex) + testHelloFunction + code.slice(testCacheSimpleIndex);

fs.writeFileSync(phase2Path, updatedCode, 'utf8');

console.log('✅ Added testHello() function before testCacheSimple()');
console.log('\nNext: Redeploy to TEST');
