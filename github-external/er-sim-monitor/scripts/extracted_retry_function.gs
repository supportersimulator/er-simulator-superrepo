function retryFailedCategorization() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const masterSheet = ss.getSheetByName('Master Scenario Convert');
  const resultsSheet = ss.getSheetByName('AI_Categorization_Results');

  if (!resultsSheet) {
    throw new Error('AI_Categorization_Results sheet not found. Run full categorization first.');
  }

  Logger.log('🔄 Starting retry for failed cases...');
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

  Logger.log('📊 Found ' + failedCases.length + ' failed cases to retry');
  Logger.log('');

  // Clear the failed rows first (fresh start for retry)
  Logger.log('🧹 Clearing failed rows...');
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
  Logger.log('✅ Cleared ' + failedCases.length + ' failed rows');
  Logger.log('');

  // Process failed cases in batches of 10 (smaller batches for retry)
  const batchSize = 10;
  const retryResults = [];

  for (let i = 0; i < failedCases.length; i += batchSize) {
    const batch = failedCases.slice(i, Math.min(i + batchSize, failedCases.length));
    const batchNum = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(failedCases.length / batchSize);

    Logger.log('📦 Retry batch ' + batchNum + '/' + totalBatches + ' (' + batch.length + ' cases)...');

    try {
      const batchResults = categorizeBatchWithAI(batch);
      retryResults.push(...batchResults);

      Logger.log('✅ Retry batch ' + batchNum + ' complete');

      // Small delay to avoid rate limits
      Utilities.sleep(1000);

    } catch (error) {
      Logger.log('❌ Retry batch ' + batchNum + ' failed: ' + error.message);

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
  Logger.log('🎉 Retry complete!');
  Logger.log('   Failed cases retried: ' + retryResults.length);

  // Update results sheet with retry results
  retryResults.forEach(result => {
    const resultRow = parseInt(result.resultRowIndex, 10);

    // Validate resultRow before updating
    if (!resultRow || isNaN(resultRow) || resultRow < 2) {
      Logger.log('⚠️  Skipping update for invalid resultRow: ' + result.resultRowIndex);
      return;
    }

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

  // Re-apply status formatting
  const totalRows = resultsSheet.getLastRow() - 1;
  applyStatusFormatting(resultsSheet, totalRows);

  Logger.log('✅ Updated results sheet with retry data');

  // Count successes vs failures
  const successCount = retryResults.filter(r => r.suggestedSymptom && r.suggestedSymptom.length > 0).length;
  const stillFailedCount = retryResults.length - successCount;

  return {
    success: true,
    totalRetried: retryResults.length,
    successCount: successCount,
    stillFailedCount: stillFailedCount,
    message: 'Retry complete: ' + successCount + ' fixed, ' + stillFailedCount + ' still failed'
  };
}