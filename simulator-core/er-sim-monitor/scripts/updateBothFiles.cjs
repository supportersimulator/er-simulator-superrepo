const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const SCRIPT_ID = '12NihbVaaAIyRMCtzZ-aGjJ71CdL-HDjhmjxiD_S_EgIOuDOtrUH6M1l2';

function getOAuth2Client() {
  const clasprcPath = path.join(process.env.HOME, '.clasprc.json');
  const credentials = JSON.parse(fs.readFileSync(clasprcPath, 'utf8'));
  const token = credentials.tokens.default;
  const oauth2Client = new google.auth.OAuth2(token.client_id, token.client_secret);
  oauth2Client.setCredentials({
    access_token: token.access_token,
    refresh_token: token.refresh_token,
    token_type: token.token_type,
    expiry_date: token.expiry_date
  });
  return oauth2Client;
}

async function updateBothFiles() {
  const auth = getOAuth2Client();
  const script = google.script({ version: 'v1', auth });

  console.log('📝 Updating BOTH Ultimate Categorization files...\n');

  const getResponse = await script.projects.getContent({ scriptId: SCRIPT_ID });
  const files = getResponse.data.files;

  const updatedContent = fs.readFileSync(path.join(__dirname, '../Ultimate_Categorization_Tool_Complete.js'), 'utf8');

  // Update Ultimate_Categorization_Tool_Complete
  const completeFile = files.find(f => f.name === 'Ultimate_Categorization_Tool_Complete');
  if (completeFile) {
    completeFile.source = updatedContent;
    console.log('✅ Updated: Ultimate_Categorization_Tool_Complete');
  }

  // Also update Phase2E with the same code
  const phase2eFile = files.find(f => f.name === 'Ultimate_Categorization_Tool_Phase2E');
  if (phase2eFile) {
    phase2eFile.source = updatedContent;
    console.log('✅ Updated: Ultimate_Categorization_Tool_Phase2E');
  }

  await script.projects.updateContent({
    scriptId: SCRIPT_ID,
    requestBody: { files: files }
  });

  console.log('\n✅ Both files updated successfully!\n');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('CHANGES DEPLOYED TO BOTH FILES:');
  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log('1. extractCasesForCategorization() now uses header-based lookups');
  console.log('2. Finds columns by name instead of hardcoded indices');
  console.log('3. clearUltimateCategorizationResults() deletes from row 2 down');
  console.log('\nRegardless of which file Apps Script uses, the fix is now applied!');
  console.log('═══════════════════════════════════════════════════════════════');
}

updateBothFiles().catch(console.error);
