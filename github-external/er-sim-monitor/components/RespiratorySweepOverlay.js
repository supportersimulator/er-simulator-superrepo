// components/RespiratorySweepOverlay.js
// Separate 18px sweep overlay for EtCO₂ (respiratory waveform)
// Timing: (60 / RR) * numCycles * 1000ms
// IDEA 5: Perpetual native loop with debounced adaptation

import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';

export default function RespiratorySweepOverlay({ rr = 12, numCycles = 5, containerWidth, vitalInfoWidth = 54 }) {
  const sweepProgress = useRef(new Animated.Value(0)).current;
  const loopAnimationRef = useRef(null);
  const lastUsedRR = useRef(rr);
  const adaptTimerRef = useRef(null);

  // Initialize animation on mount
  useEffect(() => {
    if (!containerWidth) return;

    // 🩺 SAFETY: Stop sweep if RR is 0 (no breathing - asystole/apnea)
    if (rr === 0) {
      if (loopAnimationRef.current) {
        loopAnimationRef.current.stop();
        loopAnimationRef.current = null;
      }
      return;
    }

    // Start animation at initial RR
    const duration = ((60 / rr) * numCycles) * 1000;
    lastUsedRR.current = rr;

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

  // Handle RR changes separately
  useEffect(() => {
    if (!containerWidth || !loopAnimationRef.current) return;

    // Check if RR changed significantly
    const rrDiff = Math.abs(rr - lastUsedRR.current);

    if (rrDiff < 5) {
      // RR change too small - clear any pending timer
      if (adaptTimerRef.current) {
        clearTimeout(adaptTimerRef.current);
        adaptTimerRef.current = null;
      }
      return;
    }

    // RR changed ≥5 breaths/min - debounce adaptation
    if (adaptTimerRef.current) {
      clearTimeout(adaptTimerRef.current);
    }

    adaptTimerRef.current = setTimeout(() => {
      // RR has stabilized - restart animation
      lastUsedRR.current = rr;

      if (loopAnimationRef.current) {
        loopAnimationRef.current.stop();
      }

      // 🩺 SAFETY: Stop sweep if RR is 0 (no breathing - asystole/apnea)
      if (rr === 0) {
        loopAnimationRef.current = null;
        return;
      }

      const duration = ((60 / rr) * numCycles) * 1000;

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
  }, [rr, containerWidth, numCycles]); // Monitor RR changes

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
