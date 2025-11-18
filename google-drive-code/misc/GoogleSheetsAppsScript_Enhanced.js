/**
 * ER Simulator - AI-Powered Waveform Management System
 *
 * VERSION: 2.0 (Enhanced with AI + Nested Menu)
 *
 * HOW TO INSTALL:
 * 1. Open your Google Sheet: Convert_Master_Sim_CSV_Template_with_Input
 * 2. Go to Extensions → Apps Script
 * 3. Delete any existing code
 * 4. Paste this entire file
 * 5. Save (Ctrl/Cmd + S)
 * 6. Refresh your sheet - you'll see enhanced "ER Simulator" menu
 *
 * CONFIGURATION:
 * - Set OPENAI_API_KEY in Script Properties (File → Project properties → Script properties)
 * - Key name: OPENAI_API_KEY
 * - Get key from: https://platform.openai.com/api-keys
 */

// Configuration
const OPENAI_API_KEY = PropertiesService.getScriptProperties().getProperty('OPENAI_API_KEY');
const ECG_CONVERTER_URL = "file:///Users/aarontjomsland/er-sim-monitor/ecg-to-svg-converter.html";

// Available waveforms (Universal Naming Standard)
const WAVEFORMS = {
  'sinus_ecg': 'Normal Sinus Rhythm',
  'afib_ecg': 'Atrial Fibrillation',
  'aflutter_ecg': 'Atrial Flutter',
  'svt_ecg': 'Supraventricular Tachycardia',
  'vtach_ecg': 'Ventricular Tachycardia',
  'vfib_ecg': 'Ventricular Fibrillation',
  'asystole_ecg': 'Asystole (Flatline)',
  'paced_ecg': 'Paced Rhythm',
  'junctional_ecg': 'Junctional Rhythm',
  'bigeminy_ecg': 'Ventricular Bigeminy',
  'trigeminy_ecg': 'Ventricular Trigeminy',
  'idioventricular_ecg': 'Idioventricular Rhythm',
  'torsades_ecg': 'Torsades de Pointes',
  'peapulseless_ecg': 'Pulseless Electrical Activity',
  'artifact_ecg': 'Artifact / Noise'
};

/**
 * Creates enhanced custom menu with nested Waveforms submenu
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();

  ui.createMenu('ER Simulator')
    // Main menu items
    .addItem('📂 View Cases by Category', 'viewCasesByCategory')
    .addItem('🔍 Jump to Case by ID', 'jumpToCaseById')
    .addItem('🧩 View Pathway Organization', 'viewPathwayOrganization')
    .addSeparator()

    // Nested Waveforms submenu
    .addSubMenu(ui.createMenu('📊 Waveforms')
      .addItem('1️⃣ Adjust Waveforms Data', 'openWaveformAdjustmentTool')
      .addItem('2️⃣ ECG to SVG Converter', 'launchECGConverter')
      .addSeparator()
      .addItem('🩺 Suggest Mapping (Current Row)', 'suggestWaveformMapping')
      .addItem('🔄 Auto-Map All Waveforms', 'autoMapAllWaveforms')
      .addItem('📊 Analyze Current Mappings', 'analyzeCurrentMappings')
      .addItem('❌ Clear All Waveforms', 'clearAllWaveforms'))

    .addSeparator()
    .addItem('✅ Validate Current Row', 'validateCurrentRow')
    .addItem('⚙️ Configure OpenAI API Key', 'configureOpenAIKey')
    .addToUi();
}

/****************************************************
 * 🚀 NEW: AI-POWERED WAVEFORM ADJUSTMENT TOOL
 ****************************************************/

/**
 * Opens the AI-Powered Waveform Adjustment Tool in sidebar
 */
function openWaveformAdjustmentTool() {
  const htmlOutput = HtmlService.createHtmlOutputFromFile('WaveformAdjustmentTool')
    .setTitle('Adjust Waveforms Data')
    .setWidth(400);

  SpreadsheetApp.getUi().showSidebar(htmlOutput);
}

/**
 * Gets all cases with their waveform data for the adjustment tool
 */
