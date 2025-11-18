/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ULTIMATE CATEGORIZATION TOOL - COMPLETE (ALL PHASES)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Production-grade AI categorization system with complete feature set
 *
 * Features:
 * - Phase 2A-2D: AI Categorization, Apply, Export, Clear ✅
 * - Phase 2E: Browse by Symptom/System ✅
 * - Phase 2F: Settings & Category Management ✅
 * - Phase 2G: AI-Powered Category Suggestions ✅
 *
 * Created: 2025-11-11
 * Version: COMPLETE 2.0.0
 * ═══════════════════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════════════════════
// MAIN ENTRY POINT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Open Ultimate Categorization Tool
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
// UI BUILDER
// ═══════════════════════════════════════════════════════════════════════════

function buildUltimateCategorizationUI() {
  let html = '<!DOCTYPE html><html><head><base target="_top">';
  html += getUltimateCategorizationStyles();
  html += '</head><body>';
  html += getUltimateCategorizationBody();
  html += '<script>' + getUltimateCategorizationJavaScript() + '</script>';
  html += '</body></html>';
  return html;
}

/**
 * CSS Styles (All Phases)
 */
function getUltimateCategorizationStyles() {
  return `
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        background: #1a1d2e;
        color: #e0e0e0;
        padding: 20px;
        overflow: hidden;
      }

      /* Tab Navigation */
      .tab-bar {
        display: flex;
        gap: 4px;
        background: #252936;
        padding: 12px 20px 0 20px;
        border-radius: 12px 12px 0 0;
        border-bottom: 2px solid #3a3f51;
      }
      .tab-button {
        padding: 12px 24px;
        background: transparent;
        border: none;
        border-bottom: 3px solid transparent;
        color: #8b92a0;
        cursor: pointer;
        font-size: 14px;
        font-weight: 600;
        transition: all 0.2s;
        border-radius: 8px 8px 0 0;
      }
      .tab-button:hover { background: #2a3040; color: #a0a7b8; }
      .tab-button.active {
        color: #667eea;
        border-bottom-color: #667eea;
        background: #2a3040;
      }
      .tab-content { display: none; }
      .tab-content.active { display: block; }

      /* Categorize Layout */
      .container {
        display: grid;
        grid-template-columns: 320px 1fr;
        grid-template-rows: auto 1fr;
        gap: 20px;
        height: calc(100vh - 100px);
      }

      /* Browse Layout */
      .browse-container {
        display: grid;
        grid-template-columns: 280px 1fr;
        gap: 20px;
        height: calc(100vh - 120px);
        padding: 20px;
        background: #252936;
        border-radius: 0 0 12px 12px;
      }

      /* Settings Layout */
      .settings-container {
        padding: 20px;
        background: #252936;
        border-radius: 0 0 12px 12px;
        height: calc(100vh - 120px);
        overflow-y: auto;
      }

      .settings-section {
        background: #1a1d2e;
        border-radius: 8px;
        padding: 20px;
        margin-bottom: 20px;
      }

      .settings-section-title {
        font-size: 16px;
        font-weight: 600;
        color: #667eea;
        margin-bottom: 16px;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      /* Tables */
      .data-table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 12px;
      }
      .data-table th {
        background: #2a3040;
        padding: 12px;
        text-align: left;
        font-size: 12px;
        font-weight: 600;
        color: #8b92a0;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .data-table td {
        padding: 12px;
        border-top: 1px solid #3a3f51;
        font-size: 13px;
      }
      .data-table tr:hover {
        background: #2a3040;
      }

      /* Category Items */
      .category-list {
        background: #1a1d2e;
        border-radius: 8px;
        padding: 16px;
        overflow-y: auto;
      }
      .category-item {
        padding: 12px 16px;
        margin-bottom: 8px;
        background: #252936;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s;
        border-left: 3px solid transparent;
      }
      .category-item:hover {
        background: #2a3040;
        transform: translateX(4px);
      }
      .category-item.active {
        border-left-color: #667eea;
        background: #2a3040;
      }
      .category-name {
        font-weight: 600;
        color: #e0e0e0;
        font-size: 14px;
        margin-bottom: 4px;
      }
      .category-count {
        font-size: 12px;
        color: #8b92a0;
      }

      /* Case Cards */
      .case-list {
        background: #1a1d2e;
        border-radius: 8px;
        padding: 16px;
        overflow-y: auto;
      }
      .case-card {
        background: #252936;
        border-radius: 8px;
        padding: 16px;
        margin-bottom: 12px;
        border-left: 3px solid #667eea;
      }
      .case-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
      }
      .case-id {
        font-weight: 600;
        color: #667eea;
        font-size: 15px;
      }
      .case-status {
        padding: 4px 12px;
        border-radius: 12px;
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
      }
      .status-match { background: #38ef7d; color: #000; }
      .status-conflict { background: #f5576c; color: #fff; }
      .status-new { background: #4a9eff; color: #fff; }
      .case-detail {
        font-size: 13px;
        color: #a0a7b8;
        line-height: 1.6;
      }
      .case-detail strong { color: #e0e0e0; }

      /* Panels */
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

      /* Titles */
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

      /* Forms */
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

      /* Buttons */
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
      .btn:disabled { opacity: 0.5; cursor: not-allowed; }
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
      .btn-secondary:hover:not(:disabled) { background: #323848; }
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
      .btn-small {
        padding: 6px 12px;
        font-size: 12px;
        width: auto;
      }

      /* Logs Display */
      #logsDisplay {
        flex: 1;
        background: #000;
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
      #logsDisplay::-webkit-scrollbar { width: 8px; }
      #logsDisplay::-webkit-scrollbar-track { background: #000; }
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

      /* Progress */
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

      /* Stats */
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

      /* Utilities */
      .hidden { display: none !important; }
      .empty-state {
        text-align: center;
        padding: 60px 20px;
        color: #666;
      }
      .empty-state-icon {
        font-size: 48px;
        margin-bottom: 16px;
      }
      .empty-state-text {
        font-size: 14px;
        color: #8b92a0;
      }

      /* Toast */
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
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }

      /* AI Suggestions */
      .suggestion-card {
        background: #252936;
        border-radius: 8px;
        padding: 16px;
        margin-bottom: 12px;
        border-left: 3px solid #4a9eff;
      }
      .suggestion-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
      }
      .suggestion-name {
        font-weight: 600;
        color: #4a9eff;
        font-size: 15px;
      }
      .suggestion-actions {
        display: flex;
        gap: 8px;
      }
      .suggestion-detail {
        font-size: 13px;
        color: #a0a7b8;
        line-height: 1.6;
      }
    </style>
  `;
}

/**
 * HTML Body (All Phases)
 */
