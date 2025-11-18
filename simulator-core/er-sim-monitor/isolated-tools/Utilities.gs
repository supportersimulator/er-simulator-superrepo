/**
 * Utilities Module
 *
 * Isolated single-purpose module containing 67 functions
 * for utilities
 *
 * Generated: 2025-11-04T18:29:36.065Z
 * Source: Code_ULTIMATE_ATSR.gs (monolithic, preserved in Legacy Code)
 */

/**
 * Dependencies:
 * - Utilities.gs
 */

/**
 * Extracts a value from AI JSON output, tolerant of tiered keys.
 * Handles formats like "Tier1:Tier2" or just "Tier2".
 */
function extractValueFromParsed_(parsed, mergedKey) {
  if (!parsed || typeof parsed !== 'object') return 'N/A';

  // Try exact full key match
  if (parsed.hasOwnProperty(mergedKey)) return parsed[mergedKey];

  // Try after colon (Tier 2 only)
  const parts = mergedKey.split(':');
  const shortKey = parts[1] || parts[0];
  if (parsed.hasOwnProperty(shortKey)) return parsed[shortKey];

  // Try case-insensitive match
  const lowerKey = shortKey.toLowerCase();
  for (const k in parsed) {
    if (k.toLowerCase() === lowerKey) return parsed[k];
  }

  // Try to find nested objects like { "Case_Organization": { "Spark_Title": "..." } }
  if (parts.length === 2 && parsed[parts[0]] && typeof parsed[parts[0]] === 'object') {
    const nested = parsed[parts[0]][parts[1]];
    if (nested !== undefined) return nested;
  }

  // If all else fails, return N/A
  return 'N/A';
}

function syncApiKeyFromSettingsSheet_() {
  const ss = SpreadsheetApp.getActive();
  const sheet = ss.getSheetByName('Settings');
  if (!sheet) return null;

  try {
    const range = sheet.getDataRange().getValues();
    // Try KV pairs
    for (let r=0; r<range.length; r++) {
      const k = String(range[r][0]||'').trim().toUpperCase();
      const v = String(range[r][1]||'').trim();
      if (k === 'OPENAI_API_KEY' && v) {
        Logger.log('✅ Found OPENAI_API_KEY in Settings sheet');
        return v;
      }
    }
    // Fallback: B2 if row2 has "API Key" label
    const labelB2 = String(sheet.getRange(2,1).getValue()||'').toLowerCase();
    if (labelB2.includes('api')) {
      const apiKey = String(sheet.getRange(2,2).getValue()||'').trim();
      if (apiKey) {
        Logger.log('✅ Found API key in Settings!B2');
        return apiKey;
      }
    }
  } catch(e) {
    Logger.log('⚠️ Error reading Settings sheet: ' + e.message);
  }
  return null;
}

function readApiKey_() {
  // DELETE the cached key to force fresh read
  try {
    PropertiesService.getDocumentProperties().deleteProperty('OPENAI_API_KEY');
    Logger.log('🗑️ Deleted cached API key');
  } catch (e) {
    Logger.log('⚠️ Could not delete cache: ' + e.message);
  }

  // Read fresh from Settings sheet
  const fromSheet = syncApiKeyFromSettingsSheet_();
  if (fromSheet) {
    Logger.log('✅ Read fresh API key from Settings sheet');
    // DON'T cache it - keep reading fresh
    return fromSheet;
  }

  Logger.log('❌ No API key found in Settings sheet');
  return '';
}

function checkApiStatus() {
  try {
    const out = callOpenAI('Reply exactly with "OK".', 0.0);
    const ok = /^OK$/i.test(out.trim());
    if (getSafeUi_()) { getSafeUi_().alert(ok ? '🛡️ API is reachable.' : '⚠️ API replied unexpectedly: ' + out); }
  } catch (e) {
    if (getSafeUi_()) { getSafeUi_().alert('❌ API error: ' + e.message); }
  }
}

function readTwoTierHeaders_(sheet) {
  const header1 = sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0];
  const header2 = sheet.getRange(2,1,1,sheet.getLastColumn()).getValues()[0];
  return { header1, header2 };
}

function mergedKeysFromTwoTiers_(header1, header2) {
  return header1.map((t1,i)=>`${t1}:${header2[i]}`);
}

function cacheHeaders(sheet) {
  const {header1, header2} = readTwoTierHeaders_(sheet);
  setProp(SP_KEYS.HEADER_CACHE, JSON.stringify({header1, header2}));
}

function getCachedHeadersOrRead(sheet) {
  let cached = getProp(SP_KEYS.HEADER_CACHE, '');
  if (cached) try { return JSON.parse(cached); } catch(_){}
  const hh = readTwoTierHeaders_(sheet);
  setProp(SP_KEYS.HEADER_CACHE, JSON.stringify(hh));
  return hh;
}

function clearHeaderCache() {
  PropertiesService.getDocumentProperties().deleteProperty(SP_KEYS.HEADER_CACHE);
  SpreadsheetApp.getActive().toast('🧹 Header cache cleared.');
}

function ensureBatchReportsSheet_() {
  const ss = SpreadsheetApp.getActive();
  let s = ss.getSheetByName('Batch_Reports');
  if (!s) s = ss.insertSheet('Batch_Reports');
  // minimal header
  if (s.getLastRow() === 0) {
    s.appendRow(['Timestamp','Mode','Created','Skipped','Duplicates','Errors','Estimated Cost (USD)','Elapsed']);
  }
  return s;
}

