// hooks/useVisualAlerts.js
// Visual feedback system for medical monitor - flashing borders, numeric pulses, icon animations
// Synchronized with audio alerts for maximum clinical realism
import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

export default function useVisualAlerts(vitals, currentMode, isMuted) {
  // Animation values for different visual feedback types
  const hrFlashAnim = useRef(new Animated.Value(0)).current; // HR numeric pulse on each beep
  const spo2FlashAnim = useRef(new Animated.Value(0)).current; // SpO₂ numeric pulse on each beep
  const alarmFlashAnim = useRef(new Animated.Value(0)).current; // Critical alarm border flash (2 Hz)
  const warningFlashAnim = useRef(new Animated.Value(0)).current; // Warning border flash (1 Hz)
  const bellPulseAnim = useRef(new Animated.Value(1)).current; // Bell icon pulse animation

  // Track which vital triggered alarm for targeted flashing
  const alarmSource = useRef(null); // 'hr', 'spo2', 'bp', or null

  // 🚨 CRITICAL ALARM - Fast red border flash (2 Hz = 500ms cycle)
  useEffect(() => {
    if (currentMode === 'critical' && !isMuted) {
      // Determine which vital triggered the alarm
      const { vs_hr, vs_spo2 } = vitals;
      if (vs_spo2 < 90) {
        alarmSource.current = 'spo2';
      } else if (vs_hr < 40 || vs_hr > 140) {
        alarmSource.current = 'hr';
      }

      // Fast blinking red border (2 Hz)
      const alarmBlink = Animated.loop(
        Animated.sequence([
          Animated.timing(alarmFlashAnim, {
            toValue: 1,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.timing(alarmFlashAnim, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
          }),
        ])
      );
      alarmBlink.start();

      return () => {
        alarmBlink.stop();
        alarmFlashAnim.setValue(0);
      };
    } else {
      alarmSource.current = null;
      alarmFlashAnim.setValue(0);
    }
  }, [currentMode, vitals, isMuted]);

  // ⚠️ WARNING MODE - Slow yellow border flash (1 Hz = 1000ms cycle)
  useEffect(() => {
    if (currentMode === 'warning' && !isMuted) {
      const warningBlink = Animated.loop(
        Animated.sequence([
          Animated.timing(warningFlashAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(warningFlashAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );
      warningBlink.start();

      return () => {
        warningBlink.stop();
        warningFlashAnim.setValue(0);
      };
    } else {
      warningFlashAnim.setValue(0);
    }
  }, [currentMode, isMuted]);

  // 🔔 BELL ICON PULSE - Pulses with alarm sounds
  useEffect(() => {
    if ((currentMode === 'critical' || currentMode === 'warning' || currentMode === 'flatline') && !isMuted) {
      const bellPulse = Animated.loop(
        Animated.sequence([
          Animated.timing(bellPulseAnim, {
            toValue: 1.2,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(bellPulseAnim, {
            toValue: 1.0,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.delay(100), // Brief pause between pulses
        ])
      );
      bellPulse.start();

      return () => {
        bellPulse.stop();
        bellPulseAnim.setValue(1);
      };
    } else {
      bellPulseAnim.setValue(1);
    }
  }, [currentMode, isMuted]);

  // 🩺 HR NUMERIC FLASH - Triggered by beep callback
  const triggerHRFlash = () => {
    if (currentMode === 'normal' || currentMode === 'warning') {
      Animated.sequence([
        Animated.timing(hrFlashAnim, {
          toValue: 1,
          duration: 75,
          useNativeDriver: true,
        }),
        Animated.timing(hrFlashAnim, {
          toValue: 0,
          duration: 75,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  // 🫁 SpO₂ NUMERIC FLASH - Triggered by beep callback (same timing as HR)
  const triggerSpO2Flash = () => {
    if (currentMode === 'normal' || currentMode === 'warning') {
      Animated.sequence([
        Animated.timing(spo2FlashAnim, {
          toValue: 1,
          duration: 75,
          useNativeDriver: true,
        }),
        Animated.timing(spo2FlashAnim, {
          toValue: 0,
          duration: 75,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  // Return all animation values and trigger functions
  return {
    // Animation values (0 to 1)
    hrFlashAnim,
    spo2FlashAnim,
    alarmFlashAnim,
    warningFlashAnim,
    bellPulseAnim,

    // Alarm source indicator
    alarmSource: alarmSource.current,

    // Trigger functions (called by beep callback)
    triggerHRFlash,
    triggerSpO2Flash,
  };
}