function getUltimateCategorizationBody() {
  let body = '';

  // Tab Bar
  body += '<div class="tab-bar">';
  body += '  <button class="tab-button active" onclick="switchTab(\'categorize\')">📊 Categorize</button>';
  body += '  <button class="tab-button" onclick="switchTab(\'browseSymptom\')">🔍 Browse by Symptom</button>';
  body += '  <button class="tab-button" onclick="switchTab(\'browseSystem\')">🏥 Browse by System</button>';
  body += '  <button class="tab-button" onclick="switchTab(\'settings\')">⚙️ Settings</button>';
  body += '</div>';

  // TAB 1: CATEGORIZE
  body += '<div id="tabCategorize" class="tab-content active">';
  body += '  <div class="container">';
  body += '    <div class="controls-panel">';
  body += '      <div class="panel-title">⚙️ Controls</div>';
  body += '      <div class="form-group">';
  body += '        <label for="modeSelector">Mode</label>';
  body += '        <select id="modeSelector" onchange="handleModeChange()">';
  body += '          <option value="all">All Cases (207 total)</option>';
  body += '          <option value="retry">Retry Failed Cases</option>';
  body += '          <option value="specific">Specific Rows</option>';
  body += '        </select>';
  body += '      </div>';
  body += '      <div id="specificRowsContainer" class="form-group hidden">';
  body += '        <label for="specificRowsInput">Enter Rows or Case IDs</label>';
  body += '        <input type="text" id="specificRowsInput" placeholder="e.g., 7,13,17 or CARD0002" />';
  body += '      </div>';
  body += '      <button id="runBtn" class="btn btn-primary" onclick="runCategorization()">🚀 Run AI Categorization</button>';
  body += '      <button id="retryBtn" class="btn btn-warning" onclick="retryCategorization()">🔄 Retry Failed Cases</button>';
  body += '      <button id="applyBtn" class="btn btn-success" onclick="applyToMaster()">✅ Apply to Master</button>';
  body += '      <button id="exportBtn" class="btn btn-secondary" onclick="exportResults()">💾 Export Results</button>';
  body += '      <button id="clearBtn" class="btn btn-danger" onclick="clearResults()">🗑️ Clear Results</button>';
  body += '      <div class="progress-container">';
  body += '        <div class="progress-label">Progress</div>';
  body += '        <div class="progress-bar">';
  body += '          <div id="progressFill" class="progress-fill" style="width:0%;">0%</div>';
  body += '        </div>';
  body += '      </div>';
  body += '    </div>';
  body += '    <div class="logs-panel">';
  body += '      <div class="logs-title">🖥️ Live Logs</div>';
  body += '      <div id="logsDisplay">Waiting for action...</div>';
  body += '      <div class="logs-buttons">';
  body += '        <button class="btn btn-secondary" onclick="copyLogs()">📋 Copy</button>';
  body += '        <button class="btn btn-secondary" onclick="clearLogs()">🧹 Clear</button>';
  body += '        <button class="btn btn-secondary" onclick="refreshLogs()">🔄 Refresh</button>';
  body += '      </div>';
  body += '    </div>';
  body += '    <div class="results-panel">';
  body += '      <div class="panel-title">📊 Results Summary</div>';
  body += '      <div class="stats-grid">';
  body += '        <div class="stat-card"><div id="statSuccess" class="stat-value stat-success">0</div><div class="stat-label">Success</div></div>';
  body += '        <div class="stat-card"><div id="statConflict" class="stat-value stat-warning">0</div><div class="stat-label">Conflicts</div></div>';
  body += '        <div class="stat-card"><div id="statFailed" class="stat-value stat-error">0</div><div class="stat-label">Failed</div></div>';
  body += '      </div>';
  body += '    </div>';
  body += '  </div>';
  body += '</div>';

  // TAB 2: BROWSE SYMPTOM
  body += '<div id="tabBrowseSymptom" class="tab-content">';
  body += '  <div class="browse-container">';
  body += '    <div class="category-list">';
  body += '      <div class="panel-title">Symptom Categories</div>';
  body += '      <div id="symptomCategoryList"><div class="empty-state"><div class="empty-state-icon">🔍</div><div class="empty-state-text">Loading...</div></div></div>';
  body += '    </div>';
  body += '    <div class="case-list">';
  body += '      <div class="panel-title">Cases in Category</div>';
  body += '      <div id="symptomCaseList"><div class="empty-state"><div class="empty-state-icon">📋</div><div class="empty-state-text">Select a category</div></div></div>';
  body += '    </div>';
  body += '  </div>';
  body += '</div>';

  // TAB 3: BROWSE SYSTEM
  body += '<div id="tabBrowseSystem" class="tab-content">';
  body += '  <div class="browse-container">';
  body += '    <div class="category-list">';
  body += '      <div class="panel-title">System Categories</div>';
  body += '      <div id="systemCategoryList"><div class="empty-state"><div class="empty-state-icon">🏥</div><div class="empty-state-text">Loading...</div></div></div>';
  body += '    </div>';
  body += '    <div class="case-list">';
  body += '      <div class="panel-title">Cases in System</div>';
  body += '      <div id="systemCaseList"><div class="empty-state"><div class="empty-state-icon">📋</div><div class="empty-state-text">Select a system</div></div></div>';
  body += '    </div>';
  body += '  </div>';
  body += '</div>';

  // TAB 4: SETTINGS (Phase 2F + 2G)
  body += '<div id="tabSettings" class="tab-content">';
  body += '  <div class="settings-container">';
  body += '    <div class="settings-section">';
  body += '      <div class="settings-section-title">📝 Symptom Categories</div>';
  body += '      <div id="symptomMappingsTable"></div>';
  body += '      <button class="btn btn-success btn-small" style="margin-top:12px;" onclick="addSymptomMapping()">➕ Add New Symptom</button>';
  body += '    </div>';
  body += '    <div class="settings-section">';
  body += '      <div class="settings-section-title">🤖 AI Category Suggestions</div>';
  body += '      <p style="color:#8b92a0;font-size:13px;margin-bottom:12px;">Analyze uncategorized cases and suggest new categories</p>';
  body += '      <button id="generateSuggestionsBtn" class="btn btn-primary btn-small" onclick="generateSuggestions()">🤖 Generate Suggestions</button>';
  body += '      <div id="suggestionsContainer" style="margin-top:16px;"></div>';
  body += '    </div>';
  body += '  </div>';
  body += '</div>';

  return body;
}

/**
 * JavaScript (All Phases)
 */
