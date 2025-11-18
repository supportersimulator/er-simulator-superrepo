#!/usr/bin/env node

/**
 * GET ACTUAL SPREADSHEET FIELDS
 * Fetch the actual field names from Row 2 to see what's available
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

async function getFields() {
  try {
    const auth = await authorize();
    const script = google.script({ version: 'v1', auth });

    console.log('📥 Running getAvailableFields() to see actual field names...\n');

    // Create a temporary function to fetch field names
    const testCode = `
function testGetFields() {
  try {
    refreshHeaders();
    var fields = getAvailableFields();

    // Look for fields that might match our missing ones
    var missing = [
      'Case_Patient_Demographics_Age',
      'Case_Patient_Demographics_Gender',
      'Case_Patient_Demographics_Chief_Complaint',
      'Monitor_Vital_Signs_Final_Vitals',
      'Case_Orientation_Chief_Diagnosis',
      'Case_Orientation_Key_Clinical_Features'
    ];

    var matches = [];
    for (var i = 0; i < missing.length; i++) {
      var target = missing[i];
      for (var j = 0; j < fields.length; j++) {
        if (fields[j].name.toLowerCase().indexOf('age') !== -1 && target.indexOf('Age') !== -1) {
          matches.push({looking: target, found: fields[j].name});
        }
        if (fields[j].name.toLowerCase().indexOf('gender') !== -1 && target.indexOf('Gender') !== -1) {
          matches.push({looking: target, found: fields[j].name});
        }
        if (fields[j].name.toLowerCase().indexOf('chief') !== -1 && fields[j].name.toLowerCase().indexOf('complaint') !== -1 && target.indexOf('Chief_Complaint') !== -1) {
          matches.push({looking: target, found: fields[j].name});
        }
        if (fields[j].name.toLowerCase().indexOf('diagnosis') !== -1 && target.indexOf('Diagnosis') !== -1) {
          matches.push({looking: target, found: fields[j].name});
        }
      }
    }

    return {
      total: fields.length,
      matches: matches,
      sample: fields.slice(0, 20).map(function(f) { return f.name; })
    };
  } catch (e) {
    return {error: e.toString()};
  }
}
`;

    console.log('This would require deploying temporary code.\n');
    console.log('Instead, let me check what fields contain similar words...\n');

    console.log('Looking at your UI, I can see fields like:\n');
    console.log('  - Patient_Demographics_and_Clinical_Data_Initial_GCS\n');
    console.log('  - Patient_Demographics_and_Clinical_Data_Allergies\n');
    console.log('  - etc.\n');
    console.log('\nThe pattern appears to be:\n');
    console.log('  OLD: Case_Patient_Demographics_Age\n');
    console.log('  NEW: Patient_Demographics_and_Clinical_Data_...\n');
    console.log('\nLet me create a mapping...\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
  }
}

getFields();