function openSimSidebar() {
  const ss = SpreadsheetApp.getActive();
  const allSheets = ss.getSheets().map(s=>s.getName());

  // ⭐ Auto-refresh: ensure Settings!A1 points to a valid Convert sheet
  try {
    const settingsSheet = ss.getSheetByName('Settings');
    const storedOut = settingsSheet ? settingsSheet.getRange('A1').getValue() : '';
    const exists = allSheets.includes(storedOut);
    if (!exists && allSheets.length) {
      const fallback = allSheets.find(n => /convert/i.test(n))
                  || allSheets.find(n => /master scenario csv/i.test(n))
                  || allSheets[0];
      if (settingsSheet) settingsSheet.getRange('A1').setValue(fallback);
    }
  } catch(err) {
    Logger.log('Settings auto-refresh error: ' + err);
  }

  const lastInput  = getProp(SP_KEYS.LAST_INPUT_SHEET, '');
  const lastOutput = getProp(SP_KEYS.LAST_OUTPUT_SHEET, '');
  const savedModel = getProp(SP_KEYS.MODEL, DEFAULT_MODEL);
  const savedApi   = getProp(SP_KEYS.API_KEY, '');

  // ⭐ Dynamic output preference from Settings!A1
  const settingsSheet = ss.getSheetByName('Settings');
  const settingsOut = settingsSheet ? settingsSheet.getRange('A1').getValue() : '';

  // Input = any with "input"; Output = only those with "convert"
  const inputCandidates = allSheets.filter(n => /input/i.test(n));
  const outputCandidates = allSheets.filter(n => /convert/i.test(n));

  // Defaults
  const defaultIn = inputCandidates.includes(lastInput)
    ? lastInput
    : (inputCandidates[0] || allSheets[0]);

  const defaultOut =
    outputCandidates.includes(settingsOut) ? settingsOut :
    outputCandidates.includes(lastOutput) ? lastOutput :
    (outputCandidates[0] || allSheets[0]);

  const modelList = ['gpt-4o-mini','gpt-4o','o4-mini','o3-mini'];
  const modelOptions = modelList.map(m=>`<option value="${m}" ${m===savedModel?'selected':''}>${m}</option>`).join('');
  const inOpts  = inputCandidates.map(n=>`<option value="${n}" ${n===defaultIn?'selected':''}>${n}</option>`).join('');
  const outOpts = outputCandidates.map(n=>`<option value="${n}" ${n===defaultOut?'selected':''}>${n}</option>`).join('');

  const html = HtmlService.createHtmlOutput(`
  <style>
    body{font-family:Arial;margin:0;background:#f5f7fa;color:#2c3e50}
    .bar{padding:14px 16px;background:#1b1f2a;border-bottom:1px solid #dfe3e8}
    h2{margin:0;font-size:16px;letter-spacing:.3px}
    .wrap{padding:16px}
    .card{background:#ffffff;border:1px solid #dfe3e8;border-radius:10px;padding:14px;margin-bottom:12px}
    label{font-size:12px;color:#9aa3b2}
    select,input,textarea{width:100%;background:#f5f7fa;border:1px solid #30384b;color:#2c3e50;border-radius:8px;padding:8px}
    .row{display:flex;gap:10px}
    .col{flex:1}
    button{background:#2357ff;border:0;color:#fff;padding:10px 12px;border-radius:8px;cursor:pointer}
    button.sec{background:#dfe3e8}
    .pill{display:inline-block;background:#dfe3e8;padding:6px 8px;border-radius:999px;font-size:12px}
    .hint{color:#9aa3b2;font-size:12px}
    .grid2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
    .log{height:180px}
  </style>

  <div class="bar"><h2>${ICONS.rocket} Sim Mastery — Batch & Single</h2></div>
  <div class="wrap">
    <div class="card">
      <div class="grid2">
        <div>
          <label>Input Sheet</label>
          <select id="inputSheet">${inOpts}</select>
        </div>
        <div>
          <label>Output Sheet</label>
          <select id="outputSheet">${outOpts}</select>
        </div>
      </div>
      <div class="grid2" style="margin-top:10px;">
        <div>
          <label>Model</label>
          <select id="model">${modelOptions}</select>
        </div>
        <div>
          <label>API Key</label>
          <input id="apiKey" type="password" value="${savedApi ? '••••••••' : ''}" placeholder="sk-..." />
        </div>
      </div>
    </div>

    <div class="card">
      <div class="row">
        <div class="col">
          <label>Run mode</label>
          <select id="runMode">
            <option value="one">Single Case</option>
            <option value="next25">Next 25 unprocessed</option>
            <option value="specific">Specific (e.g. 4,7,9-12)</option>
            <option value="all">All rows</option>
          </select>
        </div>
        <div class="col">
          <label>Specific rows</label>
          <input id="rowsSpec" placeholder="4,7,9-12" />
        </div>
      </div>
      <div style="margin-top:10px;">
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer;">
          <input type="checkbox" id="forceReprocess" style="width:auto;" />
          <span style="color:#ff6b6b;">🔄 Force Reprocess (ignore duplicates)</span>
        </label>
        <div class="hint" style="margin-top:4px;">
          ⚠️ When enabled, will regenerate cases even if they already exist in output
        </div>
      </div>
    </div>

        <div class="card">
      <div class="row">
        <button onclick="start()">🚀 Launch Batch Engine</button>
        <button class="sec" onclick="stop()">⏹️ Stop</button>
        <button class="sec" onclick="check()">🛡️ Check API</button>
      </div>
      <div style="margin-top:10px;">
        <span class="pill" id="statusPill">Idle</span>
      </div>
      <div style="margin-top:10px;">
        <textarea id="log" class="log" placeholder="Live log..." readonly></textarea>
      </div>
    </div>

    <div class="card">
      <div class="row" style="justify-content: space-between;">
        <button class="sec" onclick="imgSync()">🖼️ Image Sync Defaults</button>
        <button class="sec" onclick="openSettings()">⚙️ Settings</button>
      </div>
      <div class="hint" style="margin-top:8px;">
        💡 Use “Run mode” to choose between Single Case, First 25, or All Rows.  
        Then click <strong>Launch Batch Engine</strong>.
      </div>
    </div>
  </div>
    <!-- 🪵 Live Logs Panel (NEW) -->
    <div class="card" style="margin-top:12px;">
      <div class="row" style="justify-content: space-between; align-items:center;">
        <strong style="color:#ff82a9;">🪵 Live Logs</strong>
        <div>
          <button id="copyLogsBtn" class="log-btn copy">Copy Logs</button>
          <button id="refreshLogsBtn" class="log-btn">Refresh</button>
          <button id="clearLogsBtn" class="log-btn danger">Clear</button>
        </div>
      </div>
      <pre id="logOutput" class="log-output">No logs yet.</pre>
    </div>

    <style>
      .log-btn {
        background: #1a1a1a;
        color: #0f0;
        border: 1px solid #0f0;
        padding: 2px 8px;
        margin-left: 4px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 11px;
        transition: all 0.2s ease;
      }
      .log-btn:hover {
        background: #0f0;
        color: #000;
      }
      .log-btn.copy {
        color: #58a6ff;
        border-color: #58a6ff;
      }
      .log-btn.copy:hover {
        background: #58a6ff;
        color: #000;
      }
      .log-btn.danger {
        color: #f55;
        border-color: #f55;
      }
      .log-btn.danger:hover {
        background: #f55;
        color: #000;
      }
      .log-output {
        white-space: pre-wrap;
        background: #000;
        color: #0f0;
        padding: 8px;
        border-radius: 6px;
        margin-top: 4px;
        max-height: 300px;
        overflow-y: auto;
        border: 1px solid #222;
      }
      .new-log-line {
        animation: fadeInNew 0.6s ease-out;
      }
      @keyframes fadeInNew {
        from { color: #9aff9a; background-color: rgba(0,255,0,0.05); }
        to { color: #0f0; background-color: transparent; }
      }
    </style>

    <script>
      // === LOG VIEWER HANDLERS ===
      let lastLogs = '';

      function refreshLogs() {
        google.script.run
          .withSuccessHandler((logs) => {
            const output = document.getElementById('logOutput');
            if (logs && logs !== lastLogs) {
              const diff = logs.replace(lastLogs, '').trim();
              if (diff) {
                const newLine = document.createElement('div');
                newLine.textContent = diff;
                newLine.classList.add('new-log-line');
                output.appendChild(newLine);
              } else {
                output.textContent = logs;
              }
              output.scrollTop = output.scrollHeight;
              lastLogs = logs;
            }
            if (!logs) output.textContent = 'No logs yet.';
          })
          .getSidebarLogs();
      }

      function clearLogs() {
        google.script.run
          .withSuccessHandler((msg) => {
            document.getElementById('logOutput').textContent = msg;
            lastLogs = '';
          })
          .clearSidebarLogs();
      }

      function copyLogs() {
        const logText = document.getElementById('logOutput').textContent;
        if (!logText || logText === 'No logs yet.') {
          alert('No logs to copy!');
          return;
        }

        // Copy to clipboard
        navigator.clipboard.writeText(logText).then(() => {
          const btn = document.getElementById('copyLogsBtn');
          const originalText = btn.textContent;
          btn.textContent = '✓ Copied!';
          btn.style.color = '#0f0';
          btn.style.borderColor = '#0f0';
          setTimeout(() => {
            btn.textContent = originalText;
            btn.style.color = '#58a6ff';
            btn.style.borderColor = '#58a6ff';
          }, 2000);
        }).catch(err => {
          alert('Failed to copy logs: ' + err);
        });
      }

      document.getElementById('copyLogsBtn').addEventListener('click', copyLogs);
      document.getElementById('refreshLogsBtn').addEventListener('click', refreshLogs);
      document.getElementById('clearLogsBtn').addEventListener('click', clearLogs);

      // Auto-refresh every 5 seconds
      setInterval(refreshLogs, 5000);
    </script>
  <script>
    document.addEventListener('DOMContentLoaded', () => {
      console.log('✅ Sidebar loaded');
    });

    function appendLog(t){ const ta=document.getElementById('log'); ta.value += t + "\\n"; ta.scrollTop = ta.scrollHeight; }
    function setStatus(s){ document.getElementById('statusPill').textContent = s; }

    function persistBasics(){
      const apiRaw = document.getElementById('apiKey').value.trim();
      const outVal = document.getElementById('outputSheet').value;
      google.script.run.saveSidebarBasics(
        document.getElementById('model').value,
        (apiRaw && apiRaw!=='••••••••') ? apiRaw : '',
        '', '',
        document.getElementById('inputSheet').value,
        outVal
      );
      google.script.run.setOutputSheet(outVal);
    }

    function loopStep(){
      // Get next row number from queue
      google.script.run
          .withSuccessHandler(function(report){
            if (report.done){
              setStatus('✅ Complete');
              appendLog(report.msg || '✅ Batch complete!');
              return;
            }

            // ⭐ Call the EXACT same function single mode uses!
            appendLog('📊 Processing row ' + report.row + ' (' + report.remaining + ' remaining)...');

            google.script.run
              .withSuccessHandler(function(result){
                appendLog('✅ Row ' + report.row + ' complete');
                setTimeout(loopStep, 1500); // Next row after 1.5s
              })
              .withFailureHandler(function(e){
                const errorMsg = e && e.message ? e.message : (e ? String(e) : 'Unknown error');
                appendLog('❌ Row ' + report.row + ' error: ' + errorMsg);
                setTimeout(loopStep, 1500); // Continue despite error
              })
              .runSingleCaseFromSidebar(report.inputSheetName, report.outputSheetName, report.row);
          })
          .withFailureHandler(function(e){
            const errorMsg = e && e.message ? e.message : (e ? String(e) : 'Unknown error');
            appendLog('❌ Batch error: ' + errorMsg);
            setStatus('Error');
          })
          .runSingleStepBatch();
    }
    function start(){
  persistBasics();
  setStatus('Running...');
  const mode = document.getElementById('runMode').value;
  const spec = document.getElementById('rowsSpec').value.trim();
  const inputSheet = document.getElementById('inputSheet').value;
  const outputSheet = document.getElementById('outputSheet').value;
  const forceReprocess = document.getElementById('forceReprocess').checked;

  // Log if force reprocess is enabled
  if (forceReprocess) {
    appendLog('⚠️ Force Reprocess enabled - will ignore duplicates');
  }

  // Store force flag in properties for processOneInputRow_ to access
  google.script.run.setProp('FORCE_REPROCESS', forceReprocess ? '1' : '0');

  // Handle single-case mode directly
  if (mode === 'one' || mode === 'single' || mode === 'Single Case') {
    const rowNum = parseInt(spec || prompt('Enter row number to process (>=4):'), 10);
    if (!rowNum) {
      appendLog('⚠️ No row selected, cancelling.');
      setStatus('Idle');
      return;
    }

    google.script.run
      .withSuccessHandler(m => {
        appendLog(m || '✅ Done.');
        setStatus('Idle');
        if (m && m.includes('Error')) alert(m);
      })
      .withFailureHandler(e => {
        appendLog('❌ Single-case error: ' + e.message);
        alert('❌ Single-case error: ' + e.message);
        setStatus('Idle');
      })
      .runSingleCaseFromSidebar(inputSheet, outputSheet, rowNum);

    return; // stop here, no batch loop
  }

  // Otherwise run normal batch flow
  google.script.run
    .withSuccessHandler(msg => {
      appendLog(msg || '✅ Batch started.');
      loopStep(); // begin step loop
    })
    .withFailureHandler(e => {
      appendLog('❌ Batch start error: ' + e.message);
      setStatus('Idle');
    })
    .startBatchFromSidebar(inputSheet, outputSheet, mode, spec);
}

function stop(){
  google.script.run.stopBatch();
  setStatus('Stopping...');
  appendLog('Stop requested.');
}

function imgSync(){ google.script.run.openImageSyncDefaults(); }
function openSettings(){ google.script.run.openSettingsPanel(); }
function check(){ google.script.run.checkApiStatus(); }
  </script>
  `)
  .setWidth(540)
  .setHeight(720)
  .setSandboxMode(HtmlService.SandboxMode.IFRAME);

  getSafeUi_().showSidebar(html);
}

