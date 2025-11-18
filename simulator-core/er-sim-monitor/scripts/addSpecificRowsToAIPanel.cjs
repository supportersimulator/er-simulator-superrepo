/**
 * Add Specific Rows Mode to AI Categorization Panel
 *
 * Adds a dropdown and input field to allow re-categorizing specific cases
 * instead of running all 207 cases.
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

  // Find the AI Categorization panel
  let panelFile = null;

  for (const file of project.data.files) {
    if (file.source.includes('Categories & Pathways') &&
        file.source.includes('AI Auto-Categorization')) {
      console.log('✅ Found panel: ' + file.name + '.gs\n');
      panelFile = file;
      break;
    }
  }

  if (!panelFile) {
    console.log('❌ AI Categorization panel not found\n');
    return;
  }

  let html = panelFile.source;

  // Check if already has specific rows
  if (html.includes('Specific Rows') || html.includes('specificRowsInput')) {
    console.log('✅ Specific Rows mode already exists!\n');
    return;
  }

  console.log('📝 Adding Specific Rows UI components...\n');

  // Find the AI Auto-Categorization section header
  const aiSectionMatch = html.match(/(🤖 AI Auto-Categorization<\/h4>)/);

  if (!aiSectionMatch) {
    console.log('❌ Could not find AI Auto-Categorization section\n');
    return;
  }

  // Add mode selector and input AFTER the header
  const newUI = `
🤖 AI Auto-Categorization</h4>

      <!-- Mode Selector -->
      <div style="margin-bottom: 15px; padding: 10px; background: #f5f5f5; border-radius: 4px;">
        <label style="font-weight: bold; display: block; margin-bottom: 8px;">
          📋 Categorization Mode:
        </label>
        <select id="aiCatMode" style="width: 100%; padding: 8px; margin-bottom: 10px; border: 1px solid #ddd; border-radius: 4px;">
          <option value="all">All Cases (207 total)</option>
          <option value="specific">Specific Rows (comma-separated)</option>
        </select>

        <div id="specificRowsContainer" style="display: none;">
          <label style="font-weight: bold; display: block; margin-bottom: 5px;">
            Enter Case IDs or Row Numbers:
          </label>
          <input
            type="text"
            id="specificRowsInput"
            placeholder="e.g., CARD0002,RESP0001 or 7,13,17"
            style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; margin-bottom: 5px;"
          />
          <small style="color: #666; display: block; margin-bottom: 10px;">
            Examples: "CARD0002,CARD0005" or "7,13,17,27" or "7-10,15,20-25"
          </small>
        </div>
      </div>

      <script>
        // Show/hide specific rows input based on mode
        document.getElementById('aiCatMode').addEventListener('change', function() {
          const container = document.getElementById('specificRowsContainer');
          container.style.display = this.value === 'specific' ? 'block' : 'none';
        });
      </script>
`;

  // Replace the section header with header + new UI
  html = html.replace(
    /🤖 AI Auto-Categorization<\/h4>/,
    newUI
  );

  console.log('✅ Added mode selector UI\n');

  console.log('📝 Updating runAICategorization() function...\n');

  // Find and update the runAICategorization function
  const funcMatch = html.match(/function runAICategorization\(\) \{[\s\S]*?\n\s*\}/);

  if (!funcMatch) {
    console.log('❌ Could not find runAICategorization() function\n');
    return;
  }

  const newFunction = `function runAICategorization() {
        const mode = document.getElementById('aiCatMode').value;
        const specificInput = document.getElementById('specificRowsInput').value.trim();

        if (mode === 'specific' && !specificInput) {
          alert('⚠️ Please enter Case IDs or row numbers for Specific Rows mode');
          return;
        }

        const button = event.target;
        button.disabled = true;
        button.textContent = mode === 'specific' ? '🔄 Categorizing Specific Rows...' : '🔄 Categorizing All Cases...';

        google.script.run
          .withSuccessHandler(function(result) {
            button.disabled = false;
            button.textContent = mode === 'specific' ? '✅ Specific Rows Complete!' : '✅ All Cases Complete!';
            setTimeout(() => {
              button.textContent = '🚀 Run AI Categorization';
            }, 3000);

            alert('✅ Categorization complete!\\n\\n' +
                  'Processed: ' + result.processed + ' cases\\n' +
                  'Success: ' + result.success + '\\n' +
                  'Errors: ' + result.errors + '\\n\\n' +
                  'Click Refresh to see results.');
          })
          .withFailureHandler(function(error) {
            button.disabled = false;
            button.textContent = '🚀 Run AI Categorization';
            alert('❌ Error: ' + error.message);
          })
          .runAICategorization(mode, specificInput);
      }`;

  html = html.replace(/function runAICategorization\(\) \{[\s\S]*?\n\s*\}/, newFunction);

  console.log('✅ Updated runAICategorization() function\n');

  console.log('📝 Adding backend support in Code.gs...\n');

  // Now update Code.gs to handle the new parameters
  const codeFile = project.data.files.find(f => f.name === 'Code');

  if (!codeFile) {
    console.log('❌ Code.gs not found\n');
    return;
  }

  let code = codeFile.source;

  // Find the runAICategorization function in Code.gs
  const codeRunFuncMatch = code.match(/function runAICategorization\([^)]*\)[\s\S]*?(?=\nfunction [a-zA-Z])/);

  if (!codeRunFuncMatch) {
    console.log('⚠️  runAICategorization not found in Code.gs (may need manual addition)\n');
  } else {
    // Update the function signature to accept mode and specificInput
    const updatedCodeFunc = codeRunFuncMatch[0].replace(
      /function runAICategorization\([^)]*\)/,
      'function runAICategorization(mode, specificInput)'
    );

    // Add logic to handle specific rows
    const withSpecificLogic = updatedCodeFunc.replace(
      /(const resultsSheet = getOrCreateSheet\('AI_Categorization_Results'\);)/,
      `$1

  // Handle Specific Rows mode
  let rowsToProcess = [];
  if (mode === 'specific' && specificInput) {
    rowsToProcess = parseSpecificRowsInput(specificInput, resultsSheet);
    if (rowsToProcess.length === 0) {
      return { processed: 0, success: 0, errors: 0, message: 'No valid rows found' };
    }
  }`
    );

    code = code.replace(codeRunFuncMatch[0], withSpecificLogic);

    // Add helper function to parse specific rows input
    const helperFunction = `
/**
 * Parse specific rows input (Case IDs or row numbers)
 */
