/**
 * PHASE 2: ENHANCED CATEGORIES & PATHWAYS PANEL (WITH AI CATEGORIZATION)
 *
 * Updated to include AI Auto-Categorization review interface
 */

/**
 * Open Categories & Pathways Panel (with AI Discovery tab + AI Categorization)
 */
function openCategoriesPathwaysPanel() {
  const ui = getSafeUi_();
  if (!ui) return;

  const html = buildCategoriesPathwaysMainMenu_();
  ui.showSidebar(HtmlService.createHtmlOutput(html).setTitle('📂 Categories & Pathways').setWidth(400));
}

/**
 * Build main menu with tabbed interface (including AI categorization)
 */
function buildCategoriesPathwaysMainMenu_() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Master Scenario Convert');

  if (!sheet) {
    return '<p style="padding:20px;">Error: Master Scenario Convert sheet not found</p>';
  }

  const data = sheet.getDataRange().getValues();

  if (!data || data.length < 2) {
    return '<p style="padding:20px;">Error: Sheet has insufficient data (need at least 2 rows)</p>';
  }

  const headers = data[1]; // Row 2

  if (!headers) {
    return '<p style="padding:20px;">Error: Header row (row 2) not found</p>';
  }

  // Get column indices
  const categoryIdx = headers.indexOf('Case_Organization_Category_Symptom');
  const pathwayIdx = headers.indexOf('Case_Organization:Pathway_Name');

  // Count categories and pathways
  const categoryCounts = {};
  const pathwayCounts = {};

  for (let i = 2; i < data.length; i++) {
    const category = data[i][categoryIdx] || 'Uncategorized';
    const pathway = data[i][pathwayIdx] || 'Unassigned';

    categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    pathwayCounts[pathway] = (pathwayCounts[pathway] || 0) + 1;
  }

  const totalCases = data.length - 2;

  // Build category list
  const categoryList = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([cat, count]) => `
      <div class="list-item" onclick="viewCategory('${cat.replace(/'/g, "\\'")}')">
        <span class="item-label">${cat}</span>
        <span class="item-count">${count}</span>
      </div>
    `).join('');

  // Build pathway list (top 10)
  const pathwayList = Object.entries(pathwayCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([path, count]) => `
      <div class="list-item" onclick="viewPathway('${path.replace(/'/g, "\\'")}')">
        <span class="item-label">${path}</span>
        <span class="item-count">${count}</span>
      </div>
    `).join('');

  // Get logic types for AI Discovery tab
  const logicTypes = getLogicTypesForDropdown();
  const logicTypeOptions = logicTypes.map(lt => {
    const usageLabel = lt.timesUsed > 0 ? ` (${lt.timesUsed} uses)` : '';
    return `<option value="${lt.id}">${lt.name}${usageLabel}</option>`;
  }).join('');

  // Get categorization stats (if results exist)
  const categorizationStats = getCategorizationStats();

  return `
<!DOCTYPE html>
<html>
<head>
  <base target="_top">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: Arial, sans-serif;
      background: #f5f7fa;
      color: #2c3e50;
      font-size: 13px;
    }

    /* Tab Navigation */
    .tabs {
      display: flex;
      background: #fff;
      border-bottom: 2px solid #dfe3e8;
    }

    .tab {
      flex: 1;
      padding: 12px 8px;
      text-align: center;
      cursor: pointer;
      border-bottom: 3px solid transparent;
      transition: all 0.2s;
      font-size: 12px;
      font-weight: 600;
      color: #7f8c9d;
    }

    .tab:hover {
      background: #f8f9fa;
      color: #2c3e50;
    }

    .tab.active {
      color: #3b7ddd;
      border-bottom-color: #3b7ddd;
      background: #f8f9fa;
    }

    .tab-content {
      display: none;
    }

    .tab-content.active {
      display: block;
    }

    .header {
      background: #fff;
      padding: 16px;
      border-bottom: 1px solid #dfe3e8;
    }

    .header h1 {
      font-size: 16px;
      font-weight: 600;
      color: #2c3e50;
      margin-bottom: 4px;
    }

    .header .subtitle {
      font-size: 12px;
      color: #7f8c9d;
    }

    .stats {
      background: #fff;
      padding: 12px 16px;
      border-bottom: 1px solid #dfe3e8;
      display: flex;
      justify-content: space-around;
    }

    .stat {
      text-align: center;
    }

    .stat .num {
      font-size: 20px;
      font-weight: 700;
      color: #3b7ddd;
      display: block;
    }

    .stat .label {
      font-size: 11px;
      color: #7f8c9d;
      text-transform: uppercase;
    }

    .section {
      background: #fff;
      margin: 12px;
      padding: 14px;
      border-radius: 6px;
      border: 1px solid #dfe3e8;
    }

    .section-title {
      font-size: 13px;
      font-weight: 600;
      color: #2c3e50;
      margin-bottom: 10px;
      padding-bottom: 8px;
      border-bottom: 1px solid #f0f2f5;
    }

    .btn {
      display: block;
      width: 100%;
      background: #fff;
      border: 1px solid #d1d7de;
      color: #2c3e50;
      padding: 10px 12px;
      margin-bottom: 8px;
      border-radius: 4px;
      cursor: pointer;
      text-align: left;
      font-size: 13px;
      transition: all 0.2s;
    }

    .btn:hover {
      background: #f5f7fa;
      border-color: #3b7ddd;
    }

    .btn-primary {
      background: #3b7ddd;
      color: #fff;
      border-color: #3b7ddd;
      font-weight: 600;
    }

    .btn-primary:hover {
      background: #2d6bc6;
    }

    .btn-success {
      background: #28a745;
      color: #fff;
      border-color: #28a745;
      font-weight: 600;
    }

    .btn-success:hover {
      background: #218838;
    }

    .btn:disabled {
      background: #d1d7de;
      cursor: not-allowed;
      opacity: 0.6;
    }

    .list-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 10px;
      margin-bottom: 4px;
      background: #f8f9fa;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .list-item:hover {
      background: #e9ecef;
    }

    .item-label {
      font-size: 13px;
      color: #2c3e50;
    }

    .item-count {
      font-size: 12px;
      color: #7f8c9d;
      background: #fff;
      padding: 2px 8px;
      border-radius: 10px;
    }

    .scrollable {
      max-height: 200px;
      overflow-y: auto;
    }

    .scrollable::-webkit-scrollbar {
      width: 6px;
    }

    .scrollable::-webkit-scrollbar-track {
      background: #f0f2f5;
    }

    .scrollable::-webkit-scrollbar-thumb {
      background: #d1d7de;
      border-radius: 3px;
    }

    .info {
      background: #e8f4fd;
      border: 1px solid #bee5eb;
      padding: 10px 12px;
      border-radius: 4px;
      font-size: 12px;
      color: #31708f;
      margin-top: 12px;
    }

    .warning {
      background: #fff3cd;
      border: 1px solid #ffc107;
      padding: 10px 12px;
      border-radius: 4px;
      font-size: 12px;
      color: #856404;
      margin-top: 12px;
    }

    /* AI Discovery Tab Specific Styles */
    select {
      width: 100%;
      padding: 10px;
      font-size: 13px;
      border: 1px solid #d1d7de;
      border-radius: 4px;
      margin-bottom: 12px;
      background: #fff;
    }

    select:focus {
      outline: none;
      border-color: #3b7ddd;
    }

    .help-text {
      font-size: 11px;
      color: #7f8c9d;
      margin: -8px 0 12px 0;
    }

    .pathway-card {
      margin-bottom: 12px;
      padding: 12px;
      background: #f8f9fa;
      border-radius: 4px;
      border-left: 4px solid #3b7ddd;
    }

    .pathway-card strong {
      font-size: 13px;
      color: #2c3e50;
    }

    .tier-badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
      margin-left: 8px;
    }

    .tier-s { background: #ffd700; color: #000; }
    .tier-a { background: #c0c0c0; color: #000; }
    .tier-b { background: #cd7f32; color: #fff; }
    .tier-c { background: #e8eaed; color: #000; }
    .tier-d { background: #f1f3f4; color: #5f6368; }

    .pathway-desc {
      margin: 8px 0;
      font-size: 12px;
      color: #5f6368;
    }

    .pathway-persuasion {
      margin: 8px 0;
      font-size: 12px;
      color: #5f6368;
      font-style: italic;
      padding: 8px;
      background: #fff;
      border-radius: 4px;
    }

    .pathway-meta {
      margin: 8px 0;
      font-size: 11px;
      color: #7f8c9d;
    }

    #results-container {
      display: none;
      margin-top: 12px;
    }

    #results-container.visible {
      display: block;
    }

    /* AI Categorization Review Styles */
    #ai-review-container {
      display: none;
    }

    #ai-review-container.visible {
      display: block;
    }

    .review-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
      margin-top: 12px;
    }

    .review-table th {
      background: #2a3040;
      color: #e7eaf0;
      padding: 8px;
      text-align: left;
      font-size: 11px;
      text-transform: uppercase;
    }

    .review-table td {
      padding: 8px;
      border-bottom: 1px solid #dfe3e8;
    }

    .review-table tr:hover {
      background: #f8f9fa;
    }

    .status-badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
    }

    .status-new { background: #e8f5e9; color: #2e7d32; }
    .status-matches { background: #f1f8ff; color: #0366d6; }
    .status-conflict { background: #fff3e0; color: #e65100; }
    .status-error { background: #ffebee; color: #c62828; }

    .category-current {
      color: #ff9800;
      font-weight: 600;
    }

    .category-suggested {
      color: #4caf50;
      font-weight: 600;
    }

    .mini-select {
      width: 100%;
      padding: 4px;
      font-size: 11px;
      border: 1px solid #d1d7de;
      border-radius: 3px;
    }

    .btn-mini {
      padding: 4px 8px;
      font-size: 11px;
      margin: 2px;
    }

    .filter-bar {
      display: flex;
      gap: 8px;
      margin-bottom: 12px;
      align-items: center;
    }

    .filter-bar select {
      flex: 1;
      margin: 0;
    }

    .stats-mini {
      display: flex;
      gap: 12px;
      padding: 10px;
      background: #f8f9fa;
      border-radius: 4px;
      margin-bottom: 12px;
    }

    .stats-mini .stat-mini {
      flex: 1;
      text-align: center;
    }

    .stats-mini .stat-mini .num {
      display: block;
      font-size: 18px;
      font-weight: 700;
      color: #2c3e50;
    }

    .stats-mini .stat-mini .label {
      display: block;
      font-size: 10px;
      color: #7f8c9d;
      text-transform: uppercase;
    }
  </style>
</head>
<body>
  <!-- Tab Navigation -->
  <div class="tabs">
    <div class="tab active" onclick="switchTab('categories')">📊 Categories</div>
    <div class="tab" onclick="switchTab('discovery')">🔍 AI Discovery</div>
  </div>

  <!-- Tab 1: Categories (Enhanced with AI Categorization) -->
  <div id="categories-tab" class="tab-content active">
    <div class="header">
      <h1>📂 Categories & Pathways</h1>
      <div class="subtitle">AI-powered categorization + manual organization</div>
    </div>

    <div class="stats">
      <div class="stat">
        <span class="num">${totalCases}</span>
        <span class="label">Cases</span>
      </div>
      <div class="stat">
        <span class="num">${Object.keys(categoryCounts).length}</span>
        <span class="label">Categories</span>
      </div>
      <div class="stat">
        <span class="num">${Object.keys(pathwayCounts).length}</span>
        <span class="label">Pathways</span>
      </div>
    </div>

    <!-- AI Categorization Section -->
    <div class="section">
      <div class="section-title">🤖 AI Auto-Categorization</div>
      <button id="run-ai-btn" class="btn btn-success" onclick="runAICategorization()">
        🚀 Run AI Categorization (All 207 Cases)
      </button>
      <button class="btn btn-danger" onclick="clearAIResults()">
        🗑️ Clear Results
      </button>
      <button class="btn" onclick="editCategoryMappings()">
        ⚙️ Edit Category Mappings (Symptoms & Systems)
      </button>
      <div class="help-text">
        AI will analyze all cases and suggest Symptom + System categories.
        Review and adjust before applying to Master Scenario Convert.
      </div>
    </div>

    <!-- AI Review Container (shows after AI run) -->
    <div id="ai-review-container">
      <div class="section">
        <div class="section-title">📋 Review AI Suggestions</div>

        <!-- Stats -->
        <div class="stats-mini">
          <div class="stat-mini">
            <span class="num" id="stat-new">${categorizationStats.new}</span>
            <span class="label">New</span>
          </div>
          <div class="stat-mini">
            <span class="num" id="stat-matches">${categorizationStats.matches}</span>
            <span class="label">Matches</span>
          </div>
          <div class="stat-mini">
            <span class="num" id="stat-conflicts">${categorizationStats.conflicts}</span>
            <span class="label">Conflicts</span>
          </div>
          <div class="stat-mini">
            <span class="num" id="stat-errors">${categorizationStats.errors}</span>
            <span class="label">Errors</span>
          </div>
        </div>

        <!-- Filter Bar -->
        <div class="filter-bar">
          <select id="filter-status" onchange="filterResults()">
            <option value="all">All Cases</option>
            <option value="new">New (Uncategorized)</option>
            <option value="matches">Matches (AI Agrees)</option>
            <option value="conflicts">Conflicts (AI Disagrees)</option>
            <option value="errors">Errors</option>
          </select>
          <button class="btn btn-mini" onclick="refreshReviewData()">🔄 Refresh</button>
        </div>

        <!-- Results Table (loaded via AJAX) -->
        <div id="review-results" class="scrollable" style="max-height: 400px;">
          <p class="help-text">Click "Refresh" to load AI categorization results</p>
        </div>

        <!-- Action Buttons -->
        <button id="apply-btn" class="btn btn-primary" onclick="applyCategorizations()" style="margin-top: 12px;">
          ✅ Apply Selected Categories to Master
        </button>
        <button class="btn" onclick="exportCategorizationResults()">
          💾 Export Results to CSV
        </button>
      </div>
    </div>

    <!-- Manual Actions Section -->
    <div class="section">
      <div class="section-title">Manual Actions</div>
      <button class="btn" onclick="viewAllCategories()">📊 View All Categories</button>
      <button class="btn" onclick="viewAllPathways()">🧩 View All Pathways</button>
      <button class="btn" onclick="assignCase()">🔗 Assign Case to Category/Pathway</button>
    </div>

    <!-- Category List -->
    <div class="section">
      <div class="section-title">Medical System Categories</div>
      <div class="scrollable">
        ${categoryList || '<div class="info">No categories found</div>'}
      </div>
    </div>

    <!-- Pathway List -->
    <div class="section">
      <div class="section-title">Learning Pathways (Top 10)</div>
      <div class="scrollable">
        ${pathwayList || '<div class="info">No pathways found</div>'}
      </div>
    </div>
  </div>

  <!-- Tab 2: AI Discovery (Existing) -->
  <div id="discovery-tab" class="tab-content">
    <div class="header">
      <h1>🔍 AI Pathway Discovery</h1>
      <div class="subtitle">Discover high-value learning pathways using AI</div>
    </div>

    <div class="section">
      <div class="section-title">Discovery Lens (Logic Type)</div>
      <select id="logic-type-selector" onchange="handleLogicTypeChange()">
        <option value="">-- Select Logic Type --</option>
        ${logicTypeOptions}
        <option value="" disabled>──────────────────</option>
        <option value="CREATE_NEW">🎨 Create New Logic Type...</option>
      </select>
      <div class="help-text">Most frequently used logic types appear first</div>

      <button id="discover-btn" class="btn btn-primary" onclick="discoverPathways()" disabled>
        🤖 Discover Pathways
      </button>
    </div>

    <div id="results-container">
      <div class="section">
        <div class="section-title">Discovery Results</div>
        <div id="results-content"></div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Manage Logic Types</div>
      <button class="btn" onclick="viewLogicTypeLibrary()">📚 View Logic Type Library</button>
      <button class="btn" onclick="viewPathwaysMaster()">📊 View All Discovered Pathways</button>
    </div>
  </div>

  <script>
    // Global state
    let currentFilter = 'all';
    let categorizationData = [];

    // ========================================================================
    // TAB SWITCHING
    // ========================================================================

    function switchTab(tabName) {
      // Update tab buttons
      document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
      event.target.classList.add('active');

      // Update tab content
      document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
      document.getElementById(tabName + '-tab').classList.add('active');
    }

    // ========================================================================
    // CATEGORIES TAB - MANUAL ACTIONS (EXISTING)
    // ========================================================================

    function viewCategory(category) {
      google.script.run
        .withSuccessHandler(html => document.body.innerHTML = html)
        .getCategoryView(category);
    }

    function viewPathway(pathway) {
      google.script.run
        .withSuccessHandler(html => document.body.innerHTML = html)
        .getPathwayView(pathway);
    }

    function viewAllCategories() {
      google.script.run
        .withSuccessHandler(html => document.body.innerHTML = html)
        .getAllCategoriesView();
    }

    function viewAllPathways() {
      google.script.run
        .withSuccessHandler(html => document.body.innerHTML = html)
        .getAllPathwaysView();
    }

    function assignCase() {
      google.script.run
        .withSuccessHandler(html => document.body.innerHTML = html)
        .getCaseAssignmentView();
    }

    // ========================================================================
    // AI CATEGORIZATION FUNCTIONS (NEW)
    // ========================================================================

    /**
     * Run AI Categorization on all 207 cases
     */
    function runAICategorization() {
      const btn = document.getElementById('run-ai-btn');

      if (!confirm('Run AI categorization on all 207 cases?\\n\\nThis will take 2-3 minutes and cost ~$0.20.\\n\\nResults will be saved to AI_Categorization_Results sheet for review.')) {
        return;
      }

      btn.disabled = true;
      btn.textContent = '🔄 Running AI Categorization...';
      btn.style.background = '#ffc107';

      google.script.run
        .withSuccessHandler(handleAICategorizationComplete)
        .withFailureHandler(handleAICategorizationError)
        .runAICategorization();
    }

    function handleAICategorizationComplete(result) {
      const btn = document.getElementById('run-ai-btn');
      btn.disabled = false;
      btn.textContent = '✅ AI Categorization Complete';
      btn.style.background = '#28a745';

      alert('✅ AI Categorization Complete!\\n\\n' +
            'Total cases processed: ' + result.totalCases + '\\n' +
            'Results saved to: ' + result.resultsSheetName + '\\n\\n' +
            'Click "Refresh" below to review results.');

      // Show review container
      document.getElementById('ai-review-container').classList.add('visible');

      // Auto-refresh review data
      setTimeout(refreshReviewData, 500);
    }

    function handleAICategorizationError(error) {
      const btn = document.getElementById('run-ai-btn');
      btn.disabled = false;
      btn.textContent = '🚀 Run AI Categorization (All 207 Cases)';
      btn.style.background = '#28a745';

      alert('❌ Error during AI categorization:\\n\\n' + error.message);
    }

    /**
     * Clear AI Categorization Results sheet
     */
    function clearAIResults() {
      if (!confirm('Clear all AI categorization results?\\n\\nThis will delete the AI_Categorization_Results sheet.\\n\\nThis action cannot be undone.')) {
        return;
      }

      google.script.run
        .withSuccessHandler(handleClearSuccess)
        .withFailureHandler(handleClearError)
        .clearAICategorizationResults();
    }

    function handleClearSuccess() {
      alert('✅ Results cleared successfully!\\n\\nThe AI_Categorization_Results sheet has been cleared.');

      // Hide review container
      document.getElementById('ai-review-container').classList.remove('visible');

      // Clear review results display
      document.getElementById('review-results').innerHTML = '<p class="info">No results found. Run AI Categorization first.</p>';
    }

    function handleClearError(error) {
      alert('❌ Error clearing results:\\n\\n' + error.message);
    }

    /**
     * Refresh review data from AI_Categorization_Results sheet
     */
    function refreshReviewData() {
      document.getElementById('review-results').innerHTML = '<p class="help-text">⏳ Loading results...</p>';

      google.script.run
        .withSuccessHandler(handleReviewDataLoaded)
        .withFailureHandler(handleReviewDataError)
        .getCategorizationResults(currentFilter, 1, 50);
    }

    function handleReviewDataLoaded(data) {
      categorizationData = data.results;

      if (categorizationData.length === 0) {
        document.getElementById('review-results').innerHTML = '<p class="info">No results found. Run AI Categorization first.</p>';
        return;
      }

      // Update stats
      google.script.run
        .withSuccessHandler(updateStats)
        .getCategorizationStats();

      // Build table HTML
      let html = '<table class="review-table">';
      html += '<thead><tr>';
      html += '<th>Case ID</th>';
      html += '<th>Status</th>';
      html += '<th>Current</th>';
      html += '<th>AI Suggested</th>';
      html += '<th>Final Decision</th>';
      html += '</tr></thead>';
      html += '<tbody>';

      categorizationData.forEach(function(result) {
        const statusClass = 'status-' + result.status;

        html += '<tr>';
        html += '<td>' + result.caseID + '</td>';
        html += '<td><span class="status-badge ' + statusClass + '">' + result.status + '</span></td>';
        html += '<td class="category-current">' + result.currentSymptom + ' / ' + result.currentSystem + '</td>';
        html += '<td class="category-suggested">' + result.suggestedSymptom + ' / ' + result.suggestedSystem + '</td>';
        html += '<td>';
        html += '  <select class="mini-select" data-case-id="' + result.legacyCaseID + '" data-field="symptom">';
        html += '    <option value="' + result.suggestedSymptom + '" selected>' + result.suggestedSymptom + '</option>';
        if (result.currentSymptom) {
          html += '  <option value="' + result.currentSymptom + '">Keep: ' + result.currentSymptom + '</option>';
        }
        html += '  </select>';
        html += '  <select class="mini-select" data-case-id="' + result.legacyCaseID + '" data-field="system">';
        html += '    <option value="' + result.suggestedSystem + '" selected>' + result.suggestedSystem + '</option>';
        if (result.currentSystem) {
          html += '  <option value="' + result.currentSystem + '">Keep: ' + result.currentSystem + '</option>';
        }
        html += '  </select>';
        html += '</td>';
        html += '</tr>';
      });

      html += '</tbody></table>';

      document.getElementById('review-results').innerHTML = html;
    }

    function handleReviewDataError(error) {
      document.getElementById('review-results').innerHTML = '<p class="warning">❌ Error loading results: ' + error.message + '</p>';
    }

    function updateStats(stats) {
      document.getElementById('stat-new').textContent = stats.new;
      document.getElementById('stat-matches').textContent = stats.matches;
      document.getElementById('stat-conflicts').textContent = stats.conflicts;
      document.getElementById('stat-errors').textContent = stats.errors;
    }

    /**
     * Filter results by status
     */
    function filterResults() {
      currentFilter = document.getElementById('filter-status').value;
      refreshReviewData();
    }

    /**
     * Apply categorizations to Master Scenario Convert
     */
    function applyCategorizations() {
      if (!confirm('Apply all final categorizations to Master Scenario Convert?\\n\\nThis will update 4 columns for each case:\\n- Category_Symptom (Column X)\\n- Category_System (Column Y)\\n- Category_Symptom_Name (Column 16)\\n- Category_System_Name (Column 17)\\n\\nA backup will be created before updating.')) {
        return;
      }

      const btn = document.getElementById('apply-btn');
      btn.disabled = true;
      btn.textContent = '⏳ Applying categorizations...';

      google.script.run
        .withSuccessHandler(handleApplyComplete)
        .withFailureHandler(handleApplyError)
        .applyCategorization('all');
    }

    function handleApplyComplete(result) {
      const btn = document.getElementById('apply-btn');
      btn.disabled = false;
      btn.textContent = '✅ Apply Selected Categories to Master';

      if (result.success) {
        alert('✅ Categorization applied successfully!\\n\\n' +
              'Cases updated: ' + result.updated + '\\n' +
              'Errors: ' + result.errors + '\\n' +
              'Backup: ' + result.backup);
      } else {
        alert('❌ Application cancelled or failed:\\n\\n' + result.message);
      }
    }

    function handleApplyError(error) {
      const btn = document.getElementById('apply-btn');
      btn.disabled = false;
      btn.textContent = '✅ Apply Selected Categories to Master';

      alert('❌ Error applying categorizations:\\n\\n' + error.message);
    }

    /**
     * Export categorization results to CSV
     */
    function exportCategorizationResults() {
      alert('Export to CSV feature coming soon!');
    }

    /**
     * Open Category Mappings Editor
     */
    function editCategoryMappings() {
      google.script.run
        .withSuccessHandler(html => {
          const div = document.createElement('div');
          div.innerHTML = html;
          document.body.appendChild(div);
        })
        .openCategoryMappingsEditor();
    }

    // ========================================================================
    // AI DISCOVERY TAB FUNCTIONS (EXISTING)
    // ========================================================================

    function handleLogicTypeChange() {
      const value = document.getElementById('logic-type-selector').value;

      if (value === 'CREATE_NEW') {
        alert('Create New Logic Type feature coming soon!');
        document.getElementById('logic-type-selector').value = '';
        document.getElementById('discover-btn').disabled = true;
      } else if (value) {
        document.getElementById('discover-btn').disabled = false;
      } else {
        document.getElementById('discover-btn').disabled = true;
      }
    }

    function discoverPathways() {
      const logicTypeId = document.getElementById('logic-type-selector').value;

      if (!logicTypeId || logicTypeId === 'CREATE_NEW') {
        alert('Please select a logic type first');
        return;
      }

      // Show loading
      const btn = document.getElementById('discover-btn');
      btn.disabled = true;
      btn.textContent = '🔄 Discovering...';

      // Hide previous results
      document.getElementById('results-container').classList.remove('visible');

      // Call server-side discovery function
      google.script.run
        .withSuccessHandler(handleDiscoveryResults)
        .withFailureHandler(handleDiscoveryError)
        .discoverPathwaysWithLogicType(logicTypeId);
    }

    function handleDiscoveryResults(result) {
      const btn = document.getElementById('discover-btn');
      btn.disabled = false;
      btn.textContent = '🤖 Discover Pathways';

      if (!result.success) {
        alert('Error: ' + result.error);
        return;
      }

      // Build results HTML
      let html = '<p style="margin-bottom: 12px;"><strong>' + result.pathwaysCount + ' pathways discovered using "' + result.logicType + '"</strong></p>';

      result.pathways.forEach(function(sp, idx) {
        const p = sp.pathway;
        const s = sp.scoring;
        const tierClass = 'tier-' + s.tier.charAt(0).toLowerCase();

        html += '<div class="pathway-card">';
        html += '<strong>' + (idx + 1) + '. ' + p.name + '</strong>';
        html += '<span class="tier-badge ' + tierClass + '">' + s.tier + '</span>';
        html += '<div class="pathway-desc">' + p.description + '</div>';
        html += '<div class="pathway-persuasion">"' + s.persuasion.persuasion_narrative + '"</div>';
        html += '<div class="pathway-meta">📊 Score: ' + s.composite_score + '/10 | 📚 ' + p.caseIds.length + ' cases | 🎯 ' + p.targetLearner + '</div>';
        html += '</div>';
      });

      document.getElementById('results-content').innerHTML = html;
      document.getElementById('results-container').classList.add('visible');

      // Success message
      alert('✅ Discovery complete! ' + result.pathwaysCount + ' pathways saved to Pathways_Master sheet.');
    }

    function handleDiscoveryError(error) {
      const btn = document.getElementById('discover-btn');
      btn.disabled = false;
      btn.textContent = '🤖 Discover Pathways';

      alert('Error during discovery: ' + error.message);
    }

    function viewLogicTypeLibrary() {
      google.script.run
        .withSuccessHandler(function() {
          alert('Logic Type Library is now active');
        })
        .manageLogicTypes();
    }

    function viewPathwaysMaster() {
      google.script.run
        .withSuccessHandler(function() {
          alert('Pathways_Master sheet is now active');
        })
        .viewAllPathways();
    }

    // ========================================================================
    // AUTO-SHOW AI REVIEW IF RESULTS EXIST
    // ========================================================================

    // Check if AI results exist on load
    if (${categorizationStats.total} > 0) {
      document.getElementById('ai-review-container').classList.add('visible');
    }
  </script>
</body>
</html>
  `;
}


