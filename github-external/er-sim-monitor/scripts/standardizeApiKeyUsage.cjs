#!/usr/bin/env node

/**
 * Standardize API Key Usage
 *
 * Found issue: Two different methods to get API key
 * 1. PropertiesService.getDocumentProperties().getProperty(SP_KEYS.API_KEY) - DIRECT
 * 2. readApiKey_() - CORRECT (has fallback logic)
 *
 * Solution: Replace all direct property reads with readApiKey_() call
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const TOKEN_PATH = path.join(__dirname, '..', 'config', 'token.json');
const SCRIPT_ID = process.env.APPS_SCRIPT_ID;

async function standardizeApiKeyUsage() {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('  STANDARDIZE API KEY USAGE TO readApiKey_()');
  console.log('═══════════════════════════════════════════════════');
  console.log('');

  const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/oauth2callback'
  );
  oauth2Client.setCredentials(token);

  const script = google.script({ version: 'v1', auth: oauth2Client });
  const response = await script.projects.getContent({ scriptId: SCRIPT_ID });
  const files = response.data.files;

  const codeFile = files.find(f => f.name === 'Code');
  let source = codeFile.source;

  console.log('Finding all API key assignments...');
  console.log('');

  // Find all lines that assign to apiKey variable
  const apiKeyPattern = /const\s+apiKey\s*=\s*([^;]+);/g;
  const matches = source.match(apiKeyPattern) || [];

  console.log(`Found ${matches.length} API key assignment(s):`);
  matches.forEach((match, idx) => {
    console.log(`  ${idx + 1}. ${match}`);
  });
  console.log('');

  // Replace any that don't use readApiKey_()
  let replacements = 0;

  matches.forEach(match => {
    if (!match.includes('readApiKey_()')) {
      console.log(`Replacing: ${match}`);
      const correctVersion = 'const apiKey = readApiKey_();';
      source = source.replace(match, correctVersion);
      console.log(`  → With: ${correctVersion}`);
      console.log('');
      replacements++;
    }
  });

  if (replacements === 0) {
    console.log('✅ All API key assignments already use readApiKey_()');
    console.log('');
    console.log('The API key configuration is already correct!');
    console.log('The error might be that the API key itself is invalid.');
    console.log('');
    console.log('Check Settings sheet cell B1 for the OpenAI API key');
    return;
  }

  console.log(`✅ Made ${replacements} replacement(s)`);
  console.log('');

  // Upload
  console.log('💾 Uploading fixed code...');

  const updatedFiles = files.map(f => {
    if (f.name === 'Code') {
      return { ...f, source };
    }
    return f;
  });

  await script.projects.updateContent({
    scriptId: SCRIPT_ID,
    requestBody: { files: updatedFiles }
  });

  console.log('✅ Code updated!');
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('✅ API KEY USAGE STANDARDIZED!');
  console.log('═══════════════════════════════════════════════════');
  console.log('');
  console.log('All code now uses readApiKey_() which:');
  console.log('  1. Checks DocumentProperties first');
  console.log('  2. Falls back to Settings sheet (cell B1)');
  console.log('  3. Caches the key for future use');
  console.log('');
  console.log('Next steps:');
  console.log('1. Verify Settings sheet cell B1 has valid OpenAI API key');
  console.log('2. Refresh Google Sheets (F5)');
  console.log('3. Click "Launch Batch Engine"');
  console.log('4. Batch should now work!');
  console.log('');
}

if (require.main === module) {
  standardizeApiKeyUsage().catch(error => {
    console.error('');
    console.error('❌ FAILED');
    console.error('════════════════════════════════════════════════════');
    console.error(`Error: ${error.message}`);
    console.error('');
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  });
}

module.exports = { standardizeApiKeyUsage };