function getAllCasesForAdjustmentTool() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Master Scenario Convert');
  if (!sheet) return { error: 'Sheet not found' };

  const headers = getHeaders(sheet);
  const dataRange = sheet.getRange(3, 1, sheet.getLastRow() - 2, headers.length);
  const data = dataRange.getValues();

  const cases = [];

  data.forEach((row, rowIndex) => {
    const caseData = buildCaseObject(headers, row);
    const caseId = caseData['Case_Organization:Case_ID'];
    const caseTitle = caseData['Case_Organization:Reveal_Title'] || caseData['Case_Organization:Spark_Title'];

    if (!caseId) return;

    const caseInfo = {
      rowIndex: rowIndex + 3,
      caseId: caseId,
      title: caseTitle,
      category: caseData['Case_Organization:Medical_Category'],
      states: []
    };

    // Extract vitals and waveforms for each state
    const vitalsFields = ['Initial_Vitals', 'State1_Vitals', 'State2_Vitals', 'State3_Vitals', 'State4_Vitals', 'State5_Vitals'];
    const stateNames = (caseData['image sync:Default_Patient_States'] || 'Baseline,Worsening,Arrest,Recovery').split(',');

    vitalsFields.forEach((field, idx) => {
      const fullFieldName = `Monitor_Vital_Signs:${field}`;
      const vitalsText = caseData[fullFieldName];

      if (vitalsText) {
        try {
          const vitalsObj = JSON.parse(vitalsText);
          caseInfo.states.push({
            name: stateNames[idx] || `State ${idx}`,
            field: field,
            vitals: vitalsObj,
            waveform: vitalsObj.waveform || 'none'
          });
        } catch (e) {
          // Skip invalid JSON
        }
      }
    });

    if (caseInfo.states.length > 0) {
      cases.push(caseInfo);
    }
  });

  return {
    success: true,
    totalCases: cases.length,
    cases: cases,
    waveforms: WAVEFORMS
  };
}

/**
 * Updates waveform for a specific case and state
 */
function updateWaveformForCaseState(caseId, stateField, newWaveform) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Master Scenario Convert');
  if (!sheet) return { success: false, error: 'Sheet not found' };

  const headers = getHeaders(sheet);
  const dataRange = sheet.getRange(3, 1, sheet.getLastRow() - 2, headers.length);
  const data = dataRange.getValues();

  // Find the case row
  const caseIdColIndex = headers.findIndex(h => h.includes('Case_ID'));
  let rowIndex = -1;

  for (let i = 0; i < data.length; i++) {
    if (data[i][caseIdColIndex] === caseId) {
      rowIndex = i;
      break;
    }
  }

  if (rowIndex === -1) {
    return { success: false, error: 'Case not found' };
  }

  // Update the waveform
  const fullFieldName = `Monitor_Vital_Signs:${stateField}`;
  const colIndex = headers.indexOf(fullFieldName);

  if (colIndex === -1) {
    return { success: false, error: 'Field not found' };
  }

  try {
    const vitalsObj = JSON.parse(data[rowIndex][colIndex]);
    vitalsObj.waveform = newWaveform;
    data[rowIndex][colIndex] = JSON.stringify(vitalsObj);

    // Write back to sheet
    dataRange.setValues(data);

    return {
      success: true,
      message: `Updated ${caseId} ${stateField} to ${newWaveform}`
    };
  } catch (e) {
    return { success: false, error: `Invalid JSON: ${e.message}` };
  }
}

/**
 * Calls ChatGPT API to analyze waveforms and suggest improvements
 */
function analyzeCaseWithAI(caseData) {
  if (!OPENAI_API_KEY) {
    return {
      success: false,
      error: 'OpenAI API Key not configured. Go to ER Simulator → Configure OpenAI API Key'
    };
  }

  const prompt = buildAIAnalysisPrompt(caseData);

  try {
    const response = UrlFetchApp.fetch('https://api.openai.com/v1/chat/completions', {
      method: 'post',
      contentType: 'application/json',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      payload: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an emergency medicine expert analyzing ECG waveform assignments for medical simulation cases. Provide concise, clinically accurate suggestions.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 500
      }),
      muteHttpExceptions: true
    });

    const json = JSON.parse(response.getContentText());

    if (json.error) {
      return { success: false, error: json.error.message };
    }

    const analysis = json.choices[0].message.content;

    return {
      success: true,
      analysis: analysis,
      suggestions: parseAISuggestions(analysis)
    };

  } catch (e) {
    return { success: false, error: `API Error: ${e.message}` };
  }
}

