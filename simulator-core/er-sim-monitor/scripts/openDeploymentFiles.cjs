#!/usr/bin/env node

/**
 * Easy Deployment Helper for AI-Powered Waveform Management System
 *
 * This script opens both deployment files side-by-side for easy copy-paste
 * to Google Apps Script editor.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const SCRIPT_FILE = path.join(__dirname, 'GoogleSheetsAppsScript_Enhanced.js');
const HTML_FILE = path.join(__dirname, 'WaveformAdjustmentTool.html');
const SHEET_URL = 'https://docs.google.com/spreadsheets/d/1EVSC6j7zUeNw_D7dOV3dx7eRyMd3T6PVrVVazKYIkaM/edit';

console.log('═══════════════════════════════════════════════════════');
console.log('🚀 AI-POWERED WAVEFORM SYSTEM - DEPLOYMENT HELPER');
console.log('═══════════════════════════════════════════════════════\n');

console.log('📋 Step-by-Step Deployment Instructions:\n');

console.log('STEP 1: Open Google Sheet');
console.log('   Opening your spreadsheet in browser...');
try {
  execSync(`open "${SHEET_URL}"`, { stdio: 'ignore' });
  console.log('   ✅ Sheet opened\n');
} catch (error) {
  console.log(`   ⚠️  Please open manually: ${SHEET_URL}\n`);
}

console.log('STEP 2: Open Apps Script Editor');
console.log('   In the Google Sheet:');
console.log('   - Click: Extensions → Apps Script');
console.log('   - Wait for the editor to load\n');

console.log('STEP 3: Backup Current Code (Important!)');
console.log('   In the Apps Script editor:');
console.log('   - Click: File → Make a copy');
console.log('   - Rename it: "Backup - ' + new Date().toISOString().split('T')[0] + '"\n');

console.log('STEP 4: Replace Code.gs');
console.log('   Opening Code.gs for you...');
try {
  execSync(`open "${SCRIPT_FILE}"`, { stdio: 'ignore' });
  console.log('   ✅ Code file opened in your default editor');
} catch (error) {
  console.log(`   ⚠️  File location: ${SCRIPT_FILE}`);
}
console.log('   - Select ALL code in Code.gs (Cmd+A)');
console.log('   - Delete it');
console.log('   - Copy ALL content from GoogleSheetsAppsScript_Enhanced.js');
console.log('   - Paste into Code.gs');
console.log('   - Click Save (💾 or Cmd+S)\n');

console.log('STEP 5: Add HTML File');
console.log('   Opening HTML file for you...');
try {
  execSync(`open "${HTML_FILE}"`, { stdio: 'ignore' });
  console.log('   ✅ HTML file opened in your default editor');
} catch (error) {
  console.log(`   ⚠️  File location: ${HTML_FILE}`);
}
console.log('   In the Apps Script editor:');
console.log('   - Click the + button next to "Files"');
console.log('   - Select "HTML"');
console.log('   - Name it EXACTLY: WaveformAdjustmentTool');
console.log('   - Delete the default HTML content');
console.log('   - Copy ALL content from WaveformAdjustmentTool.html');
console.log('   - Paste into the HTML file');
console.log('   - Click Save (💾 or Cmd+S)\n');

console.log('STEP 6: Close and Refresh');
console.log('   - Close the Apps Script editor tab');
console.log('   - Go back to your Google Sheet tab');
console.log('   - Refresh the page (Cmd+R or F5)\n');

console.log('STEP 7: Configure OpenAI API');
console.log('   After refresh, you should see the enhanced menu!');
console.log('   - Click: ER Simulator → Configure OpenAI API Key');
console.log('   - Get your key from: https://platform.openai.com/api-keys');
console.log('   - Paste it in and click OK\n');

console.log('STEP 8: Test the New Features');
console.log('   - Click: ER Simulator → Waveforms');
console.log('   - You should see a submenu with:');
console.log('     • Adjust Waveforms Data (AI-powered tool)');
console.log('     • ECG to SVG Converter');
console.log('     • [4 existing waveform functions]\n');

console.log('═══════════════════════════════════════════════════════');
console.log('✨ Files ready to copy!');
console.log('═══════════════════════════════════════════════════════\n');

console.log('File Sizes:');
const scriptSize = (fs.statSync(SCRIPT_FILE).size / 1024).toFixed(1);
const htmlSize = (fs.statSync(HTML_FILE).size / 1024).toFixed(1);
console.log(`   GoogleSheetsAppsScript_Enhanced.js: ${scriptSize} KB`);
console.log(`   WaveformAdjustmentTool.html: ${htmlSize} KB\n`);

console.log('📚 Need help? See docs/WAVEFORM_SYSTEM_DEPLOYMENT_GUIDE.md');
console.log('\n✋ Ready to copy? Follow the steps above carefully!');
console.log('   (Don\'t worry, we made a backup in Step 3)\n');
