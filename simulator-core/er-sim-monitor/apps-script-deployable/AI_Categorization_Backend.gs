/**
 * ===========================================================================
 * AI AUTO-CATEGORIZATION BACKEND FUNCTIONS
 * ===========================================================================
 *
 * Purpose: Bulk categorize all 207 scenarios with AI suggestions
 * Method: OpenAI GPT-4 analysis → Human review → Bulk apply
 *
 * Date: 2025-11-10
 * ===========================================================================
 */


// ============================================================================
// MAIN ORCHESTRATOR
// ============================================================================

/**
 * Main function to run AI categorization on all cases
 * Called by "Run AI Categorization" button in Categories tab
 *
 * @return {object} Results with suggestions for all cases
 */
function runAICategorization() {
  // Clear old logs and start fresh
  PropertiesService.getDocumentProperties().deleteProperty('Sidebar_Logs');
  addAILog('🚀 Starting AI Categorization for All Cases...');
  addAILog('');

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const masterSheet = ss.getSheetByName('Master Scenario Convert');

  if (!masterSheet) {
    throw new Error('Master Scenario Convert sheet not found!');
  }

  Logger.log('🤖 Starting AI Categorization...');
  Logger.log('');

  // Clear old results sheet immediately to prevent conflicts
  const existingResults = ss.getSheetByName('AI_Categorization_Results');
  if (existingResults) {
    existingResults.clear();
    Logger.log('✅ Cleared old results sheet');
    Logger.log('');
  }

  // Get all case data (skip 2 header rows)
  const lastRow = masterSheet.getLastRow();
  const data = masterSheet.getRange(3, 1, lastRow - 2, 646).getValues();

  Logger.log('📊 Loaded ' + data.length + ' cases');

  // Extract relevant fields for each case
  const cases = [];
  for (let i = 0; i < data.length; i++) {
    const row = data[i];

    cases.push({
      rowIndex: i + 3,                    // Actual row number in sheet
      caseID: row[0],                     // Column A: Case_ID
      legacyCaseID: row[8],               // Column I: Legacy_Case_ID
      currentSymptom: row[17] || '',      // Column R: Case_Organization_Category_Symptom
      currentSystem: row[18] || '',       // Column S: Case_Organization_Category_System
      chiefComplaint: row[4] || '',       // Column E: Chief_Complaint (approximate)
      presentation: row[5] || '',         // Column F: Presentation (approximate)
      diagnosis: row[6] || ''             // Column G: Diagnosis (approximate)
    });
  }

  Logger.log('✅ Extracted case data');
  Logger.log('');

  // Process in batches of 25
  const batchSize = 25;

  addAILog('   Total cases found: ' + cases.length);
  addAILog('   Batch size: ' + batchSize);
  addAILog('   Total batches: ' + Math.ceil(cases.length / batchSize));
  addAILog('');
  const allResults = [];

  for (let i = 0; i < cases.length; i += batchSize) {
    const batch = cases.slice(i, Math.min(i + batchSize, cases.length));
    const batchNum = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(cases.length / batchSize);

    Logger.log('📦 Processing batch ' + batchNum + '/' + totalBatches + ' (' + batch.length + ' cases)...');

    try {
      const batchResults = categorizeBatchWithAI(batch);
      addAILog('   ✅ API responded with ' + batchResults.length + ' results');

      // Log sample result
      if (batchResults.length > 0) {
        const sample = batchResults[0];
        addAILog('   Sample: ' + sample.caseID + ' → ' + (sample.suggestedSymptom || '(empty)') + ' / ' + (sample.suggestedSystem || '(empty)'));
        if (sample.reasoning) {
          addAILog('   Reasoning: ' + sample.reasoning.substring(0, 80) + '...');
        }
      }

      // Log any empty results
      const emptyResults = batchResults.filter(r => !r.suggestedSymptom || r.suggestedSymptom.length === 0);
      if (emptyResults.length > 0) {
        addAILog('   ⚠️  WARNING: ' + emptyResults.length + ' results still empty!');
        emptyResults.forEach(er => {
          addAILog('      - ' + er.caseID + ': ' + (er.reasoning || 'no reasoning'));
        });
      }
      allResults.push(...batchResults);

      Logger.log('✅ Batch ' + batchNum + ' complete');

      // Small delay to avoid rate limits
      Utilities.sleep(1000);

    } catch (error) {
      Logger.log('❌ Batch ' + batchNum + ' failed: ' + error.message);

      // Add placeholder results for failed batch
      batch.forEach(caseData => {
        allResults.push({
          caseID: caseData.caseID,
          rowIndex: caseData.rowIndex,
          currentSymptom: caseData.currentSymptom,
          currentSystem: caseData.currentSystem,
          suggestedSymptom: '',
          suggestedSymptomName: '',
          suggestedSystem: '',
          reasoning: 'AI processing failed: ' + error.message,
          status: 'error'
        });
      });
    }
  }

  Logger.log('');
  Logger.log('🎉 AI Categorization complete!');
  Logger.log('   Total cases processed: ' + allResults.length);

  // Save results to temporary sheet for review
  saveCategorizationResults(allResults);

  Logger.log('✅ Results saved to AI_Categorization_Results sheet');

  return {
    success: true,
    totalCases: allResults.length,
    resultsSheetName: 'AI_Categorization_Results'
  };
}


