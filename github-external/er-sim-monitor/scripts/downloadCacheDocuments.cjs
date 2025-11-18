#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

async function authorize() {
  const credentialsPath = path.join(__dirname, '../config/credentials.json');
  const tokenPath = path.join(__dirname, '../config/token.json');
  const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
  const token = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
  const { client_secret, client_id, redirect_uris} = credentials.installed || credentials.web;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
  oAuth2Client.setCredentials(token);
  return oAuth2Client;
}

async function downloadDocs() {
  try {
    const auth = await authorize();
    const drive = google.drive({ version: 'v3', auth });

    const docsToDownload = [
      { id: '1Rjhgm_mcYBXnf3MsLSb36OIN3SS6lzNu', name: 'CACHE_FIX_RESUME_POINT.md' },
      { id: '1WrD3RQp_vOgJZkWZuz_dO9R8VYb8uFCx', name: 'CACHE_FIX_IMPLEMENTATION_PLAN.md' },
      { id: '1Q_8ZmwYF8Gb3tImpVJyj5MbmvQ8WnhHZ', name: 'CACHE_FIX_DEPLOYMENT_COMPLETE.md' },
      { id: '1gpDfgnszXU6olC3Utq7cICPqjaicAPI5', name: 'CACHE_SYSTEM_SUCCESS.md' },
      { id: '1US3a7mhdNj1JUTHOnLVb41ZlyJF42KJ6', name: 'Advanced_Cache_System_Multi_Step_Cache_Enrichment.gs' }
    ];

    const docsDir = path.join(__dirname, '../docs/cache-system');
    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir, { recursive: true });
    }

    console.log('📥 Downloading cache system documentation...\\n');

    for (const doc of docsToDownload) {
      console.log('Downloading: ' + doc.name);

      const response = await drive.files.get({
        fileId: doc.id,
        alt: 'media'
      }, { responseType: 'text' });

      const savePath = path.join(docsDir, doc.name);
      fs.writeFileSync(savePath, response.data, 'utf8');

      console.log('✅ Saved to: ' + savePath + '\\n');
    }

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✅ ALL CACHE DOCUMENTATION DOWNLOADED');
    console.log('═══════════════════════════════════════════════════════════════\\n');
    console.log('Location: ' + docsDir);
    console.log('\\nFiles:');
    docsToDownload.forEach(doc => console.log('  - ' + doc.name));
    console.log('\\n═══════════════════════════════════════════════════════════════\\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', error.response.status + ' ' + error.response.statusText);
    }
    process.exit(1);
  }
}

downloadDocs();
