#!/usr/bin/env node

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

async function findSyntaxErrorLocation() {
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

    const content = await script.projects.getContent({ scriptId });
    const codeFile = content.data.files.find(f => f.name === 'Code');

    // Find the IIFE section specifically
    const iifeIdx = codeFile.source.indexOf('// Attach Discovery tab event listeners immediately');
    if (iifeIdx !== -1) {
      const iifeSection = codeFile.source.substring(iifeIdx, iifeIdx + 1500);
      
      console.log('📄 IIFE SECTION (raw Apps Script code):\n');
      console.log(iifeSection);
      console.log('\n');

      // Look for mismatched parentheses
      const openParens = (iifeSection.match(/\(/g) || []).length;
      const closeParens = (iifeSection.match(/\)/g) || []).length;
      
      console.log(`🔍 PARENTHESES COUNT:\n`);
      console.log(`   Open  ( : ${openParens}`);
      console.log(`   Close ) : ${closeParens}`);
      
      if (openParens !== closeParens) {
        console.log(`   ❌ MISMATCH! ${Math.abs(openParens - closeParens)} extra ${openParens > closeParens ? 'open' : 'close'} parenthesis\n`);
      }
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

findSyntaxErrorLocation();