// ============================================================================
// AI PROCESSING
// ============================================================================

/**
 * Send batch of cases to OpenAI for categorization
 *
 * @param {Array} cases - Array of case objects
 * @return {Array} Array of categorization results
 */
function categorizeBatchWithAI(cases) {
  // Get OpenAI API key from Settings sheet
  const apiKey = getOpenAIAPIKey();

  if (!apiKey) {
    throw new Error('OpenAI API key not found in Settings!B2');
  }

  // Get accronym mapping for reference
  const accronymMapping = getAccronymMapping();

  // Keep ACLS in list but prompt will restrict its use heavily
  const validSymptoms = Object.keys(accronymMapping).join(', ');

  // Get valid system categories
  const validSystems = [
    'Cardiovascular',
    'Pulmonary',
    'Gastrointestinal',
    'Neurologic',
    'Endocrine/Metabolic',
    'Renal/Genitourinary',
    'Hematologic/Oncologic',
    'Infectious Disease',
    'Toxicology',
    'Trauma',
    'Obstetrics/Gynecology',
    'Pediatrics',
    'HEENT',
    'Musculoskeletal',
    'Critical Care',
    'Dermatologic',
    'Psychiatric',
    'Environmental'
  ].join(', ');

  // Build prompt
  const prompt = buildCategorizationPrompt(cases, validSymptoms, validSystems);

  // Call OpenAI API
  const requestBody = {
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: 'You are an expert ER triage nurse categorizing medical simulation cases. Respond ONLY with valid JSON.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.3,
    max_tokens: 4000  // Increased from 3000 to prevent JSON truncation
  };

  const options = {
    method: 'post',
    headers: {
      'Authorization': 'Bearer ' + apiKey,
      'Content-Type': 'application/json'
    },
    payload: JSON.stringify(requestBody),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch('https://api.openai.com/v1/chat/completions', options);
  const responseCode = response.getResponseCode();

  if (responseCode !== 200) {
    throw new Error('OpenAI API error: ' + responseCode + ' - ' + response.getContentText());
  }

  const result = JSON.parse(response.getContentText());

  if (!result.choices || !result.choices[0] || !result.choices[0].message) {
    throw new Error('Invalid OpenAI response format');
  }

  const aiResponseText = result.choices[0].message.content;

  // Parse JSON response
  let suggestions;
  try {
    // Remove markdown code blocks if present
    const jsonText = aiResponseText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    suggestions = JSON.parse(jsonText);
  } catch (parseError) {
    Logger.log('❌ Failed to parse AI response: ' + aiResponseText);
    throw new Error('Failed to parse AI response as JSON: ' + parseError.message);
  }

  // Merge AI suggestions with original case data
  const results = [];
  for (let i = 0; i < cases.length; i++) {
    const caseData = cases[i];
    const aiSuggestion = suggestions[i] || {};

    results.push({
      caseID: caseData.caseID,
      legacyCaseID: caseData.legacyCaseID,
      rowIndex: caseData.rowIndex,
      resultRowIndex: caseData.resultRowIndex,  // 🔧 PRESERVE this for retry write-back!
      currentSymptom: caseData.currentSymptom,
      currentSystem: caseData.currentSystem,
      suggestedSymptom: aiSuggestion.suggestedSymptom || '',
      suggestedSymptomName: aiSuggestion.suggestedSymptomName || '',
      suggestedSystem: aiSuggestion.suggestedSystem || '',
      reasoning: aiSuggestion.reasoning || '',
      confidence: aiSuggestion.confidence || 'medium',
      status: determineStatus(caseData, aiSuggestion)
    });
  }

  return results;
}

/**
 * Build OpenAI prompt for categorization
 */
function buildCategorizationPrompt(cases, validSymptoms, validSystems) {
  const caseList = cases.map(c => {
    return {
      caseID: c.caseID,
      chiefComplaint: c.chiefComplaint,
      presentation: c.presentation,
      diagnosis: c.diagnosis,
      currentSymptom: c.currentSymptom,
      currentSystem: c.currentSystem
    };
  });

  const prompt = `You are an expert ER triage nurse categorizing medical simulation cases.

**PURPOSE**: We're organizing 207 simulation cases for easy browsing in a medical education app. Users need to quickly find cases by:
- What the patient presents with (symptom folders like "Chest Pain", "Shortness of Breath")
- What the underlying diagnosis is (system folders like "Cardiovascular", "Pulmonary")

This allows instructors to select appropriate cases for training scenarios.

For each case, suggest:
1. **Symptom Category** (chief complaint accronym) - What patient says/shows
2. **System Category** (underlying system/diagnosis) - What's actually wrong

**CRITICAL RULES**:
- Symptom = What patient PRESENTS with (preserves diagnostic mystery)
- System = Underlying diagnosis/system (revealed after learning)
- Focus on the CHIEF COMPLAINT and PRESENTATION, NOT the pathway/course name
- If patient has chest pain → Symptom = CP (even if diagnosis is PE, not MI)
- If diagnosis is MI → System = Cardiovascular
- Use ONLY symptoms from the valid list below

**ACLS RULE (CRITICALLY IMPORTANT - READ CAREFULLY)**:

⚠️ COMMON MISTAKE: "Advanced Cardiac Life Support" is a COURSE NAME, not a patient symptom!

DO NOT be fooled by pathway names containing:
  - "Advanced Cardiac Life Support" (it's a training course)
  - "Advanced Life Support" (it's a protocol name)
  - "Advanced Critical Care" (advanced ≠ cardiac arrest)
  - "Advanced Trauma Life Support" (ATLS is a course)
  - Any "Advanced [something] Support" (these are course/protocol names!)

ACLS symptom = Patient is DEAD/DYING RIGHT NOW (no pulse, not breathing, CPR happening)

ONLY use ACLS if patient presentation EXPLICITLY states:
  ✓ "Patient found in cardiac arrest"
  ✓ "Patient is pulseless" or "no pulse detected"
  ✓ "Code blue called" or "code blue in progress"
  ✓ "Patient is in V-fib" or "ventricular fibrillation"
  ✓ "Patient is in asystole" or "flatline"
  ✓ "Patient is in PEA" (pulseless electrical activity)
  ✓ "CPR in progress" or "resuscitation underway"

IGNORE pathway/course names, focus on PATIENT STATE:
  ✗ "Advanced Cardiac Life Support pathway" → Look at patient, not course name!
  ✗ "Advanced Life Support scenario" → Look at symptoms, not protocol name!
  ✗ "Chest pain (even if MI, use CP)
  ✗ Shortness of breath (even if severe, use SOB)
  ✗ Altered mental status (even if unresponsive, use AMS)
  ✗ Shock/hypotension (use CP or appropriate symptom)
  ✗ Heart attack/MI (use CP - they still have a pulse!)
  ✗ Severe asthma (use SOB - they're still breathing!)

Simple test: If patient has vital signs, is conscious, or walked in → NOT ACLS!

Examples:
  ❌ "Advanced Cardiac Life Support pathway for MI" = CP (pathway name, patient has pulse)
  ❌ "Acute MI patient" = CP (not ACLS - patient alive)
  ❌ "Severe Asthma Attack" = SOB (not ACLS - patient breathing)
  ❌ "Advanced Trauma Life Support scenario" = TR (ATLS course, look at injury)
  ❌ "Advanced Neurological Care" = AMS (critical care, not cardiac arrest)
  ✅ "Patient found pulseless, CPR in progress" = ACLS (actual cardiac arrest)

**Valid Symptom Categories** (use accronym only):
${validSymptoms}

**Valid System Categories** (use exact name):
${validSystems}

**CUSTOM SYMPTOM FALLBACK (LAST RESORT ONLY)**:
If NONE of the valid symptoms above fit the case (and you've truly tried everything):
1. Use an existing symptom if at all possible (be creative with interpretation)
2. Only as an ABSOLUTE LAST RESORT, you may suggest a custom symptom
3. If creating custom symptom, MUST follow these rules:
   - Use 2-4 letter acronym (like existing ones: CP, SOB, AMS, etc.)
   - Make it memorable and clear
   - In your reasoning, suggest 4-5 alternatives from the valid list that could work
   - Mark confidence as "low" to flag for manual review

Example of proper custom symptom reasoning:
"No existing symptom fits well. Suggesting custom 'DIZZ' for Dizziness/Vertigo cases. Alternatives considered: AMS (altered mental status - too broad), NEUR (too system-focused), HA (headache - not quite right), SOB (shortness of breath - unrelated), TR (trauma - incorrect). Custom symptom needed."

**Cases to categorize**:
${JSON.stringify(caseList, null, 2)}

**Response format** (valid JSON only, no markdown):
[
  {
    "caseID": "GI01234",
    "suggestedSymptom": "CP",
    "suggestedSymptomName": "Chest Pain Cases",
    "suggestedSystem": "Cardiovascular",
    "reasoning": "Patient presents with chest pain (CP) but diagnosis is MI (Cardiovascular)",
    "confidence": "high"
  }
]

Notes:
- Use existing symptoms 95%+ of the time
- Custom symptoms should be RARE (maybe 5-10 cases max out of 207)
- Always explain why existing options don't work
- Always suggest alternatives in reasoning

Respond with ONLY the JSON array, no other text.`;

  return prompt;
}

/**
 * Determine status based on current vs suggested
 */
function determineStatus(caseData, aiSuggestion) {
  const hasCurrentSymptom = caseData.currentSymptom && caseData.currentSymptom.length > 0;
  const hasCurrentSystem = caseData.currentSystem && caseData.currentSystem.length > 0;

  if (!hasCurrentSymptom && !hasCurrentSystem) {
    return 'new'; // Uncategorized - AI suggests new
  }

  const symptomMatches = caseData.currentSymptom === aiSuggestion.suggestedSymptom;
  const systemMatches = caseData.currentSystem === aiSuggestion.suggestedSystem;

  if (symptomMatches && systemMatches) {
    return 'matches'; // AI agrees with current
  }

  return 'conflict'; // AI disagrees with current
}


// ============================================================================
// RESULTS STORAGE
// ============================================================================

/**
 * Save categorization results to temporary sheet for review
 *
 * @param {Array} results - Array of categorization results
 */
function saveCategorizationResults(results) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Check if results sheet exists
  let resultsSheet = ss.getSheetByName('AI_Categorization_Results');

  if (resultsSheet) {
    // Clear existing data instead of deleting sheet
    resultsSheet.clear();
    Logger.log('✅ Cleared existing AI_Categorization_Results sheet');
  } else {
    // Create new results sheet if it doesn't exist
    resultsSheet = ss.insertSheet('AI_Categorization_Results');
    Logger.log('✅ Created new AI_Categorization_Results sheet');
  }

  // Add headers
  const headers = [
    'Case_ID',
    'Legacy_Case_ID',
    'Row_Index',
    'Current_Symptom',
    'Current_System',
    'Suggested_Symptom',
    'Suggested_Symptom_Name',
    'Suggested_System',
    'AI_Reasoning',
    'Confidence',
    'Status',
    'User_Decision',
    'Final_Symptom',
    'Final_System'
  ];

  resultsSheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  // Format header row
  resultsSheet.getRange(1, 1, 1, headers.length)
    .setBackground('#2a3040')
    .setFontColor('#e7eaf0')
    .setFontWeight('bold')
    .setHorizontalAlignment('center');

  // Add data rows
  const dataRows = results.map(r => [
    r.caseID,
    r.legacyCaseID,
    r.rowIndex,
    r.currentSymptom,
    r.currentSystem,
    r.suggestedSymptom,
    r.suggestedSymptomName,
    r.suggestedSystem,
    r.reasoning,
    r.confidence,
    r.status,
    '', // User_Decision (empty - to be filled in review)
    r.suggestedSymptom, // Final_Symptom (default to AI suggestion)
    r.suggestedSystem   // Final_System (default to AI suggestion)
  ]);

  if (dataRows.length > 0) {
    resultsSheet.getRange(2, 1, dataRows.length, headers.length).setValues(dataRows);
  }

  // Apply conditional formatting for status
  applyStatusFormatting(resultsSheet, results.length);

  // Freeze header row
  resultsSheet.setFrozenRows(1);

  // Auto-resize columns
  resultsSheet.autoResizeColumns(1, headers.length);

  Logger.log('✅ Saved ' + results.length + ' results to sheet');
}

