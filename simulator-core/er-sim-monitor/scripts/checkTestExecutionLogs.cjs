#!/usr/bin/env node

/**
 * Check recent execution logs from TEST script to see what's failing
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const TEST_SCRIPT_ID = '1HIw4Ok4G88YzHsECb5e_GvJH9XYefEY59pHXalFstiddLciyHXC06zNf';

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

async function checkLogs() {
  console.log('\n📊 CHECKING TEST SCRIPT EXECUTION LOGS\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const auth = await authorize();
  const script = google.script({ version: 'v1', auth });

  try {
    // Get recent processes (executions)
    console.log('🔍 Fetching recent executions...\n');

    const response = await script.processes.list({
      userProcessFilter: {
        scriptId: TEST_SCRIPT_ID,
        statuses: ['COMPLETED', 'FAILED', 'TIMED_OUT', 'CANCELED'],
        startTime: new Date(Date.now() - 3600000).toISOString() // Last hour
      },
      pageSize: 10
    });

    const processes = response.data.processes || [];

    if (processes.length === 0) {
      console.log('⚠️  No recent executions found in the last hour\n');
      console.log('💡 This could mean:\n');
      console.log('   • The cache button wasn\'t actually triggered\n');
      console.log('   • The function name doesn\'t match\n');
      console.log('   • The execution is still running\n');
      return;
    }

    console.log(`✅ Found ${processes.length} recent execution(s)\n`);
    console.log('═══════════════════════════════════════════════════════════════\n');

    processes.forEach((process, index) => {
      console.log(`📋 Execution #${index + 1}:\n`);
      console.log(`   Function: ${process.functionName || 'Unknown'}`);
      console.log(`   Status: ${process.processStatus}`);
      console.log(`   Type: ${process.processType}`);
      console.log(`   Start: ${process.startTime}`);
      console.log(`   Duration: ${process.duration || 'N/A'}`);

      if (process.processStatus === 'FAILED') {
        console.log(`   ❌ Error: ${process.errorMessage || 'No error message'}`);
      }

      if (process.processStatus === 'TIMED_OUT') {
        console.log(`   ⏱️  TIMED OUT - Function exceeded 30-second limit`);
      }

      console.log('');
    });

    // Find the most recent performCacheWithProgress execution
    const cacheExecution = processes.find(p =>
      p.functionName === 'performCacheWithProgress' ||
      p.functionName === 'preCacheRichData'
    );

    if (cacheExecution) {
      console.log('═══════════════════════════════════════════════════════════════');
      console.log('🎯 CACHE EXECUTION DETAILS:\n');
      console.log(`   Function: ${cacheExecution.functionName}`);
      console.log(`   Status: ${cacheExecution.processStatus}`);
      console.log(`   Duration: ${cacheExecution.duration || 'N/A'}`);

      if (cacheExecution.processStatus === 'TIMED_OUT') {
        console.log('\n⏱️  DIAGNOSIS: EXECUTION TIMEOUT\n');
        console.log('   The cache process is taking longer than 30 seconds.\n');
        console.log('   📋 Solutions:\n');
        console.log('   1. Reduce batch size from 25 to 10 rows');
        console.log('   2. Process data in smaller chunks');
        console.log('   3. Use time-driven triggers instead of UI button\n');
      }

      if (cacheExecution.processStatus === 'FAILED') {
        console.log('\n❌ DIAGNOSIS: EXECUTION FAILED\n');
        console.log(`   Error: ${cacheExecution.errorMessage}\n`);
      }

      console.log('═══════════════════════════════════════════════════════════════\n');
    } else {
      console.log('⚠️  No cache-related executions found\n');
      console.log('💡 The UI modal may not be calling the backend function\n');
    }

  } catch (e) {
    console.log('❌ Error fetching execution logs:', e.message, '\n');
    if (e.response) {
      console.log('Response:', JSON.stringify(e.response.data, null, 2));
    }
  }
}

checkLogs().catch(console.error);
