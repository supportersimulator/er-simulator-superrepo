#!/usr/bin/env node

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

async function searchAllInlineHandlers() {
  try {
    console.log('🔍 SEARCHING FOR ALL INLINE EVENT HANDLERS\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

    const credPath = path.join(__dirname, '../config/credentials.json');
    const tokenPath = path.join(__dirname, '../config/token.json');

    const credentials = JSON.parse(fs.readFileSync(credPath, 'utf8'));
    const token = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));

    const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
    oAuth2Client.setCredentials(token);

    const script = google.script({ version: 'v1', auth: oAuth2Client });
    const scriptId = '12NihbVaaAIyRMCtzZ-aGjJ71CdL-HDjhmjxiD_S_EgIOuDOtrUH6M1l2';

    const content = await script.projects.getContent({ scriptId });
    const codeFile = content.data.files.find(f => f.name === 'Code');

    console.log('🔍 Searching for "handleLogicTypeChange" in Code.gs:\n');

    let matches = [];
    let searchPos = 0;
    
    while (true) {
      const idx = codeFile.source.indexOf('handleLogicTypeChange', searchPos);
      if (idx === -1) break;
      
      const context = codeFile.source.substring(idx - 50, idx + 100);
      matches.push({ position: idx, context });
      searchPos = idx + 1;
    }

    console.log(`Found ${matches.length} occurrences:\n`);

    matches.forEach((match, i) => {
      console.log(`${i + 1}. Position ${match.position}:`);
      console.log(`   ${match.context.replace(/\n/g, '\\n')}\n`);
    });

    // Now search for onchange= specifically
    console.log('\n🔍 Searching for "onchange=" in Code.gs:\n');

    let onchangeMatches = [];
    searchPos = 0;
    
    while (true) {
      const idx = codeFile.source.indexOf('onchange=', searchPos);
      if (idx === -1) break;
      
      const context = codeFile.source.substring(idx - 100, idx + 150);
      onchangeMatches.push({ position: idx, context });
      searchPos = idx + 1;
    }

    console.log(`Found ${onchangeMatches.length} occurrences:\n`);

    onchangeMatches.forEach((match, i) => {
      console.log(`${i + 1}. Position ${match.position}:`);
      console.log(`   ${match.context.replace(/\n/g, ' ')}\n`);
    });

    // Check Phase2_Modal_Integration.gs too
    console.log('\n🔍 Checking Phase2_Modal_Integration.gs:\n');
    
    const modalFile = content.data.files.find(f => f.name === 'Phase2_Modal_Integration');
    if (modalFile) {
      if (modalFile.source.includes('onchange=')) {
        console.log('⚠️  WARNING: Phase2_Modal_Integration.gs has onchange attributes!\n');
        const onchangeIdx = modalFile.source.indexOf('onchange=');
        const context = modalFile.source.substring(onchangeIdx - 100, onchangeIdx + 150);
        console.log(`   ${context}\n`);
      } else {
        console.log('✅ Phase2_Modal_Integration.gs is clean (no onchange)\n');
      }
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

searchAllInlineHandlers();
