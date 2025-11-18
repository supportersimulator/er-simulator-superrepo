#!/usr/bin/env node

/**
 * DELETE PROJECTS MARKED WITH "delete this" PREFIX
 * Based on current project names visible in Apps Script UI
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
const readline = require('readline');

console.log('\n🗑️  DELETE PROJECTS MARKED "delete this"\n');
console.log('═══════════════════════════════════════════════════════════════\n');

const PROJECTS_TO_KEEP_NAMES = [
  'Advanced Cache System',
  'GPT Formatter',
  'Title Optimizer'
];

const PROJECTS_TO_DELETE_PATTERNS = [
  'delete this duplicate TEST_Feature_Based_Code',
  'delete this empty TEST Menu Script (Bound)',
  'delete this redundant ATSR Panel (Isolated)'
];

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

function askConfirmation(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer.toLowerCase());
    });
  });
}

async function findAndDeleteProjects() {
  try {
    const auth = await authorize();
    const drive = google.drive({ version: 'v3', auth });

    console.log('🔍 Searching for Apps Script projects...\n');

    // Search for all Apps Script projects
    const result = await drive.files.list({
      q: "mimeType='application/vnd.google-apps.script' and trashed=false",
      fields: 'files(id, name)',
      pageSize: 100
    });

    if (!result.data.files || result.data.files.length === 0) {
      console.log('❌ No Apps Script projects found!\n');
      process.exit(1);
    }

    console.log(`Found ${result.data.files.length} Apps Script projects:\n`);

    const toKeep = [];
    const toDelete = [];

    result.data.files.forEach(file => {
      if (file.name.startsWith('delete this')) {
        toDelete.push(file);
      } else {
        toKeep.push(file);
      }
    });

    console.log('✅ PROJECTS TO KEEP:\n');
    toKeep.forEach((proj, index) => {
      console.log(`${index + 1}. ${proj.name}`);
      console.log(`   ID: ${proj.id}`);
      console.log('');
    });

    console.log('═══════════════════════════════════════════════════════════════\n');

    console.log('❌ PROJECTS TO DELETE:\n');
    toDelete.forEach((proj, index) => {
      console.log(`${index + 1}. ${proj.name}`);
      console.log(`   ID: ${proj.id}`);
      console.log('');
    });

    if (toDelete.length === 0) {
      console.log('✅ No projects marked "delete this" found. Nothing to delete.\n');
      process.exit(0);
    }

    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('⚠️  IMPORTANT NOTES:\n');
    console.log('   • All projects have been backed up to Google Drive');
    console.log('   • Backup folder: https://drive.google.com/drive/folders/13WO4iP-iaNFZH8n1pJlCsRPjfjjqSt-I');
    console.log('   • Local backup: /Users/aarontjomsland/er-sim-monitor/backups/all-projects-2025-11-06/');
    console.log('   • Deleted projects can be restored from Drive trash within 30 days');
    console.log('');
    console.log('═══════════════════════════════════════════════════════════════\n');

    const answer = await askConfirmation(`Are you sure you want to delete these ${toDelete.length} projects? (yes/no): `);

    if (answer !== 'yes' && answer !== 'y') {
      console.log('\n❌ Deletion cancelled. No changes made.\n');
      process.exit(0);
    }

    console.log('\n🗑️  Proceeding with deletion...\n');

    const deletionResults = [];

    for (const proj of toDelete) {
      console.log(`Deleting: ${proj.name}`);
      console.log(`   ID: ${proj.id}`);

      try {
        await drive.files.delete({
          fileId: proj.id
        });

        console.log('   ✅ Successfully deleted');
        deletionResults.push({
          name: proj.name,
          id: proj.id,
          status: 'deleted',
          error: null
        });

      } catch (error) {
        console.log(`   ❌ ERROR: ${error.message}`);
        deletionResults.push({
          name: proj.name,
          id: proj.id,
          status: 'failed',
          error: error.message
        });
      }

      console.log('');
    }

    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('📊 DELETION SUMMARY:\n');

    const successful = deletionResults.filter(r => r.status === 'deleted');
    const failed = deletionResults.filter(r => r.status === 'failed');

    console.log(`✅ Successfully deleted: ${successful.length} projects\n`);
    successful.forEach(r => {
      console.log(`   • ${r.name}`);
    });

    if (failed.length > 0) {
      console.log(`\n❌ Failed to delete: ${failed.length} projects\n`);
      failed.forEach(r => {
        console.log(`   • ${r.name}`);
        console.log(`     Error: ${r.error}`);
      });
    }

    console.log('\n═══════════════════════════════════════════════════════════════\n');

    if (successful.length === toDelete.length) {
      console.log('✅ ALL MARKED PROJECTS DELETED SUCCESSFULLY!\n');
      console.log('You should now only see 3 projects in Apps Script:\n');
      console.log('   1. Advanced Cache System (Multi-Step Cache Enrichment)');
      console.log('   2. GPT Formatter (original main project)');
      console.log('   3. Title Optimizer (ATSR title generation)\n');
      console.log('Refresh https://script.google.com/home to see the updated list.\n');
    } else {
      console.log('⚠️  PARTIAL SUCCESS\n');
      console.log('Some projects could not be deleted. Check the errors above.\n');
    }

    console.log('═══════════════════════════════════════════════════════════════\n');

    // Save deletion log
    const logContent = `═══════════════════════════════════════════════════════════════
PROJECT DELETION LOG
Date: ${new Date().toLocaleString()}
═══════════════════════════════════════════════════════════════

DELETED PROJECTS:

${deletionResults.map((r, i) => {
  return `${i + 1}. ${r.name}
   ID: ${r.id}
   Status: ${r.status.toUpperCase()}
   ${r.error ? 'Error: ' + r.error : ''}
`;
}).join('\n')}

═══════════════════════════════════════════════════════════════

REMAINING PROJECTS:

${toKeep.map((p, i) => {
  return `${i + 1}. ${p.name}
   ID: ${p.id}
`;
}).join('\n')}

═══════════════════════════════════════════════════════════════
`;

    const logPath = path.join(__dirname, '../backups/all-projects-2025-11-06/DELETION_LOG.txt');
    fs.writeFileSync(logPath, logContent, 'utf8');
    console.log(`📄 Deletion log saved: ${logPath}\n`);

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('   Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

findAndDeleteProjects();
