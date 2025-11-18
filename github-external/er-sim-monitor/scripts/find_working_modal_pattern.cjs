#!/usr/bin/env node

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

async function findWorkingModalPattern() {
  try {
    console.log('🔍 FINDING WORKING MODAL PATTERNS\n');
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

    console.log('📋 SEARCHING FOR MODAL PATTERNS IN CODE.GS:\n');

    // Search for any function that creates HTML with <head>
    const headMatches = [];
    let searchPos = 0;
    
    while (true) {
      const headIdx = codeFile.source.indexOf('<head>', searchPos);
      if (headIdx === -1) break;
      
      // Find the function name that contains this <head>
      const funcStart = codeFile.source.lastIndexOf('function ', headIdx);
      const funcNameEnd = codeFile.source.indexOf('(', funcStart);
      const funcName = codeFile.source.substring(funcStart + 9, funcNameEnd).trim();
      
      headMatches.push({ funcName, position: headIdx });
      searchPos = headIdx + 1;
    }

    console.log(`Found ${headMatches.length} functions with <head> tags:\n`);
    headMatches.forEach((match, idx) => {
      console.log(`${idx + 1}. ${match.funcName}`);
    });

    // Now let's check buildBirdEyeViewUI_ specifically
    console.log('\n\n📄 CURRENT buildBirdEyeViewUI_ STRUCTURE:\n');
    
    const birdEyeIdx = codeFile.source.indexOf('function buildBirdEyeViewUI_');
    const nextFuncIdx = codeFile.source.indexOf('\nfunction ', birdEyeIdx + 1);
    
    // Get just the beginning to see the structure
    const beginning = codeFile.source.substring(birdEyeIdx, birdEyeIdx + 2000);
    console.log(beginning);
    console.log('\n...\n');

    // Check where <script> tag currently is in buildBirdEyeViewUI_
    const scriptTagIdx = codeFile.source.indexOf("'  <script>' +", birdEyeIdx);
    const scriptContext = codeFile.source.substring(scriptTagIdx - 200, scriptTagIdx + 500);
    
    console.log('📄 CURRENT <script> TAG LOCATION IN buildBirdEyeViewUI_:\n');
    console.log(scriptContext);
    console.log('\n...\n');

  } catch (error) {
    console.error('Error:', error.message);
  }
}

findWorkingModalPattern();
