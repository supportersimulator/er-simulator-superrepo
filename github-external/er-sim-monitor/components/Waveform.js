// components/Waveform.js
// Wipe/uncover animation - NO black borders
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import Svg, { Polyline } from 'react-native-svg';

export default function Waveform({
  type = 'ecg',
  height = 60,
  color = '#00ff00',
  amplitude = 1.0,
  generator: customGenerator,
  hr = null,
  rr = null,
  numCycles = 5,
  showSweep = true, // NEW: Control whether this waveform has its own sweep
  onPulseToneTrigger = null, // 🎵 Callback for SpO2 pulse tone (passes perfusionIndex)
  perfusionIndex = 5, // Perfusion index (0-10) for pulse tone volume
  rWavePositions = null, // R-wave positions for SpO2 peak synchronization
  pttDelay = 0.22, // Pulse transit time delay (default 22% of R-R interval)
}) {
  const [containerWidth, setContainerWidth] = useState(null);
  const wipeProgress = useRef(new Animated.Value(0)).current;
  const lastPeakIndex = useRef(-1); // Track which SpO2 peak we last triggered on (resets each sweep cycle)

  // Measure actual container width
  const handleLayout = (event) => {
    const { width } = event.nativeEvent.layout;
    if (width > 0 && !containerWidth) {
      console.log(`[${type}] Container width measured: ${width}px`);
      setContainerWidth(width);
    }
  };

  // Calculate wipe speed based on heart rate
  const wipeSpeed = useMemo(() => {
    if (type === 'ecg' || type === 'pleth' || type === 'bp') {
      const bpm = hr || 75;
      // Safety check: if HR is 0 (asystole, vfib), use slow static wipe
      if (bpm === 0) return 10000; // 10 second slow wipe for cardiac arrest rhythms
      return ((60 / bpm) * numCycles) * 1000;
    } else if (type === 'etco2') {
      const breathsPerMin = rr || 12;
      // Safety check: if RR is 0, use slow static wipe
      if (breathsPerMin === 0) return 10000;
      return ((60 / breathsPerMin) * numCycles) * 1000;
    }
    return 5000;
  }, [type, hr, rr, numCycles]);

  // Generate static waveform pattern with high precision for smooth rendering
  const points = useMemo(() => {
    if (!containerWidth) return '';

    const pts = [];
    const generator = customGenerator
      ? (x) => customGenerator(x, containerWidth)
      : (x) => Math.sin((x / containerWidth) * 20) * (height * 0.4);

    // Sample every 1px for ultra-smooth waveforms (was 2px)
    for (let x = 0; x <= containerWidth; x += 1) {
      const y = height / 2 - generator(x);
      // Round to prevent sub-pixel rendering artifacts
      pts.push(`${Math.round(x)},${Math.round(y)}`);
    }
    return pts.join(' ');
  }, [containerWidth, height, customGenerator, numCycles]);

  // Wipe animation - reveal from left to right continuously
  // Only run if showSweep is true
  useEffect(() => {
    if (!containerWidth || !showSweep) return;

    const runWipe = () => {
      wipeProgress.setValue(0);
      Animated.timing(wipeProgress, {
        toValue: 1,
        duration: wipeSpeed,
        easing: (t) => t,
        useNativeDriver: false,
      }).start(() => runWipe());
    };

    runWipe();
    return () => wipeProgress.stopAnimation();
  }, [containerWidth, wipeSpeed, showSweep]);

  // 🎵 Monitor wipe position and trigger pulse tone for SpO2 peaks
  // SpO2 peaks occur at R-wave positions + PTT delay
  useEffect(() => {
    if (!onPulseToneTrigger || !containerWidth || !rWavePositions || rWavePositions.length === 0) return;

    // Calculate SpO2 peak positions (R-waves + PTT delay)
    const spo2PeakPositions = rWavePositions.map(rPos => {
      // Find which R-R interval this R-wave belongs to
      const rIndex = rWavePositions.indexOf(rPos);
      const nextRPos = rIndex < rWavePositions.length - 1 ? rWavePositions[rIndex + 1] : 1.0;
      const rrInterval = nextRPos - rPos;

      // SpO2 peak = R-wave + (PTT delay × R-R interval)
      // Peak occurs at ~35-40% of the SpO2 waveform cycle (after 22% delay + 15% upstroke)
      const spo2PeakDelay = pttDelay + 0.15; // PTT delay + upstroke duration
      return rPos + (rrInterval * spo2PeakDelay);
    });

    if (__DEV__) {
      console.log(`[waveform] 🎵 Setting up SpO2 pulse tone triggers for ${spo2PeakPositions.length} peaks:`, spo2PeakPositions);
    }

    const listenerId = wipeProgress.addListener(({ value }) => {
      // Reset peak index when sweep cycles back to start
      if (value < 0.05 && lastPeakIndex.current !== -1) {
        lastPeakIndex.current = -1;
      }

      // Check if sweep has crossed any SpO2 peak
      for (let i = 0; i < spo2PeakPositions.length; i++) {
        const peakPos = spo2PeakPositions[i];
        if (value >= peakPos && lastPeakIndex.current < i) {
          lastPeakIndex.current = i;
          onPulseToneTrigger(perfusionIndex); // 🎵 Trigger pulse tone with PI for volume

          if (__DEV__) {
            console.log(`[waveform] 🎵 SpO2 pulse tone triggered at peak ${i + 1}/${spo2PeakPositions.length}, PI=${perfusionIndex.toFixed(1)}`);
          }
          break; // Only trigger one tone per frame
        }
      }
    });

    return () => wipeProgress.removeListener(listenerId);
  }, [containerWidth, rWavePositions, pttDelay, onPulseToneTrigger, perfusionIndex]);

  // Interpolate wipe mask position
  const wipeMaskLeft = wipeProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, containerWidth],
  });

  if (!containerWidth) {
    return <View style={[styles.container, { height }]} onLayout={handleLayout} />;
  }

  return (
    <View style={[styles.container, { height }]} onLayout={handleLayout}>
      {/* Static waveform */}
      <Svg height={height} width={containerWidth}>
        <Polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </Svg>

      {/* Wipe mask - only render if showSweep is true */}
      {showSweep && (
        <Animated.View
          style={[
            styles.wipeMask,
            {
              left: wipeMaskLeft,
              width: 15, // USER'S PREFERRED THICKNESS - matches HR timing
            },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: '#000',
    position: 'relative',
  },
  wipeMask: {
    position: 'absolute',
    top: 0,
    height: '100%',
    backgroundColor: '#000',
    zIndex: 1,
  },
});
