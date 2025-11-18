#!/usr/bin/env node

/**
 * Check Apps Script Execution History
 * Find when ATSR was last used successfully
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
require('dotenv').config();

const SCRIPT_ID = '1NXjFvH2Wo117saCyqmNDfCqZ1iQ9vykxa0-kHUhFAYDuhthgql5Ru_P6';

async function checkHistory() {
  console.log('🔍 Checking Apps Script Execution History\n');
  console.log('════════════════════════════════════════════════════\n');

  // Authenticate
  console.log('🔑 Authenticating...');
  const credentialsPath = path.join(__dirname, '../config/credentials.json');
  const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
  const {client_id, client_secret, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  const tokenPath = path.join(__dirname, '../config/token.json');
  const token = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
  oAuth2Client.setCredentials(token);
  console.log('   ✅ Authenticated\n');

  const script = google.script({version: 'v1', auth: oAuth2Client});

  try {
    // List recent executions
    console.log('📜 Fetching recent executions...');
    const executions = await script.processes.list({
      userProcessFilter: {
        scriptId: SCRIPT_ID,
        types: ['EDITOR'],
        statuses: ['COMPLETED', 'FAILED'],
        startTime: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() // Last 30 days
      },
      pageSize: 50
    });

    if (!executions.data.processes || executions.data.processes.length === 0) {
      console.log('   ⚠️  No recent executions found\n');
      return;
    }

    console.log(`   ✅ Found ${executions.data.processes.length} executions\n`);

    console.log('════════════════════════════════════════════════════');
    console.log('RECENT EXECUTION HISTORY');
    console.log('════════════════════════════════════════════════════\n');

    // Filter for ATSR-related executions
    const atsrExecutions = executions.data.processes.filter(p =>
      p.functionName && p.functionName.toLowerCase().includes('atsr')
    );

    if (atsrExecutions.length > 0) {
      console.log(`📊 ATSR Tool Executions (${atsrExecutions.length} found):\n`);

      atsrExecutions.forEach((exec, idx) => {
        const date = new Date(exec.startTime);
        const duration = exec.duration ? `${parseFloat(exec.duration.replace('s', ''))}s` : 'N/A';
        const status = exec.status === 'COMPLETED' ? '✅' : '❌';

        console.log(`${idx + 1}. ${status} ${exec.functionName}`);
        console.log(`   Date: ${date.toLocaleDateString()} ${date.toLocaleTimeString()}`);
        console.log(`   Duration: ${duration}`);
        console.log(`   Status: ${exec.status}`);
        if (exec.processType) console.log(`   Type: ${exec.processType}`);
        console.log();
      });
    } else {
      console.log('   ⚠️  No ATSR executions found in recent history\n');
    }

    // Show all executions for context
    console.log('════════════════════════════════════════════════════');
    console.log('ALL RECENT EXECUTIONS');
    console.log('════════════════════════════════════════════════════\n');

    executions.data.processes.slice(0, 20).forEach((exec, idx) => {
      const date = new Date(exec.startTime);
      const status = exec.status === 'COMPLETED' ? '✅' : '❌';

      console.log(`${idx + 1}. ${status} ${exec.functionName || '(unknown function)'}`);
      console.log(`   Date: ${date.toLocaleDateString()} ${date.toLocaleTimeString()}`);
      console.log(`   Status: ${exec.status}`);
      console.log();
    });

    // Save full history
    const outputPath = path.join(__dirname, '../apps-script-backup/execution-history.json');
    fs.writeFileSync(outputPath, JSON.stringify(executions.data, null, 2));
    console.log(`💾 Full execution history saved to: ${outputPath}\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);

    if (error.message.includes('permission')) {
      console.log('\n💡 TIP: This requires Apps Script API execution permissions');
      console.log('   Enable at: https://script.google.com/home/usersettings\n');
    }
  }
}

checkHistory().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
