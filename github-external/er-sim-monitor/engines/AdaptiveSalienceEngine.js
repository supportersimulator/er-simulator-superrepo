// engines/AdaptiveSalienceEngine.js
/**
 * ADAPTIVE SALIENCE ENGINE
 *
 * Philosophy: "Only sound when sound adds value"
 *
 * Core Responsibilities:
 * - Track escalation phases for each vital parameter
 * - Manage acknowledgment state
 * - Determine when to trigger sounds based on time + engagement
 * - Provide intelligent context-aware alerting
 *
 * Three-Phase Escalation Model:
 * 1. AWARENESS (0s) - Single clear notification
 * 2. PERSISTENCE (10-15s) - Soft periodic reminder
 * 3. NEGLECT (30-45s) - Louder, more insistent
 */

const PHASES = {
  NORMAL: 'normal',
  AWARENESS: 'awareness',
  PERSISTENCE: 'persistence',
  NEGLECT: 'neglect',
};

const PHASE_TIMINGS = {
  AWARENESS: 0,        // Immediate
  PERSISTENCE: 15000,  // 15 seconds
  NEGLECT: 45000,      // 45 seconds
};

const SEVERITY = {
  NORMAL: 0,
  INFO: 1,
  WARNING: 2,
  CRITICAL: 3,
};

export class AdaptiveSalienceEngine {
  constructor() {
    // State for each vital parameter
    this.vitalStates = {
      hr: this.createVitalState('hr'),
      spo2: this.createVitalState('spo2'),
      bp: this.createVitalState('bp'),
      rr: this.createVitalState('rr'),
      etco2: this.createVitalState('etco2'),
      rhythm: this.createVitalState('rhythm'),
    };

    // Global ducking state (for voice activity)
    this.isDucked = false;
    this.duckingVolume = 0.3; // 30% volume during speech

    // Sound event queue
    this.eventQueue = [];
    this.lastSoundTime = 0;
    this.minSoundInterval = 2000; // Min 2s between any sounds globally
  }

  createVitalState(paramName) {
    return {
      paramName,
      currentValue: null,
      status: PHASES.NORMAL,
      severity: SEVERITY.NORMAL,
      timeEnteredStatus: null,
      acknowledged: false,
      lastAlertTime: null,
      thresholdCrossed: null,
    };
  }

  /**
   * Update vital value and check for threshold crossings
   */
  updateVital(paramName, value, vitals = {}) {
    const state = this.vitalStates[paramName];
    if (!state) return null;

    const previousValue = state.currentValue;
    state.currentValue = value;

    // Evaluate thresholds and determine severity
    const evaluation = this.evaluateVital(paramName, value, vitals);

    // Check if status changed
    if (evaluation.severity !== state.severity) {
      // Status change detected
      state.severity = evaluation.severity;
      state.thresholdCrossed = evaluation.threshold;

      if (evaluation.severity > SEVERITY.NORMAL) {
        // Entering abnormal state - start AWARENESS phase
        state.status = PHASES.AWARENESS;
        state.timeEnteredStatus = Date.now();
        state.acknowledged = false;

        return this.createSoundEvent(paramName, PHASES.AWARENESS, evaluation);
      } else {
        // Returning to normal - reset
        this.resetVital(paramName);
        return { type: 'fadeOut', paramName };
      }
    }

    // If already abnormal and not acknowledged, check for phase progression
    if (state.severity > SEVERITY.NORMAL && !state.acknowledged) {
      const newPhase = this.calculatePhase(state);

      if (newPhase !== state.status) {
        state.status = newPhase;
        return this.createSoundEvent(paramName, newPhase, evaluation);
      }

      // Check if we should repeat the current phase sound
      if (this.shouldRepeatSound(state)) {
        return this.createSoundEvent(paramName, state.status, evaluation);
      }
    }

    return null;
  }

  /**
   * Evaluate vital against thresholds and return severity + details
   */
  evaluateVital(paramName, value, vitals) {
    switch (paramName) {
      case 'hr':
        return this.evaluateHR(value);
      case 'spo2':
        return this.evaluateSpo2(value);
      case 'bp':
        return this.evaluateBP(vitals.bp);
      case 'rr':
        return this.evaluateRR(value);
      case 'etco2':
        return this.evaluateEtCO2(value);
      case 'rhythm':
        return this.evaluateRhythm(value);
      default:
        return { severity: SEVERITY.NORMAL, threshold: null };
    }
  }

  evaluateHR(hr) {
    if (hr >= 150) {
      return { severity: SEVERITY.CRITICAL, threshold: 'severe_tachycardia', value: hr };
    } else if (hr >= 120) {
      return { severity: SEVERITY.WARNING, threshold: 'tachycardia', value: hr };
    } else if (hr <= 40) {
      return { severity: SEVERITY.CRITICAL, threshold: 'severe_bradycardia', value: hr };
    } else if (hr <= 50) {
      return { severity: SEVERITY.WARNING, threshold: 'bradycardia', value: hr };
    }
    return { severity: SEVERITY.NORMAL, threshold: null };
  }

  evaluateSpo2(spo2) {
    if (spo2 < 85) {
      return { severity: SEVERITY.CRITICAL, threshold: 'severe_hypoxia', value: spo2 };
    } else if (spo2 < 90) {
      return { severity: SEVERITY.WARNING, threshold: 'hypoxia', value: spo2 };
    } else if (spo2 < 95) {
      return { severity: SEVERITY.INFO, threshold: 'mild_hypoxia', value: spo2 };
    }
    return { severity: SEVERITY.NORMAL, threshold: null };
  }