function getUltimateCategorizationJavaScript() {
  let js = '';

  // Tab Switching
  js += 'function switchTab(tabName) {\n';
  js += '  document.querySelectorAll(".tab-content").forEach(t => t.classList.remove("active"));\n';
  js += '  document.querySelectorAll(".tab-button").forEach(b => b.classList.remove("active"));\n';
  js += '  if (tabName === "categorize") {\n';
  js += '    document.getElementById("tabCategorize").classList.add("active");\n';
  js += '    document.querySelectorAll(".tab-button")[0].classList.add("active");\n';
  js += '  } else if (tabName === "browseSymptom") {\n';
  js += '    document.getElementById("tabBrowseSymptom").classList.add("active");\n';
  js += '    document.querySelectorAll(".tab-button")[1].classList.add("active");\n';
  js += '    loadSymptomCategories();\n';
  js += '  } else if (tabName === "browseSystem") {\n';
  js += '    document.getElementById("tabBrowseSystem").classList.add("active");\n';
  js += '    document.querySelectorAll(".tab-button")[2].classList.add("active");\n';
  js += '    loadSystemCategories();\n';
  js += '  } else if (tabName === "settings") {\n';
  js += '    document.getElementById("tabSettings").classList.add("active");\n';
  js += '    document.querySelectorAll(".tab-button")[3].classList.add("active");\n';
  js += '    loadSettings();\n';
  js += '  }\n';
  js += '}\n\n';

  // Phase 2E: Browse Functions
  js += 'function loadSymptomCategories() {\n';
  js += '  var container = document.getElementById("symptomCategoryList");\n';
  js += '  container.innerHTML = "<div class=\\"empty-state\\"><div class=\\"empty-state-icon\\">⏳</div></div>";\n';
  js += '  google.script.run.withSuccessHandler(function(stats) {\n';
  js += '    if (!stats || !stats.symptoms) { container.innerHTML = "<div class=\\"empty-state\\"><div class=\\"empty-state-icon\\">❌</div></div>"; return; }\n';
  js += '    var html = ""; Object.keys(stats.symptoms).sort().forEach(function(code) {\n';
  js += '      var data = stats.symptoms[code];\n';
  js += '      html += "<div class=\\"category-item\\" onclick=\\"loadSymptomCases(\'" + code + "\')\\"><div class=\\"category-name\\">" + code + " - " + (data.name || "") + "</div><div class=\\"category-count\\">" + data.total + " cases</div></div>";\n';
  js += '    }); container.innerHTML = html;\n';
  js += '  }).withFailureHandler(function() { container.innerHTML = "<div class=\\"empty-state\\"><div class=\\"empty-state-icon\\">❌</div></div>"; }).getCategoryStatistics();\n';
  js += '}\n\n';

  js += 'function loadSystemCategories() {\n';
  js += '  var container = document.getElementById("systemCategoryList");\n';
  js += '  container.innerHTML = "<div class=\\"empty-state\\"><div class=\\"empty-state-icon\\">⏳</div></div>";\n';
  js += '  google.script.run.withSuccessHandler(function(stats) {\n';
  js += '    if (!stats || !stats.systems) { container.innerHTML = "<div class=\\"empty-state\\"><div class=\\"empty-state-icon\\">❌</div></div>"; return; }\n';
  js += '    var html = ""; Object.keys(stats.systems).sort().forEach(function(name) {\n';
  js += '      var data = stats.systems[name];\n';
  js += '      html += "<div class=\\"category-item\\" onclick=\\"loadSystemCases(\'" + name + "\')\\"><div class=\\"category-name\\">" + name + "</div><div class=\\"category-count\\">" + data.total + " cases</div></div>";\n';
  js += '    }); container.innerHTML = html;\n';
  js += '  }).withFailureHandler(function() { container.innerHTML = "<div class=\\"empty-state\\"><div class=\\"empty-state-icon\\">❌</div></div>"; }).getCategoryStatistics();\n';
  js += '}\n\n';

  js += 'function loadSymptomCases(code) {\n';
  js += '  var container = document.getElementById("symptomCaseList");\n';
  js += '  container.innerHTML = "<div class=\\"empty-state\\"><div class=\\"empty-state-icon\\">⏳</div></div>";\n';
  js += '  google.script.run.withSuccessHandler(function(cases) {\n';
  js += '    if (!cases || cases.length === 0) { container.innerHTML = "<div class=\\"empty-state\\"><div class=\\"empty-state-icon\\">📭</div></div>"; return; }\n';
  js += '    var html = ""; cases.forEach(function(c) {\n';
  js += '      var statusClass = "status-" + c.status;\n';
  js += '      var icon = c.status === "match" ? "✅" : (c.status === "conflict" ? "⚠️" : "🆕");\n';
  js += '      html += "<div class=\\"case-card\\"><div class=\\"case-header\\"><div class=\\"case-id\\">" + c.caseID + "</div><div class=\\"case-status " + statusClass + "\\">" + icon + " " + c.status + "</div></div>";\n';
  js += '      html += "<div class=\\"case-detail\\"><strong>Symptom:</strong> " + (c.currentSymptom || "none") + " → " + c.finalSymptom + "<br><strong>System:</strong> " + c.finalSystem;\n';
  js += '      if (c.reasoning) html += "<br><strong>Reasoning:</strong> " + c.reasoning;\n';
  js += '      html += "</div></div>";\n';
  js += '    }); container.innerHTML = html;\n';
  js += '  }).withFailureHandler(function() { container.innerHTML = "<div class=\\"empty-state\\"><div class=\\"empty-state-icon\\">❌</div></div>"; }).getCasesForCategory("symptom", code);\n';
  js += '}\n\n';

  js += 'function loadSystemCases(name) {\n';
  js += '  var container = document.getElementById("systemCaseList");\n';
  js += '  container.innerHTML = "<div class=\\"empty-state\\"><div class=\\"empty-state-icon\\">⏳</div></div>";\n';
  js += '  google.script.run.withSuccessHandler(function(cases) {\n';
  js += '    if (!cases || cases.length === 0) { container.innerHTML = "<div class=\\"empty-state\\"><div class=\\"empty-state-icon\\">📭</div></div>"; return; }\n';
  js += '    var html = ""; cases.forEach(function(c) {\n';
  js += '      var statusClass = "status-" + c.status;\n';
  js += '      var icon = c.status === "match" ? "✅" : (c.status === "conflict" ? "⚠️" : "🆕");\n';
  js += '      html += "<div class=\\"case-card\\"><div class=\\"case-header\\"><div class=\\"case-id\\">" + c.caseID + "</div><div class=\\"case-status " + statusClass + "\\">" + icon + " " + c.status + "</div></div>";\n';
  js += '      html += "<div class=\\"case-detail\\"><strong>Symptom:</strong> " + c.finalSymptom + "<br><strong>System:</strong> " + (c.currentSystem || "none") + " → " + c.finalSystem;\n';
  js += '      if (c.reasoning) html += "<br><strong>Reasoning:</strong> " + c.reasoning;\n';
  js += '      html += "</div></div>";\n';
  js += '    }); container.innerHTML = html;\n';
  js += '  }).withFailureHandler(function() { container.innerHTML = "<div class=\\"empty-state\\"><div class=\\"empty-state-icon\\">❌</div></div>"; }).getCasesForCategory("system", name);\n';
  js += '}\n\n';

  // Phase 2F: Settings Functions
  js += 'function loadSettings() {\n';
  js += '  google.script.run.withSuccessHandler(function(mappings) {\n';
  js += '    var tbody = document.createElement("tbody");\n';
  js += '    mappings.forEach(function(m) {\n';
  js += '      var tr = document.createElement("tr");\n';
  js += '      var tdCode = document.createElement("td"); tdCode.textContent = m.code;\n';
  js += '      var tdName = document.createElement("td"); tdName.textContent = m.name;\n';
  js += '      var tdActions = document.createElement("td");\n';
  js += '      var btn = document.createElement("button");\n';
  js += '      btn.className = "btn btn-secondary btn-small";\n';
  js += '      btn.textContent = "Edit";\n';
  js += '      btn.onclick = function() { editSymptomMapping(m.code, m.name); };\n';
  js += '      tdActions.appendChild(btn);\n';
  js += '      tr.appendChild(tdCode); tr.appendChild(tdName); tr.appendChild(tdActions);\n';
  js += '      tbody.appendChild(tr);\n';
  js += '    });\n';
  js += '    var table = document.createElement("table");\n';
  js += '    table.className = "data-table";\n';
  js += '    var thead = document.createElement("thead");\n';
  js += '    thead.innerHTML = "<tr><th>Code</th><th>Full Name</th><th>Actions</th></tr>";\n';
  js += '    table.appendChild(thead); table.appendChild(tbody);\n';
  js += '    var container = document.getElementById("symptomMappingsTable");\n';
  js += '    container.innerHTML = "";\n';
  js += '    container.appendChild(table);\n';
  js += '  }).getSymptomMappings();\n';
  js += '}\n\n';

  js += 'function addSymptomMapping() {\n';
  js += '  var code = prompt("Enter symptom code (e.g., CP):");\n';
  js += '  if (!code) return;\n';
  js += '  var name = prompt("Enter full name (e.g., Chest Pain):");\n';
  js += '  if (!name) return;\n';
  js += '  google.script.run.withSuccessHandler(function(result) {\n';
  js += '    if (result.success) { showToast("✅ Symptom added!"); loadSettings(); }\n';
  js += '    else showToast("❌ Error: " + result.error);\n';
  js += '  }).addSymptomMappingBackend(code, name);\n';
  js += '}\n\n';

  js += 'function editSymptomMapping(oldCode, oldName) {\n';
  js += '  var newCode = prompt("Edit symptom code:", oldCode);\n';
  js += '  if (!newCode) return;\n';
  js += '  var newName = prompt("Edit full name:", oldName);\n';
  js += '  if (!newName) return;\n';
  js += '  google.script.run.withSuccessHandler(function(result) {\n';
  js += '    if (result.success) { showToast("✅ Symptom updated!"); loadSettings(); }\n';
  js += '    else showToast("❌ Error: " + result.error);\n';
  js += '  }).updateSymptomMappingBackend(oldCode, newCode, newName);\n';
  js += '}\n\n';

  // Phase 2G: AI Suggestions
  js += 'function generateSuggestions() {\n';
  js += '  var btn = document.getElementById("generateSuggestionsBtn");\n';
  js += '  btn.disabled = true; btn.textContent = "⏳ Analyzing...";\n';
  js += '  var container = document.getElementById("suggestionsContainer");\n';
  js += '  container.innerHTML = "<div class=\\"empty-state\\"><div class=\\"empty-state-icon\\">⏳</div><div class=\\"empty-state-text\\">Analyzing cases with AI...</div></div>";\n';
  js += '  google.script.run.withSuccessHandler(function(suggestions) {\n';
  js += '    btn.disabled = false; btn.textContent = "🤖 Generate Suggestions";\n';
  js += '    if (!suggestions || suggestions.length === 0) { container.innerHTML = "<div class=\\"empty-state\\"><div class=\\"empty-state-icon\\">✅</div><div class=\\"empty-state-text\\">No new categories suggested</div></div>"; return; }\n';
  js += '    container.innerHTML = "";\n';
  js += '    suggestions.forEach(function(s, i) {\n';
  js += '      var card = document.createElement("div"); card.className = "suggestion-card";\n';
  js += '      var header = document.createElement("div"); header.className = "suggestion-header";\n';
  js += '      var nameDiv = document.createElement("div"); nameDiv.className = "suggestion-name"; nameDiv.textContent = s.code + " - " + s.name;\n';
  js += '      var actionsDiv = document.createElement("div"); actionsDiv.className = "suggestion-actions";\n';
  js += '      var approveBtn = document.createElement("button"); approveBtn.className = "btn btn-success btn-small"; approveBtn.textContent = "Approve";\n';
  js += '      approveBtn.onclick = function() { approveSuggestion(i); };\n';
  js += '      var rejectBtn = document.createElement("button"); rejectBtn.className = "btn btn-secondary btn-small"; rejectBtn.textContent = "Reject";\n';
  js += '      rejectBtn.onclick = function() { rejectSuggestion(i); };\n';
  js += '      actionsDiv.appendChild(approveBtn); actionsDiv.appendChild(rejectBtn);\n';
  js += '      header.appendChild(nameDiv); header.appendChild(actionsDiv);\n';
  js += '      var detail = document.createElement("div"); detail.className = "suggestion-detail";\n';
  js += '      detail.innerHTML = "<strong>Found in:</strong> " + s.caseCount + " cases<br><strong>Reasoning:</strong> " + s.reasoning;\n';
  js += '      card.appendChild(header); card.appendChild(detail);\n';
  js += '      container.appendChild(card);\n';
  js += '    });\n';
  js += '    window.currentSuggestions = suggestions;\n';
  js += '  }).withFailureHandler(function(error) { btn.disabled = false; btn.textContent = "🤖 Generate Suggestions"; showToast("❌ Error: " + error.message); }).generateAISuggestions();\n';
  js += '}\n\n';

  js += 'function approveSuggestion(index) {\n';
  js += '  var s = window.currentSuggestions[index];\n';
  js += '  if (!s) return;\n';
  js += '  google.script.run.withSuccessHandler(function(result) {\n';
  js += '    if (result.success) { showToast("✅ Category added!"); generateSuggestions(); loadSettings(); }\n';
  js += '    else showToast("❌ Error: " + result.error);\n';
  js += '  }).addSymptomMappingBackend(s.code, s.name);\n';
  js += '}\n\n';

  js += 'function rejectSuggestion(index) {\n';
  js += '  window.currentSuggestions.splice(index, 1);\n';
  js += '  showToast("❌ Suggestion rejected");\n';
  js += '  var container = document.getElementById("suggestionsContainer");\n';
  js += '  if (window.currentSuggestions.length === 0) { container.innerHTML = "<div class=\\"empty-state\\"><div class=\\"empty-state-icon\\">✅</div><div class=\\"empty-state-text\\">No more suggestions</div></div>"; }\n';
  js += '}\n\n';

  // Core Functions (Phase 2A-2D)
  js += 'function handleModeChange() { var mode = document.getElementById("modeSelector").value; var container = document.getElementById("specificRowsContainer"); container.classList.toggle("hidden", mode !== "specific"); }\n';
  js += 'function refreshLogs() { google.script.run.withSuccessHandler(function(logs) { var el = document.getElementById("logsDisplay"); el.textContent = logs || "No logs..."; el.scrollTop = el.scrollHeight; }).getUltimateCategorizationLogs(); }\n';
  js += 'setInterval(refreshLogs, 2000); refreshLogs();\n';
  js += 'function copyLogs() { navigator.clipboard.writeText(document.getElementById("logsDisplay").textContent).then(function() { showToast("✅ Logs copied!"); }); }\n';
  js += 'function clearLogs() { if (confirm("Clear all logs?")) { google.script.run.withSuccessHandler(function() { document.getElementById("logsDisplay").textContent = "Logs cleared."; showToast("✅ Logs cleared"); }).clearUltimateCategorizationLogs(); } }\n';
  js += 'function showToast(msg) { var toast = document.createElement("div"); toast.className = "toast"; toast.textContent = msg; document.body.appendChild(toast); setTimeout(function() { toast.remove(); }, 3000); }\n';
  js += 'function runCategorization() { var mode = document.getElementById("modeSelector").value; var input = document.getElementById("specificRowsInput").value; var btn = document.getElementById("runBtn"); btn.disabled = true; btn.textContent = "⏳ Processing..."; google.script.run.withSuccessHandler(function(r) { btn.disabled = false; btn.textContent = "🚀 Run AI Categorization"; if (r.success) { showToast("✅ Complete! Processed: " + r.total); refreshLogs(); } else showToast("❌ Error: " + r.error); }).withFailureHandler(function(e) { btn.disabled = false; btn.textContent = "🚀 Run AI Categorization"; showToast("❌ Server error: " + e.message); }).runUltimateCategorization(mode, input); }\n';
  js += 'function retryCategorization() { showToast("🚧 Feature coming soon..."); }\n';
  js += 'function applyToMaster() { if (!confirm("Apply Final_Symptom and Final_System to Master sheet?")) return; var btn = document.getElementById("applyBtn"); btn.disabled = true; btn.textContent = "⏳ Applying..."; google.script.run.withSuccessHandler(function(r) { btn.disabled = false; btn.textContent = "✅ Apply to Master"; if (r.success) { showToast("✅ Applied " + r.updated + " cases!"); refreshLogs(); } else showToast("❌ Error: " + r.error); }).withFailureHandler(function(e) { btn.disabled = false; btn.textContent = "✅ Apply to Master"; showToast("❌ Server error: " + e.message); }).applyUltimateCategorizationToMaster(); }\n';
  js += 'function exportResults() { var btn = document.getElementById("exportBtn"); btn.disabled = true; btn.textContent = "⏳ Exporting..."; google.script.run.withSuccessHandler(function(r) { btn.disabled = false; btn.textContent = "💾 Export Results"; if (r.success) { var blob = new Blob([r.csv], {type: "text/csv;charset=utf-8;"}); var link = document.createElement("a"); link.setAttribute("href", URL.createObjectURL(blob)); link.setAttribute("download", "AI_Categorization_Results_" + new Date().toISOString().split("T")[0] + ".csv"); link.style.visibility = "hidden"; document.body.appendChild(link); link.click(); document.body.removeChild(link); showToast("✅ Exported " + r.rows + " rows!"); refreshLogs(); } else showToast("❌ Error: " + r.error); }).withFailureHandler(function(e) { btn.disabled = false; btn.textContent = "💾 Export Results"; showToast("❌ Server error: " + e.message); }).exportUltimateCategorizationResults(); }\n';
  js += 'function clearResults() { if (!confirm("⚠️ CLEAR ALL RESULTS?\\n\\nThis will DELETE all rows in AI_Categorization_Results sheet.\\n\\nThis action CANNOT be undone!")) return; var btn = document.getElementById("clearBtn"); btn.disabled = true; btn.textContent = "⏳ Clearing..."; google.script.run.withSuccessHandler(function(r) { btn.disabled = false; btn.textContent = "🗑️ Clear Results"; if (r.success) { showToast("✅ Cleared " + r.deleted + " rows!"); refreshLogs(); } else showToast("❌ Error: " + r.error); }).withFailureHandler(function(e) { btn.disabled = false; btn.textContent = "🗑️ Clear Results"; showToast("❌ Server error: " + e.message); }).clearUltimateCategorizationResults(); }\n';

  return js;
}

