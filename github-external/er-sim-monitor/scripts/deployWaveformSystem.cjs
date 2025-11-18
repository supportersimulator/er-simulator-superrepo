#!/usr/bin/env node

/**
 * Deploy AI-Powered Waveform Management System to Google Apps Script
 *
 * This script uses clasp (Google Apps Script CLI) to deploy the enhanced
 * waveform system directly to your Google Sheet.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const SHEET_ID = process.env.SHEET_ID || '1EVSC6j7zUeNw_D7dOV3dx7eRyMd3T6PVrVVazKYIkaM';
const SCRIPT_FILE = path.join(__dirname, 'GoogleSheetsAppsScript_Enhanced.js');
const HTML_FILE = path.join(__dirname, 'WaveformAdjustmentTool.html');

console.log('🚀 Deploying AI-Powered Waveform Management System...\n');

// Step 1: Check if clasp is installed
console.log('📋 Step 1: Checking for clasp...');
try {
  execSync('clasp --version', { stdio: 'pipe' });
  console.log('✅ clasp is installed\n');
} catch (error) {
  console.log('❌ clasp not found. Installing...');
  try {
    execSync('npm install -g @google/clasp', { stdio: 'inherit' });
    console.log('✅ clasp installed successfully\n');
  } catch (installError) {
    console.error('❌ Failed to install clasp. Please install manually:');
    console.error('   npm install -g @google/clasp');
    process.exit(1);
  }
}

// Step 2: Check if logged in
console.log('📋 Step 2: Checking clasp login status...');
try {
  execSync('clasp login --status', { stdio: 'pipe' });
  console.log('✅ Already logged in to clasp\n');
} catch (error) {
  console.log('🔐 Not logged in. Opening browser for authentication...');
  try {
    execSync('clasp login', { stdio: 'inherit' });
    console.log('✅ Successfully logged in\n');
  } catch (loginError) {
    console.error('❌ Login failed. Please run manually: clasp login');
    process.exit(1);
  }
}

// Step 3: Clone or create the Apps Script project
console.log('📋 Step 3: Setting up Apps Script project...');
const tempDir = path.join(__dirname, '.clasp-deploy-temp');

// Clean up any previous temp directory
if (fs.existsSync(tempDir)) {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

fs.mkdirSync(tempDir);
process.chdir(tempDir);

try {
  // Try to clone existing script from the sheet
  console.log('   Attempting to clone existing Apps Script...');
  execSync(`clasp clone ${SHEET_ID}`, { stdio: 'pipe' });
  console.log('✅ Cloned existing Apps Script project\n');
} catch (error) {
  console.log('   No existing project found, creating new one...');
  try {
    execSync(`clasp create --type sheets --title "ER Simulator Waveform System" --rootDir .`, { stdio: 'pipe' });
    console.log('✅ Created new Apps Script project\n');
  } catch (createError) {
    console.error('❌ Failed to create Apps Script project');
    console.error(createError.message);
    process.exit(1);
  }
}

// Step 4: Copy files to deployment directory
console.log('📋 Step 4: Preparing files for deployment...');

try {
  // Read and prepare the main script
  const scriptContent = fs.readFileSync(SCRIPT_FILE, 'utf8');
  fs.writeFileSync(path.join(tempDir, 'Code.gs'), scriptContent);
  console.log('   ✅ Copied GoogleSheetsAppsScript_Enhanced.js → Code.gs');

  // Read and prepare the HTML file
  const htmlContent = fs.readFileSync(HTML_FILE, 'utf8');
  fs.writeFileSync(path.join(tempDir, 'WaveformAdjustmentTool.html'), htmlContent);
  console.log('   ✅ Copied WaveformAdjustmentTool.html');

  console.log('✅ Files prepared successfully\n');
} catch (error) {
  console.error('❌ Failed to copy files:', error.message);
  process.exit(1);
}

// Step 5: Push to Apps Script
console.log('📋 Step 5: Deploying to Google Apps Script...');
try {
  const pushOutput = execSync('clasp push --force', { encoding: 'utf8' });
  console.log(pushOutput);
  console.log('✅ Successfully pushed to Apps Script\n');
} catch (error) {
  console.error('❌ Deployment failed:', error.message);
  console.error('\nTroubleshooting:');
  console.error('1. Make sure you have enabled the Apps Script API:');
  console.error('   https://script.google.com/home/usersettings');
  console.error('2. Verify your spreadsheet ID is correct');
  console.error('3. Check that you have edit access to the sheet');
  process.exit(1);
}

// Step 6: Open the Apps Script editor
console.log('📋 Step 6: Opening Apps Script editor...');
try {
  execSync('clasp open', { stdio: 'inherit' });
  console.log('✅ Apps Script editor opened in browser\n');
} catch (error) {
  console.log('⚠️  Could not auto-open editor. You can open it manually:');
  console.log(`   https://script.google.com/home/projects/${SHEET_ID}/edit`);
}

// Cleanup
console.log('🧹 Cleaning up temporary files...');
process.chdir(path.join(__dirname, '..'));
fs.rmSync(tempDir, { recursive: true, force: true });
console.log('✅ Cleanup complete\n');

// Success message
console.log('═══════════════════════════════════════════════════════');
console.log('✅ DEPLOYMENT COMPLETE!');
console.log('═══════════════════════════════════════════════════════\n');
console.log('Next steps:');
console.log('1. Refresh your Google Sheet (Cmd+R or F5)');
console.log('2. Look for the enhanced "ER Simulator" menu');
console.log('3. Click: ER Simulator → Configure OpenAI API Key');
console.log('4. Enter your OpenAI API key from https://platform.openai.com/api-keys');
console.log('5. Test the new features:');
console.log('   - ER Simulator → Waveforms → Adjust Waveforms Data');
console.log('   - ER Simulator → Waveforms → ECG to SVG Converter\n');
console.log('📚 Full documentation:');
console.log('   docs/WAVEFORM_SYSTEM_DEPLOYMENT_GUIDE.md\n');
console.log('═══════════════════════════════════════════════════════');
