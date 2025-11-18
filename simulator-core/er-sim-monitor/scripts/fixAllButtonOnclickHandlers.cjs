/**
 * Fix All Button Onclick Handlers
 *
 * The onclick handlers got corrupted - buttons are calling wrong functions
 * This script fixes ALL onclick mismatches
 */

const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function main() {
  console.log('🔧 Fixing All Button Onclick Handlers\n');
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

  console.log('🔍 Detected Onclick Mismatches:\n');

  const fixes = [
    {
      buttonText: '🔄 Retry Failed Cases',
      currentOnclick: 'runAICategorization()',
      correctOnclick: 'retryFailedCases()',
    },
    {
      buttonText: '🗑️ Clear Results',
      currentOnclick: 'retryFailedCases()',
      correctOnclick: 'clearAIResults()',
    },
    {
      buttonText: '⚙️ Edit Category Mappings',
      currentOnclick: 'clearAIResults()',
      correctOnclick: 'editCategoryMappings()',
    },
    {
      buttonText: 'Refresh',
      currentOnclick: 'copyAILogs()',
      correctOnclick: 'refreshAILogs()',
      id: 'refreshAILogsBtn',
    },
    {
      buttonText: 'Clear',
      currentOnclick: 'copyAILogs()',
      correctOnclick: 'clearAILogs()',
      id: 'clearAILogsBtn',
    },
    {
      buttonText: '💾 Export Results to CSV',
      currentOnclick: 'applyCategorizations()',
      correctOnclick: 'exportCategorizationResults()',
    },
    {
      buttonText: '📊 View All Categories',
      currentOnclick: 'viewAllCategories()',
      correctOnclick: 'viewAllCategories()',
      status: 'OK',
    },
    {
      buttonText: '🧩 View All Pathways',
      currentOnclick: 'viewAllCategories()',
      correctOnclick: 'viewAllPathways()',
    },
    {
      buttonText: '🔗 Assign Case to Category/Pathway',
      currentOnclick: 'viewAllCategories()',
      correctOnclick: 'assignCase()',
    },
    {
      buttonText: '📚 View Logic Type Library',
      currentOnclick: 'viewLogicTypeLibrary()',
      correctOnclick: 'viewLogicTypeLibrary()',
      status: 'OK',
    },
    {
      buttonText: '📊 View All Discovered Pathways',
      currentOnclick: 'viewLogicTypeLibrary()',
      correctOnclick: 'viewPathwaysMaster()',
    },
    {
      buttonText: '💾 Save All Changes',
      currentOnclick: 'addNewRow()',
      correctOnclick: 'saveMappings()',
    },
  ];

  let fixCount = 0;

  for (const fix of fixes) {
    if (fix.status === 'OK') continue;

    // Find button and replace onclick
    const buttonPattern = fix.id
      ? new RegExp(`(id="${fix.id}"[^>]*onclick=")${fix.currentOnclick}(")`,'g')
      : new RegExp(`(<button[^>]*onclick=")${fix.currentOnclick.replace(/\(/g, '\\(').replace(/\)/g, '\\)')}("[^>]*>${fix.buttonText}<\\/button>)`, 'g');

    const matches = html.match(buttonPattern);

    if (matches) {
      console.log(`  ✅ Fixing "${fix.buttonText}"`);
      console.log(`     ${fix.currentOnclick} → ${fix.correctOnclick}`);

      html = html.replace(buttonPattern, `$1${fix.correctOnclick}$2`);
      fixCount++;
    } else {
      console.log(`  ⚠️  "${fix.buttonText}" - pattern not found`);
    }
  }

  console.log(`\n✅ Fixed ${fixCount} onclick handlers\n`);

  panelFile.source = html;

  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('🚀 Deploying fix...\n');

  await script.projects.updateContent({
    scriptId: scriptId,
    requestBody: { files: project.data.files }
  });

  console.log('✅ Deployment complete!\n');
  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('🎯 All Button Onclick Handlers Fixed!\n');
  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('Next steps:');
  console.log('  1. Refresh Google Sheet (F5)');
  console.log('  2. Open AI Categorization panel');
  console.log('  3. Test all buttons:\n');
  console.log('     - Retry Failed Cases');
  console.log('     - Clear Results');
  console.log('     - Refresh Logs');
  console.log('     - Clear Logs');
  console.log('     - Apply Selected Categories to Master');
  console.log('     - Export Results to CSV\n');
}

main().catch(console.error);
