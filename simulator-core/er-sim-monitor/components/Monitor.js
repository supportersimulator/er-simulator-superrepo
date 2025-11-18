// components/Monitor.js - Compact portrait layout
import Slider from '@react-native-community/slider';
import { Picker } from '@react-native-picker/picker';
import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { StyleSheet, Text, View, Switch, TouchableOpacity, ScrollView, Dimensions, Platform } from 'react-native';
// import useMonitorBeep from '../hooks/useMonitorBeep'; // OLD SYSTEM - REPLACED BY ADAPTIVE SALIENCE
// import useVisualAlerts from '../hooks/useVisualAlerts'; // TEMPORARILY DISABLED
import useAdaptiveSalience from '../hooks/useAdaptiveSalience'; // NEW: Adaptive Salience Audio System
import { WAVEFORM_OPTIONS } from './canonicalWaveformList';
import vitalsData from '../data/vitals.json';

// Individual waveforms
import WaveformBP from './WaveformBP';
import WaveformECG from './WaveformECG';
import WaveformEtCO2 from './WaveformEtCO2';
import WaveformPleth from './WaveformPleth';

// Sweep overlays
import CardiacSweepOverlay from './CardiacSweepOverlay';
import RespiratorySweepOverlay from './RespiratorySweepOverlay';

// Default baseline vitals - always safe to render
const DEFAULT_VITALS = {
  hr: 78,
  bp: { sys: 122, dia: 78 },
  rr: 16,
  spo2: 98,
  temp: 36.9,
  etco2: 38,
  rhythm: 'sinus_ecg',
  waveform: 'sinus_ecg'
};

// Parse BP string "122/78" to object {sys: 122, dia: 78}
function parseBP(bp) {
  if (typeof bp === 'object' && bp.sys && bp.dia) return bp;
  if (typeof bp === 'string') {
    const parts = bp.split('/');
    return { sys: parseInt(parts[0]) || 122, dia: parseInt(parts[1]) || 78 };
  }
  return { sys: 122, dia: 78 };
}

// Extract vitals from Google Sheets entry format
function extractVitalsFromEntry(entry, stateName = 'Initial_Vitals') {
  if (!entry) return null;

  const vitalsField = `Monitor_Vital_Signs:${stateName}`;
  const vitalsStr = entry[vitalsField];

  if (!vitalsStr) return null;

  try {
    const parsed = typeof vitalsStr === 'string' ? JSON.parse(vitalsStr) : vitalsStr;
    return {
      hr: parsed.HR || parsed.hr || DEFAULT_VITALS.hr,
      bp: parseBP(parsed.BP || parsed.bp),
      rr: parsed.RR || parsed.rr || DEFAULT_VITALS.rr,
      spo2: parsed.SpO2 || parsed.spo2 || DEFAULT_VITALS.spo2,
      temp: parsed.Temp || parsed.temp || DEFAULT_VITALS.temp,
      etco2: parsed.EtCO2 || parsed.etco2 || DEFAULT_VITALS.etco2,
      waveform: parsed.waveform || DEFAULT_VITALS.waveform,
      rhythm: parsed.waveform || DEFAULT_VITALS.rhythm
    };
  } catch (e) {
    console.error('Error parsing vitals:', e);
    return null;
  }
}

// Build scenario list from vitals data
function buildScenarioList(data) {
  const scenarios = [{ key: 'default', label: 'Default (Normal Vitals)' }];

  data.forEach((entry, index) => {
    const title = entry['Case_Organization:Reveal_Title'] ||
                  entry['Case_Organization:Spark_Title'] ||
                  `Case ${index + 1}`;
    const caseId = entry['Case_Organization:Case_ID'] || `case_${index}`;

    scenarios.push({
      key: caseId,
      label: title,
      entry: entry
    });
  });

  return scenarios;
}

// Typical heart rates for each waveform type (based on medical research)
const WAVEFORM_HEART_RATES = {
  // Normal and Rate Variants
  sinus_ecg: 75,             // Normal sinus rhythm: 60-100 bpm (typical: 75)
  sinus_brady_ecg: 50,       // Sinus bradycardia: 40-59 bpm (typical: 50)
  sinus_tachy_ecg: 120,      // Sinus tachycardia: 101-150 bpm (typical: 120)

  // Atrial Arrhythmias
  afib_ecg: 140,             // Atrial fibrillation: 120-160 bpm (typical: 140) - irregularly irregular
  aflutter_ecg: 150,         // Atrial flutter with 2:1 block: ~150 bpm (atrial 300, ventricular 150) - regular rapid
  mat_ecg: 120,              // Multifocal atrial tachycardia: 100-150 bpm (typical: 120) - irregularly irregular
  svt_ecg: 180,              // Supraventricular tachycardia: 150-250 bpm (typical: 180) - narrow complex
  pac_ecg: 75,               // PACs: Normal rate with occasional early beats

  // Junctional Rhythms
  junctional_ecg: 50,        // Junctional rhythm: 40-60 bpm (typical: 50)

  // Ventricular Arrhythmias
  vtach_ecg: 180,            // Ventricular tachycardia: 150-250 bpm (typical: 180) - wide complex regular
  vfib_ecg: 0,               // Ventricular fibrillation: > 300 bpm but uncountable (display as 0) - chaotic
  torsades_ecg: 220,         // Torsades de Pointes: 200-250 bpm (typical: 220) - polymorphic VT
  bigeminy_ecg: 75,          // Bigeminy: Normal rate with PVCs every other beat
  trigeminy_ecg: 75,         // Trigeminy: Normal rate with PVCs every third beat
  idioventricular_ecg: 30,   // Idioventricular: 20-40 bpm (typical: 30)
  aivr_ecg: 80,              // Accelerated idioventricular: 60-100 bpm (typical: 80)

  // AV Blocks
  avblock1_ecg: 75,          // 1st Degree AV Block: Normal rate with prolonged PR
  avblock2_type1_ecg: 65,    // 2nd Degree Type I (Wenckebach): Progressively slower
  avblock2_type2_ecg: 60,    // 2nd Degree Type II: Fixed rate with dropped beats
  avblock3_ecg: 40,          // 3rd Degree (Complete Heart Block): Ventricular escape ~40 bpm

  // Bundle Branch Blocks
  lbbb_ecg: 75,              // LBBB: Normal rate with wide QRS
  rbbb_ecg: 75,              // RBBB: Normal rate with wide QRS

  // Pre-excitation
  wpw_ecg: 75,               // WPW: Normal rate with delta wave

  // Paced Rhythms
  vpaced_ecg: 70,            // Ventricular paced: Typically 60-80 bpm
  dual_paced_ecg: 70,        // Dual-chamber paced: Typically 60-80 bpm

  // Electrolyte Abnormalities
  hyperkalemia_ecg: 75,      // Hyperkalemia: Normal rate with peaked T waves
  hypokalemia_ecg: 75,       // Hypokalemia: Normal rate with U waves

  // Temperature
  hypothermia_ecg: 50,       // Hypothermia: Bradycardia with J waves

  // Ischemia / MI Patterns
  stemi_ecg: 75,             // STEMI: Normal to elevated rate
  stemi_inferior_ecg: 75,    // Inferior STEMI: May have bradycardia
  nstemi_ecg: 85,            // NSTEMI: Often slightly elevated
  lbbb_sgarbossa_ecg: 75,    // LBBB with Sgarbossa: Normal rate

  // Other Pathologies
  pericarditis_ecg: 90,      // Pericarditis: Often sinus tachycardia
  pulmonary_embolism_ecg: 100, // PE: Tachycardia common
  early_repolarization_ecg: 65, // Early repolarization: Often athletes with bradycardia
  electrical_alternans_ecg: 110, // Electrical alternans: Often tachycardic (pericardial effusion)

  // Cardiac Arrest
  asystole_ecg: 0,           // Asystole/flatline: 0 bpm
  pea_ecg: 50,               // PEA: Organized rhythm but no pulse (display rate)

  // Artifact
  artifact_ecg: 0,           // Artifact: No real rate
};

