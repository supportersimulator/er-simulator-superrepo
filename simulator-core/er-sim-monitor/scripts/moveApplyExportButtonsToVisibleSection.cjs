/**
 * Move Apply and Export Buttons to Visible Section
 *
 * Currently they're inside #ai-review-container which starts hidden (display: none)
 * and only shows after AI categorization runs. This is why user doesn't see them.
 *
 * SOLUTION: Move buttons to a new section OUTSIDE the hidden container
 */

const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function main() {
  console.log('🔧 Moving Apply & Export Buttons to Visible Section\n');
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

  console.log('🔍 Current Structure:\n');
  console.log('  ❌ Apply & Export buttons are inside #ai-review-container');
  console.log('  ❌ #ai-review-container has CSS: display: none (hidden by default)');
  console.log('  ❌ Only shows after AI categorization completes\n');

  console.log('✅ New Structure:\n');
  console.log('  ✅ Move Apply & Export buttons to separate section');
  console.log('  ✅ Make them visible by default');
  console.log('  ✅ Add explanatory text about what they do\n');

  console.log('══════════════════════════════════════════════════════════════\n');

  // Step 1: Find and remove the buttons from their current location
  const applyButtonPattern = /<button id="apply-btn"[^>]*>[\s\S]*?Apply Selected Categories to Master[\s\S]*?<\/button>/;
  const exportButtonPattern = /<button class="btn" onclick="exportCategorizationResults\(\)">[\s\S]*?Export Results to CSV[\s\S]*?<\/button>/;

  const applyMatch = html.match(applyButtonPattern);
  const exportMatch = html.match(exportButtonPattern);

  if (!applyMatch || !exportMatch) {
    console.log('❌ Could not find both buttons\n');
    return;
  }

  console.log('📝 Step 1: Removing buttons from hidden container...\n');

  const applyButton = applyMatch[0];
  const exportButton = exportMatch[0];

  // Remove them from current location
  html = html.replace(applyButtonPattern, '');
  html = html.replace(exportButtonPattern, '');

  console.log('✅ Removed buttons from #ai-review-container\n');

  // Step 2: Create new section with buttons (add after Live Logs section)
  const newSection = `

    <!-- Apply & Export Section (Always Visible) -->
    <div class="section">
      <div class="section-title">📥 Apply Results to Master</div>
      <div class="help-text">
        After reviewing AI categorization results, use these buttons to apply changes to your Master Scenario Convert sheet or export for external review.
      </div>

      ${applyButton}
      ${exportButton}
    </div>
`;

  // Find a good insertion point - after the Live Logs section
  const liveLogsEndPattern = /<\/div>\s*<\/div>\s*<!-- Manual Actions Section -->/;

  if (!liveLogsEndPattern.test(html)) {
    console.log('⚠️  Could not find Live Logs end marker, trying alternative...\n');

    // Alternative: Insert before Manual Actions Section
    const manualActionsPattern = /<!-- Manual Actions Section -->/;

    if (manualActionsPattern.test(html)) {
      console.log('✅ Found Manual Actions Section marker\n');
      html = html.replace(manualActionsPattern, newSection + '\\n    <!-- Manual Actions Section -->');
    } else {
      console.log('❌ Could not find insertion point\n');
      return;
    }
  } else {
    html = html.replace(liveLogsEndPattern, '</div>\\n    </div>' + newSection + '\\n\\n    <!-- Manual Actions Section -->');
  }

  console.log('✅ Added new "Apply Results to Master" section\n');

  panelFile.source = html;

  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('🚀 Deploying changes...\n');

  await script.projects.updateContent({
    scriptId: scriptId,
    requestBody: { files: project.data.files }
  });

  console.log('✅ Deployment complete!\n');
  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('🎯 Apply & Export Buttons Now Visible!\n');
  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('Next steps:');
  console.log('  1. Refresh Google Sheet (F5)');
  console.log('  2. Open AI Categorization panel');
  console.log('  3. Scroll down to see new "📥 Apply Results to Master" section');
  console.log('  4. Buttons are now always visible!\n');
}

main().catch(console.error);
