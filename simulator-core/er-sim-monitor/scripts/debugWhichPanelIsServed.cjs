#!/usr/bin/env node

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

require('dotenv').config();

const TOKEN_PATH = path.join(__dirname, '..', 'config', 'token.json');
const CREDENTIALS_PATH = path.join(__dirname, '..', 'config', 'credentials.json');
const SCRIPT_ID = process.env.APPS_SCRIPT_ID;

async function debugWhichPanelIsServed() {
  console.log('🔍 Checking WHICH panel HTML is actually served\n');

  try {
    const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH));
    const { client_secret, client_id, redirect_uris } = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
    const token = JSON.parse(fs.readFileSync(TOKEN_PATH));
    oAuth2Client.setCredentials(token);

    const script = google.script({ version: 'v1', auth: oAuth2Client });
    const projectResponse = await script.projects.getContent({ scriptId: SCRIPT_ID });
    const files = projectResponse.data.files;

    // Check Phase2 file
    const phase2File = files.find(f => f.name === 'Phase2_Enhanced_Categories_With_AI');
    const phase2Content = phase2File.source;

    // Check if it has the runAICategorization button
    const hasRunButton = phase2Content.includes('onclick="window.runAICategorization()"');
    const hasSpecificMode = phase2Content.includes('Specific Rows');
    const hasModeSelector = phase2Content.includes('id="aiCatMode"');

    console.log('📋 Phase2_Enhanced_Categories_With_AI.gs:\n');
    console.log(`  Has runAICategorization button: ${hasRunButton ? '✅' : '❌'}`);
    console.log(`  Has "Specific Rows" mode: ${hasSpecificMode ? '✅' : '❌'}`);
    console.log(`  Has mode selector (id="aiCatMode"): ${hasModeSelector ? '✅' : '❌'}`);
    console.log();

    // Check if window.runAICategorization is defined
    const hasWindowDef = phase2Content.includes('window.runAICategorization = function()');
    console.log(`  Defines window.runAICategorization: ${hasWindowDef ? '✅' : '❌'}`);
    console.log();

    // Extract a snippet of the button HTML
    if (hasRunButton) {
      const buttonIndex = phase2Content.indexOf('onclick="window.runAICategorization()"');
      const snippet = phase2Content.substring(buttonIndex - 50, buttonIndex + 150);
      console.log('  Button HTML snippet:');
      console.log('  ' + '-'.repeat(60));
      console.log('  ' + snippet.replace(/\n/g, '\n  '));
      console.log('  ' + '-'.repeat(60));
      console.log();
    }

    // Check if there are any template literal issues
    const hasNestedTemplate = phase2Content.match(/\$\{.*\$\{/);
    console.log(`  Has nested template literals: ${hasNestedTemplate ? '⚠️  YES' : '✅ NO'}`);
    console.log();

    console.log('='.repeat(70));
    console.log('\n💡 CONCLUSION:\n');

    if (hasRunButton && hasWindowDef && hasModeSelector) {
      console.log('✅ Panel HTML looks correct and complete');
      console.log('   Problem is likely in HOW/WHEN the function executes\n');
    } else {
      console.log('❌ Panel HTML is missing key components:');
      if (!hasRunButton) console.log('   • Missing runAICategorization button');
      if (!hasWindowDef) console.log('   • Missing window.runAICategorization definition');
      if (!hasModeSelector) console.log('   • Missing mode selector');
      console.log();
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugWhichPanelIsServed();
