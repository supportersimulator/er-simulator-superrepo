/**
 * ClinicalDefaults Module
 *
 * Isolated single-purpose module containing 1 functions
 * for clinical defaults
 *
 * Generated: 2025-11-04T18:29:36.067Z
 * Source: Code_ULTIMATE_ATSR.gs (monolithic, preserved in Legacy Code)
 */

/**
 * Dependencies:
 * - Utilities.gs
 */

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