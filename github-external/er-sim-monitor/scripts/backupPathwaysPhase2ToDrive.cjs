#!/usr/bin/env node

/**
 * Backup Categories_Pathways_Feature_Phase2.gs to Lost and Found folder in Google Drive
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

async function uploadFile(drive, fileName, fileContent, folderId) {
  const fileMetadata = {
    name: fileName,
    parents: [folderId]
  };

  const media = {
    mimeType: 'text/plain',
    body: fileContent
  };

  const file = await drive.files.create({
    requestBody: fileMetadata,
    media: media,
    fields: 'id, name, size'
  });

  return file.data;
}

async function backup() {
  console.log('\n💾 BACKING UP PATHWAYS PHASE 2 TO GOOGLE DRIVE\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const auth = await authorize();
  const drive = google.drive({ version: 'v3', auth });

  try {
    // Search for existing "Lost and Found" folder
    console.log('🔍 Searching for "Lost and Found" folder...\n');

    const searchResponse = await drive.files.list({
      q: "name='Lost and Found' and mimeType='application/vnd.google-apps.folder' and trashed=false",
      fields: 'files(id, name)',
      spaces: 'drive'
    });

    let lostAndFoundId;

    if (searchResponse.data.files && searchResponse.data.files.length > 0) {
      lostAndFoundId = searchResponse.data.files[0].id;
      console.log(`✅ Found existing "Lost and Found" folder: ${lostAndFoundId}\n`);
    } else {
      console.log('📁 Creating "Lost and Found" folder...\n');

      const folderMetadata = {
        name: 'Lost and Found',
        mimeType: 'application/vnd.google-apps.folder'
      };

      const folder = await drive.files.create({
        requestBody: folderMetadata,
        fields: 'id'
      });

      lostAndFoundId = folder.data.id;
      console.log(`✅ Created "Lost and Found" folder: ${lostAndFoundId}\n`);
    }

    // Search for existing "Categories and Pathways" subfolder
    console.log('🔍 Searching for "Categories and Pathways" subfolder...\n');

    const subfolderResponse = await drive.files.list({
      q: `name='Categories and Pathways' and mimeType='application/vnd.google-apps.folder' and '${lostAndFoundId}' in parents and trashed=false`,
      fields: 'files(id, name)',
      spaces: 'drive'
    });

    let folderId;

    if (subfolderResponse.data.files && subfolderResponse.data.files.length > 0) {
      folderId = subfolderResponse.data.files[0].id;
      console.log(`✅ Found existing "Categories and Pathways" subfolder: ${folderId}\n`);
    } else {
      console.log('📁 Creating "Categories and Pathways" subfolder...\n');

      const subfolderMetadata = {
        name: 'Categories and Pathways',
        mimeType: 'application/vnd.google-apps.folder',
        parents: [lostAndFoundId]
      };

      const subfolder = await drive.files.create({
        requestBody: subfolderMetadata,
        fields: 'id'
      });

      folderId = subfolder.data.id;
      console.log(`✅ Created "Categories and Pathways" subfolder: ${folderId}\n`);
    }

    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('📤 Uploading Categories & Pathways Phase 2...\n');

    // Read the Phase 2 file
    const phase2Path = path.join(__dirname, '../apps-script-deployable/Categories_Pathways_Feature_Phase2.gs');

    if (!fs.existsSync(phase2Path)) {
      console.log('❌ Phase 2 file not found locally!\n');
      return;
    }

    const phase2Content = fs.readFileSync(phase2Path, 'utf8');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('.')[0];
    const fileName = `Categories_Pathways_Feature_Phase2_BACKUP_${timestamp}.gs`;

    console.log(`   Uploading ${fileName}...`);

    const result = await uploadFile(drive, fileName, phase2Content, folderId);
    const sizeKB = Math.round(result.size / 1024);

    console.log(`   ✅ Uploaded successfully (${sizeKB} KB)\n`);

    // Also create a README for this backup
    const readmeContent = `CATEGORIES & PATHWAYS PHASE 2 BACKUP
Created: ${new Date().toISOString()}

This is a backup of Categories_Pathways_Feature_Phase2.gs deployed to TEST CSV.

FILE DETAILS:
- Name: Categories_Pathways_Feature_Phase2.gs
- Size: ${sizeKB} KB
- Deployed to: TEST_Convert_Master_Sim_CSV_Template_with_Input
- Script ID: 1HIw4Ok4G88YzHsECb5e_GvJH9XYefEY59pHXalFstiddLciyHXC06zNf

FEATURES INCLUDED:
✅ Full Categories & Pathways Chain Builder
✅ Live cache progress with terminal logs
✅ Header cache integration (refreshHeaders() runs FIRST)
✅ Dynamic column mapping (23-26 fields)
✅ AI-powered pathway discovery with 6 logic types:
   - System-Based (CARD, RESP, NEUR, GI, etc.)
   - Skill Protocol Series (ACLS, PALS, ATLS, NRP)
   - Specialty/Department Series (GYN, PEDS, TRAUMA, TOX)
   - Patient Experience Series (Anxiety, Communication)
   - Complexity Progression (Foundational → Advanced)
   - Clinical Reasoning (Diagnostic Dilemmas, Time-Critical)
✅ Batch processing support
✅ Multi-step workflows
✅ Cache system with 24-hour validity

CACHE BUTTON WORKFLOW:
1. Click "💾 Pre-Cache Rich Data" button
2. refreshHeaders() runs FIRST → maps all 23-26 columns
3. Saves column mappings to CACHED_HEADER2 property
4. Performs holistic analysis using dynamic column indices
5. Shows live progress: timestamp logs + progress bar
6. Caches all case data for instant AI discovery

WHAT GETS CACHED (23-26 fields per case):
• Demographics (case ID, spark title, diagnosis)
• Categories & Pathway assignments
• System distribution data
• Clinical context for nuanced pathway detection

RESTORATION INSTRUCTIONS:
If you need to restore this version:
1. Copy the content from Categories_Pathways_Feature_Phase2_BACKUP_${timestamp}.gs
2. Deploy to TEST Script ID: 1HIw4Ok4G88YzHsECb5e_GvJH9XYefEY59pHXalFstiddLciyHXC06zNf
3. Keep the existing ATSR file (Code.gs) - don't overwrite it!
4. Refresh TEST spreadsheet
5. Look for Categories & Pathways features in the menu

This backup was created automatically by Claude Code.
`;

    const readmeName = `README_Pathways_Phase2_Backup_${timestamp}.txt`;
    console.log(`   Creating ${readmeName}...`);

    await uploadFile(drive, readmeName, readmeContent, folderId);
    console.log(`   ✅ README created\n`);

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🎉 BACKUP COMPLETE!\n');
    console.log(`📂 Folder: Lost and Found → Categories and Pathways`);
    console.log(`🆔 Subfolder ID: ${folderId}\n`);
    console.log(`✅ Files backed up:\n`);
    console.log(`   1. ${fileName} (${sizeKB} KB)`);
    console.log(`   2. ${readmeName}\n`);
    console.log('🌟 Categories & Pathways Phase 2 is now safely backed up!\n');
    console.log('📍 Location: Google Drive → Lost and Found → Categories and Pathways\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (e) {
    console.log('❌ Error: ' + e.message + '\n');
    if (e.stack) {
      console.log(e.stack);
    }
  }
}

backup().catch(console.error);
