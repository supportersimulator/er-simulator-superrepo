/**
 * Categories & Pathways Advanced Panel
 *
 * Full-featured modal dialog (1920x1000) for AI-powered pathway grouping.
 * Supports multiple logic types with accordion UI and smart case recommendations.
 *
 * Features:
 * - 6 built-in pathway grouping logic types
 * - AI-powered case grouping suggestions
 * - Dynamic logic type suggestions
 * - Accordion UI for visual organization
 * - Full modal dialog matching Title Optimizer dimensions
 */

// ========== MAIN PANEL LAUNCHER ==========

function runCategoriesPathwaysPanel() {
  const ui = getSafeUi_();
  if (!ui) {
    Logger.log('No UI context available');
    return;
  }

  const html = buildPathwayGroupingUI_();
  const htmlOutput = HtmlService.createHtmlOutput(html)
    .setWidth(1920)
    .setHeight(1000);

  ui.showModalDialog(htmlOutput, '🧩 Categories & Pathways - AI-Powered Grouping Logic');
}

// ========== MAIN UI BUILDER ==========

function buildPathwayGroupingUI_() {
  const sheet = pickMasterSheet_();
  const data = sheet.getDataRange().getValues();
  const totalCases = data.length - 2; // Exclude header rows

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
'      padding: 0;' +
'      overflow: hidden;' +
'      height: 1000px;' +
'    }' +
'' +
'    .header {' +
'      background: linear-gradient(135deg, #1b1f2a 0%, #141824 100%);' +
'      padding: 24px 32px;' +
'      border-bottom: 2px solid #2a3040;' +
'      display: flex;' +
'      justify-content: space-between;' +
'      align-items: center;' +
'    }' +
'' +
'    .header-left h1 {' +
'      font-size: 28px;' +
'      font-weight: 700;' +
'      margin-bottom: 8px;' +
'      display: flex;' +
'      align-items: center;' +
'      gap: 12px;' +
'    }' +
'' +
'    .header-left .subtitle {' +
'      font-size: 14px;' +
'      color: #8b92a0;' +
'      font-weight: 400;' +
'    }' +
'' +
'    .header-right {' +
'      text-align: right;' +
'    }' +
'' +
'    .stat-pill {' +
'      background: #141824;' +
'      border: 1px solid #2a3040;' +
'      padding: 8px 16px;' +
'      border-radius: 20px;' +
'      display: inline-block;' +
'      margin-left: 8px;' +
'      font-size: 13px;' +
'      color: #8b92a0;' +
'    }' +
'' +
'    .stat-pill .number {' +
'      color: #2357ff;' +
'      font-weight: 700;' +
'      margin-right: 4px;' +
'    }' +
'' +
'    .controls-bar {' +
'      background: #141824;' +
'      padding: 20px 32px;' +
'      border-bottom: 1px solid #2a3040;' +
'      display: flex;' +
'      gap: 20px;' +
'      align-items: center;' +
'    }' +
'' +
'    .control-group {' +
'      flex: 1;' +
'    }' +
'' +
'    .control-group label {' +
'      display: block;' +
'      font-size: 12px;' +
'      font-weight: 600;' +
'      color: #8b92a0;' +
'      text-transform: uppercase;' +
'      letter-spacing: 0.5px;' +
'      margin-bottom: 8px;' +
'    }' +
'' +
'    .control-group select {' +
'      width: 100%;' +
'      background: #0f1115;' +
'      border: 1px solid #2a3040;' +
'      color: #e7eaf0;' +
'      padding: 12px 16px;' +
'      border-radius: 8px;' +
'      font-size: 14px;' +
'      cursor: pointer;' +
'      transition: all 0.2s;' +
'    }' +
'' +
'    .control-group select:hover {' +
'      border-color: #3a4458;' +
'    }' +
'' +
'    .control-group select:focus {' +
'      outline: none;' +
'      border-color: #2357ff;' +
'      box-shadow: 0 0 0 3px rgba(35, 87, 255, 0.1);' +
'    }' +
'' +
'    .btn-analyze {' +
'      background: linear-gradient(135deg, #2357ff 0%, #1a47d9 100%);' +
'      border: none;' +
'      color: #fff;' +
'      padding: 12px 24px;' +
'      border-radius: 8px;' +
'      cursor: pointer;' +
'      font-size: 14px;' +
'      font-weight: 600;' +
'      transition: all 0.2s;' +
'      white-space: nowrap;' +
'      margin-top: 20px;' +
'    }' +
'' +
'    .btn-analyze:hover {' +
'      background: linear-gradient(135deg, #1a47d9 0%, #1538b8 100%);' +
'      transform: translateY(-1px);' +
'      box-shadow: 0 4px 12px rgba(35, 87, 255, 0.3);' +
'    }' +
'' +
'    .btn-analyze:disabled {' +
'      opacity: 0.5;' +
'      cursor: not-allowed;' +
'      transform: none;' +
'    }' +
'' +
'    .content {' +
'      padding: 32px;' +
'      overflow-y: auto;' +
'      height: calc(1000px - 180px);' +
'    }' +
'' +
'    .content::-webkit-scrollbar {' +
'      width: 10px;' +
'    }' +
'' +
'    .content::-webkit-scrollbar-track {' +
'      background: #0f1115;' +
'    }' +
'' +
'    .content::-webkit-scrollbar-thumb {' +
'      background: #2a3040;' +
'      border-radius: 5px;' +
'    }' +
'' +
'    .content::-webkit-scrollbar-thumb:hover {' +
'      background: #3a4458;' +
'    }' +
'' +
'    .loading {' +
'      text-align: center;' +
'      padding: 60px 20px;' +
'      color: #8b92a0;' +
'    }' +
'' +
'    .loading .spinner {' +
'      font-size: 48px;' +
'      margin-bottom: 20px;' +
'      animation: spin 1s linear infinite;' +
'    }' +
'' +
'    @keyframes spin {' +
'      from { transform: rotate(0deg); }' +
'      to { transform: rotate(360deg); }' +
'    }' +
'' +
'    .accordion {' +
'      margin-bottom: 16px;' +
'    }' +
'' +
'    .accordion-header {' +
'      background: linear-gradient(135deg, #1e2533 0%, #181d28 100%);' +
'      border: 1px solid #2a3040;' +
'      padding: 18px 24px;' +
'      border-radius: 12px;' +
'      cursor: pointer;' +
'      transition: all 0.3s;' +
'      display: flex;' +
'      justify-content: space-between;' +
'      align-items: center;' +
'    }' +
'' +
'    .accordion-header:hover {' +
'      background: linear-gradient(135deg, #252b3a 0%, #1f2430 100%);' +
'      border-color: #3a4458;' +
'      transform: translateX(2px);' +
'    }' +
'' +
'    .accordion-header.active {' +
'      background: linear-gradient(135deg, #2357ff 0%, #1a47d9 100%);' +
'      border-color: #2357ff;' +
'    }' +
'' +
'    .accordion-header-left {' +
'      display: flex;' +
'      align-items: center;' +
'      gap: 12px;' +
'    }' +
'' +
'    .accordion-icon {' +
'      font-size: 24px;' +
'    }' +
'' +
'    .accordion-title {' +
'      font-size: 16px;' +
'      font-weight: 600;' +
'    }' +
'' +
'    .accordion-count {' +
'      background: #0f1115;' +
'      padding: 4px 12px;' +
'      border-radius: 12px;' +
'      font-size: 12px;' +
'      font-weight: 600;' +
'      color: #2357ff;' +
'    }' +
'' +
'    .accordion-arrow {' +
'      font-size: 20px;' +
'      transition: transform 0.3s;' +
'    }' +
'' +
'    .accordion-header.active .accordion-arrow {' +
'      transform: rotate(180deg);' +
'    }' +
'' +
'    .accordion-body {' +
'      max-height: 0;' +
'      overflow: hidden;' +
'      transition: max-height 0.3s ease-out;' +
'      background: #0f1115;' +
'      border: 1px solid #2a3040;' +
'      border-top: none;' +
'      border-radius: 0 0 12px 12px;' +
'      margin-top: -12px;' +
'      padding: 0 24px;' +
'    }' +
'' +
'    .accordion-body.active {' +
'      max-height: 2000px;' +
'      padding: 24px;' +
'      margin-top: 0;' +
'    }' +
'' +
'    .case-grid {' +
'      display: grid;' +
'      grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));' +
'      gap: 16px;' +
'      margin-top: 16px;' +
'    }' +
'' +
'    .case-card {' +
'      background: #141824;' +
'      border: 1px solid #2a3040;' +
'      padding: 16px;' +
'      border-radius: 10px;' +
'      cursor: pointer;' +
'      transition: all 0.2s;' +
'    }' +
'' +
'    .case-card:hover {' +
'      background: #1b1f2a;' +
'      border-color: #2357ff;' +
'      transform: translateY(-2px);' +
'      box-shadow: 0 4px 12px rgba(35, 87, 255, 0.2);' +
'    }' +
'' +
'    .case-card-header {' +
'      display: flex;' +
'      justify-content: space-between;' +
'      align-items: center;' +
'      margin-bottom: 10px;' +
'    }' +
'' +
'    .case-id {' +
'      font-size: 12px;' +
'      font-weight: 700;' +
'      color: #2357ff;' +
'      background: #0f1115;' +
'      padding: 4px 10px;' +
'      border-radius: 6px;' +
'    }' +
'' +
'    .case-row {' +
'      font-size: 11px;' +
'      color: #8b92a0;' +
'    }' +
'' +
'    .case-title {' +
'      font-size: 14px;' +
'      font-weight: 500;' +
'      color: #e7eaf0;' +
'      margin-bottom: 8px;' +
'      line-height: 1.4;' +
'    }' +
'' +
'    .case-meta {' +
'      display: flex;' +
'      gap: 8px;' +
'      flex-wrap: wrap;' +
'    }' +
'' +
'    .case-badge {' +
'      font-size: 11px;' +
'      padding: 4px 8px;' +
'      border-radius: 6px;' +
'      background: #0f1115;' +
'      color: #8b92a0;' +
'    }' +
'' +
'    .suggestion-box {' +
'      background: linear-gradient(135deg, #1e2533 0%, #181d28 100%);' +
'      border: 1px solid #2a3040;' +
'      border-left: 3px solid #2357ff;' +
'      padding: 20px;' +
'      border-radius: 10px;' +
'      margin-bottom: 24px;' +
'    }' +
'' +
'    .suggestion-box h3 {' +
'      font-size: 16px;' +
'      font-weight: 600;' +
'      margin-bottom: 12px;' +
'      color: #2357ff;' +
'      display: flex;' +
'      align-items: center;' +
'      gap: 8px;' +
'    }' +
'' +
'    .suggestion-box p {' +
'      font-size: 13px;' +
'      color: #8b92a0;' +
'      line-height: 1.6;' +
'      margin-bottom: 16px;' +
'    }' +
'' +
'    .suggestion-tags {' +
'      display: flex;' +
'      gap: 8px;' +
'      flex-wrap: wrap;' +
'    }' +
'' +
'    .suggestion-tag {' +
'      background: #0f1115;' +
'      border: 1px solid #2a3040;' +
'      padding: 6px 12px;' +
'      border-radius: 6px;' +
'      font-size: 12px;' +
'      color: #e7eaf0;' +
'      cursor: pointer;' +
'      transition: all 0.2s;' +
'    }' +
'' +
'    .suggestion-tag:hover {' +
'      background: #2357ff;' +
'      border-color: #2357ff;' +
'      color: #fff;' +
'    }' +
'' +
'    .empty-state {' +
'      text-align: center;' +
'      padding: 60px 20px;' +
'      color: #8b92a0;' +
'    }' +
'' +
'    .empty-state .icon {' +
'      font-size: 64px;' +
'      margin-bottom: 20px;' +
'      opacity: 0.5;' +
'    }' +
'' +
'    .empty-state h3 {' +
'      font-size: 18px;' +
'      font-weight: 600;' +
'      margin-bottom: 8px;' +
'      color: #e7eaf0;' +
'    }' +
'' +
'    .empty-state p {' +
'      font-size: 14px;' +
'      color: #8b92a0;' +
'    }' +
'' +
'    .group-header {' +
'      font-size: 14px;' +
'      font-weight: 600;' +
'      color: #2357ff;' +
'      margin-bottom: 12px;' +
'      padding-bottom: 8px;' +
'      border-bottom: 1px solid #2a3040;' +
'    }' +
'  </style>' +
'</head>' +
'<body>' +
'  <div class="header">' +
'    <div class="header-left">' +
'      <h1>🧩 Categories & Pathways - AI-Powered Grouping Logic</h1>' +
'      <div class="subtitle">Intelligent case organization using multiple pathway grouping strategies</div>' +
'    </div>' +
'    <div class="header-right">' +
'      <span class="stat-pill"><span class="number">' + totalCases + '</span> Total Cases</span>' +
'    </div>' +
'  </div>' +
'' +
'  <div class="controls-bar">' +
'    <div class="control-group">' +
'      <label>🎯 Pathway Grouping Logic Type</label>' +
'      <select id="logicTypeSelect" onchange="onLogicTypeChange()">' +
'        <option value="system">System-Based (CARD, RESP, NEUR, GI, etc.)</option>' +
'        <option value="protocol">Skill Protocol Series (ACLS, PALS, ATLS, NRP)</option>' +
'        <option value="specialty">Specialty/Department Series (GYN, PEDS, TRAUMA, TOX)</option>' +
'        <option value="experience">Patient Experience Series (Anxiety, Communication)</option>' +
'        <option value="complexity">Complexity Progression (Foundational → Advanced)</option>' +
'        <option value="reasoning">Clinical Reasoning (Diagnostic Dilemmas, Time-Critical)</option>' +
'      </select>' +
'    </div>' +
'    <button class="btn-analyze" onclick="analyzePathways()" id="analyzeBtn">' +
'      ✨ Analyze & Generate Suggestions' +
'    </button>' +
'  </div>' +
'' +
'  <div class="content" id="contentArea">' +
'    <div class="empty-state">' +
'      <div class="icon">🎯</div>' +
'      <h3>Ready to Analyze Pathways</h3>' +
'      <p>Select a grouping logic type and click "Analyze & Generate Suggestions" to begin</p>' +
'    </div>' +
'  </div>' +
'' +
'  <script>' +
'    let currentLogicType = "system";' +
'    let analysisResults = null;' +
'' +
'    function onLogicTypeChange() {' +
'      const select = document.getElementById("logicTypeSelect");' +
'      currentLogicType = select.value;' +
'      console.log("Logic type changed to:", currentLogicType);' +
'    }' +
'' +
'    function analyzePathways() {' +
'      const btn = document.getElementById("analyzeBtn");' +
'      const content = document.getElementById("contentArea");' +
'      ' +
'      btn.disabled = true;' +
'      btn.innerHTML = "🔄 Analyzing...";' +
'      ' +
'      content.innerHTML = ' +
'        "<div class=\\"loading\\">" +' +
'        "  <div class=\\"spinner\\">⚙️</div>" +' +
'        "  <h3>Analyzing case data with AI...</h3>" +' +
'        "  <p>This may take 10-20 seconds</p>" +' +
'        "</div>";' +
'      ' +
'      google.script.run' +
'        .withSuccessHandler(onAnalysisComplete)' +
'        .withFailureHandler(onAnalysisError)' +
'        .analyzePathwayGroupings(currentLogicType);' +
'    }' +
'' +
'    function onAnalysisComplete(results) {' +
'      analysisResults = results;' +
'      const btn = document.getElementById("analyzeBtn");' +
'      btn.disabled = false;' +
'      btn.innerHTML = "✨ Analyze & Generate Suggestions";' +
'      ' +
'      renderResults(results);' +
'    }' +
'' +
'    function onAnalysisError(error) {' +
'      const btn = document.getElementById("analyzeBtn");' +
'      const content = document.getElementById("contentArea");' +
'      ' +
'      btn.disabled = false;' +
'      btn.innerHTML = "✨ Analyze & Generate Suggestions";' +
'      ' +
'      content.innerHTML = ' +
'        "<div class=\\"empty-state\\">" +' +
'        "  <div class=\\"icon\\">❌</div>" +' +
'        "  <h3>Analysis Failed</h3>" +' +
'        "  <p>" + error.message + "</p>" +' +
'        "</div>";' +
'    }' +
'' +
'    function renderResults(results) {' +
'      const content = document.getElementById("contentArea");' +
'      let html = "";' +
'      ' +
'      if (results.newLogicSuggestions && results.newLogicSuggestions.length > 0) {' +
'        html += "<div class=\\"suggestion-box\\">";' +
'        html += "  <h3>💡 AI-Suggested New Logic Types</h3>";' +
'        html += "  <p>Based on patterns in your case data, these grouping logic types might be useful:</p>";' +
'        html += "  <div class=\\"suggestion-tags\\">";' +
'        results.newLogicSuggestions.forEach(function(suggestion) {' +
'          html += "    <span class=\\"suggestion-tag\\" onclick=\\"addLogicType(\'" + suggestion.replace(/"/g, "&quot;") + "\')\\" title=\\"Click to add to dropdown\\">";' +
'          html += suggestion;' +
'          html += "    </span>";' +
'        });' +
'        html += "  </div>";' +
'        html += "</div>";' +
'      }' +
'      ' +
'      if (results.groups && results.groups.length > 0) {' +
'        results.groups.forEach(function(group) {' +
'          html += "<div class=\\"accordion\\">";' +
'          html += "  <div class=\\"accordion-header\\" onclick=\\"toggleAccordion(this)\\">";' +
'          html += "    <div class=\\"accordion-header-left\\">";' +
'          html += "      <span class=\\"accordion-icon\\">" + (group.icon || "📁") + "</span>";' +
'          html += "      <span class=\\"accordion-title\\">" + group.name + "</span>";' +
'          html += "      <span class=\\"accordion-count\\">" + group.cases.length + " cases</span>";' +
'          html += "    </div>";' +
'          html += "    <span class=\\"accordion-arrow\\">▼</span>";' +
'          html += "  </div>";' +
'          html += "  <div class=\\"accordion-body\\">";' +
'          if (group.description) {' +
'            html += "    <p style=\\"color: #8b92a0; font-size: 13px; margin-bottom: 16px;\\">" + group.description + "</p>";' +
'          }' +
'          html += "    <div class=\\"case-grid\\">";' +
'          group.cases.forEach(function(caseItem) {' +
'            html += "      <div class=\\"case-card\\" onclick=\\"viewCase(" + caseItem.row + ")\\">";' +
'            html += "        <div class=\\"case-card-header\\">";' +
'            html += "          <span class=\\"case-id\\">" + caseItem.caseId + "</span>";' +
'            html += "          <span class=\\"case-row\\">Row " + caseItem.row + "</span>";' +
'            html += "        </div>";' +
'            html += "        <div class=\\"case-title\\">" + caseItem.sparkTitle + "</div>";' +
'            html += "        <div class=\\"case-meta\\">";' +
'            if (caseItem.category) {' +
'              html += "          <span class=\\"case-badge\\">" + caseItem.category + "</span>";' +
'            }' +
'            if (caseItem.pathway) {' +
'              html += "          <span class=\\"case-badge\\">" + caseItem.pathway + "</span>";' +
'            }' +
'            html += "        </div>";' +
'            html += "      </div>";' +
'          });' +
'          html += "    </div>";' +
'          html += "  </div>";' +
'          html += "</div>";' +
'        });' +
'      } else {' +
'        html += "<div class=\\"empty-state\\">";' +
'        html += "  <div class=\\"icon\\">🔍</div>";' +
'        html += "  <h3>No Groups Found</h3>";' +
'        html += "  <p>Try a different grouping logic type</p>";' +
'        html += "</div>";' +
'      }' +
'      ' +
'      content.innerHTML = html;' +
'    }' +
'' +
'    function toggleAccordion(header) {' +
'      const body = header.nextElementSibling;' +
'      const isActive = header.classList.contains("active");' +
'      ' +
'      header.classList.toggle("active");' +
'      body.classList.toggle("active");' +
'    }' +
'' +
'    function viewCase(row) {' +
'      console.log("Viewing case at row:", row);' +
'    }' +
'' +
'    function addLogicType(logicName) {' +
'      alert("New logic type: " + logicName + "\\n\\nThis would be added to the dropdown dynamically in production.");' +
'    }' +
'  </script>' +
'</body>' +
'</html>';
}

