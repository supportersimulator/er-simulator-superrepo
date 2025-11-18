#!/usr/bin/env node

/**
 * Quick diagnostic: Check if performHolisticAnalysis_() can access sheet data
 */

const fs = require('fs');
const path = require('path');

console.log('\n🔍 DIAGNOSTIC: Checking Sheet Access Logic\n');
console.log('═══════════════════════════════════════════════════════════════\n');

const filePath = path.join(__dirname, '../apps-script-deployable/Categories_Pathways_Feature_Phase2.gs');
const code = fs.readFileSync(filePath, 'utf8');

// Check performHolisticAnalysis_() function
const holisticMatch = code.match(/function performHolisticAnalysis_\(\)[^]*?^}/m);
if (!holisticMatch) {
  console.log('❌ Cannot find performHolisticAnalysis_() function');
  process.exit(1);
}

const holisticCode = holisticMatch[0];

console.log('✅ Found performHolisticAnalysis_() function\n');

// Check what sheet it accesses
console.log('📋 Sheet Access Logic:');
const pickSheetMatch = holisticCode.match(/const sheet = (.+);/);
if (pickSheetMatch) {
  console.log(`   Sheet retrieval: ${pickSheetMatch[1]}`);
}

// Check pickMasterSheet_() function
const pickMasterMatch = code.match(/function pickMasterSheet_\(\)[^]*?^}/m);
if (pickMasterMatch) {
  console.log('\n✅ Found pickMasterSheet_() function');
  const pickCode = pickMasterMatch[0];
  
  // Extract sheet name pattern
  const patternMatch = pickCode.match(/\/(.+?)\/i\.test/);
  if (patternMatch) {
    console.log(`   Looks for sheet matching: /${patternMatch[1]}/i`);
    console.log(`   Example: "Master Scenario CSV" or similar`);
  }
}

// Check if function handles missing sheet
if (holisticCode.includes('throw new Error')) {
  console.log('\n✅ Has error handling for missing sheet');
  const errorMatches = holisticCode.match(/throw new Error\('([^']+)'/g);
  if (errorMatches) {
    console.log('   Error messages:');
    errorMatches.forEach(match => {
      const msg = match.match(/'([^']+)'/)[1];
      console.log(`   - "${msg}"`);
    });
  }
}

// Check header expectations
console.log('\n📊 Expected Column Headers:');
const headerChecks = [
  'Case_Organization_Case_ID',
  'Case_Organization_Spark_Title',
  'Case_Organization_Pathway_or_Course_Name',
  'Case_Orientation_Chief_Diagnosis',
  'Case_Orientation_Actual_Learning_Outcomes'
];

headerChecks.forEach(header => {
  if (holisticCode.includes(header)) {
    console.log(`   ✅ ${header}`);
  } else {
    console.log(`   ❌ ${header} (NOT FOUND)`);
  }
});

// Check data row starting point
const dataRowMatch = holisticCode.match(/for \(let i = (\d+); i < data\.length/);
if (dataRowMatch) {
  console.log(`\n📍 Data starts at row ${parseInt(dataRowMatch[1]) + 1} (index ${dataRowMatch[1]})`);
  console.log(`   Assumes: Row 1 = Tier1 headers, Row 2 = Merged headers`);
}

console.log('\n═══════════════════════════════════════════════════════════════');
console.log('💡 LIKELY ISSUE:');
console.log('   If stuck after "Discovery started", the function may be:');
console.log('   1. Unable to find the correct sheet name');
console.log('   2. Unable to find expected column headers');
console.log('   3. Timing out while processing large dataset');
console.log('\n   Check Google Sheet for:');
console.log('   - Sheet name matches pattern "master scenario csv" (case-insensitive)');
console.log('   - Row 2 has merged headers with underscores (Case_Organization_Case_ID)');
console.log('   - Data starts at row 3');
console.log('═══════════════════════════════════════════════════════════════\n');

