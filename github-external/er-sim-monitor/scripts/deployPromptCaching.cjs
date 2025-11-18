#!/usr/bin/env node

/**
 * Deploy Prompt Caching to Apps Script
 *
 * Adds prompt caching module to reduce OpenAI API costs by 30-50%
 *
 * Usage:
 *   node scripts/deployPromptCaching.cjs
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

async function deployPromptCaching() {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('      DEPLOY PROMPT CACHING TO APPS SCRIPT');
  console.log('═══════════════════════════════════════════════════');
  console.log('');

  const script = createAppsScriptClient();

  // Read PromptCaching.gs
  const promptCachingPath = path.join(__dirname, '..', 'apps-script-additions', 'PromptCaching.gs');
  const promptCachingCode = fs.readFileSync(promptCachingPath, 'utf8');

  console.log('📖 Reading current Apps Script project...');
  const getResponse = await script.projects.getContent({
    scriptId: APPS_SCRIPT_ID
  });

  const files = getResponse.data.files || [];
  console.log(`✅ Found ${files.length} file(s)`);
  console.log('');

  // Check if PromptCaching file already exists
  let promptCachingFile = files.find(f => f.name === 'PromptCaching');

  if (promptCachingFile) {
    console.log('📝 Updating existing PromptCaching file...');
    promptCachingFile.source = promptCachingCode;
  } else {
    console.log('📝 Adding new PromptCaching file...');
    files.push({
      name: 'PromptCaching',
      type: 'SERVER_JS',
      source: promptCachingCode
    });
  }

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
  console.log('✅ PROMPT CACHING DEPLOYED');
  console.log('═══════════════════════════════════════════════════');
  console.log('');
  console.log(`Files in project: ${files.length}`);
  console.log('');
  console.log('📋 Implementation Guide:');
  console.log('');
  console.log('1. Separate your prompt into static and dynamic parts:');
  console.log('   - Static: System instructions, schema, examples');
  console.log('   - Dynamic: Row-specific data, case info');
  console.log('');
  console.log('2. Update processOneInputRow_ in Code.gs:');
  console.log('');
  console.log('   // Before:');
  console.log('   const openaiOptions = {');
  console.log('     method: "post",');
  console.log('     headers: { ... },');
  console.log('     payload: JSON.stringify({ messages: [...] })');
  console.log('   };');
  console.log('');
  console.log('   // After:');
  console.log('   const openaiOptions = buildCachedPromptPayload(');
  console.log('     systemPrompt,  // Static instructions');
  console.log('     userPrompt,    // Dynamic row data');
  console.log('     { model, temperature, maxTokens }');
  console.log('   );');
  console.log('');
  console.log('3. Test with a small batch first');
  console.log('');
  console.log('💰 Expected Savings:');
  console.log('   - 30-50% cost reduction');
  console.log('   - For 1000 rows: Save $400-600');
  console.log('   - Cache lasts 5-10 minutes');
  console.log('');
  console.log('🔍 Test Functions Available:');
  console.log('   - testPromptCaching() - Test cache setup');
  console.log('   - estimateCacheSavings() - Calculate savings');
  console.log('   - analyzeExistingPrompt() - Migration helper');
  console.log('');
}

if (require.main === module) {
  deployPromptCaching().catch(error => {
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

module.exports = { deployPromptCaching };
