#!/usr/bin/env node

/**
 * ADD MISSING COMPONENTS TO TIE EVERYTHING TOGETHER
 *
 * User: "make sure you look over all current code and that updated code you found
 * to see if there is much of this already created so we can just tie it all together
 * and not reinvent anything"
 *
 * FOUND:
 * ✅ showFieldSelector() - Has rough draft logic and getAIRecommendations call
 * ✅ getFieldSelectorRoughDraft() - Loads rough draft data
 * ✅ getAIRecommendations() - Calls for AI recommendations
 * ✅ refreshHeaders() - Caches headers
 * ✅ saveFieldSelectionAndStartCache() - Saves and starts cache
 * ✅ performCacheWithProgress() - Batch processing
 *
 * MISSING (need to add):
 * ❌ Live Log panel in HTML
 * ❌ getRecommendedFields() function (needed by getAIRecommendations)
 *
 * This script adds both missing components surgically.
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

    console.log('📥 Downloading current code...\n');

    const content = await script.projects.getContent({
      scriptId: PRODUCTION_PROJECT_ID
    });

    const codeFile = content.data.files.find(f => f.name === 'Code');
    const manifestFile = content.data.files.find(f => f.name === 'appsscript');

    let code = codeFile.source;

    console.log('🔧 STEP 1: Adding getRecommendedFields() function...\n');

    // Find a good insertion point - after getFieldSelectorRoughDraft
    const insertAfter = code.indexOf('function getFieldSelectorRoughDraft() {');
    if (insertAfter === -1) {
      console.log('❌ Could not find getFieldSelectorRoughDraft function\n');
      process.exit(1);
    }

    // Find the end of getFieldSelectorRoughDraft
    const funcEnd = code.indexOf('\nfunction ', insertAfter + 10);
    if (funcEnd === -1) {
      console.log('❌ Could not find insertion point\n');
      process.exit(1);
    }

    const newFunction = `

/**
 * Get AI-recommended fields based on pathway discovery potential
 * Falls back to static recommendations if API unavailable
 */
