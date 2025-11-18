/**
 * Find Panel With Live Logs AND Retry Failed
 *
 * User confirmed they see BOTH of these, so let's find that exact panel
 */

const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function main() {
  console.log('🔍 Finding Panel With Live Logs AND Retry Failed\n');
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

  console.log('🔍 Searching for panel with ALL confirmed features:\n');

  for (const file of project.data.files) {
    // Check for ALL the features user confirmed
    const hasRetryFailed = file.source.toLowerCase().includes('retry failed');
    const hasClearResults = file.source.toLowerCase().includes('clear results');
    const hasLiveLogsSection =
      file.source.includes('Live Retry Logs') ||
      file.source.includes('Live Logs') ||
      file.source.includes('retry-logs-panel') ||
      file.source.includes('ai-logs-panel');
    const hasCopyLogsBtn = file.source.includes('copyAILogs') || file.source.includes('Copy Logs');
    const hasSelectRowsMode = file.source.includes('aiCatMode');

    if (hasRetryFailed && hasClearResults && hasLiveLogsSection && hasCopyLogsBtn && hasSelectRowsMode) {
      console.log(`✅ FOUND: ${file.name}.gs\n`);
      console.log('   ✅ Retry Failed button');
      console.log('   ✅ Clear Results button');
      console.log('   ✅ Live Logs section');
      console.log('   ✅ Copy Logs button');
      console.log('   ✅ Select Rows mode (aiCatMode)\n');

      // Now check for missing buttons
      const hasApplyToMaster =
        file.source.includes('Apply Selected Categories to Master') ||
        file.source.includes('Apply to Master') ||
        file.source.includes('applyCategoriesResultsToMaster') ||
        file.source.includes('applyCategorizations');

      const hasExportCSV =
        file.source.includes('Export Results to CSV') ||
        file.source.includes('Export to CSV') ||
        file.source.includes('exportAIResultsToCSV') ||
        file.source.includes('exportCategorizationResults');

      console.log('🔍 Checking for missing buttons:\n');
      console.log(`   ${hasApplyToMaster ? '✅' : '❌'} Apply to Master button`);
      console.log(`   ${hasExportCSV ? '✅' : '❌'} Export CSV button\n`);

      if (!hasApplyToMaster || !hasExportCSV) {
        console.log('══════════════════════════════════════════════════════════════\n');
        console.log('🎯 THIS IS THE PANEL TO FIX!\n');
        console.log('══════════════════════════════════════════════════════════════\n');
      }

      // Extract button list
      console.log('📋 All Buttons in AI Auto-Categorization Section:\n');

      const aiSectionMatch = file.source.match(/🤖 AI Auto-Categorization[\s\S]{0,3000}/);
      if (aiSectionMatch) {
        const buttonRegex = /<button[^>]*>([^<]+)<\/button>/g;
        let btnMatch;
        let btnNum = 1;

        while ((btnMatch = buttonRegex.exec(aiSectionMatch[0])) !== null) {
          console.log(`  ${btnNum}. ${btnMatch[1].trim()}`);
          btnNum++;
        }
      }

      console.log('\n══════════════════════════════════════════════════════════════\n');

      return { file: file.name, hasApplyToMaster, hasExportCSV };
    }
  }

  console.log('❌ No panel found with all confirmed features\n');
  console.log('══════════════════════════════════════════════════════════════\n');
}

main().catch(console.error);
