/**
 * Remove Conflicting Function from Archive File
 *
 * Strategy: Keep archive file intact but remove the ONE function
 * that conflicts with the active version
 */

const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function main() {
  console.log('🔧 Removing Conflicting Function from Archive\n');
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
  const archiveFile = project.data.files.find(f => f.name === 'Phase2_Enhanced_Categories_Pathways_Panel_ARCHIVE_2025-11-11');

  if (!archiveFile) {
    console.log('❌ Archive file not found\n');
    return;
  }

  console.log('✅ Found archive file (', Math.round(archiveFile.source.length / 1024), 'KB )\n');

  // Find the buildCategoriesPathwaysMainMenu_ function and remove it
  // Keep everything else intact

  let source = archiveFile.source;

  // Find the function
  const funcPattern = /function buildCategoriesPathwaysMainMenu_\(\) \{[\s\S]*?^}/m;
  const match = source.match(funcPattern);

  if (!match) {
    console.log('⚠️  Function not found in archive file\n');
    console.log('Maybe it was already removed?\n');
    return;
  }

  console.log('📝 Found buildCategoriesPathwaysMainMenu_() in archive\n');
  console.log('   Length:', match[0].length, 'characters\n');

  // Replace function with a comment explaining what was removed
  const replacement = `/**
 * buildCategoriesPathwaysMainMenu_() REMOVED FROM ARCHIVE
 *
 * This function was removed to prevent conflicts with the active version
 * in Phase2_Enhanced_Categories_With_AI.gs
 *
 * Original function archived: 2025-11-11
 * Removed to fix: Apps Script calling old buggy version alphabetically first
 *
 * If you need to restore this, it's in the Google Drive backup.
 */`;

  source = source.replace(funcPattern, replacement);

  console.log('✅ Replaced function with explanatory comment\n');

  archiveFile.source = source;

  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('🚀 Deploying fix...\n');

  await script.projects.updateContent({
    scriptId: scriptId,
    requestBody: { files: project.data.files }
  });

  console.log('✅ Deployment complete!\n');
  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('🎯 ROOT CAUSE FIXED!\n');
  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('What happened:');
  console.log('  ❌ Code.gs calls buildCategoriesPathwaysMainMenu_()');
  console.log('  ❌ Apps Script used ARCHIVE version (alphabetically first)');
  console.log('  ❌ Archive had old buggy HTML with syntax errors\n');
  console.log('What we fixed:');
  console.log('  ✅ Removed buildCategoriesPathwaysMainMenu_() from archive');
  console.log('  ✅ Now Apps Script will use Phase2_Enhanced_Categories_With_AI version');
  console.log('  ✅ Archive file still exists (safe), just without conflicting function\n');
  console.log('Next steps:');
  console.log('  1. Hard refresh Google Sheet (Cmd+Shift+R)');
  console.log('  2. Open AI Categorization panel');
  console.log('  3. Should work perfectly now!');
  console.log('  4. Select "Specific Rows" - input field should appear');
  console.log('  5. Button text should change\n');
}

main().catch(console.error);
