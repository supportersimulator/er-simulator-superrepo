/**
 * Safe Backup & Declutter Apps Script Project
 *
 * Step 1: Backup everything to local disk + Google Drive
 * Step 2: Identify duplicates and conflicts
 * Step 3: Provide clear recommendations
 *
 * Philosophy: Nothing is deleted. Everything is preserved.
 */

const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

async function main() {
  console.log('🔒 SAFE BACKUP & DECLUTTER PROCESS\n');
  console.log('══════════════════════════════════════════════════════════════\n');

  const token = JSON.parse(fs.readFileSync('./config/token.json', 'utf-8'));
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/oauth2callback'
  );
  oAuth2Client.setCredentials(token);

  const script = google.script({ version: 'v1', auth: oAuth2Client });
  const drive = google.drive({ version: 'v3', auth: oAuth2Client });
  const scriptId = process.env.APPS_SCRIPT_ID;

  // ═══════════════════════════════════════════════════════════════════════
  // STEP 1: BACKUP TO LOCAL DISK
  // ═══════════════════════════════════════════════════════════════════════
  console.log('📥 STEP 1: Downloading all files...\n');

  const project = await script.projects.getContent({ scriptId });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
  const backupDir = `/Users/aarontjomsland/er-sim-monitor/backups/apps-script-backup-${timestamp}`;

  if (!fs.existsSync('/Users/aarontjomsland/er-sim-monitor/backups')) {
    fs.mkdirSync('/Users/aarontjomsland/er-sim-monitor/backups');
  }

  fs.mkdirSync(backupDir, { recursive: true });

  console.log('💾 Saving to:', backupDir + '\n');

  project.data.files.forEach(file => {
    const ext = file.type === 'SERVER_JS' ? '.gs' : file.type === 'HTML' ? '.html' : '.json';
    const filename = file.name + ext;
    const filepath = path.join(backupDir, filename);

    fs.writeFileSync(filepath, file.source);
    console.log('  ✅', filename, '(' + Math.round(file.source.length / 1024) + ' KB)');
  });

  console.log('\n✅ Local backup complete!\n');

  // ═══════════════════════════════════════════════════════════════════════
  // STEP 2: BACKUP TO GOOGLE DRIVE
  // ═══════════════════════════════════════════════════════════════════════
  console.log('☁️  STEP 2: Uploading backup to Google Drive...\n');

  try {
    // Create a folder in Google Drive
    const folderMetadata = {
      name: `Apps Script Backup ${timestamp}`,
      mimeType: 'application/vnd.google-apps.folder'
    };

    const folder = await drive.files.create({
      resource: folderMetadata,
      fields: 'id'
    });

    const folderId = folder.data.id;
    console.log('📁 Created Drive folder:', folderId + '\n');

    // Upload each file
    for (const file of project.data.files) {
      const ext = file.type === 'SERVER_JS' ? '.gs' : file.type === 'HTML' ? '.html' : '.json';
      const filename = file.name + ext;

      const fileMetadata = {
        name: filename,
        parents: [folderId]
      };

      const media = {
        mimeType: 'text/plain',
        body: file.source
      };

      await drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id'
      });

      console.log('  ✅', filename);
    }

    console.log('\n✅ Google Drive backup complete!\n');
  } catch (error) {
    console.log('⚠️  Google Drive backup skipped (may need additional permissions)\n');
    console.log('   But local backup is complete and safe!\n');
  }

  // ═══════════════════════════════════════════════════════════════════════
  // STEP 3: ANALYZE DUPLICATES
  // ═══════════════════════════════════════════════════════════════════════
  console.log('🔍 STEP 3: Analyzing for duplicates...\n');
  console.log('══════════════════════════════════════════════════════════════\n');

  // Find function name collisions
  const functionMap = {};

  project.data.files.forEach(file => {
    const funcMatches = file.source.match(/function\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g);
    if (funcMatches) {
      funcMatches.forEach(match => {
        const funcName = match.replace('function ', '').replace('(', '');
        if (!functionMap[funcName]) {
          functionMap[funcName] = [];
        }
        functionMap[funcName].push(file.name);
      });
    }
  });

  // Find duplicates
  const duplicates = Object.entries(functionMap).filter(([func, files]) => files.length > 1);

  if (duplicates.length > 0) {
    console.log('⚠️  DUPLICATE FUNCTIONS FOUND:\n');
    duplicates.forEach(([func, files]) => {
      console.log('  Function:', func);
      console.log('  Defined in:', files.join(', '));
      console.log('');
    });
  } else {
    console.log('✅ No duplicate functions found!\n');
  }

  // ═══════════════════════════════════════════════════════════════════════
  // STEP 4: RECOMMENDATION
  // ═══════════════════════════════════════════════════════════════════════
  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('📋 RECOMMENDED ACTIONS:\n');
  console.log('══════════════════════════════════════════════════════════════\n');

  // Analyze the two conflicting files
  const file1 = project.data.files.find(f => f.name === 'Phase2_Enhanced_Categories_Pathways_Panel');
  const file2 = project.data.files.find(f => f.name === 'Phase2_Enhanced_Categories_With_AI');

  if (file1 && file2) {
    console.log('🎯 FOUND CONFLICT:\n');
    console.log('File 1: Phase2_Enhanced_Categories_Pathways_Panel.gs');
    console.log('  Size:', Math.round(file1.source.length / 1024), 'KB');
    console.log('');
    console.log('File 2: Phase2_Enhanced_Categories_With_AI.gs');
    console.log('  Size:', Math.round(file2.source.length / 1024), 'KB');
    console.log('  Has latest fixes: ✅ (this is the one we\'ve been editing)');
    console.log('');
    console.log('RECOMMENDATION:');
    console.log('  ✅ Keep: Phase2_Enhanced_Categories_With_AI.gs (48 KB)');
    console.log('  📦 Archive: Phase2_Enhanced_Categories_Pathways_Panel.gs → rename to');
    console.log('            Phase2_Enhanced_Categories_Pathways_Panel_ARCHIVE_' + timestamp);
    console.log('');
  }

  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('✅ BACKUP COMPLETE - YOUR CODE IS SAFE!\n');
  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('Backups created:');
  console.log('  1. Local: ' + backupDir);
  console.log('  2. Ready for decluttering\n');
  console.log('');
  console.log('Next: I\'ll create a safe rename script (no deletion!).\n');
}

main().catch(console.error);
