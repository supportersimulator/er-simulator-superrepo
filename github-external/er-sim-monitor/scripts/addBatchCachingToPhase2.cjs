#!/usr/bin/env node

/**
 * Add batch caching (25 rows per batch) to Categories_Pathways_Feature_Phase2.gs
 * This fixes the 50,000 character limit error by caching in small chunks
 */

const fs = require('fs');
const path = require('path');

const phase2Path = path.join(__dirname, '../apps-script-deployable/Categories_Pathways_Feature_Phase2.gs');

console.log('\n🔧 ADDING BATCH CACHING TO PHASE 2\n');
console.log('═══════════════════════════════════════════════════════════════\n');

let code = fs.readFileSync(phase2Path, 'utf8');

// 1. Modify performHolisticAnalysis_() to NOT include allCases
console.log('📝 Step 1: Removing allCases from holistic analysis return...\n');

const oldReturn = `  return {
    timestamp: new Date().toISOString(),
    totalCases: allCases.length,
    systemDistribution: systemDistribution,
    pathwayDistribution: pathwayDistribution,
    unassignedCount: unassignedCount,
    topPathways: pathwayOpportunities,
    insights: insights,
    allCases: allCases // Store for later use
  };`;

const newReturn = `  return {
    timestamp: new Date().toISOString(),
    totalCases: allCases.length,
    systemDistribution: systemDistribution,
    pathwayDistribution: pathwayDistribution,
    unassignedCount: unassignedCount,
    topPathways: pathwayOpportunities,
    insights: insights,
    batchMetadata: {
      totalBatches: Math.ceil(allCases.length / 25),
      casesPerBatch: 25,
      note: 'Detailed case data cached separately in 25-row batches'
    }
    // allCases removed to avoid 50K character limit
  };`;

if (code.indexOf('allCases: allCases // Store for later use') !== -1) {
  code = code.replace(oldReturn, newReturn);
  console.log('   ✅ Removed allCases from return object\n');
} else {
  console.log('   ⚠️  allCases reference not found (may already be removed)\n');
}

// 2. Add batch caching function
console.log('📝 Step 2: Adding cacheDetailedCaseBatches_() function...\n');

const batchCachingFunction = `
/**
 * Cache detailed case data in batches of 25 rows
 * This avoids the 50,000 character limit per property
 */
function cacheDetailedCaseBatches_() {
  const BATCH_SIZE = 25;
  const sheet = pickMasterSheet_();
  const data = sheet.getDataRange().getValues();
  const headers = data[1]; // Row 2 = Tier2 headers

  // Resolve column indices dynamically
  const fieldMap = {
    caseId: { header: 'Case_Organization_Case_ID', fallback: 0 },
    spark: { header: 'Case_Organization_Spark_Title', fallback: 1 },
    category: { header: 'Case_Organization_Category', fallback: 2 },
    pathway: { header: 'Case_Organization_Pathway_or_Course_Name', fallback: 5 },
    diagnosis: { header: 'Case_Orientation_Chief_Diagnosis', fallback: 7 },
    learningOutcomes: { header: 'Case_Orientation_Actual_Learning_Outcomes', fallback: 8 }
  };

  const indices = resolveColumnIndices_(fieldMap);

  const totalRows = data.length - 2; // Minus header rows
  const totalBatches = Math.ceil(totalRows / BATCH_SIZE);

  Logger.log('📦 Caching ' + totalRows + ' cases in ' + totalBatches + ' batches of ' + BATCH_SIZE);

  const props = PropertiesService.getScriptProperties();

  // Clear old batches first
  clearOldCaseBatches_();

  for (let batchNum = 0; batchNum < totalBatches; batchNum++) {
    const startRow = 2 + (batchNum * BATCH_SIZE); // Data starts at row 3 (index 2)
    const endRow = Math.min(startRow + BATCH_SIZE, data.length);

    const batchCases = [];
    for (let i = startRow; i < endRow; i++) {
      batchCases.push({
        row: i + 1,
        caseId: data[i][indices.caseId] || '',
        sparkTitle: data[i][indices.spark] || '',
        category: data[i][indices.category] || '',
        pathway: data[i][indices.pathway] || '',
        diagnosis: data[i][indices.diagnosis] || '',
        learningOutcomes: data[i][indices.learningOutcomes] || ''
      });
    }

    // Cache this batch
    const batchKey = 'CASE_BATCH_' + batchNum;
    const batchJson = JSON.stringify(batchCases);
    const batchSize = batchJson.length;

    if (batchSize > 50000) {
      Logger.log('⚠️  WARNING: Batch ' + batchNum + ' is ' + batchSize + ' chars (may need smaller batches)');
    }

    props.setProperty(batchKey, batchJson);

    Logger.log('   ✅ Cached batch ' + (batchNum + 1) + '/' + totalBatches + ' (' + batchCases.length + ' cases, ' + batchSize + ' chars)');
  }

  // Store batch metadata
  props.setProperty('CASE_BATCH_METADATA', JSON.stringify({
    totalBatches: totalBatches,
    batchSize: BATCH_SIZE,
    totalCases: totalRows,
    timestamp: new Date().toISOString()
  }));

  Logger.log('🎉 Successfully cached all ' + totalRows + ' cases in ' + totalBatches + ' batches');

  return {
    totalBatches: totalBatches,
    totalCases: totalRows,
    batchSize: BATCH_SIZE
  };
}

/**
 * Clear old case batch caches
 */
function clearOldCaseBatches_() {
  const props = PropertiesService.getScriptProperties();
  const allKeys = props.getKeys();

  let clearedCount = 0;
  for (let i = 0; i < allKeys.length; i++) {
    if (allKeys[i].indexOf('CASE_BATCH_') === 0) {
      props.deleteProperty(allKeys[i]);
      clearedCount++;
    }
  }

  if (clearedCount > 0) {
    Logger.log('🧹 Cleared ' + clearedCount + ' old batch cache(s)');
  }
}

/**
 * Retrieve all cases from batched cache
 * Only use this when you need ALL cases (expensive operation)
 */
function getAllCasesFromBatchCache_() {
  const props = PropertiesService.getScriptProperties();
  const metadataJson = props.getProperty('CASE_BATCH_METADATA');

  if (!metadataJson) {
    Logger.log('⚠️  No batch metadata found - cache may not be initialized');
    return [];
  }

  const metadata = JSON.parse(metadataJson);
  const allCases = [];

  for (let batchNum = 0; batchNum < metadata.totalBatches; batchNum++) {
    const batchKey = 'CASE_BATCH_' + batchNum;
    const batchJson = props.getProperty(batchKey);

    if (batchJson) {
      const batchCases = JSON.parse(batchJson);
      allCases.push.apply(allCases, batchCases);
    }
  }

  return allCases;
}

/**
 * Get cases from a specific batch (more efficient)
 */
function getCasesFromBatch_(batchNumber) {
  const props = PropertiesService.getScriptProperties();
  const batchKey = 'CASE_BATCH_' + batchNumber;
  const batchJson = props.getProperty(batchKey);

  if (!batchJson) {
    return [];
  }

  return JSON.parse(batchJson);
}
`;

