#!/usr/bin/env node

/**
 * RENAME ISOLATED PANEL PROJECTS
 * Fix project names that were mistakenly prefixed with "delete this"
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

console.log('\n📝 RENAMING ISOLATED PANEL PROJECTS\n');
console.log('═══════════════════════════════════════════════════════════════\n');

const PROJECTS_TO_RENAME = [
  {
    id: '1kkPZU3GsCCuu5IhTEOufmDT1Cb2rSQVB3Y3u1DPf87yoSV4WVtoNvd6i',
    currentName: 'Unknown (will check)',
    newName: 'Pathways & Categories Panel (Isolated)',
    purpose: 'Pathway discovery + categories + cache system'
  },
  {
    id: '1KBkujOTXGDmmhWOFm-ifxoMjXM5pRwwM5FpFBtPWK8eoE99fr4lla1OE',
    currentName: 'Unknown (will check)',
    newName: 'ATSR Panel (Isolated)',
    purpose: 'ATSR title generation tool'
  },
  {
    id: '1INZy2-kQNEfEWEipSQ_WCvrvEhGgAeW4G4TM61W2ajNp_63G39KLPm4Y',
    currentName: 'Unknown (will check)',
    newName: 'Batch Processing Panel (Isolated)',
    purpose: 'Batch row processing tool'
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

async function renameProjects() {
  try {
    const auth = await authorize();
    const drive = google.drive({ version: 'v3', auth });

    console.log('🔍 Checking current project names...\n');

    // First, get current names
    const currentNames = [];
    for (const proj of PROJECTS_TO_RENAME) {
      try {
        const file = await drive.files.get({
          fileId: proj.id,
          fields: 'id, name'
        });

        currentNames.push({
          ...proj,
          currentName: file.data.name
        });

        console.log(`📋 ${file.data.name}`);
        console.log(`   ID: ${proj.id}`);
        console.log(`   Will rename to: ${proj.newName}`);
        console.log(`   Purpose: ${proj.purpose}`);
        console.log('');
      } catch (error) {
        console.log(`⚠️  Could not read project ${proj.id}: ${error.message}\n`);
      }
    }

    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('🚀 RENAMING PROJECTS...\n');

    const results = [];

    for (const proj of currentNames) {
      console.log(`Renaming: ${proj.currentName}`);
      console.log(`   New name: ${proj.newName}`);

      try {
        await drive.files.update({
          fileId: proj.id,
          requestBody: {
            name: proj.newName
          }
        });

        console.log('   ✅ Successfully renamed\n');
        results.push({
          id: proj.id,
          oldName: proj.currentName,
          newName: proj.newName,
          status: 'success'
        });

      } catch (error) {
        console.log(`   ❌ ERROR: ${error.message}\n`);
        results.push({
          id: proj.id,
          oldName: proj.currentName,
          newName: proj.newName,
          status: 'failed',
          error: error.message
        });
      }
    }

    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('📊 RENAME SUMMARY:\n');

    const successful = results.filter(r => r.status === 'success');
    const failed = results.filter(r => r.status === 'failed');

    console.log(`✅ Successfully renamed: ${successful.length} projects\n`);
    successful.forEach(r => {
      console.log(`   • ${r.oldName}`);
      console.log(`     → ${r.newName}`);
      console.log('');
    });

    if (failed.length > 0) {
      console.log(`\n❌ Failed to rename: ${failed.length} projects\n`);
      failed.forEach(r => {
        console.log(`   • ${r.oldName}`);
        console.log(`     Error: ${r.error}`);
        console.log('');
      });
    }

    console.log('═══════════════════════════════════════════════════════════════\n');

    if (successful.length === PROJECTS_TO_RENAME.length) {
      console.log('✅ ALL PROJECTS RENAMED SUCCESSFULLY!\n');
      console.log('Your Apps Script projects now have clear names:\n');
      console.log('   1. GPT Formatter (original main project)');
      console.log('   2. TEST Menu Script (Bound) (integration test)');
      console.log('   3. Pathways & Categories Panel (Isolated)');
      console.log('   4. ATSR Panel (Isolated)');
      console.log('   5. Batch Processing Panel (Isolated)');
      console.log('');
      console.log('Next step: Isolate functions in each panel\n');
    } else {
      console.log('⚠️  PARTIAL SUCCESS\n');
      console.log('Some projects could not be renamed. Check the errors above.\n');
    }

    // Save rename log
    const logContent = `═══════════════════════════════════════════════════════════════
PROJECT RENAME LOG
Date: ${new Date().toLocaleString()}
═══════════════════════════════════════════════════════════════

RENAMED PROJECTS:

${results.map((r, i) => {
  return `${i + 1}. ${r.oldName}
   → ${r.newName}
   ID: ${r.id}
   Status: ${r.status.toUpperCase()}
   ${r.error ? 'Error: ' + r.error : ''}
`;
}).join('\n')}

═══════════════════════════════════════════════════════════════

RECOMMENDED PROJECT STRUCTURE:

1. GPT Formatter
   - Original monolithic reference
   - Keep as-is for baseline comparison

2. TEST Menu Script (Bound)
   - Integration test environment
   - Contains all features working together
   - Has TEST Tools menu

3. Pathways & Categories Panel (Isolated)
   - Pathway discovery system
   - Field selector with AI recommendations
   - Multi-step cache enrichment
   - Pre-cache functionality

4. ATSR Panel (Isolated)
   - ATSR title generation only
   - Pathway chain building
   - Should NOT contain batch processing

5. Batch Processing Panel (Isolated)
   - Batch row processing only
   - Core processing engine
   - Should NOT contain ATSR functions

═══════════════════════════════════════════════════════════════
`;

    const logPath = path.join(__dirname, '../backups/project-rename-log.txt');
    fs.writeFileSync(logPath, logContent, 'utf8');
    console.log(`📄 Rename log saved: ${logPath}\n`);

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

renameProjects();
