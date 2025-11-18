const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function checkDeployment() {
  console.log('🔍 Checking if clear function was deployed to Code.gs...\n');
  
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
  
  if (!codeFile) {
    console.log('❌ Code.gs not found');
    return;
  }
  
  // Check if runAICategorization has the clear code
  const funcMatch = codeFile.source.match(/function runAICategorization\(\)[^{]*\{[\s\S]*?(?=\n\nfunction [a-zA-Z]|\n\/\/ ===)/);
  
  if (!funcMatch) {
    console.log('❌ runAICategorization function not found in Code.gs');
    return;
  }
  
  const funcSource = funcMatch[0];
  
  // Check for clear code
  const hasClear = funcSource.includes('existingResults.clear()');
  const hasGetSheet = funcSource.includes("getSheetByName('AI_Categorization_Results')");
  
  console.log('📊 Function Analysis:');
  console.log('  Has getSheetByName call:', hasGetSheet);
  console.log('  Has clear() call:', hasClear);
  console.log('');
  
  if (hasClear) {
    console.log('✅ Clear function IS present in Code.gs');
    console.log('');
    console.log('📝 Clear code found - showing context:');
    const clearIndex = funcSource.indexOf('Clear old results');
    if (clearIndex !== -1) {
      const clearSection = funcSource.substring(clearIndex - 50, clearIndex + 400);
      console.log(clearSection);
    }
  } else {
    console.log('❌ Clear function NOT found in Code.gs');
    console.log('');
    console.log('📝 Current function start (first 800 chars):');
    console.log(funcSource.substring(0, 800));
  }
}

checkDeployment().catch(console.error);
