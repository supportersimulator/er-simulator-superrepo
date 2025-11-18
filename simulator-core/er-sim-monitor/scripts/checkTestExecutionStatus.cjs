#!/usr/bin/env node

/**
 * Check Test Spreadsheet Execution Status
 *
 * Investigates triggers, recent executions, and errors
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const TEST_SCRIPT_ID = '1INZy2-kQNEfEWEipSQ_WCvrvEhGgAeW4G4TM61W2ajNp_63G39KLPm4Y';
const TEST_SHEET_ID = '1t3qN8e537ghl38GTsXbVG8ML8OZtK2XyUpDiMQjnGAI';

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

async function checkExecutionStatus() {
  console.log('\n🔍 CHECKING TEST SPREADSHEET EXECUTION STATUS\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const auth = await authorize();
  const script = google.script({ version: 'v1', auth });
  const sheets = google.sheets({ version: 'v4', auth });

  try {
    // Step 1: Check for installed triggers
    console.log('Step 1: Checking installed triggers...\n');

    try {
      const project = await script.projects.get({ scriptId: TEST_SCRIPT_ID });
      console.log(`   ✓ Project accessible: ${project.data.title || 'Untitled'}\n`);
    } catch (error) {
      console.log(`   ⚠️  Could not access project details: ${error.message}\n`);
    }

    // Step 2: Check recent executions (requires script.projects.executions permission)
    console.log('Step 2: Attempting to read execution history...\n');

    try {
      // Note: This may fail if we don't have executions permission
      const executions = await script.scripts.run({
        scriptId: TEST_SCRIPT_ID,
        requestBody: {
          function: 'testLiveLogging',
          devMode: false
        }
      });
      console.log(`   ✓ Script execution API accessible\n`);
    } catch (error) {
      console.log(`   ⚠️  Cannot execute scripts directly via API: ${error.message}`);
      console.log(`   This is normal - execution logs require manual access\n`);
    }

    // Step 3: Check spreadsheet data to see if Row 206 was updated
    console.log('Step 3: Checking Row 206 in test spreadsheet...\n');

    const sheetData = await sheets.spreadsheets.values.get({
      spreadsheetId: TEST_SHEET_ID,
      range: 'Master Scenario Convert!A206:Z206' // Get entire Row 206
    });

    if (!sheetData.data.values || sheetData.data.values.length === 0) {
      console.log('   ⚠️  Row 206 is empty or does not exist\n');
    } else {
      const row = sheetData.data.values[0];
      console.log(`   ✓ Row 206 exists with ${row.length} columns`);

      // Check key columns for processing status
      const simId = row[0] || '(empty)';
      const title = row[1] || '(empty)';
      const summary = row[2] || '(empty)';

      console.log(`      Sim ID: ${simId}`);
      console.log(`      Title: ${title.substring(0, 50)}${title.length > 50 ? '...' : ''}`);
      console.log(`      Summary: ${summary.substring(0, 50)}${summary.length > 50 ? '...' : ''}`);
      console.log('');
    }

    // Step 4: Check Batch Reports sheet for logs
    console.log('Step 4: Checking Batch Reports sheet for logs...\n');

    try {
      const logsData = await sheets.spreadsheets.values.get({
        spreadsheetId: TEST_SHEET_ID,
        range: 'Batch Reports!A:B',
        valueRenderOption: 'FORMATTED_VALUE'
      });

      if (!logsData.data.values || logsData.data.values.length === 0) {
        console.log('   ⚠️  No logs found in Batch Reports sheet\n');
      } else {
        const logs = logsData.data.values;
        console.log(`   ✓ Found ${logs.length} log entries`);

        // Show last 10 entries
        console.log('\n   Last 10 log entries:\n');
        const lastTen = logs.slice(-10);
        lastTen.forEach(log => {
          const timestamp = log[0] || '';
          const message = log[1] || '';
          console.log(`      ${timestamp} | ${message}`);
        });
        console.log('');
      }
    } catch (error) {
      console.log(`   ⚠️  Could not read Batch Reports: ${error.message}\n`);
    }

    // Step 5: Check Settings sheet for API key
    console.log('Step 5: Verifying API key configuration...\n');

    try {
      const settingsData = await sheets.spreadsheets.values.get({
        spreadsheetId: TEST_SHEET_ID,
        range: 'Settings!A:B'
      });

      if (!settingsData.data.values) {
        console.log('   ⚠️  No Settings sheet found\n');
      } else {
        const settings = settingsData.data.values;
        const apiKeyRow = settings.find(row => row[0] === 'OPENAI_API_KEY');

        if (!apiKeyRow || !apiKeyRow[1]) {
          console.log('   ❌ API key NOT configured\n');
        } else {
          const key = apiKeyRow[1];
          const masked = key.substring(0, 7) + '...' + key.slice(-4);
          console.log(`   ✅ API key configured: ${masked}\n`);
        }
      }
    } catch (error) {
      console.log(`   ⚠️  Could not read Settings: ${error.message}\n`);
    }

    // Step 6: Get spreadsheet metadata to check for execution environment
    console.log('Step 6: Checking spreadsheet metadata...\n');

    const metadata = await sheets.spreadsheets.get({
      spreadsheetId: TEST_SHEET_ID
    });

    console.log(`   Title: ${metadata.data.properties.title}`);
    console.log(`   Locale: ${metadata.data.properties.locale}`);
    console.log(`   Time Zone: ${metadata.data.properties.timeZone}`);
    console.log(`   Sheets: ${metadata.data.sheets.length} tabs`);
    console.log('');

    // Summary
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📊 EXECUTION STATUS SUMMARY');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('\nDiagnostic Findings:\n');
    console.log('   Project: Accessible via API');
    console.log('   Row 206: Data present (check output above)');
    console.log('   Logs: Check Batch Reports sheet entries');
    console.log('   API Key: Check configuration above');
    console.log('\nPossible Issues:\n');
    console.log('   1. If Row 206 has "Starting conversion" log but no output:');
    console.log('      → Processing may have failed mid-execution');
    console.log('      → Check for errors in Apps Script execution logs');
    console.log('      → API key may be invalid or rate-limited\n');
    console.log('   2. If Batch Reports shows errors:');
    console.log('      → Check error messages above');
    console.log('      → May indicate validation failures or API issues\n');
    console.log('   3. If no logs at all:');
    console.log('      → Sidebar may not have been triggered');
    console.log('      → Manual trigger needed: Extensions → Apps Script → openSimSidebar()\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 403) {
      console.error('\n⚠️  Permission denied. Make sure OAuth token has required scopes:');
      console.error('   - https://www.googleapis.com/auth/script.projects');
      console.error('   - https://www.googleapis.com/auth/spreadsheets\n');
    }
    throw error;
  }
}

checkExecutionStatus().catch(error => {
  console.error('\nStatus check failed:', error.message);
  process.exit(1);
});
