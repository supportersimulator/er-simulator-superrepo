const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const SCRIPT_ID = '12NihbVaaAIyRMCtzZ-aGjJ71CdL-HDjhmjxiD_S_EgIOuDOtrUH6M1l2';

function getOAuth2Client() {
  const credentialsPath = path.join(__dirname, '../config/credentials.json');
  const tokenPath = path.join(__dirname, '../config/token.json');
  const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
  const token = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
  const { client_id, client_secret, redirect_uris } = credentials.installed;
  const oauth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
  oauth2Client.setCredentials(token);
  return oauth2Client;
}

async function updateBothFiles() {
  const auth = getOAuth2Client();
  const script = google.script({ version: 'v1', auth });

  console.log('📝 Deploying clear function identifier to BOTH files...\n');

  const getResponse = await script.projects.getContent({ scriptId: SCRIPT_ID });
  const files = getResponse.data.files;

  const completeContent = fs.readFileSync(path.join(__dirname, '../Ultimate_Categorization_Tool_Complete.js'), 'utf8');

  // Update Ultimate_Categorization_Tool_Complete (already has the identifier)
  const completeFile = files.find(f => f.name === 'Ultimate_Categorization_Tool_Complete');
  if (completeFile) {
    completeFile.source = completeContent;
    console.log('✅ Updated: Ultimate_Categorization_Tool_Complete');
    console.log('   Clear function identifier: Ultimate_Categorization_Tool_Complete.js');
  }

  // Update Phase2E with modified identifier
  const phase2eFile = files.find(f => f.name === 'Ultimate_Categorization_Tool_Phase2E');
  if (phase2eFile) {
    // Replace the identifier in the content
    const phase2eContent = completeContent
      .replace(/Ultimate_Categorization_Tool_Complete\.js/g, 'Ultimate_Categorization_Tool_Phase2E.js');

    phase2eFile.source = phase2eContent;
    console.log('✅ Updated: Ultimate_Categorization_Tool_Phase2E');
    console.log('   Clear function identifier: Ultimate_Categorization_Tool_Phase2E.js');
  }

  await script.projects.updateContent({
    scriptId: SCRIPT_ID,
    requestBody: { files: files }
  });

  console.log('\n✅ Both files updated successfully!\n');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('CHANGES DEPLOYED:');
  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log('1. ✅ extractCasesForCategorization() uses header-based lookups');
  console.log('2. ✅ Finds columns by exact header names');
  console.log('3. ✅ clearUltimateCategorizationResults() deletes from row 2');
  console.log('4. ✅ Each file logs its own identifier in ALL operations');
  console.log('');
  console.log('WHAT YOU\'LL SEE IN LOGS:');
  console.log('  - Run categorization: "📂 SOURCE FILE: [filename].js"');
  console.log('  - Each batch: "📂 Executing from: [filename].js"');
  console.log('  - Clear results: "📂 SOURCE FILE: [filename].js"');
  console.log('');
  console.log('Now you can see exactly which file is being executed for every operation!');
  console.log('═══════════════════════════════════════════════════════════════');
}

updateBothFiles().catch(console.error);