/**
 * Builds prompt for AI analysis
 */
function buildAIAnalysisPrompt(caseData) {
  let prompt = `Analyze this emergency medicine simulation case and suggest appropriate ECG waveforms:\n\n`;
  prompt += `Case: ${caseData.title}\n`;
  prompt += `Category: ${caseData.category}\n\n`;
  prompt += `Current States:\n`;

  caseData.states.forEach(state => {
    prompt += `- ${state.name}: HR=${state.vitals.HR || state.vitals.hr}, `;
    prompt += `BP=${state.vitals.BP || state.vitals.bp || 'N/A'}, `;
    prompt += `SpO2=${state.vitals.SpO2 || state.vitals.spo2}, `;
    prompt += `Waveform=${state.waveform}\n`;
  });

  prompt += `\nAvailable waveforms:\n`;
  Object.keys(WAVEFORMS).forEach(key => {
    prompt += `- ${key}: ${WAVEFORMS[key]}\n`;
  });

  prompt += `\nProvide:\n`;
  prompt += `1. Clinical assessment of current waveform choices\n`;
  prompt += `2. Specific suggestions for improvement (state name + recommended waveform)\n`;
  prompt += `3. Rationale for changes\n`;

  return prompt;
}

/**
 * Parses AI suggestions into structured format
 */
function parseAISuggestions(analysisText) {
  const suggestions = [];
  const lines = analysisText.split('\n');

  lines.forEach(line => {
    // Look for patterns like "State1: vtach_ecg" or "Arrest -> asystole_ecg"
    const match = line.match(/(State\d+|Baseline|Worsening|Arrest|Recovery).*?([a-z_]+_ecg)/i);
    if (match) {
      suggestions.push({
        stateName: match[1],
        waveform: match[2],
        reason: line
      });
    }
  });

  return suggestions;
}

/****************************************************
 * 🚀 NEW: ECG TO SVG CONVERTER LAUNCHER
 ****************************************************/

/**
 * Launches the ECG to SVG Converter tool
 */
function launchECGConverter() {
  const ui = SpreadsheetApp.getUi();

  const htmlContent = `
    <html>
      <head>
        <base target="_blank">
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          .launch-btn {
            background: #4CAF50;
            color: white;
            padding: 15px 30px;
            border: none;
            border-radius: 5px;
            font-size: 16px;
            cursor: pointer;
            display: block;
            width: 100%;
            margin: 20px 0;
            text-decoration: none;
            text-align: center;
          }
          .launch-btn:hover { background: #45a049; }
          .info {
            background: #f0f0f0;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <h2>🎨 ECG to SVG Converter</h2>

        <div class="info">
          <p><strong>Tool Purpose:</strong></p>
          <ul>
            <li>Convert ECG strip images to SVG waveforms</li>
            <li>Perfect 1:1 pixel preservation</li>
            <li>Auto-tiling with seamless loops</li>
            <li>Dual-format export (SVG + PNG)</li>
          </ul>
        </div>

        <a href="${ECG_CONVERTER_URL}" class="launch-btn" target="_blank">
          🚀 Launch ECG Converter
        </a>

        <div class="info">
          <p><strong>Note:</strong> The converter opens in your default browser as a standalone tool. This is intentional - the tool requires full browser capabilities for image processing.</p>
        </div>

        <hr>

        <p><strong>Usage:</strong></p>
        <ol>
          <li>Upload an ECG strip image (PNG/JPG)</li>
          <li>Extract the black line</li>
          <li>Convert to green SVG</li>
          <li>Crop and adjust baseline</li>
          <li>Export both SVG and PNG formats</li>
        </ol>

        <p><strong>Save locations:</strong></p>
        <ul>
          <li>SVG: <code>/assets/waveforms/svg/</code></li>
          <li>PNG: <code>/assets/waveforms/png/</code></li>
        </ul>
      </body>
    </html>
  `;

  const htmlOutput = HtmlService.createHtmlOutput(htmlContent)
    .setWidth(400)
    .setHeight(600);

  ui.showModalDialog(htmlOutput, 'ECG to SVG Converter');
}

