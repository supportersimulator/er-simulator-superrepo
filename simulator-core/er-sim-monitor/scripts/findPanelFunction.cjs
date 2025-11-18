#!/usr/bin/env node

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

require('dotenv').config();

const TOKEN_PATH = path.join(__dirname, '..', 'config', 'token.json');
const CREDENTIALS_PATH = path.join(__dirname, '..', 'config', 'credentials.json');
const SCRIPT_ID = process.env.APPS_SCRIPT_ID;

async function findPanelFunction() {
  console.log('🔍 Searching for buildCategoriesPathwaysMainMenu_\n');

  try {
    const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH));
    const { client_secret, client_id, redirect_uris } = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
    const token = JSON.parse(fs.readFileSync(TOKEN_PATH));
    oAuth2Client.setCredentials(token);

    const script = google.script({ version: 'v1', auth: oAuth2Client });
    const projectResponse = await script.projects.getContent({ scriptId: SCRIPT_ID });
    const files = projectResponse.data.files;

    const results = [];

    files.forEach(file => {
      const content = file.source || '';
      const lines = content.split('\n');

      lines.forEach((line, idx) => {
        if (line.includes('buildCategoriesPathwaysMainMenu_')) {
          results.push({
            file: file.name,
            line: idx + 1,
            code: line.trim().substring(0, 80)
          });
        }
      });
    });

    console.log(`Found ${results.length} references:\n`);

    results.forEach(r => {
      console.log(`${r.file}:${r.line}`);
      console.log(`  ${r.code}`);
      console.log();
    });

    // Check which file has the DEFINITION (not just calls)
    console.log('='.repeat(60));
    console.log('\n🔬 Function Definitions:\n');

    files.forEach(file => {
      if ((file.source || '').includes('function buildCategoriesPathwaysMainMenu_()')) {
        console.log(`✅ ${file.name} - HAS FUNCTION DEFINITION`);
      }
    });

    console.log();

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

findPanelFunction();
