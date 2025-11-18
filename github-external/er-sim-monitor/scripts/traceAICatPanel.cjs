/**
 * Trace AI Categorization Panel
 *
 * User says they see:
 * - Retry Failed button ✅
 * - Clear Results button ✅
 * - Live Logs ✅
 * - Copy Logs ✅
 * - Select Rows mode ✅
 *
 * Missing:
 * - Apply to Master button ❌
 * - Export CSV button ❌
 *
 * Let's find where this panel is built
 */

const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function main() {
  console.log('🔍 Tracing AI Categorization Panel\n');
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

  console.log('🔍 User confirms they see:\n');
  console.log('  ✅ Retry Failed button');
  console.log('  ✅ Clear Results button');
  console.log('  ✅ Live Logs');
  console.log('  ✅ Copy Logs');
  console.log('  ✅ Select Rows mode\n');

  console.log('🔍 User says they are MISSING:\n');
  console.log('  ❌ Apply to Master button');
  console.log('  ❌ Export CSV button\n');

  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('🔍 Searching all files for these features:\n');

  for (const file of project.data.files) {
    const hasRetryFailed = file.source.includes('Retry Failed');
    const hasClearResults = file.source.includes('Clear Results');
    const hasApplyMaster = file.source.includes('Apply') && file.source.includes('Master');
    const hasExportCSV = file.source.includes('Export') && file.source.includes('CSV');
    const hasLiveLogs = file.source.includes('Live Logs') || file.source.includes('getAILogs');
    const hasSelectRows = file.source.includes('aiCatMode') || file.source.includes('Specific Rows');

    // Only show files that have at least 3 of these features
    const matchCount = [hasRetryFailed, hasClearResults, hasApplyMaster, hasExportCSV, hasLiveLogs, hasSelectRows].filter(Boolean).length;

    if (matchCount >= 3) {
      console.log(`📄 ${file.name}.gs (${matchCount}/6 matches)`);
      console.log(`   Retry Failed: ${hasRetryFailed ? '✅' : '❌'}`);
      console.log(`   Clear Results: ${hasClearResults ? '✅' : '❌'}`);
      console.log(`   Apply to Master: ${hasApplyMaster ? '✅' : '❌'}`);
      console.log(`   Export CSV: ${hasExportCSV ? '✅' : '❌'}`);
      console.log(`   Live Logs: ${hasLiveLogs ? '✅' : '❌'}`);
      console.log(`   Select Rows: ${hasSelectRows ? '✅' : '❌'}`);

      // Find the HTML builder function
      const htmlFunctionMatch = file.source.match(/function ([a-zA-Z_]+)\(\) \{[\s\S]{0,200}return HtmlService/);
      if (htmlFunctionMatch) {
        console.log(`   Panel Function: ${htmlFunctionMatch[1]}()\n`);
      } else {
        console.log('');
      }

      // If this file has everything EXCEPT Apply/Export, it's the one we need to fix
      if (hasRetryFailed && hasClearResults && hasLiveLogs && hasSelectRows && (!hasApplyMaster || !hasExportCSV)) {
        console.log('   🎯 THIS IS THE PANEL THE USER IS SEEING!\n');
        console.log('   ⚠️  Missing Apply to Master and/or Export CSV buttons\n');
        console.log('══════════════════════════════════════════════════════════════\n');

        // Find the specific section where buttons should be
        const aiSectionMatch = file.source.match(/🤖 AI Auto-Categorization[\s\S]{0,2000}/);
        if (aiSectionMatch) {
          console.log('📋 AI Auto-Categorization Section:\n');

          // Extract button texts
          const buttonRegex = /<button[^>]*>([^<]+)<\/button>/g;
          const buttons = [];
          let btnMatch;

          const sectionText = aiSectionMatch[0];
          while ((btnMatch = buttonRegex.exec(sectionText)) !== null) {
            buttons.push(btnMatch[1].trim());
          }

          console.log('Buttons in this section:');
          buttons.forEach((btn, i) => {
            console.log(`  ${i + 1}. ${btn}`);
          });
          console.log('');
        }

        return { file: file.name };
      }
    }
  }

  console.log('══════════════════════════════════════════════════════════════\n');
}

main().catch(console.error);
