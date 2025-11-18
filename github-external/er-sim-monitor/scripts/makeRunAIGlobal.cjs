/**
 * Make runAICategorization Globally Accessible
 *
 * Convert to window.runAICategorization so it's available when button loads
 */

const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function main() {
  console.log('🔧 Making runAICategorization Globally Accessible\n');
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

  console.log('📝 Step 1: Find runAICategorization function...\n');

  // Find the function - match until next function or closing tag
  const funcMatch = html.match(/function runAICategorization\(\) \{[\s\S]*?(?=\n    function [a-zA-Z]|\n  <)/);

  if (!funcMatch) {
    console.log('❌ runAICategorization not found\n');
    return;
  }

  console.log('✅ Found function (' + funcMatch[0].length + ' characters)\n');

  console.log('📝 Step 2: Convert to window.runAICategorization...\n');

  // Replace function declaration with window assignment
  const globalFunc = funcMatch[0].replace(
    'function runAICategorization() {',
    'window.runAICategorization = function() {\n      console.log(\'🚀 runAICategorization called (window.runAICategorization)\');'
  );

  html = html.replace(funcMatch[0], globalFunc);

  console.log('✅ Converted to window.runAICategorization\n');

  console.log('📝 Step 3: Update button onclick...\n');

  // Update button to safely call the function
  const buttonPattern = /<button id="run-ai-btn"([^>]*)onclick="runAICategorization\(\)"([^>]*)>/;
  const safeOnclick = '<button id="run-ai-btn"$1onclick="console.log(\'🔘 Button clicked\'); if (typeof window.runAICategorization === \'function\') { window.runAICategorization(); } else { console.error(\'❌ window.runAICategorization not defined\'); alert(\'Function not loaded. Please close and reopen the panel.\'); }"$2>';

  html = html.replace(buttonPattern, safeOnclick);

  console.log('✅ Updated button onclick with safety check\n');

  panelFile.source = html;

  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('🚀 Deploying...\n');

  await script.projects.updateContent({
    scriptId: scriptId,
    requestBody: { files: project.data.files }
  });

  console.log('✅ Deployment complete!\n');
  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('🎯 runAICategorization Now Globally Accessible!\n');
  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('Changes:');
  console.log('  ✅ Function defined as window.runAICategorization');
  console.log('  ✅ Button safely checks if function exists');
  console.log('  ✅ Console logging added for debugging\n');
  console.log('Next steps:');
  console.log('  1. Refresh Google Sheet (F5)');
  console.log('  2. Open panel');
  console.log('  3. Click button');
  console.log('  4. Check console for "🔘 Button clicked"');
  console.log('  5. Should finally work!\n');
}

main().catch(console.error);
