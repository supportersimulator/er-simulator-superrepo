/**
 * Verify Apply Function Fix Deployment
 *
 * Checks that the fix for dictionary key collision was deployed correctly:
 * - Uses caseID as dictionary key (not legacyCaseID)
 * - Stores legacyCaseID as object property
 * - Loop iterates by caseID
 * - Extracts legacyCaseID from object for lookup
 */

const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function main() {
  console.log('🔍 Verifying Apply Function Fix Deployment\n');

  const token = JSON.parse(fs.readFileSync('./config/token.json', 'utf-8'));
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/oauth2callback'
  );
  oAuth2Client.setCredentials(token);

  const script = google.script({ version: 'v1', auth: oAuth2Client });
  const scriptId = process.env.APPS_SCRIPT_ID;

  const project = await script.projects.getContent({ scriptId });
  const codeFile = project.data.files.find(f => f.name === 'Code');

  if (!codeFile) {
    console.log('❌ Code.gs not found');
    return;
  }

  console.log('✅ Code.gs found\n');

  // Find the applyCategorization function
  const applyMatches = [...codeFile.source.matchAll(/function applyCategorization\(applyMode\)[\s\S]*?(?=\nfunction [a-z]|\n\/\*\*\*|$)/g)];

  if (applyMatches.length === 0) {
    console.log('❌ applyCategorization function not found');
    return;
  }

  const lastMatch = applyMatches[applyMatches.length - 1];
  const funcSource = lastMatch[0];

  console.log('📊 Verification Results:\n');
  console.log('══════════════════════════════════════════════════════════════\n');

  // Check 1: Dictionary key should be caseID
  if (funcSource.includes('categorizationData[caseID] = {')) {
    console.log('✅ PASS: Uses caseID as dictionary key');
  } else if (funcSource.includes('categorizationData[legacyCaseID] = {')) {
    console.log('❌ FAIL: Still uses legacyCaseID as dictionary key');
  } else {
    console.log('⚠️  UNKNOWN: Cannot find dictionary assignment pattern');
  }

  // Check 2: Should store legacyCaseID as property
  if (funcSource.includes('legacyCaseID: legacyCaseID,')) {
    console.log('✅ PASS: Stores legacyCaseID as object property');
  } else {
    console.log('❌ FAIL: Missing legacyCaseID property storage');
  }

  // Check 3: Loop should iterate by caseID
  if (funcSource.match(/for \(const caseID in categorizationData\)/)) {
    console.log('✅ PASS: Loop iterates by caseID');
  } else if (funcSource.match(/for \(const legacyCaseID in categorizationData\)/)) {
    console.log('❌ FAIL: Loop still iterates by legacyCaseID');
  } else {
    console.log('⚠️  UNKNOWN: Cannot find loop pattern');
  }

  // Check 4: Should extract legacyCaseID from object
  if (funcSource.includes('const legacyCaseID = cat.legacyCaseID;')) {
    console.log('✅ PASS: Extracts legacyCaseID from categorization object');
  } else {
    console.log('❌ FAIL: Missing legacyCaseID extraction');
  }

  console.log('\n══════════════════════════════════════════════════════════════\n');

  // Show the actual code section
  const codeSection = funcSource.substring(
    funcSource.indexOf('const categorizationData = {};'),
    funcSource.indexOf('applyCategorizationUpdates(')
  );

  console.log('📝 Actual Code Section:\n');
  console.log(codeSection.substring(0, 1000));

  if (codeSection.length > 1000) {
    console.log('\n... (showing first 1000 chars)\n');
  }

  // Final verdict
  const allPassed =
    funcSource.includes('categorizationData[caseID] = {') &&
    funcSource.includes('legacyCaseID: legacyCaseID,') &&
    funcSource.match(/for \(const caseID in categorizationData\)/) &&
    funcSource.includes('const legacyCaseID = cat.legacyCaseID;');

  console.log('\n══════════════════════════════════════════════════════════════\n');

  if (allPassed) {
    console.log('🎉 DEPLOYMENT VERIFIED: All fixes are in place!\n');
    console.log('✅ Ready for user to test Apply function\n');
    console.log('Next steps:');
    console.log('  1. Refresh Google Sheet (F5)');
    console.log('  2. Open AI Categorization Tools');
    console.log('  3. Click "Apply Selected Categories to Master"');
    console.log('  4. Should succeed with all 207 cases\n');
  } else {
    console.log('⚠️  DEPLOYMENT INCOMPLETE: Some fixes missing\n');
    console.log('Need to redeploy the fix\n');
  }
}

main().catch(console.error);
