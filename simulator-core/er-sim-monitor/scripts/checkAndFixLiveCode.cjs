const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const SCRIPT_ID = '12NihbVaaAIyRMCtzZ-aGjJ71CdL-HDjhmjxiD_S_EgIOuDOtrUH6M1l2';

function getOAuth2Client() {
  const clasprcPath = path.join(process.env.HOME, '.clasprc.json');
  const credentials = JSON.parse(fs.readFileSync(clasprcPath, 'utf8'));
  const token = credentials.tokens.default;

  const oauth2Client = new google.auth.OAuth2(
    token.client_id,
    token.client_secret
  );

  oauth2Client.setCredentials({
    access_token: token.access_token,
    refresh_token: token.refresh_token,
    token_type: token.token_type,
    expiry_date: token.expiry_date
  });

  return oauth2Client;
}

async function checkLiveCode() {
  try {
    console.log('🔑 Authenticating with Apps Script API...');
    const auth = getOAuth2Client();
    const script = google.script({ version: 'v1', auth });

    console.log('📥 Fetching current live code...');
    const response = await script.projects.getContent({
      scriptId: SCRIPT_ID
    });

    const files = response.data.files;
    const targetFile = files.find(f =>
      f.name === 'Ultimate_Categorization_Tool_Complete'
    );

    if (!targetFile) {
      console.log('❌ Ultimate_Categorization_Tool_Complete.gs not found in project');
      return;
    }

    console.log('✅ Found Ultimate_Categorization_Tool_Complete.gs');
    console.log('📊 Checking line 1534 (Column M fix)...\n');

    const lines = targetFile.source.split('\n');
    const line1534 = lines[1533]; // Zero-indexed

    console.log('Line 1534:', line1534);

    if (line1534.includes('suggestedSymptomName')) {
      console.log('\n✅ FIX IS ALREADY DEPLOYED! Line 1534 uses suggestedSymptomName');
      console.log('\n🔍 This means the data you\'re seeing is from BEFORE the fix was deployed.');
      console.log('📝 Solution: Clear AI_Categorization_Results sheet and re-run categorization\n');
      return { status: 'fixed', needsRerun: true };
    } else if (line1534.includes('suggestedSymptom,')) {
      console.log('\n❌ FIX NOT DEPLOYED! Line 1534 still uses suggestedSymptom (wrong)');
      console.log('🔧 Would you like me to deploy the fix? (run with --deploy flag)\n');
      return { status: 'needs_fix', line: line1534 };
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Details:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

async function deployFix() {
  try {
    console.log('🔑 Authenticating with Apps Script API...');
    const auth = getOAuth2Client();
    const script = google.script({ version: 'v1', auth });

    console.log('📥 Fetching current project...');
    const getResponse = await script.projects.getContent({
      scriptId: SCRIPT_ID
    });

    const files = getResponse.data.files;
    const targetFile = files.find(f =>
      f.name === 'Ultimate_Categorization_Tool_Complete'
    );

    if (!targetFile) {
      console.log('❌ File not found');
      return;
    }

    // Read the fixed code from backup
    const fixedCodePath = path.join(__dirname, '..', 'backups',
      'Apps_Script_Backup_2025-11-13T04-18-16',
      'Ultimate_Categorization_Tool_Complete.gs');

    const fixedCode = fs.readFileSync(fixedCodePath, 'utf8');

    console.log('📝 Applying fix from backup...');
    targetFile.source = fixedCode;

    console.log('🚀 Deploying to Apps Script...');
    await script.projects.updateContent({
      scriptId: SCRIPT_ID,
      requestBody: {
        files: files
      }
    });

    console.log('✅ Fix deployed successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Open your spreadsheet');
    console.log('2. Delete or clear AI_Categorization_Results sheet');
    console.log('3. Run AI Categorization again');
    console.log('4. Column M should now show full symptom names\n');
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Details:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Main execution
const args = process.argv.slice(2);
if (args.includes('--deploy')) {
  deployFix();
} else {
  checkLiveCode();
}
