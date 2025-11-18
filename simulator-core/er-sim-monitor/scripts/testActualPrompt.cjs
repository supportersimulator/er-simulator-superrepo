const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function testPrompt() {
  console.log('🔍 Testing what prompt AI actually receives...\n');
  
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
  const codeFile = project.data.files.find(f => f.name === 'Code');
  
  // Find categorizeBatchWithAI function
  const funcMatch = codeFile.source.match(/function categorizeBatchWithAI\([\s\S]*?(?=\nfunction [a-zA-Z])/);
  
  if (!funcMatch) {
    console.log('categorizeBatchWithAI not found');
    return;
  }
  
  const funcCode = funcMatch[0];
  
  console.log('Checking categorizeBatchWithAI function...\n');
  
  // Check if it gets mapping
  const hasMapping = funcCode.includes('getAccronymMapping()');
  console.log('Calls getAccronymMapping:', hasMapping ? 'YES' : 'NO');
  
  // Check if it filters ACLS
  const hasFilter = funcCode.includes(".filter(symptom => symptom !== 'ACLS')");
  console.log('Has ACLS filter:', hasFilter ? 'YES ✅' : 'NO ❌');
  
  // Check what it does with validSymptoms
  const validSymptomsLine = funcCode.match(/const validSymptoms = [^\n]*/);
  if (validSymptomsLine) {
    console.log('');
    console.log('validSymptoms line:');
    console.log('  ' + validSymptomsLine[0]);
  }
  
  // Check if prompt uses validSymptoms
  const usesValidSymptoms = funcCode.includes('${validSymptoms}');
  console.log('');
  console.log('Prompt uses validSymptoms:', usesValidSymptoms ? 'YES' : 'NO');
  
  // Extract the actual prompt template
  const promptMatch = funcCode.match(/const prompt = `[\s\S]*?Valid Symptom Categories[^\n]*\n[^\n]*/);
  
  if (promptMatch) {
    console.log('');
    console.log('Prompt snippet around Valid Symptom Categories:');
    console.log('---');
    const snippet = promptMatch[0];
    const lines = snippet.split('\n').slice(-3);
    lines.forEach(line => console.log(line));
    console.log('---');
  }
  
  console.log('');
  console.log('='.repeat(60));
  console.log('');
  
  if (!hasFilter) {
    console.log('❌ PROBLEM: ACLS filter NOT in categorizeBatchWithAI!');
    console.log('');
    console.log('The filter might be in a different function or');
    console.log('the deployment didn not update categorizeBatchWithAI correctly.');
  } else {
    console.log('✅ Filter IS in the function');
    console.log('');
    console.log('If AI is still using ACLS, possible reasons:');
    console.log('1. AI is ignoring the valid list');
    console.log('2. AI is seeing ACLS in the case data itself');
    console.log('3. Response parsing is broken');
  }
}

testPrompt().catch(console.error);
