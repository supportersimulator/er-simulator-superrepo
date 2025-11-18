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

async function saveToDrive() {
  const auth = getOAuth2Client();
  const drive = google.drive({ version: 'v3', auth });
  const script = google.script({ version: 'v1', auth });
  
  const timestamp = new Date().toISOString().split('.')[0].replace(/:/g, '-');
  const folderName = 'Apps Script Backup - Working - ' + timestamp;
  
  console.log('📂 Creating backup folder: ' + folderName + '\n');
  
  // Create backup folder
  const folderMetadata = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder'
  };
  
  const folder = await drive.files.create({
    resource: folderMetadata,
    fields: 'id, name'
  });
  
  console.log('✅ Folder created: ' + folder.data.name);
  console.log('   ID: ' + folder.data.id + '\n');
  
  // Get current Apps Script files
  console.log('📥 Downloading current Apps Script files...\n');
  const res = await script.projects.getContent({ scriptId: SCRIPT_ID });
  const files = res.data.files;
  
  console.log('📤 Uploading files to Drive:\n');
  
  for (const file of files) {
    const fileName = file.name + (file.type === 'SERVER_JS' ? '.gs' : file.type === 'HTML' ? '.html' : '.json');
    
    const fileMetadata = {
      name: fileName,
      parents: [folder.data.id]
    };
    
    const media = {
      mimeType: 'text/plain',
      body: file.source
    };
    
    await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id, name'
    });
    
    console.log('  ✅ ' + fileName);
  }
  
  // Also save a metadata file
  const metadata = {
    timestamp: new Date().toISOString(),
    scriptId: SCRIPT_ID,
    description: 'Working copy - Menu fully restored',
    fileCount: files.length,
    files: files.map(f => ({ name: f.name, type: f.type, size: f.source.length }))
  };
  
  const metadataFile = {
    name: 'BACKUP_METADATA.json',
    parents: [folder.data.id]
  };
  
  const metadataMedia = {
    mimeType: 'application/json',
    body: JSON.stringify(metadata, null, 2)
  };
  
  await drive.files.create({
    resource: metadataFile,
    media: metadataMedia,
    fields: 'id, name'
  });
  
  console.log('  ✅ BACKUP_METADATA.json\n');
  
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('✅ BACKUP COMPLETE!');
  console.log('   Folder: ' + folderName);
  console.log('   Files: ' + (files.length + 1));
  console.log('   Location: Google Drive > Apps Script Backups');
  console.log('═══════════════════════════════════════════════════════════════');
}

saveToDrive().catch(console.error);
