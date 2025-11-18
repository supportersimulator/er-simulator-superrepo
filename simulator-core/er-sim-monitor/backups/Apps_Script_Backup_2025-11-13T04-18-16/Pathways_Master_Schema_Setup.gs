/**
 * PATHWAYS_MASTER SCHEMA SETUP
 *
 * Adds columns S-AC to Pathways_Master sheet for pathway refinement workflow
 * Based on Aaron's finalized accronym mapping
 *
 * Date: 2025-11-09
 */

/**
 * Add refinement columns to Pathways_Master sheet
 * Run this once to set up the schema
 */
function addPathwayRefinementColumns() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const pathwaysSheet = ss.getSheetByName('Pathways_Master');

  if (!pathwaysSheet) {
    throw new Error('Pathways_Master sheet not found! Run Phase 1 setup first.');
  }

  // Get current headers
  const headers = pathwaysSheet.getRange(1, 1, 1, pathwaysSheet.getLastColumn()).getValues()[0];

  Logger.log('Current columns: ' + headers.length);
  Logger.log('Last column: ' + headers[headers.length - 1]);

  // Expected existing columns (A-R): 18 columns
  const expectedColumns = [
    'Pathway_ID',
    'Pathway_Name',
    'Logic_Type_Used',
    'Category_Accronym',
    'Educational_Score',
    'Novelty_Score',
    'Market_Score',
    'Composite_Score',
    'Tier',
    'Case_IDs',
    'Case_Sequence',
    'Target_Learner',
    'AI_Persuasion',
    'Learning_Outcomes',
    'Discovery_Date',
    'User_Rating',
    'Status',
    'Notes'
  ];

  // New columns to add (S-AC): 11 columns
  const newColumns = [
    'Chief_Complaint_Accronym',      // S: CP, SOB, ABD, HA, etc.
    'Pathway_Number',                // T: 1, 2, 3 (within symptom)
    'Original_Case_IDs',             // U: ["GI01234","NEURO00321"] - ANCHOR
    'Proposed_New_Case_IDs',         // V: ["CP101","CP102","CP103"]
    'Pre_Experience_Category',       // W: "Chest Pain Cases" (mystery preserved)
    'Post_Experience_Category',      // X: "Cardiovascular" (revealed after)
    'Post_Experience_Category_Alt1', // Y: "Pulmonary" (alternative)
    'Post_Experience_Category_Alt2', // Z: "Critical Care" (alternative)
    'Finalized',                     // AA: FALSE / TRUE
    'Applied_Date',                  // AB: 2025-11-09 14:32:15
    'Applied_By'                     // AC: "Aaron"
  ];

  // Check if columns already exist
  if (headers.length >= 29) {
    Logger.log('⚠️ Columns already exist (found ' + headers.length + ' columns)');
    Logger.log('Skipping column addition to prevent duplicates');
    return {
      success: false,
      message: 'Columns already exist',
      columnCount: headers.length
    };
  }

  // Add new column headers
  const startCol = headers.length + 1; // Column S (19th column)
  pathwaysSheet.getRange(1, startCol, 1, newColumns.length).setValues([newColumns]);

  // Format header row
  pathwaysSheet.getRange(1, startCol, 1, newColumns.length)
    .setBackground('#2a3040')
    .setFontColor('#e7eaf0')
    .setFontWeight('bold')
    .setHorizontalAlignment('center');

  Logger.log('✅ Added ' + newColumns.length + ' new columns (S-AC)');

  // Initialize existing pathway rows with default values
  const lastRow = pathwaysSheet.getLastRow();
  if (lastRow > 1) {
    Logger.log('Initializing ' + (lastRow - 1) + ' existing pathways...');

    for (let row = 2; row <= lastRow; row++) {
      // Get existing Case_IDs (Column J)
      const caseIDs = pathwaysSheet.getRange(row, 10).getValue();

      // Column U: Original_Case_IDs (copy from Case_IDs as anchor)
      pathwaysSheet.getRange(row, startCol + 2).setValue(caseIDs);

      // Column AA: Finalized (default FALSE)
      pathwaysSheet.getRange(row, startCol + 8).setValue('FALSE');

      Logger.log('  Row ' + row + ': Initialized Original_Case_IDs and Finalized');
    }
  }

  Logger.log('✅ Schema setup complete!');

  return {
    success: true,
    message: 'Added 11 new columns (S-AC) to Pathways_Master',
    newColumns: newColumns,
    totalColumns: startCol + newColumns.length - 1,
    rowsInitialized: lastRow - 1
  };
}

/**
 * Get accronym mapping from Aaron's finalized Google Sheet
 * Returns object with symptom and category mappings
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
 * Test function - verify schema is correct
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
    const col = String.fromCharCode(65 + index);
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

/**
 * Populate categories for a pathway based on accronym
 * Used by Refinement UI
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
