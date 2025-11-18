/**
 * Sidebar Backend Module
 *
 * Isolated single-purpose module containing 7 functions
 * Generated: 2025-11-04T18:30:22.773Z
 * Source: Utilities.gs (refined from monolithic code)
 */

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

function openSettings(){ google.script.run.openSettingsPanel(); }

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

function openSettings(){ google.script.run.openSettingsPanel(); }

function saveSidebarBasics(model, apiKeyMaybe, priceIn, priceOut, inputSheet, outputSheet) {
  if (model) setProp(SP_KEYS.MODEL, model);
  if (apiKeyMaybe) setProp(SP_KEYS.API_KEY, apiKeyMaybe);
  if (inputSheet) setProp(SP_KEYS.LAST_INPUT_SHEET, inputSheet);
  if (outputSheet) {
    setProp(SP_KEYS.LAST_OUTPUT_SHEET, outputSheet);
    setOutputSheet(outputSheet);
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