// ========== AI-POWERED PATHWAY GROUPING ENGINE ==========

function analyzePathwayGroupings(logicType) {
  const sheet = pickMasterSheet_();
  const data = sheet.getDataRange().getValues();
  const headers = data[1];

  // Get column indices
  const caseIdIdx = headers.indexOf('Case_Organization:Case_ID');
  const sparkIdx = headers.indexOf('Case_Organization:Spark_Title');
  const categoryIdx = headers.indexOf('Case_Organization:Category');
  const pathwayIdx = headers.indexOf('Case_Organization:Pathway_Name');
  const diagnosisIdx = headers.indexOf('Case_Orientation:Chief_Diagnosis');

  // Collect all case data
  const cases = [];
  for (let i = 2; i < data.length; i++) {
    cases.push({
      row: i + 1,
      caseId: data[i][caseIdIdx] || '',
      sparkTitle: data[i][sparkIdx] || '',
      category: data[i][categoryIdx] || '',
      pathway: data[i][pathwayIdx] || '',
      diagnosis: data[i][diagnosisIdx] || ''
    });
  }

  // Route to appropriate grouping logic
  switch (logicType) {
    case 'system':
      return groupByMedicalSystem_(cases);
    case 'protocol':
      return groupBySkillProtocol_(cases);
    case 'specialty':
      return groupBySpecialty_(cases);
    case 'experience':
      return groupByPatientExperience_(cases);
    case 'complexity':
      return groupByComplexity_(cases);
    case 'reasoning':
      return groupByClinicalReasoning_(cases);
    default:
      return { groups: [], newLogicSuggestions: [] };
  }
}

