/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ULTIMATE CATEGORIZATION TOOL
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Production-grade AI categorization system with comprehensive logging
 *
 * Features:
 * - Large modal dialog (1920x1080)
 * - Live logs panel (Matrix terminal style)
 * - Three modes: All Cases, Retry Failed, Specific Rows
 * - Comprehensive logging (API calls, prompts, responses, writes)
 * - Real-time progress tracking
 * - Copy logs functionality
 * - Integration with AI_Categorization_Results sheet
 *
 * Created: 2025-11-11
 * Version: 1.0.0
 * ═══════════════════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════════════════════
// MAIN ENTRY POINT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Open Ultimate Categorization Tool
 * Called from menu: Sim Builder > 🤖 Ultimate Categorization Tool
 */
function openUltimateCategorization() {
  const ui = getSafeUi_();
  if (!ui) {
    Logger.log('No UI context available');
    return;
  }

  try {
    const html = buildUltimateCategorizationUI();
    const htmlOutput = HtmlService.createHtmlOutput(html)
      .setWidth(1920)
      .setHeight(1080);

    ui.showModalDialog(htmlOutput, '🤖 Ultimate Categorization Tool');
  } catch (error) {
    ui.alert('Error', 'Failed to open tool: ' + error.message, ui.ButtonSet.OK);
    Logger.log('Error opening Ultimate Categorization Tool: ' + error);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// UI BUILDER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Build complete UI using string concatenation (Apps Script best practice)
 */
function buildUltimateCategorizationUI() {
  let html = '';

  html += '<!DOCTYPE html>';
  html += '<html>';
  html += '<head>';
  html += '  <base target="_top">';
  html += getUltimateCategorizationStyles();
  html += '</head>';
  html += '<body>';
  html += getUltimateCategorizationBody();
  html += '  <script>';
  html += getUltimateCategorizationJavaScript();
  html += '  </script>';
  html += '</body>';
  html += '</html>';

  return html;
}

/**
 * Get CSS styles
 */
function getUltimateCategorizationStyles() {
  return `
    <style>
      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }

      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        background: #1a1d2e;
        color: #e0e0e0;
        padding: 20px;
        overflow: hidden;
      }

      .container {
        display: grid;
        grid-template-columns: 320px 1fr;
        grid-template-rows: auto 1fr;
        gap: 20px;
        height: calc(100vh - 40px);
      }

      .controls-panel {
        grid-column: 1;
        grid-row: 1 / 3;
        background: #252936;
        border-radius: 12px;
        padding: 20px;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .logs-panel {
        grid-column: 2;
        grid-row: 1;
        background: #0a0c10;
        border: 2px solid #1a3a1a;
        border-radius: 12px;
        padding: 16px;
        display: flex;
        flex-direction: column;
        height: 400px;
      }

      .results-panel {
        grid-column: 2;
        grid-row: 2;
        background: #252936;
        border-radius: 12px;
        padding: 20px;
        overflow-y: auto;
      }

      .panel-title {
        font-size: 14px;
        font-weight: 600;
        color: #8b92a0;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 12px;
      }

      .logs-title {
        font-size: 14px;
        font-weight: 600;
        color: #0f0;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 8px;
      }

      .form-group {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      label {
        font-size: 13px;
        font-weight: 500;
        color: #a0a7b8;
      }

      select, input[type="text"] {
        width: 100%;
        padding: 10px 12px;
        background: #1a1d2e;
        border: 1px solid #3a3f51;
        border-radius: 6px;
        color: #e0e0e0;
        font-size: 14px;
        font-family: inherit;
      }

      select:focus, input[type="text"]:focus {
        outline: none;
        border-color: #4a9eff;
      }

      .btn {
        width: 100%;
        padding: 12px 16px;
        border: none;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        text-align: center;
      }

      .btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .btn-primary {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
      }

      .btn-primary:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
      }

      .btn-secondary {
        background: #2a3040;
        color: #e0e0e0;
        border: 1px solid #3a3f51;
      }

      .btn-secondary:hover:not(:disabled) {
        background: #323848;
      }

      .btn-success {
        background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
        color: white;
      }

      .btn-warning {
        background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        color: white;
      }

      .btn-danger {
        background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
        color: white;
      }

      #logsDisplay {
        flex: 1;
        background: #000000;
        color: #0f0;
        font-family: 'Courier New', monospace;
        font-size: 12px;
        line-height: 1.4;
        padding: 12px;
        border-radius: 6px;
        overflow-y: auto;
        white-space: pre-wrap;
        word-wrap: break-word;
        border: 1px solid #0f0;
      }

      #logsDisplay::-webkit-scrollbar {
        width: 8px;
      }

      #logsDisplay::-webkit-scrollbar-track {
        background: #000;
      }

      #logsDisplay::-webkit-scrollbar-thumb {
        background: #0f0;
        border-radius: 4px;
      }

      .logs-buttons {
        display: flex;
        gap: 8px;
        margin-top: 8px;
      }

      .logs-buttons .btn {
        flex: 1;
        padding: 8px;
        font-size: 12px;
      }

      .progress-container {
        background: #1a1d2e;
        border-radius: 8px;
        padding: 12px;
        border: 1px solid #3a3f51;
      }

      .progress-label {
        font-size: 12px;
        color: #8b92a0;
        margin-bottom: 6px;
      }

      .progress-bar {
        width: 100%;
        height: 24px;
        background: #0a0c10;
        border-radius: 12px;
        overflow: hidden;
        position: relative;
      }

      .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
        transition: width 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 11px;
        font-weight: 600;
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 12px;
        margin-top: 16px;
      }

      .stat-card {
        background: #1a1d2e;
        border-radius: 8px;
        padding: 16px;
        text-align: center;
        border: 1px solid #3a3f51;
      }

      .stat-value {
        font-size: 32px;
        font-weight: 700;
        margin-bottom: 4px;
      }

      .stat-label {
        font-size: 12px;
        color: #8b92a0;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .stat-success { color: #38ef7d; }
      .stat-warning { color: #f5576c; }
      .stat-error { color: #fa709a; }

      .hidden {
        display: none !important;
      }

      .toast {
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #2a3040;
        color: #0f0;
        padding: 12px 20px;
        border-radius: 8px;
        border: 1px solid #0f0;
        font-size: 14px;
        z-index: 10000;
        animation: slideIn 0.3s ease;
      }

      @keyframes slideIn {
        from {
          transform: translateX(400px);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }

      .sample-results {
        margin-top: 16px;
      }

      .result-item {
        background: #1a1d2e;
        border-radius: 6px;
        padding: 12px;
        margin-bottom: 8px;
        border-left: 3px solid #667eea;
        font-size: 13px;
      }

      .result-case-id {
        font-weight: 600;
        color: #667eea;
        margin-right: 8px;
      }

      .result-categories {
        color: #a0a7b8;
      }
    </style>
  `;
}

/**
 * Get HTML body content
 */
function getUltimateCategorizationBody() {
  let body = '';

  body += '<div class="container">';

  // CONTROLS PANEL (Left)
  body += '  <div class="controls-panel">';
  body += '    <div class="panel-title">⚙️ Controls</div>';
  body += '    ';
  body += '    <div class="form-group">';
  body += '      <label for="modeSelector">Mode</label>';
  body += '      <select id="modeSelector" onchange="handleModeChange()">';
  body += '        <option value="all">All Cases (207 total)</option>';
  body += '        <option value="retry">Retry Failed Cases</option>';
  body += '        <option value="specific">Specific Rows</option>';
  body += '      </select>';
  body += '    </div>';
  body += '    ';
  body += '    <div id="specificRowsContainer" class="form-group hidden">';
  body += '      <label for="specificRowsInput">Enter Rows or Case IDs</label>';
  body += '      <input type="text" id="specificRowsInput" placeholder="e.g., 7,13,17 or CARD0002,RESP0001" />';
  body += '      <small style="font-size:11px;color:#8b92a0;">Examples: 7-10 or CARD0002 or 7,13,17</small>';
  body += '    </div>';
  body += '    ';
  body += '    <button id="runBtn" class="btn btn-primary" onclick="runCategorization()">🚀 Run AI Categorization</button>';
  body += '    <button id="retryBtn" class="btn btn-warning" onclick="retryCategorization()">🔄 Retry Failed Cases</button>';
  body += '    <button id="applyBtn" class="btn btn-success" onclick="applyToMaster()">✅ Apply to Master</button>';
  body += '    <button id="exportBtn" class="btn btn-secondary" onclick="exportResults()">💾 Export Results</button>';
  body += '    <button id="clearBtn" class="btn btn-danger" onclick="clearResults()">🗑️ Clear Results</button>';
  body += '    ';
  body += '    <div class="progress-container">';
  body += '      <div class="progress-label">Progress</div>';
  body += '      <div class="progress-bar">';
  body += '        <div id="progressFill" class="progress-fill" style="width:0%;">0%</div>';
  body += '      </div>';
  body += '      <div id="progressText" style="font-size:11px;color:#8b92a0;margin-top:6px;text-align:center;">Ready</div>';
  body += '    </div>';
  body += '  </div>';

  // LIVE LOGS PANEL (Top Right)
  body += '  <div class="logs-panel">';
  body += '    <div class="logs-title">🖥️ Live Logs (Matrix Terminal)</div>';
  body += '    <div id="logsDisplay">Waiting for action...</div>';
  body += '    <div class="logs-buttons">';
  body += '      <button class="btn btn-secondary" onclick="copyLogs()">📋 Copy Logs</button>';
  body += '      <button class="btn btn-secondary" onclick="clearLogs()">🧹 Clear Logs</button>';
  body += '      <button class="btn btn-secondary" onclick="refreshLogs()">🔄 Refresh</button>';
  body += '    </div>';
  body += '  </div>';

  // RESULTS PANEL (Bottom Right)
  body += '  <div class="results-panel">';
  body += '    <div class="panel-title">📊 Results Summary</div>';
  body += '    ';
  body += '    <div class="stats-grid">';
  body += '      <div class="stat-card">';
  body += '        <div id="statSuccess" class="stat-value stat-success">0</div>';
  body += '        <div class="stat-label">Success</div>';
  body += '      </div>';
  body += '      <div class="stat-card">';
  body += '        <div id="statConflict" class="stat-value stat-warning">0</div>';
  body += '        <div class="stat-label">Conflicts</div>';
  body += '      </div>';
  body += '      <div class="stat-card">';
  body += '        <div id="statFailed" class="stat-value stat-error">0</div>';
  body += '        <div class="stat-label">Failed</div>';
  body += '      </div>';
  body += '    </div>';
  body += '    ';
  body += '    <div class="sample-results" id="sampleResults">';
  body += '      <div style="color:#8b92a0;font-size:13px;margin-bottom:8px;">Sample Results:</div>';
  body += '      <div style="color:#666;font-size:12px;text-align:center;padding:20px;">Run categorization to see results</div>';
  body += '    </div>';
  body += '  </div>';

  body += '</div>';

  return body;
}

/**
 * Get JavaScript code
 */
function getUltimateCategorizationJavaScript() {
  let js = '';

  // Mode change handler
  js += 'function handleModeChange() {\n';
  js += '  var mode = document.getElementById("modeSelector").value;\n';
  js += '  var container = document.getElementById("specificRowsContainer");\n';
  js += '  var btn = document.getElementById("runBtn");\n';
  js += '  \n';
  js += '  if (mode === "specific") {\n';
  js += '    container.classList.remove("hidden");\n';
  js += '    btn.textContent = "🚀 Run AI Categorization (Specific Rows)";\n';
  js += '  } else {\n';
  js += '    container.classList.add("hidden");\n';
  js += '    btn.textContent = "🚀 Run AI Categorization";\n';
  js += '  }\n';
  js += '}\n';
  js += '\n';

  // Refresh logs function
  js += 'function refreshLogs() {\n';
  js += '  google.script.run\n';
  js += '    .withSuccessHandler(function(logs) {\n';
  js += '      var logsEl = document.getElementById("logsDisplay");\n';
  js += '      logsEl.textContent = logs || "No logs yet...";\n';
  js += '      logsEl.scrollTop = logsEl.scrollHeight;\n';
  js += '    })\n';
  js += '    .withFailureHandler(function(error) {\n';
  js += '      console.error("Error fetching logs:", error);\n';
  js += '    })\n';
  js += '    .getUltimateCategorizationLogs();\n';
  js += '}\n';
  js += '\n';

  // Auto-refresh logs
  js += 'setInterval(refreshLogs, 2000);\n';
  js += 'refreshLogs();\n';
  js += '\n';

  // Copy logs
  js += 'function copyLogs() {\n';
  js += '  var logs = document.getElementById("logsDisplay").textContent;\n';
  js += '  navigator.clipboard.writeText(logs).then(function() {\n';
  js += '    showToast("✅ Logs copied to clipboard!");\n';
  js += '  }).catch(function(err) {\n';
  js += '    showToast("❌ Failed to copy logs");\n';
  js += '  });\n';
  js += '}\n';
  js += '\n';

  // Clear logs
  js += 'function clearLogs() {\n';
  js += '  if (confirm("Clear all logs?")) {\n';
  js += '    google.script.run\n';
  js += '      .withSuccessHandler(function() {\n';
  js += '        document.getElementById("logsDisplay").textContent = "Logs cleared.";\n';
  js += '        showToast("✅ Logs cleared");\n';
  js += '      })\n';
  js += '      .clearUltimateCategorizationLogs();\n';
  js += '  }\n';
  js += '}\n';
  js += '\n';

  // Toast notification
  js += 'function showToast(message) {\n';
  js += '  var toast = document.createElement("div");\n';
  js += '  toast.className = "toast";\n';
  js += '  toast.textContent = message;\n';
  js += '  document.body.appendChild(toast);\n';
  js += '  setTimeout(function() {\n';
  js += '    toast.remove();\n';
  js += '  }, 3000);\n';
  js += '}\n';
  js += '\n';

  // Run AI Categorization
  js += 'function runCategorization() {\n';
  js += '  var mode = document.getElementById("modeSelector").value;\n';
  js += '  var specificInput = document.getElementById("specificRowsInput").value;\n';
  js += '  \n';
  js += '  // Disable button during processing\n';
  js += '  var btn = document.getElementById("runBtn");\n';
  js += '  btn.disabled = true;\n';
  js += '  btn.textContent = "⏳ Processing...";\n';
  js += '  \n';
  js += '  google.script.run\n';
  js += '    .withSuccessHandler(function(result) {\n';
  js += '      btn.disabled = false;\n';
  js += '      btn.textContent = "🚀 Run AI Categorization";\n';
  js += '      if (result.success) {\n';
  js += '        showToast("✅ Categorization complete! Processed: " + result.total);\n';
  js += '        refreshLogs();\n';
  js += '      } else {\n';
  js += '        showToast("❌ Error: " + result.error);\n';
  js += '      }\n';
  js += '    })\n';
  js += '    .withFailureHandler(function(error) {\n';
  js += '      btn.disabled = false;\n';
  js += '      btn.textContent = "🚀 Run AI Categorization";\n';
  js += '      showToast("❌ Server error: " + error.message);\n';
  js += '    })\n';
  js += '    .runUltimateCategorization(mode, specificInput);\n';
  js += '}\n';
  js += '\n';
  // Placeholder function (Phase 2B)\n';
  js += 'function retryCategorization() {\n';
  js += '  showToast("🚧 Feature coming in Phase 2B...");\n';
  js += '}\n';
  js += '\n';
  js += '// Phase 2D: Apply to Master\n';
  js += 'function applyToMaster() {\n';
  js += '  if (!confirm("Apply Final_Symptom and Final_System to Master sheet?\\n\\nThis will update Master Scenario Convert with categorization results.")) {\n';
  js += '    return;\n';
  js += '  }\n';
  js += '  \n';
  js += '  var btn = document.getElementById("applyBtn");\n';
  js += '  btn.disabled = true;\n';
  js += '  btn.textContent = "⏳ Applying...";\n';
  js += '  \n';
  js += '  google.script.run\n';
  js += '    .withSuccessHandler(function(result) {\n';
  js += '      btn.disabled = false;\n';
  js += '      btn.textContent = "✅ Apply to Master";\n';
  js += '      if (result.success) {\n';
  js += '        showToast("✅ Applied " + result.updated + " cases to Master sheet!");\n';
  js += '        refreshLogs();\n';
  js += '      } else {\n';
  js += '        showToast("❌ Error: " + result.error);\n';
  js += '      }\n';
  js += '    })\n';
  js += '    .withFailureHandler(function(error) {\n';
  js += '      btn.disabled = false;\n';
  js += '      btn.textContent = "✅ Apply to Master";\n';
  js += '      showToast("❌ Server error: " + error.message);\n';
  js += '    })\n';
  js += '    .applyUltimateCategorizationToMaster();\n';
  js += '}\n';
  js += '\n';
  js += '// Phase 2D: Export Results\n';
  js += 'function exportResults() {\n';
  js += '  var btn = document.getElementById("exportBtn");\n';
  js += '  btn.disabled = true;\n';
  js += '  btn.textContent = "⏳ Exporting...";\n';
  js += '  \n';
  js += '  google.script.run\n';
  js += '    .withSuccessHandler(function(result) {\n';
  js += '      btn.disabled = false;\n';
  js += '      btn.textContent = "💾 Export Results";\n';
  js += '      if (result.success) {\n';
  js += '        // Create download link\n';
  js += '        var blob = new Blob([result.csv], {type: "text/csv;charset=utf-8;"});\n';
  js += '        var link = document.createElement("a");\n';
  js += '        var url = URL.createObjectURL(blob);\n';
  js += '        link.setAttribute("href", url);\n';
  js += '        link.setAttribute("download", "AI_Categorization_Results_" + new Date().toISOString().split("T")[0] + ".csv");\n';
  js += '        link.style.visibility = "hidden";\n';
  js += '        document.body.appendChild(link);\n';
  js += '        link.click();\n';
  js += '        document.body.removeChild(link);\n';
  js += '        showToast("✅ Exported " + result.rows + " rows!");\n';
  js += '        refreshLogs();\n';
  js += '      } else {\n';
  js += '        showToast("❌ Error: " + result.error);\n';
  js += '      }\n';
  js += '    })\n';
  js += '    .withFailureHandler(function(error) {\n';
  js += '      btn.disabled = false;\n';
  js += '      btn.textContent = "💾 Export Results";\n';
  js += '      showToast("❌ Server error: " + error.message);\n';
  js += '    })\n';
  js += '    .exportUltimateCategorizationResults();\n';
  js += '}\n';
  js += '\n';
  js += '// Phase 2D: Clear Results\n';
  js += 'function clearResults() {\n';
  js += '  if (!confirm("⚠️ CLEAR ALL RESULTS?\\n\\nThis will DELETE all rows in AI_Categorization_Results sheet.\\n\\nHeaders will be preserved.\\nLogs will be cleared.\\n\\nThis action CANNOT be undone!")) {\n';
  js += '    return;\n';
  js += '  }\n';
  js += '  \n';
  js += '  var btn = document.getElementById("clearBtn");\n';
  js += '  btn.disabled = true;\n';
  js += '  btn.textContent = "⏳ Clearing...";\n';
  js += '  \n';
  js += '  google.script.run\n';
  js += '    .withSuccessHandler(function(result) {\n';
  js += '      btn.disabled = false;\n';
  js += '      btn.textContent = "🗑️ Clear Results";\n';
  js += '      if (result.success) {\n';
  js += '        showToast("✅ Cleared " + result.deleted + " rows!");\n';
  js += '        refreshLogs();\n';
  js += '      } else {\n';
  js += '        showToast("❌ Error: " + result.error);\n';
  js += '      }\n';
  js += '    })\n';
  js += '    .withFailureHandler(function(error) {\n';
  js += '      btn.disabled = false;\n';
  js += '      btn.textContent = "🗑️ Clear Results";\n';
  js += '      showToast("❌ Server error: " + error.message);\n';
  js += '    })\n';
  js += '    .clearUltimateCategorizationResults();\n';
  js += '}\n';

  return js;
}

// ═══════════════════════════════════════════════════════════════════════════
// LOGGING FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Add log entry with timestamp
 */
function addUltimateCategorizationLog(message) {
  try {
    const props = PropertiesService.getDocumentProperties();
    const timestamp = Utilities.formatDate(
      new Date(),
      Session.getScriptTimeZone(),
      'HH:mm:ss'
    );
    const logEntry = '[' + timestamp + '] ' + message;

    const existingLogs = props.getProperty('Ultimate_Categorization_Logs') || '';
    props.setProperty('Ultimate_Categorization_Logs', existingLogs + logEntry + '\n');

    Logger.log(logEntry);
  } catch (error) {
    Logger.log('Error adding log: ' + error.message);
  }
}

/**
 * Get all logs
 */
function getUltimateCategorizationLogs() {
  try {
    return PropertiesService.getDocumentProperties()
      .getProperty('Ultimate_Categorization_Logs') || '';
  } catch (error) {
    return 'Error retrieving logs: ' + error.message;
  }
}

/**
 * Clear all logs
 */
function clearUltimateCategorizationLogs() {
  try {
    PropertiesService.getDocumentProperties()
      .deleteProperty('Ultimate_Categorization_Logs');
    addUltimateCategorizationLog('Logs cleared');
    return true;
  } catch (error) {
    Logger.log('Error clearing logs: ' + error.message);
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 2A: CORE CATEGORIZATION ENGINE (All Cases Mode)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Main categorization entry point
 * Called from client-side runCategorization()
 */
function runUltimateCategorization(mode, specificInput) {
  addUltimateCategorizationLog('═══════════════════════════════════════════════════════════');
  addUltimateCategorizationLog('🚀 ULTIMATE CATEGORIZATION STARTING');
  addUltimateCategorizationLog('═══════════════════════════════════════════════════════════');
  addUltimateCategorizationLog('');
  addUltimateCategorizationLog('📋 Configuration:');
  addUltimateCategorizationLog('   Mode: ' + mode);
  addUltimateCategorizationLog('   Timestamp: ' + new Date().toISOString());
  addUltimateCategorizationLog('');

  try {
    // Phase 2A: Only "all" mode implemented
    if (mode !== 'all') {
      addUltimateCategorizationLog('⚠️  Mode "' + mode + '" not yet implemented in Phase 2A');
      addUltimateCategorizationLog('   Available: all');
      addUltimateCategorizationLog('   Coming soon: retry, specific');
      return { success: false, error: 'Mode not yet implemented' };
    }

    // Get all cases
    addUltimateCategorizationLog('📊 Loading Master Scenario Convert sheet...');
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const masterSheet = ss.getSheetByName('Master Scenario Convert');

    if (!masterSheet) {
      addUltimateCategorizationLog('❌ ERROR: Master Scenario Convert sheet not found!');
      return { success: false, error: 'Master sheet not found' };
    }

    addUltimateCategorizationLog('   ✅ Sheet found: Master Scenario Convert');

    // Get data
    const lastRow = masterSheet.getLastRow();
    addUltimateCategorizationLog('   ✅ Last row: ' + lastRow);
    addUltimateCategorizationLog('   ✅ Loading headers from Row 2...');

    const headers = masterSheet.getRange(2, 1, 1, masterSheet.getLastColumn()).getValues()[0];
    addUltimateCategorizationLog('   ✅ Headers loaded: ' + headers.length + ' columns');

    addUltimateCategorizationLog('   ✅ Loading data rows (3-' + lastRow + ')...');
    const dataRows = lastRow - 2;
    const data = masterSheet.getRange(3, 1, dataRows, masterSheet.getLastColumn()).getValues();
    addUltimateCategorizationLog('   ✅ Data loaded: ' + data.length + ' rows');
    addUltimateCategorizationLog('');

    // Extract cases
    addUltimateCategorizationLog('🔍 Extracting case data...');
    const cases = extractCasesForCategorization(data, headers);
    addUltimateCategorizationLog('   ✅ Extracted ' + cases.length + ' cases');
    addUltimateCategorizationLog('');

    // Get accronym mapping
    addUltimateCategorizationLog('🔧 Loading accronym mapping...');
    const mapping = getAccronymMapping();
    addUltimateCategorizationLog('   ✅ Loaded ' + Object.keys(mapping).length + ' symptom categories');
    addUltimateCategorizationLog('');

    // Process in batches
    addUltimateCategorizationLog('📦 Processing cases in batches of 25...');
    const batchSize = 25;
    const totalBatches = Math.ceil(cases.length / batchSize);
    addUltimateCategorizationLog('   Total batches: ' + totalBatches);
    addUltimateCategorizationLog('');

    let allResults = [];

    for (let i = 0; i < cases.length; i += batchSize) {
      const batch = cases.slice(i, Math.min(i + batchSize, cases.length));
      const batchNum = Math.floor(i / batchSize) + 1;

      addUltimateCategorizationLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      addUltimateCategorizationLog('📦 BATCH ' + batchNum + '/' + totalBatches + ' (' + batch.length + ' cases)');
      addUltimateCategorizationLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      addUltimateCategorizationLog('');

      // Process this batch
      const batchResults = processBatchWithOpenAI(batch, mapping);
      allResults = allResults.concat(batchResults);

      addUltimateCategorizationLog('');
      addUltimateCategorizationLog('✅ Batch ' + batchNum + ' complete');
      addUltimateCategorizationLog('   Progress: ' + allResults.length + '/' + cases.length + ' (' + Math.round(allResults.length / cases.length * 100) + '%)');
      addUltimateCategorizationLog('');

      // Small delay between batches
      if (i + batchSize < cases.length) {
        addUltimateCategorizationLog('⏸️  Pausing 1 second before next batch...');
        Utilities.sleep(1000);
        addUltimateCategorizationLog('');
      }
    }

    addUltimateCategorizationLog('═══════════════════════════════════════════════════════════');
    addUltimateCategorizationLog('🎉 CATEGORIZATION COMPLETE!');
    addUltimateCategorizationLog('═══════════════════════════════════════════════════════════');
    addUltimateCategorizationLog('   Total processed: ' + allResults.length);
    addUltimateCategorizationLog('   Results written to: AI_Categorization_Results sheet');
    addUltimateCategorizationLog('');

    return { success: true, total: allResults.length };

  } catch (error) {
    addUltimateCategorizationLog('');
    addUltimateCategorizationLog('❌ FATAL ERROR: ' + error.message);
    addUltimateCategorizationLog('   Stack trace: ' + error.stack);
    return { success: false, error: error.message };
  }
}

/**
 * Extract case data from Master sheet
 */
function extractCasesForCategorization(data, headers) {
  addUltimateCategorizationLog('   Mapping column indices...');

  // Find column indices
  const caseIDIdx = headers.indexOf('Case_Organization_Case_ID');
  const legacyIDIdx = headers.indexOf('Legacy_Case_ID');
  const symptomIdx = headers.indexOf('Case_Organization_Category_Symptom');
  const systemIdx = headers.indexOf('Case_Organization_Category_System');

  addUltimateCategorizationLog('      Case_ID column: ' + (caseIDIdx >= 0 ? 'Column ' + String.fromCharCode(65 + caseIDIdx) : 'NOT FOUND'));
  addUltimateCategorizationLog('      Legacy_Case_ID column: ' + (legacyIDIdx >= 0 ? 'Column ' + String.fromCharCode(65 + legacyIDIdx) : 'NOT FOUND'));
  addUltimateCategorizationLog('      Current Symptom column: ' + (symptomIdx >= 0 ? 'Column ' + String.fromCharCode(65 + symptomIdx) : 'NOT FOUND'));
  addUltimateCategorizationLog('      Current System column: ' + (systemIdx >= 0 ? 'Column ' + String.fromCharCode(65 + systemIdx) : 'NOT FOUND'));

  // Find presentation columns (approximate)
  const chiefComplaintIdx = 4; // Column E
  const presentationIdx = 5; // Column F
  const diagnosisIdx = 6; // Column G

  const cases = [];

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const caseID = row[caseIDIdx] || '';

    if (caseID) {
      cases.push({
        rowIndex: i + 3, // Actual row in sheet
        caseID: caseID,
        legacyCaseID: row[legacyIDIdx] || '',
        currentSymptom: row[symptomIdx] || '',
        currentSystem: row[systemIdx] || '',
        chiefComplaint: row[chiefComplaintIdx] || '',
        presentation: row[presentationIdx] || '',
        diagnosis: row[diagnosisIdx] || ''
      });

      if (i < 3) {
        addUltimateCategorizationLog('      Sample case ' + (i + 1) + ': ' + caseID);
      }
    }
  }

  addUltimateCategorizationLog('   ✅ Extracted ' + cases.length + ' valid cases');
  return cases;
}

/**
 * Process batch with OpenAI (with INSANE logging)
 */
function processBatchWithOpenAI(cases, mapping) {
  addUltimateCategorizationLog('   📋 Case IDs in this batch:');
  const caseIDs = cases.map(c => c.caseID).join(', ');
  addUltimateCategorizationLog('      ' + caseIDs);
  addUltimateCategorizationLog('');

  // Build prompt
  addUltimateCategorizationLog('   📤 Building OpenAI prompt...');
  const validSymptoms = Object.keys(mapping).join(', ');
  const validSystems = ['Cardiovascular', 'Respiratory', 'Gastrointestinal', 'Neurological', 'Endocrine', 'Infectious', 'Toxicology', 'Trauma', 'Pediatric', 'Gynecological', 'Psychiatric', 'Environmental'];

  addUltimateCategorizationLog('      Valid symptoms: ' + validSymptoms);
  addUltimateCategorizationLog('      Valid systems: ' + validSystems.join(', '));
  addUltimateCategorizationLog('');

  const prompt = buildCategorizationPrompt(cases, validSymptoms, validSystems.join(', '));
  addUltimateCategorizationLog('      ✅ Prompt built: ' + prompt.length + ' characters');
  addUltimateCategorizationLog('      First 200 chars: ' + prompt.substring(0, 200) + '...');
  addUltimateCategorizationLog('');

  // Get API key
  addUltimateCategorizationLog('   🔑 Loading OpenAI API key...');
  const apiKey = getOpenAIAPIKey();
  if (!apiKey) {
    addUltimateCategorizationLog('      ❌ ERROR: API key not found in Settings!B2');
    return [];
  }
  addUltimateCategorizationLog('      ✅ API key loaded (starts with: ' + apiKey.substring(0, 10) + '...)');
  addUltimateCategorizationLog('');

  // Call OpenAI
  addUltimateCategorizationLog('   🌐 Calling OpenAI API...');
  addUltimateCategorizationLog('      Endpoint: https://api.openai.com/v1/chat/completions');
  addUltimateCategorizationLog('      Model: gpt-4');
  addUltimateCategorizationLog('      Temperature: 0.3');
  addUltimateCategorizationLog('      Max tokens: 4000');

  const startTime = new Date().getTime();
  addUltimateCategorizationLog('      Request sent at: ' + new Date(startTime).toLocaleTimeString());

  try {
    const response = UrlFetchApp.fetch('https://api.openai.com/v1/chat/completions', {
      method: 'post',
      headers: {
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify({
        model: 'gpt-4',
        temperature: 0.3,
        max_tokens: 4000,
        messages: [{
          role: 'user',
          content: prompt
        }]
      }),
      muteHttpExceptions: true
    });

    const endTime = new Date().getTime();
    const elapsed = ((endTime - startTime) / 1000).toFixed(2);

    addUltimateCategorizationLog('      Response received at: ' + new Date(endTime).toLocaleTimeString());
    addUltimateCategorizationLog('      ⏱️  Response time: ' + elapsed + ' seconds');
    addUltimateCategorizationLog('');

    const responseCode = response.getResponseCode();
    addUltimateCategorizationLog('   📥 API Response:');
    addUltimateCategorizationLog('      Status code: ' + responseCode);

    if (responseCode !== 200) {
      addUltimateCategorizationLog('      ❌ ERROR: Non-200 status code');
      addUltimateCategorizationLog('      Response: ' + response.getContentText().substring(0, 500));
      return [];
    }

    const result = JSON.parse(response.getContentText());
    addUltimateCategorizationLog('      ✅ JSON parsed successfully');

    if (result.usage) {
      addUltimateCategorizationLog('      Token usage:');
      addUltimateCategorizationLog('         Prompt tokens: ' + result.usage.prompt_tokens);
      addUltimateCategorizationLog('         Completion tokens: ' + result.usage.completion_tokens);
      addUltimateCategorizationLog('         Total tokens: ' + result.usage.total_tokens);
      const cost = (result.usage.total_tokens * 0.00003).toFixed(4);
      addUltimateCategorizationLog('         Estimated cost: $' + cost);
    }

    addUltimateCategorizationLog('');

    // Parse results
    addUltimateCategorizationLog('   🔍 Parsing AI categorizations...');
    const content = result.choices[0].message.content;
    addUltimateCategorizationLog('      Response length: ' + content.length + ' characters');

    // Try to extract JSON
    let categorizations = [];
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        categorizations = JSON.parse(jsonMatch[0]);
        addUltimateCategorizationLog('      ✅ Found ' + categorizations.length + ' categorizations');
      }
    } catch (e) {
      addUltimateCategorizationLog('      ❌ JSON parse error: ' + e.message);
    }

    addUltimateCategorizationLog('');

    // Write results
    addUltimateCategorizationLog('   ✍️  Writing results to AI_Categorization_Results sheet...');
    writeCategorizationResults(cases, categorizations);

    return categorizations;

  } catch (error) {
    addUltimateCategorizationLog('      ❌ API call failed: ' + error.message);
    addUltimateCategorizationLog('      Stack: ' + error.stack);
    return [];
  }
}

/**
 * Build categorization prompt
 */
function buildCategorizationPrompt(cases, validSymptoms, validSystems) {
  let prompt = 'You are a medical education expert specializing in emergency medicine case categorization.\n\n';
  prompt += 'Analyze these ' + cases.length + ' cases and assign EXACTLY ONE symptom category and EXACTLY ONE system category to each.\n\n';
  prompt += 'Valid symptom categories: ' + validSymptoms + '\n';
  prompt += 'Valid system categories: ' + validSystems + '\n\n';
  prompt += 'IMPORTANT: Only use ACLS for actual cardiac arrest protocols.\n\n';
  prompt += 'Cases:\n\n';

  cases.forEach(function(c, idx) {
    prompt += (idx + 1) + '. Case ID: ' + c.caseID + '\n';
    prompt += '   Chief Complaint: ' + c.chiefComplaint + '\n';
    prompt += '   Presentation: ' + c.presentation + '\n';
    prompt += '   Diagnosis: ' + c.diagnosis + '\n\n';
  });

  prompt += 'Return a JSON array with this format:\n';
  prompt += '[{"caseID": "CARD0001", "symptom": "CP", "symptomName": "Chest Pain", "system": "Cardiovascular", "reasoning": "brief explanation"}]\n';

  return prompt;
}

/**
 * Write categorization results to sheet
 */
function writeCategorizationResults(cases, categorizations) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let resultsSheet = ss.getSheetByName('AI_Categorization_Results');

  // Create sheet if doesn't exist
  if (!resultsSheet) {
    addUltimateCategorizationLog('      ⚠️  Sheet does not exist, creating...');
    resultsSheet = ss.insertSheet('AI_Categorization_Results');

    // Add headers
    resultsSheet.getRange(1, 1, 2, 14).setValues([
      ['Case_ID', 'Legacy_Case_ID', 'Current_Symptom', 'Current_System', 'Current_Symptom_Name', 'Suggested_Symptom', 'Suggested_Symptom_Name', 'Suggested_System', 'Reasoning', 'Confidence', 'Status', '', 'Final_Symptom', 'Final_System'],
      ['(from Master)', '(from Master)', '(existing)', '(existing)', '(existing)', '(AI)', '(AI)', '(AI)', '(AI)', '(AI)', '(match/new/conflict)', '', '(to apply)', '(to apply)']
    ]);
    addUltimateCategorizationLog('      ✅ Sheet created with headers');
  } else {
    addUltimateCategorizationLog('      ✅ Sheet exists: AI_Categorization_Results');
  }

  addUltimateCategorizationLog('');

  // Check for existing data
  addUltimateCategorizationLog('   🔍 Checking for existing results...');
  const existingLastRow = resultsSheet.getLastRow();
  let existingData = [];
  let existingCaseIDs = new Set();

  if (existingLastRow > 2) {
    addUltimateCategorizationLog('      Found existing data in rows 3-' + existingLastRow);
    existingData = resultsSheet.getRange(3, 1, existingLastRow - 2, 14).getValues();
    existingData.forEach(function(row) {
      if (row[0]) existingCaseIDs.add(row[0]); // Case_ID in column A
    });
    addUltimateCategorizationLog('      Existing Case IDs: ' + existingCaseIDs.size + ' cases already processed');
    addUltimateCategorizationLog('');
  } else {
    addUltimateCategorizationLog('      No existing data found (starting fresh)');
    addUltimateCategorizationLog('');
  }

  // Write each result
  let nextRow = resultsSheet.getLastRow() + 1;
  let skippedCount = 0;
  let writtenCount = 0;
  let updatedCount = 0;

  cases.forEach(function(caseData, idx) {
    const cat = categorizations[idx] || {};
    const suggestedSymptom = cat.symptom || '';
    const suggestedSymptomName = cat.symptomName || '';
    const suggestedSystem = cat.system || '';
    const reasoning = cat.reasoning || '';

    // Check if this case already exists
    if (existingCaseIDs.has(caseData.caseID)) {
      addUltimateCategorizationLog('      ⏭️  SKIP: Row for ' + caseData.caseID + ' already exists (not overwriting)');
      skippedCount++;
      return; // Skip this case
    }

    // Determine status
    let status = 'new';
    if (caseData.currentSymptom && caseData.currentSymptom === suggestedSymptom) {
      status = 'match';
    } else if (caseData.currentSymptom && caseData.currentSymptom !== suggestedSymptom) {
      status = 'conflict';
    }

    const rowData = [
      caseData.caseID,
      caseData.legacyCaseID,
      caseData.currentSymptom,
      caseData.currentSystem,
      '', // Current symptom name (lookup later if needed)
      suggestedSymptom,
      suggestedSymptomName,
      suggestedSystem,
      reasoning,
      'medium', // confidence
      status,
      '',
      suggestedSymptom, // Final
      suggestedSystem // Final
    ];

    resultsSheet.getRange(nextRow, 1, 1, 14).setValues([rowData]);

    if (idx < 3 || (writtenCount < 3 && !existingCaseIDs.has(caseData.caseID))) {
      addUltimateCategorizationLog('      Row ' + nextRow + ' (' + caseData.caseID + '):');
      addUltimateCategorizationLog('         Symptom: ' + suggestedSymptom + ' (' + suggestedSymptomName + ')');
      addUltimateCategorizationLog('         System: ' + suggestedSystem);
      addUltimateCategorizationLog('         Status: ' + status);
      addUltimateCategorizationLog('         ✅ Written to row ' + nextRow);
    }

    writtenCount++;
    nextRow++;
  });

  addUltimateCategorizationLog('');
  addUltimateCategorizationLog('   📊 Write Summary:');
  addUltimateCategorizationLog('      ✅ New rows written: ' + writtenCount);
  addUltimateCategorizationLog('      ⏭️  Skipped (already exist): ' + skippedCount);
  addUltimateCategorizationLog('      📍 Last row number: ' + (nextRow - 1));
  addUltimateCategorizationLog('      📋 Total rows in sheet now: ' + resultsSheet.getLastRow());
}

/**
 * Get OpenAI API key from Settings sheet
 */
function getOpenAIAPIKey() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const settingsSheet = ss.getSheetByName('Settings');
    if (!settingsSheet) return null;

    const apiKey = settingsSheet.getRange('B2').getValue();
    return apiKey || null;
  } catch (error) {
    return null;
  }
}

