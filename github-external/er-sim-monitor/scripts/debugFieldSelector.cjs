#!/usr/bin/env node

/**
 * DEBUG FIELD SELECTOR
 * Download code and check what's actually there
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const PRODUCTION_PROJECT_ID = '12NihbVaaAIyRMCtzZ-aGjJ71CdL-HDjhmjxiD_S_EgIOuDOtrUH6M1l2';

console.log('\n🔍 DEBUGGING FIELD SELECTOR\n');
console.log('═══════════════════════════════════════════════════════════════\n');

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

async function debug() {
  try {
    const auth = await authorize();
    const script = google.script({ version: 'v1', auth });

    console.log('📥 Downloading current code...\n');

    const content = await script.projects.getContent({
      scriptId: PRODUCTION_PROJECT_ID
    });

    const codeFile = content.data.files.find(f => f.name === 'Code');
    const code = codeFile.source;

    // Save to file for inspection
    const debugPath = '/Users/aarontjomsland/er-sim-monitor/backups/current-production-debug.gs';
    fs.writeFileSync(debugPath, code, 'utf8');
    console.log(`💾 Saved current code to: ${debugPath}\n`);

    // Check specific patterns
    console.log('📋 Analysis:\n');

    // 1. Check renderCategories() call
    const renderCallMatch = code.match(/renderCategories\(\);/g);
    console.log(`1. renderCategories() calls found: ${renderCallMatch ? renderCallMatch.length : 0}`);

    // 2. Check getStaticRecommendedFields_ definitions
    const funcDefs = code.match(/function getStaticRecommendedFields_/g);
    console.log(`2. getStaticRecommendedFields_() definitions: ${funcDefs ? funcDefs.length : 0}`);

    // 3. Check the call pattern
    const callPattern = code.match(/const recommendedFields = getStaticRecommendedFields_\([^)]*\);/);
    console.log(`3. Call pattern: ${callPattern ? callPattern[0] : 'NOT FOUND'}`);

    // 4. Check JavaScript template
    const jsPattern = code.match(/'const recommendedFieldNames = ' \+ JSON\.stringify\([^)]+\);/);
    console.log(`4. JS template: ${jsPattern ? jsPattern[0].substring(0, 80) + '...' : 'NOT FOUND'}`);

    // 5. Find showFieldSelector function
    const showFieldMatch = code.match(/function showFieldSelector\(\) \{/);
    console.log(`5. showFieldSelector() found: ${showFieldMatch ? 'YES' : 'NO'}`);

    if (showFieldMatch) {
      const funcStart = code.indexOf('function showFieldSelector()');
      const excerpt = code.substring(funcStart, funcStart + 500);
      console.log('\n📝 First 500 chars of showFieldSelector():\n');
      console.log(excerpt);
      console.log('\n...\n');
    }

    console.log('\n═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    process.exit(1);
  }
}

debug();
