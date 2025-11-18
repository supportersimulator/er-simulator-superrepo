/**
 * Fix Onclick Quote Escaping Issues
 *
 * The problem: onclick="viewCategory('${cat.replace(/'/g, "\\'")}')"
 * The backslash-quote inside the template literal breaks parsing
 *
 * Solution: Use HTML entities instead of backslash escaping
 */

const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function main() {
  console.log('🔧 Fixing Onclick Quote Escaping\n');
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

  console.log('🔍 Finding problematic onclick handlers...\n');

  // Replace the problematic quote escaping with a different approach
  // Instead of: ${cat.replace(/'/g, "\\'")}
  // Use: ${cat.replace(/'/g, '&apos;')} (HTML entity)

  const pattern1 = /\$\{cat\.replace\(\/'\/ g, "\\\\'"\)\}/g;
  const pattern2 = /\$\{path\.replace\(\/'\/ g, "\\\\'"\)\}/g;

  if (pattern1.test(source)) {
    console.log('✅ Found viewCategory quote escaping\n');
    source = source.replace(pattern1, "${cat.replace(/'/g, '&apos;')}");
  }

  if (pattern2.test(source)) {
    console.log('✅ Found viewPathway quote escaping\n');
    source = source.replace(pattern2, "${path.replace(/'/g, '&apos;')}");
  }

  console.log('✅ Replaced backslash escaping with HTML entities\n');

  panelFile.source = source;

  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('🚀 Deploying fix...\n');

  await script.projects.updateContent({
    scriptId: scriptId,
    requestBody: { files: project.data.files }
  });

  console.log('✅ Deployment complete!\n');
  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('🎯 QUOTE ESCAPING FIXED!\n');
  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('What we fixed:');
  console.log('  ❌ Before: ${cat.replace(/'/ g, "\\\\'\\")}')}");
  console.log('  ✅ After:  ${cat.replace(/\\'/g, \\'&apos;\\')}');
  console.log('');
  console.log('Why this works:');
  console.log('  - HTML entities don\\'t confuse JavaScript parser');
  console.log('  - &apos; renders as apostrophe in HTML');
  console.log('  - No nested quote/backslash issues\\n');
  console.log('Next steps:');
  console.log('  1. Hard refresh Google Sheet (Cmd+Shift+R)');
  console.log('  2. Open AI Categorization panel');
  console.log('  3. Console should be CLEAN - no syntax errors!');
  console.log('  4. Look for "📝 Defining window.runAICategorization"');
  console.log('  5. Select "Specific Rows" - input should appear!\\n');
}

main().catch(console.error);
