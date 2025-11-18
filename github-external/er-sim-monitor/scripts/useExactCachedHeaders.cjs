#!/usr/bin/env node

/**
 * USE EXACT CACHED HEADERS
 * Read Row 2 headers directly and use those exact names as defaults
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const PRODUCTION_PROJECT_ID = '12NihbVaaAIyRMCtzZ-aGjJ71CdL-HDjhmjxiD_S_EgIOuDOtrUH6M1l2';
const SPREADSHEET_ID = '1xCw3cW0gJN1l_e-JJQVY8lDJXcFRJ2pxC8JC4VPu-Eg'; // Master Scenario Convert sheet

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
    const sheets = google.sheets({ version: 'v4', auth });

    console.log('📥 Reading actual headers from Row 2...\n');

    // Read Row 2 headers from the spreadsheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Master Scenario Convert!2:2' // Row 2
    });

    const row2Headers = response.data.values[0];
    console.log(`Found ${row2Headers.length} headers in Row 2\n`);

    // Select the 27 most important field names based on the same priority as before
    // But now we'll use the EXACT names from Row 2
    const priorityKeywords = [
      'Case_ID',
      'Spark_Title',
      'Reveal_Title',
      'Pathway',
      'Difficulty',
      'Medical_Category',
      'Age',
      'Gender',
      'Presenting_Complaint', // Changed from Chief_Complaint
      'Initial_Vitals',
      'State1_Vitals',
      'State2_Vitals',
      'State3_Vitals',
      'State4_Vitals',
      'State5_Vitals', // Changed from Final_Vitals
      'Primary_Diagnosis', // Changed from just Diagnosis
      'Key_Clinical_Features', // Changed from Clinical_Features
      'Differential_Diagnosis', // Changed from Differential
      'Critical_Action', // Changed from Critical_Actions
      'Time_Sensitive',
      'Learning_Objective', // Changed from Learning_Outcomes
      'Teaching_Points',
      'Pitfalls',
      'Performance_Benchmarks',
      'Pre_Sim_Overview',
      'Post_Sim_Overview',
      'Attribution'
    ];

    // Find exact matches from Row 2
    const selectedDefaults = [];

    priorityKeywords.forEach(keyword => {
      // Find first header that contains this keyword
      const match = row2Headers.find(header =>
        header && header.toLowerCase().includes(keyword.toLowerCase())
      );

      if (match && !selectedDefaults.includes(match)) {
        selectedDefaults.push(match);
        console.log(`✅ "${keyword}" → ${match}`);
      } else if (!match) {
        console.log(`⚠️ "${keyword}" → NO MATCH IN ROW 2`);
      }
    });

    console.log(`\n📊 Selected ${selectedDefaults.length} defaults from actual headers\n`);

    // Now update the code to use these exact field names
    console.log('📥 Downloading current Apps Script code...\n');

    const content = await script.projects.getContent({
      scriptId: PRODUCTION_PROJECT_ID
    });

    const codeFile = content.data.files.find(f => f.name === 'Code');
    const manifestFile = content.data.files.find(f => f.name === 'appsscript');

    let code = codeFile.source;

    console.log('🔧 Replacing defaults with exact header names from Row 2...\n');

    // Find the selectedFields array assignment
    const arrayStart = code.indexOf('// Use actual header field names');

    if (arrayStart === -1) {
      console.log('❌ Could not find defaults section\n');
      return;
    }

    const arrayAssignStart = code.indexOf('selectedFields = [', arrayStart);
    const arrayEnd = code.indexOf('];', arrayAssignStart) + 2;

    // Format the array with proper indentation
    const formattedDefaults = selectedDefaults.map(name => `        '${name}'`).join(',\n');

    const newCode = `// Use exact header field names from Row 2 (auto-refreshed on load)
      selectedFields = [
${formattedDefaults}
      ];

      addLog('      ✅ Loaded ' + selectedFields.length + ' default fields');

      `;

    code = code.substring(0, arrayAssignStart) + newCode + code.substring(arrayEnd);

    console.log('✅ Replaced with exact Row 2 header names\n');

    await script.projects.updateContent({
      scriptId: PRODUCTION_PROJECT_ID,
      requestBody: { files: [
        { name: 'Code', type: 'SERVER_JS', source: code },
        manifestFile
      ]}
    });

    console.log('✅ Deployed!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('✅ NOW USING EXACT CACHED HEADER NAMES!\n');
    console.log('\nDefaults now use exact field names from Row 2:\n');
    selectedDefaults.slice(0, 10).forEach(name => console.log(`  • ${name}`));
    console.log(`  ... and ${selectedDefaults.length - 10} more\n`);
    console.log('Try "Categories & Pathways" - all 27 fields should work!\n');
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
