# Adaptive Salience Audio System - Implementation Guide

## Overview

The **Adaptive Salience Audio System** is a revolutionary approach to medical monitor audio that prioritizes **clinical awareness over noise**.

**Philosophy**: "Only sound when sound adds value"

Instead of continuous beat-synchronized beeps, the system uses **event-driven, context-aware, escalating alerts** that adapt to user engagement and clinical urgency.

---

## Core Components

### 1. **AdaptiveSalienceEngine.js** (`/engines/AdaptiveSalienceEngine.js`)

The brain of the system. Manages state and escalation logic for all vital parameters.

**Key Features:**
- Tracks each vital parameter (HR, SpO2, BP, RR, EtCO2, Rhythm)
- Three-phase escalation model (Awareness → Persistence → Neglect)
- Acknowledgment tracking
- Threshold evaluation for all vitals
- Time-based phase progression

**Three-Phase Model:**

| Phase | Time from Event | Behavior | Volume | Interval |
|-------|-----------------|----------|--------|----------|
| **Awareness** | 0s | Single clear tone | 60% | Once |
| **Persistence** | 15s | Soft recurring tone | 35% | Every 6s |
| **Neglect** | 45s | Louder, insistent tone | 65% | Every 3s |

**Usage:**
```javascript
const engine = new AdaptiveSalienceEngine();
const event = engine.updateVital('hr', 145, allVitals);
engine.acknowledge('hr'); // Reset escalation
```

---

### 2. **SoundManager.js** (`/engines/SoundManager.js`)

Handles all audio playback, volume control, fading, and ducking.

**Key Features:**
- Loads adaptive sound assets
- Plays events with precise timing
- Smooth volume fading
- Audio ducking during voice activity
- Global minimum 2s interval between sounds

**Sound Assets Structure:**
```
assets/sounds/adaptive/
├── awareness_hr.mp3
├── awareness_spo2.mp3
├── awareness_bp.mp3
├── awareness_rr.mp3
├── awareness_rhythm.mp3
├── persistence_hr.mp3
├── persistence_spo2.mp3
├── neglect_hr.mp3
├── neglect_spo2.mp3
├── critical_vfib.mp3
├── critical_vtach.mp3
├── critical_asystole.mp3
├── acknowledge.mp3
└── normalize.mp3
```

**Usage:**
```javascript
const soundManager = new SoundManager();
await soundManager.initialize();
await soundManager.playSoundEvent(event);
soundManager.setDucking(true); // During voice activity
```

---

### 3. **useAdaptiveSalience.js** (`/hooks/useAdaptiveSalience.js`)

React hook that integrates the engine with Monitor components.

**Key Features:**
- Initializes engine and sound manager
- Monitors vital sign changes
- Triggers sound events
- Handles acknowledgments
- Manages voice activity ducking
- Periodic phase progression checks

**Usage:**
```javascript
const {
  engineState,
  highestSeverity,
  acknowledge,
  acknowledgeAll,
} = useAdaptiveSalience({
  vitals: displayVitals,
  muted: isMuted || isFlatline,
  isSpeaking: false, // TODO: Connect to voice detection
});
```

---

## Integration with Monitor Component

### Changes Made to `Monitor.js`:

1. **Replaced old beep system:**
   ```javascript
   // OLD:
   import useMonitorBeep from '../hooks/useMonitorBeep';
   const { triggerBeep } = useMonitorBeep(beepVitals, isMuted, rhythm);

   // NEW:
   import useAdaptiveSalience from '../hooks/useAdaptiveSalience';
   const { acknowledge, acknowledgeAll } = useAdaptiveSalience({
     vitals: displayVitals,
     muted: isMuted || isFlatline,
   });
   ```

2. **Added acknowledgment to alarm buttons:**
   ```javascript
   const handleSilenceAll = () => {
     setIsMuted(!isMuted);
     if (!isMuted && acknowledgeAll) {
       acknowledgeAll(); // Reset escalation for all vitals
     }
   };
   ```

3. **Removed sweep-synchronized beep triggers:**
   ```javascript
   // OLD: onBeepTrigger={triggerBeep}
   // NEW: Event-driven - no per-beat triggers needed
   ```

---

## Vital Thresholds

