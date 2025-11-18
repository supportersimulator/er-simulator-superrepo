// hooks/AdaptiveSalienceEngine.js
/**
 * ADAPTIVE SALIENCE AUDIO SYSTEM
 *
 * Core Philosophy:
 * "The monitor is aware of what the user has already noticed."
 *
 * This engine manages the intelligent escalation of audio alerts based on:
 * - Clinical significance of vital changes
 * - Time since abnormality detected
 * - User acknowledgment/engagement
 * - Voice activity (conversation priority)
 *
 * Three-Phase Escalation Model:
 * 1. AWARENESS (0s): Single clear notification tone
 * 2. PERSISTENCE (10-15s): Soft recurring reminder if unacknowledged
 * 3. NEGLECT (30-45s): Louder, more frequent alerts until acknowledged
 *
 * Event-driven, not beat-driven.
 * Sound represents meaning, not motion.
 */

import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * VitalState - Tracks awareness state for each vital parameter
 */
class VitalState {
  constructor(vitalName) {
    this.vitalName = vitalName;
    this.status = 'normal'; // 'normal' | 'warning' | 'critical'
    this.acknowledged = false;
    this.timeEnteredWarning = null;
    this.timeEnteredCritical = null;
    this.lastAlertTime = null;
    this.escalationPhase = 0; // 0 = none, 1 = awareness, 2 = persistence, 3 = neglect
    this.currentValue = null;
    this.thresholdCrossed = false;
    this.sustainedAbnormalStartTime = null; // For hysteresis (3-5s sustain before alert)
  }

  /**
   * Update state when vital crosses threshold
   */
  enterWarning(value, timestamp) {
    if (this.status !== 'warning' && this.status !== 'critical') {
      this.status = 'warning';
      this.timeEnteredWarning = timestamp;
      this.escalationPhase = 1;
      this.acknowledged = false;
      this.currentValue = value;

      if (__DEV__) {
        console.log(`[AdaptiveSalience] ${this.vitalName} entered WARNING state: ${value}`);
      }
    }
  }

  enterCritical(value, timestamp) {
    this.status = 'critical';
    this.timeEnteredCritical = timestamp;
    this.escalationPhase = 1;
    this.acknowledged = false;
    this.currentValue = value;

    if (__DEV__) {
      console.log(`[AdaptiveSalience] ${this.vitalName} entered CRITICAL state: ${value}`);
    }
  }

  /**
   * User acknowledged the abnormality (tap, verbal mention, etc.)
   */
  acknowledge(timestamp) {
    this.acknowledged = true;
    this.lastAlertTime = timestamp;

    // Reset escalation but keep status (still abnormal, just noticed)
    this.escalationPhase = 1;

    if (__DEV__) {
      console.log(`[AdaptiveSalience] ${this.vitalName} ACKNOWLEDGED by user`);
    }
  }

  /**
   * Vital returned to normal - clear all alerts
   */
  returnToNormal(timestamp) {
    if (this.status !== 'normal') {
      if (__DEV__) {
        console.log(`[AdaptiveSalience] ${this.vitalName} returned to NORMAL`);
      }
    }

    this.status = 'normal';
    this.acknowledged = false;
    this.timeEnteredWarning = null;
    this.timeEnteredCritical = null;
    this.escalationPhase = 0;
    this.thresholdCrossed = false;
    this.sustainedAbnormalStartTime = null;
  }

  /**
   * Calculate which escalation phase we should be in based on time elapsed
   */
  getEscalationPhase(currentTime) {
    if (this.status === 'normal' || this.acknowledged) {
      return 0; // No escalation when normal or acknowledged
    }

    const timeInState = this.status === 'critical'
      ? currentTime - this.timeEnteredCritical
      : currentTime - this.timeEnteredWarning;

    // Critical vitals escalate faster
    if (this.status === 'critical') {
      if (timeInState > 20000) return 3; // Neglect after 20s for critical
      if (timeInState > 7000) return 2;  // Persistence after 7s
      return 1; // Awareness
    }

    // Warning vitals use standard timing
    if (timeInState > 30000) return 3; // Neglect after 30s
    if (timeInState > 10000) return 2; // Persistence after 10s
    return 1; // Awareness
  }

