/**
 * Enhanced AI Discovery Modal with "Copy Debug Logs" button
 * Replace showAIDiscoveryWithStreamingLogs_() function with this version
 */

function showAIDiscoveryWithStreamingLogs_(creativityMode) {
  AI_DISCOVERY_LOGS = []; // Reset

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
    'var allLogs = [];' +  // Store all logs for copying
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
    '  allLogs.push(fullMessage);' +  // Store for copying
    '}' +
    'function updateStatus(text) {' +
    '  document.getElementById("status").textContent = text;' +
    '}' +
    'function copyDebugLogs() {' +
    '  google.script.run' +
    '    .withSuccessHandler(function(debugLogs) {' +
    '      if (!debugLogs || debugLogs.length === 0) {' +
    '        alert("No debug logs found yet. Please wait for execution to complete.");' +
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
    '        alert("Failed to copy. Please manually copy from Apps Script Executions tab.");' +
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
 * NEW: Get debug logs for copy button
 * Extracts only [CACHE DEBUG] logs from Logger
 */
function getDebugLogsForCopy() {
  // Note: Logger.getLog() gets the current execution's logs
  var fullLog = Logger.getLog();

  if (!fullLog) {
    return ['No logs available yet. Execution may still be running.'];
  }

  // Split into lines and filter for [CACHE DEBUG]
  var lines = fullLog.split('\n');
  var debugLines = [];

  for (var i = 0; i < lines.length; i++) {
    if (lines[i].indexOf('[CACHE DEBUG]') !== -1) {
      debugLines.push(lines[i]);
    }
  }

  if (debugLines.length === 0) {
    return ['No [CACHE DEBUG] logs found. May need to check Apps Script Executions tab manually.'];
  }

  return debugLines;
}