/**
 * Apply conditional formatting to status column
 */
function applyStatusFormatting(sheet, rowCount) {
  const statusColumn = 11; // Column K: Status

  if (rowCount === 0) return;

  // Color code based on status
  for (let row = 2; row <= rowCount + 1; row++) {
    const status = sheet.getRange(row, statusColumn).getValue();
    const range = sheet.getRange(row, 1, 1, 14); // Entire row

    if (status === 'new') {
      range.setBackground('#e8f5e9'); // Light green - uncategorized
    } else if (status === 'matches') {
      range.setBackground('#f1f8ff'); // Light blue - AI agrees
    } else if (status === 'conflict') {
      range.setBackground('#fff3e0'); // Light orange - AI disagrees
    } else if (status === 'error') {
      range.setBackground('#ffebee'); // Light red - error
    }
  }
}


// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get OpenAI API key from Settings sheet
 */
function getOpenAIAPIKey() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const settingsSheet = ss.getSheetByName('Settings');

  if (!settingsSheet) {
    throw new Error('Settings sheet not found');
  }

  // API key is in Settings!B2
  const apiKey = settingsSheet.getRange('B2').getValue();

  if (!apiKey || apiKey.length === 0) {
    throw new Error('OpenAI API key not found in Settings!B2');
  }

  return apiKey;
}


