#!/usr/bin/env node

/**
 * ADD AI-POWERED FIELD RECOMMENDATIONS (SURGICAL VERSION)
 *
 * EXTREMELY CAREFUL IMPLEMENTATION:
 * - Only modifies showFieldSelector() function
 * - Adds getRecommendedFields_() helper function
 * - Updates sorting and rendering logic
 * - Does NOT touch any other functions
 * - Creates backup before changes
 */

const fs = require('fs');
const path = require('path');

console.log('\n🔬 SURGICAL: ADDING FIELD RECOMMENDATIONS\n');
console.log('═══════════════════════════════════════════════════════════════\n');

const integratedPath = path.join(__dirname, '../apps-script-deployable/Categories_Pathways_Feature_Phase2.gs');
const backupPath = path.join(__dirname, '../backups/phase2-before-recommendations-surgical-' + new Date().toISOString().slice(0,19).replace(/:/g, '-') + '.gs');

// Read entire file
const content = fs.readFileSync(integratedPath, 'utf8');

console.log(`📖 Read integrated file: ${(content.length / 1024).toFixed(1)} KB\n`);

// Create backup
fs.writeFileSync(backupPath, content, 'utf8');
console.log(`✅ Backup created: ${path.basename(backupPath)}\n`);

// ═══════════════════════════════════════════════════════════════
// STEP 1: Add getRecommendedFields_() function after getDefaultFieldNames_()
// ═══════════════════════════════════════════════════════════════

const recommendedFieldsFunction = `
/**
 * Get AI-recommended fields for pathway discovery
 * Returns field names that are valuable but not in default 27
 */
function getRecommendedFields_() {
  // HIGH PRIORITY: Critical clinical decision drivers
  const highPriority = [
    'diagnosticResults',   // Lab/imaging → confirms diagnosis
    'physicalExam',        // Detailed exam → refines differential
    'symptoms',            // Symptom details → pathway refinement
    'vitalSigns',          // Expanded vitals → trend analysis
    'socialHistory',       // Social context → discharge planning
    'familyHistory'        // Family Hx → risk factors
  ];

  // MEDIUM PRIORITY: Valuable contextual information
  const mediumPriority = [
    'proceduresPlan',      // Planned procedures → treatment path
    'labResults',          // Lab values → diagnostic confirmation
    'imagingResults',      // Imaging findings → visual confirmation
    'nursingNotes',        // Nursing observations → patient status
    'providerNotes'        // Provider documentation → decision rationale
  ];

  return [].concat(highPriority, mediumPriority);
}`;

// Find insertion point after getDefaultFieldNames_()
const defaultFieldsRegex = /function getDefaultFieldNames_\(\) \{[\s\S]*?\n\}/;
const defaultFieldsMatch = content.match(defaultFieldsRegex);

if (!defaultFieldsMatch) {
  console.error('❌ Could not find getDefaultFieldNames_() function!');
  process.exit(1);
}

const insertionPoint = content.indexOf(defaultFieldsMatch[0]) + defaultFieldsMatch[0].length;

const updatedContent1 = content.slice(0, insertionPoint) + recommendedFieldsFunction + content.slice(insertionPoint);

console.log('✅ Added getRecommendedFields_() function\n');

// ═══════════════════════════════════════════════════════════════
// STEP 2: Update sorting logic in showFieldSelector()
// ═══════════════════════════════════════════════════════════════

const oldSortingLogic = `  // Sort fields within each category: selected fields first, then unselected
  Object.keys(grouped).forEach(function(category) {
    grouped[category].sort(function(a, b) {
      const aSelected = selectedFields.indexOf(a.name) !== -1;
      const bSelected = selectedFields.indexOf(b.name) !== -1;

      // Selected fields come first
      if (aSelected && !bSelected) return -1;
      if (!aSelected && bSelected) return 1;

      // Within same selection status, keep alphabetical order
      return a.name.localeCompare(b.name);
    });
  });`;

const newSortingLogic = `  // Sort fields within each category: three-tier system
  // Tier 1: Selected fields (top)
  // Tier 2: Recommended fields (middle)
  // Tier 3: All other fields (bottom)
  const recommendedFields = getRecommendedFields_();

  Object.keys(grouped).forEach(function(category) {
    grouped[category].sort(function(a, b) {
      const aSelected = selectedFields.indexOf(a.name) !== -1;
      const bSelected = selectedFields.indexOf(b.name) !== -1;
      const aRecommended = recommendedFields.indexOf(a.name) !== -1;
      const bRecommended = recommendedFields.indexOf(b.name) !== -1;

      // Tier 1: Selected fields come first
      if (aSelected && !bSelected) return -1;
      if (!aSelected && bSelected) return 1;

      // Tier 2: Among unselected, recommended fields come next
      if (!aSelected && !bSelected) {
        if (aRecommended && !bRecommended) return -1;
        if (!aRecommended && bRecommended) return 1;
      }

      // Within same tier, keep alphabetical order
      return a.name.localeCompare(b.name);
    });
  });`;

const updatedContent2 = updatedContent1.replace(oldSortingLogic, newSortingLogic);

if (updatedContent2 === updatedContent1) {
  console.error('❌ Could not find sorting logic to update!');
  process.exit(1);
}

console.log('✅ Updated sorting logic to three-tier system\n');