// ═══════════════════════════════════════════════════════════════════════════
// LOGGING
// ═══════════════════════════════════════════════════════════════════════════

function addUltimateCategorizationLog(message) {
  try {
    const props = PropertiesService.getDocumentProperties();
    const timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'HH:mm:ss');
    const logEntry = '[' + timestamp + '] ' + message;
    const existingLogs = props.getProperty('Ultimate_Categorization_Logs') || '';
    props.setProperty('Ultimate_Categorization_Logs', existingLogs + logEntry + '\n');
    Logger.log(logEntry);
  } catch (error) {
    Logger.log('Error adding log: ' + error.message);
  }
}

function getUltimateCategorizationLogs() {
  try {
    return PropertiesService.getDocumentProperties().getProperty('Ultimate_Categorization_Logs') || '';
  } catch (error) {
    return 'Error retrieving logs: ' + error.message;
  }
}

function clearUltimateCategorizationLogs() {
  try {
    PropertiesService.getDocumentProperties().deleteProperty('Ultimate_Categorization_Logs');
    addUltimateCategorizationLog('Logs cleared');
    return true;
  } catch (error) {
    Logger.log('Error clearing logs: ' + error.message);
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 2E: BROWSE BACKEND
// ═══════════════════════════════════════════════════════════════════════════

function getCategoryStatistics() {
  addUltimateCategorizationLog('📊 GET CATEGORY STATISTICS');
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const resultsSheet = ss.getSheetByName('AI_Categorization_Results');
    if (!resultsSheet) return { symptoms: {}, systems: {} };

    const lastRow = resultsSheet.getLastRow();
    if (lastRow <= 2) return { symptoms: {}, systems: {} };

    const data = resultsSheet.getRange(3, 1, lastRow - 2, 14).getValues();
    const symptomStats = {};
    const systemStats = {};

    data.forEach(function(row) {
      const caseID = row[0];
      const finalSymptom = row[12];
      const finalSystem = row[13];
      const status = row[10];
      if (!caseID) return;

      if (finalSymptom) {
        if (!symptomStats[finalSymptom]) {
          symptomStats[finalSymptom] = { name: row[6] || finalSymptom, total: 0, match: 0, conflict: 0, new: 0 };
        }
        symptomStats[finalSymptom].total++;
        if (status === 'match') symptomStats[finalSymptom].match++;
        else if (status === 'conflict') symptomStats[finalSymptom].conflict++;
        else symptomStats[finalSymptom].new++;
      }

      if (finalSystem) {
        if (!systemStats[finalSystem]) {
          systemStats[finalSystem] = { name: finalSystem, total: 0, match: 0, conflict: 0, new: 0 };
        }
        systemStats[finalSystem].total++;
        if (status === 'match') systemStats[finalSystem].match++;
        else if (status === 'conflict') systemStats[finalSystem].conflict++;
        else systemStats[finalSystem].new++;
      }
    });

    addUltimateCategorizationLog('   ✅ Symptoms: ' + Object.keys(symptomStats).length + ', Systems: ' + Object.keys(systemStats).length);
    return { symptoms: symptomStats, systems: systemStats };
  } catch (error) {
    addUltimateCategorizationLog('❌ ERROR: ' + error.message);
    return { symptoms: {}, systems: {} };
  }
}

function getCasesForCategory(type, value) {
  addUltimateCategorizationLog('🔍 GET CASES FOR: ' + type + ' = ' + value);
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const resultsSheet = ss.getSheetByName('AI_Categorization_Results');
    if (!resultsSheet) return [];

    const lastRow = resultsSheet.getLastRow();
    if (lastRow <= 2) return [];

    const data = resultsSheet.getRange(3, 1, lastRow - 2, 14).getValues();
    const cases = [];
    const columnIndex = type === 'symptom' ? 12 : 13;

    data.forEach(function(row) {
      const caseID = row[0];
      const categoryValue = row[columnIndex];
      if (caseID && categoryValue === value) {
        cases.push({
          caseID: caseID,
          currentSymptom: row[2],
          currentSystem: row[3],
          finalSymptom: row[12],
          finalSystem: row[13],
          reasoning: row[8],
          status: row[10]
        });
      }
    });

    addUltimateCategorizationLog('   ✅ Found ' + cases.length + ' cases');
    return cases;
  } catch (error) {
    addUltimateCategorizationLog('❌ ERROR: ' + error.message);
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 2F: SETTINGS BACKEND
// ═══════════════════════════════════════════════════════════════════════════

function getSymptomMappings() {
  addUltimateCategorizationLog('📝 GET SYMPTOM MAPPINGS');
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const mappingSheet = ss.getSheetByName('accronym_symptom_system_mapping');
    if (!mappingSheet) return [];

    const data = mappingSheet.getDataRange().getValues();
    const mappings = [];
    for (let i = 1; i < data.length; i++) {
      if (data[i][0]) {
        mappings.push({ code: data[i][0], name: data[i][1] || '' });
      }
    }
    addUltimateCategorizationLog('   ✅ Loaded ' + mappings.length + ' mappings');
    return mappings;
  } catch (error) {
    addUltimateCategorizationLog('❌ ERROR: ' + error.message);
    return [];
  }
}

function addSymptomMappingBackend(code, name) {
  addUltimateCategorizationLog('➕ ADD SYMPTOM MAPPING: ' + code + ' = ' + name);
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const mappingSheet = ss.getSheetByName('accronym_symptom_system_mapping');
    if (!mappingSheet) return { success: false, error: 'Mapping sheet not found' };

    const lastRow = mappingSheet.getLastRow();
    mappingSheet.getRange(lastRow + 1, 1, 1, 2).setValues([[code, name]]);
    addUltimateCategorizationLog('   ✅ Added to row ' + (lastRow + 1));
    return { success: true };
  } catch (error) {
    addUltimateCategorizationLog('❌ ERROR: ' + error.message);
    return { success: false, error: error.message };
  }
}