function refreshLogs() {
        google.script.run
          .withSuccessHandler((logs) => {
            const output = document.getElementById('logOutput');
            if (logs && logs !== lastLogs) {
              const diff = logs.replace(lastLogs, '').trim();
              if (diff) {
                const newLine = document.createElement('div');
                newLine.textContent = diff;
                newLine.classList.add('new-log-line');
                output.appendChild(newLine);
              } else {
                output.textContent = logs;
              }
              output.scrollTop = output.scrollHeight;
              lastLogs = logs;
            }
            if (!logs) output.textContent = 'No logs yet.';
          })
          .getSidebarLogs();
      }

function clearLogs() {
        google.script.run
          .withSuccessHandler((msg) => {
            document.getElementById('logOutput').textContent = msg;
            lastLogs = '';
          })
          .clearSidebarLogs();
      }

function copyLogs() {
        const logText = document.getElementById('logOutput').textContent;
        if (!logText || logText === 'No logs yet.') {
          alert('No logs to copy!');
          return;
        }

        // Copy to clipboard
        navigator.clipboard.writeText(logText).then(() => {
          const btn = document.getElementById('copyLogsBtn');
          const originalText = btn.textContent;
          btn.textContent = '✓ Copied!';
          btn.style.color = '#0f0';
          btn.style.borderColor = '#0f0';
          setTimeout(() => {
            btn.textContent = originalText;
            btn.style.color = '#58a6ff';
            btn.style.borderColor = '#58a6ff';
          }, 2000);
        }).catch(err => {
          alert('Failed to copy logs: ' + err);
        });
      }

