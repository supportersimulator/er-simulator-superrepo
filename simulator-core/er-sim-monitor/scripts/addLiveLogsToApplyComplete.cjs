/**
 * Add Live Logs to Apply Function - Complete
 *
 * Makes ALL Apply function logs appear in your live log viewer
 */

const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function main() {
  console.log('🔧 Adding Live Logs to Apply Function (Complete)\n');

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

  let newCode = codeFile.source;

  console.log('📋 Adding addAILog alongside all Logger.log calls in lookup functions...\n');

  // Find and fix findRowByCaseID
  const caseIDFuncMatch = newCode.match(/function findRowByCaseID\(sheet, caseID\)[\s\S]*?(?=\nfunction [a-z]|\n\/\*\*\*|$)/);

  if (caseIDFuncMatch) {
    let fixedFunc = caseIDFuncMatch[0];

    // Add addAILog alongside Logger.log
    if (!fixedFunc.includes("addAILog('🔍 findRowByCaseID")) {
      fixedFunc = fixedFunc.replace(
        /Logger\.log\('🔍 findRowByCaseID called with caseID: ' \+ caseID\);/,
        `addAILog('🔍 findRowByCaseID: "' + caseID + '"');
  Logger.log('🔍 findRowByCaseID called with caseID: ' + caseID);`
      );

      fixedFunc = fixedFunc.replace(
        /Logger\.log\('   Sheet name: ' \+ \(sheet \? sheet\.getName\(\) : 'NULL'\)\);/,
        `addAILog('   Sheet: ' + (sheet ? sheet.getName() : 'NULL'));
  Logger.log('   Sheet name: ' + (sheet ? sheet.getName() : 'NULL'));`
      );

      fixedFunc = fixedFunc.replace(
        /Logger\.log\('   ✅ FOUND at index ' \+ i \+ ', returning row ' \+ \(i \+ 3\)\);/,
        `addAILog('   ✅ FOUND at row ' + (i + 3));
      Logger.log('   ✅ FOUND at index ' + i + ', returning row ' + (i + 3));`
      );

      fixedFunc = fixedFunc.replace(
        /Logger\.log\('   ❌ NOT FOUND in ' \+ data\.length \+ ' rows searched'\);/,
        `addAILog('   ❌ NOT FOUND (searched ' + data.length + ' rows)');
  Logger.log('   ❌ NOT FOUND in ' + data.length + ' rows searched');`
      );

      newCode = newCode.replace(/function findRowByCaseID\(sheet, caseID\)[\s\S]*?(?=\nfunction [a-z]|\n\/\*\*\*|$)/, fixedFunc);
      console.log('✅ Fixed findRowByCaseID');
    } else {
      console.log('✅ findRowByCaseID already has live logs');
    }
  }

  // Find and fix findRowByLegacyCaseID
  const legacyFuncMatch = newCode.match(/function findRowByLegacyCaseID\(sheet, legacyCaseID\)[\s\S]*?(?=\nfunction [a-z]|\n\/\*\*\*|$)/);

  if (legacyFuncMatch) {
    let fixedFunc = legacyFuncMatch[0];

    if (!fixedFunc.includes("addAILog('🔍 findRowByLegacyCaseID")) {
      fixedFunc = fixedFunc.replace(
        /Logger\.log\('🔍 findRowByLegacyCaseID called with legacyCaseID: ' \+ legacyCaseID\);/,
        `addAILog('🔍 findRowByLegacyCaseID: "' + legacyCaseID + '"');
  Logger.log('🔍 findRowByLegacyCaseID called with legacyCaseID: ' + legacyCaseID);`
      );

      fixedFunc = fixedFunc.replace(
        /Logger\.log\('   Sheet name: ' \+ \(sheet \? sheet\.getName\(\) : 'NULL'\)\);/,
        `addAILog('   Sheet: ' + (sheet ? sheet.getName() : 'NULL'));
  Logger.log('   Sheet name: ' + (sheet ? sheet.getName() : 'NULL'));`
      );

      // This one is trickier - need to find the right if statement
      const lines = fixedFunc.split('\n');
      const newLines = [];

      for (let i = 0; i < lines.length; i++) {
        newLines.push(lines[i]);

        // After "if (data[i][0] === legacyCaseID) {"
        if (lines[i].includes('if (data[i][0] === legacyCaseID)') && lines[i+1] && lines[i+1].includes("Logger.log('   ✅ FOUND")) {
          newLines.push("      addAILog('   ✅ FOUND at row ' + (i + 3));");
        }

        // Before "return null; // Not found"
        if (lines[i].includes("Logger.log('   ❌ NOT FOUND in") && lines[i+1] && lines[i+1].includes('return null')) {
          newLines.push("  addAILog('   ❌ NOT FOUND (searched ' + data.length + ' rows)');");
        }
      }

      fixedFunc = newLines.join('\n');

      newCode = newCode.replace(/function findRowByLegacyCaseID\(sheet, legacyCaseID\)[\s\S]*?(?=\nfunction [a-z]|\n\/\*\*\*|$)/, fixedFunc);
      console.log('✅ Fixed findRowByLegacyCaseID');
    } else {
      console.log('✅ findRowByLegacyCaseID already has live logs');
    }
  }

  codeFile.source = newCode;

  console.log('\n🚀 Deploying...\n');

  await script.projects.updateContent({
    scriptId: scriptId,
    requestBody: { files: project.data.files }
  });

  console.log('✅ Deployed!\n');
  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('📋 Your Live Log Viewer Will Now Show:\n');
  console.log('🚀 Starting Apply Categorizations...');
  console.log('   Mode: all\n');
  console.log('📊 Loaded 207 categorization results\n');
  console.log('✅ Found 207 cases with final categories\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📝 Applying to Master Scenario Convert...\n');
  console.log('   Searching for: ES1-Sepsis (GAST0001)');
  console.log('→ Trying Legacy_Case_ID first...');
  console.log('🔍 findRowByLegacyCaseID: "ES1-Sepsis"');
  console.log('   Sheet: Master Scenario Convert');
  console.log('   ✅ FOUND at row 3');
  console.log('      ✅ Found at row 3: PSY / Psychiatric\n');
  console.log('OR if not found:');
  console.log('   ❌ NOT FOUND (searched 207 rows)');
  console.log('→ Fallback: Trying Case_ID...');
  console.log('🔍 findRowByCaseID: "GAST0001"');
  console.log('   Sheet: Master Scenario Convert');
  console.log('   ✅ FOUND at row 3\n');
  console.log('Next: Refresh Sheet and try Apply!\n');
}

main().catch(console.error);
