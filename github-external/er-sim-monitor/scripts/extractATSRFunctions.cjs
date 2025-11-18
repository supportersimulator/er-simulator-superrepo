#!/usr/bin/env node

/**
 * EXTRACT ATSR FUNCTIONS FROM MEGA-FILE
 * Identifies ATSR-specific code to help you remove it
 */

const fs = require('fs');
const path = require('path');

console.log('\n🔍 ANALYZING ER SIM MEGA-FILE FOR ATSR CODE\n');
console.log('═══════════════════════════════════════════════════════════════\n');

// You'll need to paste the mega-file content into a local file first
const megaFilePath = path.join(__dirname, 'ER_Sim_ATSR_Mega.gs');

if (!fs.existsSync(megaFilePath)) {
  console.log('❌ Please create scripts/ER_Sim_ATSR_Mega.gs first');
  console.log('   Paste the full code from "ER Sim - ATSR Tool (Standalone)" into that file.\n');
  process.exit(1);
}

const content = fs.readFileSync(megaFilePath, 'utf8');

console.log('📊 File size: ' + (content.length / 1024).toFixed(1) + ' KB\n');

// ATSR-specific function patterns
const atsrPatterns = [
  { name: 'runATSRTitleGenerator', reason: 'Main ATSR workflow' },
  { name: 'parseATSRResponse_', reason: 'ATSR JSON parser' },
  { name: 'buildATSRUltimateUI_', reason: 'ATSR UI dialog' },
  { name: 'generateMysteriousSparkTitles', reason: 'Mystery regeneration' },
  { name: 'saveATSRData', reason: 'ATSR save function' },
  { name: 'applyATSRSelectionsWithDefiningAndMemory', reason: 'Legacy ATSR save' },
  { name: 'ATSR', reason: 'Any function with ATSR in name' }
];

const foundFunctions = [];

console.log('🔍 Searching for ATSR-specific functions...\n');

atsrPatterns.forEach(pattern => {
  const regex = new RegExp(`function\\s+${pattern.name}[^{]*\\{`, 'g');
  const matches = content.match(regex);

  if (matches) {
    console.log(`✅ Found: ${pattern.name} (${matches.length} occurrence(s))`);
    console.log(`   Reason: ${pattern.reason}`);
    foundFunctions.push({
      name: pattern.name,
      count: matches.length,
      reason: pattern.reason
    });
  }
});

console.log('\n═══════════════════════════════════════════════════════════════\n');

if (foundFunctions.length === 0) {
  console.log('✅ NO ATSR FUNCTIONS FOUND\n');
  console.log('This file appears to be already clean of ATSR code.\n');
  console.log('Safe to use as "Batch Processing & Quality Engine".\n');
} else {
  console.log(`⚠️  FOUND ${foundFunctions.length} ATSR-RELATED FUNCTIONS\n`);
  console.log('These should be REMOVED to create the clean Batch & Quality version:\n');

  foundFunctions.forEach((f, i) => {
    console.log(`${i + 1}. ${f.name} (${f.count} occurrence(s))`);
    console.log(`   → ${f.reason}`);
    console.log('');
  });

  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log('📝 NEXT STEPS:\n');
  console.log('1. Open "ER Sim - ATSR Tool (Standalone)" in Apps Script editor');
  console.log('2. Search for each function name listed above');
  console.log('3. Delete the entire function (from "function" to closing brace)');
  console.log('4. Save the file');
  console.log('5. Rename the project to "Batch Processing & Quality Engine"\n');
}

// Also check for ATSR-related comments and strings
console.log('🔍 Checking for ATSR mentions in comments/strings...\n');

const atsrMentions = content.match(/ATSR/gi) || [];
console.log(`Found ${atsrMentions.length} mentions of "ATSR" in the file\n`);

if (atsrMentions.length > 20) {
  console.log('⚠️  High number of ATSR mentions suggests significant ATSR integration\n');
  console.log('Recommendation: Carefully review the file before removing code.\n');
}

// Extract function list for documentation
console.log('═══════════════════════════════════════════════════════════════\n');
console.log('📋 ALL FUNCTIONS IN FILE:\n');

const allFunctions = content.match(/function\s+(\w+)\s*\(/g);
if (allFunctions) {
  const functionNames = allFunctions
    .map(f => f.match(/function\s+(\w+)/)[1])
    .filter((name, index, self) => self.indexOf(name) === index) // unique
    .sort();

  console.log(`Total unique functions: ${functionNames.length}\n`);

  const atsrFuncs = functionNames.filter(name => /ATSR/i.test(name));
  const batchFuncs = functionNames.filter(name => /batch|queue|step/i.test(name));
  const qualityFuncs = functionNames.filter(name => /quality|score|audit|clean/i.test(name));
  const otherFuncs = functionNames.filter(name =>
    !(/ATSR|batch|queue|step|quality|score|audit|clean/i.test(name))
  );

  console.log(`ATSR Functions (${atsrFuncs.length}):`);
  atsrFuncs.forEach(f => console.log(`  - ${f}`));
  console.log('');

  console.log(`Batch Functions (${batchFuncs.length}):`);
  batchFuncs.forEach(f => console.log(`  - ${f}`));
  console.log('');

  console.log(`Quality Functions (${qualityFuncs.length}):`);
  qualityFuncs.forEach(f => console.log(`  - ${f}`));
  console.log('');

  console.log(`Other Core Functions (${otherFuncs.length}):`);
  otherFuncs.slice(0, 20).forEach(f => console.log(`  - ${f}`));
  if (otherFuncs.length > 20) {
    console.log(`  ... and ${otherFuncs.length - 20} more`);
  }
  console.log('');
}

console.log('═══════════════════════════════════════════════════════════════\n');
console.log('✅ Analysis complete!\n');

// Save analysis to file
const report = `
ER SIM MEGA-FILE ATSR EXTRACTION ANALYSIS
Date: ${new Date().toLocaleString()}
═══════════════════════════════════════════════════════════════

FILE STATS:
- Size: ${(content.length / 1024).toFixed(1)} KB
- Total functions: ${allFunctions ? allFunctions.length : 0}
- ATSR mentions: ${atsrMentions.length}

ATSR FUNCTIONS TO REMOVE:
${foundFunctions.map((f, i) => `${i + 1}. ${f.name} (${f.count} occurrence(s)) - ${f.reason}`).join('\n')}

FUNCTION CATEGORIES:
- ATSR Functions: ${atsrFuncs ? atsrFuncs.length : 0}
- Batch Functions: ${batchFuncs ? batchFuncs.length : 0}
- Quality Functions: ${qualityFuncs ? qualityFuncs.length : 0}
- Other Core: ${otherFuncs ? otherFuncs.length : 0}

RECOMMENDATION:
${foundFunctions.length === 0
  ? '✅ File is clean - no ATSR code found. Safe to use as Batch & Quality Engine.'
  : `⚠️  Remove ${foundFunctions.length} ATSR function(s) to create clean Batch & Quality version.`
}

═══════════════════════════════════════════════════════════════
`;

const reportPath = path.join(__dirname, '../docs/ATSR_EXTRACTION_ANALYSIS.md');
fs.writeFileSync(reportPath, report, 'utf8');
console.log(`📄 Analysis saved to: docs/ATSR_EXTRACTION_ANALYSIS.md\n`);
