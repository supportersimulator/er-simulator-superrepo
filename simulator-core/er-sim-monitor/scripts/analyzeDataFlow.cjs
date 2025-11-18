const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const SCRIPT_ID = '12NihbVaaAIyRMCtzZ-aGjJ71CdL-HDjhmjxiD_S_EgIOuDOtrUH6M1l2';

function getOAuth2Client() {
  const clasprcPath = path.join(process.env.HOME, '.clasprc.json');
  const credentials = JSON.parse(fs.readFileSync(clasprcPath, 'utf8'));
  const token = credentials.tokens.default;

  const oauth2Client = new google.auth.OAuth2(
    token.client_id,
    token.client_secret
  );

  oauth2Client.setCredentials({
    access_token: token.access_token,
    refresh_token: token.refresh_token,
    token_type: token.token_type,
    expiry_date: token.expiry_date
  });

  return oauth2Client;
}

async function analyzeDataFlow() {
  try {
    console.log('🔑 Authenticating with Apps Script API...');
    const auth = getOAuth2Client();
    const script = google.script({ version: 'v1', auth });

    console.log('📥 Fetching live code...\n');
    const response = await script.projects.getContent({
      scriptId: SCRIPT_ID
    });

    const files = response.data.files;
    const targetFile = files.find(f =>
      f.name === 'Ultimate_Categorization_Tool_Complete'
    );

    if (!targetFile) {
      console.log('❌ File not found');
      return;
    }

    const code = targetFile.source;
    const lines = code.split('\n');

    // Extract key sections
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📊 COMPLETE DATA FLOW ANALYSIS');
    console.log('═══════════════════════════════════════════════════════════════\n');

    // 1. Find AI prompt structure
    console.log('🤖 STEP 1: WHAT CHATGPT IS ASKED TO RETURN\n');
    console.log('The prompt asks ChatGPT to return a JSON array with this structure:');
    console.log('───────────────────────────────────────────────────────────────');

    let inPrompt = false;
    let promptLines = [];
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('buildCategorizationPrompt')) {
        inPrompt = true;
      }
      if (inPrompt && lines[i].includes('symptom\":') && lines[i].includes('symptom code')) {
        promptLines.push(lines[i].trim());
      }
      if (inPrompt && lines[i].includes('symptomName\":')) {
        promptLines.push(lines[i].trim());
      }
      if (inPrompt && lines[i].includes('system\":') && lines[i].includes('from valid list')) {
        promptLines.push(lines[i].trim());
      }
      if (inPrompt && lines[i].includes('reasoning\":')) {
        promptLines.push(lines[i].trim());
        break;
      }
    }

    console.log('Expected JSON structure from ChatGPT:');
    console.log('[');
    console.log('  {');
    promptLines.forEach(line => console.log('    ' + line.replace('prompt += ', '').replace(/'/g, '').replace(/\\n/g, '')));
    console.log('  }');
    console.log(']\n');

    // 2. Find how response is parsed
    console.log('📦 STEP 2: HOW CHATGPT RESPONSE IS PARSED\n');
    console.log('After ChatGPT responds, the code extracts data like this:');
    console.log('───────────────────────────────────────────────────────────────');

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('const cat = categorizations[idx]')) {
        console.log('Line ' + (i+1) + ': ' + lines[i].trim());
        console.log('Line ' + (i+2) + ': ' + lines[i+1].trim());
        console.log('Line ' + (i+3) + ': ' + lines[i+2].trim());
        console.log('Line ' + (i+4) + ': ' + lines[i+3].trim());
        console.log('\nWhat this means:');
        console.log('  cat.symptom        → ChatGPT\'s "symptom" field (e.g., "CP", "SOB", "ABD")');
        console.log('  cat.symptomName    → ChatGPT\'s "symptomName" field (e.g., "Chest Pain")');
        console.log('  cat.system         → ChatGPT\'s "system" field (e.g., "Cardiovascular")');
        console.log('  cat.reasoning      → ChatGPT\'s "reasoning" field\n');
        break;
      }
    }

    // 3. Find the mapping fallback
    console.log('🗺️  STEP 3: FALLBACK WHEN CHATGPT DOESN\'T PROVIDE symptomName\n');
    console.log('───────────────────────────────────────────────────────────────');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('const mapping = getAccronymMapping()')) {
        console.log('Line ' + (i+1) + ': ' + lines[i].trim());
        console.log('\nThen later:');
        for (let j = i; j < i + 20; j++) {
          if (lines[j].includes('suggestedSymptomName =') && lines[j].includes('mapping')) {
            console.log('Line ' + (j+1) + ': ' + lines[j].trim());
            console.log('\nWhat this means:');
            console.log('  1. Try to use cat.symptomName (from ChatGPT)');
            console.log('  2. If missing, look up cat.symptom in the mapping sheet');
            console.log('  3. If still missing, use empty string\n');
            break;
          }
        }
        break;
      }
    }

    // 4. Find the column write structure
    console.log('📝 STEP 4: HOW DATA IS WRITTEN TO COLUMNS A-O\n');
    console.log('───────────────────────────────────────────────────────────────');

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('resultsSheet.getRange(nextRow, 1, 1, 15).setValues')) {
        console.log('Found at line ' + (i+1) + ':\n');

        // Print the array structure
        let j = i + 1;
        let colIndex = 0;
        const colLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O'];

        while (j < lines.length && !lines[j].includes(']]')) {
          let line = lines[j].trim();
          if (line && !line.startsWith('//') && line !== '[[') {
            // Extract variable name and comment
            let varName = line.split(',')[0].trim();
            let comment = '';
            if (line.includes('//')) {
              comment = line.substring(line.indexOf('//')).trim();
            }

            if (varName && colIndex < 15) {
              console.log(`Column ${colLabels[colIndex]}: ${varName.padEnd(25)} ${comment}`);
              colIndex++;
            }
          }
          j++;
        }
        break;
      }
    }

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('🎯 COMPLETE DATA FLOW SUMMARY');
    console.log('═══════════════════════════════════════════════════════════════\n');

    console.log('SOURCE: Master Sheet Extraction (caseData object)');
    console.log('  ├─ caseData.caseID          → Column A (Case ID)');
    console.log('  ├─ caseData.legacyCaseID    → Column B (Legacy Case ID)');
    console.log('  ├─ caseData.rowIndex        → Column C (Row number in Master)');
    console.log('  ├─ caseData.currentSymptom  → Column D (Existing symptom from Master R)');
    console.log('  └─ caseData.currentSystem   → Column E (Existing system from Master S)\n');

    console.log('SOURCE: ChatGPT Response (cat object)');
    console.log('  ├─ cat.symptom              → Column F (AI suggested symptom CODE)');
    console.log('  ├─ cat.symptomName          → Column G (AI suggested symptom NAME)');
    console.log('  │                              OR mapping[cat.symptom] if missing');
    console.log('  ├─ cat.system               → Column H (AI suggested system)');
    console.log('  └─ cat.reasoning            → Column I (AI explanation)\n');

    console.log('SOURCE: Derived/Static Values');
    console.log('  ├─ "medium"                 → Column J (Confidence - hardcoded)');
    console.log('  ├─ status variable          → Column K (new/match/conflict)');
    console.log('  └─ empty string             → Column L (User Decision - for manual input)\n');

    console.log('SOURCE: Final Columns (copied from Suggested)');
    console.log('  ├─ suggestedSymptomName     → Column M (Final Symptom - FULL NAME) ⭐');
    console.log('  ├─ suggestedSystem          → Column N (Final System)');
    console.log('  └─ suggestedSymptomName     → Column O (Final Symptom Name)\n');

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🔍 KEY INSIGHTS');
    console.log('═══════════════════════════════════════════════════════════════\n');

    console.log('1. Column F vs Column M:');
    console.log('   • Column F = cat.symptom (CODE like "CP", "SOB")');
    console.log('   • Column M = suggestedSymptomName (FULL NAME like "Chest Pain")');
    console.log('   • These are DIFFERENT and should have different values!\n');

    console.log('2. Column G (Suggested_Symptom_Name):');
    console.log('   • Comes from cat.symptomName (ChatGPT response)');
    console.log('   • Falls back to mapping[cat.symptom] if ChatGPT omits it');
    console.log('   • This is why it\'s now populated for all rows!\n');

    console.log('3. Column M (Final_Symptom):');
    console.log('   • Should be FULL NAME (after fix)');
    console.log('   • Gets copied to Master sheet Column R when you "Apply to Master"');
    console.log('   • This is the bug you reported - old data has codes, not names\n');

    console.log('4. The "Apply to Master" function:');
    console.log('   • Reads Column M (Final_Symptom) and Column N (Final_System)');
    console.log('   • Writes them to Master sheet columns R and S');
    console.log('   • So Master R should have FULL NAMES after the fix!\n');

    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

analyzeDataFlow();