/**
 * Get accronym mapping
 */
function getAccronymMapping() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const mappingSheet = ss.getSheetByName('accronym_symptom_system_mapping');

  if (!mappingSheet) {
    return {};
  }

  const data = mappingSheet.getDataRange().getValues();
  const mapping = {};

  for (let i = 1; i < data.length; i++) {
    const accronym = data[i][0];
    const fullName = data[i][1];
    if (accronym) {
      mapping[accronym] = fullName;
    }
  }

  return mapping;
}

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 2D: APPLY TO MASTER, EXPORT RESULTS, CLEAR RESULTS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Apply Final_Symptom and Final_System from AI_Categorization_Results to Master sheet
 */
function applyUltimateCategorizationToMaster() {
  addUltimateCategorizationLog('═══════════════════════════════════════════════════════════');
  addUltimateCategorizationLog('✅ APPLY TO MASTER - STARTING');
  addUltimateCategorizationLog('═══════════════════════════════════════════════════════════');
  addUltimateCategorizationLog('');
  addUltimateCategorizationLog('📋 Configuration:');
  addUltimateCategorizationLog('   Operation: Apply Final columns to Master sheet');
  addUltimateCategorizationLog('   Timestamp: ' + new Date().toISOString());
  addUltimateCategorizationLog('');

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // Get AI_Categorization_Results sheet
    addUltimateCategorizationLog('📊 Loading AI_Categorization_Results sheet...');
    const resultsSheet = ss.getSheetByName('AI_Categorization_Results');

    if (!resultsSheet) {
      addUltimateCategorizationLog('❌ ERROR: AI_Categorization_Results sheet not found!');
      addUltimateCategorizationLog('   Run categorization first to generate results.');
      return { success: false, error: 'Results sheet not found' };
    }

    addUltimateCategorizationLog('   ✅ Sheet found: AI_Categorization_Results');

    // Get results data
    const resultsLastRow = resultsSheet.getLastRow();
    if (resultsLastRow <= 2) {
      addUltimateCategorizationLog('⚠️  No results to apply (sheet is empty)');
      return { success: false, error: 'No results to apply' };
    }

    addUltimateCategorizationLog('   ✅ Loading results (rows 3-' + resultsLastRow + ')...');
    const resultsData = resultsSheet.getRange(3, 1, resultsLastRow - 2, 14).getValues();
    addUltimateCategorizationLog('   ✅ Loaded ' + resultsData.length + ' result rows');
    addUltimateCategorizationLog('');

    // Get Master Scenario Convert sheet
    addUltimateCategorizationLog('📊 Loading Master Scenario Convert sheet...');
    const masterSheet = ss.getSheetByName('Master Scenario Convert');

    if (!masterSheet) {
      addUltimateCategorizationLog('❌ ERROR: Master Scenario Convert sheet not found!');
      return { success: false, error: 'Master sheet not found' };
    }

    addUltimateCategorizationLog('   ✅ Sheet found: Master Scenario Convert');

    // Get Master headers
    const masterHeaders = masterSheet.getRange(2, 1, 1, masterSheet.getLastColumn()).getValues()[0];
    addUltimateCategorizationLog('   ✅ Headers loaded: ' + masterHeaders.length + ' columns');

    // Find column indices
    addUltimateCategorizationLog('');
    addUltimateCategorizationLog('🔍 Mapping column indices...');
    const caseIDIdx = masterHeaders.indexOf('Case_Organization_Case_ID');
    const symptomIdx = masterHeaders.indexOf('Case_Organization_Category_Symptom');
    const systemIdx = masterHeaders.indexOf('Case_Organization_Category_System');

    addUltimateCategorizationLog('   Case_ID column: ' + (caseIDIdx >= 0 ? 'Column ' + String.fromCharCode(65 + caseIDIdx) : 'NOT FOUND'));
    addUltimateCategorizationLog('   Symptom column: ' + (symptomIdx >= 0 ? 'Column ' + String.fromCharCode(65 + symptomIdx) : 'NOT FOUND'));
    addUltimateCategorizationLog('   System column: ' + (systemIdx >= 0 ? 'Column ' + String.fromCharCode(65 + systemIdx) : 'NOT FOUND'));

    if (caseIDIdx < 0 || symptomIdx < 0 || systemIdx < 0) {
      addUltimateCategorizationLog('❌ ERROR: Required columns not found in Master sheet');
      return { success: false, error: 'Missing columns in Master sheet' };
    }

    addUltimateCategorizationLog('   ✅ All required columns found');
    addUltimateCategorizationLog('');

    // Get Master data
    addUltimateCategorizationLog('📊 Loading Master data...');
    const masterLastRow = masterSheet.getLastRow();
    const masterData = masterSheet.getRange(3, 1, masterLastRow - 2, masterSheet.getLastColumn()).getValues();
    addUltimateCategorizationLog('   ✅ Loaded ' + masterData.length + ' Master rows');
    addUltimateCategorizationLog('');

    // Build lookup map: Case_ID → row index
    addUltimateCategorizationLog('🗺️  Building Case_ID lookup map...');
    const caseIDtoRowIndex = {};
    masterData.forEach(function(row, idx) {
      const caseID = row[caseIDIdx];
      if (caseID) {
        caseIDtoRowIndex[caseID] = idx + 3; // +3 for headers (rows 1-2) + 0-indexed array
      }
    });
    addUltimateCategorizationLog('   ✅ Mapped ' + Object.keys(caseIDtoRowIndex).length + ' Case IDs');
    addUltimateCategorizationLog('');

    // Apply each result
    addUltimateCategorizationLog('✍️  Applying results to Master sheet...');
    addUltimateCategorizationLog('');
    let updatedCount = 0;
    let skippedCount = 0;
    let sampleCount = 0;

    resultsData.forEach(function(resultRow) {
      const caseID = resultRow[0]; // Case_ID
      const finalSymptom = resultRow[12]; // Final_Symptom (column M)
      const finalSystem = resultRow[13]; // Final_System (column N)

      if (!caseID) {
        return; // Skip empty rows
      }

      const masterRowNum = caseIDtoRowIndex[caseID];

      if (!masterRowNum) {
        addUltimateCategorizationLog('   ⏭️  SKIP: Case ID "' + caseID + '" not found in Master sheet');
        skippedCount++;
        return;
      }

      // Update Master sheet
      if (finalSymptom) {
        masterSheet.getRange(masterRowNum, symptomIdx + 1).setValue(finalSymptom);
      }
      if (finalSystem) {
        masterSheet.getRange(masterRowNum, systemIdx + 1).setValue(finalSystem);
      }

      // Log first 3 updates
      if (sampleCount < 3) {
        addUltimateCategorizationLog('   ✅ Updated row ' + masterRowNum + ' (' + caseID + '):');
        addUltimateCategorizationLog('      Symptom: ' + finalSymptom);
        addUltimateCategorizationLog('      System: ' + finalSystem);
        sampleCount++;
      }

      updatedCount++;
    });

    addUltimateCategorizationLog('');
    addUltimateCategorizationLog('   📊 Apply Summary:');
    addUltimateCategorizationLog('      ✅ Cases updated: ' + updatedCount);
    addUltimateCategorizationLog('      ⏭️  Skipped (not found): ' + skippedCount);
    addUltimateCategorizationLog('');

    addUltimateCategorizationLog('═══════════════════════════════════════════════════════════');
    addUltimateCategorizationLog('🎉 APPLY TO MASTER COMPLETE!');
    addUltimateCategorizationLog('═══════════════════════════════════════════════════════════');
    addUltimateCategorizationLog('');

    return { success: true, updated: updatedCount };

  } catch (error) {
    addUltimateCategorizationLog('');
    addUltimateCategorizationLog('❌ FATAL ERROR: ' + error.message);
    addUltimateCategorizationLog('   Stack trace: ' + error.stack);
    return { success: false, error: error.message };
  }
}

