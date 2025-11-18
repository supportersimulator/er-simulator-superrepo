/**
 * UI Integration for Multi-Step Cache Enrichment
 *
 * Adds menu options and progress dialogs for progressive cache enrichment
 */

// ============================================================================
// MENU INTEGRATION
// ============================================================================

/**
 * Add cache enrichment options to existing menu
 * Call this from onOpen() in main file
 */
function addCacheEnrichmentMenuItems(menu) {
  menu.addSeparator();
  menu.addSubMenu(SpreadsheetApp.getUi().createMenu('🗄️ Cache Management')
    .addItem('📦 Cache All Layers (Sequential)', 'showCacheAllLayersModal')
    .addSeparator()
    .addItem('📊 Cache Layer 1: BASIC', 'cacheLayer_basic')
    .addItem('📚 Cache Layer 2: LEARNING', 'cacheLayer_learning')
    .addItem('🏷️ Cache Layer 3: METADATA', 'cacheLayer_metadata')
    .addItem('👤 Cache Layer 4: DEMOGRAPHICS', 'cacheLayer_demographics')
    .addItem('💓 Cache Layer 5: VITALS', 'cacheLayer_vitals')
    .addItem('🩺 Cache Layer 6: CLINICAL', 'cacheLayer_clinical')
    .addItem('🌍 Cache Layer 7: ENVIRONMENT', 'cacheLayer_environment')
    .addSeparator()
    .addItem('📊 View Cache Status', 'showCacheStatus')
    .addItem('🔄 Refresh Headers', 'refreshHeaders')
    .addItem('🧹 Clear All Cache Layers', 'clearAllCacheLayers')
  );

  return menu;
}

// ============================================================================
// INDIVIDUAL LAYER CACHING
// ============================================================================

function cacheLayer_basic() {
  enrichCacheLayerWithUI_('basic');
}

function cacheLayer_learning() {
  enrichCacheLayerWithUI_('learning');
}

function cacheLayer_metadata() {
  enrichCacheLayerWithUI_('metadata');
}

function cacheLayer_demographics() {
  enrichCacheLayerWithUI_('demographics');
}

function cacheLayer_vitals() {
  enrichCacheLayerWithUI_('vitals');
}

function cacheLayer_clinical() {
  enrichCacheLayerWithUI_('clinical');
}

function cacheLayer_environment() {
  enrichCacheLayerWithUI_('environment');
}

/**
 * Enrich a single layer with UI feedback
 */
function enrichCacheLayerWithUI_(layerKey) {
  const ui = SpreadsheetApp.getUi();
  const layerDef = getCacheLayerDefinitions_()[layerKey];

  if (!layerDef) {
    ui.alert('❌ Error', `Unknown cache layer: ${layerKey}`, ui.ButtonSet.OK);
    return;
  }

  const confirm = ui.alert(
    `🗄️ Cache Layer ${layerDef.priority}: ${layerKey.toUpperCase()}`,
    `This will cache ${Object.keys(layerDef.fields).length} fields for all cases.\n\n` +
    `Fields: ${Object.keys(layerDef.fields).join(', ')}\n` +
    `Estimated time: ${layerDef.estimatedTime}\n\n` +
    `Continue?`,
    ui.ButtonSet.YES_NO
  );

  if (confirm !== ui.Button.YES) {
    return;
  }

  try {
    const result = enrichCacheLayer_(layerKey);

    ui.alert(
      '✅ Cache Layer Enriched',
      `Layer: ${result.layerKey}\n` +
      `Cases enriched: ${result.casesEnriched}\n` +
      `Fields per case: ${result.fieldsEnriched}\n` +
      `Time: ${(result.elapsedMs / 1000).toFixed(1)}s\n\n` +
      `Cache sheet: ${result.sheetName}`,
      ui.ButtonSet.OK
    );
  } catch (e) {
    ui.alert('❌ Error', `Failed to enrich layer ${layerKey}:\n\n${e.message}`, ui.ButtonSet.OK);
  }
}

// ============================================================================
// BULK ENRICHMENT WITH PROGRESS MODAL
// ============================================================================

/**
 * Show modal for caching all layers sequentially
 */