### Heart Rate (HR)
- **Critical Tachycardia**: HR ≥ 150 bpm
- **Warning Tachycardia**: HR ≥ 120 bpm
- **Critical Bradycardia**: HR ≤ 40 bpm
- **Warning Bradycardia**: HR ≤ 50 bpm

### SpO2 (Oxygen Saturation)
- **Critical Hypoxia**: SpO2 < 85%
- **Warning Hypoxia**: SpO2 < 90%
- **Info**: SpO2 < 95%

### Blood Pressure (BP)
- **Critical Hypotension**: SBP < 80 or MAP < 60
- **Warning Hypotension**: SBP < 90
- **Warning Hypertension**: SBP > 160

### Respiratory Rate (RR)
- **Warning**: RR > 30 or RR < 8

### EtCO2
- **Warning**: EtCO2 < 25 or EtCO2 > 60

### Rhythm
- **Critical**: VFib, VTach, Asystole, PEA
- **Warning**: AFib, AFlutter, SVT

---

## Acknowledgment Detection

The system recognizes acknowledgment when:

1. **User taps alarm button** (ALARMS ON, MUTE 30s, MUTE ALL)
2. **User opens/expands monitor** (TODO: implement)
3. **User adjusts a vital slider** (TODO: implement)
4. **Voice command detected** (TODO: implement with AI)
5. **AI references the abnormality** (TODO: implement with AI)

When acknowledged, the vital resets to **Awareness phase** but continues monitoring.

---

## Audio Ducking for Voice Interaction

**Purpose**: Defer to voice conversation between clinician and AI

**Behavior:**
- When `isSpeaking = true`, non-critical sounds duck to 30% volume
- **Critical alarms (VFib, VTach, Asystole, severe bradycardia/tachycardia, severe hypoxia/hypotension) maintain 50% volume** to remain audible during emergencies
- When speech ends, sounds restore to full volume
- Escalation continues in background

**Implementation:**
```javascript
// In Monitor component
const [isSpeaking, setIsSpeaking] = useState(false);

useAdaptiveSalience({
  vitals: displayVitals,
  muted: isMuted,
  isSpeaking, // Microphone activity or AI speaking
});
```

---

## Sound Design Guidelines

### Awareness Phase Sounds (0.8s duration)
- **Purpose**: Initial notification
- **Character**: Clear, melodic, non-threatening
- **Examples**:
  - HR: Rising two-note chime
  - SpO2: Descending melodic tone
  - BP: Low-pitched alert
  - Rhythm: Sharp notification

### Persistence Phase Sounds (0.5s duration)
- **Purpose**: Gentle reminder
- **Character**: Soft, periodic, non-disruptive
- **Volume**: 30-40%
- **Interval**: Every 6 seconds

### Neglect Phase Sounds (0.4s duration)
- **Purpose**: More insistent alert
- **Character**: Shorter, sharper, more frequent
- **Volume**: 60-70%
- **Interval**: Every 3 seconds

### Critical Rhythm Sounds (continuous loop)
- **VFib/VTach**: Urgent, continuous tone pattern
- **Asystole**: Flatline alert tone
- **Loop structure**: 1s tone, 2s silence, repeat

---

## Testing & Validation

### Test Scenarios

#### 1. Basic Escalation
1. Start with normal vitals (HR=78, SpO2=98)
2. Change HR to 145 (above threshold)
3. **Expected**: Single "awareness" tone immediately
4. Wait 15 seconds without acknowledging
5. **Expected**: Soft "persistence" tone every 6s
6. Wait 45 seconds total
7. **Expected**: Louder "neglect" tone every 3s

#### 2. Acknowledgment Reset
1. Trigger abnormal vital (SpO2=88)
2. Wait for persistence phase (15s)
3. Press "MUTE 30s" button
4. **Expected**: Chime plays, escalation resets
5. **Expected**: If still abnormal, starts over at awareness phase

#### 3. Normalization
1. Trigger abnormal (HR=145)
2. Wait for any phase
3. Return HR to normal (HR=75)
4. **Expected**: Sound fades out smoothly over 2s
5. **Expected**: Normalize chime plays

#### 4. Multiple Abnormalities
1. Set HR=145 and SpO2=88
2. **Expected**: HR awareness tone first
3. Wait 2+ seconds
4. **Expected**: SpO2 awareness tone
5. **Expected**: Both escalate independently

