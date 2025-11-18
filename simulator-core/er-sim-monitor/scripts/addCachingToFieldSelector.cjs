#!/usr/bin/env node

/**
 * Add batch caching capability to field selector modal
 * - Adds "Cache Selected Fields" button
 * - Shows real-time progress in Live Log
 * - Uses existing cacheNext25Rows() function
 * - Processes batches of 25 until complete
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const PRODUCTION_PROJECT_ID = '12NihbVaaAIyRMCtzZ-aGjJ71CdL-HDjhmjxiD_S_EgIOuDOtrUH6M1l2';

async function authorize() {
  const credentialsPath = path.join(__dirname, '../config/credentials.json');
  const tokenPath = path.join(__dirname, '../config/token.json');
  const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
  const token = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
  const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
  oAuth2Client.setCredentials(token);
  return oAuth2Client;
}

async function deploy() {
  try {
    const auth = await authorize();
    const script = google.script({ version: 'v1', auth });

    console.log('📥 Downloading current production code...\n');

    const content = await script.projects.getContent({
      scriptId: PRODUCTION_PROJECT_ID
    });

    const codeFile = content.data.files.find(f => f.name === 'Code');
    const manifestFile = content.data.files.find(f => f.name === 'appsscript');

    let code = codeFile.source;

    console.log('🔧 Adding batch caching to field selector...\n');

    const funcStart = code.indexOf('function showFieldSelector()');
    const funcEnd = code.indexOf('\nfunction ', funcStart + 50);

    // Check if cacheNext25Rows exists
    if (!code.includes('function cacheNext25Rows')) {
      console.log('⚠️  cacheNext25Rows function not found - will need to create it');
    }

    const updatedFunction = `function showFieldSelector() {
  Logger.log('🎯 Field Selector with Caching');

  try {
    var roughDraft = getFieldSelectorRoughDraft();
    var allFields = roughDraft.allFields;
    var selected = roughDraft.selected;

    Logger.log('✅ Got ' + allFields.length + ' fields, ' + selected.length + ' selected');

    var allFieldsJson = JSON.stringify(allFields);
    var selectedJson = JSON.stringify(selected);

    var html = '<!DOCTYPE html><html><head><title>Field Selector</title>';

    html += '<style>';
    html += 'body { font-family: Arial, sans-serif; margin: 0; padding: 0; display: flex; flex-direction: column; height: 100vh; }';
    html += '.live-log-header { background: #1a1a1a; color: #0f0; padding: 5px 10px; font-weight: bold; display: flex; justify-content: space-between; align-items: center; }';
    html += '.live-log { background: #000; color: #0f0; font-family: monospace; font-size: 12px; padding: 10px; height: 120px; overflow-y: auto; border-bottom: 3px solid #0f0; }';
    html += '.copy-btn { background: #0f0; color: #000; border: none; padding: 4px 12px; border-radius: 3px; cursor: pointer; font-weight: bold; font-size: 11px; }';
    html += '.copy-btn:hover { background: #0c0; }';
    html += '.main-content { flex: 1; overflow-y: auto; padding: 20px; }';
    html += 'h1 { color: #1a73e8; margin: 0 0 20px 0; }';
    html += '.section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }';
    html += '.section-header { font-size: 16px; font-weight: bold; padding: 8px; margin-bottom: 10px; border-radius: 3px; display: flex; justify-content: space-between; align-items: center; }';
    html += '.section-header.default { background: #0d652d; color: white; }';
    html += '.section-header.recommended { background: #ea8600; color: white; }';
    html += '.section-header.other { background: #5f6368; color: white; }';
    html += '.field-list { max-height: 200px; overflow-y: auto; }';
    html += '.field-item { padding: 8px; margin: 4px 0; background: #f8f9fa; border-radius: 3px; cursor: pointer; }';
    html += '.field-item:hover { background: #e8f0fe; }';
    html += '.field-item input { margin-right: 10px; cursor: pointer; }';
    html += '.field-item label { cursor: pointer; }';
    html += '.field-item.recommended { background: #fff3e0; border-left: 3px solid #ea8600; }';
    html += '.field-item.ai-approved { background: #e8f5e9; border-left: 3px solid #4caf50; }';
    html += '.ai-badge { display: inline-block; background: #4caf50; color: white; font-size: 10px; padding: 2px 6px; border-radius: 3px; margin-left: 8px; font-weight: bold; }';
    html += '.rationale { font-size: 11px; color: #666; margin-left: 30px; font-style: italic; }';
    html += '.footer { padding: 15px; background: #f8f9fa; border-top: 2px solid #ddd; }';
    html += '.btn { padding: 10px 20px; margin-right: 10px; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; font-weight: bold; }';
    html += '.btn-primary { background: #1a73e8; color: white; }';
    html += '.btn-primary:hover { background: #1557b0; }';
    html += '.btn-cache { background: #0d652d; color: white; }';
    html += '.btn-cache:hover { background: #0a4d22; }';
    html += '.btn-cache:disabled { background: #ccc; cursor: not-allowed; }';
    html += '.btn-secondary { background: #5f6368; color: white; }';
    html += '.btn-secondary:hover { background: #3c4043; }';
    html += '.btn-ai { background: #ea8600; color: white; padding: 4px 10px; font-size: 12px; }';
    html += '.btn-ai:hover { background: #c77100; }';
    html += '.btn-ai:disabled { background: #ccc; cursor: not-allowed; }';
    html += '.loading { color: #666; font-style: italic; }';
    html += '.progress-bar { background: #e0e0e0; height: 20px; border-radius: 10px; margin: 10px 0; overflow: hidden; }';
    html += '.progress-fill { background: #0d652d; height: 100%; transition: width 0.3s; text-align: center; color: white; font-size: 12px; line-height: 20px; }';
    html += '</style>';

    html += '<script>';
    html += 'var ALL_FIELDS = ' + allFieldsJson + ';';
    html += 'var SELECTED_FIELDS = ' + selectedJson + ';';
    html += 'var currentSelection = {};';
    html += 'var recommendedFields = [];';
    html += 'var cachingInProgress = false;';
    html += 'var totalRowsToCache = 0;';
    html += 'var rowsCached = 0;';
    html += '';
    html += 'function log(msg) {';
    html += '  var logDiv = document.getElementById("live-log");';
    html += '  var timestamp = new Date().toLocaleTimeString();';
    html += '  logDiv.innerHTML += "[" + timestamp + "] " + msg + "<br>";';
    html += '  logDiv.scrollTop = logDiv.scrollHeight;';
    html += '}';
    html += '';
    html += 'function copyLog() {';
    html += '  var logDiv = document.getElementById("live-log");';
    html += '  var text = logDiv.innerText;';
    html += '  navigator.clipboard.writeText(text).then(function() {';
    html += '    log("📋 Log copied to clipboard!");';
    html += '  });';
    html += '}';
    html += '';
    html += 'function updateProgress(cached, total) {';
    html += '  rowsCached = cached;';
    html += '  totalRowsToCache = total;';
    html += '  var percent = Math.round((cached / total) * 100);';
    html += '  var progressBar = document.getElementById("progress-fill");';
    html += '  if (progressBar) {';
    html += '    progressBar.style.width = percent + "%";';
    html += '    progressBar.textContent = cached + " / " + total + " rows (" + percent + "%)";';
    html += '  }';
    html += '}';
    html += '';
    html += 'function initSelection() {';
    html += '  for (var i = 0; i < SELECTED_FIELDS.length; i++) {';
    html += '    currentSelection[SELECTED_FIELDS[i]] = true;';
    html += '  }';
    html += '  log("✅ Loaded " + SELECTED_FIELDS.length + " default fields");';
    html += '}';
    html += '';
    html += 'function handleCheckboxChange(event) {';
    html += '  var fieldName = event.target.getAttribute("data-field");';
    html += '  currentSelection[fieldName] = event.target.checked;';
    html += '  updateCounts();';
    html += '}';
    html += '';
    html += 'function updateCounts() {';
    html += '  var count = 0;';
    html += '  for (var field in currentSelection) {';
    html += '    if (currentSelection[field]) count++;';
    html += '  }';
    html += '  document.getElementById("selected-count").textContent = count;';
    html += '}';
    html += '';
    html += 'function getAIRecommendations() {';
    html += '  log("🤖 Requesting AI field recommendations...");';
    html += '  var btn = document.getElementById("ai-btn");';
    html += '  btn.disabled = true;';
    html += '  btn.textContent = "⏳ Loading...";';
    html += '  var section = document.getElementById("recommended-section");';
    html += '  section.innerHTML = "<div class=\\\\"loading\\\\">🤖 AI is analyzing your field selection...</div>";';
    html += '';
    html += '  google.script.run';
    html += '    .withSuccessHandler(function(result) {';
    html += '      log("✅ Received " + result.length + " AI recommendations");';
    html += '      recommendedFields = result;';
    html += '      renderRecommendedSection();';
    html += '      btn.textContent = "🔄 Refresh AI";';
    html += '      btn.disabled = false;';
    html += '    })';
    html += '    .withFailureHandler(function(error) {';
    html += '      log("❌ AI request failed: " + error.message);';
    html += '      section.innerHTML = "<div class=\\\\"loading\\\\">❌ Error: " + error.message + "</div>";';
    html += '      btn.disabled = false;';
    html += '      btn.textContent = "🤖 Try Again";';
    html += '    })';
    html += '    .getRecommendedFields(ALL_FIELDS, SELECTED_FIELDS);';
    html += '}';
    html += '';
    html += 'function renderRecommendedSection() {';
    html += '  var section = document.getElementById("recommended-section");';
    html += '  if (recommendedFields.length === 0) {';
    html += '    section.innerHTML = "<em>No additional recommendations at this time.</em>";';
    html += '    return;';
    html += '  }';
    html += '';
    html += '  var aiApproved = [];';
    html += '  var newRecommendations = [];';
    html += '';
    html += '  for (var i = 0; i < recommendedFields.length; i++) {';
    html += '    var rec = recommendedFields[i];';
    html += '    var fieldName = rec.field || rec.name || rec;';
    html += '    if (SELECTED_FIELDS.indexOf(fieldName) > -1) {';
    html += '      aiApproved.push({ field: fieldName, rationale: rec.rationale });';
    html += '    } else {';
    html += '      newRecommendations.push(rec);';
    html += '    }';
    html += '  }';
    html += '';
    html += '  log("✨ " + aiApproved.length + " defaults confirmed by AI, " + newRecommendations.length + " new suggestions");';
    html += '';
    html += '  if (aiApproved.length > 0) {';
    html += '    var defaultSection = document.querySelector(".section-header.default");';
    html += '    defaultSection.innerHTML = "✅ DEFAULT (" + SELECTED_FIELDS.length + ") <span class=\\\\"ai-badge\\\\">✨ " + aiApproved.length + " AI APPROVED</span>";';
    html += '';
    html += '    for (var i = 0; i < aiApproved.length; i++) {';
    html += '      var fieldName = aiApproved[i].field;';
    html += '      var items = document.querySelectorAll("[data-field=\\\\"" + fieldName + "\\\\"]");';
    html += '      for (var j = 0; j < items.length; j++) {';
    html += '        var item = items[j].parentElement;';
    html += '        if (item.classList.contains("field-item")) {';
    html += '          item.classList.add("ai-approved");';
    html += '          var label = item.querySelector("label");';
    html += '          if (!label.querySelector(".ai-badge")) {';
    html += '            label.innerHTML += " <span class=\\\\"ai-badge\\\\">✨ AI</span>";';
    html += '          }';
    html += '        }';
    html += '      }';
    html += '    }';
    html += '  }';
    html += '';
    html += '  var html = "";';
    html += '  if (newRecommendations.length === 0) {';
    html += '    html = "<em>No new field recommendations. AI confirms your current selection!</em>";';
    html += '  } else {';
    html += '    for (var i = 0; i < newRecommendations.length; i++) {';
    html += '      var rec = newRecommendations[i];';
    html += '      var fieldName = rec.field || rec.name || rec;';
    html += '      var rationale = rec.rationale || "";';
    html += '      html += "<div class=\\\\"field-item recommended\\\\">";';
    html += '      html += "<input type=\\\\"checkbox\\\\" data-field=\\\\"" + fieldName + "\\\\" class=\\\\"field-checkbox ai-checkbox\\\\">";';
    html += '      html += "<label>" + fieldName + "</label>";';
    html += '      if (rationale) {';
    html += '        html += "<div class=\\\\"rationale\\\\">💡 " + rationale + "</div>";';
    html += '      }';
    html += '      html += "</div>";';
    html += '    }';
    html += '  }';
    html += '';
    html += '  section.innerHTML = html;';
    html += '  document.querySelector(".section-header.recommended span").textContent = "🎯 RECOMMENDED (" + newRecommendations.length + ")";';
    html += '';
    html += '  var checkboxes = section.querySelectorAll(".ai-checkbox");';
    html += '  for (var i = 0; i < checkboxes.length; i++) {';
    html += '    checkboxes[i].addEventListener("change", handleCheckboxChange);';
    html += '  }';
    html += '}';
    html += '';
    html += 'function startCaching() {';
    html += '  if (cachingInProgress) {';
    html += '    log("⚠️ Caching already in progress");';
    html += '    return;';
    html += '  }';
    html += '';
    html += '  var selected = [];';
    html += '  for (var field in currentSelection) {';
    html += '    if (currentSelection[field]) selected.push(field);';
    html += '  }';
    html += '';
    html += '  if (selected.length === 0) {';
    html += '    log("❌ No fields selected");';
    html += '    return;';
    html += '  }';
    html += '';
    html += '  cachingInProgress = true;';
    html += '  document.getElementById("cache-btn").disabled = true;';
    html += '  document.getElementById("save-btn").disabled = true;';
    html += '  ';
    html += '  var progressHtml = "<div class=\\\\"progress-bar\\\\"><div class=\\\\"progress-fill\\\\" id=\\\\"progress-fill\\\\">0%</div></div>";';
    html += '  document.getElementById("progress-container").innerHTML = progressHtml;';
    html += '';
    html += '  log("🚀 Starting batch cache for " + selected.length + " fields...");';
    html += '  log("💾 Saving field selection first...");';
    html += '';
    html += '  google.script.run';
    html += '    .withSuccessHandler(function() {';
    html += '      log("✅ Field selection saved");';
    html += '      log("📊 Initializing cache process...");';
    html += '      cacheNext25();';
    html += '    })';
    html += '    .withFailureHandler(function(error) {';
    html += '      log("❌ Failed to save selection: " + error.message);';
    html += '      cachingInProgress = false;';
    html += '      document.getElementById("cache-btn").disabled = false;';
    html += '      document.getElementById("save-btn").disabled = false;';
    html += '    })';
    html += '    .saveFieldSelection(selected);';
    html += '}';
    html += '';
    html += 'function cacheNext25() {';
    html += '  log("⏳ Caching next batch of 25 rows...");';
    html += '';
    html += '  google.script.run';
    html += '    .withSuccessHandler(function(result) {';
    html += '      if (result.error) {';
    html += '        log("❌ Error: " + result.error);';
    html += '        cachingInProgress = false;';
    html += '        document.getElementById("cache-btn").disabled = false;';
    html += '        document.getElementById("save-btn").disabled = false;';
    html += '        return;';
    html += '      }';
    html += '';
    html += '      log("✅ Cached rows " + result.startRow + " to " + result.endRow);';
    html += '      updateProgress(result.totalCached, result.totalRows);';
    html += '';
    html += '      if (result.complete) {';
    html += '        log("🎉 CACHING COMPLETE! All " + result.totalCached + " rows cached.");';
    html += '        log("✨ AI pathway discovery is now ready!");';
    html += '        cachingInProgress = false;';
    html += '        document.getElementById("cache-btn").disabled = false;';
    html += '        document.getElementById("save-btn").disabled = false;';
    html += '        setTimeout(function() { google.script.host.close(); }, 3000);';
    html += '      } else {';
    html += '        log("📦 " + result.remaining + " rows remaining...");';
    html += '        setTimeout(cacheNext25, 1000);';
    html += '      }';
    html += '    })';
    html += '    .withFailureHandler(function(error) {';
    html += '      log("❌ Caching failed: " + error.message);';
    html += '      cachingInProgress = false;';
    html += '      document.getElementById("cache-btn").disabled = false;';
    html += '      document.getElementById("save-btn").disabled = false;';
    html += '    })';
    html += '    .cacheNext25Rows();';
    html += '}';
    html += '';
    html += 'function saveSelection() {';
    html += '  var selected = [];';
    html += '  for (var field in currentSelection) {';
    html += '    if (currentSelection[field]) selected.push(field);';
    html += '  }';
    html += '  log("💾 Saving " + selected.length + " fields to properties...");';
    html += '  google.script.run';
    html += '    .withSuccessHandler(function() {';
    html += '      log("✅ Selection saved successfully!");';
    html += '      setTimeout(function() { google.script.host.close(); }, 1500);';
    html += '    })';
    html += '    .withFailureHandler(function(error) {';
    html += '      log("❌ Error saving: " + error.message);';
    html += '    })';
    html += '    .saveFieldSelection(selected);';
    html += '}';
    html += '';
    html += 'window.addEventListener("DOMContentLoaded", function() {';
    html += '  log("🎯 Field Selector initialized");';
    html += '  initSelection();';
    html += '';
    html += '  var otherFields = ALL_FIELDS.filter(function(f) {';
    html += '    return SELECTED_FIELDS.indexOf(f) === -1 && recommendedFields.indexOf(f) === -1;';
    html += '  });';
    html += '';
    html += '  var sectionsDiv = document.getElementById("sections");';
    html += '  var html = "";';
    html += '';
    html += '  html += "<div class=\\\\"section\\\\">";';
    html += '  html += "<div class=\\\\"section-header default\\\\">✅ DEFAULT (" + SELECTED_FIELDS.length + ")</div>";';
    html += '  html += "<div class=\\\\"field-list\\\\">";';
    html += '  for (var i = 0; i < SELECTED_FIELDS.length; i++) {';
    html += '    var fieldName = SELECTED_FIELDS[i];';
    html += '    html += "<div class=\\\\"field-item\\\\">";';
    html += '    html += "<input type=\\\\"checkbox\\\\" checked data-field=\\\\"" + fieldName + "\\\\" class=\\\\"field-checkbox\\\\">";';
    html += '    html += "<label>" + fieldName + "</label>";';
    html += '    html += "</div>";';
    html += '  }';
    html += '  html += "</div></div>";';
    html += '';
    html += '  html += "<div class=\\\\"section\\\\">";';
    html += '  html += "<div class=\\\\"section-header recommended\\\\">";';
    html += '  html += "<span>🎯 RECOMMENDED (0)</span>";';
    html += '  html += "<button class=\\\\"btn-ai\\\\" id=\\\\"ai-btn\\\\" onclick=\\\\"getAIRecommendations()\\\\">🤖 Get AI Recommendations</button>";';
    html += '  html += "</div>";';
    html += '  html += "<div class=\\\\"field-list\\\\" id=\\\\"recommended-section\\\\">";';
    html += '  html += "<em>Click button above to get AI-powered field recommendations</em>";';
    html += '  html += "</div></div>";';
    html += '';
    html += '  html += "<div class=\\\\"section\\\\">";';
    html += '  html += "<div class=\\\\"section-header other\\\\">📋 OTHER (" + otherFields.length + ")</div>";';
    html += '  html += "<div class=\\\\"field-list\\\\">";';
    html += '  for (var i = 0; i < Math.min(otherFields.length, 30); i++) {';
    html += '    var fieldName = otherFields[i];';
    html += '    html += "<div class=\\\\"field-item\\\\">";';
    html += '    html += "<input type=\\\\"checkbox\\\\" data-field=\\\\"" + fieldName + "\\\\" class=\\\\"field-checkbox\\\\">";';
    html += '    html += "<label>" + fieldName + "</label>";';
    html += '    html += "</div>";';
    html += '  }';
    html += '  if (otherFields.length > 30) {';
    html += '    html += "<div style=\\\\"padding: 8px; font-style: italic;\\\\">... and " + (otherFields.length - 30) + " more</div>";';
    html += '  }';
    html += '  html += "</div></div>";';
    html += '';
    html += '  sectionsDiv.innerHTML = html;';
    html += '';
    html += '  var checkboxes = document.querySelectorAll(".field-checkbox");';
    html += '  for (var i = 0; i < checkboxes.length; i++) {';
    html += '    checkboxes[i].addEventListener("change", handleCheckboxChange);';
    html += '  }';
    html += '';
    html += '  updateCounts();';
    html += '  log("📊 Displaying " + ALL_FIELDS.length + " total fields");';
    html += '});';
    html += '</script>';

    html += '</head><body>';
    html += '<div class="live-log-header">';
    html += '<span>📡 LIVE LOG</span>';
    html += '<button class="copy-btn" onclick="copyLog()">📋 COPY</button>';
    html += '</div>';
    html += '<div class="live-log" id="live-log"></div>';
    html += '<div class="main-content">';
    html += '<h1>🎯 Select Fields to Cache</h1>';
    html += '<div id="sections"></div>';
    html += '</div>';
    html += '<div class="footer">';
    html += '<div id="progress-container"></div>';
    html += '<div style="margin-bottom: 10px;">Selected: <strong><span id="selected-count">0</span></strong> fields</div>';
    html += '<button class="btn btn-cache" id="cache-btn" onclick="startCaching()">🚀 Cache Selected Fields</button>';
    html += '<button class="btn btn-primary" id="save-btn" onclick="saveSelection()">💾 Save Selection</button>';
    html += '<button class="btn btn-secondary" onclick="google.script.host.close()">Cancel</button>';
    html += '</div>';
    html += '</body></html>';

    var htmlOutput = HtmlService.createHtmlOutput(html)
      .setWidth(800)
      .setHeight(750);

    SpreadsheetApp.getUi().showModalDialog(htmlOutput, '🎯 Select Fields & Cache Data');
    Logger.log('✅ Field selector with caching displayed');

  } catch (error) {
    Logger.log('❌ Error: ' + error.message);
    SpreadsheetApp.getUi().alert('Error', error.message, SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

function saveFieldSelection(selectedFields) {
  try {
    Logger.log('💾 Saving ' + selectedFields.length + ' fields to properties');

    var docProps = PropertiesService.getDocumentProperties();
    docProps.setProperty('SELECTED_FIELDS', JSON.stringify(selectedFields));

    Logger.log('✅ Field selection saved');
    return { success: true };
  } catch (error) {
    Logger.log('❌ Error saving: ' + error.message);
    throw error;
  }
}
`;

    code = code.substring(0, funcStart) + updatedFunction + code.substring(funcEnd);

    console.log('📤 Deploying...\n');

    await script.projects.updateContent({
      scriptId: PRODUCTION_PROJECT_ID,
      requestBody: {
        files: [
          { name: 'Code', type: 'SERVER_JS', source: code },
          manifestFile
        ]
      }
    });

    console.log('✅ Deployed!\n');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🚀 BATCH CACHING ADDED TO FIELD SELECTOR');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('New features:');
    console.log('✅ "Cache Selected Fields" button (green)');
    console.log('✅ Real-time progress bar showing cached rows');
    console.log('✅ Live Log shows each batch completion');
    console.log('✅ Automatic 25-row batching');
    console.log('✅ Auto-close when caching complete');
    console.log('✅ Field selection saved before caching starts\n');
    console.log('Workflow:');
    console.log('1. Select/adjust fields (use AI recommendations)');
    console.log('2. Click "Cache Selected Fields" button');
    console.log('3. Watch Live Log + progress bar');
    console.log('4. Wait for "CACHING COMPLETE!" message');
    console.log('5. Modal auto-closes after 3 seconds\n');
    console.log('Live Log will show:');
    console.log('- "Caching next batch of 25 rows..."');
    console.log('- "Cached rows X to Y"');
    console.log('- "Z rows remaining..."');
    console.log('- Progress bar: "50 / 100 rows (50%)"');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

deploy();