// 🧪 TEST SCENARIOS for Adaptive Salience Testing
const TEST_SCENARIOS = [
  {
    key: 'normal',
    label: 'Normal',
    vitals: { hr: 75, spo2: 98, bp: { sys: 120, dia: 80 }, rr: 16, etco2: 38, waveform: 'sinus_ecg' },
    description: '✅ Normal Vitals - All parameters within safe range. You should hear SILENCE - the monitor only sounds when intervention is needed. This demonstrates the core philosophy: "Only sound when sound adds value."'
  },
  {
    key: 'vfib',
    label: 'VFib',
    vitals: { hr: 0, spo2: 82, bp: { sys: 0, dia: 0 }, rr: 0, etco2: 0, waveform: 'vfib_ecg' },
    description: '🚨 CRITICAL Emergency - Ventricular fibrillation with severe hypoxia. Expect IMMEDIATE awareness alarm (60% volume). Even if "Talking" is ON, this critical alarm maintains 50% volume to ensure audibility during voice interaction.'
  },
  {
    key: 'tachycardia',
    label: 'Tachycardia',
    vitals: { hr: 155, spo2: 94, bp: { sys: 140, dia: 90 }, rr: 22, etco2: 38, waveform: 'sinus_tachy_ecg' },
    description: '⚠️ WARNING - Severe tachycardia detected (HR 155 bpm). Listen for the 3-phase escalation: Awareness (single clear tone at 60%), then after 15s → Persistence (soft reminder every 6s at 35%), then after 45s → Neglect (insistent alert every 3s at 65%).'
  },
  {
    key: 'hypoxia',
    label: 'Hypoxia',
    vitals: { hr: 110, spo2: 82, bp: { sys: 105, dia: 68 }, rr: 28, etco2: 35, waveform: 'sinus_ecg' },
    description: '🚨 CRITICAL - Severe hypoxia (SpO2 82%). Immediate awareness alarm at 60% volume. This critical oxygen level triggers the highest priority alert. Watch the phase progression in real-time below.'
  },
  {
    key: 'multiple',
    label: 'Multiple',
    vitals: { hr: 155, spo2: 85, bp: { sys: 88, dia: 55 }, rr: 30, etco2: 32, waveform: 'sinus_tachy_ecg' },
    description: '🚨 MULTIPLE CRITICAL Alarms - Tachycardia + Hypoxia + Hypotension simultaneously. Experience how the system prioritizes: the most severe alarm plays first, then others follow. Each vital has its own independent phase tracking shown below.'
  },
];

