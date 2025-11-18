#!/usr/bin/env node

/**
 * GENERATE DYNAMIC FIELD SELECTOR FUNCTIONS
 *
 * Creates the complete field selector system that:
 * - Reads ALL columns from spreadsheet dynamically
 * - Groups intelligently by Tier1 category
 * - Pre-selects current 27 fields as defaults
 * - Saves custom selections
 * - Shows exactly what data is available
 *
 * SURGICAL APPROACH - Adds to existing Phase2 file
 */

const fs = require('fs');
const path = require('path');

console.log('\n🎨 GENERATING DYNAMIC FIELD SELECTOR FUNCTIONS\n');
console.log('═══════════════════════════════════════════════════════════════\n');

// These are the new functions we'll add
const newFunctions = `
// ═══════════════════════════════════════════════════════════════
// DYNAMIC FIELD SELECTOR SYSTEM
// Reads ALL available columns and allows user to select which to cache
// ═══════════════════════════════════════════════════════════════

/**
 * Get all available fields from spreadsheet dynamically
 * Returns array of field objects with name, header, tier1, tier2
 */
function getAvailableFields() {
  const sheet = pickMasterSheet_();
  const headers = sheet.getRange(2, 1, 1, sheet.getLastColumn()).getValues()[0];

  const fields = [];
  headers.forEach(function(header, index) {
    if (!header || header === '') return;

    const headerStr = header.toString();
    const parts = headerStr.split(':');
    const tier1 = parts[0] ? parts[0].trim() : 'Other';
    const tier2 = parts[1] ? parts[1].trim() : headerStr;

    // Generate camelCase field name
    const fieldName = generateFieldName_(tier2);

    fields.push({
      name: fieldName,
      header: headerStr,
      tier1: tier1,
      tier2: tier2,
      columnIndex: index
    });
  });

  Logger.log('📊 Found ' + fields.length + ' available fields in spreadsheet');
  return fields;
}

/**
 * Convert column header to camelCase field name
 * "Case ID" → "caseId", "Spark Title" → "sparkTitle"
 */
function generateFieldName_(tier2) {
  return tier2
    .replace(/[^a-zA-Z0-9\\s]/g, '')  // Remove special chars
    .trim()
    .split(/\\s+/)  // Split on whitespace
    .map(function(word, i) {
      if (i === 0) return word.toLowerCase();
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join('');
}

/**
 * Get default field names (current 27 fields)
 */
function getDefaultFieldNames_() {
  return [
    'caseId', 'sparkTitle', 'pathway',
    'preSimOverview', 'postSimOverview', 'learningOutcomes', 'learningObjectives',
    'category', 'difficulty', 'setting', 'chiefComplaint',
    'age', 'gender', 'patientName',
    'initialVitals',
    'examFindings', 'medications', 'pastMedicalHistory', 'allergies',
    'environmentType', 'dispositionPlan', 'context'
  ];
}

/**
 * Load saved field selection from DocumentProperties
 * Returns saved array or defaults if none saved
 */
function loadFieldSelection() {
  const docProps = PropertiesService.getDocumentProperties();
  const saved = docProps.getProperty('SELECTED_CACHE_FIELDS');

  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      Logger.log('⚠️ Error parsing saved field selection: ' + e.message);
    }
  }

  // Return default 27 fields
  return getDefaultFieldNames_();
}

/**
 * Show dynamic field selector modal
 * Reads all available columns and lets user select which to cache
 */
function showFieldSelector() {
  // Get all available fields from spreadsheet
  const availableFields = getAvailableFields();

  // Get saved selection or defaults
  const selectedFields = loadFieldSelection();

  // Group fields by Tier1 category
  const grouped = {};
  availableFields.forEach(function(field) {
    const category = field.tier1;
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(field);
  });

  // Build categories JSON for modal
  const categoriesJson = JSON.stringify(grouped);
  const selectedJson = JSON.stringify(selectedFields);
  const totalFields = availableFields.length;

  const html =
    '<!DOCTYPE html>' +
    '<html>' +
    '<head>' +
    '<style>' +
    'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; padding: 20px; background: #f5f5f5; margin: 0; }' +
    '.header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }' +
    '.header h2 { margin: 0 0 10px 0; }' +
    '.header p { margin: 0; opacity: 0.9; font-size: 14px; }' +
    '.categories-container { max-height: 500px; overflow-y: auto; padding-right: 10px; }' +
    '.category { background: white; border-radius: 8px; padding: 15px; margin-bottom: 15px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }' +
    '.category-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; padding-bottom: 10px; border-bottom: 2px solid #e0e0e0; }' +
    '.category-title { font-weight: bold; font-size: 16px; color: #333; }' +
    '.category-count { color: #667eea; font-size: 14px; margin-left: 8px; }' +
    '.category-actions button { font-size: 11px; padding: 4px 8px; margin-left: 5px; cursor: pointer; border: 1px solid #ddd; background: white; border-radius: 4px; }' +
    '.category-actions button:hover { background: #f0f0f0; }' +
    '.field-item { padding: 8px; margin: 5px 0; background: #f9f9f9; border-radius: 4px; display: flex; align-items: flex-start; }' +
    '.field-item:hover { background: #f0f0f0; }' +
    '.field-item input { margin-right: 10px; margin-top: 3px; cursor: pointer; }' +
    '.field-item label { cursor: pointer; flex: 1; font-size: 14px; }' +
    '.field-name { font-weight: 500; color: #333; }' +
    '.field-header { color: #666; font-size: 12px; display: block; margin-top: 2px; }' +
    '.footer { position: sticky; bottom: 0; background: white; padding: 15px 20px; border-top: 2px solid #e0e0e0; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 -2px 10px rgba(0,0,0,0.1); margin: 0 -20px -20px -20px; }' +
    '.field-count { font-weight: bold; color: #667eea; font-size: 16px; }' +
    '.btn-continue { background: linear-gradient(135deg, #667eea, #764ba2); color: white; border: none; padding: 12px 24px; border-radius: 6px; font-size: 16px; font-weight: bold; cursor: pointer; transition: all 0.2s; }' +
    '.btn-continue:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4); }' +
    '.btn-continue:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }' +
    '</style>' +
    '</head>' +
    '<body>' +
    '<div class="header">' +
    '  <h2>🎯 Select Fields to Cache</h2>' +
    '  <p>Choose which fields the AI will analyze for pathway discovery</p>' +
    '</div>' +
    '<div class="categories-container" id="categories"></div>' +
    '<div class="footer">' +
    '  <span class="field-count" id="count">Loading...</span>' +
    '  <button class="btn-continue" onclick="continueToCache()">Continue to Cache →</button>' +
    '</div>' +
    '<script>' +
    'const categoriesData = ' + categoriesJson + ';' +
    'const selectedFields = ' + selectedJson + ';' +
    'const totalFields = ' + totalFields + ';' +
    'function renderCategories() {' +
    '  const container = document.getElementById("categories");' +
    '  container.innerHTML = "";' +
    '  for (const [category, fields] of Object.entries(categoriesData)) {' +
    '    const categoryDiv = document.createElement("div");' +
    '    categoryDiv.className = "category";' +
    '    const headerHtml = ' +
    '      `<div class="category-header">` +' +
    '        `<div>` +' +
    '          `<span class="category-title">${category}</span>` +' +
    '          `<span class="category-count">(${fields.length})</span>` +' +
    '        `</div>` +' +
    '        `<div class="category-actions">` +' +
    '          `<button onclick="selectCategory(\\'${category}\\', true)">Select All</button>` +' +
    '          `<button onclick="selectCategory(\\'${category}\\', false)">Deselect All</button>` +' +
    '        `</div>` +' +
    '      `</div>`;' +
    '    categoryDiv.innerHTML = headerHtml;' +
    '    fields.forEach(field => {' +
    '      const isChecked = selectedFields.includes(field.name);' +
    '      const fieldDiv = document.createElement("div");' +
    '      fieldDiv.className = "field-item";' +
    '      fieldDiv.innerHTML = ' +
    '        `<input type="checkbox" id="${field.name}" ${isChecked ? "checked" : ""} onchange="updateCount()">` +' +
    '        `<label for="${field.name}">` +' +
    '          `<span class="field-name">${field.name}</span>` +' +
    '          `<span class="field-header">→ ${field.header}</span>` +' +
    '        `</label>`;' +
    '      categoryDiv.appendChild(fieldDiv);' +
    '    });' +
    '    container.appendChild(categoryDiv);' +
    '  }' +
    '  updateCount();' +
    '}' +
    'function selectCategory(category, select) {' +
    '  categoriesData[category].forEach(field => {' +
    '    const checkbox = document.getElementById(field.name);' +
    '    if (checkbox) checkbox.checked = select;' +
    '  });' +
    '  updateCount();' +
    '}' +
    'function updateCount() {' +
    '  let selected = 0;' +
    '  for (const fields of Object.values(categoriesData)) {' +
    '    fields.forEach(field => {' +
    '      const checkbox = document.getElementById(field.name);' +
    '      if (checkbox && checkbox.checked) selected++;' +
    '    });' +
    '  }' +
    '  document.getElementById("count").textContent = \\`Selected: \\${selected}/\\${totalFields} fields\\`;' +
    '  document.querySelector(".btn-continue").disabled = selected === 0;' +
    '}' +
    'function continueToCache() {' +
    '  const selected = [];' +
    '  for (const fields of Object.values(categoriesData)) {' +
    '    fields.forEach(field => {' +
    '      const checkbox = document.getElementById(field.name);' +
    '      if (checkbox && checkbox.checked) {' +
    '        selected.push(field.name);' +
    '      }' +
    '    });' +
    '  }' +
    '  google.script.run' +
    '    .withSuccessHandler(function() {' +
    '      google.script.host.close();' +
    '    })' +
    '    .withFailureHandler(function(e) {' +
    '      alert("Error saving selection: " + e.message);' +
    '    })' +
    '    .saveFieldSelectionAndStartCache(selected);' +
    '}' +
    'renderCategories();' +
    '</script>' +
    '</body>' +
    '</html>';

  const htmlOutput = HtmlService.createHtmlOutput(html)
    .setWidth(800)
    .setHeight(700);
  SpreadsheetApp.getUi().showModalDialog(htmlOutput, '🎯 Select Fields to Cache');
}

/**
 * Save field selection and start cache
 * Called from field selector modal when user clicks Continue
 */
function saveFieldSelectionAndStartCache(selectedFields) {
  const docProps = PropertiesService.getDocumentProperties();
  docProps.setProperty('SELECTED_CACHE_FIELDS', JSON.stringify(selectedFields));

  Logger.log('✅ Saved field selection: ' + selectedFields.length + ' fields');
  Logger.log('Fields: ' + selectedFields.join(', '));

  // Start the cache process with selected fields
  preCacheRichDataAfterSelection();
}

// END DYNAMIC FIELD SELECTOR SYSTEM
// ═══════════════════════════════════════════════════════════════
`;

