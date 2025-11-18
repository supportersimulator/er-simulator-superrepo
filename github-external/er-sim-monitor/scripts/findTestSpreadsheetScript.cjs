#!/usr/bin/env node

/**
 * FIND THE ACTUAL SCRIPT ATTACHED TO TEST SPREADSHEET
 * Use Apps Script API to find what project the spreadsheet is using
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const TEST_SPREADSHEET_ID = '1t3qN8e537ghl38GTsXbVG8ML8OZtK2XyUpDiMQjnGAI';

console.log('\n🔍 FINDING ACTUAL SCRIPT ATTACHED TO TEST SPREADSHEET\n');
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

async function findScript() {
  try {
    const auth = await authorize();
    const script = google.script({ version: 'v1', auth });
    const drive = google.drive({ version: 'v3', auth });

    console.log(`🎯 TEST Spreadsheet ID: ${TEST_SPREADSHEET_ID}\n`);

    // List ALL Apps Script projects
    console.log('📋 Listing ALL Apps Script projects in your account...\n');

    const projectsResponse = await script.projects.list({
      pageSize: 100
    });

    const projects = projectsResponse.data.projects || [];

    console.log(`📚 FOUND ${projects.length} TOTAL APPS SCRIPT PROJECTS:\n`);
    console.log('═══════════════════════════════════════════════════════════════\n');

    // Check each project to see if it's bound to our spreadsheet
    for (const project of projects) {
      const details = await script.projects.get({
        scriptId: project.scriptId
      });

      const isContainerBound = details.data.parentId && details.data.parentId === TEST_SPREADSHEET_ID;

      console.log(`${project.title || 'Untitled'}`);
      console.log(`   Script ID: ${project.scriptId}`);
      console.log(`   Parent ID: ${details.data.parentId || 'None (standalone)'}`);

      if (isContainerBound) {
        console.log(`   🎯 THIS IS THE BOUND SCRIPT FOR TEST SPREADSHEET!\n`);
        console.log(`   ═══════════════════════════════════════════════════════════════\n`);
        console.log(`   🔥 CRITICAL FINDING:\n`);
        console.log(`   This is the script the spreadsheet is ACTUALLY using:\n`);
        console.log(`   Script ID: ${project.scriptId}\n`);
        console.log(`   But we've been deploying to: 1HIw4Ok4G88YzHsECb5e_GvJH9XYefEY59pHXalFstiddLciyHXC06zNf\n`);
        console.log(`   🔥 THIS IS WHY YOU'RE SEEING THE OLD VERSION!\n`);
        console.log(`   ═══════════════════════════════════════════════════════════════\n`);

        // Download this project's code
        console.log(`   📥 Downloading ACTUAL bound project code...\n`);
        const content = await script.projects.getContent({
          scriptId: project.scriptId
        });

        const codeFile = content.data.files.find(f => f.name === 'Code');
        if (codeFile) {
          const actualSize = (codeFile.source.length / 1024).toFixed(1);
          console.log(`   📊 ACTUAL bound code size: ${actualSize} KB\n`);

          // Save it
          const savePath = path.join(__dirname, '../backups/ACTUAL-BOUND-TEST-CODE-2025-11-06.gs');
          fs.writeFileSync(savePath, codeFile.source, 'utf8');
          console.log(`   💾 Saved to: ${savePath}\n`);

          // Check for mystery button
          const hasMysteryButton = codeFile.source.includes('regenerateMoreMysterious');
          const hasMysteryFunction = codeFile.source.includes('generateMysteriousSparkTitles');

          console.log(`   🔍 Mystery button present: ${hasMysteryButton}\n`);
          console.log(`   🔍 Mystery function present: ${hasMysteryFunction}\n`);

          if (!hasMysteryButton) {
            console.log(`   🔴 THIS IS THE OLD VERSION - NO MYSTERY BUTTON!\n`);
          }
        }

        console.log(`   ═══════════════════════════════════════════════════════════════\n`);
      } else if (details.data.parentId) {
        console.log(`   (Bound to different spreadsheet: ${details.data.parentId})\n`);
      } else {
        console.log(`   (Standalone project)\n`);
      }
    }

    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('📝 SUMMARY:\n');
    console.log('   If we found a bound script above, we need to deploy to THAT project\n');
    console.log('   instead of the one we\'ve been using!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

findScript();