export default function Monitor({ vitals: propVitals, muted, onClose, onEscalationUpdate, onVitalsUpdate }) {
  // Safe initialization with defaults
  const [displayVitals, setDisplayVitals] = useState(propVitals || DEFAULT_VITALS);
  const [manualVitals, setManualVitals] = useState(DEFAULT_VITALS);
  const [rhythm, setRhythm] = useState(DEFAULT_VITALS.rhythm);

  // HR transition state
  const [targetHR, setTargetHR] = useState(DEFAULT_VITALS.hr);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const transitionStartTime = useRef(null);

  // Notify parent when vitals change (for icon display)
  useEffect(() => {
    if (onVitalsUpdate) {
      // In manual mode, use manualVitals; otherwise use displayVitals
      const vitalsToReport = controlMode === 'manual' ? manualVitals : displayVitals;
      onVitalsUpdate(vitalsToReport);
    }
  }, [manualVitals, displayVitals, controlMode, onVitalsUpdate]);
  const transitionStartHR = useRef(DEFAULT_VITALS.hr);

  // Control modes
  const [controlMode, setControlMode] = useState('manual'); // 'manual', 'scenario'
  const [selectedScenario, setSelectedScenario] = useState('default');
  const [selectedState, setSelectedState] = useState('Initial_Vitals');
  const [isFlatline, setIsFlatline] = useState(false);
  const [isIntubated, setIsIntubated] = useState(true); // Default ON for development

  // 🧪 Test Panel State
  const [testPanelEnabled, setTestPanelEnabled] = useState(false);
  const [isTalking, setIsTalking] = useState(false); // Simulate voice activity
  const [selectedTestScenario, setSelectedTestScenario] = useState(null); // Track selected scenario for description

  // Alarm silence state
  const [isMuted, setIsMuted] = useState(false);
  const [silenceTimer, setSilenceTimer] = useState(null);
  const silenceTimerRef = useRef(null);

  // Container width measurement for shared sweeps
  const [cardiacContainerWidth, setCardiacContainerWidth] = useState(null);
  const [respContainerWidth, setRespContainerWidth] = useState(null);

  // Responsive dimensions
  const [dimensions, setDimensions] = useState(() => {
    const { width, height } = Dimensions.get('window');
    return { width, height };
  });

  // Track dimension changes
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions({ width: window.width, height: window.height });
    });

    return () => subscription?.remove();
  }, []);

  // Determine layout mode based on dimensions
  const getLayoutMode = () => {
    const { width, height } = dimensions;
    const isPortrait = height > width;
    const isMobile = Platform.OS === 'ios' || Platform.OS === 'android';
    const isDesktop = Platform.OS === 'web' && width > 1024;

    if (isDesktop) return 'desktop';
    if (isMobile && isPortrait) return 'portrait';
    if (isMobile) return 'landscape';
    return 'web'; // Web but not desktop size
  };

  const layoutMode = getLayoutMode();

  // Build scenario list
  const scenarios = buildScenarioList(vitalsData);

  // Available states
  const states = [
    { key: 'Initial_Vitals', label: 'Initial' },
    { key: 'State1_Vitals', label: 'State 1' },
    { key: 'State2_Vitals', label: 'State 2' },
    { key: 'State3_Vitals', label: 'State 3' },
    { key: 'State4_Vitals', label: 'State 4' },
    { key: 'State5_Vitals', label: 'State 5' }
  ];

  // 🎯 ADAPTIVE SALIENCE AUDIO SYSTEM
  // Philosophy: "Only sound when sound adds value"
  // Event-driven, context-aware, escalating alerts
  const {
    engineState,
    highestSeverity,
    acknowledge,
    acknowledgeAll,
  } = useAdaptiveSalience({
    vitals: displayVitals,
    muted: isMuted || isFlatline,
    isSpeaking: isTalking, // Connected to test panel "Talking" button
  });

  // Handle 30-second silence
  const handleSilence30 = () => {
    setIsMuted(true);
    setSilenceTimer(30);

    // 🎯 ADAPTIVE SALIENCE: Acknowledge all vitals when silencing
    if (acknowledgeAll) {
      acknowledgeAll();
    }

    // Clear any existing timer
    if (silenceTimerRef.current) {
      clearInterval(silenceTimerRef.current);
    }

    // Start countdown
    let remaining = 30;
    silenceTimerRef.current = setInterval(() => {
      remaining--;
      setSilenceTimer(remaining);
      if (remaining <= 0) {
        setIsMuted(false);
        setSilenceTimer(null);
        clearInterval(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
    }, 1000);
  };

  // Handle permanent silence toggle
  const handleSilenceAll = () => {
    // Clear any temp timer
    if (silenceTimerRef.current) {
      clearInterval(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    setSilenceTimer(null);
    setIsMuted(!isMuted);

    // 🎯 ADAPTIVE SALIENCE: Acknowledge all vitals when muting
    if (!isMuted && acknowledgeAll) {
      acknowledgeAll();
    }
  };

  // 🧪 Handle test scenario trigger
  const handleTestScenario = (scenarioKey) => {
    const scenario = TEST_SCENARIOS.find(s => s.key === scenarioKey);
    if (!scenario) return;

    // Update selected scenario for description display
    setSelectedTestScenario(scenario);

    const newVitals = scenario.vitals;
    setManualVitals(newVitals);
    setDisplayVitals(newVitals);
    setRhythm(newVitals.waveform);
    setControlMode('manual');
    setIsFlatline(false);

    // Trigger smooth HR transition
    setTargetHR(newVitals.hr);
    setIsTransitioning(true);
  };

  // 🧪 Handle test panel toggle
  const handleTestPanelToggle = () => {
    if (testPanelEnabled) {
      // Closing test panel - clear all test state
      setSelectedTestScenario(null);
      setIsTalking(false);
    }
    setTestPanelEnabled(!testPanelEnabled);
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (silenceTimerRef.current) {
        clearInterval(silenceTimerRef.current);
      }
    };
  }, []);

  // Handle scenario selection
  useEffect(() => {
    if (controlMode === 'scenario' && selectedScenario !== 'default') {
      const scenario = scenarios.find(s => s.key === selectedScenario);
      if (scenario && scenario.entry) {
        const newVitals = extractVitalsFromEntry(scenario.entry, selectedState);
        if (newVitals) {
          setDisplayVitals(newVitals);
          setRhythm(newVitals.rhythm || newVitals.waveform);
        }
      }
    } else if (controlMode === 'scenario' && selectedScenario === 'default') {
      setDisplayVitals(DEFAULT_VITALS);
      setRhythm(DEFAULT_VITALS.rhythm);
    }
  }, [selectedScenario, selectedState, controlMode]);

  // Handle manual mode updates
  useEffect(() => {
    if (controlMode === 'manual') {
      setDisplayVitals(manualVitals);
      setRhythm(manualVitals.rhythm);
    }
  }, [manualVitals, controlMode]);

  // Handle flatline
  useEffect(() => {
    if (isFlatline) {
      setDisplayVitals({
        ...displayVitals,
        hr: 0,
        spo2: 0,
        rr: 0,
        etco2: 0,
        rhythm: 'asystole_ecg',
        waveform: 'asystole_ecg'
      });
      setRhythm('asystole_ecg');
    }
  }, [isFlatline]);

  // Smooth 8-second HR transition when waveform changes
  useEffect(() => {
    if (!isTransitioning) return;

    transitionStartTime.current = Date.now();
    transitionStartHR.current = displayVitals.hr;

    const transitionDuration = 8000; // 8 seconds
    const step = 50; // Update every 50ms for smooth animation

    const id = setInterval(() => {
      const elapsed = Date.now() - transitionStartTime.current;
      const progress = Math.min(elapsed / transitionDuration, 1);

      // Ease-in-out function for smooth acceleration/deceleration
      const easeProgress = progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;

      const newHR = Math.round(
        transitionStartHR.current +
        (targetHR - transitionStartHR.current) * easeProgress
      );

      setDisplayVitals(prev => ({
        ...prev,
        hr: newHR
      }));

      setManualVitals(prev => ({
        ...prev,
        hr: newHR
      }));

      if (progress >= 1) {
        setIsTransitioning(false);
        clearInterval(id);
      }
    }, step);

    return () => clearInterval(id);
  }, [isTransitioning, targetHR]);

  // Smooth transitions for vitals (when receiving updates)
  useEffect(() => {
    if (!propVitals) return;

    const step = 20;
    const duration = 2000;
    const frames = duration / step;
    let count = 0;
    const start = displayVitals;
    const end = propVitals;

    const id = setInterval(() => {
      count++;
      const progress = count / frames;
      setDisplayVitals(interpolate(start, end, progress));
      if (count >= frames) clearInterval(id);
    }, step);

    return () => clearInterval(id);
  }, [propVitals]);

  // Rhythm-based waveform selector
  const getECGWave = () => {
    // Ensure we always have a valid rhythm string
    let currentRhythm = isFlatline ? 'asystole_ecg' : rhythm;
    if (!currentRhythm || typeof currentRhythm !== 'string') {
      currentRhythm = 'sinus_ecg'; // Fallback to sinus rhythm
    }

    // Map rhythm state to waveform variant
    // Extract base name (e.g., "aflutter_ecg" -> "aflutter")
    // Special handling for multi-word variants like "avblock2_type1_ecg" or "stemi_inferior_ecg"
    let variantName = currentRhythm.replace(/_ecg$/, ''); // Remove "_ecg" suffix

    // Special cases with underscores in the name
    if (currentRhythm.includes('avblock2_type1') || currentRhythm.includes('wenckebach')) {
      variantName = 'avblock2_type1';
    } else if (currentRhythm.includes('avblock2_type2')) {
      variantName = 'avblock2_type2';
    } else if (currentRhythm.includes('avblock3') || currentRhythm.includes('complete_heart_block')) {
      variantName = 'avblock3';
    } else if (currentRhythm.includes('stemi_inferior')) {
      variantName = 'stemi_inferior';
    } else if (currentRhythm.includes('lbbb_sgarbossa')) {
      variantName = 'lbbb_sgarbossa';
    } else if (currentRhythm.includes('dual_paced')) {
      variantName = 'dual_paced';
    } else if (currentRhythm.includes('pulmonary_embolism') || currentRhythm.includes('s1q3t3')) {
      variantName = 'pulmonary_embolism';
    } else if (currentRhythm.includes('early_repolarization')) {
      variantName = 'early_repolarization';
    } else if (currentRhythm.includes('electrical_alternans')) {
      variantName = 'electrical_alternans';
    }

    // Cardiac arrest rhythms
    if (currentRhythm.includes('asystole') || isFlatline) {
      return <WaveformECG height={waveformHeight} variant="flat" hr={0} />;
    } else if (currentRhythm.includes('vfib')) {
      return <WaveformECG height={waveformHeight} variant="vfib" hr={hr} />;
    } else if (currentRhythm.includes('pea') || currentRhythm.includes('pulseless')) {
      return <WaveformECG height={waveformHeight} variant="pea" hr={hr} />;
    }

    // Ventricular arrhythmias
    else if (currentRhythm.includes('vtach')) {
      return <WaveformECG height={waveformHeight} variant="vtach" hr={hr} />;
    } else if (currentRhythm.includes('torsades')) {
      return <WaveformECG height={waveformHeight} variant="torsades" hr={hr} />;
    } else if (currentRhythm.includes('bigeminy')) {
      return <WaveformECG height={waveformHeight} variant="bigeminy" hr={hr} />;
    } else if (currentRhythm.includes('trigeminy')) {
      return <WaveformECG height={waveformHeight} variant="trigeminy" hr={hr} />;
    } else if (currentRhythm.includes('aivr')) {
      return <WaveformECG height={waveformHeight} variant="aivr" hr={hr} />;
    } else if (currentRhythm.includes('idioventricular')) {
      return <WaveformECG height={waveformHeight} variant="idioventricular" hr={hr} />;
    }

    // Atrial arrhythmias
    else if (currentRhythm.includes('afib')) {
      return <WaveformECG height={waveformHeight} variant="afib" hr={hr} />;
    } else if (currentRhythm.includes('aflutter')) {
      return <WaveformECG height={waveformHeight} variant="aflutter" hr={hr} />;
    } else if (currentRhythm.includes('mat')) {
      return <WaveformECG height={waveformHeight} variant="mat" hr={hr} />;
    } else if (currentRhythm.includes('svt')) {
      return <WaveformECG height={waveformHeight} variant="svt" hr={hr} />;
    } else if (currentRhythm.includes('pac')) {
      return <WaveformECG height={waveformHeight} variant="pac" hr={hr} />;
    }

    // Junctional
    else if (currentRhythm.includes('junctional')) {
      return <WaveformECG height={waveformHeight} variant="junctional" hr={hr} />;
    }

    // AV Blocks
    else if (currentRhythm.includes('avblock1')) {
      return <WaveformECG height={waveformHeight} variant="avblock1" hr={hr} />;
    } else if (variantName === 'avblock2_type1' || currentRhythm.includes('wenckebach')) {
      return <WaveformECG height={waveformHeight} variant="avblock2_type1" hr={hr} />;
    } else if (variantName === 'avblock2_type2') {
      return <WaveformECG height={waveformHeight} variant="avblock2_type2" hr={hr} />;
    } else if (variantName === 'avblock3' || currentRhythm.includes('complete_heart_block')) {
      return <WaveformECG height={waveformHeight} variant="avblock3" hr={hr} />;
    }

    // Bundle branch blocks
    else if (variantName === 'lbbb_sgarbossa') {
      return <WaveformECG height={waveformHeight} variant="lbbb_sgarbossa" hr={hr} />;
    } else if (currentRhythm.includes('lbbb')) {
      return <WaveformECG height={waveformHeight} variant="lbbb" hr={hr} />;
    } else if (currentRhythm.includes('rbbb')) {
      return <WaveformECG height={waveformHeight} variant="rbbb" hr={hr} />;
    }

    // Pre-excitation
    else if (currentRhythm.includes('wpw')) {
      return <WaveformECG height={waveformHeight} variant="wpw" hr={hr} />;
    }

    // Paced rhythms
    else if (variantName === 'dual_paced') {
      return <WaveformECG height={waveformHeight} variant="dual_paced" hr={hr} />;
    } else if (currentRhythm.includes('vpaced') || currentRhythm.includes('paced')) {
      return <WaveformECG height={waveformHeight} variant="vpaced" hr={hr} />;
    }

    // Electrolyte abnormalities
    else if (currentRhythm.includes('hyperkalemia')) {
      return <WaveformECG height={waveformHeight} variant="hyperkalemia" hr={hr} />;
    } else if (currentRhythm.includes('hypokalemia')) {
      return <WaveformECG height={waveformHeight} variant="hypokalemia" hr={hr} />;
    }

    // Temperature
    else if (currentRhythm.includes('hypothermia')) {
      return <WaveformECG height={waveformHeight} variant="hypothermia" hr={hr} />;
    }

    // Ischemia / MI patterns
    else if (variantName === 'stemi_inferior') {
      return <WaveformECG height={waveformHeight} variant="stemi_inferior" hr={hr} />;
    } else if (currentRhythm.includes('stemi')) {
      return <WaveformECG height={waveformHeight} variant="stemi" hr={hr} />;
    } else if (currentRhythm.includes('nstemi')) {
      return <WaveformECG height={waveformHeight} variant="nstemi" hr={hr} />;
    }

    // Other pathologies
    else if (currentRhythm.includes('pericarditis')) {
      return <WaveformECG height={waveformHeight} variant="pericarditis" hr={hr} />;
    } else if (variantName === 'pulmonary_embolism' || currentRhythm.includes('s1q3t3')) {
      return <WaveformECG height={waveformHeight} variant="pulmonary_embolism" hr={hr} />;
    } else if (variantName === 'early_repolarization') {
      return <WaveformECG height={waveformHeight} variant="early_repolarization" hr={hr} />;
    } else if (variantName === 'electrical_alternans') {
      return <WaveformECG height={waveformHeight} variant="electrical_alternans" hr={hr} />;
    }

    // Artifact
    else if (currentRhythm.includes('artifact')) {
      return <WaveformECG height={waveformHeight} variant="artifact" hr={hr} />;
    }

    // Sinus variants (check last to avoid false matches)
    else if (currentRhythm.includes('sinus_brady')) {
      return <WaveformECG height={waveformHeight} variant="sinus_brady" hr={hr} />;
    } else if (currentRhythm.includes('sinus_tachy')) {
      return <WaveformECG height={waveformHeight} variant="sinus_tachy" hr={hr} />;
    } else if (currentRhythm.includes('sinus')) {
      return <WaveformECG height={waveformHeight} variant="sinus" hr={hr} />;
    }

    // Default to sinus rhythm
    else {
      return <WaveformECG height={waveformHeight} variant="sinus" hr={hr} />;
    }
  };

  // Safe vitals access
  const safeVitals = displayVitals || DEFAULT_VITALS;
  const hr = safeVitals.hr || 0;
  const spo2 = safeVitals.spo2 || 0;
  const rr = safeVitals.rr || 0;
  const bp = safeVitals.bp || { sys: 0, dia: 0 };
  const temp = safeVitals.temp || 0;
  const etco2 = safeVitals.etco2 || 0;

  // Generate responsive styles
  const styles = useMemo(() => createResponsiveStyles(layoutMode, dimensions), [layoutMode, dimensions]);

  // Responsive waveform heights - MAXIMUM for full amplitude visibility (no clipping)
  const isMobileLayout = layoutMode === 'portrait' || layoutMode === 'landscape';
  const waveformHeight = isMobileLayout ? 95 : 120; // Further increased to prevent any clipping

  return (
    <View style={styles.mainContainer}>
      {/* Monitor display - scrollable to reveal dev tools */}
      <ScrollView
        style={styles.monitorScrollView}
        contentContainerStyle={styles.monitorContent}
        showsVerticalScrollIndicator={true}
        indicatorStyle="white"
        scrollIndicatorInsets={{ right: 1 }}
      >
        {/* Transparent overlay area at top - dims ER room background, scrolls with monitor */}
        <View style={styles.transparentOverlay}>
          {/* 🧪 TEST CONTROLS - Only visible when Test Panel is enabled */}
          {testPanelEnabled && (
            <View style={styles.testControlsContainer}>
              <Text style={styles.testPanelTitle}>🧪 ADAPTIVE SALIENCE TEST PANEL</Text>

              {/* Scenario Preset Buttons */}
              <View style={styles.testButtonRow}>
                {TEST_SCENARIOS.map((scenario) => (
                  <TouchableOpacity
                    key={scenario.key}
                    style={[
                      styles.testScenarioButton,
                      selectedTestScenario?.key === scenario.key && styles.testScenarioButtonActive
                    ]}
                    onPress={() => handleTestScenario(scenario.key)}>
                    <Text style={styles.testButtonText}>{scenario.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Scenario Description - What to Expect */}
              {selectedTestScenario && (
                <View style={styles.testDescriptionContainer}>
                  <Text style={styles.testDescriptionTitle}>What to Expect:</Text>
                  <Text style={styles.testDescriptionText}>{selectedTestScenario.description}</Text>
                </View>
              )}

              {/* Talking Toggle Button */}
              <View style={styles.testButtonRow}>
                <TouchableOpacity
                  style={[styles.testTalkingButton, isTalking && styles.testTalkingButtonActive]}
                  onPress={() => setIsTalking(!isTalking)}>
                  <Text style={styles.testTalkingButtonText}>
                    🗣️ Talking: {isTalking ? 'ON' : 'OFF'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Real-time Status Display */}
              {engineState && Object.keys(engineState).length > 0 && (
                <View style={styles.testStatusContainer}>
                  {Object.entries(engineState).map(([paramName, state]) => {
                    if (!state.active) return null;
                    return (
                      <View key={paramName} style={styles.testStatusRow}>
                        <Text style={styles.testStatusText}>
                          {paramName.toUpperCase()}: {state.phase} ({Math.round(state.elapsed)}s / {state.phase === 'awareness' ? '15s' : state.phase === 'persistence' ? '45s' : '∞'})
                        </Text>
                        <Text style={[styles.testStatusSeverity, { color: state.severity === 'CRITICAL' ? '#ff0000' : state.severity === 'WARNING' ? '#ffaa00' : '#ffff00' }]}>
                          {state.severity}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          )}
        </View>

        {/* Black monitor display container */}
        <View style={styles.monitorDisplayContainer}>
          {/* Close Button (top-right of monitor area) */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>

          {/* ResusMonitor-style layout: Vitals + Waveforms side-by-side - FIRST on mobile */}
          <View style={styles.monitorGrid}>
        {/* CARDIAC WAVEFORMS GROUP - Shared sweep overlay */}
        <View
          style={styles.cardiacGroup}
          onLayout={(e) => {
            const { width } = e.nativeEvent.layout;
            if (width > 0) setCardiacContainerWidth(width);
          }}
        >
          {/* ECG Row with alarm/warning border overlay */}
          <View style={{ position: 'relative' }}>
            <View style={styles.vitalRow}>
              <View style={styles.vitalInfo}>
                <Text style={[styles.vitalLabel, { color: '#00ff00' }]}>ECG</Text>
                {/* 🔊 HR Numeric - visual animation temporarily disabled */}
                <Text style={[styles.vitalValue, { color: '#00ff00' }]}>{Math.round(hr)}</Text>
                <Text style={[styles.vitalUnit, { color: '#00ff00' }]}>bpm</Text>
              </View>
              <View style={styles.waveformArea}>
                {React.cloneElement(getECGWave(), { showSweep: false })}
              </View>
            </View>
            {/* 🚨 Alarm/Warning Border Overlay - TEMPORARILY DISABLED
            {visualAlerts.alarmSource === 'hr' && (
              <Animated.View style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                borderWidth: 3,
                borderColor: visualAlerts.alarmFlashAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['transparent', '#FF0000']
                }),
                borderRadius: 8,
                pointerEvents: 'none'
              }} />
            )}
            */}
          </View>

          {/* SpO₂ Row with alarm/warning border overlay */}
          <View style={{ position: 'relative' }}>
            <View style={styles.vitalRow}>
              <View style={styles.vitalInfo}>
                <Text style={[styles.vitalLabel, { color: '#00ffff' }]}>SpO₂</Text>
                {/* 🫁 SpO₂ Numeric - visual animation temporarily disabled */}
                <Text style={[styles.vitalValue, { color: '#00ffff' }]}>{Math.round(spo2)}</Text>
                <Text style={[styles.vitalUnit, { color: '#00ffff' }]}>%</Text>
              </View>
              <View style={styles.waveformArea}>
                <WaveformPleth height={waveformHeight} hr={hr} spo2={spo2} showSweep={false} />
              </View>
            </View>
            {/* 🚨 Alarm/Warning Border Overlay - TEMPORARILY DISABLED
            {visualAlerts.alarmSource === 'spo2' && (
              <Animated.View style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                borderWidth: 3,
                borderColor: visualAlerts.alarmFlashAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['transparent', '#FF0000']
                }),
                borderRadius: 8,
                pointerEvents: 'none'
              }} />
            )}
            */}
          </View>

          {/* Shared Cardiac Sweep Overlay - covers both ECG and SpO₂ */}
          {cardiacContainerWidth && (
            <CardiacSweepOverlay
              hr={hr}
              numCycles={5}
              containerWidth={cardiacContainerWidth}
              vitalInfoWidth={isMobileLayout ? 54 : 132} // Width of vital numbers area
              waveformVariant={rhythm} // 🩺 Pass ECG type for medically accurate rendering
              // onBeepTrigger removed - now using event-driven Adaptive Salience
            />
          )}
        </View>

        {/* NBP Row - NUMERIC ONLY, no waveform */}
        <View style={styles.vitalRow}>
          <View style={styles.vitalInfo}>
            <Text style={[styles.vitalLabel, { color: '#ff3333' }]}>NBP</Text>
            <Text style={[styles.vitalValue, { color: '#ff3333' }]}>
              {Math.round(bp.sys)}/{Math.round(bp.dia)} ({Math.round(bp.dia + (bp.sys - bp.dia) / 3)})
            </Text>
            <Text style={[styles.vitalUnit, { color: '#ff3333' }]}>mmHg</Text>
          </View>
          {/* No waveform area - numeric only */}
        </View>

        {/* EtCO₂ Row - Only if intubated */}
        {isIntubated && (
          <View
            style={styles.respGroup}
            onLayout={(e) => {
              const { width } = e.nativeEvent.layout;
              if (width > 0) setRespContainerWidth(width);
            }}
          >
            <View style={styles.vitalRow}>
              <View style={styles.vitalInfo}>
                <Text style={[styles.vitalLabel, { color: '#ffff00' }]}>ETCO₂</Text>
                <Text style={[styles.vitalValue, { color: '#ffff00' }]}>{Math.round(etco2)}</Text>
                <Text style={[styles.vitalUnit, { color: '#ffff00' }]}>kPa</Text>
                <Text style={[styles.vitalSubtext, { color: '#ffff00' }]}>RR {Math.round(rr)}</Text>
              </View>
              <View style={styles.waveformArea}>
                <WaveformEtCO2 height={waveformHeight} rr={rr} etco2={etco2} showSweep={false} />
              </View>
            </View>

            {/* Separate Respiratory Sweep Overlay - EtCO₂ only */}
            {respContainerWidth && (
              <RespiratorySweepOverlay
                rr={rr}
                numCycles={5}
                containerWidth={respContainerWidth}
                vitalInfoWidth={isMobileLayout ? 54 : 132} // Width of vital numbers area
              />
            )}
          </View>
        )}

        {/* If NOT intubated, show RR numerically */}
        {!isIntubated && (
          <View style={styles.vitalRow}>
            <View style={styles.vitalInfo}>
              <Text style={[styles.vitalLabel, { color: '#ffff00' }]}>RR</Text>
              <Text style={[styles.vitalValue, { color: '#ffff00' }]}>{Math.round(rr)}</Text>
              <Text style={[styles.vitalUnit, { color: '#ffff00' }]}>bpm</Text>
            </View>
            {/* No waveform when not intubated */}
          </View>
        )}
      </View>

      {/* Medical Monitor Style Alarm Buttons - Positioned below waveforms */}
      <View style={styles.alarmButtonContainer}>
        <TouchableOpacity
          style={[
            styles.medicalButton,
            styles.alarmOnButton,
            isMuted && styles.medicalButtonInactive
          ]}
          onPress={handleSilenceAll}>
          <Text style={[styles.medicalButtonText, styles.alarmOnText]}>
            ALARMS{'\n'}ON
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.medicalButton,
            silenceTimer !== null && styles.medicalButtonActive
          ]}
          onPress={handleSilence30}>
          <Text style={styles.medicalButtonText}>
            MUTE{'\n'}30s
            {silenceTimer !== null && `\n${silenceTimer}`}
          </Text>
        </TouchableOpacity>

        {/* 🔔 MUTE ALL Button - animation temporarily disabled */}
        <TouchableOpacity
          style={[
            styles.medicalButton,
            (isMuted && !silenceTimer) && styles.medicalButtonActive
          ]}
          onPress={handleSilenceAll}>
          <Text style={styles.medicalButtonText}>
            MUTE{'\n'}ALL
          </Text>
        </TouchableOpacity>
      </View>

      {/* Top Controls - Scenario and State Selectors - MOVED BELOW WAVEFORMS */}
      <View style={styles.topControls}>

        <View style={styles.pickerRow}>
          <View style={styles.pickerContainer}>
            <Text style={styles.pickerLabel}>Scenario</Text>
            <Picker
              selectedValue={selectedScenario}
              onValueChange={(value) => {
                setSelectedScenario(value);
                setControlMode('scenario');
                setIsFlatline(false);
              }}
              style={styles.picker}
              itemStyle={styles.pickerItem}
              dropdownIconColor="#00ffff">
              {scenarios.map((s) => (
                <Picker.Item key={s.key} label={s.label} value={s.key} color="#00ffff" />
              ))}
            </Picker>
          </View>

          <View style={styles.pickerContainer}>
            <Text style={styles.pickerLabel}>State</Text>
            <Picker
              selectedValue={selectedState}
              onValueChange={(value) => {
                setSelectedState(value);
                if (controlMode === 'scenario') {
                  // Trigger re-render with new state
                  const scenario = scenarios.find(s => s.key === selectedScenario);
                  if (scenario && scenario.entry) {
                    const newVitals = extractVitalsFromEntry(scenario.entry, value);
                    if (newVitals) {
                      setDisplayVitals(newVitals);
                      setRhythm(newVitals.rhythm || newVitals.waveform);
                    }
                  }
                }
              }}
              style={styles.picker}
              itemStyle={styles.pickerItem}
              dropdownIconColor="#00ffff">
              {states.map((s) => (
                <Picker.Item key={s.key} label={s.label} value={s.key} color="#00ffff" />
              ))}
            </Picker>
          </View>
        </View>
      </View>

      {/* Manual Control Sliders */}
      {controlMode === 'manual' && !isFlatline && (
        <View style={styles.sliderControls}>
          <Text style={styles.sectionTitle}>Manual Controls</Text>

          {/* HR Slider */}
          <View style={styles.sliderRow}>
            <Text style={[styles.sliderLabel, { color: '#00ff00' }]}>
              HR: {Math.round(manualVitals.hr)} bpm
            </Text>
            <Slider
              style={styles.slider}
              minimumValue={40}
              maximumValue={180}
              step={1}
              value={manualVitals.hr}
              onSlidingComplete={(value) => {
                // Trigger smooth 8-second transition when slider is manually adjusted
                setManualVitals({ ...manualVitals, hr: value });
                setTargetHR(value);
                setIsTransitioning(true);
              }}
              onValueChange={(value) => {
                // Update slider position immediately for visual feedback
                setManualVitals({ ...manualVitals, hr: value });
              }}
              minimumTrackTintColor="#00ff00"
              maximumTrackTintColor="#333"
              thumbTintColor="#00ff00"
            />
          </View>

          {/* SpO2 Slider */}
          <View style={styles.sliderRow}>
            <Text style={[styles.sliderLabel, { color: '#00ffff' }]}>
              SpO₂: {Math.round(manualVitals.spo2)}%
            </Text>
            <Slider
              style={styles.slider}
              minimumValue={70}
              maximumValue={100}
              step={1}
              value={manualVitals.spo2}
              onValueChange={(value) =>
                setManualVitals({ ...manualVitals, spo2: value })
              }
              minimumTrackTintColor="#00ffff"
              maximumTrackTintColor="#333"
              thumbTintColor="#00ffff"
            />
          </View>

          {/* BP Sys Slider */}
          <View style={styles.sliderRow}>
            <Text style={[styles.sliderLabel, { color: '#ff3333' }]}>
              BP Sys: {Math.round(manualVitals.bp.sys)} mmHg
            </Text>
            <Slider
              style={styles.slider}
              minimumValue={60}
              maximumValue={200}
              step={1}
              value={manualVitals.bp.sys}
              onValueChange={(value) =>
                setManualVitals({ ...manualVitals, bp: { ...manualVitals.bp, sys: value } })
              }
              minimumTrackTintColor="#ff3333"
              maximumTrackTintColor="#333"
              thumbTintColor="#ff3333"
            />
          </View>

          {/* BP Dia Slider */}
          <View style={styles.sliderRow}>
            <Text style={[styles.sliderLabel, { color: '#ff3333' }]}>
              BP Dia: {Math.round(manualVitals.bp.dia)} mmHg
            </Text>
            <Slider
              style={styles.slider}
              minimumValue={40}
              maximumValue={120}
              step={1}
              value={manualVitals.bp.dia}
              onValueChange={(value) =>
                setManualVitals({ ...manualVitals, bp: { ...manualVitals.bp, dia: value } })
              }
              minimumTrackTintColor="#ff3333"
              maximumTrackTintColor="#333"
              thumbTintColor="#ff3333"
            />
          </View>

          {/* RR Slider */}
          <View style={styles.sliderRow}>
            <Text style={[styles.sliderLabel, { color: '#ffffff' }]}>
              RR: {Math.round(manualVitals.rr)} /min
            </Text>
            <Slider
              style={styles.slider}
              minimumValue={5}
              maximumValue={40}
              step={1}
              value={manualVitals.rr}
              onValueChange={(value) =>
                setManualVitals({ ...manualVitals, rr: value })
              }
              minimumTrackTintColor="#ffffff"
              maximumTrackTintColor="#333"
              thumbTintColor="#ffffff"
            />
          </View>

          {/* Waveform Picker */}
          <View style={styles.sliderRow}>
            <Text style={styles.sliderLabel}>Waveform</Text>
            <Picker
              selectedValue={manualVitals.waveform}
              onValueChange={(itemValue) => {
                setManualVitals({ ...manualVitals, waveform: itemValue, rhythm: itemValue });
                setRhythm(itemValue);

                // Trigger smooth HR transition to typical rate for selected waveform
                const typicalHR = WAVEFORM_HEART_RATES[itemValue] || 75;
                setTargetHR(typicalHR);
                setIsTransitioning(true);
              }}
              style={styles.waveformPicker}
              dropdownIconColor="#00ff00">
              {WAVEFORM_OPTIONS.map((w) => (
                <Picker.Item key={w.key} label={w.label} value={w.key} />
              ))}
            </Picker>
          </View>
        </View>
      )}

      {/* 💀 FLATLINE FULL-SCREEN OVERLAY - TEMPORARILY DISABLED
      {currentMode === 'flatline' && (
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          borderWidth: 8,
          borderColor: '#FF0000',
          backgroundColor: 'rgba(255, 0, 0, 0.05)',
          pointerEvents: 'none',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <Text style={{
            color: '#FF0000',
            fontSize: dimensions.width > 1024 ? 80 : dimensions.width > 768 ? 60 : 48,
            fontWeight: 'bold',
            textShadowColor: '#000',
            textShadowRadius: 20,
            letterSpacing: 8
          }}>
            ASYSTOLE
          </Text>
        </View>
      )}
      */}
        </View>
      </ScrollView>

      {/* Control Buttons - Fixed below scrollable area */}
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.button, isFlatline && styles.buttonActive]}
          onPress={() => setIsFlatline(!isFlatline)}>
          <Text style={styles.buttonText}>FLAT</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, controlMode === 'manual' && styles.buttonActive]}
          onPress={() => {
            setControlMode('manual');
            setIsFlatline(false);
          }}>
          <Text style={styles.buttonText}>MANUAL</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, isIntubated && styles.buttonActive]}
          onPress={() => setIsIntubated(!isIntubated)}>
          <Text style={styles.buttonText}>INTUB</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.testPanelButton, testPanelEnabled && styles.buttonActive]}
          onPress={handleTestPanelToggle}>
          <Text style={styles.buttonText}>🧪 TEST</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function interpolate(a, b, t) {
  const lerp = (x, y) => x + (y - x) * t;
  const safeA = a || DEFAULT_VITALS;
  const safeB = b || DEFAULT_VITALS;

  return {
    hr: lerp(safeA.hr || 0, safeB.hr || 0),
    spo2: lerp(safeA.spo2 || 0, safeB.spo2 || 0),
    rr: lerp(safeA.rr || 0, safeB.rr || 0),
    bp: {
      sys: lerp(safeA.bp?.sys || 0, safeB.bp?.sys || 0),
      dia: lerp(safeA.bp?.dia || 0, safeB.bp?.dia || 0),
    },
    temp: lerp(safeA.temp || 0, safeB.temp || 0),
    etco2: lerp(safeA.etco2 || 0, safeB.etco2 || 0),
  };
}

// Responsive styles generator
const createResponsiveStyles = (layoutMode, dimensions) => {
  const { width, height } = dimensions;

  // Mobile (iOS/Android): Full width, no padding/borders
  const isMobile = layoutMode === 'portrait' || layoutMode === 'landscape';
  const isPortrait = layoutMode === 'portrait';
  // Desktop: Centered with max width, buffer zones
  const isDesktop = layoutMode === 'desktop';

  const maxMonitorWidth = isDesktop ? 800 : '100%';
  const containerHeight = isPortrait ? height * 0.5 : height;

  return StyleSheet.create({
    mainContainer: {
      flex: 1,
      width: '100%',
    },
    monitorScrollView: {
      flex: 1,
      backgroundColor: 'transparent',
      maxWidth: maxMonitorWidth,
      alignSelf: isDesktop ? 'center' : 'stretch',
      width: '100%',
    },
    monitorContent: {
      paddingHorizontal: isMobile ? 8 : 10,
      paddingTop: 0, // No padding at top since overlay acts as spacer
      paddingBottom: isMobile ? 20 : 30,
      backgroundColor: 'transparent',
    },
    transparentOverlay: {
      height: isPortrait ? height * 0.40 : height * 0.22, // Fixed height spacer (40% portrait, 22% landscape)
      backgroundColor: 'rgba(0, 0, 0, 0.15)', // 15% opacity - lighter so we can see the patient!
      width: '100%',
    },
    monitorDisplayContainer: {
      backgroundColor: 'rgba(0, 0, 0, 0.88)', // 88% opacity - balanced transparency to see patient through monitor
      paddingHorizontal: isMobile ? 8 : 10,
      paddingTop: isMobile ? 12 : 10,
      paddingBottom: isMobile ? 20 : 30,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      overflow: 'hidden', // Ensures content respects rounded corners
    },
  topControls: {
    marginBottom: isPortrait ? 3 : 12,
    backgroundColor: '#0a0a0a',
    borderRadius: isPortrait ? 3 : 8,
    padding: isPortrait ? 3 : 10,
    borderWidth: 1,
    borderColor: '#333',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: isPortrait ? 2 : 8,
  },
  statusText: {
    color: '#fff',
    fontSize: isPortrait ? 9 : 12,
    fontWeight: 'bold',
  },
  updateText: {
    color: '#888',
    fontSize: isPortrait ? 8 : 10,
  },
  pickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: isPortrait ? 4 : 8,
  },
  pickerContainer: {
    flex: 1,
    marginHorizontal: 0,
  },
  pickerLabel: {
    color: '#ccc',
    fontSize: isPortrait ? 8 : 11,
    marginBottom: isPortrait ? 1 : 4,
  },
  picker: {
    backgroundColor: '#1a1a1a',
    color: '#00ffff', // Bright cyan for visibility
    height: isPortrait ? 32 : 40, // Increased height for better visibility
    fontSize: isPortrait ? 12 : 14, // Larger font size
    borderWidth: 1,
    borderColor: '#00ffff',
    borderRadius: 4,
  },
  pickerItem: {
    color: '#00ffff', // Cyan text for picker items
    fontSize: isPortrait ? 12 : 14,
    height: isPortrait ? 32 : 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
  },
  value: {
    fontSize: 32,
    fontWeight: 'bold',
    marginHorizontal: 6,
  },
  unit: {
    fontSize: 14,
    color: '#ccc',
  },
  waveContainer: {
    marginTop: 6,
    backgroundColor: '#061208',
    borderRadius: 4,
    overflow: 'hidden',
    paddingLeft: 4,
  },
  waveLabel: {
    position: 'absolute',
    left: 6,
    top: 2,
    fontSize: 10,
    opacity: 0.6,
    zIndex: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    marginBottom: 8,
    gap: isMobile ? 4 : 8,
  },
  button: {
    backgroundColor: '#222',
    paddingVertical: isMobile ? 10 : 12,
    paddingHorizontal: isMobile ? 12 : 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#444',
    flex: 1,
    alignItems: 'center',
  },
  buttonActive: {
    backgroundColor: '#ff3333',
    borderColor: '#ff5555',
  },
  buttonText: {
    color: '#fff',
    fontSize: isMobile ? 11 : 13,
    fontWeight: 'bold',
  },
  // Medical Monitor Style Alarm Buttons
  alarmButtonContainer: {
    flexDirection: 'row',
    marginTop: 12,
    marginBottom: 16,
    marginLeft: 8,
    gap: 8,
  },
  medicalButton: {
    width: 70,
    height: 40,
    backgroundColor: '#2a2a2a',
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#555',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  alarmOnButton: {
    backgroundColor: '#d4a017', // Medical monitor amber/gold
    borderColor: '#f5c842',
  },
  medicalButtonActive: {
    backgroundColor: '#ff4444',
    borderColor: '#ff6666',
  },
  medicalButtonInactive: {
    backgroundColor: '#444',
    borderColor: '#666',
    opacity: 0.5,
  },
  medicalButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 14,
  },
  alarmOnText: {
    color: '#000',
  },
  sliderControls: {
    marginTop: 16,
    backgroundColor: '#0a0a0a',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  sectionTitle: {
    color: '#00ff00',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  sliderRow: {
    marginBottom: 12,
  },
  sliderLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  waveformPicker: {
    backgroundColor: '#1a1a1a',
    color: '#fff',
    marginTop: 4,
  },
  // ResusMonitor-style layout
  closeButton: {
    position: 'absolute',
    top: isPortrait ? 2 : 10,
    right: isPortrait ? 2 : 10,
    zIndex: 1000,
    backgroundColor: '#ff3333',
    width: isPortrait ? 20 : 32,
    height: isPortrait ? 20 : 32,
    borderRadius: isPortrait ? 10 : 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: isPortrait ? 16 : 20,
    fontWeight: 'bold',
  },
  monitorGrid: {
    flex: 1,
    marginTop: isPortrait ? 0 : 12,
    marginBottom: isPortrait ? 0 : 12,
  },
  cardiacGroup: {
    position: 'relative', // For absolute positioning of shared sweep
    width: '100%',
  },
  respGroup: {
    position: 'relative', // For absolute positioning of respiratory sweep
    width: '100%',
  },
  vitalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: isMobile ? 1 : 8, // Spacing between rows
    marginTop: isMobile ? 1 : 0, // Top margin for breathing room
    paddingTop: isMobile ? 1 : 0, // Top padding for spacing
    paddingBottom: isMobile ? 1 : 0, // Bottom padding for spacing
    backgroundColor: isMobile ? 'transparent' : '#0a0a0a',
    borderRadius: isMobile ? 0 : 4,
    padding: isMobile ? 0 : 8,
    paddingLeft: isMobile ? 0 : 8,
    paddingRight: isMobile ? 0 : 8,
    borderWidth: isMobile ? 0 : 1,
    borderColor: '#222',
  },
  vitalInfo: {
    flexShrink: 0, // Don't shrink - take exactly what we need
    minWidth: isMobile ? 50 : 120,
    paddingRight: isMobile ? 4 : 12,
    paddingLeft: 0,
  },
  vitalLabel: {
    fontSize: isMobile ? 10 : 11,
    fontWeight: '600',
    marginBottom: 0,
  },
  vitalValue: {
    fontSize: isMobile ? 28 : 32,
    fontWeight: 'bold',
    fontFamily: 'monospace',
    flexWrap: 'nowrap', // Never wrap numbers
    numberOfLines: 1, // Force single line
  },
  vitalUnit: {
    fontSize: isMobile ? 10 : 11,
    marginTop: 0,
  },
  vitalSubtext: {
    fontSize: isMobile ? 9 : 10,
    marginTop: 0,
    opacity: 0.8,
  },
  waveformArea: {
    flex: 1,
    height: isMobile ? 95 : 120, // Updated to match increased waveformHeight
    minHeight: isMobile ? 95 : 120, // Updated to match increased waveformHeight
  },
  // 🧪 TEST PANEL STYLES
  testPanelButton: {
    backgroundColor: '#1a1a2e', // Distinct color to differentiate from other buttons
    borderColor: '#00ffaa',
  },
  testControlsContainer: {
    padding: isMobile ? 10 : 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)', // Semi-transparent overlay
    borderRadius: 12,
    margin: isMobile ? 8 : 16,
  },
  testPanelTitle: {
    color: '#00ffaa',
    fontSize: isMobile ? 14 : 18,
    fontWeight: 'bold',
    marginBottom: isMobile ? 8 : 12,
    textAlign: 'center',
  },
  testButtonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: isMobile ? 6 : 8,
    marginBottom: isMobile ? 8 : 12,
  },
  testScenarioButton: {
    backgroundColor: '#2a2a4a',
    paddingVertical: isMobile ? 8 : 12,
    paddingHorizontal: isMobile ? 12 : 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#00ffaa',
    minWidth: isMobile ? 60 : 80,
    alignItems: 'center',
  },
  testScenarioButtonActive: {
    backgroundColor: '#00ffaa',
    borderColor: '#00ffcc',
  },
  testButtonText: {
    color: '#00ffaa',
    fontSize: isMobile ? 11 : 13,
    fontWeight: 'bold',
  },
  testDescriptionContainer: {
    marginTop: isMobile ? 10 : 12,
    marginBottom: isMobile ? 10 : 12,
    padding: isMobile ? 12 : 16,
    backgroundColor: 'rgba(0, 255, 170, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#00ffaa',
  },
  testDescriptionTitle: {
    color: '#00ffaa',
    fontSize: isMobile ? 12 : 14,
    fontWeight: 'bold',
    marginBottom: isMobile ? 6 : 8,
  },
  testDescriptionText: {
    color: '#fff',
    fontSize: isMobile ? 11 : 13,
    lineHeight: isMobile ? 16 : 20,
  },
  testTalkingButton: {
    backgroundColor: '#2a2a2a',
    paddingVertical: isMobile ? 10 : 14,
    paddingHorizontal: isMobile ? 20 : 24,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ffaa00',
    alignItems: 'center',
  },
  testTalkingButtonActive: {
    backgroundColor: '#ffaa00',
    borderColor: '#ffcc00',
  },
  testTalkingButtonText: {
    color: '#fff',
    fontSize: isMobile ? 13 : 15,
    fontWeight: 'bold',
  },
  testStatusContainer: {
    marginTop: isMobile ? 8 : 12,
    padding: isMobile ? 8 : 12,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#444',
  },
  testStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: isMobile ? 4 : 6,
    paddingVertical: isMobile ? 4 : 6,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  testStatusText: {
    color: '#fff',
    fontSize: isMobile ? 10 : 12,
    flex: 1,
  },
  testStatusSeverity: {
    fontSize: isMobile ? 11 : 13,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  });
};
