/**
 * Fix handleModeChange with Debug Logging
 *
 * Add console.log statements to track exactly what's happening
 */

const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function main() {
  console.log('🔧 Adding Debug to handleModeChange\n');
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

  console.log('📝 Updating handleModeChange with debug logging...\n');

  // Find and replace handleModeChange function
  const oldFuncPattern = /function handleModeChange\(\) \{[\s\S]*?\n    \}/;

  const newFunc = `function handleModeChange() {
      console.log('🔄 handleModeChange() called');

      try {
        const mode = document.getElementById('aiCatMode').value;
        console.log('  Mode selected:', mode);

        const container = document.getElementById('specificRowsContainer');
        console.log('  Container found:', !!container);

        const btn = document.getElementById('run-ai-btn');
        console.log('  Button found:', !!btn);

        // Show/hide input field
        const shouldShow = mode === 'specific';
        console.log('  Should show container:', shouldShow);

        container.style.display = shouldShow ? 'block' : 'none';
        console.log('  Container display set to:', container.style.display);

        // Update button text
        const buttonText = mode === 'specific'
          ? '🚀 Run AI Categorization (Specific Rows)'
          : '🚀 Run AI Categorization (All 207 Cases)';

        btn.textContent = buttonText;
        console.log('  Button text updated to:', buttonText);
        console.log('✅ handleModeChange() complete');

      } catch (error) {
        console.error('❌ Error in handleModeChange():', error);
        alert('Error changing mode: ' + error.message);
      }
    }`;

  if (oldFuncPattern.test(html)) {
    html = html.replace(oldFuncPattern, newFunc);
    console.log('✅ Replaced handleModeChange() with debug version\n');
  } else {
    console.log('❌ Could not find handleModeChange() to replace\n');
    return;
  }

  panelFile.source = html;

  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('🚀 Deploying...\n');

  await script.projects.updateContent({
    scriptId: scriptId,
    requestBody: { files: project.data.files }
  });

  console.log('✅ Deployment complete!\n');
  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('🎯 Debug Logging Added to handleModeChange!\n');
  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('Next steps:');
  console.log('  1. Refresh Google Sheet (F5)');
  console.log('  2. Open AI Categorization panel');
  console.log('  3. Open browser console (F12)');
  console.log('  4. Change the dropdown to "Specific Rows"');
  console.log('  5. Check console for:');
  console.log('     - "🔄 handleModeChange() called"');
  console.log('     - Mode, container, button found status');
  console.log('     - Any error messages');
  console.log('  6. Send me what you see in the console\n');
}

main().catch(console.error);