/**
 * Configures OpenAI API Key
 */
function configureOpenAIKey() {
  const ui = SpreadsheetApp.getUi();

  const currentKey = PropertiesService.getScriptProperties().getProperty('OPENAI_API_KEY');
  const hasKey = currentKey && currentKey.length > 0;

  const message = hasKey
    ? 'OpenAI API Key is currently configured.\n\nDo you want to update it?'
    : 'No OpenAI API Key found.\n\nYou need an API key to use AI-powered waveform analysis.\n\nGet one from: https://platform.openai.com/api-keys';

  const response = ui.alert(
    'Configure OpenAI API Key',
    message,
    hasKey ? ui.ButtonSet.YES_NO : ui.ButtonSet.OK_CANCEL
  );

  if (response === ui.Button.YES || response === ui.Button.OK) {
    const promptResponse = ui.prompt(
      'Enter OpenAI API Key',
      'Paste your OpenAI API key (starts with "sk-"):',
      ui.ButtonSet.OK_CANCEL
    );

    if (promptResponse.getSelectedButton() === ui.Button.OK) {
      const newKey = promptResponse.getResponseText().trim();

      if (newKey.startsWith('sk-')) {
        PropertiesService.getScriptProperties().setProperty('OPENAI_API_KEY', newKey);
        ui.alert('Success', 'OpenAI API Key configured successfully!', ui.ButtonSet.OK);
      } else {
        ui.alert('Error', 'Invalid API key format. Key should start with "sk-"', ui.ButtonSet.OK);
      }
    }
  }
}

/****************************************************
 * 📊 EXISTING WAVEFORM FUNCTIONS (Preserved)
 ****************************************************/

/**
 * Detects appropriate waveform based on clinical context
 */
function detectWaveformForState(caseTitle, initialRhythm, dispositionPlan, stateName, isArrest, isWorsening) {
  const contextText = `${caseTitle} ${initialRhythm} ${dispositionPlan}`.toLowerCase();

  // Arrest state mapping
  if (isArrest) {
    if (contextText.includes('pea') || contextText.includes('pulseless electrical')) return 'peapulseless_ecg';
    if (contextText.includes('asystole') || contextText.includes('flatline')) return 'asystole_ecg';
    if (contextText.includes('vfib') || contextText.includes('ventricular fibrillation')) return 'vfib_ecg';
    if (contextText.includes('vtach') || contextText.includes('ventricular tachycardia')) return 'vtach_ecg';
    if (contextText.includes('torsades')) return 'torsades_ecg';
    return 'asystole_ecg'; // Default arrest
  }

  // Worsening/deterioration state
  if (isWorsening) {
    if (contextText.includes('vtach') || contextText.includes('ventricular tachycardia')) return 'vtach_ecg';
    if (contextText.includes('svt') || contextText.includes('supraventricular')) return 'svt_ecg';
    if (contextText.includes('aflutter') || contextText.includes('atrial flutter')) return 'aflutter_ecg';
  }

  // Baseline/stable states
  if (contextText.includes('afib') || contextText.includes('atrial fibrillation')) return 'afib_ecg';
  if (contextText.includes('aflutter') || contextText.includes('atrial flutter')) return 'aflutter_ecg';
  if (contextText.includes('paced') || contextText.includes('pacemaker')) return 'paced_ecg';
  if (contextText.includes('junctional')) return 'junctional_ecg';
  if (contextText.includes('bigeminy')) return 'bigeminy_ecg';
  if (contextText.includes('trigeminy')) return 'trigeminy_ecg';

  return 'sinus_ecg'; // Default
}

/**
 * Suggests waveform mapping for selected row
 */
