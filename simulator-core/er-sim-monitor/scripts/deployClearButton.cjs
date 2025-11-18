const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function deploy() {
  console.log('🚀 Deploying Clear Results Button...\n');
  
  const token = JSON.parse(fs.readFileSync('./config/token.json', 'utf-8'));
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/oauth2callback'
  );
  oAuth2Client.setCredentials(token);
  
  const script = google.script({ version: 'v1', auth: oAuth2Client });
  const scriptId = process.env.APPS_SCRIPT_ID;
  
  console.log('📥 Downloading current project...\n');
  const project = await script.projects.getContent({ scriptId });
  const files = project.data.files;
  
  const codeFile = files.find(f => f.name === 'Code');
  const phase2File = files.find(f => f.name === 'Phase2_Enhanced_Categories_Pathways_Panel');
  
  if (!codeFile || !phase2File) {
    console.log('Available files:');
    files.forEach(f => console.log('  - ' + f.name));
    throw new Error('Required files not found');
  }
  
  console.log('✅ Found Code.gs and Phase2_Enhanced_Categories_Pathways_Panel\n');
  
  const updatedBackend = fs.readFileSync(
    './apps-script-deployable/AI_Categorization_Backend.gs',
    'utf-8'
  );
  
  const updatedPhase2 = fs.readFileSync(
    './apps-script-deployable/Phase2_Enhanced_Categories_With_AI.gs',
    'utf-8'
  );
  
  const clearFuncMatch = updatedBackend.match(/function clearAICategorizationResults\(\)[\s\S]*?\n\}/);
  
  if (!clearFuncMatch) {
    throw new Error('clearAICategorizationResults function not found');
  }
  
  console.log('✅ Extracted clearAICategorizationResults function\n');
  
  if (!codeFile.source.includes('clearAICategorizationResults')) {
    codeFile.source += '\n\n' + clearFuncMatch[0] + '\n';
    console.log('✅ Added clearAICategorizationResults to Code.gs\n');
  } else {
    console.log('ℹ️  clearAICategorizationResults already in Code.gs\n');
  }
  
  phase2File.source = updatedPhase2;
  console.log('✅ Updated Phase2 with Clear button UI\n');
  
  console.log('🚀 Deploying to Apps Script...\n');
  
  await script.projects.updateContent({
    scriptId: scriptId,
    requestBody: {
      files: files
    }
  });
  
  console.log('✅ Deployment complete!\n');
  console.log('Changes deployed:');
  console.log('  1. Added "Clear Results" button to UI (red button)');
  console.log('  2. Added clearAIResults() JavaScript function');
  console.log('  3. Added clearAICategorizationResults() backend function');
  console.log('');
  console.log('The Clear button will:');
  console.log('  - Completely clear AI_Categorization_Results sheet');
  console.log('  - Hide the AI review container');
  console.log('  - Show confirmation dialog before clearing');
  console.log('');
  console.log('Refresh your sidebar to see the new button!');
}

deploy().catch(console.error);
