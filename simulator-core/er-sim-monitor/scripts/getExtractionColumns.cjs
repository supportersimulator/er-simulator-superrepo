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
    token.secret
  );

  oauth2Client.setCredentials({
    access_token: token.access_token,
    refresh_token: token.refresh_token,
    token_type: token.token_type,
    expiry_date: token.expiry_date
  });

  return oauth2Client;
}

async function getExtractionColumns() {
  try {
    console.log('🔑 Authenticating with Apps Script API...');
    const auth = getOAuth2Client();
    const script = google.script({ version: 'v1', auth });

    console.log('📥 Fetching code...\n');
    const response = await script.projects.getContent({
      scriptId: SCRIPT_ID
    });

    const files = response.data.files;
    const targetFile = files.find(f => f.name === 'Ultimate_Categorization_Tool_Complete');

    if (!targetFile) {
      console.log('❌ File not found');
      return;
    }

    const lines = targetFile.source.split('\n');

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📊 CURRENT EXTRACTION FUNCTION - COLUMNS BEING READ');
    console.log('═══════════════════════════════════════════════════════════════\n');

    // Find extractCasesForCategorization function
    let inFunction = false;
    let extractionCode = [];

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('function extractCasesForCategorization')) {
        inFunction = true;
        console.log('Found extractCasesForCategorization at line ' + (i + 1) + '\n');
      }

      if (inFunction) {
        extractionCode.push({ lineNum: i + 1, code: lines[i] });

        // Look for cases.push
        if (lines[i].includes('cases.push({')) {
          console.log('Found case extraction starting at line ' + (i + 1) + ':\n');

          // Print the object being pushed
          let j = i;
          while (j < lines.length && !lines[j].includes('});')) {
            console.log(`${(j+1).toString().padStart(4)}: ${lines[j]}`);
            j++;
          }
          console.log(`${(j+1).toString().padStart(4)}: ${lines[j]}`); // Print closing });

          break;
        }
      }
    }

    console.log('\n\n═══════════════════════════════════════════════════════════════');
    console.log('📋 COLUMN MAPPING (Based on Current Code)');
    console.log('═══════════════════════════════════════════════════════════════\n');

    const colLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

    console.log('Currently reading from Master sheet:');
    console.log('  row[0]  = Column A  → caseID');
    console.log('  row[1]  = Column B  → ??? (not currently read)');
    console.log('  row[2]  = Column C  → ??? (not currently read)');
    console.log('  row[4]  = Column E  → chiefComplaint');
    console.log('  row[5]  = Column F  → presentation');
    console.log('  row[6]  = Column G  → diagnosis');
    console.log('  row[8]  = Column I  → legacyCaseID');
    console.log('  row[17] = Column R  → currentSymptom');
    console.log('  row[18] = Column S  → currentSystem\n');

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🎯 PROPOSED CHANGES');
    console.log('═══════════════════════════════════════════════════════════════\n');

    console.log('We want to ADD:');
    console.log('  row[1]  = Column B  → sparkTitle (Case_Organization_Spark_Title)');
    console.log('  row[2]  = Column C  → revealTitle (Case_Organization_Reveal_Title)\n');

    console.log('These will be added to the caseData object and sent to ChatGPT');
    console.log('to provide better context for categorization.\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Details:', error.response.data);
    }
  }
}

getExtractionColumns();
