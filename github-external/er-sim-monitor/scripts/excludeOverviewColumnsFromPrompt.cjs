#!/usr/bin/env node

/**
 * Exclude Overview Columns from ChatGPT Prompt
 *
 * Problem:
 * When new Pre_Sim_Overview and Post_Sim_Overview columns are added to the sheet,
 * the ChatGPT processing system will see them in headers and try to generate content
 * for them, which wastes tokens and creates duplicate effort.
 *
 * Solution:
 * Add filtering logic to exclude these columns from the headers sent to ChatGPT.
 * The columns will exist in the sheet but won't be included in the AI prompt.
 * They'll be filled later by our specialized overview generator.
 *
 * Columns to Exclude:
 * - Case_Organization_Pre_Sim_Overview (Case_Organization:Pre_Sim_Overview)
 * - Case_Organization_Post_Sim_Overview (Case_Organization:Post_Sim_Overview)
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const TOKEN_PATH = path.join(__dirname, '..', 'config', 'token.json');
const SCRIPT_ID = '1NXjFvH2Wo117saCyqmNDfCqZ1iQ9vykxa0-kHUhFAYDuhthgql5Ru_P6';

function createGoogleClient() {
  const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/oauth2callback'
  );
  oauth2Client.setCredentials(token);
  return oauth2Client;
}

async function addOverviewExclusionLogic() {
  console.log('🔧 Adding Overview Column Exclusion Logic to Apps Script');
  console.log('');

  const auth = createGoogleClient();
  const script = google.script({ version: 'v1', auth });

  try {
    // Step 1: Read current Apps Script
    console.log('1️⃣ Reading current Apps Script...');
    const response = await script.projects.getContent({
      scriptId: SCRIPT_ID
    });

    const files = response.data.files;
    const codeFile = files.find(f => f.name === 'Code');

    if (!codeFile) {
      console.error('❌ Could not find Code.gs file!');
      process.exit(1);
    }

    console.log('   ✅ Found Code.gs (' + codeFile.source.split('\n').length + ' lines)');
    console.log('');

    // Step 2: Add exclusion logic
    console.log('2️⃣ Adding exclusion logic...');

    const exclusionCode = `
/**
 * Filter headers to exclude overview columns (filled later by specialized AI)
 */
function filterOverviewColumns_(header1, header2) {
  const excludePatterns = [
    /Pre_Sim_Overview/i,
    /Post_Sim_Overview/i
  ];

  const filtered1 = [];
  const filtered2 = [];
  const indices = []; // Track which indices we kept

  for (let i = 0; i < header2.length; i++) {
    const h1 = header1[i] || '';
    const h2 = header2[i] || '';

    // Check if this column should be excluded
    const shouldExclude = excludePatterns.some(pattern =>
      pattern.test(h1) || pattern.test(h2)
    );

    if (!shouldExclude) {
      filtered1.push(h1);
      filtered2.push(h2);
      indices.push(i);
    }
  }

  return { header1: filtered1, header2: filtered2, indices };
}
`.trim();

    // Find where to insert (after extractValueFromParsed_ function)
    const insertAfter = 'function extractValueFromParsed_(parsed, mergedKey) {';
    const insertIndex = codeFile.source.indexOf(insertAfter);

    if (insertIndex === -1) {
      console.error('❌ Could not find insertion point in Code.gs');
      process.exit(1);
    }

    // Find the end of extractValueFromParsed_ function
    const functionEnd = codeFile.source.indexOf('\n}', insertIndex);
    const insertPosition = functionEnd + 3; // After the closing brace and newline

    // Insert the new function
    const updatedSource =
      codeFile.source.slice(0, insertPosition) +
      '\n\n' + exclusionCode + '\n' +
      codeFile.source.slice(insertPosition);

    console.log('   ✅ Added filterOverviewColumns_() function');
    console.log('');

    // Step 3: Update the processOneInputRow function to use filtering
    console.log('3️⃣ Updating processOneInputRow to use filtering...');

    // Find where headers are read in processOneInputRow
    const headerReadPattern = /const header1 = .*?getRange\(1, 1, 1, .*?\)\.getValues\(\)\[0\];/;
    const headerReadMatch = updatedSource.match(headerReadPattern);

    if (!headerReadMatch) {
      console.error('❌ Could not find header reading code');
      process.exit(1);
    }

    // Add filtering right after header reading
    const filteringCode = `
  // Filter out overview columns (filled later by specialized AI)
  const filtered = filterOverviewColumns_(header1, header2);
  const filteredHeader1 = filtered.header1;
  const filteredHeader2 = filtered.header2;

  Logger.log(\`📊 Filtered headers: \${header2.length} → \${filteredHeader2.length} columns (excluded \${header2.length - filteredHeader2.length} overview columns)\`);
`.trim();

    const headerReadEnd = updatedSource.indexOf('\n', updatedSource.indexOf(headerReadMatch[0]) + headerReadMatch[0].length);

    const finalSource =
      updatedSource.slice(0, headerReadEnd) +
      '\n\n  ' + filteringCode + '\n' +
      updatedSource.slice(headerReadEnd)
        .replace(/\bheader1\b/g, 'filteredHeader1')
        .replace(/\bheader2\b/g, 'filteredHeader2');

    console.log('   ✅ Updated header filtering in processOneInputRow');
    console.log('');

    // Step 4: Create backup
    const backupPath = path.join(__dirname, '..', 'apps-script-backup', `Code-before-overview-exclusion-${Date.now()}.gs`);
    fs.writeFileSync(backupPath, codeFile.source);
    console.log('4️⃣ Created backup: ' + path.basename(backupPath));
    console.log('');

    // Step 5: Upload updated script
    console.log('5️⃣ Uploading updated Apps Script...');

    const updatedFiles = files.map(f => {
      if (f.name === 'Code') {
        return { ...f, source: finalSource };
      }
      return f;
    });

    await script.projects.updateContent({
      scriptId: SCRIPT_ID,
      requestBody: {
        files: updatedFiles
      }
    });

    console.log('   ✅ Apps Script updated successfully!');
    console.log('');

    console.log('✅ COMPLETE: Overview columns excluded from ChatGPT processing');
    console.log('');
    console.log('📋 What Changed:');
    console.log('   1. Added filterOverviewColumns_() helper function');
    console.log('   2. Headers are filtered before being sent to ChatGPT');
    console.log('   3. Overview columns (Pre_Sim_Overview, Post_Sim_Overview) excluded');
    console.log('   4. ChatGPT will no longer try to generate these fields');
    console.log('   5. Specialized overview generator will fill them separately');
    console.log('');
    console.log('💡 Next Steps:');
    console.log('   1. Run: node scripts/addOverviewColumnsToSheet.cjs');
    console.log('   2. Run: node scripts/aiEnhancedRenaming.cjs');
    console.log('   3. Overview columns will be filled by AI overview system');
    console.log('');

  } catch (error) {
    console.error('❌ Error updating Apps Script:');
    console.error(error.message);
    if (error.response) {
      console.error('   API Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

if (require.main === module) {
  addOverviewExclusionLogic();
}

module.exports = { addOverviewExclusionLogic };
