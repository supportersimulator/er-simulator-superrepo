/**
 * Ensure AI Categorization Logs Work
 *
 * Makes sure runAICategorization() writes to live logs that are visible in the panel
 */

const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function main() {
  console.log('🔧 Ensuring AI Categorization Logs Work\n');
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

  console.log('📥 Downloading current project...\n');

  const project = await script.projects.getContent({ scriptId });
  const codeFile = project.data.files.find(f => f.name === 'Code');

  if (!codeFile) {
    console.log('❌ Code.gs not found\n');
    return;
  }

  let code = codeFile.source;

  console.log('📝 Adding live log calls to runAICategorization()...\n');

  // Find the runAICategorization function
  const funcMatch = code.match(/function runAICategorization\(mode, specificInput\)[\s\S]*?(?=\nfunction [a-zA-Z])/);

  if (!funcMatch) {
    console.log('❌ runAICategorization() not found\n');
    return;
  }

  let func = funcMatch[0];

  // Add logging at key points if not already there
  if (!func.includes('addAILog')) {
    console.log('Adding addAILog calls...\n');

    // Add log at function start
    func = func.replace(
      /(mode = mode \|\| 'all';)/,
      `$1

  // Clear old logs and start fresh
  clearAILogs();
  addAILog('🚀 Starting AI Categorization...');
  addAILog('   Mode: ' + mode);`
    );

    // Add log when parsing specific rows
    func = func.replace(
      /(targetCaseIDs = parseSpecificRowsInput\(specificInput, resultsSheet, inputSheet\);)/,
      `$1
    addAILog('   Parsed ' + targetCaseIDs.length + ' Case IDs from input');`
    );

    // Add log when starting batch processing
    func = func.replace(
      /(for \(let i = 0; i < filteredInputData\.length)/,
      `addAILog('\\n📊 Processing ' + filteredInputData.length + ' cases...');
  addAILog('   This will take ~' + Math.ceil(filteredInputData.length * 2 / 60) + ' minutes');
  addAILog('');

  $1`
    );

    // Add log every 5 cases
    func = func.replace(
      /(const caseID = row\[0\];)/,
      `$1

    // Log progress every 5 cases
    if (i % 5 === 0 || i === filteredInputData.length - 1) {
      addAILog('   Processing ' + (i + 1) + ' of ' + filteredInputData.length + ': ' + caseID);
    }`
    );

    // Add completion log
    func = func.replace(
      /(toast_\('AI Categorization complete')/,
      `addAILog('');
  addAILog('✅ Categorization Complete!');
  addAILog('   Processed: ' + (i + 1) + ' cases');
  addAILog('   Success: ' + successCount);
  addAILog('   Errors: ' + errorCount);

  $1`
    );

    code = code.replace(/function runAICategorization\(mode, specificInput\)[\s\S]*?(?=\nfunction [a-zA-Z])/, func);

    console.log('✅ Added live logging\n');
  } else {
    console.log('✅ Live logging already exists\n');
  }

  // Ensure addAILog and clearAILogs functions exist
  if (!code.includes('function addAILog(')) {
    console.log('📝 Adding addAILog() function...\n');

    const logFunctions = `
/**
 * Add log entry to AI Categorization logs
 */
function addAILog(message) {
  const props = PropertiesService.getScriptProperties();
  let logs = props.getProperty('AI_Logs') || '';

  const timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'HH:mm:ss');
  logs += '[' + timestamp + '] ' + message + '\\n';

  // Keep only last 500 lines
  const lines = logs.split('\\n');
  if (lines.length > 500) {
    logs = lines.slice(-500).join('\\n');
  }

  props.setProperty('AI_Logs', logs);
}

/**
 * Clear AI Categorization logs
 */
function clearAILogs() {
  PropertiesService.getScriptProperties().deleteProperty('AI_Logs');
}

/**
 * Get AI Categorization logs
 */
function getAILogs() {
  return PropertiesService.getScriptProperties().getProperty('AI_Logs') || 'No logs yet.';
}
`;

    // Add before runAICategorization
    const runFuncIndex = code.indexOf('function runAICategorization');
    if (runFuncIndex !== -1) {
      code = code.substring(0, runFuncIndex) + logFunctions + '\n' + code.substring(runFuncIndex);
      console.log('✅ Added log functions\n');
    }
  } else {
    console.log('✅ Log functions already exist\n');
  }

  codeFile.source = code;

  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('🚀 Deploying changes...\n');

  await script.projects.updateContent({
    scriptId: scriptId,
    requestBody: { files: project.data.files }
  });

  console.log('✅ Deployment complete!\n');
  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('🎯 Live Logs Now Active!\n');
  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('When you run AI Categorization:\n');
  console.log('  1. Select mode (All Cases or Specific Rows)');
  console.log('  2. Click "🚀 Run AI Categorization"');
  console.log('  3. Watch the 🪵 Live Retry Logs section update');
  console.log('  4. Click "Refresh" to see latest logs');
  console.log('  5. Click "Copy Logs" to copy and paste here\n');
  console.log('You\'ll see:');
  console.log('  • Start message with mode');
  console.log('  • Number of cases being processed');
  console.log('  • Progress every 5 cases');
  console.log('  • Completion summary with success/error counts\n');
}

main().catch(console.error);
