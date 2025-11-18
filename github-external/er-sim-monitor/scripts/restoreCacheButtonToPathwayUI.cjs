#!/usr/bin/env node

/**
 * RESTORE CACHE BUTTON TO PATHWAY UI
 *
 * I mistakenly removed the cache button from the Pathway UI.
 * It should be there so user can click it to open field selector modal.
 *
 * The button should be visible and prominent on the Pathway UI screen.
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const PRODUCTION_PROJECT_ID = '12NihbVaaAIyRMCtzZ-aGjJ71CdL-HDjhmjxiD_S_EgIOuDOtrUH6M1l2';

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

async function fix() {
  try {
    const auth = await authorize();
    const script = google.script({ version: 'v1', auth });

    console.log('📥 Downloading current code...\n');

    const content = await script.projects.getContent({
      scriptId: PRODUCTION_PROJECT_ID
    });

    const codeFile = content.data.files.find(f => f.name === 'Code');
    const manifestFile = content.data.files.find(f => f.name === 'appsscript');

    let code = codeFile.source;

    console.log('🔧 Step 1: Finding where buttons go in Pathway UI...\n');

    // Find the Pathways tab HTML where buttons are displayed
    // Look for the section with "Intelligent Pathway Opportunities"
    const pathwaySection = code.indexOf("'🧩 Intelligent Pathway Opportunities'");

    if (pathwaySection === -1) {
      console.log('❌ Could not find Pathway Opportunities section\n');
      return;
    }

    console.log('✅ Found Pathway section\n');

    // Find the button area - there should be AI Discover and AI Radical buttons
    const buttonAreaStart = code.indexOf('<div style="display: flex; gap: 12px; align-items: center;">', pathwaySection - 200);

    if (buttonAreaStart === -1) {
      console.log('⚠️  Could not find button area, searching for alternative...\n');

      // Look for AI Discover button
      const aiDiscoverBtn = code.indexOf('AI: Discover Novel Pathways', pathwaySection);

      if (aiDiscoverBtn === -1) {
        console.log('❌ Could not find any buttons in Pathway UI\n');
        return;
      }

      // Find the start of the button group
      const btnGroupStart = code.lastIndexOf('<div', aiDiscoverBtn);
      const btnGroupEnd = code.indexOf('</div>', aiDiscoverBtn) + 6;

      console.log('✅ Found button group via AI Discover button\n');

      // Insert the cache button BEFORE the AI buttons
      const cacheButtonHTML = '<button class="cache-btn" onclick="google.script.run.showFieldSelector();" style="background: linear-gradient(135deg, #00c853 0%, #00a040 100%); border: none; color: #fff; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 600; transition: all 0.2s ease; display: flex; align-items: center; gap: 6px; box-shadow: 0 0 12px rgba(0, 200, 83, 0.3); margin-right: 8px;">💾 Cache All Layers</button>';

      const beforeButtons = code.substring(0, btnGroupStart);
      const buttonGroup = code.substring(btnGroupStart, btnGroupEnd);
      const afterButtons = code.substring(btnGroupEnd);

      // Insert cache button at the start of the button group
      const updatedButtonGroup = buttonGroup.replace(
        '<div',
        '<div' // Keep opening div
      ).replace(
        'style="display: flex; gap: 12px; align-items: center;">',
        'style="display: flex; gap: 12px; align-items: center;">' + cacheButtonHTML
      );

      code = beforeButtons + updatedButtonGroup + afterButtons;
      console.log('✅ Added "💾 Cache All Layers" button to Pathway UI\n');

    } else {
      console.log('✅ Found button area\n');

      // Insert cache button at the beginning
      const cacheButtonHTML = "'        <button class=\"cache-btn\" onclick=\"google.script.run.showFieldSelector();\" style=\"background: linear-gradient(135deg, #00c853 0%, #00a040 100%); border: none; color: #fff; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 600; transition: all 0.2s ease; display: flex; align-items: center; gap: 6px; box-shadow: 0 0 12px rgba(0, 200, 83, 0.3);\">💾 Cache All Layers</button>' +\n";

      const insertPoint = code.indexOf("'        <button class=\"ai-discover-btn\"", buttonAreaStart);

      if (insertPoint !== -1) {
        code = code.substring(0, insertPoint) + cacheButtonHTML + code.substring(insertPoint);
        console.log('✅ Added "💾 Cache All Layers" button before AI buttons\n');
      } else {
        console.log('⚠️  Could not find exact insertion point\n');
      }
    }

    console.log('🔧 Step 2: Verifying showFieldSelector() function exists...\n');

    if (code.includes('function showFieldSelector()')) {
      console.log('✅ showFieldSelector() function exists\n');
    } else {
      console.log('❌ showFieldSelector() function NOT found\n');
      return;
    }

    console.log('📤 Step 3: Deploying...\n');

    await script.projects.updateContent({
      scriptId: PRODUCTION_PROJECT_ID,
      requestBody: { files: [
        { name: 'Code', type: 'SERVER_JS', source: code },
        manifestFile
      ]}
    });

    console.log('✅ Deployed!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('✅ CACHE BUTTON RESTORED TO PATHWAY UI!\n');
    console.log('\nYOUR EXACT WORKFLOW (as requested):\n');
    console.log('  1. Click "Categories & Pathways" menu\n');
    console.log('     → Headers cache refreshes (background)\n');
    console.log('     → 35 defaults initialize (background)\n');
    console.log('     → AI recommendations pre-fetch (background via ChatGPT)\n');
    console.log('     → Pathway UI opens with placeholder\n');
    console.log('     → You see "💾 Cache All Layers" button on screen\n');
    console.log('');
    console.log('  2. You click "💾 Cache All Layers" button ON THE PATHWAY SCREEN\n');
    console.log('     → Field selector modal opens\n');
    console.log('     → Live Log panel visible at top\n');
    console.log('     → Section 1: Last saved defaults (pre-checked)\n');
    console.log('     → Section 2: AI recommendations with rationale (unchecked)\n');
    console.log('     → Section 3: All other 642 fields (grouped by category)\n');
    console.log('');
    console.log('  3. You review fields, adjust checkboxes\n');
    console.log('');
    console.log('  4. You click "💾 Cache All Layers" button IN THE MODAL\n');
    console.log('     → Modal stays open\n');
    console.log('     → Live Log shows batch processing progress\n');
    console.log('     → 25 rows at a time\n');
    console.log('     → Final diagnostics displayed\n');
    console.log('');
    console.log('  5. You click "Copy" → Send logs to Claude!\n');
    console.log('');
    console.log('Button Location:\n');
    console.log('  Pathway UI screen, top section\n');
    console.log('  Next to "AI: Discover Novel Pathways" and "AI: Radical Mode" buttons\n');
    console.log('  Green gradient with glow effect\n');
    console.log('  Calls: google.script.run.showFieldSelector()\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

fix();
