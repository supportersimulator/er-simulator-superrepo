#!/usr/bin/env node

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const TEST_SCRIPT_ID = '1kkPZU3GsCCuu5IhTEOufmDT1Cb2rSQVB3Y3u1DPf87yoSV4WVtoNvd6i';

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

async function deploy() {
  console.log('\n🤖 DEPLOYING AI PATHWAY DISCOVERY (DUAL MODE)\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const auth = await authorize();
  const script = google.script({ version: 'v1', auth });

  const phase2Path = path.join(__dirname, '../apps-script-deployable/Categories_Pathways_Feature_Phase2.gs');
  const phase2Code = fs.readFileSync(phase2Path, 'utf8');

  console.log('📄 Files loaded:');
  console.log(`   Categories_Pathways_Feature_Phase2.gs: ${(phase2Code.length / 1024).toFixed(1)} KB\n`);

  const project = await script.projects.getContent({ scriptId: TEST_SCRIPT_ID });

  const files = project.data.files.map(f => {
    if (f.name === 'Categories_Pathways_Feature_Phase2') {
      console.log('   ✅ Updating Categories_Pathways_Feature_Phase2.gs (AI discovery integration)');
      return {
        name: f.name,
        type: f.type,
        source: phase2Code
      };
    }
    return f;
  });

  await script.projects.updateContent({
    scriptId: TEST_SCRIPT_ID,
    requestBody: {
      files: files
    }
  });

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('✅ AI PATHWAY DISCOVERY DEPLOYED\n');
  console.log('🎯 NEW FEATURES:');
  console.log('   • 🤖 AI: Discover Novel Pathways (Standard Mode)');
  console.log('     - Creative but grounded pathway groupings');
  console.log('     - Temperature: 0.7 for balanced creativity');
  console.log('     - Examples: "Imposter Syndrome Destroyer", "Puzzle Master Series"');
  console.log('');
  console.log('   • 🔥 AI: Radical Mode (Experimental)');
  console.log('     - Maximum creativity, pushing boundaries');
  console.log('     - Temperature: 1.0 for wild innovation');
  console.log('     - Examples: "The Gambler\'s Fallacy Cases", "Jazz Improvisation Protocol"');
  console.log('     - Includes scientific rationale for unconventional approaches');
  console.log('');
  console.log('📋 WHAT CHANGED:');
  console.log('   • Added TWO AI discovery buttons to Pathways tab');
  console.log('   • Standard mode: Creative, practical pathways (novelty 7+)');
  console.log('   • Radical mode: Experimental pathways (novelty 9-10)');
  console.log('   • LIVE STREAMING LOGS - Terminal-style real-time progress window');
  console.log('     - Client-side polling every 300ms for instant updates');
  console.log('     - Color-coded log levels (info/success/warning/error)');
  console.log('     - Elapsed time timestamps (MM:SS format)');
  console.log('     - Shows all 6 steps of discovery process');
  console.log('     - Auto-closes and shows results when complete');
  console.log('   • Beautiful pitch card UI with:');
  console.log('     - Emoji icons, star ratings, novelty scores');
  console.log('     - "Why This Matters" pitch section');
  console.log('     - Learning outcomes, target audience');
  console.log('     - Unique value propositions');
  console.log('     - Scientific rationale (radical mode only)');
  console.log('');
  console.log('🎨 BUTTON LOCATIONS:');
  console.log('   - Pathway Chain Builder → Intelligent Pathway Opportunities');
  console.log('   - Top right corner next to section title');
  console.log('   - Blue button: Standard Mode');
  console.log('   - Orange/red button with glow: Radical Mode');
  console.log('');
  console.log('⚙️  REQUIREMENTS:');
  console.log('   • OpenAI API key in Settings!B2');
  console.log('   • GPT-4 model access');
  console.log('   • Both modes call OpenAI with different prompts & temperatures');
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════\n');
}

deploy().catch(console.error);
