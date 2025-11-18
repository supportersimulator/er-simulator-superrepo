#!/usr/bin/env node

/**
 * ADD AI-POWERED DYNAMIC FIELD RECOMMENDATIONS
 *
 * Instead of hardcoded recommendations, AI analyzes available fields
 * and recommends which ones will maximize pathway discovery potential.
 *
 * AI considers:
 * - Clinical decision-making value
 * - Pathway grouping potential
 * - Pattern recognition opportunities
 * - Differential diagnosis support
 * - Educational scaffolding value
 */

const fs = require('fs');
const path = require('path');

console.log('\n🤖 ADDING AI-POWERED FIELD RECOMMENDATIONS\n');
console.log('═══════════════════════════════════════════════════════════════\n');

const integratedPath = path.join(__dirname, '../apps-script-deployable/Categories_Pathways_Feature_Phase2.gs');
const backupPath = path.join(__dirname, '../backups/phase2-before-ai-field-recommendations-' + new Date().toISOString().slice(0,19).replace(/:/g, '-') + '.gs');

// Read integrated file
const content = fs.readFileSync(integratedPath, 'utf8');

console.log(`📖 Read integrated file: ${(content.length / 1024).toFixed(1)} KB\n`);

// Create backup
fs.writeFileSync(backupPath, content, 'utf8');
console.log(`✅ Backup created: ${path.basename(backupPath)}\n`);

// ═══════════════════════════════════════════════════════════════
// STEP 1: Replace getRecommendedFields_() with AI-powered version
// ═══════════════════════════════════════════════════════════════

const oldRecommendedFieldsFunction = /\/\*\*[\s\S]*?\*\/\s*function getRecommendedFields_\(\) \{[\s\S]*?\n\}/;

const newAIPoweredFunction = `
/**
 * Get AI-recommended fields based on pathway discovery potential
 * Asks OpenAI which fields would maximize clinical reasoning pathways
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
    const fieldDescriptions = availableFields.map(function(f) {
      return {
        name: f.name,
        header: f.header,
        category: f.tier1
      };
    });

    const prompt = 'You are a medical education expert analyzing which data fields would be most valuable for AI pathway discovery in emergency medicine simulation cases.\\n\\n' +
      'AVAILABLE FIELDS:\\n' + JSON.stringify(fieldDescriptions, null, 2) + '\\n\\n' +
      'PATHWAY DISCOVERY GOALS:\\n' +
      '- Clinical reasoning pathways (differential diagnosis, pattern recognition)\\n' +
      '- Risk stratification pathways (high-risk → low-risk)\\n' +
      '- Time-critical decision pathways (STEMI, stroke, sepsis)\\n' +
      '- Cognitive bias awareness pathways (anchoring, premature closure)\\n' +
      '- Skill progression pathways (novice → expert)\\n' +
      '- Patient complexity pathways (single-system → multi-system)\\n\\n' +
      'TASK: Select 8-12 fields that would maximize pathway discovery potential.\\n\\n' +
      'PRIORITIZE fields that:\\n' +
      '- Enable differential diagnosis logic\\n' +
      '- Support risk stratification\\n' +
      '- Reveal clinical reasoning patterns\\n' +
      '- Identify time-critical cases\\n' +
      '- Show patient complexity\\n\\n' +
      'Return ONLY a JSON array of field names: ["fieldName1", "fieldName2", ...]';

    const url = 'https://api.openai.com/v1/chat/completions';
    const payload = {
      model: 'gpt-4o-mini',  // Fast and cheap for recommendations
      messages: [
        {
          role: 'system',
          content: 'You are an expert in medical education and clinical reasoning. Respond ONLY with valid JSON.'
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
    const jsonMatch = aiResponse.match(/\\[[\\"\\w\\s,]+\\]/);
    if (!jsonMatch) {
      Logger.log('⚠️ Could not parse AI response - using static recommendations');
      return getStaticRecommendedFields_();
    }

    const recommendedFields = JSON.parse(jsonMatch[0]);
    Logger.log('✅ AI recommended ' + recommendedFields.length + ' fields for pathway discovery');
    Logger.log('   Fields: ' + recommendedFields.join(', '));

    return recommendedFields;
  } catch (e) {
    Logger.log('⚠️ Error getting AI recommendations: ' + e.message);
    return getStaticRecommendedFields_();
  }
}

/**
 * Static fallback recommendations (used when API unavailable)
 */
function getStaticRecommendedFields_() {
  // HIGH PRIORITY: Core clinical decision drivers
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

const updatedContent = content.replace(oldRecommendedFieldsFunction, newAIPoweredFunction);

if (updatedContent === content) {
  console.error('❌ Could not find getRecommendedFields_() function to replace!');
  process.exit(1);
}

console.log('✅ Replaced getRecommendedFields_() with AI-powered version\n');

// Write updated content
fs.writeFileSync(integratedPath, updatedContent, 'utf8');

const finalSizeKB = (updatedContent.length / 1024).toFixed(1);

console.log('✅ Updated integrated file written\n');
console.log('═══════════════════════════════════════════════════════════════\n');
console.log('✅ AI-POWERED FIELD RECOMMENDATIONS ADDED!\n');
console.log(`   File size: ${finalSizeKB} KB\n`);
console.log('How it works:\n');
console.log('   1. User opens field selector');
console.log('   2. System reads ALL available fields from spreadsheet');
console.log('   3. Sends field list to OpenAI GPT-4o-mini');
console.log('   4. AI analyzes which fields enable best pathway discovery');
console.log('   5. AI returns 8-12 recommended field names');
console.log('   6. Modal shows AI recommendations in "Recommended" section');
console.log('   7. User sees intelligent, data-driven suggestions\n');
console.log('AI Evaluation Criteria:\n');
console.log('   ✅ Differential diagnosis support');
console.log('   ✅ Risk stratification potential');
console.log('   ✅ Clinical reasoning pattern detection');
console.log('   ✅ Time-critical case identification');
console.log('   ✅ Patient complexity indicators\n');
console.log('Fallback System:\n');
console.log('   • If API unavailable → uses static recommendations');
console.log('   • If API error → graceful degradation');
console.log('   • Fast response (gpt-4o-mini, low temperature)\n');
console.log('Cost Optimization:\n');
console.log('   • Uses gpt-4o-mini (20x cheaper than gpt-4)');
console.log('   • Temperature 0.3 (consistent, fast)');
console.log('   • Max 500 tokens (~$0.0001 per request)');
console.log('   • Only called once when field selector opens\n');
console.log('Next step:\n');
console.log('   Deploy to TEST spreadsheet\n');
console.log('═══════════════════════════════════════════════════════════════\n');
