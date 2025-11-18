#!/usr/bin/env node

/**
 * CHECK THE CURRENT render3Sections FUNCTION
 * Extract and display it to see exactly what's deployed
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const PRODUCTION_PROJECT_ID = '12NihbVaaAIyRMCtzZ-aGjJ71CdL-HDjhmjxiD_S_EgIOuDOtrUH6M1l2';

async function check() {
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

  // Find render3Sections
  const funcStart = code.indexOf("'function render3Sections() {' +");
  const funcEnd = code.indexOf("'function updateCount() {' +", funcStart);

  if (funcStart === -1) {
    console.log('❌ Could not find render3Sections function\n');
    return;
  }

  const func = code.substring(funcStart, funcEnd);

  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log('CURRENT render3Sections() FUNCTION:\n');
  console.log(func.substring(0, 2000)); // First 2000 chars
  console.log('\n...\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Check for innerHTML usage
  const hasInnerHTML = func.includes('.innerHTML =');
  const hasTextContent = func.includes('.textContent =');

  console.log('Analysis:');
  console.log(`  Uses innerHTML: ${hasInnerHTML ? '❌ YES (problematic)' : '✅ NO'}`);
  console.log(`  Uses textContent: ${hasTextContent ? '✅ YES (good)' : '❌ NO'}`);
  console.log('\n');
}

check().catch(console.error);
