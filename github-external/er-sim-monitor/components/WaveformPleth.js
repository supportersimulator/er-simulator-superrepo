import React, { useEffect } from 'react';
import Waveform from './Waveform';
import rWavePositions from '../assets/waveforms/r-wave-positions.json';

/**
 * Plethysmography Waveform Generator
 *
 * Features 10 perfusion index (PI) variants from 0-10:
 * - PI 0-1: Flatline/absent perfusion
 * - PI 2-3: Very weak/weak signal
 * - PI 4-5: Low-moderate to moderate perfusion
 * - PI 6-7: Moderately strong to strong signal
 * - PI 8-10: Very strong to maximal perfusion
 *
 * Perfusion Index is calculated from SpO2:
 * - SpO2 >= 95: PI = 8-10 (excellent)
 * - SpO2 85-94: PI = 5-7 (moderate to strong)
 * - SpO2 75-84: PI = 2-4 (weak to low-moderate)
 * - SpO2 < 75: PI = 0-1 (absent to very weak)
 *
 * 🔗 Synchronization with ECG R-waves:
 * SpO2 peaks are synchronized with ECG R-wave positions from r-wave-positions.json.
 * Each R-wave represents a ventricular contraction, which produces a peripheral pulse
 * detected by pulse oximetry.
 *
 * ⏱️ Pulse Transit Time (PTT):
 * The SpO2 waveform includes physiologically accurate pulse transit time delay.
 * - R-wave occurs at time 0 (ventricular depolarization)
 * - SpO2 upstroke begins ~200-300ms later (~22% of R-R interval)
 * - This represents the time for the pulse wave to travel from heart to fingertip
 * - Matches what clinicians see at the bedside with real monitors
 *
 * Clinical accuracy:
 * - Normal PTT: 200-300ms (healthy adult)
 * - Longer in hypotension, vasoconstriction, hypothermia
 * - SpO2 trace visibly "lags" behind ECG, just like real life
 *
 * 💓 Heart Rate-Dependent Amplitude Scaling:
 * High heart rates reduce plethysmography amplitude due to reduced stroke volume.
 * - Normal HR (60-100): Full amplitude pleth waves
 * - Moderate tachy (120-139): 5-15% amplitude reduction
 * - Severe tachy (140+): 20-50% amplitude reduction (shallow, rapid pulses)
 * - Exception: High SpO2 (≥98%) partially compensates (suggests good cardiac output)
 *
 * Clinical scenarios:
 * - Septic shock (HR 150, SpO2 92%): Shallow, thready pulses
 * - SVT in healthy patient (HR 180, SpO2 99%): Rapid but moderate amplitude
 * - AFib with RVR (HR 140, SpO2 94%): Irregular + shallow pulses
 */
