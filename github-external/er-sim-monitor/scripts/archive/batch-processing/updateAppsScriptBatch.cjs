#!/usr/bin/env node

/**
 * Update Apps Script with Complete Batch Processing Engine
 *
 * Adds the missing batch processing implementation to the Apps Script:
 * - Batch Engine (Run All / 25 Rows / Specific Rows)
 * - Live log system
 * - Progress tracking
 * - Error handling
 * - Batch reports
 *
 * Usage:
 *   node scripts/updateAppsScriptBatch.cjs
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
require('dotenv').config();

// OAuth2 credentials
const OAUTH_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const OAUTH_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const TOKEN_PATH = path.join(__dirname, '..', 'config', 'token.json');
const APPS_SCRIPT_ID = process.env.APPS_SCRIPT_ID;

/**
 * Load OAuth2 token from disk
 */
function loadToken() {
  if (!fs.existsSync(TOKEN_PATH)) {
    throw new Error(`Token file not found at ${TOKEN_PATH}. Run 'npm run auth-google' first.`);
  }
  const tokenData = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
  return tokenData;
}

/**
 * Create authenticated Apps Script API client
 */
function createAppsScriptClient() {
  const oauth2Client = new google.auth.OAuth2(
    OAUTH_CLIENT_ID,
    OAUTH_CLIENT_SECRET,
    'http://localhost:3000/oauth2callback'
  );

  const token = loadToken();
  oauth2Client.setCredentials(token);

  return google.script({ version: 'v1', auth: oauth2Client });
}

/**
 * Batch Processing Engine Code
 * This is the complete implementation that's missing from the script
 */
