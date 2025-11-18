#!/usr/bin/env node

/**
 * Enhanced System Integrity Validator
 *
 * Extends validateSystemIntegrity.cjs with additional checks:
 * - Complexity values are within 1-5 range
 * - Priority values are within 1-10 range
 * - Foundational flags match auto-flagging logic (Priority >= 8 AND Complexity <= 3)
 * - Pediatric prefix handling (PED*)
 * - Data corruption detection
 */

const fs = require('fs');
const path = require('path');

const PATHWAY_METADATA_PATH = path.join(__dirname, '..', 'AI_ENHANCED_PATHWAY_METADATA.json');
const CASE_MAPPING_PATH = path.join(__dirname, '..', 'AI_ENHANCED_CASE_ID_MAPPING.json');
const OVERVIEWS_PATH = path.join(__dirname, '..', 'AI_CASE_OVERVIEWS.json');

const EXPECTED_CATEGORY_PREFIXES = {
  'CARD': 'CARD',
  'RESP': 'RESP',
  'NEUR': 'NEUR',
  'GAST': 'GAST',
  'RENA': 'RENA',
  'ENDO': 'ENDO',
  'HEME': 'HEME',
  'MUSC': 'MUSC',
  'DERM': 'DERM',
  'INFD': 'INFD',
  'IMMU': 'IMMU',
  'OBST': 'OBST',
  'GYNE': 'GYNE',
  'TRAU': 'TRAU',
  'TOXI': 'TOXI',
  'PSYC': 'PSYC',
  'ENVI': 'ENVI',
  'MULT': 'MULT',
  'PEDS': 'PEDS' // Pediatric category
};

function loadJSON(filePath, name) {
  if (!fs.existsSync(filePath)) {
    console.error(`❌ ERROR: ${name} not found`);
    console.error(`   Expected: ${filePath}`);
    console.error(`   💡 Fix: Run 'npm run ai-enhanced' to generate missing data files`);
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    console.error(`❌ ERROR: Failed to parse ${name}: ${error.message}`);
    console.error(`   File may be corrupted or contain invalid JSON`);
    console.error(`   💡 Fix: Run 'npm run backup-metadata' then restore from a recent backup`);
    return null;
  }
}

function isPediatricPrefix(caseId) {
  // Match PED followed by 2 letters (system) and digits
  // Examples: PEDNE05, PEDRE12, PEDCA03
  return /^PED[A-Z]{2}\d+$/.test(caseId);
}

function isFoundational(complexity, priority) {
  return priority >= 8 && complexity <= 3;
}

