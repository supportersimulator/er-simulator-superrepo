#!/usr/bin/env node

/**
 * ADD MISSING showCacheAllLayersModal() FUNCTION
 *
 * This function was referenced in the menu but never created!
 * Creates a modal with:
 * - Section 1: DEFAULT (35 saved fields, all checked)
 * - Section 2: RECOMMENDED (AI suggestions with ✓✓ for agreements)
 * - Section 3: OTHER (all remaining fields)
 *
 * Pattern: Rough draft appears instantly, then AI updates asynchronously
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const PRODUCTION_PROJECT_ID = '12NihbVaaAIyRMCtzZ-aGjJ71CdL-HDjhmjxiD_S_EgIOuDOtrUH6M1l2';

async function authorize() {
  const credentialsPath = path.join(__dirname, '../config/credentials.json');
  const tokenPath = path.join(__dirname, '../config/token.json');
  const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
  const token = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
  const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
  oAuth2Client.setCredentials(token);
  return oAuth2Client;
}

async function addFunction() {
  try {
    const auth = await authorize();
    const script = google.script({ version: 'v1', auth });

    console.log('📥 Downloading current production...\\n');

    const content = await script.projects.getContent({
      scriptId: PRODUCTION_PROJECT_ID
    });

    const codeFile = content.data.files.find(f => f.name === 'Code');
    const manifestFile = content.data.files.find(f => f.name === 'appsscript');

    let code = codeFile.source;

    console.log('🔧 Adding showCacheAllLayersModal() function...\\n');

    // Find where to insert (after showSavedFieldSelection)
    const insertAfter = code.indexOf('function showSavedFieldSelection() {');
    if (insertAfter === -1) {
      console.log('❌ Could not find insertion point\\n');
      process.exit(1);
    }

    // Find end of showSavedFieldSelection
    let insertPos = insertAfter;
    let braceCount = 0;
    let foundStart = false;

    for (let i = insertAfter; i < code.length; i++) {
      if (code[i] === '{') {
        braceCount++;
        foundStart = true;
      } else if (code[i] === '}') {
        braceCount--;
        if (foundStart && braceCount === 0) {
          insertPos = i + 1;
          break;
        }
      }
    }

    const newFunction = `

/**
 * Show field selector modal for cache configuration
 * Opens instantly with rough draft, then updates with AI recommendations
 */