function showCacheAllLayersModal() {
  const html = HtmlService.createHtmlOutput(`
<style>
body {
  font-family: 'Segoe UI', Tahoma, sans-serif;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  margin: 0;
}
.container {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 20px;
  backdrop-filter: blur(10px);
}
.header {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 20px;
  text-align: center;
}
.layer {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.layer-name {
  font-weight: 600;
  font-size: 14px;
}
.layer-status {
  font-size: 12px;
  padding: 4px 12px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.2);
}
.status-pending { background: rgba(150, 150, 150, 0.3); }
.status-running { background: rgba(255, 193, 7, 0.5); animation: pulse 1.5s infinite; }
.status-complete { background: rgba(76, 175, 80, 0.5); }
.status-error { background: rgba(244, 67, 54, 0.5); }
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}
.progress-bar {
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  margin: 20px 0;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4caf50, #8bc34a);
  width: 0%;
  transition: width 0.5s ease;
}
.summary {
  text-align: center;
  margin-top: 20px;
  font-size: 14px;
}
.buttons {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-top: 20px;
}
.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s;
}
.btn:hover {
  transform: scale(1.05);
}
.btn-primary {
  background: #4caf50;
  color: white;
}
.btn-secondary {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}
</style>

<div class="container">
  <div class="header">🗄️ Progressive Cache Enrichment</div>

  <div class="progress-bar">
    <div class="progress-fill" id="progressFill"></div>
  </div>

  <div id="layers"></div>

  <div class="summary" id="summary">Ready to enrich 7 layers...</div>

  <div class="buttons">
    <button class="btn btn-primary" id="startBtn" onclick="startEnrichment()">🚀 Start Enrichment</button>
    <button class="btn btn-secondary" onclick="google.script.host.close()">❌ Cancel</button>
  </div>
</div>

<script>
const layers = [
  { key: 'basic', name: 'Layer 1: BASIC', priority: 1 },
  { key: 'learning', name: 'Layer 2: LEARNING', priority: 2 },
  { key: 'metadata', name: 'Layer 3: METADATA', priority: 3 },
  { key: 'demographics', name: 'Layer 4: DEMOGRAPHICS', priority: 4 },
  { key: 'vitals', name: 'Layer 5: VITALS', priority: 5 },
  { key: 'clinical', name: 'Layer 6: CLINICAL', priority: 6 },
  { key: 'environment', name: 'Layer 7: ENVIRONMENT', priority: 7 }
];

let currentLayerIndex = 0;
let completedLayers = 0;
let erroredLayers = 0;

function renderLayers() {
  const layersDiv = document.getElementById('layers');
  layersDiv.innerHTML = layers.map((layer, i) => \`
    <div class="layer">
      <div class="layer-name">\${layer.name}</div>
      <div class="layer-status status-pending" id="status\${i}">⏸️ Pending</div>
    </div>
  \`).join('');
}

function updateLayerStatus(index, status, text) {
  const statusEl = document.getElementById(\`status\${index}\`);
  statusEl.className = \`layer-status status-\${status}\`;
  statusEl.textContent = text;
}

function updateProgress() {
  const progress = (currentLayerIndex / layers.length) * 100;
  document.getElementById('progressFill').style.width = progress + '%';
  document.getElementById('summary').textContent =
    \`Progress: \${currentLayerIndex}/\${layers.length} layers | ✅ \${completedLayers} | ❌ \${erroredLayers}\`;
}

function enrichNextLayer() {
  if (currentLayerIndex >= layers.length) {
    document.getElementById('summary').textContent =
      \`✅ Complete! \${completedLayers}/\${layers.length} layers enriched successfully\`;
    document.getElementById('startBtn').textContent = '✅ Done';
    document.getElementById('startBtn').disabled = true;
    return;
  }

  const layer = layers[currentLayerIndex];
  updateLayerStatus(currentLayerIndex, 'running', '⏳ Enriching...');

  google.script.run
    .withSuccessHandler(function(result) {
      if (result.success) {
        updateLayerStatus(currentLayerIndex, 'complete',
          \`✅ \${result.casesEnriched} cases (\${(result.elapsedMs / 1000).toFixed(1)}s)\`);
        completedLayers++;
      } else {
        updateLayerStatus(currentLayerIndex, 'error', '❌ Error');
        erroredLayers++;
      }
      currentLayerIndex++;
      updateProgress();
      setTimeout(enrichNextLayer, 500);
    })
    .withFailureHandler(function(error) {
      updateLayerStatus(currentLayerIndex, 'error', '❌ ' + error.message);
      erroredLayers++;
      currentLayerIndex++;
      updateProgress();
      setTimeout(enrichNextLayer, 500);
    })
    .enrichCacheLayer_(layer.key);
}

function startEnrichment() {
  document.getElementById('startBtn').disabled = true;
  document.getElementById('startBtn').textContent = '⏳ Enriching...';
  enrichNextLayer();
}

renderLayers();
</script>
  `).setWidth(700).setHeight(650);

  SpreadsheetApp.getUi().showModalDialog(html, 'Progressive Cache Enrichment');
}

