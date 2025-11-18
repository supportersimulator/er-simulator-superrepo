/**
 * Fix runAICategorization with Debug Logging
 *
 * 1. Move inline onchange to proper function
 * 2. Add console.log debug statements
 * 3. Add try-catch for better error handling
 */

const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function main() {
  console.log('🔧 Fixing runAICategorization with Debug Logging\n');
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

  // Fix 1: Move inline onchange to proper function
  console.log('📝 Fix 1: Moving inline onchange to function...\n');

  // Replace long inline onchange with simple function call
  html = html.replace(
    /<select id="aiCatMode"[^>]*onchange="[^"]*">/,
    '<select id="aiCatMode" style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 3px; font-size: 13px;" onchange="handleModeChange()">'
  );

  console.log('✅ Replaced inline onchange with handleModeChange()\n');

  // Fix 2: Add handleModeChange function to script block
  console.log('📝 Fix 2: Adding handleModeChange() function...\n');

  const handleModeChangeFunc = `
    /**
     * Handle mode selector change
     */
    function handleModeChange() {
      const mode = document.getElementById('aiCatMode').value;
      const container = document.getElementById('specificRowsContainer');
      const btn = document.getElementById('run-ai-btn');

      // Show/hide input field
      container.style.display = mode === 'specific' ? 'block' : 'none';

      // Update button text
      btn.textContent = mode === 'specific'
        ? '🚀 Run AI Categorization (Specific Rows)'
        : '🚀 Run AI Categorization (All 207 Cases)';
    }
`;

  // Insert after the runAICategorization function
  html = html.replace(
    /(function runAICategorization\(\) \{[\s\S]*?\n    \})/,
    '$1\\n' + handleModeChangeFunc
  );

  console.log('✅ Added handleModeChange() function\n');

  // Fix 3: Add debug logging to runAICategorization
  console.log('📝 Fix 3: Adding debug logging to runAICategorization...\n');

  html = html.replace(
    /function runAICategorization\(\) \{/,
    `function runAICategorization() {
      console.log('🚀 runAICategorization() called');

      try {`
  );

  // Add closing brace for try-catch before google.script.run
  html = html.replace(
    /(google\\.script\\.run[\s\S]*?\\.runAICategorization\(mode, specificInput\);)/,
    `$1
      } catch (error) {
        console.error('❌ Error in runAICategorization():', error);
        alert('JavaScript Error: ' + error.message);
      }`
  );

  console.log('✅ Added try-catch and console.log\n');

  panelFile.source = html;

  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('🚀 Deploying fixes...\n');

  await script.projects.updateContent({
    scriptId: scriptId,
    requestBody: { files: project.data.files }
  });

  console.log('✅ Deployment complete!\n');
  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('🎯 Debug Logging Added!\n');
  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('Changes made:');
  console.log('  ✅ Moved inline onchange to handleModeChange() function');
  console.log('  ✅ Added console.log at start of runAICategorization()');
  console.log('  ✅ Added try-catch for error handling\n');
  console.log('Next steps:');
  console.log('  1. Refresh Google Sheet (F5)');
  console.log('  2. Open AI Categorization panel');
  console.log('  3. Open browser console (F12 or Cmd+Option+I)');
  console.log('  4. Try clicking the button');
  console.log('  5. Check console for "🚀 runAICategorization() called" message');
  console.log('  6. Copy any error messages you see\n');
}

main().catch(console.error);
