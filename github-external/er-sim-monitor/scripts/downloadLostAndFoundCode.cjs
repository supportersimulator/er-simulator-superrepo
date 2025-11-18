#!/usr/bin/env node

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

async function downloadLostAndFound() {
  const credentialsPath = path.join(__dirname, '../config/credentials.json');
  const tokenPath = path.join(__dirname, '../config/token.json');
  const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
  const token = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
  const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
  oAuth2Client.setCredentials(token);

  const drive = google.drive({ version: 'v3', auth: oAuth2Client });
  const script = google.script({ version: 'v1', auth: oAuth2Client });

  // Get the Apps Script project from Lost and Found
  console.log('📥 Downloading Apps Script project from Lost and Found...\n');

  const filesRes = await drive.files.list({
    q: "'1q-OWAS0sgoqGg1hPHT7GYCKV6yCSquh3' in parents and mimeType='application/vnd.google-apps.script'",
    fields: 'files(id, name)',
    pageSize: 10
  });

  if (filesRes.data.files.length === 0) {
    console.log('No Apps Script projects found in Lost and Found\n');
    return;
  }

  const scriptFile = filesRes.data.files[0];
  console.log('Found: ' + scriptFile.name);
  console.log('ID: ' + scriptFile.id);
  console.log('');

  // Download the script content
  const content = await script.projects.getContent({
    scriptId: scriptFile.id
  });

  const codeFile = content.data.files.find(f => f.name === 'Code');
  if (!codeFile) {
    console.log('No Code file found\n');
    return;
  }

  // Save to file
  const savePath = '/tmp/lost_and_found_code.gs';
  fs.writeFileSync(savePath, codeFile.source, 'utf8');

  console.log('✅ Saved to: ' + savePath);
  console.log('Size: ' + (codeFile.source.length / 1024).toFixed(1) + 'KB\n');

  // Search for runPathwayChainBuilder in the old code
  if (codeFile.source.includes('runPathwayChainBuilder')) {
    console.log('✅ Found runPathwayChainBuilder() function\n');

    // Extract the function
    const funcStart = codeFile.source.indexOf('function runPathwayChainBuilder');
    const funcEnd = codeFile.source.indexOf('\nfunction ', funcStart + 10);
    const func = codeFile.source.substring(funcStart, funcEnd !== -1 ? funcEnd : funcStart + 2000);

    console.log('════════════════════════════════════════════════════════');
    console.log('OLD runPathwayChainBuilder() from Lost and Found:');
    console.log('════════════════════════════════════════════════════════');
    console.log(func);
    console.log('════════════════════════════════════════════════════════\n');
  }

  // Also search for how batch processing was triggered
  if (codeFile.source.includes('performCacheWithProgress')) {
    console.log('✅ Found performCacheWithProgress() function\n');

    const funcStart = codeFile.source.indexOf('function performCacheWithProgress');
    const funcEnd = codeFile.source.indexOf('\nfunction ', funcStart + 10);
    const func = codeFile.source.substring(funcStart, funcEnd !== -1 ? funcEnd : funcStart + 1000);

    console.log('════════════════════════════════════════════════════════');
    console.log('OLD performCacheWithProgress() from Lost and Found:');
    console.log('════════════════════════════════════════════════════════');
    console.log(func);
    console.log('════════════════════════════════════════════════════════\n');
  }
}

downloadLostAndFound().catch(console.error);
