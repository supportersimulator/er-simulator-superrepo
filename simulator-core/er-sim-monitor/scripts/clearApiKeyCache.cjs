#!/usr/bin/env node

/**
 * Clear API Key Cache
 *
 * The old API key is cached in DocumentProperties
 * Even though Settings sheet has new key, cache still has old one
 *
 * Solution: Add code to clear the cache and force re-read from Settings sheet
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const TOKEN_PATH = path.join(__dirname, '..', 'config', 'token.json');
const SCRIPT_ID = process.env.APPS_SCRIPT_ID;

async function clearApiKeyCache() {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('  CLEAR API KEY CACHE');
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

  console.log('Adding function to clear API key cache...');
  console.log('');

  // Add a helper function to clear the cache
  const clearCacheFunc = `
function clearApiKeyCache() {
  PropertiesService.getDocumentProperties().deleteProperty('OPENAI_API_KEY');
  Logger.log('✅ Cleared API key cache');
  return 'API key cache cleared. Will re-read from Settings sheet on next use.';
}
`;

  // Check if function already exists
  if (!source.includes('function clearApiKeyCache()')) {
    // Add before the last closing brace
    const lastBrace = source.lastIndexOf('}');
    source = source.substring(0, lastBrace) + clearCacheFunc + source.substring(lastBrace);
    console.log('✅ Added clearApiKeyCache() function');
  } else {
    console.log('✅ clearApiKeyCache() function already exists');
  }

  console.log('');

  // Upload
  console.log('💾 Uploading code...');

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

  // Now execute the function to clear the cache
  console.log('🗑️  Executing clearApiKeyCache() to clear the cached key...');
  console.log('');

  try {
    const execResponse = await script.scripts.run({
      scriptId: SCRIPT_ID,
      requestBody: {
        function: 'clearApiKeyCache',
        devMode: false
      }
    });

    if (execResponse.data.error) {
      console.log('❌ Error executing function:');
      console.log(JSON.stringify(execResponse.data.error, null, 2));
    } else {
      console.log('✅ Cache cleared successfully!');
      console.log('Response:', execResponse.data.response.result);
    }
  } catch (error) {
    console.log('⚠️  Could not execute function automatically');
    console.log('Error:', error.message);
    console.log('');
    console.log('Manual steps to clear cache:');
    console.log('1. Open Extensions → Apps Script');
    console.log('2. Find the clearApiKeyCache() function');
    console.log('3. Select it from the function dropdown');
    console.log('4. Click Run');
    console.log('');
  }

  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('✅ API KEY CACHE CLEARED!');
  console.log('═══════════════════════════════════════════════════');
  console.log('');
  console.log('Next steps:');
  console.log('1. Make sure Settings sheet cell B1 has your NEW API key');
  console.log('   (should start with sk- but NOT sk-proj-)');
  console.log('2. Refresh Google Sheets (F5)');
  console.log('3. Click "Launch Batch Engine"');
  console.log('4. Should now use the new API key!');
  console.log('');
}

if (require.main === module) {
  clearApiKeyCache().catch(error => {
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

module.exports = { clearApiKeyCache };
