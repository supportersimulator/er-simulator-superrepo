import { useMemo } from 'react';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Waveform from './Waveform';
import { WAVEFORM_DATA } from '../assets/waveforms/svg/waveforms';

/**
 * ECG Waveform Renderer
 *
 * Rendering Strategy:
 * 1. Check if SVG waveform exists in assets/waveforms/svg/ (traced from real ECG strips)
 * 2. If SVG exists, use SVG rendering with preserveAspectRatio="none" for responsive scaling
 * 3. If no SVG, fall back to mathematical generator
 *
 * SVG Scaling: Uses preserveAspectRatio="none" for lightweight, dynamic responsiveness across:
 * - iOS (iPhone/iPad, portrait/landscape)
 * - Android (phones/tablets, portrait/landscape)
 * - Web (desktop, mobile, responsive breakpoints)
 */

export default function WaveformECG(props) {
  const { variant = 'sinus', hr = 75, ...otherProps } = props;

  // Check if SVG waveform data exists for this variant (traced from real ECG)
  // Universal naming: registry keys match variant names directly (e.g., 'vfib_ecg', 'afib_ecg')
  const svgData = WAVEFORM_DATA[variant];

  // 🔍 DEBUG: Log waveform loading
  if (variant?.includes('vfib')) {
    console.log('🔍 VFib Debug:', {
      variant,
      svgDataExists: !!svgData,
      svgDataKeys: svgData ? Object.keys(svgData) : 'NO DATA',
      pathLength: svgData?.path?.length || 0,
      allWaveformKeys: Object.keys(WAVEFORM_DATA)
    });
  }

  const numCycles = 5;

  // Generator with BIGGER amplitudes for visibility
  const generator = (x, containerWidth) => {
    const cycleLength = containerWidth / numCycles;
    const t = x % cycleLength;
    const progress = t / cycleLength;

    // Amplitude multiplier for better visibility
    const AMP = 1.5;

    switch (variant) {
      case 'sinus':
      case 'sinus_brady':
      case 'sinus_tachy':
        // Normal Sinus Rhythm (NSR) - Rate controlled by hr prop
        // Brady: 40-59 bpm, Normal: 60-100 bpm, Tachy: 101-150 bpm
        // P wave (0-0.1)
        if (progress < 0.1) {
          const p = progress / 0.1;
          return 5 * Math.sin(p * Math.PI) * AMP;
        }
        // PR segment (0.1-0.2)
        if (progress < 0.2) return 0;

        // QRS complex (0.2-0.28)
        if (progress < 0.22) return -6 * AMP; // Q wave
        if (progress < 0.25) return 50 * ((progress - 0.22) / 0.03) * AMP; // R wave
        if (progress < 0.28) return 50 * AMP - 55 * ((progress - 0.25) / 0.03) * AMP; // S wave

        // ST segment (0.28-0.4)
        if (progress < 0.4) return 0;

        // T wave (0.4-0.6)
        if (progress < 0.6) {
          const tw = (progress - 0.4) / 0.2;
          return 12 * Math.sin(tw * Math.PI) * AMP;
        }
        return 0;

      case 'afib':
        // ATRIAL FIBRILLATION - Mathematical model (FINAL VERSION - user preferred over traced!)
        // Reference: ResusMonitor display at https://resusmonitor.com/sim_monitor
        // Key: ALL rhythms use 60 bpm spacing, sweep speed creates perceived rate
        //
        // IMPORTANT: Only 6 QRS complexes TOTAL across entire screen (all 5 cycles)
        // Pattern: close-close-GAP-close-GAP-close-close-GAP (irregular RR intervals)
        // Positions are relative to ENTIRE containerWidth, not per cycle

        // 6 irregular R-wave positions across ENTIRE screen (not per cycle!)
        const afib_positions_absolute = [0.08, 0.16, 0.38, 0.54, 0.72, 0.88];

        // Find which beat (if any) we're currently rendering
        // Use absolute position x instead of per-cycle position t
        const xProgress = x / containerWidth; // 0.0 to 1.0 across entire screen

        for (let rPos of afib_positions_absolute) {
          const distFromR = Math.abs(xProgress - rPos);

          // SHARP, PROMINENT QRS with POINTED R-wave peak
          // NARROW but VERY TALL to stand out above other waveforms
          const qrsWidth = 3.0 / containerWidth; // Very narrow for crisp appearance
          if (distFromR < qrsWidth) {
            const localDist = distFromR / qrsWidth; // Normalize to 0-1 within QRS

            // Q wave - sharp downward spike
            if (localDist < 0.15) {
              const qPhase = localDist / 0.15;
              return -10 * (1 - qPhase) * AMP; // Deeper Q
            }

            // R wave - SHARP POINTED PEAK (triangle, not rounded) - VERY TALL
            if (localDist < 0.35) {
              const rPhase = (localDist - 0.15) / 0.2;
              return 70 * (1 - rPhase) * AMP; // MUCH TALLER - was 55
            }

            // S wave - sharp downward spike
            if (localDist < 1.0) {
              const sPhase = (localDist - 0.35) / 0.65;
              return -12 * Math.exp(-sPhase * 3) * AMP; // Deeper S
            }
          }
        }

        // FIBRILLATORY BASELINE with f-waves
        // Medical specs: f-waves are 300-600/min, amplitude < 0.5mm (fine) to > 0.5mm (coarse)
        // Two-layer approach:
        //   1. Low-frequency smooth waves (overall baseline shape)
        //   2. High-frequency tiny bumps (fibrillatory artifacts/f-waves)

        // Layer 1: Smooth underlying undulation (REDUCED to make QRS stand out more)
        const smooth1 = Math.sin((x / containerWidth) * Math.PI * 4) * 0.8 * AMP; // was 1.0
        const smooth2 = Math.sin((x / containerWidth) * Math.PI * 6.5 + 1.3) * 0.5 * AMP; // was 0.6

        // Layer 2: Fine fibrillatory bumps (f-waves) - high frequency, very low amplitude
        // 400-500 waves/min = ~7-8 Hz at 60 bpm baseline
        const fWave1 = Math.sin((x / containerWidth) * Math.PI * 60) * 0.3 * AMP; // Rapid oscillation
        const fWave2 = Math.sin((x / containerWidth) * Math.PI * 75 + 2.1) * 0.25 * AMP; // Slight irregularity
        const fWave3 = Math.sin((x / containerWidth) * Math.PI * 52 + 4.7) * 0.2 * AMP; // More chaos

        return smooth1 + smooth2 + fWave1 + fWave2 + fWave3;

      case 'aflutter':
        // ATRIAL FLUTTER with 2:1 BLOCK - Pattern: F-wave, F-wave, QRS (repeating)
        // Atrial rate: 300 bpm (flutter waves every 0.2 seconds)
        // Ventricular rate: 150 bpm (QRS after every 2 F-waves = 2:1 block)
        const flutter_cycle = cycleLength / 7; // 7 QRS complexes across screen (150 bpm)
        const ft = t % flutter_cycle;
        const flutter_progress = ft / flutter_cycle;

        // Divide each cycle into 3 parts: F-wave #1, F-wave #2, QRS complex
        const part = Math.floor(flutter_progress * 3);
        const part_progress = (flutter_progress * 3) % 1;

        if (part === 0) {
          // First F-wave (flutter wave) - negative sawtooth deflection
          if (part_progress < 0.5) {
            return -10 * Math.sin(part_progress * Math.PI * 2) * AMP; // Sawtooth down
          } else {
            return -10 * (1 - part_progress) * 2 * AMP; // Quick rise back
          }
        } else if (part === 1) {
          // Second F-wave (flutter wave) - negative sawtooth deflection
          if (part_progress < 0.5) {
            return -10 * Math.sin(part_progress * Math.PI * 2) * AMP; // Sawtooth down
          } else {
            return -10 * (1 - part_progress) * 2 * AMP; // Quick rise back
          }
        } else {
          // QRS complex (narrow, tall, after 2 F-waves)
          if (part_progress < 0.15) {
            if (part_progress < 0.05) return -5 * AMP; // Q wave
            if (part_progress < 0.10) return 50 * AMP; // Tall narrow R wave
            return -6 * AMP; // S wave
          }
          return 0; // Isoelectric after QRS
        }

      case 'mat':
        // Multifocal Atrial Tachycardia - 3+ DIFFERENT P-wave morphologies
        // Each group has different P-wave shape and PR interval
        const mat_cycle = cycleLength / 7; // 7 beats across screen
        const mt = t % mat_cycle;
        const mat_progress = mt / mat_cycle;

        // Determine which of 3 atrial foci is firing based on position
        const focus = Math.floor((t / mat_cycle) % 3);

        // Different P-wave morphologies for each focus
        if (mat_progress < 0.08) {
          const p = mat_progress / 0.08;
          if (focus === 0) return 4 * Math.sin(p * Math.PI) * AMP; // Tall P wave
          if (focus === 1) return 2 * Math.sin(p * Math.PI) * AMP; // Short P wave
          return 3 * Math.sin(p * Math.PI * 2) * AMP; // Biphasic P wave (2 humps)
        }

        // Different PR intervals for each focus
        const mat_pr_end = focus === 0 ? 0.14 : focus === 1 ? 0.18 : 0.22;
        if (mat_progress < mat_pr_end) return 0;

        // QRS complex (narrow, same for all)
        if (mat_progress < mat_pr_end + 0.02) return -5 * AMP;
        if (mat_progress < mat_pr_end + 0.05) return 42 * AMP;
        if (mat_progress < mat_pr_end + 0.08) return -6 * AMP;
        if (mat_progress < mat_pr_end + 0.18) return 0;

        // T wave
        if (mat_progress < mat_pr_end + 0.35) {
          const tw = (mat_progress - (mat_pr_end + 0.18)) / 0.17;
          return 10 * Math.sin(tw * Math.PI) * AMP;
        }
        return 0;

      case 'vfib':
        // Ventricular Fibrillation - CHAOTIC irregular deflections, NO identifiable QRS/P/T waves
        // Completely disorganized electrical activity
        // Rate > 300 bpm but not countable (no distinct beats)
        const chaos1 = Math.sin(x * 1.7) * 15 * AMP;
        const chaos2 = Math.sin(x * 2.3) * 12 * AMP;
        const chaos3 = Math.sin(x * 0.9) * 18 * AMP;
        const chaos4 = Math.sin(x * 3.1) * 8 * AMP;
        // Coarse VFib - amplitude varies chaotically
        const amplitude_variation = Math.abs(Math.sin(x * 0.3)) + 0.5;
        return (chaos1 + chaos2 + chaos3 + chaos4) * amplitude_variation * 0.3;

      case 'torsades':
        // Torsades de Pointes - "Twisting of the Points"
        // Polymorphic VT where QRS amplitude and axis twist around baseline
        const torsades_cycle = 35;
        const td = t % torsades_cycle;
        const td_progress = td / torsades_cycle;

        // Wide QRS complex that changes amplitude and polarity
        // Creates the characteristic "twisting" pattern
        const twist_phase = (x / 100) % (2 * Math.PI); // Slow twisting cycle
        const twist_amplitude = Math.sin(twist_phase); // Varies from -1 to +1

        if (td_progress < 0.3) {
          const qrs = td_progress / 0.3;
          if (qrs < 0.5) {
            // Upstroke varies with twist
            return 40 * qrs * 2 * twist_amplitude * AMP;
          } else {
            // Downstroke varies with twist
            return 40 * (1 - (qrs - 0.5) * 2) * twist_amplitude * AMP;
          }
        }
        return 0;

      case 'vtach':
        // VENTRICULAR TACHYCARDIA - Traced from ResusMonitor at 60 bpm
        // Reference: ResusMonitor screenshot (60 bpm)
        //
        // At 60 bpm baseline: 5 WIDE QRS complexes evenly spaced
        // Each complex takes ~40% of the cycle (vs ~8% for narrow QRS)
        // Smooth, rounded sine-wave morphology (no sharp R-wave)
        // NO P waves, NO distinct T waves

        // WIDE QRS - takes up significant portion of beat cycle
        // Progress 0.15 to 0.55 = 40% of cycle width (vs 8% for normal)
        if (progress < 0.15) return 0; // Baseline before complex

        // Smooth upstroke (slower than normal QRS)
        if (progress < 0.30) {
          const upstroke = (progress - 0.15) / 0.15; // 0 to 1
          return 40 * Math.sin(upstroke * Math.PI / 2) * AMP; // Sine wave up
        }

        // Peak and downstroke (rounded, not sharp)
        if (progress < 0.55) {
          const downstroke = (progress - 0.30) / 0.25; // 0 to 1
          return 40 * Math.cos(downstroke * Math.PI / 2) * AMP; // Sine wave down
        }

        // Return to baseline
        if (progress < 0.65) {
          const tail = (progress - 0.55) / 0.10;
          return -5 * (1 - tail) * AMP; // Small dip back to baseline
        }

        return 0; // Isoelectric until next beat

      case 'lbbb':
        // Left Bundle Branch Block - Wide QRS > 120 ms, broad notched R in lateral leads
        // M-shaped QRS complex, no Q waves in lateral leads
        if (progress < 0.1) {
          const p = progress / 0.1;
          return 4 * Math.sin(p * Math.PI) * AMP; // P wave
        }
        if (progress < 0.18) return 0; // PR interval

        // Wide QRS with M-shape (notched R wave)
        if (progress < 0.22) return 15 * AMP; // First R peak
        if (progress < 0.26) return 8 * AMP; // Notch (descends)
        if (progress < 0.32) return 30 * AMP; // Second R peak (taller)
        if (progress < 0.38) return -8 * AMP; // S wave
        if (progress < 0.48) return 0; // ST segment

        // T wave (often discordant - opposite to QRS)
        if (progress < 0.68) {
          const tw = (progress - 0.48) / 0.2;
          return -10 * Math.sin(tw * Math.PI) * AMP; // Inverted T
        }
        return 0;

      case 'rbbb':
        // Right Bundle Branch Block - Wide QRS with rSR' (rabbit ears) in V1
        if (progress < 0.1) {
          const p = progress / 0.1;
          return 4 * Math.sin(p * Math.PI) * AMP; // P wave
        }
        if (progress < 0.18) return 0; // PR interval

        // rSR' pattern (three humps: small r, deep S, tall R')
        if (progress < 0.22) return 10 * AMP; // small r
        if (progress < 0.27) return -15 * AMP; // deep S
        if (progress < 0.35) return 35 * AMP; // tall R' (terminal R)
        if (progress < 0.38) return 0; // End of QRS
        if (progress < 0.48) return 0; // ST segment

        // T wave
        if (progress < 0.68) {
          const tw = (progress - 0.48) / 0.2;
          return 10 * Math.sin(tw * Math.PI) * AMP;
        }
        return 0;

      case 'wpw':
        // Wolff-Parkinson-White: Short PR, delta wave (slurred upstroke), wide QRS
        if (progress < 0.08) {
          const p = progress / 0.08;
          return 4 * Math.sin(p * Math.PI) * AMP; // P wave
        }
        if (progress < 0.12) return 0; // SHORT PR interval (< 0.12 sec)

        // Delta wave (slurred slow upstroke to QRS)
        if (progress < 0.20) {
          return 25 * ((progress - 0.12) / 0.08) * AMP; // Slow slurred rise
        }
        // Rest of QRS (wide)
        if (progress < 0.28) return 45 * AMP;
        if (progress < 0.35) return -8 * AMP;
        if (progress < 0.45) return 0;

        // T wave
        if (progress < 0.65) {
          const tw = (progress - 0.45) / 0.2;
          return 10 * Math.sin(tw * Math.PI) * AMP;
        }
        return 0;

      case 'hyperkalemia':
        // Tall PEAKED T waves (narrow and tall), prolonged PR, widened QRS
        if (progress < 0.12) {
          const p = progress / 0.12;
          return 3 * Math.sin(p * Math.PI) * AMP; // Flattened P wave
        }
        if (progress < 0.24) return 0; // PROLONGED PR

        // Widened QRS
        if (progress < 0.27) return -5 * AMP;
        if (progress < 0.32) return 40 * AMP;
        if (progress < 0.37) return -5 * AMP;
        if (progress < 0.47) return 0;

        // PEAKED T wave (hallmark of hyperkalemia!)
        if (progress < 0.50) return 0;
        if (progress < 0.56) return 45 * ((progress - 0.50) / 0.06) * AMP; // Sharp rise
        if (progress < 0.62) return 45 * AMP - 45 * ((progress - 0.56) / 0.06) * AMP; // Sharp fall
        return 0;

      case 'hypokalemia':
        // Flattened T waves, prominent U waves
        if (progress < 0.1) {
          const p = progress / 0.1;
          return 5 * Math.sin(p * Math.PI) * AMP; // Normal P
        }
        if (progress < 0.2) return 0;

        // Normal QRS
        if (progress < 0.22) return -6 * AMP;
        if (progress < 0.25) return 50 * AMP;
        if (progress < 0.28) return -8 * AMP;
        if (progress < 0.4) return 0;

        // Flattened T wave
        if (progress < 0.6) {
          return 5 * AMP; // Flat, low amplitude T
        }
        // U wave (extra hump after T)
        if (progress < 0.75) {
          const u = (progress - 0.6) / 0.15;
          return 8 * Math.sin(u * Math.PI) * AMP; // Prominent U wave
        }
        return 0;

      case 'hypothermia':
        // J waves (Osborn waves) - hump at end of QRS
        if (progress < 0.1) {
          const p = progress / 0.1;
          return 5 * Math.sin(p * Math.PI) * AMP;
        }
        if (progress < 0.2) return 0;

        // QRS
        if (progress < 0.22) return -6 * AMP;
        if (progress < 0.25) return 50 * AMP;
        if (progress < 0.28) return -8 * AMP;

        // J WAVE (Osborn wave) - distinctive hump at end of QRS
        if (progress < 0.35) {
          const j = (progress - 0.28) / 0.07;
          return 12 * Math.sin(j * Math.PI) * AMP; // J wave hump
        }
        if (progress < 0.4) return 0;

        // T wave
        if (progress < 0.6) {
          const tw = (progress - 0.4) / 0.2;
          return 10 * Math.sin(tw * Math.PI) * AMP;
        }
        return 0;

      case 'svt':
        // Supraventricular Tachycardia - Very rapid narrow complex, 150-250 bpm
        // P waves often buried in T waves or not visible
        // Shows ~9 QRS complexes across screen (180 bpm)
        const svt_cycle = cycleLength / 9;
        const svt_t = t % svt_cycle;
        const svt_progress = svt_t / svt_cycle;

        // Rapid narrow QRS (no P waves visible)
        if (svt_progress < 0.08) return -5 * AMP; // Q
        if (svt_progress < 0.12) return 42 * AMP; // R
        if (svt_progress < 0.16) return -6 * AMP; // S
        if (svt_progress < 0.35) return 0; // ST segment

        // T wave (may hide P wave of next beat)
        if (svt_progress < 0.60) {
          const tw = (svt_progress - 0.35) / 0.25;
          return 8 * Math.sin(tw * Math.PI) * AMP;
        }
        return 0;

      case 'junctional':
        // Junctional Rhythm - 40-60 bpm, inverted or absent P waves
        // QRS looks normal but P waves are inverted (after QRS or buried)
        // Shows ~3-4 beats across screen (slow rate)
        const junc_cycle = cycleLength / 3.5;
        const junc_t = t % junc_cycle;
        const junc_progress = junc_t / junc_cycle;

        // Normal narrow QRS
        if (junc_progress < 0.08) return -6 * AMP; // Q
        if (junc_progress < 0.12) return 48 * AMP; // R
        if (junc_progress < 0.16) return -7 * AMP; // S
        if (junc_progress < 0.30) return 0; // ST segment

        // T wave
        if (junc_progress < 0.50) {
          const tw = (junc_progress - 0.30) / 0.20;
          return 12 * Math.sin(tw * Math.PI) * AMP;
        }

        // Inverted P wave AFTER QRS (retrograde conduction)
        if (junc_progress < 0.65) {
          const p = (junc_progress - 0.50) / 0.15;
          return -3 * Math.sin(p * Math.PI) * AMP; // Inverted P
        }
        return 0;

      case 'avblock1':
        // 1st Degree AV Block - Prolonged PR interval > 0.20 sec
        // Otherwise normal sinus rhythm
        if (progress < 0.1) {
          const p = progress / 0.1;
          return 5 * Math.sin(p * Math.PI) * AMP; // P wave
        }
        if (progress < 0.28) return 0; // PROLONGED PR interval (0.28 vs normal 0.20)

        // Normal QRS
        if (progress < 0.30) return -6 * AMP; // Q
        if (progress < 0.33) return 50 * AMP; // R
        if (progress < 0.36) return -8 * AMP; // S
        if (progress < 0.48) return 0; // ST segment

        // T wave
        if (progress < 0.68) {
          const tw = (progress - 0.48) / 0.2;
          return 12 * Math.sin(tw * Math.PI) * AMP;
        }
        return 0;

      case 'avblock2_type1':
      case 'wenckebach':
        // 2nd Degree AV Block Type I (Wenckebach) - Progressive PR prolongation until dropped QRS
        // Shows pattern of 4 P waves with 3 QRS (4:3 conduction)
        const wench_cycle = cycleLength / 3; // 3 conducted beats
        const wench_t = t % wench_cycle;
        const wench_progress = wench_t / wench_cycle;
        const beat_num = Math.floor((t / wench_cycle) % 4);

        // P wave (always present)
        if (wench_progress < 0.08) {
          const p = wench_progress / 0.08;
          return 5 * Math.sin(p * Math.PI) * AMP;
        }

        // PR interval gets progressively longer with each beat
        const wench_pr_end = beat_num === 0 ? 0.18 : beat_num === 1 ? 0.24 : 0.32;

        // Dropped beat (4th P wave has no QRS)
        if (beat_num === 3) {
          return 0; // No QRS after this P wave
        }

        if (wench_progress < wench_pr_end) return 0; // Variable PR interval

        // QRS complex (if not dropped)
        if (wench_progress < wench_pr_end + 0.03) return -6 * AMP;
        if (wench_progress < wench_pr_end + 0.06) return 48 * AMP;
        if (wench_progress < wench_pr_end + 0.09) return -7 * AMP;
        if (wench_progress < wench_pr_end + 0.20) return 0;

        // T wave
        if (wench_progress < wench_pr_end + 0.38) {
          const tw = (wench_progress - (wench_pr_end + 0.20)) / 0.18;
          return 10 * Math.sin(tw * Math.PI) * AMP;
        }
        return 0;

      case 'avblock2_type2':
        // 2nd Degree AV Block Type II - Fixed PR interval, random dropped QRS
        // Shows 3:2 conduction (3 P waves, 2 QRS)
        const av2t2_cycle = cycleLength / 4; // 4 P waves across screen
        const av2t2_t = t % av2t2_cycle;
        const av2t2_progress = av2t2_t / av2t2_cycle;
        const av2t2_beat = Math.floor((t / av2t2_cycle) % 3);

        // P wave (always present)
        if (av2t2_progress < 0.10) {
          const p = av2t2_progress / 0.10;
          return 5 * Math.sin(p * Math.PI) * AMP;
        }
        if (av2t2_progress < 0.20) return 0; // Fixed PR interval

        // Every 3rd beat is dropped (no QRS)
        if (av2t2_beat === 2) {
          return 0; // Dropped QRS
        }

        // QRS complex (when conducted)
        if (av2t2_progress < 0.23) return -6 * AMP;
        if (av2t2_progress < 0.26) return 48 * AMP;
        if (av2t2_progress < 0.29) return -7 * AMP;
        if (av2t2_progress < 0.42) return 0;

        // T wave
        if (av2t2_progress < 0.62) {
          const tw = (av2t2_progress - 0.42) / 0.20;
          return 11 * Math.sin(tw * Math.PI) * AMP;
        }
        return 0;

      case 'avblock3':
      case 'complete_heart_block':
        // 3rd Degree AV Block - Complete AV dissociation
        // P waves and QRS complexes march independently
        // P waves: 75 bpm (6 across screen), QRS: 40 bpm (3 across screen)
        const p_cycle = cycleLength / 6; // 6 P waves
        const qrs_cycle = cycleLength / 3; // 3 QRS complexes
        const p_t = t % p_cycle;
        const qrs_t = t % qrs_cycle;
        const p_prog = p_t / p_cycle;
        const qrs_prog = qrs_t / qrs_cycle;

        let chb_value = 0;

        // P waves (regular, 75 bpm)
        if (p_prog < 0.15) {
          const p = p_prog / 0.15;
          chb_value += 5 * Math.sin(p * Math.PI) * AMP;
        }

        // Wide QRS complexes (independent, 40 bpm, ventricular escape)
        if (qrs_prog < 0.06) chb_value += -8 * AMP; // Q
        if (qrs_prog >= 0.06 && qrs_prog < 0.14) chb_value += 38 * AMP; // Wide R
        if (qrs_prog >= 0.14 && qrs_prog < 0.20) chb_value += -10 * AMP; // S
        if (qrs_prog >= 0.35 && qrs_prog < 0.55) {
          const tw = (qrs_prog - 0.35) / 0.20;
          chb_value += 10 * Math.sin(tw * Math.PI) * AMP; // T wave
        }

        return chb_value;

      case 'vpaced':
        // Ventricular Paced Rhythm - Pacer spikes before wide QRS
        // 60-80 bpm paced rate
        const vpaced_cycle = cycleLength / 4; // 4 paced beats
        const vpaced_t = t % vpaced_cycle;
        const vpaced_progress = vpaced_t / vpaced_cycle;

        // Pacer spike (sharp vertical line)
        if (vpaced_progress < 0.01) return 60 * AMP; // Spike

        // Wide paced QRS complex
        if (vpaced_progress < 0.05) return 0;
        if (vpaced_progress < 0.10) return 35 * AMP; // R wave (wide)
        if (vpaced_progress < 0.18) return -12 * AMP; // Deep S wave
        if (vpaced_progress < 0.38) return 0; // ST segment

        // T wave (often discordant)
        if (vpaced_progress < 0.60) {
          const tw = (vpaced_progress - 0.38) / 0.22;
          return -8 * Math.sin(tw * Math.PI) * AMP; // Inverted T
        }
        return 0;

      case 'dual_paced':
        // Dual-Chamber Paced - Atrial spike + Ventricular spike
        const dual_cycle = cycleLength / 4;
        const dual_t = t % dual_cycle;
        const dual_progress = dual_t / dual_cycle;

        // Atrial pacer spike
        if (dual_progress < 0.01) return 60 * AMP;

        // Paced P wave
        if (dual_progress < 0.08) {
          const p = (dual_progress - 0.01) / 0.07;
          return 6 * Math.sin(p * Math.PI) * AMP;
        }

        // AV delay
        if (dual_progress < 0.16) return 0;

        // Ventricular pacer spike
        if (dual_progress < 0.17) return 60 * AMP;

        // Wide paced QRS
        if (dual_progress < 0.20) return 0;
        if (dual_progress < 0.25) return 35 * AMP;
        if (dual_progress < 0.33) return -12 * AMP;
        if (dual_progress < 0.50) return 0;

        // T wave
        if (dual_progress < 0.72) {
          const tw = (dual_progress - 0.50) / 0.22;
          return -8 * Math.sin(tw * Math.PI) * AMP;
        }
        return 0;

      case 'bigeminy':
        // Ventricular Bigeminy - PVC every other beat (normal-PVC-normal-PVC pattern)
        const big_cycle = cycleLength / 5; // 5 "pairs" (10 total beats)
        const big_t = t % big_cycle;
        const big_progress = big_t / big_cycle;
        const is_pvc = Math.floor((t / big_cycle) % 2) === 1;

        if (is_pvc) {
          // Wide PVC - no P wave, wide bizarre QRS
          if (big_progress < 0.08) return -10 * AMP;
          if (big_progress < 0.18) return 42 * AMP;
          if (big_progress < 0.28) return -15 * AMP;
          if (big_progress < 0.50) return 0;
          // Inverted T
          if (big_progress < 0.75) {
            const tw = (big_progress - 0.50) / 0.25;
            return -12 * Math.sin(tw * Math.PI) * AMP;
          }
          return 0;
        } else {
          // Normal sinus beat
          if (big_progress < 0.10) {
            const p = big_progress / 0.10;
            return 5 * Math.sin(p * Math.PI) * AMP;
          }
          if (big_progress < 0.20) return 0;
          if (big_progress < 0.22) return -6 * AMP;
          if (big_progress < 0.25) return 48 * AMP;
          if (big_progress < 0.28) return -7 * AMP;
          if (big_progress < 0.42) return 0;
          if (big_progress < 0.62) {
            const tw = (big_progress - 0.42) / 0.20;
            return 12 * Math.sin(tw * Math.PI) * AMP;
          }
          return 0;
        }

      case 'trigeminy':
        // Ventricular Trigeminy - PVC every third beat (normal-normal-PVC pattern)
        const trig_cycle = cycleLength / 5;
        const trig_t = t % trig_cycle;
        const trig_progress = trig_t / trig_cycle;
        const beat_type = Math.floor((t / trig_cycle) % 3);

        if (beat_type === 2) {
          // Wide PVC
          if (trig_progress < 0.08) return -10 * AMP;
          if (trig_progress < 0.18) return 42 * AMP;
          if (trig_progress < 0.28) return -15 * AMP;
          if (trig_progress < 0.50) return 0;
          if (trig_progress < 0.75) {
            const tw = (trig_progress - 0.50) / 0.25;
            return -12 * Math.sin(tw * Math.PI) * AMP;
          }
          return 0;
        } else {
          // Normal sinus beat
          if (trig_progress < 0.10) {
            const p = trig_progress / 0.10;
            return 5 * Math.sin(p * Math.PI) * AMP;
          }
          if (trig_progress < 0.20) return 0;
          if (trig_progress < 0.22) return -6 * AMP;
          if (trig_progress < 0.25) return 48 * AMP;
          if (trig_progress < 0.28) return -7 * AMP;
          if (trig_progress < 0.42) return 0;
          if (trig_progress < 0.62) {
            const tw = (trig_progress - 0.42) / 0.20;
            return 12 * Math.sin(tw * Math.PI) * AMP;
          }
          return 0;
        }

      case 'idioventricular':
        // Idioventricular Rhythm - Wide QRS, slow rate (20-40 bpm), no P waves
        // Shows ~2-3 beats across screen
        const idio_cycle = cycleLength / 2.5;
        const idio_t = t % idio_cycle;
        const idio_progress = idio_t / idio_cycle;

        // Wide QRS (no P wave)
        if (idio_progress < 0.08) return -8 * AMP;
        if (idio_progress < 0.18) return 32 * AMP;
        if (idio_progress < 0.28) return -12 * AMP;
        if (idio_progress < 0.48) return 0;

        // T wave
        if (idio_progress < 0.72) {
          const tw = (idio_progress - 0.48) / 0.24;
          return 10 * Math.sin(tw * Math.PI) * AMP;
        }
        return 0;

      case 'pea':
      case 'pulseless':
        // Pulseless Electrical Activity - Organized rhythm but no mechanical contraction
        // Looks like slow sinus or junctional but patient has no pulse
        // Shows organized QRS complexes at ~40-60 bpm
        const pea_cycle = cycleLength / 3;
        const pea_t = t % pea_cycle;
        const pea_progress = pea_t / pea_cycle;

        // Small P wave (may be present)
        if (pea_progress < 0.08) {
          const p = pea_progress / 0.08;
          return 3 * Math.sin(p * Math.PI) * AMP;
        }
        if (pea_progress < 0.18) return 0;

        // QRS complex
        if (pea_progress < 0.21) return -5 * AMP;
        if (pea_progress < 0.24) return 38 * AMP;
        if (pea_progress < 0.27) return -6 * AMP;
        if (pea_progress < 0.42) return 0;

        // T wave
        if (pea_progress < 0.62) {
          const tw = (pea_progress - 0.42) / 0.20;
          return 9 * Math.sin(tw * Math.PI) * AMP;
        }
        return 0;

      case 'stemi':
      case 'stemi_anterior':
        // STEMI - ST Elevation Myocardial Infarction (Anterior)
        // Elevated ST segments, tall upright T waves
        if (progress < 0.1) {
          const p = progress / 0.1;
          return 5 * Math.sin(p * Math.PI) * AMP;
        }
        if (progress < 0.2) return 0;

        // QRS (may have pathological Q waves)
        if (progress < 0.22) return -10 * AMP; // Deep Q wave
        if (progress < 0.25) return 45 * AMP; // R
        if (progress < 0.28) return -7 * AMP; // S

        // ST ELEVATION (hallmark of STEMI!)
        if (progress < 0.4) {
          return 8 * AMP; // Elevated ST segment
        }

        // Tall peaked T wave (hyperacute)
        if (progress < 0.6) {
          const tw = (progress - 0.4) / 0.2;
          return 8 + 18 * Math.sin(tw * Math.PI) * AMP; // Elevated + tall T
        }
        return 0;

      case 'stemi_inferior':
        // Inferior STEMI - ST elevation in inferior leads (II, III, aVF)
        if (progress < 0.1) {
          const p = progress / 0.1;
          return 5 * Math.sin(p * Math.PI) * AMP;
        }
        if (progress < 0.2) return 0;

        // Pathological Q waves
        if (progress < 0.22) return -12 * AMP; // Deep Q
        if (progress < 0.25) return 40 * AMP; // Reduced R
        if (progress < 0.28) return -6 * AMP; // S

        // ST elevation
        if (progress < 0.4) {
          return 10 * AMP; // Elevated ST
        }

        // T wave
        if (progress < 0.6) {
          const tw = (progress - 0.4) / 0.2;
          return 10 + 15 * Math.sin(tw * Math.PI) * AMP;
        }
        return 0;

      case 'nstemi':
        // NSTEMI - Non-ST Elevation MI
        // ST depression and/or T wave inversion (NO ST elevation)
        if (progress < 0.1) {
          const p = progress / 0.1;
          return 5 * Math.sin(p * Math.PI) * AMP;
        }
        if (progress < 0.2) return 0;

        // Normal QRS
        if (progress < 0.22) return -6 * AMP;
        if (progress < 0.25) return 48 * AMP;
        if (progress < 0.28) return -7 * AMP;

        // ST DEPRESSION (hallmark of NSTEMI)
        if (progress < 0.4) {
          return -5 * AMP; // Depressed ST segment
        }

        // Inverted T wave
        if (progress < 0.6) {
          const tw = (progress - 0.4) / 0.2;
          return -5 - 8 * Math.sin(tw * Math.PI) * AMP; // Depression + inverted T
        }
        return 0;

      case 'pericarditis':
        // Pericarditis - Diffuse ST elevation with PR depression
        // Concave upward ST elevation (vs convex in STEMI)
        if (progress < 0.1) {
          const p = progress / 0.1;
          return 5 * Math.sin(p * Math.PI) * AMP;
        }

        // PR depression (opposite of ST elevation)
        if (progress < 0.2) {
          return -3 * AMP; // Depressed PR segment
        }

        // Normal QRS
        if (progress < 0.22) return -6 * AMP;
        if (progress < 0.25) return 50 * AMP;
        if (progress < 0.28) return -8 * AMP;

        // ST elevation (concave upward)
        if (progress < 0.4) {
          const st_prog = (progress - 0.28) / 0.12;
          return 6 * Math.sin(st_prog * Math.PI) * AMP; // Concave ST elevation
        }

        // Normal T wave
        if (progress < 0.6) {
          const tw = (progress - 0.4) / 0.2;
          return 10 * Math.sin(tw * Math.PI) * AMP;
        }
        return 0;

      case 'pulmonary_embolism':
      case 's1q3t3':
        // Pulmonary Embolism - S1Q3T3 pattern
        // Deep S in lead I, Q wave and inverted T in lead III
        if (progress < 0.1) {
          const p = progress / 0.1;
          return 5 * Math.sin(p * Math.PI) * AMP;
        }
        if (progress < 0.2) return 0;

        // Prominent S wave (in lead I) or Q wave (in lead III)
        if (progress < 0.22) return -8 * AMP; // Q wave
        if (progress < 0.25) return 35 * AMP; // R (may be reduced)
        if (progress < 0.28) return -15 * AMP; // Deep S wave
        if (progress < 0.4) return 0;

        // Inverted T wave (in lead III)
        if (progress < 0.6) {
          const tw = (progress - 0.4) / 0.2;
          return -10 * Math.sin(tw * Math.PI) * AMP; // Inverted T
        }
        return 0;

      case 'early_repolarization':
        // Early Repolarization - J-point elevation with fishhook appearance
        // Common in young athletes, benign variant
        if (progress < 0.1) {
          const p = progress / 0.1;
          return 5 * Math.sin(p * Math.PI) * AMP;
        }
        if (progress < 0.2) return 0;

        // Normal QRS
        if (progress < 0.22) return -6 * AMP;
        if (progress < 0.25) return 50 * AMP;
        if (progress < 0.28) return -8 * AMP;

        // J-point elevation with notch (fishhook)
        if (progress < 0.30) {
          return 5 * AMP; // J-point notch
        }
        if (progress < 0.35) {
          return 8 * AMP; // Elevated J-point
        }

        // ST segment (mildly elevated, concave)
        if (progress < 0.4) {
          return 5 * AMP;
        }

        // Normal tall T wave
        if (progress < 0.6) {
          const tw = (progress - 0.4) / 0.2;
          return 14 * Math.sin(tw * Math.PI) * AMP;
        }
        return 0;

      case 'electrical_alternans':
        // Electrical Alternans - Alternating QRS amplitude
        // Classic sign of pericardial effusion
        const alt_beat = Math.floor((t / cycleLength) % 2);
        const alt_amplitude = alt_beat === 0 ? 1.0 : 0.5; // Alternating amplitude

        if (progress < 0.1) {
          const p = progress / 0.1;
          return 5 * Math.sin(p * Math.PI) * AMP * alt_amplitude;
        }
        if (progress < 0.2) return 0;

        // QRS with alternating amplitude
        if (progress < 0.22) return -6 * AMP * alt_amplitude;
        if (progress < 0.25) return 50 * AMP * alt_amplitude; // Alternates between tall and short
        if (progress < 0.28) return -8 * AMP * alt_amplitude;
        if (progress < 0.4) return 0;

        // T wave
        if (progress < 0.6) {
          const tw = (progress - 0.4) / 0.2;
          return 12 * Math.sin(tw * Math.PI) * AMP * alt_amplitude;
        }
        return 0;

      case 'lbbb_sgarbossa':
        // LBBB with Sgarbossa Criteria (STEMI in presence of LBBB)
        // Concordant ST elevation, discordant ST elevation > 5mm
        if (progress < 0.1) {
          const p = progress / 0.1;
          return 4 * Math.sin(p * Math.PI) * AMP;
        }
        if (progress < 0.18) return 0;

        // Wide LBBB QRS with M-shape
        if (progress < 0.22) return 15 * AMP;
        if (progress < 0.26) return 8 * AMP;
        if (progress < 0.32) return 30 * AMP;
        if (progress < 0.38) return -8 * AMP;

        // CONCORDANT ST elevation (same direction as QRS - abnormal in LBBB!)
        if (progress < 0.48) {
          return 12 * AMP; // Elevated ST segment (concordant with positive QRS)
        }

        // T wave (may be concordant)
        if (progress < 0.68) {
          const tw = (progress - 0.48) / 0.2;
          return 8 * Math.sin(tw * Math.PI) * AMP; // Upright T (abnormal concordance)
        }
        return 0;

      case 'pac':
        // Premature Atrial Complexes - Early P waves with different morphology
        // Shows pattern with occasional early beats (PAC every 5th beat)
        const pac_cycle = cycleLength / 5;
        const pac_t = t % pac_cycle;
        const pac_progress = pac_t / pac_cycle;
        const is_pac = Math.floor((t / pac_cycle) % 5) === 2; // Every 5th beat is PAC

        if (is_pac) {
          // PAC - Earlier than expected with different P-wave morphology
          if (pac_progress < 0.12) {
            const p = pac_progress / 0.12;
            return 3 * Math.sin(p * Math.PI * 2) * AMP; // Different P morphology
          }
          if (pac_progress < 0.20) return 0; // Slightly shorter PR

          // Normal QRS after PAC
          if (pac_progress < 0.22) return -5 * AMP;
          if (pac_progress < 0.25) return 45 * AMP;
          if (pac_progress < 0.28) return -6 * AMP;
          if (pac_progress < 0.42) return 0;

          // T wave
          if (pac_progress < 0.62) {
            const tw = (pac_progress - 0.42) / 0.20;
            return 10 * Math.sin(tw * Math.PI) * AMP;
          }
          // Longer compensatory pause after PAC
          return 0;
        } else {
          // Normal sinus beat
          if (pac_progress < 0.10) {
            const p = pac_progress / 0.10;
            return 5 * Math.sin(p * Math.PI) * AMP;
          }
          if (pac_progress < 0.20) return 0;
          if (pac_progress < 0.22) return -6 * AMP;
          if (pac_progress < 0.25) return 48 * AMP;
          if (pac_progress < 0.28) return -7 * AMP;
          if (pac_progress < 0.42) return 0;
          if (pac_progress < 0.62) {
            const tw = (pac_progress - 0.42) / 0.20;
            return 12 * Math.sin(tw * Math.PI) * AMP;
          }
          return 0;
        }

      case 'aivr':
        // Accelerated Idioventricular Rhythm - Wide QRS, 60-100 bpm
        // Faster than idioventricular but slower than VTach
        const aivr_cycle = cycleLength / 4; // ~80 bpm
        const aivr_t = t % aivr_cycle;
        const aivr_progress = aivr_t / aivr_cycle;

        // Wide QRS (no P wave)
        if (aivr_progress < 0.08) return -8 * AMP;
        if (aivr_progress < 0.18) return 35 * AMP;
        if (aivr_progress < 0.28) return -11 * AMP;
        if (aivr_progress < 0.46) return 0;

        // T wave
        if (aivr_progress < 0.68) {
          const tw = (aivr_progress - 0.46) / 0.22;
          return 9 * Math.sin(tw * Math.PI) * AMP;
        }
        return 0;

      case 'artifact':
        // Motion Artifact / Noise - Irregular wandering baseline
        const art1 = Math.sin(x * 0.8) * 8 * AMP;
        const art2 = Math.sin(x * 1.5) * 6 * AMP;
        const art3 = Math.sin(x * 0.3) * 12 * AMP;
        return art1 + art2 + art3;

      case 'flat':
      case 'asystole':
        return Math.sin(x * 0.05) * 0.8;

      default:
        return 0;
    }
  };

  // If SVG path exists, use SVG rendering instead of math generator
  if (svgData) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#000',
          overflow: 'hidden',
          position: 'relative',
        }}
        {...otherProps}
      >
        <Svg
          width="100%"
          height={otherProps.height || 60}
          viewBox={`0 0 ${svgData.width} ${svgData.height}`}
          preserveAspectRatio="none" // Stretch to fill container (responsive across all devices)
        >
          <Path
            d={svgData.path}
            stroke="#00ff00"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </Svg>
      </View>
    );
  }

  // Fall back to mathematical generator if no SVG
  return (
    <Waveform
      {...otherProps}
      type="ecg"
      color="#00ff00"
      amplitude={1.0}
      hr={hr}
      numCycles={numCycles}
      generator={generator}
    />
  );
}
