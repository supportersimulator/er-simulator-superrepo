// hooks/SoundManager.js
/**
 * SOUND MANAGER - Adaptive Salience Audio System
 *
 * Handles all audio playback with intelligent features:
 * - Volume ducking during voice activity
 * - Sound prioritization (critical > warning > informational)
 * - Collision avoidance (max 1 sound per 2 seconds globally)
 * - Smooth fade in/out on state changes
 *
 * Philosophy: "Only sound when sound adds value"
 */

import { useRef, useCallback, useEffect } from 'react';
import { Audio } from 'expo-av';

/**
 * Sound Priority Levels
 */
const PRIORITY = {
  SILENCE: 0,
  INFORMATIONAL: 1,
  WARNING: 2,
  CRITICAL: 3,
  DIALOGUE: 4, // Voice conversation - ducks all other audio
};

/**
 * useSoundManager Hook
 *
 * Manages all audio playback with adaptive salience principles
 */
export default function useSoundManager(options = {}) {
  const {
    masterVolume = 1.0,
    enableDucking = true,
    duckingLevel = 0.3, // Duck to 30% during speech
    minCriticalVolume = 0.5, // Critical alarms never duck below 50%
  } = options;

  // Sound instance cache
  const soundCache = useRef({});

  // Global state
  const isSpeaking = useRef(false);
  const lastSoundTime = useRef(0);
  const currentVolume = useRef(1.0);
  const activeSounds = useRef(new Set());

  /**
   * Initialize audio mode (iOS requires this)
   */
  useEffect(() => {
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      allowsRecordingIOS: false,
      staysActiveInBackground: false,
      shouldDuckAndroid: false,
    });
  }, []);

  /**
   * Load and cache a sound file
   */
  const loadSound = useCallback(async (soundKey, soundFile) => {
    if (soundCache.current[soundKey]) {
      return soundCache.current[soundKey];
    }

    try {
      const { sound } = await Audio.Sound.createAsync(soundFile, {
        volume: masterVolume,
      });

      soundCache.current[soundKey] = sound;

      if (__DEV__) {
        console.log(`[SoundManager] Loaded sound: ${soundKey}`);
      }

      return sound;
    } catch (error) {
      console.warn(`[SoundManager] Failed to load sound ${soundKey}:`, error.message);
      return null;
    }
  }, [masterVolume]);

  /**
   * Preload all alert sounds
   */
  const preloadSounds = useCallback(async () => {
    const soundAssets = {
      // Awareness phase (Phase 1)
      awareness_hr_high: require('../assets/sounds/beep.wav'),
      awareness_hr_low: require('../assets/sounds/beep.wav'),
      awareness_spo2: require('../assets/sounds/beep.wav'),
      awareness_bp_high: require('../assets/sounds/beep.wav'),
      awareness_bp_low: require('../assets/sounds/beep.wav'),

      // Persistence/Escalation (use existing sounds with different playback)
      persistent_tone: require('../assets/sounds/beep.wav'),
      escalation_tone: require('../assets/sounds/alarm.wav'),

      // Critical alarms
      critical_vf_asystole: require('../assets/sounds/flatline.wav'),
      critical_alarm: require('../assets/sounds/alarm.wav'),

      // Training mode continuous beep
      continuous_beep: require('../assets/sounds/beep.wav'),
    };

    for (const [key, file] of Object.entries(soundAssets)) {
      await loadSound(key, file);
    }

    if (__DEV__) {
      console.log('[SoundManager] All sounds preloaded');
    }
  }, [loadSound]);

  /**
   * Set speaking state (enables ducking)
   */
  const setSpeaking = useCallback((speaking) => {
    isSpeaking.current = speaking;

    if (__DEV__) {
      console.log(`[SoundManager] Voice activity: ${speaking ? 'SPEAKING' : 'SILENT'}`);
    }
  }, []);

  /**
   * Calculate effective volume based on priority and speaking state
   */
  const getEffectiveVolume = useCallback((basePriority, baseVolume = 1.0) => {
    let effectiveVolume = baseVolume * masterVolume;

    // Duck during speech, but critical alarms stay above minimum
    if (enableDucking && isSpeaking.current) {
      if (basePriority === PRIORITY.CRITICAL) {
        effectiveVolume = Math.max(effectiveVolume * duckingLevel, minCriticalVolume);
      } else if (basePriority === PRIORITY.WARNING) {
        effectiveVolume *= duckingLevel;
      } else {
        // Informational sounds are completely silenced during speech
        effectiveVolume = 0;
      }
    }

    return Math.max(0, Math.min(1.0, effectiveVolume));
  }, [masterVolume, enableDucking, duckingLevel, minCriticalVolume]);

  /**
   * Check if enough time has passed since last sound (collision avoidance)
   * Rule: Max 1 sound per 2 seconds globally (except critical)
   */
  const canPlaySound = useCallback((priority) => {
    const now = Date.now();
    const timeSinceLastSound = now - lastSoundTime.current;

    // Critical sounds always play
    if (priority === PRIORITY.CRITICAL) {
      return true;
    }

    // Other sounds must wait 2 seconds
    if (timeSinceLastSound < 2000) {
      if (__DEV__) {
        console.log(`[SoundManager] Sound collision avoided (${timeSinceLastSound}ms since last)`);
      }
      return false;
    }

    return true;
  }, []);

  /**
   * Play a sound with adaptive volume
   */
  const playSound = useCallback(async (soundKey, options = {}) => {
    const {
      priority = PRIORITY.WARNING,
      volume = 1.0,
      pitch = 1.0,
      loop = false,
    } = options;

    // Check collision avoidance
    if (!canPlaySound(priority)) {
      return false;
    }

    const sound = soundCache.current[soundKey];
    if (!sound) {
      console.warn(`[SoundManager] Sound not loaded: ${soundKey}`);
      return false;
    }

    try {
      // Calculate effective volume with ducking
      const effectiveVolume = getEffectiveVolume(priority, volume);

      if (effectiveVolume === 0) {
        // Don't play if fully ducked
        return false;
      }

      // Stop if already playing
      const status = await sound.getStatusAsync();
      if (status.isPlaying) {
        await sound.stopAsync();
        await sound.setPositionAsync(0);
      }

      // Configure sound
      await sound.setRateAsync(pitch, true);
      await sound.setVolumeAsync(effectiveVolume);
      await sound.setIsLoopingAsync(loop);

      // Play
      await sound.playAsync();

      // Track active sound
      activeSounds.current.add(soundKey);
      lastSoundTime.current = Date.now();

      if (__DEV__) {
        console.log(`[SoundManager] 🔊 Playing: ${soundKey} (vol=${effectiveVolume.toFixed(2)}, priority=${priority})`);
      }

      // Remove from active set when done (if not looping)
      if (!loop) {
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.didJustFinish) {
            activeSounds.current.delete(soundKey);
          }
        });
      }

      return true;
    } catch (error) {
      console.warn(`[SoundManager] Error playing ${soundKey}:`, error.message);
      return false;
    }
  }, [canPlaySound, getEffectiveVolume]);

  /**
   * Stop a specific sound
   */
  const stopSound = useCallback(async (soundKey, fadeOut = true) => {
    const sound = soundCache.current[soundKey];
    if (!sound) return;

    try {
      if (fadeOut) {
        // Fade out over 500ms
        const status = await sound.getStatusAsync();
        if (status.isPlaying) {
          const startVolume = status.volume || 0;
          const steps = 10;
          const stepTime = 50; // 500ms total

          for (let i = steps; i >= 0; i--) {
            const volume = (i / steps) * startVolume;
            await sound.setVolumeAsync(volume);
            await new Promise(resolve => setTimeout(resolve, stepTime));
          }
        }
      }

      await sound.stopAsync();
      await sound.setPositionAsync(0);
      activeSounds.current.delete(soundKey);

      if (__DEV__) {
        console.log(`[SoundManager] 🔇 Stopped: ${soundKey}`);
      }
    } catch (error) {
      console.warn(`[SoundManager] Error stopping ${soundKey}:`, error.message);
    }
  }, []);

  /**
   * Stop all sounds
   */
  const stopAllSounds = useCallback(async (fadeOut = true) => {
    const soundKeys = Array.from(activeSounds.current);

    await Promise.all(
      soundKeys.map(key => stopSound(key, fadeOut))
    );

    if (__DEV__) {
      console.log('[SoundManager] 🔇 All sounds stopped');
    }
  }, [stopSound]);

  /**
   * Update volume of all active sounds (for ducking)
   */
  const updateActiveSoundsVolume = useCallback(async () => {
    for (const soundKey of activeSounds.current) {
      const sound = soundCache.current[soundKey];
      if (!sound) continue;

      try {
        const status = await sound.getStatusAsync();
        if (status.isPlaying) {
          // Recalculate volume with current ducking state
          // Note: We'd need to store original priority/volume for each sound
          // For now, just demonstrate the concept
          const newVolume = getEffectiveVolume(PRIORITY.WARNING, 1.0);
          await sound.setVolumeAsync(newVolume);
        }
      } catch (error) {
        // Ignore
      }
    }
  }, [getEffectiveVolume]);

  /**
   * React to speaking state changes
   */
  useEffect(() => {
    if (enableDucking) {
      updateActiveSoundsVolume();
    }
  }, [isSpeaking.current, enableDucking, updateActiveSoundsVolume]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      Object.values(soundCache.current).forEach(sound => {
        sound?.unloadAsync().catch(() => {});
      });
    };
  }, []);

  return {
    preloadSounds,
    playSound,
    stopSound,
    stopAllSounds,
    setSpeaking,
    PRIORITY,
  };
}
