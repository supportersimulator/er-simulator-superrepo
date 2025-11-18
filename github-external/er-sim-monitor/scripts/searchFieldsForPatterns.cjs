#!/usr/bin/env node

/**
 * SEARCH FIELDS FOR PATTERNS
 * Get available fields and search for matches to our missing patterns
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

async function searchFields() {
  try {
    const auth = await authorize();
    const script = google.script({ version: 'v1', auth });

    console.log('📥 Downloading current code to extract field search logic...\n');

    const content = await script.projects.getContent({
      scriptId: PRODUCTION_PROJECT_ID
    });

    const codeFile = content.data.files.find(f => f.name === 'Code');

    // Add a temporary test function that searches for our patterns
    const testFunction = `
function testSearchForMissingPatterns() {
  try {
    refreshHeaders();
    var fields = getAvailableFields();

    var missingPatterns = [
      'Chief_Complaint',
      'Final_Vitals',
      'Diagnosis',
      'Clinical_Features',
      'Differential',
      'Critical_Actions',
      'Time_Sensitive',
      'Learning_Outcomes',
      'Teaching_Points',
      'Pitfalls',
      'Performance_Benchmarks'
    ];

    var results = {};

    for (var i = 0; i < missingPatterns.length; i++) {
      var pattern = missingPatterns[i];
      var keywords = pattern.split('_');

      // Try exact substring match
      var exactMatches = [];
      for (var j = 0; j < fields.length; j++) {
        if (fields[j].name.indexOf(pattern) !== -1) {
          exactMatches.push(fields[j].name);
        }
      }

      // Try matching all keywords
      var allKeywordMatches = [];
      for (var j = 0; j < fields.length; j++) {
        var fieldLower = fields[j].name.toLowerCase();
        var allMatch = true;
        for (var k = 0; k < keywords.length; k++) {
          if (fieldLower.indexOf(keywords[k].toLowerCase()) === -1) {
            allMatch = false;
            break;
          }
        }
        if (allMatch) {
          allKeywordMatches.push(fields[j].name);
        }
      }

      // Try matching first keyword only
      var firstKeywordMatches = [];
      var firstKeyword = keywords[0].toLowerCase();
      for (var j = 0; j < fields.length && firstKeywordMatches.length < 5; j++) {
        if (fields[j].name.toLowerCase().indexOf(firstKeyword) !== -1) {
          firstKeywordMatches.push(fields[j].name);
        }
      }

      results[pattern] = {
        exact: exactMatches.slice(0, 3),
        allKeywords: allKeywordMatches.slice(0, 3),
        firstKeyword: firstKeywordMatches.slice(0, 3)
      };
    }

    return results;
  } catch (e) {
    return {error: e.toString()};
  }
}`;

    // Add this function temporarily
    let code = codeFile.source + '\n\n' + testFunction;

    const manifestFile = content.data.files.find(f => f.name === 'appsscript');

    console.log('📤 Deploying temporary search function...\n');

    await script.projects.updateContent({
      scriptId: PRODUCTION_PROJECT_ID,
      requestBody: { files: [
        { name: 'Code', type: 'SERVER_JS', source: code },
        manifestFile
      ]}
    });

    console.log('▶️ Running search...\n');

    // Run the test function
    const result = await script.scripts.run({
      scriptId: PRODUCTION_PROJECT_ID,
      requestBody: {
        function: 'testSearchForMissingPatterns',
        devMode: true
      }
    });

    const searchResults = result.data.response.result;

    console.log('Search results for missing patterns:\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

    Object.keys(searchResults).forEach(pattern => {
      const matches = searchResults[pattern];
      console.log(`"${pattern}":`);

      if (matches.exact && matches.exact.length > 0) {
        console.log('  ✅ Exact matches:');
        matches.exact.forEach(m => console.log(`     → ${m}`));
      }

      if (matches.allKeywords && matches.allKeywords.length > 0) {
        console.log('  🔍 All keywords:');
        matches.allKeywords.forEach(m => console.log(`     → ${m}`));
      }

      if (matches.firstKeyword && matches.firstKeyword.length > 0) {
        console.log('  💡 First keyword only:');
        matches.firstKeyword.forEach(m => console.log(`     → ${m}`));
      }

      console.log();
    });

    console.log('═══════════════════════════════════════════════════════════════\n');

    // Remove the test function
    console.log('🧹 Cleaning up...\n');
    await script.projects.updateContent({
      scriptId: PRODUCTION_PROJECT_ID,
      requestBody: { files: [
        { name: 'Code', type: 'SERVER_JS', source: codeFile.source },
        manifestFile
      ]}
    });

    console.log('✅ Done!\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

searchFields();