/**
 * Export AI_Categorization_Results as CSV
 */
function exportUltimateCategorizationResults() {
  addUltimateCategorizationLog('═══════════════════════════════════════════════════════════');
  addUltimateCategorizationLog('💾 EXPORT RESULTS - STARTING');
  addUltimateCategorizationLog('═══════════════════════════════════════════════════════════');
  addUltimateCategorizationLog('');

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // Get AI_Categorization_Results sheet
    addUltimateCategorizationLog('📊 Loading AI_Categorization_Results sheet...');
    const resultsSheet = ss.getSheetByName('AI_Categorization_Results');

    if (!resultsSheet) {
      addUltimateCategorizationLog('❌ ERROR: AI_Categorization_Results sheet not found!');
      return { success: false, error: 'Results sheet not found' };
    }

    addUltimateCategorizationLog('   ✅ Sheet found: AI_Categorization_Results');

    // Get all data including headers
    const lastRow = resultsSheet.getLastRow();
    const lastCol = resultsSheet.getLastColumn();

    if (lastRow <= 2) {
      addUltimateCategorizationLog('⚠️  No data to export (sheet is empty)');
      return { success: false, error: 'No data to export' };
    }

    addUltimateCategorizationLog('   ✅ Loading data (rows 1-' + lastRow + ', columns 1-' + lastCol + ')...');
    const allData = resultsSheet.getRange(1, 1, lastRow, lastCol).getValues();
    addUltimateCategorizationLog('   ✅ Loaded ' + allData.length + ' total rows (including headers)');
    addUltimateCategorizationLog('');

    // Convert to CSV
    addUltimateCategorizationLog('📝 Converting to CSV format...');
    let csv = '';

    allData.forEach(function(row) {
      const csvRow = row.map(function(cell) {
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        const cellStr = String(cell || '');
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
          return '"' + cellStr.replace(/"/g, '""') + '"';
        }
        return cellStr;
      }).join(',');

      csv += csvRow + '\n';
    });

    addUltimateCategorizationLog('   ✅ CSV generated: ' + csv.length + ' characters');
    addUltimateCategorizationLog('   ✅ Total rows: ' + allData.length);
    addUltimateCategorizationLog('   ✅ Data rows: ' + (allData.length - 2));
    addUltimateCategorizationLog('');

    addUltimateCategorizationLog('═══════════════════════════════════════════════════════════');
    addUltimateCategorizationLog('🎉 EXPORT COMPLETE!');
    addUltimateCategorizationLog('═══════════════════════════════════════════════════════════');
    addUltimateCategorizationLog('   File: AI_Categorization_Results_' + new Date().toISOString().split('T')[0] + '.csv');
    addUltimateCategorizationLog('   Rows exported: ' + allData.length);
    addUltimateCategorizationLog('');

    return { success: true, csv: csv, rows: allData.length };

  } catch (error) {
    addUltimateCategorizationLog('');
    addUltimateCategorizationLog('❌ FATAL ERROR: ' + error.message);
    addUltimateCategorizationLog('   Stack trace: ' + error.stack);
    return { success: false, error: error.message };
  }
}

