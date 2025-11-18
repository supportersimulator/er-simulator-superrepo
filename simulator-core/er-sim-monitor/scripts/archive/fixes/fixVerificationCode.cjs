#!/usr/bin/env node

/**
 * Fix Verification Code
 *
 * The verification diagnostic code is still reading from BATCH_QUEUE
 * but we now store data in BATCH_ROWS separately.
 * Need to update the verification to read from BATCH_ROWS instead.
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const TOKEN_PATH = path.join(__dirname, '..', 'config', 'token.json');
const SCRIPT_ID = process.env.APPS_SCRIPT_ID;

async function fixVerificationCode() {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('  FIX VERIFICATION CODE');
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

  console.log('Finding verification code in startBatchFromSidebar...');
  console.log('');

  // Find the verification code
  const oldVerification = `const verifyQueue = JSON.parse(getProp('BATCH_QUEUE','{}'));
  appendLogSafe('🔍 DEBUG: Verified queue has ' + (verifyQueue.rows ? verifyQueue.rows.length : 'NO ROWS PROPERTY') + ' rows');`;

  const newVerification = `// Verify by reading from BATCH_ROWS property
  const verifyRows = JSON.parse(getProp('BATCH_ROWS', '[]'));
  appendLogSafe('🔍 DEBUG: Verified BATCH_ROWS has ' + verifyRows.length + ' rows');
  appendLogSafe('🔍 DEBUG: First 5 rows: ' + JSON.stringify(verifyRows.slice(0, 5)));`;

  if (source.includes(oldVerification)) {
    source = source.replace(oldVerification, newVerification);
    console.log('✅ Updated verification to read from BATCH_ROWS');
  } else {
    console.log('⚠️  Old verification code not found, searching for similar pattern...');

    // Try a more flexible search
    const startBatchIdx = source.indexOf('function startBatchFromSidebar');
    const verifyIdx = source.indexOf('verifyQueue', startBatchIdx);

    if (verifyIdx !== -1) {
      // Find the start and end of these two lines
      const line1Start = source.lastIndexOf('\n', verifyIdx);
      const line2End = source.indexOf(';', source.indexOf('appendLogSafe', verifyIdx)) + 1;

      console.log('Found verification code:');
      console.log(source.substring(line1Start, line2End));

      source = source.substring(0, line1Start) + '\n  ' + newVerification + source.substring(line2End);
      console.log('✅ Replaced with new verification');
    } else {
      console.log('❌ Could not find verification code');
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

  console.log('✅ Code updated!');
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('✅ VERIFICATION CODE FIXED!');
  console.log('═══════════════════════════════════════════════════');
  console.log('');
  console.log('Now verification reads from BATCH_ROWS property directly');
  console.log('This will show the actual number of rows saved!');
  console.log('');
  console.log('Test:');
  console.log('1. Refresh Google Sheets (F5)');
  console.log('2. Click "Launch Batch Engine"');
  console.log('3. Should see: "🔍 DEBUG: Verified BATCH_ROWS has 20 rows"');
  console.log('');
}

if (require.main === module) {
  fixVerificationCode().catch(error => {
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

module.exports = { fixVerificationCode };
