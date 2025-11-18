/**
 * Add Test Marker to Panel - Verify We're Editing the Right File
 *
 * Add a visible "🧪 TEST VERSION ACTIVE" banner at the top
 * This will confirm we're editing the panel you're actually seeing
 */

const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function main() {
  console.log('🧪 Adding Test Marker to Panel\n');
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

  // Add a VERY VISIBLE test marker at the top of the panel
  // Find the first <body> tag and add the marker right after it

  const testMarker = `
    <!-- 🧪 TEST MARKER - If you see this, we're editing the correct file! -->
    <div style="background: #ff0; color: #000; padding: 10px; text-align: center; font-weight: bold; border: 3px solid #f00;">
      🧪 TEST VERSION ACTIVE - ${new Date().toISOString()}
    </div>
  `;

  // Find <body> and add marker after it
  source = source.replace(/<body>/, '<body>' + testMarker);

  console.log('✅ Added test marker\n');

  panelFile.source = source;

  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('🚀 Deploying test marker...\n');

  await script.projects.updateContent({
    scriptId: scriptId,
    requestBody: { files: project.data.files }
  });

  console.log('✅ Deployment complete!\n');
  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('🧪 TEST MARKER ADDED!\n');
  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('Next steps:\n');
  console.log('1. Hard refresh Google Sheet (Cmd+Shift+R)');
  console.log('2. Open AI Categorization panel');
  console.log('3. Look at the VERY TOP of the panel\n');
  console.log('If you see a YELLOW banner with "🧪 TEST VERSION ACTIVE":');
  console.log('  ✅ We ARE editing the correct file!\n');
  console.log('If you DON\'T see the yellow banner:');
  console.log('  ❌ We are editing the WRONG file (different panel is loading)\n');
}

main().catch(console.error);
