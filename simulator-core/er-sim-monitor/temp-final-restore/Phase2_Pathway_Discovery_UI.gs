/**
 * PHASE 2: PATHWAY DISCOVERY UI
 *
 * User interface for:
 * - Logic type selection (sorted by usage frequency)
 * - Pathway discovery execution
 * - Results display with scoring and persuasion
 * - Manual sequence adjustment
 */

// ============================================================================
// LOGIC TYPE MANAGEMENT
// ============================================================================

/**
 * Get logic types for dropdown (sorted by usage frequency)
 */
function getLogicTypesForDropdown() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Logic_Type_Library');

  if (!sheet) {
    Logger.log('❌ Logic_Type_Library sheet not found');
    return [];
  }

  var data = sheet.getDataRange().getValues();
  var headers = data[0];

  // Column indices
  var idIdx = headers.indexOf('Logic_Type_ID');
  var nameIdx = headers.indexOf('Logic_Type_Name');
  var timesUsedIdx = headers.indexOf('Times_Used');
  var statusIdx = headers.indexOf('Status');

  // Build logic type objects
  var logicTypes = [];
  for (var i = 1; i < data.length; i++) {
    var status = data[i][statusIdx];

    // Only include active logic types
    if (status === 'active') {
      logicTypes.push({
        id: data[i][idIdx],
        name: data[i][nameIdx],
        timesUsed: parseInt(data[i][timesUsedIdx]) || 0
      });
    }
  }

  // Sort by Times_Used (descending), then by name (alphabetical)
  logicTypes.sort(function(a, b) {
    if (b.timesUsed !== a.timesUsed) {
      return b.timesUsed - a.timesUsed; // Higher usage first
    }
    return a.name.localeCompare(b.name); // Alphabetical if same usage
  });

  return logicTypes;
}

/**
 * Increment logic type usage count
 */
function incrementLogicTypeUsage(logicTypeId) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Logic_Type_Library');
  var data = sheet.getDataRange().getValues();
  var headers = data[0];

  var idIdx = headers.indexOf('Logic_Type_ID');
  var timesUsedIdx = headers.indexOf('Times_Used');

  // Find row with matching Logic_Type_ID
  for (var i = 1; i < data.length; i++) {
    if (data[i][idIdx] === logicTypeId) {
      var currentUsage = parseInt(data[i][timesUsedIdx]) || 0;
      var newUsage = currentUsage + 1;

      // Update Times_Used
      sheet.getRange(i + 1, timesUsedIdx + 1).setValue(newUsage);

      Logger.log('✅ Incremented ' + logicTypeId + ' usage: ' + currentUsage + ' → ' + newUsage);
      return newUsage;
    }
  }

  Logger.log('⚠️ Logic Type ' + logicTypeId + ' not found');
  return 0;
}

/**
 * Get logic type details by ID
 */
function getLogicTypeById(logicTypeId) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Logic_Type_Library');

  if (!sheet) {
    throw new Error('Logic_Type_Library sheet not found');
  }

  var data = sheet.getDataRange().getValues();
  var headers = data[0];

  var idIdx = headers.indexOf('Logic_Type_ID');
  var nameIdx = headers.indexOf('Logic_Type_Name');
  var descIdx = headers.indexOf('Description');
  var personaIdx = headers.indexOf('AI_Persona');
  var promptIdx = headers.indexOf('Full_Prompt');
  var intelIdx = headers.indexOf('Intelligence_Type');

  // Find matching row
  for (var i = 1; i < data.length; i++) {
    if (data[i][idIdx] === logicTypeId) {
      return {
        id: data[i][idIdx],
        name: data[i][nameIdx],
        description: data[i][descIdx],
        persona: data[i][personaIdx],
        prompt: data[i][promptIdx],
        intelligenceType: data[i][intelIdx]
      };
    }
  }

  throw new Error('Logic Type not found: ' + logicTypeId);
}

// ============================================================================
// PATHWAY DISCOVERY EXECUTION
// ============================================================================

/**
 * Discover pathways using selected logic type
 */
