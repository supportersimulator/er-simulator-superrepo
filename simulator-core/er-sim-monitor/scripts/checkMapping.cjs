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

async function checkMapping() {
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
    console.log('🗺️  CHECKING: getAccronymMapping() Function');
    console.log('═══════════════════════════════════════════════════════════════\n');

    let inFunction = false;
    let functionContent = [];
    let startLine = 0;

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('function getAccronymMapping')) {
        inFunction = true;
        startLine = i;
        console.log('Found getAccronymMapping at line ' + (i + 1) + '\n');
      }

      if (inFunction) {
        functionContent.push(`${(i+1).toString().padStart(4)}: ${lines[i]}`);

        // End of function
        if (lines[i].trim() === '}' && i > startLine + 5) {
          let nextNonEmpty = '';
          for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
            if (lines[j].trim()) {
              nextNonEmpty = lines[j].trim();
              break;
            }
          }

          if (nextNonEmpty.startsWith('function') || nextNonEmpty.startsWith('//') || nextNonEmpty === '') {
            break;
          }
        }
      }
    }

    console.log('Function code:');
    console.log('─'.repeat(63));
    functionContent.forEach(line => console.log(line));
    console.log('─'.repeat(63));

    console.log('\n\n═══════════════════════════════════════════════════════════════');
    console.log('🔍 ANALYSIS: What does the mapping return?');
    console.log('═══════════════════════════════════════════════════════════════\n');

    // Analyze what column it reads from
    const funcCode = functionContent.join('\n');

    if (funcCode.includes('[0]') && funcCode.includes('[1]')) {
      console.log('The function creates a mapping object like this:');
      console.log('  mapping[acronym] = fullName\n');
      console.log('Example:');
      console.log('  mapping["CP"] = "Chest Pain"');
      console.log('  mapping["SOB"] = "Shortness of Breath"\n');
    }

    // Check which columns it reads
    const columnMatches = funcCode.match(/row\[(\d+)\]/g);
    if (columnMatches) {
      console.log('Reads from sheet columns:');
      columnMatches.forEach(match => {
        const idx = match.match(/\d+/)[0];
        console.log(`  row[${idx}] (Column ${String.fromCharCode(65 + parseInt(idx))})`);
      });
    }

    // Check sheet name
    const sheetMatch = funcCode.match(/getSheetByName\(['"]([^'"]+)['"]\)/);
    if (sheetMatch) {
      console.log(`\nReads from sheet: "${sheetMatch[1]}"`);
    }

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('💡 KEY QUESTION');
    console.log('═══════════════════════════════════════════════════════════════\n');

    console.log('The mapping sheet should have:');
    console.log('  Column A: Acronyms (CP, SOB, ABD, ...)');
    console.log('  Column B: Full Names (Chest Pain, Shortness of Breath, ...)\n');

    console.log('If Column B has acronyms instead of full names, that would explain');
    console.log('why Column M is getting acronyms even with the fallback!\n');

    console.log('🔧 ACTION NEEDED:');
    console.log('Check your "accronym_symptom_system_mapping" sheet.');
    console.log('Verify that it has FULL NAMES in the symptom name column,');
    console.log('NOT acronyms.\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkMapping();