---

## Future Enhancements

### Phase 2: Voice Integration
- [ ] Connect to microphone activity detection
- [ ] Implement AI speech recognition for verbal acknowledgment
- [ ] Parse user commands ("Give amiodarone" = HR acknowledged)
- [ ] AI confirms user noticed abnormality

### Phase 3: Advanced Context
- [ ] Detect user looking at specific vital on screen
- [ ] Eye tracking for acknowledgment
- [ ] Touch/tap on vital row = acknowledge that parameter
- [ ] Scenario-aware thresholds (trauma vs. cardiac vs. sepsis)

### Phase 4: Sound Customization
- [ ] Generate proper medical-grade tones
- [ ] Pitch scaling with SpO2 (like real monitors)
- [ ] Rhythm-specific ECG sounds (irregular for AFib)
- [ ] User-customizable threshold levels

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│                   Monitor Component                  │
│  ┌───────────────────────────────────────────────┐  │
│  │         useAdaptiveSalience Hook              │  │
│  │  ┌─────────────────┐  ┌──────────────────┐   │  │
│  │  │ Engine Instance │  │ SoundMgr Instance│   │  │
│  │  └─────────────────┘  └──────────────────┘   │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
           │                          │
           │ Vitals Update            │ Sound Events
           ▼                          ▼
┌──────────────────────┐    ┌─────────────────────────┐
│ AdaptiveSalience     │    │    SoundManager         │
│      Engine          │    │                         │
│                      │    │  ┌──────────────────┐   │
│ • Threshold checks   │───▶│  │  Audio Playback  │   │
│ • Phase calculation  │    │  └──────────────────┘   │
│ • Acknowledgment     │    │  ┌──────────────────┐   │
│ • State tracking     │    │  │  Volume Control  │   │
│                      │    │  └──────────────────┘   │
└──────────────────────┘    │  ┌──────────────────┐   │
                            │  │     Ducking      │   │
                            │  └──────────────────┘   │
                            └─────────────────────────┘
```

---

## Key Differences from Old System

| Aspect | Old System (useMonitorBeep) | New System (Adaptive Salience) |
|--------|----------------------------|-------------------------------|
| **Trigger** | Every QRS beat (continuous) | Events only (threshold crossings) |
| **Volume** | Fixed | Escalates over time |
| **Frequency** | Every heartbeat | Awareness → Persistence → Neglect |
| **Context** | None | Aware of acknowledgment & engagement |
| **Voice** | Always plays | Ducks during speech |
| **Philosophy** | Simulate real monitor | Intelligent teammate |

---

## Commit Summary

**Files Created:**
- `/engines/AdaptiveSalienceEngine.js` - Core escalation logic
- `/engines/SoundManager.js` - Audio playback manager
- `/hooks/useAdaptiveSalience.js` - React integration hook
- `/assets/sounds/adaptive/` - Adaptive sound assets (23 files)
- `/docs/ADAPTIVE_SALIENCE_IMPLEMENTATION.md` - This document

**Files Modified:**
- `/components/Monitor.js` - Replaced useMonitorBeep with useAdaptiveSalience
- `/components/Monitor.js` - Added acknowledgment to alarm buttons
- `/components/Monitor.js` - Removed sweep-synchronized beep triggers

**Philosophy Achieved:**
✅ Event-driven, not beat-driven
✅ Context-aware escalation
✅ Voice-integrated (ready for AI)
✅ Adaptive salience - only sounds when needed
✅ Clinically intelligent - respects cognitive load

---

## Getting Started

The system is now **fully integrated** and ready to test!

1. **Start the monitor**: `./start-monitor.sh`
2. **Test basic escalation**: Adjust HR slider to 145
3. **Observe phases**: Watch console logs for phase transitions
4. **Test acknowledgment**: Press "MUTE 30s" button
5. **Test normalization**: Return HR to 75

**Console Logs to Watch:**
```
[AdaptiveSalienceEngine] Engine initialized
[SoundManager] Initialized successfully
[useAdaptiveSalience] Engine initialized
[SoundManager] Playing: awareness_hr at volume 0.60
[useAdaptiveSalience] Acknowledged: hr
```

---

**🎯 We're now fully committed to Adaptive Salience - both feet in!**