function suggestWaveformMapping() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Master Scenario Convert');
  const ui = SpreadsheetApp.getUi();

  if (!sheet) {
    ui.alert('Error', 'Sheet "Master Scenario Convert" not found', ui.ButtonSet.OK);
    return;
  }

  const activeRow = sheet.getActiveCell().getRow();
  if (activeRow < 3) {
    ui.alert('Please select a data row (row 3 or below)', ui.ButtonSet.OK);
    return;
  }

  const headers = getHeaders(sheet);
  const rowData = sheet.getRange(activeRow, 1, 1, headers.length).getValues()[0];
  const caseData = buildCaseObject(headers, rowData);

  // Get clinical context
  const caseTitle = caseData['Case_Organization:Reveal_Title'] || caseData['Case_Organization:Spark_Title'] || '';
  const initialRhythm = caseData['Patient_Demographics_and_Clinical_Data:Initial_Rhythm'] || '';
  const dispositionPlan = caseData['Situation_and_Environment_Details:Disposition_Plan'] || '';
  const stateNames = (caseData['image sync:Default_Patient_States'] || 'Baseline,Worsening,Arrest,Recovery').split(',');

  // Build suggestion message
  let message = `📋 Case: ${caseTitle}\n\n`;
  message += `🩺 Suggested Waveform Mapping:\n\n`;

  const vitalsFields = ['Initial_Vitals', 'State1_Vitals', 'State2_Vitals', 'State3_Vitals', 'State4_Vitals', 'State5_Vitals'];

  vitalsFields.forEach((field, idx) => {
    const stateName = stateNames[idx] || `State${idx}`;
    const isArrest = stateName.toLowerCase().includes('arrest') || stateName.toLowerCase().includes('critical');
    const isWorsening = stateName.toLowerCase().includes('worsening') || stateName.toLowerCase().includes('deteriorat');

    const suggestedWaveform = detectWaveformForState(caseTitle, initialRhythm, dispositionPlan, stateName, isArrest, isWorsening);
    message += `• ${stateName}: ${WAVEFORMS[suggestedWaveform]}\n`;
  });

  ui.alert('Intelligent Waveform Suggestions', message, ui.ButtonSet.OK);
}

/**
 * Auto-maps all waveforms for all rows
 */
function autoMapAllWaveforms() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Master Scenario Convert');
  const ui = SpreadsheetApp.getUi();

  if (!sheet) {
    ui.alert('Error', 'Sheet "Master Scenario Convert" not found', ui.ButtonSet.OK);
    return;
  }

  const response = ui.alert(
    'Auto-Map Waveforms',
    'This will intelligently assign waveforms to ALL vitals based on clinical context. Continue?',
    ui.ButtonSet.YES_NO
  );

  if (response !== ui.Button.YES) return;

  const headers = getHeaders(sheet);
  const dataRange = sheet.getRange(3, 1, sheet.getLastRow() - 2, headers.length);
  const data = dataRange.getValues();

  let updatedCount = 0;

  data.forEach((row, rowIndex) => {
    const caseData = buildCaseObject(headers, row);
    const caseTitle = caseData['Case_Organization:Reveal_Title'] || '';
    const initialRhythm = caseData['Patient_Demographics_and_Clinical_Data:Initial_Rhythm'] || '';
    const dispositionPlan = caseData['Situation_and_Environment_Details:Disposition_Plan'] || '';
    const stateNames = (caseData['image sync:Default_Patient_States'] || 'Baseline,Worsening,Arrest,Recovery').split(',');

    const vitalsFields = ['Initial_Vitals', 'State1_Vitals', 'State2_Vitals', 'State3_Vitals', 'State4_Vitals', 'State5_Vitals'];

    vitalsFields.forEach((field, idx) => {
      const fullFieldName = `Monitor_Vital_Signs:${field}`;
      const colIndex = headers.indexOf(fullFieldName);

      if (colIndex !== -1 && row[colIndex]) {
        try {
          const vitalsObj = JSON.parse(row[colIndex]);
          const stateName = stateNames[idx] || `State${idx}`;
          const isArrest = stateName.toLowerCase().includes('arrest') || stateName.toLowerCase().includes('critical');
          const isWorsening = stateName.toLowerCase().includes('worsening') || stateName.toLowerCase().includes('deteriorat');

          const suggestedWaveform = detectWaveformForState(caseTitle, initialRhythm, dispositionPlan, stateName, isArrest, isWorsening);

          vitalsObj.waveform = suggestedWaveform;
          row[colIndex] = JSON.stringify(vitalsObj);
          updatedCount++;
        } catch (e) {
          // Skip invalid JSON
        }
      }
    });
  });

  dataRange.setValues(data);
  ui.alert('Success', `✅ Updated ${updatedCount} vital sign waveforms across ${data.length} cases`, ui.ButtonSet.OK);
}

