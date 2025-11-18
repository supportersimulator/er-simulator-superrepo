/**
 * Verify All Tools Remain Intact After Fix
 *
 * Checks that we only modified the ONE conflicting function
 * and all other valuable tools are preserved
 */

const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function main() {
  console.log('🔍 Verifying All Tools Remain Intact\n');
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

  console.log('📥 Downloading current project state...\n');

  const project = await script.projects.getContent({ scriptId });

  console.log('✅ Project loaded\n');
  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('📊 ALL FILES IN PROJECT:\n');
  console.log('══════════════════════════════════════════════════════════════\n');

  const criticalFunctions = [
    // Pathway Discovery
    { name: 'showPathwayDiscoveryPanel', desc: 'Pathway Discovery UI', critical: true },
    { name: 'discoverPathways', desc: 'Pathway Discovery Engine', critical: true },

    // AI Scoring
    { name: 'showAIScoringPanel', desc: 'AI Scoring UI', critical: true },
    { name: 'runAIScoring', desc: 'AI Scoring Engine', critical: true },

    // Categories Panel
    { name: 'openCategoriesPathwaysPanel', desc: 'Categories Panel Entry Point', critical: true },
    { name: 'buildCategoriesPathwaysMainMenu_', desc: 'Categories Panel Builder', critical: true },

    // AI Categorization (the one we're fixing)
    { name: 'runAICategorization', desc: 'AI Categorization Engine', critical: true },
    { name: 'parseSpecificRowsInput', desc: 'Specific Rows Parser', critical: false },

    // Core utilities
    { name: 'addAILog', desc: 'AI Logging System', critical: true },
    { name: 'getSafeUi_', desc: 'UI Safety Wrapper', critical: true }
  ];

  project.data.files.forEach(file => {
    const ext = file.type === 'SERVER_JS' ? '.gs' : file.type === 'HTML' ? '.html' : '.json';
    const size = Math.round(file.source.length / 1024);

    console.log(`📄 ${file.name}${ext} (${size} KB)`);

    // Check which critical functions are in this file
    const functionsInFile = criticalFunctions.filter(fn =>
      file.source.includes('function ' + fn.name)
    );

    if (functionsInFile.length > 0) {
      functionsInFile.forEach(fn => {
        console.log(`   ✅ ${fn.desc}`);
      });
    }

    console.log('');
  });

  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('🔍 CRITICAL FUNCTIONS CHECK:\n');
  console.log('══════════════════════════════════════════════════════════════\n');

  criticalFunctions.forEach(fn => {
    const filesWithFunction = project.data.files.filter(f =>
      f.source.includes('function ' + fn.name)
    );

    const marker = filesWithFunction.length > 0 ? '✅' : '❌';
    const status = filesWithFunction.length > 0 ? 'PRESENT' : 'MISSING';
    const color = filesWithFunction.length > 0 ? '' : ' ⚠️  CRITICAL!';

    console.log(`${marker} ${fn.name}()`);
    console.log(`   Status: ${status}${color}`);
    console.log(`   Purpose: ${fn.desc}`);

    if (filesWithFunction.length > 0) {
      console.log(`   Location: ${filesWithFunction.map(f => f.name).join(', ')}`);
    }

    if (filesWithFunction.length > 1) {
      console.log('   ⚠️  WARNING: Multiple files have this function!');
      console.log('   Apps Script will use: ' + filesWithFunction.sort((a, b) => a.name.localeCompare(b.name))[0].name);
    }

    console.log('');
  });

  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('🎯 SPECIFIC CHECK: Archive File Modification\n');
  console.log('══════════════════════════════════════════════════════════════\n');

  const archiveFile = project.data.files.find(f => f.name === 'Phase2_Enhanced_Categories_Pathways_Panel_ARCHIVE_2025-11-11');

  if (archiveFile) {
    console.log('✅ Archive file exists (good - we preserved it)\n');
    console.log('   Size:', Math.round(archiveFile.source.length / 1024), 'KB\n');

    // Check what we removed
    const hasConflictingFunc = archiveFile.source.includes('function buildCategoriesPathwaysMainMenu_');
    console.log('   Has buildCategoriesPathwaysMainMenu_():', hasConflictingFunc ? '❌ YES (not removed yet?)' : '✅ NO (removed successfully)');

    // Check that other functions are still there
    const hasPathwayFunc = archiveFile.source.includes('function discoverPathways');
    const hasScoringFunc = archiveFile.source.includes('function runAIScoring');

    console.log('   Other functions preserved:');
    console.log('     - discoverPathways:', hasPathwayFunc ? '✅ YES' : '❌ NO');
    console.log('     - runAIScoring:', hasScoringFunc ? '✅ YES' : '❌ NO');
    console.log('');
  } else {
    console.log('❌ Archive file not found!\n');
  }

  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('📋 SUMMARY:\n');
  console.log('══════════════════════════════════════════════════════════════\n');

  const allCriticalPresent = criticalFunctions.every(fn =>
    project.data.files.some(f => f.source.includes('function ' + fn.name))
  );

  if (allCriticalPresent) {
    console.log('✅ ALL CRITICAL FUNCTIONS PRESENT\n');
    console.log('All valuable tools are intact and safe!\n');
  } else {
    console.log('⚠️  SOME CRITICAL FUNCTIONS MISSING\n');
    console.log('Review the list above to identify what\'s missing.\n');
  }
}

main().catch(console.error);
