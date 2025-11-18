/**
 * Clean Fix Using Apps Script API
 *
 * Based on diagnostic results:
 * - Enhanced_Visual_Panel_With_Toggle has 2 problematic quote escaping patterns
 * - Lines 64 and 79 use .replace(/'/g, "\\'") which causes syntax errors
 * - Need to replace with .replace(/'/g, '&apos;')
 */

const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function main() {
  console.log('🔧 CLEAN FIX - Enhanced_Visual_Panel_With_Toggle\n');
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

  console.log('📥 Reading Enhanced_Visual_Panel_With_Toggle via API...\n');

  const project = await script.projects.getContent({ scriptId });
  const targetFile = project.data.files.find(f => f.name === 'Enhanced_Visual_Panel_With_Toggle');

  if (!targetFile) {
    console.log('❌ Enhanced_Visual_Panel_With_Toggle not found\n');
    return;
  }

  console.log('✅ Found Enhanced_Visual_Panel_With_Toggle.gs\n');

  // ═══════════════════════════════════════════════════════════════════════
  // FIX: Replace problematic quote escaping
  // ═══════════════════════════════════════════════════════════════════════

  const BEFORE = ".replace(/'/g, \"\\\\'\")";
  const AFTER = ".replace(/'/g, '&apos;')";

  const occurrencesBefore = targetFile.source.split(BEFORE).length - 1;

  console.log(`🔍 Found ${occurrencesBefore} instances of problematic pattern\n`);

  if (occurrencesBefore === 0) {
    console.log('✅ Already fixed! No changes needed.\n');
    return;
  }

  // Show exact lines being fixed
  const lines = targetFile.source.split('\n');
  console.log('📍 Lines to be fixed:\n');
  lines.forEach((line, idx) => {
    if (line.includes(BEFORE)) {
      console.log(`   Line ${idx + 1}: ${line.trim().substring(0, 80)}...\n`);
    }
  });

  // Perform replacement
  targetFile.source = targetFile.source.split(BEFORE).join(AFTER);

  const occurrencesAfter = targetFile.source.split(BEFORE).length - 1;

  console.log(`✅ Fixed ${occurrencesBefore - occurrencesAfter} instances\n`);

  // ═══════════════════════════════════════════════════════════════════════
  // DEPLOY
  // ═══════════════════════════════════════════════════════════════════════

  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('🚀 Deploying fix via Apps Script API...\n');

  await script.projects.updateContent({
    scriptId: scriptId,
    requestBody: { files: project.data.files }
  });

  console.log('✅ Deployment complete!\n');
  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('🎯 SYNTAX ERRORS FIXED!\n');
  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('What was fixed:\n');
  console.log(`  File: Enhanced_Visual_Panel_With_Toggle.gs`);
  console.log(`  Lines: 64, 79`);
  console.log(`  Changed: .replace(/'/g, "\\\\'") → .replace(/'/g, '&apos;')`);
  console.log(`  Impact: Fixes browser syntax errors in AI Categorization Tools panel\n`);
  console.log('Next steps:\n');
  console.log('  1. CLOSE Google Sheet tab completely (Cmd+W)');
  console.log('  2. Reopen sheet in NEW tab');
  console.log('  3. Click 🤖 AI Categorization Tools button');
  console.log('  4. Browser console should be CLEAN (no syntax errors)');
  console.log('  5. Select "Specific Rows" mode - input field should appear!');
  console.log('  6. Test with 19 ACLS cases\n');
}

main().catch(console.error);
