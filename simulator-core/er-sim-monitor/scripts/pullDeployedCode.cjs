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

async function pullCode() {
  const auth = getOAuth2Client();
  const script = google.script({ version: 'v1', auth });

  console.log('📥 Pulling deployed code from Apps Script...\\n');

  const getResponse = await script.projects.getContent({ scriptId: SCRIPT_ID });
  const files = getResponse.data.files;

  const targetFile = files.find(f => f.name === 'Ultimate_Categorization_Tool_Complete');

  if (!targetFile) {
    console.log('❌ File not found!');
    return;
  }

  console.log('✅ Found file: ' + targetFile.name);
  console.log('   Type: ' + targetFile.type);
  console.log('   Size: ' + targetFile.source.length + ' characters\\n');

  // Search for the prompt building function
  const promptMatch = targetFile.source.match(/Analyze these \d+ cases and assign EXACTLY ONE[^]*?Valid symptoms:/);

  if (promptMatch) {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('FOUND DEPLOYED PROMPT:');
    console.log('═══════════════════════════════════════════════════════════════\\n');
    console.log(promptMatch[0].substring(0, 1000));
    console.log('\\n[... truncated ...]\\n');
  } else {
    console.log('❌ Could not find prompt in deployed code');
  }

  // Search for buildCategorizationPrompt function
  const funcMatch = targetFile.source.match(/function buildCategorizationPrompt[^]*?return prompt;/);

  if (funcMatch) {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('DEPLOYED buildCategorizationPrompt FUNCTION:');
    console.log('═══════════════════════════════════════════════════════════════\\n');
    console.log(funcMatch[0]);
    console.log('');
  }

  // Save to temp file for inspection
  const tempPath = path.join(__dirname, '../deployed_version.js');
  fs.writeFileSync(tempPath, targetFile.source);
  console.log('\\n✅ Saved deployed version to: deployed_version.js');
}

pullCode().catch(console.error);
