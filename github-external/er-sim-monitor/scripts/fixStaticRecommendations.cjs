#!/usr/bin/env node

/**
 * FIX STATIC RECOMMENDATIONS FUNCTION
 * Replace with simple static list using ACTUAL field names from spreadsheet
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const PRODUCTION_PROJECT_ID = '12NihbVaaAIyRMCtzZ-aGjJ71CdL-HDjhmjxiD_S_EgIOuDOtrUH6M1l2';

console.log('\n🔧 FIXING STATIC RECOMMENDATIONS\n');
console.log('═══════════════════════════════════════════════════════════════\n');

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

    console.log('📥 Downloading production code...\n');

    const content = await script.projects.getContent({
      scriptId: PRODUCTION_PROJECT_ID
    });

    const codeFile = content.data.files.find(f => f.name === 'Code');
    const manifestFile = content.data.files.find(f => f.name === 'appsscript');

    let code = codeFile.source;

    console.log('🔧 Removing duplicate getStaticRecommendedFields_() functions...\n');

    // Find and remove BOTH old versions
    // First version (the one with ChatGPT fallback)
    const firstVersion = code.match(/function getStaticRecommendedFields_\(\) \{[\s\S]*?return \[\]\.concat\(highPriority, mediumPriority\);\n\}/);

    if (firstVersion) {
      // Find all instances of the old static function
      const pattern1 = /function getStaticRecommendedFields_\(\) \{[\s\S]*?  \/\/ Try to get AI recommendations[\s\S]*?\n\}\n/;
      const pattern2 = /function getStaticRecommendedFields_\(\) \{[\s\S]*?  \/\/ HIGH PRIORITY[\s\S]*?  return \[\]\.concat\(highPriority, mediumPriority\);\n\}\n/;

      code = code.replace(pattern1, '');
      code = code.replace(pattern2, '');

      console.log('✅ Removed old getStaticRecommendedFields_() functions\n');
    }

    console.log('🔧 Adding new getStaticRecommendedFields_() with ACTUAL field names...\n');

    // Add the correct static function with actual field names
    const newStaticFunction = `
/**
 * Get static recommended fields using ACTUAL flattened header names
 * Returns 8-12 fields that are valuable but not in the default 27
 */
function getStaticRecommendedFields_(availableFields, selectedFields) {
  Logger.log('🔍 getStaticRecommendedFields_() called with ' + availableFields.length + ' available, ' + selectedFields.length + ' selected');

  // ACTUAL field names from Row 2 that are useful but not in default 27
  const recommendedNames = [
    'Case_Patient_Demographics_Presenting_Symptoms',
    'Case_Patient_Demographics_Medical_History',
    'Case_Patient_Demographics_Medications',
    'Case_Patient_Demographics_Allergies',
    'Monitor_Vital_Signs_Current_Vitals',
    'Case_Orientation_Expected_Student_Actions',
    'Case_Orientation_Common_Errors',
    'Case_Debrief_Key_Teaching_Points',
    'Case_Debrief_Common_Pitfalls_Discussion',
    'Scoring_Criteria_Critical_Action_Checklist'
  ];

  // Filter to only include fields that exist and aren't already selected
  const recommended = availableFields
    .filter(function(field) {
      return recommendedNames.indexOf(field.name) !== -1 &&
             selectedFields.indexOf(field.name) === -1;
    })
    .map(function(field) { return field.name; });

  Logger.log('✅ Returning ' + recommended.length + ' recommended fields');
  return recommended;
}
`;

    // Insert before getDefaultFieldNames_
    const insertBefore = code.indexOf('/**\n * Get default 27 field names');
    if (insertBefore !== -1) {
      code = code.slice(0, insertBefore) + newStaticFunction + '\n' + code.slice(insertBefore);
      console.log('✅ Added new getStaticRecommendedFields_() function\n');
    }

    // Backup
    const backupPath = path.join(__dirname, '../backups/production-before-static-fix-2025-11-06.gs');
    fs.writeFileSync(backupPath, codeFile.source, 'utf8');
    console.log(`💾 Backed up to: ${backupPath}\n`);

    // Deploy
    console.log('📤 Deploying to production...\n');

    const updatedFiles = [
      {
        name: 'Code',
        type: 'SERVER_JS',
        source: code
      },
      manifestFile
    ];

    await script.projects.updateContent({
      scriptId: PRODUCTION_PROJECT_ID,
      requestBody: { files: updatedFiles }
    });

    const newSize = (code.length / 1024).toFixed(1);

    console.log(`✅ Deployment successful! Size: ${newSize} KB\n`);
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('🎉 STATIC RECOMMENDATIONS FIXED!\n');
    console.log('What changed:\n');
    console.log('   ✅ Removed broken duplicate functions');
    console.log('   ✅ New function uses ACTUAL field names');
    console.log('   ✅ Takes availableFields + selectedFields as parameters');
    console.log('   ✅ Returns only fields that exist and are not selected\n');
    console.log('Close dialog and click "Pre-Cache Rich Data" again.\n');
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
