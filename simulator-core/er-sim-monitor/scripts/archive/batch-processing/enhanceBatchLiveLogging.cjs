#!/usr/bin/env node

/**
 * Enhance Batch Live Logging
 *
 * Problem: processOneInputRow_() only has 1 appendLogSafe() call
 * User wants to see live logs during batch processing like in single row mode
 *
 * Solution: Add appendLogSafe() calls throughout processOneInputRow_() for:
 * - OpenAI API call start
 * - Response received
 * - Field extraction progress
 * - Clinical defaults application
 * - Row writing
 * - Completion status
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const TOKEN_PATH = path.join(__dirname, '..', 'config', 'token.json');
const SCRIPT_ID = process.env.APPS_SCRIPT_ID;

async function enhanceBatchLiveLogging() {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('  ENHANCE BATCH LIVE LOGGING');
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

  // Add logging after OpenAI call
  console.log('🔄 Adding live logging for OpenAI API call...');

  const oldOpenAICall = `  const parsed = callOpenAiJson(model, userPrompt);
  Logger.log('✅ OpenAI returned parsed JSON');`;

  const newOpenAICall = `  if (batchMode) appendLogSafe('🤖 Calling OpenAI API to generate scenario...');
  const parsed = callOpenAiJson(model, userPrompt);
  Logger.log('✅ OpenAI returned parsed JSON');
  if (batchMode) appendLogSafe('✅ Received OpenAI response, extracting fields...');`;

  if (source.indexOf(oldOpenAICall) !== -1) {
    source = source.replace(oldOpenAICall, newOpenAICall);
    console.log('✅ Added OpenAI call logging');
  } else {
    console.log('⚠️  Could not find exact OpenAI call pattern, trying alternative...');

    // Try to find the pattern with some flexibility
    const pattern = /const parsed = callOpenAiJson\(model, userPrompt\);[\s]*Logger\.log\('✅ OpenAI returned parsed JSON'\);/;
    if (pattern.test(source)) {
      source = source.replace(pattern, newOpenAICall);
      console.log('✅ Added OpenAI call logging (via regex)');
    } else {
      console.log('⚠️  OpenAI call pattern not found - continuing with other enhancements');
    }
  }
  console.log('');

  // Add logging for clinical defaults
  console.log('🔄 Adding live logging for clinical defaults application...');

  const oldClinicalDefaults = `  // Apply clinical defaults for missing fields
  const filledParsed = applyClinicalDefaults_(parsed, mergedKeys);`;

  const newClinicalDefaults = `  // Apply clinical defaults for missing fields
  if (batchMode) appendLogSafe('🩺 Applying clinical defaults for missing vitals...');
  const filledParsed = applyClinicalDefaults_(parsed, mergedKeys);
  if (batchMode) appendLogSafe('✅ Clinical defaults applied');`;

  if (source.indexOf(oldClinicalDefaults) !== -1) {
    source = source.replace(oldClinicalDefaults, newClinicalDefaults);
    console.log('✅ Added clinical defaults logging');
  } else {
    console.log('⚠️  Clinical defaults pattern not found - may need manual adjustment');
  }
  console.log('');

  // Add logging for field extraction
  console.log('🔄 Adding live logging for field extraction...');

  const oldFieldExtraction = `  // Build output row
  const outRow = mergedKeys.map(k => {`;

  const newFieldExtraction = `  // Build output row
  if (batchMode) appendLogSafe('📝 Extracting ' + mergedKeys.length + ' fields from AI response...');
  const outRow = mergedKeys.map(k => {`;

  if (source.indexOf(oldFieldExtraction) !== -1) {
    source = source.replace(oldFieldExtraction, newFieldExtraction);
    console.log('✅ Added field extraction logging');
  } else {
    console.log('⚠️  Field extraction pattern not found - may need manual adjustment');
  }
  console.log('');

  // Add logging for row writing
  console.log('🔄 Adding live logging for row writing...');

  const oldRowWrite = `  outSheet.appendRow(outRow);
  Logger.log(\`✅ Row appended to '\${outSheet.getName()}'\`);`;

  const newRowWrite = `  if (batchMode) appendLogSafe('💾 Writing scenario to Master Scenario Convert...');
  outSheet.appendRow(outRow);
  Logger.log(\`✅ Row appended to '\${outSheet.getName()}'\`);
  if (batchMode) appendLogSafe('✅ Row created successfully');`;

  if (source.indexOf(oldRowWrite) !== -1) {
    source = source.replace(oldRowWrite, newRowWrite);
    console.log('✅ Added row writing logging');
  } else {
    console.log('⚠️  Row writing pattern not found - trying alternative...');

    const pattern = /outSheet\.appendRow\(outRow\);[\s]*Logger\.log\(`✅ Row appended to '\$\{outSheet\.getName\(\)\}'/;
    if (pattern.test(source)) {
      source = source.replace(pattern, newRowWrite);
      console.log('✅ Added row writing logging (via regex)');
    } else {
      console.log('⚠️  Row writing pattern not found - may need manual adjustment');
    }
  }
  console.log('');

  // Upload
  console.log('💾 Uploading enhanced logging...');
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
  console.log('✅ BATCH LIVE LOGGING ENHANCED');
  console.log('═══════════════════════════════════════════════════');
  console.log('');
  console.log('New logs you\'ll see during batch processing:');
  console.log('  1. "Starting conversion for Row X"');
  console.log('  2. "🤖 Calling OpenAI API to generate scenario..."');
  console.log('  3. "✅ Received OpenAI response, extracting fields..."');
  console.log('  4. "🩺 Applying clinical defaults for missing vitals..."');
  console.log('  5. "✅ Clinical defaults applied"');
  console.log('  6. "📝 Extracting N fields from AI response..."');
  console.log('  7. "💾 Writing scenario to Master Scenario Convert..."');
  console.log('  8. "✅ Row created successfully"');
  console.log('');
  console.log('Testing:');
  console.log('1. Refresh Google Sheets tab');
  console.log('2. Open sidebar');
  console.log('3. Run batch (Next 25 unprocessed rows)');
  console.log('4. Watch Live Logs update in real-time');
  console.log('');
}

if (require.main === module) {
  enhanceBatchLiveLogging().catch(error => {
    console.error('');
    console.error('❌ ENHANCEMENT FAILED');
    console.error('════════════════════════════════════════════════════');
    console.error(`Error: ${error.message}`);
    console.error('');
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  });
}

module.exports = { enhanceBatchLiveLogging };