function appendLog(t){ const ta=document.getElementById('log'); ta.value += t + "\\n"; ta.scrollTop = ta.scrollHeight; }

function setStatus(s){ document.getElementById('statusPill').textContent = s; }

function persistBasics(){
      const apiRaw = document.getElementById('apiKey').value.trim();
      const outVal = document.getElementById('outputSheet').value;
      google.script.run.saveSidebarBasics(
        document.getElementById('model').value,
        (apiRaw && apiRaw!=='••••••••') ? apiRaw : '',
        '', '',
        document.getElementById('inputSheet').value,
        outVal
      );
      google.script.run.setOutputSheet(outVal);
    }

function loopStep(){
      // Get next row number from queue
      google.script.run
          .withSuccessHandler(function(report){
            if (report.done){
              setStatus('✅ Complete');
              appendLog(report.msg || '✅ Batch complete!');
              return;
            }

            // ⭐ Call the EXACT same function single mode uses!
            appendLog('📊 Processing row ' + report.row + ' (' + report.remaining + ' remaining)...');

            google.script.run
              .withSuccessHandler(function(result){
                appendLog('✅ Row ' + report.row + ' complete');
                setTimeout(loopStep, 1500); // Next row after 1.5s
              })
              .withFailureHandler(function(e){
                const errorMsg = e && e.message ? e.message : (e ? String(e) : 'Unknown error');
                appendLog('❌ Row ' + report.row + ' error: ' + errorMsg);
                setTimeout(loopStep, 1500); // Continue despite error
              })
              .runSingleCaseFromSidebar(report.inputSheetName, report.outputSheetName, report.row);
          })
          .withFailureHandler(function(e){
            const errorMsg = e && e.message ? e.message : (e ? String(e) : 'Unknown error');
            appendLog('❌ Batch error: ' + errorMsg);
            setStatus('Error');
          })
          .runSingleStepBatch();
    }

function start(){
  persistBasics();
  setStatus('Running...');
  const mode = document.getElementById('runMode').value;
  const spec = document.getElementById('rowsSpec').value.trim();
  const inputSheet = document.getElementById('inputSheet').value;
  const outputSheet = document.getElementById('outputSheet').value;
  const forceReprocess = document.getElementById('forceReprocess').checked;

  // Log if force reprocess is enabled
  if (forceReprocess) {
    appendLog('⚠️ Force Reprocess enabled - will ignore duplicates');
  }

  // Store force flag in properties for processOneInputRow_ to access
  google.script.run.setProp('FORCE_REPROCESS', forceReprocess ? '1' : '0');

  // Handle single-case mode directly
  if (mode === 'one' || mode === 'single' || mode === 'Single Case') {
    const rowNum = parseInt(spec || prompt('Enter row number to process (>=4):'), 10);
    if (!rowNum) {
      appendLog('⚠️ No row selected, cancelling.');
      setStatus('Idle');
      return;
    }

    google.script.run
      .withSuccessHandler(m => {
        appendLog(m || '✅ Done.');
        setStatus('Idle');
        if (m && m.includes('Error')) alert(m);
      })
      .withFailureHandler(e => {
        appendLog('❌ Single-case error: ' + e.message);
        alert('❌ Single-case error: ' + e.message);
        setStatus('Idle');
      })
      .runSingleCaseFromSidebar(inputSheet, outputSheet, rowNum);

    return; // stop here, no batch loop
  }

  // Otherwise run normal batch flow
  google.script.run
    .withSuccessHandler(msg => {
      appendLog(msg || '✅ Batch started.');
      loopStep(); // begin step loop
    })
    .withFailureHandler(e => {
      appendLog('❌ Batch start error: ' + e.message);
      setStatus('Idle');
    })
    .startBatchFromSidebar(inputSheet, outputSheet, mode, spec);
}

function stop(){
  google.script.run.stopBatch();
  setStatus('Stopping...');
  appendLog('Stop requested.');
}

function imgSync(){ google.script.run.openImageSyncDefaults(); }

function openSettings(){ google.script.run.openSettingsPanel(); }

function check(){ google.script.run.checkApiStatus(); }

function saveSidebarBasics(model, apiKeyMaybe, priceIn, priceOut, inputSheet, outputSheet) {
  if (model) setProp(SP_KEYS.MODEL, model);
  if (apiKeyMaybe) setProp(SP_KEYS.API_KEY, apiKeyMaybe);
  if (inputSheet) setProp(SP_KEYS.LAST_INPUT_SHEET, inputSheet);
  if (outputSheet) {
    setProp(SP_KEYS.LAST_OUTPUT_SHEET, outputSheet);
    setOutputSheet(outputSheet);
  }
}

function logLong(label, text) {
  try {
    const chunkSize = 8000; // safe for Apps Script logs
    if (!text) {
      appendLogSafe(`(no text to log for ${label})`);
      return;
    }
    for (let i = 0; i < text.length; i += chunkSize) {
      const chunk = text.substring(i, i + chunkSize);
      appendLogSafe(`${label} [${i / chunkSize + 1}]:\n${chunk}`);
    }
  } catch (err) {
    appendLogSafe(`logLong error: ${err}`);
  }
}

function logLong(label, text) {
  try {
    const chunkSize = 8000; // safe for Apps Script logs
    if (!text) {
      appendLogSafe(`(no text to log for ${label})`);
      return;
    }
    for (let i = 0; i < text.length; i += chunkSize) {
      const chunk = text.substring(i, i + chunkSize);
      appendLogSafe(`${label} [${i / chunkSize + 1}]:\n${chunk}`);
    }
  } catch (err) {
    appendLogSafe(`logLong error: ${err}`);
  }
}

function getSidebarLogs() {
  try {
    const logs = PropertiesService.getDocumentProperties().getProperty('Sidebar_Logs') || '';
    return logs;
  } catch (err) {
    return 'Error retrieving logs: ' + err;
  }
}

function clearSidebarLogs() {
  try {
    PropertiesService.getDocumentProperties().deleteProperty('Sidebar_Logs');
    return '🧹 Logs cleared.';
  } catch (err) {
    return 'Error clearing logs: ' + err;
  }
}

function setOutputSheet(sheetName) {
  const s = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Settings');
  if (!s) throw new Error('Settings sheet not found.');
  s.getRange('A1').setValue(sheetName);
}

function stopBatch() { setProp('BATCH_STOP','1'); }