function updateSymptomMappingBackend(oldCode, newCode, newName) {
  addUltimateCategorizationLog('✏️ UPDATE SYMPTOM MAPPING: ' + oldCode + ' → ' + newCode);
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const mappingSheet = ss.getSheetByName('accronym_symptom_system_mapping');
    if (!mappingSheet) return { success: false, error: 'Mapping sheet not found' };

    const data = mappingSheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === oldCode) {
        mappingSheet.getRange(i + 1, 1, 1, 2).setValues([[newCode, newName]]);
        addUltimateCategorizationLog('   ✅ Updated row ' + (i + 1));
        return { success: true };
      }
    }
    return { success: false, error: 'Code not found' };
  } catch (error) {
    addUltimateCategorizationLog('❌ ERROR: ' + error.message);
    return { success: false, error: error.message };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 2G: AI SUGGESTIONS BACKEND
// ═══════════════════════════════════════════════════════════════════════════

function generateAISuggestions() {
  addUltimateCategorizationLog('🤖 GENERATE AI SUGGESTIONS');
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const resultsSheet = ss.getSheetByName('AI_Categorization_Results');
    if (!resultsSheet) return [];

    const lastRow = resultsSheet.getLastRow();
    if (lastRow <= 2) return [];

    const data = resultsSheet.getRange(3, 1, lastRow - 2, 14).getValues();

    // Find cases with status='new' or reasoning contains "not found"
    const uncategorizedCases = [];
    data.forEach(function(row) {
      const status = row[10];
      const reasoning = row[8] || '';
      if (status === 'new' || reasoning.toLowerCase().includes('not found')) {
        uncategorizedCases.push({
          caseID: row[0],
          chiefComplaint: row[4] || '',
          presentation: row[5] || '',
          reasoning: reasoning
        });
      }
    });

    if (uncategorizedCases.length === 0) {
      addUltimateCategorizationLog('   ℹ️ No uncategorized cases found');
      return [];
    }

    addUltimateCategorizationLog('   Found ' + uncategorizedCases.length + ' uncategorized cases');
    addUltimateCategorizationLog('   🌐 Calling OpenAI for suggestions...');

    const apiKey = getOpenAIAPIKey();
    if (!apiKey) return [];

    const prompt = buildSuggestionsPrompt(uncategorizedCases);

    const response = UrlFetchApp.fetch('https://api.openai.com/v1/chat/completions', {
      method: 'post',
      headers: {
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify({
        model: 'gpt-4',
        temperature: 0.3,
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }]
      }),
      muteHttpExceptions: true
    });

    if (response.getResponseCode() !== 200) {
      addUltimateCategorizationLog('❌ API error: ' + response.getContentText());
      return [];
    }

    const result = JSON.parse(response.getContentText());
    const content = result.choices[0].message.content;

    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      addUltimateCategorizationLog('❌ No JSON found in response');
      return [];
    }

    const suggestions = JSON.parse(jsonMatch[0]);
    addUltimateCategorizationLog('   ✅ Generated ' + suggestions.length + ' suggestions');
    return suggestions;
  } catch (error) {
    addUltimateCategorizationLog('❌ ERROR: ' + error.message);
    return [];
  }
}

