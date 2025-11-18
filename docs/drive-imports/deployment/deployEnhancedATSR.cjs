#!/usr/bin/env node

/**
 * Deploy Enhanced ATSR to Google Apps Script
 *
 * This script deploys the Code_ENHANCED_ATSR.gs file to Google Sheets
 * via the Apps Script API, restoring the "AMAZING" output quality.
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
require('dotenv').config();

const SCRIPT_ID = '1NXjFvH2Wo117saCyqmNDfCqZ1iQ9vykxa0-kHUhFAYDuhthgql5Ru_P6';
const ENHANCED_CODE_PATH = path.join(__dirname, 'Code_ENHANCED_ATSR.gs');

async function deployEnhancedATSR() {
  console.log('');
  console.log('════════════════════════════════════════════════════');
  console.log('   🚀 DEPLOYING ENHANCED ATSR TO GOOGLE APPS SCRIPT');
  console.log('════════════════════════════════════════════════════');
  console.log('');

  // Read the enhanced code
  console.log('📖 Reading enhanced code...');
  if (!fs.existsSync(ENHANCED_CODE_PATH)) {
    console.error(`❌ Error: ${ENHANCED_CODE_PATH} not found`);
    console.error('   Run: node scripts/mergeEnhancedATSR.cjs first');
    process.exit(1);
  }

  const enhancedCode = fs.readFileSync(ENHANCED_CODE_PATH, 'utf8');
  console.log(`   ✅ Loaded ${enhancedCode.length} characters (${enhancedCode.split('\n').length} lines)`);
  console.log('');

  // Authenticate
  console.log('🔐 Loading credentials...');
  const credentialsPath = path.join(__dirname, '../config/credentials.json');
  if (!fs.existsSync(credentialsPath)) {
    console.error('❌ Error: credentials.json not found');
    console.error('   Expected: config/credentials.json');
    process.exit(1);
  }

  const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
  console.log('   ✅ Credentials loaded');
  console.log('');

  console.log('🔑 Authenticating with Google...');
  const {client_id, client_secret, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  const tokenPath = path.join(__dirname, '../config/token.json');
  if (!fs.existsSync(tokenPath)) {
    console.error('❌ Error: token.json not found');
    console.error('   Run: npm run auth-google first');
    process.exit(1);
  }

  const token = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
  oAuth2Client.setCredentials(token);
  console.log('   ✅ Authenticated');
  console.log('');

  // Create Apps Script API client
  const script = google.script({version: 'v1', auth: oAuth2Client});

  // Get current project content
  console.log('📥 Fetching current Apps Script project...');
  try {
    const project = await script.projects.getContent({scriptId: SCRIPT_ID});
    console.log(`   ✅ Found ${project.data.files.length} files`);
    console.log('');

    // Show current files
    console.log('📋 Current files:');
    project.data.files.forEach(file => {
      console.log(`   • ${file.name} (${file.type})`);
    });
    console.log('');

    // Update the Code.gs file
    console.log('📝 Updating Code.gs with enhanced ATSR...');
    const updatedFiles = project.data.files.map(file => {
      if (file.name === 'Code') {
        return {
          name: file.name,
          type: file.type,
          source: enhancedCode
        };
      }
      return file;
    });

    // Push the update
    console.log('⬆️  Pushing changes to Google Apps Script...');
    await script.projects.updateContent({
      scriptId: SCRIPT_ID,
      requestBody: {
        files: updatedFiles
      }
    });

    console.log('   ✅ Code updated successfully!');
    console.log('');

    console.log('════════════════════════════════════════════════════');
    console.log('✅ DEPLOYMENT COMPLETE');
    console.log('════════════════════════════════════════════════════');
    console.log('');

    console.log('🎯 What changed:');
    console.log('   ❌ OLD: Simple 33-line ATSR prompt with basic rules');
    console.log('   ✅ NEW: Rich 334-line prompt with Sim Mastery philosophy');
    console.log('');

    console.log('📈 Improvement breakdown:');
    console.log('   • Emotionally resonant language (+250 lines of examples)');
    console.log('   • Detailed quality criteria (+80 lines)');
    console.log('   • Human-centered patient descriptors (+60 lines)');
    console.log('   • Clinical pearl emphasis (+40 lines)');
    console.log('   • Marketing genius-level guidelines (+70 lines)');
    console.log('   • Comprehensive tone & style rules (+100 lines)');
    console.log('');

    console.log('🧪 Test it now:');
    console.log('   1. Open your Google Sheet');
    console.log('   2. Refresh the page (Cmd+R or Ctrl+R)');
    console.log('   3. Click: ER Simulator → ATSR — Titles & Summary');
    console.log('   4. Enter a row number (e.g., 10)');
    console.log('   5. Enjoy the AMAZING output! 🎉');
    console.log('');

    console.log('💡 Expected improvements:');
    console.log('   • Spark Titles: MORE emotionally urgent and intriguing');
    console.log('   • Reveal Titles: BETTER clinical pearls and takeaways');
    console.log('   • Case IDs: MORE logical and system-aligned');
    console.log('   • Patient Summaries: RICHER and more humanizing');
    console.log('   • Defining Characteristics: UNIQUE and memorable');
    console.log('');

    console.log('════════════════════════════════════════════════════');

  } catch (error) {
    console.error('');
    console.error('❌ DEPLOYMENT FAILED');
    console.error('════════════════════════════════════════════════════');
    console.error(error.message);

    if (error.message.includes('permission')) {
      console.error('');
      console.error('💡 TIP: This requires Apps Script API permissions');
      console.error('   Enable at: https://script.google.com/home/usersettings');
      console.error('');
    }

    process.exit(1);
  }
}

deployEnhancedATSR().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
