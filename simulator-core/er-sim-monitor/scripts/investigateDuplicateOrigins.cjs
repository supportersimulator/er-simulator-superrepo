/**
 * Investigate Duplicate Case Origins - Deep Analysis
 * 
 * Compares duplicate cases across:
 * 1. Input sheet (original raw data)
 * 2. Master Scenario Convert (processed data)
 * 3. Learning outcomes, media resources, and other key fields
 */

const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function main() {
  console.log('🔍 Deep Investigation: Are Duplicates Accidental or Intentional?\n');
  console.log('══════════════════════════════════════════════════════════════\n');

  const token = JSON.parse(fs.readFileSync('./config/token.json', 'utf-8'));
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/oauth2callback'
  );
  oAuth2Client.setCredentials(token);

  const sheets = google.sheets({ version: 'v4', auth: oAuth2Client });

  // Fetch Master Scenario Convert (all columns)
  console.log('📥 Step 1: Fetching Master Scenario Convert (all data)...\n');

  const masterRes = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.SHEET_ID,
    range: 'Master Scenario Convert!A1:AZ300'
  });

  const masterData = masterRes.data.values || [];
  const masterHeaders = masterData[0]; // First row is headers

  console.log('Master sheet has ' + masterHeaders.length + ' columns\n');

  // Find key columns
  const caseIDCol = masterHeaders.indexOf('Case_ID');
  const learningOutcomesCol = masterHeaders.indexOf('Learning_Outcomes');
  const mediaResourcesCol = masterHeaders.indexOf('Media_Resources');
  const scenarioTitleCol = masterHeaders.indexOf('Scenario_Title');
  const objectivesCol = masterHeaders.indexOf('Objectives');

  console.log('Key column indices:');
  console.log('  Case_ID: ' + caseIDCol);
  console.log('  Learning_Outcomes: ' + learningOutcomesCol);
  console.log('  Media_Resources: ' + mediaResourcesCol);
  console.log('  Scenario_Title: ' + scenarioTitleCol);
  console.log('  Objectives: ' + objectivesCol + '\n');

  // Fetch Input sheet
  console.log('📥 Step 2: Fetching Input sheet (original raw data)...\n');

  const inputRes = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.SHEET_ID,
    range: 'Input!A1:Z300'
  });

  const inputData = inputRes.data.values || [];
  const inputHeaders = inputData[0];

  console.log('Input sheet has ' + inputHeaders.length + ' columns\n');

  // Find input columns
  const inputScenarioCol = inputHeaders.findIndex(h => h && h.toLowerCase().includes('scenario'));
  const inputLearningCol = inputHeaders.findIndex(h => h && h.toLowerCase().includes('learning'));
  const inputMediaCol = inputHeaders.findIndex(h => h && h.toLowerCase().includes('media'));

  console.log('Input sheet key columns:');
  console.log('  Scenario/Title: ' + inputScenarioCol + ' (' + (inputHeaders[inputScenarioCol] || 'N/A') + ')');
  console.log('  Learning: ' + inputLearningCol + ' (' + (inputHeaders[inputLearningCol] || 'N/A') + ')');
  console.log('  Media: ' + inputMediaCol + ' (' + (inputHeaders[inputMediaCol] || 'N/A') + ')');
  console.log('\n══════════════════════════════════════════════════════════════\n');

  // Analyze each duplicate Case_ID
  const duplicates = [
    { id: 'CARD0025', rows: [116, 192, 194, 197, 205] },
    { id: 'CARD0042', rows: [177, 193, 198] },
    { id: 'CARD0045', rows: [186, 190, 207] },
    { id: 'CARD0002', rows: [8, 195] },
    { id: 'CARD0007', rows: [33, 200] },
    { id: 'CARD0012', rows: [71, 199] },
    { id: 'CARD0017', rows: [90, 209] },
    { id: 'CARD0050', rows: [103, 202] },
    { id: 'CARD0022', rows: [108, 196] },
    { id: 'CARD0023', rows: [111, 204] },
    { id: 'CARD0051', rows: [113, 201] },
    { id: 'NEUR0023', rows: [185, 208] }
  ];

  console.log('🔍 Analyzing Each Duplicate Set:\n');

  let totalDuplicateSets = 0;
  let accidentalDuplicates = 0;
  let intentionalVariations = 0;

  for (const dup of duplicates) {
    totalDuplicateSets++;
    
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('📋 Case_ID: ' + dup.id + ' (appears ' + dup.rows.length + ' times)\n');
    console.log('Rows: ' + dup.rows.join(', ') + '\n');

    const variations = [];

    // Compare each occurrence
    for (const rowNum of dup.rows) {
      const masterRow = masterData[rowNum - 1]; // Convert to 0-indexed
      
      if (!masterRow) {
        console.log('  ⚠️  Row ' + rowNum + ' not found in data\n');
        continue;
      }

      const learningOutcomes = masterRow[learningOutcomesCol] || '';
      const mediaResources = masterRow[mediaResourcesCol] || '';
      const scenarioTitle = masterRow[scenarioTitleCol] || '';
      const objectives = masterRow[objectivesCol] || '';

      variations.push({
        row: rowNum,
        learningOutcomes: learningOutcomes.substring(0, 100),
        mediaResources: mediaResources.substring(0, 100),
        scenarioTitle: scenarioTitle,
        objectives: objectives.substring(0, 100),
        learningOutcomesFull: learningOutcomes,
        mediaResourcesFull: mediaResources
      });
    }

    // Compare variations
    let allSameTitle = true;
    let allSameLearning = true;
    let allSameMedia = true;
    let allSameObjectives = true;

    const firstVar = variations[0];

    for (let i = 1; i < variations.length; i++) {
      if (variations[i].scenarioTitle !== firstVar.scenarioTitle) allSameTitle = false;
      if (variations[i].learningOutcomesFull !== firstVar.learningOutcomesFull) allSameLearning = false;
      if (variations[i].mediaResourcesFull !== firstVar.mediaResourcesFull) allSameMedia = false;
      if (variations[i].objectives !== firstVar.objectives) allSameObjectives = false;
    }

    // Print comparison
    console.log('Comparison:\n');
    console.log('  Scenario Title: ' + (allSameTitle ? '✅ IDENTICAL' : '❌ DIFFERENT'));
    console.log('  Learning Outcomes: ' + (allSameLearning ? '✅ IDENTICAL' : '❌ DIFFERENT'));
    console.log('  Media Resources: ' + (allSameMedia ? '✅ IDENTICAL' : '❌ DIFFERENT'));
    console.log('  Objectives: ' + (allSameObjectives ? '✅ IDENTICAL' : '❌ DIFFERENT'));
    console.log('');

    // Show details for each variation
    variations.forEach((v, idx) => {
      console.log('  Row ' + v.row + ':');
      console.log('    Title: ' + (v.scenarioTitle || '(empty)'));
      console.log('    Learning: ' + (v.learningOutcomes || '(empty)'));
      console.log('    Media: ' + (v.mediaResources || '(empty)'));
      console.log('');
    });

    // Verdict
    if (allSameTitle && allSameLearning && allSameMedia) {
      console.log('🚨 VERDICT: ACCIDENTAL DUPLICATE (all key fields identical)\n');
      accidentalDuplicates++;
    } else {
      console.log('✅ VERDICT: INTENTIONAL VARIATION (different content)\n');
      intentionalVariations++;
    }
  }

  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log('📊 Final Analysis:\n');
  console.log('  Total duplicate sets analyzed: ' + totalDuplicateSets);
  console.log('  Accidental duplicates (identical): ' + accidentalDuplicates + ' 🚨');
  console.log('  Intentional variations (different): ' + intentionalVariations + ' ✅\n');

  if (accidentalDuplicates > 0) {
    console.log('🔧 Recommendation: REMOVE accidental duplicates');
    console.log('   These cases have identical content and should be deduplicated.\n');
  }

  if (intentionalVariations > 0) {
    console.log('⚠️  Recommendation: ASSIGN UNIQUE CASE_IDs to variations');
    console.log('   These are different scenarios and should have unique identifiers.\n');
  }
}

main().catch(console.error);