function buildSuggestionsPrompt(cases) {
  let prompt = 'You are a medical education expert. Analyze these uncategorized emergency medicine cases and suggest NEW symptom categories that don\'t exist yet.\n\n';
  prompt += 'Cases:\n';
  cases.slice(0, 20).forEach(function(c, i) {
    prompt += (i + 1) + '. ' + c.caseID + ': ' + c.chiefComplaint + '\n';
  });
  prompt += '\nReturn a JSON array of suggested categories:\n';
  prompt += '[{"code": "ETOH", "name": "Alcohol Intoxication", "caseCount": 8, "reasoning": "Multiple cases with alcohol-related presentations"}]\n';
  return prompt;
}

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 2A: CORE CATEGORIZATION (from original file)
// ═══════════════════════════════════════════════════════════════════════════

function runUltimateCategorization(mode, specificInput) {
  addUltimateCategorizationLog('═══════════════════════════════════════════════════════════');
  addUltimateCategorizationLog('🚀 ULTIMATE CATEGORIZATION STARTING');
  addUltimateCategorizationLog('═══════════════════════════════════════════════════════════');
  addUltimateCategorizationLog('Mode: ' + mode);

  try {
    if (mode !== 'all') {
      addUltimateCategorizationLog('⚠️ Mode "' + mode + '" not yet implemented');
      return { success: false, error: 'Mode not yet implemented' };
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const masterSheet = ss.getSheetByName('Master Scenario Convert');
    if (!masterSheet) {
      addUltimateCategorizationLog('❌ ERROR: Master sheet not found');
      return { success: false, error: 'Master sheet not found' };
    }

    const lastRow = masterSheet.getLastRow();
    const headers = masterSheet.getRange(2, 1, 1, masterSheet.getLastColumn()).getValues()[0];
    const data = masterSheet.getRange(3, 1, lastRow - 2, masterSheet.getLastColumn()).getValues();

    const cases = extractCasesForCategorization(data, headers);
    const mapping = getAccronymMapping();

    addUltimateCategorizationLog('📦 Processing ' + cases.length + ' cases in batches of 25');

    const batchSize = 25;
    let allResults = [];

    for (let i = 0; i < cases.length; i += batchSize) {
      const batch = cases.slice(i, Math.min(i + batchSize, cases.length));
      const batchNum = Math.floor(i / batchSize) + 1;
      addUltimateCategorizationLog('📦 BATCH ' + batchNum + ' (' + batch.length + ' cases)');
      const batchResults = processBatchWithOpenAI(batch, mapping);
      allResults = allResults.concat(batchResults);
      if (i + batchSize < cases.length) Utilities.sleep(1000);
    }

    addUltimateCategorizationLog('🎉 CATEGORIZATION COMPLETE! Total: ' + allResults.length);
    return { success: true, total: allResults.length };
  } catch (error) {
    addUltimateCategorizationLog('❌ FATAL ERROR: ' + error.message);
    return { success: false, error: error.message };
  }
}

function extractCasesForCategorization(data, headers) {
  const caseIDIdx = headers.indexOf('Case_Organization_Case_ID');
  const legacyIDIdx = headers.indexOf('Legacy_Case_ID');
  const symptomIdx = headers.indexOf('Case_Organization_Category_Symptom');
  const systemIdx = headers.indexOf('Case_Organization_Category_System');
  const cases = [];

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const caseID = row[caseIDIdx] || '';
    if (caseID) {
      cases.push({
        rowIndex: i + 3,
        caseID: caseID,
        legacyCaseID: row[legacyIDIdx] || '',
        currentSymptom: row[symptomIdx] || '',
        currentSystem: row[systemIdx] || '',
        chiefComplaint: row[4] || '',
        presentation: row[5] || '',
        diagnosis: row[6] || ''
      });
    }
  }
  return cases;
}