async function enhancedValidation() {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('  🔍 ENHANCED SYSTEM INTEGRITY VALIDATION');
  console.log('═══════════════════════════════════════════════════');
  console.log('');

  let totalErrors = 0;
  let totalWarnings = 0;

  // Load all data
  console.log('📖 Loading system data...');
  const pathways = loadJSON(PATHWAY_METADATA_PATH, 'Pathway Metadata');
  const cases = loadJSON(CASE_MAPPING_PATH, 'Case Mapping');
  const overviews = loadJSON(OVERVIEWS_PATH, 'Case Overviews');

  if (!pathways || !cases || !overviews) {
    console.log('');
    console.error('❌ CRITICAL: Cannot proceed without all data files');
    process.exit(1);
  }

  console.log(`   ✅ Loaded ${Object.keys(pathways).length} pathways`);
  console.log(`   ✅ Loaded ${cases.length} cases`);
  console.log(`   ✅ Loaded ${overviews.length} overviews`);
  console.log('');

  // ============================================================
  // CHECK 1: COMPLEXITY SCORE VALIDATION
  // ============================================================
  console.log('─────────────────────────────────────────');
  console.log('1️⃣ COMPLEXITY SCORE VALIDATION');
  console.log('─────────────────────────────────────────');
  console.log('');

  const complexityIssues = [];
  cases.forEach(c => {
    const caseId = c.newId || c.oldId;
    const complexity = c.complexity;

    if (complexity === undefined) {
      complexityIssues.push({ caseId, issue: 'missing complexity score' });
    } else if (typeof complexity !== 'number') {
      complexityIssues.push({ caseId, issue: `complexity is ${typeof complexity}, expected number` });
      totalErrors++;
    } else if (complexity < 1 || complexity > 5) {
      complexityIssues.push({ caseId, issue: `complexity ${complexity} out of range (1-5)` });
      totalErrors++;
    }
  });

  if (complexityIssues.length === 0) {
    console.log('✅ All complexity scores valid (1-5 range)');
  } else {
    console.log(`⚠️  ${complexityIssues.length} complexity issues found:`);
    complexityIssues.slice(0, 10).forEach(issue => {
      console.log(`   • ${issue.caseId}: ${issue.issue}`);
    });
    if (complexityIssues.length > 10) {
      console.log(`   ... and ${complexityIssues.length - 10} more`);
    }
  }
  console.log('');

  // ============================================================
  // CHECK 2: PRIORITY SCORE VALIDATION
  // ============================================================
  console.log('─────────────────────────────────────────');
  console.log('2️⃣ PRIORITY SCORE VALIDATION');
  console.log('─────────────────────────────────────────');
  console.log('');

  const priorityIssues = [];
  cases.forEach(c => {
    const caseId = c.newId || c.oldId;
    const priority = c.priority;

    if (priority === undefined) {
      priorityIssues.push({ caseId, issue: 'missing priority score' });
    } else if (typeof priority !== 'number') {
      priorityIssues.push({ caseId, issue: `priority is ${typeof priority}, expected number` });
      totalErrors++;
    } else if (priority < 1 || priority > 10) {
      priorityIssues.push({ caseId, issue: `priority ${priority} out of range (1-10)` });
      totalErrors++;
    }
  });

  if (priorityIssues.length === 0) {
    console.log('✅ All priority scores valid (1-10 range)');
  } else {
    console.log(`⚠️  ${priorityIssues.length} priority issues found:`);
    priorityIssues.slice(0, 10).forEach(issue => {
      console.log(`   • ${issue.caseId}: ${issue.issue}`);
    });
    if (priorityIssues.length > 10) {
      console.log(`   ... and ${priorityIssues.length - 10} more`);
    }
  }
  console.log('');

  // ============================================================
  // CHECK 3: FOUNDATIONAL FLAG LOGIC CONSISTENCY
  // ============================================================
  console.log('─────────────────────────────────────────');
  console.log('3️⃣ FOUNDATIONAL FLAG CONSISTENCY');
  console.log('─────────────────────────────────────────');
  console.log('');

  const foundationalInconsistencies = [];
  cases.forEach(c => {
    const caseId = c.newId || c.oldId;
    const complexity = c.complexity;
    const priority = c.priority;
    const isFoundationalFlag = c.isFoundational === true;

    if (complexity !== undefined && priority !== undefined) {
      const shouldBeFoundational = isFoundational(complexity, priority);

      if (shouldBeFoundational !== isFoundationalFlag) {
        foundationalInconsistencies.push({
          caseId,
          current: isFoundationalFlag,
          expected: shouldBeFoundational,
          complexity,
          priority
        });
        totalErrors++;
      }
    }
  });

  if (foundationalInconsistencies.length === 0) {
    console.log('✅ All foundational flags match auto-flagging logic');
    console.log('   Rule: Priority >= 8 AND Complexity <= 3');
  } else {
    console.log(`❌ ${foundationalInconsistencies.length} foundational flag inconsistencies:`);
    foundationalInconsistencies.slice(0, 10).forEach(issue => {
      console.log(`   • ${issue.caseId}: is ${issue.current ? 'foundational' : 'advanced'}, should be ${issue.expected ? 'foundational' : 'advanced'}`);
      console.log(`     (C=${issue.complexity}, P=${issue.priority})`);
    });
    if (foundationalInconsistencies.length > 10) {
      console.log(`   ... and ${foundationalInconsistencies.length - 10} more`);
    }
    console.log('');
    console.log('💡 Fix with: npm run auto-flag-foundational');
  }
  console.log('');

  // ============================================================
  // CHECK 4: PEDIATRIC PREFIX HANDLING
  // ============================================================
  console.log('─────────────────────────────────────────');
  console.log('4️⃣ PEDIATRIC PREFIX VALIDATION');
  console.log('─────────────────────────────────────────');
  console.log('');

  const pediatricCases = [];
  cases.forEach(c => {
    const caseId = c.newId || c.oldId;
    if (isPediatricPrefix(caseId)) {
      pediatricCases.push({
        caseId,
        system: c.system
      });
    }
  });

  if (pediatricCases.length > 0) {
    console.log(`ℹ️  Found ${pediatricCases.length} pediatric cases (PED* prefix):`);

    const systemDistribution = {};
    pediatricCases.forEach(p => {
      systemDistribution[p.system] = (systemDistribution[p.system] || 0) + 1;
    });

    Object.entries(systemDistribution).forEach(([system, count]) => {
      console.log(`   • ${system}: ${count} cases`);
    });

    console.log('');
    console.log('💡 Pediatric cases use special prefix format:');
    console.log('   PED + SystemCode + Number (e.g., PEDNE05 = Pediatric Neuro case 05)');
    console.log('   This is expected behavior for pediatric cases.');
  } else {
    console.log('ℹ️  No pediatric cases found (PED* prefix)');
  }
  console.log('');

  // ============================================================
  // CHECK 5: DATA TYPE VALIDATION
  // ============================================================
  console.log('─────────────────────────────────────────');
  console.log('5️⃣ DATA TYPE VALIDATION');
  console.log('─────────────────────────────────────────');
  console.log('');

  const dataTypeIssues = [];
  cases.forEach(c => {
    const caseId = c.newId || c.oldId;

    if (c.isFoundational !== undefined && typeof c.isFoundational !== 'boolean') {
      dataTypeIssues.push({ caseId, field: 'isFoundational', type: typeof c.isFoundational });
      totalErrors++;
    }

    if (c.scenarioCount !== undefined && typeof c.scenarioCount !== 'number') {
      dataTypeIssues.push({ caseId, field: 'scenarioCount', type: typeof c.scenarioCount });
      totalWarnings++;
    }
  });

  if (dataTypeIssues.length === 0) {
    console.log('✅ All data types correct');
  } else {
    console.log(`⚠️  ${dataTypeIssues.length} data type issues:`);
    dataTypeIssues.slice(0, 10).forEach(issue => {
      console.log(`   • ${issue.caseId}: ${issue.field} is ${issue.type} (expected different type)`);
    });
    if (dataTypeIssues.length > 10) {
      console.log(`   ... and ${dataTypeIssues.length - 10} more`);
    }
  }
  console.log('');

  // ============================================================
  // FINAL SUMMARY
  // ============================================================
  console.log('═══════════════════════════════════════════════════');
  console.log('📊 VALIDATION SUMMARY');
  console.log('═══════════════════════════════════════════════════');
  console.log('');
  console.log(`Total Errors: ${totalErrors}`);
  console.log(`Total Warnings: ${totalWarnings}`);
  console.log('');

  if (totalErrors === 0 && totalWarnings === 0) {
    console.log('✅ SYSTEM INTEGRITY: EXCELLENT');
    console.log('   All validation checks passed!');
  } else if (totalErrors === 0) {
    console.log('⚠️  SYSTEM INTEGRITY: GOOD');
    console.log(`   ${totalWarnings} warnings found (non-critical)`);
  } else if (totalErrors < 10) {
    console.log('⚠️  SYSTEM INTEGRITY: FAIR');
    console.log(`   ${totalErrors} errors found (should be fixed)`);
  } else {
    console.log('❌ SYSTEM INTEGRITY: POOR');
    console.log(`   ${totalErrors} errors found (needs immediate attention)`);
  }
  console.log('');

  if (foundationalInconsistencies.length > 0) {
    console.log('🔧 RECOMMENDED FIXES:');
    console.log('   npm run auto-flag-foundational  # Fix foundational flag logic');
    console.log('   npm run validate-system         # Re-run standard validation');
    console.log('');
  }
}

if (require.main === module) {
  enhancedValidation().catch(err => {
    console.error('❌ Validation failed:', err.message);
    process.exit(1);
  });
}

module.exports = { enhancedValidation, isPediatricPrefix, isFoundational };
