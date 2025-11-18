/**
 * Add Specific Rows Mode to AI Categorization Panel - Simple Version
 *
 * Adds dropdown and input field right after the section title
 */

const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function main() {
  console.log('🔧 Adding Specific Rows Mode to AI Categorization Panel\n');
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

  // Find the CORRECT AI Categorization panel (the one with Retry Failed, Live Logs, etc.)
  const panelFile = project.data.files.find(f => f.name === 'Phase2_Enhanced_Categories_With_AI');

  if (!panelFile) {
    console.log('❌ AI Categorization panel file not found\n');
    console.log('Looking for: Phase2_Enhanced_Categories_With_AI.gs\n');
    return;
  }

  console.log('✅ Found correct panel: Phase2_Enhanced_Categories_With_AI.gs\n');

  let html = panelFile.source;

  // Check if already exists
  if (html.includes('aiCatMode') || html.includes('Specific Rows')) {
    console.log('✅ Specific Rows mode already exists!\n');
    return;
  }

  console.log('📝 Adding Specific Rows UI...\n');

  // Find the "Run AI Categorization" button and insert mode selector BEFORE it
  const runButtonMatch = html.match(/(<button[^>]*onclick="runAICategorization\(\)"[^>]*>)/);

  if (!runButtonMatch) {
    console.log('❌ Could not find Run AI Categorization button\n');
    return;
  }

  const modeSelector = `
      <!-- Categorization Mode Selector -->
      <div style="margin-bottom: 12px; padding: 10px; background: #f5f5f5; border-radius: 4px;">
        <label style="font-weight: bold; display: block; margin-bottom: 5px; font-size: 13px;">
          📋 Mode:
        </label>
        <select id="aiCatMode" style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 3px; font-size: 13px;">
          <option value="all">All Cases (207 total)</option>
          <option value="specific">Specific Rows</option>
        </select>

        <div id="specificRowsContainer" style="display: none; margin-top: 8px;">
          <label style="font-weight: bold; display: block; margin-bottom: 5px; font-size: 12px;">
            Enter Case IDs or Row Numbers:
          </label>
          <input
            type="text"
            id="specificRowsInput"
            placeholder="e.g., CARD0002,RESP0001 or 7,13,17"
            style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 3px; font-size: 12px;"
          />
          <small style="color: #666; display: block; margin-top: 3px; font-size: 11px;">
            Examples: CARD0002,CARD0005 or 7,13,17 or 7-10,15,20-25
          </small>
        </div>
      </div>

      `;

  // Insert mode selector before the Run button
  html = html.replace(runButtonMatch[0], modeSelector + runButtonMatch[0]);

  console.log('✅ Added mode selector UI\n');

  console.log('📝 Updating runAICategorization() function...\n');

  // Update the runAICategorization function
  const oldFunc = html.match(/function runAICategorization\(\) \{[\s\S]*?google\.script\.run[\s\S]*?\.runAICategorization\(\);[\s\S]*?\}/);

  if (!oldFunc) {
    console.log('❌ Could not find runAICategorization() function\n');
    return;
  }

  const newFunc = `function runAICategorization() {
      const mode = document.getElementById('aiCatMode').value;
      const specificInput = document.getElementById('specificRowsInput').value.trim();

      if (mode === 'specific' && !specificInput) {
        alert('⚠️ Please enter Case IDs or row numbers for Specific Rows mode');
        return;
      }

      const confirmMsg = mode === 'specific'
        ? 'Run AI categorization on specific rows?\\n\\nInput: ' + specificInput + '\\n\\nThis will re-categorize only the specified cases.'
        : 'Run AI categorization on all 207 cases?\\n\\nThis will take 2-3 minutes and cost ~$0.20.\\n\\nResults will be saved to AI_Categorization_Results sheet for review.';

      if (!confirm(confirmMsg)) {
        return;
      }

      const btn = document.getElementById('run-ai-btn');
      btn.disabled = true;
      btn.textContent = mode === 'specific' ? '🔄 Categorizing Specific Rows...' : '🔄 Categorizing All Cases...';

      google.script.run
        .withSuccessHandler(function() {
          btn.disabled = false;
          btn.textContent = '✅ Complete!';
          setTimeout(() => {
            btn.textContent = mode === 'specific' ? '🚀 Run AI Categorization (Specific)' : '🚀 Run AI Categorization (All 207 Cases)';
          }, 3000);
          alert('✅ AI Categorization complete!\\n\\nClick Refresh to see results.');
        })
        .withFailureHandler(function(error) {
          btn.disabled = false;
          btn.textContent = mode === 'specific' ? '🚀 Run AI Categorization (Specific)' : '🚀 Run AI Categorization (All 207 Cases)';
          alert('❌ Error: ' + error.message);
        })
        .runAICategorization(mode, specificInput);
    }`;

  html = html.replace(oldFunc[0], newFunc);

  console.log('✅ Updated runAICategorization() function\n');

  // Add the mode selector toggle script
  const scriptToAdd = `
    <script>
      // Show/hide specific rows input
      document.addEventListener('DOMContentLoaded', function() {
        const modeSelect = document.getElementById('aiCatMode');
        if (modeSelect) {
          modeSelect.addEventListener('change', function() {
            const container = document.getElementById('specificRowsContainer');
            if (container) {
              container.style.display = this.value === 'specific' ? 'block' : 'none';
            }
          });
        }
      });
    </script>`;

  // Add before closing </body> tag
  html = html.replace('</body>', scriptToAdd + '\n  </body>');

  panelFile.source = html;

  console.log('✅ Added toggle script\n');

  console.log('──────────────────────────────────────────────────────────────\n');
  console.log('📝 Updating backend runAICategorization() in Code.gs...\n');

  // Now update the backend function in Code.gs
  const codeFile = project.data.files.find(f => f.name === 'Code');

  if (!codeFile) {
    console.log('❌ Code.gs not found\n');
    return;
  }

  let code = codeFile.source;

  // Find the runAICategorization function in Code.gs
  const backendFuncMatch = code.match(/function runAICategorization\([^)]*\)[\s\S]*?(?=\nfunction [a-zA-Z])/);

  if (!backendFuncMatch) {
    console.log('❌ Backend runAICategorization() not found in Code.gs\n');
    return;
  }

  // Update function signature to accept mode and specificInput
  let updatedBackendFunc = backendFuncMatch[0];

  // Change function signature
  updatedBackendFunc = updatedBackendFunc.replace(
    /function runAICategorization\([^)]*\)/,
    'function runAICategorization(mode, specificInput)'
  );

  // Add specific rows logic at the beginning
  updatedBackendFunc = updatedBackendFunc.replace(
    /(const resultsSheet = getOrCreateSheet\('AI_Categorization_Results'\);)/,
    `// Handle mode parameter (default to 'all' for backward compatibility)
  mode = mode || 'all';

  const resultsSheet = getOrCreateSheet('AI_Categorization_Results');
  const inputSheet = getOrCreateSheet('Input');

  // Parse specific rows if in specific mode
  let targetCaseIDs = [];
  if (mode === 'specific' && specificInput) {
    targetCaseIDs = parseSpecificRowsInput(specificInput, resultsSheet, inputSheet);
    if (targetCaseIDs.length === 0) {
      toast_('No valid rows found', '⚠️ Warning');
      return;
    }
    toast_('Found ' + targetCaseIDs.length + ' cases to categorize', '🎯 Specific Rows');
  }

  $1`
  );

  // Add filtering logic when getting Input data
  updatedBackendFunc = updatedBackendFunc.replace(
    /(const inputData = inputSheet\.getDataRange\(\)\.getValues\(\);)/,
    `$1

  // Filter to specific rows if in specific mode
  let filteredInputData = inputData.slice(2); // Skip headers
  if (mode === 'specific' && targetCaseIDs.length > 0) {
    filteredInputData = filteredInputData.filter(row => targetCaseIDs.includes(row[0]));
    Logger.log('Specific mode: Processing ' + filteredInputData.length + ' cases');
  }`
  );

  // Replace references to inputData.slice(2) with filteredInputData
  updatedBackendFunc = updatedBackendFunc.replace(
    /for \(let i = 0; i < inputData\.slice\(2\)\.length/g,
    'for (let i = 0; i < filteredInputData.length'
  );

  updatedBackendFunc = updatedBackendFunc.replace(
    /const row = inputData\.slice\(2\)\[i\]/g,
    'const row = filteredInputData[i]'
  );

  code = code.replace(backendFuncMatch[0], updatedBackendFunc);

  console.log('✅ Updated backend function signature and logic\n');

  // Add helper function to parse specific rows input
  const helperFunction = `
/**
 * Parse Specific Rows Input
 * Accepts Case IDs or row numbers (comma-separated, ranges with dashes)
 * Returns array of Case_IDs to process
 */
function parseSpecificRowsInput(input, resultsSheet, inputSheet) {
  const parts = input.split(',').map(p => p.trim()).filter(p => p.length > 0);
  const caseIDs = [];

  const resultsData = resultsSheet.getDataRange().getValues();
  const inputData = inputSheet.getDataRange().getValues();

  for (const part of parts) {
    // Check if range (e.g., "7-10")
    if (part.includes('-')) {
      const rangeParts = part.split('-');
      if (rangeParts.length === 2) {
        const start = parseInt(rangeParts[0].trim());
        const end = parseInt(rangeParts[1].trim());

        if (!isNaN(start) && !isNaN(end)) {
          for (let rowNum = start; rowNum <= end; rowNum++) {
            const caseID = getCaseIDFromRow(rowNum, resultsSheet, inputSheet);
            if (caseID) caseIDs.push(caseID);
          }
        }
      }
    }
    // Check if numeric (row number)
    else if (!isNaN(part) && part.length > 0) {
      const rowNum = parseInt(part);
      const caseID = getCaseIDFromRow(rowNum, resultsSheet, inputSheet);
      if (caseID) caseIDs.push(caseID);
    }
    // Otherwise treat as Case_ID
    else {
      // Verify it exists in Input sheet
      const exists = inputData.slice(2).some(row => row[0] === part);
      if (exists) {
        caseIDs.push(part);
      } else {
        Logger.log('Warning: Case_ID not found in Input sheet: ' + part);
      }
    }
  }

  return [...new Set(caseIDs)]; // Remove duplicates
}

/**
 * Get Case_ID from row number (checks both Results and Input sheets)
 */
function getCaseIDFromRow(rowNum, resultsSheet, inputSheet) {
  // Try Results sheet first (row 2 = first data row)
  const resultsData = resultsSheet.getDataRange().getValues();
  if (rowNum >= 2 && rowNum <= resultsData.length) {
    const caseID = resultsData[rowNum - 1][0];
    if (caseID) return caseID;
  }

  // Try Input sheet (row 3 = first data row)
  const inputData = inputSheet.getDataRange().getValues();
  if (rowNum >= 3 && rowNum <= inputData.length) {
    const caseID = inputData[rowNum - 1][0];
    if (caseID) return caseID;
  }

  Logger.log('Warning: Row ' + rowNum + ' not found or has no Case_ID');
  return null;
}
`;

  // Add helper functions before runAICategorization
  const runFuncIndex = code.indexOf('function runAICategorization');
  if (runFuncIndex !== -1) {
    code = code.substring(0, runFuncIndex) + helperFunction + '\n' + code.substring(runFuncIndex);
    console.log('✅ Added helper functions\n');
  }

  codeFile.source = code;

  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('🚀 Deploying to Apps Script...\n');

  await script.projects.updateContent({
    scriptId: scriptId,
    requestBody: { files: project.data.files }
  });

  console.log('✅ Deployment complete!\n');
  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('🎯 Specific Rows Mode Added!\n');
  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('📋 How to Use:\n');
  console.log('  1. Refresh Google Sheet (F5)');
  console.log('  2. Open Categories & Pathways panel');
  console.log('  3. Under 🤖 AI Auto-Categorization, select mode dropdown');
  console.log('  4. Choose "Specific Rows"');
  console.log('  5. Enter Case IDs or row numbers:\n');
  console.log('     • Case IDs: CARD0002,RESP0001,CARD0004');
  console.log('     • Row numbers: 7,13,17,27,29');
  console.log('     • Ranges: 7-10,15,20-25\n');
  console.log('  6. Click "🚀 Run AI Categorization"');
  console.log('  7. Wait for completion');
  console.log('  8. Click "🔄 Refresh" to see results\n');
  console.log('🎯 For the 19 ACLS cases, paste:\n');
  console.log('     CARD0002,RESP0001,CARD0004,CARD0005,CARD0006,CARD0007,MULT0001,CARD0009,CARD0013,CARD0018,CARD0019,RESP0018,CARD0040,CARD0056,CARD0042,CARD0023-2,CARD0025-5,CARD0045-3,CARD0017-2\n');
}

main().catch(console.error);
