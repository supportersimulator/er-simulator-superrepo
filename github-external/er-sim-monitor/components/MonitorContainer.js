// components/MonitorContainer.js
/**
 * MONITOR CONTAINER - Manages expanded/minimized states
 *
 * Two states:
 * 1. Minimized Icon - Small floating icon with tiny ECG
 * 2. Expanded Full Monitor - Full monitor view
 *
 * Expanding the monitor = acknowledgment signal
 */

import React, { useState, useRef, useEffect } from 'react';
import { View, Modal, Animated, StyleSheet } from 'react-native';
import Monitor from './Monitor';
import MonitorIcon from './MonitorIcon';

export default function MonitorContainer({ vitals, muted }) {
  // DEV MODE: Start expanded for easier development
  // TODO: Change to false before production launch
  const [isExpanded, setIsExpanded] = useState(true); // Start expanded (dev mode)
  const [escalationPhase, setEscalationPhase] = useState(0);
  const [hasActiveAlerts, setHasActiveAlerts] = useState(false);

  // Lifted state: Current displayed vitals (may be manual overrides from Monitor component)
  const [currentVitals, setCurrentVitals] = useState(vitals);

  const scaleAnim = useRef(new Animated.Value(1)).current; // Start at 1 when expanded
  const opacityAnim = useRef(new Animated.Value(1)).current; // Start at 1 when expanded

  // Update current vitals when prop changes
  useEffect(() => {
    setCurrentVitals(vitals);
  }, [vitals]);

  // Expand animation
  const handleExpand = () => {
    setIsExpanded(true);

    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    if (__DEV__) {
      console.log('[MonitorContainer] Expanded - acknowledgment signal sent');
    }
  };

  // Collapse animation
  const handleCollapse = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsExpanded(false);
    });

    if (__DEV__) {
      console.log('[MonitorContainer] Collapsed to icon');
    }
  };

  // Listen for escalation updates from Monitor component
  const handleEscalationUpdate = (phase, hasAlerts) => {
    setEscalationPhase(phase);
    setHasActiveAlerts(hasAlerts);
  };

  // Listen for vitals updates from Monitor component (when user adjusts sliders)
  const handleVitalsUpdate = (updatedVitals) => {
    setCurrentVitals(updatedVitals);
  };

  return (
    <View style={styles.container}>
      {/* Minimized Icon - only visible when not expanded */}
      {!isExpanded && (
        <MonitorIcon
          vitals={currentVitals}
          onExpand={handleExpand}
          escalationPhase={escalationPhase}
          hasActiveAlerts={hasActiveAlerts}
          position={{ bottom: 20, left: 20 }} // Bottom-left position
        />
      )}

      {/* Full Monitor - ALWAYS MOUNTED (hidden when minimized) to preserve state */}
      <Animated.View
        style={[
          styles.modalContainer,
          {
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
            pointerEvents: isExpanded ? 'auto' : 'none', // Disable touches when minimized
          },
        ]}
      >
        {/* Monitor component stays mounted even when minimized to preserve vitals state */}
        <Monitor
          vitals={vitals}
          muted={muted}
          onClose={handleCollapse}
          onEscalationUpdate={handleEscalationUpdate}
          onVitalsUpdate={handleVitalsUpdate}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  modalContainer: {
    ...StyleSheet.absoluteFillObject, // Cover entire screen
    justifyContent: 'flex-end', // Push monitor to bottom
    backgroundColor: 'transparent', // Fully transparent - dimming will be in Monitor component
    paddingTop: 80, // Push monitor down to reveal more of patient
  },
});