// ============================================================================
// TEST FUNCTION
// ============================================================================

/**
 * Test AI categorization with a small sample
 * Run this first to verify everything works
 */
function testAICategorization() {
  Logger.log('🧪 Testing AI Categorization with 5 sample cases...');
  Logger.log('');

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const masterSheet = ss.getSheetByName('Master Scenario Convert');

  // Get first 5 cases (rows 3-7)
  const data = masterSheet.getRange(3, 1, 5, 646).getValues();

  const testCases = [];
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    testCases.push({
      rowIndex: i + 3,
      caseID: row[0],
      legacyCaseID: row[8],
      currentSymptom: row[17] || '',      // Column R: Case_Organization_Category_Symptom
      currentSystem: row[18] || '',       // Column S: Case_Organization_Category_System
      chiefComplaint: row[4] || '',
      presentation: row[5] || '',
      diagnosis: row[6] || ''
    });
  }

  Logger.log('📊 Test cases:');
  testCases.forEach(c => {
    Logger.log('   ' + c.caseID + ': ' + c.chiefComplaint);
  });
  Logger.log('');

  try {
    const results = categorizeBatchWithAI(testCases);

    Logger.log('✅ AI Categorization successful!');
    Logger.log('');
    Logger.log('📋 Results:');

    results.forEach(r => {
      Logger.log('   ' + r.caseID);
      Logger.log('      Suggested: ' + r.suggestedSymptom + ' / ' + r.suggestedSystem);
      Logger.log('      Reasoning: ' + r.reasoning);
      Logger.log('      Status: ' + r.status);
      Logger.log('');
    });

    return results;

  } catch (error) {
    Logger.log('❌ Test failed: ' + error.message);
    throw error;
  }
}

