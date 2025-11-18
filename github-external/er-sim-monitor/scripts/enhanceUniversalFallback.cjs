/**
 * Enhance Universal Fallback Logic
 *
 * Changes from if/else to sequential fallback:
 * - Try Legacy_Case_ID first (if exists)
 * - If not found, ALWAYS try Case_ID as fallback
 *
 * Benefits:
 * - Reduces retries (self-healing if Legacy_Case_ID wrong/missing)
 * - Consistent pattern for all 207 cases
 * - No errors for mismatched Legacy_Case_IDs
 */

const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function main() {
  console.log('🔧 Enhancing Universal Fallback Logic\n');
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

  // Find the LAST applyCategorizationUpdates function
  const updateMatches = [...codeFile.source.matchAll(/function applyCategorizationUpdates\(categorizationData, masterSheet\)[\s\S]*?(?=\nfunction [a-z]|\n\/\*\*\*|$)/g)];
  const lastMatch = updateMatches[updateMatches.length - 1];

  if (!lastMatch) {
    console.log('❌ applyCategorizationUpdates function not found');
    return;
  }

  let updatedFunc = lastMatch[0];

  console.log('🔍 Current Logic (if/else pattern):\n');
  console.log('  if (legacyCaseID && legacyCaseID.length > 0) {');
  console.log('    row = findRowByLegacyCaseID(masterSheet, legacyCaseID);');
  console.log('  } else {');
  console.log('    row = findRowByCaseID(masterSheet, cat.caseID);');
  console.log('  }\n');
  console.log('  Problem: If Legacy lookup fails, no fallback!\n');

  console.log('✨ Enhanced Logic (sequential fallback):\n');
  console.log('  // Try Legacy_Case_ID first (if exists)');
  console.log('  if (legacyCaseID && legacyCaseID.length > 0) {');
  console.log('    row = findRowByLegacyCaseID(masterSheet, legacyCaseID);');
  console.log('  }');
  console.log('  ');
  console.log('  // If not found (either empty or lookup failed), try Case_ID');
  console.log('  if (!row) {');
  console.log('    row = findRowByCaseID(masterSheet, cat.caseID);');
  console.log('  }\n');
  console.log('  Benefit: ALWAYS tries Case_ID if Legacy fails!\n');

  console.log('══════════════════════════════════════════════════════════════\n');

  // Replace the if/else with sequential fallback
  updatedFunc = updatedFunc.replace(
    /\/\/ Find row by Legacy_Case_ID, or Case_ID if Legacy is empty\s*let row;\s*if \(legacyCaseID && legacyCaseID\.length > 0\) \{\s*row = findRowByLegacyCaseID\(masterSheet, legacyCaseID\);\s*\} else \{\s*\/\/ Fallback: use Case_ID for cases without Legacy_Case_ID\s*row = findRowByCaseID\(masterSheet, cat\.caseID\);\s*\}/,
    `// Find row by Legacy_Case_ID first, then fallback to Case_ID
      let row;
      if (legacyCaseID && legacyCaseID.length > 0) {
        row = findRowByLegacyCaseID(masterSheet, legacyCaseID);
      }

      // Universal fallback: If not found by Legacy, try Case_ID
      // This works for both:
      // - Retry cases (legacyCaseID empty, uses Case_ID from start)
      // - Regular cases (if Legacy lookup fails, auto-retry with Case_ID)
      if (!row) {
        row = findRowByCaseID(masterSheet, cat.caseID);
      }`
  );

  // Replace in Code.gs
  let newCode = codeFile.source;
  const updateStart = lastMatch.index;
  const updateEnd = updateStart + lastMatch[0].length;
  newCode = newCode.substring(0, updateStart) + updatedFunc + newCode.substring(updateEnd);

  codeFile.source = newCode;

  console.log('✅ Enhanced fallback logic\n');

  // Deploy
  console.log('🚀 Deploying to Apps Script...\n');

  await script.projects.updateContent({
    scriptId: scriptId,
    requestBody: { files: project.data.files }
  });

  console.log('✅ Deployment complete!\n');
  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('🎯 Universal Fallback Now Active!\n');
  console.log('How it works for all 207 cases:\n');
  console.log('1️⃣ Regular Cases (182 with Legacy_Case_ID):');
  console.log('   - Try Legacy_Case_ID lookup in Column I');
  console.log('   - If found → ✅ Update');
  console.log('   - If NOT found → Try Case_ID lookup in Column A');
  console.log('   - If found → ✅ Update (self-healed!)');
  console.log('   - If NOT found → ❌ Error (case truly missing)\n');

  console.log('2️⃣ Retry Cases (25 without Legacy_Case_ID):');
  console.log('   - legacyCaseID empty, skip Legacy lookup');
  console.log('   - Try Case_ID lookup in Column A');
  console.log('   - If found → ✅ Update');
  console.log('   - If NOT found → ❌ Error (case truly missing)\n');

  console.log('Benefits:');
  console.log('  ✅ Reduces retries (auto-heals Legacy_Case_ID mismatches)');
  console.log('  ✅ Consistent pattern (all cases get Case_ID fallback)');
  console.log('  ✅ Self-healing (if Legacy wrong, Case_ID saves it)');
  console.log('  ✅ No code changes needed per case type\n');

  console.log('Example scenario this prevents:');
  console.log('  - Regular case: Legacy_Case_ID = "ES1-Sepsis"');
  console.log('  - Master sheet value changed to "ES1-Sepsis-v2"');
  console.log('  - Legacy lookup: ❌ Not found');
  console.log('  - Case_ID fallback: ✅ Found by "GAST0001"');
  console.log('  - Result: Update succeeds, no retry needed!\n');
}

main().catch(console.error);