// ============================================================================
// CACHE STATUS VIEWER
// ============================================================================

/**
 * Show current cache status for all layers
 */
function showCacheStatus() {
  const layers = getCacheLayerDefinitions_();
  const layerKeys = Object.keys(layers).sort(function(a, b) {
    return layers[a].priority - layers[b].priority;
  });

  let statusText = '📊 CACHE STATUS\n\n';
  statusText += '═══════════════════════════════════════════════════════════════\n\n';

  let totalLayers = layerKeys.length;
  let cachedLayers = 0;
  let freshLayers = 0;
  let staleLayers = 0;
  let missingLayers = 0;

  layerKeys.forEach(function(layerKey) {
    const layerDef = layers[layerKey];
    const cacheData = readCacheLayer_(layerDef.sheetName);

    statusText += `Layer ${layerDef.priority}: ${layerKey.toUpperCase()}\n`;
    statusText += `Fields: ${Object.keys(layerDef.fields).join(', ')}\n`;

    if (!cacheData) {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const sheet = ss.getSheetByName(layerDef.sheetName);

      if (!sheet) {
        statusText += `Status: ❌ Missing (never cached)\n`;
        missingLayers++;
      } else {
        statusText += `Status: ⚠️ Stale (>24h old)\n`;
        staleLayers++;
        cachedLayers++;
      }
    } else {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const sheet = ss.getSheetByName(layerDef.sheetName);
      const data = sheet.getDataRange().getValues();
      const cachedTimestamp = new Date(data[1][0]);
      const now = new Date();
      const hoursDiff = (now - cachedTimestamp) / (1000 * 60 * 60);

      statusText += `Status: ✅ Fresh (${hoursDiff.toFixed(1)}h old)\n`;
      statusText += `Cases: ${cacheData.totalCases}\n`;
      freshLayers++;
      cachedLayers++;
    }

    statusText += '\n';
  });

  statusText += '═══════════════════════════════════════════════════════════════\n\n';
  statusText += `SUMMARY:\n`;
  statusText += `Total layers: ${totalLayers}\n`;
  statusText += `✅ Fresh: ${freshLayers}\n`;
  statusText += `⚠️ Stale: ${staleLayers}\n`;
  statusText += `❌ Missing: ${missingLayers}\n\n`;

  const fieldCoverage = Math.round((cachedLayers / totalLayers) * 100);
  statusText += `Cache coverage: ${fieldCoverage}%\n`;

  SpreadsheetApp.getUi().alert('Cache Status', statusText, SpreadsheetApp.getUi().ButtonSet.OK);
}

// ============================================================================
// CACHE CLEARING
// ============================================================================

/**
 * Clear all cache layers
 */
function clearAllCacheLayers() {
  const ui = SpreadsheetApp.getUi();
  const confirm = ui.alert(
    '🧹 Clear All Cache Layers',
    'This will delete all cache sheets. Continue?',
    ui.ButtonSet.YES_NO
  );

  if (confirm !== ui.Button.YES) {
    return;
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const layers = getCacheLayerDefinitions_();
  let deletedCount = 0;

  Object.keys(layers).forEach(function(layerKey) {
    const sheetName = layers[layerKey].sheetName;
    const sheet = ss.getSheetByName(sheetName);

    if (sheet) {
      ss.deleteSheet(sheet);
      deletedCount++;
    }
  });

  ui.alert(
    '✅ Cache Cleared',
    `Deleted ${deletedCount} cache sheets.`,
    ui.ButtonSet.OK
  );
}