/**
 * Clear AI Categorization Results sheet
 *
 * This function completely clears the AI_Categorization_Results sheet,
 * removing all data including headers.
 */
function clearAICategorizationResults() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const resultsSheet = ss.getSheetByName('AI_Categorization_Results');

  if (!resultsSheet) {
    Logger.log('⚠️  AI_Categorization_Results sheet does not exist');
    return {
      success: true,
      message: 'Sheet does not exist (nothing to clear)'
    };
  }

  try {
    // Clear all content from the sheet
    resultsSheet.clear();
    Logger.log('✅ Cleared AI_Categorization_Results sheet');

    return {
      success: true,
      message: 'Results cleared successfully'
    };

  } catch (error) {
    Logger.log('❌ Error clearing results: ' + error.message);
    throw new Error('Failed to clear results: ' + error.message);
  }
}


/**
 * Helper function to add timestamped logs to Sidebar_Logs property (used for both main run and retry)
 */
function addAILog(message) {
  try {
    const props = PropertiesService.getDocumentProperties();
    const existingLogs = props.getProperty('Sidebar_Logs') || '';
    const timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'HH:mm:ss');
    const newLog = '[' + timestamp + '] ' + message;
    props.setProperty('Sidebar_Logs', existingLogs + newLog + '\n');
    Logger.log(newLog);  // Also log to execution log
  } catch (err) {
    Logger.log('Error writing to sidebar log: ' + err.message);
  }
}

