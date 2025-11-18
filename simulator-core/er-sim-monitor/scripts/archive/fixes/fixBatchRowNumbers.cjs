#!/usr/bin/env node

/**
 * Fix Batch Row Numbers
 *
 * Problem: Batch "First 25" mode starts from row 2, but:
 * - Row 1 = Tier 1 headers
 * - Row 2 = Tier 2 headers
 * - Row 3 = First data row
 *
 * Fix: Start from row 3 for data, or dynamically detect first data row
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const TOKEN_PATH = path.join(__dirname, '..', 'config', 'token.json');
const SCRIPT_ID = process.env.APPS_SCRIPT_ID;

async function fixBatchRowNumbers() {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('  FIX BATCH ROW NUMBERS');
  console.log('═══════════════════════════════════════════════════');
  console.log('');

  const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/oauth2callback'
  );
  oauth2Client.setCredentials(token);

  const script = google.script({ version: 'v1', auth: oauth2Client });
  const response = await script.projects.getContent({ scriptId: SCRIPT_ID });
  const files = response.data.files;

  const codeFile = files.find(f => f.name === 'Code');
  let source = codeFile.source;

  console.log('Fixing batch row number logic...');
  console.log('');

  // Fix "First 25" mode to start from row 3
  const old25 = `    case '25':
      for (let r = 2; r < 2 + 25 && r <= last; r++) rows.push(r);
      break;`;

  const new25 = `    case '25':
      for (let r = 3; r < 3 + 25 && r <= last; r++) rows.push(r);
      break;`;

  if (source.indexOf(old25) !== -1) {
    source = source.replace(old25, new25);
    console.log('✅ Fixed "First 25" mode to start from row 3 (first data row)');
  } else {
    console.log('⚠️  "First 25" pattern not found, trying alternative...');

    const pattern = /case '25':[\s]*for \(let r = 2;/;
    if (pattern.test(source)) {
      source = source.replace(/for \(let r = 2; r < 2 \+ 25/, 'for (let r = 3; r < 3 + 25');
      console.log('✅ Fixed "First 25" via regex');
    }
  }
  console.log('');

  // Fix "All" mode to start from row 3
  const oldAll = `    case 'all':
    default:
      for (let r = 2; r <= last; r++) rows.push(r);`;

  const newAll = `    case 'all':
    default:
      for (let r = 3; r <= last; r++) rows.push(r);`;

  if (source.indexOf(oldAll) !== -1) {
    source = source.replace(oldAll, newAll);
    console.log('✅ Fixed "All" mode to start from row 3 (first data row)');
  } else {
    console.log('⚠️  "All" pattern not found, trying alternative...');

    const pattern = /case 'all':[\s\S]{0,50}for \(let r = 2; r <= last/;
    if (pattern.test(source)) {
      source = source.replace(/(\bcase 'all':[\s\S]{0,50}for \(let r = )2(; r <= last)/, '$13$2');
      console.log('✅ Fixed "All" via regex');
    }
  }
  console.log('');

  // Upload
  console.log('💾 Uploading fixed code...');
  const updatedFiles = files.map(f => {
    if (f.name === 'Code') {
      return { ...f, source };
    }
    return f;
  });

  await script.projects.updateContent({
    scriptId: SCRIPT_ID,
    requestBody: { files: updatedFiles }
  });

  console.log('✅ Code updated successfully!');
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('✅ BATCH ROW NUMBERS FIXED');
  console.log('═══════════════════════════════════════════════════');
  console.log('');
  console.log('Changes made:');
  console.log('  • "First 25" mode: Now starts from row 3 (was row 2)');
  console.log('  • "All" mode: Now starts from row 3 (was row 2)');
  console.log('  • "Specific" mode: Already correct (user specifies)');
  console.log('');
  console.log('Row structure:');
  console.log('  Row 1: Tier 1 headers');
  console.log('  Row 2: Tier 2 headers');
  console.log('  Row 3+: Data rows');
  console.log('');
  console.log('Test:');
  console.log('1. Refresh Google Sheets');
  console.log('2. Select "First 25 rows" mode');
  console.log('3. Click "Launch Batch Engine"');
  console.log('4. Should now process rows 3-27 (25 data rows)');
  console.log('');
}

if (require.main === module) {
  fixBatchRowNumbers().catch(error => {
    console.error('');
    console.error('❌ FAILED');
    console.error('════════════════════════════════════════════════════');
    console.error(`Error: ${error.message}`);
    console.error('');
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  });
}

module.exports = { fixBatchRowNumbers };