  evaluateBP(bp) {
    if (!bp) return { severity: SEVERITY.NORMAL, threshold: null };

    const sys = bp.sys || 0;
    const dia = bp.dia || 0;
    const map = (sys + 2 * dia) / 3;

    if (sys < 80 || map < 60) {
      return { severity: SEVERITY.CRITICAL, threshold: 'severe_hypotension', value: { sys, dia, map } };
    } else if (sys < 90) {
      return { severity: SEVERITY.WARNING, threshold: 'hypotension', value: { sys, dia, map } };
    } else if (sys > 160) {
      return { severity: SEVERITY.WARNING, threshold: 'hypertension', value: { sys, dia, map } };
    }
    return { severity: SEVERITY.NORMAL, threshold: null };
  }

  evaluateRR(rr) {
    if (rr > 30 || rr < 8) {
      return { severity: SEVERITY.WARNING, threshold: rr > 30 ? 'tachypnea' : 'bradypnea', value: rr };
    }
    return { severity: SEVERITY.NORMAL, threshold: null };
  }

  evaluateEtCO2(etco2) {
    if (etco2 < 25 || etco2 > 60) {
      return { severity: SEVERITY.WARNING, threshold: etco2 < 25 ? 'low_etco2' : 'high_etco2', value: etco2 };
    }
    return { severity: SEVERITY.NORMAL, threshold: null };
  }

  evaluateRhythm(rhythm) {
    const criticalRhythms = ['vfib', 'vtach', 'asystole', 'pea'];
    const warningRhythms = ['afib', 'aflutter', 'svt'];

    if (criticalRhythms.includes(rhythm)) {
      return { severity: SEVERITY.CRITICAL, threshold: rhythm, value: rhythm };
    } else if (warningRhythms.includes(rhythm)) {
      return { severity: SEVERITY.WARNING, threshold: rhythm, value: rhythm };
    }
    return { severity: SEVERITY.NORMAL, threshold: null };
  }

  /**
   * Calculate which phase the vital should be in based on time
   */
  calculatePhase(state) {
    if (!state.timeEnteredStatus) return PHASES.NORMAL;

    const elapsed = Date.now() - state.timeEnteredStatus;

    if (elapsed >= PHASE_TIMINGS.NEGLECT) {
      return PHASES.NEGLECT;
    } else if (elapsed >= PHASE_TIMINGS.PERSISTENCE) {
      return PHASES.PERSISTENCE;
    } else {
      return PHASES.AWARENESS;
    }
  }

  /**
   * Determine if we should repeat the sound for the current phase
   */
  shouldRepeatSound(state) {
    if (!state.lastAlertTime) return false;

    const intervals = {
      [PHASES.AWARENESS]: null, // Only plays once
      [PHASES.PERSISTENCE]: 6000, // Every 6 seconds
      [PHASES.NEGLECT]: 3000, // Every 3 seconds
    };

    const interval = intervals[state.status];
    if (!interval) return false;

    const elapsed = Date.now() - state.lastAlertTime;
    return elapsed >= interval;
  }

  /**
   * Create a sound event object
   */
  createSoundEvent(paramName, phase, evaluation) {
    const state = this.vitalStates[paramName];
    state.lastAlertTime = Date.now();

    const volumes = {
      [PHASES.AWARENESS]: 0.6,
      [PHASES.PERSISTENCE]: 0.35,
      [PHASES.NEGLECT]: 0.65,
    };

    // Critical alarms maintain 50% volume during voice activity (not 30%)
    // to remain audible during emergencies
    const duckMultiplier = (this.isDucked && evaluation.severity === SEVERITY.CRITICAL)
      ? 0.5  // Critical: 50% volume during speech
      : this.isDucked
      ? this.duckingVolume  // Others: 30% volume during speech
      : 1.0;  // No ducking: full volume

    return {
      type: 'alert',
      paramName,
      phase,
      severity: evaluation.severity,
      threshold: evaluation.threshold,
      volume: volumes[phase] * duckMultiplier,
      timestamp: Date.now(),
    };
  }

  /**
   * Acknowledge a vital parameter (resets escalation)
   */
  acknowledge(paramName) {
    const state = this.vitalStates[paramName];
    if (!state) return;

    state.acknowledged = true;

    // If still abnormal, reset to AWARENESS phase
    if (state.severity > SEVERITY.NORMAL) {
      state.status = PHASES.AWARENESS;
      state.timeEnteredStatus = Date.now();
    }
  }

  /**
   * Acknowledge all abnormal vitals
   */
  acknowledgeAll() {
    Object.keys(this.vitalStates).forEach(param => {
      if (this.vitalStates[param].severity > SEVERITY.NORMAL) {
        this.acknowledge(param);
      }
    });
  }

  /**
   * Reset vital to normal state
   */
  resetVital(paramName) {
    const state = this.vitalStates[paramName];
    if (!state) return;

    state.status = PHASES.NORMAL;
    state.severity = SEVERITY.NORMAL;
    state.acknowledged = false;
    state.timeEnteredStatus = null;
    state.lastAlertTime = null;
    state.thresholdCrossed = null;
  }

  /**
   * Set ducking state (for voice activity)
   */
  setDucking(isDucked) {
    this.isDucked = isDucked;
  }

  /**
   * Get current state for debugging/UI
   */
  getState() {
    return {
      vitals: this.vitalStates,
      isDucked: this.isDucked,
    };
  }

  /**
   * Get highest severity currently active
   */
  getHighestSeverity() {
    return Math.max(...Object.values(this.vitalStates).map(s => s.severity));
  }
}

export default AdaptiveSalienceEngine;