function discoverPathwaysWithLogicType(logicTypeId) {
  Logger.log('🔍 Starting pathway discovery with logic type: ' + logicTypeId);

  try {
    // 1. Get logic type details
    var logicType = getLogicTypeById(logicTypeId);
    Logger.log('📚 Logic Type: ' + logicType.name);

    // 2. Increment usage count
    incrementLogicTypeUsage(logicTypeId);

    // 3. Load cached case data from Field_Cache_Incremental
    var caseData = loadCachedCaseData_();
    Logger.log('📊 Loaded ' + caseData.length + ' cases from cache');

    // 4. Call OpenAI with logic type prompt
    var discoveredPathways = discoverPathwaysWithAI_(logicType, caseData);
    Logger.log('✅ Discovered ' + discoveredPathways.length + ' pathways');

    // 5. Score each pathway
    var scoredPathways = [];
    for (var i = 0; i < discoveredPathways.length; i++) {
      var pathway = discoveredPathways[i];
      Logger.log('🎯 Scoring pathway ' + (i + 1) + ': ' + pathway.name);

      var scoringResult = scorePathway(pathway);
      var sequenceRationale = generateSequenceRationale(pathway);

      scoredPathways.push({
        pathway: pathway,
        scoring: scoringResult,
        sequence_rationale: sequenceRationale
      });
    }

    // 6. Sort by composite score (descending)
    scoredPathways.sort(function(a, b) {
      return b.scoring.composite_score - a.scoring.composite_score;
    });

    // 7. Save to Pathways_Master sheet
    savePathwaysToMaster_(scoredPathways, logicType);

    // 8. Return results for UI display
    return {
      success: true,
      logicType: logicType.name,
      pathwaysCount: scoredPathways.length,
      pathways: scoredPathways
    };

  } catch (error) {
    Logger.log('❌ Discovery error: ' + error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Load cached case data from Field_Cache_Incremental
 */
function loadCachedCaseData_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var cacheSheet = ss.getSheetByName('Field_Cache_Incremental');

  if (!cacheSheet) {
    throw new Error('Field_Cache_Incremental sheet not found. Run batch cache first.');
  }

  var data = cacheSheet.getDataRange().getValues();
  var headers = data[0];

  // Build case objects
  var cases = [];
  for (var i = 1; i < data.length; i++) {
    var caseObj = {};
    for (var j = 0; j < headers.length; j++) {
      caseObj[headers[j]] = data[i][j];
    }
    cases.push(caseObj);
  }

  return cases;
}

/**
 * Call OpenAI to discover pathways using logic type
 */
function discoverPathwaysWithAI_(logicType, caseData) {
  var apiKey = getOpenAIKey_();

  // Build discovery prompt
  var prompt = buildDiscoveryPrompt_(logicType, caseData);

  // Call OpenAI
  var response = callOpenAI_(prompt, apiKey);
  var result = parseOpenAIJSON_(response);

  return result.pathways || [];
}

/**
 * Build discovery prompt from logic type and case data
 */
function buildDiscoveryPrompt_(logicType, caseData) {
  // Create case catalog summary
  var caseCatalog = caseData.map(function(c, idx) {
    return (idx + 1) + '. ' + c.Simulation_ID + ' - ' + c.Chief_Complaint;
  }).join('\n');

  var prompt = `
You are ${logicType.persona}.

${logicType.description}

TASK: Analyze this catalog of ${caseData.length} emergency medicine simulation cases and discover HIGH-VALUE learning pathways using your unique perspective.

CASE CATALOG:
${caseCatalog}

DISCOVERY RULES:
1. Suggest 3-5 pathways (quality over quantity)
2. Each pathway should have 4-8 cases (digestible for learners)
3. Groupings should be NON-OBVIOUS (not just organ systems)
4. Focus on EMERGENT PATTERNS humans might miss
5. Explain WHY each grouping creates learning value

RETURN JSON:
{
  "pathways": [
    {
      "id": "PATH_001",
      "name": "Compelling pathway name (5-8 words)",
      "description": "What makes this pathway valuable (2-3 sentences)",
      "caseIds": ["GI01234", "CP05678", ...],
      "caseTitles": ["Brief case title", ...],
      "caseDiagnoses": ["Final diagnosis", ...],
      "caseSequence": ["GI01234", "CP05678", ...],
      "targetLearner": "PGY1-3",
      "learningOutcomes": ["Specific measurable outcome 1", "Outcome 2", ...],
      "progressionStyle": "Sequential",
      "logicType": "${logicType.name}"
    }
  ]
}
`;

  return prompt;
}

/**
 * Save pathways to Pathways_Master sheet
 */
function savePathwaysToMaster_(scoredPathways, logicType) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var masterSheet = ss.getSheetByName('Pathways_Master');

  if (!masterSheet) {
    throw new Error('Pathways_Master sheet not found');
  }

  // Activate sheet to prevent auto-switching bug
  masterSheet.activate();

  var today = new Date().toISOString().split('T')[0];

  // Build rows
  var rows = [];
  for (var i = 0; i < scoredPathways.length; i++) {
    var sp = scoredPathways[i];
    var p = sp.pathway;
    var s = sp.scoring;

    rows.push([
      p.id,                                          // Pathway_ID
      p.name,                                        // Pathway_Name
      p.description,                                 // Description
      p.logicType,                                   // Logic_Type
      JSON.stringify(p.caseIds),                     // Case_IDs
      JSON.stringify(p.caseSequence),                // Case_Sequence
      p.caseIds.length,                              // Case_Count
      p.targetLearner,                               // Target_Learner
      JSON.stringify(p.learningOutcomes),            // Learning_Outcomes
      s.composite_score,                             // Composite_Score
      s.tier,                                        // Tier
      s.educational_value.educational_value_score,   // Educational_Score
      s.novelty.novelty_score,                       // Novelty_Score
      s.market_validation.market_validation_score,   // Market_Score
      s.persuasion.persuasion_narrative,             // Persuasion_Narrative
      JSON.stringify(sp.sequence_rationale),         // Sequence_Rationale
      today,                                         // Date_Discovered
      'pending'                                      // Status
    ]);
  }

  // Append rows
  if (rows.length > 0) {
    masterSheet.getRange(masterSheet.getLastRow() + 1, 1, rows.length, 18).setValues(rows);
    Logger.log('✅ Saved ' + rows.length + ' pathways to Pathways_Master');
  }
}

// ============================================================================
// UI SIDEBAR
// ============================================================================

/**
 * Show pathway discovery sidebar
 */
function showPathwayDiscoverySidebar() {
  var html = buildPathwayDiscoveryHTML_();
  var ui = HtmlService.createHtmlOutput(html)
    .setTitle('🔍 Discover Pathways')
    .setWidth(400);

  SpreadsheetApp.getUi().showSidebar(ui);
}

/**
 * Build pathway discovery sidebar HTML
 */
function buildPathwayDiscoveryHTML_() {
  var logicTypes = getLogicTypesForDropdown();

  var html = `
<!DOCTYPE html>
<html>
<head>
  <base target="_top">
  <style>
    body {
      font-family: 'Google Sans', Arial, sans-serif;
      padding: 16px;
      background: #f8f9fa;
    }
    .form-group {
      margin-bottom: 20px;
    }
    label {
      display: block;
      font-weight: 600;
      margin-bottom: 8px;
      color: #202124;
    }
    select, button {
      width: 100%;
      padding: 10px;
      font-size: 14px;
      border: 1px solid #dadce0;
      border-radius: 4px;
    }
    select:focus {
      outline: none;
      border-color: #1a73e8;
    }
    button {
      background: #1a73e8;
      color: white;
      font-weight: 600;
      cursor: pointer;
      border: none;
      margin-top: 10px;
    }
    button:hover {
      background: #1557b0;
    }
    button:disabled {
      background: #dadce0;
      cursor: not-allowed;
    }
    .help-text {
      font-size: 12px;
      color: #5f6368;
      margin-top: 4px;
    }
    .results {
      margin-top: 20px;
      padding: 16px;
      background: white;
      border-radius: 8px;
      border: 1px solid #dadce0;
      display: none;
    }
    .pathway-card {
      margin-bottom: 16px;
      padding: 12px;
      background: #f8f9fa;
      border-radius: 4px;
      border-left: 4px solid #1a73e8;
    }
    .tier-badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
      margin-left: 8px;
    }
    .tier-s { background: #ffd700; color: #000; }
    .tier-a { background: #c0c0c0; color: #000; }
    .tier-b { background: #cd7f32; color: #fff; }
    .tier-c { background: #e8eaed; color: #000; }
    .tier-d { background: #f1f3f4; color: #5f6368; }
  </style>
</head>
<body>
  <h2>🔍 Discover Pathways</h2>
  <p>Select a logic type to discover high-value learning pathways using AI.</p>

  <div class="form-group">
    <label for="logic-type-selector">🧠 Logic Type (Discovery Lens)</label>
    <select id="logic-type-selector" onchange="handleLogicTypeChange()">
      <option value="">-- Select Logic Type --</option>`;

  for (var i = 0; i < logicTypes.length; i++) {
    var lt = logicTypes[i];
    var usageLabel = lt.timesUsed > 0 ? ' (' + lt.timesUsed + ' uses)' : '';
    html += '<option value="' + lt.id + '">' + lt.name + usageLabel + '</option>';
  }

  html += `
      <option value="" disabled>──────────────────</option>
      <option value="CREATE_NEW">🎨 Create New Logic Type...</option>
    </select>
    <div class="help-text">Most frequently used logic types appear first</div>
  </div>

  <button id="discover-btn" onclick="discoverPathways()" disabled>
    🤖 Discover Pathways
  </button>

  <div id="results" class="results">
    <h3>Discovery Results</h3>
    <div id="results-content"></div>
  </div>

  <script>
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

      // Show results
      const resultsDiv = document.getElementById('results');
      const contentDiv = document.getElementById('results-content');

      let html = '<p><strong>' + result.pathwaysCount + ' pathways discovered using "' + result.logicType + '"</strong></p>';

      result.pathways.forEach(function(sp, idx) {
        const p = sp.pathway;
        const s = sp.scoring;
        const tierClass = 'tier-' + s.tier.charAt(0).toLowerCase();

        html += '<div class="pathway-card">';
        html += '<strong>' + (idx + 1) + '. ' + p.name + '</strong>';
        html += '<span class="tier-badge ' + tierClass + '">' + s.tier + '</span>';
        html += '<p style="margin: 8px 0; font-size: 13px;">' + p.description + '</p>';
        html += '<p style="margin: 8px 0; font-size: 12px; color: #5f6368;"><em>"' + s.persuasion.persuasion_narrative + '"</em></p>';
        html += '<p style="margin: 8px 0; font-size: 12px;">📊 Score: ' + s.composite_score + '/10 | 📚 Cases: ' + p.caseIds.length + '</p>';
        html += '</div>';
      });

      contentDiv.innerHTML = html;
      resultsDiv.style.display = 'block';

      // Success toast
      alert('✅ Discovery complete! ' + result.pathwaysCount + ' pathways saved to Pathways_Master sheet.');
    }

    function handleDiscoveryError(error) {
      const btn = document.getElementById('discover-btn');
      btn.disabled = false;
      btn.textContent = '🤖 Discover Pathways';

      alert('Error during discovery: ' + error.message);
    }
  </script>
</body>
</html>
  `;

  return html;
}

// ============================================================================
// MENU INTEGRATION
// ============================================================================

/**
 * Add pathway discovery menu item (call from onOpen)
 */
function addPathwayDiscoveryMenu() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('🔍 Pathway Discovery')
    .addItem('Discover Pathways', 'showPathwayDiscoverySidebar')
    .addSeparator()
    .addItem('View All Pathways', 'viewAllPathways')
    .addItem('Manage Logic Types', 'manageLogicTypes')
    .addToUi();
}

/**
 * View all discovered pathways
 */
function viewAllPathways() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var masterSheet = ss.getSheetByName('Pathways_Master');

  if (!masterSheet) {
    SpreadsheetApp.getUi().alert('Pathways_Master sheet not found');
    return;
  }

  masterSheet.activate();
  SpreadsheetApp.getUi().alert('Showing all discovered pathways in Pathways_Master sheet');
}

/**
 * Manage logic types
 */
function manageLogicTypes() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var librarySheet = ss.getSheetByName('Logic_Type_Library');

  if (!librarySheet) {
    SpreadsheetApp.getUi().alert('Logic_Type_Library sheet not found');
    return;
  }

  librarySheet.activate();
  SpreadsheetApp.getUi().alert('Showing Logic Type Library. You can add custom logic types here.');
}
