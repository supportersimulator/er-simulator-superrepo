/**
 * Add Live Logging to Apply Categorization Function
 *
 * This adds comprehensive logging to show:
 * - Which cases are being processed
 * - Which Legacy_Case_IDs are found/not found
 * - Which rows are being updated
 * - Success/failure counts
 */

const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function main() {
  console.log('🔧 Adding Live Logging to Apply Function\n');

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
    console.log('❌ Code.gs not found');
    return;
  }

  // Find the LAST applyCategorization function (the one that will be used)
  const applyMatches = [...codeFile.source.matchAll(/function applyCategorization\(applyMode\)[\s\S]*?(?=\nfunction [a-z]|\n\/\*\*\*|$)/g)];
  const lastApplyMatch = applyMatches[applyMatches.length - 1];

  if (!lastApplyMatch) {
    console.log('❌ applyCategorization function not found');
    return;
  }

  let updatedApply = lastApplyMatch[0];

  // Add log clearing and start message at the beginning
  updatedApply = updatedApply.replace(
    /const ss = SpreadsheetApp\.getActiveSpreadsheet\(\);/,
    `// Clear old logs and start fresh
  PropertiesService.getDocumentProperties().deleteProperty('Sidebar_Logs');
  addAILog('🚀 Starting Apply Categorizations...');
  addAILog('   Mode: ' + applyMode);
  addAILog('');

  const ss = SpreadsheetApp.getActiveSpreadsheet();`
  );

  // Add logging after loading results
  updatedApply = updatedApply.replace(
    /Logger\.log\('📊 Loaded ' \+ data\.length \+ ' categorization results'\);/,
    `Logger.log('📊 Loaded ' + data.length + ' categorization results');
  addAILog('📊 Loaded ' + data.length + ' categorization results');
  addAILog('');`
  );

  // Add logging for case data parsing
  updatedApply = updatedApply.replace(
    /\/\/ Parse results\s*const categorizationData = \{\};/,
    `// Parse results
  const categorizationData = {};

  addAILog('🔍 Parsing categorization results...');
  addAILog('');`
  );

  // Add logging after parsing is complete
  updatedApply = updatedApply.replace(
    /Logger\.log\('✅ Ready to apply ' \+ Object\.keys\(categorizationData\)\.length \+ ' categorizations'\);/,
    `Logger.log('✅ Ready to apply ' + Object.keys(categorizationData).length + ' categorizations');
  addAILog('✅ Found ' + Object.keys(categorizationData).length + ' cases with final categories');
  addAILog('');
  addAILog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  addAILog('📝 Applying to Master Scenario Convert...');
  addAILog('');`
  );

  // Find and update applyCategorizationUpdates function
  const updateMatches = [...codeFile.source.matchAll(/function applyCategorizationUpdates\(categorizationData, masterSheet\)[\s\S]*?(?=\nfunction [a-z]|\n\/\*\*\*|$)/g)];
  const lastUpdateMatch = updateMatches[updateMatches.length - 1];

  if (!lastUpdateMatch) {
    console.log('❌ applyCategorizationUpdates function not found');
    return;
  }

  let updatedUpdate = lastUpdateMatch[0];

  // Add detailed logging to the update loop
  updatedUpdate = updatedUpdate.replace(
    /\/\/ Find row by Legacy_Case_ID\s*const row = findRowByLegacyCaseID\(masterSheet, legacyCaseID\);/,
    `// Find row by Legacy_Case_ID
      const row = findRowByLegacyCaseID(masterSheet, legacyCaseID);

      addAILog('   Searching for: ' + legacyCaseID + ' (' + cat.caseID + ')');`
  );

  // Add logging when case not found
  updatedUpdate = updatedUpdate.replace(
    /if \(!row\) \{\s*Logger\.log\('❌ Case not found: ' \+ legacyCaseID\);/,
    `if (!row) {
        Logger.log('❌ Case not found: ' + legacyCaseID);
        addAILog('      ❌ NOT FOUND in Master sheet');`
  );

  // Add logging when case IS found and updated
  updatedUpdate = updatedUpdate.replace(
    /Logger\.log\('✅ Updated ' \+ cat\.caseID \+ ': ' \+ cat\.symptom \+ ' \/ ' \+ cat\.system\);/,
    `Logger.log('✅ Updated ' + cat.caseID + ': ' + cat.symptom + ' / ' + cat.system);
      addAILog('      ✅ Found at row ' + row + ': ' + cat.symptom + ' / ' + cat.system);`
  );

  // Add summary logging
  updatedUpdate = updatedUpdate.replace(
    /return \{\s*updated: updated,\s*errors: errors/,
    `addAILog('');
  addAILog('📊 Apply Summary:');
  addAILog('   ✅ Successfully updated: ' + updated);
  addAILog('   ❌ Errors / Not found: ' + errors);
  addAILog('');
  addAILog('═══════════════════════════════════════════');

  return {
    updated: updated,
    errors: errors`
  );

  // Replace both functions in Code.gs
  let newCode = codeFile.source;

  // Replace the last applyCategorization
  const applyStart = lastApplyMatch.index;
  const applyEnd = applyStart + lastApplyMatch[0].length;
  newCode = newCode.substring(0, applyStart) + updatedApply + newCode.substring(applyEnd);

  // Now find and replace applyCategorizationUpdates in the updated code
  const updateStartInNew = newCode.lastIndexOf('function applyCategorizationUpdates');
  if (updateStartInNew !== -1) {
    const updateEndInNew = newCode.indexOf('\nfunction ', updateStartInNew + 1);
    const endPos = updateEndInNew !== -1 ? updateEndInNew : newCode.length;
    newCode = newCode.substring(0, updateStartInNew) + updatedUpdate + newCode.substring(endPos);
  }

  codeFile.source = newCode;

  console.log('✅ Added live logging to Apply functions\n');

  // Deploy
  console.log('🚀 Deploying to Apps Script...\n');

  await script.projects.updateContent({
    scriptId: scriptId,
    requestBody: { files: project.data.files }
  });

  console.log('✅ Deployment complete!\n');
  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log('🪵 Live Logs Added to Apply Function!\n');
  console.log('When you run Apply, logs will show:');
  console.log('  - Total results loaded');
  console.log('  - Each case being searched: "Searching for: ES1-Sepsis (GAST0001)"');
  console.log('  - If found: "✅ Found at row 3: PSY / Psychiatric"');
  console.log('  - If NOT found: "❌ NOT FOUND in Master sheet"');
  console.log('  - Final summary: "Successfully updated: X, Errors: Y"');
  console.log('');
  console.log('💡 Next Steps:');
  console.log('  1. Refresh Google Sheet (F5)');
  console.log('  2. Open AI Categorization Tools');
  console.log('  3. Click "Apply Selected Categories to Master"');
  console.log('  4. Watch live logs in the panel');
  console.log('  5. Click "Copy Logs" and paste back here');
  console.log('');
}

main().catch(console.error);
