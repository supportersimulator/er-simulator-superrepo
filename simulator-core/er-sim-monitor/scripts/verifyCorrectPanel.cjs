/**
 * Verify Phase2_Enhanced_Categories_With_AI.gs
 *
 * This is the ACTUAL file being used (Categories & Pathways with yellow TEST banner)
 * Check for syntax errors and verify Specific Rows mode exists
 */

const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function main() {
  console.log('🔍 VERIFYING Phase2_Enhanced_Categories_With_AI.gs\n');
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

  console.log('📥 Reading Phase2_Enhanced_Categories_With_AI.gs via API...\n');

  const project = await script.projects.getContent({ scriptId });
  const targetFile = project.data.files.find(f => f.name === 'Phase2_Enhanced_Categories_With_AI');

  if (!targetFile) {
    console.log('❌ Phase2_Enhanced_Categories_With_AI not found\n');
    return;
  }

  console.log('✅ Found Phase2_Enhanced_Categories_With_AI.gs\n');
  console.log(`   File size: ${(targetFile.source.length / 1024).toFixed(1)} KB\n`);

  const lines = targetFile.source.split('\n');

  // ═══════════════════════════════════════════════════════════════════════
  // CHECK 1: Find the yellow TEST VERSION banner (confirms correct file)
  // ═══════════════════════════════════════════════════════════════════════
  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('CHECK 1: Yellow TEST VERSION banner\n');
  console.log('══════════════════════════════════════════════════════════════\n');

  if (targetFile.source.includes('TEST VERSION ACTIVE')) {
    console.log('✅ Found TEST VERSION banner - this is the correct file!\n');
  } else {
    console.log('❌ TEST VERSION banner not found\n');
  }

  // ═══════════════════════════════════════════════════════════════════════
  // CHECK 2: Find Specific Rows mode selector
  // ═══════════════════════════════════════════════════════════════════════
  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('CHECK 2: Specific Rows mode in dropdown\n');
  console.log('══════════════════════════════════════════════════════════════\n');

  const specificRowsLines = [];
  lines.forEach((line, idx) => {
    if (line.toLowerCase().includes('specific') &&
        (line.includes('option') || line.includes('value'))) {
      specificRowsLines.push({ lineNum: idx + 1, content: line.trim() });
    }
  });

  if (specificRowsLines.length > 0) {
    console.log(`✅ Found ${specificRowsLines.length} "Specific Rows" mode references\n`);
    specificRowsLines.forEach(item => {
      console.log(`   Line ${item.lineNum}: ${item.content.substring(0, 80)}...\n`);
    });
  } else {
    console.log('❌ "Specific Rows" mode not found\n');
  }

  // ═══════════════════════════════════════════════════════════════════════
  // CHECK 3: Find mode change event listener
  // ═══════════════════════════════════════════════════════════════════════
  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('CHECK 3: Mode change event listener (shows/hides input field)\n');
  console.log('══════════════════════════════════════════════════════════════\n');

  const listenerLines = [];
  lines.forEach((line, idx) => {
    if (line.includes('aiCatMode') ||
        (line.includes('addEventListener') && line.includes('change'))) {
      listenerLines.push({ lineNum: idx + 1, content: line.trim() });
    }
  });

  if (listenerLines.length > 0) {
    console.log(`✅ Found ${listenerLines.length} event listener references\n`);
    listenerLines.slice(0, 10).forEach(item => {
      console.log(`   Line ${item.lineNum}: ${item.content.substring(0, 80)}...\n`);
    });
  } else {
    console.log('❌ Mode change event listener not found\n');
  }

  // ═══════════════════════════════════════════════════════════════════════
  // CHECK 4: Find specificRowsContainer (input field container)
  // ═══════════════════════════════════════════════════════════════════════
  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('CHECK 4: Specific Rows input container\n');
  console.log('══════════════════════════════════════════════════════════════\n');

  if (targetFile.source.includes('specificRowsContainer')) {
    console.log('✅ Found specificRowsContainer element\n');

    lines.forEach((line, idx) => {
      if (line.includes('specificRowsContainer')) {
        console.log(`   Line ${idx + 1}: ${line.trim().substring(0, 80)}...\n`);
      }
    });
  } else {
    console.log('❌ specificRowsContainer not found\n');
  }

  // ═══════════════════════════════════════════════════════════════════════
  // CHECK 5: Search for syntax error patterns
  // ═══════════════════════════════════════════════════════════════════════
  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('CHECK 5: Potential syntax error patterns\n');
  console.log('══════════════════════════════════════════════════════════════\n');

  // Check for problematic quote escaping
  const problematicQuotes = ".replace(/'/g, \"\\\\'\")";
  const quoteOccurrences = targetFile.source.split(problematicQuotes).length - 1;

  if (quoteOccurrences > 0) {
    console.log(`❌ Found ${quoteOccurrences} problematic quote escaping patterns\n`);
  } else {
    console.log('✅ No problematic quote escaping\n');
  }

  // Check for template literals in onclick
  const problematicOnclicks = [];
  lines.forEach((line, idx) => {
    if (line.includes('onclick=') && line.includes('${')) {
      problematicOnclicks.push({ lineNum: idx + 1, content: line.trim() });
    }
  });

  if (problematicOnclicks.length > 0) {
    console.log(`⚠️  Found ${problematicOnclicks.length} onclick handlers with template literals:\n`);
    problematicOnclicks.slice(0, 5).forEach(item => {
      console.log(`   Line ${item.lineNum}: ${item.content.substring(0, 100)}...\n`);
    });
  } else {
    console.log('✅ No problematic onclick handlers\n');
  }

  // ═══════════════════════════════════════════════════════════════════════
  // SUMMARY
  // ═══════════════════════════════════════════════════════════════════════
  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('📊 FINAL REPORT\n');
  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('This is the panel YOU are using (with yellow TEST VERSION banner)\n\n');

  const hasTestBanner = targetFile.source.includes('TEST VERSION ACTIVE');
  const hasSpecificMode = specificRowsLines.length > 0;
  const hasListener = listenerLines.length > 0;
  const hasContainer = targetFile.source.includes('specificRowsContainer');
  const hasSyntaxErrors = quoteOccurrences > 0 || problematicOnclicks.length > 0;

  console.log('Feature Status:\n');
  console.log(`  ${hasTestBanner ? '✅' : '❌'} TEST VERSION banner (confirms correct file)`);
  console.log(`  ${hasSpecificMode ? '✅' : '❌'} Specific Rows mode in dropdown`);
  console.log(`  ${hasListener ? '✅' : '❌'} Mode change event listener`);
  console.log(`  ${hasContainer ? '✅' : '❌'} Input field container (specificRowsContainer)`);
  console.log(`  ${!hasSyntaxErrors ? '✅' : '❌'} No syntax errors\n`);

  if (hasSyntaxErrors) {
    console.log('🔧 ISSUES FOUND:\n');
    if (quoteOccurrences > 0) {
      console.log(`  - ${quoteOccurrences} problematic quote escaping patterns`);
    }
    if (problematicOnclicks.length > 0) {
      console.log(`  - ${problematicOnclicks.length} onclick handlers with template literals`);
    }
    console.log('\n');
  }

  console.log('Next step: Test in Google Sheets to see actual browser errors\n');
}

main().catch(console.error);
