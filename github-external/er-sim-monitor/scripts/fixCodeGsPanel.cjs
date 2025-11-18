/**
 * Fix buildCategoriesPathwaysMainMenu_ in Code.gs
 *
 * The function exists in BOTH Code.gs and Phase2_Enhanced_Categories_With_AI.gs
 * Apps Script is calling the one in Code.gs which still has the bug
 */

const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function main() {
  console.log('🔧 Fixing buildCategoriesPathwaysMainMenu_ in Code.gs\n');
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
  const codeFile = project.data.files.find(f => f.name === 'Code');

  if (!codeFile) {
    console.log('❌ Code.gs not found\n');
    return;
  }

  console.log('✅ Found Code.gs\n');

  let source = codeFile.source;

  // ═══════════════════════════════════════════════════════════════════════
  // FIX: Remove the duplicate DOMContentLoaded code from Code.gs
  // ═══════════════════════════════════════════════════════════════════════
  console.log('🔍 Removing DOMContentLoaded code from Code.gs...\n');

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
    console.log('✅ Removed DOMContentLoaded code\n');
  } else {
    console.log('⚠️  Exact pattern not found, trying flexible match...\n');

    // Try flexible pattern
    const pattern = /document\.addEventListener\('DOMContentLoaded', function\(\) \{[\s\S]*?\}\);\s*<\/script>/;
    if (pattern.test(source)) {
      source = source.replace(pattern, '</script>');
      console.log('✅ Removed DOMContentLoaded block with flexible match\n');
    } else {
      console.log('❌ Could not find the problematic code\n');
      console.log('Searching for any DOMContentLoaded...\n');

      const lines = source.split('\n');
      lines.forEach((line, i) => {
        if (line.includes('DOMContentLoaded')) {
          console.log(`Found at line ${i + 1}: ${line.trim().substring(0, 80)}...`);
        }
      });
      return;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // DEPLOY
  // ═══════════════════════════════════════════════════════════════════════

  codeFile.source = source;

  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('🚀 Deploying fix to Code.gs...\n');

  await script.projects.updateContent({
    scriptId: scriptId,
    requestBody: { files: project.data.files }
  });

  console.log('✅ Deployment complete!\n');
  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('🎯 CODE.GS FIXED!\n');
  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('What was fixed:\n');
  console.log('  ❌ Removed duplicate DOMContentLoaded code from Code.gs');
  console.log('  ✅ This was causing the syntax errors\n');
  console.log('Next steps:\n');
  console.log('  1. CLOSE ALL Google Sheets tabs');
  console.log('  2. Reopen sheet in NEW incognito window');
  console.log('  3. Open AI Categorization panel');
  console.log('  4. Syntax errors should be GONE!\n');
}

main().catch(console.error);
