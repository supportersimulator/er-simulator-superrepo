/**
 * ===========================================================================
 * PATHWAYS REFINEMENT FUNCTIONS - ADD TO EXISTING APPS SCRIPT
 * ===========================================================================
 *
 * SAFE TO ADD: These functions are self-contained and won't disrupt existing code
 *
 * Date: 2025-11-10
 * Purpose: Enable pathway refinement workflow (accronym assignment, categorization)
 *
 * TO DEPLOY:
 * 1. Open your Google Sheet
 * 2. Extensions → Apps Script
 * 3. Scroll to bottom of your existing Code.gs file
 * 4. Paste this entire block below existing functions
 * 5. Save (Cmd+S)
 *
 * NOTE: Schema columns (S-AC) already added via Sheets API on 2025-11-10
 * ===========================================================================
 */


// ============================================================================
// ACCRONYM MAPPING FUNCTIONS
// ============================================================================

/**
 * Get accronym mapping from Aaron's finalized Google Sheet
 * Returns object with symptom and category mappings
 *
 * Used by: Refinement UI to populate category dropdowns
 */
function getAccronymMapping() {
  const mappingSheetId = '1PvZMOb1fvN20iKztTdeqm7wtInfbad9Rbr_kTbzfBy8';
  const mappingSheet = SpreadsheetApp.openById(mappingSheetId);
  const data = mappingSheet.getSheetByName('Category Mapping').getDataRange().getValues();

  const mapping = {};

  // Skip header row
  for (let i = 1; i < data.length; i++) {
    const accronym = data[i][0];
    if (!accronym) continue; // Skip empty rows

    mapping[accronym] = {
      symptom: data[i][1] || '',
      preCategory: data[i][2] || '',
      postCategory: data[i][3] || '',
      postCategoryAlt1: data[i][4] || '',
      postCategoryAlt2: data[i][5] || '',
      notes: data[i][6] || ''
    };
  }

  Logger.log('📋 Loaded ' + Object.keys(mapping).length + ' accronym mappings');
  return mapping;
}

/**
 * Get list of all accronyms for dropdown
 *
 * Used by: Refinement UI accronym selector
 */
function getAccronymList() {
  const mapping = getAccronymMapping();
  const list = [];

  for (const accronym in mapping) {
    list.push({
      accronym: accronym,
      symptom: mapping[accronym].symptom,
      label: accronym + ' - ' + mapping[accronym].symptom
    });
  }

  // Sort alphabetically by accronym
  list.sort((a, b) => a.accronym.localeCompare(b.accronym));

  return list;
}


// ============================================================================
// PATHWAY REFINEMENT FUNCTIONS
// ============================================================================

/**
 * Populate categories for a pathway based on accronym
 * Auto-fills Pre/Post experience categories when accronym is selected
 *
 * Used by: Refinement UI when user selects accronym dropdown
 *
 * @param {string} pathwayId - Pathway_ID (e.g., "PATH_001")
 * @param {string} accronym - Chief complaint accronym (e.g., "CP", "SOB")
 * @return {object} Success status and populated categories
 */
function populateCategoriesFromAccronym(pathwayId, accronym) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const pathwaysSheet = ss.getSheetByName('Pathways_Master');
  const mapping = getAccronymMapping();

  if (!mapping[accronym]) {
    throw new Error('Invalid accronym: ' + accronym);
  }

  // Find pathway row
  const data = pathwaysSheet.getDataRange().getValues();
  let pathwayRow = -1;

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === pathwayId) {
      pathwayRow = i + 1;
      break;
    }
  }

  if (pathwayRow === -1) {
    throw new Error('Pathway not found: ' + pathwayId);
  }

  // Update columns with mapping data
  const accronymData = mapping[accronym];

  // Column S: Chief_Complaint_Accronym
  pathwaysSheet.getRange(pathwayRow, 19).setValue(accronym);

  // Column W: Pre_Experience_Category
  pathwaysSheet.getRange(pathwayRow, 23).setValue(accronymData.preCategory);

  // Column X: Post_Experience_Category
  pathwaysSheet.getRange(pathwayRow, 24).setValue(accronymData.postCategory);

  // Column Y: Post_Experience_Category_Alt1
  if (accronymData.postCategoryAlt1) {
    pathwaysSheet.getRange(pathwayRow, 25).setValue(accronymData.postCategoryAlt1);
  }

  // Column Z: Post_Experience_Category_Alt2
  if (accronymData.postCategoryAlt2) {
    pathwaysSheet.getRange(pathwayRow, 26).setValue(accronymData.postCategoryAlt2);
  }

  Logger.log('✅ Populated categories for ' + pathwayId + ' with accronym: ' + accronym);

  return {
    success: true,
    accronym: accronym,
    preCategory: accronymData.preCategory,
    postCategory: accronymData.postCategory
  };
}

/**
 * Generate new Case IDs for pathway based on accronym and pathway number
 *
 * Example: accronym="CP", pathwayNumber=1, caseCount=4
 *   → ["CP101", "CP102", "CP103", "CP104"]
 *
 * Used by: Refinement UI to preview proposed Case IDs
 *
 * @param {string} accronym - Chief complaint accronym (e.g., "CP")
 * @param {number} pathwayNumber - Pathway number within symptom (1-9)
 * @param {number} caseCount - Number of cases in pathway
 * @return {Array<string>} Array of new Case IDs
 */
