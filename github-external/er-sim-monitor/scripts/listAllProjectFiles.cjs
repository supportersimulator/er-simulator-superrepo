#!/usr/bin/env node

/**
 * List All Files in Apps Script Project
 */

const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

async function main() {
  console.log('📋 Listing All Apps Script Files\n');
  console.log('══════════════════════════════════════════════════════════════\n');

  const token = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'config', 'token.json'), 'utf-8'));
  const credentials = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'config', 'credentials.json'), 'utf-8'));
  const { client_secret, client_id, redirect_uris } = credentials.installed;

  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
  oAuth2Client.setCredentials(token);

  const script = google.script({ version: 'v1', auth: oAuth2Client });
  const scriptId = process.env.APPS_SCRIPT_ID;

  const project = await script.projects.getContent({ scriptId });

  console.log('Total files:', project.data.files.length, '\n');

  project.data.files.forEach((file, index) => {
    const ext = file.type === 'SERVER_JS' ? '.gs' : file.type === 'HTML' ? '.html' : '.json';
    const size = Math.round(file.source.length / 1024);
    console.log(`${index + 1}. ${file.name}${ext}`);
    console.log(`   Type: ${file.type}, Size: ${size} KB`);

    // Check for key functions
    if (file.source.includes('function showCategoriesAndPathwaysPanel')) {
      console.log('   ⭐ Contains showCategoriesAndPathwaysPanel()');
    }

    if (file.source.includes('function buildCategoriesPathwaysMainMenu_')) {
      console.log('   ⭐ Contains buildCategoriesPathwaysMainMenu_()');
    }

    if (file.source.includes('function runAICategorization')) {
      console.log('   ⭐ Contains runAICategorization()');
    }

    console.log('');
  });

  console.log('══════════════════════════════════════════════════════════════\n');
}

main().catch(console.error);
