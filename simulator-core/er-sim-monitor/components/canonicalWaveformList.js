/**
 * Canonical Waveform Library with Alarm Profiles
 *
 * Alarm Profiles:
 * - 'normal': No special alarm (uses HR/SpO2 threshold alarms only)
 * - 'irregular': Low-priority intermittent alarm for irregular rhythms
 * - 'critical_shockable': High-priority continuous alarm + "DEFIB ADVISED" banner
 * - 'critical_flatline': Flatline tone + "BEGIN CPR" banner
 * - 'critical_unstable': High-priority alarm for unstable but organized rhythms
 */
export const WAVEFORM_OPTIONS = [
  // Normal and Rate Variants
  { key: 'sinus_ecg', label: 'Normal Sinus Rhythm', alarmProfile: 'normal' },
  { key: 'sinus_brady_ecg', label: 'Sinus Bradycardia', alarmProfile: 'normal' },
  { key: 'sinus_tachy_ecg', label: 'Sinus Tachycardia', alarmProfile: 'normal' },

  // Atrial Arrhythmias
  { key: 'afib_ecg', label: 'Atrial Fibrillation', alarmProfile: 'irregular' },
  { key: 'aflutter_ecg', label: 'Atrial Flutter' },
  { key: 'mat_ecg', label: 'Multifocal Atrial Tachycardia (MAT)' },
  { key: 'svt_ecg', label: 'Supraventricular Tachycardia (SVT)' },
  { key: 'pac_ecg', label: 'Premature Atrial Complexes (PACs)' },

  // Junctional Rhythms
  { key: 'junctional_ecg', label: 'Junctional Rhythm' },

  // Ventricular Arrhythmias
  {
    key: 'vtach_ecg',
    label: 'Ventricular Tachycardia',
    alarmProfile: 'critical_shockable',
    requiresDefibrillation: true,
    description: 'Wide complex tachycardia, may be pulseless'
  },
  {
    key: 'vfib_ecg',
    label: 'Ventricular Fibrillation',
    alarmProfile: 'critical_shockable',
    requiresDefibrillation: true,
    requiresImmediateCPR: true,
    description: 'Chaotic rhythm, no organized QRS, pulseless'
  },
  {
    key: 'torsades_ecg',
    label: 'Torsades de Pointes',
    alarmProfile: 'critical_shockable',
    requiresDefibrillation: true,
    description: 'Polymorphic VT with QT prolongation'
  },
  { key: 'bigeminy_ecg', label: 'Ventricular Bigeminy' },
  { key: 'trigeminy_ecg', label: 'Ventricular Trigeminy' },
  { key: 'idioventricular_ecg', label: 'Idioventricular Rhythm' },
  { key: 'aivr_ecg', label: 'Accelerated Idioventricular Rhythm' },

  // AV Blocks
  { key: 'avblock1_ecg', label: '1st Degree AV Block' },
  { key: 'avblock2_type1_ecg', label: '2nd Degree AV Block Type I (Wenckebach)' },
  { key: 'avblock2_type2_ecg', label: '2nd Degree AV Block Type II' },
  { key: 'avblock3_ecg', label: '3rd Degree AV Block (Complete Heart Block)' },

  // Bundle Branch Blocks
  { key: 'lbbb_ecg', label: 'Left Bundle Branch Block (LBBB)' },
  { key: 'rbbb_ecg', label: 'Right Bundle Branch Block (RBBB)' },

  // Pre-excitation
  { key: 'wpw_ecg', label: 'Wolff-Parkinson-White (WPW)' },

  // Paced Rhythms
  { key: 'vpaced_ecg', label: 'Ventricular Paced Rhythm' },
  { key: 'dual_paced_ecg', label: 'Dual-Chamber Paced' },

  // Electrolyte Abnormalities
  { key: 'hyperkalemia_ecg', label: 'Hyperkalemia' },
  { key: 'hypokalemia_ecg', label: 'Hypokalemia' },

  // Temperature
  { key: 'hypothermia_ecg', label: 'Hypothermia (J-waves)' },

  // Ischemia / MI Patterns
  { key: 'stemi_ecg', label: 'STEMI (Anterior)' },
  { key: 'stemi_inferior_ecg', label: 'STEMI (Inferior)' },
  { key: 'nstemi_ecg', label: 'NSTEMI' },
  { key: 'lbbb_sgarbossa_ecg', label: 'LBBB with Sgarbossa Criteria' },

  // Other Pathologies
  { key: 'pericarditis_ecg', label: 'Pericarditis' },
  { key: 'pulmonary_embolism_ecg', label: 'Pulmonary Embolism (S1Q3T3)' },
  { key: 'early_repolarization_ecg', label: 'Early Repolarization' },
  { key: 'electrical_alternans_ecg', label: 'Electrical Alternans' },

  // Cardiac Arrest
  {
    key: 'asystole_ecg',
    label: 'Asystole (Flatline)',
    alarmProfile: 'critical_flatline',
    requiresImmediateCPR: true,
    description: 'No electrical activity, flatline'
  },
  {
    key: 'pea_ecg',
    label: 'Pulseless Electrical Activity (PEA)',
    alarmProfile: 'critical_unstable',
    requiresImmediateCPR: true,
    description: 'Organized electrical activity but no pulse'
  },

  // Artifact
  { key: 'artifact_ecg', label: 'Artifact / Noise', alarmProfile: 'normal' }
];

/**
 * Get alarm profile for a specific waveform
 * @param {string} waveformKey - The waveform key (e.g., 'vtach_ecg')
 * @returns {object|null} Alarm profile object or null if not found
 */
export function getAlarmProfile(waveformKey) {
  const waveform = WAVEFORM_OPTIONS.find(w => w.key === waveformKey);
  if (!waveform) return null;

  return {
    alarmProfile: waveform.alarmProfile || 'normal',
    requiresDefibrillation: waveform.requiresDefibrillation || false,
    requiresImmediateCPR: waveform.requiresImmediateCPR || false,
    description: waveform.description || ''
  };
}
