#!/usr/bin/env node

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const CREDS_PATH = path.join(__dirname, '../config/credentials.json');
const TOKEN_PATH = path.join(__dirname, '../config/token.json');
const ER_SIM_DEV_FOLDER_ID = '1LjQcTA1U3TNwNchKqBs5GkvqLmDD6hh9';

/**
 * Add Roadmap Milestone Folders
 * 
 * Creates folders for each major development phase/milestone
 */

async function addMilestoneFolders() {
  console.log('\n🎯 ADDING ROADMAP MILESTONE FOLDERS\n');
  console.log('='.repeat(80) + '\n');

  try {
    const credentials = JSON.parse(fs.readFileSync(CREDS_PATH, 'utf8'));
    const { client_id, client_secret } = credentials.installed || credentials.web;
    const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));

    const oauth2Client = new google.auth.OAuth2(client_id, client_secret, 'http://localhost');
    oauth2Client.setCredentials(token);

    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    // Define milestone structure based on DEVELOPMENT_ROADMAP.md
    const milestones = [
      {
        name: '🏁 Phase I - Data Organization & Case Management (COMPLETE)',
        subfolders: [
          'Source Data Collection',
          'Scenario Processing System',
          'Clinical Defaults',
          'Input Validation'
        ]
      },
      {
        name: '🔄 Phase II - Quality Control Mechanisms (IN PROGRESS)',
        subfolders: [
          'Phase II.A - Smart Duplicate Detection',
          'Phase II.B - Advanced Quality Scoring',
          'Media URL Uniqueness Check',
          'Title & Text Similarity'
        ]
      },
      {
        name: '📊 Phase III - Quality Scoring & Assessment (PLANNED)',
        subfolders: [
          'Automated Quality Metrics',
          'Reporting Systems',
          'Modular Apps Script Architecture'
        ]
      },
      {
        name: '🧠 Phase IV - Intelligent Case Improvement (PLANNED)',
        subfolders: [
          'Similarity Analysis',
          'Curriculum Balancing',
          'Automated Refinement'
        ]
      },
      {
        name: '☁️ Phase V - AWS Integration & Production (FUTURE)',
        subfolders: [
          'Phase V.A - Prerequisites',
          'Phase V.B - AWS Infrastructure',
          'Phase V.C - Subscription Platform',
          'Phase V.D - Database Migration',
          'Phase V.E - AI Facilitator'
        ]
      }
    ];

    console.log('🏗️  Creating milestone folders...\n');

    const createdMilestones = {};

    for (const milestone of milestones) {
      console.log(`📁 Creating: ${milestone.name}`);

      const folder = await drive.files.create({
        requestBody: {
          name: milestone.name,
          mimeType: 'application/vnd.google-apps.folder',
          parents: [ER_SIM_DEV_FOLDER_ID]
        },
        fields: 'id, name'
      });

      const folderId = folder.data.id;
      createdMilestones[milestone.name] = {
        id: folderId,
        subfolders: {}
      };
      console.log(`   ✅ Created (ID: ${folderId})`);

      // Create subfolders
      if (milestone.subfolders && milestone.subfolders.length > 0) {
        for (const subfolderName of milestone.subfolders) {
          console.log(`   📂 Creating subfolder: ${subfolderName}`);

          const subfolder = await drive.files.create({
            requestBody: {
              name: subfolderName,
              mimeType: 'application/vnd.google-apps.folder',
              parents: [folderId]
            },
            fields: 'id, name'
          });

          createdMilestones[milestone.name].subfolders[subfolderName] = subfolder.data.id;
          console.log(`      ✅ Created (ID: ${subfolder.data.id})`);
        }
      }

      console.log('');
    }

    console.log('='.repeat(80));
    console.log('✅ MILESTONE FOLDERS CREATED SUCCESSFULLY\n');

    // Update folder mapping with milestones
    const mappingPath = path.join(__dirname, '../config/drive-folders.json');
    const existingMapping = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));

    existingMapping.milestones = createdMilestones;
    existingMapping.lastUpdated = new Date().toISOString();

    fs.writeFileSync(mappingPath, JSON.stringify(existingMapping, null, 2));
    console.log(`📄 Folder mapping updated: ${mappingPath}\n`);

    console.log('📋 MILESTONE FOLDER SUMMARY:\n');
    Object.entries(createdMilestones).forEach(([name, data]) => {
      console.log(`   ${name}`);
      console.log(`   └─ ID: ${data.id}`);
      console.log(`   └─ Subfolders: ${Object.keys(data.subfolders).length}`);
      console.log('');
    });

    console.log('='.repeat(80));
    console.log('🎯 Milestone Organization Complete!\n');
    console.log('Each phase now has dedicated folders for:');
    console.log('  • Work-in-progress files');
    console.log('  • Completed deliverables');
    console.log('  • Phase-specific documentation');
    console.log('  • Testing & validation results\n');
    console.log('='.repeat(80) + '\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

addMilestoneFolders().catch(console.error);
