#!/usr/bin/env node

/**
 * Add Clinical Defaults to Apps Script (for batch processing)
 *
 * This adds a function to Apps Script that fills missing vitals fields
 * DURING batch processing, so every row gets complete vitals even if
 * OpenAI doesn't generate them.
 *
 * This is different from addClinicalDefaults.cjs which enriches EXISTING
 * vitals JSON. This fills in MISSING vitals fields entirely.
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const TOKEN_PATH = path.join(__dirname, '..', 'config', 'token.json');
const SCRIPT_ID = process.env.APPS_SCRIPT_ID;

async function addClinicalDefaultsToAppsScript() {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('  ADD CLINICAL DEFAULTS TO APPS SCRIPT');
  console.log('═══════════════════════════════════════════════════');
  console.log('');

  const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/oauth2callback'
  );
  oauth2Client.setCredentials(token);

  const script = google.script({ version: 'v1', auth: oauth2Client });

  console.log('📖 Reading current Apps Script code...');
  const response = await script.projects.getContent({ scriptId: SCRIPT_ID });
  const files = response.data.files;

  const codeFile = files.find(f => f.name === 'Code');
  if (!codeFile) {
    throw new Error('Could not find Code.gs file');
  }

  let source = codeFile.source;
  console.log('✅ Found Code.gs');
  console.log('');

  // Add the clinical defaults function
  console.log('🔄 Adding applyClinicalDefaults_ function...');

  const defaultsFunction = `
// === CLINICAL DEFAULTS: Fill missing vitals with medically realistic values ===
/**
 * Applies clinical defaults to any missing Monitor_Vital_Signs fields.
 * Called during batch processing to ensure every scenario has complete vitals.
 *
 * Strategy:
 * - Baseline vitals: HR 75, BP 120/80, RR 16, Temp 37.0, SpO2 98, EtCO2 35
 * - Critical scenarios (detected by keywords): Elevated baseline
 * - State progression: Gradual improvement from State1 → State5
 * - Metadata: Standard monitoring setup
 */