// ========== GROUPING LOGIC FUNCTIONS ==========

function groupByMedicalSystem_(cases) {
  const systemGroups = {
    'CARD': { name: 'Cardiovascular', icon: '❤️', cases: [], description: 'Heart, blood vessels, circulation' },
    'RESP': { name: 'Respiratory', icon: '🫁', cases: [], description: 'Lungs, airways, breathing' },
    'NEUR': { name: 'Neurological', icon: '🧠', cases: [], description: 'Brain, spinal cord, nerves' },
    'GI': { name: 'Gastrointestinal', icon: '🫃', cases: [], description: 'Digestive system, abdomen' },
    'ENDO': { name: 'Endocrine', icon: '🩺', cases: [], description: 'Hormones, diabetes, thyroid' },
    'RENAL': { name: 'Renal/Urinary', icon: '🫘', cases: [], description: 'Kidneys, bladder, urinary tract' },
    'ORTHO': { name: 'Orthopedic/Trauma', icon: '🦴', cases: [], description: 'Bones, joints, injuries' },
    'PSYCH': { name: 'Psychiatric', icon: '🧘', cases: [], description: 'Mental health, behavioral' },
    'SKIN': { name: 'Dermatologic', icon: '🧴', cases: [], description: 'Skin, rashes, wounds' },
    'OTHER': { name: 'Multi-System/Other', icon: '🔬', cases: [], description: 'Complex or uncategorized' }
  };

  cases.forEach(function(caseItem) {
    const category = caseItem.category.toUpperCase();
    let assigned = false;

    for (let sys in systemGroups) {
      if (category.indexOf(sys) !== -1) {
        systemGroups[sys].cases.push(caseItem);
        assigned = true;
        break;
      }
    }

    if (!assigned) {
      systemGroups['OTHER'].cases.push(caseItem);
    }
  });

  const groups = [];
  for (let sys in systemGroups) {
    if (systemGroups[sys].cases.length > 0) {
      groups.push(systemGroups[sys]);
    }
  }

  return {
    groups: groups,
    newLogicSuggestions: [
      'Age-Based Grouping (Pediatric vs Adult vs Geriatric)',
      'Acuity-Based (ESI Levels 1-5)',
      'Time-Sensitive (Golden Hour Cases)'
    ]
  };
}

