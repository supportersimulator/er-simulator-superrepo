/**
 * Add Specific Rows Logic to Backend runAICategorization
 *
 * Update the backend function to:
 * 1. Check mode parameter
 * 2. Parse specificInput if mode='specific'
 * 3. Filter cases array to only process specified cases
 * 4. Add comprehensive logging
 */

const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function main() {
  console.log('🔧 Adding Specific Rows Logic to Backend\n');
  console.log('══════════════════════════════════════════════════════════════\n');

  const token = JSON.parse(fs.readFileSync('./config/token.json', 'utf-8'));
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/oauth2callback'
  );
  oAuth2Client.setCredentials(token);

  const script = google.script({ version: 'v1', auth: oAuth2Client });
  const scriptId = process.env.APPS_SCRIPT_ID;

  console.log('📥 Downloading current project...\n');

  const project = await script.projects.getContent({ scriptId });
  const codeFile = project.data.files.find(f => f.name === 'Code');

  if (!codeFile) {
    console.log('❌ Code.gs not found\n');
    return;
  }

  let code = codeFile.source;

  console.log('🔍 Finding runAICategorization function...\n');

  // Find the function
  const funcMatch = code.match(/function runAICategorization\(mode, specificInput\) \{[\s\S]*?(?=\n(?:function [a-zA-Z_]|\}\s*$))/);

  if (!funcMatch) {
    console.log('❌ Function not found\n');
    return;
  }

  const oldFunction = funcMatch[0];

  console.log('✅ Found function (' + oldFunction.length + ' characters)\n');

  // Build the updated function with specific rows logic
  const newFunction = `function runAICategorization(mode, specificInput) {
  // Clear old logs and start fresh
  PropertiesService.getDocumentProperties().deleteProperty('Sidebar_Logs');

  // Handle mode parameter (default to 'all' for backward compatibility)
  mode = mode || 'all';

  addAILog('🚀 Starting AI Categorization');
  addAILog('Mode: ' + mode);
  if (mode === 'specific' && specificInput) {
    addAILog('Input: ' + specificInput);
  }
  addAILog('');

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const masterSheet = ss.getSheetByName('Master Scenario Convert');

  if (!masterSheet) {
    throw new Error('Master Scenario Convert sheet not found!');
  }

  Logger.log('🤖 Starting AI Categorization...');
  Logger.log('Mode: ' + mode);
  Logger.log('');

  // Clear old results sheet immediately to prevent conflicts
  const existingResults = ss.getSheetByName('AI_Categorization_Results');
  if (existingResults) {
    existingResults.clear();
    Logger.log('✅ Cleared old results sheet');
    Logger.log('');
  }

  // Get all case data (skip 2 header rows)
  const lastRow = masterSheet.getLastRow();
  const data = masterSheet.getRange(3, 1, lastRow - 2, 646).getValues();

  Logger.log('📊 Loaded ' + data.length + ' cases from Master');

  // Extract relevant fields for each case
  let cases = [];
  for (let i = 0; i < data.length; i++) {
    const row = data[i];

    cases.push({
      rowIndex: i + 3,                    // Actual row number in sheet
      caseID: row[0],                     // Column A: Case_ID
      legacyCaseID: row[8],               // Column I: Legacy_Case_ID
      currentSymptom: row[17] || '',      // Column R: Case_Organization_Category_Symptom
      currentSystem: row[18] || '',       // Column S: Case_Organization_Category_System
      chiefComplaint: row[4] || '',       // Column E: Chief_Complaint (approximate)
      presentation: row[5] || '',         // Column F: Presentation (approximate)
      diagnosis: row[6] || ''             // Column G: Diagnosis (approximate)
    });
  }

  Logger.log('✅ Extracted case data');

  // Handle Specific Rows mode
  if (mode === 'specific' && specificInput) {
    addAILog('🎯 Parsing specific rows input...');

    const targetCaseIDs = parseSpecificRowsInput(specificInput, masterSheet);

    if (targetCaseIDs.length === 0) {
      addAILog('❌ No valid Case IDs found in input');
      throw new Error('No valid rows found for input: ' + specificInput);
    }

    addAILog('✅ Found ' + targetCaseIDs.length + ' valid Case IDs');
    addAILog('Case IDs: ' + targetCaseIDs.join(', '));
    addAILog('');

    // Filter cases to only specified ones
    const originalCount = cases.length;
    cases = cases.filter(c => targetCaseIDs.includes(c.caseID));

    Logger.log('Filtered from ' + originalCount + ' to ' + cases.length + ' cases');
    addAILog('Filtered to ' + cases.length + ' cases for processing');
    addAILog('');
  }
  Logger.log('');

  // Process in batches of 25
  const batchSize = 25;

  addAILog('📊 Processing Details:');
  addAILog('   Total cases to process: ' + cases.length);
  addAILog('   Batch size: ' + batchSize);
  addAILog('   Total batches: ' + Math.ceil(cases.length / batchSize));
  addAILog('');

  const allResults = [];

  for (let i = 0; i < cases.length; i += batchSize) {
    const batch = cases.slice(i, Math.min(i + batchSize, cases.length));
    const batchNum = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(cases.length / batchSize);

    addAILog('📦 Batch ' + batchNum + '/' + totalBatches + ' (' + batch.length + ' cases)');
    Logger.log('📦 Processing batch ' + batchNum + '/' + totalBatches + ' (' + batch.length + ' cases)...');

    try {
      const batchResults = categorizeBatchWithAI(batch);
      addAILog('   ✅ API responded with ' + batchResults.length + ' results');

      // Log sample result
      if (batchResults.length > 0) {
        const sample = batchResults[0];
        addAILog('   Sample: ' + sample.caseID + ' → ' + (sample.suggestedSymptom || '(empty)') + ' / ' + (sample.suggestedSystem || '(empty)'));
      }

      // Log any empty results
      const emptyResults = batchResults.filter(r => !r.suggestedSymptom || r.suggestedSymptom.length === 0);
      if (emptyResults.length > 0) {
        addAILog('   ⚠️  WARNING: ' + emptyResults.length + ' results still empty!');
      }

      allResults.push(...batchResults);

      Logger.log('✅ Batch ' + batchNum + ' complete');

      // Small delay to avoid rate limits
      Utilities.sleep(1000);

    } catch (error) {
      addAILog('   ❌ Batch failed: ' + error.message);
      Logger.log('❌ Batch ' + batchNum + ' failed: ' + error.message);

      // Add placeholder results for failed batch
      batch.forEach(caseData => {
        allResults.push({
          caseID: caseData.caseID,
          rowIndex: caseData.rowIndex,
          currentSymptom: caseData.currentSymptom,
          currentSystem: caseData.currentSystem,
          suggestedSymptom: '',
          suggestedSymptomName: '',
          suggestedSystem: '',
          reasoning: 'AI processing failed: ' + error.message,
          status: 'error'
        });
      });
    }
    addAILog('');
  }

  addAILog('🎉 AI Categorization Complete!');
  addAILog('   Total cases processed: ' + allResults.length);
  addAILog('');

  Logger.log('');
  Logger.log('🎉 AI Categorization complete!');
  Logger.log('   Total cases processed: ' + allResults.length);

  // Save results to temporary sheet for review
  saveCategorizationResults(allResults);

  addAILog('✅ Results saved to AI_Categorization_Results sheet');
  addAILog('Click "🔄 Refresh" in Review section to see results');

  Logger.log('✅ Results saved to AI_Categorization_Results sheet');

  return {
    success: true,
    totalCases: allResults.length,
    resultsSheetName: 'AI_Categorization_Results'
  };
}

/**
 * Parse Specific Rows Input
 * Accepts Case IDs or row numbers (comma-separated, ranges with dashes)
 * Returns array of Case_IDs to process
 */
function parseSpecificRowsInput(input, masterSheet) {
  const parts = input.split(',').map(p => p.trim()).filter(p => p.length > 0);
  const caseIDs = [];

  const allData = masterSheet.getDataRange().getValues();

  for (const part of parts) {
    // Check if range (e.g., "7-10")
    if (part.includes('-')) {
      const rangeParts = part.split('-');
      if (rangeParts.length === 2) {
        const start = parseInt(rangeParts[0].trim());
        const end = parseInt(rangeParts[1].trim());

        if (!isNaN(start) && !isNaN(end)) {
          for (let rowNum = start; rowNum <= end; rowNum++) {
            const caseID = getCaseIDFromRow(rowNum, allData);
            if (caseID) caseIDs.push(caseID);
          }
        }
      }
    }
    // Check if numeric (row number)
    else if (!isNaN(part) && part.length > 0) {
      const rowNum = parseInt(part);
      const caseID = getCaseIDFromRow(rowNum, allData);
      if (caseID) caseIDs.push(caseID);
    }
    // Otherwise treat as Case_ID
    else {
      // Verify it exists in Master sheet (data starts at row 3)
      const exists = allData.slice(2).some(row => row[0] === part);
      if (exists) {
        caseIDs.push(part);
      } else {
        Logger.log('Warning: Case_ID not found in Master sheet: ' + part);
      }
    }
  }

  return [...new Set(caseIDs)]; // Remove duplicates
}

/**
 * Get Case_ID from row number (Master sheet, row 3 = first data row)
 */
function getCaseIDFromRow(rowNum, allData) {
  if (rowNum >= 3 && rowNum <= allData.length) {
    const caseID = allData[rowNum - 1][0]; // Column A (index 0)
    if (caseID) return caseID;
  }

  Logger.log('Warning: Row ' + rowNum + ' not found or has no Case_ID');
  return null;
}`;

  // Replace old function with new one
  code = code.replace(funcMatch[0], newFunction);

  console.log('✅ Updated runAICategorization with specific rows logic\n');
  console.log('📝 Changes made:\n');
  console.log('  ✅ Added mode parameter handling');
  console.log('  ✅ Added comprehensive logging with addAILog()');
  console.log('  ✅ Added parseSpecificRowsInput() helper function');
  console.log('  ✅ Added getCaseIDFromRow() helper function');
  console.log('  ✅ Added filtering logic for specific mode');
  console.log('  ✅ Added user-friendly progress updates\n');

  codeFile.source = code;

  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('🚀 Deploying to Apps Script...\n');

  await script.projects.updateContent({
    scriptId: scriptId,
    requestBody: { files: project.data.files }
  });

  console.log('✅ Deployment complete!\n');
  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('🎯 Backend Now Supports Specific Rows Mode!\n');
  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('Next steps:');
  console.log('  1. Refresh Google Sheet (F5)');
  console.log('  2. Open AI Categorization panel');
  console.log('  3. Select "Specific Rows" mode');
  console.log('  4. Paste Case IDs (19 ACLS cases)');
  console.log('  5. Click "Run AI Categorization"');
  console.log('  6. Watch Live Logs for progress');
  console.log('  7. Copy logs to send for debugging\n');
}

main().catch(console.error);
