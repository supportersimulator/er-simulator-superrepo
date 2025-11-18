// hooks/useAdaptiveSalience.js
/**
 * ADAPTIVE SALIENCE HOOK
 *
 * React hook that integrates the Adaptive Salience Engine
 * with the Monitor component
 *
 * Responsibilities:
 * - Initialize engine and sound manager
 * - Monitor vital sign changes
 * - Trigger appropriate sound events
 * - Handle acknowledgments
 * - Manage voice activity ducking
 */

import { useEffect, useRef, useState } from 'react';
import AdaptiveSalienceEngine from '../engines/AdaptiveSalienceEngine';
import SoundManager from '../engines/SoundManager';

export function useAdaptiveSalience({ vitals, muted, isSpeaking = false }) {
  const engineRef = useRef(null);
  const soundManagerRef = useRef(null);
  const prevVitalsRef = useRef(vitals);
  const updateIntervalRef = useRef(null);

  const [engineState, setEngineState] = useState(null);

  // Initialize engine and sound manager
  useEffect(() => {
    if (!engineRef.current) {
      engineRef.current = new AdaptiveSalienceEngine();
      console.log('[useAdaptiveSalience] Engine initialized');
    }

    if (!soundManagerRef.current) {
      soundManagerRef.current = new SoundManager();
      soundManagerRef.current.initialize();
      console.log('[useAdaptiveSalience] Sound manager initialized');
    }

    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
      if (soundManagerRef.current) {
        soundManagerRef.current.cleanup();
      }
    };
  }, []);

  // Monitor vitals and trigger sound events
  useEffect(() => {
    if (!engineRef.current || !soundManagerRef.current) return;

    const engine = engineRef.current;
    const soundManager = soundManagerRef.current;
    const prevVitals = prevVitalsRef.current;

    // Check each vital parameter for changes
    const checkVital = async (param, value, allVitals) => {
      const event = engine.updateVital(param, value, allVitals);

      if (event) {
        if (event.type === 'alert' && !muted) {
          await soundManager.playSoundEvent(event);
        } else if (event.type === 'fadeOut') {
          await soundManager.fadeOut(param);
          await soundManager.playNormalizeChime();
        }
      }
    };

    // Update each vital
    checkVital('hr', vitals.hr, vitals);
    checkVital('spo2', vitals.spo2, vitals);
    checkVital('bp', vitals.bp, vitals);
    checkVital('rr', vitals.rr, vitals);
    checkVital('etco2', vitals.etco2, vitals);

    // Check rhythm if it changed
    const currentRhythm = vitals.rhythm || vitals.waveform;
    const prevRhythm = prevVitals.rhythm || prevVitals.waveform;
    if (currentRhythm !== prevRhythm) {
      checkVital('rhythm', currentRhythm, vitals);
    }

    prevVitalsRef.current = vitals;

    // Update engine state for debugging/UI
    setEngineState(engine.getState());
  }, [vitals, muted]);

  // Start periodic check for phase progressions
  useEffect(() => {
    if (!engineRef.current || !soundManagerRef.current) return;

    // Check every second for phase progression
    updateIntervalRef.current = setInterval(() => {
      const engine = engineRef.current;
      const soundManager = soundManagerRef.current;

      if (!engine || !soundManager || muted) return;

      // Check each vital for phase progression
      Object.entries(engine.vitalStates).forEach(async ([param, state]) => {
        if (state.severity > 0 && !state.acknowledged) {
          const event = engine.updateVital(param, state.currentValue, prevVitalsRef.current);
          if (event && event.type === 'alert') {
            await soundManager.playSoundEvent(event);
          }
        }
      });
    }, 1000); // Check every second

    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, [muted]);

  // Handle voice activity ducking
  useEffect(() => {
    if (!engineRef.current || !soundManagerRef.current) return;

    engineRef.current.setDucking(isSpeaking);
    soundManagerRef.current.setDucking(isSpeaking);

    console.log(`[useAdaptiveSalience] Voice activity: ${isSpeaking ? 'speaking' : 'silent'}`);
  }, [isSpeaking]);

  // Handle muted state
  useEffect(() => {
    if (!soundManagerRef.current) return;

    if (muted) {
      soundManagerRef.current.stopAll();
      console.log('[useAdaptiveSalience] Muted - all sounds stopped');
    }
  }, [muted]);

  // Acknowledge a specific vital parameter
  const acknowledge = async (paramName) => {
    if (!engineRef.current || !soundManagerRef.current) return;

    engineRef.current.acknowledge(paramName);
    await soundManagerRef.current.playAcknowledgeChime();
    setEngineState(engineRef.current.getState());

    console.log(`[useAdaptiveSalience] Acknowledged: ${paramName}`);
  };

  // Acknowledge all abnormal vitals
  const acknowledgeAll = async () => {
    if (!engineRef.current || !soundManagerRef.current) return;

    engineRef.current.acknowledgeAll();
    await soundManagerRef.current.playAcknowledgeChime();
    await soundManagerRef.current.stopAll();
    setEngineState(engineRef.current.getState());

    console.log('[useAdaptiveSalience] Acknowledged all vitals');
  };

  // Get highest severity currently active
  const getHighestSeverity = () => {
    if (!engineRef.current) return 0;
    return engineRef.current.getHighestSeverity();
  };

  return {
    // State
    engineState,
    highestSeverity: getHighestSeverity(),

    // Actions
    acknowledge,
    acknowledgeAll,

    // Refs (for advanced usage)
    engine: engineRef.current,
    soundManager: soundManagerRef.current,
  };
}

export default useAdaptiveSalience;
