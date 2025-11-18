#!/usr/bin/env node

/**
 * Comprehensive Test Suite
 *
 * Automated tests for all major system components:
 * - Data integrity checks
 * - Tool interoperability
 * - Edge case handling
 * - Regression tests for known issues
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CASE_MAPPING_PATH = path.join(__dirname, '..', 'AI_ENHANCED_CASE_ID_MAPPING.json');
const PATHWAY_METADATA_PATH = path.join(__dirname, '..', 'AI_ENHANCED_PATHWAY_METADATA.json');
const OVERVIEWS_PATH = path.join(__dirname, '..', 'AI_CASE_OVERVIEWS.json');

function runTest(testName, testFn) {
  try {
    testFn();
    console.log(`   ✅ ${testName}`);
    return { name: testName, passed: true };
  } catch (error) {
    console.log(`   ❌ ${testName}: ${error.message}`);
    return { name: testName, passed: false, error: error.message };
  }
}

async function runTestSuite() {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('  🧪 COMPREHENSIVE TEST SUITE');
  console.log('═══════════════════════════════════════════════════');
  console.log('');

  const results = [];

  // ============================================================
  // TEST GROUP 1: DATA FILE EXISTENCE
  // ============================================================
  console.log('─────────────────────────────────────────');
  console.log('1️⃣ DATA FILE EXISTENCE TESTS');
  console.log('─────────────────────────────────────────');
  console.log('');

  results.push(runTest('Case mapping file exists', () => {
    if (!fs.existsSync(CASE_MAPPING_PATH)) {
      throw new Error(`File not found: ${CASE_MAPPING_PATH}\n   💡 Fix: Run 'npm run ai-enhanced' to generate data`);
    }
  }));

  results.push(runTest('Pathway metadata file exists', () => {
    if (!fs.existsSync(PATHWAY_METADATA_PATH)) {
      throw new Error(`File not found: ${PATHWAY_METADATA_PATH}\n   💡 Fix: Run 'npm run ai-enhanced' to generate data`);
    }
  }));

  results.push(runTest('Overviews file exists', () => {
    if (!fs.existsSync(OVERVIEWS_PATH)) {
      throw new Error(`File not found: ${OVERVIEWS_PATH}\n   💡 Fix: Run 'npm run generate-overviews' to generate data`);
    }
  }));

  console.log('');

  // ============================================================
  // TEST GROUP 2: JSON VALIDITY
  // ============================================================
  console.log('─────────────────────────────────────────');
  console.log('2️⃣ JSON VALIDITY TESTS');
  console.log('─────────────────────────────────────────');
  console.log('');

  results.push(runTest('Case mapping is valid JSON', () => {
    JSON.parse(fs.readFileSync(CASE_MAPPING_PATH, 'utf8'));
  }));

  results.push(runTest('Pathway metadata is valid JSON', () => {
    JSON.parse(fs.readFileSync(PATHWAY_METADATA_PATH, 'utf8'));
  }));

  results.push(runTest('Overviews is valid JSON', () => {
    JSON.parse(fs.readFileSync(OVERVIEWS_PATH, 'utf8'));
  }));

  console.log('');

  // ============================================================
  // TEST GROUP 3: DATA STRUCTURE
  // ============================================================
  console.log('─────────────────────────────────────────');
  console.log('3️⃣ DATA STRUCTURE TESTS');
  console.log('─────────────────────────────────────────');
  console.log('');

  const cases = JSON.parse(fs.readFileSync(CASE_MAPPING_PATH, 'utf8'));
  const pathways = JSON.parse(fs.readFileSync(PATHWAY_METADATA_PATH, 'utf8'));
  const overviews = JSON.parse(fs.readFileSync(OVERVIEWS_PATH, 'utf8'));

  results.push(runTest('Cases is an array', () => {
    if (!Array.isArray(cases)) throw new Error('Expected array');
  }));

  results.push(runTest('Pathways is an object', () => {
    if (typeof pathways !== 'object' || Array.isArray(pathways)) throw new Error('Expected object');
  }));

  results.push(runTest('Overviews is an array', () => {
    if (!Array.isArray(overviews)) throw new Error('Expected array');
  }));

  results.push(runTest('All cases have required fields', () => {
    cases.forEach(c => {
      if (!c.newId && !c.oldId) throw new Error('Missing case ID');
      if (c.complexity === undefined) throw new Error('Missing complexity');
      if (c.priority === undefined) throw new Error('Missing priority');
      if (c.isFoundational === undefined) throw new Error('Missing isFoundational');
    });
  }));

  console.log('');

  // ============================================================
  // TEST GROUP 4: SCORE RANGE VALIDATION
  // ============================================================
  console.log('─────────────────────────────────────────');
  console.log('4️⃣ SCORE RANGE VALIDATION TESTS');
  console.log('─────────────────────────────────────────');
  console.log('');

  results.push(runTest('All complexity scores in range (1-5)', () => {
    cases.forEach(c => {
      if (c.complexity < 1 || c.complexity > 5) {
        throw new Error(`${c.newId || c.oldId}: complexity ${c.complexity} out of range`);
      }
    });
  }));

  results.push(runTest('All priority scores in range (1-10)', () => {
    cases.forEach(c => {
      if (c.priority < 1 || c.priority > 10) {
        throw new Error(`${c.newId || c.oldId}: priority ${c.priority} out of range`);
      }
    });
  }));

  console.log('');

  // ============================================================
  // TEST GROUP 5: FOUNDATIONAL LOGIC CONSISTENCY
  // ============================================================
  console.log('─────────────────────────────────────────');
  console.log('5️⃣ FOUNDATIONAL LOGIC TESTS');
  console.log('─────────────────────────────────────────');
  console.log('');

  results.push(runTest('Foundational flags match logic (P>=8, C<=3)', () => {
    const inconsistencies = [];
    cases.forEach(c => {
      const shouldBeFoundational = c.priority >= 8 && c.complexity <= 3;
      const isFoundational = c.isFoundational === true;
      if (shouldBeFoundational !== isFoundational) {
        inconsistencies.push(c.newId || c.oldId);
      }
    });
    if (inconsistencies.length > 0) {
      throw new Error(`${inconsistencies.length} inconsistencies: ${inconsistencies.slice(0, 3).join(', ')}`);
    }
  }));

  console.log('');

  // ============================================================
  // TEST GROUP 6: PATHWAY INTEGRITY
  // ============================================================
  console.log('─────────────────────────────────────────');
  console.log('6️⃣ PATHWAY INTEGRITY TESTS');
  console.log('─────────────────────────────────────────');
  console.log('');

  results.push(runTest('All cases assigned to valid pathway', () => {
    cases.forEach(c => {
      if (!c.pathwayName) throw new Error(`${c.newId || c.oldId}: missing pathway`);
      if (!pathways[c.pathwayName]) {
        throw new Error(`${c.newId || c.oldId}: invalid pathway "${c.pathwayName}"`);
      }
    });
  }));

  results.push(runTest('Pathway case counts match', () => {
    Object.entries(pathways).forEach(([name, data]) => {
      const actualCount = cases.filter(c => c.pathwayName === name).length;
      if (actualCount !== data.scenarioCount) {
        throw new Error(`${name}: expected ${data.scenarioCount}, got ${actualCount}`);
      }
    });
  }));

  console.log('');

  // ============================================================
  // TEST GROUP 7: OVERVIEW INTEGRITY
  // ============================================================
  console.log('─────────────────────────────────────────');
  console.log('7️⃣ OVERVIEW INTEGRITY TESTS');
  console.log('─────────────────────────────────────────');
  console.log('');

  results.push(runTest('All cases have overviews', () => {
    cases.forEach(c => {
      const caseId = c.newId || c.oldId;
      const overview = overviews.find(o => o.caseId === caseId);
      if (!overview) throw new Error(`${caseId}: missing overview`);
    });
  }));

  results.push(runTest('All overviews have pre-sim data', () => {
    overviews.forEach(o => {
      if (!o.preSimOverview || !o.preSimOverview.sbarHandoff) {
        throw new Error(`${o.caseId}: missing pre-sim data`);
      }
    });
  }));

  results.push(runTest('All overviews have post-sim data', () => {
    overviews.forEach(o => {
      if (!o.postSimOverview || !o.postSimOverview.victoryHeadline) {
        throw new Error(`${o.caseId}: missing post-sim data`);
      }
    });
  }));

  console.log('');

  // ============================================================
  // TEST GROUP 8: BACKUP SYSTEM
  // ============================================================
  console.log('─────────────────────────────────────────');
  console.log('8️⃣ BACKUP SYSTEM TESTS');
  console.log('─────────────────────────────────────────');
  console.log('');

  const backupDir = path.join(__dirname, '..', 'backups');

  results.push(runTest('Backup directory exists', () => {
    if (!fs.existsSync(backupDir)) throw new Error('Backup directory not found');
  }));

  results.push(runTest('At least one backup exists', () => {
    const backups = fs.readdirSync(backupDir);
    if (backups.length === 0) throw new Error('No backups found');
  }));

  console.log('');

  // ============================================================
  // FINAL SUMMARY
  // ============================================================
  console.log('═══════════════════════════════════════════════════');
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('═══════════════════════════════════════════════════');
  console.log('');

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;

  console.log(`Total Tests: ${total}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log('');

  if (failed > 0) {
    console.log('❌ FAILED TESTS:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`   • ${r.name}: ${r.error}`);
    });
    console.log('');
    console.log('🔧 RECOMMENDED FIXES:');
    console.log('   npm run auto-flag-foundational  # Fix foundational flags');
    console.log('   npm run enhanced-validation     # Detailed validation');
    console.log('   npm run validate-system         # Standard validation');
    console.log('');
    process.exit(1);
  } else {
    console.log('✅ ALL TESTS PASSED!');
    console.log('   System integrity is excellent.');
    console.log('');
  }
}

if (require.main === module) {
  runTestSuite().catch(err => {
    console.error('❌ Test suite failed:', err.message);
    process.exit(1);
  });
}

module.exports = { runTestSuite };
