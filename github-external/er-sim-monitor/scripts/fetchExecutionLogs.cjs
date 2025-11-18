#!/usr/bin/env node

/**
 * Fetch latest execution logs and extract [CACHE DEBUG] messages
 * Clean output ready for copy/paste
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const TEST_SCRIPT_ID = '1kkPZU3GsCCuu5IhTEOufmDT1Cb2rSQVB3Y3u1DPf87yoSV4WVtoNvd6i';

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

async function fetchLogs() {
  console.log('\n🔍 FETCHING LATEST EXECUTION LOGS\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const auth = await authorize();
  const script = google.script({ version: 'v1', auth });

  try {
    // Get most recent execution
    console.log('📊 Getting most recent execution...\n');

    const executions = await script.processes.list({
      userProcessFilter: {
        scriptId: TEST_SCRIPT_ID,
        types: ['APPS_SCRIPT_FUNCTION']
      },
      pageSize: 1
    });

    if (!executions.data.processes || executions.data.processes.length === 0) {
      console.log('⚠️  No recent executions found.\n');
      console.log('Please run "🤖 AI: Discover Novel Pathways" button first.\n');
      return;
    }

    const latestExec = executions.data.processes[0];
    const functionName = latestExec.projectName || 'Unknown';
    const status = latestExec.processStatus;
    const startTime = new Date(latestExec.startTime);
    const duration = latestExec.duration ? `${latestExec.duration}s` : 'N/A';

    console.log('✅ Found execution:\n');
    console.log('   Function: ' + functionName);
    console.log('   Status: ' + status);
    console.log('   Started: ' + startTime.toLocaleString());
    console.log('   Duration: ' + duration + '\n');

    if (status === 'FAILED') {
      console.log('❌ Execution FAILED\n');
      if (latestExec.executionError) {
        console.log('Error: ' + latestExec.executionError + '\n');
      }
    }

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📋 CACHE DEBUG LOGS (Copy everything below):\n');
    console.log('---START LOGS---\n');

    // Try to get execution logs
    // Note: Apps Script API doesn't provide direct log access
    // User needs to copy from the UI

    console.log('⚠️  IMPORTANT: Apps Script API doesn\'t provide direct log access.\n');
    console.log('Please follow these steps to get the logs:\n');
    console.log('1. Open your Google Sheet');
    console.log('2. Go to Extensions → Apps Script');
    console.log('3. Click "Executions" in left sidebar');
    console.log('4. Click the most recent execution (shown above)');
    console.log('5. Look for lines starting with "[CACHE DEBUG]"');
    console.log('6. Copy ALL the [CACHE DEBUG] lines');
    console.log('7. Paste them back to me\n');
    console.log('Example of what to look for:');
    console.log('   🔍 [CACHE DEBUG] Starting analyzeCatalog_()');
    console.log('   🔍 [CACHE DEBUG] Got spreadsheet: Your Sheet Name');
    console.log('   🔍 [CACHE DEBUG] Looking for Pathway_Analysis_Cache sheet...');
    console.log('   ... etc ...\n');

    console.log('---END LOGS---\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

    console.log('💡 TIP: The diagnostic logs will show exactly where the cache');
    console.log('   retrieval is failing or why it\'s not being used.\n');

  } catch (e) {
    console.log('\n❌ Error fetching execution data: ' + e.message + '\n');

    console.log('📋 MANUAL LOG ACCESS:\n');
    console.log('1. Open your Google Sheet');
    console.log('2. Go to Extensions → Apps Script');
    console.log('3. Click "Executions" in left sidebar');
    console.log('4. Click the most recent execution');
    console.log('5. Copy all [CACHE DEBUG] log lines');
    console.log('6. Paste them back to me\n');
  }
}

fetchLogs().catch(console.error);
