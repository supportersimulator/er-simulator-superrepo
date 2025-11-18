#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

async function authorize() {
  const credentialsPath = path.join(__dirname, '../config/credentials.json');
  const tokenPath = path.join(__dirname, '../config/token.json');
  const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
  const token = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
  const opts = credentials.installed || credentials.web;
  const oAuth2Client = new google.auth.OAuth2(opts.client_id, opts.client_secret, opts.redirect_uris[0]);
  oAuth2Client.setCredentials(token);
  return oAuth2Client;
}

async function checkFolder() {
  const auth = await authorize();
  const drive = google.drive({ version: 'v3', auth });

  const folderId = '1q-OWAS0sgoqGg1hPHT7GYCKV6yCSquh3';

  const files = await drive.files.list({
    q: "'" + folderId + "' in parents and trashed=false",
    fields: 'files(name, size)',
    pageSize: 100
  });

  console.log('\n✅ Found ' + files.data.files.length + ' files in "Lost and Found":\n');

  const critical = ['Code.gs', 'ATSR', 'Categories_Pathways'];
  let found = 0;

  files.data.files.forEach(f => {
    const hasCritical = critical.some(c => f.name.includes(c));
    const size = f.size ? Math.round(f.size / 1024) + ' KB' : 'N/A';
    console.log((hasCritical ? '✅ ' : '   ') + f.name + ' (' + size + ')');
    if (hasCritical) found++;
  });

  console.log('\n' + (found > 0 ? '✅' : '❌') + ' ' + found + ' critical files backed up\n');
}

checkFolder().catch(console.error);
