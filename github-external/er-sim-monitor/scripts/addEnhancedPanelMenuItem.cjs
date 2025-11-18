/**
 * SURGICAL FIX: Add ONE menu item to onOpen() function
 *
 * Adds: menu.addItem('✨ Enhanced Categories', 'openEnhancedVisualPanel');
 *
 * This is the minimal possible change to provide menu access to the
 * enhanced visual panel with Symptom/System toggle.
 */

const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function main() {
  console.log('🔧 SURGICAL FIX: Add Enhanced Categories Menu Item\n');

  // Auth setup
  const token = JSON.parse(fs.readFileSync('./config/token.json', 'utf-8'));
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/oauth2callback'
  );
  oAuth2Client.setCredentials(token);

  const script = google.script({ version: 'v1', auth: oAuth2Client });
  const scriptId = process.env.APPS_SCRIPT_ID;

  // Step 1: Download current Code.gs
  console.log('📥 Step 1: Downloading current Code.gs...\n');

  const project = await script.projects.getContent({ scriptId });
  const codeFile = project.data.files.find(f => f.name === 'Code');

  if (!codeFile) {
    throw new Error('❌ Code.gs not found in project!');
  }

  console.log(`   ✅ Found Code.gs (${(codeFile.source.length / 1024).toFixed(1)} KB)\n`);

  // Step 2: Find onOpen() function
  console.log('🔍 Step 2: Locating onOpen() function...\n');

  const onOpenMatch = codeFile.source.match(/function onOpen\(\) \{[\s\S]*?\n\}/);

  if (!onOpenMatch) {
    throw new Error('❌ onOpen() function not found in Code.gs!');
  }

  const onOpenFunction = onOpenMatch[0];
  console.log(`   ✅ Found onOpen() function (${onOpenFunction.length} characters)\n`);

  // Step 3: Find insertion point
  console.log('🎯 Step 3: Finding insertion point...\n');

  const insertAfter = "menu.addItem('🧩 Categories & Pathways', 'runPathwayChainBuilder');";

  if (!onOpenFunction.includes(insertAfter)) {
    throw new Error('❌ Could not find Categories & Pathways menu item!');
  }

  console.log(`   ✅ Found insertion point after "Categories & Pathways"\n`);

  // Step 4: Create modified onOpen() function
  console.log('🔧 Step 4: Adding menu item...\n');

  const newMenuItem = "\n  menu.addItem('✨ Enhanced Categories', 'openEnhancedVisualPanel');";

  const modifiedOnOpen = onOpenFunction.replace(
    insertAfter,
    insertAfter + newMenuItem
  );

  // Step 5: Replace onOpen() in Code.gs
  console.log('💾 Step 5: Updating Code.gs...\n');

  const originalSize = (codeFile.source.length / 1024).toFixed(1);
  codeFile.source = codeFile.source.replace(onOpenFunction, modifiedOnOpen);
  const modifiedSize = (codeFile.source.length / 1024).toFixed(1);

  console.log(`   Original size: ${originalSize} KB`);
  console.log(`   Modified size: ${modifiedSize} KB`);
  console.log(`   Change: +${(modifiedSize - originalSize).toFixed(1)} KB\n`);

  // Step 6: Deploy
  console.log('🚀 Step 6: Deploying to Apps Script...\n');

  await script.projects.updateContent({
    scriptId: scriptId,
    requestBody: {
      files: project.data.files
    }
  });

  console.log('✅ Deployment complete!\n');

  // Summary
  console.log('📋 Summary:');
  console.log('   ✅ Added ONE line to onOpen() function');
  console.log('   ✅ New menu item: "✨ Enhanced Categories"');
  console.log('   ✅ Calls function: openEnhancedVisualPanel()');
  console.log('   ✅ All existing code unchanged\n');

  console.log('🎯 Next Steps:');
  console.log('   1. Refresh Google Sheets (F5)');
  console.log('   2. Click "🧠 Sim Builder" menu');
  console.log('   3. Look for "✨ Enhanced Categories" menu item');
  console.log('   4. Click it to open enhanced panel with toggle\n');

  console.log('🎉 Surgical fix complete - minimal change applied!\n');
}

main().catch(console.error);
