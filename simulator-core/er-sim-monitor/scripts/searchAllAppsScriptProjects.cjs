#!/usr/bin/env node

/**
 * Comprehensive search for ALL Apps Script projects
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

async function searchAll() {
  console.log('\n🔍 COMPREHENSIVE SEARCH FOR ALL APPS SCRIPT PROJECTS\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const auth = await authorize();
  const drive = google.drive({ version: 'v3', auth });
  const script = google.script({ version: 'v1', auth });

  // Load ULTIMATE code for comparison
  const ultimatePath = path.join(__dirname, 'Code_ULTIMATE_ATSR_FROM_DRIVE.gs');
  const ultimateCode = fs.existsSync(ultimatePath) ? fs.readFileSync(ultimatePath, 'utf8') : null;
  const ultimateSize = ultimateCode ? Math.round(ultimateCode.length / 1024) : 0;

  try {
    // Search ALL Apps Script files
    console.log('📂 Searching Drive for all Apps Script projects...\n');

    const response = await drive.files.list({
      q: "mimeType='application/vnd.google-apps.script' and trashed=false",
      fields: 'files(id, name, modifiedTime, createdTime, parents)',
      orderBy: 'modifiedTime desc',
      pageSize: 100
    });

    console.log(`✅ Found ${response.data.files.length} Apps Script projects\n`);
    console.log('═══════════════════════════════════════════════════════════════\n');

    const projects = [];

    for (const [index, file] of response.data.files.entries()) {
      const modifiedDate = new Date(file.modifiedTime);
      const createdDate = new Date(file.createdTime);

      console.log(`${index + 1}. 📜 ${file.name}`);
      console.log(`   🆔 ${file.id}`);
      console.log(`   📅 Modified: ${modifiedDate.toLocaleString()}`);
      console.log(`   🎂 Created: ${createdDate.toLocaleString()}`);

      const projectInfo = {
        name: file.name,
        id: file.id,
        modified: modifiedDate,
        created: createdDate,
        isContainerBound: file.parents && file.parents.length > 0
      };

      if (projectInfo.isContainerBound) {
        console.log(`   🔗 Container-bound`);
      } else {
        console.log(`   📦 Standalone`);
      }

      // Get project content
      try {
        const project = await script.projects.getContent({ scriptId: file.id });
        projectInfo.files = project.data.files.map(f => f.name);

        console.log(`   📋 Files: ${projectInfo.files.join(', ')}`);

        // Check for ATSR
        const codeFile = project.data.files.find(f => f.name === 'Code' || f.name.includes('ATSR'));
        if (codeFile) {
          const hasATSR = codeFile.source.includes('runATSRTitleGenerator');
          const codeSize = Math.round(codeFile.source.length / 1024);

          projectInfo.hasATSR = hasATSR;
          projectInfo.codeSize = codeSize;

          if (hasATSR) {
            console.log(`   ✅ Has ATSR (${codeSize} KB)`);

            // Compare with ULTIMATE
            if (ultimateCode && codeFile.source === ultimateCode) {
              console.log(`   🎯 EXACT MATCH with Code_ULTIMATE_ATSR.gs!`);
              projectInfo.isUltimate = true;
            } else if (Math.abs(codeSize - ultimateSize) <= 1) {
              console.log(`   ⚠️  Similar size to ULTIMATE (${ultimateSize} KB)`);
            }
          }
        }

        // Check for other components
        const hasCategories = project.data.files.some(f =>
          f.name.includes('Categories') || f.name.includes('Pathways')
        );
        const hasCache = project.data.files.some(f =>
          f.name.includes('Cache') || f.name.includes('Enrichment')
        );

        if (hasCategories) {
          console.log(`   ✅ Categories & Pathways`);
          projectInfo.hasCategories = true;
        }
        if (hasCache) {
          console.log(`   ✅ Multi-Step Cache`);
          projectInfo.hasCache = true;
        }

      } catch (e) {
        console.log(`   ❌ Error: ${e.message}`);
      }

      projects.push(projectInfo);
      console.log('');
    }

    // Summary
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📊 SUMMARY:\n');

    const atsrProjects = projects.filter(p => p.hasATSR);
    console.log(`📜 Projects with ATSR: ${atsrProjects.length}\n`);

    if (atsrProjects.length > 0) {
      atsrProjects.forEach((p, i) => {
        console.log(`${i + 1}. ${p.name}`);
        console.log(`   🆔 ${p.id}`);
        console.log(`   📅 ${p.modified.toLocaleDateString()}`);
        console.log(`   💾 ${p.codeSize} KB`);
        if (p.isUltimate) console.log(`   🎯 ULTIMATE VERSION!`);
        if (p.hasCategories) console.log(`   ✅ Categories`);
        if (p.hasCache) console.log(`   ✅ Cache`);
        console.log('');
      });
    }

    const ultimate = projects.find(p => p.isUltimate);
    if (ultimate) {
      console.log('═══════════════════════════════════════════════════════════════');
      console.log(`🎯 ULTIMATE ATSR FOUND IN:\n`);
      console.log(`   ${ultimate.name}`);
      console.log(`   ID: ${ultimate.id}\n`);
    }

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('\n💡 PROJECT CATEGORIZATION:\n');

    console.log('📦 ORIGINAL PROJECT (Multi-Step Cache + Categories):');
    const original = projects.find(p => p.hasCache && p.hasCategories);
    if (original) {
      console.log(`   ✅ ${original.name}`);
      console.log(`      ID: ${original.id}\n`);
    } else {
      console.log(`   ⚠️  Not found\n`);
    }

    console.log('🧪 TEST PROJECTS (feature-based or TEST in name):');
    const testProjects = projects.filter(p =>
      p.name.includes('TEST') || p.name.includes('Test') || p.name.includes('Feature')
    );
    testProjects.forEach(p => {
      console.log(`   • ${p.name}`);
      console.log(`     ID: ${p.id}`);
    });

    console.log('\n═══════════════════════════════════════════════════════════════\n');

  } catch (e) {
    console.log('❌ Error: ' + e.message + '\n');
    if (e.stack) {
      console.log(e.stack);
    }
  }
}

searchAll().catch(console.error);
