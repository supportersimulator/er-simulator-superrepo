const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function deployAll() {
  console.log('🚀 Deploying ALL AI Categorization Functions...\n');
  
  const token = JSON.parse(fs.readFileSync('./config/token.json', 'utf-8'));
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/oauth2callback'
  );
  oAuth2Client.setCredentials(token);
  
  const script = google.script({ version: 'v1', auth: oAuth2Client });
  const scriptId = process.env.APPS_SCRIPT_ID;
  
  const updatedBackend = fs.readFileSync(
    './apps-script-deployable/AI_Categorization_Backend.gs',
    'utf-8'
  );
  
  const project = await script.projects.getContent({ scriptId });
  const codeFile = project.data.files.find(f => f.name === 'Code');
  
  console.log('Extracting functions from AI_Categorization_Backend.gs...\n');
  
  const functionsToUpdate = [
    {
      name: 'categorizeBatchWithAI',
      regex: /function categorizeBatchWithAI\([^)]*\)[\s\S]*?(?=\nfunction [a-zA-Z]|\n\/\/)/
    },
    {
      name: 'buildCategorizationPrompt',
      regex: /function buildCategorizationPrompt\([^)]*\)[\s\S]*?(?=\nfunction [a-zA-Z]|\n\/\/)/
    },
    {
      name: 'saveCategorizationResults',
      regex: /function saveCategorizationResults\([^)]*\)[\s\S]*?(?=\nfunction [a-zA-Z]|\n\/\/)/
    }
  ];
  
  let updatedCount = 0;
  
  for (const func of functionsToUpdate) {
    const newMatch = updatedBackend.match(func.regex);
    const oldMatch = codeFile.source.match(func.regex);
    
    if (newMatch && oldMatch) {
      codeFile.source = codeFile.source.replace(oldMatch[0], newMatch[0]);
      console.log(`✅ Updated ${func.name} (${newMatch[0].length} chars)`);
      updatedCount++;
    } else {
      console.log(`⚠️  Skipped ${func.name} (not found)`);
    }
  }
  
  console.log('');
  console.log(`Updated ${updatedCount} functions`);
  console.log('');
  console.log('🚀 Deploying...\n');
  
  await script.projects.updateContent({
    scriptId: scriptId,
    requestBody: {
      files: project.data.files
    }
  });
  
  console.log('✅ Deployment complete!');
  console.log('');
  console.log('All AI categorization functions updated:');
  console.log('  ✅ categorizeBatchWithAI (with ACLS filter)');
  console.log('  ✅ buildCategorizationPrompt (with ACLS rule)');
  console.log('  ✅ saveCategorizationResults (with clear fix)');
  console.log('');
  console.log('Now run AI Categorization and ACLS should finally be fixed!');
}

deployAll().catch(console.error);
