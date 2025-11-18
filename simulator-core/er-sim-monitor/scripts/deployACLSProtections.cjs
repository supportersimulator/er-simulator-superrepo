/**
 * Deploy ACLS Protections
 *
 * Deploys BOTH protections to prevent ACLS over-categorization:
 * 1. ACLS Filter - removes ACLS from valid symptoms list
 * 2. Enhanced AI Prompt - adds strict ACLS RULE to AI instructions
 */

const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function main() {
  console.log('🔧 Deploying ACLS Protections\n');
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

  console.log('📥 Downloading current project...\n');

  const project = await script.projects.getContent({ scriptId });
  const codeFile = project.data.files.find(f => f.name === 'Code');

  if (!codeFile) {
    console.log('❌ Code.gs not found');
    return;
  }

  let code = codeFile.source;
  let changes = [];

  // PROTECTION 1: Add ACLS Filter
  console.log('🛡️  Protection 1: ACLS Filter\n');

  const hasFilter = code.includes('filter(s => s !== "ACLS")') ||
                    code.includes('filter(s => s != "ACLS")');

  if (!hasFilter) {
    // Find where validSymptoms is built
    const validSymptomsMatch = code.match(/(const validSymptoms = Object\.keys\(accronymMapping\)\.join\(', '\);)/);

    if (validSymptomsMatch) {
      const oldLine = validSymptomsMatch[1];
      const newLine = `const validSymptoms = Object.keys(accronymMapping)
    .filter(s => s !== "ACLS")  // ACLS ONLY for actual cardiac arrest
    .join(', ');`;

      code = code.replace(oldLine, newLine);
      changes.push('✅ Added ACLS filter to validSymptoms');
      console.log('   ✅ Added ACLS filter');
      console.log('   Location: categorizeBatchWithAI() function');
      console.log('   Effect: ACLS removed from AI options\n');
    } else {
      console.log('   ⚠️  Could not find validSymptoms declaration');
      console.log('   (May already be in different format)\n');
    }
  } else {
    console.log('   ✅ ACLS filter already exists\n');
  }

  // PROTECTION 2: Add Enhanced AI Prompt with ACLS RULE
  console.log('──────────────────────────────────────────────────────────────\n');
  console.log('🛡️  Protection 2: Enhanced AI Prompt with ACLS RULE\n');

  const hasACLSRule = code.includes('CRITICAL ACLS RULE') ||
                      code.includes('ACLS ONLY for');

  if (!hasACLSRule) {
    // Find the AI prompt in categorizeBatchWithAI
    const promptMatch = code.match(/const prompt = `[\s\S]*?Valid symptom acronyms[\s\S]*?Valid systems[\s\S]*?`;/);

    if (promptMatch) {
      const oldPrompt = promptMatch[0];

      // Add ACLS rule after the valid options section
      const newPrompt = oldPrompt.replace(
        /Valid systems: \${validSystems}/,
        `Valid systems: \${validSystems}

⚠️ CRITICAL ACLS RULE:
ACLS (Advanced Cardiac Life Support) should ONLY be used for:
- Actual cardiac arrest (patient is unresponsive, pulseless, not breathing)
- Requires CPR or defibrillation
- "Code Blue" situations

Do NOT use ACLS for:
- Chest pain with a pulse (use CP - Chest Pain or AMIN - Acute MI)
- Shortness of breath but breathing (use SOB or PE)
- Conscious patients in distress (use appropriate symptom)
- Any patient who is alert and talking

If the scenario does not explicitly state "cardiac arrest," "unresponsive," "no pulse," or "CPR," then DO NOT choose ACLS.`
      );

      code = code.replace(oldPrompt, newPrompt);
      changes.push('✅ Added CRITICAL ACLS RULE to AI prompt');
      console.log('   ✅ Added CRITICAL ACLS RULE to AI prompt');
      console.log('   Location: categorizeBatchWithAI() function');
      console.log('   Effect: AI has explicit guidance on ACLS usage\n');
    } else {
      console.log('   ⚠️  Could not find AI prompt');
      console.log('   (Prompt structure may be different)\n');
    }
  } else {
    console.log('   ✅ ACLS RULE already exists in prompt\n');
  }

  if (changes.length === 0) {
    console.log('══════════════════════════════════════════════════════════════\n');
    console.log('✅ Both ACLS protections already deployed!\n');
    console.log('No changes needed.\n');
    return;
  }

  // Deploy changes
  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('🚀 Deploying changes...\n');

  codeFile.source = code;

  await script.projects.updateContent({
    scriptId: scriptId,
    requestBody: { files: project.data.files }
  });

  console.log('✅ Deployment complete!\n');
  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('📋 Changes Applied:\n');
  changes.forEach(change => console.log('  ' + change));
  console.log('');

  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('🎯 Expected Impact:\n');
  console.log('  BEFORE: AI could choose ACLS freely');
  console.log('          Result: 19 cases categorized as ACLS\n');
  console.log('  AFTER:  AI cannot see ACLS as option (filtered out)');
  console.log('          AI has explicit rules about ACLS usage');
  console.log('          Result: ~0 cases categorized as ACLS\n');
  console.log('📊 Next Step:\n');
  console.log('  Re-run AI categorization for 19 cases to fix them\n');
}

main().catch(console.error);