function groupBySkillProtocol_(cases) {
  const protocolGroups = {
    'ACLS': { name: 'ACLS Cases', icon: '💓', cases: [], description: 'Advanced Cardiac Life Support protocols' },
    'PALS': { name: 'PALS Cases', icon: '👶', cases: [], description: 'Pediatric Advanced Life Support' },
    'ATLS': { name: 'ATLS Cases', icon: '🚑', cases: [], description: 'Advanced Trauma Life Support' },
    'NRP': { name: 'NRP Cases', icon: '🍼', cases: [], description: 'Neonatal Resuscitation Protocol' },
    'STROKE': { name: 'Stroke Protocol', icon: '🧠', cases: [], description: 'Time-critical stroke care' },
    'SEPSIS': { name: 'Sepsis Protocol', icon: '🦠', cases: [], description: 'Early sepsis recognition & treatment' }
  };

  cases.forEach(function(caseItem) {
    const diagnosis = caseItem.diagnosis.toUpperCase();
    const sparkTitle = caseItem.sparkTitle.toUpperCase();
    const combined = diagnosis + ' ' + sparkTitle;

    if (combined.indexOf('CARDIAC') !== -1 || combined.indexOf('ARREST') !== -1 || combined.indexOf('VTACH') !== -1 || combined.indexOf('VFIB') !== -1) {
      protocolGroups['ACLS'].cases.push(caseItem);
    } else if (combined.indexOf('PEDIATRIC') !== -1 || combined.indexOf('CHILD') !== -1 || combined.indexOf('INFANT') !== -1) {
      protocolGroups['PALS'].cases.push(caseItem);
    } else if (combined.indexOf('TRAUMA') !== -1 || combined.indexOf('INJURY') !== -1 || combined.indexOf('FRACTURE') !== -1) {
      protocolGroups['ATLS'].cases.push(caseItem);
    } else if (combined.indexOf('NEWBORN') !== -1 || combined.indexOf('NEONATE') !== -1) {
      protocolGroups['NRP'].cases.push(caseItem);
    } else if (combined.indexOf('STROKE') !== -1 || combined.indexOf('CVA') !== -1) {
      protocolGroups['STROKE'].cases.push(caseItem);
    } else if (combined.indexOf('SEPSIS') !== -1 || combined.indexOf('SEPTIC') !== -1) {
      protocolGroups['SEPSIS'].cases.push(caseItem);
    }
  });

  const groups = [];
  for (let protocol in protocolGroups) {
    if (protocolGroups[protocol].cases.length > 0) {
      groups.push(protocolGroups[protocol]);
    }
  }

  return {
    groups: groups,
    newLogicSuggestions: [
      'Code Team Training (All cardiac arrests)',
      'Rapid Response Scenarios',
      'Mass Casualty Incident Training'
    ]
  };
}

