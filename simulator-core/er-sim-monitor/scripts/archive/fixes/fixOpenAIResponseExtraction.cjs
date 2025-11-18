#!/usr/bin/env node

/**
 * Fix OpenAI Response Extraction
 *
 * Problem: Code calls JSON.parse(raw) on the entire OpenAI API response
 * But OpenAI Chat API returns: {"choices": [{"message": {"content": "..."}}]}
 * Need to extract .choices[0].message.content FIRST, then parse that as JSON
 *
 * Current broken flow:
 * 1. raw = response.getContentText() → full API response with choices array
 * 2. parsed = JSON.parse(raw) → {choices: [{message: {content: "..."}}]}
 * 3. Tries to use parsed as simulation data → FAILS
 *
 * Fixed flow:
 * 1. raw = response.getContentText() → full API response
 * 2. apiResponse = JSON.parse(raw) → {choices: [...]}
 * 3. content = apiResponse.choices[0].message.content → actual JSON string
 * 4. parsed = JSON.parse(content) → simulation data
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const TOKEN_PATH = path.join(__dirname, '..', 'config', 'token.json');
const SCRIPT_ID = process.env.APPS_SCRIPT_ID;

async function fixOpenAIResponseExtraction() {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('  FIX OPENAI RESPONSE EXTRACTION');
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

  console.log('📖 Reading current Apps Script code...');
  const response = await script.projects.getContent({ scriptId: SCRIPT_ID });
  const files = response.data.files;

  const codeFile = files.find(f => f.name === 'Code');
  if (!codeFile) {
    throw new Error('Could not find Code.gs file');
  }

  let source = codeFile.source;
  console.log('✅ Found Code.gs');
  console.log('');

  // Find the broken response handling in the first OpenAI function
  console.log('🔄 Fixing OpenAI Chat API response extraction...');

  const oldCode = `  const response = UrlFetchApp.fetch(url, options);
  const raw = response.getContentText();

  try {
    return JSON.parse(raw);
  } catch (err) {
    Logger.log("⚠️ JSON parse error: " + err + "\\nRaw AI output:\\n" + raw);
    throw new Error("AI JSON parse fail.");
  }`;

  const newCode = `  const response = UrlFetchApp.fetch(url, options);
  const raw = response.getContentText();

  Logger.log('🔍 DEBUG: Raw OpenAI API response: ' + raw.slice(0, 300));

  try {
    // Parse the full API response
    const apiResponse = JSON.parse(raw);

    // Check for API-level errors
    if (apiResponse.error) {
      Logger.log('❌ OpenAI API Error: ' + JSON.stringify(apiResponse.error));
      throw new Error('OpenAI API Error: ' + (apiResponse.error.message || JSON.stringify(apiResponse.error)));
    }

    // Extract the actual content from choices array
    if (!apiResponse.choices || !apiResponse.choices.length) {
      Logger.log('❌ No choices in API response');
      throw new Error('OpenAI returned no choices');
    }

    const content = apiResponse.choices[0].message.content;
    Logger.log('📝 Extracted content length: ' + content.length + ' characters');
    Logger.log('📝 Content preview: ' + content.slice(0, 200));

    // NOW parse the content as JSON (this is the simulation data)
    const parsed = JSON.parse(content);
    Logger.log('✅ Successfully parsed simulation JSON with ' + Object.keys(parsed).length + ' keys');

    return parsed;

  } catch (err) {
    Logger.log("⚠️ JSON parse error: " + err.message);
    Logger.log("Raw response: " + raw.slice(0, 500));
    throw new Error("AI response parse failed: " + err.message);
  }`;

  if (source.indexOf(oldCode) !== -1) {
    source = source.replace(oldCode, newCode);
    console.log('✅ Fixed OpenAI response extraction');
  } else {
    console.log('⚠️  Exact match not found, trying regex pattern match...');

    // Try to find the pattern with some flexibility
    const pattern = /const response = UrlFetchApp\.fetch\(url, options\);[\s\S]*?const raw = response\.getContentText\(\);[\s\S]*?try \{[\s\S]*?return JSON\.parse\(raw\);[\s\S]*?\} catch \(err\) \{[\s\S]*?throw new Error\("AI JSON parse fail\."\);[\s\S]*?\}/;

    if (pattern.test(source)) {
      source = source.replace(pattern, newCode);
      console.log('✅ Fixed OpenAI response extraction (via regex)');
    } else {
      throw new Error('Could not find OpenAI response handling code to fix');
    }
  }
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

  console.log('✅ Code updated successfully!');
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('✅ OPENAI RESPONSE EXTRACTION FIXED');
  console.log('═══════════════════════════════════════════════════');
  console.log('');
  console.log('What was fixed:');
  console.log('  Before: JSON.parse(raw) → parsed full API response');
  console.log('  After:  Extract choices[0].message.content → parse that as simulation JSON');
  console.log('');
  console.log('Added logging:');
  console.log('  - Raw API response preview');
  console.log('  - API error detection');
  console.log('  - Content extraction');
  console.log('  - Simulation JSON key count');
  console.log('');
  console.log('Next steps:');
  console.log('1. Refresh Google Sheets tab');
  console.log('2. Run testBatchProcessRow3() in Apps Script editor');
  console.log('3. Check execution log for proper extraction');
  console.log('4. Should now see ~200 keys instead of just "error"');
  console.log('');
}

if (require.main === module) {
  fixOpenAIResponseExtraction().catch(error => {
    console.error('');
    console.error('❌ FIX FAILED');
    console.error('════════════════════════════════════════════════════');
    console.error(`Error: ${error.message}`);
    console.error('');
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  });
}

module.exports = { fixOpenAIResponseExtraction };
