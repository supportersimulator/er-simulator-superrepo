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

async function createMinimal() {
  const auth = getOAuth2Client();
  const script = google.script({ version: 'v1', auth });
  
  console.log('📥 Getting current files...\n');
  
  const res = await script.projects.getContent({ scriptId: SCRIPT_ID });
  const files = res.data.files;
  
  // Keep only essential files
  const essentialFiles = [
    'appsscript',
    'Code',
    'Ultimate_Categorization_Tool_Complete'
  ];
  
  const minimalFiles = files.filter(f => essentialFiles.includes(f.name));
  
  console.log('CURRENT FILES (' + files.length + '):');
  files.forEach(f => {
    const keep = essentialFiles.includes(f.name);
    console.log((keep ? '  ✅ KEEP: ' : '  ❌ REMOVE: ') + f.name);
  });
  
  console.log('\n⚠️  WARNING: This will remove ' + (files.length - minimalFiles.length) + ' files!');
  console.log('Creating backup first...\n');
  
  // Save backup
  const backupPath = path.join(__dirname, '../backups/before-minimal-' + new Date().toISOString().replace(/:/g, '-') + '.json');
  fs.writeFileSync(backupPath, JSON.stringify({ files: files }, null, 2));
  console.log('✅ Backup saved to: ' + path.basename(backupPath) + '\n');
  
  console.log('🔄 Deploying minimal project with ' + minimalFiles.length + ' files...');
  
  // Send only essential files
  await script.projects.updateContent({
    scriptId: SCRIPT_ID,
    requestBody: { files: minimalFiles }
  });
  
  console.log('✅ Minimal project deployed!');
  console.log('\nRemaining files:');
  minimalFiles.forEach(f => console.log('  - ' + f.name));
  console.log('\n🔍 Please refresh your Google Sheet.');
}

createMinimal().catch(console.error);
