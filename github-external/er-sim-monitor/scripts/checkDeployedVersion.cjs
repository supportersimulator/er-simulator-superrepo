#!/usr/bin/env node

/**
 * Check what's currently deployed in Google Apps Script
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

require('dotenv').config();

const TOKEN_PATH = path.join(__dirname, '..', 'config', 'token.json');
const CREDENTIALS_PATH = path.join(__dirname, '..', 'config', 'credentials.json');
const SCRIPT_ID = process.env.APPS_SCRIPT_ID;

async function checkDeployedVersion() {
  console.log('🔍 Checking Currently Deployed Version\n');
  console.log('════════════════════════════════════════════════════════════════\n');

  try {
    const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH));
    const { client_secret, client_id, redirect_uris } = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
    const token = JSON.parse(fs.readFileSync(TOKEN_PATH));
    oAuth2Client.setCredentials(token);

    const script = google.script({ version: 'v1', auth: oAuth2Client });
    const projectResponse = await script.projects.getContent({ scriptId: SCRIPT_ID });
    const files = projectResponse.data.files;

    const phase2File = files.find(f => f.name === 'Phase2_Enhanced_Categories_With_AI');

    if (!phase2File) {
      console.log('❌ Phase2_Enhanced_Categories_With_AI.gs NOT found in deployed project!\n');
      console.log('Available files:', files.map(f => f.name).join(', '));
      return;
    }

    console.log('✅ Found Phase2_Enhanced_Categories_With_AI.gs\n');
    console.log('File size:', phase2File.source.length, 'bytes');
    console.log('Lines:', phase2File.source.split('\n').length);
    console.log('\n════════════════════════════════════════════════════════════════\n');

    // Check for the key differences we're looking for
    const hasOldColumnNames = phase2File.source.includes('Category_Symptom (Column X)');
    const hasNewColumnNames = phase2File.source.includes('Case_Organization_Category_Symptom_Name (Column P / 16)');

    console.log('🔬 Version Markers:\n');
    console.log('Has OLD column names (commit 4c62b04):', hasOldColumnNames ? '✅ YES' : '❌ NO');
    console.log('Has NEW column names (commit 4d780ea):', hasNewColumnNames ? '✅ YES' : '❌ NO');
    console.log('');

    // Check for specific function presence
    const hasRunAICategorization = phase2File.source.includes('function runAICategorization(');
    const hasApplyCategorizations = phase2File.source.includes('function applyCategorizations()');
    const hasBuildCategoriesPathwaysMainMenu = phase2File.source.includes('function buildCategoriesPathwaysMainMenu_()');

    console.log('Function Presence Check:\n');
    console.log('runAICategorization():', hasRunAICategorization ? '✅ YES' : '❌ NO');
    console.log('applyCategorizations():', hasApplyCategorizations ? '✅ YES' : '❌ NO');
    console.log('buildCategoriesPathwaysMainMenu_():', hasBuildCategoriesPathwaysMainMenu ? '✅ YES' : '❌ NO');
    console.log('');

    // Save deployed version for comparison
    const deployedPath = '/tmp/deployed_version.gs';
    fs.writeFileSync(deployedPath, phase2File.source);
    console.log('💾 Saved deployed version to:', deployedPath);
    console.log('');

    console.log('════════════════════════════════════════════════════════════════\n');
    console.log('📊 Summary:\n');

    if (hasNewColumnNames) {
      console.log('✅ Deployed version matches commit 4d780ea (latest, with correct column names)');
    } else if (hasOldColumnNames) {
      console.log('✅ Deployed version matches commit 4c62b04 (working version from last night)');
    } else {
      console.log('⚠️  Deployed version doesn\'t match either known commit');
    }

    console.log('');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

checkDeployedVersion();
