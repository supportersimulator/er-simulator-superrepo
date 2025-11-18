#!/usr/bin/env node

/**
 * Find Sidebar HTML
 *
 * Locate the HTML file that contains the Live Logs display
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const TOKEN_PATH = path.join(__dirname, '..', 'config', 'token.json');
const SCRIPT_ID = process.env.APPS_SCRIPT_ID;

async function findSidebarHTML() {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('  FIND SIDEBAR HTML');
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

  console.log('All files in project:');
  files.forEach(f => {
    console.log(`  - ${f.name} (${f.type})`);
  });
  console.log('');

  // Check Code.gs for sidebar creation
  const codeFile = files.find(f => f.name === 'Code');
  console.log('Looking for sidebar creation in Code.gs...');

  const sidebarMatches = codeFile.source.match(/HtmlService\.createHtmlOutputFromFile\(['"](\w+)['"]\)/g);
  if (sidebarMatches) {
    console.log('Found HtmlService calls:');
    sidebarMatches.forEach(m => console.log('  ' + m));
  } else {
    console.log('No HtmlService.createHtmlOutputFromFile found');
  }
  console.log('');

  // Look for showSidebar or similar function
  const showSidebarMatch = codeFile.source.match(/function \w*[Ss]idebar\w*\([^)]*\)\s*{[\s\S]{0,500}?}/);
  if (showSidebarMatch) {
    console.log('Found sidebar function:');
    console.log(showSidebarMatch[0]);
  }
  console.log('');

  // Check if there's a backup in apps-script-backup
  const backupPath = path.join(__dirname, '..', 'apps-script-backup', 'full-project.json');
  if (fs.existsSync(backupPath)) {
    console.log('Found backup file, checking for HTML files...');
    const backup = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
    if (backup.files) {
      const htmlFiles = backup.files.filter(f => f.type === 'HTML');
      console.log(`Found ${htmlFiles.length} HTML files in backup:`);
      htmlFiles.forEach(f => {
        console.log(`  - ${f.name}`);
        const hasLiveLogs = /live.?log/i.test(f.source);
        const hasPolling = /setInterval|setTimeout/.test(f.source);
        console.log(`    Has live log: ${hasLiveLogs}, Has polling: ${hasPolling}`);
      });
    }
  }
}

if (require.main === module) {
  findSidebarHTML().catch(error => {
    console.error('');
    console.error('❌ SEARCH FAILED');
    console.error('════════════════════════════════════════════════════');
    console.error(`Error: ${error.message}`);
    console.error('');
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  });
}

module.exports = { findSidebarHTML };
