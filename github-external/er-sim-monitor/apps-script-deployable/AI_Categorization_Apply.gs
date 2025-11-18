/**
 * ===========================================================================
 * AI CATEGORIZATION APPLICATION FUNCTIONS
 * ===========================================================================
 *
 * Purpose: Apply reviewed categorizations to Master Scenario Convert
 * Method: Read from AI_Categorization_Results → Validate → Update Master
 *
 * Date: 2025-11-10
 * ===========================================================================
 */


// ============================================================================
// MAIN APPLICATION FUNCTION
// ============================================================================

/**
 * Apply categorizations from results sheet to Master Scenario Convert
 * Called after user reviews and approves suggestions
 *
 * @param {string} applyMode - 'all' | 'selected' | 'conflicts-only'
 * @return {object} Application results
 */
function applyCategorization(applyMode) {
  applyMode = applyMode || 'all';

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const resultsSheet = ss.getSheetByName('AI_Categorization_Results');
  const masterSheet = ss.getSheetByName('Master Scenario Convert');

  if (!resultsSheet) {
    throw new Error('AI_Categorization_Results sheet not found. Run AI categorization first.');
  }

  Logger.log('🚀 Starting categorization application...');
  Logger.log('   Mode: ' + applyMode);
  Logger.log('');

  // Get all results
  const lastRow = resultsSheet.getLastRow();
  if (lastRow < 2) {
    throw new Error('No categorization results found');
  }

  const data = resultsSheet.getRange(2, 1, lastRow - 1, 14).getValues();

  Logger.log('📊 Loaded ' + data.length + ' categorization results');

  // Parse results
  const categorizationData = {};

  for (let i = 0; i < data.length; i++) {
    const row = data[i];

    const caseID = row[0];
    const legacyCaseID = row[1];
    const finalSymptom = row[12]; // Column M: Final_Symptom
    const finalSystem = row[13];  // Column N: Final_System
    const status = row[10];       // Column K: Status

    // Apply mode filtering
    if (applyMode === 'conflicts-only' && status !== 'conflict') {
      continue; // Skip non-conflicts
    }

    // Only include cases with final values
    if (finalSymptom && finalSystem) {
      categorizationData[legacyCaseID] = {
        caseID: caseID,
        symptom: finalSymptom,
        system: finalSystem,
        status: status
      };
    }
  }

  Logger.log('📝 Filtered to ' + Object.keys(categorizationData).length + ' cases to update');
  Logger.log('');

  // Run 5-layer validation
  validateCategorization(categorizationData, masterSheet);

  Logger.log('✅ Validation passed');
  Logger.log('');

  // Create backup
  const backupName = createBackup(masterSheet);
  Logger.log('✅ Backup created: ' + backupName);
  Logger.log('');

  // User confirmation
  const ui = SpreadsheetApp.getUi();
  const confirmMessage = 'Apply categorization to ' + Object.keys(categorizationData).length + ' cases in Master Scenario Convert?\n\n' +
                        'Backup created: ' + backupName + '\n\n' +
                        'This will update 4 columns in the Case_Organization group:\n' +
                        '- Case_Organization_Category_Symptom (Column R)\n' +
                        '- Case_Organization_Category_System (Column S)\n' +
                        '- Case_Organization_Category_Symptom_Name (Column P)\n' +
                        '- Case_Organization_Category_System_Name (Column Q)';

  const response = ui.alert('Confirm Categorization', confirmMessage, ui.ButtonSet.YES_NO);

  if (response !== ui.Button.YES) {
    Logger.log('❌ User cancelled');
    return {
      success: false,
      message: 'User cancelled operation'
    };
  }

  Logger.log('✅ User confirmed');
  Logger.log('');

  // Apply updates
  const updateResults = applyCategorizationUpdates(categorizationData, masterSheet);

  Logger.log('');
  Logger.log('🎉 Categorization application complete!');
  Logger.log('   Cases updated: ' + updateResults.updated);
  Logger.log('   Errors: ' + updateResults.errors);

  return {
    success: true,
    updated: updateResults.updated,
    errors: updateResults.errors,
    backup: backupName
  };
}


// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * 5-Layer validation before applying categorization
 */
