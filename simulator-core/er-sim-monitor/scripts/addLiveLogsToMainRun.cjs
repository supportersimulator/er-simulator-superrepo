/**
 * Add Live Logging to Main AI Categorization Run
 *
 * This adds:
 * 1. Makes log panel always visible (not hidden)
 * 2. Adds logging to runAICategorization() function
 * 3. Logs for both main run AND retry
 * 4. Auto-refresh during both operations
 */

const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function main() {
  console.log('🔧 Adding Live Logging to Main AI Categorization\n');

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

  // ===================================================================
  // PART 1: Update AI_Categorization_Backend.gs with logging for main run
  // ===================================================================

  const backendFile = fs.readFileSync('./apps-script-deployable/AI_Categorization_Backend.gs', 'utf-8');
  let updatedBackend = backendFile;

  // Rename addRetryLog to addAILog (used for both retry AND main run)
  updatedBackend = updatedBackend.replace(
    /function addRetryLog\(message\)/,
    'function addAILog(message)'
  );

  // Replace all calls to addRetryLog with addAILog
  updatedBackend = updatedBackend.replace(/addRetryLog\(/g, 'addAILog(');

  // Update the comment
  updatedBackend = updatedBackend.replace(
    /Helper function to add timestamped logs to Sidebar_Logs property/,
    'Helper function to add timestamped logs to Sidebar_Logs property (used for both main run and retry)'
  );

  console.log('✅ Renamed addRetryLog → addAILog (universal logging)\n');

  // Add logging to runAICategorization function
  updatedBackend = updatedBackend
    // Clear logs at start
    .replace(
      /function runAICategorization\(\) \{\s*const ss = SpreadsheetApp\.getActiveSpreadsheet\(\);/,
      `function runAICategorization() {
  // Clear old logs and start fresh
  PropertiesService.getDocumentProperties().deleteProperty('Sidebar_Logs');
  addAILog('🚀 Starting AI Categorization for All Cases...');
  addAILog('');

  const ss = SpreadsheetApp.getActiveSpreadsheet();`
    )
    // Log case count
    .replace(
      /const cases = \[\];\s*for \(let i = 2; i < data\.length; i\+\+\)/,
      `const cases = [];

  addAILog('📊 Analyzing Master Scenario Convert sheet...');

  for (let i = 2; i < data.length; i++)`
    )
    // Log batch processing start
    .replace(
      /\/\/ Process in batches of 25\s*const batchSize = 25;/,
      `// Process in batches of 25
  const batchSize = 25;

  addAILog('   Total cases found: ' + cases.length);
  addAILog('   Batch size: ' + batchSize);
  addAILog('   Total batches: ' + Math.ceil(cases.length / batchSize));
  addAILog('');`
    );

  // Check if the main run already has the addAILog calls in the batch loop
  if (!updatedBackend.includes('addAILog(\'━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\');')) {
    // Add logging calls right after the existing Logger.log in the batch loop
    const batchLoopMatch = updatedBackend.match(/(Logger\.log\('📦 Processing batch ' \+ batchNum)/);

    if (batchLoopMatch) {
      updatedBackend = updatedBackend.replace(
        batchLoopMatch[0],
        `addAILog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  addAILog('📦 Batch ' + batchNum + '/' + totalBatches + ' (' + batch.length + ' cases)');
  addAILog('   Calling OpenAI API...');

  ` + batchLoopMatch[0]
      );
      console.log('✅ Added batch logging to runAICategorization\n');
    }
  }

  fs.writeFileSync('./apps-script-deployable/AI_Categorization_Backend.gs', updatedBackend);
  console.log('✅ Updated AI_Categorization_Backend.gs with main run logging\n');

  // ===================================================================
  // PART 2: Update Phase2 UI to show logs by default and hook up main run
  // ===================================================================

  const phase2File = fs.readFileSync('./apps-script-deployable/Phase2_Enhanced_Categories_With_AI.gs', 'utf-8');
  let updatedPhase2 = phase2File;

  // Make log panel visible by default (remove display:none)
  updatedPhase2 = updatedPhase2.replace(
    /id="retry-logs-panel" class="section" style="display: none;/,
    'id="ai-logs-panel" class="section" style="'
  );

  // Update panel title
  updatedPhase2 = updatedPhase2.replace(
    /🪵 Live Retry Logs/,
    '🪵 Live AI Processing Logs'
  );

  // Update default message
  updatedPhase2 = updatedPhase2.replace(
    /No logs yet\. Click "Retry Failed Cases" to start\./,
    'No logs yet. Click "Run AI Categorization" or "Retry Failed Cases" to start.'
  );

  // Rename variables from retry-specific to general AI logs
  updatedPhase2 = updatedPhase2.replace(/retry-logs-panel/g, 'ai-logs-panel');
  updatedPhase2 = updatedPhase2.replace(/retryLogOutput/g, 'aiLogOutput');
  updatedPhase2 = updatedPhase2.replace(/copyRetryLogsBtn/g, 'copyAILogsBtn');
  updatedPhase2 = updatedPhase2.replace(/refreshRetryLogsBtn/g, 'refreshAILogsBtn');
  updatedPhase2 = updatedPhase2.replace(/clearRetryLogsBtn/g, 'clearAILogsBtn');
  updatedPhase2 = updatedPhase2.replace(/lastRetryLogs/g, 'lastAILogs');
  updatedPhase2 = updatedPhase2.replace(/refreshRetryLogs/g, 'refreshAILogs');
  updatedPhase2 = updatedPhase2.replace(/clearRetryLogs/g, 'clearAILogs');
  updatedPhase2 = updatedPhase2.replace(/copyRetryLogs/g, 'copyAILogs');

  // Update the JavaScript polling functions
  updatedPhase2 = updatedPhase2.replace(/retryLogInterval/g, 'aiLogInterval');
  updatedPhase2 = updatedPhase2.replace(/startRetryLogPolling/g, 'startAILogPolling');
  updatedPhase2 = updatedPhase2.replace(/stopRetryLogPolling/g, 'stopAILogPolling');

  // Add polling start to main run button
  const runAIMatch = updatedPhase2.match(/(function runAICategorization\(\) \{[\s\S]*?btn\.textContent = '🚀 Running AI Categorization)/);

  if (runAIMatch) {
    updatedPhase2 = updatedPhase2.replace(
      /btn\.textContent = '🚀 Running AI Categorization\.\.\.';\s*btn\.style\.background = '#28a745';/,
      `btn.textContent = '🚀 Running AI Categorization...';
      btn.style.background = '#28a745';

      // Start log polling
      startAILogPolling();`
    );
  }

  // Add polling stop to main run completion handler
  updatedPhase2 = updatedPhase2.replace(
    /function handleRunComplete\(result\) \{/,
    `function handleRunComplete(result) {
      // Stop polling and do final refresh
      stopAILogPolling();
      setTimeout(refreshAILogs, 500);
      `
  );

  // Update comment in JavaScript
  updatedPhase2 = updatedPhase2.replace(
    /Retry Log Functions/,
    'AI Processing Log Functions (for both main run and retry)'
  );

  // Update the auto-refresh message
  updatedPhase2 = updatedPhase2.replace(
    /Auto-refresh logs every 2 seconds when retry is running/,
    'Auto-refresh logs every 2 seconds when AI is processing'
  );

  fs.writeFileSync('./apps-script-deployable/Phase2_Enhanced_Categories_With_AI.gs', updatedPhase2);
  console.log('✅ Updated Phase2_Enhanced_Categories_With_AI.gs with always-visible logs\n');

  // ===================================================================
  // PART 3: Deploy to Apps Script
  // ===================================================================

  console.log('🚀 Deploying to Apps Script...\n');

  const codeFile = project.data.files.find(f => f.name === 'Code');
  const phase2ProjectFile = project.data.files.find(f => f.name === 'Phase2_Enhanced_Categories_With_AI');

  if (!codeFile || !phase2ProjectFile) {
    console.log('❌ Required files not found in project');
    return;
  }

  // Update Code.gs - replace addRetryLog with addAILog
  codeFile.source = codeFile.source.replace(/function addRetryLog\(/g, 'function addAILog(');
  codeFile.source = codeFile.source.replace(/addRetryLog\(/g, 'addAILog(');

  // Replace the entire runAICategorization and retryFailedCategorization functions
  const runMatch = updatedBackend.match(/(function runAICategorization\(\)[\s\S]*?^}(?=\n\n\/\*\*|\n\nfunction))/m);
  const retryMatch = updatedBackend.match(/(function retryFailedCategorization\(\)[\s\S]*?^}(?=\n|$))/m);

  if (runMatch) {
    // Remove old version
    codeFile.source = codeFile.source.replace(/(function runAICategorization\(\)[\s\S]*?^}(?=\n\n\/\*\*|\n\nfunction))/m, '');

    // Find clearAICategorizationResults and add after it
    const clearMatch = codeFile.source.match(/(function clearAICategorizationResults[\s\S]*?^})/m);
    if (clearMatch) {
      codeFile.source = codeFile.source.replace(
        clearMatch[0],
        clearMatch[0] + '\n\n' + runMatch[0]
      );
    }
  }

  if (retryMatch) {
    // Remove old version
    codeFile.source = codeFile.source.replace(/(function retryFailedCategorization\(\)[\s\S]*?^}(?=\n|$))/m, '');

    // Add new version after runAICategorization
    const runInCode = codeFile.source.match(/(function runAICategorization\(\)[\s\S]*?^})/m);
    if (runInCode) {
      codeFile.source = codeFile.source.replace(
        runInCode[0],
        runInCode[0] + '\n\n' + retryMatch[0]
      );
    }
  }

  phase2ProjectFile.source = updatedPhase2;

  await script.projects.updateContent({
    scriptId: scriptId,
    requestBody: { files: project.data.files }
  });

  console.log('✅ Deployment complete!\n');
  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log('🎯 What Changed:\n');
  console.log('Backend (AI_Categorization_Backend.gs):');
  console.log('  ✅ Renamed addRetryLog() → addAILog() (universal)');
  console.log('  ✅ Added logging to runAICategorization() main function');
  console.log('  ✅ Logs batch processing for ALL 207 cases');
  console.log('  ✅ Same detailed logging for retry function\n');
  console.log('Frontend (Phase2_Enhanced_Categories_With_AI.gs):');
  console.log('  ✅ Log panel now ALWAYS VISIBLE (not hidden)');
  console.log('  ✅ Renamed "Live Retry Logs" → "Live AI Processing Logs"');
  console.log('  ✅ Auto-refresh during BOTH main run AND retry');
  console.log('  ✅ Copy/Refresh/Clear buttons work for both operations\n');
  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log('💡 Next Steps:\n');
  console.log('  1. Refresh Google Sheet (F5)');
  console.log('  2. Open "✨ Open AI Categorization Tools"');
  console.log('  3. You should NOW see the log panel by default!');
  console.log('  4. Click EITHER "Run AI Categorization" OR "Retry Failed Cases"');
  console.log('  5. Watch logs update in real-time every 2 seconds');
  console.log('  6. When done, click "Copy Logs" and paste back here\n');
  console.log('Expected to see:');
  console.log('  [HH:MM:SS] 🚀 Starting AI Categorization for All Cases...');
  console.log('  [HH:MM:SS] 📊 Analyzing Master Scenario Convert sheet...');
  console.log('  [HH:MM:SS]    Total cases found: 207');
  console.log('  [HH:MM:SS]    Batch size: 25');
  console.log('  [HH:MM:SS]    Total batches: 9');
  console.log('  [HH:MM:SS] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  [HH:MM:SS] 📦 Batch 1/9 (25 cases)');
  console.log('  [HH:MM:SS]    Calling OpenAI API...');
  console.log('  ...\n');
}

main().catch(console.error);