/**
 * Analyzes current waveform mappings
 */
function analyzeCurrentMappings() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Master Scenario Convert');
  const ui = SpreadsheetApp.getUi();

  if (!sheet) {
    ui.alert('Error', 'Sheet "Master Scenario Convert" not found', ui.ButtonSet.OK);
    return;
  }

  const headers = getHeaders(sheet);
  const dataRange = sheet.getRange(3, 1, sheet.getLastRow() - 2, headers.length);
  const data = dataRange.getValues();

  const stats = {};
  let totalVitals = 0;
  let withWaveforms = 0;

  data.forEach(row => {
    const vitalsFields = ['Initial_Vitals', 'State1_Vitals', 'State2_Vitals', 'State3_Vitals', 'State4_Vitals', 'State5_Vitals'];

    vitalsFields.forEach(field => {
      const fullFieldName = `Monitor_Vital_Signs:${field}`;
      const colIndex = headers.indexOf(fullFieldName);

      if (colIndex !== -1 && row[colIndex]) {
        try {
          const vitalsObj = JSON.parse(row[colIndex]);
          totalVitals++;

          if (vitalsObj.waveform) {
            withWaveforms++;
            stats[vitalsObj.waveform] = (stats[vitalsObj.waveform] || 0) + 1;
          }
        } catch (e) {}
      }
    });
  });

  let message = `📊 Waveform Mapping Analysis\n\n`;
  message += `Total Vitals: ${totalVitals}\n`;
  message += `With Waveforms: ${withWaveforms}\n`;
  message += `Missing Waveforms: ${totalVitals - withWaveforms}\n\n`;
  message += `Distribution:\n`;

  Object.keys(stats).sort((a, b) => stats[b] - stats[a]).forEach(waveform => {
    message += `• ${WAVEFORMS[waveform] || waveform}: ${stats[waveform]}\n`;
  });

  ui.alert('Waveform Analysis', message, ui.ButtonSet.OK);
}

/**
 * Clears all waveforms (for testing)
 */
function clearAllWaveforms() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Master Scenario Convert');
  const ui = SpreadsheetApp.getUi();

  if (!sheet) {
    ui.alert('Error', 'Sheet "Master Scenario Convert" not found', ui.ButtonSet.OK);
    return;
  }

  const response = ui.alert(
    'Clear All Waveforms',
    '⚠️ This will remove ALL waveforms from vitals. This is for testing only. Continue?',
    ui.ButtonSet.YES_NO
  );

  if (response !== ui.Button.YES) return;

  const headers = getHeaders(sheet);
  const dataRange = sheet.getRange(3, 1, sheet.getLastRow() - 2, headers.length);
  const data = dataRange.getValues();

  let clearedCount = 0;

  data.forEach(row => {
    const vitalsFields = ['Initial_Vitals', 'State1_Vitals', 'State2_Vitals', 'State3_Vitals', 'State4_Vitals', 'State5_Vitals'];

    vitalsFields.forEach(field => {
      const fullFieldName = `Monitor_Vital_Signs:${field}`;
      const colIndex = headers.indexOf(fullFieldName);

      if (colIndex !== -1 && row[colIndex]) {
        try {
          const vitalsObj = JSON.parse(row[colIndex]);

          if (vitalsObj.waveform) {
            delete vitalsObj.waveform;
            row[colIndex] = JSON.stringify(vitalsObj);
            clearedCount++;
          }
        } catch (e) {}
      }
    });
  });

  dataRange.setValues(data);
  ui.alert('Cleared', `❌ Removed ${clearedCount} waveforms`, ui.ButtonSet.OK);
}