function groupBySpecialty_(cases) {
  const specialtyGroups = {
    'GYN': { name: 'Gynecology/OB', icon: '👶', cases: [], description: 'Women\'s health, pregnancy' },
    'PEDS': { name: 'Pediatrics', icon: '🧸', cases: [], description: 'Children and adolescents' },
    'TRAUMA': { name: 'Trauma Surgery', icon: '🚑', cases: [], description: 'Severe injuries, accidents' },
    'TOX': { name: 'Toxicology', icon: '☠️', cases: [], description: 'Poisonings, overdoses' },
    'PSYCH': { name: 'Psychiatry', icon: '🧠', cases: [], description: 'Mental health crises' },
    'ENT': { name: 'ENT', icon: '👂', cases: [], description: 'Ear, nose, throat' },
    'OPTHO': { name: 'Ophthalmology', icon: '👁️', cases: [], description: 'Eye emergencies' }
  };

  cases.forEach(function(caseItem) {
    const diagnosis = caseItem.diagnosis.toUpperCase();
    const sparkTitle = caseItem.sparkTitle.toUpperCase();
    const category = caseItem.category.toUpperCase();
    const combined = diagnosis + ' ' + sparkTitle + ' ' + category;

    if (combined.indexOf('PREGNAN') !== -1 || combined.indexOf('OB') !== -1 || combined.indexOf('GYN') !== -1) {
      specialtyGroups['GYN'].cases.push(caseItem);
    } else if (combined.indexOf('PEDS') !== -1 || combined.indexOf('CHILD') !== -1 || combined.indexOf('PEDIATRIC') !== -1) {
      specialtyGroups['PEDS'].cases.push(caseItem);
    } else if (combined.indexOf('TRAUMA') !== -1 || combined.indexOf('INJURY') !== -1) {
      specialtyGroups['TRAUMA'].cases.push(caseItem);
    } else if (combined.indexOf('POISON') !== -1 || combined.indexOf('OVERDOSE') !== -1 || combined.indexOf('TOXIC') !== -1) {
      specialtyGroups['TOX'].cases.push(caseItem);
    } else if (combined.indexOf('PSYCH') !== -1 || combined.indexOf('SUICID') !== -1 || combined.indexOf('ANXIETY') !== -1) {
      specialtyGroups['PSYCH'].cases.push(caseItem);
    } else if (combined.indexOf('EAR') !== -1 || combined.indexOf('NOSE') !== -1 || combined.indexOf('THROAT') !== -1) {
      specialtyGroups['ENT'].cases.push(caseItem);
    } else if (combined.indexOf('EYE') !== -1 || combined.indexOf('VISION') !== -1 || combined.indexOf('BLIND') !== -1) {
      specialtyGroups['OPTHO'].cases.push(caseItem);
    }
  });

  const groups = [];
  for (let specialty in specialtyGroups) {
    if (specialtyGroups[specialty].cases.length > 0) {
      groups.push(specialtyGroups[specialty]);
    }
  }

  return {
    groups: groups,
    newLogicSuggestions: [
      'Consultation-Required Cases',
      'Admission vs Discharge Decision Points',
      'ICU vs Floor Disposition'
    ]
  };
}

