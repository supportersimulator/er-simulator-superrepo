/**
 * Remove Inline Script Completely
 *
 * The inline script (lines 653-708) is causing syntax errors.
 * Remove it entirely and rely ONLY on the setTimeout script at the end.
 */

const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function main() {
  console.log('🔧 Removing Problematic Inline Script\n');
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

  console.log('📝 Step 1: Remove the inline script (lines 653-708)...\n');

  // Remove the entire inline script block that's causing syntax errors
  // This is the script that says "Define function right before button"
  const inlineScriptPattern = /<script>[\s\r\n]+\/\/ Define function right before button[\s\S]*?<\/script>[\s\r\n]+/;

  if (!inlineScriptPattern.test(source)) {
    console.log('❌ Could not find inline script pattern\n');
    return;
  }

  source = source.replace(inlineScriptPattern, '\n');

  console.log('✅ Removed inline script\n');

  console.log('📝 Step 2: Verify setTimeout script has function definition...\n');

  // Check if setTimeout already has the function
  const hasSetTimeoutFunc = source.includes('console.log(\'📝 Defining window.runAICategorization\');');

  if (hasSetTimeoutFunc) {
    console.log('✅ setTimeout already has function definition\n');
  } else {
    console.log('❌ setTimeout missing function definition - this is a problem!\n');
    return;
  }

  panelFile.source = source;

  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('🚀 Deploying...\n');

  await script.projects.updateContent({
    scriptId: scriptId,
    requestBody: { files: project.data.files }
  });

  console.log('✅ Deployment complete!\n');
  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('🎯 Inline Script Removed!\n');
  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('Changes:');
  console.log('  ✅ Removed problematic inline script (lines 653-708)');
  console.log('  ✅ Relying only on setTimeout script (which works)\n');
  console.log('This should eliminate the "Failed to execute write" syntax errors!\n');
  console.log('Next steps:');
  console.log('  1. Hard refresh Google Sheet (Cmd+Shift+R)');
  console.log('  2. Clear browser cache if needed');
  console.log('  3. Open AI Categorization panel');
  console.log('  4. Check console - NO syntax errors!');
  console.log('  5. Should see "📝 Defining window.runAICategorization"');
  console.log('  6. Test the panel!\n');
}

main().catch(console.error);
