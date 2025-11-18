/**
 * Fix Category Mappings Editor Script Block
 *
 * Remove the duplicate mode selector initialization code
 * that doesn't belong in the Category Mappings Editor modal
 */

const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function main() {
  console.log('🔧 Fixing Category Mappings Editor Script Block\n');
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

  console.log('📥 Downloading project...\n');

  const project = await script.projects.getContent({ scriptId });
  const panelFile = project.data.files.find(f => f.name === 'Phase2_Enhanced_Categories_With_AI');

  if (!panelFile) {
    console.log('❌ Panel file not found\n');
    return;
  }

  console.log('✅ Found Phase2_Enhanced_Categories_With_AI.gs\n');

  let source = panelFile.source;

  // ═══════════════════════════════════════════════════════════════════════
  // FIX: Remove the duplicate mode selector initialization from Category Mappings Editor
  // ═══════════════════════════════════════════════════════════════════════
  console.log('🔍 Removing duplicate mode selector code from Category Mappings Editor...\n');

  const problematicCode = `

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

  </script>`;

  const fixedCode = `      </script>`;

  if (source.includes(problematicCode)) {
    source = source.replace(problematicCode, fixedCode);
    console.log('✅ Removed duplicate mode selector code\n');
  } else {
    console.log('⚠️  Exact code pattern not found, trying flexible match...\n');

    // Try to find and remove just the DOMContentLoaded block
    const pattern = /document\.addEventListener\('DOMContentLoaded', function\(\) \{[\s\S]*?\}\);\s*<\/script>/;
    if (pattern.test(source)) {
      source = source.replace(pattern, '</script>');
      console.log('✅ Removed DOMContentLoaded block with flexible match\n');
    } else {
      console.log('❌ Could not find the problematic code\n');
      return;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // DEPLOY
  // ═══════════════════════════════════════════════════════════════════════

  panelFile.source = source;

  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('🚀 Deploying fix...\n');

  await script.projects.updateContent({
    scriptId: scriptId,
    requestBody: { files: project.data.files }
  });

  console.log('✅ Deployment complete!\n');
  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('🎯 CATEGORY MAPPINGS EDITOR FIXED!\n');
  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('What was fixed:\n');
  console.log('  ❌ Removed duplicate mode selector initialization code');
  console.log('  ❌ This code was trying to find elements that do not exist in the modal');
  console.log('  ✅ Category Mappings Editor now has clean script block\n');
  console.log('Next steps:\n');
  console.log('  1. CLOSE Google Sheet tab completely (Cmd+W)');
  console.log('  2. Reopen sheet in NEW tab');
  console.log('  3. Open AI Categorization panel');
  console.log('  4. Syntax errors should be GONE!');
  console.log('  5. Select "Specific Rows" mode - input should appear!\n');
}

main().catch(console.error);
