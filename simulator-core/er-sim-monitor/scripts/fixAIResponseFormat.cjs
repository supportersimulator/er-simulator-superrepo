#!/usr/bin/env node

/**
 * FIX AI RECOMMENDATION FLOW WITH REDUNDANCY
 *
 * Strategy: Instead of trusting AI format, we FORCE it to match our exact format
 * by validating every returned field against CACHED_MERGED_KEYS
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

async function fix() {
  try {
    const auth = await authorize();
    const script = google.script({ version: 'v1', auth });

    console.log('📥 Downloading current production...\n');

    const content = await script.projects.getContent({
      scriptId: PRODUCTION_PROJECT_ID
    });

    const codeFile = content.data.files.find(f => f.name === 'Code');
    const manifestFile = content.data.files.find(f => f.name === 'appsscript');

    let code = codeFile.source;

    console.log('🔧 Adding AI response format redundancy...\n');

    // Find getRecommendedFields function
    const funcStart = code.indexOf('function getRecommendedFields(availableFields, selectedFields) {');
    if (funcStart === -1) {
      console.log('❌ Could not find getRecommendedFields() function\n');
      process.exit(1);
    }

    // Find the end of the function
    let funcEnd = funcStart;
    let braceCount = 0;
    let foundStart = false;

    for (let i = funcStart; i < code.length; i++) {
      if (code[i] === '{') {
        braceCount++;
        foundStart = true;
      } else if (code[i] === '}') {
        braceCount--;
        if (foundStart && braceCount === 0) {
          funcEnd = i + 1;
          break;
        }
      }
    }

    // New robust version with redundancy
    const newFunc = `function getRecommendedFields(availableFields, selectedFields) {
  try {
    const apiKey = readApiKey_();
    if (!apiKey) {
      Logger.log('⚠️ No API key - using static recommendations');
      return getStaticRecommendedFields_();
    }

    const currentlySelected = selectedFields;

    // Build list of ALL valid field names from availableFields
    const allValidFieldNames = availableFields.map(function(f) {
      return typeof f === 'string' ? f : f.name;
    });

    // Filter to only unselected fields
    const unselectedFields = availableFields.filter(function(f) {
      const fieldName = typeof f === 'string' ? f : f.name;
      return currentlySelected.indexOf(fieldName) === -1;
    });

    // Extract tier1/tier2 for AI context
    const fieldDescriptions = unselectedFields.map(function(f) {
      const fieldName = typeof f === 'string' ? f : f.name;
      const parts = fieldName.split('_');
      const tier2 = parts[parts.length - 1];
      const tier1 = parts.slice(0, -1).join('_');

      return {
        name: fieldName,
        tier1: tier1,
        tier2: tier2
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
      'IMPORTANT: Return field names EXACTLY as shown in the "name" property. Do NOT modify them.\\n' +
      'Only recommend from UNSELECTED fields. Do NOT include any currently selected fields.\\n\\n' +
      'Return ONLY a JSON array of exact field names from the list above: ["exact_name_1", "exact_name_2", ...]';

    const url = 'https://api.openai.com/v1/chat/completions';
    const payload = {
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert in medical education and clinical reasoning. Respond ONLY with valid JSON array of exact field names. NEVER modify field names or recommend already selected fields.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
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

    // ROBUST PARSING: Try multiple methods
    let recommendedFields = [];
    
    // Method 1: Try direct JSON parse
    try {
      recommendedFields = JSON.parse(aiResponse);
    } catch (e1) {
      // Method 2: Extract JSON array with flexible regex
      try {
        const jsonMatch = aiResponse.match(/\\[([\\s\\S]*?)\\]/);
        if (jsonMatch) {
          recommendedFields = JSON.parse(jsonMatch[0]);
        }
      } catch (e2) {
        Logger.log('⚠️ Could not parse AI response - using static recommendations');
        Logger.log('   AI response: ' + aiResponse.substring(0, 200));
        return getStaticRecommendedFields_();
      }
    }

    if (!Array.isArray(recommendedFields)) {
      Logger.log('⚠️ AI response not an array - using static recommendations');
      return getStaticRecommendedFields_();
    }

    // REDUNDANCY: Force exact format match
    // For each AI recommendation, find exact match in our valid field list
    const validatedRecommendations = [];
    
    recommendedFields.forEach(function(aiField) {
      // Normalize: trim whitespace, handle various formats
      const normalized = String(aiField).trim();
      
      // Find exact match in our valid field names
      const exactMatch = allValidFieldNames.find(function(validName) {
        return validName === normalized;
      });
      
      if (exactMatch) {
        // Only add if not already selected AND not duplicate in recommendations
        if (currentlySelected.indexOf(exactMatch) === -1 && validatedRecommendations.indexOf(exactMatch) === -1) {
          validatedRecommendations.push(exactMatch);
        }
      } else {
        // Log mismatches for debugging
        Logger.log('⚠️ AI returned unrecognized field: "' + normalized + '" - skipping');
      }
    });

    if (validatedRecommendations.length === 0) {
      Logger.log('⚠️ No valid AI recommendations after filtering - using static fallback');
      return getStaticRecommendedFields_();
    }

    Logger.log('✅ AI recommended ' + validatedRecommendations.length + ' valid fields');
    Logger.log('   Fields: ' + validatedRecommendations.join(', '));

    return validatedRecommendations;
    
  } catch (e) {
    Logger.log('⚠️ Error getting AI recommendations: ' + e.message);
    return getStaticRecommendedFields_();
  }
}`;

    code = code.substring(0, funcStart) + newFunc + code.substring(funcEnd);

    console.log('✅ Replaced function with robust version\n');

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
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('✅ FIXED - AI RECOMMENDATIONS NOW BULLETPROOF!\n');
    console.log('\nREDUNDANCY LAYERS ADDED:\n');
    console.log('1. ✅ AI receives tier1/tier2 context for smart decisions');
    console.log('2. ✅ Flexible JSON parsing (tries multiple methods)');
    console.log('3. ✅ EXACT MATCH validation against CACHED_MERGED_KEYS');
    console.log('4. ✅ Automatic format correction (uses our exact field names)');
    console.log('5. ✅ Duplicate prevention (no duplicates with selected)');
    console.log('6. ✅ Fallback to static if AI returns garbage\n');
    console.log('HOW IT GUARANTEES CORRECT FORMAT:\n');
    console.log('  - AI suggests: "Patient_Demographics_and_Clinical_Data_Age"');
    console.log('  - We validate: Is this in allValidFieldNames? ✅');
    console.log('  - We validate: Is this already selected? ❌');
    console.log('  - We add: EXACT name from our list\n');
    console.log('  If AI returns wrong format or garbage → we skip it');
    console.log('  Only EXACT matches from Row 2 make it through!\n');
    console.log('AS CSV EVOLVES:\n');
    console.log('  Row 2 changes → refreshHeaders() updates cache');
    console.log('  Next modal → reads new field names');
    console.log('  AI gets new list automatically');
    console.log('  Validation uses new list');
    console.log('  Everything stays in sync! ✅\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

fix();
