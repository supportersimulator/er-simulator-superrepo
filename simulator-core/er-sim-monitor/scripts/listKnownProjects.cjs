#!/usr/bin/env node

/**
 * Check all known Apps Script project IDs including the ones we created
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const KNOWN_PROJECT_IDS = [
  { name: 'TEST Script (original)', id: '1kkPZU3GsCCuu5IhTEOufmDT1Cb2rSQVB3Y3u1DPf87yoSV4WVtoNvd6i' },
  { name: 'ER Sim - ATSR Tool (Standalone)', id: '1Bkbm2MNA-YmXQEoMsIlC-VgEgHiQHO2EuMXR-yyxy9lYWl3eNcEHk_S-' },
  { name: 'TEST Menu Script (Bound) - Created today', id: '1HIw4Ok4G88YzHsECb5e_GvJH9XYefEY59pHXalFstiddLciyHXC06zNf' },
  { name: 'First attempt bound script', id: '1bwLs70zTwQsJxtAqA_yNJfyANjAW5x39YEY0VJhFPMamgDwb100qtqJD' }
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

async function checkProjects() {
  console.log('\n🔍 CHECKING ALL KNOWN APPS SCRIPT PROJECTS\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const auth = await authorize();
  const script = google.script({ version: 'v1', auth });

  // Load ULTIMATE code for comparison
  const ultimatePath = path.join(__dirname, 'Code_ULTIMATE_ATSR_FROM_DRIVE.gs');
  const ultimateCode = fs.existsSync(ultimatePath) ? fs.readFileSync(ultimatePath, 'utf8') : null;
  const ultimateSize = ultimateCode ? Math.round(ultimateCode.length / 1024) : 0;

  const results = [];

  for (const project of KNOWN_PROJECT_IDS) {
    console.log(`📜 ${project.name}`);
    console.log(`   🆔 ${project.id}\n`);

    try {
      const content = await script.projects.getContent({ scriptId: project.id });

      const files = content.data.files.map(f => f.name);
      console.log(`   📋 Files: ${files.join(', ')}`);

      const codeFile = content.data.files.find(f => f.name === 'Code');
      if (codeFile) {
        const hasATSR = codeFile.source.includes('runATSRTitleGenerator');
        const codeSize = Math.round(codeFile.source.length / 1024);

        console.log(`   ${hasATSR ? '✅' : '❌'} Has ATSR (${codeSize} KB)`);

        // Check if this is the ULTIMATE version
        if (ultimateCode && codeFile.source === ultimateCode) {
          console.log(`   🎯 EXACT MATCH with Code_ULTIMATE_ATSR.gs!`);
          results.push({ ...project, isUltimate: true, size: codeSize });
        } else {
          results.push({ ...project, hasATSR, size: codeSize });
        }

        // Check for other features
        const hasCache = content.data.files.some(f =>
          f.name.includes('Cache') || f.name.includes('Enrichment')
        );
        const hasCategories = content.data.files.some(f =>
          f.name.includes('Categories') || f.name.includes('Pathways')
        );

        if (hasCache) console.log(`   ✅ Has Multi-Step Cache`);
        if (hasCategories) console.log(`   ✅ Has Categories & Pathways`);
      }

      console.log(`   ✅ Accessible\n`);

    } catch (e) {
      console.log(`   ❌ Error: ${e.message}\n`);
      results.push({ ...project, error: e.message });
    }
  }

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('📊 SUMMARY:\n');

  const ultimate = results.find(r => r.isUltimate);
  if (ultimate) {
    console.log(`🎯 ULTIMATE ATSR FOUND IN:\n`);
    console.log(`   ${ultimate.name}`);
    console.log(`   ID: ${ultimate.id}\n`);
  }

  const withATSR = results.filter(r => r.hasATSR || r.isUltimate);
  console.log(`📜 Projects with ATSR: ${withATSR.length}\n`);
  withATSR.forEach(p => {
    console.log(`   • ${p.name} (${p.size} KB)${p.isUltimate ? ' 🎯 ULTIMATE' : ''}`);
    console.log(`     ${p.id}`);
  });

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('\n💡 PROJECT IDENTIFICATION:\n');

  console.log('Based on names and creation times:\n');
  console.log('📦 ORIGINAL PROJECT (your main working script):');
  console.log('   • TEST Script (original)');
  console.log('     ID: 1kkPZU3GsCCuu5IhTEOufmDT1Cb2rSQVB3Y3u1DPf87yoSV4WVtoNvd6i');
  console.log('     Has: Multi-Step Cache, Categories & Pathways\n');

  console.log('🔗 STANDALONE ATSR (created Nov 2):');
  console.log('   • ER Sim - ATSR Tool (Standalone)');
  console.log('     ID: 1Bkbm2MNA-YmXQEoMsIlC-VgEgHiQHO2EuMXR-yyxy9lYWl3eNcEHk_S-');
  console.log('     Has: ATSR code (133 KB)\n');

  console.log('🆕 NEWLY CREATED (today - for your spreadsheet):');
  console.log('   • TEST Menu Script (Bound)');
  console.log('     ID: 1HIw4Ok4G88YzHsECb5e_GvJH9XYefEY59pHXalFstiddLciyHXC06zNf');
  console.log('     Currently has: Production ATSR backup deployed\n');

  console.log('═══════════════════════════════════════════════════════════════\n');
}

checkProjects().catch(console.error);
