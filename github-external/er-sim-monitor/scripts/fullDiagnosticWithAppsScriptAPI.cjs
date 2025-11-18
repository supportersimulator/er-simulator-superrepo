/**
 * Full Diagnostic Using Apps Script API
 *
 * Step 1: Read ALL panel files
 * Step 2: Find syntax error patterns (quote escaping, template literals)
 * Step 3: Identify duplicate function definitions
 * Step 4: Isolate exact problems
 * Step 5: Fix cleanly
 */

const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function main() {
  console.log('🔍 FULL DIAGNOSTIC - Apps Script API\n');
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

  console.log('📥 Downloading entire project...\n');

  const project = await script.projects.getContent({ scriptId });
  const files = project.data.files;

  console.log(`✅ Found ${files.length} files in project\n`);
  console.log('══════════════════════════════════════════════════════════════\n');

  // ═══════════════════════════════════════════════════════════════════════
  // STEP 1: LIST ALL FILES
  // ═══════════════════════════════════════════════════════════════════════
  console.log('📂 ALL FILES IN PROJECT:\n');
  files.forEach((f, i) => {
    const sizeKB = f.source ? (f.source.length / 1024).toFixed(1) : '0';
    console.log(`  ${i + 1}. ${f.name} (${sizeKB} KB)`);
  });
  console.log('\n');

  // ═══════════════════════════════════════════════════════════════════════
  // STEP 2: FIND PROBLEMATIC QUOTE ESCAPING PATTERNS
  // ═══════════════════════════════════════════════════════════════════════
  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('🔍 SEARCHING FOR QUOTE ESCAPING ISSUES:\n');
  console.log('══════════════════════════════════════════════════════════════\n');

  // Search for the problematic string pattern (backslash-quote escaping)
  const problematicString = ".replace(/'/g, \"\\\\'\")";
  const issueFiles = [];

  files.forEach(file => {
    if (!file.source) return;

    // Count occurrences using split method
    const occurrences = file.source.split(problematicString).length - 1;

    if (occurrences > 0) {
      issueFiles.push({ file: file.name, count: occurrences });
      console.log(`❌ ${file.name}: Found ${occurrences} problematic quote escaping patterns\n`);

      // Find exact line numbers
      const lines = file.source.split('\n');
      lines.forEach((line, idx) => {
        if (line.includes(problematicString)) {
          console.log(`   Line ${idx + 1}: ${line.trim().substring(0, 100)}...\n`);
        }
      });
    }
  });

  if (issueFiles.length === 0) {
    console.log('✅ No problematic quote escaping found\n');
  }

  // ═══════════════════════════════════════════════════════════════════════
  // STEP 3: FIND DUPLICATE FUNCTION DEFINITIONS
  // ═══════════════════════════════════════════════════════════════════════
  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('🔍 SEARCHING FOR DUPLICATE FUNCTIONS:\n');
  console.log('══════════════════════════════════════════════════════════════\n');

  const functionsMap = new Map(); // functionName -> [{ file, lineNumber }]

  // Key functions to check for duplicates
  const keyFunctions = [
    'buildCategoriesPathwaysMainMenu_',
    'buildEnhancedCategoriesTab',
    'openCategoriesPathwaysPanel',
    'openEnhancedVisualPanel',
    'runAICategorization',
    'runPathwayChainBuilder',
    'viewSymptomCategory',
    'viewSystemCategory',
    'viewCategory',
    'viewPathway'
  ];

  files.forEach(file => {
    if (!file.source) return;

    keyFunctions.forEach(funcName => {
      const pattern = new RegExp(`function\\s+${funcName}\\s*\\(`, 'g');
      const matches = file.source.match(pattern);
      if (matches) {
        if (!functionsMap.has(funcName)) {
          functionsMap.set(funcName, []);
        }
        functionsMap.get(funcName).push({ file: file.name, count: matches.length });
      }
    });
  });

  console.log('Function definitions found:\n');
  functionsMap.forEach((locations, funcName) => {
    if (locations.length > 1) {
      console.log(`⚠️  DUPLICATE: ${funcName} found in ${locations.length} files:`);
      locations.forEach(loc => {
        console.log(`     - ${loc.file} (${loc.count} times)`);
      });
      console.log('');
    } else if (locations.length === 1) {
      console.log(`✅ ${funcName}: ${locations[0].file}`);
    }
  });
  console.log('\n');

  // ═══════════════════════════════════════════════════════════════════════
  // STEP 4: FIND TEMPLATE LITERAL ISSUES IN ONCLICK HANDLERS
  // ═══════════════════════════════════════════════════════════════════════
  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('🔍 SEARCHING FOR TEMPLATE LITERAL ISSUES IN ONCLICK:\n');
  console.log('══════════════════════════════════════════════════════════════\n');

  // Search for onclick with ${...} template literals (simple string search)
  files.forEach(file => {
    if (!file.source) return;
    const lines = file.source.split('\n');
    const problematicLines = [];

    lines.forEach((line, idx) => {
      if (line.includes('onclick=') && line.includes('${')) {
        problematicLines.push({ lineNum: idx + 1, content: line.trim() });
      }
    });

    if (problematicLines.length > 0) {
      console.log(`⚠️  ${file.name}: Found ${problematicLines.length} onclick handlers with template literals\n`);
      problematicLines.forEach(item => {
        console.log(`   Line ${item.lineNum}: ${item.content.substring(0, 100)}...\n`);
      });
    }
  });

  // ═══════════════════════════════════════════════════════════════════════
  // STEP 5: CHECK WHICH FILE CONTAINS "🤖 AI Categorization Tools" BUTTON
  // ═══════════════════════════════════════════════════════════════════════
  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('🔍 FINDING "🤖 AI Categorization Tools" BUTTON:\n');
  console.log('══════════════════════════════════════════════════════════════\n');

  const buttonSearchTerm = '🤖 AI Categorization Tools';
  const buttonFiles = [];

  files.forEach(file => {
    if (!file.source) return;
    if (file.source.includes(buttonSearchTerm)) {
      buttonFiles.push(file.name);
      console.log(`✅ Found in: ${file.name}\n`);

      // Find line number
      const lines = file.source.split('\n');
      lines.forEach((line, idx) => {
        if (line.includes(buttonSearchTerm)) {
          console.log(`   Line ${idx + 1}: ${line.trim()}\n`);
        }
      });
    }
  });

  if (buttonFiles.length === 0) {
    console.log('❌ Button not found in any file\n');
  } else if (buttonFiles.length > 1) {
    console.log(`⚠️  WARNING: Button found in ${buttonFiles.length} files (potential conflict)\n`);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // SUMMARY
  // ═══════════════════════════════════════════════════════════════════════
  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('📊 DIAGNOSTIC SUMMARY:\n');
  console.log('══════════════════════════════════════════════════════════════\n');
  console.log(`Total files: ${files.length}`);
  console.log(`Files with quote escaping issues: ${issueFiles.length}`);
  console.log(`Duplicate functions detected: ${Array.from(functionsMap.values()).filter(v => v.length > 1).length}`);
  console.log(`Files containing "🤖 AI Categorization Tools": ${buttonFiles.length}\n`);

  if (issueFiles.length > 0) {
    console.log('🔧 RECOMMENDED FIXES:\n');
    issueFiles.forEach(issue => {
      console.log(`  1. Fix ${issue.file}: Replace .replace(/'/g, "\\\\'") with .replace(/'/g, '&apos;')`);
    });
  }

  console.log('\n');
}

main().catch(console.error);