function generateNewCaseIDs(accronym, pathwayNumber, caseCount) {
  const newCaseIDs = [];

  for (let i = 1; i <= caseCount; i++) {
    const caseNumber = String(i).padStart(2, '0'); // 01, 02, 03, etc.
    const caseID = accronym + pathwayNumber + caseNumber;
    newCaseIDs.push(caseID);
  }

  return newCaseIDs;
}

/**
 * Update pathway refinement data
 * Saves all refinement fields for a pathway
 *
 * Used by: Refinement UI "Save Draft" button
 *
 * @param {string} pathwayId - Pathway_ID
 * @param {object} refinementData - Object with refinement fields
 * @return {object} Success status
 */
function updatePathwayRefinement(pathwayId, refinementData) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const pathwaysSheet = ss.getSheetByName('Pathways_Master');

  // Find pathway row
  const data = pathwaysSheet.getDataRange().getValues();
  let pathwayRow = -1;

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === pathwayId) {
      pathwayRow = i + 1;
      break;
    }
  }

  if (pathwayRow === -1) {
    throw new Error('Pathway not found: ' + pathwayId);
  }

  // Update columns based on provided data
  if (refinementData.accronym) {
    pathwaysSheet.getRange(pathwayRow, 19).setValue(refinementData.accronym); // Column S
  }

  if (refinementData.pathwayNumber) {
    pathwaysSheet.getRange(pathwayRow, 20).setValue(refinementData.pathwayNumber); // Column T
  }

  if (refinementData.proposedNewCaseIDs) {
    const caseIDsJson = JSON.stringify(refinementData.proposedNewCaseIDs);
    pathwaysSheet.getRange(pathwayRow, 22).setValue(caseIDsJson); // Column V
  }

  if (refinementData.preCategory) {
    pathwaysSheet.getRange(pathwayRow, 23).setValue(refinementData.preCategory); // Column W
  }

  if (refinementData.postCategory) {
    pathwaysSheet.getRange(pathwayRow, 24).setValue(refinementData.postCategory); // Column X
  }

  Logger.log('✅ Updated refinement data for ' + pathwayId);

  return { success: true };
}

/**
 * Finalize pathway - marks as ready to apply to production
 * Sets Finalized=TRUE and timestamps
 *
 * Used by: Refinement UI "Finalize" button
 *
 * @param {string} pathwayId - Pathway_ID
 * @param {string} userName - User who finalized (e.g., "Aaron")
 * @return {object} Success status
 */
function finalizePathway(pathwayId, userName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const pathwaysSheet = ss.getSheetByName('Pathways_Master');

  // Find pathway row
  const data = pathwaysSheet.getDataRange().getValues();
  let pathwayRow = -1;

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === pathwayId) {
      pathwayRow = i + 1;
      break;
    }
  }

  if (pathwayRow === -1) {
    throw new Error('Pathway not found: ' + pathwayId);
  }

  // Validation: Check required fields
  const accronym = pathwaysSheet.getRange(pathwayRow, 19).getValue();
  const pathwayNumber = pathwaysSheet.getRange(pathwayRow, 20).getValue();
  const proposedCaseIDs = pathwaysSheet.getRange(pathwayRow, 22).getValue();

  if (!accronym) {
    throw new Error('Cannot finalize: Chief Complaint Accronym is required');
  }

  if (!pathwayNumber) {
    throw new Error('Cannot finalize: Pathway Number is required');
  }

  if (!proposedCaseIDs) {
    throw new Error('Cannot finalize: Proposed Case IDs are required');
  }

  // Set finalization fields
  pathwaysSheet.getRange(pathwayRow, 27).setValue('TRUE'); // Column AA: Finalized
  pathwaysSheet.getRange(pathwayRow, 28).setValue(new Date()); // Column AB: Applied_Date
  pathwaysSheet.getRange(pathwayRow, 29).setValue(userName); // Column AC: Applied_By

  Logger.log('✅ Finalized pathway: ' + pathwayId);

  return {
    success: true,
    pathwayId: pathwayId,
    finalizedBy: userName,
    finalizedAt: new Date()
  };
}


// ============================================================================
// SCHEMA VERIFICATION FUNCTIONS
// ============================================================================

/**
 * Verify Pathways_Master schema is correct
 * Checks that all required columns exist
 *
 * Used by: Manual verification, debugging
 */
function verifyPathwaysSchema() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const pathwaysSheet = ss.getSheetByName('Pathways_Master');

  if (!pathwaysSheet) {
    Logger.log('❌ Pathways_Master sheet not found');
    return;
  }

  const headers = pathwaysSheet.getRange(1, 1, 1, pathwaysSheet.getLastColumn()).getValues()[0];

  Logger.log('📊 Pathways_Master Schema Verification:');
  Logger.log('');
  Logger.log('Total columns: ' + headers.length);
  Logger.log('');

  headers.forEach((header, index) => {
    let col = '';
    if (index < 26) {
      col = String.fromCharCode(65 + index);
    } else {
      col = 'A' + String.fromCharCode(65 + (index - 26));
    }
    Logger.log(col + ': ' + header);
  });

  Logger.log('');

  // Check for required columns
  const requiredColumns = [
    'Chief_Complaint_Accronym',
    'Pathway_Number',
    'Original_Case_IDs',
    'Proposed_New_Case_IDs',
    'Pre_Experience_Category',
    'Post_Experience_Category',
    'Finalized',
    'Applied_Date',
    'Applied_By'
  ];

  Logger.log('Checking required columns:');
  requiredColumns.forEach(col => {
    const found = headers.includes(col);
    Logger.log((found ? '✅' : '❌') + ' ' + col);
  });
}


// ============================================================================
// END OF PATHWAYS REFINEMENT FUNCTIONS
// ============================================================================
