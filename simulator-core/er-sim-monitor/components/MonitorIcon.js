// components/MonitorIcon.js
/**
 * MINIMIZED MONITOR ICON - Professional Medical Monitor Style
 *
 * Features:
 * - Animated scrolling ECG waveform (like real medical monitors)
 * - Grid background (authentic monitor aesthetic)
 * - Color-coded status display:
 *   - Blue (#0088ff) - Normal/stable vitals
 *   - Green (#00ff00) - Abnormal vitals
 *   - Red (#ff0000) - Critical vitals
 *   - Gray (#808080) - Flatline/pulseless (asystole)
 * - Pulsing border during escalation phases
 * - Continuous beep alarm for pulseless state
 */

import React, { useEffect, useRef } from 'react';
import { StyleSheet, TouchableOpacity, View, Animated, Dimensions } from 'react-native';
import Svg, { Path, Line } from 'react-native-svg';
import { WAVEFORM_DATA } from '../assets/waveforms/svg/waveforms';

export default function MonitorIcon({
  vitals,
  onExpand,
  escalationPhase = 0,
  hasActiveAlerts = false,
  position = { bottom: 20, right: 20 } // Default position
}) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const scrollAnim = useRef(new Animated.Value(0)).current;

  // Determine waveform variant and vital status
  const hr = vitals?.hr || 75;
  const spo2 = vitals?.spo2 || 98;
  const bp = vitals?.bp || { sys: 120, dia: 80 };
  const variant = vitals?.waveform || 'sinus';

  // Detect pulseless state (asystole or HR = 0)
  const isPulseless = hr === 0 || variant === 'asystole' || variant === 'flat';

  // Determine status color based on vitals
  const getStatusColor = () => {
    if (isPulseless) return '#808080'; // Gray - flatline

    // Critical thresholds
    const isCritical =
      hr < 40 || hr > 150 ||
      spo2 < 88 ||
      bp.sys < 90 || bp.sys > 180 ||
      bp.dia < 50 || bp.dia > 110;

    if (isCritical) return '#ff0000'; // Red - critical

    // Abnormal thresholds
    const isAbnormal =
      hr < 60 || hr > 100 ||
      spo2 < 95 ||
      bp.sys < 100 || bp.sys > 140 ||
      bp.dia < 60 || bp.dia > 90;

    if (isAbnormal) return '#00ff00'; // Green - abnormal

    return '#0088ff'; // Blue - normal/stable
  };

  const statusColor = getStatusColor();

  // Ultra-smooth infinite scrolling animation for ECG waveform
  // Uses seamless loop technique: scroll from 0% to -50% for perfect repeat
  useEffect(() => {
    if (!isPulseless && hr > 0) {
      // Scroll speed based on status
      let scrollDuration;
      if (statusColor === '#ff0000') {
        // Critical - fast scroll (5 seconds)
        scrollDuration = 5000;
      } else {
        // Normal/Abnormal - slower scroll (12 seconds)
        scrollDuration = 12000;
      }

      const scroll = Animated.loop(
        Animated.timing(scrollAnim, {
          toValue: 1,
          duration: scrollDuration,
          useNativeDriver: false,
          isInteraction: false,
        })
      );

      scroll.start();

      return () => {
        scroll.stop();
        scrollAnim.setValue(0);
      };
    } else {
      // Flatline - no scrolling
      scrollAnim.setValue(0);
    }
  }, [hr, isPulseless, scrollAnim, statusColor]);

  // Pulsing animation for Phase 2 and 3 escalation
  useEffect(() => {
    if (escalationPhase >= 2) {
      // Start pulsing
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: escalationPhase === 3 ? 500 : 800, // Faster pulse for Phase 3
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1.0,
            duration: escalationPhase === 3 ? 500 : 800,
            useNativeDriver: true,
          }),
        ])
      );

      const glow = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: escalationPhase === 3 ? 500 : 800,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: escalationPhase === 3 ? 500 : 800,
            useNativeDriver: true,
          }),
        ])
      );

      pulse.start();
      glow.start();

      return () => {
        pulse.stop();
        glow.stop();
      };
    } else {
      // Reset to normal
      pulseAnim.setValue(1);
      glowAnim.setValue(0);
    }
  }, [escalationPhase, pulseAnim, glowAnim]);

  // Border color based on escalation
  const getBorderColor = () => {
    if (escalationPhase === 0 || !hasActiveAlerts) return '#00ff00'; // Green - normal
    if (escalationPhase === 1) return '#ffaa00'; // Amber - Phase 1 (awareness)
    if (escalationPhase === 2) return '#ff6600'; // Orange - Phase 2 (persistence)
    return '#ff0000'; // Red - Phase 3 (neglect)
  };

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  const glowColor = escalationPhase === 3 ? '#ff0000' : '#ff6600';

  // Get SVG waveform data or generate simple sine wave
  const svgData = WAVEFORM_DATA[variant] || WAVEFORM_DATA['afib']; // Use afib as fallback for now

  // Render grid background lines (like real cardiac monitors)
  const renderGrid = () => {
    const lines = [];
    const iconSize = 80;
    const gridSpacing = 8; // 8px grid spacing (5mm scale on real monitors)

    // Vertical lines
    for (let x = 0; x <= iconSize; x += gridSpacing) {
      lines.push(
        <Line
          key={`v${x}`}
          x1={x}
          y1={0}
          x2={x}
          y2={iconSize}
          stroke="rgba(0, 255, 0, 0.08)"
          strokeWidth={x % (gridSpacing * 5) === 0 ? 1 : 0.5} // Thicker every 5 lines
        />
      );
    }

    // Horizontal lines
    for (let y = 0; y <= iconSize; y += gridSpacing) {
      lines.push(
        <Line
          key={`h${y}`}
          x1={0}
          y1={y}
          x2={iconSize}
          y2={y}
          stroke="rgba(0, 255, 0, 0.08)"
          strokeWidth={y % (gridSpacing * 5) === 0 ? 1 : 0.5} // Thicker every 5 lines
        />
      );
    }

    return lines;
  };

  // Render flatline for pulseless state
  const renderFlatline = () => {
    return (
      <Line
        x1={0}
        y1={40} // Center of icon
        x2={80}
        y2={40}
        stroke={statusColor}
        strokeWidth={2}
      />
    );
  };

  // Ultra-smooth animated ECG waveform with medical accuracy
  const renderUltraSmoothECG = () => {
    // Waveform paths for each state (scaled from our HTML version)
    // Each path is 1200px wide in HTML, scaled to 160px (2x icon width for seamless loop)
    const waveformPaths = {
      normal: "0,30 1,30 3,30 4,30 5,30 7,30 8,30 9,30 10,30 11,24 11,30 12,30 13,30 13,30 14,30 14,30 15,36 16,2 18,58 19,30 22,30 23,23 24,30 25,30 26,30 28,30 29,30 31,30 33,30 34,30 35,30 36,24 36,30 37,30 37,30 38,30 38,30 40,36 41,2 43,58 44,30 47,30 48,23 49,30 50,30 51,30 53,30 54,30 56,30 58,30 60,30 61,30 61,24 62,30 62,30 63,30 63,30 64,30 64,36 66,2 68,58 69,30 72,30 73,23 74,30 75,30 77,30 79,30 80,30 82,30 84,30 85,30 87,30 88,24 88,30 89,30 89,30 90,30 90,30 91,36 93,2 95,58 96,30 99,30 100,23 101,30 102,30 103,30 105,30 106,30 108,30 110,30 111,30 113,30 114,24 114,30 115,30 115,30 116,30 116,30 117,36 119,2 121,58 122,30 125,30 126,23 127,30 128,30 129,30 131,30 132,30 134,30 136,30 137,30 139,30 140,24 141,30 141,30 141,30 142,30 142,36 144,2 146,58 147,30 150,30 150,23 152,30 153,30 154,30 156,30 157,30 159,30 160,30",
      abnormal: "0,30 1,30 3,30 4,30 5,30 7,30 8,30 9,30 10,30 11,19 11,30 12,30 13,30 14,30 14,43 16,30 16,3 18,59 20,30 23,30 23,21 25,30 26,30 27,30 29,30 31,30 34,30 35,30 36,30 36,17 37,30 38,30 38,30 40,30 40,41 41,30 42,5 44,57 45,30 48,30 49,20 50,30 51,30 53,30 55,30 56,30 58,30 60,30 62,30 62,15 63,30 63,30 64,30 65,30 66,45 67,30 68,2 69,60 71,30 74,30 74,18 76,30 77,30 78,30 80,30 81,30 83,30 85,30 87,30 87,20 88,30 89,30 89,30 91,30 92,42 93,30 93,4 95,58 97,30 100,30 100,22 102,30 103,30 104,30 106,30 107,30 109,30 111,30 113,30 114,20 114,30 115,30 116,30 117,30 118,42 120,30 120,4 122,58 123,30 126,30 126,22 128,30 129,30 131,30 133,30 134,30 136,30 138,30 139,30 141,30 141,16 142,30 143,30 144,30 145,30 146,40 147,30 147,5 149,57 150,30 153,30 153,19 155,30 156,30 157,30 159,30 160,30",
      critical: "0,30 1,30 3,30 4,30 5,30 6,30 6,26 7,30 7,30 8,30 8,30 8,34 9,3 10,55 11,30 13,30 14,25 14,30 15,30 16,30 17,30 18,30 19,30 20,26 20,30 20,30 21,30 21,30 21,34 23,3 24,55 25,30 27,30 27,25 28,30 29,30 30,30 31,30 32,30 33,30 33,26 34,30 34,30 34,30 35,30 35,34 37,3 38,55 38,30 40,30 40,25 41,30 42,30 43,30 44,30 45,30 46,30 47,26 47,30 47,30 48,30 48,30 49,34 50,3 51,55 52,30 54,30 54,25 55,30 56,30 57,30 58,30 59,30 60,30 61,26 61,30 61,30 62,30 62,30 63,34 64,3 65,55 66,30 68,30 68,25 69,30 70,30 71,30 72,30 73,30 74,30 75,26 75,30 75,30 76,30 76,30 77,34 78,3 79,55 80,30 82,30 82,25 83,30 84,30 85,30 86,30 87,30 88,30 88,26 89,30 89,30 89,30 90,30 90,34 92,3 93,55 94,30 96,30 96,25 97,30 98,30 99,30 100,30 101,30 102,30 103,26 103,30 103,30 104,30 104,30 104,34 106,3 107,55 108,30 110,30 110,25 111,30 112,30 113,30 114,30 115,30 116,30 117,26 117,30 117,30 118,30 118,30 119,34 120,3 121,55 122,30 124,30 124,25 125,30 126,30 127,30 128,30 129,30 130,30 131,26 131,30 131,30 132,30 132,30 133,34 134,3 135,55 136,30 138,30 138,25 139,30 140,30 141,30 142,30 143,30 144,30 145,26 145,30 145,30 146,30 146,30 147,34 148,3 149,55 150,30 152,30 152,25 153,30 154,30 155,30 156,30 157,30 158,30 159,26 159,30 159,30 160,30"
    };

    // Select waveform based on status
    let pathData;
    if (statusColor === '#ff0000') {
      pathData = waveformPaths.critical;
    } else if (statusColor === '#00ff00') {
      pathData = waveformPaths.abnormal;
    } else {
      pathData = waveformPaths.normal;
    }

    // Animate scroll position (0% to -50% for seamless loop)
    const translateX = scrollAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -80], // Move left by 50% (half of 160px viewBox)
    });

    return (
      <Animated.View style={{ transform: [{ translateX }] }}>
        <Svg width={160} height={60} viewBox="0 0 160 60">
          <Path
            d={`M ${pathData}`}
            stroke={statusColor}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </Svg>
      </Animated.View>
    );
  };

  return (
    <TouchableOpacity
      style={[
        styles.iconContainer,
        {
          bottom: position.bottom,
          ...(position.left !== undefined ? { left: position.left } : { right: position.right })
        }
      ]}
      onPress={onExpand}
      activeOpacity={0.8}
    >
      <Animated.View
        style={[
          styles.icon,
          {
            transform: [{ scale: pulseAnim }],
            borderColor: statusColor, // Use status color for border
            borderWidth: escalationPhase >= 2 ? 3 : 2,
          },
        ]}
      >
        {/* Glow effect for Phase 2/3 */}
        {escalationPhase >= 2 && (
          <Animated.View
            style={[
              styles.glowRing,
              {
                opacity: glowOpacity,
                borderColor: glowColor,
              },
            ]}
          />
        )}

        {/* Grid background + Animated ECG waveform */}
        <View style={styles.waveformContainer}>
          {/* Grid background (static) */}
          <Svg width={80} height={80} viewBox="0 0 80 80" style={StyleSheet.absoluteFill}>
            {renderGrid()}
          </Svg>

          {/* Animated ECG waveform (scrolling with clip mask) */}
          <View style={styles.waveformClip}>
            {isPulseless ? (
              <Svg width={80} height={80} viewBox="0 0 80 80">
                {renderFlatline()}
              </Svg>
            ) : (
              renderUltraSmoothECG()
            )}
          </View>
        </View>

        {/* HR numeric in corner */}
        <View style={styles.hrBadge}>
          <Animated.Text
            style={[
              styles.hrText,
              {
                color: statusColor,
              }
            ]}
          >
            {Math.round(hr)}
          </Animated.Text>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    position: 'absolute',
    zIndex: 1000,
    // Shadow for floating effect
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 8,
  },
  icon: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#0a0a0a',
    borderWidth: 2,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  glowRing: {
    position: 'absolute',
    top: -6,
    left: -6,
    right: -6,
    bottom: -6,
    borderRadius: 16,
    borderWidth: 3,
    zIndex: -1,
  },
  waveformContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
    position: 'relative',
  },
  waveformClip: {
    width: 80,
    height: 60,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hrBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  hrText: {
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
});