function validateCategorization(categorizationData, masterSheet) {
  Logger.log('🔒 Running 5-layer validation...');
  Logger.log('');

  // Layer 1: Check all cases exist in Master
  Logger.log('Layer 1: Verifying all cases exist...');
  for (const legacyCaseID in categorizationData) {
    const row = findRowByLegacyCaseID(masterSheet, legacyCaseID);
    if (!row) {
      throw new Error('Layer 1 failed: Case not found - ' + legacyCaseID);
    }
  }
  Logger.log('✅ Layer 1 passed: All cases exist');

  // Layer 2: Validate all symptom accronyms
  Logger.log('Layer 2: Validating symptom accronyms...');
  const validSymptoms = getAccronymMapping();

  for (const legacyCaseID in categorizationData) {
    const cat = categorizationData[legacyCaseID];
    if (!validSymptoms[cat.symptom]) {
      throw new Error('Layer 2 failed: Invalid symptom accronym - ' + cat.symptom + ' for case ' + legacyCaseID);
    }
  }
  Logger.log('✅ Layer 2 passed: All symptom accronyms valid');

  // Layer 3: Validate all system categories
  Logger.log('Layer 3: Validating system categories...');
  const validSystems = getValidSystemCategories();

  for (const legacyCaseID in categorizationData) {
    const cat = categorizationData[legacyCaseID];
    if (!validSystems.includes(cat.system)) {
      throw new Error('Layer 3 failed: Invalid system category - ' + cat.system + ' for case ' + legacyCaseID);
    }
  }
  Logger.log('✅ Layer 3 passed: All system categories valid');

  // Layer 4: Check for data integrity
  Logger.log('Layer 4: Checking data integrity...');
  for (const legacyCaseID in categorizationData) {
    if (!legacyCaseID || legacyCaseID.length === 0) {
      throw new Error('Layer 4 failed: Empty Legacy_Case_ID found');
    }
    const cat = categorizationData[legacyCaseID];
    if (!cat.symptom || !cat.system) {
      throw new Error('Layer 4 failed: Missing symptom or system for ' + legacyCaseID);
    }
  }
  Logger.log('✅ Layer 4 passed: Data integrity verified');

  // Layer 5: Check column existence
  Logger.log('Layer 5: Verifying target columns exist...');
  const headers = masterSheet.getRange(2, 1, 1, masterSheet.getLastColumn()).getValues()[0];

  const requiredColumns = [
    'Case_Organization_Category_Symptom',
    'Case_Organization_Category_System',
    'Case_Organization_Category_Symptom_Name',
    'Case_Organization_Category_System_Name'
  ];
  requiredColumns.forEach(col => {
    if (!headers.includes(col)) {
      throw new Error('Layer 5 failed: Required column not found - ' + col);
    }
  });
  Logger.log('✅ Layer 5 passed: All target columns exist');

  Logger.log('');
  Logger.log('✅ All 5 validation layers passed');
}

/**
 * Get list of valid system categories
 */
function getValidSystemCategories() {
  return [
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
  ];
}

/**
 * Create backup of Master Scenario Convert
 */
function createBackup(masterSheet) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
  const backupName = 'Master Scenario Convert (Backup ' + timestamp + ')';

  const backup = masterSheet.copyTo(ss);
  backup.setName(backupName);

  // Move backup to end
  ss.moveActiveSheet(ss.getNumSheets());

  return backupName;
}


// ============================================================================
// UPDATE FUNCTIONS
// ============================================================================

/**
 * Apply categorization updates to Master Scenario Convert
 */
function applyCategorizationUpdates(categorizationData, masterSheet) {
  Logger.log('🔧 Applying categorization updates...');
  Logger.log('');

  let updated = 0;
  let errors = 0;

  const accronymMapping = getAccronymMapping();

  for (const legacyCaseID in categorizationData) {
    try {
      const cat = categorizationData[legacyCaseID];

      // Find row by Legacy_Case_ID
      const row = findRowByLegacyCaseID(masterSheet, legacyCaseID);

      if (!row) {
        Logger.log('❌ Case not found: ' + legacyCaseID);
        errors++;
        continue;
      }

      // Get full symptom name from mapping
      const symptomMapping = accronymMapping[cat.symptom];
      const symptomName = symptomMapping ? symptomMapping.preCategory : cat.symptom;

      // Column R (18): Case_Organization_Category_Symptom (accronym)
      masterSheet.getRange(row, 18).setValue(cat.symptom);

      // Column S (19): Case_Organization_Category_System (system name)
      masterSheet.getRange(row, 19).setValue(cat.system);

      // Column P (16): Case_Organization_Category_Symptom_Name (full symptom name)
      masterSheet.getRange(row, 16).setValue(symptomName);

      // Column Q (17): Case_Organization_Category_System_Name (system name - same as Column S)
      masterSheet.getRange(row, 17).setValue(cat.system);

      Logger.log('✅ Updated ' + cat.caseID + ': ' + cat.symptom + ' / ' + cat.system);
      updated++;

    } catch (error) {
      Logger.log('❌ Error updating ' + legacyCaseID + ': ' + error.message);
      errors++;
    }
  }

  return {
    updated: updated,
    errors: errors
  };
}

/**
 * Find row by Legacy_Case_ID
 * (Helper function - may already exist in other files)
 */
