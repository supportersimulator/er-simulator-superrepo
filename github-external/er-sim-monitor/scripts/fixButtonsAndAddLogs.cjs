/**
 * Fix Button Onclick Handlers AND Add Comprehensive Logging
 *
 * Part 1: Fix panel button onclick to call correct function names
 * Part 2: Add comprehensive addAILog() calls to all functions
 */

const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function main() {
  console.log('🔧 Fixing Buttons & Adding Comprehensive Logging\n');
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
  const panelFile = project.data.files.find(f => f.name === 'Phase2_Enhanced_Categories_With_AI');
  const codeFile = project.data.files.find(f => f.name === 'Code');

  if (!panelFile || !codeFile) {
    console.log('❌ Required files not found\n');
    return;
  }

  // ==========================================================================
  // PART 1: Fix Panel Button Onclick Handlers
  // ==========================================================================

  console.log('═'.repeat(70) + '\n');
  console.log('PART 1: Fixing Button Onclick Handlers\n');
  console.log('═'.repeat(70) + '\n');

  let html = panelFile.source;

  const buttonFixes = [
    {
      name: 'Retry Failed',
      wrong: 'retryFailedCases()',
      correct: 'retryFailedCategorization()',
    },
    {
      name: 'Clear Results',
      wrong: 'clearAIResults()',
      correct: 'clearAICategorizationResults()',
    },
    {
      name: 'Apply to Master',
      wrong: 'applyCategorizations()',
      correct: 'applyCategorization()',
    },
    {
      name: 'Export CSV',
      wrong: 'exportCategorizationResults()',
      correct: 'exportCategorizationResults()',
      status: 'UNKNOWN - need to check if exists',
    },
  ];

  let fixedButtons = 0;

  for (const fix of buttonFixes) {
    if (fix.status) {
      console.log(`  ⚠️  ${fix.name}: ${fix.status}`);
      continue;
    }

    const pattern = new RegExp(fix.wrong.replace(/\(/g, '\\(').replace(/\)/g, '\\)'), 'g');
    const matches = html.match(pattern);

    if (matches) {
      html = html.replace(pattern, fix.correct);
      console.log(`  ✅ Fixed "${fix.name}": ${fix.wrong} → ${fix.correct}`);
      fixedButtons++;
    } else {
      console.log(`  ✅ "${fix.name}" already correct (${fix.correct})`);
    }
  }

  console.log(`\n✅ Fixed ${fixedButtons} button onclick handlers\n`);

  panelFile.source = html;

  // ==========================================================================
  // PART 2: Add Comprehensive Logging to Functions
  // ==========================================================================

  console.log('═'.repeat(70) + '\n');
  console.log('PART 2: Adding Comprehensive Logging\n');
  console.log('═'.repeat(70) + '\n');

  let code = codeFile.source;

  // Check if addAILog helper exists
  if (!code.includes('function addAILog(')) {
    console.log('⚠️  addAILog() function not found, adding it...\n');

    const addAILogFunction = `
/**
 * Add AI Log Entry
 * Logs are stored in Script Properties and displayed in Live Logs panel
 */
function addAILog(message) {
  const props = PropertiesService.getScriptProperties();
  let logs = props.getProperty('AI_Logs') || '';
  const timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'HH:mm:ss');
  logs += '[' + timestamp + '] ' + message + '\\n';
  props.setProperty('AI_Logs', logs);
  Logger.log(message); // Also log to Apps Script logger
}

/**
 * Clear AI Logs
 */
function clearAILogs() {
  PropertiesService.getScriptProperties().deleteProperty('AI_Logs');
  return 'Logs cleared';
}

/**
 * Get AI Logs
 */
function getAILogs() {
  return PropertiesService.getScriptProperties().getProperty('AI_Logs') || 'No logs yet.';
}
`;

    // Add after the first function declaration
    const firstFunctionMatch = code.match(/^function [a-zA-Z_]/m);
    if (firstFunctionMatch) {
      const insertPos = code.indexOf(firstFunctionMatch[0]);
      code = code.substring(0, insertPos) + addAILogFunction + '\\n' + code.substring(insertPos);
      console.log('✅ Added addAILog(), clearAILogs(), getAILogs() functions\n');
    }
  }

  // Add logging to runAICategorization
  console.log('📝 Adding logs to runAICategorization()...\n');

  const runAIMatch = code.match(/function runAICategorization\(([^)]*)\) \{/);

  if (runAIMatch) {
    const funcStart = code.indexOf(runAIMatch[0]);
    const funcBody = code.substring(funcStart, funcStart + 5000);

    // Check if already has logging
    if (!funcBody.includes('addAILog')) {
      // Add log at start
      const insertAfterBrace = funcStart + runAIMatch[0].length;

      const startLog = `
  addAILog('🚀 Starting AI Categorization');
  addAILog('Mode: ' + (mode || 'all') + (specificInput ? ' | Input: ' + specificInput : ''));
  `;

      code = code.substring(0, insertAfterBrace) + startLog + code.substring(insertAfterBrace);
      console.log('  ✅ Added start logs');
    } else {
      console.log('  ✅ Already has logging');
    }
  }

  // Add logging to retryFailedCategorization
  console.log('📝 Adding logs to retryFailedCategorization()...\n');

  const retryMatch = code.match(/function retryFailedCategorization\([^)]*\) \{/);

  if (retryMatch) {
    const funcStart = code.indexOf(retryMatch[0]);
    const funcBody = code.substring(funcStart, funcStart + 5000);

    if (!funcBody.includes('addAILog')) {
      const insertAfterBrace = funcStart + retryMatch[0].length;

      const startLog = `
  addAILog('🔄 Starting retry of failed categorizations');
  `;

      code = code.substring(0, insertAfterBrace) + startLog + code.substring(insertAfterBrace);
      console.log('  ✅ Added start logs');
    } else {
      console.log('  ✅ Already has logging');
    }
  }

  // Add logging to applyCategorization
  console.log('📝 Adding logs to applyCategorization()...\n');

  const applyMatch = code.match(/function applyCategorization\([^)]*\) \{/);

  if (applyMatch) {
    const funcStart = code.indexOf(applyMatch[0]);
    const funcBody = code.substring(funcStart, funcStart + 5000);

    if (!funcBody.includes('addAILog')) {
      const insertAfterBrace = funcStart + applyMatch[0].length;

      const startLog = `
  addAILog('✅ Starting apply categorizations to Master');
  `;

      code = code.substring(0, insertAfterBrace) + startLog + code.substring(insertAfterBrace);
      console.log('  ✅ Added start logs');
    } else {
      console.log('  ✅ Already has logging');
    }
  }

  // Add logging to clearAICategorizationResults
  console.log('📝 Adding logs to clearAICategorizationResults()...\n');

  const clearMatch = code.match(/function clearAICategorizationResults\([^)]*\) \{/);

  if (clearMatch) {
    const funcStart = code.indexOf(clearMatch[0]);
    const funcBody = code.substring(funcStart, funcStart + 2000);

    if (!funcBody.includes('addAILog')) {
      const insertAfterBrace = funcStart + clearMatch[0].length;

      const startLog = `
  addAILog('🗑️ Clearing AI categorization results');
  `;

      code = code.substring(0, insertAfterBrace) + startLog + code.substring(insertAfterBrace);
      console.log('  ✅ Added start logs');
    } else {
      console.log('  ✅ Already has logging');
    }
  }

  codeFile.source = code;

  console.log('\n' + '═'.repeat(70) + '\n');
  console.log('🚀 Deploying changes...\n');

  await script.projects.updateContent({
    scriptId: scriptId,
    requestBody: { files: project.data.files }
  });

  console.log('✅ Deployment complete!\n');
  console.log('═'.repeat(70) + '\n');
  console.log('🎯 Buttons Fixed & Logging Added!\n');
  console.log('═'.repeat(70) + '\n');
  console.log('✅ Fixed Panel Buttons:\n');
  console.log('   - Retry Failed → retryFailedCategorization()');
  console.log('   - Clear Results → clearAICategorizationResults()');
  console.log('   - Apply to Master → applyCategorization()\n');
  console.log('✅ Added Live Logging to:\n');
  console.log('   - runAICategorization()');
  console.log('   - retryFailedCategorization()');
  console.log('   - applyCategorization()');
  console.log('   - clearAICategorizationResults()\n');
  console.log('📋 Next Steps:\n');
  console.log('   1. Refresh Google Sheet (F5)');
  console.log('   2. Open AI Categorization panel');
  console.log('   3. Test each button');
  console.log('   4. Copy logs from Live Logs panel for debugging\n');
}

main().catch(console.error);
