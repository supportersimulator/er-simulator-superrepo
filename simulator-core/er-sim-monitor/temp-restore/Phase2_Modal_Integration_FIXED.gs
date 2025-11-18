/**
 * PHASE 2: MODAL INTEGRATION (FIXED - String Concatenation)
 *
 * Adds AI Discovery tab to existing Pathway Chain Builder modal
 * This file contains the AI Discovery tab HTML builder
 * 
 * CRITICAL FIX: Uses string concatenation (+) instead of template literals
 */

/**
 * Build AI Discovery tab HTML for Pathway Chain Builder modal
 */
function buildAIDiscoveryTabHTML_() {
  // Get logic types for dropdown
  const logicTypes = getLogicTypesForDropdown();
  const logicTypeOptions = logicTypes.map(function(lt) {
    const usageLabel = lt.timesUsed > 0 ? ' (' + lt.timesUsed + ' uses)' : '';
    return '<option value="' + lt.id + '">' + lt.name + usageLabel + '</option>';
  }).join('');

  return '<div class="tab-content" id="discovery-tab" style="display: none;">' +
         '  <div class="discovery-container">' +
         '    <!-- Header Section -->' +
         '    <div class="discovery-header">' +
         '      <div class="discovery-title">' +
         '        <h2>🔍 AI-Powered Pathway Discovery</h2>' +
         '        <p class="discovery-subtitle">Discover high-value learning pathways using AI and multiple intelligence frameworks</p>' +
         '      </div>' +
         '    </div>' +
         '' +
         '    <!-- Discovery Configuration -->' +
         '    <div class="discovery-config">' +
         '      <div class="config-section">' +
         '        <label class="config-label">' +
         '          <span class="label-icon">🧠</span>' +
         '          <span class="label-text">Discovery Lens (Logic Type)</span>' +
         '        </label>' +
         '        <select id="logic-type-selector" class="logic-type-select" onchange="handleLogicTypeChange()">' +
         '          <option value="">-- Select Logic Type --</option>' +
         logicTypeOptions +
         '          <option value="" disabled>──────────────────</option>' +
         '          <option value="CREATE_NEW">🎨 Create New Logic Type...</option>' +
         '        </select>' +
         '        <div class="help-text">' +
         '          💡 Most frequently used logic types appear first. Each lens reveals different pathway patterns.' +
         '        </div>' +
         '      </div>' +
         '' +
         '      <div class="config-section">' +
         '        <button id="discover-btn" class="btn-discover" onclick="discoverPathways()" disabled>' +
         '          <span class="btn-icon">🤖</span>' +
         '          <span class="btn-text">Discover Pathways</span>' +
         '        </button>' +
         '      </div>' +
         '    </div>' +
         '' +
         '    <!-- Results Container -->' +
         '    <div id="discovery-results-container" style="display: none;">' +
         '      <div class="results-header">' +
         '        <h3 id="results-title">Discovery Results</h3>' +
         '        <button class="btn-clear-results" onclick="clearDiscoveryResults()">Clear Results</button>' +
         '      </div>' +
         '      <div id="discovery-results-content" class="results-grid"></div>' +
         '    </div>' +
         '' +
         '    <!-- Management Links -->' +
         '    <div class="discovery-footer">' +
         '      <h3 class="footer-title">Manage Discovery System</h3>' +
         '      <div class="footer-actions">' +
         '        <button class="btn-footer" onclick="viewLogicTypeLibrary()">' +
         '          📚 View Logic Type Library' +
         '        </button>' +
         '        <button class="btn-footer" onclick="viewPathwaysMaster()">' +
         '          📊 View All Discovered Pathways' +
         '        </button>' +
         '      </div>' +
         '    </div>' +
         '  </div>' +
         '' +
         '  <style>' +
         '    /* AI Discovery Tab Styles */' +
         '    .discovery-container {' +
         '      padding: 24px 32px;' +
         '      max-width: 1400px;' +
         '      margin: 0 auto;' +
         '    }' +
         '' +
         '    .discovery-header {' +
         '      margin-bottom: 32px;' +
         '      padding-bottom: 20px;' +
         '      border-bottom: 1px solid #2a3040;' +
         '    }' +
         '' +
         '    .discovery-title h2 {' +
         '      font-size: 24px;' +
         '      font-weight: 700;' +
         '      color: #e7eaf0;' +
         '      margin-bottom: 8px;' +
         '    }' +
         '' +
         '    .discovery-subtitle {' +
         '      font-size: 14px;' +
         '      color: #8b92a0;' +
         '    }' +
         '' +
         '    .discovery-config {' +
         '      background: #1b1f2a;' +
         '      border: 1px solid #2a3040;' +
         '      border-radius: 12px;' +
         '      padding: 24px;' +
         '      margin-bottom: 32px;' +
         '    }' +
         '' +
         '    .config-section {' +
         '      margin-bottom: 20px;' +
         '    }' +
         '' +
         '    .config-section:last-child {' +
         '      margin-bottom: 0;' +
         '    }' +
         '' +
         '    .config-label {' +
         '      display: flex;' +
         '      align-items: center;' +
         '      gap: 8px;' +
         '      margin-bottom: 10px;' +
         '      font-size: 14px;' +
         '      font-weight: 600;' +
         '      color: #e7eaf0;' +
         '    }' +
         '' +
         '    .label-icon {' +
         '      font-size: 18px;' +
         '    }' +
         '' +
         '    .logic-type-select {' +
         '      width: 100%;' +
         '      padding: 12px 16px;' +
         '      font-size: 14px;' +
         '      background: #0f1115;' +
         '      border: 1px solid #2a3040;' +
         '      border-radius: 8px;' +
         '      color: #e7eaf0;' +
         '      cursor: pointer;' +
         '      transition: all 0.2s;' +
         '    }' +
         '' +
         '    .logic-type-select:hover {' +
         '      border-color: #3a4458;' +
         '    }' +
         '' +
         '    .logic-type-select:focus {' +
         '      outline: none;' +
         '      border-color: #2357ff;' +
         '      box-shadow: 0 0 0 3px rgba(35, 87, 255, 0.1);' +
         '    }' +
         '' +
         '    .help-text {' +
         '      font-size: 12px;' +
         '      color: #8b92a0;' +
         '      margin-top: 8px;' +
         '      padding-left: 4px;' +
         '    }' +
         '' +
         '    .btn-discover {' +
         '      width: 100%;' +
         '      display: flex;' +
         '      align-items: center;' +
         '      justify-content: center;' +
         '      gap: 10px;' +
         '      background: linear-gradient(135deg, #2357ff 0%, #1a42cc 100%);' +
         '      border: none;' +
         '      color: #fff;' +
         '      padding: 16px 24px;' +
         '      border-radius: 10px;' +
         '      cursor: pointer;' +
         '      font-size: 16px;' +
         '      font-weight: 700;' +
         '      transition: all 0.3s;' +
         '      box-shadow: 0 4px 12px rgba(35, 87, 255, 0.3);' +
         '    }' +
         '' +
         '    .btn-discover:hover:not(:disabled) {' +
         '      background: linear-gradient(135deg, #1a42cc 0%, #2357ff 100%);' +
         '      transform: translateY(-2px);' +
         '      box-shadow: 0 6px 20px rgba(35, 87, 255, 0.4);' +
         '    }' +
         '' +
         '    .btn-discover:disabled {' +
         '      background: #2a3040;' +
         '      color: #5a6478;' +
         '      cursor: not-allowed;' +
         '      box-shadow: none;' +
         '    }' +
         '' +
         '    .btn-icon {' +
         '      font-size: 20px;' +
         '    }' +
         '' +
         '    .results-header {' +
         '      display: flex;' +
         '      justify-content: space-between;' +
         '      align-items: center;' +
         '      margin-bottom: 20px;' +
         '      padding-bottom: 16px;' +
         '      border-bottom: 1px solid #2a3040;' +
         '    }' +
         '' +
         '    .results-header h3 {' +
         '      font-size: 18px;' +
         '      font-weight: 700;' +
         '      color: #e7eaf0;' +
         '    }' +
         '' +
         '    .btn-clear-results {' +
         '      background: #2a3040;' +
         '      border: 1px solid #3a4458;' +
         '      color: #8b92a0;' +
         '      padding: 8px 16px;' +
         '      border-radius: 6px;' +
         '      cursor: pointer;' +
         '      font-size: 12px;' +
         '      font-weight: 600;' +
         '      transition: all 0.2s;' +
         '    }' +
         '' +
         '    .btn-clear-results:hover {' +
         '      background: #3a4458;' +
         '      color: #e7eaf0;' +
         '    }' +
         '' +
         '    .results-grid {' +
         '      display: grid;' +
         '      grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));' +
         '      gap: 20px;' +
         '    }' +
         '' +
         '    .pathway-card {' +
         '      background: #1b1f2a;' +
         '      border: 1px solid #2a3040;' +
         '      border-radius: 10px;' +
         '      padding: 20px;' +
         '      transition: all 0.3s;' +
         '      position: relative;' +
         '      overflow: hidden;' +
         '    }' +
         '' +
         '    .pathway-card::before {' +
         '      content: "";' +
         '      position: absolute;' +
         '      top: 0;' +
         '      left: 0;' +
         '      right: 0;' +
         '      height: 4px;' +
         '      background: linear-gradient(90deg, #2357ff 0%, #1a42cc 100%);' +
         '    }' +
         '' +
         '    .pathway-card:hover {' +
         '      border-color: #2357ff;' +
         '      transform: translateY(-4px);' +
         '      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);' +
         '    }' +
         '' +
         '    .pathway-card-header {' +
         '      display: flex;' +
         '      justify-content: space-between;' +
         '      align-items: flex-start;' +
         '      margin-bottom: 12px;' +
         '    }' +
         '' +
         '    .pathway-name {' +
         '      font-size: 16px;' +
         '      font-weight: 700;' +
         '      color: #e7eaf0;' +
         '      flex: 1;' +
         '      margin-right: 12px;' +
         '    }' +
         '' +
         '    .tier-badge {' +
         '      display: inline-block;' +
         '      padding: 4px 10px;' +
         '      border-radius: 6px;' +
         '      font-size: 11px;' +
         '      font-weight: 700;' +
         '      text-transform: uppercase;' +
         '      letter-spacing: 0.5px;' +
         '    }' +
         '' +
         '    .tier-s { background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%); color: #000; }' +
         '    .tier-a { background: linear-gradient(135deg, #c0c0c0 0%, #e8e8e8 100%); color: #000; }' +
         '    .tier-b { background: linear-gradient(135deg, #cd7f32 0%, #d4a574 100%); color: #fff; }' +
         '    .tier-c { background: #3a4458; color: #8b92a0; }' +
         '    .tier-d { background: #2a3040; color: #5a6478; }' +
         '' +
         '    .pathway-description {' +
         '      font-size: 13px;' +
         '      color: #8b92a0;' +
         '      margin-bottom: 12px;' +
         '      line-height: 1.5;' +
         '    }' +
         '' +
         '    .pathway-persuasion {' +
         '      background: #0f1115;' +
         '      border-left: 3px solid #2357ff;' +
         '      padding: 12px;' +
         '      border-radius: 6px;' +
         '      margin-bottom: 12px;' +
         '    }' +
         '' +
         '    .pathway-persuasion p {' +
         '      font-size: 13px;' +
         '      color: #a8afc0;' +
         '      font-style: italic;' +
         '      line-height: 1.6;' +
         '    }' +
         '' +
         '    .pathway-meta {' +
         '      display: flex;' +
         '      gap: 16px;' +
         '      font-size: 12px;' +
         '      color: #8b92a0;' +
         '      padding-top: 12px;' +
         '      border-top: 1px solid #2a3040;' +
         '    }' +
         '' +
         '    .meta-item {' +
         '      display: flex;' +
         '      align-items: center;' +
         '      gap: 4px;' +
         '    }' +
         '' +
         '    .meta-item strong {' +
         '      color: #e7eaf0;' +
         '    }' +
         '' +
         '    .discovery-footer {' +
         '      margin-top: 40px;' +
         '      padding-top: 24px;' +
         '      border-top: 1px solid #2a3040;' +
         '    }' +
         '' +
         '    .footer-title {' +
         '      font-size: 16px;' +
         '      font-weight: 600;' +
         '      color: #e7eaf0;' +
         '      margin-bottom: 16px;' +
         '    }' +
         '' +
         '    .footer-actions {' +
         '      display: flex;' +
         '      gap: 12px;' +
         '    }' +
         '' +
         '    .btn-footer {' +
         '      flex: 1;' +
         '      background: #1b1f2a;' +
         '      border: 1px solid #2a3040;' +
         '      color: #8b92a0;' +
         '      padding: 12px 20px;' +
         '      border-radius: 8px;' +
         '      cursor: pointer;' +
         '      font-size: 13px;' +
         '      font-weight: 600;' +
         '      transition: all 0.2s;' +
         '    }' +
         '' +
         '    .btn-footer:hover {' +
         '      background: #2a3040;' +
         '      border-color: #3a4458;' +
         '      color: #e7eaf0;' +
         '    }' +
         '  </style>' +
         '</div>';
}