function parseSpecificRowsInput(input, resultsSheet) {
  const parts = input.split(',').map(p => p.trim());
  const rows = [];

  const allData = resultsSheet.getDataRange().getValues();

  for (const part of parts) {
    // Check if range (e.g., "7-10")
    if (part.includes('-')) {
      const [start, end] = part.split('-').map(n => parseInt(n.trim()));
      for (let i = start; i <= end; i++) {
        rows.push(i);
      }
    }
    // Check if numeric (row number)
    else if (!isNaN(part)) {
      rows.push(parseInt(part));
    }
    // Otherwise treat as Case_ID
    else {
      const rowIdx = allData.findIndex((row, idx) => idx > 0 && row[0] === part);
      if (rowIdx !== -1) {
        rows.push(rowIdx + 1); // Convert to 1-based row number
      }
    }
  }

  return [...new Set(rows)].sort((a, b) => a - b); // Remove duplicates and sort
}
`;

    // Add helper function before runAICategorization
    const runFuncIdx = code.indexOf('function runAICategorization');
    if (runFuncIdx !== -1) {
      code = code.substring(0, runFuncIdx) + helperFunction + '\n' + code.substring(runFuncIdx);
    }

    console.log('✅ Added backend support to Code.gs\n');
  }

  // Update both files
  panelFile.source = html;
  codeFile.source = code;

  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('🚀 Deploying changes...\n');

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
  console.log('  3. Select "Specific Rows" from dropdown');
  console.log('  4. Enter Case IDs or row numbers:\n');
  console.log('     Examples:');
  console.log('       • CARD0002,RESP0001,CARD0004');
  console.log('       • 7,13,17,27,29');
  console.log('       • 7-10,15,20-25\n');
  console.log('  5. Click "🚀 Run AI Categorization"');
  console.log('  6. Wait for completion');
  console.log('  7. Click "🔄 Refresh" to see results\n');
  console.log('🎯 For the 19 ACLS cases, use:\n');
  console.log('     CARD0002,RESP0001,CARD0004,CARD0005,CARD0006,CARD0007,MULT0001,CARD0009,CARD0013,CARD0018,CARD0019,RESP0018,CARD0040,CARD0056,CARD0042,CARD0023-2,CARD0025-5,CARD0045-3,CARD0017-2\n');
}

main().catch(console.error);
