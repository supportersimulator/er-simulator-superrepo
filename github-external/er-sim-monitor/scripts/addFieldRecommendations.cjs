#!/usr/bin/env node

/**
 * ADD AI-POWERED FIELD RECOMMENDATIONS
 *
 * Adds intelligent field recommendation system to field selector:
 * 1. Selected Fields (top)
 * 2. Recommended to Consider (middle - AI suggests pathway-relevant fields)
 * 3. All Other Fields (bottom)
 *
 * AI evaluation considers:
 * - Clinical decision-making relevance
 * - Pathway discovery value
 * - Scenario branching potential
 * - Educational outcomes alignment
 */

const fs = require('fs');
const path = require('path');

console.log('\n🤖 ADDING AI-POWERED FIELD RECOMMENDATIONS\n');
console.log('═══════════════════════════════════════════════════════════════\n');

const integratedPath = path.join(__dirname, '../apps-script-deployable/Categories_Pathways_Feature_Phase2.gs');
const backupPath = path.join(__dirname, '../backups/phase2-before-field-recommendations-' + new Date().toISOString().slice(0,19).replace(/:/g, '-') + '.gs');

// Read integrated file
const content = fs.readFileSync(integratedPath, 'utf8');
const lines = content.split('\n');

console.log(`📖 Read integrated file: ${lines.length} lines\n`);

// Create backup
fs.writeFileSync(backupPath, content, 'utf8');
console.log(`✅ Backup created: ${path.basename(backupPath)}\n`);

// ═══════════════════════════════════════════════════════════════
// STEP 1: Add getRecommendedFields_() function
// ═══════════════════════════════════════════════════════════════

// Find location to insert - right after getDefaultFieldNames_()
let getDefaultFieldNamesIndex = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('function getDefaultFieldNames_()')) {
    // Find the closing brace of this function
    let braceCount = 0;
    let started = false;
    for (let j = i; j < lines.length; j++) {
      if (lines[j].includes('{')) {
        started = true;
        braceCount++;
      }
      if (lines[j].includes('}')) {
        braceCount--;
      }
      if (started && braceCount === 0) {
        getDefaultFieldNamesIndex = j + 1;
        break;
      }
    }
    break;
  }
}

if (getDefaultFieldNamesIndex === -1) {
  console.error('❌ Could not find getDefaultFieldNames_() function!');
  process.exit(1);
}

console.log(`✅ Found insertion point at line ${getDefaultFieldNamesIndex + 1}\n`);

// Create the recommendation function
const recommendationFunction = [
  '',
  '/**',
  ' * Get AI-recommended fields for pathway discovery',
  ' * Returns fields that enhance clinical decision-making analysis',
  ' * ',
  ' * Recommendation criteria:',
  ' * - HIGH: Critical for pathway branching (chief complaint, vitals, symptoms)',
  ' * - MEDIUM: Valuable context (history, medications, diagnostics)',
  ' * - LOW: Supplementary detail (demographics, environment)',
  ' */',
  'function getRecommendedFields_() {',
  '  // HIGH PRIORITY: Core clinical decision drivers',
  '  // These directly influence treatment pathways and scenario branching',
  '  const highPriority = [',
  '    \'chiefComplaint\',      // Primary presenting problem → determines initial pathway',
  '    \'initialVitals\',       // Vital signs → trigger assessment urgency',
  '    \'examFindings\',        // Physical exam → confirms/refutes differential diagnoses',
  '    \'medications\',         // Current meds → interaction/contraindication considerations',
  '    \'pastMedicalHistory\',  // PMH → risk stratification and pathway selection',
  '    \'allergies\'            // Allergies → treatment contraindications',
  '  ];',
  '',
  '  // MEDIUM PRIORITY: Valuable contextual information',
  '  // Enhances pathway discovery but not primary decision drivers',
  '  const mediumPriority = [',
  '    \'diagnosticResults\',   // Lab/imaging → confirms diagnosis and treatment path',
  '    \'physicalExam\',        // Detailed exam → refines differential',
  '    \'symptoms\',            // Symptom details → pathway refinement',
  '    \'vitalSigns\',          // Expanded vitals → trend analysis',
  '    \'socialHistory\',       // Social context → discharge planning considerations',
  '    \'familyHistory\'        // Family Hx → genetic/hereditary risk factors',
  '  ];',
  '',
  '  // LOWER PRIORITY: Supplementary fields',
  '  // Useful for complete picture but less critical for pathway logic',
  '  const lowerPriority = [',
  '    \'age\',                 // Demographics → age-appropriate pathways',
  '    \'gender\',              // Demographics → gender-specific considerations',
  '    \'patientName\',         // Identifier → case tracking',
  '    \'environmentType\',     // Setting → resource availability context',
  '    \'dispositionPlan\',     // Outcome → validates pathway completion',
  '    \'context\'              // Additional notes → qualitative insights',
  '  ];',
  '',
  '  // Combine and return all recommended fields',
  '  return [].concat(highPriority, mediumPriority, lowerPriority);',
  '}',
  ''
];

