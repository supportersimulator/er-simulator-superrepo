/**
 * Enhanced AI Discovery Modal with "Copy Debug Logs" button
 * This version stores debug logs in a global array for easy access
 */

// Add this at the top level (global scope)
var CACHE_DEBUG_LOGS = [];

function showAIDiscoveryWithStreamingLogs_(creativityMode) {
  AI_DISCOVERY_LOGS = []; // Reset
  CACHE_DEBUG_LOGS = []; // Reset debug logs

  const modeLabel = creativityMode === 'radical' ? '🔥 RADICAL MODE' : '🤖 STANDARD MODE';

  const html = '<style>' +
    'body{font-family:monospace;background:#0a0b0e;color:#0f0;padding:20px;margin:0}' +
    '.header{color:#0ff;font-size:18px;font-weight:bold;margin-bottom:20px;border-bottom:2px solid #0ff;padding-bottom:10px;display:flex;justify-content:space-between;align-items:center}' +
    '.copy-btn{background:linear-gradient(135deg,#ff6b00 0%,#cc5500 100%);border:none;color:#fff;padding:8px 16px;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;transition:all 0.2s ease;box-shadow:0 0 10px rgba(255,107,0,0.3)}' +
    '.copy-btn:hover{box-shadow:0 0 15px rgba(255,107,0,0.5);transform:translateY(-1px)}' +
    '.copy-btn:active{transform:translateY(0)}' +
    '.copy-feedback{color:#0f0;font-size:12px;margin-left:10px;opacity:0;transition:opacity 0.3s ease}' +
    '.copy-feedback.show{opacity:1}' +
    '.log-container{background:#000;border:1px solid #0f0;padding:15px;border-radius:8px;max-height:500px;overflow-y:auto;font-size:13px;line-height:1.6}' +
    '.log-line{margin:5px 0;padding:5px;border-left:3px solid #0f0}' +
    '.log-line.info{border-left-color:#0ff;color:#0ff}' +
    '.log-line.success{border-left-color:#0f0;color:#0f0}' +
    '.log-line.warning{border-left-color:#ff0;color:#ff0}' +
    '.log-line.error{border-left-color:#f00;color:#f00}' +
    '.timestamp{color:#666;margin-right:10px;font-size:11px}' +
    '.status{margin-top:15px;padding:10px;background:#1a1a1a;border-radius:6px;text-align:center;color:#0ff}' +
    '</style>' +
    '<div class="header">' +
    '  <span>🤖 AI PATHWAY DISCOVERY - LIVE LOGS (' + modeLabel + ')</span>' +
    '  <div style="display:flex;align-items:center">' +
    '    <button class="copy-btn" onclick="copyDebugLogs()">📋 Copy Debug Logs</button>' +
    '    <span class="copy-feedback" id="copyFeedback">✅ Copied!</span>' +
    '  </div>' +
    '</div>' +
    '<div class="status" id="status">▶️ Starting discovery...</div>' +
    '<div class="log-container" id="logs"></div>' +
    '<script>' +
    'var mode = "' + creativityMode + '";' +
    'var logIndex = 0;' +
    'var pollInterval = null;' +
    'var startTime = Date.now();' +
    'var allLogs = [];' +
    'function addLog(message, type) {' +
    '  var logs = document.getElementById("logs");' +
    '  var elapsed = Math.floor((Date.now() - startTime) / 1000);' +
    '  var mins = Math.floor(elapsed / 60);' +
    '  var secs = elapsed % 60;' +
    '  var timestamp = mins.toString().padStart(2, "0") + ":" + secs.toString().padStart(2, "0");' +
    '  var line = document.createElement("div");' +
    '  line.className = "log-line " + type;' +
    '  var fullMessage = "[" + timestamp + "] " + message;' +
    '  line.innerHTML = "<span class=\\"timestamp\\">[" + timestamp + "]</span>" + message;' +
    '  logs.appendChild(line);' +
    '  logs.scrollTop = logs.scrollHeight;' +
    '  allLogs.push(fullMessage);' +
    '}' +
    'function updateStatus(text) {' +
    '  document.getElementById("status").textContent = text;' +
    '}' +
    'function copyDebugLogs() {' +
    '  google.script.run' +
    '    .withSuccessHandler(function(debugLogs) {' +
    '      if (!debugLogs || debugLogs.length === 0) {' +
    '        alert("No debug logs found yet. Execution may still be in progress or no [CACHE DEBUG] logs were generated.");' +
    '        return;' +
    '      }' +
    '      var textarea = document.createElement("textarea");' +
    '      textarea.value = debugLogs.join("\\n");' +
    '      textarea.style.position = "fixed";' +
    '      textarea.style.opacity = "0";' +
    '      document.body.appendChild(textarea);' +
    '      textarea.select();' +
    '      try {' +
    '        document.execCommand("copy");' +
    '        var feedback = document.getElementById("copyFeedback");' +
    '        feedback.classList.add("show");' +
    '        setTimeout(function() { feedback.classList.remove("show"); }, 2000);' +
    '      } catch (err) {' +
    '        alert("Copy failed: " + err.message);' +
    '      }' +
    '      document.body.removeChild(textarea);' +
    '    })' +
    '    .withFailureHandler(function(error) {' +
    '      alert("Error getting debug logs: " + error.message);' +
    '    })' +
    '    .getDebugLogsForCopy();' +
    '}' +
    'function pollLogs() {' +
    '  google.script.run' +
    '    .withSuccessHandler(function(result) {' +
    '      if (result.logs && result.logs.length > logIndex) {' +
    '        for (var i = logIndex; i < result.logs.length; i++) {' +
    '          addLog(result.logs[i].message, result.logs[i].type);' +
    '        }' +
    '        logIndex = result.logs.length;' +
    '      }' +
    '      if (result.status) {' +
    '        updateStatus(result.status);' +
    '      }' +
    '      if (result.complete) {' +
    '        clearInterval(pollInterval);' +
    '        updateStatus("✅ Complete! Showing results...");' +
    '        if (result.pathways && result.pathways.length > 0) {' +
    '          setTimeout(function() {' +
    '            google.script.host.close();' +
    '            google.script.run.showAIPathwayResults(result.pathways, mode);' +
    '          }, 2000);' +
    '        }' +
    '      }' +
    '    })' +
    '    .withFailureHandler(function(error) {' +
    '      addLog("❌ ERROR: " + error.message, "error");' +
    '      clearInterval(pollInterval);' +
    '      updateStatus("❌ Failed");' +
    '    })' +
    '    .getAIDiscoveryStatus();' +
    '}' +
    'addLog("🚀 Initializing AI discovery in " + mode + " mode...", "info");' +
    'updateStatus("⏳ Calling OpenAI API...");' +
    'pollInterval = setInterval(pollLogs, 300);' +
    'google.script.run' +
    '  .withSuccessHandler(function() { addLog("✅ Discovery started", "success"); })' +
    '  .withFailureHandler(function(error) { addLog("❌ Start failed: " + error.message, "error"); })' +
    '  .startAIDiscovery(mode);' +
    '</script>';

  const htmlOutput = HtmlService.createHtmlOutput(html).setWidth(900).setHeight(600);
  SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'AI Pathway Discovery - Live Progress');
}

