/**
 * Define runAICategorization as Inline Script
 *
 * Instead of having a separate <script> block in <head>,
 * define the function inline right before the button
 */

const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function main() {
  console.log('🔧 Moving Function Definition Inline\n');
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

  console.log('📝 Step 1: Remove script from <head>...\n');

  // Remove the script from head
  source = source.replace(/<script>[\s\S]*?console\.log\('📝 Defining window\.runAICategorization[\s\S]*?<\/script>[\s\r\n]+<\/head>/, '</head>');

  console.log('✅ Removed script from <head>\n');

  console.log('📝 Step 2: Add inline script RIGHT BEFORE the button...\n');

  // Find the location right before the Run AI button
  const buttonPattern = /<button id="run-ai-btn"/;

  if (!buttonPattern.test(source)) {
    console.log('❌ Could not find run-ai-btn button\n');
    return;
  }

  // Create inline script to define function
  const inlineScript = `
      <script>
        // Define function right before button
        if (typeof window.runAICategorization === 'undefined') {
          console.log('📝 Defining window.runAICategorization (inline before button)');

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
        } else {
          console.log('ℹ️ window.runAICategorization already defined');
        }
      </script>

      `;

  // Insert the script right before the button
  source = source.replace(buttonPattern, inlineScript + '<button id="run-ai-btn"');

  console.log('✅ Added inline script before button\n');

  panelFile.source = source;

  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('🚀 Deploying...\n');

  await script.projects.updateContent({
    scriptId: scriptId,
    requestBody: { files: project.data.files }
  });

  console.log('✅ Deployment complete!\n');
  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('🎯 Function Now Defined Inline!\n');
  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('Changes:');
  console.log('  ✅ Removed script from <head>');
  console.log('  ✅ Added inline script RIGHT BEFORE button');
  console.log('  ✅ Function defined exactly when needed\n');
  console.log('Next steps:');
  console.log('  1. Refresh Google Sheet (F5)');
  console.log('  2. Open AI Categorization panel');
  console.log('  3. Look for "📝 Defining window.runAICategorization (inline before button)"');
  console.log('  4. Click Run - should work now!\n');
}

main().catch(console.error);