/**
 * Clear all results from AI_Categorization_Results sheet
 */
function clearUltimateCategorizationResults() {
  addUltimateCategorizationLog('═══════════════════════════════════════════════════════════');
  addUltimateCategorizationLog('🗑️  CLEAR RESULTS - STARTING');
  addUltimateCategorizationLog('═══════════════════════════════════════════════════════════');
  addUltimateCategorizationLog('');
  addUltimateCategorizationLog('⚠️  WARNING: This will DELETE all result rows!');
  addUltimateCategorizationLog('');

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // Get AI_Categorization_Results sheet
    addUltimateCategorizationLog('📊 Loading AI_Categorization_Results sheet...');
    const resultsSheet = ss.getSheetByName('AI_Categorization_Results');

    if (!resultsSheet) {
      addUltimateCategorizationLog('❌ ERROR: AI_Categorization_Results sheet not found!');
      return { success: false, error: 'Results sheet not found' };
    }

    addUltimateCategorizationLog('   ✅ Sheet found: AI_Categorization_Results');

    // Count rows to delete
    const lastRow = resultsSheet.getLastRow();
    const dataRows = lastRow - 2; // Subtract 2 header rows

    if (dataRows <= 0) {
      addUltimateCategorizationLog('⚠️  No data rows to delete (sheet already empty)');
      return { success: true, deleted: 0 };
    }

    addUltimateCategorizationLog('   ✅ Found ' + dataRows + ' data rows to delete (rows 3-' + lastRow + ')');
    addUltimateCategorizationLog('');

    // Delete data rows
    addUltimateCategorizationLog('🗑️  Deleting data rows...');
    resultsSheet.deleteRows(3, dataRows);
    addUltimateCategorizationLog('   ✅ Deleted ' + dataRows + ' rows');
    addUltimateCategorizationLog('');

    // Clear logs
    addUltimateCategorizationLog('🧹 Clearing categorization logs...');
    PropertiesService.getDocumentProperties()
      .deleteProperty('Ultimate_Categorization_Logs');
    addUltimateCategorizationLog('   ✅ Logs cleared');
    addUltimateCategorizationLog('');

    addUltimateCategorizationLog('═══════════════════════════════════════════════════════════');
    addUltimateCategorizationLog('🎉 CLEAR COMPLETE!');
    addUltimateCategorizationLog('═══════════════════════════════════════════════════════════');
    addUltimateCategorizationLog('   Rows deleted: ' + dataRows);
    addUltimateCategorizationLog('   Sheet now has: 2 header rows only');
    addUltimateCategorizationLog('');

    // Add new log entry after clearing (so user sees this message)
    addUltimateCategorizationLog('ℹ️  Results sheet cleared and ready for new categorization run.');

    return { success: true, deleted: dataRows };

  } catch (error) {
    addUltimateCategorizationLog('');
    addUltimateCategorizationLog('❌ FATAL ERROR: ' + error.message);
    addUltimateCategorizationLog('   Stack trace: ' + error.stack);
    return { success: false, error: error.message };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 2B-2C: COMING SOON (Retry Failed Cases, Specific Rows)
// ═══════════════════════════════════════════════════════════════════════════
