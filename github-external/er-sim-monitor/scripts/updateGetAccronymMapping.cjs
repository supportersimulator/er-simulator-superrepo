const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function updateFunction() {
  console.log('🔧 Updating getAccronymMapping to use LOCAL sheet...\n');
  
  const token = JSON.parse(fs.readFileSync('./config/token.json', 'utf-8'));
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/oauth2callback'
  );
  oAuth2Client.setCredentials(token);
  
  const script = google.script({ version: 'v1', auth: oAuth2Client });
  const scriptId = process.env.APPS_SCRIPT_ID;
  
  const project = await script.projects.getContent({ scriptId });
  const files = project.data.files;
  const codeFile = files.find(f => f.name === 'Code');
  
  const newFunction = `function getAccronymMapping() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const mappingSheet = ss.getSheetByName('accronym_symptom_system_mapping');
  
  if (!mappingSheet) {
    throw new Error('Mapping sheet not found: accronym_symptom_system_mapping');
  }
  
  const data = mappingSheet.getDataRange().getValues();
  const mapping = {};

  // Skip header row
  for (let i = 1; i < data.length; i++) {
    const accronym = data[i][0];
    if (!accronym) continue; // Skip empty rows

    mapping[accronym] = {
      symptom: data[i][1] || '',
      system: data[i][2] || '',
      description: data[i][3] || ''
    };
  }

  Logger.log('📋 Loaded ' + Object.keys(mapping).length + ' accronym mappings from local sheet');
  return mapping;
}`;

  const oldFuncMatch = codeFile.source.match(/function getAccronymMapping\(\)[\s\S]*?(?=\n\nfunction [a-zA-Z]|\n\/\/)/);
  
  if (oldFuncMatch) {
    codeFile.source = codeFile.source.replace(oldFuncMatch[0], newFunction);
    console.log('✅ Replaced getAccronymMapping function\n');
  } else {
    console.log('❌ Old function not found\n');
    return;
  }
  
  console.log('🚀 Deploying...\n');
  
  await script.projects.updateContent({
    scriptId: scriptId,
    requestBody: {
      files: files
    }
  });
  
  console.log('✅ Deployment complete!\n');
  console.log('Changes:');
  console.log('  - Now uses LOCAL sheet: accronym_symptom_system_mapping');
  console.log('  - No longer depends on external spreadsheet');
  console.log('  - Edit Category Mappings will work');
  console.log('  - AI Categorization will work');
}

updateFunction().catch(console.error);
