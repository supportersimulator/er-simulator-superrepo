#!/usr/bin/env node

/**
 * Enhance batch caching with ultra-detailed logging
 * Makes it easy to copy execution logs and diagnose any issues
 */

const fs = require('fs');
const path = require('path');

const phase2Path = path.join(__dirname, '../apps-script-deployable/Categories_Pathways_Feature_Phase2.gs');

console.log('\n📊 ENHANCING BATCH CACHING LOGGING\n');
console.log('═══════════════════════════════════════════════════════════════\n');

let code = fs.readFileSync(phase2Path, 'utf8');

// 1. Enhance cacheDetailedCaseBatches_() with detailed logging
console.log('📝 Adding detailed batch progress logging...\n');

const oldBatchLogging = `  for (let batchNum = 0; batchNum < totalBatches; batchNum++) {
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
  }`;

const newBatchLogging = `  for (let batchNum = 0; batchNum < totalBatches; batchNum++) {
    const batchStartTime = new Date();
    const startRow = 2 + (batchNum * BATCH_SIZE); // Data starts at row 3 (index 2)
    const endRow = Math.min(startRow + BATCH_SIZE, data.length);

    Logger.log('');
    Logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    Logger.log('📦 BATCH ' + (batchNum + 1) + '/' + totalBatches);
    Logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    Logger.log('📍 Row Range: ' + (startRow + 1) + ' → ' + endRow);
    Logger.log('⏱️  Start Time: ' + batchStartTime.toISOString());

    const batchCases = [];
    for (let i = startRow; i < endRow; i++) {
      const caseData = {
        row: i + 1,
        caseId: data[i][indices.caseId] || '',
        sparkTitle: data[i][indices.spark] || '',
        category: data[i][indices.category] || '',
        pathway: data[i][indices.pathway] || '',
        diagnosis: data[i][indices.diagnosis] || '',
        learningOutcomes: data[i][indices.learningOutcomes] || ''
      };
      batchCases.push(caseData);

      // Log first and last case of each batch for verification
      if (i === startRow || i === endRow - 1) {
        Logger.log('   ' + (i === startRow ? '⬆️  First' : '⬇️  Last') + ' case: ' + caseData.caseId + ' - ' + caseData.sparkTitle.substring(0, 40));
      }
    }

    // Cache this batch
    const batchKey = 'CASE_BATCH_' + batchNum;
    const batchJson = JSON.stringify(batchCases);
    const batchSize = batchJson.length;

    Logger.log('📏 Batch Size: ' + batchCases.length + ' cases');
    Logger.log('💾 JSON Size: ' + batchSize + ' characters (' + Math.round(batchSize / 1024) + ' KB)');

    if (batchSize > 50000) {
      Logger.log('⚠️  WARNING: Batch exceeds 50K limit! (' + batchSize + ' chars)');
      Logger.log('   Consider reducing BATCH_SIZE below 25');
    } else if (batchSize > 40000) {
      Logger.log('⚠️  CAUTION: Batch approaching limit (' + batchSize + '/50000 chars)');
    } else {
      Logger.log('✅ Size OK: ' + Math.round((batchSize / 50000) * 100) + '% of limit');
    }

    props.setProperty(batchKey, batchJson);

    const batchEndTime = new Date();
    const batchDuration = batchEndTime - batchStartTime;

    Logger.log('🔑 Cache Key: ' + batchKey);
    Logger.log('⏱️  Duration: ' + batchDuration + 'ms');
    Logger.log('✅ BATCH ' + (batchNum + 1) + '/' + totalBatches + ' CACHED SUCCESSFULLY');

    // Progress indicator
    const percentComplete = Math.round(((batchNum + 1) / totalBatches) * 100);
    const progressBar = '█'.repeat(Math.floor(percentComplete / 5)) + '░'.repeat(20 - Math.floor(percentComplete / 5));
    Logger.log('📊 Progress: [' + progressBar + '] ' + percentComplete + '%');
  }`;

code = code.replace(oldBatchLogging, newBatchLogging);
console.log('   ✅ Enhanced batch logging with detailed metrics\n');

// 2. Add start banner to cacheDetailedCaseBatches_()
const oldBatchStart = `  Logger.log('📦 Caching ' + totalRows + ' cases in ' + totalBatches + ' batches of ' + BATCH_SIZE);`;

const newBatchStart = `  Logger.log('');
  Logger.log('╔═══════════════════════════════════════════════════════════════╗');
  Logger.log('║            📦 BATCH CACHING DETAILED CASE DATA               ║');
  Logger.log('╚═══════════════════════════════════════════════════════════════╝');
  Logger.log('');
  Logger.log('🎯 Configuration:');
  Logger.log('   • Total Cases: ' + totalRows);
  Logger.log('   • Total Batches: ' + totalBatches);
  Logger.log('   • Cases per Batch: ' + BATCH_SIZE);
  Logger.log('   • Character Limit: 50,000 per batch');
  Logger.log('   • Expected Size: ~' + Math.round((totalRows / BATCH_SIZE) * 4) + ' KB total');
  Logger.log('');`;

code = code.replace(oldBatchStart, newBatchStart);
console.log('   ✅ Added configuration banner\n');

// 3. Add completion summary
const oldBatchEnd = `  Logger.log('🎉 Successfully cached all ' + totalRows + ' cases in ' + totalBatches + ' batches');`;