function processBatchWithOpenAI(cases, mapping) {
  const validSymptoms = Object.keys(mapping).join(', ');
  const validSystems = ['Cardiovascular', 'Respiratory', 'Gastrointestinal', 'Neurological', 'Endocrine', 'Infectious', 'Toxicology', 'Trauma', 'Pediatric', 'Gynecological', 'Psychiatric', 'Environmental'];
  const prompt = buildCategorizationPrompt(cases, validSymptoms, validSystems.join(', '));
  const apiKey = getOpenAIAPIKey();
  if (!apiKey) return [];

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
        messages: [{ role: 'user', content: prompt }]
      }),
      muteHttpExceptions: true
    });

    if (response.getResponseCode() !== 200) return [];
    const result = JSON.parse(response.getContentText());
    const content = result.choices[0].message.content;

    let categorizations = [];
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) categorizations = JSON.parse(jsonMatch[0]);

    writeCategorizationResults(cases, categorizations);
    return categorizations;
  } catch (error) {
    addUltimateCategorizationLog('❌ API call failed: ' + error.message);
    return [];
  }
}

function buildCategorizationPrompt(cases, validSymptoms, validSystems) {
  let prompt = 'You are a medical education expert. Categorize these emergency medicine cases.\n\n';
  prompt += 'Valid symptoms: ' + validSymptoms + '\n';
  prompt += 'Valid systems: ' + validSystems + '\n\n';
  prompt += 'Cases:\n';
  cases.forEach(function(c, i) {
    prompt += (i + 1) + '. ' + c.caseID + ': ' + c.chiefComplaint + ' - ' + c.diagnosis + '\n';
  });
  prompt += '\nReturn JSON: [{"caseID": "...", "symptom": "...", "symptomName": "...", "system": "...", "reasoning": "..."}]\n';
  return prompt;
}