function findRowByLegacyCaseID(sheet, legacyCaseID) {
  const legacyColumn = 9; // Column I: Legacy_Case_ID
  const lastRow = sheet.getLastRow();

  // Get all Legacy_Case_ID values (skip 2 header rows)
  const data = sheet.getRange(3, legacyColumn, lastRow - 2, 1).getValues();

  for (let i = 0; i < data.length; i++) {
    if (data[i][0] === legacyCaseID) {
      return i + 3; // Row number (1-indexed, +2 for headers, +1 for array offset)
    }
  }

  return null; // Not found
}


// ============================================================================
// REVIEW INTERFACE HELPERS
// ============================================================================

/**
 * Get categorization statistics for UI display
 */
function getCategorizationStats() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const resultsSheet = ss.getSheetByName('AI_Categorization_Results');

  if (!resultsSheet) {
    return {
      total: 0,
      new: 0,
      matches: 0,
      conflicts: 0,
      errors: 0
    };
  }

  const lastRow = resultsSheet.getLastRow();
  if (lastRow < 2) {
    return {
      total: 0,
      new: 0,
      matches: 0,
      conflicts: 0,
      errors: 0
    };
  }

  const statusData = resultsSheet.getRange(2, 11, lastRow - 1, 1).getValues(); // Column K: Status

  const stats = {
    total: statusData.length,
    new: 0,
    matches: 0,
    conflicts: 0,
    errors: 0
  };

  statusData.forEach(row => {
    const status = row[0];
    if (status === 'new') stats.new++;
    else if (status === 'matches') stats.matches++;
    else if (status === 'conflict') stats.conflicts++;
    else if (status === 'error') stats.errors++;
  });

  return stats;
}

/**
 * Get categorization results for UI display
 * Returns filtered/paginated results
 */
function getCategorizationResults(filter, page, pageSize) {
  filter = filter || 'all';
  page = page || 1;
  pageSize = pageSize || 50;

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const resultsSheet = ss.getSheetByName('AI_Categorization_Results');

  if (!resultsSheet) {
    return { results: [], total: 0 };
  }

  const lastRow = resultsSheet.getLastRow();
  if (lastRow < 2) {
    return { results: [], total: 0 };
  }

  const data = resultsSheet.getRange(2, 1, lastRow - 1, 14).getValues();

  // Filter results
  let filtered = data.filter(row => {
    const status = row[10]; // Column K: Status

    if (filter === 'all') return true;
    if (filter === 'new') return status === 'new';
    if (filter === 'matches') return status === 'matches';
    if (filter === 'conflicts') return status === 'conflict';
    if (filter === 'errors') return status === 'error';

    return true;
  });

  // Paginate
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const paginated = filtered.slice(start, end);

  // Format for UI
  const results = paginated.map(row => {
    return {
      caseID: row[0],
      legacyCaseID: row[1],
      rowIndex: row[2],
      currentSymptom: row[3],
      currentSystem: row[4],
      suggestedSymptom: row[5],
      suggestedSymptomName: row[6],
      suggestedSystem: row[7],
      reasoning: row[8],
      confidence: row[9],
      status: row[10],
      userDecision: row[11],
      finalSymptom: row[12],
      finalSystem: row[13]
    };
  });

  return {
    results: results,
    total: filtered.length,
    page: page,
    pageSize: pageSize,
    totalPages: Math.ceil(filtered.length / pageSize)
  };
}


// ============================================================================
// ROLLBACK FUNCTION
// ============================================================================

/**
 * Rollback to most recent backup
 */
function rollbackCategorization() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = ss.getSheets();

  // Find most recent backup
  let latestBackup = null;
  let latestTimestamp = 0;

  sheets.forEach(sheet => {
    const name = sheet.getName();
    if (name.startsWith('Master Scenario Convert (Backup')) {
      // Extract timestamp from name
      const match = name.match(/Backup (\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})/);
      if (match) {
        const timestamp = new Date(match[1]).getTime();
        if (timestamp > latestTimestamp) {
          latestTimestamp = timestamp;
          latestBackup = sheet;
        }
      }
    }
  });

  if (!latestBackup) {
    throw new Error('No backup found to rollback to');
  }

  const ui = SpreadsheetApp.getUi();
  const response = ui.alert(
    'Confirm Rollback',
    'Restore Master Scenario Convert from backup: ' + latestBackup.getName() + '?',
    ui.ButtonSet.YES_NO
  );

  if (response !== ui.Button.YES) {
    return { success: false, message: 'User cancelled' };
  }

  // Delete current Master Scenario Convert
  const currentMaster = ss.getSheetByName('Master Scenario Convert');
  if (currentMaster) {
    ss.deleteSheet(currentMaster);
  }

  // Rename backup to Master Scenario Convert
  latestBackup.setName('Master Scenario Convert');

  Logger.log('✅ Rolled back to: ' + latestBackup.getName());

  return {
    success: true,
    message: 'Rolled back to backup: ' + latestBackup.getName()
  };
}
