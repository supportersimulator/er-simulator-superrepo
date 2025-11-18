#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('\n🔍 COMPARING BATCH PROCESSING CODE WITH BACKUP\n');

const currentPath = path.join(__dirname, 'Code_ULTIMATE_ATSR.gs');
const backupPath = path.join(__dirname, '../apps-script-backup/Code.gs');

if (!fs.existsSync(backupPath)) {
  console.log('⚠️  No backup file found at apps-script-backup/Code.gs');
  console.log('   Cannot compare with morning version.\n');
  process.exit(0);
}

const current = fs.readFileSync(currentPath, 'utf8');
const backup = fs.readFileSync(backupPath, 'utf8');

// Extract critical batch functions
const functionsToCheck = [
  'tryParseJSON',
  'validateVitalsFields_',
  'processOneInputRow_',
  'applyClinicalDefaults_'
];

console.log('📊 Comparing critical batch processing functions:\n');

let allSame = true;

functionsToCheck.forEach(fnName => {
  // Extract function from both files
  const fnRegex = new RegExp(`function ${fnName}[^{]*\\{(?:[^{}]*|\\{[^{}]*\\})*\\}`, 's');
  
  const currentMatch = current.match(fnRegex);
  const backupMatch = backup.match(fnRegex);
  
  if (!currentMatch || !backupMatch) {
    console.log(`⚠️  ${fnName} - Cannot compare (missing in one file)`);
    return;
  }
  
  const currentFn = currentMatch[0];
  const backupFn = backupMatch[0];
  
  if (currentFn === backupFn) {
    console.log(`✅ ${fnName} - IDENTICAL`);
  } else {
    console.log(`❌ ${fnName} - MODIFIED`);
    allSame = false;
  }
});

console.log('\n' + '='.repeat(50));
if (allSame) {
  console.log('✅ ALL BATCH PROCESSING FUNCTIONS UNCHANGED');
  console.log('   Code is identical to this morning.');
} else {
  console.log('⚠️  SOME FUNCTIONS WERE MODIFIED');
  console.log('   Review changes carefully.');
}
console.log('='.repeat(50) + '\n');