function parseRowSpec_(spec) {
  const out = new Set();
  if (!spec) return [];
  spec.split(',').map(s=>s.trim()).forEach(token=>{
    if (/^\d+$/.test(token)) out.add(parseInt(token,10));
    else if (/^\d+\-\d+$/.test(token)) {
      const [a,b] = token.split('-').map(n=>parseInt(n,10));
      const lo = Math.min(a,b), hi = Math.max(a,b);
      for (let r=lo; r<=hi; r++) out.add(r);
    }
  });
  return Array.from(out).sort((a,b)=>a-b);
}

function getNext25InputRows_(inputSheet, outputSheet) {
  appendLogSafe('🔍 Starting robust row detection (Case_ID comparison method)...');

  const inputLast = inputSheet.getLastRow();
  const outputLast = outputSheet.getLastRow();

  appendLogSafe(`📊 Input sheet last row: ${inputLast}`);
  appendLogSafe(`📊 Output sheet last row: ${outputLast}`);

  // Read all Case_IDs from Output sheet (Column A, rows 3+)
  const processedCaseIds = new Set();
  if (outputLast >= 3) {
    const outputCaseIds = outputSheet.getRange(3, 1, outputLast - 2, 1).getValues();
    outputCaseIds.forEach(row => {
      const caseId = String(row[0] || '').trim();
      if (caseId) {
        processedCaseIds.add(caseId);
      }
    });
  }

  appendLogSafe(`✅ Found ${processedCaseIds.size} processed Case_IDs in Output`);

  // IMPORTANT: Input sheet structure
  // Row 1: Tier 1 headers
  // Row 2: Tier 2 headers
  // Row 3+: Data
  //
  // The Input sheet does NOT have Case_ID pre-filled.
  // Case_ID is GENERATED during processing.
  //
  // Strategy: Since we can't predict Case_ID from Input data,
  // we use row position correlation:
  // - Input row 3 → Output row 3 (first data row)
  // - Input row 4 → Output row 4 (second data row)
  // - etc.
  //
  // If Output has N data rows (rows 3 through 3+N-1),
  // then Input rows 3 through 3+N-1 have been processed.
  // Next unprocessed Input row = 3 + N

  const outputDataRows = Math.max(0, outputLast - 2);
  const nextInputRow = 3 + outputDataRows;

  appendLogSafe(`📊 Output has ${outputDataRows} data rows`);
  appendLogSafe(`📊 Next unprocessed Input row: ${nextInputRow}`);

  // Build array of next 25 rows to process
  const availableRows = [];
  for (let r = nextInputRow; r <= inputLast && availableRows.length < 25; r++) {
    availableRows.push(r);
  }

  appendLogSafe(`✅ Found ${availableRows.length} unprocessed rows`);
  if (availableRows.length > 0) {
    appendLogSafe(`📋 Rows to process: [${availableRows.slice(0, 5).join(', ')}${availableRows.length > 5 ? '...' : ''}]`);
  }

  return availableRows;
}

function getAllInputRows_(inputSheet, outputSheet) {
  appendLogSafe('🔍 Starting detection for ALL remaining rows...');

  const inputLast = inputSheet.getLastRow();
  const outputLast = outputSheet.getLastRow();

  appendLogSafe(`📊 Input sheet last row: ${inputLast}`);
  appendLogSafe(`📊 Output sheet last row: ${outputLast}`);

  // Count processed rows
  const outputDataRows = Math.max(0, outputLast - 2);
  const nextInputRow = 3 + outputDataRows;

  appendLogSafe(`📊 Output has ${outputDataRows} processed rows`);
  appendLogSafe(`📊 Next unprocessed Input row: ${nextInputRow}`);

  // Build array of ALL remaining rows
  const availableRows = [];
  for (let r = nextInputRow; r <= inputLast; r++) {
    availableRows.push(r);
  }

  appendLogSafe(`✅ Found ${availableRows.length} unprocessed rows (all remaining)`);
  if (availableRows.length > 0) {
    appendLogSafe(`📋 Will process rows ${availableRows[0]} through ${availableRows[availableRows.length-1]}`);
  }

  return availableRows;
}

function getSpecificInputRows_(inputSheet, outputSheet, spec) {
  appendLogSafe(`🔍 Starting detection for SPECIFIC rows: ${spec}`);

  const outputLast = outputSheet.getLastRow();

  // Build set of already-processed row numbers
  // Since Input row N → Output row N, rows 3 through (outputLast) are processed
  const processedRows = new Set();
  const outputDataRows = Math.max(0, outputLast - 2);

  for (let r = 3; r < 3 + outputDataRows; r++) {
    processedRows.add(r);
  }

  appendLogSafe(`📊 Already processed rows: 3 through ${2 + outputDataRows} (${processedRows.size} total)`);

  // Parse the spec (supports "5,10,15" or "5-10" or mixed "5-10,15,20-25")
  const requestedRows = parseRowSpec(spec);

  appendLogSafe(`📋 Requested rows: [${requestedRows.join(', ')}]`);

  // Filter out already-processed rows
  const availableRows = requestedRows.filter(r => !processedRows.has(r));

  if (availableRows.length < requestedRows.length) {
    const skipped = requestedRows.filter(r => processedRows.has(r));
    appendLogSafe(`⚠️  Skipping already-processed rows: [${skipped.join(', ')}]`);
  }

  appendLogSafe(`✅ Will process ${availableRows.length} rows: [${availableRows.join(', ')}]`);

  return availableRows;
}

function parseRowSpec(spec) {
  const rows = [];
  const parts = spec.split(',');

  parts.forEach(part => {
    part = part.trim();
    if (part.includes('-')) {
      // Range: "5-10"
      const range = part.split('-');
      const start = parseInt(range[0].trim(), 10);
      const end = parseInt(range[1].trim(), 10);
      for (let r = start; r <= end; r++) {
        if (!rows.includes(r)) {
          rows.push(r);
        }
      }
    } else {
      // Single row: "5"
      const r = parseInt(part, 10);
      if (!rows.includes(r)) {
        rows.push(r);
      }
    }
  });

  // Sort numerically
  return rows.sort((a, b) => a - b);
}

