#!/usr/bin/env node

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

require('dotenv').config();

const TOKEN_PATH = path.join(__dirname, '..', 'config', 'token.json');
const CREDENTIALS_PATH = path.join(__dirname, '..', 'config', 'credentials.json');
const SCRIPT_ID = process.env.APPS_SCRIPT_ID;

async function findAllPanelReferences() {
  console.log('🔍 Searching for openCategoriesPathwaysPanel references\n');

  try {
    const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH));
    const { client_secret, client_id, redirect_uris } = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
    const token = JSON.parse(fs.readFileSync(TOKEN_PATH));
    oAuth2Client.setCredentials(token);

    const script = google.script({ version: 'v1', auth: oAuth2Client });
    const projectResponse = await script.projects.getContent({ scriptId: SCRIPT_ID });
    const files = projectResponse.data.files;

    console.log('📊 Files:', files.map(f => f.name).join(', '));
    console.log();

    const results = [];

    files.forEach(file => {
      const content = file.source || '';
      const lines = content.split('\n');

      lines.forEach((line, idx) => {
        if (line.includes('openCategoriesPathwaysPanel')) {
          let type = 'reference';
          if (line.includes('function openCategoriesPathwaysPanel')) type = 'FUNCTION_DEF';
          else if (line.match(/openCategoriesPathwaysPanel\(/)) type = 'FUNCTION_CALL';
          else if (line.includes('addItem') || line.includes('menu')) type = 'MENU_ITEM';

          results.push({
            file: file.name,
            line: idx + 1,
            type: type,
            code: line.trim().substring(0, 100)
          });
        }
      });
    });

    console.log(`Found ${results.length} references:\n`);

    const byType = {};
    results.forEach(r => {
      if (!byType[r.type]) byType[r.type] = [];
      byType[r.type].push(r);
    });

    Object.keys(byType).forEach(type => {
      console.log(`\n${type} (${byType[type].length}):`);
      byType[type].forEach(r => {
        console.log(`  ${r.file}:${r.line}`);
        console.log(`    ${r.code}`);
      });
    });

    console.log('\n' + '='.repeat(60));
    console.log('\n🔬 ANALYSIS:\n');

    const defs = (byType['FUNCTION_DEF'] || []).length;
    const calls = (byType['FUNCTION_CALL'] || []).length;
    const menuItems = (byType['MENU_ITEM'] || []).length;

    console.log(`Function definitions: ${defs}`);
    console.log(`Function calls: ${calls}`);
    console.log(`Menu items: ${menuItems}`);
    console.log('');

    if (defs > 1) {
      console.log(`⚠️  COLLISION: ${defs} function definitions found`);
      console.log('   Apps Script will use the last one loaded\n');
    }

    if (calls === 0 && menuItems === 0) {
      console.log('⚠️  WARNING: Function is defined but NEVER called!');
      console.log('   This function may be orphaned or called externally\n');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

findAllPanelReferences();
