/**
 * Update Apply Function to Use Final_Symptom_Name from Column O
 *
 * Changes:
 * 1. applyCategorization: Read column O (Final_Symptom_Name) from Results sheet
 * 2. Add symptomName to categorization object
 * 3. applyCategorizationUpdates: Use cat.symptomName directly (no lookup needed)
 */

const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function main() {
  console.log('🔧 Updating Apply Function to Use Final_Symptom_Name\n');
  console.log('══════════════════════════════════════════════════════════════\n');

  const token = JSON.parse(fs.readFileSync('./config/token.json', 'utf-8'));
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/oauth2callback'
  );
  oAuth2Client.setCredentials(token);

  const script = google.script({ version: 'v1', auth: oAuth2Client });
  const scriptId = process.env.APPS_SCRIPT_ID;

  console.log('📥 Downloading current Code.gs...\n');

  const project = await script.projects.getContent({ scriptId });
  const codeFile = project.data.files.find(f => f.name === 'Code');

  if (!codeFile) {
    console.log('❌ Code.gs not found');
    return;
  }

  let newCode = codeFile.source;

  // Find the applyCategorization function (the one that builds the dictionary)
  console.log('🔍 Finding applyCategorization function...\n');

  const applyFuncMatch = newCode.match(/function applyCategorization\(\)[^{]*\{[\s\S]*?(?=\nfunction [a-z]|$)/);

  if (!applyFuncMatch) {
    console.log('❌ applyCategorization function not found');
    return;
  }

  let updatedApplyFunc = applyFuncMatch[0];

  console.log('✏️  Updating applyCategorization to read column O...\n');

  // Update the column range to include column O (Final_Symptom_Name)
  updatedApplyFunc = updatedApplyFunc.replace(
    /const data = resultsSheet\.getDataRange\(\)\.getValues\(\);/,
    `const data = resultsSheet.getDataRange().getValues();
  addAILog('📊 Reading categorization results (including Final_Symptom_Name)...');`
  );

  // Update the object building to include symptomName from column O (index 14)
  updatedApplyFunc = updatedApplyFunc.replace(
    /categorizationData\[caseID\] = \{[\s\S]*?status: status[\s\S]*?\};/,
    `categorizationData[caseID] = {
        caseID: caseID,
        legacyCaseID: legacyCaseID,
        symptom: finalSymptom,
        symptomName: row[14] || finalSymptom,  // Column O: Final_Symptom_Name
        system: finalSystem,
        status: status
      };`
  );

  // Replace in code
  newCode = newCode.substring(0, applyFuncMatch.index) + updatedApplyFunc + newCode.substring(applyFuncMatch.index + applyFuncMatch[0].length);

  console.log('✅ Updated applyCategorization to read column O\n');

  // Now update applyCategorizationUpdates to use symptomName directly
  console.log('🔍 Finding applyCategorizationUpdates function...\n');

  const updateFuncMatch = newCode.match(/function applyCategorizationUpdates\(categorizationData, masterSheet\)[^{]*\{[\s\S]*?(?=\nfunction [a-z]|$)/);

  if (!updateFuncMatch) {
    console.log('❌ applyCategorizationUpdates function not found');
    return;
  }

  let updatedUpdateFunc = updateFuncMatch[0];

  console.log('✏️  Removing accronymMapping lookup...\n');

  // Remove the accronymMapping line
  updatedUpdateFunc = updatedUpdateFunc.replace(
    /const accronymMapping = getAccronymMapping\(\);[\s]*\n/,
    ''
  );

  // Remove the symptomMapping lookup and just use cat.symptomName
  updatedUpdateFunc = updatedUpdateFunc.replace(
    /\/\/ Get full symptom name from mapping[\s\S]*?const symptomName = symptomMapping \? symptomMapping\.preCategory : cat\.symptom;/,
    `// Use symptomName from categorization data (already looked up)
      const symptomName = cat.symptomName || cat.symptom;`
  );

  // Replace in code
  newCode = newCode.substring(0, updateFuncMatch.index) + updatedUpdateFunc + newCode.substring(updateFuncMatch.index + updateFuncMatch[0].length);

  console.log('✅ Updated applyCategorizationUpdates to use symptomName directly\n');

  codeFile.source = newCode;

  // Deploy
  console.log('🚀 Deploying to Apps Script...\n');

  await script.projects.updateContent({
    scriptId: scriptId,
    requestBody: { files: project.data.files }
  });

  console.log('✅ Deployment complete!\n');
  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('📋 What Changed:\n');
  console.log('1️⃣ applyCategorization now reads column O (Final_Symptom_Name)');
  console.log('   - Added to categorization object as symptomName property\n');
  console.log('2️⃣ applyCategorizationUpdates simplified:');
  console.log('   - Removed accronymMapping lookup');
  console.log('   - Uses cat.symptomName directly (no lookup needed)\n');
  console.log('Benefits:');
  console.log('  ✅ Faster apply (no mapping lookups)');
  console.log('  ✅ Column P gets correct full name');
  console.log('  ✅ Single source of truth (column O)\n');
  console.log('Next: Refresh sheet and click Apply to populate all 207 cases!\n');
}

main().catch(console.error);
