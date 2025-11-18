const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

const token = JSON.parse(fs.readFileSync('./config/token.json', 'utf-8'));
const oAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'http://localhost:3000/oauth2callback'
);
oAuth2Client.setCredentials(token);

const script = google.script({ version: 'v1', auth: oAuth2Client });
const scriptId = '12NihbVaaAIyRMCtzZ-aGjJ71CdL-HDjhmjxiD_S_EgIOuDOtrUH6M1l2';

async function deployEnhancedPanel() {
  console.log('📥 Deploying Enhanced Visual Panel (separate file)...');
  console.log('');

  const enhancedPanelCode = fs.readFileSync('./apps-script-deployable/Enhanced_Visual_Panel_With_Toggle.gs', 'utf-8');

  console.log('✅ Read Enhanced_Visual_Panel_With_Toggle.gs (' + (enhancedPanelCode.length / 1024).toFixed(1) + ' KB)');
  console.log('');

  const project = await script.projects.getContent({ scriptId });
  const files = project.data.files;

  // Check if file already exists
  let enhancedFile = files.find(f => f.name === 'Enhanced_Visual_Panel_With_Toggle');

  if (enhancedFile) {
    console.log('⚠️  File already exists - updating...');
    enhancedFile.source = enhancedPanelCode;
  } else {
    console.log('✅ Creating new file: Enhanced_Visual_Panel_With_Toggle');
    files.push({
      name: 'Enhanced_Visual_Panel_With_Toggle',
      type: 'SERVER_JS',
      source: enhancedPanelCode
    });
  }

  // Add wrapper function to Code.gs for easy access
  const mainFile = files.find(f => f.name === 'Code');

  // Check if wrapper already exists
  const hasWrapper = mainFile.source.indexOf('function openEnhancedVisualPanel') !== -1;

  if (hasWrapper === false) {
    const wrapperCode = '\n\n' +
      '/**\n' +
      ' * Open Enhanced Visual Panel with Symptom/System Toggle\n' +
      ' * Shows visual folder organization with toggle between:\n' +
      ' * - Symptom categories (CP, SOB, ABD, etc.)\n' +
      ' * - System categories (Cardiovascular, Pulmonary, etc.)\n' +
      ' */\n' +
      'function openEnhancedVisualPanel() {\n' +
      '  const ui = getSafeUi_();\n' +
      '  if (ui === null) return;\n' +
      '\n' +
      '  const html = buildEnhancedCategoriesTab();\n' +
      '  ui.showSidebar(HtmlService.createHtmlOutput(html).setTitle(\'📂 Categories (Enhanced)\').setWidth(450));\n' +
      '}\n';

    mainFile.source = mainFile.source + wrapperCode;
    console.log('✅ Added openEnhancedVisualPanel() wrapper to Code.gs');
  } else {
    console.log('ℹ️  Wrapper function already exists in Code.gs');
  }

  console.log('');
  console.log('☁️  Uploading to Apps Script...');

  await script.projects.updateContent({
    scriptId: scriptId,
    requestBody: {
      files: files
    }
  });

  console.log('✅ Deployed successfully!');
  console.log('');
  console.log('🎉 YOU NOW HAVE THREE PANEL OPTIONS:');
  console.log('');
  console.log('   1️⃣  openCategoriesPathwaysPanel()');
  console.log('       → Original system-based view (what you see now)');
  console.log('');
  console.log('   2️⃣  openEnhancedVisualPanel()  ← NEW!');
  console.log('       → Enhanced view with Symptom/System toggle + AI button');
  console.log('');
  console.log('   3️⃣  openAICategorization()');
  console.log('       → Full AI categorization tools');
  console.log('');
  console.log('💡 TRY IT: Run openEnhancedVisualPanel() from Apps Script');
  console.log('');
  console.log('📋 WHAT YOU WILL SEE:');
  console.log('   ✨ AI Tools banner at top');
  console.log('   🔘 Toggle: Symptom Categories | System Categories');
  console.log('   📁 Visual folder grid (like current view)');
  console.log('   💊 Symptom view shows: CP, SOB, ABD, AMS, etc.');
  console.log('   🏥 System view shows: Cardiovascular, Pulmonary, etc.');
}

deployEnhancedPanel().catch(console.error);
