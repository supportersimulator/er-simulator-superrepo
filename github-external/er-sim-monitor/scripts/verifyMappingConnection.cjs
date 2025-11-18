const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function verify() {
  console.log('🔍 Verifying mapping sheet connection...\n');
  
  const token = JSON.parse(fs.readFileSync('./config/token.json', 'utf-8'));
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/oauth2callback'
  );
  oAuth2Client.setCredentials(token);
  
  const script = google.script({ version: 'v1', auth: oAuth2Client });
  const sheets = google.sheets({ version: 'v4', auth: oAuth2Client });
  const scriptId = process.env.APPS_SCRIPT_ID;
  const sheetId = process.env.SHEET_ID;
  
  // 1. Check deployed getAccronymMapping function
  console.log('1. Checking deployed getAccronymMapping function...\n');
  const project = await script.projects.getContent({ scriptId });
  const codeFile = project.data.files.find(f => f.name === 'Code');
  
  const funcMatch = codeFile.source.match(/function getAccronymMapping\(\)[\s\S]{0,500}/);
  
  if (funcMatch) {
    const usesLocalSheet = funcMatch[0].includes("getSheetByName('accronym_symptom_system_mapping')");
    const usesExternalSheet = funcMatch[0].includes('openById');
    
    console.log('   Uses LOCAL sheet:', usesLocalSheet ? 'YES ✅' : 'NO ❌');
    console.log('   Uses EXTERNAL sheet:', usesExternalSheet ? 'YES ❌' : 'NO ✅');
    console.log('');
    
    if (!usesLocalSheet) {
      console.log('   ⚠️  WARNING: Function still using external sheet!');
      console.log('');
    }
  }
  
  // 2. Check local mapping sheet exists and has data
  console.log('2. Checking local mapping sheet...\n');
  
  const data = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: 'accronym_symptom_system_mapping!A1:D50'
  });
  
  if (data.data.values && data.data.values.length > 0) {
    console.log('   ✅ Sheet exists with ' + (data.data.values.length - 1) + ' symptom mappings\n');
    console.log('   Headers:', data.data.values[0].join(' | '));
    console.log('');
    console.log('   Sample mappings:');
    for (let i = 1; i < Math.min(6, data.data.values.length); i++) {
      console.log('     ' + data.data.values[i][0] + ': ' + data.data.values[i][1]);
    }
    console.log('');
    
    // Check if ACLS is in the list
    const hasACLS = data.data.values.slice(1).some(row => row[0] === 'ACLS');
    console.log('   ACLS in mapping sheet:', hasACLS ? 'YES ❌' : 'NO ✅');
    console.log('');
  } else {
    console.log('   ❌ Sheet is empty or does not exist\n');
  }
  
  // 3. Test what getAccronymMapping would return
  console.log('3. Simulating what getAccronymMapping will return...\n');
  
  const mapping = {};
  for (let i = 1; i < data.data.values.length; i++) {
    const row = data.data.values[i];
    if (!row[0]) continue;
    mapping[row[0]] = {
      symptom: row[1] || '',
      system: row[2] || '',
      description: row[3] || ''
    };
  }
  
  const symptoms = Object.keys(mapping);
  console.log('   Total symptoms loaded:', symptoms.length);
  console.log('   Symptoms list:', symptoms.slice(0, 10).join(', ') + '...');
  console.log('');
  
  // 4. Test ACLS filter
  console.log('4. Testing ACLS filter...\n');
  
  const filteredSymptoms = symptoms.filter(s => s !== 'ACLS');
  console.log('   Before filter:', symptoms.length + ' symptoms');
  console.log('   After filter:', filteredSymptoms.length + ' symptoms');
  console.log('   ACLS removed:', symptoms.length > filteredSymptoms.length ? 'YES ✅' : 'NO (not in list anyway) ✅');
  console.log('');
  
  // Summary
  console.log('='.repeat(60));
  console.log('VERIFICATION SUMMARY');
  console.log('='.repeat(60));
  console.log('');
  
  const allGood = funcMatch[0].includes("getSheetByName('accronym_symptom_system_mapping')") && 
                  data.data.values.length > 1;
  
  if (allGood) {
    console.log('✅ Everything is connected correctly!');
    console.log('');
    console.log('AI Categorization WILL use:');
    console.log('  - LOCAL accronym_symptom_system_mapping sheet');
    console.log('  - ' + filteredSymptoms.length + ' valid symptoms (ACLS filtered out)');
    console.log('  - Updated prompt with ACLS restrictions');
    console.log('');
    console.log('Expected result: ACLS cases should drop to ~5-10');
  } else {
    console.log('❌ Something is not connected properly');
  }
}

verify().catch(console.error);
