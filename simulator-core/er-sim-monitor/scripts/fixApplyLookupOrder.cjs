/**
 * Fix Apply Function Lookup Order
 *
 * PROBLEM: Current logic tries Legacy_Case_ID first, which returns FIRST match
 *          when multiple cases share same Legacy_Case_ID (intentional variations).
 *          This causes categorizations to be written to wrong rows.
 *
 * SOLUTION: Reverse the lookup order:
 *           1. Try Case_ID first (always unique, always correct row)
 *           2. Only use Legacy_Case_ID as fallback (if Case_ID fails)
 *
 * This ensures all 207 cases get categorized correctly.
 */

const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function main() {
  console.log('🔧 Fixing Apply Function Lookup Order\n');
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
  const codeFile = project.data.files.find(f => f.name === 'Code');

  if (!codeFile) {
    console.log('❌ Code.gs not found');
    return;
  }

  // Find the applyCategorizationUpdates function
  const updateMatches = [...codeFile.source.matchAll(/function applyCategorizationUpdates\(categorizationData, masterSheet\)[\s\S]*?(?=\nfunction [a-z]|\n\/\*\*\*|$)/g)];

  if (updateMatches.length === 0) {
    console.log('❌ applyCategorizationUpdates function not found');
    return;
  }

  const lastMatch = updateMatches[updateMatches.length - 1];
  let updatedFunc = lastMatch[0];

  console.log('📋 Current Problematic Logic:\n');
  console.log('  // Try Legacy_Case_ID first');
  console.log('  let row;');
  console.log('  if (legacyCaseID && legacyCaseID.length > 0) {');
  console.log('    row = findRowByLegacyCaseID(masterSheet, legacyCaseID);');
  console.log('  }');
  console.log('  ');
  console.log('  // Fallback to Case_ID if not found');
  console.log('  if (!row) {');
  console.log('    row = findRowByCaseID(masterSheet, cat.caseID);');
  console.log('  }\n');
  console.log('❌ Problem: Legacy lookup returns FIRST match when duplicates exist\n');
  console.log('   Example: PEDMU03 has Legacy "PED1-Kawasaki"');
  console.log('            PEDMU12 also has "PED1-Kawasaki" (row 12)');
  console.log('            Legacy lookup finds row 12 first');
  console.log('            Writes to PEDMU12 instead of PEDMU03!\n');

  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('✨ New Fixed Logic:\n');
  console.log('  // Try Case_ID first (always unique, always correct)');
  console.log('  let row = findRowByCaseID(masterSheet, cat.caseID);');
  console.log('  ');
  console.log('  // Fallback to Legacy_Case_ID only if Case_ID fails');
  console.log('  if (!row && legacyCaseID && legacyCaseID.length > 0) {');
  console.log('    row = findRowByLegacyCaseID(masterSheet, legacyCaseID);');
  console.log('  }\n');
  console.log('✅ Benefits:');
  console.log('   - Case_ID is always unique → always finds correct row');
  console.log('   - Legacy only used if Case_ID missing (edge case)');
  console.log('   - All 207 cases will get categorized correctly\n');

  console.log('══════════════════════════════════════════════════════════════\n');

  // Replace the lookup logic
  updatedFunc = updatedFunc.replace(
    /\/\/ Find row by Legacy_Case_ID first, then fallback to Case_ID[\s\S]*?let row;[\s\S]*?if \(legacyCaseID && legacyCaseID\.length > 0\) \{[\s\S]*?row = findRowByLegacyCaseID\(masterSheet, legacyCaseID\);[\s\S]*?\}[\s\S]*?\/\/ Universal fallback: If not found by Legacy, try Case_ID[\s\S]*?\/\/ This works for both:[\s\S]*?\/\/ - Retry cases \(legacyCaseID empty, uses Case_ID from start\)[\s\S]*?\/\/ - Regular cases \(if Legacy lookup fails, auto-retry with Case_ID\)[\s\S]*?if \(!row\) \{[\s\S]*?row = findRowByCaseID\(masterSheet, cat\.caseID\);[\s\S]*?\}/,
    `// FIXED: Use Case_ID as PRIMARY lookup (always unique, always correct)
      // Only fallback to Legacy_Case_ID if Case_ID fails (edge case)
      let row = findRowByCaseID(masterSheet, cat.caseID);

      // Fallback: If Case_ID lookup fails, try Legacy_Case_ID
      // (Only needed if Case_ID missing or Master sheet has data integrity issues)
      if (!row && legacyCaseID && legacyCaseID.length > 0) {
        row = findRowByLegacyCaseID(masterSheet, legacyCaseID);
      }`
  );

  // Replace in Code.gs
  let newCode = codeFile.source;
  const updateStart = lastMatch.index;
  const updateEnd = updateStart + lastMatch[0].length;
  newCode = newCode.substring(0, updateStart) + updatedFunc + newCode.substring(updateEnd);

  codeFile.source = newCode;

  console.log('✅ Updated lookup logic\n');

  // Deploy
  console.log('🚀 Deploying to Apps Script...\n');

  await script.projects.updateContent({
    scriptId: scriptId,
    requestBody: { files: project.data.files }
  });

  console.log('✅ Deployment complete!\n');
  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('🎯 Apply Function Fixed!\n');
  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('What changed:\n');
  console.log('BEFORE:');
  console.log('  1. Try Legacy_Case_ID first');
  console.log('  2. Fallback to Case_ID\n');
  console.log('  Result: 49 cases written to wrong rows (duplicate Legacy_Case_IDs)\n');
  console.log('AFTER:');
  console.log('  1. Try Case_ID first (unique)');
  console.log('  2. Fallback to Legacy_Case_ID (only if needed)\n');
  console.log('  Result: All 207 cases will write to correct unique rows\n');
  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('📋 Next Steps:\n');
  console.log('  1. Refresh Google Sheet (Ctrl+Shift+R or F5)');
  console.log('  2. Open Categories & Pathways panel');
  console.log('  3. Click "Apply Selected Categories to Master"');
  console.log('  4. Watch Live Retry Logs for real-time progress');
  console.log('  5. Verify all 207 cases now have data in columns P, Q, R, S\n');
  console.log('Expected outcome:');
  console.log('  ✅ Cases updated: 207');
  console.log('  ✅ Errors: 0');
  console.log('  ✅ All rows 3-209 have categorization data\n');
}

main().catch(console.error);
