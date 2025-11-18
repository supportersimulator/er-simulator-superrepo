/**
 * Verify AI Categorization Panel Content
 *
 * Checks if all expected features are present in the deployed panel
 */

const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function main() {
  console.log('🔍 Verifying AI Categorization Panel Content\n');
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

  const html = panelFile.source;

  console.log('📋 Feature Check:\n');

  const features = {
    '🤖 AI Auto-Categorization Section': html.includes('🤖 AI Auto-Categorization'),
    '📋 Mode Selector (aiCatMode)': html.includes('id="aiCatMode"'),
    '📝 Specific Rows Input': html.includes('id="specificRowsInput"'),
    '🚀 Run AI Categorization Button': html.includes('runAICategorization'),
    '🔄 Retry Failed Cases Button': html.includes('Retry Failed Cases') || html.includes('retryFailedAICategorizations'),
    '🗑️ Clear Results Button': html.includes('Clear Results') || html.includes('clearAIResults'),
    '✅ Apply to Master Button': html.includes('Apply Selected Categories to Master') || html.includes('applyCategoriesResultsToMaster'),
    '📥 Export CSV Button': html.includes('Export Results to CSV') || html.includes('exportAIResultsToCSV'),
    '📜 Live Logs Section': html.includes('Live') && html.includes('Logs'),
    '🔄 Refresh Logs Button': html.includes('refreshAILogs'),
    '📋 Copy Logs Button': html.includes('copyAILogs'),
  };

  for (const [feature, present] of Object.entries(features)) {
    console.log(`  ${present ? '✅' : '❌'} ${feature}`);
  }

  console.log('\n══════════════════════════════════════════════════════════════\n');

  // Check for specific buttons
  console.log('🔍 Detailed Button Search:\n');

  const buttons = [
    { name: 'Run AI Categorization', search: /onclick="runAICategorization\(\)"/i },
    { name: 'Retry Failed Cases', search: /onclick="retryFailedAICategorizations\(\)"/i },
    { name: 'Clear Results', search: /onclick="clearAIResults\(\)"/i },
    { name: 'Apply to Master', search: /onclick="applyCategoriesResultsToMaster\(\)"/i },
    { name: 'Export CSV', search: /onclick="exportAIResultsToCSV\(\)"/i },
  ];

  for (const button of buttons) {
    const found = button.search.test(html);
    console.log(`  ${found ? '✅' : '❌'} ${button.name}`);

    if (!found) {
      // Try to find if button text exists but with different onclick
      const textExists = html.includes(button.name);
      if (textExists) {
        console.log(`      ⚠️  Button text "${button.name}" found but onclick may be wrong`);
      }
    }
  }

  console.log('\n══════════════════════════════════════════════════════════════\n');

  // Count sections
  const sectionCount = {
    'h4 headers': (html.match(/<h4[^>]*>/g) || []).length,
    'buttons': (html.match(/<button[^>]*>/g) || []).length,
    'script blocks': (html.match(/<script>/g) || []).length,
  };

  console.log('📊 Panel Structure:\n');
  for (const [item, count] of Object.entries(sectionCount)) {
    console.log(`  ${item}: ${count}`);
  }

  console.log('\n══════════════════════════════════════════════════════════════\n');

  // Extract section headers to see panel structure
  const headers = html.match(/<h4[^>]*>([^<]*)</g) || [];
  if (headers.length > 0) {
    console.log('📑 Section Headers Found:\n');
    headers.forEach((h, i) => {
      const text = h.match(/>([^<]*)</)?.[1] || 'Unknown';
      console.log(`  ${i + 1}. ${text}`);
    });
    console.log('');
  }

  // Check if HTML is abnormally short (indicates content might be missing)
  const htmlLength = html.length;
  console.log(`📏 Total HTML Length: ${htmlLength.toLocaleString()} characters\n`);

  if (htmlLength < 5000) {
    console.log('⚠️  WARNING: HTML seems short - may be missing content\n');
  }

  console.log('══════════════════════════════════════════════════════════════\n');
}

main().catch(console.error);