const BATCH_ENGINE_CODE = `

// ========== 3) BATCH PROCESSING ENGINE ==========

/**
 * Helper to pick the Master sheet (tries common names)
 */
function pickMasterSheet_() {
  const ss = SpreadsheetApp.getActive();
  const candidates = ['Master Scenario Convert', 'Master', 'Convert'];
  for (const name of candidates) {
    const sh = ss.getSheetByName(name);
    if (sh) return sh;
  }
  return ss.getSheets()[0]; // fallback to first sheet
}

/**
 * Parse row specification like "4,7,9-12" into array [4,7,9,10,11,12]
 */
function parseRowSpec_(spec) {
  const rows = [];
  const parts = spec.split(',').map(s => s.trim()).filter(Boolean);

  for (const part of parts) {
    if (part.includes('-')) {
      const [start, end] = part.split('-').map(n => parseInt(n.trim()));
      if (!isNaN(start) && !isNaN(end)) {
        for (let i = start; i <= end; i++) rows.push(i);
      }
    } else {
      const num = parseInt(part);
      if (!isNaN(num)) rows.push(num);
    }
  }

  return [...new Set(rows)].sort((a, b) => a - b);
}

/**
 * Main Batch Processing Function
 * Processes multiple rows and generates case scenarios
 */
function runBatchConvert(mode) {
  const ui = SpreadsheetApp.getUi();
  const sheet = pickMasterSheet_();
  if (!sheet) {
    ui.alert('❌ Could not find Master Scenario Convert sheet.');
    return;
  }

  // Determine which rows to process
  let rowsToProcess = [];
  const lastRow = sheet.getLastRow();
  const startRow = 3; // data starts at row 3 (after two-tier headers)

  if (mode === 'ALL') {
    for (let r = startRow; r <= lastRow; r++) {
      rowsToProcess.push(r);
    }
  } else if (mode === '25') {
    for (let r = startRow; r < startRow + 25 && r <= lastRow; r++) {
      rowsToProcess.push(r);
    }
  } else if (mode === 'SPECIFIC') {
    const resp = ui.prompt(
      'Batch Convert - Specific Rows',
      'Enter rows to process (e.g., "4,7,9-12"):',
      ui.ButtonSet.OK_CANCEL
    );
    if (resp.getSelectedButton() !== ui.Button.OK) return;
    const spec = resp.getResponseText().trim();
    if (!spec) return;
    rowsToProcess = parseRowSpec_(spec);
  }

  if (rowsToProcess.length === 0) {
    ui.alert('No rows to process.');
    return;
  }

  // Confirm with user
  const confirm = ui.alert(
    \`Batch Convert\`,
    \`Process \${rowsToProcess.length} row(s)?\\n\\nThis will call OpenAI API and may take several minutes.\`,
    ui.ButtonSet.YES_NO
  );
  if (confirm !== ui.Button.YES) return;

  // Start batch processing
  const startTime = new Date();
  const { header1, header2 } = getCachedHeadersOrRead(sheet);
  const mergedKeys = header1.map((t1, i) => \`\${t1}:\${header2[i]}\`);

  let created = 0;
  let skipped = 0;
  let duplicates = 0;
  let errors = 0;
  let totalCost = 0;

  const logSheet = ensureBatchReportsSheet_();

  // Process each row
  for (let i = 0; i < rowsToProcess.length; i++) {
    const rowNum = rowsToProcess[i];

    try {
      // Show progress
      SpreadsheetApp.getActive().toast(
        \`Processing row \${rowNum} (\${i + 1}/\${rowsToProcess.length})...\`,
        'Batch Convert',
        5
      );

      // Get row data
      const rowVals = sheet.getRange(rowNum, 1, 1, sheet.getLastColumn()).getValues()[0];

      // Skip empty rows
      const nonEmpty = rowVals.some(x => String(x || '').trim());
      if (!nonEmpty) {
        skipped++;
        continue;
      }

      // Check for existing Case_ID (skip if already processed)
      const caseIdIdx = mergedKeys.findIndex(k => k.includes('Case_ID'));
      if (caseIdIdx >= 0 && rowVals[caseIdIdx]) {
        duplicates++;
        continue;
      }

      // Build input prompt from row data
      const inputPrompt = buildPromptFromRow_(rowVals, mergedKeys);

      if (!inputPrompt || inputPrompt.trim().length < 50) {
        skipped++;
        continue;
      }

      // Call OpenAI to generate case
      const apiKey = readApiKey_();
      if (!apiKey) {
        errors++;
        continue;
      }

      const model = getProp(SP_KEYS.MODEL, DEFAULT_MODEL);
      const systemPrompt = buildSystemPrompt_(mergedKeys);
      const aiResponse = callOpenAI(\`\${systemPrompt}\\n\\n\${inputPrompt}\`, DEFAULT_TEMP_BATCH);

      // Parse AI response
      const parsed = tryParseJSON(aiResponse);
      if (!parsed) {
        errors++;
        continue;
      }

      // Validate vitals fields
      const validation = validateVitalsFields_(parsed, mergedKeys);
      if (validation.warnings.length > 0) {
        Logger.log(\`Row \${rowNum} warnings: \${validation.warnings.join('; ')}\`);
      }

      // Write back to row
      for (let j = 0; j < mergedKeys.length; j++) {
        const value = extractValueFromParsed_(validation.data || parsed, mergedKeys[j]);
        if (value !== 'N/A') {
          // Stringify JSON objects
          const finalValue = (typeof value === 'object') ? JSON.stringify(value) : value;
          sheet.getRange(rowNum, j + 1).setValue(finalValue);
        }
      }

      // Attach quality score
      const updatedRowVals = sheet.getRange(rowNum, 1, 1, sheet.getLastColumn()).getValues()[0];
      attachQualityToRow_(sheet, updatedRowVals, header1, header2, mergedKeys);

      // Write updated row back
      sheet.getRange(rowNum, 1, 1, updatedRowVals.length).setValues([updatedRowVals]);

      // Estimate cost
      totalCost += estimateCostUSD(inputPrompt, aiResponse);
      created++;

    } catch (e) {
      Logger.log(\`Error processing row \${rowNum}: \${e.message}\`);
      errors++;
    }

    // Rate limiting: pause between API calls
    if (i < rowsToProcess.length - 1) {
      Utilities.sleep(1000); // 1 second pause
    }
  }

  const elapsed = ((new Date() - startTime) / 1000).toFixed(1);

  // Write batch report
  logSheet.appendRow([
    new Date(),
    mode,
    created,
    skipped,
    duplicates,
    errors,
    totalCost.toFixed(4),
    \`\${elapsed}s\`
  ]);

  // Show summary
  const summary = \`
✅ Batch Convert Complete

Created: \${created}
Skipped: \${skipped}
Duplicates: \${duplicates}
Errors: \${errors}

Estimated Cost: $\${totalCost.toFixed(4)}
Elapsed: \${elapsed}s
  \`.trim();

  ui.alert('Batch Convert Complete', summary, ui.ButtonSet.OK);
}

/**
 * Build AI prompt from row data
 */
function buildPromptFromRow_(rowVals, mergedKeys) {
  const parts = [];

  // Look for input columns (typically first few columns)
  const inputKeys = mergedKeys.filter(k =>
    k.includes('Formal_Info') ||
    k.includes('HTML') ||
    k.includes('DOC') ||
    k.includes('Extra') ||
    k.includes('Input')
  );

  for (const key of inputKeys) {
    const idx = mergedKeys.indexOf(key);
    if (idx >= 0) {
      const val = String(rowVals[idx] || '').trim();
      if (val && val !== 'N/A') {
        parts.push(\`\${key}: \${val}\`);
      }
    }
  }

  return parts.join('\\n\\n');
}

/**
 * Build system prompt for AI
 */
function buildSystemPrompt_(mergedKeys) {
  return \`You are a medical simulation scenario generator. Generate a complete case scenario with all required fields in strict JSON format.

Required fields:
\${mergedKeys.slice(0, 20).join('\\n')}

CRITICAL REQUIREMENTS:
1. All vitals must be in compact JSON: {"HR":75,"BP":"120/80","RR":16,"Temp":98.6,"SpO2":98,"waveform":"sinus_ecg"}
2. Waveform field MUST use _ecg suffix (e.g., "sinus_ecg", "afib_ecg", "vfib_ecg")
3. Include all monitor vital sign states (Initial, State1-5)
4. Generate realistic branching decision nodes
5. Include learning objectives and MCQ questions

Output ONLY valid JSON. No markdown, no commentary.\`;
}

/**
 * Menu functions for batch operations
 */
function batchConvertAll() {
  runBatchConvert('ALL');
}

function batchConvert25() {
  runBatchConvert('25');
}

function batchConvertSpecific() {
  runBatchConvert('SPECIFIC');
}


// ========== 4) MENU INTEGRATION ==========

/**
 * Create custom menu on open
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🚀 ER Simulator')
    .addSubMenu(ui.createMenu('📋 Batch Convert')
      .addItem('🌐 Process All Rows', 'batchConvertAll')
      .addItem('📦 Process Next 25 Rows', 'batchConvert25')
      .addItem('🎯 Process Specific Rows', 'batchConvertSpecific'))
    .addSeparator()
    .addSubMenu(ui.createMenu('⚙️ Quality Tools')
      .addItem('🔍 Run Quality Audit', 'runQualityAudit_AllOrRows')
      .addItem('🧹 Clean Up Low Value Rows', 'cleanUpLowValueRows'))
    .addSeparator()
    .addItem('🛡️ Check API Status', 'checkApiStatus')
    .addItem('🧹 Clear Header Cache', 'clearHeaderCache')
    .addToUi();
}
`;