function startBatchFromSidebar(inputSheetName, outputSheetName, mode, spec) {
  const ss = SpreadsheetApp.getActive();
  const inSheet = ss.getSheetByName(inputSheetName);
  let outSheet = ss.getSheetByName(outputSheetName);

  // Dynamic output sheet detection (check Settings)
  const settingsSheet = ss.getSheetByName('Settings');
  const settingsOut = settingsSheet ? settingsSheet.getRange('A1').getValue() : '';
  if (settingsOut) {
    outSheet = ss.getSheetByName(settingsOut) || outSheet;
  }

  if (!inSheet || !outSheet) {
    throw new Error('❌ Could not find selected sheets.');
  }

  cacheHeaders(outSheet);

  appendLogSafe('─────────────────────────────────────────');
  appendLogSafe(`📋 Starting batch mode: ${mode}`);
  appendLogSafe('─────────────────────────────────────────');

  let rows;

  if (mode === 'next25') {
    rows = getNext25InputRows_(inSheet, outSheet);
  } else if (mode === 'all') {
    rows = getAllInputRows_(inSheet, outSheet);
  } else if (mode === 'specific') {
    rows = getSpecificInputRows_(inSheet, outSheet, spec);
  } else {
    throw new Error('Unknown batch mode: ' + mode);
  }

  if (!rows || rows.length === 0) {
    appendLogSafe('⚠️  No rows to process.');
    return { success: false, message: 'No unprocessed rows found.' };
  }

  // Save queue to DocumentProperties (separate properties for reliability)
  setProp('BATCH_ROWS', JSON.stringify(rows));
  setProp('BATCH_INPUT_SHEET', inputSheetName);
  setProp('BATCH_OUTPUT_SHEET', outputSheetName);
  setProp('BATCH_MODE', mode);
  setProp('BATCH_SPEC', spec);
  setProp('BATCH_STOP', ''); // Clear stop flag

  // Also save as single queue object for backwards compatibility
  const q = {
    rows: rows,
    inputSheetName: inputSheetName,
    outputSheetName: outputSheetName,
    mode: mode,
    spec: spec
  };
  setProp('BATCH_QUEUE', JSON.stringify(q));

  appendLogSafe(`✅ Batch queued with ${rows.length} row(s)`);
  appendLogSafe(`📋 Rows: [${rows.slice(0, 10).join(', ')}${rows.length > 10 ? '...' : ''}]`);
  appendLogSafe('─────────────────────────────────────────');

  return { success: true, count: rows.length, rows: rows };
}

function runSingleStepBatch() {
  // Try reading from separate properties first (more reliable)
  const rowsJson = getProp('BATCH_ROWS', '[]');
  const rows = JSON.parse(rowsJson);

  // Build queue object from separate properties
  const q = {
    rows: rows,
    inputSheetName: getProp('BATCH_INPUT_SHEET', ''),
    outputSheetName: getProp('BATCH_OUTPUT_SHEET', ''),
    mode: getProp('BATCH_MODE', ''),
    spec: getProp('BATCH_SPEC', '')
  }

  // Check if we have rows left
  if (!q.rows || q.rows.length === 0) {
    return { done: true, msg: '✅ All rows processed!' };
  }

  if (getProp('BATCH_STOP','')) {
    return { done: true, msg: 'Stopped by user.' };
  }

  // ⭐ Just pop and return the row number - don't process it here!
  const nextRow = q.rows.shift();

  // Save updated queue
  // Update the rows property
  setProp('BATCH_ROWS', JSON.stringify(q.rows));
  // Also update full queue for backward compatibility
  setProp('BATCH_QUEUE', JSON.stringify(q));

  // Return the row number and queue data so loopStep can call runSingleCaseFromSidebar
  return {
    done: false,
    row: nextRow,
    remaining: q.rows.length,
    inputSheetName: q.inputSheetName,
    outputSheetName: q.outputSheetName
  };
}

function finishBatchAndReport() {
  const log = JSON.parse(getProp('BATCH_LOG','{}'));
  const elapsedMs = Date.now() - (log.started||Date.now());
  const minutes = (elapsedMs/60000).toFixed(1);
  const report = `
${ICONS.clipboard} Batch Summary Report
Created: ${log.created||0}
Skipped: ${log.skipped||0}
Duplicates: ${log.dupes||0}
Errors: ${log.errors||0}
Elapsed: ${minutes} min
  `.trim();

  const s = ensureBatchReportsSheet_();
  s.appendRow([new Date(), 'Batch', log.created||0, log.skipped||0, log.dupes||0, log.errors||0, '', `${minutes} min`]);

  // Clear force reprocess flag after batch completes
  setProp('FORCE_REPROCESS', '0');

  if (getSafeUi_()) { getSafeUi_().alert(report); }
  return report;
}

function runSingleCaseFromSidebar(inputSheetName, outputSheetName, row) {
  const ss = SpreadsheetApp.getActive();

  // Define the input and output sheets first
  const inSheet = ss.getSheetByName(inputSheetName);
  let outSheet = ss.getSheetByName(outputSheetName);

  // ⭐ Dynamic output sheet detection
  const settingsSheet = ss.getSheetByName('Settings');
  const settingsOut = settingsSheet ? settingsSheet.getRange('A1').getValue() : '';
  if (settingsOut) outSheet = ss.getSheetByName(settingsOut) || outSheet;

  // Validate
  if (!inSheet || !outSheet) throw new Error('❌ Could not find selected sheets.');

  cacheHeaders(outSheet);
  const result = processOneInputRow_(inSheet, outSheet, row, /*batchMode*/ false);

  // Note: Toast disabled for sidebar operations - sidebar logs provide feedback
  // if (result.message) {
  //   showToast(result.message, 3);
  // }

  return result.message;
}

function buildExampleJSON(rowValues) {
      const obj = {};
      mergedKeys.forEach((key, i) => {
        const val = rowValues[i];
        if (val && val !== 'N/A' && String(val).trim() !== '') {
          obj[key] = val;
        }
      });
      return obj;
    }

function logLong_(label, text) {
  const chunkSize = 9000; // avoid truncation in Apps Script logs
  for (let i = 0; i < text.length; i += chunkSize) {
    Logger.log(`${label} [${i / chunkSize + 1}]:\n` + text.slice(i, i + chunkSize));
  }
}

function getTxt(name) {
        const selected = document.querySelector('input[name="'+name+'"]:checked');
        if (!selected || selected.value === 'nochange') return 'nochange';
        const idx = selected.value;
        const textField = document.getElementById(name+'_text_'+idx);
        return textField ? textField.value : 'nochange';
      }

function apply(continueNext) {
        const data = {
          spark: getTxt('spark'),
          reveal: getTxt('reveal'),
          anchor: getTxt('anchor'),
          continueNext: continueNext
        };
        google.script.run
          .withSuccessHandler(()=>{
            if(continueNext) {
              google.script.run.runATSRTitleGenerator(${row+1}, true);
            } else {
              google.script.host.close();
            }
          })
          .saveATSRData(${row}, data);
      }

function keepRegen() {
        google.script.host.close();
        google.script.run.runATSRTitleGenerator(${row}, true);
      }

function pickMasterSheet_() {
  const ss = SpreadsheetApp.getActive();
  // Prefer last used output
  const last = getProp(SP_KEYS.LAST_OUTPUT_SHEET, '');
  if (last) {
    const s = ss.getSheetByName(last);
    if (s) return s;
  }
  // Else prefer sheet named like Master Scenario CSV
  const m = ss.getSheets().find(sh=>/master scenario csv/i.test(sh.getName()));
  return m || ss.getActiveSheet();
}

