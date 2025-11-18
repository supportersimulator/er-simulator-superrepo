#!/usr/bin/env node

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

async function compareHTMLStructures() {
  try {
    const credPath = path.join(__dirname, '../config/credentials.json');
    const tokenPath = path.join(__dirname, '../config/token.json');
    const credentials = JSON.parse(fs.readFileSync(credPath, 'utf8'));
    const token = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
    const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
    oAuth2Client.setCredentials(token);

    const script = google.script({ version: 'v1', auth: oAuth2Client });
    const scriptId = '12NihbVaaAIyRMCtzZ-aGjJ71CdL-HDjhmjxiD_S_EgIOuDOtrUH6M1l2';

    console.log('🔍 COMPARING HTML STRUCTURE PATTERNS\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

    const content = await script.projects.getContent({ scriptId });
    const codeFile = content.data.files.find(f => f.name === 'Code');

    // Find buildBirdEyeViewUI_ function start
    const birdEyeStart = codeFile.source.indexOf("function buildBirdEyeViewUI_");
    if (birdEyeStart !== -1) {
      const funcSection = codeFile.source.substring(birdEyeStart, birdEyeStart + 1500);
      console.log('📄 buildBirdEyeViewUI_ FUNCTION START:\n');
      console.log(funcSection);
      console.log('\n...\n');
    }

    // Check if there's a <head> section
    const hasHead = codeFile.source.includes("'<head>'");
    const hasDocType = codeFile.source.includes("'<!DOCTYPE html>'");
    
    console.log(`📊 STRUCTURE CHECK:\n`);
    console.log(`   Has <!DOCTYPE html>: ${hasDocType}`);
    console.log(`   Has <head> tag: ${hasHead}\n`);

    // Find how the HTML output is created
    const htmlVarIdx = codeFile.source.indexOf("var html = '<!DOCTYPE");
    if (htmlVarIdx !== -1) {
      const htmlSection = codeFile.source.substring(htmlVarIdx, htmlVarIdx + 2000);
      console.log('📄 HTML VARIABLE INITIALIZATION:\n');
      console.log(htmlSection);
      console.log('\n...\n');
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

compareHTMLStructures();
