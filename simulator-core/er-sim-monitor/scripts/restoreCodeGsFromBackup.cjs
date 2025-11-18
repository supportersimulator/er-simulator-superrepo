const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const SCRIPT_ID = '12NihbVaaAIyRMCtzZ-aGjJ71CdL-HDjhmjxiD_S_EgIOuDOtrUH6M1l2';

function getOAuth2Client() {
  const credentialsPath = path.join(__dirname, '../config/credentials.json');
  const tokenPath = path.join(__dirname, '../config/token.json');
  const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
  const token = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
  const { client_id, client_secret, redirect_uris } = credentials.installed;
  const oauth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
  oauth2Client.setCredentials(token);
  return oauth2Client;
}

async function restoreCodeGs() {
  const auth = getOAuth2Client();
  const script = google.script({ version: 'v1', auth });

  console.log('🚨 EMERGENCY: Restoring Code.gs from backup...\n');

  // Use most recent backup
  const backupPath = path.join(__dirname, '../backups/apps-script-backup-2025-11-12/Code.gs');

  console.log(`📂 Reading backup: ${backupPath}\n`);

  if (!fs.existsSync(backupPath)) {
    console.error('❌ Backup file not found!');
    return;
  }

  const backupContent = fs.readFileSync(backupPath, 'utf8');
  console.log(`✅ Backup loaded: ${backupContent.split('\n').length} lines\n`);

  // Get current project
  const getResponse = await script.projects.getContent({ scriptId: SCRIPT_ID });
  const files = getResponse.data.files;

  // Find Code file
  const codeFile = files.find(f => f.name === 'Code');
  if (!codeFile) {
    console.error('❌ Code.gs file not found in project');
    return;
  }

  console.log('📝 Replacing Code.gs content with backup...\n');

  // Replace Code content
  codeFile.source = backupContent;

  // Update ONLY the Code file
  await script.projects.updateContent({
    scriptId: SCRIPT_ID,
    requestBody: { files: files }
  });

  console.log('✅ Code.gs restored successfully!\n');

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('RESTORATION COMPLETE');
  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log('Code.gs has been restored from the 2025-11-12 backup.');
  console.log('Please refresh your Google Sheet to see the full menu restored.');
  console.log('═══════════════════════════════════════════════════════════════');
}

restoreCodeGs().catch(console.error);
