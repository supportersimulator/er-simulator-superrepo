// engines/SoundManager.js
/**
 * SOUND MANAGER
 *
 * Handles all audio playback, volume control, fading, and ducking
 * for the Adaptive Salience Audio System
 *
 * Responsibilities:
 * - Load and manage sound assets
 * - Play tones with precise volume and timing
 * - Handle smooth volume fading
 * - Manage audio ducking during voice activity
 * - Ensure minimum interval between sounds globally
 */

import { Audio } from 'expo-av';

const MIN_SOUND_INTERVAL = 2000; // Minimum 2 seconds between any sounds globally

export class SoundManager {
  constructor() {
    this.sounds = new Map();
    this.activeSounds = new Map();
    this.lastSoundTime = 0;
    this.globalVolume = 1.0;
    this.isDucked = false;
    this.duckingVolume = 0.3;

    this.initialized = false;
  }

  /**
   * Initialize audio system and load sound assets
   */
  async initialize() {
    if (this.initialized) return;

    try {
      // Configure audio mode for proper playback
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });

      // Load sound assets
      await this.loadSounds();

      this.initialized = true;
      console.log('[SoundManager] Initialized successfully');
    } catch (error) {
      console.error('[SoundManager] Initialization error:', error);
    }
  }

  /**
   * Load all sound assets for Adaptive Salience
   */
  async loadSounds() {
    const soundAssets = {
      // AWARENESS PHASE - Single clear notification tones
      awareness_hr: require('../assets/sounds/adaptive/awareness_hr.mp3'),
      awareness_spo2: require('../assets/sounds/adaptive/awareness_spo2.mp3'),
      awareness_bp: require('../assets/sounds/adaptive/awareness_bp.mp3'),
      awareness_rr: require('../assets/sounds/adaptive/awareness_rr.mp3'),
      awareness_rhythm: require('../assets/sounds/adaptive/awareness_rhythm.mp3'),
      awareness_generic: require('../assets/sounds/adaptive/awareness_generic.mp3'),

      // PERSISTENCE PHASE - Soft recurring reminders
      persistence_hr: require('../assets/sounds/adaptive/persistence_hr.mp3'),
      persistence_spo2: require('../assets/sounds/adaptive/persistence_spo2.mp3'),
      persistence_bp: require('../assets/sounds/adaptive/persistence_bp.mp3'),
      persistence_rr: require('../assets/sounds/adaptive/persistence_rr.mp3'),
      persistence_generic: require('../assets/sounds/adaptive/persistence_generic.mp3'),

      // NEGLECT PHASE - More insistent alerts
      neglect_hr: require('../assets/sounds/adaptive/neglect_hr.mp3'),
      neglect_spo2: require('../assets/sounds/adaptive/neglect_spo2.mp3'),
      neglect_bp: require('../assets/sounds/adaptive/neglect_bp.mp3'),
      neglect_rr: require('../assets/sounds/adaptive/neglect_rr.mp3'),
      neglect_generic: require('../assets/sounds/adaptive/neglect_generic.mp3'),

      // CRITICAL RHYTHMS - Continuous alarm loops
      critical_vfib: require('../assets/sounds/adaptive/critical_vfib.mp3'),
      critical_vtach: require('../assets/sounds/adaptive/critical_vtach.mp3'),
      critical_asystole: require('../assets/sounds/adaptive/critical_asystole.mp3'),

      // UTILITY SOUNDS
      acknowledge_chime: require('../assets/sounds/adaptive/acknowledge.mp3'),
      normalize_chime: require('../assets/sounds/adaptive/normalize.mp3'),
    };

    for (const [key, source] of Object.entries(soundAssets)) {
      try {
        const { sound } = await Audio.Sound.createAsync(source, {
          shouldPlay: false,
          volume: 1.0,
        });
        this.sounds.set(key, sound);
      } catch (error) {
        console.warn(`[SoundManager] Failed to load sound: ${key}`, error);
        // Create a placeholder null sound so we don't crash
        this.sounds.set(key, null);
      }
    }
  }

  /**
   * Play a sound event from the Adaptive Salience Engine
   */
  async playSoundEvent(event) {
    if (!this.initialized) {
      await this.initialize();
    }

    // Check global minimum interval
    const now = Date.now();
    if (now - this.lastSoundTime < MIN_SOUND_INTERVAL) {
      console.log('[SoundManager] Skipping sound - too soon after last sound');
      return;
    }

    const soundKey = this.getSoundKey(event);
    const sound = this.sounds.get(soundKey);

    if (!sound) {
      console.warn(`[SoundManager] Sound not found: ${soundKey}`);
      return;
    }

    try {
      // Calculate final volume (event volume * global volume * ducking)
      const effectiveVolume = event.volume * this.globalVolume * (this.isDucked ? this.duckingVolume : 1.0);

      // Stop if already playing
      await sound.stopAsync();
      await sound.setPositionAsync(0);
      await sound.setVolumeAsync(effectiveVolume);
      await sound.playAsync();

      this.lastSoundTime = now;
      this.activeSounds.set(event.paramName, sound);

      console.log(`[SoundManager] Playing: ${soundKey} at volume ${effectiveVolume.toFixed(2)}`);
    } catch (error) {
      console.error('[SoundManager] Playback error:', error);
    }
  }

  /**
   * Determine which sound file to play based on event
   */
  getSoundKey(event) {
    const { paramName, phase, severity, threshold } = event;

    // Critical rhythms get special continuous sounds
    if (paramName === 'rhythm' && severity === 3) { // SEVERITY.CRITICAL
      const rhythmMap = {
        vfib: 'critical_vfib',
        vtach: 'critical_vtach',
        asystole: 'critical_asystole',
        pea: 'critical_asystole', // Use same sound as asystole
      };
      return rhythmMap[threshold] || 'critical_vfib';
    }

    // Map param names to sound assets
    const paramMap = {
      hr: 'hr',
      spo2: 'spo2',
      bp: 'bp',
      rr: 'rr',
      etco2: 'rr', // Use RR sounds for EtCO2
      rhythm: 'rhythm',
    };

    const soundParam = paramMap[paramName] || 'generic';
    return `${phase}_${soundParam}`;
  }

  /**
   * Fade out a specific parameter's sound
   */
  async fadeOut(paramName, duration = 2000) {
    const sound = this.activeSounds.get(paramName);
    if (!sound) return;

    try {
      const status = await sound.getStatusAsync();
      if (!status.isLoaded || !status.isPlaying) return;

      const currentVolume = status.volume || 0;
      const steps = 20;
      const stepDuration = duration / steps;
      const volumeStep = currentVolume / steps;

      for (let i = 0; i < steps; i++) {
        const newVolume = currentVolume - (volumeStep * (i + 1));
        await sound.setVolumeAsync(Math.max(0, newVolume));
        await new Promise(resolve => setTimeout(resolve, stepDuration));
      }

      await sound.stopAsync();
      this.activeSounds.delete(paramName);
    } catch (error) {
      console.error('[SoundManager] Fade out error:', error);
    }
  }

  /**
   * Play acknowledgment chime
   */
  async playAcknowledgeChime() {
    const sound = this.sounds.get('acknowledge_chime');
    if (sound) {
      try {
        await sound.stopAsync();
        await sound.setPositionAsync(0);
        await sound.setVolumeAsync(0.4 * this.globalVolume);
        await sound.playAsync();
      } catch (error) {
        console.error('[SoundManager] Acknowledge chime error:', error);
      }
    }
  }

  /**
   * Play normalization chime (vital returned to normal)
   */
  async playNormalizeChime() {
    const sound = this.sounds.get('normalize_chime');
    if (sound) {
      try {
        await sound.stopAsync();
        await sound.setPositionAsync(0);
        await sound.setVolumeAsync(0.3 * this.globalVolume);
        await sound.playAsync();
      } catch (error) {
        console.error('[SoundManager] Normalize chime error:', error);
      }
    }
  }

  /**
   * Duck audio (reduce volume during voice activity)
   */
  setDucking(isDucked) {
    this.isDucked = isDucked;

    // Adjust volume of all currently playing sounds
    this.activeSounds.forEach(async (sound) => {
      try {
        const status = await sound.getStatusAsync();
        if (status.isLoaded && status.isPlaying) {
          const baseVolume = status.volume || 0.5;
          const newVolume = baseVolume * (isDucked ? this.duckingVolume : 1.0 / this.duckingVolume);
          await sound.setVolumeAsync(Math.min(1.0, newVolume));
        }
      } catch (error) {
        console.error('[SoundManager] Ducking adjustment error:', error);
      }
    });

    console.log(`[SoundManager] Ducking ${isDucked ? 'enabled' : 'disabled'}`);
  }

  /**
   * Set global volume multiplier
   */
  setGlobalVolume(volume) {
    this.globalVolume = Math.max(0, Math.min(1, volume));
  }

  /**
   * Stop all sounds
   */
  async stopAll() {
    for (const [key, sound] of this.activeSounds.entries()) {
      try {
        if (sound) {
          await sound.stopAsync();
        }
      } catch (error) {
        console.error(`[SoundManager] Error stopping sound ${key}:`, error);
      }
    }
    this.activeSounds.clear();
  }

  /**
   * Cleanup and release resources
   */
  async cleanup() {
    await this.stopAll();

    for (const [key, sound] of this.sounds.entries()) {
      try {
        if (sound) {
          await sound.unloadAsync();
        }
      } catch (error) {
        console.error(`[SoundManager] Error unloading sound ${key}:`, error);
      }
    }

    this.sounds.clear();
    this.initialized = false;
  }
}

export default SoundManager;
