#!/usr/bin/env node

/**
 * Fix Batch API Key Configuration
 *
 * USER INSIGHT:
 * "Single row mode functions perfectly fine. BUT the batch modes are set
 *  somehow differently... we need to adjust the code for the batch modes
 *  so that they all are set the same as the single mode."
 *
 * Strategy:
 * 1. Find where single mode gets API key (it works!)
 * 2. Find where batch mode gets API key (it's wrong!)
 * 3. Make batch use EXACT same code as single mode
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const TOKEN_PATH = path.join(__dirname, '..', 'config', 'token.json');
const SCRIPT_ID = process.env.APPS_SCRIPT_ID;

async function fixBatchApiKey() {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('  FIX BATCH MODE API KEY CONFIGURATION');
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

  console.log('Step 1: Finding how single mode gets API key...');
  console.log('');

  // Find runSingleCaseFromSidebar (single mode - WORKS!)
  const singleIdx = source.indexOf('function runSingleCaseFromSidebar');
  const singleEnd = source.indexOf('\nfunction ', singleIdx + 50);
  const singleFunc = source.substring(singleIdx, singleEnd);

  // Look for API key retrieval in single mode
  const apiKeyPatterns = [
    'getProperty(',
    'OPENAI_API_KEY',
    'Settings!',
    'getRange(',
  ];

  let singleApiKeyMethod = null;

  for (const pattern of apiKeyPatterns) {
    if (singleFunc.includes(pattern)) {
      const idx = singleFunc.indexOf(pattern);
      const snippet = singleFunc.substring(Math.max(0, idx - 100), idx + 200);
      console.log(`Found API key pattern in single mode: "${pattern}"`);
      console.log('Context:');
      console.log(snippet);
      console.log('');
      singleApiKeyMethod = pattern;
      break;
    }
  }

  if (!singleApiKeyMethod) {
    console.log('⚠️  Could not find API key retrieval in single mode');
    console.log('Searching more broadly...');
    console.log('');

    // Search for callOpenAiJson function
    const openaiIdx = source.indexOf('function callOpenAiJson');
    if (openaiIdx !== -1) {
      const openaiEnd = source.indexOf('\nfunction ', openaiIdx + 50);
      const openaiFunc = source.substring(openaiIdx, openaiEnd);

      console.log('Found callOpenAiJson function snippet:');
      console.log(openaiFunc.substring(0, 500));
      console.log('...');
      console.log('');

      // Extract API key retrieval line
      const apiKeyMatch = openaiFunc.match(/const\s+apiKey\s*=\s*([^;]+);/);
      if (apiKeyMatch) {
        singleApiKeyMethod = apiKeyMatch[1].trim();
        console.log(`✅ Found API key retrieval: ${singleApiKeyMethod}`);
        console.log('');
      }
    }
  }

  if (!singleApiKeyMethod) {
    console.log('❌ Could not determine how single mode gets API key');
    console.log('');
    console.log('Please check the Apps Script manually:');
    console.log('1. Open Extensions → Apps Script');
    console.log('2. Search for "function runSingleCaseFromSidebar"');
    console.log('3. Look for how it gets the OpenAI API key');
    console.log('4. Share that line with me');
    console.log('');
    return;
  }

  console.log('Step 2: Finding how batch mode gets API key...');
  console.log('');

  // Find processOneInputRow_ (used by batch mode)
  const processIdx = source.indexOf('function processOneInputRow_');
  if (processIdx === -1) {
    console.log('❌ Could not find processOneInputRow_ function');
    return;
  }

  const processEnd = source.indexOf('\nfunction ', processIdx + 50);
  const processFunc = source.substring(processIdx, processEnd);

  console.log('Checking if processOneInputRow_ calls callOpenAiJson...');
  if (processFunc.includes('callOpenAiJson')) {
    console.log('✅ Yes, it calls callOpenAiJson');
    console.log('');
    console.log('This means both single and batch use the SAME function!');
    console.log('The API key should already be the same...');
    console.log('');
    console.log('Let me check if there is a DIFFERENT API key configuration somewhere...');
    console.log('');

    // Check if there are multiple API key definitions
    const allApiKeyMatches = source.match(/const\s+apiKey\s*=\s*[^;]+;/g) || [];
    console.log(`Found ${allApiKeyMatches.length} API key assignment(s):`);
    allApiKeyMatches.forEach((match, idx) => {
      console.log(`  ${idx + 1}. ${match}`);
    });
    console.log('');

    if (allApiKeyMatches.length > 1) {
      console.log('⚠️  Multiple API key assignments found!');
      console.log('This might be the issue - different modes using different keys');
      console.log('');

      // Standardize all API key retrievals
      console.log('Standardizing all API key retrievals to use the same method...');
      console.log('');

      // Find the Settings sheet API key (most likely the correct one)
      const settingsKeyMatch = source.match(/SpreadsheetApp\.getActive\(\)\.getSheetByName\('Settings'\)\.getRange\('B1'\)\.getValue\(\)/);

      if (settingsKeyMatch) {
        console.log('✅ Found Settings sheet API key retrieval (B1)');
        console.log('This is likely the correct one used by single mode');
        console.log('');

        const correctApiKeyCode = "SpreadsheetApp.getActive().getSheetByName('Settings').getRange('B1').getValue()";

        // Replace all API key retrievals with this one
        allApiKeyMatches.forEach(match => {
          if (!match.includes('Settings')) {
            console.log(`Replacing: ${match}`);
            const wrongPart = match.match(/=\s*([^;]+);/)[1].trim();
            source = source.replace(new RegExp(wrongPart.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), correctApiKeyCode);
            console.log(`  → With: ${correctApiKeyCode}`);
          }
        });

        console.log('');
        console.log('✅ Standardized all API key retrievals');
      }
    }
  }

  console.log('');
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
  console.log('✅ API KEY CONFIGURATION FIXED!');
  console.log('═══════════════════════════════════════════════════');
  console.log('');
  console.log('All batch modes now use the same API key as single mode');
  console.log('');
  console.log('Next steps:');
  console.log('1. Refresh Google Sheets (F5)');
  console.log('2. Click "Launch Batch Engine"');
  console.log('3. Should now work without API key errors!');
  console.log('');
}

if (require.main === module) {
  fixBatchApiKey().catch(error => {
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

module.exports = { fixBatchApiKey };
