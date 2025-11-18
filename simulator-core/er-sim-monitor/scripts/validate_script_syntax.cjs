#!/usr/bin/env node

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

async function validateScriptSyntax() {
  try {
    console.log('🔍 VALIDATING SCRIPT SYNTAX\n');
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

    // Extract the script section and convert to actual JavaScript
    const funcStart = codeFile.source.indexOf('function buildBirdEyeViewUI_(');
    const funcEnd = codeFile.source.indexOf('\n}\n', funcStart);
    const funcCode = codeFile.source.substring(funcStart, funcEnd);

    const scriptStart = funcCode.indexOf("'  <script>' +");
    const scriptEnd = funcCode.indexOf("'  </script>' +");
    const scriptSection = funcCode.substring(scriptStart, scriptEnd);

    // Convert Apps Script string concatenation to actual JavaScript
    let actualJS = scriptSection
      .replace(/'  <script>' \+/g, '')
      .replace(/'\s*\+\s*'/g, '')
      .replace(/'\s*\+$/gm, '')
      .replace(/^\s*'/gm, '')
      .replace(/\\'/g, "'")
      .replace(/\\"/g, '"');

    console.log('📄 EXTRACTED JAVASCRIPT (first 2000 chars):\n');
    console.log(actualJS.substring(0, 2000));
    console.log('\n...\n');

    // Try to evaluate it to check for syntax errors
    console.log('🔍 SYNTAX VALIDATION:\n');
    try {
      new Function(actualJS);
      console.log('   ✅ JavaScript syntax is VALID\n');
    } catch (syntaxError) {
      console.log('   ❌ SYNTAX ERROR FOUND!\n');
      console.log('   Error:', syntaxError.message, '\n');
      console.log('   This is why the script doesn\'t run!\n');
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

validateScriptSyntax();
