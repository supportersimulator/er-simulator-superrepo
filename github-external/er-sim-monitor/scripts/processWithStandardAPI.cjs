#!/usr/bin/env node

/**
 * Process Scenarios with OpenAI Standard API
 * Use this when Batch API is unavailable
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
require('dotenv').config();

const {
  batchReadCaseContext,
  batchWriteVitals,
  batchUpdateProgress
} = require('./lib/batchSheetsOps.cjs');

const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const args = process.argv.slice(2);
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
- hyperkalemia_ecg, hypokalemia_ecg`;
}

function buildUserPrompt(caseId, caseTitle) {
  return `Process this medical case and generate vitals JSON:

Case ID: ${caseId}
Case: ${caseTitle.substring(0, 1000)}

Generate Initial_Vitals and any State vitals that are appropriate for this case's progression.
Output ONLY valid JSON, no markdown or explanations.`;
}

function makeOpenAIRequest(messages) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.7,
      max_tokens: 3000
    });

    const options = {
      hostname: 'api.openai.com',
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
          }
        } catch (e) {
          reject(new Error(`Failed to parse response: ${responseData}`));
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function parseResult(content) {
  try {
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/```\s*([\s\S]*?)\s*```/);
    const jsonStr = jsonMatch ? jsonMatch[1] : content;
    const parsed = JSON.parse(jsonStr.trim());
    return { vitals: parsed };
  } catch (error) {
    return { error: `Failed to parse: ${error.message}` };
  }
}

async function processScenarios() {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('    PROCESSING WITH OPENAI STANDARD API');
  console.log('═══════════════════════════════════════════════════');
  console.log('');

  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY not set in .env');
  }

  const rowNumbers = rowRange || [10];
  console.log(`📊 Processing ${rowNumbers.length} rows: ${rowNumbers[0]}-${rowNumbers[rowNumbers.length - 1]}`);
  console.log('');

  // Read case data
  console.log('📖 Reading case data from Google Sheets...');
  const caseData = await batchReadCaseContext(SHEET_ID, rowNumbers);
  console.log(`✅ Read ${caseData.length} cases`);
  console.log('');

  const systemPrompt = buildSystemPrompt();
  const updates = [];
  const progressUpdates = [];
  let successCount = 0;
  let failureCount = 0;

  // Process each case
  for (let i = 0; i < caseData.length; i++) {
    const row = caseData[i];
    console.log(`⏳ Processing ${i + 1}/${caseData.length}: Row ${row.rowNum} (${row.caseId})...`);

    try {
      const userPrompt = buildUserPrompt(row.caseId, row.caseTitle);
      const response = await makeOpenAIRequest([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]);

      const content = response.choices[0].message.content;
      const parsed = parseResult(content);

      if (parsed.error) {
        console.log(`   ❌ ${parsed.error}`);
        failureCount++;

        progressUpdates.push({
          batchId: 'standard_api',
          rowNum: row.rowNum,
          caseId: row.caseId,
          status: 'FAILED',
          errorMessage: parsed.error,
          completedAt: new Date().toISOString()
        });
      } else {
        console.log(`   ✅ Success`);
        successCount++;

        Object.entries(parsed.vitals).forEach(([stateName, vitals]) => {
          updates.push({
            rowNum: row.rowNum,
            columnName: stateName,
            vitals
          });
        });

        progressUpdates.push({
          batchId: 'standard_api',
          rowNum: row.rowNum,
          caseId: row.caseId,
          status: 'COMPLETED',
          completedAt: new Date().toISOString(),
          vitalsAdded: Object.keys(parsed.vitals).length
        });
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (error) {
      console.log(`   ❌ ${error.message}`);
      failureCount++;

      progressUpdates.push({
        batchId: 'standard_api',
        rowNum: row.rowNum,
        caseId: row.caseId,
        status: 'FAILED',
        errorMessage: error.message,
        completedAt: new Date().toISOString()
      });
    }
  }

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
  console.log('✅ PROCESSING COMPLETE');
  console.log('═══════════════════════════════════════════════════');
  console.log('');
  console.log(`Total rows: ${rowNumbers.length}`);
  console.log(`Successful: ${successCount} ✅`);
  console.log(`Failed: ${failureCount} ❌`);
  console.log(`Success rate: ${Math.round((successCount / rowNumbers.length) * 100)}%`);
  console.log('');
}

if (require.main === module) {
  processScenarios().catch(error => {
    console.error('');
    console.error('❌ PROCESSING FAILED');
    console.error('════════════════════════════════════════════════════');
    console.error(`Error: ${error.message}`);
    console.error('');
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  });
}

module.exports = { processScenarios };
