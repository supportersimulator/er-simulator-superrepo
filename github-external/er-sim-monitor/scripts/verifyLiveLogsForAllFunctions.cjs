/**
 * Verify Live Logs for All Functions
 *
 * Check that all key functions have addAILog() calls for debugging
 * Functions to check:
 * - runAICategorization (all mode + specific mode)
 * - retryFailedCases
 * - applyCategorizations
 * - clearAIResults
 */

const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function main() {
  console.log('🔍 Verifying Live Logs for All Functions\n');
  console.log('══════════════════════════════════════════════════════════════\n');

  const token = JSON.parse(fs.readFileSync('./config/token.json', 'utf-8'));
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/oauth2callback'
  );
  oAuth2Client.setCredentials(token);

  const script = google.script({ version: 'v1', auth: oAuth2Client });
  const scriptId = process.env.APPS_SCRIPT_ID;

  const project = await script.projects.getContent({ scriptId });
  const codeFile = project.data.files.find(f => f.name === 'Code');

  if (!codeFile) {
    console.log('❌ Code.gs not found\n');
    return;
  }

  const code = codeFile.source;

  console.log('📋 Checking Functions for Live Logging:\n');

  const functionsToCheck = [
    {
      name: 'runAICategorization',
      displayName: 'Run AI Categorization (all modes)',
      requiredLogs: [
        'Starting AI Categorization',
        'mode',
        'Processing',
        'Complete',
      ],
    },
    {
      name: 'retryFailedCases',
      displayName: 'Retry Failed Cases',
      requiredLogs: [
        'Starting retry',
        'failed cases',
        'Retrying',
      ],
    },
    {
      name: 'applyCategorizations',
      displayName: 'Apply to Master',
      requiredLogs: [
        'Applying',
        'Updated',
        'Applied',
      ],
    },
    {
      name: 'clearAIResults',
      displayName: 'Clear Results',
      requiredLogs: [
        'Clearing',
      ],
    },
  ];

  const results = [];

  for (const func of functionsToCheck) {
    console.log(`\n${'─'.repeat(70)}`);
    console.log(`🔍 ${func.displayName} (${func.name})\n`);

    // Find the function
    const funcMatch = code.match(new RegExp(`function ${func.name}\\([^)]*\\)[\\s\\S]*?(?=\\nfunction [a-zA-Z_]|$)`, 'm'));

    if (!funcMatch) {
      console.log(`  ❌ Function not found in Code.gs\n`);
      results.push({ func: func.name, status: 'NOT_FOUND' });
      continue;
    }

    const funcBody = funcMatch[0];

    // Check for addAILog calls
    const logCalls = funcBody.match(/addAILog\([^)]*\)/g);

    if (!logCalls || logCalls.length === 0) {
      console.log(`  ❌ NO addAILog() calls found\n`);
      console.log(`  ⚠️  User won't see any logs for this function!\n`);
      results.push({ func: func.name, status: 'NO_LOGS', logs: 0 });
      continue;
    }

    console.log(`  ✅ Found ${logCalls.length} addAILog() calls:\n`);

    logCalls.forEach((call, i) => {
      // Extract the message
      const msgMatch = call.match(/addAILog\(['"`]([^'"`]*)['"` ]/);
      if (msgMatch) {
        console.log(`     ${i + 1}. "${msgMatch[1]}"`);
      } else {
        console.log(`     ${i + 1}. ${call}`);
      }
    });

    console.log('');

    // Check if required logs are present
    const missingLogs = func.requiredLogs.filter(required =>
      !logCalls.some(call => call.toLowerCase().includes(required.toLowerCase()))
    );

    if (missingLogs.length > 0) {
      console.log(`  ⚠️  Missing recommended logs:`);
      missingLogs.forEach(log => {
        console.log(`     - "${log}"`);
      });
      console.log('');
      results.push({ func: func.name, status: 'PARTIAL', logs: logCalls.length, missing: missingLogs });
    } else {
      console.log(`  ✅ All recommended logs present\n`);
      results.push({ func: func.name, status: 'COMPLETE', logs: logCalls.length });
    }
  }

  console.log('═'.repeat(70) + '\n');
  console.log('📊 Summary:\n');

  const complete = results.filter(r => r.status === 'COMPLETE').length;
  const partial = results.filter(r => r.status === 'PARTIAL').length;
  const noLogs = results.filter(r => r.status === 'NO_LOGS').length;
  const notFound = results.filter(r => r.status === 'NOT_FOUND').length;

  console.log(`  ✅ Complete logging: ${complete}/${functionsToCheck.length}`);
  console.log(`  ⚠️  Partial logging: ${partial}/${functionsToCheck.length}`);
  console.log(`  ❌ No logging: ${noLogs}/${functionsToCheck.length}`);
  console.log(`  ❌ Not found: ${notFound}/${functionsToCheck.length}\n`);

  if (noLogs > 0 || notFound > 0) {
    console.log('═'.repeat(70) + '\n');
    console.log('⚠️  ACTION NEEDED:\n');
    console.log('Some functions are missing addAILog() calls.');
    console.log('User will not be able to see live logs for debugging.\n');
    console.log('Would you like me to add comprehensive logging to all functions? (Y/n)\n');

    return { needsFix: true, results };
  } else if (partial > 0) {
    console.log('═'.repeat(70) + '\n');
    console.log('✅ All functions have logging, but some could be improved.\n');
    console.log('Current logs are sufficient for basic debugging.\n');

    return { needsFix: false, results };
  } else {
    console.log('═'.repeat(70) + '\n');
    console.log('✅ ALL FUNCTIONS HAVE COMPLETE LOGGING!\n');
    console.log('User can copy logs from Live Logs panel for debugging.\n');

    return { needsFix: false, results };
  }
}

main()
  .then(result => {
    if (result && result.needsFix) {
      console.log('═'.repeat(70) + '\n');
    }
  })
  .catch(console.error);
