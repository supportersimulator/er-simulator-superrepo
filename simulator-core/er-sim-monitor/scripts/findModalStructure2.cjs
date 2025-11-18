#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const PRODUCTION_PROJECT_ID = '12NihbVaaAIyRMCtzZ-aGjJ71CdL-HDjhmjxiD_S_EgIOuDOtrUH6M1l2';

async function find() {
  const credentialsPath = path.join(__dirname, '../config/credentials.json');
  const tokenPath = path.join(__dirname, '../config/token.json');
  const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
  const token = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
  const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
  oAuth2Client.setCredentials(token);

  const script = google.script({ version: 'v1', auth: oAuth2Client });
  const content = await script.projects.getContent({ scriptId: PRODUCTION_PROJECT_ID });
  const code = content.data.files.find(f => f.name === 'Code').source;

  // Find showFieldSelector function
  const funcStart = code.indexOf('function showFieldSelector() {');
  if (funcStart === -1) {
    console.log('❌ Could not find showFieldSelector');
    return;
  }

  console.log('✅ Found showFieldSelector at position', funcStart);

  // Try different HTML patterns
  const patterns = [
    'const html = `',
    'var html = `',
    'let html = `',
    '<html>',
    'HtmlService.createHtmlOutput'
  ];

  console.log('\nSearching for HTML patterns:');
  patterns.forEach(pattern => {
    const pos = code.indexOf(pattern, funcStart);
    if (pos !== -1 && pos < funcStart + 20000) {
      console.log(`  ✅ Found "${pattern}" at offset ${pos - funcStart}`);
    } else {
      console.log(`  ❌ Not found: "${pattern}"`);
    }
  });

  // Extract function to see what's there
  const funcEnd = code.indexOf('\nfunction ', funcStart + 10);
  const funcCode = code.substring(funcStart, funcEnd !== -1 ? funcEnd : funcStart + 5000);

  console.log('\nFirst 500 chars of function:');
  console.log(funcCode.substring(0, 500));
}

find().catch(console.error);
