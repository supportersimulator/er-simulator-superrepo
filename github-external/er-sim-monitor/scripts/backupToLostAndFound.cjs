#!/usr/bin/env node

/**
 * Backup EVERYTHING to "Lost and Found" folder in Google Drive
 * This is a comprehensive safety backup of all ATSR-related files
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

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

async function backup() {
  console.log('\n💾 BACKING UP EVERYTHING TO "LOST AND FOUND" FOLDER\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const auth = await authorize();
  const drive = google.drive({ version: 'v3', auth });
  const script = google.script({ version: 'v1', auth });

  try {
    // Create "Lost and Found" folder
    console.log('📁 Creating "Lost and Found" folder...\n');

    // Check if folder already exists
    const existingFolders = await drive.files.list({
      q: "name='Lost and Found' and mimeType='application/vnd.google-apps.folder' and trashed=false",
      fields: 'files(id, name)',
      pageSize: 1
    });

    let folderId;
    if (existingFolders.data.files.length > 0) {
      folderId = existingFolders.data.files[0].id;
      console.log(`✅ Found existing folder: ${folderId}\n`);
    } else {
      const folder = await drive.files.create({
        requestBody: {
          name: 'Lost and Found',
          mimeType: 'application/vnd.google-apps.folder'
        },
        fields: 'id'
      });
      folderId = folder.data.id;
      console.log(`✅ Created new folder: ${folderId}\n`);
    }

    // Create timestamped subfolder
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('.')[0];
    const subfolder = await drive.files.create({
      requestBody: {
        name: `Backup_${timestamp}`,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [folderId]
      },
      fields: 'id'
    });
    const backupFolderId = subfolder.data.id;
    console.log(`📂 Created backup subfolder: Backup_${timestamp}\n`);
    console.log('═══════════════════════════════════════════════════════════════\n');

    const filesBackedUp = [];

    // 1. Backup ATSR_Title_Generator_Feature.gs (THE IMPORTANT ONE WITH TEST MENU)
    console.log('1️⃣ Backing up ATSR_Title_Generator_Feature.gs (TEST Tools menu)...\n');
    const atsrFeaturePath = path.join(__dirname, '../apps-script-deployable/ATSR_Title_Generator_Feature.gs');
    if (fs.existsSync(atsrFeaturePath)) {
      const content = fs.readFileSync(atsrFeaturePath, 'utf8');
      await drive.files.create({
        requestBody: {
          name: 'ATSR_Title_Generator_Feature.gs',
          parents: [backupFolderId]
        },
        media: {
          mimeType: 'text/plain',
          body: content
        }
      });
      console.log(`   ✅ Saved ATSR_Title_Generator_Feature.gs (${Math.round(content.length / 1024)} KB)\n`);
      filesBackedUp.push('ATSR_Title_Generator_Feature.gs');
    }

    // 2. Backup Code_ULTIMATE_ATSR_FROM_DRIVE.gs
    console.log('2️⃣ Backing up Code_ULTIMATE_ATSR_FROM_DRIVE.gs...\n');
    const ultimatePath = path.join(__dirname, 'Code_ULTIMATE_ATSR_FROM_DRIVE.gs');
    if (fs.existsSync(ultimatePath)) {
      const content = fs.readFileSync(ultimatePath, 'utf8');
      await drive.files.create({
        requestBody: {
          name: 'Code_ULTIMATE_ATSR_FROM_DRIVE.gs',
          parents: [backupFolderId]
        },
        media: {
          mimeType: 'text/plain',
          body: content
        }
      });
      console.log(`   ✅ Saved Code_ULTIMATE_ATSR_FROM_DRIVE.gs (${Math.round(content.length / 1024)} KB)\n`);
      filesBackedUp.push('Code_ULTIMATE_ATSR_FROM_DRIVE.gs');
    }

    // 3. Backup apps-script-backup/Code.gs
    console.log('3️⃣ Backing up apps-script-backup/Code.gs...\n');
    const backupCodePath = path.join(__dirname, '../apps-script-backup/Code.gs');
    if (fs.existsSync(backupCodePath)) {
      const content = fs.readFileSync(backupCodePath, 'utf8');
      await drive.files.create({
        requestBody: {
          name: 'Code_from_apps-script-backup.gs',
          parents: [backupFolderId]
        },
        media: {
          mimeType: 'text/plain',
          body: content
        }
      });
      console.log(`   ✅ Saved Code_from_apps-script-backup.gs (${Math.round(content.length / 1024)} KB)\n`);
      filesBackedUp.push('Code_from_apps-script-backup.gs');
    }

    // 4. Backup ALL apps-script-deployable files
    console.log('4️⃣ Backing up ALL apps-script-deployable files...\n');
    const deployablePath = path.join(__dirname, '../apps-script-deployable');
    const deployableFiles = fs.readdirSync(deployablePath).filter(f => f.endsWith('.gs'));

    for (const file of deployableFiles) {
      if (file === 'ATSR_Title_Generator_Feature.gs') continue; // Already saved

      const filePath = path.join(deployablePath, file);
      const content = fs.readFileSync(filePath, 'utf8');
      await drive.files.create({
        requestBody: {
          name: file,
          parents: [backupFolderId]
        },
        media: {
          mimeType: 'text/plain',
          body: content
        }
      });
      console.log(`   ✅ Saved ${file} (${Math.round(content.length / 1024)} KB)`);
      filesBackedUp.push(file);
    }
    console.log('');

    // 5. Backup current deployed script from TEST spreadsheet
    console.log('5️⃣ Backing up CURRENT deployed script from TEST spreadsheet...\n');
    const TEST_SCRIPT_ID = '1HIw4Ok4G88YzHsECb5e_GvJH9XYefEY59pHXalFstiddLciyHXC06zNf';

    try {
      const project = await script.projects.getContent({ scriptId: TEST_SCRIPT_ID });
      const codeFile = project.data.files.find(f => f.name === 'Code');

      if (codeFile) {
        await drive.files.create({
          requestBody: {
            name: 'CURRENT_DEPLOYED_TEST_SCRIPT.gs',
            parents: [backupFolderId]
          },
          media: {
            mimeType: 'text/plain',
            body: codeFile.source
          }
        });
        console.log(`   ✅ Saved CURRENT_DEPLOYED_TEST_SCRIPT.gs (${Math.round(codeFile.source.length / 1024)} KB)\n`);
        filesBackedUp.push('CURRENT_DEPLOYED_TEST_SCRIPT.gs');
      }
    } catch (e) {
      console.log(`   ⚠️  Could not backup deployed script: ${e.message}\n`);
    }

    // 6. Create index file
    console.log('6️⃣ Creating index file...\n');
    const indexContent = `LOST AND FOUND BACKUP
Created: ${new Date().toISOString()}

This folder contains a complete backup of all ATSR-related code files.

FILES BACKED UP (${filesBackedUp.length} total):
${filesBackedUp.map((f, i) => `${i + 1}. ${f}`).join('\n')}

MOST IMPORTANT FILE:
🌟 ATSR_Title_Generator_Feature.gs
   - Contains the TEST Tools menu (🧪 TEST Tools)
   - Has ATSR Titles Optimizer (v2)
   - Has Pathway Chain Builder
   - Size: 43 KB
   - Last modified: November 4, 2025

PROJECT IDs:
- TEST Spreadsheet: 1t3qN8e537ghl38GTsXbVG8ML8OZtK2XyUpDiMQjnGAI
- TEST Script: 1HIw4Ok4G88YzHsECb5e_GvJH9XYefEY59pHXalFstiddLciyHXC06zNf
- MAIN Spreadsheet: 1EVSC6j7zUeNw_D7dOV3dx7eRyMd3T6PVrVVazKYIkaM

RESTORATION INSTRUCTIONS:
If you need to restore the TEST Tools menu:
1. Copy ATSR_Title_Generator_Feature.gs content
2. Deploy to TEST Script ID: 1HIw4Ok4G88YzHsECb5e_GvJH9XYefEY59pHXalFstiddLciyHXC06zNf
3. Refresh TEST spreadsheet
4. Look for 🧪 TEST Tools menu

This backup was created automatically by Claude Code.
`;

    await drive.files.create({
      requestBody: {
        name: 'README.txt',
        parents: [backupFolderId]
      },
      media: {
        mimeType: 'text/plain',
        body: indexContent
      }
    });
    console.log('   ✅ Saved README.txt with restoration instructions\n');

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🎉 BACKUP COMPLETE!\n');
    console.log(`📂 Google Drive Folder: Lost and Found/Backup_${timestamp}\n`);
    console.log(`✅ Backed up ${filesBackedUp.length} files\n`);
    console.log('🌟 Most important: ATSR_Title_Generator_Feature.gs (with TEST Tools menu)\n');
    console.log('Your code is now safely backed up in Google Drive!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (e) {
    console.log('❌ Error: ' + e.message + '\n');
    if (e.stack) {
      console.log(e.stack);
    }
  }
}

backup().catch(console.error);
