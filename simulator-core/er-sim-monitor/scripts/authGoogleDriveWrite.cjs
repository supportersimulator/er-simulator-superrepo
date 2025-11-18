#!/usr/bin/env node

/**
 * Re-authenticate with Google Drive write permissions
 * This will request drive.file scope to create folders and upload files
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const http = require('http');
const url = require('url');
const open = require('open');

const SCOPES = [
  'https://www.googleapis.com/auth/script.processes',
  'https://www.googleapis.com/auth/script.projects',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file'  // Changed from drive.readonly to drive.file
];

const CREDENTIALS_PATH = path.join(__dirname, '../config/credentials.json');
const TOKEN_PATH = path.join(__dirname, '../config/token.json');

async function authenticate() {
  console.log('\n🔑 RE-AUTHENTICATING WITH GOOGLE DRIVE WRITE ACCESS\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
  const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;

  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

  console.log('📋 Requested Scopes:\n');
  SCOPES.forEach(scope => {
    console.log(`   • ${scope}`);
  });
  console.log('');

  return new Promise((resolve, reject) => {
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      prompt: 'consent'  // Force consent screen to get new refresh token
    });

    console.log('🌐 Opening browser for authorization...\n');
    console.log('   If browser doesn\'t open, visit this URL:\n');
    console.log(`   ${authUrl}\n`);

    const server = http.createServer(async (req, res) => {
      try {
        if (req.url.indexOf('/oauth2callback') > -1) {
          const qs = new url.URL(req.url, 'http://localhost:3000').searchParams;
          const code = qs.get('code');

          res.end('✅ Authentication successful! You can close this window.');
          server.close();

          const { tokens } = await oAuth2Client.getToken(code);
          oAuth2Client.setCredentials(tokens);

          fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));

          console.log('✅ Authentication successful!\n');
          console.log('📁 Token saved to:', TOKEN_PATH);
          console.log('\n🔍 Token Scopes:\n');
          console.log(`   ${tokens.scope}\n`);
          console.log('═══════════════════════════════════════════════════════════════');
          console.log('🎉 You can now upload files to Google Drive!\n');
          console.log('Run: node scripts/backupPathwaysPhase2ToDrive.cjs\n');
          console.log('═══════════════════════════════════════════════════════════════\n');

          resolve(oAuth2Client);
        }
      } catch (e) {
        console.error('❌ Error during authentication:', e);
        reject(e);
      }
    }).listen(3000, () => {
      open(authUrl, { wait: false }).then(cp => cp.unref());
    });
  });
}

authenticate().catch(console.error);