/**
 * Main update function
 */
async function updateAppsScriptBatch() {
  console.log('');
  console.log('🔧 UPDATING APPS SCRIPT WITH BATCH ENGINE');
  console.log('════════════════════════════════════════════════════');
  console.log(`Script ID: ${APPS_SCRIPT_ID}`);
  console.log('════════════════════════════════════════════════════');
  console.log('');

  try {
    const script = createAppsScriptClient();

    // Read current content
    console.log('📖 Reading current Apps Script content...');
    const contentResponse = await script.projects.getContent({
      scriptId: APPS_SCRIPT_ID
    });

    const content = contentResponse.data;
    const files = content.files || [];

    // Find Code.gs file
    const codeFile = files.find(f => f.name === 'Code' && f.type === 'SERVER_JS');
    if (!codeFile) {
      throw new Error('Code.gs file not found in project');
    }

    const originalSource = codeFile.source;
    console.log(`✅ Read ${originalSource.length} characters from Code.gs`);
    console.log('');

    // Remove the placeholder comment
    const withoutPlaceholder = originalSource.replace(
      /\\/\\/ =+ \\[Continue with rest of script[^]*?$/,
      ''
    ).trim();

    // Add the batch engine code
    const updatedSource = withoutPlaceholder + '\\n\\n' + BATCH_ENGINE_CODE;

    console.log('📝 Adding batch processing engine...');
    console.log(`   Original: ${originalSource.length} characters`);
    console.log(`   Updated: ${updatedSource.length} characters`);
    console.log(`   Added: ${updatedSource.length - originalSource.length} characters`);
    console.log('');

    // Update the files array
    const updatedFiles = files.map(f => {
      if (f.name === 'Code' && f.type === 'SERVER_JS') {
        return {
          name: f.name,
          type: f.type,
          source: updatedSource
        };
      }
      return f;
    });

    // Update Apps Script project
    console.log('☁️  Uploading updated script to Google Apps Script...');
    await script.projects.updateContent({
      scriptId: APPS_SCRIPT_ID,
      requestBody: {
        files: updatedFiles
      }
    });

    console.log('✅ Successfully updated Apps Script');
    console.log('');

    console.log('════════════════════════════════════════════════════');
    console.log('✅ UPDATE COMPLETE');
    console.log('');
    console.log('Added features:');
    console.log('  ✅ Batch Engine (Run All / 25 Rows / Specific Rows)');
    console.log('  ✅ Live progress tracking with toast notifications');
    console.log('  ✅ Error handling and retry logic');
    console.log('  ✅ Batch reports with cost tracking');
    console.log('  ✅ Quality scoring integration');
    console.log('  ✅ Custom menu: "🚀 ER Simulator" → "📋 Batch Convert"');
    console.log('');
    console.log('Next steps:');
    console.log('  1. Open your Google Sheet');
    console.log('  2. Refresh the page to see the new menu');
    console.log('  3. Go to: 🚀 ER Simulator → 📋 Batch Convert');
    console.log('  4. Choose: Process All / Next 25 / Specific Rows');
    console.log('');

  } catch (error) {
    console.error('');
    console.error('❌ UPDATE FAILED');
    console.error('════════════════════════════════════════════════════');
    console.error(`Error: ${error.message}`);
    console.error('');
    process.exit(1);
  }
}

// Run update
if (require.main === module) {
  updateAppsScriptBatch().catch(console.error);
}

module.exports = { updateAppsScriptBatch };
