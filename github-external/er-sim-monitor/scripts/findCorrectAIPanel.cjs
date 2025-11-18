/**
 * Find Correct AI Categorization Panel
 *
 * User specifically said: "the one with live logs and copy logs and the select rows mode"
 */

const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function main() {
  console.log('🔍 Finding Correct AI Categorization Panel\n');
  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('User says: "the one with live logs and copy logs and the select rows mode"\n');
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

  console.log('🔍 Searching All Files:\n');

  const requirements = {
    'Live Logs': ['Live Logs', 'Live Retry Logs', 'getAILogs'],
    'Copy Logs': ['Copy Logs', 'copyAILogs'],
    'Select Rows Mode': ['aiCatMode', 'Specific Rows', 'specificRowsInput'],
  };

  for (const file of project.data.files) {
    const hasLiveLogs = requirements['Live Logs'].some(term => file.source.includes(term));
    const hasCopyLogs = requirements['Copy Logs'].some(term => file.source.includes(term));
    const hasSelectRows = requirements['Select Rows Mode'].some(term => file.source.includes(term));

    if (hasLiveLogs || hasCopyLogs || hasSelectRows) {
      console.log(`📄 ${file.name}.gs`);
      console.log(`   Live Logs: ${hasLiveLogs ? '✅' : '❌'}`);
      console.log(`   Copy Logs: ${hasCopyLogs ? '✅' : '❌'}`);
      console.log(`   Select Rows: ${hasSelectRows ? '✅' : '❌'}`);

      if (hasLiveLogs && hasCopyLogs && hasSelectRows) {
        console.log('   🎯 THIS IS THE ONE!\n');

        // Extract section to show user
        console.log('══════════════════════════════════════════════════════════════\n');
        console.log(`📋 Content Preview of ${file.name}:\n`);

        // Find h4 headers
        const headers = file.source.match(/<h4[^>]*>([^<]*)<\/h4>/g) || [];
        if (headers.length > 0) {
          console.log('Section Headers:');
          headers.forEach((h, i) => {
            const text = h.match(/>([^<]*)<\/h4>/)?.[1] || 'Unknown';
            console.log(`  ${i + 1}. ${text}`);
          });
          console.log('');
        }

        // Count buttons
        const buttonCount = (file.source.match(/<button/g) || []).length;
        console.log(`Button Count: ${buttonCount}\n`);

        // Check for specific features
        console.log('Key Features:');
        console.log(`  ${file.source.includes('Run AI Categorization') ? '✅' : '❌'} Run AI Categorization button`);
        console.log(`  ${file.source.includes('Retry Failed') ? '✅' : '❌'} Retry Failed button`);
        console.log(`  ${file.source.includes('Apply') && file.source.includes('Master') ? '✅' : '❌'} Apply to Master button`);
        console.log(`  ${file.source.includes('Export') && file.source.includes('CSV') ? '✅' : '❌'} Export CSV button`);
        console.log(`  ${file.source.includes('Clear Results') ? '✅' : '❌'} Clear Results button`);
        console.log('');

        // Check which panel function this uses
        const buildFunc = file.source.match(/function (build[a-zA-Z_]+)\(\)/)?.[1];
        console.log(`Panel Function: ${buildFunc || 'NOT FOUND'}\n`);

        return { file: file.name, buildFunc };
      }
      console.log('');
    }
  }

  console.log('══════════════════════════════════════════════════════════════\n');
}

main().catch(console.error);
