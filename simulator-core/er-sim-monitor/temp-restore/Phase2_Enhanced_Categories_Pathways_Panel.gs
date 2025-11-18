/**
 * PHASE 2: ENHANCED CATEGORIES & PATHWAYS PANEL
 *
 * Adds AI Discovery tab to existing panel with clean tabbed interface
 */

/**
 * Open Categories & Pathways Panel (with AI Discovery tab)
 */
function openCategoriesPathwaysPanel() {
  const ui = getSafeUi_();
  if (!ui) return;

  const html = buildCategoriesPathwaysMainMenu_();
  ui.showSidebar(HtmlService.createHtmlOutput(html).setTitle('📂 Categories & Pathways').setWidth(350));
}

/**
 * Build main menu with tabbed interface
 */
function buildCategoriesPathwaysMainMenu_() {
  const sheet = pickMasterSheet_();
  const data = sheet.getDataRange().getValues();
  const headers = data[1]; // Row 2

  // Get column indices
  const categoryIdx = headers.indexOf('Case_Organization:Category');
  const pathwayIdx = headers.indexOf('Case_Organization:Pathway_Name');
  const sparkIdx = headers.indexOf('Case_Organization:Spark_Title');

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

    .btn-primary:disabled {
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
  </style>
</head>
<body>
  <!-- Tab Navigation -->
  <div class="tabs">
    <div class="tab active" onclick="switchTab('categories')">📊 Categories</div>
    <div class="tab" onclick="switchTab('discovery')">🔍 AI Discovery</div>
  </div>

  <!-- Tab 1: Categories (Existing View) -->
  <div id="categories-tab" class="tab-content active">
    <div class="header">
      <h1>📂 Categories & Pathways</h1>
      <div class="subtitle">Organize cases by system and learning path</div>
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

    <div class="section">
      <div class="section-title">Quick Actions</div>
      <button class="btn" onclick="viewAllCategories()">📊 View All Categories</button>
      <button class="btn" onclick="viewAllPathways()">🧩 View All Pathways</button>
      <button class="btn" onclick="assignCase()">🔗 Assign Case to Category/Pathway</button>
    </div>

    <div class="section">
      <div class="section-title">Medical System Categories</div>
      <div class="scrollable">
        ${categoryList || '<div class="info">No categories found</div>'}
      </div>
    </div>

    <div class="section">
      <div class="section-title">Learning Pathways (Top 10)</div>
      <div class="scrollable">
        ${pathwayList || '<div class="info">No pathways found</div>'}
      </div>
    </div>
  </div>

  <!-- Tab 2: AI Discovery (New) -->
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
    // Tab switching
    function switchTab(tabName) {
      // Update tab buttons
      document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
      event.target.classList.add('active');

      // Update tab content
      document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
      document.getElementById(tabName + '-tab').classList.add('active');
    }

    // Categories tab functions (existing)
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

    // AI Discovery tab functions (new)
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
  </script>
</body>
</html>
  `;
}
