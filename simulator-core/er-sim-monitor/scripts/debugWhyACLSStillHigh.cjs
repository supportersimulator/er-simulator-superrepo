const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function debug() {
  console.log('🔍 EMERGENCY DEBUG: Why is ACLS still appearing?\n');
  
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
  
  console.log('1. Checking what prompt is actually being sent to AI...\n');
  
  const project = await script.projects.getContent({ scriptId });
  const codeFile = project.data.files.find(f => f.name === 'Code');
  
  // Extract the prompt template
  const promptMatch = codeFile.source.match(/const prompt = `You are an expert ER[\s\S]*?\$\{validSymptoms\}/);
  
  if (promptMatch) {
    console.log('Found prompt template');
    console.log('');
    console.log('Checking if validSymptoms is filtered...');
    
    const beforePrompt = codeFile.source.substring(0, codeFile.source.indexOf('const prompt'));
    const hasFilter = beforePrompt.includes(".filter(symptom => symptom !== 'ACLS')");
    
    console.log('ACLS filter present BEFORE prompt:', hasFilter ? 'YES' : 'NO');
    console.log('');
  }
  
  // Check actual results to see AI reasoning
  console.log('2. Checking AI_Categorization_Results for clues...\n');
  
  const data = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: 'AI_Categorization_Results!A1:K10'
  });
  
  if (data.data.values) {
    const headers = data.data.values[0];
    const reasoningIndex = headers.indexOf('AI_Reasoning');
    
    console.log('Headers:', headers.slice(0, 7).join(' | '));
    console.log('');
    console.log('First ACLS case:');
    
    for (let i = 1; i < data.data.values.length; i++) {
      const row = data.data.values[i];
      if (row[5] === 'ACLS') {
        console.log('  Case ID:', row[0]);
        console.log('  Suggested:', row[5]);
        console.log('  Reasoning:', row[reasoningIndex] || 'EMPTY');
        console.log('');
        break;
      }
    }
    
    const hasReasoning = data.data.values.slice(1).some(row => row[reasoningIndex]);
    
    if (!hasReasoning) {
      console.log('⚠️  CRITICAL: AI_Reasoning column is EMPTY');
      console.log('This means categorization is using OLD CODE or CACHED results!');
      console.log('');
    }
  }
  
  console.log('3. Theory: The issue might be...\n');
  console.log('Possibility 1: Code didnt actually run (still showing old cached data)');
  console.log('Possibility 2: Different function is being called');
  console.log('Possibility 3: ACLS is hardcoded somewhere else');
  console.log('');
  console.log('Let me search for ALL places ACLS appears in Code.gs...');
  console.log('');
  
  const aclsMatches = codeFile.source.match(/ACLS/g);
  console.log('Total ACLS mentions in Code.gs:', aclsMatches ? aclsMatches.length : 0);
}

debug().catch(console.error);
