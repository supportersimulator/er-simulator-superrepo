/**
 * Add Live Logging System to Retry Function
 *
 * This adds:
 * 1. addRetryLog() helper function to write to Sidebar_Logs
 * 2. Detailed logging throughout retry process
 * 3. Live log panel UI in Phase2 sidebar
 * 4. Copy Logs button
 */

const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function main() {
  console.log('🔧 Adding Live Logging System to Retry Function\n');

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
  // PART 1: Update AI_Categorization_Backend.gs with logging
  // ===================================================================

  const backendFile = fs.readFileSync('./apps-script-deployable/AI_Categorization_Backend.gs', 'utf-8');

  // Add helper function before retryFailedCategorization
  const logHelper = `
/**
 * Helper function to add timestamped logs to Sidebar_Logs property
 */
function addRetryLog(message) {
  try {
    const props = PropertiesService.getDocumentProperties();
    const existingLogs = props.getProperty('Sidebar_Logs') || '';
    const timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'HH:mm:ss');
    const newLog = '[' + timestamp + '] ' + message;
    props.setProperty('Sidebar_Logs', existingLogs + newLog + '\\n');
    Logger.log(newLog);  // Also log to execution log
  } catch (err) {
    Logger.log('Error writing to sidebar log: ' + err.message);
  }
}
`;

  let updatedBackend = backendFile;

  // Insert log helper before retry function
  if (!updatedBackend.includes('function addRetryLog')) {
    updatedBackend = updatedBackend.replace(
      /\/\*\*\s*\n\s*\* Retry AI categorization for ONLY the failed cases/,
      logHelper + '\n/**\n * Retry AI categorization for ONLY the failed cases'
    );
    console.log('✅ Added addRetryLog() helper function');
  }

  // Now enhance the retry function with detailed logging
  updatedBackend = updatedBackend
    // Clear logs at start
    .replace(
      /Logger\.log\('🔄 Starting retry for failed cases\.\.\.'\);/,
      `PropertiesService.getDocumentProperties().deleteProperty('Sidebar_Logs');  // Clear old logs
  addRetryLog('🔄 Starting Retry for Failed Cases...');
  addRetryLog('');`
    )
    // Log when finding failed cases
    .replace(
      /Logger\.log\('📊 Found ' \+ failedCases\.length \+ ' failed cases to retry'\);/,
      `addRetryLog('📊 Found ' + failedCases.length + ' failed cases to retry');
  addRetryLog('   Case IDs: ' + failedCases.map(fc => fc.caseID).slice(0, 10).join(', ') + (failedCases.length > 10 ? '...' : ''));
  addRetryLog('');`
    )
    // Log clearing
    .replace(
      /Logger\.log\('🧹 Clearing failed rows\.\.\.'\);/,
      `addRetryLog('🧹 Clearing ' + failedCases.length + ' failed rows in results sheet...');`
    )
    .replace(
      /Logger\.log\('✅ Cleared ' \+ failedCases\.length \+ ' failed rows'\);/,
      `addRetryLog('✅ Cleared successfully');
  addRetryLog('');`
    )
    // Log batch processing start
    .replace(
      /Logger\.log\('📦 Retry batch ' \+ batchNum \+ '\/' \+ totalBatches \+ ' \(' \+ batch\.length \+ ' cases\)\.\.\.'\);/,
      `addRetryLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  addRetryLog('📦 Batch ' + batchNum + '/' + totalBatches + ' (' + batch.length + ' cases)');
  addRetryLog('   Case IDs: ' + batch.map(c => c.caseID).join(', '));
  addRetryLog('   Calling OpenAI API...');`
    )
    // Log after batch completes
    .replace(
      /const batchResults = categorizeBatchWithAI\(batch\);/,
      `const batchResults = categorizeBatchWithAI(batch);
      addRetryLog('   ✅ API responded with ' + batchResults.length + ' results');

      // Log sample result
      if (batchResults.length > 0) {
        const sample = batchResults[0];
        addRetryLog('   Sample: ' + sample.caseID + ' → ' + (sample.suggestedSymptom || '(empty)') + ' / ' + (sample.suggestedSystem || '(empty)'));
        if (sample.reasoning) {
          addRetryLog('   Reasoning: ' + sample.reasoning.substring(0, 80) + '...');
        }
      }

      // Log any empty results
      const emptyResults = batchResults.filter(r => !r.suggestedSymptom || r.suggestedSymptom.length === 0);
      if (emptyResults.length > 0) {
        addRetryLog('   ⚠️  WARNING: ' + emptyResults.length + ' results still empty!');
        emptyResults.forEach(er => {
          addRetryLog('      - ' + er.caseID + ': ' + (er.reasoning || 'no reasoning'));
        });
      }`
    )
    .replace(
      /Logger\.log\('✅ Retry batch ' \+ batchNum \+ ' complete'\);/,
      `addRetryLog('   ✅ Batch ' + batchNum + ' complete');
  addRetryLog('');`
    )
    // Log batch errors
    .replace(
      /Logger\.log\('❌ Retry batch ' \+ batchNum \+ ' failed: ' \+ error\.message\);/,
      `addRetryLog('   ❌ Batch ' + batchNum + ' FAILED: ' + error.message);
      addRetryLog('   Creating placeholder results for ' + batch.length + ' cases');
      addRetryLog('');`
    )
    // Log write-back
    .replace(
      /Logger\.log\('🎉 Retry complete!'\);/,
      `addRetryLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  addRetryLog('📝 Writing Results Back to Sheet...');`
    )
    .replace(
      /Logger\.log\('   Failed cases retried: ' \+ retryResults\.length\);/,
      `addRetryLog('   Total results: ' + retryResults.length);`
    )
    .replace(
      /Logger\.log\('✅ Updated results sheet with retry data'\);/,
      `addRetryLog('✅ Write-back complete');
  addRetryLog('');
  addRetryLog('🎉 Retry Complete!');
  addRetryLog('   Cases retried: ' + retryResults.length);
  addRetryLog('   Successfully fixed: ' + successCount);
  addRetryLog('   Still failed: ' + stillFailedCount);
  addRetryLog('');
  addRetryLog('═══════════════════════════════════════════');`
    );

  fs.writeFileSync('./apps-script-deployable/AI_Categorization_Backend.gs', updatedBackend);
  console.log('✅ Updated AI_Categorization_Backend.gs with live logging\n');

  // ===================================================================
  // PART 2: Update Phase2 UI with live log panel
  // ===================================================================

  const phase2File = fs.readFileSync('./apps-script-deployable/Phase2_Enhanced_Categories_With_AI.gs', 'utf-8');

  // Add live log panel HTML after the retry button
  const logPanelHTML = `
    <!-- 🪵 Live Retry Logs Panel -->
    <div id="retry-logs-panel" class="section" style="display: none; margin-top: 12px;">
      <div class="section-title" style="display: flex; justify-content: space-between; align-items: center;">
        <span>🪵 Live Retry Logs</span>
        <div>
          <button id="copyRetryLogsBtn" class="log-btn copy" onclick="copyRetryLogs()">Copy Logs</button>
          <button id="refreshRetryLogsBtn" class="log-btn" onclick="refreshRetryLogs()">Refresh</button>
          <button id="clearRetryLogsBtn" class="log-btn danger" onclick="clearRetryLogs()">Clear</button>
        </div>
      </div>
      <pre id="retryLogOutput" class="log-output">No logs yet. Click "Retry Failed Cases" to start.</pre>
    </div>`;

  let updatedPhase2 = phase2File;

  // Insert log panel after retry button section
  if (!updatedPhase2.includes('retry-logs-panel')) {
    updatedPhase2 = updatedPhase2.replace(
      /<div class="help-text">\s*AI will analyze all cases/,
      logPanelHTML + '\n      <div class="help-text">\n        AI will analyze all cases'
    );
    console.log('✅ Added live log panel HTML to Phase2\n');
  }

  // Add CSS for log panel
  const logCSS = `
    .log-btn {
      background: #1a1a1a;
      color: #0f0;
      border: 1px solid #0f0;
      padding: 2px 8px;
      margin-left: 4px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 11px;
      transition: all 0.2s ease;
    }
    .log-btn:hover {
      background: #0f0;
      color: #000;
    }
    .log-btn.copy {
      color: #58a6ff;
      border-color: #58a6ff;
    }
    .log-btn.copy:hover {
      background: #58a6ff;
      color: #000;
    }
    .log-btn.danger {
      color: #f55;
      border-color: #f55;
    }
    .log-btn.danger:hover {
      background: #f55;
      color: #000;
    }
    .log-output {
      background: #000;
      color: #0f0;
      font-family: 'Courier New', monospace;
      font-size: 11px;
      padding: 8px;
      border-radius: 4px;
      max-height: 300px;
      overflow-y: auto;
      white-space: pre-wrap;
      word-wrap: break-word;
      border: 1px solid #0f0;
      line-height: 1.4;
    }`;

  if (!updatedPhase2.includes('.log-output')) {
    updatedPhase2 = updatedPhase2.replace(
      /<\/style>/,
      logCSS + '\n  </style>'
    );
    console.log('✅ Added log panel CSS\n');
  }

  // Add JavaScript functions
  const logJavaScript = `
    /**
     * Retry Log Functions
     */
    let lastRetryLogs = '';

    function refreshRetryLogs() {
      google.script.run
        .withSuccessHandler((logs) => {
          const output = document.getElementById('retryLogOutput');
          if (logs && logs.trim()) {
            output.textContent = logs;
            output.scrollTop = output.scrollHeight;
            lastRetryLogs = logs;
          } else {
            output.textContent = 'No logs yet. Click "Retry Failed Cases" to start.';
          }
        })
        .getSidebarLogs();
    }

    function clearRetryLogs() {
      google.script.run
        .withSuccessHandler((msg) => {
          document.getElementById('retryLogOutput').textContent = msg;
          lastRetryLogs = '';
        })
        .clearSidebarLogs();
    }

    function copyRetryLogs() {
      const logText = document.getElementById('retryLogOutput').textContent;
      if (!logText || logText.includes('No logs yet')) {
        alert('No logs to copy!');
        return;
      }

      navigator.clipboard.writeText(logText).then(() => {
        const btn = document.getElementById('copyRetryLogsBtn');
        const originalText = btn.textContent;
        btn.textContent = '✓ Copied!';
        btn.style.color = '#0f0';
        btn.style.borderColor = '#0f0';
        setTimeout(() => {
          btn.textContent = originalText;
          btn.style.color = '#58a6ff';
          btn.style.borderColor = '#58a6ff';
        }, 2000);
      }).catch(err => {
        alert('Failed to copy logs: ' + err);
      });
    }

    // Auto-refresh logs every 2 seconds when retry is running
    let retryLogInterval = null;

    function startRetryLogPolling() {
      document.getElementById('retry-logs-panel').style.display = 'block';
      if (!retryLogInterval) {
        retryLogInterval = setInterval(refreshRetryLogs, 2000);
      }
    }

    function stopRetryLogPolling() {
      if (retryLogInterval) {
        clearInterval(retryLogInterval);
        retryLogInterval = null;
      }
    }
`;

  // Update retryFailedCases function to show log panel and start polling
  updatedPhase2 = updatedPhase2.replace(
    /btn\.textContent = '🔄 Retrying Failed Cases\.\.\.';/,
    `btn.textContent = '🔄 Retrying Failed Cases...';

      // Show log panel and start polling
      startRetryLogPolling();`
  );

  updatedPhase2 = updatedPhase2.replace(
    /btn\.textContent = '🔄 Retry Failed Cases';/,
    `btn.textContent = '🔄 Retry Failed Cases';

      // Stop polling and do final refresh
      stopRetryLogPolling();
      setTimeout(refreshRetryLogs, 500);  // Final refresh after 500ms`
  );

  // Add the JavaScript functions before closing </script>
  if (!updatedPhase2.includes('function refreshRetryLogs')) {
    updatedPhase2 = updatedPhase2.replace(
      /<\/script>\s*<\/body>/,
      logJavaScript + '\n  </script>\n</body>'
    );
    console.log('✅ Added retry log JavaScript functions\n');
  }

  fs.writeFileSync('./apps-script-deployable/Phase2_Enhanced_Categories_With_AI.gs', updatedPhase2);
  console.log('✅ Updated Phase2_Enhanced_Categories_With_AI.gs with live log UI\n');

  // ===================================================================
  // PART 3: Deploy to Apps Script
  // ===================================================================

  console.log('🚀 Deploying to Apps Script...\n');

  // Update Code.gs with new backend
  const codeFile = project.data.files.find(f => f.name === 'Code');
  const phase2ProjectFile = project.data.files.find(f => f.name === 'Phase2_Enhanced_Categories_With_AI');

  if (!codeFile || !phase2ProjectFile) {
    console.log('❌ Required files not found in project');
    return;
  }

  // Find and replace retry function in Code.gs
  const retryMatch = updatedBackend.match(/(\/\*\*\s*\n\s*\* Helper function to add timestamped logs[\s\S]*?^function retryFailedCategorization[\s\S]*?^})/m);

  if (retryMatch) {
    // Remove old retry and addRetryLog functions if they exist
    codeFile.source = codeFile.source.replace(/(\/\*\*\s*\n\s*\* Helper function to add timestamped logs[\s\S]*?^})/m, '');
    codeFile.source = codeFile.source.replace(/(\/\*\*\s*\n\s*\* Retry AI categorization for ONLY the failed cases[\s\S]*?^function retryFailedCategorization[\s\S]*?^})/m, '');

    // Insert new versions
    const clearFunctionMatch = codeFile.source.match(/(function clearAICategorizationResults[\s\S]*?^})/m);
    if (clearFunctionMatch) {
      codeFile.source = codeFile.source.replace(
        clearFunctionMatch[0],
        clearFunctionMatch[0] + '\n\n' + retryMatch[0]
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
  console.log('  ✅ Added addRetryLog() helper function');
  console.log('  ✅ Logs written to Sidebar_Logs property (same as batch processing)');
  console.log('  ✅ Detailed logging for:');
  console.log('     - Failed case detection');
  console.log('     - Row clearing');
  console.log('     - Each batch processing (with sample results)');
  console.log('     - Empty result warnings');
  console.log('     - Write-back operations');
  console.log('     - Final statistics\n');
  console.log('Frontend (Phase2_Enhanced_Categories_With_AI.gs):');
  console.log('  ✅ Added live log panel below retry button');
  console.log('  ✅ Auto-refresh every 2 seconds while retry runs');
  console.log('  ✅ Copy Logs button (clipboard copy)');
  console.log('  ✅ Refresh button (manual refresh)');
  console.log('  ✅ Clear button (clear logs)\n');
  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log('💡 Next Steps:\n');
  console.log('  1. Open Google Sheet sidebar');
  console.log('  2. Click "✨ Open AI Categorization Tools"');
  console.log('  3. Click "🔄 Retry Failed Cases"');
  console.log('  4. Watch live log panel appear and update in real-time');
  console.log('  5. When complete, click "Copy Logs" button');
  console.log('  6. Paste logs back here for analysis\n');
  console.log('Expected to see:');
  console.log('  [HH:MM:SS] 🔄 Starting Retry for Failed Cases...');
  console.log('  [HH:MM:SS] 📊 Found 25 failed cases to retry');
  console.log('  [HH:MM:SS] 📦 Batch 1/3 (10 cases)');
  console.log('  [HH:MM:SS]    ✅ API responded with 10 results');
  console.log('  [HH:MM:SS]    Sample: CARD0005 → RESP / Pulmonary');
  console.log('  [HH:MM:SS]    ⚠️  WARNING: 10 results still empty! (if API failed)');
  console.log('  ...\n');
}

main().catch(console.error);
