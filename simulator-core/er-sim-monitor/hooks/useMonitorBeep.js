// hooks/useMonitorBeep.js
// Sweep-synchronized beep system - fires when sweep crosses R-wave peaks
// Enhanced with pre-alarm warnings, volume modulation, pause detection, and rhythm-specific tones
// Returns currentMode for visual feedback synchronization
import { Audio } from 'expo-av';
import { useEffect, useRef, useCallback } from 'react';

export default function useMonitorBeep(vitals, muted, waveformVariant = 'sinus', onVisualFeedback = null, audioSettings = {}) {
  const beepSound = useRef(null);
  const alarmSound = useRef(null);
  const flatlineSound = useRef(null);
  const warningBeepSound = useRef(null);
  const artifactBuzzSound = useRef(null);
  const spo2PulseToneSound = useRef(null); // NEW: SpO2 pulse tone

  const currentMode = useRef('normal'); // 'normal', 'warning', 'critical', 'flatline', or 'artifact'
  const warningBeepCount = useRef(0); // Track 3-beep warning sequence
  const lastBeepTime = useRef(Date.now()); // For pause detection
  const pauseAlarmPlayed = useRef(false); // Prevent repeated pause alarms

  // Audio settings with defaults
  const {
    enableSpo2PulseTone = true,
    enableECGBeeps = true,
    enableAlarms = true,
    masterVolume = 1.0,
    ecgBeepVolume = 1.0,
    spo2ToneVolume = 0.7,
    alarmVolume = 1.0,
    alarmSilenced = false
  } = audioSettings;

  // 🎵 Load sounds once
  useEffect(() => {
    (async () => {
      try {
        if (!beepSound.current) {
          const { sound } = await Audio.Sound.createAsync(
            require('../assets/sounds/beep.wav'),
            { volume: 0.6 }
          );
          beepSound.current = sound;
        }
        if (!alarmSound.current) {
          const { sound } = await Audio.Sound.createAsync(
            require('../assets/sounds/alarm.wav'),
            { volume: 0.6, isLooping: true }
          );
          alarmSound.current = sound;
        }
        if (!flatlineSound.current) {
          const { sound } = await Audio.Sound.createAsync(
            require('../assets/sounds/flatline.wav'),
            { volume: 0.6, isLooping: true }
          );
          flatlineSound.current = sound;
        }
        if (!warningBeepSound.current) {
          const { sound } = await Audio.Sound.createAsync(
            require('../assets/sounds/beep.wav'), // Use same beep but we'll modulate it
            { volume: 0.5 }
          );
          warningBeepSound.current = sound;
        }
        if (!artifactBuzzSound.current) {
          const { sound } = await Audio.Sound.createAsync(
            require('../assets/sounds/beep.wav'), // We'll modulate this heavily for buzz effect
            { volume: 0.3, isLooping: true }
          );
          artifactBuzzSound.current = sound;
        }
        if (!spo2PulseToneSound.current) {
          const { sound } = await Audio.Sound.createAsync(
            require('../assets/sounds/beep.wav'), // Will be pitch-modulated for SpO2 tone
            { volume: 0.5 }
          );
          spo2PulseToneSound.current = sound;
        }
      } catch (err) {
        console.warn('[useMonitorBeep] Failed to load sounds:', err);
      }
    })();

    return () => {
      beepSound.current?.unloadAsync();
      alarmSound.current?.unloadAsync();
      flatlineSound.current?.unloadAsync();
      warningBeepSound.current?.unloadAsync();
      artifactBuzzSound.current?.unloadAsync();
      spo2PulseToneSound.current?.unloadAsync();
    };
  }, []);

  // 🔊 Update alarm/flatline/artifact mode based on vitals and waveform
  useEffect(() => {
    (async () => {
      try {
        if (muted) {
          await beepSound.current?.stopAsync().catch(() => {});
          await alarmSound.current?.stopAsync().catch(() => {});
          await flatlineSound.current?.stopAsync().catch(() => {});
          await warningBeepSound.current?.stopAsync().catch(() => {});
          await artifactBuzzSound.current?.stopAsync().catch(() => {});
          await spo2PulseToneSound.current?.stopAsync().catch(() => {});
          currentMode.current = 'muted';
          return;
        }

        const { vs_hr, vs_spo2 } = vitals;

        // Handle alarm silencing (silences alarms but keeps beeps/tones)
        if (alarmSilenced && !enableAlarms) {
          await alarmSound.current?.stopAsync().catch(() => {});
          await warningBeepSound.current?.stopAsync().catch(() => {});
          // Keep normal beeps and SpO2 tones playing
        }

        // 🚨 ARTIFACT MODE - Lead off / poor electrode contact
        const isArtifact = waveformVariant === 'artifact' || waveformVariant === 'artifact_ecg';
        if (isArtifact && currentMode.current !== 'artifact') {
          await alarmSound.current?.stopAsync().catch(() => {});
          await flatlineSound.current?.stopAsync().catch(() => {});
          await warningBeepSound.current?.stopAsync().catch(() => {});
          // Play harsh buzzing sound at 0.2 pitch for electrical noise effect
          await artifactBuzzSound.current?.setRateAsync(0.2, true);
          await artifactBuzzSound.current?.playAsync();
          currentMode.current = 'artifact';
          console.log('[useMonitorBeep] 🔌 Artifact mode activated - buzzing sound');
          return;
        } else if (!isArtifact && currentMode.current === 'artifact') {
          await artifactBuzzSound.current?.stopAsync().catch(() => {});
          currentMode.current = 'normal'; // Will be updated below
        }

        // 💀 FLATLINE MODE
        const flatline = vs_hr === 0;
        if (flatline && currentMode.current !== 'flatline') {
          await alarmSound.current?.stopAsync().catch(() => {});
          await warningBeepSound.current?.stopAsync().catch(() => {});
          await artifactBuzzSound.current?.stopAsync().catch(() => {});
          await flatlineSound.current?.playAsync();
          currentMode.current = 'flatline';
          console.log('[useMonitorBeep] 💀 Flatline mode activated');
          return;
        }

        // 🚨 CRITICAL MODE - SpO₂ < 90 or HR extreme
        const critical = vs_spo2 < 90 || vs_hr < 40 || vs_hr > 140;
        if (critical && !flatline && currentMode.current !== 'critical') {
          await flatlineSound.current?.stopAsync().catch(() => {});
          await warningBeepSound.current?.stopAsync().catch(() => {});
          await artifactBuzzSound.current?.stopAsync().catch(() => {});
          await alarmSound.current?.playAsync();
          currentMode.current = 'critical';
          warningBeepCount.current = 0; // Reset warning counter
          console.log('[useMonitorBeep] 🚨 Critical mode activated');
          return;
        }

        // ⚠️ WARNING MODE - Approaching critical thresholds
        const warning = (vs_spo2 >= 90 && vs_spo2 < 92) ||
                       (vs_hr >= 35 && vs_hr < 40) ||
                       (vs_hr > 140 && vs_hr <= 150);
        if (warning && !critical && !flatline && currentMode.current !== 'warning') {
          await alarmSound.current?.stopAsync().catch(() => {});
          await flatlineSound.current?.stopAsync().catch(() => {});
          await artifactBuzzSound.current?.stopAsync().catch(() => {});
          currentMode.current = 'warning';
          warningBeepCount.current = 0; // Start 3-beep sequence
          console.log('[useMonitorBeep] ⚠️ Warning mode activated - will play 3 beeps before alarm');
          return;
        }

        // ✅ NORMAL MODE - All vitals in safe range
        if (!critical && !flatline && !warning && !isArtifact && currentMode.current !== 'normal') {
          await alarmSound.current?.stopAsync().catch(() => {});
          await flatlineSound.current?.stopAsync().catch(() => {});
          await warningBeepSound.current?.stopAsync().catch(() => {});
          await artifactBuzzSound.current?.stopAsync().catch(() => {});
          currentMode.current = 'normal';
          warningBeepCount.current = 0;
          pauseAlarmPlayed.current = false;
          console.log('[useMonitorBeep] ✅ Normal mode activated');
        }
      } catch (err) {
        console.warn('[useMonitorBeep] Mode change error:', err);
      }
    })();
  }, [vitals, muted, waveformVariant]);

  // 🔊 Pause detection - Check if too much time has passed since last beep
  useEffect(() => {
    if (muted || currentMode.current !== 'normal') return;

    const interval = setInterval(() => {
      const timeSinceLastBeep = Date.now() - lastBeepTime.current;

      // If more than 3 seconds since last beep, play single alarm beep (bradycardia/block detection)
      if (timeSinceLastBeep > 3000 && !pauseAlarmPlayed.current) {
        pauseAlarmPlayed.current = true;
        (async () => {
          try {
            if (alarmSound.current) {
              const status = await alarmSound.current.getStatusAsync();
              if (!status.isPlaying) {
                // Play one alarm beep (not looping)
                await alarmSound.current.setIsLoopingAsync(false);
                await alarmSound.current.playAsync();
                console.log('[useMonitorBeep] ⏸️ Pause detected - single alarm beep');

                // Reset to looping for future critical alarms
                setTimeout(async () => {
                  await alarmSound.current?.setIsLoopingAsync(true);
                }, 1000);
              }
            }
          } catch (e) {
            console.warn('[useMonitorBeep] Pause alarm error:', e.message);
          }
        })();
      }
    }, 500); // Check every 500ms

    return () => clearInterval(interval);
  }, [muted]);

  // 🔊 Return beep trigger function for sweep to call
  const triggerBeep = useCallback(async () => {
    if (muted) return;

    try {
      const { vs_spo2, vs_hr } = vitals;
      const now = Date.now();
      lastBeepTime.current = now;
      pauseAlarmPlayed.current = false; // Reset pause alarm

      // ⚠️ WARNING MODE - Play 3 warning beeps before escalating to continuous alarm
      if (currentMode.current === 'warning') {
        if (warningBeepCount.current < 3) {
          warningBeepCount.current++;
          console.log(`[useMonitorBeep] ⚠️ Warning beep ${warningBeepCount.current}/3`);

          // Play higher-pitched, shorter warning beep
          const status = await warningBeepSound.current.getStatusAsync();
          if (status.isPlaying) {
            await warningBeepSound.current.stopAsync();
            await warningBeepSound.current.setPositionAsync(0);
          }
          await warningBeepSound.current.setRateAsync(1.3, true); // Higher pitch for urgency
          await warningBeepSound.current.setVolumeAsync(0.5);
          await warningBeepSound.current.playAsync();
        } else {
          // After 3 beeps, escalate to continuous alarm
          console.log('[useMonitorBeep] ⚠️ Escalating to continuous alarm');
          await warningBeepSound.current?.stopAsync().catch(() => {});
          await alarmSound.current?.playAsync();
          currentMode.current = 'critical';
        }
        return;
      }

      // 🚨 CRITICAL or FLATLINE or ARTIFACT - Already handled by continuous sounds
      if (currentMode.current === 'critical' ||
          currentMode.current === 'flatline' ||
          currentMode.current === 'artifact') {
        return; // Continuous alarm/flatline/buzz already playing
      }

      // ✅ NORMAL MODE - Standard beep with enhancements
      if (currentMode.current === 'normal' && beepSound.current) {
        // 🎵 RHYTHM-SPECIFIC PITCH MODULATION
        let basePitch = 1.0;
        const waveformLower = waveformVariant.toLowerCase();

        if (waveformLower.includes('vtach') || waveformLower.includes('vfib') || waveformLower.includes('torsades')) {
          basePitch = 0.7; // Lower, more urgent tone for lethal rhythms
        } else if (waveformLower.includes('afib') || waveformLower.includes('aflutter') || waveformLower.includes('svt')) {
          basePitch = 0.95; // Slightly different timbre for atrial arrhythmias
        } else if (waveformLower.includes('brady')) {
          basePitch = 0.85; // Lower for slow rhythms
        } else if (waveformLower.includes('tachy')) {
          basePitch = 1.05; // Slightly higher for fast rhythms
        }

        // 🌈 SpO₂-BASED PITCH MODULATION (multiplicative with rhythm pitch)
        const spo2Modifier =
          vs_spo2 >= 97
            ? 1.0
            : vs_spo2 >= 94
            ? 0.95
            : vs_spo2 >= 90
            ? 0.9
            : 0.75;

        const finalPitch = basePitch * spo2Modifier;

        // 💪 QRS AMPLITUDE-BASED VOLUME MODULATION
        // Estimate pulse strength from HR and SpO₂ as proxies
        // In a real implementation, this would come from the waveform amplitude
        // Strong pulse: HR 60-100, SpO₂ >95 = volume 0.6
        // Weak pulse: HR <50 or >120, SpO₂ 90-95 = volume 0.4
        // Very weak: HR <40 or >140, SpO₂ <90 = volume 0.2

        let volume = 0.6; // Default strong pulse

        if (vs_hr < 40 || vs_hr > 140 || vs_spo2 < 90) {
          volume = 0.2; // Very weak pulse
        } else if (vs_hr < 50 || vs_hr > 120 || (vs_spo2 >= 90 && vs_spo2 < 95)) {
          volume = 0.4; // Weak pulse
        } else if (vs_hr >= 50 && vs_hr <= 100 && vs_spo2 >= 95) {
          volume = 0.6; // Strong pulse
        }

        // 🔊 PLAY THE BEEP
        const status = await beepSound.current.getStatusAsync();
        if (status.isPlaying) {
          await beepSound.current.stopAsync();
          await beepSound.current.setPositionAsync(0);
        }
        await beepSound.current.setRateAsync(finalPitch, true);
        await beepSound.current.setVolumeAsync(volume);
        await beepSound.current.playAsync();

        // 🎨 TRIGGER VISUAL FEEDBACK - Flash HR/SpO₂ numerics in sync with beep
        if (onVisualFeedback) {
          onVisualFeedback('hr');
          onVisualFeedback('spo2');
        }

        // Log for debugging (only in development)
        if (__DEV__) {
          console.log(`[useMonitorBeep] 🔊 Beep: pitch=${finalPitch.toFixed(2)} vol=${volume.toFixed(1)} mode=${waveformVariant}`);
        }
      }
    } catch (e) {
      console.warn('[useMonitorBeep] Beep trigger error:', e.message);
    }
  }, [vitals, muted, waveformVariant, onVisualFeedback]);

  // 🎵 SpO2 PULSE TONE - Separate trigger for SpO2 waveform peaks
  const triggerSpo2PulseTone = useCallback(async (perfusionIndex = 5) => {
    if (__DEV__) {
      console.log(`[useMonitorBeep] 🎵 triggerSpo2PulseTone called: PI=${perfusionIndex}, muted=${muted}, enabled=${enableSpo2PulseTone}, mode=${currentMode.current}`);
    }

    if (muted || !enableSpo2PulseTone) {
      if (__DEV__) console.log(`[useMonitorBeep] 🎵 SpO2 tone blocked: muted=${muted}, enabled=${enableSpo2PulseTone}`);
      return;
    }
    if (currentMode.current === 'flatline' || currentMode.current === 'artifact') {
      if (__DEV__) console.log(`[useMonitorBeep] 🎵 SpO2 tone blocked: mode=${currentMode.current}`);
      return;
    }

    try {
      const { vs_spo2 } = vitals;

      // SpO2-based pitch modulation (higher SpO2 = higher pitch = more pleasant)
      let pitch = 1.0;
      if (vs_spo2 >= 98) {
        pitch = 1.4; // High, pleasant tone
      } else if (vs_spo2 >= 95) {
        pitch = 1.2; // Moderate-high tone
      } else if (vs_spo2 >= 92) {
        pitch = 1.0; // Mid tone
      } else if (vs_spo2 >= 88) {
        pitch = 0.85; // Lower tone (concerning)
      } else if (vs_spo2 >= 85) {
        pitch = 0.7; // Low tone (warning)
      } else {
        pitch = 0.6; // Very low tone (critical)
      }

      // Volume based on perfusion index (waveform amplitude)
      // PI 0-10 scale, where 10 is maximal perfusion
      const volume = Math.max(0.1, Math.min(1.0, (perfusionIndex / 10) * spo2ToneVolume * masterVolume));

      // Play the SpO2 pulse tone
      if (spo2PulseToneSound.current) {
        const status = await spo2PulseToneSound.current.getStatusAsync();

        // Check if sound is loaded (can happen after hot reload)
        if (!status.isLoaded) {
          if (__DEV__) {
            console.log('[useMonitorBeep] 🎵 SpO2 tone sound not loaded, reloading...');
          }
          // Reload the sound
          await spo2PulseToneSound.current.unloadAsync().catch(() => {});
          const { sound } = await Audio.Sound.createAsync(
            require('../assets/sounds/beep.wav'),
            { volume: 0.5 }
          );
          spo2PulseToneSound.current = sound;
        }

        if (status.isPlaying) {
          await spo2PulseToneSound.current.stopAsync();
          await spo2PulseToneSound.current.setPositionAsync(0);
        }
        await spo2PulseToneSound.current.setRateAsync(pitch, true);
        await spo2PulseToneSound.current.setVolumeAsync(volume);
        await spo2PulseToneSound.current.playAsync();

        if (__DEV__) {
          console.log(`[useMonitorBeep] 🎵 SpO2 tone: pitch=${pitch.toFixed(2)} vol=${volume.toFixed(2)} SpO2=${vs_spo2}% PI=${perfusionIndex}`);
        }
      }
    } catch (e) {
      console.warn('[useMonitorBeep] SpO2 tone error:', e.message);
    }
  }, [vitals, muted, enableSpo2PulseTone, spo2ToneVolume, masterVolume]);

  // 🔊 TIME-BASED ECG BEEP SYSTEM - Continuous beeping independent of sweep animation
  // This ensures beeps fire consistently at the heart rate, not tied to visual sweep cycles
  useEffect(() => {
    if (muted || currentMode.current === 'flatline' || currentMode.current === 'artifact') return;

    const { vs_hr } = vitals;

    // No beeps for asystole
    if (vs_hr === 0) return;

    // Calculate interval between beeps (in milliseconds)
    const beepInterval = (60 / vs_hr) * 1000;

    // Set up continuous beeping timer
    const beepTimer = setInterval(() => {
      triggerBeep();
    }, beepInterval);

    // Trigger first beep immediately
    triggerBeep();

    if (__DEV__) {
      console.log(`[useMonitorBeep] 🔊 Starting continuous ECG beeps: HR=${vs_hr} bpm, interval=${beepInterval.toFixed(0)}ms`);
    }

    return () => clearInterval(beepTimer);
  }, [vitals.vs_hr, muted, triggerBeep]);

  // 🎵 TIME-BASED SPO2 PULSE TONE SYSTEM - Continuous tones with PTT delay
  // SpO2 tones trigger ~300ms after each ECG beep (pulse transit time)
  useEffect(() => {
    if (muted || !enableSpo2PulseTone || currentMode.current === 'flatline' || currentMode.current === 'artifact') return;

    const { vs_hr, vs_spo2 } = vitals;

    // No tones for asystole
    if (vs_hr === 0) return;

    // Calculate interval between SpO2 pulses (same as beeps)
    const pulseInterval = (60 / vs_hr) * 1000;

    // PTT delay in milliseconds (200-300ms typical)
    const pttDelayMs = 250; // 250ms pulse transit time

    // Calculate perfusion index for SpO2 tone volume
    let perfusionIndex;
    if (vs_spo2 >= 98) perfusionIndex = 10;
    else if (vs_spo2 >= 95) perfusionIndex = 8;
    else if (vs_spo2 >= 92) perfusionIndex = 7;
    else if (vs_spo2 >= 88) perfusionIndex = 6;
    else if (vs_spo2 >= 85) perfusionIndex = 5;
    else if (vs_spo2 >= 82) perfusionIndex = 4;
    else if (vs_spo2 >= 78) perfusionIndex = 3;
    else if (vs_spo2 >= 75) perfusionIndex = 2;
    else if (vs_spo2 >= 70) perfusionIndex = 1;
    else perfusionIndex = 0;

    // HR-dependent amplitude scaling for tachycardia
    if (vs_hr >= 140) {
      const reductionFactor = Math.max(0.5, 1.0 - ((vs_hr - 140) * 0.005));
      perfusionIndex *= reductionFactor;
      if (vs_spo2 >= 98) perfusionIndex *= 1.15;
    } else if (vs_hr >= 120) {
      const reductionFactor = 1.0 - ((vs_hr - 120) * 0.0075);
      perfusionIndex *= reductionFactor;
      if (vs_spo2 >= 98) perfusionIndex *= 1.1;
    }

    // Set up continuous SpO2 pulse tone timer with PTT delay
    const spo2Timer = setInterval(() => {
      triggerSpo2PulseTone(perfusionIndex);
    }, pulseInterval);

    // Trigger first SpO2 pulse tone after PTT delay
    const initialTimeout = setTimeout(() => {
      triggerSpo2PulseTone(perfusionIndex);
    }, pttDelayMs);

    if (__DEV__) {
      console.log(`[useMonitorBeep] 🎵 Starting continuous SpO2 tones: HR=${vs_hr} bpm, PTT delay=${pttDelayMs}ms, PI=${perfusionIndex.toFixed(1)}`);
    }

    return () => {
      clearInterval(spo2Timer);
      clearTimeout(initialTimeout);
    };
  }, [vitals.vs_hr, vitals.vs_spo2, muted, enableSpo2PulseTone, triggerSpo2PulseTone]);

  // Return both trigger functions AND the current mode for visual feedback
  return {
    triggerBeep,
    triggerSpo2PulseTone,
    currentMode: currentMode.current
  };
}
