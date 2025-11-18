#!/usr/bin/env node

/**
 * CHECK ALL VISIBLE PROJECTS TO FIND WHICH IS BOUND TO TEST SPREADSHEET
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const TEST_SPREADSHEET_ID = '1t3qN8e537ghl38GTsXbVG8ML8OZtK2XyUpDiMQjnGAI';

// Projects visible in user's screenshot
const KNOWN_PROJECTS = [
  { name: 'Advanced Cache System', id: null },
  { name: 'GPT Formatter', id: '1orJ__UUViG-gdSOHXt2VSGzo--ASib9XdVLVCApccKujWnqTuxq7wHIw' },
  { name: 'TEST Tools - Monolithic Environment', id: null },
  { name: 'Title Optimizer', id: null },
  { name: 'TEST Menu Script (Bound) #1', id: '1HIw4Ok4G88YzHsECb5e_GvJH9XYefEY59pHXalFstiddLciyHXC06zNf' }
];

console.log('\n🔍 CHECKING ALL PROJECTS FOR TEST SPREADSHEET BINDING\n');
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

async function checkAllProjects() {
  try {
    const auth = await authorize();
    const script = google.script({ version: 'v1', auth });

    console.log(`🎯 Looking for project bound to spreadsheet: ${TEST_SPREADSHEET_ID}\n`);
    console.log('═══════════════════════════════════════════════════════════════\n');

    for (const project of KNOWN_PROJECTS) {
      if (!project.id) {
        console.log(`⏭️  Skipping "${project.name}" (ID unknown)\n`);
        continue;
      }

      console.log(`📦 Checking: ${project.name}`);
      console.log(`   ID: ${project.id}`);

      try {
        const details = await script.projects.get({
          scriptId: project.id
        });

        const parentId = details.data.parentId;

        if (parentId) {
          console.log(`   Parent: ${parentId}`);

          if (parentId === TEST_SPREADSHEET_ID) {
            console.log(`   🎯 ✅ THIS IS THE BOUND PROJECT FOR TEST SPREADSHEET!\n`);
            console.log(`   ═══════════════════════════════════════════════════════════════\n`);
            console.log(`   🔥 FOUND IT!\n`);
            console.log(`   Project Name: ${project.name}\n`);
            console.log(`   Project ID: ${project.id}\n`);
            console.log(`   🔥 THIS IS THE PROJECT WE NEED TO UPDATE!\n`);
            console.log(`   ═══════════════════════════════════════════════════════════════\n`);

            // Download this project's code
            console.log(`   📥 Downloading current code from this project...\n`);
            const content = await script.projects.getContent({
              scriptId: project.id
            });

            const codeFile = content.data.files.find(f => f.name === 'Code');
            if (codeFile) {
              const size = (codeFile.source.length / 1024).toFixed(1);
              console.log(`   📊 Current code size: ${size} KB\n`);

              // Check for mystery button
              const hasMysteryButton = codeFile.source.includes('regenerateMoreMysterious');
              const hasMysteryFunction = codeFile.source.includes('generateMysteriousSparkTitles');

              console.log(`   🔍 Mystery button HTML: ${hasMysteryButton ? '✅ PRESENT' : '❌ MISSING'}`);
              console.log(`   🔍 Mystery backend function: ${hasMysteryFunction ? '✅ PRESENT' : '❌ MISSING'}\n`);

              // Save it
              const savePath = path.join(__dirname, '../backups/ACTUAL-BOUND-PROJECT-CODE-2025-11-06.gs');
              fs.writeFileSync(savePath, codeFile.source, 'utf8');
              console.log(`   💾 Saved to: ${savePath}\n`);

              if (!hasMysteryButton) {
                console.log(`   🔴 THIS PROJECT HAS THE OLD CODE!\n`);
                console.log(`   We need to deploy the clean mystery button code to THIS project.\n`);
              } else {
                console.log(`   ✅ This project already has the mystery button code.\n`);
                console.log(`   The issue might be something else.\n`);
              }
            }

            return;
          } else {
            console.log(`   (Bound to different parent: ${parentId})\n`);
          }
        } else {
          console.log(`   Parent: None (standalone project)\n`);
        }

      } catch (error) {
        console.log(`   ❌ Error checking project: ${error.message}\n`);
      }
    }

    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('❌ NO BOUND PROJECT FOUND IN KNOWN PROJECTS\n');
    console.log('The bound project might be:\n');
    console.log('   1. "Advanced Cache System" (need ID)\n');
    console.log('   2. "TEST Tools - Monolithic Environment" (need ID)\n');
    console.log('   3. "Title Optimizer" (need ID)\n');
    console.log('   4. A completely different project\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

checkAllProjects();
