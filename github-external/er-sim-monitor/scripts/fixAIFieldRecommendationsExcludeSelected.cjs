#!/usr/bin/env node

/**
 * FIX: AI SHOULD ONLY RECOMMEND FROM UNSELECTED FIELDS
 *
 * Problem: AI currently sees all fields and might recommend already-selected ones
 * Solution: Pass currently selected fields to AI, tell it to recommend ONLY from unselected pool
 *
 * Logic:
 * 1. Get currently selected fields (from saved selection or defaults)
 * 2. Get all available fields
 * 3. Send BOTH to AI with instruction: "Don't recommend selected fields, only unselected"
 * 4. AI analyzes unselected pool and returns 8-12 recommendations
 */

const fs = require('fs');
const path = require('path');

console.log('\n🔧 FIXING AI RECOMMENDATIONS TO EXCLUDE SELECTED FIELDS\n');
console.log('═══════════════════════════════════════════════════════════════\n');

const integratedPath = path.join(__dirname, '../apps-script-deployable/Categories_Pathways_Feature_Phase2.gs');
const backupPath = path.join(__dirname, '../backups/phase2-before-exclude-selected-fix-' + new Date().toISOString().slice(0,19).replace(/:/g, '-') + '.gs');

// Read integrated file
const content = fs.readFileSync(integratedPath, 'utf8');

console.log(`📖 Read integrated file: ${(content.length / 1024).toFixed(1)} KB\n`);

// Create backup
fs.writeFileSync(backupPath, content, 'utf8');
console.log(`✅ Backup created: ${path.basename(backupPath)}\n`);

// ═══════════════════════════════════════════════════════════════
// FIX: Update getRecommendedFields_() to receive and filter selected fields
// ═══════════════════════════════════════════════════════════════

