#!/usr/bin/env node

/**
 * Process Scenarios Using OpenAI Batch API
 *
 * High-performance batch processing for 100-1000+ scenarios
 * Uses OpenAI Batch API for 50% cost reduction and 24-hour window
 *
 * Performance vs Standard API:
 * - Cost: 50% cheaper ($305-425 vs $610-850 for 1000 scenarios)
 * - Speed: Process overnight (2-24 hours vs 5-10 hours active processing)
 * - Rate limits: None (vs hitting quotas with standard API)
 * - Reliability: Built-in retry (vs manual retry logic needed)
 *
 * Usage:
 *   node scripts/processBatchWithOpenAI.cjs --rows=10-100
 *   node scripts/processBatchWithOpenAI.cjs --rows=10-100 --dry-run
 *   node scripts/processBatchWithOpenAI.cjs --rows=10-100 --poll-interval=300000
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config();

const {
  batchReadVitals,
  batchReadCaseContext,
  batchWriteVitals,
  batchUpdateProgress
} = require('./lib/batchSheetsOps.cjs');

const {
  processBatch,
  estimateBatchCost,
  getBatchStatus,
  downloadBatchResults
} = require('./lib/openAIBatchAPI.cjs');

const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');

// Parse row range
const rowsArg = args.find(arg => arg.startsWith('--rows'));
let rowRange = null;
if (rowsArg) {
  const range = rowsArg.split('=')[1];
  if (range.includes('-')) {
    const [start, end] = range.split('-').map(Number);
    rowRange = Array.from({ length: end - start + 1 }, (_, i) => start + i);
  } else {
    rowRange = range.split(',').map(Number);
  }
}

// Poll interval (default: 5 minutes)
const pollIntervalArg = args.find(arg => arg.startsWith('--poll-interval'));
const pollInterval = pollIntervalArg ? parseInt(pollIntervalArg.split('=')[1]) : 300000;

/**
 * Build system prompt (static, will be reused across all requests)
 */
function buildSystemPrompt() {
  return `You are an expert medical simulation scenario designer for emergency medicine training.

Your task is to convert medical case information into structured vitals JSON format for a patient monitor simulator.

## Output Format

You must output valid JSON with the following structure:

{
  "Initial_Vitals": {
    "HR": <number 0-300>,
    "BP": "<systolic>/<diastolic>",
    "SpO2": <number 0-100>,
    "RR": <number 0-60>,
    "Temp": <number 30-45 in Celsius>,
    "EtCO2": <number 0-100>,
    "waveform": "<canonical_waveform_name>"
  },
  "State1_Vitals": { ... },
  "State2_Vitals": { ... },
  "State3_Vitals": { ... }
}

## Waveform Names (MUST end with _ecg)

Valid options:
- sinus_ecg, sinus_brady_ecg, sinus_tachy_ecg
- afib_ecg, aflutter_ecg, afib_rvr_ecg
- vtach_ecg, vfib_ecg, svt_ecg
- pea_ecg, asystole_ecg
- first_degree_block_ecg, second_degree_type1_ecg, second_degree_type2_ecg, third_degree_block_ecg
- rbbb_ecg, lbbb_ecg
- stemi_anterior_ecg, stemi_inferior_ecg, stemi_lateral_ecg, stemi_posterior_ecg
- nstemi_ecg, pericarditis_ecg
- hyperkalemia_ecg, hypokalemia_ecg

## Clinical Rules

1. All vitals must be medically plausible
2. Systolic BP > Diastolic BP
3. Cardiac arrest rhythms (asystole, vfib, pea) → HR=0, RR=0
4. Waveform must match clinical picture
5. State progression must be logical (improving or deteriorating)

## Example

Input: 45M chest pain, diaphoresis, HR 110, BP 160/95, SpO2 94%

Output:
{
  "Initial_Vitals": {
    "HR": 110,
    "BP": "160/95",
    "SpO2": 94,
    "RR": 22,
    "Temp": 37.2,
    "EtCO2": 32,
    "waveform": "stemi_anterior_ecg"
  }
}`;
}

/**
 * Build user prompt for specific scenario
 */
function buildUserPrompt(caseId, caseTitle) {
  return `Process this medical case and generate vitals JSON:

Case ID: ${caseId}
Case: ${caseTitle}

Generate Initial_Vitals and any State vitals that are appropriate for this case's progression.
Output ONLY valid JSON, no markdown or explanations.`;
}

/**
 * Parse batch result and extract vitals
 */
function parseBatchResult(result) {
  try {
    if (result.error) {
      return { error: result.error.message };
    }

    const content = result.response.body.choices[0].message.content;

    // Try to extract JSON from markdown code blocks if present
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/```\s*([\s\S]*?)\s*```/);
    const jsonStr = jsonMatch ? jsonMatch[1] : content;

    const parsed = JSON.parse(jsonStr.trim());
    return { vitals: parsed };
  } catch (error) {
    return { error: `Failed to parse: ${error.message}` };
  }
}

/**
 * Main processing function
 */
