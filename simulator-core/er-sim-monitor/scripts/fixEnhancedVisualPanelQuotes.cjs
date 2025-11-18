/**
 * Fix Quote Escaping in Enhanced_Visual_Panel_With_Toggle.gs
 *
 * Fixes lines 64 and 79 which have problematic quote escaping:
 * Change: .replace(/'/g, "\\'")
 * To: .replace(/'/g, '&apos;')
 */

const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function main() {
  console.log('🔧 Fixing Enhanced_Visual_Panel_With_Toggle Quote Escaping\n');
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
  const panelFile = project.data.files.find(f => f.name === 'Enhanced_Visual_Panel_With_Toggle');

  if (!panelFile) {
    console.log('❌ Enhanced_Visual_Panel_With_Toggle file not found\n');
    return;
  }

  console.log('✅ Found Enhanced_Visual_Panel_With_Toggle.gs\n');

  let source = panelFile.source;
  let fixCount = 0;

  // ═══════════════════════════════════════════════════════════════════════
  // FIX: Replace backslash-quote escaping with &apos; entity
  // ═══════════════════════════════════════════════════════════════════════
  console.log('🔍 Searching for quote escaping patterns...\n');

  // Pattern 1: viewSymptomCategory (line 64 area)
  const pattern1Before = ".replace(/'/g, \"\\\\'\")";
  const pattern1After = ".replace(/'/g, '&apos;')";

  // Count occurrences
  const matches = source.split(pattern1Before).length - 1;
  console.log(`Found ${matches} instances of quote escaping pattern\n`);

  if (matches > 0) {
    // Replace ALL occurrences (should be lines 64 and 79)
    source = source.split(pattern1Before).join(pattern1After);
    console.log(`✅ Replaced ${matches} instances of .replace(/'/g, "\\\\'") with .replace(/'/g, '&apos;')\n`);
    fixCount = matches;
  } else {
    console.log('⚠️  Pattern not found (may already be fixed)\n');
  }

  // ═══════════════════════════════════════════════════════════════════════
  // DEPLOY
  // ═══════════════════════════════════════════════════════════════════════

  if (fixCount === 0) {
    console.log('══════════════════════════════════════════════════════════════\n');
    console.log('ℹ️  No fixes needed - already using &apos; escaping!\n');
    console.log('══════════════════════════════════════════════════════════════\n');
    return;
  }

  panelFile.source = source;

  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('🚀 Deploying fix...\n');

  await script.projects.updateContent({
    scriptId: scriptId,
    requestBody: { files: project.data.files }
  });

  console.log('✅ Deployment complete!\n');
  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('🎯 ENHANCED VISUAL PANEL FIXED!\n');
  console.log('══════════════════════════════════════════════════════════════\n');
  console.log(`Fixed ${fixCount} instances of quote escaping:\n`);
  console.log('  ❌ Old: .replace(/\\'/g, "\\\\\\'")');
  console.log('  ✅ New: .replace(/\\'/g, \\'&apos;\\')\n');
  console.log('This should fix the syntax errors you see when clicking:\n');
  console.log('  🤖 AI Categorization Tools button\n');
  console.log('Next steps:\n');
  console.log('  1. CLOSE Google Sheet tab completely (Cmd+W)');
  console.log('  2. Reopen sheet in NEW tab');
  console.log('  3. Click 🤖 AI Categorization Tools button');
  console.log('  4. Console should be CLEAN - no syntax errors!');
  console.log('  5. Select "Specific Rows" mode - input field should appear!\n');
}

main().catch(console.error);
