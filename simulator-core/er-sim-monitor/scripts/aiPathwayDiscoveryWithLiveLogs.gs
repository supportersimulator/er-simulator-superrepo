/**
 * AI PATHWAY DISCOVERY - WITH LIVE LOGGING
 * Shows real-time progress in a modal window
 */

// Global variable to track logs
var AI_DISCOVERY_LOGS = [];

/**
 * Show live logging window
 */
function showAIDiscoveryLiveLog(creativityMode) {
  creativityMode = creativityMode || 'standard';
  AI_DISCOVERY_LOGS = []; // Reset logs

  const modeLabel = creativityMode === 'radical' ? '🔥 RADICAL MODE' : '🤖 STANDARD MODE';

  // Create live log HTML
  const html = '<style>' +
    'body{font-family:monospace;background:#0a0b0e;color:#0f0;padding:20px;margin:0}' +
    '.header{color:#0ff;font-size:18px;font-weight:bold;margin-bottom:20px;border-bottom:2px solid #0ff;padding-bottom:10px}' +
    '.log-container{background:#000;border:1px solid #0f0;padding:15px;border-radius:8px;max-height:500px;overflow-y:auto;font-size:13px}' +
    '.log-line{margin:5px 0;padding:5px;border-left:3px solid #0f0}' +
    '.log-line.info{border-left-color:#0ff;color:#0ff}' +
    '.log-line.success{border-left-color:#0f0;color:#0f0}' +
    '.log-line.warning{border-left-color:#ff0;color:#ff0}' +
    '.log-line.error{border-left-color:#f00;color:#f00}' +
    '.timestamp{color:#666;margin-right:10px}' +
    '</style>' +
    '<div class="header">🤖 AI PATHWAY DISCOVERY - LIVE LOGS (' + modeLabel + ')</div>' +
    '<div class="log-container" id="logs">' +
    '<div class="log-line info"><span class="timestamp">[00:00]</span>Initializing AI discovery...</div>' +
    '</div>' +
    '<script>' +
    'var logIndex = 0;' +
    'function addLog(message, type) {' +
    '  var logs = document.getElementById("logs");' +
    '  var timestamp = new Date().toLocaleTimeString();' +
    '  var line = document.createElement("div");' +
    '  line.className = "log-line " + type;' +
    '  line.innerHTML = "<span class=\\"timestamp\\">[" + timestamp + "]</span>" + message;' +
    '  logs.appendChild(line);' +
    '  logs.scrollTop = logs.scrollHeight;' +
    '}' +
    'function checkForUpdates() {' +
    '  google.script.run' +
    '    .withSuccessHandler(function(logs) {' +
    '      if (logs && logs.length > logIndex) {' +
    '        for (var i = logIndex; i < logs.length; i++) {' +
    '          addLog(logs[i].message, logs[i].type);' +
    '        }' +
    '        logIndex = logs.length;' +
    '      }' +
    '    })' +
    '    .getAIDiscoveryLogs();' +
    '}' +
    'setInterval(checkForUpdates, 500);' + // Poll every 500ms
    '</script>';

  const htmlOutput = HtmlService.createHtmlOutput(html).setWidth(900).setHeight(600);
  SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'AI Pathway Discovery - Live Progress');

  // Start discovery in background
  Utilities.sleep(1000); // Give UI time to render
  discoverNovelPathwaysWithLogging_(creativityMode);
}

/**
 * Get current logs (called by front-end polling)
 */
function getAIDiscoveryLogs() {
  return AI_DISCOVERY_LOGS;
}

/**
 * Add log entry
 */
function logAI_(message, type) {
  type = type || 'info';
  AI_DISCOVERY_LOGS.push({
    message: message,
    type: type,
    timestamp: new Date().toISOString()
  });
  Logger.log('[' + type.toUpperCase() + '] ' + message);
}

/**
 * AI Discovery with live logging
 */
