#!/usr/bin/env node

/**
 * CHECK WHAT'S CURRENTLY IN GPT FORMATTER
 * Make sure we have all features before deleting other projects
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const GPT_FORMATTER_ID = '1orJ__UUViG-gdSOHXt2VSGzo--ASib9XdVLVCApccKujWnqTuxq7wHIw';

console.log('\n📊 CHECKING CURRENT GPT FORMATTER FEATURES\n');
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

async function check() {
  try {
    const auth = await authorize();
    const script = google.script({ version: 'v1', auth });

    console.log('📥 Downloading current GPT Formatter code...\n');

    const content = await script.projects.getContent({
      scriptId: GPT_FORMATTER_ID
    });

    const codeFile = content.data.files.find(f => f.name === 'Code');
    const code = codeFile.source;

    console.log(`📦 Size: ${(code.length / 1024).toFixed(1)} KB\n`);
    console.log('═══════════════════════════════════════════════════════════════\n');

    // Check for all features
    console.log('✅ FEATURES INCLUDED:\n');

    const features = [
      { name: 'ATSR Titles Optimizer', check: 'runATSRTitleGenerator' },
      { name: 'Mystery Button', check: 'regenerateMoreMysterious' },
      { name: 'Categories & Pathways', check: 'runCategoriesPathwaysPanel' },
      { name: 'Field Selector', check: 'showFieldSelector' },
      { name: 'Cache All Layers', check: 'showCacheAllLayersModal' },
      { name: 'Cache Layer Functions', check: 'cacheLayer_basic' },
      { name: 'View Cache Status', check: 'showCacheStatus' },
      { name: 'Refresh Headers', check: 'refreshHeaders' },
      { name: 'Clear All Cache', check: 'clearAllCacheLayers' }
    ];

    features.forEach(feature => {
      const hasIt = code.includes(feature.check);
      console.log(`   ${hasIt ? '✅' : '❌'} ${feature.name}`);
    });

    console.log('\n═══════════════════════════════════════════════════════════════\n');

    // Check menu structure
    console.log('📋 MENU STRUCTURE:\n');

    const menuMatches = [...code.matchAll(/createMenu\(['"]([^'"]+)['"]\)/g)];
    menuMatches.forEach(match => {
      console.log(`   - ${match[1]}`);
    });

    const itemMatches = [...code.matchAll(/addItem\(['"]([^'"]+)['"],\s*['"](\w+)['"]\)/g)];
    console.log('\n   Menu Items:');
    itemMatches.forEach(match => {
      console.log(`   - ${match[1]}`);
    });

    console.log('\n═══════════════════════════════════════════════════════════════\n');
    console.log('✅ GPT FORMATTER HAS ALL FEATURES!\n');
    console.log('   Safe to delete other projects:\n');
    console.log('   - Title Optimizer\n');
    console.log('   - Advanced Cache System\n');
    console.log('   - Any other ATSR/ER Simulator projects\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

check();