console.log('✅ Generated field selector functions\n');
console.log('Functions created:\n');
console.log('  1. getAvailableFields() - Reads ALL columns from spreadsheet');
console.log('  2. generateFieldName_() - Converts headers to camelCase');
console.log('  3. getDefaultFieldNames_() - Returns current 27 fields');
console.log('  4. loadFieldSelection() - Loads saved selection');
console.log('  5. showFieldSelector() - Shows beautiful modal with ALL fields');
console.log('  6. saveFieldSelectionAndStartCache() - Saves and starts cache\n');

console.log('Next steps:\n');
console.log('  1. Add these functions to Phase2 file');
console.log('  2. Rename current preCacheRichData() → preCacheRichDataAfterSelection()');
console.log('  3. Create new preCacheRichData() that calls showFieldSelector()');
console.log('  4. Update performHolisticAnalysis_() to filter by selected fields\n');

console.log('═══════════════════════════════════════════════════════════════\n');

// Save to a file for easy copying
const outputPath = path.join(__dirname, '../docs/FIELD_SELECTOR_FUNCTIONS.gs');
fs.writeFileSync(outputPath, newFunctions, 'utf8');

console.log(`💾 Functions saved to: ${outputPath}\n`);
console.log('Ready to integrate into Phase2 file!\n');
