#!/usr/bin/env node

/**
 * FIND CLOSEST FIELD MATCHES
 * For the 13 missing fields, search the 642 available fields for closest matches
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

async function find() {
  try {
    const auth = await authorize();
    const script = google.script({ version: 'v1', auth });

    console.log('📥 Adding server-side fuzzy matching...\n');

    const content = await script.projects.getContent({
      scriptId: PRODUCTION_PROJECT_ID
    });

    const codeFile = content.data.files.find(f => f.name === 'Code');
    const manifestFile = content.data.files.find(f => f.name === 'appsscript');

    let code = codeFile.source;

    // Add a server-side function to find closest matches
    const matchingFunction = `
/**
 * Find closest matching field name
 */
function findClosestMatch(targetName, availableFields) {
  // Extract keywords from target
  var keywords = targetName.toLowerCase().split('_').filter(function(k) { return k.length > 3; });

  var bestMatch = null;
  var bestScore = 0;

  for (var i = 0; i < availableFields.length; i++) {
    var fieldName = availableFields[i].name.toLowerCase();
    var score = 0;

    for (var j = 0; j < keywords.length; j++) {
      if (fieldName.indexOf(keywords[j]) !== -1) {
        score++;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = availableFields[i].name;
    }
  }

  return bestScore >= 2 ? bestMatch : null;
}

`;

    // Insert the function before getFieldSelectorData
    const insertPoint = 'function getFieldSelectorData() {';
    code = code.replace(insertPoint, matchingFunction + insertPoint);

    // Now update the default field loading to use fuzzy matching
    const oldDefaults = `selectedFields = [
        'Case_Organization_Case_ID',`;

    const newDefaults = `var hardcodedDefaults = [
        'Case_Organization_Case_ID',`;

    code = code.replace(oldDefaults, newDefaults);

    // After loading hardcoded defaults, do fuzzy matching
    const afterDefaultsLoad = `addLog('      ✅ Loaded ' + selectedFields.length + ' default fields');
    }`;

    const withFuzzyMatch = `// Try fuzzy matching for fields that don't exist
      var matched = [];
      var allFieldNames = availableFields.map(function(f) { return f.name; });

      for (var i = 0; i < hardcodedDefaults.length; i++) {
        var defaultName = hardcodedDefaults[i];
        if (allFieldNames.indexOf(defaultName) !== -1) {
          matched.push(defaultName);
        } else {
          var closest = findClosestMatch(defaultName, availableFields);
          if (closest) {
            addLog('      🔍 Fuzzy matched: ' + defaultName + ' → ' + closest);
            matched.push(closest);
          } else {
            addLog('      ⚠️ No match for: ' + defaultName);
          }
        }
      }

      selectedFields = matched;
      addLog('      ✅ Loaded ' + selectedFields.length + ' default fields (' + (hardcodedDefaults.length - selectedFields.length) + ' fuzzy matched)');
    }`;

    code = code.replace(afterDefaultsLoad, withFuzzyMatch);

    console.log('✅ Added fuzzy matching for default field names\n');

    await script.projects.updateContent({
      scriptId: PRODUCTION_PROJECT_ID,
      requestBody: { files: [
        { name: 'Code', type: 'SERVER_JS', source: code },
        manifestFile
      ]}
    });

    console.log('✅ Deployed!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('🔍 FUZZY FIELD MATCHING ADDED!\n');
    console.log('System will now try to find closest matches for outdated field names\n');
    console.log('Logs will show: "🔍 Fuzzy matched: old_name → new_name"\n');
    console.log('\nTry "Pre-Cache Rich Data" to see matches!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

find();
