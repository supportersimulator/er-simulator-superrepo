#!/usr/bin/env node

/**
 * RESTORE TO WORKING VERSION
 * Use the version from this morning that was showing logs successfully
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const PRODUCTION_PROJECT_ID = '12NihbVaaAIyRMCtzZ-aGjJ71CdL-HDjhmjxiD_S_EgIOuDOtrUH6M1l2';

async function authorize() {
  const credentialsPath = path.join(__dirname, '../config/credentials.json');
  const tokenPath = path.join(__dirname, '../config/token.json');
  const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
  const token = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
  const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
  oAuth2Client.setCredentials(token);
  return oAuth2Client;
}

async function restore() {
  try {
    const auth = await authorize();
    const script = google.script({ version: 'v1', auth });

    console.log('🔍 Downloading current code to check showFieldSelector...\n');

    const content = await script.projects.getContent({
      scriptId: PRODUCTION_PROJECT_ID
    });

    const codeFile = content.data.files.find(f => f.name === 'Code');
    const manifestFile = content.data.files.find(f => f.name === 'appsscript');

    // Save current broken version
    const brokenBackup = path.join(__dirname, '../backups/production-broken-' + new Date().toISOString().replace(/:/g, '-').substring(0, 19) + '.gs');
    fs.writeFileSync(brokenBackup, codeFile.source, 'utf8');
    console.log('💾 Backed up broken version\n');

    // Check if showFieldSelector exists and what it looks like
    if (codeFile.source.includes('function showFieldSelector()')) {
      const funcStart = codeFile.source.indexOf('function showFieldSelector()');
      const snippet = codeFile.source.substring(funcStart, funcStart + 300);
      console.log('📋 Current showFieldSelector start:\n');
      console.log(snippet);
      console.log('\n');
    }

    // Let's use the build3SectionUI version which we know worked earlier
    console.log('📦 Using build3SectionUI.cjs to rebuild from scratch...\n');

    // Just run the build3SectionUI script which worked
    const { execSync } = require('child_process');
    execSync('node ' + path.join(__dirname, 'build3SectionUI.cjs'), { stdio: 'inherit' });

  } catch (error) {
    console.error('❌ ERROR:', error.message);
  }
}

restore();
