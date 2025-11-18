#!/usr/bin/env node

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

require('dotenv').config();

const TOKEN_PATH = path.join(__dirname, '..', 'config', 'token.json');
const CREDENTIALS_PATH = path.join(__dirname, '..', 'config', 'credentials.json');
const SCRIPT_ID = process.env.APPS_SCRIPT_ID;

async function findPanelBuilders() {
  console.log('🔍 Searching for Panel Builder Functions\n');
  console.log('══════════════════════════════════════════════════════════════\n');

  try {
    const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH));
    const { client_secret, client_id, redirect_uris } = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
    const token = JSON.parse(fs.readFileSync(TOKEN_PATH));
    oAuth2Client.setCredentials(token);

    const script = google.script({ version: 'v1', auth: oAuth2Client });
    const projectResponse = await script.projects.getContent({ scriptId: SCRIPT_ID });
    const files = projectResponse.data.files;

    const functionsToFind = [
      'buildCategoriesPathwaysMainMenu_',
      'buildEnhancedCategoriesTab',
      'runAICategorization'
    ];

    functionsToFind.forEach(funcName => {
      console.log(`\n📦 ${funcName}:\n`);

      files.forEach(file => {
        const content = file.source || '';
        const lines = content.split('\n');

        lines.forEach((line, idx) => {
          if (line.includes(`function ${funcName}`)) {
            console.log(`  ✅ DEFINED in ${file.name}:${idx + 1}`);
            console.log(`     ${line.trim()}`);
          }
        });
      });
    });

    console.log('\n══════════════════════════════════════════════════════════════\n');
    console.log('🔬 DETAILED ANALYSIS:\n');

    // Check what the AI Categorization section in Code.gs contains
    const codeFile = files.find(f => f.name === 'Code');
    if (codeFile) {
      const lines = codeFile.source.split('\n');

      // Find AI AUTO-CATEGORIZATION section
      const aiSectionStart = lines.findIndex(l => l.includes('AI AUTO-CATEGORIZATION SYSTEM (Updated 2025-11-10)'));

      if (aiSectionStart > 0) {
        console.log('Code.gs AI AUTO-CATEGORIZATION SYSTEM section:\n');
        console.log(`  Starts at line: ${aiSectionStart + 1}`);

        // Find all functions in this section (until next major section)
        const functionsInSection = [];
        for (let i = aiSectionStart; i < Math.min(aiSectionStart + 2000, lines.length); i++) {
          const line = lines[i];
          if (line.match(/^function \w+/)) {
            functionsInSection.push({
              line: i + 1,
              name: line.match(/^function (\w+)/)[1]
            });
          }
          // Stop at next major section
          if (i > aiSectionStart + 10 && line.match(/^\/\/ ={20,}/)) {
            break;
          }
        }

        console.log(`  Functions in this section (${functionsInSection.length}):\n`);
        functionsInSection.forEach(f => {
          console.log(`    - ${f.name} (line ${f.line})`);
        });
      }
    }

    console.log('\n══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

findPanelBuilders();