function autoBoldSummary_(summary, key, take) {
  function boldPhrase(s) {
    if (!s) return 'N/A';
    // Bold up to the colon if present; else first 2–3 words
    const parts = s.split(':');
    if (parts.length>1) return `<strong>${parts[0]}</strong>:` + parts.slice(1).join(':');
    const words = s.split(' ');
    const head = words.slice(0,3).join(' ');
    return `<strong>${head}</strong> ${words.slice(3).join(' ')}`.trim();
  }
  return { summary, key: boldPhrase(key), take: boldPhrase(take) };
}

function boldPhrase(s) {
    if (!s) return 'N/A';
    // Bold up to the colon if present; else first 2–3 words
    const parts = s.split(':');
    if (parts.length>1) return `<strong>${parts[0]}</strong>:` + parts.slice(1).join(':');
    const words = s.split(' ');
    const head = words.slice(0,3).join(' ');
    return `<strong>${head}</strong> ${words.slice(3).join(' ')}`.trim();
  }

function openImageSyncDefaults() {
  const s = pickMasterSheet_();
  const {header1, header2} = getCachedHeadersOrRead(s);
  const keys = header1.map((t1,i)=>`${t1}:${header2[i]}`).filter(k=>/^Image_Sync:/i.test(k));

  const current = JSON.parse(getProp(SP_KEYS.IMG_SYNC_DEFAULTS, '{}') || '{}');
  const rows = keys.map(k=>{
    const v = (current[k]!==undefined) ? current[k] : '';
    return `<tr><td>${k}</td><td><input data-k="${k}" value="${String(v).replace(/"/g,'&quot;')}" style="width:100%"></td></tr>`;
  }).join('');

  const html = HtmlService.createHtmlOutput(`
  <style>
    body{font-family:Arial;background:#f5f7fa;color:#2c3e50}
    table{width:100%;border-collapse:collapse}
    td,th{border:1px solid #dfe3e8;padding:8px}
    .bar{padding:14px 16px;background:#1b1f2a;border-bottom:1px solid #dfe3e8}
    button{background:#2357ff;border:0;color:#fff;padding:8px 12px;border-radius:8px;cursor:pointer}
  </style>
  <div class="bar"><h3>${ICONS.frame} Image Sync Defaults</h3></div>
  <div style="padding:12px;">
    <p class="hint">Edit defaults per <code>Image_Sync:*</code> column. Click Save to persist.</p>
    <table>
      <tr><th>Column</th><th>Default Value</th></tr>
      ${rows || '<tr><td colspan="2"><em>No Image_Sync columns detected.</em></td></tr>'}
    </table>
    <div style="margin-top:12px;">
      <button onclick="save()">Save</button>
      <button style="background:#dfe3e8" onclick="refresh()">Refresh Columns</button>
    </div>
  </div>
  <script>
    function save(){
      const obj = {};
      document.querySelectorAll('input[data-k]').forEach(inp=>{
        obj[inp.getAttribute('data-k')] = inp.value;
      });
      google.script.run
        .withSuccessHandler(()=>google.script.host.close())
        .saveImageSyncDefaults(JSON.stringify(obj));
    }
    function refresh(){
      google.script.run
        .withSuccessHandler(()=>location.reload())
        .refreshImageSyncHeaderCache();
    }
  </script>
  `).setWidth(720).setHeight(560);

  getSafeUi_().showModalDialog(html, '🖼 Image Sync Defaults');
}

function save(){
      const obj = {};
      document.querySelectorAll('input[data-k]').forEach(inp=>{
        obj[inp.getAttribute('data-k')] = inp.value;
      });
      google.script.run
        .withSuccessHandler(()=>google.script.host.close())
        .saveImageSyncDefaults(JSON.stringify(obj));
    }

function refresh(){
      google.script.run
        .withSuccessHandler(()=>location.reload())
        .refreshImageSyncHeaderCache();
    }

function saveImageSyncDefaults(json) {
  setProp(SP_KEYS.IMG_SYNC_DEFAULTS, json||'{}');
  SpreadsheetApp.getActive().toast('✅ Image Sync defaults saved.');
}

function refreshImageSyncHeaderCache() {
  const s = pickMasterSheet_();
  cacheHeaders(s);
  SpreadsheetApp.getActive().toast('🔁 Header cache refreshed.');
}

function openMemoryTracker() {
  const mem = (getProp(SP_KEYS.USED_MOTIFS,'')||'').split(',').map(m=>m.trim()).filter(Boolean);
  const list = mem.map((m,i)=>`<div><input type="checkbox" id="m${i}" checked> ${m}</div>`).join('');
  const html = HtmlService.createHtmlOutput(`
  <style>body{font-family:Arial;background:#f5f7fa;color:#2c3e50} button{background:#2357ff;border:0;color:#fff;padding:8px 12px;border-radius:8px;cursor:pointer}</style>
  <div style="padding:16px;">
    <h3>${ICONS.puzzle} Memory Tracker</h3>
    ${list || '<p><em>No motifs stored.</em></p>'}
    <div style="margin-top:12px;">
      <button onclick="clearAll()">🧹 Clear All</button>
      <button style="background:#dfe3e8" onclick="markReusable()">♻️ Mark Selected as Reusable</button>
    </div>
  </div>
  <script>
    function clearAll(){ google.script.run.withSuccessHandler(()=>google.script.host.close()).clearMotifMemory(); }
    function markReusable(){
      const unchecked=[];
      document.querySelectorAll('input[type=checkbox]').forEach(c=>{ if(!c.checked) unchecked.push(c.nextSibling.textContent.trim()); });
      google.script.run.withSuccessHandler(()=>google.script.host.close()).markMotifsReusable(unchecked);
    }
  </script>`).setWidth(520).setHeight(420);
  getSafeUi_().showModalDialog(html, '🧩 Memory Tracker');
}

function clearAll(){ google.script.run.withSuccessHandler(()=>google.script.host.close()).clearMotifMemory(); }

function markReusable(){
      const unchecked=[];
      document.querySelectorAll('input[type=checkbox]').forEach(c=>{ if(!c.checked) unchecked.push(c.nextSibling.textContent.trim()); });
      google.script.run.withSuccessHandler(()=>google.script.host.close()).markMotifsReusable(unchecked);
    }

function clearMotifMemory(){ PropertiesService.getDocumentProperties().deleteProperty(SP_KEYS.USED_MOTIFS); SpreadsheetApp.getActive().toast('🧹 Memory cleared.'); }

function markMotifsReusable(unchecked){ 
  const key = SP_KEYS.USED_MOTIFS;
  const motifs = (getProp(key,'')||'').split(',').map(m=>m.trim()).filter(Boolean);
  const kept = motifs.filter(m => unchecked.includes(m)===false);
  setProp(key, kept.join(', '));
  SpreadsheetApp.getActive().toast('♻️ Selected motifs marked reusable.');
}