/****************************************************
 * 📂 CASE ORGANIZATION FUNCTIONS
 ****************************************************/

/**
 * View Cases by Medical Category
 */
function viewCasesByCategory() {
  const ui = SpreadsheetApp.getUi();

  const message = `📂 MEDICAL CATEGORIES

Use Column L (Medical_Category) to filter cases by medical system:

• CARD - Cardiac
• RESP - Respiratory
• NEUR - Neurological
• GAST - Gastrointestinal
• TRAU - Trauma
• MULT - Multisystem
... and 12 more categories

💡 TIP: Use Data → Filter to sort by category

For advanced organization:
Run locally: npm run categories-pathways`;

  ui.alert('View Cases by Category', message, ui.ButtonSet.OK);
}

/**
 * View Pathway Organization
 */
function viewPathwayOrganization() {
  const ui = SpreadsheetApp.getUi();

  const message = `🧩 LEARNING PATHWAYS

System Stats:
• 189 simulation cases
• 16 learning pathways
• 100% AI-enhanced

Major Pathways:
• Cardiac Mastery Foundations (57 cases)
• Airway & Breathing Mastery (44 cases)
• Stroke & Neuro Foundations (43 cases)
• Multi-System Foundations (15 cases)
• ATLS Mastery (10 cases)
... and 11 more pathways

💡 TIP: See QUICK_REFERENCE.md for full details

For advanced management:
Run locally: npm run categories-pathways`;

  ui.alert('Learning Pathways', message, ui.ButtonSet.OK);
}

/**
 * Jump to Case by ID
 */
function jumpToCaseById() {
  const ui = SpreadsheetApp.getUi();
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Master Scenario Convert');

  if (!sheet) {
    ui.alert('Error', 'Sheet "Master Scenario Convert" not found', ui.ButtonSet.OK);
    return;
  }

  const response = ui.prompt('Jump to Case', 'Enter Case ID (e.g., CARD0001):', ui.ButtonSet.OK_CANCEL);

  if (response.getSelectedButton() !== ui.Button.OK) return;

  const searchId = response.getResponseText().trim().toUpperCase();

  if (!searchId) {
    ui.alert('No Case ID entered', ui.ButtonSet.OK);
    return;
  }

  const headers = getHeaders(sheet);
  const caseIdColIndex = headers.findIndex(h => h.includes('Case_ID'));

  if (caseIdColIndex === -1) {
    ui.alert('Error', 'Case_ID column not found', ui.ButtonSet.OK);
    return;
  }

  const dataRange = sheet.getRange(3, 1, sheet.getLastRow() - 2, headers.length);
  const data = dataRange.getValues();

  for (let i = 0; i < data.length; i++) {
    const caseId = data[i][caseIdColIndex];
    if (caseId && caseId.toString().toUpperCase() === searchId) {
      const rowNumber = i + 3;
      sheet.setActiveRange(sheet.getRange(rowNumber, 1));
      ui.alert('Found', `Navigated to ${searchId} at row ${rowNumber}`, ui.ButtonSet.OK);
      return;
    }
  }

  ui.alert('Not Found', `Case ID "${searchId}" not found in sheet`, ui.ButtonSet.OK);
}

/**
 * Validate Current Row
 */
