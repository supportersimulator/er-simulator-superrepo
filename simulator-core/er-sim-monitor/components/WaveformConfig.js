// components/WaveformConfig.js
// Pre-marked R-wave positions for medically accurate beep timing
// Values are sweep progress (0.0 to 1.0) where beeps should fire

/**
 * R-wave position markers for each ECG waveform type
 *
 * These positions correspond to the actual R-wave peaks in each waveform's
 * generator function, ensuring medically accurate beep timing.
 *
 * Format: Array of progress values [0.0 - 1.0] representing when beep should fire
 */
export const R_WAVE_POSITIONS = {
  /**
   * Sinus Rhythm - Regular, evenly spaced R-waves
   * R-wave occurs at 25% into each of 5 cycles
   * Beep timing: Regular, predictable intervals
   */
  sinus: [0.04, 0.24, 0.44, 0.64, 0.84],
  sinus_ecg: [0.04, 0.24, 0.44, 0.64, 0.84],

  /**
   * Atrial Fibrillation - Traced from ResusMonitor at 60 bpm baseline
   * Reference: https://resusmonitor.com/sim_monitor
   *
   * 60 BPM BASELINE: 6 QRS complexes irregularly spaced
   * Pattern: close-close-GAP-close-GAP-close-close-GAP
   * Intervals: 0.08-0.08-0.22-0.16-0.18-0.16 (irregular!)
   *
   * Medical characteristics:
   * - NO P waves (chaotic fibrillatory baseline)
   * - Narrow QRS (<120 ms)
   * - Irregularly irregular R-R intervals
   *
   * Sweep speed will create perceived HR (60, 120, 150 bpm etc)
   */
  afib: [0.08, 0.16, 0.38, 0.54, 0.72, 0.88],
  afib_ecg: [0.08, 0.16, 0.38, 0.54, 0.72, 0.88],

  /**
   * Atrial Flutter - REGULAR rapid rhythm with sawtooth pattern (2:1 AV block)
   * Medical characteristics:
   * - Continuous sawtooth flutter waves at 300 bpm (no isoelectric baseline!)
   * - Ventricular rate: 150 bpm with 2:1 block (most common)
   * - R-waves appear regularly at 150 bpm
   * Beep timing: REGULAR but RAPID intervals (every other flutter wave conducts)
   * Pattern: 7 evenly spaced R-waves showing 150 bpm ventricular rate
   * Note: Between each R-wave there would be flutter waves, but we beep on QRS only
   */
  aflutter: [0.07, 0.21, 0.35, 0.49, 0.63, 0.77, 0.91],
  aflutter_ecg: [0.07, 0.21, 0.35, 0.49, 0.63, 0.77, 0.91],

  /**
   * Multifocal Atrial Tachycardia (MAT) - IRREGULARLY IRREGULAR with 3+ distinct P-wave morphologies
   * Medical characteristics:
   * - 3+ DIFFERENT P-wave morphologies (from different atrial foci)
   * - Heart rate: 100-150 bpm (typically 120 bpm)
   * - Irregularly irregular like AFib, but with visible distinct P-waves before each QRS
   * - Varying PR intervals (each focus has different conduction time)
   * - Common in COPD/hypoxic patients
   * Beep timing: Irregular intervals showing 3+ distinct rhythm groups
   * Pattern: 7 beeps grouped to show 3 different P-wave sources
   * - Group 1 (short): 0.05, 0.14 (interval 0.09)
   * - Group 2 (medium): 0.28, 0.45 (interval 0.17)
   * - Group 3 (long): 0.62, 0.73, 0.92 (intervals 0.11, 0.19)
   * Each group represents beats from a different atrial focus
   */
  mat: [0.05, 0.14, 0.28, 0.45, 0.62, 0.73, 0.92],
  mat_ecg: [0.05, 0.14, 0.28, 0.45, 0.62, 0.73, 0.92],

  /**
   * Ventricular Tachycardia - Wide complex, slightly earlier R-waves
   * R-wave at ~20% into each cycle (vs 25% for normal sinus)
   * Beep timing: Rapid, regular but slightly different timing
   */
  vtach: [0.03, 0.23, 0.43, 0.63, 0.83],
  vtach_ecg: [0.03, 0.23, 0.43, 0.63, 0.83],

  /**
   * Ventricular Fibrillation (VFib) - NO identifiable R-waves (chaotic)
   * Medical characteristics: Completely disorganized, no QRS/P/T waves
   * Beep timing: Continuous alarm tone, NO distinct beeps (not shockable rhythm)
   * Pattern: Empty array = continuous alarm, no beeps
   */
  vfib: [],
  vfib_ecg: [],

  /**
   * Torsades de Pointes - Polymorphic VT with twisting QRS axis
   * Medical characteristics: "Twisting of the points" - QRS amplitude/polarity varies
   * Heart rate: ~200-250 bpm (faster than regular VTach)
   * Beep timing: Rapid irregular beeps as amplitude twists
   * Pattern: 8 beeps with varying intervals (shows polymorphic nature)
   */
  torsades: [0.06, 0.18, 0.31, 0.42, 0.56, 0.67, 0.81, 0.93],
  torsades_ecg: [0.06, 0.18, 0.31, 0.42, 0.56, 0.67, 0.81, 0.93],

  /**
   * Asystole/Flatline - NO R-waves
   * Beep timing: None (flatline tone plays instead)
   */
  asystole: [],
  asystole_ecg: [],
  flat: [],

  /**
   * Sinus Bradycardia - Regular but slower R-waves (40-59 bpm)
   * Pattern: 3-4 evenly spaced R-waves showing slow rate
   */
  sinus_brady: [0.06, 0.32, 0.58, 0.84],
  sinus_brady_ecg: [0.06, 0.32, 0.58, 0.84],

  /**
   * Sinus Tachycardia - Regular rapid R-waves (101-150 bpm)
   * Pattern: 7 evenly spaced R-waves showing fast rate
   */
  sinus_tachy: [0.07, 0.21, 0.35, 0.49, 0.63, 0.77, 0.91],
  sinus_tachy_ecg: [0.07, 0.21, 0.35, 0.49, 0.63, 0.77, 0.91],

  /**
   * SVT - Very rapid narrow complex (150-250 bpm)
   * Pattern: 9 evenly spaced R-waves showing 180 bpm
   */
  svt: [0.06, 0.17, 0.28, 0.39, 0.50, 0.61, 0.72, 0.83, 0.94],
  svt_ecg: [0.06, 0.17, 0.28, 0.39, 0.50, 0.61, 0.72, 0.83, 0.94],

  /**
   * Junctional Rhythm - Slow regular (40-60 bpm)
   * Pattern: 3-4 evenly spaced R-waves
   */
  junctional: [0.06, 0.35, 0.64, 0.93],
  junctional_ecg: [0.06, 0.35, 0.64, 0.93],

  /**
   * 1st Degree AV Block - Regular R-waves but with prolonged PR
   * Pattern: 5 evenly spaced R-waves (normal rate)
   */
  avblock1: [0.04, 0.24, 0.44, 0.64, 0.84],
  avblock1_ecg: [0.04, 0.24, 0.44, 0.64, 0.84],

  /**
   * 2nd Degree AV Block Type I (Wenckebach) - Progressively closer until dropped QRS
   * Pattern: 4 P-waves but only 3 QRS (4:3 conduction)
   * R-waves get progressively closer together then pause
   */
  avblock2_type1: [0.09, 0.35, 0.58],
  avblock2_type1_ecg: [0.09, 0.35, 0.58],
  wenckebach: [0.09, 0.35, 0.58],
  wenckebach_ecg: [0.09, 0.35, 0.58],

  /**
   * 2nd Degree AV Block Type II - Fixed PR, random dropped QRS
   * Pattern: 4 P-waves but only 3 QRS (3:2 conduction)
   */
  avblock2_type2: [0.11, 0.36, 0.86],
  avblock2_type2_ecg: [0.11, 0.36, 0.86],

  /**
   * 3rd Degree AV Block (Complete Heart Block) - Independent P and QRS
   * Pattern: 3 wide QRS complexes at 40 bpm (ventricular escape)
   * Note: P-waves present but not beeping on them - only beep on QRS
   */
  avblock3: [0.08, 0.42, 0.76],
  avblock3_ecg: [0.08, 0.42, 0.76],
  complete_heart_block: [0.08, 0.42, 0.76],
  complete_heart_block_ecg: [0.08, 0.42, 0.76],

  /**
   * LBBB - Wide QRS with M-shape, regular rate
   * Pattern: 5 evenly spaced R-waves
   */
  lbbb: [0.04, 0.24, 0.44, 0.64, 0.84],
  lbbb_ecg: [0.04, 0.24, 0.44, 0.64, 0.84],

  /**
   * RBBB - Wide QRS with rabbit ears, regular rate
   * Pattern: 5 evenly spaced R-waves
   */
  rbbb: [0.04, 0.24, 0.44, 0.64, 0.84],
  rbbb_ecg: [0.04, 0.24, 0.44, 0.64, 0.84],

  /**
   * WPW - Short PR interval with delta wave, regular rate
   * Pattern: 5 evenly spaced R-waves
   */
  wpw: [0.04, 0.24, 0.44, 0.64, 0.84],
  wpw_ecg: [0.04, 0.24, 0.44, 0.64, 0.84],

  /**
   * V-Paced - Pacer spikes before wide QRS
   * Pattern: 4 evenly spaced paced beats
   */
  vpaced: [0.005, 0.255, 0.505, 0.755],
  vpaced_ecg: [0.005, 0.255, 0.505, 0.755],

  /**
   * Dual-Paced - Atrial and ventricular pacer spikes
   * Pattern: 4 evenly spaced dual-paced beats (beep on V-spike)
   */
  dual_paced: [0.085, 0.335, 0.585, 0.835],
  dual_paced_ecg: [0.085, 0.335, 0.585, 0.835],

  /**
   * Bigeminy - PVC every other beat (normal-PVC-normal-PVC)
   * Pattern: 10 beats total (5 normal + 5 PVC alternating)
   */
  bigeminy: [0.04, 0.14, 0.24, 0.34, 0.44, 0.54, 0.64, 0.74, 0.84, 0.94],
  bigeminy_ecg: [0.04, 0.14, 0.24, 0.34, 0.44, 0.54, 0.64, 0.74, 0.84, 0.94],

  /**
   * Trigeminy - PVC every third beat (normal-normal-PVC)
   * Pattern: Shows grouped triads
   */
  trigeminy: [0.04, 0.17, 0.30, 0.44, 0.57, 0.70, 0.84, 0.97],
  trigeminy_ecg: [0.04, 0.17, 0.30, 0.44, 0.57, 0.70, 0.84, 0.97],

  /**
   * Idioventricular Rhythm - Slow wide QRS (20-40 bpm)
   * Pattern: 2-3 widely spaced R-waves
   */
  idioventricular: [0.09, 0.49, 0.89],
  idioventricular_ecg: [0.09, 0.49, 0.89],

  /**
   * AIVR - Accelerated idioventricular (60-100 bpm)
   * Pattern: 4 evenly spaced wide QRS
   */
  aivr: [0.09, 0.34, 0.59, 0.84],
  aivr_ecg: [0.09, 0.34, 0.59, 0.84],

  /**
   * Hyperkalemia - Normal rate with peaked T waves
   * Pattern: 5 evenly spaced R-waves
   */
  hyperkalemia: [0.04, 0.24, 0.44, 0.64, 0.84],
  hyperkalemia_ecg: [0.04, 0.24, 0.44, 0.64, 0.84],

  /**
   * Hypokalemia - Normal rate with U waves
   * Pattern: 5 evenly spaced R-waves
   */
  hypokalemia: [0.04, 0.24, 0.44, 0.64, 0.84],
  hypokalemia_ecg: [0.04, 0.24, 0.44, 0.64, 0.84],

  /**
   * Hypothermia - Bradycardia with J waves
   * Pattern: 3-4 slow R-waves
   */
  hypothermia: [0.04, 0.32, 0.60, 0.88],
  hypothermia_ecg: [0.04, 0.32, 0.60, 0.88],

  /**
   * STEMI patterns - Normal rate
   * Pattern: 5 evenly spaced R-waves
   */
  stemi: [0.04, 0.24, 0.44, 0.64, 0.84],
  stemi_ecg: [0.04, 0.24, 0.44, 0.64, 0.84],
  stemi_anterior: [0.04, 0.24, 0.44, 0.64, 0.84],
  stemi_anterior_ecg: [0.04, 0.24, 0.44, 0.64, 0.84],
  stemi_inferior: [0.04, 0.24, 0.44, 0.64, 0.84],
  stemi_inferior_ecg: [0.04, 0.24, 0.44, 0.64, 0.84],

  /**
   * NSTEMI - Slightly elevated rate
   * Pattern: 5 evenly spaced R-waves
   */
  nstemi: [0.04, 0.24, 0.44, 0.64, 0.84],
  nstemi_ecg: [0.04, 0.24, 0.44, 0.64, 0.84],

  /**
   * LBBB with Sgarbossa - Wide QRS with ST elevation
   * Pattern: 5 evenly spaced R-waves
   */
  lbbb_sgarbossa: [0.04, 0.24, 0.44, 0.64, 0.84],
  lbbb_sgarbossa_ecg: [0.04, 0.24, 0.44, 0.64, 0.84],

  /**
   * Pericarditis - Often sinus tachy
   * Pattern: 6 evenly spaced R-waves
   */
  pericarditis: [0.04, 0.20, 0.36, 0.52, 0.68, 0.84],
  pericarditis_ecg: [0.04, 0.20, 0.36, 0.52, 0.68, 0.84],

  /**
   * Pulmonary Embolism (S1Q3T3) - Tachycardic
   * Pattern: 6-7 evenly spaced R-waves
   */
  pulmonary_embolism: [0.05, 0.20, 0.35, 0.50, 0.65, 0.80, 0.95],
  pulmonary_embolism_ecg: [0.05, 0.20, 0.35, 0.50, 0.65, 0.80, 0.95],
  s1q3t3: [0.05, 0.20, 0.35, 0.50, 0.65, 0.80, 0.95],
  s1q3t3_ecg: [0.05, 0.20, 0.35, 0.50, 0.65, 0.80, 0.95],

  /**
   * Early Repolarization - Normal to bradycardic (athletes)
   * Pattern: 4 evenly spaced R-waves
   */
  early_repolarization: [0.04, 0.30, 0.56, 0.82],
  early_repolarization_ecg: [0.04, 0.30, 0.56, 0.82],

  /**
   * Electrical Alternans - Alternating amplitude, tachycardic
   * Pattern: 6 evenly spaced R-waves (alternating amplitude doesn't affect timing)
   */
  electrical_alternans: [0.05, 0.21, 0.37, 0.53, 0.69, 0.85],
  electrical_alternans_ecg: [0.05, 0.21, 0.37, 0.53, 0.69, 0.85],

  /**
   * PEA (Pulseless Electrical Activity) - Organized rhythm but no pulse
   * Pattern: 3 slow organized R-waves
   */
  pea: [0.12, 0.46, 0.80],
  pea_ecg: [0.12, 0.46, 0.80],
  pulseless: [0.12, 0.46, 0.80],
  pulseless_ecg: [0.12, 0.46, 0.80],

  /**
   * PACs - Normal rate with occasional early beats
   * Pattern: 5 beats with one premature (2nd beat early)
   */
  pac: [0.04, 0.18, 0.38, 0.58, 0.78],
  pac_ecg: [0.04, 0.18, 0.38, 0.58, 0.78],

  /**
   * Artifact - No real R-waves (random noise)
   * Pattern: Empty or irregular pseudo-beats
   */
  artifact: [],
  artifact_ecg: [],
};

/**
 * Get R-wave positions for a given waveform variant
 * Handles both short format (sinus, afib) and full format (sinus_ecg, afib_ecg)
 * Falls back to sinus rhythm if variant not found
 */
export function getRWavePositions(variant) {
  // Try exact match first
  if (R_WAVE_POSITIONS[variant]) {
    return R_WAVE_POSITIONS[variant];
  }

  // Try extracting base name (e.g., "sinus_ecg" -> "sinus")
  const baseName = variant?.split('_')[0];
  if (baseName && R_WAVE_POSITIONS[baseName]) {
    return R_WAVE_POSITIONS[baseName];
  }

  // Default to sinus rhythm
  return R_WAVE_POSITIONS.sinus;
}
