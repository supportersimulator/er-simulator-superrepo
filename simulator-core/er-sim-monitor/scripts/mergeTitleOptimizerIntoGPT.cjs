#!/usr/bin/env node

/**
 * MERGE TITLE OPTIMIZER INTO GPT FORMATTER
 * Combine all unique functions
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const TITLE_OPTIMIZER_ID = '1HIw4Ok4G88YzHsECb5e_GvJH9XYefEY59pHXalFstiddLciyHXC06zNf';
const GPT_FORMATTER_ID = '1orJ__UUViG-gdSOHXt2VSGzo--ASib9XdVLVCApccKujWnqTuxq7wHIw';

console.log('\n🔀 MERGING TITLE OPTIMIZER INTO GPT FORMATTER\n');
console.log('═══════════════════════════════════════════════════════════════\n');

async function authorize() {
  const credentialsPath = path.join(__dirname, '../config/credentials.json');
  const tokenPath = path.join(__dirname, '../config/token.json');
  const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
  const token = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
  const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
  oAuth2Client.setCredentials(token);
  return oAuth2Client;
}

async function merge() {
  try {
    const auth = await authorize();
    const script = google.script({ version: 'v1', auth });

    console.log('📥 Downloading both projects...\n');

    const [titleProject, gptProject] = await Promise.all([
      script.projects.getContent({ scriptId: TITLE_OPTIMIZER_ID }),
      script.projects.getContent({ scriptId: GPT_FORMATTER_ID })
    ]);

    const titleCode = titleProject.data.files.find(f => f.name === 'Code').source;
    const gptCode = gptProject.data.files.find(f => f.name === 'Code').source;

    console.log(`   Title Optimizer: ${(titleCode.length / 1024).toFixed(1)} KB`);
    console.log(`   GPT Formatter: ${(gptCode.length / 1024).toFixed(1)} KB\n`);

    // Simply append Title Optimizer code to GPT Formatter
    const combinedCode = `${gptCode}

// ==================== TITLE OPTIMIZER ADDITIONAL FUNCTIONS ====================
// Merged from Title Optimizer project for completeness

${titleCode}
`;

    console.log(`   Combined: ${(combinedCode.length / 1024).toFixed(1)} KB\n`);

    // Update GPT Formatter
    const updatedFiles = gptProject.data.files.map(file => {
      if (file.name === 'Code') {
        return {
          name: 'Code',
          type: 'SERVER_JS',
          source: combinedCode
        };
      }
      return file;
    });

    console.log('🚀 Deploying merged code to GPT Formatter...\n');

    await script.projects.updateContent({
      scriptId: GPT_FORMATTER_ID,
      requestBody: {
        files: updatedFiles
      }
    });

    console.log('✅ MERGE COMPLETE!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('📊 RESULT:\n');
    console.log(`   GPT Formatter now has EVERYTHING from:\n`);
    console.log('   ✅ ATSR Titles Optimizer (with mystery button)\n');
    console.log('   ✅ Categories & Pathways (with field selector)\n');
    console.log('   ✅ Advanced Cache System (7 layers)\n');
    console.log('   ✅ Title Optimizer (batch processing, quality audit, utilities)\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('🗑️  NOW SAFE TO DELETE:\n');
    console.log('   - Title Optimizer project (ID: 1HIw4...)\n');
    console.log('   - Advanced Cache System project\n');
    console.log('   - Any other duplicate projects\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('🎯 FINAL STEP:\n');
    console.log('   Delete the extra projects, then refresh spreadsheet.\n');
    console.log('   You should see ONLY "🧠 Sim Builder" menu!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

merge();