async function processBatchWithOpenAI() {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('    BATCH PROCESSING WITH OPENAI BATCH API');
  console.log('═══════════════════════════════════════════════════');
  console.log('');
  console.log(`Mode: ${dryRun ? '🔍 DRY RUN' : '⚠️  LIVE MODE'}`);
  console.log('');

  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY not set in .env');
  }

  // Determine rows
  const rowNumbers = rowRange || Array.from({ length: 10 }, (_, i) => i + 10); // Default: 10-19

  console.log(`📊 Processing ${rowNumbers.length} rows: ${rowNumbers[0]}-${rowNumbers[rowNumbers.length - 1]}`);
  console.log('');

  // Step 1: Read case data
  console.log('📖 Reading case data from Google Sheets...');
  const caseData = await batchReadCaseContext(SHEET_ID, rowNumbers);
  console.log(`✅ Read ${caseData.length} cases`);
  console.log('');

  // Step 2: Build batch requests
  console.log('🔧 Building batch requests...');
  const systemPrompt = buildSystemPrompt();

  const requests = caseData.map(row => ({
    custom_id: `row_${row.rowNum}_${row.caseId}`,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: buildUserPrompt(row.caseId, row.caseTitle) }
    ]
  }));

  console.log(`✅ Created ${requests.length} batch requests`);
  console.log('');

  // Step 3: Cost estimate
  console.log('💰 Cost Estimate:');
  const estimate = estimateBatchCost(requests.length);
  console.log(`   Input cost: $${estimate.inputCost}`);
  console.log(`   Output cost: $${estimate.outputCost}`);
  console.log(`   Total cost: $${estimate.totalCost}`);
  console.log(`   Per request: $${estimate.costPerRequest}`);
  console.log('');

  if (dryRun) {
    console.log('ℹ️  DRY RUN - Would submit batch but not actually processing');
    console.log('   Run without --dry-run to submit to OpenAI');
    console.log('');
    return;
  }

  // Step 4: Process batch
  console.log('🚀 Submitting batch to OpenAI...');
  console.log(`   Poll interval: ${pollInterval / 1000}s`);
  console.log('');

  const batchId = `batch_${Date.now()}`;
  const results = await processBatch(requests, {
    batchOptions: {
      model: 'gpt-4o-mini',
      temperature: 0.7,
      maxTokens: 3000,
      metadata: {
        source: 'er-sim-monitor',
        batch_id: batchId,
        rows: `${rowNumbers[0]}-${rowNumbers[rowNumbers.length - 1]}`
      }
    },
    pollOptions: {
      pollInterval,
      maxWaitTime: 86400000 // 24 hours
    }
  });

  // Step 5: Process results and write back to sheets
  console.log('📝 Processing results...');
  const updates = [];
  const progressUpdates = [];
  let successCount = 0;
  let failureCount = 0;

  results.forEach(result => {
    const customId = result.custom_id;
    const rowNum = parseInt(customId.split('_')[1]);
    const caseId = customId.split('_').slice(2).join('_');

    const parsed = parseBatchResult(result);

    if (parsed.error) {
      console.log(`   ❌ Row ${rowNum} (${caseId}): ${parsed.error}`);
      failureCount++;

      progressUpdates.push({
        batchId,
        rowNum,
        caseId,
        status: 'FAILED',
        errorMessage: parsed.error,
        completedAt: new Date().toISOString()
      });
    } else {
      console.log(`   ✅ Row ${rowNum} (${caseId}): Success`);
      successCount++;

      // Add updates for each vitals state
      Object.entries(parsed.vitals).forEach(([stateName, vitals]) => {
        updates.push({
          rowNum,
          columnName: stateName,
          vitals
        });
      });

      progressUpdates.push({
        batchId,
        rowNum,
        caseId,
        status: 'COMPLETED',
        completedAt: new Date().toISOString(),
        vitalsAdded: Object.keys(parsed.vitals).length
      });
    }
  });

  console.log('');
  console.log('💾 Writing results to Google Sheets...');

  if (updates.length > 0) {
    await batchWriteVitals(SHEET_ID, updates);
    console.log(`✅ Wrote ${updates.length} vitals updates`);
  }

  if (progressUpdates.length > 0) {
    await batchUpdateProgress(SHEET_ID, progressUpdates);
    console.log(`✅ Updated progress tracker`);
  }

  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('✅ BATCH PROCESSING COMPLETE');
  console.log('═══════════════════════════════════════════════════');
  console.log('');
  console.log(`Total rows: ${rowNumbers.length}`);
  console.log(`Successful: ${successCount} ✅`);
  console.log(`Failed: ${failureCount} ❌`);
  console.log(`Success rate: ${Math.round((successCount / rowNumbers.length) * 100)}%`);
  console.log('');
  console.log('💰 Actual Cost (estimated):');
  console.log(`   Total: $${estimate.totalCost}`);
  console.log(`   Savings vs Standard API: $${Math.round(estimate.totalCost)}+ (50% off)`);
  console.log('');
  console.log('🔗 Progress Tracker:');
  console.log(`   https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit#gid=916697307`);
  console.log('');
}

if (require.main === module) {
  processBatchWithOpenAI().catch(error => {
    console.error('');
    console.error('❌ BATCH PROCESSING FAILED');
    console.error('════════════════════════════════════════════════════');
    console.error(`Error: ${error.message}`);
    console.error('');
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  });
}

module.exports = { processBatchWithOpenAI };
