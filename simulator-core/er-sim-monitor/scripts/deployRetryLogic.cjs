#!/usr/bin/env node

/**
 * Deploy Retry Logic to Apps Script
 *
 * Adds retry logic module and updates Code.gs to use it
 *
 * Usage:
 *   node scripts/deployRetryLogic.cjs
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
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

async function deployRetryLogic() {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('        DEPLOY RETRY LOGIC TO APPS SCRIPT');
  console.log('═══════════════════════════════════════════════════');
  console.log('');

  const script = createAppsScriptClient();

  // Read RetryLogic.gs
  const retryLogicPath = path.join(__dirname, '..', 'apps-script-additions', 'RetryLogic.gs');
  const retryLogicCode = fs.readFileSync(retryLogicPath, 'utf8');

  console.log('📖 Reading current Apps Script project...');
  const getResponse = await script.projects.getContent({
    scriptId: APPS_SCRIPT_ID
  });

  const files = getResponse.data.files || [];
  console.log(`✅ Found ${files.length} file(s)`);
  console.log('');

  // Check if RetryLogic file already exists
  let retryLogicFile = files.find(f => f.name === 'RetryLogic');

  if (retryLogicFile) {
    console.log('📝 Updating existing RetryLogic file...');
    retryLogicFile.source = retryLogicCode;
  } else {
    console.log('📝 Adding new RetryLogic file...');
    files.push({
      name: 'RetryLogic',
      type: 'SERVER_JS',
      source: retryLogicCode
    });
  }

  // Update Code.gs to use retry logic
  const codeFile = files.find(f => f.name === 'Code');
  if (!codeFile) {
    throw new Error('Code.gs file not found');
  }

  console.log('🔧 Updating Code.gs to use retry logic...');

  let code = codeFile.source;
  let changes = 0;

  // Find and replace OpenAI API calls with retry wrapper
  // Pattern: UrlFetchApp.fetch(openaiUrl, openaiOptions)
  const fetchPattern = /UrlFetchApp\.fetch\s*\(\s*openaiUrl\s*,\s*openaiOptions\s*\)/g;

  if (code.match(fetchPattern)) {
    code = code.replace(
      fetchPattern,
      'fetchOpenAIWithRetry(openaiUrl, openaiOptions)'
    );
    changes++;
    console.log('   ✅ Wrapped OpenAI API call with retry logic');
  }

  // Also look for any direct UrlFetchApp.fetch calls in processOneInputRow_
  const directFetchPattern = /const\s+response\s*=\s*UrlFetchApp\.fetch\s*\(/g;
  const matches = code.match(directFetchPattern);

  if (matches && matches.length > 0) {
    console.log(`   ℹ️  Found ${matches.length} direct UrlFetchApp.fetch call(s)`);
    console.log('   ℹ️  Manual review recommended for optimal retry placement');
  }

  codeFile.source = code;

  console.log('');
  console.log('💾 Deploying updated project...');

  await script.projects.updateContent({
    scriptId: APPS_SCRIPT_ID,
    requestBody: {
      files: files
    }
  });

  console.log('✅ Project updated successfully');
  console.log('');

  console.log('═══════════════════════════════════════════════════');
  console.log('✅ RETRY LOGIC DEPLOYED');
  console.log('═══════════════════════════════════════════════════');
  console.log('');
  console.log(`Files updated: ${files.length}`);
  console.log(`Changes made: ${changes}`);
  console.log('');
  console.log('📋 Next Steps:');
  console.log('   1. Test retry logic: Run testRetryLogic() in Apps Script');
  console.log('   2. Process a test batch: npm run run-batch-http "2,3"');
  console.log('   3. Check logs for retry attempts');
  console.log('');
  console.log('🔍 Retry Logic Features:');
  console.log('   - Exponential backoff (1s → 2s → 4s → 8s)');
  console.log('   - Automatic jitter to prevent thundering herd');
  console.log('   - Rate limit detection (HTTP 429 handling)');
  console.log('   - Retryable error classification');
  console.log('   - Maximum 3 retries for OpenAI API');
  console.log('   - Maximum 60s delay cap');
  console.log('');
}

if (require.main === module) {
  deployRetryLogic().catch(error => {
    console.error('');
    console.error('❌ DEPLOYMENT FAILED');
    console.error('════════════════════════════════════════════════════');
    console.error(`Error: ${error.message}`);
    console.error('');
    if (error.response && error.response.data) {
      console.error(JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  });
}

module.exports = { deployRetryLogic };