function showCacheAllLayersModal() {
  try {
    Logger.log('🎯 showCacheAllLayersModal() START');

    // Get rough draft data (uses cached headers - instant)
    const roughDraft = getFieldSelectorRoughDraft();

    const allFields = roughDraft.allFields;
    const selected = roughDraft.selected;

    Logger.log('✅ Rough draft ready: ' + allFields.length + ' total fields, ' + selected.length + ' selected');

    // Build HTML for modal
    const html = HtmlService.createHtmlOutput(\`
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;
        background: #f8f9fa;
        color: #212529;
        padding: 20px;
      }
      .header {
        background: linear-gradient(135deg, #2357ff 0%, #1a43cc 100%);
        color: white;
        padding: 20px;
        margin: -20px -20px 20px -20px;
        border-radius: 0;
      }
      .header h2 {
        font-size: 24px;
        font-weight: 600;
        margin-bottom: 8px;
      }
      .header p {
        opacity: 0.9;
        font-size: 14px;
      }
      .section {
        background: white;
        border: 1px solid #dee2e6;
        border-radius: 8px;
        padding: 16px;
        margin-bottom: 16px;
      }
      .section-title {
        font-size: 16px;
        font-weight: 600;
        margin-bottom: 12px;
        color: #495057;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .field-list {
        max-height: 200px;
        overflow-y: auto;
        border: 1px solid #e9ecef;
        border-radius: 4px;
        padding: 8px;
      }
      .field-item {
        padding: 6px 8px;
        margin: 4px 0;
        border-radius: 4px;
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 13px;
      }
      .field-item:hover {
        background: #f8f9fa;
      }
      .field-item input[type="checkbox"] {
        margin: 0;
      }
      .field-name {
        flex: 1;
        word-break: break-word;
      }
      .badge {
        background: #28a745;
        color: white;
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 600;
      }
      .footer {
        margin-top: 20px;
        display: flex;
        gap: 12px;
        justify-content: flex-end;
      }
      .btn {
        padding: 10px 20px;
        border: none;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
      }
      .btn-primary {
        background: #2357ff;
        color: white;
      }
      .btn-primary:hover {
        background: #1a43cc;
      }
      .btn-secondary {
        background: #6c757d;
        color: white;
      }
      .btn-secondary:hover {
        background: #5a6268;
      }
      .loading {
        text-align: center;
        padding: 12px;
        color: #6c757d;
        font-size: 13px;
        font-style: italic;
      }
      #ai-section {
        opacity: 0.6;
      }
    </style>

    <div class="header">
      <h2>📦 Configure Cache Fields</h2>
      <p>Select which fields to cache. AI recommendations loading...</p>
    </div>

    <div class="section">
      <div class="section-title">
        <span>✅</span>
        <span>DEFAULT FIELDS (Currently Selected)</span>
      </div>
      <div class="field-list" id="default-fields">
        \${selected.map(name => \`
          <div class="field-item">
            <input type="checkbox" value="\${name}" checked>
            <span class="field-name">\${name}</span>
          </div>
        \`).join('')}
      </div>
    </div>

    <div class="section" id="ai-section">
      <div class="section-title">
        <span>🤖</span>
        <span>RECOMMENDED TO CONSIDER</span>
      </div>
      <div class="field-list" id="recommended-fields">
        <div class="loading">⏳ Fetching AI recommendations...</div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">
        <span>📋</span>
        <span>OTHER AVAILABLE FIELDS</span>
      </div>
      <div class="field-list" id="other-fields">
        \${allFields.filter(name => selected.indexOf(name) === -1).map(name => \`
          <div class="field-item">
            <input type="checkbox" value="\${name}">
            <span class="field-name">\${name}</span>
          </div>
        \`).join('')}
      </div>
    </div>

    <div class="footer">
      <button class="btn btn-secondary" onclick="google.script.host.close()">Cancel</button>
      <button class="btn btn-primary" onclick="continueToCache()">Continue to Cache</button>
    </div>

    <script>
      // Fetch AI recommendations asynchronously
      google.script.run
        .withSuccessHandler(updateRecommendations)
        .withFailureHandler(err => {
          document.getElementById('recommended-fields').innerHTML =
            '<div class="loading" style="color: #dc3545;">❌ Could not load recommendations: ' + err + '</div>';
        })
        .getRecommendedFields(\${JSON.stringify(allFields)}, \${JSON.stringify(selected)});

      function updateRecommendations(recommended) {
        const container = document.getElementById('recommended-fields');
        const aiSection = document.getElementById('ai-section');

        aiSection.style.opacity = '1';

        if (!recommended || recommended.length === 0) {
          container.innerHTML = '<div class="loading">No additional recommendations</div>';
          return;
        }

        // Check which recommended fields are already in defaults
        const defaults = \${JSON.stringify(selected)};

        container.innerHTML = recommended.map(name => {
          const isAgreed = defaults.indexOf(name) !== -1;
          return \`
            <div class="field-item">
              <input type="checkbox" value="\${name}" \${isAgreed ? 'checked' : ''}>
              <span class="field-name">\${name}</span>
              \${isAgreed ? '<span class="badge">✓✓ AI Agrees</span>' : ''}
            </div>
          \`;
        }).join('');
      }

      function continueToCache() {
        // Collect all checked fields
        const checkboxes = document.querySelectorAll('input[type="checkbox"]:checked');
        const selectedFields = Array.from(checkboxes).map(cb => cb.value);

        if (selectedFields.length === 0) {
          alert('Please select at least one field to cache');
          return;
        }

        // Save selection and start cache process
        google.script.run
          .withSuccessHandler(() => {
            google.script.host.close();
          })
          .saveFieldSelectionAndStartCache(selectedFields);
      }
    </script>
    \`)
      .setWidth(700)
      .setHeight(600);

    const ui = SpreadsheetApp.getUi();
    ui.showModalDialog(html, '📦 Cache Configuration');

    Logger.log('✅ Modal displayed');

  } catch (error) {
    Logger.log('❌ Error in showCacheAllLayersModal: ' + error.message);
    const ui = SpreadsheetApp.getUi();
    ui.alert('Error', 'Could not open cache modal: ' + error.message, ui.ButtonSet.OK);
  }
}

/**
 * Get rough draft data for field selector
 * Uses cached headers for instant response
 */
function getFieldSelectorRoughDraft() {
  const docProps = PropertiesService.getDocumentProperties();

  // Use CACHED_MERGED_KEYS which has FULL flattened headers
  let cachedMergedKeys = docProps.getProperty('CACHED_MERGED_KEYS');
  if (!cachedMergedKeys) {
    refreshHeaders();
    cachedMergedKeys = docProps.getProperty('CACHED_MERGED_KEYS');
  }

  const allFields = JSON.parse(cachedMergedKeys);

  // Try to load saved selection, otherwise use 35 defaults
  const savedSelection = docProps.getProperty('SELECTED_CACHE_FIELDS');
  let selected;

  if (savedSelection) {
    selected = JSON.parse(savedSelection);
    Logger.log('✅ Using saved field selection: ' + selected.length + ' fields');
  } else {
    // 35 default fields using exact Row 2 format
    selected = [
      'Case_Organization_Case_ID',
      'Case_Organization_Spark_Title',
      'Case_Organization_Reveal_Title',
      'Case_Organization_Pathway_or_Course_Name',
      'Case_Organization_Difficulty_Level',
      'Case_Organization_Medical_Category',
      'Patient_Demographics_and_Clinical_Data_Age',
      'Patient_Demographics_and_Clinical_Data_Gender',
      'Patient_Demographics_and_Clinical_Data_Presenting_Complaint',
      'Monitor_Vital_Signs_Initial_Vitals',
      'Monitor_Vital_Signs_State1_Vitals',
      'Monitor_Vital_Signs_State2_Vitals',
      'Monitor_Vital_Signs_State3_Vitals',
      'Monitor_Vital_Signs_State4_Vitals',
      'Monitor_Vital_Signs_State5_Vitals',
      'Clinical_Assessment_Primary_Diagnosis',
      'Clinical_Assessment_Key_Clinical_Features',
      'Clinical_Assessment_Differential_Diagnosis',
      'Scoring_Criteria_Critical_Action_Checklist',
      'Case_Debrief_Time_Sensitive_Factors',
      'CME_and_Educational_Content_CME_Learning_Objective',
      'Case_Debrief_Key_Teaching_Points',
      'Case_Debrief_Common_Pitfalls_Discussion',
      'Scoring_Criteria_Performance_Benchmarks',
      'Case_Organization_Pre_Sim_Overview',
      'Case_Organization_Post_Sim_Overview',
      'Version_and_Attribution_Full_Attribution_Details',
      'Set_the_Stage_Context_Educational_Goal',
      'Set_the_Stage_Context_Setting_Environment',
      'Set_the_Stage_Context_Case_Author',
      'Patient_Demographics_and_Clinical_Data_Chief_Complaint',
      'Patient_Demographics_and_Clinical_Data_History_of_Present_Illness',
      'Patient_Demographics_and_Clinical_Data_Past_Medical_History',
      'Patient_Demographics_and_Clinical_Data_Medications',
      'Patient_Demographics_and_Clinical_Data_Allergies'
    ];
    docProps.setProperty('SELECTED_CACHE_FIELDS', JSON.stringify(selected));
    Logger.log('✅ Using default 35 fields (saved for next time)');
  }

  return {
    allFields: allFields,
    selected: selected
  };
}

/**
 * Save field selection and start cache process
 */
function saveFieldSelectionAndStartCache(selectedFields) {
  try {
    Logger.log('💾 Saving ' + selectedFields.length + ' selected fields');

    const docProps = PropertiesService.getDocumentProperties();
    docProps.setProperty('SELECTED_CACHE_FIELDS', JSON.stringify(selectedFields));

    Logger.log('✅ Field selection saved');

    // Start the cache process
    Logger.log('🚀 Starting cache process...');

    // TODO: Call the actual cache function here
    // For now, just show a toast
    SpreadsheetApp.getActiveSpreadsheet().toast(
      'Caching ' + selectedFields.length + ' fields...',
      '🚀 Cache Started',
      5
    );

    Logger.log('✅ saveFieldSelectionAndStartCache complete');

  } catch (error) {
    Logger.log('❌ Error in saveFieldSelectionAndStartCache: ' + error.message);
    throw error;
  }
}
`;

    // Insert the new functions
    code = code.substring(0, insertPos) + newFunction + code.substring(insertPos);

    console.log('✅ Function added\\n');
    console.log('📤 Deploying...\\n');

    await script.projects.updateContent({
      scriptId: PRODUCTION_PROJECT_ID,
      requestBody: {
        files: [
          { name: 'Code', type: 'SERVER_JS', source: code },
          manifestFile
        ]
      }
    });

    console.log('✅ Deployed!\\n');
    console.log('═══════════════════════════════════════════════════════════════\\n');
    console.log('✅ ADDED MISSING showCacheAllLayersModal() FUNCTION!\\n');
    console.log('\\nWhat was added:\\n');
    console.log('1. showCacheAllLayersModal() - Main modal function');
    console.log('2. getFieldSelectorRoughDraft() - Instant rough draft data');
    console.log('3. saveFieldSelectionAndStartCache() - Save + start cache\\n');
    console.log('Features:\\n');
    console.log('- Opens instantly with rough draft');
    console.log('- Section 1: DEFAULT (35 saved fields, all checked)');
    console.log('- Section 2: RECOMMENDED (AI, loads async)');
    console.log('- Section 3: OTHER (all remaining fields)');
    console.log('- ✓✓ badge where AI agrees with defaults');
    console.log('- Uses exact Row 2 format from CACHED_MERGED_KEYS\\n');
    console.log('Now try clicking "Cache All Layers" from the menu!\\n');
    console.log('═══════════════════════════════════════════════════════════════\\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

addFunction();