function groupByPatientExperience_(cases) {
  const experienceGroups = {
    'ANXIETY': { name: 'High-Anxiety Patients', icon: '😰', cases: [], description: 'Managing patient fear and anxiety' },
    'COMMUNICATION': { name: 'Communication Challenges', icon: '💬', cases: [], description: 'Language barriers, difficult conversations' },
    'FAMILY': { name: 'Family Dynamics', icon: '👨‍👩‍👧', cases: [], description: 'Complex family involvement' },
    'CULTURAL': { name: 'Cultural Competence', icon: '🌍', cases: [], description: 'Diverse cultural backgrounds' },
    'ETHICS': { name: 'Ethical Dilemmas', icon: '⚖️', cases: [], description: 'End-of-life, consent, autonomy' }
  };

  // This would ideally use AI to analyze case descriptions
  // For now, using simple keyword matching
  cases.forEach(function(caseItem) {
    const sparkTitle = caseItem.sparkTitle.toLowerCase();

    if (sparkTitle.indexOf('anxious') !== -1 || sparkTitle.indexOf('worried') !== -1 || sparkTitle.indexOf('scared') !== -1) {
      experienceGroups['ANXIETY'].cases.push(caseItem);
    }
    if (sparkTitle.indexOf('family') !== -1 || sparkTitle.indexOf('mother') !== -1 || sparkTitle.indexOf('father') !== -1) {
      experienceGroups['FAMILY'].cases.push(caseItem);
    }
  });

  const groups = [];
  for (let exp in experienceGroups) {
    if (experienceGroups[exp].cases.length > 0) {
      groups.push(experienceGroups[exp]);
    }
  }

  return {
    groups: groups.length > 0 ? groups : [
      { name: 'Patient Experience Analysis', icon: '💭', cases: [], description: 'No specific patterns detected - this requires deeper AI analysis' }
    ],
    newLogicSuggestions: [
      'Empathy Training Scenarios',
      'Breaking Bad News',
      'Conflict Resolution'
    ]
  };
}

