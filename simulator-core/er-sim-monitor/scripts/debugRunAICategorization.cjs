/**
 * Debug runAICategorization Function
 *
 * Check if the function properly handles mode and specificInput parameters
 */

const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function main() {
  console.log('🔍 Debugging runAICategorization Function\n');
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

  console.log('🔍 Finding runAICategorization function...\n');

  const funcMatch = code.match(/function runAICategorization\([^)]*\) \{[\s\S]*?(?=\nfunction [a-zA-Z_]|$)/m);

  if (!funcMatch) {
    console.log('❌ Function not found\n');
    return;
  }

  const funcBody = funcMatch[0];

  console.log('✅ Found function\n');
  console.log('📋 Function Signature:\n');

  const sigMatch = funcBody.match(/function runAICategorization\(([^)]*)\)/);
  if (sigMatch) {
    console.log(`  function runAICategorization(${sigMatch[1]})\n`);
  }

  console.log('🔍 Checking Key Features:\n');

  const checks = {
    'Accepts mode parameter': funcBody.includes('mode'),
    'Accepts specificInput parameter': funcBody.includes('specificInput'),
    'Has parseSpecificRowsInput helper': code.includes('function parseSpecificRowsInput('),
    'Has getCaseIDFromRow helper': code.includes('function getCaseIDFromRow('),
    'Filters input data by mode': funcBody.includes('filteredInputData') || funcBody.includes('filter'),
    'Has addAILog calls': funcBody.includes('addAILog'),
    'Gets OpenAI API key': funcBody.includes('getOpenAIAPIKey') || funcBody.includes('Settings!B2'),
  };

  for (const [check, passed] of Object.entries(checks)) {
    console.log(`  ${passed ? '✅' : '❌'} ${check}`);
  }

  console.log('\n══════════════════════════════════════════════════════════════\n');

  // Extract first 100 lines to see structure
  const lines = funcBody.split('\n').slice(0, 100);
  console.log('📝 Function Start (first 100 lines):\n');
  console.log('─'.repeat(70));
  lines.forEach((line, i) => {
    if (i < 50) { // Show first 50 lines
      console.log(`${(i + 1).toString().padStart(3, ' ')} ${line}`);
    }
  });
  console.log('─'.repeat(70) + '\n');

  // Check if function has try-catch
  const hasTryCatch = funcBody.includes('try {') && funcBody.includes('catch');
  console.log(`Error Handling: ${hasTryCatch ? '✅ Has try-catch' : '⚠️  No try-catch block'}\n`);

  // Save full function to file for inspection
  fs.writeFileSync(
    '/Users/aarontjomsland/er-sim-monitor/scripts/runAICategorization_function.txt',
    funcBody
  );

  console.log('✅ Saved full function to: runAICategorization_function.txt\n');
  console.log('══════════════════════════════════════════════════════════════\n');
}

main().catch(console.error);