  /**
   * Check if enough time has passed to trigger next phase alert
   */
  shouldTriggerAlert(currentTime) {
    const phase = this.getEscalationPhase(currentTime);
    this.escalationPhase = phase;

    if (phase === 0) return false; // Normal or acknowledged

    // Calculate interval based on phase
    let interval;
    if (phase === 1) {
      interval = Infinity; // Phase 1 = single tone only
    } else if (phase === 2) {
      interval = this.status === 'critical' ? 4000 : 6000; // 4s or 6s
    } else {
      interval = this.status === 'critical' ? 2000 : 3000; // 2s or 3s
    }

    // Check if enough time passed since last alert
    if (!this.lastAlertTime || (currentTime - this.lastAlertTime) >= interval) {
      this.lastAlertTime = currentTime;
      return true;
    }

    return false;
  }
}

/**
 * useAdaptiveSalience Hook
 *
 * Central state manager for all vital parameters
 * Tracks escalation phases and determines when alerts should fire
 */
export default function useAdaptiveSalience(vitals, options = {}) {
  const {
    enableAdaptiveSalience = true, // Master toggle
    onAlert = null, // Callback when alert should trigger: (vitalName, phase, severity) => {}
    hysteresisTime = 3000, // Time abnormal must persist before alerting (3s default)
  } = options;

  // State for each vital parameter
  const vitalStates = useRef({
    hr: new VitalState('HR'),
    spo2: new VitalState('SpO2'),
    bp: new VitalState('BP'),
    rr: new VitalState('RR'),
    etco2: new VitalState('EtCO2'),
  });

  // Timer for checking escalation phases
  const escalationTimer = useRef(null);

  /**
   * Determine if HR is abnormal and at what severity
   */
  const checkHR = useCallback((hr, currentTime) => {
    const state = vitalStates.current.hr;

    if (hr === 0) {
      // Asystole - CRITICAL
      state.enterCritical(hr, currentTime);
      return { abnormal: true, severity: 'critical' };
    } else if (hr < 40 || hr > 160) {
      // Severe brady/tachy - CRITICAL
      state.enterCritical(hr, currentTime);
      return { abnormal: true, severity: 'critical' };
    } else if (hr < 50 || hr > 140) {
      // Moderate brady/tachy - WARNING
      state.enterWarning(hr, currentTime);
      return { abnormal: true, severity: 'warning' };
    } else if (hr >= 50 && hr <= 120) {
      // Normal range
      if (state.status !== 'normal') {
        state.returnToNormal(currentTime);
      }
      return { abnormal: false };
    } else {
      // Mild tachy (120-140) - WARNING after sustain
      state.enterWarning(hr, currentTime);
      return { abnormal: true, severity: 'warning' };
    }
  }, []);

  /**
   * Determine if SpO2 is abnormal
   */
  const checkSpO2 = useCallback((spo2, currentTime) => {
    const state = vitalStates.current.spo2;

    if (spo2 < 85) {
      state.enterCritical(spo2, currentTime);
      return { abnormal: true, severity: 'critical' };
    } else if (spo2 < 90) {
      state.enterWarning(spo2, currentTime);
      return { abnormal: true, severity: 'warning' };
    } else if (spo2 < 95) {
      state.enterWarning(spo2, currentTime);
      return { abnormal: true, severity: 'warning' };
    } else {
      if (state.status !== 'normal') {
        state.returnToNormal(currentTime);
      }
      return { abnormal: false };
    }
  }, []);

  /**
   * Determine if BP is abnormal
   */
  const checkBP = useCallback((bp, currentTime) => {
    const state = vitalStates.current.bp;
    const sys = bp?.sys || 0;
    const dia = bp?.dia || 0;
    const map = sys > 0 ? (sys + 2 * dia) / 3 : 0;

    if (sys < 70 || map < 50) {
      // Severe hypotension - CRITICAL
      state.enterCritical(sys, currentTime);
      return { abnormal: true, severity: 'critical' };
    } else if (sys < 90 || map < 60) {
      // Moderate hypotension - WARNING
      state.enterWarning(sys, currentTime);
      return { abnormal: true, severity: 'warning' };
    } else if (sys > 180 || dia > 110) {
      // Severe hypertension - CRITICAL
      state.enterCritical(sys, currentTime);
      return { abnormal: true, severity: 'critical' };
    } else if (sys > 160 || dia > 100) {
      // Moderate hypertension - WARNING
      state.enterWarning(sys, currentTime);
      return { abnormal: true, severity: 'warning' };
    } else {
      if (state.status !== 'normal') {
        state.returnToNormal(currentTime);
      }
      return { abnormal: false };
    }
  }, []);

  /**
   * Check RR (Respiratory Rate)
   */
  const checkRR = useCallback((rr, currentTime) => {
    const state = vitalStates.current.rr;

    if (rr < 6 || rr > 35) {
      state.enterCritical(rr, currentTime);
      return { abnormal: true, severity: 'critical' };
    } else if (rr < 8 || rr > 30) {
      state.enterWarning(rr, currentTime);
      return { abnormal: true, severity: 'warning' };
    } else {
      if (state.status !== 'normal') {
        state.returnToNormal(currentTime);
      }
      return { abnormal: false };
    }
  }, []);

  /**
   * Check EtCO2
   */
  const checkEtCO2 = useCallback((etco2, currentTime) => {
    const state = vitalStates.current.etco2;

    if (etco2 < 20 || etco2 > 70) {
      state.enterCritical(etco2, currentTime);
      return { abnormal: true, severity: 'critical' };
    } else if (etco2 < 25 || etco2 > 60) {
      state.enterWarning(etco2, currentTime);
      return { abnormal: true, severity: 'warning' };
    } else {
      if (state.status !== 'normal') {
        state.returnToNormal(currentTime);
      }
      return { abnormal: false };
    }
  }, []);

  /**
   * Main monitoring loop - checks all vitals and triggers alerts
   */
  useEffect(() => {
    if (!enableAdaptiveSalience) return;

    const checkAllVitals = () => {
      const currentTime = Date.now();

      // Check each vital
      checkHR(vitals.vs_hr || vitals.hr || 0, currentTime);
      checkSpO2(vitals.vs_spo2 || vitals.spo2 || 100, currentTime);
      checkBP(vitals.bp || { sys: 120, dia: 80 }, currentTime);
      checkRR(vitals.rr || 16, currentTime);
      checkEtCO2(vitals.etco2 || 40, currentTime);

      // Check each vital's escalation phase and trigger alerts
      Object.entries(vitalStates.current).forEach(([vitalName, state]) => {
        if (state.shouldTriggerAlert(currentTime)) {
          if (onAlert) {
            onAlert(vitalName, state.escalationPhase, state.status);
          }
        }
      });
    };

    // Check every 500ms for escalation phase changes
    escalationTimer.current = setInterval(checkAllVitals, 500);

    return () => {
      if (escalationTimer.current) {
        clearInterval(escalationTimer.current);
      }
    };
  }, [vitals, enableAdaptiveSalience, onAlert, checkHR, checkSpO2, checkBP, checkRR, checkEtCO2]);

  /**
   * Acknowledge a specific vital (user tapped, mentioned it verbally, etc.)
   */
  const acknowledgeVital = useCallback((vitalName) => {
    const state = vitalStates.current[vitalName];
    if (state) {
      state.acknowledge(Date.now());
    }
  }, []);

  /**
   * Acknowledge all active alerts
   */
  const acknowledgeAll = useCallback(() => {
    const currentTime = Date.now();
    Object.values(vitalStates.current).forEach(state => {
      if (state.status !== 'normal') {
        state.acknowledge(currentTime);
      }
    });

    if (__DEV__) {
      console.log('[AdaptiveSalience] All alerts ACKNOWLEDGED');
    }
  }, []);

  /**
   * Get current states for UI display
   */
  const getVitalStates = useCallback(() => {
    return Object.fromEntries(
      Object.entries(vitalStates.current).map(([name, state]) => [
        name,
        {
          status: state.status,
          acknowledged: state.acknowledged,
          escalationPhase: state.escalationPhase,
          value: state.currentValue,
        },
      ])
    );
  }, []);

  return {
    acknowledgeVital,
    acknowledgeAll,
    getVitalStates,
    vitalStates: vitalStates.current,
  };
}