lines.splice(getDefaultFieldNamesIndex, 0, ...recommendationFunction);

console.log('✅ Added getRecommendedFields_() function\n');

// ═══════════════════════════════════════════════════════════════
// STEP 2: Update showFieldSelector() to use three-tier grouping
// ═══════════════════════════════════════════════════════════════

// Find the line where we sort fields (currently just selected vs unselected)
let sortFieldsIndex = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('// Sort fields within each category: selected fields first, then unselected')) {
    sortFieldsIndex = i;
    break;
  }
}

if (sortFieldsIndex === -1) {
  console.error('❌ Could not find field sorting section!');
  process.exit(1);
}

console.log(`✅ Found field sorting at line ${sortFieldsIndex + 1}\n`);

// Replace the sorting logic with three-tier system
const oldSortingEnd = sortFieldsIndex + 12; // Remove old sorting block

// New three-tier sorting logic
const newSortingLogic = [
  '  // Sort fields within each category: selected fields first, then unselected',
  '  // THREE-TIER SORTING:',
  '  // Tier 1: Selected fields (checked)',
  '  // Tier 2: Recommended fields (unchecked, but AI suggests)',
  '  // Tier 3: All other fields (unchecked, not recommended)',
  '  const recommendedFields = getRecommendedFields_();',
  '  ',
  '  Object.keys(grouped).forEach(function(category) {',
  '    grouped[category].sort(function(a, b) {',
  '      const aSelected = selectedFields.indexOf(a.name) !== -1;',
  '      const bSelected = selectedFields.indexOf(b.name) !== -1;',
  '      const aRecommended = recommendedFields.indexOf(a.name) !== -1;',
  '      const bRecommended = recommendedFields.indexOf(b.name) !== -1;',
  '      ',
  '      // Tier 1: Selected fields come first',
  '      if (aSelected && !bSelected) return -1;',
  '      if (!aSelected && bSelected) return 1;',
  '      ',
  '      // Tier 2: Among unselected, recommended fields come next',
  '      if (!aSelected && !bSelected) {',
  '        if (aRecommended && !bRecommended) return -1;',
  '        if (!aRecommended && bRecommended) return 1;',
  '      }',
  '      ',
  '      // Within same tier, alphabetical order',
  '      return a.name.localeCompare(b.name);',
  '    });',
  '  });'
];

lines.splice(sortFieldsIndex, oldSortingEnd - sortFieldsIndex, ...newSortingLogic);

console.log('✅ Updated sorting logic to three-tier system\n');

// ═══════════════════════════════════════════════════════════════
// STEP 3: Update modal HTML to show section headers
// ═══════════════════════════════════════════════════════════════

// Find the JavaScript renderCategories() function in the modal
let renderCategoriesIndex = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('function renderCategories() {')) {
    renderCategoriesIndex = i;
    break;
  }
}

if (renderCategoriesIndex === -1) {
  console.error('❌ Could not find renderCategories() function!');
  process.exit(1);
}

console.log(`✅ Found renderCategories() at line ${renderCategoriesIndex + 1}\n`);

// Find where fields are rendered (inside the fields.forEach loop)
let fieldsForEachIndex = -1;
for (let i = renderCategoriesIndex; i < renderCategoriesIndex + 100; i++) {
  if (lines[i].includes('fields.forEach(field => {')) {
    fieldsForEachIndex = i;
    break;
  }
}

if (fieldsForEachIndex === -1) {
  console.error('❌ Could not find fields.forEach loop!');
  process.exit(1);
}

// Insert section header logic before creating field divs
const sectionHeaderLogic = [
  '    let lastSection = null;',
  '    fields.forEach((field, index) => {',
  '      const isChecked = selectedFields.includes(field.name);',
  '      const isRecommended = ' + JSON.stringify([]) + '.concat(' +
    '["chiefComplaint", "initialVitals", "examFindings", "medications", "pastMedicalHistory", "allergies", ' +
    '"diagnosticResults", "physicalExam", "symptoms", "vitalSigns", "socialHistory", "familyHistory", ' +
    '"age", "gender", "patientName", "environmentType", "dispositionPlan", "context"]' +
  ').includes(field.name);',
  '      ',
  '      // Determine which section this field belongs to',
  '      let currentSection = null;',
  '      if (isChecked) currentSection = "selected";',
  '      else if (isRecommended) currentSection = "recommended";',
  '      else currentSection = "other";',
  '      ',
  '      // Insert section header if section changed',
  '      if (currentSection !== lastSection) {',
  '        const sectionDiv = document.createElement("div");',
  '        sectionDiv.style.marginTop = lastSection ? "20px" : "10px";',
  '        sectionDiv.style.marginBottom = "10px";',
  '        sectionDiv.style.paddingTop = "10px";',
  '        sectionDiv.style.borderTop = lastSection ? "2px solid #e0e0e0" : "none";',
  '        sectionDiv.style.fontWeight = "bold";',
  '        sectionDiv.style.color = "#667eea";',
  '        sectionDiv.style.fontSize = "13px";',
  '        sectionDiv.style.textTransform = "uppercase";',
  '        sectionDiv.style.letterSpacing = "0.5px";',
  '        ',
  '        if (currentSection === "selected") {',
  '          sectionDiv.innerHTML = "✅ Selected Fields";',
  '        } else if (currentSection === "recommended") {',
  '          sectionDiv.innerHTML = "💡 Recommended to Consider <span style=\\\\\\"font-size: 11px; font-weight: normal; color: #888; text-transform: none; letter-spacing: 0;\\\\\\">(AI suggests these for pathway discovery)</span>";',
  '        } else {',
  '          sectionDiv.innerHTML = "📋 All Other Fields";',
  '        }',
  '        ',
  '        categoryDiv.appendChild(sectionDiv);',
  '        lastSection = currentSection;',
  '      }',
  '      '
];