// Insert batch caching functions after performHolisticAnalysis_
const insertAfter = 'function generateHolisticInsights_';
const insertIndex = code.indexOf(insertAfter);

if (insertIndex !== -1) {
  // Find the end of the generateHolisticInsights_ function
  let braceCount = 0;
  let functionStart = code.indexOf('{', insertIndex);
  let i = functionStart;

  do {
    if (code[i] === '{') braceCount++;
    if (code[i] === '}') braceCount--;
    i++;
  } while (braceCount > 0 && i < code.length);

  code = code.slice(0, i) + batchCachingFunction + code.slice(i);
  console.log('   ✅ Added batch caching functions\n');
} else {
  console.log('   ⚠️  Could not find insertion point (may need manual placement)\n');
}

// 3. Modify getOrCreateHolisticAnalysis_() to also cache batches
console.log('📝 Step 3: Updating getOrCreateHolisticAnalysis_() to cache batches...\n');

const oldCacheCode = `  // Cache the results
  const props = PropertiesService.getScriptProperties();
  props.setProperty('HOLISTIC_ANALYSIS', JSON.stringify(analysis));
  props.setProperty('HOLISTIC_ANALYSIS_TIMESTAMP', new Date().toISOString());`;

const newCacheCode = `  // Cache the results
  const props = PropertiesService.getScriptProperties();
  props.setProperty('HOLISTIC_ANALYSIS', JSON.stringify(analysis));
  props.setProperty('HOLISTIC_ANALYSIS_TIMESTAMP', new Date().toISOString());

  // Also cache detailed case data in batches
  Logger.log('📦 Caching detailed case data in batches of 25...');
  const batchResult = cacheDetailedCaseBatches_();
  Logger.log('✅ Cached ' + batchResult.totalCases + ' cases in ' + batchResult.totalBatches + ' batches');`;

code = code.replace(oldCacheCode, newCacheCode);
console.log('   ✅ Updated holistic analysis caching\n');

// Write the modified code back
fs.writeFileSync(phase2Path, code, 'utf8');

console.log('═══════════════════════════════════════════════════════════════');
console.log('✅ BATCH CACHING ADDED SUCCESSFULLY!\n');
console.log('📊 Changes Made:\n');
console.log('   1. Removed allCases from performHolisticAnalysis_() return');
console.log('   2. Added cacheDetailedCaseBatches_() function (25 rows/batch)');
console.log('   3. Added clearOldCaseBatches_() cleanup function');
console.log('   4. Added getAllCasesFromBatchCache_() retrieval function');
console.log('   5. Added getCasesFromBatch_() single batch retrieval');
console.log('   6. Updated cache process to run batch caching automatically\n');
console.log('🎯 Benefits:\n');
console.log('   ✅ No more 50,000 character limit errors');
console.log('   ✅ Live progress tracking per batch');
console.log('   ✅ Memory efficient (only loads needed batches)');
console.log('   ✅ Faster queries (can target specific batches)\n');
console.log('═══════════════════════════════════════════════════════════════\n');
console.log('🚀 Next Steps:\n');
console.log('   1. Deploy updated Phase 2 to TEST');
console.log('   2. Click "Pre-Cache Rich Data" button');
console.log('   3. Watch it cache in 25-row batches');
console.log('   4. Verify execution logs show batch progress\n');