function groupByComplexity_(cases) {
  const complexityGroups = {
    'FOUNDATIONAL': { name: 'Foundational Cases', icon: '📘', cases: [], description: 'Straightforward diagnoses, standard protocols' },
    'INTERMEDIATE': { name: 'Intermediate Cases', icon: '📙', cases: [], description: 'Multiple possibilities, some ambiguity' },
    'ADVANCED': { name: 'Advanced Cases', icon: '📕', cases: [], description: 'Complex multi-system, rare presentations' }
  };

  // Simple heuristic: cases with multiple categories or long diagnoses = complex
  cases.forEach(function(caseItem) {
    const diagnosisLength = caseItem.diagnosis.length;
    const hasMultipleCategories = caseItem.category.indexOf(',') !== -1 || caseItem.category.indexOf('/') !== -1;

    if (diagnosisLength > 50 || hasMultipleCategories) {
      complexityGroups['ADVANCED'].cases.push(caseItem);
    } else if (diagnosisLength > 25) {
      complexityGroups['INTERMEDIATE'].cases.push(caseItem);
    } else {
      complexityGroups['FOUNDATIONAL'].cases.push(caseItem);
    }
  });

  const groups = [];
  for (let level in complexityGroups) {
    if (complexityGroups[level].cases.length > 0) {
      groups.push(complexityGroups[level]);
    }
  }

  return {
    groups: groups,
    newLogicSuggestions: [
      'Student Level Progression (MS1 → MS4)',
      'Resident Level Training (PGY1 → PGY3)',
      'Board Exam Preparation'
    ]
  };
}

