#!/usr/bin/env node

/**
 * EXAMINE ALL APPS SCRIPT PROJECTS
 * Check what files are in each project to identify duplicates
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

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

async function examine() {
  try {
    const auth = await authorize();
    const script = google.script({ version: 'v1', auth });
    const drive = google.drive({ version: 'v3', auth });

    console.log('\n🔍 EXAMINING ALL APPS SCRIPT PROJECTS\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

    // Search for all Apps Script projects
    const projects = await drive.files.list({
      q: "mimeType='application/vnd.google-apps.script'",
      fields: 'files(id, name, createdTime, modifiedTime)',
      orderBy: 'modifiedTime desc',
      pageSize: 20
    });

    console.log(`Found ${projects.data.files.length} Apps Script projects:\n`);

    const projectDetails = [];

    for (const proj of projects.data.files) {
      console.log(`📦 ${proj.name}`);
      console.log(`   ID: ${proj.id}`);
      console.log(`   Created: ${new Date(proj.createdTime).toLocaleString()}`);
      console.log(`   Modified: ${new Date(proj.modifiedTime).toLocaleString()}`);

      try {
        // Get project contents
        const content = await script.projects.getContent({ scriptId: proj.id });

        const files = content.data.files.filter(f => f.type === 'SERVER_JS');
        const totalSize = files.reduce((sum, f) => sum + (f.source ? f.source.length : 0), 0);
        const sizeKB = Math.round(totalSize / 1024);

        console.log(`   Files: ${files.length} .gs files (${sizeKB} KB total)`);

        files.forEach(f => {
          const size = f.source ? Math.round(f.source.length / 1024) : 0;
          console.log(`      • ${f.name}.gs (${size} KB)`);
        });

        // Check for specific features
        const features = [];
        const allSource = files.map(f => f.source || '').join('\n');

        if (allSource.includes('function onOpen()')) features.push('Has menu (onOpen)');
        if (allSource.includes('TEST Tools')) features.push('TEST Tools menu');
        if (allSource.includes('preCacheRichData')) features.push('Cache system');
        if (allSource.includes('runPathwayChainBuilder')) features.push('Pathway builder');
        if (allSource.includes('showFieldSelector')) features.push('Field selector');
        if (allSource.includes('getRecommendedFields')) features.push('AI recommendations');

        if (features.length > 0) {
          console.log(`   Features: ${features.join(', ')}`);
        }

        projectDetails.push({
          name: proj.name,
          id: proj.id,
          created: proj.createdTime,
          modified: proj.modifiedTime,
          fileCount: files.length,
          sizeKB: sizeKB,
          fileNames: files.map(f => f.name),
          features: features
        });

      } catch (error) {
        console.log(`   ⚠️  Could not read project contents: ${error.message}`);
      }

      console.log('');
    }

    // Identify duplicates
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('🔍 DUPLICATE ANALYSIS:\n');

    const testProjects = projectDetails.filter(p => p.name.includes('TEST'));

    if (testProjects.length > 1) {
      console.log(`⚠️  Found ${testProjects.length} projects with "TEST" in name:\n`);

      testProjects.forEach(p => {
        console.log(`   • ${p.name}`);
        console.log(`     Files: ${p.fileNames.join(', ')}`);
        console.log(`     Features: ${p.features.join(', ')}`);
        console.log(`     Modified: ${new Date(p.modified).toLocaleString()}`);
        console.log('');
      });

      // Check if they're identical
      const signatures = testProjects.map(p => JSON.stringify([p.fileNames.sort(), p.sizeKB]));
      const uniqueSigs = new Set(signatures);

      if (uniqueSigs.size < testProjects.length) {
        console.log('🚨 FOUND DUPLICATES! Some TEST projects have identical files.\n');
      }
    }

    // Recommendations
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('💡 RECOMMENDATIONS:\n');

    const gptFormatter = projectDetails.find(p => p.name === 'GPT Formatter');
    if (gptFormatter) {
      console.log('✅ GPT Formatter (KEEP - original main project)');
      console.log(`   ${gptFormatter.features.join(', ')}\n`);
    }

    const testBound = testProjects.filter(p => p.name.includes('Bound'));
    if (testBound.length > 1) {
      console.log(`⚠️  ${testBound.length} "TEST Menu Script (Bound)" projects`);
      console.log('   These are container-bound scripts (attached to spreadsheets)');
      console.log('   Check which spreadsheet each is bound to before deleting\n');
    }

    const testFeature = testProjects.filter(p => p.name.includes('Feature_Based'));
    if (testFeature.length > 1) {
      console.log(`⚠️  ${testFeature.length} "TEST_Feature_Based_Code" projects`);
      console.log('   These appear to be duplicates - likely only need ONE\n');
    }

    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    process.exit(1);
  }
}

examine();
