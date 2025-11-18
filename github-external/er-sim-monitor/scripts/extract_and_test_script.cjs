#!/usr/bin/env node

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

async function extractAndTestScript() {
  try {
    console.log('🔍 EXTRACTING SCRIPT TAG TO CHECK FOR SYNTAX ERRORS\n');
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

    // Find buildBirdEyeViewUI_
    const funcStart = codeFile.source.indexOf('function buildBirdEyeViewUI_(');
    const funcEnd = codeFile.source.indexOf('\n}\n', funcStart);
    const funcCode = codeFile.source.substring(funcStart, funcEnd);

    // Extract just the <script> section
    const scriptStart = funcCode.indexOf("'  <script>' +");
    const scriptEnd = funcCode.indexOf("'  </script>' +");
    
    if (scriptStart === -1 || scriptEnd === -1) {
      console.log('❌ Could not find <script> tag\n');
      return;
    }

    const scriptSection = funcCode.substring(scriptStart, scriptEnd);

    // Count lines
    const lines = scriptSection.split('\n').length;
    console.log(`📊 Script section: ${lines} lines\n`);

    // Look for the IIFE that attaches events
    if (scriptSection.includes('(function() {')) {
      console.log('✅ Found IIFE for immediate execution\n');
      
      const iifeStart = scriptSection.indexOf('(function() {');
      const iifeContext = scriptSection.substring(iifeStart, iifeStart + 1500);
      
      console.log('📄 IIFE CONTEXT:\n');
      console.log(iifeContext);
      console.log('\n...\n');
    } else {
      console.log('❌ IIFE not found!\n');
    }

    // Check for common syntax errors
    console.log('🔍 SYNTAX CHECK:\n');
    
    // Check if quotes are balanced
    const singleQuotes = (scriptSection.match(/'/g) || []).length;
    console.log(`   Single quotes: ${singleQuotes} ${singleQuotes % 2 === 0 ? '✅' : '❌ ODD NUMBER!'}`);
    
    // Check for addEventListener calls
    const addEventListenerCount = (scriptSection.match(/addEventListener/g) || []).length;
    console.log(`   addEventListener calls: ${addEventListenerCount}\n`);

    if (addEventListenerCount === 0) {
      console.log('❌ NO addEventListener CALLS FOUND!\n');
      console.log('   The event listeners are not being attached.\n');
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

extractAndTestScript();