function refreshHeaders() {
  const ui = getSafeUi_();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const outputSheet = ss.getSheetByName(getProp('LAST_OUTPUT_SHEET') || 'Output');
  if (!outputSheet) {
    if (ui) { ui.alert('❌ Output sheet not found.'); }
    return;
  }

  const header1 = outputSheet.getRange(1, 1, 1, outputSheet.getLastColumn()).getValues()[0];
  const header2 = outputSheet.getRange(2, 1, 1, outputSheet.getLastColumn()).getValues()[0];
  const mergedKeys = header1.map((t1, i) => `${t1}:${header2[i]}`.replace(/\s+/g, '_'));

  // Cache headers for future access
  setProp('CACHED_HEADER1', JSON.stringify(header1));
  setProp('CACHED_HEADER2', JSON.stringify(header2));
  setProp('CACHED_MERGED_KEYS', JSON.stringify(mergedKeys));

  if (getSafeUi_()) { getSafeUi_().alert(`✅ Headers refreshed!\n\n${mergedKeys.length} merged keys cached.`); }
}

function ensureHeadersCached() {
  const h = getProp('CACHED_HEADER1');
  if (!h) {
    refreshHeaders();
    retrainPromptStructure();
  }
}

function openSettingsPanel() {
  const api = getProp(SP_KEYS.API_KEY,'');
  const model = getProp(SP_KEYS.MODEL, DEFAULT_MODEL);
  const pIn = getProp(SP_KEYS.PRICE_INPUT, DEFAULT_PRICE.input);
  const pOut= getProp(SP_KEYS.PRICE_OUTPUT, DEFAULT_PRICE.output);
  const html = HtmlService.createHtmlOutput(`
  <style>body{font-family:Arial;background:#f5f7fa;color:#2c3e50}
  label{font-size:12px;color:#9aa3b2}
  input,select{width:100%;background:#f5f7fa;border:1px solid #30384b;color:#2c3e50;border-radius:8px;padding:8px}
  button{background:#2357ff;border:0;color:#fff;padding:8px 12px;border-radius:8px;cursor:pointer}
  .card{background:#ffffff;border:1px solid #dfe3e8;border-radius:10px;padding:14px;margin:12px}
  </style>
  <div class="card">
    <h3>${ICONS.gear} Settings</h3>
    <label>Model</label>
    <input id="m" value="${model}">
    <label style="margin-top:8px;">API Key</label>
    <input id="k" value="${api ? '••••••••' : ''}" placeholder="sk-...">
    <label style="margin-top:8px;">Price Input per 1k</label>
    <input id="pi" value="${pIn}">
    <label style="margin-top:8px;">Price Output per 1k</label>
    <input id="po" value="${pOut}">
    <div style="margin-top:10px;">
      <button onclick="save()">Save</button>
      <button style="background:#dfe3e8" onclick="clearCache()">Clear Header Cache</button>
      <button style="background:#dfe3e8" onclick="pull()">Sync API from Settings sheet</button>
    </div>
  </div>
  <script>
    function save(){
      const key = document.getElementById('k').value.trim();
      google.script.run.saveSidebarBasics(
        document.getElementById('m').value,
        (key && key!=='••••••••') ? key : '',
        document.getElementById('pi').value.trim(),
        document.getElementById('po').value.trim(),
        '', ''
      );
      google.script.host.close();
    }
    function clearCache(){ google.script.run.withSuccessHandler(()=>alert('Cache cleared')).clearHeaderCache(); }
    function pull(){ google.script.run.withSuccessHandler(()=>alert('API key synced from Settings sheet (if found).')).pullApiFromSettingsSheet(); }
  </script>`).setWidth(520).setHeight(420);
  getSafeUi_().showModalDialog(html, '⚙️ Settings');
}

function save(){
      const key = document.getElementById('k').value.trim();
      google.script.run.saveSidebarBasics(
        document.getElementById('m').value,
        (key && key!=='••••••••') ? key : '',
        document.getElementById('pi').value.trim(),
        document.getElementById('po').value.trim(),
        '', ''
      );
      google.script.host.close();
    }

function clearCache(){ google.script.run.withSuccessHandler(()=>alert('Cache cleared')).clearHeaderCache(); }

function pull(){ google.script.run.withSuccessHandler(()=>alert('API key synced from Settings sheet (if found).')).pullApiFromSettingsSheet(); }

function pullApiFromSettingsSheet() {
  const key = syncApiKeyFromSettingsSheet_();
  if (key) setProp(SP_KEYS.API_KEY, key);
}

/**
 * Categories & Pathways Panel - Light Theme (Classic Google Sheets Style)
 *
 * Clean, easy-to-read interface for managing categories and pathways
 * Light grey theme optimized for data manipulation
 */

// ========== MAIN LAUNCHER ==========

function openCategoriesPathwaysPanel() {
  const ui = getSafeUi_();
  if (!ui) return;

  const html = buildCategoriesPathwaysMainMenu_();
  ui.showSidebar(HtmlService.createHtmlOutput(html).setTitle('📂 Categories & Pathways').setWidth(320));
}

function analyzeOutputSheetStructure() {
  const ss = SpreadsheetApp.getActive();

  // Get output sheet name from Settings
  const settingsSheet = ss.getSheetByName('Settings');
  let outputSheetName = 'Master Scenario Convert';
  if (settingsSheet) {
    const settingsOut = settingsSheet.getRange('A1').getValue();
    if (settingsOut) outputSheetName = settingsOut;
  }

  const outSheet = ss.getSheetByName(outputSheetName);
  if (!outSheet) return { error: 'Output sheet not found: ' + outputSheetName };

  const lastRow = outSheet.getLastRow();
  const lastCol = outSheet.getLastColumn();

  // Get headers (row 1 and row 2)
  const tier1Headers = outSheet.getRange(1, 1, 1, lastCol).getValues()[0];
  const tier2Headers = outSheet.getRange(2, 1, 1, lastCol).getValues()[0];

  // Get a few sample data rows
  const sampleRows = [];
  const sampleStart = Math.max(3, lastRow - 2); // Last 3 data rows
  if (lastRow >= 3) {
    const sampleData = outSheet.getRange(sampleStart, 1, lastRow - sampleStart + 1, lastCol).getValues();
    sampleRows.push(...sampleData);
  }

  return {
    sheetName: outputSheetName,
    lastRow: lastRow,
    lastCol: lastCol,
    tier1Headers: tier1Headers,
    tier2Headers: tier2Headers,
    sampleRows: sampleRows,
    sampleStartRow: sampleStart
  };
}

function clearAllBatchProperties() {
  const props = PropertiesService.getDocumentProperties();

  // Clear all batch-related properties
  const keysToDelete = [
    'BATCH_QUEUE',
    'BATCH_ROWS',
    'BATCH_INPUT_SHEET',
    'BATCH_OUTPUT_SHEET',
    'BATCH_MODE',
    'BATCH_SPEC',
    'BATCH_STOP',
    'BATCH_RUNNING',
    'BATCH_CURRENT_ROW'
  ];

  keysToDelete.forEach(key => {
    try {
      props.deleteProperty(key);
    } catch(e) {
      // Ignore if property doesn't exist
    }
  });

  Logger.log('✅ Cleared all batch properties');
  return 'Batch queue cleared. Ready to start fresh from row 15.';
}