#!/usr/bin/env node

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const PROD_SCRIPT_ID = '1Bkbm2MNA-YmXQEoMsIlC-VgEgHiQHO2EuMXR-yyxy9lYWl3eNcEHk_S-';

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

async function forceRefresh() {
  console.log('\n🔄 FORCING MENU REFRESH\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const auth = await authorize();
  const script = google.script({ version: 'v1', auth });

  try {
    // Execute the onOpen function directly
    console.log('📞 Calling onOpen() function directly...\n');
    
    const response = await script.scripts.run({
      scriptId: PROD_SCRIPT_ID,
      requestBody: {
        function: 'onOpen',
        devMode: false
      }
    });

    if (response.data.error) {
      console.log('❌ Error executing onOpen():\n');
      console.log(`   ${response.data.error.message}\n`);
      
      if (response.data.error.details) {
        console.log('   Details:');
        response.data.error.details.forEach(detail => {
          console.log(`      ${detail.errorMessage}`);
        });
      }
    } else {
      console.log('✅ onOpen() executed successfully!\n');
      console.log('🎯 RESULT:\n');
      console.log('   Both menus should now be visible:');
      console.log('      • 🧠 Sim Builder');
      console.log('      • 🧪 TEST\n');
      console.log('📋 NEXT STEPS:\n');
      console.log('   1. Refresh your Google Sheet (Cmd+R or Ctrl+R)');
      console.log('   2. Look for the TEST menu in the menu bar');
      console.log('   3. You should see the toast: "✅ Sim Builder + TEST menus loaded"\n');
    }

    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (e) {
    console.log('\n❌ Failed: ' + e.message + '\n');
    
    if (e.message.includes('PERMISSION_DENIED')) {
      console.log('⚠️  API execution is not enabled for this project.\n');
      console.log('💡 ALTERNATIVE SOLUTION:\n');
      console.log('   1. Open your spreadsheet');
      console.log('   2. Go to Extensions → Apps Script');
      console.log('   3. Click Run → Select "onOpen"');
      console.log('   4. Click Run button');
      console.log('   5. Return to your sheet - menus should appear\n');
    }
    
    if (e.stack) {
      console.log('Stack trace:', e.stack);
    }
  }
}

forceRefresh().catch(console.error);
