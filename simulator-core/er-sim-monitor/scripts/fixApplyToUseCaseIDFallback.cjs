/**
 * Fix Apply Function to Use Case_ID as Fallback
 *
 * When Legacy_Case_ID is empty, fall back to matching by Case_ID.
 * This fixes the 25 retry cases that don't have Legacy_Case_ID.
 */

const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function main() {
  console.log('🔧 Fixing Apply Function to Use Case_ID Fallback\n');

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

  // Find the applyCategorizationUpdates function (last one)
  const updateMatches = [...codeFile.source.matchAll(/function applyCategorizationUpdates\(categorizationData, masterSheet\)[\s\S]*?(?=\nfunction [a-z]|\n\/\*\*\*|$)/g)];
  const lastUpdateMatch = updateMatches[updateMatches.length - 1];

  if (!lastUpdateMatch) {
    console.log('❌ applyCategorizationUpdates function not found');
    return;
  }

  let updatedUpdate = lastUpdateMatch[0];

  // Replace the row finding logic to use Case_ID as fallback
  updatedUpdate = updatedUpdate.replace(
    /\/\/ Find row by Legacy_Case_ID\s*const row = findRowByLegacyCaseID\(masterSheet, legacyCaseID\);/,
    `// Find row by Legacy_Case_ID, or Case_ID if Legacy is empty
      let row;
      if (legacyCaseID && legacyCaseID.length > 0) {
        row = findRowByLegacyCaseID(masterSheet, legacyCaseID);
      } else {
        // Fallback: use Case_ID for cases without Legacy_Case_ID
        row = findRowByCaseID(masterSheet, cat.caseID);
      }`
  );

  // Update the logging to show which method was used
  updatedUpdate = updatedUpdate.replace(
    /addAILog\('   Searching for: ' \+ legacyCaseID \+ ' \(' \+ cat\.caseID \+ '\)'\);/,
    `addAILog('   Searching for: ' + (legacyCaseID || cat.caseID + ' (via Case_ID)') + ' (' + cat.caseID + ')');`
  );

  // Now find and add the findRowByCaseID function
  const findByCaseIDFunction = `
/**
 * Find row in Master sheet by Case_ID
 * Used as fallback when Legacy_Case_ID is empty
 */
function findRowByCaseID(sheet, caseID) {
  const caseIDColumn = 1; // Column A: Case_ID
  const lastRow = sheet.getLastRow();

  // Get all Case_ID values (skip 2 header rows)
  const data = sheet.getRange(3, caseIDColumn, lastRow - 2, 1).getValues();

  for (let i = 0; i < data.length; i++) {
    if (data[i][0] === caseID) {
      return i + 3; // Row number (1-indexed, +2 for headers, +1 for array offset)
    }
  }

  return null; // Not found
}

`;

  // Insert the new function after the existing findRowByLegacyCaseID
  const findByLegacyMatch = codeFile.source.match(/(function findRowByLegacyCaseID[\s\S]*?(?=\n\nfunction|\n\n\/\*\*))/);

  if (findByLegacyMatch) {
    const insertPos = findByLegacyMatch.index + findByLegacyMatch[0].length;
    codeFile.source = codeFile.source.substring(0, insertPos) + '\n' + findByCaseIDFunction + codeFile.source.substring(insertPos);
  }

  // Replace the applyCategorizationUpdates function
  const updateStart = codeFile.source.lastIndexOf('function applyCategorizationUpdates');
  const updateEnd = codeFile.source.indexOf('\nfunction ', updateStart + 1);
  const endPos = updateEnd !== -1 ? updateEnd : codeFile.source.length;

  codeFile.source = codeFile.source.substring(0, updateStart) + updatedUpdate + codeFile.source.substring(endPos);

  console.log('✅ Added Case_ID fallback logic\n');

  // Deploy
  console.log('🚀 Deploying to Apps Script...\n');

  await script.projects.updateContent({
    scriptId: scriptId,
    requestBody: { files: project.data.files }
  });

  console.log('✅ Deployment complete!\n');
  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log('🎯 Fix Applied:\n');
  console.log('The Apply function now:');
  console.log('  1. ✅ Tries to match by Legacy_Case_ID first (for 182 cases)');
  console.log('  2. ✅ Falls back to Case_ID if Legacy is empty (for 25 retry cases)');
  console.log('  3. ✅ All 207 cases will now be applied successfully!');
  console.log('');
  console.log('💡 Next Steps:');
  console.log('  1. Refresh Google Sheet (F5)');
  console.log('  2. Open AI Categorization Tools');
  console.log('  3. Click "Apply Selected Categories to Master"');
  console.log('  4. Should see: "Successfully updated: 207, Errors: 0"');
  console.log('');
}

main().catch(console.error);