const oldAIFunction = /\/\*\*\s*\n \* Get AI-recommended fields based on pathway discovery potential[\s\S]*?function getRecommendedFields_\(\) \{[\s\S]*?catch \(e\) \{[\s\S]*?return getStaticRecommendedFields_\(\);[\s\S]*?\n\}/;

const newAIFunction = `/**
 * Get AI-recommended fields based on pathway discovery potential
 * Asks OpenAI which fields would maximize clinical reasoning pathways
 * Only recommends from unselected fields (excludes currently selected)
 */
function getRecommendedFields_() {
  // Try to get AI recommendations, fall back to static if API unavailable
  try {
    const apiKey = readApiKey_();
    if (!apiKey) {
      Logger.log('⚠️ No API key - using static recommendations');
      return getStaticRecommendedFields_();
    }

    const availableFields = getAvailableFields();
    const currentlySelected = loadFieldSelection(); // Get saved or default fields

    // Filter to only unselected fields
    const unselectedFields = availableFields.filter(function(f) {
      return currentlySelected.indexOf(f.name) === -1;
    });

    const fieldDescriptions = unselectedFields.map(function(f) {
      return {
        name: f.name,
        header: f.header,
        category: f.tier1
      };
    });

    const prompt = 'You are a medical education expert analyzing which data fields would be most valuable for AI pathway discovery in emergency medicine simulation cases.\\n\\n' +
      'CURRENTLY SELECTED FIELDS (already chosen, DO NOT recommend these):\\n' +
      JSON.stringify(currentlySelected, null, 2) + '\\n\\n' +
      'AVAILABLE UNSELECTED FIELDS (choose from these ONLY):\\n' +
      JSON.stringify(fieldDescriptions, null, 2) + '\\n\\n' +
      'PATHWAY DISCOVERY GOALS:\\n' +
      '- Clinical reasoning pathways (differential diagnosis, pattern recognition)\\n' +
      '- Risk stratification pathways (high-risk → low-risk)\\n' +
      '- Time-critical decision pathways (STEMI, stroke, sepsis)\\n' +
      '- Cognitive bias awareness pathways (anchoring, premature closure)\\n' +
      '- Skill progression pathways (novice → expert)\\n' +
      '- Patient complexity pathways (single-system → multi-system)\\n\\n' +
      'TASK: From the UNSELECTED fields only, select 8-12 that would maximize pathway discovery potential.\\n\\n' +
      'PRIORITIZE fields that:\\n' +
      '- Enable differential diagnosis logic\\n' +
      '- Support risk stratification\\n' +
      '- Reveal clinical reasoning patterns\\n' +
      '- Identify time-critical cases\\n' +
      '- Show patient complexity\\n\\n' +
      'IMPORTANT: Only recommend from UNSELECTED fields. Do NOT include any currently selected fields.\\n\\n' +
      'Return ONLY a JSON array of field names: ["fieldName1", "fieldName2", ...]';

    const url = 'https://api.openai.com/v1/chat/completions';
    const payload = {
      model: 'gpt-4o-mini',  // Fast and cheap for recommendations
      messages: [
        {
          role: 'system',
          content: 'You are an expert in medical education and clinical reasoning. Respond ONLY with valid JSON. NEVER recommend fields that are already selected.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,  // Low temperature for consistent recommendations
      max_tokens: 500
    };

    const response = UrlFetchApp.fetch(url, {
      method: 'post',
      headers: {
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });

    const responseCode = response.getResponseCode();
    if (responseCode !== 200) {
      Logger.log('⚠️ OpenAI API error: ' + responseCode + ' - using static recommendations');
      return getStaticRecommendedFields_();
    }

    const data = JSON.parse(response.getContentText());
    const aiResponse = data.choices[0].message.content.trim();

    // Extract JSON array from response
    const jsonMatch = aiResponse.match(/\\[[\\"\\\w\\s,]+\\]/);
    if (!jsonMatch) {
      Logger.log('⚠️ Could not parse AI response - using static recommendations');
      return getStaticRecommendedFields_();
    }

    const recommendedFields = JSON.parse(jsonMatch[0]);

    // Extra safety: Filter out any selected fields AI might have included
    const filteredRecommendations = recommendedFields.filter(function(field) {
      return currentlySelected.indexOf(field) === -1;
    });

    Logger.log('✅ AI recommended ' + filteredRecommendations.length + ' fields from unselected pool');
    Logger.log('   Fields: ' + filteredRecommendations.join(', '));

    return filteredRecommendations;
  } catch (e) {
    Logger.log('⚠️ Error getting AI recommendations: ' + e.message);
    return getStaticRecommendedFields_();
  }
}`;

const updatedContent = content.replace(oldAIFunction, newAIFunction);

if (updatedContent === content) {
  console.error('❌ Could not find getRecommendedFields_() function to replace!');
  process.exit(1);
}

console.log('✅ Updated getRecommendedFields_() to exclude selected fields\n');

// Write updated content
fs.writeFileSync(integratedPath, updatedContent, 'utf8');

const finalSizeKB = (updatedContent.length / 1024).toFixed(1);

console.log('✅ Updated integrated file written\n');
console.log('═══════════════════════════════════════════════════════════════\n');
console.log('✅ AI RECOMMENDATIONS NOW EXCLUDE SELECTED FIELDS!\n');
console.log(`   File size: ${finalSizeKB} KB\n`);
console.log('How it works NOW:\n');
console.log('   1. User opens field selector');
console.log('   2. System reads currently selected fields (saved or default 27)');
console.log('   3. System reads ALL available fields from spreadsheet');
console.log('   4. Filters to only UNSELECTED fields');
console.log('   5. Sends unselected fields to OpenAI GPT-4o-mini');
console.log('   6. AI analyzes unselected pool only');
console.log('   7. AI returns 8-12 recommendations from unselected fields');
console.log('   8. Extra safety filter removes any selected fields AI included');
console.log('   9. Modal shows intelligent recommendations in "Recommended" section\n');
console.log('Three-Tier Logic:\n');
console.log('   ✅ Tier 1: Currently selected fields (top, unchanged)');
console.log('   ✅ Tier 2: AI recommendations from unselected pool (middle)');
console.log('   ✅ Tier 3: All other unselected, unrecommended fields (bottom)\n');
console.log('AI now understands:\n');
console.log('   • Which fields are already selected (won\'t recommend)');
console.log('   • Which fields are available to recommend (unselected pool)');
console.log('   • Goal: Suggest next-best fields beyond current selection\n');
console.log('Next step:\n');
console.log('   Deploy to TEST spreadsheet\n');
console.log('═══════════════════════════════════════════════════════════════\n');
