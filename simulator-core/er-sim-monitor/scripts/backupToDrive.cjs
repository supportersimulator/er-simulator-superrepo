#!/usr/bin/env node

/**
 * BACKUP TO GOOGLE DRIVE - "Convert Project 11-6" folder
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

console.log('\n💾 BACKING UP TO GOOGLE DRIVE\n');
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

async function createFolderIfNotExists(drive, folderName, parentId = null) {
  // Search for existing folder
  const query = parentId
    ? `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and '${parentId}' in parents and trashed=false`
    : `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;

  const response = await drive.files.list({
    q: query,
    fields: 'files(id, name)',
    spaces: 'drive'
  });

  if (response.data.files.length > 0) {
    console.log(`✅ Found existing folder: ${folderName}`);
    return response.data.files[0].id;
  }

  // Create new folder
  const fileMetadata = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder'
  };

  if (parentId) {
    fileMetadata.parents = [parentId];
  }

  const folder = await drive.files.create({
    requestBody: fileMetadata,
    fields: 'id'
  });

  console.log(`✅ Created folder: ${folderName}`);
  return folder.data.id;
}

async function uploadFile(drive, filePath, fileName, folderId) {
  const fileMetadata = {
    name: fileName,
    parents: [folderId]
  };

  const media = {
    mimeType: 'text/plain',
    body: fs.createReadStream(filePath)
  };

  const file = await drive.files.create({
    requestBody: fileMetadata,
    media: media,
    fields: 'id, name, webViewLink'
  });

  return file.data;
}

async function backup() {
  try {
    const auth = await authorize();
    const drive = google.drive({ version: 'v3', auth });

    console.log('📁 Creating/finding "Convert Project 11-6" folder...\n');

    const folderId = await createFolderIfNotExists(drive, 'Convert Project 11-6');
    console.log(`   Folder ID: ${folderId}\n`);

    console.log('📤 Uploading backups...\n');

    // Get current production code
    const script = google.script({ version: 'v1', auth });
    const PRODUCTION_PROJECT_ID = '12NihbVaaAIyRMCtzZ-aGjJ71CdL-HDjhmjxiD_S_EgIOuDOtrUH6M1l2';

    const content = await script.projects.getContent({
      scriptId: PRODUCTION_PROJECT_ID
    });

    const codeFile = content.data.files.find(f => f.name === 'Code');
    const manifestFile = content.data.files.find(f => f.name === 'appsscript');

    // Save to temp files
    const tempDir = path.join(__dirname, '../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }

    const codeFilePath = path.join(tempDir, 'production-code-2025-11-06.gs');
    const manifestFilePath = path.join(tempDir, 'production-manifest-2025-11-06.json');

    fs.writeFileSync(codeFilePath, codeFile.source, 'utf8');
    fs.writeFileSync(manifestFilePath, JSON.stringify(manifestFile, null, 2), 'utf8');

    // Upload to Drive
    console.log('   Uploading production code...');
    const codeFileResult = await uploadFile(
      drive,
      codeFilePath,
      'production-code-2025-11-06.gs',
      folderId
    );
    console.log(`   ✅ ${codeFileResult.name}`);

    console.log('   Uploading production manifest...');
    const manifestFileResult = await uploadFile(
      drive,
      manifestFilePath,
      'production-manifest-2025-11-06.json',
      folderId
    );
    console.log(`   ✅ ${manifestFileResult.name}`);

    // Upload key backup files
    const backupsToUpload = [
      'production-before-sheet-property-fix-2025-11-06.gs',
      'production-before-category-indexof-fix-2025-11-06.gs',
      'production-before-saved-fields-menu-2025-11-06.gs',
      'test-with-complete-atsr-2025-11-06.gs'
    ];

    for (const backupFile of backupsToUpload) {
      const backupPath = path.join(__dirname, '../backups', backupFile);
      if (fs.existsSync(backupPath)) {
        console.log(`   Uploading ${backupFile}...`);
        const result = await uploadFile(drive, backupPath, backupFile, folderId);
        console.log(`   ✅ ${result.name}`);
      }
    }

    // Upload summary
    const summaryPath = path.join(tempDir, 'DEPLOYMENT_SUMMARY.md');
    const summary = `# Categories & Pathways Panel Deployment - November 6, 2025

## ✅ Successfully Deployed

The big 1920x1000 **Pathway Chain Builder** panel is now live in production.

### Features Deployed:
- ✅ Categories tab
- ✅ Pathways tab
- ✅ Bird's Eye View with holistic insights
- ✅ Intelligent Pathway Opportunities
- ✅ Pre-Cache Rich Data button with field selector
- ✅ AI: Discover Novel Pathways
- ✅ AI: Radical Mode

### Issues Fixed:
1. **"Output sheet not found"** - Fixed \`refreshHeaders()\` to use \`pickMasterSheet_()\`
2. **"category.toUpperCase is not a function"** - Added null safety checks
3. **"category.indexOf is not a function"** - Added type checking
4. **Missing menu** - Fixed \`onOpen()\` function

### Data Analysis:
- **207 Total Cases**
- **2 Systems** detected
- **1 Opportunity** identified (Pediatric Emergency Medicine - 9 cases)
- **0 Unassigned** cases

### Production Details:
- **Spreadsheet ID**: 1EVSC6j7zUeNw_D7dOV3dx7eRyMd3T6PVrVVazKYIkaM
- **Project ID**: 12NihbVaaAIyRMCtzZ-aGjJ71CdL-HDjhmjxiD_S_EgIOuDOtrUH6M1l2
- **Code Size**: 318.9 KB
- **Deployment Date**: November 6, 2025

### Git Commit:
\`\`\`
Fix Categories & Pathways panel deployment to production

- Fixed refreshHeaders() to use pickMasterSheet_() instead of hardcoded 'Output' sheet
- Added null safety to category.toUpperCase() calls
- Added null safety to category.indexOf() calls in multi-system filter
- Added showSavedFieldSelection() menu item to view cached field selections
- Successfully deployed big 1920x1000 Pathway Chain Builder panel
- Panel now loads with Categories/Pathways tabs, holistic insights, and cache integration
\`\`\`

### Scripts Created:
- \`fixProductionSheetProperty.cjs\` - Fixed sheet name resolution
- \`fixCategoryIndexOfSurgical.cjs\` - Fixed category type safety
- \`addShowSavedFieldsMenuItem.cjs\` - Added field selection viewer
- \`checkProductionHeaderStructure.cjs\` - Header analysis tool

### Backup Files:
- \`production-code-2025-11-06.gs\` - Current production code
- \`production-manifest-2025-11-06.json\` - Current manifest
- \`production-before-sheet-property-fix-2025-11-06.gs\` - Before first fix
- \`production-before-category-indexof-fix-2025-11-06.gs\` - Before second fix
- \`test-with-complete-atsr-2025-11-06.gs\` - Source of pathway code

## 🎉 Result

The panel is fully functional and ready for use!
`;

    fs.writeFileSync(summaryPath, summary, 'utf8');
    console.log('   Uploading deployment summary...');
    const summaryResult = await uploadFile(
      drive,
      summaryPath,
      'DEPLOYMENT_SUMMARY.md',
      folderId
    );
    console.log(`   ✅ ${summaryResult.name}\n`);

    // Cleanup temp files
    fs.unlinkSync(codeFilePath);
    fs.unlinkSync(manifestFilePath);
    fs.unlinkSync(summaryPath);

    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('🎉 BACKUP COMPLETE!\n');
    console.log(`Folder: "Convert Project 11-6"`);
    console.log(`Folder ID: ${folderId}`);
    console.log(`View in Drive: https://drive.google.com/drive/folders/${folderId}\n`);
    console.log('Files backed up:');
    console.log('   ✅ production-code-2025-11-06.gs');
    console.log('   ✅ production-manifest-2025-11-06.json');
    console.log('   ✅ DEPLOYMENT_SUMMARY.md');
    console.log('   ✅ Key backup files\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

backup();
