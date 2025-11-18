/**
 * Fix Categories & Pathways Panel Logs
 *
 * Makes Apply logs appear in the "Live Retry Logs" section
 */

const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function main() {
  console.log('🔧 Fixing Categories & Pathways Panel Logs\n');

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

  // Find the Categories & Pathways panel
  const panelFile = project.data.files.find(f =>
    f.source.includes('Categories & Pathways') &&
    f.source.includes('Live Retry Logs')
  );

  if (!panelFile) {
    console.log('❌ Categories & Pathways panel not found');
    return;
  }

  console.log('✅ Found panel: ' + panelFile.name + '.gs\n');

  // Check what property the log viewer reads from
  const getLogs = panelFile.source.match(/function (\w*[Ll]og\w*)\(\)[\s\S]{0,300}getProperty\(['"](\w+)['"]/);

  let targetProperty = 'Sidebar_Logs'; // default

  if (getLogs) {
    targetProperty = getLogs[2];
    console.log('Log viewer reads from property: ' + targetProperty);
    console.log('Log viewer function: ' + getLogs[1] + '()\n');
  } else {
    console.log('⚠️  Could not find log reader function, using default: Sidebar_Logs\n');
  }

  // Now fix Code.gs to write to the correct property
  const codeFile = project.data.files.find(f => f.name === 'Code');
  let code = codeFile.source;

  // Find current property that addAILog uses
  const addAILogMatch = code.match(/function addAILog\([^)]*\)[\s\S]*?setProperty\(['"](\w+)['"]/);

  if (addAILogMatch) {
    const currentProperty = addAILogMatch[1];
    console.log('addAILog currently writes to: ' + currentProperty);

    if (currentProperty !== targetProperty) {
      console.log('Changing to: ' + targetProperty + '\n');

      // Replace all occurrences of the property
      code = code.replace(
        new RegExp("getProperty\\(['\"]" + currentProperty + "['\"]\\)", 'g'),
        "getProperty('" + targetProperty + "')"
      );

      code = code.replace(
        new RegExp("setProperty\\(['\"]" + currentProperty + "['\"]", 'g'),
        "setProperty('" + targetProperty + "'"
      );

      code = code.replace(
        new RegExp("deleteProperty\\(['\"]" + currentProperty + "['\"]\\)", 'g'),
        "deleteProperty('" + targetProperty + "')"
      );

      codeFile.source = code;

      console.log('✅ Updated all property references\n');
    } else {
      console.log('✅ Already using correct property!\n');
    }
  }

  console.log('🚀 Deploying...\n');

  await script.projects.updateContent({
    scriptId: scriptId,
    requestBody: { files: project.data.files }
  });

  console.log('✅ Deployed!\n');
  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('📋 Fixed!\n');
  console.log('Apply logs will now appear in:');
  console.log('  Panel: 📂 Categories & Pathways');
  console.log('  Section: 🪵 Live Retry Logs');
  console.log('  Property: ' + targetProperty + '\n');
  console.log('Next Steps:');
  console.log('  1. Refresh Google Sheet (Ctrl+Shift+R)');
  console.log('  2. Keep Categories & Pathways panel open');
  console.log('  3. Click Apply Selected Categories to Master');
  console.log('  4. Watch Live Retry Logs section update in real-time!');
  console.log('  5. Copy logs and paste here\n');
}

main().catch(console.error);
