#!/usr/bin/env node

/**
 * Find ALL Apps Script projects and identify which has the ULTIMATE ATSR
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

async function findAll() {
  console.log('\n🔍 FINDING ALL APPS SCRIPT PROJECTS\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const auth = await authorize();
  const drive = google.drive({ version: 'v3', auth });
  const script = google.script({ version: 'v1', auth });

  try {
    // Search for all Apps Script projects
    console.log('📂 Searching for Apps Script projects...\n');

    const response = await drive.files.list({
      q: "mimeType='application/vnd.google-apps.script' and trashed=false",
      fields: 'files(id, name, modifiedTime, createdTime, parents)',
      orderBy: 'modifiedTime desc',
      pageSize: 50
    });

    console.log(`✅ Found ${response.data.files.length} Apps Script projects:\n`);
    console.log('═══════════════════════════════════════════════════════════════\n');

    const projects = [];

    for (const file of response.data.files) {
      const modifiedDate = new Date(file.modifiedTime);
      const createdDate = new Date(file.createdTime);

      console.log(`📜 ${file.name}`);
      console.log(`   🆔 ID: ${file.id}`);
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
        console.log(`   🔗 Container-bound to: ${file.parents[0]}`);
      } else {
        console.log(`   📦 Standalone project`);
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

          console.log(`   ${hasATSR ? '✅' : '❌'} Has ATSR (${codeSize} KB)`);

          // Compare with ULTIMATE version
          const ultimatePath = path.join(__dirname, 'Code_ULTIMATE_ATSR_FROM_DRIVE.gs');
          if (fs.existsSync(ultimatePath)) {
            const ultimateCode = fs.readFileSync(ultimatePath, 'utf8');
            const ultimateSize = Math.round(ultimateCode.length / 1024);

            if (codeFile.source === ultimateCode) {
              console.log(`   🎯 EXACT MATCH with Code_ULTIMATE_ATSR.gs!`);
              projectInfo.isUltimate = true;
            } else if (Math.abs(codeSize - ultimateSize) <= 1) {
              console.log(`   ⚠️  Similar size to ULTIMATE (${ultimateSize} KB) but different content`);
              projectInfo.isSimilar = true;
            }
          }
        }

        // Check for other features
        const hasCategories = project.data.files.some(f =>
          f.name.includes('Categories') || f.name.includes('Pathways')
        );
        const hasCache = project.data.files.some(f =>
          f.name.includes('Cache') || f.name.includes('Enrichment')
        );

        if (hasCategories) {
          console.log(`   ✅ Has Categories & Pathways`);
          projectInfo.hasCategories = true;
        }
        if (hasCache) {
          console.log(`   ✅ Has Multi-Step Cache`);
          projectInfo.hasCache = true;
        }

      } catch (e) {
        console.log(`   ❌ Could not access project: ${e.message}`);
      }

      projects.push(projectInfo);
      console.log('');
    }

    // Summary
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📊 SUMMARY:\n');

    const atsrProjects = projects.filter(p => p.hasATSR);
    console.log(`📜 Projects with ATSR: ${atsrProjects.length}\n`);

    atsrProjects.forEach((p, index) => {
      console.log(`${index + 1}. ${p.name}`);
      console.log(`   🆔 ${p.id}`);
      console.log(`   📅 ${p.modified.toLocaleString()}`);
      console.log(`   📦 ${p.isContainerBound ? 'Container-bound' : 'Standalone'}`);
      console.log(`   💾 ${p.codeSize} KB`);
      if (p.isUltimate) {
        console.log(`   🎯 THIS IS THE ULTIMATE VERSION!`);
      }
      if (p.hasCategories) console.log(`   ✅ Categories & Pathways`);
      if (p.hasCache) console.log(`   ✅ Multi-Step Cache`);
      console.log('');
    });

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('\n💡 RECOMMENDATIONS:\n');

    const ultimate = projects.find(p => p.isUltimate);
    if (ultimate) {
      console.log(`✅ ULTIMATE ATSR found in: ${ultimate.name}`);
      console.log(`   ID: ${ultimate.id}\n`);
    } else {
      console.log('⚠️  Could not find exact ULTIMATE match\n');
    }

    // Identify likely original vs test
    const standalone = projects.filter(p => !p.isContainerBound && p.hasATSR);
    const containerBound = projects.filter(p => p.isContainerBound && p.hasATSR);

    if (standalone.length > 0) {
      console.log('📦 STANDALONE PROJECTS (likely your main working scripts):\n');
      standalone.forEach(p => {
        console.log(`   • ${p.name} (${p.id})`);
        console.log(`     Created: ${p.created.toLocaleDateString()}`);
      });
      console.log('');
    }

    if (containerBound.length > 0) {
      console.log('🔗 CONTAINER-BOUND PROJECTS (attached to spreadsheets):\n');
      containerBound.forEach(p => {
        console.log(`   • ${p.name} (${p.id})`);
        console.log(`     Created: ${p.created.toLocaleDateString()}`);
      });
      console.log('');
    }

    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (e) {
    console.log('❌ Error: ' + e.message + '\n');
    if (e.stack) {
      console.log(e.stack);
    }
  }
}

findAll().catch(console.error);