/**
 * NEW: Get debug logs from global array
 */
function getDebugLogsForCopy() {
  if (!CACHE_DEBUG_LOGS || CACHE_DEBUG_LOGS.length === 0) {
    return ['No debug logs captured yet. The diagnostic logging may not have run, or execution is still in progress.'];
  }
  return CACHE_DEBUG_LOGS;
}

/**
 * Modified analyzeCatalog_() to store debug logs in CACHE_DEBUG_LOGS array
 * This replaces the existing version
 */
function analyzeCatalog_() {
  CACHE_DEBUG_LOGS = []; // Reset

  function debugLog(msg) {
    Logger.log(msg);
    CACHE_DEBUG_LOGS.push(msg);
  }

  debugLog('🔍 [CACHE DEBUG] Starting analyzeCatalog_()');

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  debugLog('🔍 [CACHE DEBUG] Got spreadsheet: ' + ss.getName());

  // TIER 1: Try cached analysis first
  debugLog('🔍 [CACHE DEBUG] Looking for Pathway_Analysis_Cache sheet...');
  let cacheSheet = ss.getSheetByName('Pathway_Analysis_Cache');

  if (!cacheSheet) {
    debugLog('❌ [CACHE DEBUG] Cache sheet NOT FOUND - proceeding to Tier 2');
  } else {
    debugLog('✅ [CACHE DEBUG] Cache sheet found!');

    try {
      debugLog('🔍 [CACHE DEBUG] Reading cache data...');
      const data = cacheSheet.getDataRange().getValues();
      debugLog('🔍 [CACHE DEBUG] Cache has ' + data.length + ' rows');

      if (data.length < 2) {
        debugLog('⚠️  [CACHE DEBUG] Cache sheet is empty (only header row)');
      } else {
        debugLog('🔍 [CACHE DEBUG] Cache has data! Reading timestamp...');

        const timestampValue = data[1][0];
        debugLog('🔍 [CACHE DEBUG] Raw timestamp value: ' + timestampValue);
        debugLog('🔍 [CACHE DEBUG] Timestamp type: ' + typeof timestampValue);

        try {
          const cachedTimestamp = new Date(timestampValue);
          debugLog('🔍 [CACHE DEBUG] Parsed timestamp: ' + cachedTimestamp.toString());

          const now = new Date();
          debugLog('🔍 [CACHE DEBUG] Current time: ' + now.toString());

          const hoursDiff = (now - cachedTimestamp) / (1000 * 60 * 60);
          debugLog('🔍 [CACHE DEBUG] Cache age: ' + hoursDiff.toFixed(2) + ' hours');

          if (hoursDiff < 24) {
            debugLog('✅ [CACHE DEBUG] Cache is VALID (< 24 hours) - attempting to parse JSON...');

            const jsonData = data[1][1];
            debugLog('🔍 [CACHE DEBUG] JSON data length: ' + (jsonData ? jsonData.length : 0) + ' characters');

            if (!jsonData) {
              debugLog('❌ [CACHE DEBUG] Cache data is empty! Proceeding to Tier 2');
            } else {
              try {
                debugLog('🔍 [CACHE DEBUG] Attempting JSON.parse()...');
                const parsed = JSON.parse(jsonData);
                debugLog('✅ [CACHE DEBUG] JSON parsed successfully!');
                debugLog('🔍 [CACHE DEBUG] Parsed object keys: ' + Object.keys(parsed).join(', '));

                if (parsed.allCases) {
                  debugLog('✅ [CACHE DEBUG] Found allCases array with ' + parsed.allCases.length + ' cases');
                  debugLog('🎉 [CACHE DEBUG] RETURNING CACHED DATA - SUCCESS!');
                  return parsed;
                } else {
                  debugLog('❌ [CACHE DEBUG] Parsed object has no allCases property!');
                }
              } catch (parseError) {
                debugLog('❌ [CACHE DEBUG] JSON.parse() FAILED: ' + parseError.message);
                debugLog('🔍 [CACHE DEBUG] First 200 chars of JSON: ' + jsonData.substring(0, 200));
              }
            }
          } else {
            debugLog('⚠️  [CACHE DEBUG] Cache is STALE (' + hoursDiff.toFixed(1) + ' hours old) - proceeding to Tier 2');
          }
        } catch (dateError) {
          debugLog('❌ [CACHE DEBUG] Failed to parse timestamp: ' + dateError.message);
        }
      }
    } catch (error) {
      debugLog('❌ [CACHE DEBUG] Error reading cache sheet: ' + error.message);
    }
  }

  // TIER 2: Fresh analysis
  debugLog('📊 [CACHE DEBUG] TIER 2: Attempting fresh holistic analysis');
  debugLog('⏱️  [CACHE DEBUG] Starting timer...');

  const startTime = new Date().getTime();
  const MAX_TIME = 4 * 60 * 1000;

  try {
    debugLog('🔍 [CACHE DEBUG] Calling performHolisticAnalysis_()...');
    const analysis = performHolisticAnalysis_();
    const elapsed = new Date().getTime() - startTime;

    debugLog('✅ [CACHE DEBUG] Fresh analysis completed in ' + (elapsed / 1000).toFixed(1) + 's');
    debugLog('🔍 [CACHE DEBUG] Analysis has ' + (analysis.allCases ? analysis.allCases.length : 0) + ' cases');

    if (elapsed < MAX_TIME) {
      debugLog('✅ [CACHE DEBUG] Analysis within timeout - returning fresh data');
      return analysis;
    } else {
      debugLog('⚠️  [CACHE DEBUG] Analysis took too long - falling back to Tier 3');
    }
  } catch (e) {
    debugLog('❌ [CACHE DEBUG] Error in performHolisticAnalysis_(): ' + e.message);
  }

  // TIER 3: Lightweight fallback
  debugLog('📉 [CACHE DEBUG] TIER 3: Using lightweight fallback');

  const sheet = ss.getSheets().find(function(sh) {
    return /master scenario csv/i.test(sh.getName());
  }) || ss.getActiveSheet();

  debugLog('🔍 [CACHE DEBUG] Using sheet: ' + sheet.getName());

  const data = sheet.getDataRange().getValues();
  const headers = data[1];

  const caseIdIdx = headers.indexOf('Case_Organization_Case_ID');
  const sparkIdx = headers.indexOf('Case_Organization_Spark_Title');
  const diagnosisIdx = headers.indexOf('Case_Orientation_Chief_Diagnosis');
  const learningIdx = headers.indexOf('Case_Orientation_Actual_Learning_Outcomes');
  const categoryIdx = headers.indexOf('Case_Organization_Category');
  const pathwayIdx = headers.indexOf('Case_Organization_Pathway_or_Course_Name');

  debugLog('🔍 [CACHE DEBUG] Column indices - ID:' + caseIdIdx + ' Spark:' + sparkIdx);

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

  debugLog('✅ [CACHE DEBUG] Lightweight fallback created ' + allCases.length + ' cases');
  debugLog('🔍 [CACHE DEBUG] Returning lightweight data');

  return { allCases: allCases };
}
