// components/CardiacSweepOverlay.js
// Shared 18px sweep overlay for ECG + SpO₂ (cardiac waveforms)
// Timing: (60 / HR) * numCycles * 1000ms
// IDEA 6: Pre-marked R-wave positions for medically accurate beep timing

import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { getRWavePositions } from './WaveformConfig';

export default function CardiacSweepOverlay({
  hr = 75,
  numCycles = 5,
  containerWidth,
  vitalInfoWidth = 54,
  waveformVariant = 'sinus', // 🩺 NEW: ECG waveform type (sinus, afib, vtach, asystole)
  onBeepTrigger, // 🔊 Callback fired when sweep crosses R-wave peak (ECG beep)
  onSpo2PulseToneTrigger = null, // 🎵 Callback fired when sweep crosses SpO2 peak (R-wave + PTT delay)
  perfusionIndex = 5, // Perfusion index for SpO2 pulse tone volume
  pttDelay = 0.22 // Pulse transit time delay (default 22% of R-R interval)
}) {
  const sweepProgress = useRef(new Animated.Value(0)).current;
  const loopAnimationRef = useRef(null);
  const lastUsedHR = useRef(hr);
  const adaptTimerRef = useRef(null);
  const lastBeepIndex = useRef(-1); // Track which R-wave we last crossed (for ECG beep)
  const lastSpo2PeakIndex = useRef(-1); // Track which SpO2 peak we last crossed (for pulse tone)

  // Initialize animation on mount
  useEffect(() => {
    if (!containerWidth) return;

    // 🩺 SAFETY: Stop sweep if HR is 0 (asystole/vfib - no heartbeat)
    if (hr === 0) {
      if (loopAnimationRef.current) {
        loopAnimationRef.current.stop();
        loopAnimationRef.current = null;
      }
      return;
    }

    // Start animation at initial HR
    const duration = ((60 / hr) * numCycles) * 1000;
    lastUsedHR.current = hr;

    loopAnimationRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(sweepProgress, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
        Animated.timing(sweepProgress, {
          toValue: 1,
          duration: duration,
          easing: (t) => t,
          useNativeDriver: true,
          isInteraction: false,
        }),
      ]),
      { iterations: -1 }
    );

    loopAnimationRef.current.start();

    // Cleanup only on unmount
    return () => {
      if (loopAnimationRef.current) {
        loopAnimationRef.current.stop();
      }
      sweepProgress.stopAnimation();
      if (adaptTimerRef.current) {
        clearTimeout(adaptTimerRef.current);
      }
    };
  }, [containerWidth, numCycles]); // Only restart on mount or container changes

  // Handle HR changes separately
  useEffect(() => {
    if (!containerWidth || !loopAnimationRef.current) return;

    // Check if HR changed significantly
    const hrDiff = Math.abs(hr - lastUsedHR.current);

    if (hrDiff < 10) {
      // HR change too small - clear any pending timer
      if (adaptTimerRef.current) {
        clearTimeout(adaptTimerRef.current);
        adaptTimerRef.current = null;
      }
      return;
    }

    // HR changed ≥10 bpm - debounce adaptation
    if (adaptTimerRef.current) {
      clearTimeout(adaptTimerRef.current);
    }

    adaptTimerRef.current = setTimeout(() => {
      // HR has stabilized - restart animation
      lastUsedHR.current = hr;

      if (loopAnimationRef.current) {
        loopAnimationRef.current.stop();
      }

      // 🩺 SAFETY: Stop sweep if HR is 0 (asystole/vfib - no heartbeat)
      if (hr === 0) {
        loopAnimationRef.current = null;
        return;
      }

      const duration = ((60 / hr) * numCycles) * 1000;

      loopAnimationRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(sweepProgress, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
          Animated.timing(sweepProgress, {
            toValue: 1,
            duration: duration,
            easing: (t) => t,
            useNativeDriver: true,
            isInteraction: false,
          }),
        ]),
        { iterations: -1 }
      );

      loopAnimationRef.current.start();
    }, 300);

    // No cleanup here - let animation keep running
  }, [hr, containerWidth, numCycles]); // Monitor HR changes

  // 🔊 Monitor sweep position and trigger beep when crossing pre-marked R-wave peaks
  useEffect(() => {
    if (!onBeepTrigger || !containerWidth) return;

    // Get medically accurate R-wave positions for this waveform type
    const rWavePositions = getRWavePositions(waveformVariant);

    // If no R-waves (asystole), don't set up listener
    if (rWavePositions.length === 0) return;

    const listenerId = sweepProgress.addListener(({ value }) => {
      // Find which R-wave position we're closest to
      for (let i = 0; i < rWavePositions.length; i++) {
        const rWavePos = rWavePositions[i];

        // If we've crossed this R-wave and haven't beeped for it yet
        if (value >= rWavePos && lastBeepIndex.current < i) {
          lastBeepIndex.current = i;
          onBeepTrigger(); // 🔊 Fire medically accurate beep!
          break; // Only trigger one beep per frame
        }
      }

      // Reset when sweep restarts
      if (value < 0.01) {
        lastBeepIndex.current = -1;
      }
    });

    return () => sweepProgress.removeListener(listenerId);
  }, [containerWidth, numCycles, waveformVariant, onBeepTrigger]);

  // 🎵 Monitor sweep position and trigger SpO2 pulse tone when crossing SpO2 peaks
  // SpO2 peaks occur at R-wave positions + PTT delay + upstroke duration
  useEffect(() => {
    if (!onSpo2PulseToneTrigger || !containerWidth) return;

    // Get R-wave positions
    const rWavePositions = getRWavePositions(waveformVariant);

    // If no R-waves (asystole), don't set up listener
    if (rWavePositions.length === 0) return;

    // Calculate SpO2 peak positions (R-waves + PTT delay + upstroke)
    const spo2PeakPositions = rWavePositions.map((rPos, rIndex) => {
      const nextRPos = rIndex < rWavePositions.length - 1 ? rWavePositions[rIndex + 1] : 1.0;
      const rrInterval = nextRPos - rPos;

      // SpO2 peak = R-wave + (PTT delay × R-R interval) + upstroke duration
      // Peak occurs at ~35-40% of the SpO2 waveform cycle (after 22% delay + 15% upstroke)
      const spo2PeakDelay = pttDelay + 0.15; // PTT delay + upstroke duration
      return rPos + (rrInterval * spo2PeakDelay);
    });

    if (__DEV__) {
      console.log(`[CardiacSweepOverlay] 🎵 Setting up SpO2 pulse tone triggers for ${spo2PeakPositions.length} peaks`);
    }

    const listenerId = sweepProgress.addListener(({ value }) => {
      // Find which SpO2 peak we're crossing
      for (let i = 0; i < spo2PeakPositions.length; i++) {
        const peakPos = spo2PeakPositions[i];

        // If we've crossed this SpO2 peak and haven't triggered tone for it yet
        if (value >= peakPos && lastSpo2PeakIndex.current < i) {
          lastSpo2PeakIndex.current = i;
          onSpo2PulseToneTrigger(perfusionIndex); // 🎵 Fire SpO2 pulse tone!

          if (__DEV__) {
            console.log(`[CardiacSweepOverlay] 🎵 SpO2 pulse tone triggered at peak ${i + 1}/${spo2PeakPositions.length}, PI=${perfusionIndex.toFixed(1)}`);
          }
          break; // Only trigger one tone per frame
        }
      }

      // Reset when sweep restarts
      if (value < 0.01) {
        lastSpo2PeakIndex.current = -1;
      }
    });

    return () => sweepProgress.removeListener(listenerId);
  }, [containerWidth, numCycles, waveformVariant, onSpo2PulseToneTrigger, perfusionIndex, pttDelay]);

  // Interpolate sweep position from start of waveform to end
  const sweepTranslateX = sweepProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [vitalInfoWidth, containerWidth - 18],
  });

  if (!containerWidth) return null;

  return (
    <Animated.View
      style={[
        styles.sweep,
        {
          left: 0,
          transform: [{ translateX: sweepTranslateX }],
          width: 18,
          height: '100%',
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  sweep: {
    position: 'absolute',
    top: 0,
    backgroundColor: '#000',
    zIndex: 10,
  },
});
