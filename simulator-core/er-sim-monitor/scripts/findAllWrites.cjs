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

async function findAllWrites() {
  try {
    console.log('🔑 Authenticating...');
    const auth = getOAuth2Client();
    const script = google.script({ version: 'v1', auth });

    console.log('📥 Fetching all files from project...\n');
    const response = await script.projects.getContent({
      scriptId: SCRIPT_ID
    });

    const files = response.data.files;

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🔍 SEARCHING ALL FILES FOR AI_Categorization_Results WRITES');
    console.log('═══════════════════════════════════════════════════════════════\n');

    console.log(`Total files in project: ${files.length}\n`);

    let foundInFiles = [];

    files.forEach(file => {
      const lines = file.source.split('\n');
      let foundWrites = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Look for writes to AI_Categorization_Results
        if ((line.includes('AI_Categorization_Results') || line.includes('AI_Categorization_Results')) &&
            (line.includes('setValues') || line.includes('setValue'))) {
          foundWrites.push({
            lineNum: i + 1,
            line: line.trim()
          });
        }
      }

      if (foundWrites.length > 0) {
        foundInFiles.push({
          fileName: file.name,
          writes: foundWrites,
          source: lines
        });
      }
    });

    if (foundInFiles.length === 0) {
      console.log('No writes to AI_Categorization_Results found in any file.\n');
      return;
    }

    console.log(`Found writes in ${foundInFiles.length} file(s):\n`);

    foundInFiles.forEach(fileInfo => {
      console.log('━'.repeat(63));
      console.log(`📄 FILE: ${fileInfo.fileName}`);
      console.log('━'.repeat(63));

      fileInfo.writes.forEach(write => {
        console.log(`\nLine ${write.lineNum}: ${write.line}`);

        // Print context
        console.log('\nContext (5 lines before and after):');
        const start = Math.max(0, write.lineNum - 6);
        const end = Math.min(fileInfo.source.length, write.lineNum + 5);

        for (let i = start; i < end; i++) {
          const marker = i === write.lineNum - 1 ? '>>> ' : '    ';
          console.log(`${marker}${(i+1).toString().padStart(4)}: ${fileInfo.source[i]}`);
        }
      });

      console.log('\n');
    });

    // Now specifically check the Ultimate_Categorization_Tool_Complete file
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('🎯 DETAILED CHECK: Ultimate_Categorization_Tool_Complete.gs');
    console.log('═══════════════════════════════════════════════════════════════\n');

    const targetFile = files.find(f => f.name === 'Ultimate_Categorization_Tool_Complete');
    if (!targetFile) {
      console.log('❌ File not found!');
      return;
    }

    const lines = targetFile.source.split('\n');

    // Find the exact line that writes Column M
    console.log('Looking for line 1534 (Column M write):\n');
    if (lines[1533]) {
      console.log(`Line 1534: ${lines[1533]}`);

      if (lines[1533].includes('suggestedSymptomName')) {
        console.log('\n✅ Line 1534 correctly uses suggestedSymptomName');
      } else {
        console.log('\n❌ Line 1534 does NOT use suggestedSymptomName!');
      }
    }

    // Check what suggestedSymptomName is assigned from
    console.log('\n\nLooking for where suggestedSymptomName is assigned:\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('suggestedSymptomName =') ||
          lines[i].includes('const suggestedSymptomName')) {
        console.log(`Line ${i+1}: ${lines[i].trim()}`);
      }
    }

    // Check if there's ANOTHER function that might be called instead
    console.log('\n\nLooking for all functions with "Categorization" in name:\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('function') &&
          lines[i].toLowerCase().includes('categorization')) {
        console.log(`Line ${i+1}: ${lines[i].trim()}`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

findAllWrites();