export default function WaveformPleth(props) {
  const { hr = 75, spo2 = 98, ecgVariant = null, onPulseToneTrigger = null, ...otherProps } = props;

  // Load R-wave positions for the current ECG variant
  // These are normalized positions (0.0 to 1.0) where R-waves occur in the waveform
  const rWaves = ecgVariant && rWavePositions[ecgVariant] ? rWavePositions[ecgVariant] : null;

  // Debug logging to verify R-wave synchronization and HR effects (only log when values change)
  useEffect(() => {
    if (ecgVariant && rWaves) {
      console.log(`[pleth] 🔗 Synced to ECG variant: ${ecgVariant} with ${rWaves.length} R-waves`);
    } else if (ecgVariant && !rWaves) {
      console.log(`[pleth] ⚠️ ECG variant "${ecgVariant}" has no R-wave data, using fallback`);
    }

    // Log HR-dependent amplitude scaling when in tachycardia range
    if (hr >= 140) {
      const reduction = Math.round((1 - Math.max(0.5, 1.0 - ((hr - 140) * 0.005))) * 100);
      console.log(`[pleth] 💓 Severe tachycardia (HR ${hr}): ${reduction}% amplitude reduction ${spo2 >= 98 ? '(partially compensated)' : ''}`);
    } else if (hr >= 120) {
      const reduction = Math.round((1 - (1.0 - ((hr - 120) * 0.0075))) * 100);
      console.log(`[pleth] 💓 Moderate tachycardia (HR ${hr}): ${reduction}% amplitude reduction`);
    }
  }, [ecgVariant, rWaves, hr]);

  // If we have R-wave positions, use them to determine number of cycles
  // Otherwise fall back to default 5 cycles
  const numCycles = rWaves ? rWaves.length : 5;

  // Calculate Perfusion Index (0-10) from SpO2
  const calculatePerfusionIndex = (spo2Value) => {
    if (spo2Value >= 98) return 10;  // Maximal
    if (spo2Value >= 95) return 8;   // Very strong
    if (spo2Value >= 92) return 7;   // Strong
    if (spo2Value >= 88) return 6;   // Moderately strong
    if (spo2Value >= 85) return 5;   // Moderate
    if (spo2Value >= 82) return 4;   // Low-moderate
    if (spo2Value >= 78) return 3;   // Weak
    if (spo2Value >= 75) return 2;   // Very weak
    if (spo2Value >= 70) return 1;   // Trace
    return 0;                         // Absent/flatline
  };

  let perfusionIndex = calculatePerfusionIndex(spo2);

  // 💓 HR-dependent amplitude scaling (tachycardia effects)
  // Clinical reality: High HR → reduced diastolic filling → smaller stroke volume → shallower pulses
  // This matches what you see at the bedside with tachycardic patients
  if (hr >= 140) {
    // Severe tachycardia (140+): Significant amplitude reduction
    // At HR 140: reduce by 20%, At HR 180: reduce by 40%, At HR 200+: reduce by 50%
    const reductionFactor = Math.max(0.5, 1.0 - ((hr - 140) * 0.005));
    perfusionIndex *= reductionFactor;

    // Exception: Excellent SpO2 (≥98%) suggests good compensation
    // Young, healthy patients can maintain decent stroke volume despite tachycardia
    if (spo2 >= 98) {
      perfusionIndex *= 1.15; // Partial restoration (still reduced, but not as severe)
    }
  } else if (hr >= 120) {
    // Moderate tachycardia (120-139): Mild amplitude reduction
    // At HR 120: reduce by 5%, At HR 139: reduce by ~15%
    const reductionFactor = 1.0 - ((hr - 120) * 0.0075);
    perfusionIndex *= reductionFactor;

    // High SpO2 preserves amplitude better in moderate tachycardia
    if (spo2 >= 98) {
      perfusionIndex *= 1.1;
    }
  }

  const generator = (x, containerWidth) => {
    // Perfusion Index determines amplitude scaling
    // PI 0 = 0% amplitude (flatline)
    // PI 10 = 100% amplitude (maximal)
    const perfusionScale = perfusionIndex / 10.0;

    // Add subtle noise for low perfusion states
    const noise = perfusionIndex < 3 ? Math.sin(x * 0.3) * (3 - perfusionIndex) : 0;

    // Base amplitude - scaled to fit display area properly
    // Peak value should be ~40-45px in a 60px height waveform area
    const BASE_AMP = 1.5;
    const AMP = BASE_AMP * perfusionScale;

    // Flatline for PI 0
    if (perfusionIndex === 0) {
      return noise * 0.5;
    }

    // 🔗 R-wave synchronized pleth waveform with physiological pulse transit time (PTT)
    if (rWaves && rWaves.length > 0) {
      // Normalize x position (0.0 to 1.0 across container width)
      const normalizedX = x / containerWidth;

      // Pulse Transit Time (PTT): delay from R-wave to peripheral pulse detection
      // Clinical range: 200-300ms, or ~20-25% of R-R interval
      // We'll use 22% as typical for healthy adult at rest
      const PULSE_TRANSIT_DELAY = 0.22;

      // Find which R-wave cycle we're in
      let cycleStart = 0;
      let cycleEnd = 1.0;
      let rWavePos = 0;

      for (let i = 0; i < rWaves.length; i++) {
        const currentRWave = rWaves[i];
        const nextRWavePos = i < rWaves.length - 1 ? rWaves[i + 1] : 1.0;

        if (normalizedX >= currentRWave && normalizedX < nextRWavePos) {
          rWavePos = currentRWave;
          cycleStart = currentRWave;
          cycleEnd = nextRWavePos;
          break;
        }
      }

      // Calculate progress within this specific R-R interval
      const cycleLength = cycleEnd - cycleStart;
      const progressInCycle = cycleLength > 0 ? (normalizedX - cycleStart) / cycleLength : 0;

      // Apply pulse transit time delay
      // SpO2 upstroke begins AFTER the PTT delay from R-wave
      const delayedProgress = progressInCycle - PULSE_TRANSIT_DELAY;

      // Before PTT delay = baseline (no pulse wave arrived yet)
      if (delayedProgress < 0) {
        return 0 + noise;
      }

      // Use delayedProgress directly as the waveform progress
      // This keeps the waveform timing consistent regardless of R-R interval variability
      const progress = delayedProgress;

      // Pleth waveform morphology (same as before, but now synced to R-waves)
      // Systolic upstroke (0-15%)
      if (progress < 0.15) {
        const rise = progress / 0.15;
        return (30 * Math.pow(rise, 1.5)) * AMP + noise;
      }

      // Peak plateau (15-25%)
      if (progress < 0.25) {
        const peak = (progress - 0.15) / 0.1;
        return (30 - peak * 7) * AMP + noise;
      }

      // Dicrotic notch (25-35%) - only visible in higher PI
      if (progress < 0.35) {
        const notch = (progress - 0.25) / 0.1;
        const notchDepth = perfusionIndex >= 5 ? 3 : 1; // Clearer notch at higher PI
        return (23 + Math.sin(notch * Math.PI) * notchDepth) * AMP + noise;
      }

      // Diastolic decay (35-80%)
      if (progress < 0.8) {
        const decay = (progress - 0.35) / 0.45;
        return (23 * Math.exp(-decay * 3)) * AMP + noise;
      }

      // Baseline (80-100%)
      return 0 + noise;
    }

    // 🔄 Fallback: Uniform cycles (old behavior when no R-wave data available)
    const cycleLength = containerWidth / numCycles;
    const t = x % cycleLength;
    const progress = t / cycleLength;

    // Systolic upstroke (0-15%)
    if (progress < 0.15) {
      const rise = progress / 0.15;
      return (30 * Math.pow(rise, 1.5)) * AMP + noise;
    }

    // Peak plateau (15-25%)
    if (progress < 0.25) {
      const peak = (progress - 0.15) / 0.1;
      return (30 - peak * 7) * AMP + noise;
    }

    // Dicrotic notch (25-35%) - only visible in higher PI
    if (progress < 0.35) {
      const notch = (progress - 0.25) / 0.1;
      const notchDepth = perfusionIndex >= 5 ? 3 : 1; // Clearer notch at higher PI
      return (23 + Math.sin(notch * Math.PI) * notchDepth) * AMP + noise;
    }

    // Diastolic decay (35-80%)
    if (progress < 0.8) {
      const decay = (progress - 0.35) / 0.45;
      return (23 * Math.exp(-decay * 3)) * AMP + noise;
    }

    // Baseline (80-100%)
    return 0 + noise;
  };

  return (
    <Waveform
      {...otherProps}
      type="pleth"
      color="#00ffff"
      amplitude={0.9}
      hr={hr}
      numCycles={numCycles}
      generator={generator}
      onPulseToneTrigger={onPulseToneTrigger} // 🎵 Pass pulse tone callback
      perfusionIndex={perfusionIndex} // Pass perfusion index for volume calculation
      rWavePositions={rWaves} // Pass R-wave positions for SpO2 peak synchronization
      pttDelay={0.22} // Pulse transit time delay (200-300ms typical)
    />
  );
}
