#!/usr/bin/env node

/**
 * System Integrity Validator
 *
 * Validates the complete case organization system:
 * - All cases have overviews
 * - Categories match Case_ID prefixes
 * - Pathways contain expected cases
 * - JSON structure is valid
 * - No orphaned or duplicate cases
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
  'MULT': 'MULT'
};

function loadJSON(filePath, name) {
  if (!fs.existsSync(filePath)) {
    console.error(`❌ ERROR: ${name} not found at ${filePath}`);
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    console.error(`❌ ERROR: Failed to parse ${name}: ${error.message}`);
    return null;
  }
}

function validateOverviewStructure(overview, caseId, type) {
  const errors = [];

  if (type === 'pre-sim') {
    if (!overview.sbarHandoff) errors.push('Missing sbarHandoff');
    if (!overview.theStakes) errors.push('Missing theStakes');
    if (!overview.mysteryHook) errors.push('Missing mysteryHook');
    if (!overview.whatYouWillLearn || !Array.isArray(overview.whatYouWillLearn)) {
      errors.push('Missing or invalid whatYouWillLearn array');
    }
    if (!overview.estimatedTime) errors.push('Missing estimatedTime');
  } else if (type === 'post-sim') {
    if (!overview.victoryHeadline) errors.push('Missing victoryHeadline');
    if (!overview.patientStoryAnchor) errors.push('Missing patientStoryAnchor');
    if (!overview.theCriticalPearl) errors.push('Missing theCriticalPearl');
    if (!overview.whatYouMastered || !Array.isArray(overview.whatYouMastered)) {
      errors.push('Missing or invalid whatYouMastered array');
    }
  }

  return errors;
}

async function validate() {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('  🔍 SYSTEM INTEGRITY VALIDATION');
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

  // Validation 1: Overview Coverage
  console.log('─────────────────────────────────────────');
  console.log('1️⃣ VALIDATING OVERVIEW COVERAGE');
  console.log('─────────────────────────────────────────');
  console.log('');

  const overviewMap = new Map();
  overviews.forEach(o => overviewMap.set(o.caseId, o));

  const missingOverviews = [];
  cases.forEach(c => {
    const caseId = c.caseId || c.newId || c.oldId;
    if (!overviewMap.has(caseId)) {
      missingOverviews.push(caseId);
    }
  });

  if (missingOverviews.length === 0) {
    console.log('✅ All cases have overviews');
  } else {
    console.error(`❌ ${missingOverviews.length} cases missing overviews:`);
    missingOverviews.slice(0, 10).forEach(id => console.error(`   - ${id}`));
    if (missingOverviews.length > 10) {
      console.error(`   ... and ${missingOverviews.length - 10} more`);
    }
    totalErrors += missingOverviews.length;
  }
  console.log('');

  // Validation 2: Category-CaseID Consistency
  console.log('─────────────────────────────────────────');
  console.log('2️⃣ VALIDATING CATEGORY-CASEID CONSISTENCY');
  console.log('─────────────────────────────────────────');
  console.log('');

  const categoryMismatches = [];
  cases.forEach(c => {
    const caseId = c.caseId || c.newId;
    const category = c.system;

    if (!caseId || !category) return;

    // Extract prefix from Case_ID
    const prefix = caseId.startsWith('PED') ?
      caseId.substring(3, caseId.length).replace(/[0-9]/g, '') :
      caseId.replace(/[0-9]/g, '');

    const expectedPrefix = EXPECTED_CATEGORY_PREFIXES[category];

    if (expectedPrefix && prefix !== expectedPrefix) {
      categoryMismatches.push({
        caseId,
        category,
        prefix,
        expected: expectedPrefix
      });
    }
  });

  if (categoryMismatches.length === 0) {
    console.log('✅ All categories match Case_ID prefixes');
  } else {
    console.warn(`⚠️  ${categoryMismatches.length} category mismatches found:`);
    categoryMismatches.slice(0, 5).forEach(m => {
      console.warn(`   - ${m.caseId}: Category=${m.category}, Prefix=${m.prefix}, Expected=${m.expected}`);
    });
    if (categoryMismatches.length > 5) {
      console.warn(`   ... and ${categoryMismatches.length - 5} more`);
    }
    totalWarnings += categoryMismatches.length;
  }
  console.log('');

  // Validation 3: Pathway Case Counts
  console.log('─────────────────────────────────────────');
  console.log('3️⃣ VALIDATING PATHWAY CASE COUNTS');
  console.log('─────────────────────────────────────────');
  console.log('');

  const pathwayCountMismatches = [];
  Object.entries(pathways).forEach(([name, data]) => {
    const actualCases = cases.filter(c => c.pathwayName === name);
    const expectedCount = data.scenarioCount;
    const actualCount = actualCases.length;

    if (expectedCount !== actualCount) {
      pathwayCountMismatches.push({
        name,
        expected: expectedCount,
        actual: actualCount,
        diff: actualCount - expectedCount
      });
    }
  });

  if (pathwayCountMismatches.length === 0) {
    console.log('✅ All pathway case counts match');
  } else {
    console.warn(`⚠️  ${pathwayCountMismatches.length} pathway count mismatches:`);
    pathwayCountMismatches.forEach(m => {
      console.warn(`   - ${m.name}: Expected=${m.expected}, Actual=${m.actual}, Diff=${m.diff > 0 ? '+' : ''}${m.diff}`);
    });
    totalWarnings += pathwayCountMismatches.length;
  }
  console.log('');

  // Validation 4: Overview JSON Structure
  console.log('─────────────────────────────────────────');
  console.log('4️⃣ VALIDATING OVERVIEW JSON STRUCTURE');
  console.log('─────────────────────────────────────────');
  console.log('');

  const structureErrors = [];
  overviews.forEach(o => {
    const caseId = o.caseId;

    // Validate pre-sim
    const preSimErrors = validateOverviewStructure(o.preSimOverview, caseId, 'pre-sim');
    if (preSimErrors.length > 0) {
      structureErrors.push({
        caseId,
        type: 'pre-sim',
        errors: preSimErrors
      });
    }

    // Validate post-sim
    const postSimErrors = validateOverviewStructure(o.postSimOverview, caseId, 'post-sim');
    if (postSimErrors.length > 0) {
      structureErrors.push({
        caseId,
        type: 'post-sim',
        errors: postSimErrors
      });
    }
  });

  if (structureErrors.length === 0) {
    console.log('✅ All overviews have valid structure');
  } else {
    console.error(`❌ ${structureErrors.length} structure errors found:`);
    structureErrors.slice(0, 5).forEach(e => {
      console.error(`   - ${e.caseId} (${e.type}): ${e.errors.join(', ')}`);
    });
    if (structureErrors.length > 5) {
      console.error(`   ... and ${structureErrors.length - 5} more`);
    }
    totalErrors += structureErrors.length;
  }
  console.log('');

  // Validation 5: Duplicate Case IDs
  console.log('─────────────────────────────────────────');
  console.log('5️⃣ CHECKING FOR DUPLICATE CASE IDS');
  console.log('─────────────────────────────────────────');
  console.log('');

  const caseIdCounts = {};
  cases.forEach(c => {
    const caseId = c.caseId || c.newId;
    if (caseId) {
      caseIdCounts[caseId] = (caseIdCounts[caseId] || 0) + 1;
    }
  });

  const duplicates = Object.entries(caseIdCounts).filter(([id, count]) => count > 1);

  if (duplicates.length === 0) {
    console.log('✅ No duplicate Case IDs found');
  } else {
    console.error(`❌ ${duplicates.length} duplicate Case IDs found:`);
    duplicates.forEach(([id, count]) => {
      console.error(`   - ${id}: ${count} occurrences`);
    });
    totalErrors += duplicates.length;
  }
  console.log('');

  // Validation 6: Orphaned Cases
  console.log('─────────────────────────────────────────');
  console.log('6️⃣ CHECKING FOR ORPHANED CASES');
  console.log('─────────────────────────────────────────');
  console.log('');

  const pathwayNames = new Set(Object.keys(pathways));
  const orphanedCases = cases.filter(c => !pathwayNames.has(c.pathwayName));

  if (orphanedCases.length === 0) {
    console.log('✅ No orphaned cases found');
  } else {
    console.warn(`⚠️  ${orphanedCases.length} cases not assigned to valid pathways:`);
    orphanedCases.slice(0, 5).forEach(c => {
      console.warn(`   - ${c.caseId}: Pathway="${c.pathwayName}"`);
    });
    if (orphanedCases.length > 5) {
      console.warn(`   ... and ${orphanedCases.length - 5} more`);
    }
    totalWarnings += orphanedCases.length;
  }
  console.log('');

  // Summary
  console.log('═══════════════════════════════════════════════════');
  console.log('VALIDATION SUMMARY');
  console.log('═══════════════════════════════════════════════════');
  console.log('');
  console.log(`Total Errors: ${totalErrors}`);
  console.log(`Total Warnings: ${totalWarnings}`);
  console.log('');

  if (totalErrors === 0 && totalWarnings === 0) {
    console.log('✅ SYSTEM INTEGRITY: EXCELLENT');
    console.log('   All validations passed! System is healthy.');
  } else if (totalErrors === 0) {
    console.log('⚠️  SYSTEM INTEGRITY: GOOD');
    console.log(`   No critical errors, but ${totalWarnings} warnings to review.`);
  } else {
    console.log('❌ SYSTEM INTEGRITY: NEEDS ATTENTION');
    console.log(`   ${totalErrors} errors and ${totalWarnings} warnings found.`);
    console.log('');
    console.log('💡 Recommended Actions:');
    if (missingOverviews.length > 0) {
      console.log('   - Run: npm run generate-overviews');
    }
    if (structureErrors.length > 0) {
      console.log('   - Review overview JSON structure');
    }
    if (duplicates.length > 0) {
      console.log('   - Remove duplicate Case IDs from mapping file');
    }
  }
  console.log('');

  process.exit(totalErrors > 0 ? 1 : 0);
}

if (require.main === module) {
  validate().catch(err => {
    console.error('❌ Validation failed:', err.message);
    process.exit(1);
  });
}

module.exports = { validate };
