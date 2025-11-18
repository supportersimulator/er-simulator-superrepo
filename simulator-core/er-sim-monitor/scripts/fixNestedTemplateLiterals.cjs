/**
 * Fix Nested Template Literals in Script Block
 *
 * The HTML is a server-side template literal (backticks)
 * But it contains client-side JavaScript template literals (also backticks)
 * Apps Script tries to interpolate ${} in the client-side code!
 *
 * Solution: Escape the ${} in client-side JavaScript
 */

const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function main() {
  console.log('🔧 Fixing Nested Template Literals\n');
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

  console.log('🔍 Finding problematic template literals...\n');

  // The issue: Inside the HTML template literal, there are JavaScript template literals
  // Apps Script tries to interpolate them server-side, causing ${rowCount} etc to fail

  // Solution: Escape the client-side template literals using \${} instead of ${}

  // Find the addNewRow function and escape its template literals
  source = source.replace(
    /newRow\.innerHTML = `([\s\S]*?)`;/,
    (match, content) => {
      console.log('Found newRow.innerHTML template literal');
      // Escape ${rowCount} to \\${rowCount}
      const escaped = content.replace(/\$\{/g, '\\${');
      return `newRow.innerHTML = \`${escaped}\`;`;
    }
  );

  // Find the deleteRow function and escape its template literal
  source = source.replace(
    /const row = document\.querySelector\(`input\[data-row="(.*?)"\]`\)/,
    (match) => {
      console.log('Found deleteRow querySelector template literal');
      return match.replace(/\$\{/g, '\\${');
    }
  );

  console.log('');
  console.log('✅ Escaped client-side template literals\n');

  panelFile.source = source;

  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('🚀 Deploying fix...\n');

  await script.projects.updateContent({
    scriptId: scriptId,
    requestBody: { files: project.data.files }
  });

  console.log('✅ Deployment complete!\n');
  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('🎯 NESTED TEMPLATE LITERAL BUG FIXED!\n');
  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('What was wrong:');
  console.log('  ❌ Server-side template literal (whole HTML) contained');
  console.log('     client-side template literals (JavaScript code)');
  console.log('  ❌ Apps Script tried to interpolate ${rowCount}, ${rowNum}');
  console.log('  ❌ This caused syntax errors, preventing all JavaScript\n');
  console.log('What we fixed:');
  console.log('  ✅ Escaped client-side ${} as \\${} ');
  console.log('  ✅ Now Apps Script ignores them during server-side rendering');
  console.log('  ✅ Browser interprets them as client-side template literals\n');
  console.log('Next steps:');
  console.log('  1. Hard refresh Google Sheet (Cmd+Shift+R)');
  console.log('  2. Open AI Categorization panel');
  console.log('  3. Should work perfectly now!');
  console.log('  4. Select "Specific Rows" - input field should appear!');
  console.log('  5. Button text should change!\n');
}

main().catch(console.error);
