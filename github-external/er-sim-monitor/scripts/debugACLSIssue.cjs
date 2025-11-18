const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function debug() {
  console.log('🔍 Debugging ACLS Issue...\n');
  
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
  
  // 1. Check deployed Code.gs
  console.log('1. Checking deployed Code.gs for ACLS filter...\n');
  const project = await script.projects.getContent({ scriptId });
  const codeFile = project.data.files.find(f => f.name === 'Code');
  
  const hasFilter = codeFile.source.includes(".filter(symptom => symptom !== 'ACLS')");
  console.log('   ACLS filter present:', hasFilter ? 'YES' : 'NO');
  
  if (hasFilter) {
    const filterLine = codeFile.source.split('\n').find(line => line.includes('.filter(symptom'));
    console.log('   Filter code:', filterLine ? filterLine.trim() : 'Not found');
  }
  console.log('');
  
  // 2. Check results sheet timestamps
  console.log('2. Checking AI_Categorization_Results sheet...\n');
  const data = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: 'AI_Categorization_Results!A1:K5'
  });
  
  if (data.data.values && data.data.values.length > 0) {
    console.log('   Headers:', data.data.values[0].slice(0, 6).join(' | '));
    console.log('');
    console.log('   Sample rows:');
    for (let i = 1; i < Math.min(4, data.data.values.length); i++) {
      const row = data.data.values[i];
      console.log('   Row ' + (i + 1) + ': ' + row[0] + ' | ' + row[5] + ' | Reasoning: ' + (row[8] || 'EMPTY'));
    }
    console.log('');
    
    const reasoningColumn = data.data.values[0].indexOf('AI_Reasoning');
    const hasReasoning = data.data.values.slice(1).some(row => row[reasoningColumn]);
    
    if (!hasReasoning) {
      console.log('   ⚠️  AI_Reasoning column is EMPTY - this is OLD data!');
      console.log('   The categorization has NOT been re-run since deploying ACLS filter.');
      console.log('');
    }
  }
  
  // 3. Check what symptoms are available in accronym mapping
  console.log('3. Checking Category_Mapping_Symptoms sheet...\n');
  const mappingData = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: 'Category_Mapping_Symptoms!A2:B50'
  });
  
  if (mappingData.data.values) {
    const symptoms = mappingData.data.values.map(row => row[0]);
    const hasACLS = symptoms.includes('ACLS');
    
    console.log('   Total symptoms in mapping:', symptoms.length);
    console.log('   ACLS in mapping:', hasACLS ? 'YES' : 'NO');
    
    if (hasACLS) {
      console.log('   ℹ️  ACLS is in the mapping, but filter should exclude it from AI prompt');
    }
    console.log('');
  }
  
  // Summary
  console.log('================================');
  console.log('DIAGNOSIS:');
  console.log('================================');
  console.log('');
  
  if (hasFilter) {
    console.log('✅ ACLS filter IS deployed in Code.gs');
  } else {
    console.log('❌ ACLS filter NOT found in Code.gs (deployment failed)');
  }
  
  console.log('');
  console.log('⚠️  Current results are from OLD run (before ACLS filter)');
  console.log('');
  console.log('SOLUTION:');
  console.log('You need to run AI Categorization again to see the fix in action.');
  console.log('');
  console.log('Expected after re-run:');
  console.log('  - ACLS: 120 cases → ~5-10 cases');
  console.log('  - SOB: 17 cases → ~30-40 cases');
  console.log('  - CP: 9 cases → ~20-30 cases');
  console.log('  - AI_Reasoning column will have text (not empty)');
}

debug().catch(console.error);
