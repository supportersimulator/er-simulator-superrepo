/**
 * ER Simulator - Intelligent Waveform Mapper
 *
 * HOW TO INSTALL:
 * 1. Open your Google Sheet: Convert_Master_Sim_CSV_Template_with_Input
 * 2. Go to Extensions → Apps Script
 * 3. Delete any existing code
 * 4. Paste this entire file
 * 5. Save (Ctrl/Cmd + S)
 * 6. Refresh your sheet - you'll see a new "ER Simulator" menu
 */

// Available waveforms from canonicalWaveformList.js
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
 * Creates custom menu when sheet opens
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('ER Simulator')
    .addItem('🩺 Suggest Waveform Mapping', 'suggestWaveformMapping')
    .addItem('🔄 Auto-Map All Waveforms', 'autoMapAllWaveforms')
    .addSeparator()
    .addItem('📂 View Cases by Category', 'viewCasesByCategory')
    .addItem('🔍 Jump to Case by ID', 'jumpToCaseById')
    .addItem('🧩 View Pathway Organization', 'viewPathwayOrganization')
    .addSeparator()
    .addItem('✅ Validate Current Row', 'validateCurrentRow')
    .addItem('📊 Analyze Current Mappings', 'analyzeCurrentMappings')
    .addItem('❌ Clear All Waveforms', 'clearAllWaveforms')
    .addToUi();
}

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
      const rowNumber = i + 3; // +3 because data starts at row 3
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
        if (!vitalsObj.hr) warnings.push(`${field}: Missing heart rate`);
        if (!vitalsObj.spo2) warnings.push(`${field}: Missing SpO2`);
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
  let message = `📋 Case: ${caseId}\\n\\n`;

  if (errors.length === 0 && warnings.length === 0) {
    message += '✅ Validation PASSED\\n\\nAll required fields present and valid!';
    ui.alert('Validation Results', message, ui.ButtonSet.OK);
    return;
  }

  if (errors.length > 0) {
    message += `❌ ERRORS (${errors.length}):\\n`;
    errors.forEach(err => {
      message += `   • ${err}\\n`;
    });
    message += '\\n';
  }

  if (warnings.length > 0) {
    message += `⚠️ WARNINGS (${warnings.length}):\\n`;
    warnings.forEach(warn => {
      message += `   • ${warn}\\n`;
    });
  }

  ui.alert('Validation Results', message, ui.ButtonSet.OK);
}

/**
 * Helper: Get merged headers (Tier1:Tier2)
 */
function getHeaders(sheet) {
  const tier1 = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const tier2 = sheet.getRange(2, 1, 1, sheet.getLastColumn()).getValues()[0];
  return tier1.map((t1, i) => `${t1}:${tier2[i]}`);
}

/**
 * Helper: Build case object from row
 */
function buildCaseObject(headers, row) {
  const obj = {};
  headers.forEach((header, idx) => {
    obj[header] = row[idx];
  });
  return obj;
}

/******************************************************
 * 🔗 Live Sync Webhook Trigger (Google → Local)
 ******************************************************/
const LIVE_SYNC_URL = "https://overlate-nontemporizingly-edris.ngrok-free.dev/vitals-update"; // ngrok tunnel

function onEdit(e) {
  try {
    const sheet = e.range.getSheet();
    if (sheet.getName() !== "Master Scenario Convert" || e.range.getRow() < 3) return;

    const row = e.range.getRow();
    const dataRange = sheet.getRange(row, 1, 1, sheet.getLastColumn());
    const headers1 = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const headers2 = sheet.getRange(2, 1, 1, sheet.getLastColumn()).getValues()[0];
    const rowValues = dataRange.getValues()[0];
    const mergedKeys = headers1.map((t1, i) => `${t1}:${headers2[i]}`);

    const entry = {};
    mergedKeys.forEach((key, i) => {
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

function tryParseJSON(v) {
  try { return JSON.parse(v); } catch { return v; }
}