function validateCurrentRow() {
  const ui = SpreadsheetApp.getUi();
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Master Scenario Convert');

  if (!sheet) {
    ui.alert('Error', 'Sheet "Master Scenario Convert" not found', ui.ButtonSet.OK);
    return;
  }

  const activeRow = sheet.getActiveCell().getRow();
  if (activeRow < 3) {
    ui.alert('Please select a data row (row 3 or below)', ui.ButtonSet.OK);
    return;
  }

  const headers = getHeaders(sheet);
  const rowData = sheet.getRange(activeRow, 1, 1, headers.length).getValues()[0];
  const caseData = buildCaseObject(headers, rowData);

  const errors = [];
  const warnings = [];

  // Check required fields
  const caseId = caseData['Case_Organization:Case_ID'] || '';
  if (!caseId) {
    errors.push('Missing Case_ID');
  }

  // Check vitals JSON structure
  const vitalsFields = ['Initial_Vitals', 'State1_Vitals', 'State2_Vitals', 'State3_Vitals', 'State4_Vitals', 'State5_Vitals'];
  vitalsFields.forEach(field => {
    const fullFieldName = `Monitor_Vital_Signs:${field}`;
    const vitalsText = caseData[fullFieldName];

    if (vitalsText) {
      try {
        const vitalsObj = JSON.parse(vitalsText);
        if (!vitalsObj.hr && !vitalsObj.HR) warnings.push(`${field}: Missing heart rate`);
        if (!vitalsObj.spo2 && !vitalsObj.SpO2) warnings.push(`${field}: Missing SpO2`);
        if (!vitalsObj.waveform) warnings.push(`${field}: Missing waveform`);
      } catch (e) {
        errors.push(`${field}: Invalid JSON`);
      }
    }
  });

  // Check overviews
  const preSimOverview = caseData['Case_Organization:Pre_Sim_Overview'];
  const postSimOverview = caseData['Case_Organization:Post_Sim_Overview'];

  if (!preSimOverview || preSimOverview === 'N/A') {
    warnings.push('Missing Pre-Sim Overview');
  }

  if (!postSimOverview || postSimOverview === 'N/A') {
    warnings.push('Missing Post-Sim Overview');
  }

  // Display results
  let message = `📋 Case: ${caseId}\n\n`;

  if (errors.length === 0 && warnings.length === 0) {
    message += '✅ Validation PASSED\n\nAll required fields present and valid!';
    ui.alert('Validation Results', message, ui.ButtonSet.OK);
    return;
  }

  if (errors.length > 0) {
    message += `❌ ERRORS (${errors.length}):\n`;
    errors.forEach(err => {
      message += `   • ${err}\n`;
    });
    message += '\n';
  }

  if (warnings.length > 0) {
    message += `⚠️ WARNINGS (${warnings.length}):\n`;
    warnings.forEach(warn => {
      message += `   • ${warn}\n`;
    });
  }

  ui.alert('Validation Results', message, ui.ButtonSet.OK);
}

/****************************************************
 * 🛠️ HELPER FUNCTIONS
 ****************************************************/

/**
 * Get headers from row 2 (row 1 is human-readable labels only)
 * Headers are already in Tier1:Tier2 format (e.g., "Case_Organization:Case_ID")
 */
function getHeaders(sheet) {
  return sheet.getRange(2, 1, 1, sheet.getLastColumn()).getValues()[0];
}

/**
 * Build case object from row
 */
function buildCaseObject(headers, row) {
  const obj = {};
  headers.forEach((header, idx) => {
    obj[header] = row[idx];
  });
  return obj;
}

/**
 * Try parse JSON, return original value if fails
 */
function tryParseJSON(v) {
  try { return JSON.parse(v); } catch { return v; }
}

/******************************************************
 * 🔗 Live Sync Webhook Trigger (Google → Local)
 ******************************************************/
const LIVE_SYNC_URL = "https://overlate-nontemporizingly-edris.ngrok-free.dev/vitals-update";

function onEdit(e) {
  try {
    const sheet = e.range.getSheet();
    if (sheet.getName() !== "Master Scenario Convert" || e.range.getRow() < 3) return;

    const row = e.range.getRow();
    const dataRange = sheet.getRange(row, 1, 1, sheet.getLastColumn());
    // Row 2 contains headers in Tier1:Tier2 format already
    const headers = sheet.getRange(2, 1, 1, sheet.getLastColumn()).getValues()[0];
    const rowValues = dataRange.getValues()[0];

    const entry = {};
    headers.forEach((key, i) => {
      const val = rowValues[i];
      if (val && val !== "N/A") entry[key] = tryParseJSON(val);
    });

    UrlFetchApp.fetch(LIVE_SYNC_URL, {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(entry),
      muteHttpExceptions: true,
    });

    console.log(`📡 Sent live update for row ${row}`);
  } catch (err) {
    console.error("❌ Live Sync error", err);
  }
}