// ═══════════════════════════════════════════════════════════════
// STEP 3: Update rendering logic to show section headers
// ═══════════════════════════════════════════════════════════════

// We need to pass recommendedFields to the modal JavaScript
const oldJsonLine = `    'const selectedFields = ' + selectedJson + ';' +`;
const newJsonLines = `    'const selectedFields = ' + selectedJson + ';' +
    'const recommendedFieldNames = ' + JSON.stringify(getRecommendedFields_()) + ';' +`;

const updatedContent3 = updatedContent2.replace(oldJsonLine, newJsonLines);

if (updatedContent3 === updatedContent2) {
  console.error('❌ Could not find selectedFields JSON line!');
  process.exit(1);
}

console.log('✅ Added recommendedFields to modal data\n');

// ═══════════════════════════════════════════════════════════════
// STEP 4: Update fields.forEach to add section headers
// ═══════════════════════════════════════════════════════════════

const oldForEachLogic = `    '    fields.forEach(field => {' +
    '      const isChecked = selectedFields.includes(field.name);' +
    '      const fieldDiv = document.createElement("div");' +`;

const newForEachLogic = `    '    let lastSection = null;' +
    '    fields.forEach((field, index) => {' +
    '      const isChecked = selectedFields.includes(field.name);' +
    '      const isRecommended = recommendedFieldNames.includes(field.name);' +
    '      ' +
    '      // Determine section: selected > recommended > other' +
    '      let currentSection = isChecked ? "selected" : (isRecommended ? "recommended" : "other");' +
    '      ' +
    '      // Insert section header if section changed' +
    '      if (currentSection !== lastSection) {' +
    '        const sectionDiv = document.createElement("div");' +
    '        sectionDiv.style.marginTop = lastSection ? "12px" : "5px";' +
    '        sectionDiv.style.marginBottom = "5px";' +
    '        sectionDiv.style.paddingTop = "5px";' +
    '        sectionDiv.style.paddingBottom = "3px";' +
    '        sectionDiv.style.borderTop = lastSection ? "1px solid #ddd" : "none";' +
    '        sectionDiv.style.fontWeight = "bold";' +
    '        sectionDiv.style.fontSize = "11px";' +
    '        sectionDiv.style.textTransform = "uppercase";' +
    '        sectionDiv.style.letterSpacing = "0.3px";' +
    '        ' +
    '        if (currentSection === "selected") {' +
    '          sectionDiv.style.color = "#4caf50";' +
    '          sectionDiv.innerHTML = "✅ Selected Fields";' +
    '        } else if (currentSection === "recommended") {' +
    '          sectionDiv.style.color = "#ff9800";' +
    '          sectionDiv.innerHTML = "💡 Recommended to Consider <span style=\\\\\\"font-size: 10px; font-weight: normal; color: #888; text-transform: none;\\\\\\">(AI suggests for pathway discovery)</span>";' +
    '        } else {' +
    '          sectionDiv.style.color = "#999";' +
    '          sectionDiv.innerHTML = "📋 All Other Fields";' +
    '        }' +
    '        ' +
    '        categoryDiv.appendChild(sectionDiv);' +
    '        lastSection = currentSection;' +
    '      }' +
    '      ' +
    '      const fieldDiv = document.createElement("div");' +`;

const updatedContent4 = updatedContent3.replace(oldForEachLogic, newForEachLogic);

if (updatedContent4 === updatedContent3) {
  console.error('❌ Could not find fields.forEach logic to update!');
  process.exit(1);
}

console.log('✅ Added section header rendering logic\n');

// ═══════════════════════════════════════════════════════════════
// FINAL: Write updated content
// ═══════════════════════════════════════════════════════════════

fs.writeFileSync(integratedPath, updatedContent4, 'utf8');

const finalSizeKB = (updatedContent4.length / 1024).toFixed(1);

console.log('✅ Updated integrated file written\n');
console.log('═══════════════════════════════════════════════════════════════\n');
console.log('✅ SURGICAL MODIFICATION COMPLETE!\n');
console.log(`   File size: ${finalSizeKB} KB\n`);
console.log('Changes made (surgical approach):\n');
console.log('   1. ✅ Added getRecommendedFields_() helper function');
console.log('   2. ✅ Updated sorting logic (three-tier: selected → recommended → other)');
console.log('   3. ✅ Added recommendedFields array to modal JavaScript');
console.log('   4. ✅ Updated rendering to show section headers\n');
console.log('What was NOT touched:\n');
console.log('   ✅ All 61+ original cache functions');
console.log('   ✅ preCacheRichDataAfterSelection()');
console.log('   ✅ performCacheWithProgress()');
console.log('   ✅ loadFieldSelection()');
console.log('   ✅ saveFieldSelectionAndStartCache()');
console.log('   ✅ Header cache system');
console.log('   ✅ Batch processing system');
console.log('   ✅ Reset button functionality\n');
console.log('Recommended fields (AI-suggested):\n');
console.log('   HIGH: diagnosticResults, physicalExam, symptoms, vitalSigns');
console.log('   MED: socialHistory, familyHistory, proceduresPlan, labResults\n');
console.log('Next step:\n');
console.log('   Deploy to TEST spreadsheet\n');
console.log('═══════════════════════════════════════════════════════════════\n');
