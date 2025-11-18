/**
 * Fix Mode Change with DOMContentLoaded
 *
 * Remove inline onchange and use addEventListener after DOM loads
 * This ensures the function is available when needed
 */

const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function main() {
  console.log('🔧 Fixing Mode Change with DOMContentLoaded\n');
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

  console.log('📝 Step 1: Remove inline onchange attribute...\n');

  // Remove the onchange attribute entirely
  html = html.replace(
    /<select id="aiCatMode"([^>]*)onchange="[^"]*"([^>]*)>/,
    '<select id="aiCatMode"$1$2>'
  );

  console.log('✅ Removed inline onchange\n');

  console.log('📝 Step 2: Add DOMContentLoaded event listener...\n');

  // Find the closing </script> tag (at the end)
  const closingScriptMatch = html.match(/(<\/script>)(?![\s\S]*<\/script>)/);

  if (!closingScriptMatch) {
    console.log('❌ Could not find closing </script> tag\n');
    return;
  }

  const domLoadedCode = `

    // ========================================================================
    // INITIALIZE MODE SELECTOR AFTER DOM LOADS
    // ========================================================================
    document.addEventListener('DOMContentLoaded', function() {
      console.log('🔄 DOM loaded, initializing mode selector');

      const modeSelector = document.getElementById('aiCatMode');
      if (modeSelector) {
        console.log('✅ Mode selector found');

        modeSelector.addEventListener('change', function() {
          console.log('🔄 Mode changed to:', this.value);

          const container = document.getElementById('specificRowsContainer');
          const btn = document.getElementById('run-ai-btn');

          if (container) {
            container.style.display = this.value === 'specific' ? 'block' : 'none';
            console.log('  Container display:', container.style.display);
          } else {
            console.error('❌ Container not found');
          }

          if (btn) {
            btn.textContent = this.value === 'specific'
              ? '🚀 Run AI Categorization (Specific Rows)'
              : '🚀 Run AI Categorization (All 207 Cases)';
            console.log('  Button text updated');
          } else {
            console.error('❌ Button not found');
          }
        });

        console.log('✅ Mode selector change listener attached');
      } else {
        console.error('❌ Mode selector not found');
      }
    });
`;

  // Insert before closing </script>
  const insertPos = html.lastIndexOf('</script>');
  html = html.substring(0, insertPos) + domLoadedCode + '\n  ' + html.substring(insertPos);

  console.log('✅ Added DOMContentLoaded event listener\n');

  console.log('📝 Step 3: Remove old handleModeChange function...\n');

  // Remove the old handleModeChange function if it exists
  html = html.replace(/function handleModeChange\(\) \{[\s\S]*?\n    \}/g, '');

  console.log('✅ Removed old handleModeChange function\n');

  panelFile.source = html;

  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('🚀 Deploying fix...\n');

  await script.projects.updateContent({
    scriptId: scriptId,
    requestBody: { files: project.data.files }
  });

  console.log('✅ Deployment complete!\n');
  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('🎯 Mode Selector Now Uses Event Listener!\n');
  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('Changes:');
  console.log('  ✅ Removed inline onchange="handleModeChange()"');
  console.log('  ✅ Added DOMContentLoaded event listener');
  console.log('  ✅ Attaches change listener after DOM loads');
  console.log('  ✅ Removed old handleModeChange function\n');
  console.log('Next steps:');
  console.log('  1. Refresh Google Sheet (F5)');
  console.log('  2. Open AI Categorization panel');
  console.log('  3. Check console for "🔄 DOM loaded, initializing mode selector"');
  console.log('  4. Change dropdown to "Specific Rows"');
  console.log('  5. Input field should appear!\n');
}

main().catch(console.error);
