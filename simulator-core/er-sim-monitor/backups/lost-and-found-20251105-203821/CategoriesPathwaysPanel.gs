/**
 * Categories & Pathways Interactive Panel for Google Sheets
 *
 * Full-featured interactive panel for managing:
 * - Medical system categories (CARD, RESP, NEUR, etc.)
 * - Learning pathways (educational sequences)
 * - Case assignments and sequencing
 *
 * Dark-themed UI with visual space for adjustments and options
 */

// ========== MAIN MENU LAUNCHER ==========

function openCategoriesPathwaysPanel() {
  const ui = getSafeUi_();
  if (!ui) {
    Logger.log('No UI context available');
    return;
  }

  const html = buildCategoriesPathwaysMainMenu_();
  ui.showSidebar(HtmlService.createHtmlOutput(html).setTitle('📂 Categories & Pathways'));
}

// ========== MAIN MENU HTML ==========

function buildCategoriesPathwaysMainMenu_() {
  const sheet = pickMasterSheet_();
  const data = sheet.getDataRange().getValues();
  const headers = data[1]; // Row 2 = headers (1-tier system)

  // Count cases by category and pathway
  const categoryIdx = headers.indexOf('Case_Organization:Category');
  const pathwayIdx = headers.indexOf('Case_Organization:Pathway_Name');

  const categoryCounts = {};
  const pathwayCounts = {};
  const totalCases = data.length - 2; // Exclude header rows

  for (let i = 2; i < data.length; i++) {
    const category = data[i][categoryIdx] || 'Uncategorized';
    const pathway = data[i][pathwayIdx] || 'Unassigned';

    categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    pathwayCounts[pathway] = (pathwayCounts[pathway] || 0) + 1;
  }

  const categoryList = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1]) // Sort by count descending
    .map(([cat, count]) => `
      <div class="stat-item" onclick="viewCategory('${cat.replace(/'/g, "\\'")}')">
        <span class="stat-label">${cat}</span>
        <span class="stat-count">${count} cases</span>
      </div>
    `).join('');

  const pathwayList = Object.entries(pathwayCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10) // Top 10 pathways
    .map(([path, count]) => `
      <div class="stat-item" onclick="viewPathway('${path.replace(/'/g, "\\'")}')">
        <span class="stat-label">${path}</span>
        <span class="stat-count">${count} cases</span>
      </div>
    `).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <base target="_top">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      background: #0f1115;
      color: #e7eaf0;
      padding: 0;
      overflow-x: hidden;
    }

    .header {
      background: linear-gradient(135deg, #1b1f2a 0%, #141824 100%);
      padding: 20px;
      border-bottom: 2px solid #2a3040;
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .header h1 {
      font-size: 20px;
      font-weight: 600;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .header .subtitle {
      font-size: 13px;
      color: #8b92a0;
      font-weight: 400;
    }

    .stats-bar {
      background: #141824;
      padding: 16px 20px;
      border-bottom: 1px solid #2a3040;
      display: flex;
      justify-content: space-around;
      gap: 20px;
    }

    .stat-box {
      text-align: center;
      flex: 1;
    }

    .stat-box .number {
      font-size: 28px;
      font-weight: 700;
      color: #2357ff;
      display: block;
    }

    .stat-box .label {
      font-size: 11px;
      color: #8b92a0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-top: 4px;
    }

    .content {
      padding: 20px;
    }

    .section {
      margin-bottom: 30px;
    }

    .section-header {
      font-size: 14px;
      font-weight: 600;
      color: #e7eaf0;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid #2a3040;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .section-header .icon {
      font-size: 16px;
    }

    .button-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 10px;
    }

    .action-btn {
      background: linear-gradient(135deg, #1e2533 0%, #181d28 100%);
      border: 1px solid #2a3040;
      color: #e7eaf0;
      padding: 14px 16px;
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.2s;
      text-align: left;
      font-size: 14px;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .action-btn:hover {
      background: linear-gradient(135deg, #252b3a 0%, #1f2430 100%);
      border-color: #3a4458;
      transform: translateX(2px);
    }

    .action-btn .icon {
      font-size: 18px;
      width: 24px;
      text-align: center;
    }

    .action-btn .text {
      flex: 1;
    }

    .action-btn .badge {
      background: #2357ff;
      color: #fff;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
    }

    .stat-item {
      background: #141824;
      border: 1px solid #2a3040;
      padding: 12px 14px;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .stat-item:hover {
      background: #1b1f2a;
      border-color: #3a4458;
      transform: translateX(2px);
    }

    .stat-label {
      font-size: 13px;
      font-weight: 500;
      color: #e7eaf0;
    }

    .stat-count {
      font-size: 12px;
      color: #8b92a0;
      background: #0f1115;
      padding: 4px 10px;
      border-radius: 12px;
    }

    .primary-btn {
      background: linear-gradient(135deg, #2357ff 0%, #1a47d9 100%);
      border: none;
      color: #fff;
      padding: 14px 20px;
      border-radius: 10px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      width: 100%;
      transition: all 0.2s;
      margin-top: 10px;
    }

    .primary-btn:hover {
      background: linear-gradient(135deg, #1a47d9 0%, #1538b8 100%);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(35, 87, 255, 0.3);
    }

    .scrollable {
      max-height: 300px;
      overflow-y: auto;
      padding-right: 4px;
    }

    .scrollable::-webkit-scrollbar {
      width: 6px;
    }

    .scrollable::-webkit-scrollbar-track {
      background: #0f1115;
      border-radius: 3px;
    }

    .scrollable::-webkit-scrollbar-thumb {
      background: #2a3040;
      border-radius: 3px;
    }

    .scrollable::-webkit-scrollbar-thumb:hover {
      background: #3a4458;
    }

    .info-box {
      background: #141824;
      border: 1px solid #2a3040;
      border-left: 3px solid #2357ff;
      padding: 12px 14px;
      border-radius: 8px;
      font-size: 12px;
      color: #8b92a0;
      margin-top: 16px;
    }

    .divider {
      height: 1px;
      background: #2a3040;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>📂 Categories & Pathways</h1>
    <div class="subtitle">Organize cases by medical systems and learning sequences</div>
  </div>

  <div class="stats-bar">
    <div class="stat-box">
      <span class="number">${totalCases}</span>
      <span class="label">Total Cases</span>
    </div>
    <div class="stat-box">
      <span class="number">${Object.keys(categoryCounts).length}</span>
      <span class="label">Categories</span>
    </div>
    <div class="stat-box">
      <span class="number">${Object.keys(pathwayCounts).length}</span>
      <span class="label">Pathways</span>
    </div>
  </div>

  <div class="content">
    <!-- QUICK ACTIONS -->
    <div class="section">
      <div class="section-header">
        <span class="icon">⚡</span>
        <span>Quick Actions</span>
      </div>
      <div class="button-grid">
        <button class="action-btn" onclick="viewAllCategories()">
          <span class="icon">📊</span>
          <span class="text">View All Categories</span>
        </button>
        <button class="action-btn" onclick="viewAllPathways()">
          <span class="icon">🧩</span>
          <span class="text">View All Pathways</span>
        </button>
        <button class="action-btn" onclick="assignCaseToCategory()">
          <span class="icon">📂</span>
          <span class="text">Assign Case to Category</span>
        </button>
        <button class="action-btn" onclick="assignCaseToPathway()">
          <span class="icon">🔗</span>
          <span class="text">Assign Case to Pathway</span>
        </button>
      </div>
    </div>

    <div class="divider"></div>

    <!-- TOP CATEGORIES -->
    <div class="section">
      <div class="section-header">
        <span class="icon">📂</span>
        <span>Medical System Categories</span>
      </div>
      <div class="scrollable">
        ${categoryList || '<div class="info-box">No categories found</div>'}
      </div>
    </div>

    <div class="divider"></div>

    <!-- TOP PATHWAYS -->
    <div class="section">
      <div class="section-header">
        <span class="icon">🧩</span>
        <span>Learning Pathways (Top 10)</span>
      </div>
      <div class="scrollable">
        ${pathwayList || '<div class="info-box">No pathways found</div>'}
      </div>
      <button class="primary-btn" onclick="viewAllPathways()">View All Pathways</button>
    </div>

    <div class="info-box">
      💡 <strong>Tip:</strong> Click any category or pathway to view cases, edit sequences, or generate alternative names.
    </div>
  </div>

  <script>
    function viewCategory(category) {
      google.script.run
        .withSuccessHandler(showCategoryView)
        .getCategoryDetails(category);
    }

    function viewPathway(pathway) {
      google.script.run
        .withSuccessHandler(showPathwayView)
        .getPathwayDetails(pathway);
    }

    function viewAllCategories() {
      google.script.run
        .withSuccessHandler(showAllCategoriesView)
        .getAllCategories();
    }

    function viewAllPathways() {
      google.script.run
        .withSuccessHandler(showAllPathwaysView)
        .getAllPathways();
    }

    function assignCaseToCategory() {
      const row = prompt('Enter row number to assign:');
      if (row) {
        google.script.run
          .withSuccessHandler(showCategoryAssignment)
          .getCaseInfo(parseInt(row));
      }
    }

    function assignCaseToPathway() {
      const row = prompt('Enter row number to assign:');
      if (row) {
        google.script.run
          .withSuccessHandler(showPathwayAssignment)
          .getCaseInfo(parseInt(row));
      }
    }

    function showCategoryView(html) {
      document.body.innerHTML = html;
    }

    function showPathwayView(html) {
      document.body.innerHTML = html;
    }

    function showAllCategoriesView(html) {
      document.body.innerHTML = html;
    }

    function showAllPathwaysView(html) {
      document.body.innerHTML = html;
    }

    function showCategoryAssignment(html) {
      document.body.innerHTML = html;
    }

    function showPathwayAssignment(html) {
      document.body.innerHTML = html;
    }
  </script>
</body>
</html>
  `;
}

// ========== SERVER-SIDE FUNCTIONS ==========

function getCategoryDetails(category) {
  const sheet = pickMasterSheet_();
  const data = sheet.getDataRange().getValues();
  const headers = data[1];

  const categoryIdx = headers.indexOf('Case_Organization:Category');
  const caseIdIdx = headers.indexOf('Case_Organization:Case_ID');
  const sparkIdx = headers.indexOf('Case_Organization:Spark_Title');
  const pathwayIdx = headers.indexOf('Case_Organization:Pathway_Name');

  const cases = [];
  for (let i = 2; i < data.length; i++) {
    if (data[i][categoryIdx] === category) {
      cases.push({
        row: i + 1,
        caseId: data[i][caseIdIdx],
        sparkTitle: data[i][sparkIdx],
        pathway: data[i][pathwayIdx] || 'Unassigned'
      });
    }
  }

  return buildCategoryDetailView_(category, cases);
}

function getPathwayDetails(pathway) {
  const sheet = pickMasterSheet_();
  const data = sheet.getDataRange().getValues();
  const headers = data[1];

  const pathwayIdx = headers.indexOf('Case_Organization:Pathway_Name');
  const caseIdIdx = headers.indexOf('Case_Organization:Case_ID');
  const sparkIdx = headers.indexOf('Case_Organization:Spark_Title');
  const categoryIdx = headers.indexOf('Case_Organization:Category');

  const cases = [];
  for (let i = 2; i < data.length; i++) {
    if (data[i][pathwayIdx] === pathway) {
      cases.push({
        row: i + 1,
        caseId: data[i][caseIdIdx],
        sparkTitle: data[i][sparkIdx],
        category: data[i][categoryIdx] || 'Uncategorized'
      });
    }
  }

  return buildPathwayDetailView_(pathway, cases);
}

function getAllCategories() {
  const sheet = pickMasterSheet_();
  const data = sheet.getDataRange().getValues();
  const headers = data[1];

  const categoryIdx = headers.indexOf('Case_Organization:Category');
  const categoryCounts = {};

  for (let i = 2; i < data.length; i++) {
    const category = data[i][categoryIdx] || 'Uncategorized';
    categoryCounts[category] = (categoryCounts[category] || 0) + 1;
  }

  return buildAllCategoriesView_(categoryCounts);
}

function getAllPathways() {
  const sheet = pickMasterSheet_();
  const data = sheet.getDataRange().getValues();
  const headers = data[1];

  const pathwayIdx = headers.indexOf('Case_Organization:Pathway_Name');
  const pathwayCounts = {};

  for (let i = 2; i < data.length; i++) {
    const pathway = data[i][pathwayIdx] || 'Unassigned';
    pathwayCounts[pathway] = (pathwayCounts[pathway] || 0) + 1;
  }

  return buildAllPathwaysView_(pathwayCounts);
}

function getCaseInfo(row) {
  const sheet = pickMasterSheet_();
  const headers = sheet.getRange(2, 1, 1, sheet.getLastColumn()).getValues()[0];
  const values = sheet.getRange(row, 1, 1, sheet.getLastColumn()).getValues()[0];

  const caseIdIdx = headers.indexOf('Case_Organization:Case_ID');
  const sparkIdx = headers.indexOf('Case_Organization:Spark_Title');
  const categoryIdx = headers.indexOf('Case_Organization:Category');
  const pathwayIdx = headers.indexOf('Case_Organization:Pathway_Name');

  return {
    row: row,
    caseId: values[caseIdIdx],
    sparkTitle: values[sparkIdx],
    currentCategory: values[categoryIdx] || 'Uncategorized',
    currentPathway: values[pathwayIdx] || 'Unassigned'
  };
}

// ========== VIEW BUILDERS (TO BE CONTINUED) ==========

function buildCategoryDetailView_(category, cases) {
  const casesList = cases.map(c => `
    <div class="case-card" onclick="viewCase(${c.row})">
      <div class="case-header">
        <span class="case-id">${c.caseId}</span>
        <span class="case-row">Row ${c.row}</span>
      </div>
      <div class="case-title">${c.sparkTitle}</div>
      <div class="case-meta">
        <span class="pathway-badge">${c.pathway}</span>
      </div>
    </div>
  `).join('');

  // This would return a full HTML view similar to the main menu
  // For now, returning a placeholder
  return `<h2>Category: ${category}</h2><p>${cases.length} cases</p><div>${casesList}</div>`;
}

function buildPathwayDetailView_(pathway, cases) {
  // Similar to category view
  return `<h2>Pathway: ${pathway}</h2><p>${cases.length} cases</p>`;
}

function buildAllCategoriesView_(categoryCounts) {
  // Grid view of all categories
  return `<h2>All Categories</h2>`;
}

function buildAllPathwaysView_(pathwayCounts) {
  // Grid view of all pathways
  return `<h2>All Pathways</h2>`;
}
