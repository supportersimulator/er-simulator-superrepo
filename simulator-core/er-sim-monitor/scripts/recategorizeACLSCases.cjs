/**
 * Re-Categorize 19 ACLS Cases
 *
 * Re-runs AI categorization for the 19 cases incorrectly categorized as ACLS.
 * Now that ACLS protections are deployed, these should categorize correctly
 * as AMIN, PE, CP, etc.
 */

const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function main() {
  console.log('🔄 Re-Categorizing 19 ACLS Cases\n');
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

  // Load the list of Case_IDs to re-categorize
  const caseIDs = JSON.parse(fs.readFileSync('./data/acls_recategorize_list.json', 'utf-8'));

  console.log('📋 Cases to Re-Categorize: ' + caseIDs.length + '\n');
  caseIDs.forEach(id => console.log('  - ' + id));
  console.log('');

  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('🤖 Calling Apps Script to re-run AI categorization...\n');

  // Call the recategorizeSpecificCases function in Apps Script
  try {
    const response = await script.scripts.run({
      scriptId: scriptId,
      requestBody: {
        function: 'recategorizeSpecificCases',
        parameters: [caseIDs],
        devMode: false
      }
    });

    if (response.data.error) {
      console.log('❌ Error from Apps Script:\n');
      console.log('   ' + JSON.stringify(response.data.error, null, 2));
      console.log('');
      console.log('⚠️  The recategorizeSpecificCases function may not exist yet.\n');
      console.log('📋 Manual Steps:\n');
      console.log('  1. Refresh Google Sheet (F5)');
      console.log('  2. Open AI Categorization panel');
      console.log('  3. Select "Specific Rows" mode');
      console.log('  4. Enter row spec: "7,13,17,27,29,32,34,46,80,90,96,157,165,174,176,203,204,206,208"');
      console.log('  5. Click "Launch Batch Engine"');
      console.log('  6. Wait for completion\n');
      console.log('Expected results:');
      console.log('  - Most will become AMIN (Acute Myocardial Infarction)');
      console.log('  - Some will become PE (Pulmonary Embolism)');
      console.log('  - One will become ANA (Anaphylaxis)\n');
      return;
    }

    const result = response.data.response ? response.data.response.result : null;

    if (result) {
      console.log('✅ Re-Categorization Complete!\n');
      console.log('═══════════════════════════════════════════════════════════════\n');
      console.log('📊 Results:\n');
      console.log(JSON.stringify(result, null, 2));
      console.log('');
    } else {
      console.log('✅ Function executed but no result returned\n');
    }

  } catch (error) {
    console.log('❌ Error calling Apps Script:\n');
    console.log(error.message);
    console.log('');
    console.log('⚠️  Apps Script execution may require additional setup.\n');
    console.log('📋 Manual Steps:\n');
    console.log('  1. Refresh Google Sheet (F5)');
    console.log('  2. Open AI Categorization panel');
    console.log('  3. Select "Specific Rows" mode');
    console.log('  4. Enter these Case_IDs in the UI:\n');
    console.log('     ' + caseIDs.join(','));
    console.log('');
    console.log('  OR enter row numbers:');
    console.log('     7,13,17,27,29,32,34,46,80,90,96,157,165,174,176,203,204,206,208\n');
    console.log('  5. Click "Launch Batch Engine"');
    console.log('  6. Wait for completion\n');
  }

  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('🔍 After Re-Categorization:\n');
  console.log('  Run this to verify fix worked:');
  console.log('    node scripts/reviewACLSCases.cjs\n');
  console.log('  Expected: 0 ACLS cases (all fixed to AMIN, PE, etc.)\n');
}

main().catch(console.error);
