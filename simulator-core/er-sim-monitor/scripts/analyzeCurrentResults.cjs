const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function analyzeResults() {
  console.log('📊 Analyzing AI_Categorization_Results...\n');
  
  const token = JSON.parse(fs.readFileSync('./config/token.json', 'utf-8'));
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/oauth2callback'
  );
  oAuth2Client.setCredentials(token);
  
  const sheets = google.sheets({ version: 'v4', auth: oAuth2Client });
  const sheetId = process.env.SHEET_ID;
  
  const data = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: 'AI_Categorization_Results!A1:K300'
  });
  
  if (!data.data.values || data.data.values.length === 0) {
    console.log('✅ Sheet is EMPTY - Clear function worked!');
    console.log('Ready for new categorization run.');
    return;
  }
  
  const rows = data.data.values;
  const headers = rows[0];
  
  console.log('Total Rows: ' + rows.length);
  console.log('Data Rows: ' + (rows.length - 1));
  console.log('');
  
  const suggestedSymptomIndex = headers.indexOf('Suggested_Symptom');
  const aiReasoningIndex = headers.indexOf('AI_Reasoning');
  const caseIdIndex = headers.indexOf('Case_ID');
  
  if (suggestedSymptomIndex === -1) {
    console.log('Could not find Suggested_Symptom column');
    return;
  }
  
  const categoryCounts = {};
  const aclsCases = [];
  
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const symptom = row[suggestedSymptomIndex] || 'Empty';
    
    categoryCounts[symptom] = (categoryCounts[symptom] || 0) + 1;
    
    if (symptom === 'ACLS') {
      aclsCases.push({
        caseId: row[caseIdIndex],
        reasoning: row[aiReasoningIndex]
      });
    }
  }
  
  const sorted = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]);
  
  console.log('CATEGORY DISTRIBUTION:');
  console.log('');
  
  let aclsCount = 0;
  let totalCases = rows.length - 1;
  
  sorted.forEach(entry => {
    const category = entry[0];
    const count = entry[1];
    const percentage = ((count / totalCases) * 100).toFixed(1);
    console.log(category + ': ' + count + ' (' + percentage + '%)');
    
    if (category === 'ACLS') {
      aclsCount = count;
    }
  });
  
  console.log('');
  console.log('================================');
  console.log('');
  
  if (aclsCount > 15) {
    console.log('PROBLEM: Still too many ACLS cases: ' + aclsCount);
    console.log('');
    console.log('Sample ACLS cases:');
    aclsCases.slice(0, 5).forEach((c, i) => {
      console.log('');
      console.log((i + 1) + '. ' + c.caseId);
      console.log('   ' + (c.reasoning || 'No reasoning').substring(0, 100));
    });
  } else if (aclsCount > 0) {
    console.log('ACLS count looks reasonable: ' + aclsCount + ' cases');
    console.log('');
    console.log('All ACLS cases:');
    aclsCases.forEach((c, i) => {
      console.log('');
      console.log((i + 1) + '. ' + c.caseId);
      console.log('   ' + (c.reasoning || 'No reasoning').substring(0, 120));
    });
  } else {
    console.log('NO ACLS cases - filter working perfectly!');
  }
  
  console.log('');
  console.log('================================');
  console.log('');
  
  const sobCount = categoryCounts['SOB'] || 0;
  const cpCount = categoryCounts['CP'] || 0;
  const amsCount = categoryCounts['AMS'] || 0;
  
  console.log('KEY METRICS:');
  console.log('ACLS:  ' + aclsCount + ' cases');
  console.log('SOB:   ' + sobCount + ' cases');
  console.log('CP:    ' + cpCount + ' cases');
  console.log('AMS:   ' + amsCount + ' cases');
  console.log('');
  
  if (aclsCount < 15 && sobCount > 20 && cpCount > 15) {
    console.log('EXCELLENT! Distribution looks much better!');
  } else if (aclsCount > 100) {
    console.log('ACLS still over-used. Check deployment.');
  }
}

analyzeResults().catch(console.error);