function applyClinicalDefaults_(parsed, mergedKeys) {
  Logger.log('🩺 Applying clinical defaults for missing vitals...');

  // Baseline vitals (stable adult)
  const BASELINE = {
    HR: 75,
    BP: '120/80',
    RR: 16,
    Temp: 37.0,
    SpO2: 98,
    EtCO2: 35
  };

  // Critical scenario baseline (elevated)
  const CRITICAL_BASELINE = {
    HR: 110,
    BP: '90/60',
    RR: 24,
    Temp: 37.0,
    SpO2: 92,
    EtCO2: 32
  };

  // Check if this is a critical scenario
  const title = (parsed['Case_Organization:Spark_Title'] || '').toLowerCase();
  const category = (parsed['Case_Organization:Category'] || '').toLowerCase();
  const desc = (parsed['Case_Organization:Formal_Description'] || '').toLowerCase();
  const context = title + ' ' + category + ' ' + desc;

  const isCritical = /cardiac|arrest|shock|trauma|sepsis|stroke|critical|emergency|unstable/i.test(context);

  const baseVitals = isCritical ? CRITICAL_BASELINE : BASELINE;

  if (isCritical) {
    Logger.log('  📊 Critical scenario detected - using elevated baseline');
  }

  // Metadata fields (always fill if missing)
  const metadata = {
    'Monitor_Vital_Signs:Vitals_Format': 'Compact JSON (HR, BP, RR, Temp, SpO2, EtCO2)',
    'Monitor_Vital_Signs:Vitals_API_Target': 'resusmonitor.com/api/vitals',
    'Monitor_Vital_Signs:Vitals_Update_Frequency': '5 seconds',
    'Situation_and_Environment_Details:Initial_Monitoring_Status': 'Standard 5-lead ECG, pulse oximetry, NIBP'
  };

  Object.keys(metadata).forEach(function(key) {
    if (!parsed[key] || parsed[key] === 'N/A' || parsed[key] === '') {
      parsed[key] = metadata[key];
      Logger.log('  ✅ Set ' + key);
    }
  });

  // Vitals states with progression
  const vitalsStates = [
    { key: 'Monitor_Vital_Signs:Initial_Vitals', multiplier: 1.0, desc: 'Initial' },
    { key: 'Monitor_Vital_Signs:State1_Vitals', multiplier: 1.1, desc: 'State 1 (worsening)' },
    { key: 'Monitor_Vital_Signs:State2_Vitals', multiplier: 1.05, desc: 'State 2 (stabilizing)' },
    { key: 'Monitor_Vital_Signs:State3_Vitals', multiplier: 0.95, desc: 'State 3 (improving)' },
    { key: 'Monitor_Vital_Signs:State4_Vitals', multiplier: 0.9, desc: 'State 4 (responding)' },
    { key: 'Monitor_Vital_Signs:State5_Vitals', multiplier: 0.85, desc: 'State 5 (resolving)' }
  ];

  vitalsStates.forEach(function(state) {
    if (!parsed[state.key] || parsed[state.key] === 'N/A' || parsed[state.key] === '') {
      // Create vitals object with progression
      var vitals = {
        HR: Math.round(baseVitals.HR * state.multiplier),
        BP: baseVitals.BP,
        RR: baseVitals.RR,
        Temp: baseVitals.Temp,
        SpO2: baseVitals.SpO2,
        EtCO2: baseVitals.EtCO2
      };

      // Adjust other vitals based on HR change
      if (state.multiplier > 1.0) {
        // Worsening: Lower SpO2, higher RR
        vitals.SpO2 = Math.max(88, baseVitals.SpO2 - Math.round((state.multiplier - 1) * 100));
        vitals.RR = baseVitals.RR + Math.round((state.multiplier - 1) * 20);
      } else if (state.multiplier < 1.0) {
        // Improving: Return to baseline
        vitals.SpO2 = Math.min(98, baseVitals.SpO2 + Math.round((1 - state.multiplier) * 20));
        vitals.BP = BASELINE.BP; // Return to normal BP
      }

      // Final state returns to true baseline
      if (state.key.includes('State5')) {
        vitals = {
          HR: BASELINE.HR,
          BP: BASELINE.BP,
          RR: BASELINE.RR,
          Temp: BASELINE.Temp,
          SpO2: BASELINE.SpO2,
          EtCO2: BASELINE.EtCO2
        };
      }

      parsed[state.key] = JSON.stringify(vitals);
      Logger.log('  ✅ Generated ' + state.desc + ': ' + parsed[state.key]);
    }
  });

  Logger.log('✅ Clinical defaults complete');
  return parsed;
}
`;

  // Find insertion point before processOneInputRow_
  const insertPoint = source.indexOf('function processOneInputRow_');
  if (insertPoint === -1) {
    throw new Error('Could not find processOneInputRow_ function');
  }

  // Insert the defaults function
  source = source.slice(0, insertPoint) + defaultsFunction + '\n' + source.slice(insertPoint);
  console.log('✅ Added applyClinicalDefaults_ function');
  console.log('');

  // Now add the call to this function - right after Image_Sync defaults section
  console.log('🔄 Adding call to applyClinicalDefaults_...');

  const imgDefaultsEnd = source.indexOf("// --- Compact vitals if needed (object -> one-line JSON) ---");
  if (imgDefaultsEnd === -1) {
    throw new Error('Could not find vitals compaction section');
  }

  const beforeCall = source.substring(0, imgDefaultsEnd);
  const afterCall = source.substring(imgDefaultsEnd);

  const callCode = `  // --- Apply clinical defaults for missing vitals ---
  applyClinicalDefaults_(parsed, mergedKeys);

  `;

  source = beforeCall + callCode + afterCall;
  console.log('✅ Added call to applyClinicalDefaults_');
  console.log('');

  // Upload
  console.log('💾 Uploading enhanced code...');
  const updatedFiles = files.map(f => {
    if (f.name === 'Code') {
      return { ...f, source };
    }
    return f;
  });

  await script.projects.updateContent({
    scriptId: SCRIPT_ID,
    requestBody: { files: updatedFiles }
  });

  console.log('✅ Code updated successfully!');
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('✅ CLINICAL DEFAULTS SYSTEM INSTALLED');
  console.log('═══════════════════════════════════════════════════');
  console.log('');
  console.log('📊 Default Vitals System:');
  console.log('');
  console.log('   Baseline (Stable):');
  console.log('   HR: 75, BP: 120/80, RR: 16, Temp: 37.0, SpO2: 98, EtCO2: 35');
  console.log('');
  console.log('   Critical Scenarios:');
  console.log('   HR: 110, BP: 90/60, RR: 24, SpO2: 92');
  console.log('   (Auto-detected: cardiac, arrest, shock, trauma, sepsis, stroke)');
  console.log('');
  console.log('   State Progression:');
  console.log('   Initial    → Baseline vitals');
  console.log('   State 1    → +10% worse (tachycardia, hypoxia)');
  console.log('   State 2    → +5% (stabilizing)');
  console.log('   State 3    → -5% (improving)');
  console.log('   State 4    → -10% (responding to treatment)');
  console.log('   State 5    → Return to normal baseline');
  console.log('');
  console.log('   Metadata Defaults:');
  console.log('   - Vitals Format: Compact JSON');
  console.log('   - API Target: resusmonitor.com/api/vitals');
  console.log('   - Update Frequency: 5 seconds');
  console.log('   - Monitoring: Standard 5-lead ECG, pulse ox, NIBP');
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('✅ NEXT STEPS');
  console.log('═══════════════════════════════════════════════════');
  console.log('');
  console.log('1. Refresh Google Sheets tab');
  console.log('2. Run batch processing');
  console.log('3. ALL rows will now have complete vitals');
  console.log('4. No more missing Monitor_Vital_Signs fields!');
  console.log('');
}

if (require.main === module) {
  addClinicalDefaultsToAppsScript().catch(error => {
    console.error('');
    console.error('❌ FAILED');
    console.error('════════════════════════════════════════════════════');
    console.error(`Error: ${error.message}`);
    console.error('');
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  });
}

module.exports = { addClinicalDefaultsToAppsScript };
