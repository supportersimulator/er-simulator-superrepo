# Adaptive Salience Integration Guide - Safe Modification Patterns

**Document Purpose**: Developer handbook for safely extending, modifying, and integrating new features with the Adaptive Salience system without breaking existing functionality.

**Audience**: AI agents, developers, systems architects

**Last Updated**: 2025-10-31

---

## Table of Contents

1. [Safe Modification Checklist](#safe-modification-checklist)
2. [Do's and Don'ts](#dos-and-donts)
3. [Common Extension Patterns](#common-extension-patterns)
4. [Integration Testing Requirements](#integration-testing-requirements)
5. [Performance Validation](#performance-validation)
6. [Documentation Update Protocol](#documentation-update-protocol)
7. [Version Control Strategy](#version-control-strategy)

---

## Safe Modification Checklist

**BEFORE making ANY changes to Adaptive Salience components, complete this checklist:**

### Pre-Modification Checklist

- [ ] **Read** `/docs/ADAPTIVE_SALIENCE_ARCHITECTURE.md` (comprehensive reference)
- [ ] **Identify** which component(s) you're modifying (Engine, SoundManager, Hook, Monitor)
- [ ] **Verify** change aligns with event-driven philosophy ("Only sound when sound adds value")
- [ ] **Confirm** change won't violate performance budget (<1% CPU, <500KB memory, <50ms latency)
- [ ] **Check** if change affects vital thresholds (must match clinical standards)
- [ ] **Assess** if change affects phase timing (requires architectural review)
- [ ] **Plan** backward compatibility (existing scenarios must continue working)
- [ ] **Design** unit tests before implementing

### Post-Modification Checklist

- [ ] **Run** unit tests (threshold evaluation, phase progression, acknowledgment)
- [ ] **Validate** performance metrics (<1% CPU, <500KB memory, <50ms latency)
- [ ] **Test** critical alarm audibility during voice activity (50% volume minimum)
- [ ] **Verify** backward compatibility (existing vitals objects work unchanged)
- [ ] **Update** ADAPTIVE_SALIENCE_ARCHITECTURE.md with new patterns/integrations
- [ ] **Update** this document (INTEGRATION_GUIDE.md) if new safe patterns discovered
- [ ] **Document** changes in git commit message with "Adaptive Salience:" prefix
- [ ] **Notify** team/AI agents of breaking changes (if any)

---

## Do's and Don'ts

### ✅ DO: Safe and Encouraged

#### 1. Adding New Vital Parameters
```javascript
// ✅ SAFE: Follow existing pattern
this.vitalStates = {
  // ... existing vitals
  glucoseLevel: this.createVitalState('glucoseLevel'), // NEW
};

evaluateGlucoseLevel(glucose) {
  if (glucose < 70) {
    return { severity: SEVERITY.WARNING, threshold: 'hypoglycemia', value: glucose };
  } else if (glucose > 180) {
    return { severity: SEVERITY.WARNING, threshold: 'hyperglycemia', value: glucose };
  }
  return { severity: SEVERITY.NORMAL, threshold: null };
}
```

**Why Safe**: Follows existing pattern, doesn't affect other vitals, adds new functionality without breaking old.

#### 2. Adding New Threshold Severity Levels
```javascript
// ✅ SAFE: Extend enum
const SEVERITY = {
  NORMAL: 0,
  INFO: 1,
  WARNING: 2,
  CRITICAL: 3,
  EMERGENT: 4, // NEW - extends existing
};

// Update ducking logic to handle new level
const duckMultiplier = (this.isDucked && evaluation.severity >= SEVERITY.CRITICAL)
  ? 0.5  // Critical and above maintain 50%
  : this.isDucked ? 0.3 : 1.0;
```

**Why Safe**: Backward compatible (existing severity values unchanged), extends capabilities, maintains ducking safety.

#### 3. Customizing Sound Assets
```javascript
// ✅ SAFE: Add custom sounds for new parameter
const soundAssets = {
  // ... existing awareness sounds
  awareness_glucose: require('../assets/sounds/adaptive/awareness_glucose.mp3'),

  // ... existing persistence sounds
  persistence_glucose: require('../assets/sounds/adaptive/persistence_glucose.mp3'),

  // ... existing neglect sounds
  neglect_glucose: require('../assets/sounds/adaptive/neglect_glucose.mp3'),
};
```

**Why Safe**: Follows naming convention, doesn't affect existing sounds, gracefully degrades if missing.

#### 4. Connecting Voice Activity Detection
```javascript
// ✅ SAFE: Hook up isSpeaking to real source
const [isSpeaking, setIsSpeaking] = useState(false);

useEffect(() => {
  const subscription = voiceService.onSpeakingChange((speaking) => {
    setIsSpeaking(speaking);
  });
  return () => subscription.unsubscribe();
}, []);

const { acknowledge, acknowledgeAll } = useAdaptiveSalience({
  vitals: displayVitals,
  muted: isMuted,
  isSpeaking, // ✅ Connected
});
```

**Why Safe**: Uses existing integration point, no engine changes, backward compatible (defaults to false).

#### 5. Migrating Data Sources (Google Sheets → Supabase)
```javascript
// ✅ SAFE: Change only data fetching layer
// Before:
const vitals = require('../data/vitals.json');

// After:
const { vitals } = useSupabaseVitals(scenarioId);

// Monitor component unchanged, engine unchanged
```

**Why Safe**: Engine is data-source-agnostic, same vitals object structure, zero engine changes.

#### 6. Adding Multi-Language Support
```javascript
// ✅ SAFE: Localize UI only, not engine
import { useTranslation } from '../hooks/useTranslation';

const { t } = useTranslation();

<button>{t('alarms_on')}</button> // UI text localized
<button>{t('mute_30s')}</button>

// Sound assets remain language-neutral (tones)
// Threshold logic remains universal (medical standards)
```

**Why Safe**: Sounds are language-neutral, thresholds universal, only UI text changes.

---

### ⚠️ DON'T: Requires Architectural Review

#### 1. Changing Phase Timing
```javascript
// ⚠️ DANGER: Modifying escalation timing
const PHASE_TIMINGS = {
  AWARENESS: 0,
  PERSISTENCE: 10000, // ❌ Changed from 15000 - breaks specification
  NEGLECT: 30000,     // ❌ Changed from 45000 - breaks specification
};
```

**Why Dangerous**: Breaks 100% specification compliance, affects clinical realism, changes tested behavior.

**If You Must**: Document in ADAPTIVE_SALIENCE_ARCHITECTURE.md, update IMPLEMENTATION.md, notify team, justify clinically.

#### 2. Modifying Volume Levels
```javascript
// ⚠️ DANGER: Changing escalation volumes
const volumes = {
  [PHASES.AWARENESS]: 0.8,   // ❌ Changed from 0.6
  [PHASES.PERSISTENCE]: 0.5, // ❌ Changed from 0.35
  [PHASES.NEGLECT]: 0.9,     // ❌ Changed from 0.65
};
```

**Why Dangerous**: Breaks specification compliance, affects user experience, changes tested balance.

**If You Must**: User-test thoroughly, document rationale, update all three architecture docs.

#### 3. Altering Ducking Behavior
```javascript
// ⚠️ DANGER: Changing critical alarm ducking
const duckMultiplier = (this.isDucked && evaluation.severity === SEVERITY.CRITICAL)
  ? 0.3  // ❌ Changed from 0.5 - too quiet during emergencies!
  : this.isDucked ? 0.3 : 1.0;
```

**Why Dangerous**: Compromises emergency safety, breaks specification, could miss critical events during speech.

**If You Must**: Validate emergency audibility, document justification, user-test extensively.

#### 4. Adding Continuous Audio
```javascript
// ❌ FORBIDDEN: Violates event-driven principle
setInterval(() => {
  playBeep(); // ❌ Continuous beeping - NEVER DO THIS
}, 1000 / (vitals.hr / 60));
```

**Why Forbidden**: Violates core philosophy ("Only sound when sound adds value"), returns to old annoying system, breaks specification.

**Alternative**: Use event-driven threshold crossing with proper escalation.

#### 5. Changing Vital Thresholds Without Clinical Justification
```javascript
// ⚠️ DANGER: Modifying medical thresholds arbitrarily
evaluateHR(hr) {
  if (hr >= 100) { // ❌ Changed from 120 - not clinically justified
    return { severity: SEVERITY.WARNING, threshold: 'tachycardia' };
  }
}
```

**Why Dangerous**: Must match clinical standards, affects medical accuracy, could cause alarm fatigue or missed emergencies.

**If You Must**: Cite clinical source (AHA, ALS guidelines), document in ARCHITECTURE.md, justify medically.

---

## Common Extension Patterns

### Pattern 1: Adding a New Vital Parameter

**Use Case**: Add temperature monitoring

**Implementation Steps**:

1. **Extend engine state** (`AdaptiveSalienceEngine.js:42-49`):
```javascript
this.vitalStates = {
  hr: this.createVitalState('hr'),
  spo2: this.createVitalState('spo2'),
  bp: this.createVitalState('bp'),
  rr: this.createVitalState('rr'),
  etco2: this.createVitalState('etco2'),
  rhythm: this.createVitalState('rhythm'),
  temp: this.createVitalState('temp'), // ← NEW
};
```

2. **Add evaluation function** (`AdaptiveSalienceEngine.js:~212`):
```javascript
evaluateTemp(temp) {
  if (temp < 35.0) {
    return { severity: SEVERITY.CRITICAL, threshold: 'severe_hypothermia', value: temp };
  } else if (temp < 36.0) {
    return { severity: SEVERITY.WARNING, threshold: 'hypothermia', value: temp };
  } else if (temp > 38.5) {
    return { severity: SEVERITY.WARNING, threshold: 'fever', value: temp };
  } else if (temp > 39.5) {
    return { severity: SEVERITY.CRITICAL, threshold: 'high_fever', value: temp };
  }
  return { severity: SEVERITY.NORMAL, threshold: null };
}
```

3. **Register in evaluateVital** (`AdaptiveSalienceEngine.js:128-145`):
```javascript
evaluateVital(paramName, value, vitals) {
  switch (paramName) {
    case 'hr':
      return this.evaluateHR(value);
    // ... existing cases
    case 'temp': // ← NEW
      return this.evaluateTemp(value);
    default:
      return { severity: SEVERITY.NORMAL, threshold: null };
  }
}
```

4. **Add to hook monitoring** (`useAdaptiveSalience.js:74-79`):
```javascript
checkVital('hr', vitals.hr, vitals);
checkVital('spo2', vitals.spo2, vitals);
checkVital('bp', vitals.bp, vitals);
checkVital('rr', vitals.rr, vitals);
checkVital('etco2', vitals.etco2, vitals);
checkVital('temp', vitals.temp, vitals); // ← NEW
```

5. **Add sound assets**:
- Create `/assets/sounds/adaptive/awareness_temp.mp3`
- Create `/assets/sounds/adaptive/persistence_temp.mp3`
- Create `/assets/sounds/adaptive/neglect_temp.mp3`

6. **Register sounds** (`SoundManager.js:59-91`):
```javascript
const soundAssets = {
  // ... existing awareness sounds
  awareness_temp: require('../assets/sounds/adaptive/awareness_temp.mp3'),

  // ... existing persistence sounds
  persistence_temp: require('../assets/sounds/adaptive/persistence_temp.mp3'),

  // ... existing neglect sounds
  neglect_temp: require('../assets/sounds/adaptive/neglect_temp.mp3'),
};
```

7. **Update sound key mapping** (`SoundManager.js:167-179`):
```javascript
const paramMap = {
  hr: 'hr',
  spo2: 'spo2',
  bp: 'bp',
  rr: 'rr',
  etco2: 'rr',
  rhythm: 'rhythm',
  temp: 'temp', // ← NEW
};
```

8. **Update Monitor component** (`Monitor.js`):
```javascript
const displayVitals = {
  hr: vitals.hr,
  spo2: vitals.spo2,
  bp: vitals.bp,
  rr: vitals.rr,
  etco2: vitals.etco2,
  temp: vitals.temp, // ← NEW
  waveform: vitals.rhythm || vitals.waveform,
};
```

9. **Update ADAPTIVE_SALIENCE_ARCHITECTURE.md**:
   - Add temperature to vital thresholds section
   - Document evaluation logic
   - Update component hierarchy diagrams

10. **Write unit tests**:
```javascript
describe('Temperature Evaluation', () => {
  test('should detect hypothermia at 35.5°C', () => {
    const event = engine.updateVital('temp', 35.5, { temp: 35.5 });
    expect(event.severity).toBe(SEVERITY.WARNING);
    expect(event.threshold).toBe('hypothermia');
  });

  test('should detect fever at 38.8°C', () => {
    const event = engine.updateVital('temp', 38.8, { temp: 38.8 });
    expect(event.severity).toBe(SEVERITY.WARNING);
    expect(event.threshold).toBe('fever');
  });
});
```

**Performance Impact**: Negligible (<0.1% additional CPU)

**Breaking Changes**: None (backward compatible)

---

### Pattern 2: Supabase Real-Time Integration

**Use Case**: Migrate from local JSON to Supabase real-time vitals

**Implementation Steps**:

1. **Create Supabase service** (`services/supabaseVitalsService.js`):
```javascript
import { supabase } from '../lib/supabase';

export class SupabaseVitalsService {
  subscribeToVitals(scenarioId, userId, callback) {
    const subscription = supabase
      .channel(`scenario-${scenarioId}-${userId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'scenario_states',
        filter: `scenario_id=eq.${scenarioId}`,
      }, (payload) => {
        callback(payload.new.current_vitals);
      })
      .subscribe();

    return () => subscription.unsubscribe();
  }
}
```

2. **Create React hook** (`hooks/useSupabaseVitals.js`):
```javascript
import { useEffect, useState } from 'react';
import { SupabaseVitalsService } from '../services/supabaseVitalsService';

const vitalsService = new SupabaseVitalsService();

export function useSupabaseVitals(scenarioId, userId) {
  const [vitals, setVitals] = useState(null);

  useEffect(() => {
    const unsubscribe = vitalsService.subscribeToVitals(
      scenarioId,
      userId,
      (newVitals) => setVitals(newVitals)
    );

    return unsubscribe;
  }, [scenarioId, userId]);

  return { vitals, loading: !vitals };
}
```

3. **Update Monitor integration** (`app/(tabs)/index.tsx`):
```javascript
// Before:
import vitalsData from '../data/vitals.json';

// After:
import { useSupabaseVitals } from '../hooks/useSupabaseVitals';

export default function MonitorScreen() {
  const { vitals, loading } = useSupabaseVitals(scenarioId, userId);

  if (loading) return <LoadingSpinner />;

  return <Monitor vitals={vitals} />;
}
```

**Engine Changes**: ZERO - AdaptiveSalienceEngine unchanged

**Performance Impact**: Minimal (real-time subscriptions efficient)

**Breaking Changes**: None (same vitals object structure)

---

### Pattern 3: Voice Activity Integration

**Use Case**: Connect `isSpeaking` prop to real microphone/AI voice

**Implementation Steps**:

1. **Option A: Expo Audio Recording**:
```javascript
// In Monitor.js
import { Audio } from 'expo-av';

const [isSpeaking, setIsSpeaking] = useState(false);
const [recording, setRecording] = useState(null);

useEffect(() => {
  let intervalId;

  const startMicMonitoring = async () => {
    const { recording } = await Audio.Recording.createAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY
    );
    setRecording(recording);

    intervalId = setInterval(async () => {
      const status = await recording.getStatusAsync();
      const level = status.metering || 0;
      setIsSpeaking(level > -30); // Adjust threshold
    }, 100);
  };

  startMicMonitoring();

  return () => {
    clearInterval(intervalId);
    recording?.stopAndUnloadAsync();
  };
}, []);
```

2. **Option B: External AI Voice Service**:
```javascript
// In Monitor.js
import { useAIVoiceState } from '../hooks/useAIVoiceState';

const { isSpeaking } = useAIVoiceState();

// Pass directly to hook
const { acknowledge, acknowledgeAll } = useAdaptiveSalience({
  vitals: displayVitals,
  muted: isMuted,
  isSpeaking, // ✅ Connected
});
```

**Engine Changes**: ZERO - `isSpeaking` prop already exists

**Performance Impact**: Minimal (10 Hz polling acceptable)

**Breaking Changes**: None (defaults to false)

---

## Integration Testing Requirements

**Before merging any Adaptive Salience changes, ALL tests must pass:**

### 1. Unit Tests (Required)

```bash
npm test AdaptiveSalienceEngine
npm test SoundManager
npm test useAdaptiveSalience
```

**Coverage Required**: >90%

**Must Test**:
- ✅ Threshold evaluation (all vitals)
- ✅ Phase progression (15s, 45s)
- ✅ Acknowledgment reset
- ✅ Smart ducking (30% vs 50%)
- ✅ Sound event creation
- ✅ Volume calculations

### 2. Integration Tests (Required)

```bash
npm test integration/adaptive-salience
```

**Scenarios to Validate**:
- ✅ Basic escalation (AWARENESS → PERSISTENCE → NEGLECT)
- ✅ Acknowledgment reset
- ✅ Normalization (vital returns to normal)
- ✅ Multiple simultaneous abnormalities
- ✅ Critical alarm audibility during voice activity
- ✅ Global sound interval enforcement

### 3. Performance Validation (Required)

```bash
npm run benchmark:adaptive-salience
```

**Metrics to Meet**:
- ✅ CPU usage: <1%
- ✅ Memory footprint: <500KB
- ✅ Threshold evaluation: <10ms
- ✅ Phase calculation: <5ms
- ✅ Sound event creation: <5ms
- ✅ Audio playback latency: <50ms

**If ANY metric fails**, optimization required before merge.

### 4. Manual User Testing (Recommended)

**Test Protocol**:
1. Start monitor in normal state (HR=78, SpO2=98)
2. Change HR to 145 (trigger tachycardia)
3. ✅ Verify awareness tone plays immediately
4. Wait 15 seconds without acknowledging
5. ✅ Verify persistence tone plays
6. Press "MUTE 30s" button
7. ✅ Verify acknowledgment chime plays
8. ✅ Verify escalation resets
9. Return HR to 75
10. ✅ Verify sound fades out smoothly
11. ✅ Verify normalize chime plays

---

## Performance Validation

### Performance Budgets (Strict)

| Component | Metric | Budget | Validation Method |
|-----------|--------|--------|-------------------|
| Engine | CPU usage | <1% | Profiler during 1-minute escalation |
| Engine | Memory | <500KB | Chrome DevTools memory snapshot |
| Engine | Threshold eval | <10ms | `performance.now()` benchmark |
| SoundManager | Audio latency | <50ms | Time from event to playback |
| Hook | useEffect overhead | <5ms | React Profiler |
| Overall | Monitor FPS | 60 FPS | React DevTools profiler |

### Validation Commands

```bash
# CPU/Memory profiling
npm run profile:adaptive-salience

# Latency benchmarking
npm run benchmark:thresholds

# Load testing (100 vital updates/sec)
npm run stress-test:vitals

# Memory leak detection (10-minute run)
npm run leak-test:adaptive-salience
```

### Performance Regression Detection

**Before Merge**:
1. ✅ Run baseline benchmark: `npm run benchmark:baseline`
2. ✅ Apply changes
3. ✅ Run new benchmark: `npm run benchmark:new`
4. ✅ Compare results: `npm run benchmark:diff`
5. ✅ If ANY metric regressed >5%, optimization required

**Example Output**:
```
Performance Comparison:
  CPU Usage:        0.3% → 0.4% (+33% ⚠️ REGRESSION)
  Memory:           200KB → 210KB (+5% ✅ ACCEPTABLE)
  Threshold Eval:   2ms → 2ms (0% ✅ NO CHANGE)
  Audio Latency:    20ms → 18ms (-10% ✅ IMPROVEMENT)

VERDICT: ⚠️ REGRESSION DETECTED - Review CPU optimization
```

---

## Documentation Update Protocol

**Every change to Adaptive Salience MUST update documentation:**

### 1. Architecture Document Updates

**When to Update ADAPTIVE_SALIENCE_ARCHITECTURE.md**:
- ✅ Added new vital parameter
- ✅ Added new severity level
- ✅ Changed integration point
- ✅ Added new component
- ✅ Changed naming convention
- ✅ Added new expandability hook

**Update Template**:
```markdown
## [Component Name] Updates (YYYY-MM-DD)

**Change Summary**: [Brief description]

**Affected Files**:
- `/path/to/file1.js` - [What changed]
- `/path/to/file2.js` - [What changed]

**New Functionality**:
- [Feature 1]
- [Feature 2]

**Breaking Changes**: [None OR describe]

**Migration Guide**: [If breaking changes exist]

**Performance Impact**: [Negligible OR specify]
```

### 2. Integration Guide Updates

**When to Update ADAPTIVE_SALIENCE_INTEGRATION_GUIDE.md**:
- ✅ Discovered new safe modification pattern
- ✅ Identified new dangerous pattern
- ✅ Added new testing requirement
- ✅ Changed performance budget
- ✅ Added new validation method

### 3. Implementation Guide Updates

**When to Update ADAPTIVE_SALIENCE_IMPLEMENTATION.md**:
- ✅ Changed vital threshold
- ✅ Modified phase timing
- ✅ Changed volume levels
- ✅ Updated sound asset structure
- ✅ Changed acknowledgment behavior

### 4. Git Commit Message Standards

**Format**:
```
Adaptive Salience: [Brief summary]

[Detailed description]

Changes:
- [File 1]: [What changed]
- [File 2]: [What changed]

Performance Impact: [Negligible OR specify metrics]
Breaking Changes: [None OR list]
Tests Added: [List new tests]
Docs Updated: [List updated docs]
```

**Example**:
```
Adaptive Salience: Add temperature monitoring support

Added temperature vital parameter with hypothermia/fever detection.
Follows existing pattern for adding new vitals.

Changes:
- AdaptiveSalienceEngine.js: Added temp state + evaluateTemp()
- useAdaptiveSalience.js: Added temp monitoring
- SoundManager.js: Added temp sound assets
- Monitor.js: Display temp in vitals

Performance Impact: <0.1% additional CPU
Breaking Changes: None (backward compatible)
Tests Added: Temperature threshold evaluation suite
Docs Updated: ARCHITECTURE.md, INTEGRATION_GUIDE.md
```

---

## Version Control Strategy

### Semantic Versioning for Adaptive Salience

**Version Format**: `MAJOR.MINOR.PATCH`

**MAJOR** (Breaking Changes):
- Changed phase timing (15s, 45s)
- Changed volume levels (60%, 35%, 65%)
- Removed vital parameter
- Changed vitals object structure
- Changed sound asset naming convention

**MINOR** (New Features):
- Added new vital parameter
- Added new severity level
- Added new integration point
- Enhanced existing functionality (backward compatible)

**PATCH** (Bug Fixes):
- Fixed threshold evaluation bug
- Fixed phase progression bug
- Fixed memory leak
- Performance optimization (no behavior change)

**Example Versions**:
- `1.0.0` - Initial production release (2025-10-31)
- `1.1.0` - Added temperature monitoring
- `1.1.1` - Fixed SpO2 threshold bug
- `1.2.0` - Added EMERGENT severity level
- `2.0.0` - Changed phase timing (BREAKING)

### Documentation Versioning

**Strategy**: Documentation versioned alongside code

**File Header**:
```markdown
# Document Title

**Version**: 1.2.0
**Last Updated**: 2025-10-31
**Status**: Current
**Replaces**: Version 1.1.0 (see /docs/archive/v1.1.0/)
```

**Archive Strategy**:
- Keep current version in `/docs/`
- Archive old versions in `/docs/archive/v{major}.{minor}.{patch}/`
- Maintain CHANGELOG.md with all version history

---

## Summary

This integration guide provides safe patterns for extending Adaptive Salience while maintaining 100% specification compliance, performance budgets, and user experience standards.

**Key Principles**:
1. ✅ **Always read ARCHITECTURE.md first**
2. ✅ **Follow existing patterns** (don't reinvent)
3. ✅ **Test before merge** (unit + integration + performance)
4. ✅ **Document all changes** (ARCHITECTURE.md + this guide + git commits)
5. ✅ **Validate performance** (must meet budget)
6. ✅ **Maintain backward compatibility** (unless justified breaking change)

**Golden Rules**:
- 🔒 Never add continuous audio
- 🔒 Never change phase timing without review
- 🔒 Never violate performance budget
- 🔒 Never break backward compatibility without major version bump
- 🔒 Always update documentation

🎯 **Safe Integration Protocol - Complete**
