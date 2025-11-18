/**
 * Create New Deployment Version
 * 
 * Apps Script caches compiled code. Even though we updated the source,
 * the old compiled version is still being served.
 * 
 * Solution: Create a NEW deployment version to force recompilation.
 */

const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function main() {
  console.log('🚀 Creating New Apps Script Deployment\n');
  console.log('══════════════════════════════════════════════════════════════\n');

  const token = JSON.parse(fs.readFileSync('./config/token.json', 'utf-8'));
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/oauth2callback'
  );
  oAuth2Client.setCredentials(token);

  const script = google.script({ version: 'v1', auth: oAuth2Client });
  const scriptId = process.env.APPS_SCRIPT_ID;

  console.log('📋 Current situation:');
  console.log('  - Code is updated correctly in source');
  console.log('  - BUT Apps Script is serving cached/compiled old version');
  console.log('  - Need to force recompilation with new deployment\n');

  try {
    // Create a new version
    console.log('📦 Creating new version...\n');
    
    const version = await script.projects.versions.create({
      scriptId: scriptId,
      requestBody: {
        description: 'Fix AI Categorization - Remove syntax errors and conflicts'
      }
    });

    console.log('✅ Created version:', version.data.versionNumber);
    console.log('');

    // Create a new deployment
    console.log('🚀 Creating new deployment...\n');

    const deployment = await script.projects.deployments.create({
      scriptId: scriptId,
      requestBody: {
        versionNumber: version.data.versionNumber,
        description: 'AI Categorization Fix - ' + new Date().toISOString().split('T')[0]
      }
    });

    console.log('✅ Deployment created:', deployment.data.deploymentId);
    console.log('');

  } catch (error) {
    console.log('⚠️  Deployment API not available or needs permissions');
    console.log('   Error:', error.message);
    console.log('');
    console.log('📋 MANUAL FIX NEEDED:\n');
    console.log('══════════════════════════════════════════════════════════════\n');
    console.log('Go to Apps Script IDE and do this manually:\n');
    console.log('1. Open: https://script.google.com/home/projects/' + scriptId + '/edit');
    console.log('2. Click "Deploy" → "Test deployments"');
    console.log('3. Click the "New deployment" button');
    console.log('4. Choose "Web app" deployment type');
    console.log('5. Click "Deploy"');
    console.log('');
    console.log('OR simply:');
    console.log('1. In Apps Script IDE, click "Run" on any function');
    console.log('2. This forces recompilation');
    console.log('3. Then test in Google Sheets again\n');
    return;
  }

  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('✅ NEW DEPLOYMENT CREATED!\n');
  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('Now test:');
  console.log('  1. Close AI Categorization panel');
  console.log('  2. Hard refresh Google Sheet (Cmd+Shift+R)');
  console.log('  3. Open AI Categorization panel');
  console.log('  4. Should work with NO syntax errors!\n');
}

main().catch(console.error);
