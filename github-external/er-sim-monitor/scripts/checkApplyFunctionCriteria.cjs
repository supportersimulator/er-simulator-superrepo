/**
 * Check Apply Function Criteria - Why Only 190 Cases Apply
 * 
 * Looks at the applyCategorization function to see what filters are applied
 */

const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function main() {
  console.log('🔍 Checking Apply Function Criteria\n');
  console.log('══════════════════════════════════════════════════════════════\n');

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

  // Find where we build the categorization dictionary
  const buildSection = codeFile.source.match(/for \(let i = 0; i < data\.length; i\+\+\) \{[\s\S]{0,1000}categorizationData\[caseID\]\s*=\s*\{/);

  if (!buildSection) {
    console.log('❌ Could not find dictionary building code');
    return;
  }

  console.log('📋 Dictionary Building Code:\n');
  console.log(buildSection[0]);
  console.log('\n══════════════════════════════════════════════════════════════\n');

  // Check for any if statements that filter cases
  const hasIfCheck = buildSection[0].includes('if (');
  
  if (hasIfCheck) {
    console.log('⚠️  Found conditional logic that may filter cases!\n');
    
    // Extract the condition
    const conditionMatch = buildSection[0].match(/if \(([^)]+)\) \{[\s\S]*?categorizationData/);
    if (conditionMatch) {
      console.log('Filter condition:\n');
      console.log('  if (' + conditionMatch[1] + ')\n');
      console.log('This condition determines which cases get added to the dictionary.\n');
      console.log('Cases that don\'t meet this condition are SKIPPED.\n');
    }
  } else {
    console.log('✅ No filtering found - all cases should be included\n');
  }

  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('Let me check what the actual condition variables are:\n');

  // Find the variable definitions before the if
  const contextMatch = codeFile.source.match(/for \(let i = 0; i < data\.length; i\+\+\) \{[\s\S]{0,2000}categorizationData\[caseID\]\s*=\s*\{/);
  
  if (contextMatch) {
    console.log(contextMatch[0].substring(0, 1500));
    console.log('\n...\n');
  }
}

main().catch(console.error);
