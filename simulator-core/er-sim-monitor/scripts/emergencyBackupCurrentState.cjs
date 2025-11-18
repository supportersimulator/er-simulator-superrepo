#!/usr/bin/env node

/**
 * EMERGENCY: Backup what we just deployed + pull MAIN for comparison
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const TEST_SCRIPT_ID = '1HIw4Ok4G88YzHsECb5e_GvJH9XYefEY59pHXalFstiddLciyHXC06zNf';

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

async function emergencyBackup() {
  console.log('\n🚨 EMERGENCY BACKUP - Saving current TEST state\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const auth = await authorize();
  const script = google.script({ version: 'v1', auth });

  try {
    // Pull what we just deployed to TEST
    console.log('📥 Pulling current TEST Code.gs (what we just deployed)...\n');
    const testProject = await script.projects.getContent({ scriptId: TEST_SCRIPT_ID });
    const testCode = testProject.data.files.find(f => f.name === 'Code');

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const backupDir = path.join(__dirname, '../backups/emergency-' + timestamp);
    fs.mkdirSync(backupDir, { recursive: true });

    const testBackupPath = path.join(backupDir, 'TEST_Code_just_deployed.gs');
    fs.writeFileSync(testBackupPath, testCode.source, 'utf8');

    console.log(`✅ Saved TEST Code.gs to: ${testBackupPath}`);
    console.log(`   Size: ${Math.round(testCode.source.length / 1024)} KB\n`);

    // Save metadata
    const metadata = {
      timestamp: new Date().toISOString(),
      action: 'Emergency backup after restoration',
      testScriptId: TEST_SCRIPT_ID,
      testCodeSize: testCode.source.length,
      note: 'This is what was just deployed to TEST. Compare with MAIN if needed.'
    };

    fs.writeFileSync(
      path.join(backupDir, 'README.txt'),
      JSON.stringify(metadata, null, 2),
      'utf8'
    );

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✅ EMERGENCY BACKUP COMPLETE\n');
    console.log(`📁 Backup location: ${backupDir}\n`);
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (e) {
    console.log('❌ Error: ' + e.message + '\n');
    if (e.stack) console.log(e.stack);
  }
}

emergencyBackup().catch(console.error);