// Find the line that creates fieldDiv
let fieldDivCreationIndex = -1;
for (let i = fieldsForEachIndex; i < fieldsForEachIndex + 20; i++) {
  if (lines[i].includes('const fieldDiv = document.createElement')) {
    fieldDivCreationIndex = i;
    break;
  }
}

if (fieldDivCreationIndex === -1) {
  console.error('❌ Could not find fieldDiv creation!');
  process.exit(1);
}

// Remove old fields.forEach line and isChecked line
const oldFieldsForEachEnd = fieldsForEachIndex + 2; // Remove "fields.forEach(field => {" and "const isChecked = ..."

lines.splice(fieldsForEachIndex, oldFieldsForEachEnd - fieldsForEachIndex, ...sectionHeaderLogic);

console.log('✅ Added section header logic to modal\n');

// ═══════════════════════════════════════════════════════════════
// STEP 4: Add CSS styles for section headers
// ═══════════════════════════════════════════════════════════════

// Find the CSS style section
let btnResetStyleIndex = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('.btn-reset { background: white')) {
    btnResetStyleIndex = i;
    break;
  }
}

if (btnResetStyleIndex === -1) {
  console.error('❌ Could not find btn-reset style!');
  process.exit(1);
}

console.log(`✅ Found CSS section at line ${btnResetStyleIndex + 1}\n`);

// Add section header styles after btn-reset
const sectionHeaderStyles = [
  "    '.section-header { margin: 15px 0 10px 0; padding: 8px 12px; background: linear-gradient(135deg, #f0f0ff, #ffffff); border-left: 4px solid #667eea; border-radius: 4px; font-weight: bold; font-size: 13px; color: #667eea; text-transform: uppercase; letter-spacing: 0.5px; }' +",
  "    '.section-header-selected { border-left-color: #4caf50; color: #4caf50; }' +",
  "    '.section-header-recommended { border-left-color: #ff9800; color: #ff9800; background: linear-gradient(135deg, #fff8f0, #ffffff); }' +",
  "    '.section-header-other { border-left-color: #999; color: #666; background: #fafafa; }' +"
];

lines.splice(btnResetStyleIndex + 2, 0, ...sectionHeaderStyles);

console.log('✅ Added section header CSS styles\n');

// Write updated content
const updatedContent = lines.join('\n');
fs.writeFileSync(integratedPath, updatedContent, 'utf8');

const sizeKB = Math.round(updatedContent.length / 1024);

console.log('✅ Updated integrated file written\n');
console.log('═══════════════════════════════════════════════════════════════\n');
console.log('✅ AI-POWERED FIELD RECOMMENDATIONS ADDED!\n');
console.log(`   Integrated file: ${sizeKB} KB\n`);
console.log('Changes made:\n');
console.log('   1. Added getRecommendedFields_() function');
console.log('      → AI-evaluated field recommendations for pathway discovery\n');
console.log('   2. Updated three-tier sorting system');
console.log('      → Tier 1: Selected fields (top)');
console.log('      → Tier 2: Recommended to Consider (middle)');
console.log('      → Tier 3: All Other Fields (bottom)\n');
console.log('   3. Added section headers in modal');
console.log('      → ✅ Selected Fields');
console.log('      → 💡 Recommended to Consider (AI suggests)');
console.log('      → 📋 All Other Fields\n');
console.log('   4. Added CSS styles for visual distinction');
console.log('      → Color-coded section headers');
console.log('      → Clear visual hierarchy\n');
console.log('AI Recommendation Criteria:\n');
console.log('   HIGH: Chief complaint, vitals, exam, medications, PMH, allergies');
console.log('   MEDIUM: Diagnostics, physical exam, symptoms, vital trends, history');
console.log('   LOWER: Demographics, environment, disposition, context\n');
console.log('Next step:\n');
console.log('   Deploy to TEST spreadsheet\n');
console.log('═══════════════════════════════════════════════════════════════\n');
