/**
 * Enhanced analyzeCatalog_() with detailed diagnostic logging
 * Use this version to debug why cache isn't being used
 */

function analyzeCatalog_() {
  Logger.log('🔍 [CACHE DEBUG] Starting analyzeCatalog_()');

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  Logger.log('🔍 [CACHE DEBUG] Got spreadsheet: ' + ss.getName());

  // TIER 1: Try cached analysis first
  Logger.log('🔍 [CACHE DEBUG] Looking for Pathway_Analysis_Cache sheet...');
  let cacheSheet = ss.getSheetByName('Pathway_Analysis_Cache');

  if (!cacheSheet) {
    Logger.log('❌ [CACHE DEBUG] Cache sheet NOT FOUND - proceeding to Tier 2');
  } else {
    Logger.log('✅ [CACHE DEBUG] Cache sheet found!');

    try {
      Logger.log('🔍 [CACHE DEBUG] Reading cache data...');
      const data = cacheSheet.getDataRange().getValues();
      Logger.log('🔍 [CACHE DEBUG] Cache has ' + data.length + ' rows');

      if (data.length < 2) {
        Logger.log('⚠️  [CACHE DEBUG] Cache sheet is empty (only header row)');
      } else {
        Logger.log('🔍 [CACHE DEBUG] Cache has data! Reading timestamp...');

        const timestampValue = data[1][0];
        Logger.log('🔍 [CACHE DEBUG] Raw timestamp value: ' + timestampValue);
        Logger.log('🔍 [CACHE DEBUG] Timestamp type: ' + typeof timestampValue);

        try {
          const cachedTimestamp = new Date(timestampValue);
          Logger.log('🔍 [CACHE DEBUG] Parsed timestamp: ' + cachedTimestamp.toString());

          const now = new Date();
          Logger.log('🔍 [CACHE DEBUG] Current time: ' + now.toString());

          const hoursDiff = (now - cachedTimestamp) / (1000 * 60 * 60);
          Logger.log('🔍 [CACHE DEBUG] Cache age: ' + hoursDiff.toFixed(2) + ' hours');

          if (hoursDiff < 24) {
            Logger.log('✅ [CACHE DEBUG] Cache is VALID (< 24 hours) - attempting to parse JSON...');

            const jsonData = data[1][1];
            Logger.log('🔍 [CACHE DEBUG] JSON data length: ' + (jsonData ? jsonData.length : 0) + ' characters');

            if (!jsonData) {
              Logger.log('❌ [CACHE DEBUG] Cache data is empty! Proceeding to Tier 2');
            } else {
              try {
                Logger.log('🔍 [CACHE DEBUG] Attempting JSON.parse()...');
                const parsed = JSON.parse(jsonData);
                Logger.log('✅ [CACHE DEBUG] JSON parsed successfully!');
                Logger.log('🔍 [CACHE DEBUG] Parsed object keys: ' + Object.keys(parsed).join(', '));

                if (parsed.allCases) {
                  Logger.log('✅ [CACHE DEBUG] Found allCases array with ' + parsed.allCases.length + ' cases');
                  Logger.log('🎉 [CACHE DEBUG] RETURNING CACHED DATA - SUCCESS!');
                  return parsed;
                } else {
                  Logger.log('❌ [CACHE DEBUG] Parsed object has no allCases property!');
                }
              } catch (parseError) {
                Logger.log('❌ [CACHE DEBUG] JSON.parse() FAILED: ' + parseError.message);
                Logger.log('🔍 [CACHE DEBUG] First 200 chars of JSON: ' + jsonData.substring(0, 200));
              }
            }
          } else {
            Logger.log('⚠️  [CACHE DEBUG] Cache is STALE (' + hoursDiff.toFixed(1) + ' hours old) - proceeding to Tier 2');
          }
        } catch (dateError) {
          Logger.log('❌ [CACHE DEBUG] Failed to parse timestamp: ' + dateError.message);
        }
      }
    } catch (error) {
      Logger.log('❌ [CACHE DEBUG] Error reading cache sheet: ' + error.message);
    }
  }

  // TIER 2: Fresh analysis
  Logger.log('📊 [CACHE DEBUG] TIER 2: Attempting fresh holistic analysis');
  Logger.log('⏱️  [CACHE DEBUG] Starting timer...');

  const startTime = new Date().getTime();
  const MAX_TIME = 4 * 60 * 1000; // 4 minutes

  try {
    Logger.log('🔍 [CACHE DEBUG] Calling performHolisticAnalysis_()...');
    const analysis = performHolisticAnalysis_();
    const elapsed = new Date().getTime() - startTime;

    Logger.log('✅ [CACHE DEBUG] Fresh analysis completed in ' + (elapsed / 1000).toFixed(1) + 's');
    Logger.log('🔍 [CACHE DEBUG] Analysis has ' + (analysis.allCases ? analysis.allCases.length : 0) + ' cases');

    if (elapsed < MAX_TIME) {
      Logger.log('✅ [CACHE DEBUG] Analysis within timeout - returning fresh data');
      return analysis;
    } else {
      Logger.log('⚠️  [CACHE DEBUG] Analysis took too long (' + (elapsed/1000).toFixed(1) + 's) - falling back to Tier 3');
    }
  } catch (e) {
    Logger.log('❌ [CACHE DEBUG] Error in performHolisticAnalysis_(): ' + e.message);
    Logger.log('🔍 [CACHE DEBUG] Stack trace: ' + e.stack);
  }

  // TIER 3: Lightweight fallback
  Logger.log('📉 [CACHE DEBUG] TIER 3: Using lightweight fallback');

  const sheet = ss.getSheets().find(function(sh) {
    return /master scenario csv/i.test(sh.getName());
  }) || ss.getActiveSheet();

  Logger.log('🔍 [CACHE DEBUG] Using sheet: ' + sheet.getName());

  const data = sheet.getDataRange().getValues();
  const headers = data[1];

  const caseIdIdx = headers.indexOf('Case_Organization_Case_ID');
  const sparkIdx = headers.indexOf('Case_Organization_Spark_Title');
  const diagnosisIdx = headers.indexOf('Case_Orientation_Chief_Diagnosis');
  const learningIdx = headers.indexOf('Case_Orientation_Actual_Learning_Outcomes');
  const categoryIdx = headers.indexOf('Case_Organization_Category');
  const pathwayIdx = headers.indexOf('Case_Organization_Pathway_or_Course_Name');

  Logger.log('🔍 [CACHE DEBUG] Column indices - ID:' + caseIdIdx + ' Spark:' + sparkIdx + ' Diagnosis:' + diagnosisIdx);

  const allCases = [];
  for (let i = 2; i < data.length; i++) {
    allCases.push({
      caseId: data[i][caseIdIdx] || '',
      sparkTitle: data[i][sparkIdx] || '',
      diagnosis: data[i][diagnosisIdx] || '',
      learningOutcomes: data[i][learningIdx] || '',
      category: data[i][categoryIdx] || '',
      pathway: data[i][pathwayIdx] || ''
    });
  }

  Logger.log('✅ [CACHE DEBUG] Lightweight fallback created ' + allCases.length + ' cases');
  Logger.log('🔍 [CACHE DEBUG] Returning lightweight data');

  return { allCases: allCases };
}
