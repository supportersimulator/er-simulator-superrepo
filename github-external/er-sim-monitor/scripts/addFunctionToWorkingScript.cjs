/**
 * Add Function to Working Script
 *
 * The delayed setTimeout script IS executing successfully.
 * Add the function definition to that SAME script block.
 */

const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function main() {
  console.log('🔧 Adding Function to Working Script Block\n');
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
  const panelFile = project.data.files.find(f => f.name === 'Phase2_Enhanced_Categories_With_AI');

  if (!panelFile) {
    console.log('❌ Panel file not found\n');
    return;
  }

  let source = panelFile.source;

  console.log('📝 Finding the working delayed script...\n');

  // Find the setTimeout script that IS working
  const pattern = /setTimeout\(function\(\) \{[\s\r\n]+console\.log\('⏰ Delayed script executing\.\.\.'\);/;

  if (!pattern.test(source)) {
    console.log('❌ Could not find the delayed script\n');
    return;
  }

  console.log('✅ Found the working script\n');
  console.log('📝 Adding function definition at the START of setTimeout...\n');

  // Add the function definition right after the setTimeout starts
  const functionDef = `setTimeout(function() {
    // ═══════════════════════════════════════════════════════════════════════
    // DEFINE FUNCTION FIRST (in the same script block that works)
    // ═══════════════════════════════════════════════════════════════════════
    console.log('📝 Defining window.runAICategorization');

    window.runAICategorization = function() {
      console.log('🚀 runAICategorization() called');

      try {
        var mode = document.getElementById('aiCatMode').value;
        var specificInput = document.getElementById('specificRowsInput').value.trim();

        if (mode === 'specific' && !specificInput) {
          alert('⚠️ Please enter Case IDs or row numbers for Specific Rows mode');
          return;
        }

        var confirmMsg = mode === 'specific'
          ? 'Run AI categorization on specific rows?\\n\\nInput: ' + specificInput + '\\n\\nThis will re-categorize only the specified cases.'
          : 'Run AI categorization on all 207 cases?\\n\\nThis will take 2-3 minutes and cost ~$0.20.\\n\\nResults will be saved to AI_Categorization_Results sheet for review.';

        if (!confirm(confirmMsg)) {
          return;
        }

        var btn = document.getElementById('run-ai-btn');
        btn.disabled = true;
        btn.textContent = mode === 'specific' ? '🔄 Categorizing Specific Rows...' : '🔄 Categorizing All Cases...';

        google.script.run
          .withSuccessHandler(function() {
            btn.disabled = false;
            btn.textContent = '✅ Complete!';
            setTimeout(function() {
              btn.textContent = mode === 'specific' ? '🚀 Run AI Categorization (Specific)' : '🚀 Run AI Categorization (All 207 Cases)';
            }, 3000);
            alert('✅ AI Categorization complete!\\n\\nClick Refresh to see results.');
          })
          .withFailureHandler(function(error) {
            btn.disabled = false;
            btn.textContent = mode === 'specific' ? '🚀 Run AI Categorization (Specific)' : '🚀 Run AI Categorization (All 207 Cases)';
            alert('❌ Error: ' + error.message);
          })
          .runAICategorization(mode, specificInput);

      } catch (error) {
        console.error('❌ Error in runAICategorization():', error);
        alert('JavaScript Error: ' + error.message);
      }
    };

    console.log('✅ window.runAICategorization defined');

    // ═══════════════════════════════════════════════════════════════════════
    // NOW DO THE MODE SELECTOR STUFF (existing code)
    // ═══════════════════════════════════════════════════════════════════════
    console.log('⏰ Delayed script executing...');`;

  source = source.replace(pattern, functionDef);

  console.log('✅ Added function definition to working script\n');

  panelFile.source = source;

  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('🚀 Deploying...\n');

  await script.projects.updateContent({
    scriptId: scriptId,
    requestBody: { files: project.data.files }
  });

  console.log('✅ Deployment complete!\n');
  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('🎯 Function Added to Working Script!\n');
  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('Logic:');
  console.log('  ✅ The delayed script IS executing (we see mode selector logs)');
  console.log('  ✅ So we add the function definition to THAT SAME SCRIPT');
  console.log('  ✅ Function defined BEFORE mode selector code runs\n');
  console.log('Console output order should be:');
  console.log('  1. 📝 Defining window.runAICategorization');
  console.log('  2. ✅ window.runAICategorization defined');
  console.log('  3. ⏰ Delayed script executing...');
  console.log('  4. Mode selector: true');
  console.log('  5. ... (rest of existing logs)\n');
  console.log('NOW IT MUST WORK - the function is in the script that executes!\n');
}

main().catch(console.error);
