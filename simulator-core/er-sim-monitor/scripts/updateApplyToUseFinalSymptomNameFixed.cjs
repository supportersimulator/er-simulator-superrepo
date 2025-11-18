/**
 * Update Apply Function to Use Final_Symptom_Name from Column O
 *
 * Changes:
 * 1. Add symptomName: row[14] to categorization dictionary
 * 2. Remove accronymMapping lookup in applyCategorizationUpdates
 * 3. Use cat.symptomName directly
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

  console.log('✏️  Step 1: Add symptomName to categorization dictionary...\n');

  // Add symptomName to the dictionary
  newCode = newCode.replace(
    /categorizationData\[caseID\]\s*=\s*\{\s*caseID:\s*caseID,\s*legacyCaseID:\s*legacyCaseID,\s*symptom:\s*finalSymptom,\s*system:\s*finalSystem,\s*status:\s*status\s*\};/,
    `categorizationData[caseID] = {
        caseID: caseID,
        legacyCaseID: legacyCaseID,
        symptom: finalSymptom,
        symptomName: row[14] || finalSymptom,  // Column O: Final_Symptom_Name
        system: finalSystem,
        status: status
      };`
  );

  console.log('✅ Added symptomName: row[14] to dictionary\n');

  console.log('✏️  Step 2: Simplify symptomName lookup in apply function...\n');

  // Remove accronymMapping and simplify symptomName
  newCode = newCode.replace(
    /const accronymMapping = getAccronymMapping\(\);\s*/,
    ''
  );

  newCode = newCode.replace(
    /\/\/ Get full symptom name from mapping\s*const symptomMapping = accronymMapping\[cat\.symptom\];\s*const symptomName = symptomMapping \? symptomMapping\.preCategory : cat\.symptom;/,
    `// Use symptomName from categorization data (already from column O)
      const symptomName = cat.symptomName || cat.symptom;`
  );

  console.log('✅ Simplified symptomName lookup\n');

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
  console.log('1️⃣ Dictionary now includes symptomName from column O');
  console.log('   - categorizationData[caseID].symptomName = row[14]\n');
  console.log('2️⃣ Apply function simplified:');
  console.log('   - Removed accronymMapping lookup');
  console.log('   - Uses cat.symptomName directly\n');
  console.log('3️⃣ Master sheet columns (UNCHANGED):');
  console.log('   - Column P: Case_Organization_Category_Symptom_Name');
  console.log('   - Column Q: Case_Organization_Category_System_Name');
  console.log('   - Column R: Case_Organization_Category_Symptom');
  console.log('   - Column S: Case_Organization_Category_System\n');
  console.log('Benefits:');
  console.log('  ✅ Faster apply (no mapping lookups during write)');
  console.log('  ✅ Column P gets correct full name ("Chest Pain Cases", etc.)');
  console.log('  ✅ Single source of truth (column O in Results sheet)\n');
  console.log('Next: Refresh Google Sheet and click Apply!\n');
}

main().catch(console.error);