function discoverNovelPathwaysWithLogging_(creativityMode) {
  creativityMode = creativityMode || 'standard';

  logAI_('🚀 Starting AI discovery in ' + creativityMode + ' mode', 'info');

  // Step 1: Get API key
  logAI_('Step 1/6: Retrieving OpenAI API key from Settings!B2', 'info');
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const settingsSheet = ss.getSheetByName('Settings');

  if (!settingsSheet) {
    logAI_('❌ ERROR: Settings sheet not found', 'error');
    return;
  }

  const apiKey = settingsSheet.getRange('B2').getValue();

  if (!apiKey) {
    logAI_('❌ ERROR: No API key found in Settings!B2', 'error');
    return;
  }

  logAI_('✅ API key retrieved: ' + apiKey.substring(0, 10) + '...', 'success');

  // Step 2: Analyze catalog
  logAI_('Step 2/6: Analyzing case catalog...', 'info');
  const analysis = analyzeCatalog_();
  const cases = analysis.allCases;

  logAI_('✅ Found ' + cases.length + ' total cases', 'success');

  // Step 3: Sample cases (to avoid timeout)
  const SAMPLE_SIZE = 50; // Reduce from 210 to 50 for faster processing
  logAI_('Step 3/6: Sampling ' + SAMPLE_SIZE + ' random cases (to avoid timeout)', 'warning');

  const sampledCases = [];
  const usedIndices = {};
  while (sampledCases.length < Math.min(SAMPLE_SIZE, cases.length)) {
    const randomIndex = Math.floor(Math.random() * cases.length);
    if (!usedIndices[randomIndex]) {
      sampledCases.push(cases[randomIndex]);
      usedIndices[randomIndex] = true;
    }
  }

  logAI_('✅ Sampled ' + sampledCases.length + ' cases for AI analysis', 'success');

  const caseSummaries = sampledCases.map(function(c) {
    return {
      id: c.caseId,
      title: c.sparkTitle,
      diagnosis: c.diagnosis || 'Not specified',
      learning: (c.learningOutcomes || 'Not specified').substring(0, 100),
      category: c.category
    };
  });

  // Step 4: Build prompt
  logAI_('Step 4/6: Building AI prompt (' + creativityMode + ' mode)', 'info');

  let temperature = creativityMode === 'radical' ? 1.0 : 0.7;
  let prompt = creativityMode === 'radical'
    ? 'You are Dr. Zara Blackwood. Create 5 RADICALLY CREATIVE pathways. ANALYZE ' + sampledCases.length + ' CASES. Return JSON array with pathway_name, pathway_icon, grouping_logic_type, why_this_matters, learning_outcomes, best_for, unique_value, case_ids, novelty_score (8-10), estimated_learning_time, difficulty_curve, scientific_rationale.'
    : 'You are Dr. Maria Rodriguez. Create 5 CREATIVE pathways. ANALYZE ' + sampledCases.length + ' CASES. Return JSON array with pathway_name, pathway_icon, grouping_logic_type, why_this_matters, learning_outcomes, best_for, unique_value, case_ids, novelty_score (7+), estimated_learning_time, difficulty_curve.';

  logAI_('✅ Prompt built: ' + prompt.length + ' characters', 'success');
  logAI_('⚙️  Temperature: ' + temperature, 'info');

  // Step 5: Call OpenAI
  logAI_('Step 5/6: Calling OpenAI GPT-4 API...', 'info');
  logAI_('⏳ This may take 10-30 seconds. Please wait...', 'warning');

  try {
    const startTime = new Date().getTime();

    const response = UrlFetchApp.fetch('https://api.openai.com/v1/chat/completions', {
      method: 'post',
      headers: {
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: creativityMode === 'radical'
              ? 'You are an experimental medical educator.'
              : 'You are an expert medical educator.'
          },
          {
            role: 'user',
            content: prompt + '\n\nCASES:\n' + JSON.stringify(caseSummaries, null, 2)
          }
        ],
        temperature: temperature,
        max_tokens: 1500 // Reduced from 2500
      }),
      muteHttpExceptions: true
    });

    const elapsedTime = ((new Date().getTime() - startTime) / 1000).toFixed(1);

    const responseCode = response.getResponseCode();
    logAI_('✅ OpenAI responded in ' + elapsedTime + ' seconds', 'success');
    logAI_('📊 Response code: ' + responseCode, 'info');

    if (responseCode !== 200) {
      logAI_('❌ API Error: ' + response.getContentText(), 'error');
      return;
    }

    // Step 6: Parse response
    logAI_('Step 6/6: Parsing AI response...', 'info');

    const data = JSON.parse(response.getContentText());
    const aiResponse = data.choices[0].message.content;

    logAI_('✅ Received ' + aiResponse.length + ' characters from AI', 'success');

    let pathways = [];
    const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      pathways = JSON.parse(jsonMatch[0]);
      logAI_('✅ Successfully parsed ' + pathways.length + ' pathways', 'success');
    } else {
      logAI_('⚠️  No JSON array found, attempting direct parse', 'warning');
      pathways = JSON.parse(aiResponse);
    }

    logAI_('🎉 AI DISCOVERY COMPLETE!', 'success');
    logAI_('📋 Generated ' + pathways.length + ' novel pathway groupings', 'success');

    pathways.forEach(function(pw, idx) {
      logAI_((idx + 1) + '. ' + (pw.pathway_icon || '🤖') + ' ' + (pw.pathway_name || 'Unnamed'), 'info');
    });

    // Show results
    Utilities.sleep(2000); // Let user see completion logs
    showAIPathwayResults_(pathways, creativityMode);

  } catch (e) {
    logAI_('❌ EXCEPTION: ' + e.message, 'error');
    logAI_('Stack: ' + e.stack, 'error');
  }
}

/**
 * Show final results (simplified)
 */
function showAIPathwayResults_(pathways, creativityMode) {
  const modeLabel = creativityMode === 'radical' ? '🔥 RADICAL' : '🤖 CREATIVE';

  let html = '<style>body{font-family:Arial;background:#0a0b0e;color:#fff;padding:24px}.pathway{background:#1a1f2e;padding:20px;margin:15px 0;border-radius:12px;border-left:4px solid ' + (creativityMode === 'radical' ? '#ff6b00' : '#2357ff') + '}.name{font-size:20px;font-weight:bold;margin-bottom:10px}.pitch{color:#ccc;line-height:1.6}</style>';

  html += '<h1>' + modeLabel + ' AI-Discovered Pathways</h1>';
  html += '<p>Found ' + pathways.length + ' novel groupings</p>';

  pathways.forEach(function(pw) {
    html += '<div class="pathway">';
    html += '<div class="name">' + (pw.pathway_icon || '🤖') + ' ' + (pw.pathway_name || 'Unnamed Pathway') + '</div>';
    html += '<div class="pitch">' + (pw.why_this_matters || 'No description') + '</div>';
    html += '</div>';
  });

  const htmlOutput = HtmlService.createHtmlOutput(html).setWidth(800).setHeight(600);
  SpreadsheetApp.getUi().showModalDialog(htmlOutput, modeLabel + ' Pathways');
}

/**
 * Wrapper functions for buttons
 */
function showAIPathwaysStandardWithLogs() {
  showAIDiscoveryLiveLog('standard');
}

function showAIPathwaysRadicalWithLogs() {
  showAIDiscoveryLiveLog('radical');
}
