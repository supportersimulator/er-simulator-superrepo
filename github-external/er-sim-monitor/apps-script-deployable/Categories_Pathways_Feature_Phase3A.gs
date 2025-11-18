/**
 * Categories & Pathways Feature - Phase 3A: Dual-Tab UI
 *
 * This is the refactored version with:
 * - Browser-style tabs (Categories | Pathways)
 * - Clean separation of organizational modes
 * - Foundation for AI logic type discovery
 *
 * Copy the buildBirdEyeViewUI_ function from this file
 * to replace the one in Categories_Pathways_Feature_Phase2.gs
 */

function buildBirdEyeViewUI_(analysis) {
  // Build tab content
  const categoriesTabHTML = buildCategoriesTabHTML_(analysis);
  const pathwaysTabHTML = buildPathwaysTabHTML_(analysis);

  return '<!DOCTYPE html>' +
'<html>' +
'<head>' +
'  <base target="_top">' +
'  <style>' +
'    * { margin: 0; padding: 0; box-sizing: border-box; }' +
'' +
'    body {' +
'      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;' +
'      background: linear-gradient(135deg, #0f1115 0%, #1a1d26 100%);' +
'      color: #e7eaf0;' +
'      overflow-x: hidden;' +
'      height: 1000px;' +
'    }' +
'' +
'    .header {' +
'      background: linear-gradient(135deg, #1b1f2a 0%, #141824 100%);' +
'      padding: 20px 32px 0 32px;' +
'      border-bottom: 2px solid #2a3040;' +
'    }' +
'' +
'    .header-top {' +
'      display: flex;' +
'      justify-content: space-between;' +
'      align-items: center;' +
'      margin-bottom: 16px;' +
'    }' +
'' +
'    .header h1 {' +
'      font-size: 28px;' +
'      font-weight: 700;' +
'    }' +
'' +
'    .btn-reanalyze {' +
'      background: linear-gradient(135deg, #2a3040 0%, #1e2533 100%);' +
'      border: 1px solid #3a4458;' +
'      color: #e7eaf0;' +
'      padding: 10px 18px;' +
'      border-radius: 8px;' +
'      cursor: pointer;' +
'      font-size: 13px;' +
'      font-weight: 600;' +
'      transition: all 0.2s;' +
'    }' +
'' +
'    .btn-reanalyze:hover {' +
'      background: linear-gradient(135deg, #3a4458 0%, #2a3040 100%);' +
'      border-color: #2357ff;' +
'    }' +
'' +
'    .stats-bar {' +
'      display: flex;' +
'      gap: 16px;' +
'      margin-bottom: 12px;' +
'    }' +
'' +
'    .stat-badge {' +
'      background: #0f1115;' +
'      border: 1px solid #2a3040;' +
'      padding: 6px 14px;' +
'      border-radius: 8px;' +
'      font-size: 12px;' +
'      color: #8b92a0;' +
'    }' +
'' +
'    .stat-badge .value {' +
'      color: #2357ff;' +
'      font-weight: 700;' +
'      margin-right: 4px;' +
'    }' +
'' +
'    /* Browser-style tabs */' +
'    .tab-switcher {' +
'      display: flex;' +
'      gap: 4px;' +
'      border-bottom: none;' +
'    }' +
'' +
'    .tab {' +
'      background: #141824;' +
'      border: 1px solid #2a3040;' +
'      border-bottom: none;' +
'      color: #8b92a0;' +
'      padding: 12px 24px;' +
'      border-radius: 10px 10px 0 0;' +
'      cursor: pointer;' +
'      font-size: 14px;' +
'      font-weight: 600;' +
'      transition: all 0.2s;' +
'      position: relative;' +
'      bottom: -1px;' +
'    }' +
'' +
'    .tab:hover {' +
'      background: #1b1f2a;' +
'      color: #e7eaf0;' +
'    }' +
'' +
'    .tab.active {' +
'      background: linear-gradient(135deg, #0f1115 0%, #1a1d26 100%);' +
'      border-color: #2a3040;' +
'      border-bottom: 2px solid transparent;' +
'      color: #2357ff;' +
'      box-shadow: 0 -2px 8px rgba(35, 87, 255, 0.1);' +
'    }' +
'' +
'    /* Tab content */' +
'    .tab-content {' +
'      display: none;' +
'      padding: 32px;' +
'      overflow-y: auto;' +
'      height: calc(1000px - 180px);' +
'    }' +
'' +
'    .tab-content.active {' +
'      display: block;' +
'    }' +
'' +
'    .tab-content::-webkit-scrollbar {' +
'      width: 10px;' +
'    }' +
'' +
'    .tab-content::-webkit-scrollbar-track {' +
'      background: #0f1115;' +
'    }' +
'' +
'    .tab-content::-webkit-scrollbar-thumb {' +
'      background: #2a3040;' +
'      border-radius: 5px;' +
'    }' +
'' +
'    .section {' +
'      margin-bottom: 32px;' +
'    }' +
'' +
'    .section-title {' +
'      font-size: 18px;' +
'      font-weight: 600;' +
'      margin-bottom: 20px;' +
'      color: #e7eaf0;' +
'      display: flex;' +
'      align-items: center;' +
'      gap: 10px;' +
'    }' +
'' +
'    /* Category cards (for Categories tab) */' +
'    .category-grid {' +
'      display: grid;' +
'      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));' +
'      gap: 20px;' +
'    }' +
'' +
'    .category-card {' +
'      background: linear-gradient(135deg, #1e2533 0%, #181d28 100%);' +
'      border: 2px solid #2a3040;' +
'      border-radius: 16px;' +
'      padding: 28px 24px;' +
'      text-align: center;' +
'      cursor: pointer;' +
'      transition: all 0.3s ease;' +
'    }' +
'' +
'    .category-card:hover {' +
'      background: linear-gradient(135deg, #252b3a 0%, #1f2430 100%);' +
'      border-color: #2357ff;' +
'      transform: translateY(-6px);' +
'      box-shadow: 0 12px 32px rgba(35, 87, 255, 0.25);' +
'    }' +
'' +
'    .category-icon {' +
'      font-size: 52px;' +
'      margin-bottom: 16px;' +
'      filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));' +
'    }' +
'' +
'    .category-name {' +
'      font-size: 20px;' +
'      font-weight: 700;' +
'      color: #e7eaf0;' +
'      margin-bottom: 8px;' +
'      letter-spacing: 0.5px;' +
'    }' +
'' +
'    .category-count {' +
'      font-size: 14px;' +
'      color: #8b92a0;' +
'      font-weight: 500;' +
'    }' +
'' +
'    /* Insights box */' +
'    .insights-box {' +
'      background: linear-gradient(135deg, #1e2533 0%, #181d28 100%);' +
'      border: 1px solid #2a3040;' +
'      border-left: 3px solid #2357ff;' +
'      padding: 20px 24px;' +
'      border-radius: 10px;' +
'      margin-bottom: 32px;' +
'    }' +
'' +
'    .insights-box h3 {' +
'      font-size: 16px;' +
'      font-weight: 600;' +
'      margin-bottom: 12px;' +
'      color: #2357ff;' +
'    }' +
'' +
'    .insights-list {' +
'      list-style: none;' +
'      padding: 0;' +
'    }' +
'' +
'    .insight-item {' +
'      font-size: 14px;' +
'      color: #8b92a0;' +
'      line-height: 1.6;' +
'      margin-bottom: 10px;' +
'    }' +
'' +
'    /* Pathway cards (for Pathways tab) */' +
'    .pathway-grid {' +
'      display: grid;' +
'      grid-template-columns: repeat(auto-fill, minmax(450px, 1fr));' +
'      gap: 20px;' +
'    }' +
'' +
'    .pathway-card {' +
'      background: linear-gradient(135deg, #1e2533 0%, #181d28 100%);' +
'      border: 1px solid #2a3040;' +
'      padding: 20px;' +
'      border-radius: 12px;' +
'      cursor: pointer;' +
'      transition: all 0.3s;' +
'    }' +
'' +
'    .pathway-card:hover {' +
'      background: linear-gradient(135deg, #252b3a 0%, #1f2430 100%);' +
'      border-color: #2357ff;' +
'      transform: translateY(-3px);' +
'      box-shadow: 0 8px 24px rgba(35, 87, 255, 0.2);' +
'    }' +
'' +
'    .pathway-header {' +
'      display: flex;' +
'      align-items: center;' +
'      gap: 12px;' +
'      margin-bottom: 12px;' +
'    }' +
'' +
'    .pathway-icon {' +
'      font-size: 32px;' +
'    }' +
'' +
'    .pathway-title {' +
'      font-size: 18px;' +
'      font-weight: 600;' +
'      color: #e7eaf0;' +
'    }' +
'' +
'    .pathway-stats {' +
'      display: flex;' +
'      justify-content: space-between;' +
'      align-items: center;' +
'      margin-bottom: 12px;' +
'    }' +
'' +
'    .pathway-count {' +
'      font-size: 13px;' +
'      color: #2357ff;' +
'      font-weight: 600;' +
'    }' +
'' +
'    .pathway-confidence {' +
'      font-size: 12px;' +
'      color: #8b92a0;' +
'    }' +
'' +
'    .pathway-rationale {' +
'      font-size: 13px;' +
'      color: #8b92a0;' +
'      line-height: 1.5;' +
'      margin-bottom: 16px;' +
'    }' +
'' +
'    .btn-build {' +
'      width: 100%;' +
'      background: linear-gradient(135deg, #2357ff 0%, #1a47d9 100%);' +
'      border: none;' +
'      color: #fff;' +
'      padding: 10px 16px;' +
'      border-radius: 8px;' +
'      cursor: pointer;' +
'      font-size: 14px;' +
'      font-weight: 600;' +
'      transition: all 0.2s;' +
'    }' +
'' +
'    .btn-build:hover {' +
'      background: linear-gradient(135deg, #1a47d9 0%, #1538b8 100%);' +
'      transform: translateY(-1px);' +
'    }' +
'  </style>' +
'</head>' +
'<body>' +
'  <div class="header">' +
'    <div class="header-top">' +
'      <h1>🧩 Pathway Chain Builder</h1>' +
'      <button class="btn-reanalyze" onclick="reAnalyze()">🔄 Re-analyze</button>' +
'    </div>' +
'    <div class="stats-bar">' +
'      <div class="stat-badge"><span class="value">' + analysis.totalCases + '</span> Total Cases</div>' +
'      <div class="stat-badge"><span class="value">' + Object.keys(analysis.systemDistribution).length + '</span> Systems</div>' +
'      <div class="stat-badge"><span class="value">' + analysis.topPathways.length + '</span> Opportunities</div>' +
'      <div class="stat-badge"><span class="value">' + analysis.unassignedCount + '</span> Unassigned</div>' +
'    </div>' +
'    <div class="tab-switcher">' +
'      <button class="tab" onclick="switchTab(\'categories\')">📁 Categories</button>' +
'      <button class="tab active" onclick="switchTab(\'pathways\')">🧩 Pathways</button>' +
'    </div>' +
'  </div>' +
'' +
'  ' + categoriesTabHTML +
'  ' + pathwaysTabHTML +
'' +
'  <script>' +
'    function switchTab(tabName) {' +
'      // Update tab buttons' +
'      const tabs = document.querySelectorAll(\'.tab\');' +
'      tabs.forEach(function(tab) {' +
'        tab.classList.remove(\'active\');' +
'      });' +
'      event.target.classList.add(\'active\');' +
'' +
'      // Update tab content' +
'      const tabContents = document.querySelectorAll(\'.tab-content\');' +
'      tabContents.forEach(function(content) {' +
'        content.classList.remove(\'active\');' +
'      });' +
'' +
'      if (tabName === \'categories\') {' +
'        document.getElementById(\'categories-tab\').classList.add(\'active\');' +
'      } else if (tabName === \'pathways\') {' +
'        document.getElementById(\'pathways-tab\').classList.add(\'active\');' +
'      }' +
'    }' +
'' +
'    function viewCategory(categoryName) {' +
'      console.log("🗂️ View category:", categoryName);' +
'      alert("Category view coming soon! Will show all " + categoryName + " cases.");' +
'    }' +
'' +
'    function buildPathway(pathwayId) {' +
'      console.log("🎯 buildPathway called with ID:", pathwayId);' +
'      try {' +
'        document.body.innerHTML = "<div style=\\"text-align:center; padding:100px;\\"><h2>⚙️ Loading chain builder...</h2><p style=\\"color: #8b92a0;\\">Pathway ID: " + pathwayId + "</p></div>";' +
'        console.log("📞 Calling google.script.run.buildChainBuilderUI");' +
'        google.script.run' +
'          .withSuccessHandler(function(html) {' +
'            console.log("✅ buildChainBuilderUI returned successfully");' +
'            console.log("📄 HTML length:", html.length);' +
'            document.documentElement.innerHTML = html;' +
'          })' +
'          .withFailureHandler(function(error) {' +
'            console.error("❌ buildChainBuilderUI failed:", error);' +
'            document.body.innerHTML = "<div style=\\"text-align:center; padding:100px;\\"><h2 style=\\"color: #ff4444;\\">❌ Error Loading Chain Builder</h2><p style=\\"color: #8b92a0;\\">Error: " + error.message + "</p><p style=\\"color: #8b92a0;\\">See console for details (F12)</p></div>";' +
'          })' +
'          .buildChainBuilderUI(pathwayId);' +
'      } catch (e) {' +
'        console.error("❌ Exception in buildPathway:", e);' +
'        document.body.innerHTML = "<div style=\\"text-align:center; padding:100px;\\"><h2 style=\\"color: #ff4444;\\">❌ Exception</h2><p style=\\"color: #8b92a0;\\">Exception: " + e.message + "</p></div>";' +
'      }' +
'    }' +
'' +
'    function reAnalyze() {' +
'      if (confirm("Re-analyze entire case library?\\n\\nThis will invalidate the cache and take 30-60 seconds.")) {' +
'        document.body.innerHTML = "<div style=\\"text-align:center; padding:100px;\\"><h2>⚙️ Re-analyzing...</h2><p>Please wait...</p></div>";' +
'        google.script.run' +
'          .withSuccessHandler(function() {' +
'            google.script.host.close();' +
'          })' +
'          .reAnalyzeLibrary();' +
'      }' +
'    }' +
'  </script>' +
'</body>' +
'</html>';
}