const newBatchEnd = `  Logger.log('');
  Logger.log('╔═══════════════════════════════════════════════════════════════╗');
  Logger.log('║                  🎉 BATCH CACHING COMPLETE                   ║');
  Logger.log('╚═══════════════════════════════════════════════════════════════╝');
  Logger.log('');
  Logger.log('📊 Summary:');
  Logger.log('   ✅ Total Cases Cached: ' + totalRows);
  Logger.log('   ✅ Total Batches: ' + totalBatches);
  Logger.log('   ✅ Batch Size: ' + BATCH_SIZE + ' cases per batch');
  Logger.log('   ✅ Cache Keys: CASE_BATCH_0 through CASE_BATCH_' + (totalBatches - 1));
  Logger.log('');
  Logger.log('🔍 To retrieve data:');
  Logger.log('   • All cases: getAllCasesFromBatchCache_()');
  Logger.log('   • Single batch: getCasesFromBatch_(batchNumber)');
  Logger.log('   • Metadata: PropertiesService.getScriptProperties().getProperty("CASE_BATCH_METADATA")');
  Logger.log('');`;

code = code.replace(oldBatchEnd, newBatchEnd);
console.log('   ✅ Added completion summary\n');

// 4. Enhance getOrCreateHolisticAnalysis_() logging
const oldHolisticLog = `  // Also cache detailed case data in batches
  Logger.log('📦 Caching detailed case data in batches of 25...');
  const batchResult = cacheDetailedCaseBatches_();
  Logger.log('✅ Cached ' + batchResult.totalCases + ' cases in ' + batchResult.totalBatches + ' batches');`;

const newHolisticLog = `  // Also cache detailed case data in batches
  Logger.log('');
  Logger.log('▶️  PHASE 2: Caching detailed case data in batches...');
  Logger.log('');
  const batchResult = cacheDetailedCaseBatches_();
  Logger.log('');
  Logger.log('✅ PHASE 2 COMPLETE: Cached ' + batchResult.totalCases + ' cases in ' + batchResult.totalBatches + ' batches');
  Logger.log('');`;

code = code.replace(oldHolisticLog, newHolisticLog);
console.log('   ✅ Enhanced holistic analysis logging\n');

// 5. Add header refresh logging details
const oldHeaderLog = `  // Refresh headers before generating fresh analysis
  Logger.log('🔄 Refreshing headers before holistic analysis...');
  try {
    refreshHeaders();
  } catch (e) {
    Logger.log('⚠️  Could not refresh headers: ' + e.message);
  }`;

const newHeaderLog = `  // Refresh headers before generating fresh analysis
  Logger.log('');
  Logger.log('╔═══════════════════════════════════════════════════════════════╗');
  Logger.log('║           🔄 PHASE 1: REFRESHING HEADER CACHE                ║');
  Logger.log('╚═══════════════════════════════════════════════════════════════╝');
  Logger.log('');
  Logger.log('🎯 Purpose: Map all 23-26 column indices dynamically');
  Logger.log('🔑 Cache Key: CACHED_HEADER2');
  Logger.log('');
  try {
    refreshHeaders();
    Logger.log('✅ PHASE 1 COMPLETE: Headers refreshed successfully');
  } catch (e) {
    Logger.log('❌ PHASE 1 FAILED: Could not refresh headers');
    Logger.log('⚠️  Error: ' + e.message);
  }
  Logger.log('');`;

code = code.replace(oldHeaderLog, newHeaderLog);
console.log('   ✅ Enhanced header refresh logging\n');

// Write back
fs.writeFileSync(phase2Path, code, 'utf8');

console.log('═══════════════════════════════════════════════════════════════');
console.log('✅ ENHANCED LOGGING COMPLETE!\n');
console.log('📊 Improvements Added:\n');
console.log('   1. ASCII art banners for each phase');
console.log('   2. Detailed batch metrics (size, duration, progress)');
console.log('   3. Progress bars showing completion percentage');
console.log('   4. First/last case verification for each batch');
console.log('   5. Character limit warnings (>40K caution, >50K error)');
console.log('   6. Configuration summary at start');
console.log('   7. Completion summary with retrieval instructions\n');
console.log('📋 Example Log Output:\n');
console.log('═══════════════════════════════════════════════════════════════');
console.log('╔═══════════════════════════════════════════════════════════════╗');
console.log('║           🔄 PHASE 1: REFRESHING HEADER CACHE                ║');
console.log('╚═══════════════════════════════════════════════════════════════╝');
console.log('');
console.log('🎯 Purpose: Map all 23-26 column indices dynamically');
console.log('✅ PHASE 1 COMPLETE: Headers refreshed successfully');
console.log('');
console.log('╔═══════════════════════════════════════════════════════════════╗');
console.log('║            📦 BATCH CACHING DETAILED CASE DATA               ║');
console.log('╚═══════════════════════════════════════════════════════════════╝');
console.log('');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📦 BATCH 1/20');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📍 Row Range: 3 → 28');
console.log('📏 Batch Size: 25 cases');
console.log('💾 JSON Size: 4523 characters (4 KB)');
console.log('✅ Size OK: 9% of limit');
console.log('🔑 Cache Key: CASE_BATCH_0');
console.log('⏱️  Duration: 245ms');
console.log('✅ BATCH 1/20 CACHED SUCCESSFULLY');
console.log('📊 Progress: [█░░░░░░░░░░░░░░░░░░░] 5%');
console.log('');
console.log('... (continues for each batch) ...');
console.log('');
console.log('╔═══════════════════════════════════════════════════════════════╗');
console.log('║                  🎉 BATCH CACHING COMPLETE                   ║');
console.log('╚═══════════════════════════════════════════════════════════════╝');
console.log('═══════════════════════════════════════════════════════════════\n');
console.log('🎯 Benefits:\n');
console.log('   ✅ Easy to copy entire log output');
console.log('   ✅ Clear visual separation between phases');
console.log('   ✅ Detailed metrics for debugging');
console.log('   ✅ Progress tracking in real-time');
console.log('   ✅ Character limit warnings before errors occur\n');
