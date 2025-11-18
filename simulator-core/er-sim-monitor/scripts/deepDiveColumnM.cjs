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

async function deepDiveColumnM() {
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

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🔍 DEEP DIVE: WHERE IS COLUMN M WRITTEN?');
    console.log('═══════════════════════════════════════════════════════════════\n');

    // Find ALL places where setValues is called with 15 columns
    let foundWriteOperations = [];

    for (let i = 0; i < lines.length; i++) {
      // Look for any setValues operation with 15 columns
      if (lines[i].includes('setValues') && lines[i].includes('1, 15')) {
        foundWriteOperations.push(i);
      }
    }

    console.log(`Found ${foundWriteOperations.length} write operation(s) with 15 columns:\n`);

    foundWriteOperations.forEach((lineNum, index) => {
      console.log(`\n${'='.repeat(63)}`);
      console.log(`WRITE OPERATION #${index + 1} at line ${lineNum + 1}`);
      console.log('='.repeat(63));

      // Print context
      console.log('\nContext (10 lines before):');
      for (let i = Math.max(0, lineNum - 10); i < lineNum; i++) {
        console.log(`${(i+1).toString().padStart(4)}: ${lines[i]}`);
      }

      console.log('\n>>> THE WRITE LINE:');
      console.log(`${(lineNum+1).toString().padStart(4)}: ${lines[lineNum]}`);

      // Find and print the array being written
      console.log('\nArray being written:');
      let j = lineNum + 1;
      let depth = 0;
      let arrayLines = [];

      while (j < lines.length) {
        let line = lines[j];
        arrayLines.push(line);

        if (line.includes('[[')) depth++;
        if (line.includes(']]')) {
          depth--;
          if (depth === 0) break;
        }
        j++;
      }

      // Parse and display each column
      let colIndex = 0;
      const colLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O'];

      arrayLines.forEach(line => {
        let trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('//') && trimmed !== '[[' && !trimmed.includes(']]')) {
          let varName = trimmed.split(',')[0].trim();
          let comment = '';
          if (trimmed.includes('//')) {
            comment = trimmed.substring(trimmed.indexOf('//')).trim();
          }

          if (varName && colIndex < 15) {
            let highlight = colIndex === 12 ? ' ⭐⭐⭐' : '';
            console.log(`  Column ${colLabels[colIndex]}: ${varName.padEnd(30)} ${comment}${highlight}`);

            // Extra detail for Column M
            if (colIndex === 12) {
              console.log(`  ↑ THIS IS COLUMN M - Currently writes: ${varName}`);
            }
            colIndex++;
          }
        }
      });
    });

    console.log('\n\n═══════════════════════════════════════════════════════════════');
    console.log('🔍 CHECKING: What is suggestedSymptomName set to?');
    console.log('═══════════════════════════════════════════════════════════════\n');

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('const suggestedSymptomName')) {
        console.log(`Line ${i+1}: ${lines[i].trim()}`);
        console.log('\nThis variable is used for Column M.');
        console.log('It should use cat.symptomName (full name) with mapping fallback.\n');
      }
    }

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🔍 CHECKING: Is there a DIFFERENT writeCategorizationResults?');
    console.log('═══════════════════════════════════════════════════════════════\n');

    let functionDefs = [];
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('function writeCategorizationResults')) {
        functionDefs.push(i);
      }
    }

    console.log(`Found ${functionDefs.length} definition(s) of writeCategorizationResults:\n`);
    functionDefs.forEach(lineNum => {
      console.log(`Line ${lineNum + 1}: ${lines[lineNum].trim()}`);
    });

    if (functionDefs.length > 1) {
      console.log('\n⚠️  WARNING: Multiple definitions found!');
      console.log('The LAST definition in the file will be used.');
      console.log('Make sure the fix is in the LAST one.\n');
    }

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('💡 DIAGNOSTIC SUMMARY');
    console.log('═══════════════════════════════════════════════════════════════\n');

    // Check the specific line 1534
    if (lines[1533]) {
      console.log('Line 1534 (Column M assignment):');
      console.log(lines[1533].trim());

      if (lines[1533].includes('suggestedSymptomName')) {
        console.log('\n✅ Code is CORRECT - Column M uses suggestedSymptomName\n');
      } else if (lines[1533].includes('suggestedSymptom,')) {
        console.log('\n❌ Code is WRONG - Column M uses suggestedSymptom (the code)\n');
      }
    }

    // Save full function for user review
    console.log('📝 Saving full writeCategorizationResults function to file for review...\n');

    let inFunction = false;
    let functionContent = [];
    let startLine = 0;

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('function writeCategorizationResults')) {
        inFunction = true;
        startLine = i + 1;
        functionContent = [];
      }

      if (inFunction) {
        functionContent.push(`${(i+1).toString().padStart(4)}: ${lines[i]}`);

        // End of function
        if (lines[i].trim() === '}' && i > startLine + 10) {
          // Check if next non-empty line is another function
          let nextNonEmpty = '';
          for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
            if (lines[j].trim()) {
              nextNonEmpty = lines[j].trim();
              break;
            }
          }

          if (nextNonEmpty.startsWith('function') || nextNonEmpty.startsWith('//')) {
            break;
          }
        }
      }
    }

    const outputPath = path.join(__dirname, '..', 'LIVE_writeCategorizationResults_Function.txt');
    fs.writeFileSync(outputPath, functionContent.join('\n'), 'utf8');
    console.log(`✅ Saved to: ${outputPath}\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

deepDiveColumnM();
