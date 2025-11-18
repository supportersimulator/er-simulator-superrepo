/**
 * Fix Categorization Stats Interpolation
 *
 * The template literal ${categorizationStats.total} might be causing issues
 * if the value is undefined/null. Make it safer.
 */

const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function main() {
  console.log('🔧 Fixing Categorization Stats Interpolation\n');
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

  let source = panelFile.source;

  console.log('📝 Finding problematic template literal interpolation...\n');

  // Find and fix the line with ${categorizationStats.total}
  const pattern = /if \(\$\{categorizationStats\.total\} > 0\)/;

  if (!pattern.test(source)) {
    console.log('❌ Could not find the pattern\n');
    return;
  }

  console.log('✅ Found the pattern\n');
  console.log('📝 Replacing with safer version...\n');

  // Replace with a safe version that handles undefined/null
  source = source.replace(
    pattern,
    'if ((${categorizationStats.total} || 0) > 0)'
  );

  console.log('✅ Fixed interpolation\n');

  panelFile.source = source;

  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('🚀 Deploying...\n');

  await script.projects.updateContent({
    scriptId: scriptId,
    requestBody: { files: project.data.files }
  });

  console.log('✅ Deployment complete!\n');
  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('🎯 Template Literal Fixed!\n');
  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('What was fixed:');
  console.log('  ❌ Before: if (${categorizationStats.total} > 0)');
  console.log('  ✅ After: if ((${categorizationStats.total} || 0) > 0)\n');
  console.log('This ensures if the value is undefined/null, it defaults to 0.\n');
  console.log('Next: Refresh and test again!\n');
}

main().catch(console.error);
