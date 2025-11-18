#!/usr/bin/env node

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

async function extractFieldSelectorPattern() {
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

    console.log('🔍 EXTRACTING FIELD SELECTOR HTML STRUCTURE\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

    const content = await script.projects.getContent({ scriptId });
    const codeFile = content.data.files.find(f => f.name === 'Code');

    // Find the field selector modal function
    const funcStart = codeFile.source.indexOf("function showFieldSelectorModal_");
    if (funcStart !== -1) {
      const funcSection = codeFile.source.substring(funcStart, funcStart + 3000);
      console.log('📄 FIELD SELECTOR HTML STRUCTURE (working reference):\n');
      console.log(funcSection);
      console.log('\n...\n');
    }

    // Find where <head> and <script> are used
    const headIdx = codeFile.source.indexOf("'<!DOCTYPE html><html><head>'");
    if (headIdx !== -1) {
      const headSection = codeFile.source.substring(headIdx, headIdx + 2000);
      console.log('📄 <head> SECTION PATTERN:\n');
      console.log(headSection);
      console.log('\n...\n');
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

extractFieldSelectorPattern();
