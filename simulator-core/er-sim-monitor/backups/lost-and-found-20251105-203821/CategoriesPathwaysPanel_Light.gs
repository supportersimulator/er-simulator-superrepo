/**
 * Categories & Pathways Panel - Light Theme (Classic Google Sheets Style)
 *
 * Clean, easy-to-read interface for managing categories and pathways
 * Light grey theme optimized for data manipulation
 */

// ========== MAIN LAUNCHER ==========

function openCategoriesPathwaysPanel() {
  const ui = getSafeUi_();
  if (!ui) return;

  const html = buildCategoriesPathwaysMainMenu_();
  ui.showSidebar(HtmlService.createHtmlOutput(html).setTitle('📂 Categories & Pathways').setWidth(320));
}

// ========== MAIN MENU ==========

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
  </style>
</head>
<body>
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
    <button class="btn-primary btn" onclick="viewAllPathways()" style="margin-top:10px;">View All Pathways</button>
  </div>

  <div class="info">
    💡 Click any category or pathway to view and edit cases
  </div>

  <script>
    function viewCategory(category) {
      google.script.run
        .withSuccessHandler(updateContent)
        .getCategoryView(category);
    }

    function viewPathway(pathway) {
      google.script.run
        .withSuccessHandler(updateContent)
        .getPathwayView(pathway);
    }

    function viewAllCategories() {
      google.script.run
        .withSuccessHandler(updateContent)
        .getAllCategoriesView();
    }

    function viewAllPathways() {
      google.script.run
        .withSuccessHandler(updateContent)
        .getAllPathwaysView();
    }

    function assignCase() {
      const row = prompt('Enter row number:');
      if (row) {
        google.script.run
          .withSuccessHandler(updateContent)
          .getCaseAssignmentView(parseInt(row));
      }
    }

    function updateContent(html) {
      document.body.innerHTML = html;
    }

    function goBack() {
      google.script.run
        .withSuccessHandler(updateContent)
        .buildCategoriesPathwaysMainMenu_();
    }
  </script>
</body>
</html>
  `;
}

// ========== VIEW FUNCTIONS ==========

function getCategoryView(category) {
  const sheet = pickMasterSheet_();
  const data = sheet.getDataRange().getValues();
  const headers = data[1];

  const categoryIdx = headers.indexOf('Case_Organization:Category');
  const sparkIdx = headers.indexOf('Case_Organization:Spark_Title');
  const pathwayIdx = headers.indexOf('Case_Organization:Pathway_Name');

  const cases = [];
  for (let i = 2; i < data.length; i++) {
    if (data[i][categoryIdx] === category) {
      cases.push({
        row: i + 1,
        spark: data[i][sparkIdx] || 'Untitled',
        pathway: data[i][pathwayIdx] || 'Unassigned'
      });
    }
  }

  const casesList = cases.map(c => `
    <div class="list-item">
      <div>
        <div style="font-weight:500;">${c.spark}</div>
        <div style="font-size:11px;color:#7f8c9d;margin-top:2px;">Row ${c.row} • ${c.pathway}</div>
      </div>
    </div>
  `).join('');

  return `
<!DOCTYPE html>
<html>
<head><base target="_top">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, sans-serif; background: #f5f7fa; color: #2c3e50; font-size: 13px; }
  .header { background: #fff; padding: 16px; border-bottom: 1px solid #dfe3e8; }
  .header h1 { font-size: 16px; font-weight: 600; color: #2c3e50; margin-bottom: 4px; }
  .header .subtitle { font-size: 12px; color: #7f8c9d; }
  .section { background: #fff; margin: 12px; padding: 14px; border-radius: 6px; border: 1px solid #dfe3e8; }
  .list-item { padding: 10px 12px; margin-bottom: 6px; background: #f8f9fa; border-radius: 4px; }
  .btn { display: inline-block; background: #fff; border: 1px solid #d1d7de; color: #2c3e50; padding: 8px 14px; margin: 8px 4px; border-radius: 4px; cursor: pointer; font-size: 12px; text-decoration: none; }
  .btn:hover { background: #f5f7fa; }
  .scrollable { max-height: 400px; overflow-y: auto; }
</style>
</head>
<body>
  <div class="header">
    <h1>📂 ${category}</h1>
    <div class="subtitle">${cases.length} cases</div>
  </div>
  <div class="section">
    <div class="scrollable">${casesList}</div>
  </div>
  <div style="padding:12px;">
    <button class="btn" onclick="goBack()">← Back to Menu</button>
  </div>
  <script>
    function goBack() {
      google.script.run
        .withSuccessHandler(html => document.body.innerHTML = html)
        .buildCategoriesPathwaysMainMenu_();
    }
  </script>
</body>
</html>
  `;
}

function getPathwayView(pathway) {
  // Similar to category view
  return getCategoryView(pathway); // Simplified for now
}

function getAllCategoriesView() {
  // Grid of all categories
  return buildCategoriesPathwaysMainMenu_();
}

function getAllPathwaysView() {
  // Grid of all pathways
  return buildCategoriesPathwaysMainMenu_();
}

function getCaseAssignmentView(row) {
  // Assignment interface
  return buildCategoriesPathwaysMainMenu_();
}
