#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
require('dotenv').config();

async function createATSRProject() {
  console.log('🚀 Creating standalone ATSR Apps Script project...\n');

  // Auth setup
  const credentialsPath = path.join(__dirname, '../config/credentials.json');
  const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
  const {client_id, client_secret, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  const tokenPath = path.join(__dirname, '../config/token.json');
  const token = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
  oAuth2Client.setCredentials(token);

  const script = google.script({version: 'v1', auth: oAuth2Client});

  // Create new project
  const createResponse = await script.projects.create({
    requestBody: {
      title: 'ER Sim - ATSR Tool (Standalone)'
    }
  });

  const newScriptId = createResponse.data.scriptId;
  console.log(`✅ Created new Apps Script project`);
  console.log(`   Script ID: ${newScriptId}`);
  console.log(`   URL: https://script.google.com/d/${newScriptId}/edit\n`);

  // Copy entire monolithic code
  const monolithicCode = fs.readFileSync(
    path.join(__dirname, 'Code_ULTIMATE_ATSR.gs'),
    'utf8'
  );

  console.log('📋 Copying full monolithic code (3,880 lines)...');

  await script.projects.updateContent({
    scriptId: newScriptId,
    requestBody: {
      files: [
        {
          name: 'Code',
          type: 'SERVER_JS',
          source: monolithicCode
        },
        {
          name: 'appsscript',
          type: 'JSON',
          source: JSON.stringify({
            timeZone: 'America/Los_Angeles',
            dependencies: {},
            exceptionLogging: 'STACKDRIVER',
            runtimeVersion: 'V8'
          }, null, 2)
        }
      ]
    }
  });

  console.log('✅ Deployed full code to new project\n');

  // Save trimmed version locally for editing
  const trimmedPath = path.join(__dirname, 'Code_ATSR_Trimmed.gs');
  fs.writeFileSync(trimmedPath, monolithicCode);
  console.log(`📝 Created local trimming workspace: Code_ATSR_Trimmed.gs`);

  // Create deployment script
  const deployScript = `#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
require('dotenv').config();

const ATSR_SCRIPT_ID = '${newScriptId}';
const CODE_PATH = path.join(__dirname, 'Code_ATSR_Trimmed.gs');

async function deploy() {
  console.log('🚀 Deploying ATSR Tool (Standalone)...\\n');

  const code = fs.readFileSync(CODE_PATH, 'utf8');
  const lines = code.split('\\n').length;

  console.log(\`📊 Code size: \${lines} lines\`);

  const credentialsPath = path.join(__dirname, '../config/credentials.json');
  const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
  const {client_id, client_secret, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  const tokenPath = path.join(__dirname, '../config/token.json');
  const token = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
  oAuth2Client.setCredentials(token);

  const script = google.script({version: 'v1', auth: oAuth2Client});

  const project = await script.projects.getContent({scriptId: ATSR_SCRIPT_ID});

  const updatedFiles = project.data.files.map(file => {
    if (file.name === 'Code') {
      return { name: file.name, type: file.type, source: code };
    }
    return file;
  });

  await script.projects.updateContent({
    scriptId: ATSR_SCRIPT_ID,
    requestBody: { files: updatedFiles }
  });

  console.log('✅ Deployed successfully!');
  console.log(\`   URL: https://script.google.com/d/\${ATSR_SCRIPT_ID}/edit\\n\`);
}

deploy().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
`;

  fs.writeFileSync(
    path.join(__dirname, 'deployATSR.cjs'),
    deployScript
  );
  fs.chmodSync(path.join(__dirname, 'deployATSR.cjs'), '755');

  console.log('✅ Created deployment script: deployATSR.cjs\n');

  // Create trimming guide
  const guide = `# ATSR Trimming Guide

## Current Status
✅ Standalone ATSR project created
✅ Full monolithic code deployed and working
✅ Local trimming workspace ready

## Script ID
${newScriptId}

## Project URL
https://script.google.com/d/${newScriptId}/edit

## Trimming Workflow

### 1. Test Current State (Should Work)
- Open Google Sheet
- Extensions → Apps Script → Select "ER Sim - ATSR Tool (Standalone)"
- Run \`generateATSR()\` on a row
- Should work perfectly (it's the full code)

### 2. Start Trimming (Edit Code_ATSR_Trimmed.gs)

**Functions to REMOVE (batch processing - ATSR doesn't need these):**
- [ ] processOneInputRow_()
- [ ] validateVitalsFields_()
- [ ] applyClinicalDefaults_()
- [ ] processAllInputRows()
- [ ] Any batch processing UI functions

**Functions to KEEP (ATSR needs these):**
- [x] parseATSRResponse_()
- [x] generateATSR()
- [x] callOpenAI()
- [x] tryParseJSON()
- [x] onOpen() (for menu)

### 3. Deploy & Test After Each Removal
\`\`\`bash
node scripts/deployATSR.cjs
\`\`\`

Then test ATSR in Google Sheet.

### 4. If It Breaks
- Undo the last deletion in Code_ATSR_Trimmed.gs
- That function was needed - keep it
- Continue trimming other functions

### 5. Final State
You'll end up with ~800-1000 lines (down from 3,880)
- All ATSR functionality intact
- All batch processing removed
- Completely independent tool

## Quick Commands

Deploy ATSR:
\`\`\`bash
npm run deploy-atsr
\`\`\`

Check line count:
\`\`\`bash
wc -l scripts/Code_ATSR_Trimmed.gs
\`\`\`
`;

  fs.writeFileSync(
    path.join(__dirname, '../docs/ATSR_TRIMMING_GUIDE.md'),
    guide
  );

  console.log('📖 Created trimming guide: docs/ATSR_TRIMMING_GUIDE.md\n');

  console.log('━'.repeat(60));
  console.log('🎯 NEXT STEPS:\n');
  console.log('1. Open the new project and verify it works:');
  console.log(`   https://script.google.com/d/${newScriptId}/edit\n`);
  console.log('2. Edit Code_ATSR_Trimmed.gs - remove batch functions');
  console.log('3. Deploy: node scripts/deployATSR.cjs');
  console.log('4. Test in Google Sheet');
  console.log('5. Repeat until trimmed to minimum\n');
  console.log('📝 Full guide: docs/ATSR_TRIMMING_GUIDE.md');
  console.log('━'.repeat(60) + '\n');

  // Update .env with new script ID
  const envPath = path.join(__dirname, '../.env');
  let envContent = fs.readFileSync(envPath, 'utf8');
  envContent += `\n# ATSR Standalone Project\nATSR_SCRIPT_ID=${newScriptId}\n`;
  fs.writeFileSync(envPath, envContent);

  console.log('✅ Added ATSR_SCRIPT_ID to .env\n');
}

createATSRProject().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
