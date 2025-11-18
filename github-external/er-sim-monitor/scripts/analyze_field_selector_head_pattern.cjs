#!/usr/bin/env node

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

async function analyzeFieldSelectorHeadPattern() {
  try {
    console.log('🔍 ANALYZING FIELD SELECTOR <HEAD> PATTERN\n');
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

    // Find showFieldSelectorModal_ function
    const fieldSelectorStart = codeFile.source.indexOf('function showFieldSelectorModal_');
    if (fieldSelectorStart === -1) {
      console.log('❌ Field selector modal not found\n');
      return;
    }

    const fieldSelectorEnd = codeFile.source.indexOf('\nfunction ', fieldSelectorStart + 1);
    const fieldSelectorFunction = codeFile.source.substring(fieldSelectorStart, fieldSelectorEnd);

    console.log('📄 FIELD SELECTOR MODAL HTML STRUCTURE:\n');
    
    // Extract the HTML building pattern
    const htmlStartIdx = fieldSelectorFunction.indexOf("var html = '<!DOCTYPE");
    const htmlSample = fieldSelectorFunction.substring(htmlStartIdx, htmlStartIdx + 2000);
    
    console.log(htmlSample);
    console.log('\n...\n');

    // Now check buildBirdEyeViewUI_ structure
    const birdEyeStart = codeFile.source.indexOf('function buildBirdEyeViewUI_');
    const birdEyeEnd = codeFile.source.indexOf('\nfunction ', birdEyeStart + 1);
    const birdEyeFunction = codeFile.source.substring(birdEyeStart, birdEyeEnd > 0 ? birdEyeEnd : birdEyeStart + 5000);

    console.log('📄 PATHWAY CHAIN BUILDER (buildBirdEyeViewUI_) HTML STRUCTURE:\n');
    const birdEyeHTMLStart = birdEyeFunction.indexOf("return '<!DOCTYPE");
    const birdEyeSample = birdEyeFunction.substring(birdEyeHTMLStart, birdEyeHTMLStart + 1500);
    
    console.log(birdEyeSample);
    console.log('\n...\n');

    console.log('🔑 KEY DIFFERENCE:\n');
    console.log('Field Selector: Uses var html = ... then html += ... pattern');
    console.log('Bird Eye View: Uses return \'...\' + \'...\' + pattern\n');
    console.log('💡 HYPOTHESIS:\n');
    console.log('The <head> JavaScript might work if we use the same variable');
    console.log('concatenation pattern as field selector (html += ...)');
    console.log('instead of string concatenation with + operator\n');

  } catch (error) {
    console.error('Error:', error.message);
  }
}

analyzeFieldSelectorHeadPattern();
