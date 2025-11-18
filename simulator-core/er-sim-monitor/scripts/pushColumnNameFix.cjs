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

async function updateFile() {
  const auth = getOAuth2Client();
  const script = google.script({ version: 'v1', auth });

  console.log('📝 Pushing updated applyUltimateCategorizationToMaster function...\n');

  const getResponse = await script.projects.getContent({ scriptId: SCRIPT_ID });
  const files = getResponse.data.files;

  const targetFile = files.find(f => f.name === 'Ultimate_Categorization_Tool_Complete');
  const updatedContent = fs.readFileSync(path.join(__dirname, '../Ultimate_Categorization_Tool_Complete.js'), 'utf8');

  targetFile.source = updatedContent;

  await script.projects.updateContent({
    scriptId: SCRIPT_ID,
    requestBody: { files: files }
  });

  console.log('✅ Updated successfully!\n');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('CHANGES MADE');
  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log('Updated applyUltimateCategorizationToMaster() to use column names:');
  console.log('');
  console.log('BEFORE (hardcoded column numbers):');
  console.log('  masterSheet.getRange(j + 1, 16).setValue(...)  // Column P');
  console.log('  masterSheet.getRange(j + 1, 17).setValue(...)  // Column Q');
  console.log('  masterSheet.getRange(j + 1, 18).setValue(...)  // Column R');
  console.log('  masterSheet.getRange(j + 1, 19).setValue(...)  // Column S');
  console.log('');
  console.log('AFTER (finds columns by header name):');
  console.log('  1. Reads Master sheet row 2 headers');
  console.log('  2. Finds index of "Case_Organization_Category_Symptom_Code"');
  console.log('  3. Finds index of "Case_Organization_Category_System_Code"');
  console.log('  4. Finds index of "Case_Organization_Category_Symptom"');
  console.log('  5. Finds index of "Case_Organization_Category_System"');
  console.log('  6. Uses those indices to write values');
  console.log('');
  console.log('✅ BENEFIT:');
  console.log('  • Future-proof: You can add columns before P-S without breaking the code');
  console.log('  • Maintainable: Code documents which columns it writes to');
  console.log('  • Safe: Will error if expected columns are missing');
  console.log('  • Transparent: Logs which columns were found during execution');
  console.log('\n═══════════════════════════════════════════════════════════════');
}

updateFile().catch(console.error);
