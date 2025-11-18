/**
 * Debug Function Definition
 *
 * Add console.log to track when window.runAICategorization gets defined
 */

const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function main() {
  console.log('🔧 Adding Debug Logging for Function Definition\n');
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

  const project = await script.projects.getContent({ scriptId });
  const panelFile = project.data.files.find(f => f.name === 'Phase2_Enhanced_Categories_With_AI');

  if (!panelFile) {
    console.log('❌ Panel file not found\n');
    return;
  }

  let html = panelFile.source;

  console.log('📝 Adding logging at function definition...\n');

  // Add logging right when the function is assigned
  html = html.replace(
    'window.runAICategorization = function() {',
    `window.runAICategorization = function() {
      console.log('✅ window.runAICategorization executing...');`
  );

  // Add logging BEFORE the function definition to confirm script is running
  html = html.replace(
    'window.runAICategorization = function() {',
    `console.log('📝 About to define window.runAICategorization');
    window.runAICategorization = function() {`
  );

  console.log('✅ Added debug logging\n');

  panelFile.source = html;

  console.log('🚀 Deploying...\n');

  await script.projects.updateContent({
    scriptId: scriptId,
    requestBody: { files: project.data.files }
  });

  console.log('✅ Deployment complete!\n');
  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('🎯 Debug Logging Added!\n');
  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('When panel opens, check console for:');
  console.log('  📝 About to define window.runAICategorization');
  console.log('  ✅ window.runAICategorization executing... (when button clicked)\n');
  console.log('If you see the first but not when clicking, function IS defined');
  console.log('but button onclick might not be calling it correctly.\n');
}

main().catch(console.error);