/**
 * Open Category Mappings Editor (NEW)
 * Allows user to edit symptom/system definitions
 */
function openCategoryMappingsEditor() {
  const ui = getSafeUi_();
  if (!ui) return;

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const mappingSheet = ss.getSheetByName('accronym_symptom_system_mapping');

  if (!mappingSheet) {
    ui.alert('Error', 'Mapping sheet not found: accronym_symptom_system_mapping', ui.ButtonSet.OK);
    return;
  }

  // Get current mappings
  const data = mappingSheet.getDataRange().getValues();
  const headers = data[0];

  let mappingRows = '';
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    mappingRows += `
      <tr>
        <td><input type="text" value="${row[0]}" data-col="0" data-row="${i}" /></td>
        <td><input type="text" value="${row[1]}" data-col="1" data-row="${i}" /></td>
        <td><input type="text" value="${row[2]}" data-col="2" data-row="${i}" /></td>
        <td><input type="text" value="${row[3]}" data-col="3" data-row="${i}" /></td>
        <td><button onclick="deleteRow(${i})">🗑️</button></td>
      </tr>
    `;
  }

  const html = HtmlService.createHtmlOutput(`
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        h2 { color: #2c3e50; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { padding: 10px; border: 1px solid #dfe3e8; text-align: left; }
        th { background: #2a3040; color: #e7eaf0; }
        input { width: 100%; padding: 6px; border: 1px solid #d1d7de; border-radius: 3px; }
        button { padding: 8px 16px; background: #3b7ddd; color: #fff; border: none; border-radius: 4px; cursor: pointer; }
        button:hover { background: #2d6bc6; }
        .btn-danger { background: #dc3545; }
        .btn-danger:hover { background: #c82333; }
        .btn-success { background: #28a745; }
        .btn-success:hover { background: #218838; }
      </style>
    </head>
    <body>
      <h2>⚙️ Edit Category Mappings</h2>
      <p>Manage symptom accronyms and system categories used for AI categorization.</p>

      <table id="mappings-table">
        <thead>
          <tr>
            <th>Accronym</th>
            <th>Symptom (Pre-Category)</th>
            <th>System (Post-Category)</th>
            <th>Alt System</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${mappingRows}
        </tbody>
      </table>

      <button onclick="addNewRow()" style="margin-top: 16px;">➕ Add New Mapping</button>
      <button onclick="saveMappings()" class="btn-success" style="margin-top: 16px;">💾 Save All Changes</button>

      <script>
        function addNewRow() {
          const tbody = document.querySelector('#mappings-table tbody');
          const rowCount = tbody.querySelectorAll('tr').length + 1;

          const newRow = document.createElement('tr');
          newRow.innerHTML = \`
            <td><input type="text" value="" data-col="0" data-row="\${rowCount}" /></td>
            <td><input type="text" value="" data-col="1" data-row="\${rowCount}" /></td>
            <td><input type="text" value="" data-col="2" data-row="\${rowCount}" /></td>
            <td><input type="text" value="" data-col="3" data-row="\${rowCount}" /></td>
            <td><button onclick="deleteRow(\${rowCount})">🗑️</button></td>
          \`;
          tbody.appendChild(newRow);
        }

        function deleteRow(rowNum) {
          if (confirm('Delete this mapping?')) {
            const row = document.querySelector(\`input[data-row="\${rowNum}"]\`).closest('tr');
            row.remove();
          }
        }

        function saveMappings() {
          const rows = [];
          const tbody = document.querySelector('#mappings-table tbody');

          tbody.querySelectorAll('tr').forEach(tr => {
            const inputs = tr.querySelectorAll('input');
            rows.push([
              inputs[0].value,
              inputs[1].value,
              inputs[2].value,
              inputs[3].value
            ]);
          });

          google.script.run
            .withSuccessHandler(() => {
              alert('✅ Mappings saved successfully!');
              google.script.host.close();
            })
            .withFailureHandler(err => alert('❌ Error: ' + err.message))
            .saveCategoryMappings(rows);
        }
      </script>
    </body>
    </html>
  `).setWidth(800).setHeight(600);

  ui.showModalDialog(html, '⚙️ Category Mappings Editor');
}

/**
 * Save category mappings back to sheet
 */
function saveCategoryMappings(rows) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const mappingSheet = ss.getSheetByName('accronym_symptom_system_mapping');

  if (!mappingSheet) {
    throw new Error('Mapping sheet not found');
  }

  // Clear existing data (except headers)
  const lastRow = mappingSheet.getLastRow();
  if (lastRow > 1) {
    mappingSheet.getRange(2, 1, lastRow - 1, 4).clear();
  }

  // Write new data
  if (rows.length > 0) {
    mappingSheet.getRange(2, 1, rows.length, 4).setValues(rows);
  }

  Logger.log('✅ Saved ' + rows.length + ' category mappings');
}
