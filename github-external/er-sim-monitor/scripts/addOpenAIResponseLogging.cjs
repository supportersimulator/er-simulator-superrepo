#!/usr/bin/env node

/**
 * Add OpenAI Response Logging
 *
 * Add logging to capture the raw OpenAI response so we can see
 * what the AI is actually returning (especially the "error" key issue)
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const TOKEN_PATH = path.join(__dirname, '..', 'config', 'token.json');
const SCRIPT_ID = process.env.APPS_SCRIPT_ID;

async function addOpenAILogging() {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('  ADD OPENAI RESPONSE LOGGING');
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

  console.log('📖 Reading current code...');
  const response = await script.projects.getContent({ scriptId: SCRIPT_ID });
  const files = response.data.files;

  const codeFile = files.find(f => f.name === 'Code');
  let source = codeFile.source;

  console.log('✅ Found Code.gs');
  console.log('');

  // Find where OpenAI response is parsed
  console.log('🔄 Adding OpenAI response logging...');

  // Look for the pattern where JSON.parse happens on OpenAI response
  const oldParse = 'const parsed = JSON.parse(rawText);';
  const newParse = `Logger.log('🤖 RAW OpenAI Response: ' + rawText.slice(0, 500));
  const parsed = JSON.parse(rawText);
  Logger.log('🔑 Parsed keys: ' + Object.keys(parsed).join(', '));
  if (parsed.error) {
    Logger.log('❌ OpenAI returned error key: ' + JSON.stringify(parsed.error));
  }`;

  if (source.indexOf(oldParse) !== -1) {
    source = source.replace(oldParse, newParse);
    console.log('✅ Added OpenAI response logging');
  } else {
    console.log('⚠️  Could not find JSON.parse pattern, trying alternative...');

    // Look for callOpenAI_ function
    const callOpenAIStart = source.indexOf('function callOpenAI_');
    if (callOpenAIStart === -1) {
      throw new Error('Could not find callOpenAI_ function');
    }

    // Find the JSON.parse within callOpenAI_
    const funcEnd = source.indexOf('\\n}\\n', callOpenAIStart);
    const funcCode = source.substring(callOpenAIStart, funcEnd);

    if (funcCode.indexOf('JSON.parse') !== -1) {
      console.log('Found JSON.parse in callOpenAI_ function');
      // Will need manual intervention
      console.log('Please manually add logging after JSON.parse in callOpenAI_');
    }
  }
  console.log('');

  // Upload
  console.log('💾 Uploading...');
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
  console.log('✅ OPENAI LOGGING ADDED');
  console.log('═══════════════════════════════════════════════════');
  console.log('');
  console.log('Now run testBatchProcessRow3() again to see:');
  console.log('- Raw OpenAI response text');
  console.log('- Parsed JSON keys');
  console.log('- Any error key content');
  console.log('');
}

if (require.main === module) {
  addOpenAILogging().catch(error => {
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

module.exports = { addOpenAILogging };
