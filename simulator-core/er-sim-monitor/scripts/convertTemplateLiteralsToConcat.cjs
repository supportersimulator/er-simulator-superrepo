/**
 * Convert Template Literals to String Concatenation
 *
 * Apps Script's nested template literal handling is buggy.
 * Solution: Convert client-side template literals to old-style string concatenation
 */

const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function main() {
  console.log('🔧 Converting Template Literals to String Concatenation\n');
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

  console.log('🔍 Finding addNewRow function...\n');

  // Replace the template literal with string concatenation
  const oldPattern = /newRow\.innerHTML = `[\s\S]*?`;/;

  const newCode = `newRow.innerHTML =
            '<td><input type="text" value="" data-col="0" data-row="' + rowCount + '" /></td>' +
            '<td><input type="text" value="" data-col="1" data-row="' + rowCount + '" /></td>' +
            '<td><input type="text" value="" data-col="2" data-row="' + rowCount + '" /></td>' +
            '<td><input type="text" value="" data-col="3" data-row="' + rowCount + '" /></td>' +
            '<td><button onclick="deleteRow(' + rowCount + ')">🗑️</button></td>';`;

  if (oldPattern.test(source)) {
    console.log('✅ Found newRow.innerHTML template literal\n');
    console.log('🔄 Converting to string concatenation...\n');
    source = source.replace(oldPattern, newCode);
  } else {
    console.log('⚠️  Pattern not found - may have been modified already\n');
  }

  // Replace the querySelector template literal too
  const querySelectorPattern = /const row = document\.querySelector\(`input\[data-row="\\?\$\{rowNum\}"\\?\]`\)/;

  const newQuerySelector = `const row = document.querySelector('input[data-row="' + rowNum + '"]')`;

  if (querySelectorPattern.test(source)) {
    console.log('✅ Found querySelector template literal\n');
    console.log('🔄 Converting to string concatenation...\n');
    source = source.replace(querySelectorPattern, newQuerySelector);
  }

  console.log('✅ Conversion complete\n');

  panelFile.source = source;

  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('🚀 Deploying fix...\n');

  await script.projects.updateContent({
    scriptId: scriptId,
    requestBody: { files: project.data.files }
  });

  console.log('✅ Deployment complete!\n');
  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('🎯 TEMPLATE LITERAL ISSUE FIXED!\n');
  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('What we did:');
  console.log('  ✅ Converted template literals to string concatenation');
  console.log('  ✅ No more nested template literal conflicts');
  console.log('  ✅ Apps Script won\\'t try to interpolate client-side variables\n');
  console.log('Next steps:');
  console.log('  1. Hard refresh Google Sheet (Cmd+Shift+R)');
  console.log('  2. Open AI Categorization panel');
  console.log('  3. Open browser console - should see NO syntax errors');
  console.log('  4. Select "Specific Rows" - input field MUST appear!');
  console.log('  5. If still not working, send console screenshot\n');
}

main().catch(console.error);
