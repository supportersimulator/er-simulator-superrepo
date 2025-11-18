/**
 * Move runAICategorization to <head>
 *
 * Move the function definition from <body> to <head> to ensure it loads
 * BEFORE any HTML elements that reference it
 */

const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function main() {
  console.log('🔧 Moving runAICategorization to <head>\n');
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

  console.log('📝 Step 1: Extract the runAICategorization script from body...\n');

  // Find and extract the entire first script block (with runAICategorization)
  const scriptMatch = html.match(/<script>[\s\r\n]+\/\/ Define runAICategorization at TOP[\s\S]*?<\/script>/);

  if (!scriptMatch) {
    console.log('❌ Could not find the runAICategorization script block\n');
    return;
  }

  const scriptBlock = scriptMatch[0];
  console.log('✅ Found script block (' + scriptBlock.length + ' characters)\n');

  console.log('📝 Step 2: Remove script from body...\n');

  // Remove the script from its current location
  html = html.replace(scriptBlock, '');

  console.log('✅ Removed script from body\n');

  console.log('📝 Step 3: Add script to end of <head>...\n');

  // Add the script at the end of <head> (right before </head>)
  html = html.replace('</head>', scriptBlock + '\n  </head>');

  console.log('✅ Added script to <head>\n');

  panelFile.source = html;

  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('🚀 Deploying...\n');

  await script.projects.updateContent({
    scriptId: scriptId,
    requestBody: { files: project.data.files }
  });

  console.log('✅ Deployment complete!\n');
  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('🎯 Function Moved to <head>!\n');
  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('Changes:');
  console.log('  ✅ Moved runAICategorization script from <body> to <head>');
  console.log('  ✅ Function will now load BEFORE any HTML elements');
  console.log('  ✅ Button onclick should be able to find the function\n');
  console.log('Next steps:');
  console.log('  1. Refresh Google Sheet (F5)');
  console.log('  2. Open AI Categorization panel');
  console.log('  3. Open console (F12)');
  console.log('  4. You should see "📝 About to define window.runAICategorization" immediately');
  console.log('  5. Click the Run button');
  console.log('  6. IT SHOULD WORK NOW!\n');
}

main().catch(console.error);
