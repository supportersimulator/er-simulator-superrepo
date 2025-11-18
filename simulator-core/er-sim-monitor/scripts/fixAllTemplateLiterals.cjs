/**
 * Fix All Template Literal Issues in Phase2_Enhanced_Categories_With_AI.gs
 *
 * Three fixes:
 * 1. deleteRow(${i}) → deleteRow('+i+')
 * 2. newRow.innerHTML backtick template → string concatenation
 * 3. querySelector backtick template → string concatenation
 */

const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function main() {
  console.log('🔧 Fixing All Template Literal Issues\n');
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
  let fixCount = 0;

  // ═══════════════════════════════════════════════════════════════════════
  // FIX #1: deleteRow(${i}) → deleteRow('+i+')
  // ═══════════════════════════════════════════════════════════════════════
  console.log('🔍 Fix #1: deleteRow(${i}) in mappingRows loop...\n');

  const fix1Before = '<td><button onclick="deleteRow(${i})">🗑️</button></td>';
  const fix1After = '<td><button onclick="deleteRow(\'+i+\')">🗑️</button></td>';

  if (source.includes(fix1Before)) {
    source = source.replace(fix1Before, fix1After);
    console.log('✅ Fixed deleteRow(${i})\n');
    fixCount++;
  } else {
    console.log('⚠️  deleteRow(${i}) not found (may already be fixed)\n');
  }

  // ═══════════════════════════════════════════════════════════════════════
  // FIX #2: newRow.innerHTML backtick template → string concatenation
  // ═══════════════════════════════════════════════════════════════════════
  console.log('🔍 Fix #2: newRow.innerHTML backtick template...\n');

  const fix2Before = `newRow.innerHTML = \\\`
            <td><input type="text" value="" data-col="0" data-row="\\\${rowCount}" /></td>
            <td><input type="text" value="" data-col="1" data-row="\\\${rowCount}" /></td>
            <td><input type="text" value="" data-col="2" data-row="\\\${rowCount}" /></td>
            <td><input type="text" value="" data-col="3" data-row="\\\${rowCount}" /></td>
            <td><button onclick="deleteRow(\\\${rowCount})">🗑️</button></td>
          \\\`;`;

  const fix2After = `newRow.innerHTML = '<tr>' +
            '<td><input type="text" value="" data-col="0" data-row="' + rowCount + '" /></td>' +
            '<td><input type="text" value="" data-col="1" data-row="' + rowCount + '" /></td>' +
            '<td><input type="text" value="" data-col="2" data-row="' + rowCount + '" /></td>' +
            '<td><input type="text" value="" data-col="3" data-row="' + rowCount + '" /></td>' +
            '<td><button onclick="deleteRow(' + rowCount + ')">🗑️</button></td>' +
          '</tr>';`;

  if (source.includes('newRow.innerHTML = \\`')) {
    source = source.replace(fix2Before, fix2After);
    console.log('✅ Fixed newRow.innerHTML backtick template\n');
    fixCount++;
  } else {
    console.log('⚠️  newRow.innerHTML backtick not found (may already be fixed)\n');
  }

  // ═══════════════════════════════════════════════════════════════════════
  // FIX #3: querySelector backtick template → string concatenation
  // ═══════════════════════════════════════════════════════════════════════
  console.log('🔍 Fix #3: querySelector backtick template...\n');

  const fix3Before = 'const row = document.querySelector(\\`input[data-row="\\${rowNum}"]\\`).closest(\'tr\');';
  const fix3After = 'const row = document.querySelector(\'input[data-row="\' + rowNum + \'"]\').closest(\'tr\');';

  if (source.includes('document.querySelector(\\`input[data-row="\\${rowNum}"]\\`)')) {
    source = source.replace(fix3Before, fix3After);
    console.log('✅ Fixed querySelector backtick template\n');
    fixCount++;
  } else {
    console.log('⚠️  querySelector backtick not found (may already be fixed)\n');
  }

  // ═══════════════════════════════════════════════════════════════════════
  // DEPLOY
  // ═══════════════════════════════════════════════════════════════════════

  if (fixCount === 0) {
    console.log('══════════════════════════════════════════════════════════════\n');
    console.log('ℹ️  No fixes needed - all template literals already fixed!\n');
    console.log('══════════════════════════════════════════════════════════════\n');
    return;
  }

  panelFile.source = source;

  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('🚀 Deploying fixes...\n');

  await script.projects.updateContent({
    scriptId: scriptId,
    requestBody: { files: project.data.files }
  });

  console.log('✅ Deployment complete!\n');
  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('🎯 ALL TEMPLATE LITERAL ISSUES FIXED!\n');
  console.log('══════════════════════════════════════════════════════════════\n');
  console.log(`Applied ${fixCount} fixes:\n`);
  console.log('  1. deleteRow(${i}) → deleteRow(\'+i+\')');
  console.log('  2. newRow.innerHTML backtick → string concatenation');
  console.log('  3. querySelector backtick → string concatenation\n');
  console.log('Next steps:\n');
  console.log('  1. CLOSE Google Sheet tab completely (Cmd+W)');
  console.log('  2. Reopen sheet in NEW tab');
  console.log('  3. Open AI Categorization panel');
  console.log('  4. Console should be CLEAN - no syntax errors!');
  console.log('  5. Select "Specific Rows" - input field should appear!');
  console.log('  6. Button text should change!\n');
}

main().catch(console.error);