function groupByClinicalReasoning_(cases) {
  const reasoningGroups = {
    'DIAGNOSTIC': { name: 'Diagnostic Dilemmas', icon: '🔍', cases: [], description: 'Multiple differential diagnoses' },
    'TIME_CRITICAL': { name: 'Time-Critical Decisions', icon: '⏰', cases: [], description: 'Must diagnose and treat rapidly' },
    'RARE': { name: 'Rare Presentations', icon: '🦄', cases: [], description: 'Uncommon or atypical cases' },
    'PATTERN': { name: 'Pattern Recognition', icon: '🎯', cases: [], description: 'Classic presentations to memorize' }
  };

  // Keywords that suggest diagnostic complexity
  const diagnosticKeywords = ['differential', 'unclear', 'mystery', 'confusing'];
  const timeKeywords = ['cardiac arrest', 'stroke', 'sepsis', 'trauma', 'acute'];

  cases.forEach(function(caseItem) {
    const combined = (caseItem.sparkTitle + ' ' + caseItem.diagnosis).toLowerCase();

    let assigned = false;
    diagnosticKeywords.forEach(function(keyword) {
      if (combined.indexOf(keyword) !== -1) {
        reasoningGroups['DIAGNOSTIC'].cases.push(caseItem);
        assigned = true;
      }
    });

    if (!assigned) {
      timeKeywords.forEach(function(keyword) {
        if (combined.indexOf(keyword) !== -1) {
          reasoningGroups['TIME_CRITICAL'].cases.push(caseItem);
          assigned = true;
        }
      });
    }

    if (!assigned) {
      reasoningGroups['PATTERN'].cases.push(caseItem);
    }
  });

  const groups = [];
  for (let reasoning in reasoningGroups) {
    if (reasoningGroups[reasoning].cases.length > 0) {
      groups.push(reasoningGroups[reasoning]);
    }
  }

  return {
    groups: groups,
    newLogicSuggestions: [
      'Cognitive Bias Training (Anchoring, Confirmation)',
      'System 1 vs System 2 Thinking',
      'Near-Miss Learning'
    ]
  };
}