function writeCategorizationResults(cases, categorizations) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let resultsSheet = ss.getSheetByName('AI_Categorization_Results');

  if (!resultsSheet) {
    resultsSheet = ss.insertSheet('AI_Categorization_Results');
    resultsSheet.getRange(1, 1, 2, 14).setValues([
      ['Case_ID', 'Legacy_Case_ID', 'Current_Symptom', 'Current_System', 'Current_Symptom_Name', 'Suggested_Symptom', 'Suggested_Symptom_Name', 'Suggested_System', 'Reasoning', 'Confidence', 'Status', '', 'Final_Symptom', 'Final_System'],
      ['(from Master)', '(from Master)', '(existing)', '(existing)', '(existing)', '(AI)', '(AI)', '(AI)', '(AI)', '(AI)', '(match/new/conflict)', '', '(to apply)', '(to apply)']
    ]);
  }

  const existingLastRow = resultsSheet.getLastRow();
  let existingCaseIDs = new Set();
  if (existingLastRow > 2) {
    const existingData = resultsSheet.getRange(3, 1, existingLastRow - 2, 14).getValues();
    existingData.forEach(function(row) { if (row[0]) existingCaseIDs.add(row[0]); });
  }

  let nextRow = resultsSheet.getLastRow() + 1;
  cases.forEach(function(caseData, idx) {
    if (existingCaseIDs.has(caseData.caseID)) return;
    const cat = categorizations[idx] || {};
    const suggestedSymptom = cat.symptom || '';
    const suggestedSystem = cat.system || '';
    let status = 'new';
    if (caseData.currentSymptom && caseData.currentSymptom === suggestedSymptom) status = 'match';
    else if (caseData.currentSymptom && caseData.currentSymptom !== suggestedSymptom) status = 'conflict';

    resultsSheet.getRange(nextRow, 1, 1, 14).setValues([[
      caseData.caseID, caseData.legacyCaseID, caseData.currentSymptom, caseData.currentSystem, '',
      suggestedSymptom, cat.symptomName || '', suggestedSystem, cat.reasoning || '', 'medium', status, '',
      suggestedSymptom, suggestedSystem
    ]]);
    nextRow++;
  });
}

function getOpenAIAPIKey() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const settingsSheet = ss.getSheetByName('Settings');
    if (!settingsSheet) return null;
    return settingsSheet.getRange('B2').getValue() || null;
  } catch (error) {
    return null;
  }
}

function getAccronymMapping() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const mappingSheet = ss.getSheetByName('accronym_symptom_system_mapping');
  if (!mappingSheet) return {};

  const data = mappingSheet.getDataRange().getValues();
  const mapping = {};
  for (let i = 1; i < data.length; i++) {
    if (data[i][0]) mapping[data[i][0]] = data[i][1];
  }
  return mapping;
}

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 2D: APPLY, EXPORT, CLEAR (from original file)
// ═══════════════════════════════════════════════════════════════════════════

function applyUltimateCategorizationToMaster() {
  addUltimateCategorizationLog('✅ APPLY TO MASTER - STARTING');
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const resultsSheet = ss.getSheetByName('AI_Categorization_Results');
    if (!resultsSheet) return { success: false, error: 'Results sheet not found' };

    const resultsLastRow = resultsSheet.getLastRow();
    if (resultsLastRow <= 2) return { success: false, error: 'No results to apply' };

    const resultsData = resultsSheet.getRange(3, 1, resultsLastRow - 2, 14).getValues();
    const masterSheet = ss.getSheetByName('Master Scenario Convert');
    if (!masterSheet) return { success: false, error: 'Master sheet not found' };

    const masterHeaders = masterSheet.getRange(2, 1, 1, masterSheet.getLastColumn()).getValues()[0];
    const caseIDIdx = masterHeaders.indexOf('Case_Organization_Case_ID');
    const symptomIdx = masterHeaders.indexOf('Case_Organization_Category_Symptom');
    const systemIdx = masterHeaders.indexOf('Case_Organization_Category_System');

    const masterLastRow = masterSheet.getLastRow();
    const masterData = masterSheet.getRange(3, 1, masterLastRow - 2, masterSheet.getLastColumn()).getValues();

    const caseIDtoRowIndex = {};
    masterData.forEach(function(row, idx) {
      if (row[caseIDIdx]) caseIDtoRowIndex[row[caseIDIdx]] = idx + 3;
    });

    let updatedCount = 0;
    resultsData.forEach(function(resultRow) {
      const caseID = resultRow[0];
      const finalSymptom = resultRow[12];
      const finalSystem = resultRow[13];
      const masterRowNum = caseIDtoRowIndex[caseID];
      if (masterRowNum) {
        if (finalSymptom) masterSheet.getRange(masterRowNum, symptomIdx + 1).setValue(finalSymptom);
        if (finalSystem) masterSheet.getRange(masterRowNum, systemIdx + 1).setValue(finalSystem);
        updatedCount++;
      }
    });

    addUltimateCategorizationLog('🎉 APPLY COMPLETE! Updated: ' + updatedCount);
    return { success: true, updated: updatedCount };
  } catch (error) {
    addUltimateCategorizationLog('❌ ERROR: ' + error.message);
    return { success: false, error: error.message };
  }
}

function exportUltimateCategorizationResults() {
  addUltimateCategorizationLog('💾 EXPORT RESULTS - STARTING');
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const resultsSheet = ss.getSheetByName('AI_Categorization_Results');
    if (!resultsSheet) return { success: false, error: 'Results sheet not found' };

    const lastRow = resultsSheet.getLastRow();
    if (lastRow <= 2) return { success: false, error: 'No data to export' };

    const allData = resultsSheet.getRange(1, 1, lastRow, resultsSheet.getLastColumn()).getValues();
    let csv = '';
    allData.forEach(function(row) {
      const csvRow = row.map(function(cell) {
        const cellStr = String(cell || '');
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
          return '"' + cellStr.replace(/"/g, '""') + '"';
        }
        return cellStr;
      }).join(',');
      csv += csvRow + '\n';
    });

    addUltimateCategorizationLog('🎉 EXPORT COMPLETE! Rows: ' + allData.length);
    return { success: true, csv: csv, rows: allData.length };
  } catch (error) {
    addUltimateCategorizationLog('❌ ERROR: ' + error.message);
    return { success: false, error: error.message };
  }
}

function clearUltimateCategorizationResults() {
  addUltimateCategorizationLog('🗑️ CLEAR RESULTS - STARTING');
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const resultsSheet = ss.getSheetByName('AI_Categorization_Results');
    if (!resultsSheet) return { success: false, error: 'Results sheet not found' };

    const lastRow = resultsSheet.getLastRow();
    const dataRows = lastRow - 2;
    if (dataRows <= 0) return { success: true, deleted: 0 };

    resultsSheet.deleteRows(3, dataRows);
    PropertiesService.getDocumentProperties().deleteProperty('Ultimate_Categorization_Logs');

    addUltimateCategorizationLog('🎉 CLEAR COMPLETE! Deleted: ' + dataRows);
    return { success: true, deleted: dataRows };
  } catch (error) {
    addUltimateCategorizationLog('❌ ERROR: ' + error.message);
    return { success: false, error: error.message };
  }
}