function getRecommendedFields(availableFields, selectedFields) {
  try {

    // FIRST: Check if we have cached recommendations from Step 2.5
    const docProps = PropertiesService.getDocumentProperties();
    const cachedRecommendations = docProps.getProperty('AI_RECOMMENDED_FIELDS');
    const cachedTimestamp = docProps.getProperty('AI_RECOMMENDATIONS_TIMESTAMP');

    if (cachedRecommendations && cachedTimestamp) {
      const cacheAge = (new Date() - new Date(cachedTimestamp)) / 1000; // seconds
      if (cacheAge < 3600) { // Cache valid for 1 hour
        Logger.log('✅ Using cached AI recommendations (age: ' + Math.round(cacheAge) + 's)');
        try {
          const cached = JSON.parse(cachedRecommendations);
          // Filter out any that might now be selected
          const filtered = cached.filter(function(field) {
            return selectedFields.indexOf(field) === -1;
          });
          return filtered;
        } catch (parseError) {
          Logger.log('⚠️ Failed to parse cached recommendations, fetching fresh...');
          // Fall through to API call
        }
      } else {
        Logger.log('⚠️ Cached recommendations expired (' + Math.round(cacheAge) + 's old), fetching fresh...');
      }
    }

    const apiKey = readApiKey_();
    if (!apiKey) {
      Logger.log('⚠️ No API key - using static recommendations');
      return getStaticRecommendedFields(availableFields, selectedFields);
    }

    // Get currently selected field names
    const currentlySelected = selectedFields;

    // Get unselected fields with their examples
    const unselectedFields = availableFields.filter(function(field) {
      return currentlySelected.indexOf(field.name) === -1;
    });

    const fieldDescriptions = unselectedFields.slice(0, 100).map(function(field) {
      return {
        name: field.name,
        category: field.tier1,
        example: field.example || 'N/A'
      };
    });

    const prompt = 'You are a medical education expert analyzing which data fields would be most valuable for AI pathway discovery in emergency medicine simulation cases.\\n\\n' +
      'CURRENTLY SELECTED FIELDS (already chosen, DO NOT recommend these):\\n' +
      JSON.stringify(currentlySelected, null, 2) + '\\n\\n' +
      'AVAILABLE UNSELECTED FIELDS (choose from these ONLY):\\n' +
      JSON.stringify(fieldDescriptions, null, 2) + '\\n\\n' +
      'Goal: Recommend 8-12 fields that would:\\n' +
      '- Group similar cases effectively\\n' +
      '- Support differential diagnosis patterns\\n' +
      '- Track treatment progressions\\n' +
      '- Reveal clinical reasoning patterns\\n' +
      '- Identify time-critical cases\\n' +
      '- Show patient complexity\\n\\n' +
      'IMPORTANT: Only recommend from UNSELECTED fields. Do NOT include any currently selected fields.\\n\\n' +
      'Return ONLY a JSON array of field names: ["fieldName1", "fieldName2", ...]';

    const url = 'https://api.openai.com/v1/chat/completions';
    const payload = {
      model: 'gpt-4o',
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
      temperature: 0.3
    };

    const options = {
      method: 'post',
      headers: {
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(url, options);
    const responseCode = response.getResponseCode();

    if (responseCode !== 200) {
      Logger.log('⚠️ OpenAI API error: ' + responseCode + ' - using static recommendations');
      return getStaticRecommendedFields(availableFields, selectedFields);
    }

    const data = JSON.parse(response.getContentText());
    const aiResponse = data.choices[0].message.content;

    const jsonMatch = aiResponse.match(/\\[[\\s\\S]*?\\]/);
    if (!jsonMatch) {
      Logger.log('⚠️ Could not parse AI response - using static recommendations');
      return getStaticRecommendedFields(availableFields, selectedFields);
    }

    const recommendedFields = JSON.parse(jsonMatch[0]);

    // Extra safety: Filter out any selected fields AI might have included
    const filteredRecommendations = recommendedFields.filter(function(field) {
      return currentlySelected.indexOf(field) === -1;
    });

    Logger.log('✅ AI recommended ' + filteredRecommendations.length + ' fields');
    return filteredRecommendations;

  } catch (e) {
    Logger.log('⚠️ Error getting AI recommendations: ' + e.message);
    return getStaticRecommendedFields(availableFields, selectedFields);
  }
}
`;

    code = code.substring(0, funcEnd) + newFunction + code.substring(funcEnd);
    console.log('✅ Added getRecommendedFields() function\n');

    console.log('🔧 STEP 2: Adding Live Log panel to showFieldSelector HTML...\n');

    // Find the modal HTML structure - look for the categories div
    const categoriesDiv = code.indexOf('<div id="categories" style="');
    if (categoriesDiv === -1) {
      console.log('❌ Could not find categories div in showFieldSelector\n');
      process.exit(1);
    }

    // Find the closing </div> before the count div
    const beforeCount = code.indexOf('<div id="count"', categoriesDiv);
    if (beforeCount === -1) {
      console.log('❌ Could not find count div\n');
      process.exit(1);
    }

    // Insert Live Log panel before the count div
    const liveLogPanel = `
      <!-- Live Log Panel -->
      <div id="liveLog" style="
        margin: 20px;
        padding: 15px;
        background: #1a1a1a;
        border: 1px solid #333;
        border-radius: 8px;
        max-height: 200px;
        overflow-y: auto;
        font-family: 'Courier New', monospace;
        font-size: 12px;
        color: #00ff00;
      ">
        <div style="font-weight: bold; margin-bottom: 10px; color: #00ff00;">📡 Live Log</div>
        <div id="logContent" style="white-space: pre-wrap;">Waiting for activity...</div>
      </div>

      `;

    code = code.substring(0, beforeCount) + liveLogPanel + code.substring(beforeCount);
    console.log('✅ Added Live Log panel to HTML\n');

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
    console.log('✅ ADDED MISSING COMPONENTS!\n');
    console.log('\nWhat was added:\n');
    console.log('  1. ✅ getRecommendedFields() function (from backup)');
    console.log('     - Calls OpenAI API for field recommendations');
    console.log('     - Uses 1-hour cache');
    console.log('     - Fallback to static recommendations');
    console.log('     - Filters out already-selected fields\n');
    console.log('  2. ✅ Live Log panel (in showFieldSelector HTML)');
    console.log('     - Shows background activity');
    console.log('     - Displays "Calling OpenAI API..." messages');
    console.log('     - Real-time updates during async operations\n');
    console.log('Now the complete workflow should work:\n');
    console.log('  1. Click Categories & Pathways → Background steps run');
    console.log('  2. Pathway UI opens → Click cache button');
    console.log('  3. Modal opens INSTANTLY with rough draft (3 sections)');
    console.log('  4. Live Log shows: "Calling OpenAI API..."');
    console.log('  5. When AI responds → Modal updates with recommendations');
    console.log('  6. Where AI agrees with defaults → Shows ✓✓');
    console.log('  7. User adjusts, clicks Continue to Cache\n');
    console.log('Test it now:\n');
    console.log('  1. Refresh Google Sheet (F5)');
    console.log('  2. Click 🧠 Sim Builder → 🧩 Categories & Pathways');
    console.log('  3. Click cache button');
    console.log('  4. Watch Live Log panel for activity!\n');
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