/**
 * Retry AI categorization for ONLY the failed cases
 * Identifies rows with empty Suggested_Symptom (failed cases) and re-processes them
 *
 * @return {object} Results with retry statistics
 */
function retryFailedCategorization() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const masterSheet = ss.getSheetByName('Master Scenario Convert');
  const resultsSheet = ss.getSheetByName('AI_Categorization_Results');

  if (!resultsSheet) {
    throw new Error('AI_Categorization_Results sheet not found. Run full categorization first.');
  }

  PropertiesService.getDocumentProperties().deleteProperty('Sidebar_Logs');  // Clear old logs
  addAILog('🔄 Starting Retry for Failed Cases...');
  addAILog('');
  Logger.log('');

  // Get all results data
  const resultsData = resultsSheet.getDataRange().getValues();

  if (resultsData.length < 2) {
    throw new Error('No results found. Run full categorization first.');
  }

  // Find failed cases (rows where Suggested_Symptom is empty)
  const failedCases = [];
  const failedRowIndices = []; // Track which result rows to update

  for (let i = 1; i < resultsData.length; i++) {  // Skip header row
    const row = resultsData[i];
    const suggestedSymptom = row[5];  // Column F: Suggested_Symptom
    const rowIndex = row[2];          // Column C: Row_Index (in Master sheet)
    const caseID = row[0];            // Column A: Case_ID

    // Empty Suggested_Symptom = failed case
    if (!suggestedSymptom || suggestedSymptom.length === 0) {
      failedRowIndices.push(i + 1);  // +1 for sheet row number

      // Validate and convert rowIndex to number (might be string from sheet)
      const rowNum = parseInt(rowIndex, 10);
      if (!rowIndex || isNaN(rowNum) || rowNum < 1) {
        Logger.log('⚠️  Skipping case ' + caseID + ' - invalid rowIndex: ' + rowIndex + ' (parsed: ' + rowNum + ')');
        continue;
      }

      // Fetch case data from Master sheet (use parsed number)
      const masterRow = masterSheet.getRange(rowNum, 1, 1, 646).getValues()[0];

      failedCases.push({
        rowIndex: rowNum,  // Store the parsed NUMBER, not the string
        resultRowIndex: i + 1,  // Row in results sheet
        caseID: masterRow[0],
        legacyCaseID: masterRow[8],
        currentSymptom: masterRow[17] || '',
        currentSystem: masterRow[18] || '',
        chiefComplaint: masterRow[4] || '',
        presentation: masterRow[5] || '',
        diagnosis: masterRow[6] || ''
      });
    }
  }

  if (failedCases.length === 0) {
    Logger.log('✅ No failed cases found! All cases processed successfully.');
    return {
      success: true,
      failedCount: 0,
      message: 'No failed cases to retry'
    };
  }

  addAILog('📊 Found ' + failedCases.length + ' failed cases to retry');
  addAILog('   Case IDs: ' + failedCases.map(fc => fc.caseID).slice(0, 10).join(', ') + (failedCases.length > 10 ? '...' : ''));
  addAILog('');
  Logger.log('');

  // Clear the failed rows first (fresh start for retry)
  addAILog('🧹 Clearing ' + failedCases.length + ' failed rows in results sheet...');
  failedCases.forEach(failedCase => {
    const resultRow = failedCase.resultRowIndex;

    // Validate resultRow before clearing
    if (!resultRow || isNaN(resultRow) || resultRow < 2) {
      Logger.log('⚠️  Skipping clear for invalid resultRow: ' + resultRow);
      return;
    }

    // Clear columns F-K (Suggested_Symptom through Status)
    resultsSheet.getRange(resultRow, 6, 1, 6).clearContent();
    // Also clear Final columns (M-N)
    resultsSheet.getRange(resultRow, 13, 1, 2).clearContent();
  });
  addAILog('✅ Cleared successfully');
  addAILog('');
  Logger.log('');

  // Process failed cases in batches of 10 (smaller batches for retry)
  const batchSize = 10;
  const retryResults = [];

  for (let i = 0; i < failedCases.length; i += batchSize) {
    const batch = failedCases.slice(i, Math.min(i + batchSize, failedCases.length));
    const batchNum = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(failedCases.length / batchSize);

    addAILog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  addAILog('📦 Batch ' + batchNum + '/' + totalBatches + ' (' + batch.length + ' cases)');
  addAILog('   Case IDs: ' + batch.map(c => c.caseID).join(', '));
  addAILog('   Calling OpenAI API...');

    try {
      const batchResults = categorizeBatchWithAI(batch);
      addAILog('   ✅ API responded with ' + batchResults.length + ' results');

      // Log sample result
      if (batchResults.length > 0) {
        const sample = batchResults[0];
        addAILog('   Sample: ' + sample.caseID + ' → ' + (sample.suggestedSymptom || '(empty)') + ' / ' + (sample.suggestedSystem || '(empty)'));
        if (sample.reasoning) {
          addAILog('   Reasoning: ' + sample.reasoning.substring(0, 80) + '...');
        }
      }

      // Log any empty results
      const emptyResults = batchResults.filter(r => !r.suggestedSymptom || r.suggestedSymptom.length === 0);
      if (emptyResults.length > 0) {
        addAILog('   ⚠️  WARNING: ' + emptyResults.length + ' results still empty!');
        emptyResults.forEach(er => {
          addAILog('      - ' + er.caseID + ': ' + (er.reasoning || 'no reasoning'));
        });
      }

      retryResults.push(...batchResults);

      addAILog('   ✅ Batch ' + batchNum + ' complete');
  addAILog('');

      // Small delay to avoid rate limits
      Utilities.sleep(1000);

    } catch (error) {
      addAILog('   ❌ Batch ' + batchNum + ' FAILED: ' + error.message);
      addAILog('   Creating placeholder results for ' + batch.length + ' cases');
      addAILog('');

      // Add placeholder results for failed retry
      batch.forEach(caseData => {
        retryResults.push({
          caseID: caseData.caseID,
          legacyCaseID: caseData.legacyCaseID,
          rowIndex: caseData.rowIndex,
          resultRowIndex: caseData.resultRowIndex,
          currentSymptom: caseData.currentSymptom,
          currentSystem: caseData.currentSystem,
          suggestedSymptom: '',
          suggestedSymptomName: '',
          suggestedSystem: '',
          reasoning: 'Retry failed: ' + error.message,
          status: 'error'
        });
      });
    }
  }

  Logger.log('');
  addAILog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  addAILog('📝 Writing Results Back to Sheet...');
  addAILog('   Sheet name: ' + resultsSheet.getName());
  addAILog('   Total results: ' + retryResults.length);
  addAILog('');

  // Log first few row indices to verify
  const sampleIndices = retryResults.slice(0, 5).map(r => r.caseID + '→row ' + r.resultRowIndex).join(', ');
  addAILog('   Sample row indices: ' + sampleIndices);
  addAILog('');

  // Update results sheet with retry results
  let writeCount = 0;
  let skipCount = 0;

  retryResults.forEach(result => {
    const resultRow = parseInt(result.resultRowIndex, 10);

    // Validate resultRow before updating
    if (!resultRow || isNaN(resultRow) || resultRow < 2) {
      addAILog('   ⚠️  SKIPPED ' + result.caseID + ': invalid resultRowIndex = ' + result.resultRowIndex);
      skipCount++;
      Logger.log('⚠️  Skipping update for invalid resultRow: ' + result.resultRowIndex);
      return;
    }

    // Log the write operation
    addAILog('   ✍️  Row ' + resultRow + ': ' + result.caseID + ' → ' + (result.suggestedSymptom || '(empty)'));
    writeCount++;

    // Update columns F-K (Suggested_Symptom through Status)
    resultsSheet.getRange(resultRow, 6, 1, 6).setValues([[
      result.suggestedSymptom,
      result.suggestedSymptomName,
      result.suggestedSystem,
      result.reasoning,
      result.confidence || 'medium',
      result.status
    ]]);

    // Also update Final columns (M-N) if successful
    if (result.suggestedSymptom && result.suggestedSymptom.length > 0) {
      resultsSheet.getRange(resultRow, 13, 1, 2).setValues([[
        result.suggestedSymptom,
        result.suggestedSystem
      ]]);
    }
  });

  addAILog('');
  addAILog('📊 Write Summary:');
  addAILog('   ✅ Rows written: ' + writeCount);
  addAILog('   ⚠️  Rows skipped: ' + skipCount);
  addAILog('');

  // Re-apply status formatting
  const totalRows = resultsSheet.getLastRow() - 1;
  applyStatusFormatting(resultsSheet, totalRows);

  // Count successes vs failures FIRST (before logging)
  const successCount = retryResults.filter(r => r.suggestedSymptom && r.suggestedSymptom.length > 0).length;
  const stillFailedCount = retryResults.length - successCount;

  addAILog('✅ Write-back complete');
  addAILog('');
  addAILog('🎉 Retry Complete!');
  addAILog('   Cases retried: ' + retryResults.length);
  addAILog('   Successfully fixed: ' + successCount);
  addAILog('   Still failed: ' + stillFailedCount);
  addAILog('');
  addAILog('═══════════════════════════════════════════');

  return {
    success: true,
    totalRetried: retryResults.length,
    successCount: successCount,
    stillFailedCount: stillFailedCount,
    message: 'Retry complete: ' + successCount + ' fixed, ' + stillFailedCount + ' still failed'
  };
}
