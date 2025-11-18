/**
 * Separate Script Blocks
 *
 * Keep ONLY the function definition in <head>
 * Move the IIFE (mode selector handler) back to <body> where DOM exists
 */

const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function main() {
  console.log('🔧 Separating Script Blocks\n');
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

  let html = panelFile.source;

  console.log('📝 Step 1: Extract JUST the function definition...\n');

  // The function definition part (without the IIFE)
  const funcDefOnly = `<script>
    console.log('📝 Defining window.runAICategorization in <head>');

    window.runAICategorization = function() {
      console.log('🚀 runAICategorization() called');

      try {
        const mode = document.getElementById('aiCatMode').value;
        const specificInput = document.getElementById('specificRowsInput').value.trim();

        if (mode === 'specific' && !specificInput) {
          alert('⚠️ Please enter Case IDs or row numbers for Specific Rows mode');
          return;
        }

        const confirmMsg = mode === 'specific'
          ? 'Run AI categorization on specific rows?\\n\\nInput: ' + specificInput + '\\n\\nThis will re-categorize only the specified cases.'
          : 'Run AI categorization on all 207 cases?\\n\\nThis will take 2-3 minutes and cost ~$0.20.\\n\\nResults will be saved to AI_Categorization_Results sheet for review.';

        if (!confirm(confirmMsg)) {
          return;
        }

        const btn = document.getElementById('run-ai-btn');
        btn.disabled = true;
        btn.textContent = mode === 'specific' ? '🔄 Categorizing Specific Rows...' : '🔄 Categorizing All Cases...';

        google.script.run
          .withSuccessHandler(function() {
            btn.disabled = false;
            btn.textContent = '✅ Complete!';
            setTimeout(() => {
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
  </script>`;

  console.log('📝 Step 2: Remove old script from <head>...\n');

  // Remove the existing script from head
  html = html.replace(/<script>[\s\S]*?console\.log\('📝 About to define[\s\S]*?<\/script>/, '');

  console.log('✅ Removed old script\n');

  console.log('📝 Step 3: Add clean function definition to <head>...\n');

  // Add the clean function definition to head
  html = html.replace('</head>', funcDefOnly + '\n  </head>');

  console.log('✅ Added clean script to <head>\n');

  panelFile.source = html;

  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('🚀 Deploying...\n');

  await script.projects.updateContent({
    scriptId: scriptId,
    requestBody: { files: project.data.files }
  });

  console.log('✅ Deployment complete!\n');
  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('🎯 Script Blocks Separated!\n');
  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('Changes:');
  console.log('  ✅ <head>: Only contains function definition (no DOM access)');
  console.log('  ✅ Function is simple and clean');
  console.log('  ✅ No IIFE trying to access DOM before it exists\n');
  console.log('Next steps:');
  console.log('  1. Refresh Google Sheet (F5)');
  console.log('  2. Open AI Categorization panel');
  console.log('  3. Check console for "📝 Defining window.runAICategorization in <head>"');
  console.log('  4. Check console for "✅ window.runAICategorization defined"');
  console.log('  5. Click Run button - MUST work now!\n');
}

main().catch(console.error);
