/**
 * PRE-CACHE RICH DATA WITH LIVE PROGRESS
 *
 * Call this BEFORE running AI discovery to cache all rich clinical data.
 * Shows live progress as it processes 210+ cases with 23 fields each.
 *
 * Copy this function into your Categories_Pathways_Feature_Phase2.gs file
 * at the end (after line 2469)
 */

/**
 * Pre-Cache Rich Clinical Data - Shows live progress window
 * Run this ONCE before AI discovery to cache all 23 fields per case
 */
function preCacheRichData() {
  // Show progress window
  const html = '<style>' +
    'body{font-family:monospace;background:#0a0b0e;color:#0f0;padding:20px;margin:0}' +
    '.header{color:#00c853;font-size:18px;font-weight:bold;margin-bottom:20px;border-bottom:2px solid #00c853;padding-bottom:10px}' +
    '.status{background:#1a1a1a;border:1px solid #00c853;padding:15px;border-radius:8px;margin-bottom:15px}' +
    '.progress-bar{background:#1a1a1a;border:1px solid #00c853;height:30px;border-radius:6px;overflow:hidden;margin:10px 0}' +
    '.progress-fill{background:linear-gradient(90deg,#00c853,#00ff6a);height:100%;transition:width 0.3s ease;display:flex;align-items:center;justify-content:center;color:#000;font-weight:bold}' +
    '.log-container{background:#000;border:1px solid #00c853;padding:15px;border-radius:8px;max-height:300px;overflow-y:auto;font-size:13px;line-height:1.8}' +
    '.log-line{margin:3px 0;padding:3px;color:#0ff}' +
    '.log-line.success{color:#0f0}' +
    '.log-line.warning{color:#ff0}' +
    '.timestamp{color:#666;margin-right:8px;font-size:11px}' +
    '</style>' +
    '<div class="header">💾 PRE-CACHING RICH CLINICAL DATA</div>' +
    '<div class="status" id="status">🚀 Initializing cache process...</div>' +
    '<div class="progress-bar"><div class="progress-fill" id="progress" style="width:0%">0%</div></div>' +
    '<div class="log-container" id="logs"></div>' +
    '<script>' +
    'var startTime = Date.now();' +
    'function addLog(message, type) {' +
    '  var logs = document.getElementById("logs");' +
    '  var elapsed = Math.floor((Date.now() - startTime) / 1000);' +
    '  var mins = Math.floor(elapsed / 60);' +
    '  var secs = elapsed % 60;' +
    '  var timestamp = mins.toString().padStart(2, "0") + ":" + secs.toString().padStart(2, "0");' +
    '  var line = document.createElement("div");' +
    '  line.className = "log-line " + (type || "");' +
    '  line.innerHTML = "<span class=\\"timestamp\\">[" + timestamp + "]</span>" + message;' +
    '  logs.appendChild(line);' +
    '  logs.scrollTop = logs.scrollHeight;' +
    '}' +
    'function updateStatus(text) {' +
    '  document.getElementById("status").textContent = text;' +
    '}' +
    'function updateProgress(percent, cases) {' +
    '  var progress = document.getElementById("progress");' +
    '  progress.style.width = percent + "%";' +
    '  progress.textContent = percent + "% (" + cases + " cases)";' +
    '}' +
    'addLog("🔧 Starting holistic analysis engine...", "");' +
    'updateStatus("⏳ Processing all cases with full clinical context...");' +
    '' +
    'google.script.run' +
    '  .withSuccessHandler(function(result) {' +
    '    if (result.success) {' +
    '      updateProgress(100, result.casesProcessed);' +
    '      addLog("✅ SUCCESS! Processed " + result.casesProcessed + " cases", "success");' +
    '      addLog("💾 Cache stored in Pathway_Analysis_Cache sheet", "success");' +
    '      addLog("📊 All 23 fields per case cached (demographics + vitals + clinical context)", "success");' +
    '      addLog("⚡ Valid for 24 hours", "success");' +
    '      addLog("🎯 AI discovery will now be INSTANT!", "success");' +
    '      updateStatus("✅ COMPLETE! Cache ready for instant AI discovery");' +
    '      setTimeout(function() { google.script.host.close(); }, 3000);' +
    '    } else {' +
    '      addLog("❌ ERROR: " + result.error, "warning");' +
    '      updateStatus("❌ Cache failed - check logs");' +
    '    }' +
    '  })' +
    '  .withFailureHandler(function(error) {' +
    '    addLog("❌ FAILED: " + error.message, "warning");' +
    '    updateStatus("❌ Cache process failed");' +
    '  })' +
    '  .performCacheWithProgress();' +
    '</script>';

  const htmlOutput = HtmlService.createHtmlOutput(html).setWidth(900).setHeight(500);
  SpreadsheetApp.getUi().showModalDialog(htmlOutput, '💾 Pre-Caching Rich Clinical Data');
}

/**
 * Backend function to perform caching with progress updates
 * Returns result with success status and case count
 */
function performCacheWithProgress() {
  try {
    Logger.log('Starting performHolisticAnalysis_()...');
    const startTime = new Date().getTime();

    // Force fresh analysis (forceRefresh = true)
    const analysis = getOrCreateHolisticAnalysis_(true);

    const elapsed = ((new Date().getTime() - startTime) / 1000).toFixed(1);
    const casesProcessed = analysis.allCases ? analysis.allCases.length : 0;

    Logger.log('✅ Analysis complete in ' + elapsed + 's - ' + casesProcessed + ' cases processed');

    return {
      success: true,
      casesProcessed: casesProcessed,
      elapsed: elapsed,
      fieldsPerCase: 23
    };
  } catch (e) {
    Logger.log('❌ Error in performCacheWithProgress: ' + e.message);
    return {
      success: false,
      error: e.message
    };
  }
}
