#!/usr/bin/env node

/**
 * Fix Chained UI Calls
 *
 * Fixes patterns like getSafeUi_().alert() to check for null first
 *
 * Usage:
 *   node scripts/fixChainedUIcalls.cjs
 */

const fs = require('fs');
const path = require('path');
const { google} = require('googleapis');
require('dotenv').config();

const OAUTH_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const OAUTH_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const TOKEN_PATH = path.join(__dirname, '..', 'config', 'token.json');
const APPS_SCRIPT_ID = process.env.APPS_SCRIPT_ID;

function loadToken() {
  const tokenData = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
  return tokenData;
}

function createAppsScriptClient() {
  const oauth2Client = new google.auth.OAuth2(
    OAUTH_CLIENT_ID,
    OAUTH_CLIENT_SECRET,
    'http://localhost:3000/oauth2callback'
  );
  const token = loadToken();
  oauth2Client.setCredentials(token);
  return google.script({ version: 'v1', auth: oauth2Client });
}

async function fixChainedUICalls() {
  console.log('');
  console.log('🔧 FIXING CHAINED UI CALLS');
  console.log('════════════════════════════════════════════════════');
  console.log(`Apps Script ID: ${APPS_SCRIPT_ID}`);
  console.log('════════════════════════════════════════════════════');
  console.log('');

  try {
    const script = createAppsScriptClient();

    console.log('📖 Reading current Apps Script...');
    const getResponse = await script.projects.getContent({
      scriptId: APPS_SCRIPT_ID
    });

    const files = getResponse.data.files || [];
    const codeFile = files.find(f => f.name === 'Code');

    if (!codeFile) {
      throw new Error('Code.gs file not found');
    }

    let code = codeFile.source;

    // Fix pattern: getSafeUi_().alert(...) or getSafeUi_().toast(...)
    // Replace with: const ui = getSafeUi_(); if (ui) { ui.alert(...) }

    console.log('🔍 Fixing chained getSafeUi_() calls...');

    const regex = /^(\s*)getSafeUi_\(\)\.(alert|toast)\((.*?)\);?\s*$/gm;
    let matches = [];
    let match;

    while ((match = regex.exec(code)) !== null) {
      matches.push({
        fullMatch: match[0],
        indent: match[1],
        method: match[2],
        args: match[3]
      });
    }

    console.log(`   Found ${matches.length} chained UI call(s)`);

    // Replace each match with optional chaining or safe check
    matches.forEach((m, idx) => {
      // Use inline if to avoid variable name conflicts
      const replacement = `${m.indent}if (getSafeUi_()) { getSafeUi_().${m.method}(${m.args}); }`;
      code = code.replace(m.fullMatch, replacement);
      console.log(`   Line: Fixed getSafeUi_().${m.method}()`);
    });

    codeFile.source = code;

    console.log('');
    console.log('💾 Updating Apps Script...');
    await script.projects.updateContent({
      scriptId: APPS_SCRIPT_ID,
      requestBody: {
        files: files
      }
    });

    console.log('✅ Project updated');
    console.log('');

    console.log('════════════════════════════════════════════════════');
    console.log('✅ CHAINED UI CALLS FIXED');
    console.log('════════════════════════════════════════════════════');
    console.log('');
    console.log(`Total fixes: ${matches.length}`);
    console.log('');

  } catch (error) {
    console.error('');
    console.error('❌ FIX FAILED');
    console.error('════════════════════════════════════════════════════');
    console.error(`Error: ${error.message}`);
    console.error('');
    if (error.response && error.response.data) {
      console.error(JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

if (require.main === module) {
  fixChainedUICalls().catch(console.error);
}

module.exports = { fixChainedUICalls };
