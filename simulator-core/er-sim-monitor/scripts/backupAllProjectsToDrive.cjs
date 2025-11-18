#!/usr/bin/env node

/**
 * BACKUP ALL APPS SCRIPT PROJECTS TO DRIVE
 * 1. Copy all project contents via Apps Script API
 * 2. Create "All Projects" folder on Google Drive
 * 3. Save each project's code as .gs files in Drive
 * 4. Create inventory document with script IDs and details
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

console.log('\n📦 BACKING UP ALL APPS SCRIPT PROJECTS\n');
console.log('═══════════════════════════════════════════════════════════════\n');

const PROJECTS = {
  main: {
    id: '1orJ__UUViG-gdSOHXt2VSGzo--ASib9XdVLVCApccKujWnqTuxq7wHIw',
    name: 'GPT Formatter',
    note: 'MAIN PROJECT - Original production project'
  },
  test1: {
    id: '1HIw4Ok4G88YzHsECb5e_GvJH9XYefEY59pHXalFstiddLciyHXC06zNf',
    name: 'TEST Menu Script (Bound) #1'
  },
  test2: {
    id: '1bwLs70zTwQsJxtAqA_yNJfyANjAW5x39YEY0VJhFPMamgDwb100qtqJD',
    name: 'TEST Menu Script (Bound) #2'
  },
  feature1: {
    id: '1kkPZU3GsCCuu5IhTEOufmDT1Cb2rSQVB3Y3u1DPf87yoSV4WVtoNvd6i',
    name: 'TEST_Feature_Based_Code #1'
  },
  feature2: {
    id: '1KBkujOTXGDmmhWOFm-ifxoMjXM5pRwwM5FpFBtPWK8eoE99fr4lla1OE',
    name: 'TEST_Feature_Based_Code #2'
  },
  feature3: {
    id: '1INZy2-kQNEfEWEipSQ_WCvrvEhGgAeW4G4TM61W2ajNp_63G39KLPm4Y',
    name: 'TEST_Feature_Based_Code #3'
  }
};

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
  try {
    const auth = await authorize();
    const script = google.script({ version: 'v1', auth });
    const drive = google.drive({ version: 'v3', auth });

    // Step 1: Create "All Projects" folder on Drive
    console.log('📁 Creating "All Projects" folder on Google Drive...\n');
    
    const folderMetadata = {
      name: 'All Projects Backup - ' + new Date().toISOString().split('T')[0],
      mimeType: 'application/vnd.google-apps.folder'
    };
    
    const folder = await drive.files.create({
      resource: folderMetadata,
      fields: 'id, name, webViewLink'
    });
    
    const folderId = folder.data.id;
    console.log('✅ Created folder: ' + folder.data.name);
    console.log('   ID: ' + folderId);
    console.log('   Link: ' + folder.data.webViewLink);
    console.log('\n═══════════════════════════════════════════════════════════════\n');

    // Step 2: Fetch and analyze all projects
    const projectDetails = [];

    for (const [key, proj] of Object.entries(PROJECTS)) {
      console.log('📦 Processing: ' + proj.name);
      console.log('   Script ID: ' + proj.id);
      
      try {
        // Get project metadata and contents
        const project = await script.projects.get({ scriptId: proj.id });
        const content = await script.projects.getContent({ scriptId: proj.id });
        
        const files = content.data.files.filter(f => f.type === 'SERVER_JS');
        const totalSize = files.reduce((sum, f) => sum + (f.source ? f.source.length : 0), 0);
        const sizeKB = Math.round(totalSize / 1024);
        
        console.log('   Title: ' + project.data.title);
        console.log('   Files: ' + files.length + ' .gs files (' + sizeKB + ' KB total)');
        console.log('   Created: ' + new Date(project.data.createTime).toLocaleString());
        console.log('   Updated: ' + new Date(project.data.updateTime).toLocaleString());
        
        // Check for parent spreadsheet
        let boundTo = 'Standalone project';
        if (project.data.parentId) {
          try {
            const parent = await drive.files.get({
              fileId: project.data.parentId,
              fields: 'id, name, webViewLink'
            });
            boundTo = parent.data.name + ' (' + parent.data.id + ')';
            console.log('   Bound to: ' + parent.data.name);
            console.log('   Spreadsheet Link: ' + parent.data.webViewLink);
          } catch (e) {
            boundTo = 'Unknown (ID: ' + project.data.parentId + ')';
          }
        }
        
        // Detect features
        const allSource = files.map(f => f.source || '').join('\n');
        const features = [];
        if (allSource.includes('function onOpen()')) features.push('Menu (onOpen)');
        if (allSource.includes('TEST Tools')) features.push('TEST Tools menu');
        if (allSource.includes('preCacheRichData')) features.push('Cache system');
        if (allSource.includes('runPathwayChainBuilder')) features.push('Pathway builder');
        if (allSource.includes('showFieldSelector')) features.push('Field selector');
        if (allSource.includes('getRecommendedFields')) features.push('AI recommendations');
        if (allSource.includes('processBatchRows_')) features.push('Batch processing');
        
        if (features.length > 0) {
          console.log('   Features: ' + features.join(', '));
        }
        
        // Save to local backup first
        const localBackupDir = path.join(__dirname, '../backups/all-projects-' + new Date().toISOString().split('T')[0]);
        const projectDir = path.join(localBackupDir, key + '-' + proj.id);
        
        if (!fs.existsSync(projectDir)) {
          fs.mkdirSync(projectDir, { recursive: true });
        }
        
        // Save each file locally
        files.forEach(file => {
          const filePath = path.join(projectDir, file.name + '.gs');
          fs.writeFileSync(filePath, file.source || '', 'utf8');
        });
        
        console.log('   ✅ Saved locally to: ' + projectDir);
        
        // Upload to Google Drive
        for (const file of files) {
          const fileMetadata = {
            name: proj.name + ' - ' + file.name + '.gs',
            parents: [folderId],
            mimeType: 'text/plain'
          };
          
          const media = {
            mimeType: 'text/plain',
            body: file.source || ''
          };
          
          await drive.files.create({
            resource: fileMetadata,
            media: media,
            fields: 'id'
          });
        }
        
        console.log('   ✅ Uploaded to Google Drive folder');
        
        // Store details for inventory
        projectDetails.push({
          key: key,
          name: proj.name,
          note: proj.note || '',
          scriptId: proj.id,
          title: project.data.title,
          created: project.data.createTime,
          updated: project.data.updateTime,
          boundTo: boundTo,
          fileCount: files.length,
          sizeKB: sizeKB,
          fileNames: files.map(f => f.name),
          features: features
        });
        
      } catch (error) {
        console.log('   ❌ ERROR: ' + error.message);
        projectDetails.push({
          key: key,
          name: proj.name,
          note: proj.note || '',
          scriptId: proj.id,
          error: error.message
        });
      }
      
      console.log('');
    }

    console.log('═══════════════════════════════════════════════════════════════\n');

    // Step 3: Create inventory document
    console.log('📄 Creating inventory document...\n');
    
    let inventoryText = '═══════════════════════════════════════════════════════════════\n';
    inventoryText += '📦 APPS SCRIPT PROJECTS INVENTORY\n';
    inventoryText += 'Backup Date: ' + new Date().toLocaleString() + '\n';
    inventoryText += '═══════════════════════════════════════════════════════════════\n\n';
    
    inventoryText += '🔗 BACKUP FOLDER LINK:\n';
    inventoryText += folder.data.webViewLink + '\n\n';
    inventoryText += '═══════════════════════════════════════════════════════════════\n\n';
    
    projectDetails.forEach((proj, index) => {
      inventoryText += (index + 1) + '. ' + proj.name.toUpperCase() + '\n';
      inventoryText += '─'.repeat(70) + '\n';
      if (proj.note) {
        inventoryText += '⚠️  ' + proj.note + '\n';
      }
      inventoryText += 'Script ID: ' + proj.scriptId + '\n';
      inventoryText += 'Direct Link: https://script.google.com/home/projects/' + proj.scriptId + '/edit\n';
      
      if (proj.error) {
        inventoryText += '❌ Error accessing project: ' + proj.error + '\n';
      } else {
        inventoryText += 'Title: ' + proj.title + '\n';
        inventoryText += 'Created: ' + new Date(proj.created).toLocaleString() + '\n';
        inventoryText += 'Updated: ' + new Date(proj.updated).toLocaleString() + '\n';
        inventoryText += 'Bound To: ' + proj.boundTo + '\n';
        inventoryText += 'Files: ' + proj.fileCount + ' .gs files (' + proj.sizeKB + ' KB total)\n';
        inventoryText += 'File Names: ' + proj.fileNames.join(', ') + '\n';
        if (proj.features && proj.features.length > 0) {
          inventoryText += 'Features: ' + proj.features.join(', ') + '\n';
        }
      }
      inventoryText += '\n';
    });
    
    inventoryText += '═══════════════════════════════════════════════════════════════\n\n';
    inventoryText += '📊 DUPLICATE ANALYSIS:\n\n';
    
    const testMenuProjects = projectDetails.filter(p => p.name.includes('TEST Menu Script'));
    const featureProjects = projectDetails.filter(p => p.name.includes('Feature_Based_Code'));
    
    if (testMenuProjects.length > 1) {
      inventoryText += '⚠️  DUPLICATE: ' + testMenuProjects.length + ' "TEST Menu Script (Bound)" projects found:\n';
      testMenuProjects.forEach(p => {
        inventoryText += '   • ' + p.name + ' (' + p.scriptId + ')\n';
        inventoryText += '     Updated: ' + new Date(p.updated).toLocaleString() + '\n';
        inventoryText += '     Bound To: ' + p.boundTo + '\n';
      });
      inventoryText += '\n';
    }
    
    if (featureProjects.length > 1) {
      inventoryText += '⚠️  DUPLICATE: ' + featureProjects.length + ' "TEST_Feature_Based_Code" projects found:\n';
      featureProjects.forEach(p => {
        inventoryText += '   • ' + p.name + ' (' + p.scriptId + ')\n';
        inventoryText += '     Updated: ' + new Date(p.updated).toLocaleString() + '\n';
        inventoryText += '     Bound To: ' + p.boundTo + '\n';
      });
      inventoryText += '\n';
    }
    
    inventoryText += '═══════════════════════════════════════════════════════════════\n';
    
    // Save inventory locally
    const localInventoryPath = path.join(__dirname, '../backups/all-projects-' + new Date().toISOString().split('T')[0], 'INVENTORY.txt');
    fs.writeFileSync(localInventoryPath, inventoryText, 'utf8');
    console.log('✅ Saved inventory locally: ' + localInventoryPath);
    
    // Upload inventory to Drive
    const inventoryMetadata = {
      name: 'PROJECT_INVENTORY.txt',
      parents: [folderId],
      mimeType: 'text/plain'
    };
    
    const inventoryMedia = {
      mimeType: 'text/plain',
      body: inventoryText
    };
    
    const inventoryFile = await drive.files.create({
      resource: inventoryMetadata,
      media: inventoryMedia,
      fields: 'id, webViewLink'
    });
    
    console.log('✅ Uploaded inventory to Drive: ' + inventoryFile.data.webViewLink);
    
    console.log('\n═══════════════════════════════════════════════════════════════\n');
    console.log('✅ BACKUP COMPLETE!\n');
    console.log('📁 Google Drive Folder: ' + folder.data.webViewLink);
    console.log('📄 Inventory Document: ' + inventoryFile.data.webViewLink);
    console.log('💾 Local Backup: ' + path.join(__dirname, '../backups/all-projects-' + new Date().toISOString().split('T')[0]));
    console.log('\n═══════════════════════════════════════════════════════════════\n');
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('   Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

backup();
