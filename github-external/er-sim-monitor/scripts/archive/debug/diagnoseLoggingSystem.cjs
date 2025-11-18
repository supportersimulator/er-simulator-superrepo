#!/usr/bin/env node

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const TOKEN_PATH = path.join(__dirname, '..', 'config', 'token.json');
const SCRIPT_ID = process.env.APPS_SCRIPT_ID;

async function diagnoseLoggingSystem() {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('  DIAGNOSE LOGGING SYSTEM');
  console.log('═══════════════════════════════════════════════════');
  console.log('');

  const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/oauth2callback'
  );
  oauth2Client.setCredentials(token);

  const script = google.script({ version: 'v1', auth: oauth2Client });
  const response = await script.projects.getContent({ scriptId: SCRIPT_ID });
  const files = response.data.files;

  const codeFile = files.find(f => f.name === 'Code');

  console.log('Checking for critical logging components...');
  console.log('');

  const checks = [
    { name: 'Sidebar HTML with Live Logs', pattern: /<pre id="logOutput"/ },
    { name: 'getSidebarLogs() function', pattern: /function getSidebarLogs/ },
    { name: 'appendLogSafe() function', pattern: /function appendLogSafe/ },
    { name: 'Auto-refresh polling', pattern: /setInterval.*refreshLogs/ },
    { name: 'Sidebar display function', pattern: /showSidebar|createTemplate/ }
  ];

  let allPresent = true;
  checks.forEach(check => {
    const present = check.pattern.test(codeFile.source);
    console.log(`  ${present ? '✅' : '❌'} ${check.name}`);
    if (!present) allPresent = false;
  });

  console.log('');

  if (allPresent) {
    console.log('✅ All logging components are present in deployed code');
    console.log('');
    console.log('Possible reasons for "nothing in live logs":');
    console.log('');
    console.log('1. **Batch not running yet**:');
    console.log('   - Try clicking "Launch Batch Engine" in sidebar');
    console.log('   - Wait a few seconds for first log to appear');
    console.log('');
    console.log('2. **Sidebar not refreshed**:');
    console.log('   - Close and reopen the Google Sheets tab');
    console.log('   - Reopen the sidebar');
    console.log('');
    console.log('3. **Manual refresh needed**:');
    console.log('   - Click the "Refresh" button in Live Logs section');
    console.log('   - Auto-refresh runs every 5 seconds');
    console.log('');
    console.log('4. **Logs were cleared**:');
    console.log('   - If you clicked "Clear" button, logs are gone');
    console.log('   - Run batch again to generate new logs');
    console.log('');
  } else {
    console.log('❌ Some components are missing!');
    console.log('');
    console.log('This could be because:');
    console.log('  - The backup in apps-script-backup/Code.gs has the full sidebar');
    console.log('  - But the deployed version may be missing it');
    console.log('  - Need to redeploy the complete code');
  }
}

if (require.main === module) {
  diagnoseLoggingSystem().catch(error => {
    console.error('❌ Diagnosis failed:', error.message);
    process.exit(1);
  });
}

module.exports = { diagnoseLoggingSystem };
