#!/usr/bin/env node

/**
 * DELETE OLD/DUPLICATE APPS SCRIPT PROJECTS
 * Safely removes projects #3-6, keeping only the active ones
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
const readline = require('readline');

console.log('\n🗑️  DELETE OLD/DUPLICATE APPS SCRIPT PROJECTS\n');
console.log('═══════════════════════════════════════════════════════════════\n');

const PROJECTS_TO_DELETE = [
  {
    id: '1bwLs70zTwQsJxtAqA_yNJfyANjAW5x39YEY0VJhFPMamgDwb100qtqJD',
    name: 'TEST Menu Script (Bound) #2',
    reason: 'Empty duplicate (0 files)'
  },
  {
    id: '1kkPZU3GsCCuu5IhTEOufmDT1Cb2rSQVB3Y3u1DPf87yoSV4WVtoNvd6i',
    name: 'TEST_Feature_Based_Code #1',
    reason: 'Old experimental version, superseded by active project'
  },
  {
    id: '1KBkujOTXGDmmhWOFm-ifxoMjXM5pRwwM5FpFBtPWK8eoE99fr4lla1OE',
    name: 'TEST_Feature_Based_Code #2',
    reason: 'Old experimental version'
  },
  {
    id: '1INZy2-kQNEfEWEipSQ_WCvrvEhGgAeW4G4TM61W2ajNp_63G39KLPm4Y',
    name: 'TEST_Feature_Based_Code #3',
    reason: 'Duplicate of #2'
  }
];

const PROJECTS_TO_KEEP = [
  {
    id: '1orJ__UUViG-gdSOHXt2VSGzo--ASib9XdVLVCApccKujWnqTuxq7wHIw',
    name: 'GPT Formatter',
    reason: 'Original main project'
  },
  {
    id: '1HIw4Ok4G88YzHsECb5e_GvJH9XYefEY59pHXalFstiddLciyHXC06zNf',
    name: 'TEST Menu Script (Bound) #1',
    reason: 'Active working test environment (updated today)'
  }
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

async function deleteProjects() {
  try {
    const auth = await authorize();
    const drive = google.drive({ version: 'v3', auth });

    console.log('✅ PROJECTS THAT WILL BE KEPT:\n');
    PROJECTS_TO_KEEP.forEach((proj, index) => {
      console.log((index + 1) + '. ' + proj.name);
      console.log('   ID: ' + proj.id);
      console.log('   Reason: ' + proj.reason);
      console.log('');
    });

    console.log('═══════════════════════════════════════════════════════════════\n');

    console.log('❌ PROJECTS THAT WILL BE DELETED:\n');
    PROJECTS_TO_DELETE.forEach((proj, index) => {
      console.log((index + 1) + '. ' + proj.name);
      console.log('   ID: ' + proj.id);
      console.log('   Reason: ' + proj.reason);
      console.log('');
    });

    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('⚠️  IMPORTANT NOTES:\n');
    console.log('   • All projects have been backed up to Google Drive');
    console.log('   • Backup folder: https://drive.google.com/drive/folders/13WO4iP-iaNFZH8n1pJlCsRPjfjjqSt-I');
    console.log('   • Local backup: /Users/aarontjomsland/er-sim-monitor/backups/all-projects-2025-11-06/');
    console.log('   • Deleted projects can be restored from Drive trash within 30 days');
    console.log('');
    console.log('═══════════════════════════════════════════════════════════════\n');

    const answer = await askConfirmation('Are you sure you want to delete these 4 projects? (yes/no): ');

    if (answer !== 'yes' && answer !== 'y') {
      console.log('\n❌ Deletion cancelled. No changes made.\n');
      process.exit(0);
    }

    console.log('\n🗑️  Proceeding with deletion...\n');

    const deletionResults = [];

    for (const proj of PROJECTS_TO_DELETE) {
      console.log('Deleting: ' + proj.name);
      console.log('   ID: ' + proj.id);
      
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
        console.log('   ❌ ERROR: ' + error.message);
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

    console.log('✅ Successfully deleted: ' + successful.length + ' projects');
    successful.forEach(r => {
      console.log('   • ' + r.name);
    });

    if (failed.length > 0) {
      console.log('\n❌ Failed to delete: ' + failed.length + ' projects');
      failed.forEach(r => {
        console.log('   • ' + r.name);
        console.log('     Error: ' + r.error);
      });
    }

    console.log('\n═══════════════════════════════════════════════════════════════\n');

    if (successful.length === PROJECTS_TO_DELETE.length) {
      console.log('✅ ALL OLD PROJECTS DELETED SUCCESSFULLY!\n');
      console.log('You should now only see 2 projects in Apps Script:\n');
      console.log('   1. GPT Formatter (original main project)');
      console.log('   2. TEST Menu Script (Bound) (active test environment)\n');
      console.log('Refresh https://script.google.com/home to see the updated list.\n');
    } else {
      console.log('⚠️  PARTIAL SUCCESS\n');
      console.log('Some projects could not be deleted. Check the errors above.\n');
    }

    console.log('═══════════════════════════════════════════════════════════════\n');

    // Save deletion log
    const logContent = '═══════════════════════════════════════════════════════════════\n' +
      'PROJECT DELETION LOG\n' +
      'Date: ' + new Date().toLocaleString() + '\n' +
      '═══════════════════════════════════════════════════════════════\n\n' +
      'DELETED PROJECTS:\n\n' +
      deletionResults.map((r, i) => {
        return (i + 1) + '. ' + r.name + '\n' +
          '   ID: ' + r.id + '\n' +
          '   Status: ' + r.status.toUpperCase() + '\n' +
          (r.error ? '   Error: ' + r.error + '\n' : '') +
          '\n';
      }).join('') +
      '═══════════════════════════════════════════════════════════════\n';

    const logPath = path.join(__dirname, '../backups/all-projects-2025-11-06/DELETION_LOG.txt');
    fs.writeFileSync(logPath, logContent, 'utf8');
    console.log('📄 Deletion log saved: ' + logPath + '\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('   Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

deleteProjects();
