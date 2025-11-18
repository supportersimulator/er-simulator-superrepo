# Vitals JSON Fix Specification

## Executive Summary

**Status**: 🚨 26 Critical Issues Found Across 7 Processed Rows
**Impact**: Incompatible with Monitor.js - will cause runtime errors
**Validation Script**: `node scripts/validateVitalsJSON.cjs`

---

## Critical Issues Found

### 1. Missing RR (Respiratory Rate) Field
**Severity**: 🔴 CRITICAL - Monitor requires RR field

**Affected Rows**: All 7 processed rows
**Occurrence**: Primarily in State2_Vitals and State3_Vitals

**Examples**:
```json
// ❌ INCORRECT (Missing RR)
{"HR":130,"BP":"80/50","SpO2":90,"waveform":"sinus_ecg"}

// ✅ CORRECT
{"HR":130,"BP":"80/50","SpO2":90,"RR":20,"waveform":"sinus_ecg"}
```

**Required Fix**: OpenAI API must ALWAYS include RR field in all vitals JSON objects

---

### 2. "N/A" String Instead of Empty/Null
**Severity**: 🔴 CRITICAL - JSON parse error

**Affected Rows**: PNEU001, CV00234, CA0001, TR0002
**Columns**: State4_Vitals, State5_Vitals

**Current Behavior**:
```
State4_Vitals: "N/A"  // ❌ Invalid JSON
```

**Required Fix**:
```
State4_Vitals: ""                              // ✅ Option 1: Empty string
State4_Vitals: null                            // ✅ Option 2: Null
State4_Vitals: {"HR":75,"BP":"120/80",...}     // ✅ Option 3: Valid JSON
```

**Apps Script Change**: When state is not applicable, write empty string instead of "N/A"

---

### 3. Invalid Waveform Name
**Severity**: ⚠️ WARNING - Waveform not recognized

**Affected**: Row 3 (GI01234) - State3_Vitals
**Current Value**: `"peapulseless_ecg"`
**Correct Value**: `"pea_ecg"`

**Valid Waveform Names** (from [canonicalWaveformList.js](components/canonicalWaveformList.js)):
```javascript
// Cardiac Arrest Rhythms
'asystole_ecg'        // Flatline
'pea_ecg'             // ✅ Pulseless Electrical Activity
'vfib_ecg'            // Ventricular Fibrillation
'vtach_ecg'           // Ventricular Tachycardia (shockable)

// Common Rhythms
'sinus_ecg'           // Normal sinus rhythm
'sinus_brady_ecg'     // Bradycardia <60 bpm
'sinus_tachy_ecg'     // Tachycardia >100 bpm
'afib_ecg'            // Atrial fibrillation

// See full list in components/canonicalWaveformList.js (43 total)
```

**Required Fix**: OpenAI API must use exact canonical waveform names

---

### 4. Missing Recommended Fields
**Severity**: ℹ️ INFO - Not required but recommended

**Missing Fields**:
- `EtCO2`: End-tidal CO2 (important for respiratory scenarios)
- `Temp`: Temperature (important for sepsis, hypothermia cases)

**Current Example**:
```json
{"HR":122,"BP":"95/60","RR":28,"SpO2":94,"waveform":"sinus_ecg"}
```

**Recommended**:
```json
{
  "HR": 122,
  "BP": "95/60",
  "RR": 28,
  "SpO2": 94,
  "Temp": 39.2,
  "EtCO2": 38,
  "waveform": "sinus_ecg"
}
```

---

## Monitor.js Requirements

### Required Fields (MUST HAVE)
```javascript
{
  "HR": number,        // Heart Rate (bpm) - 0-300
  "BP": "sys/dia",     // Blood Pressure (string format: "120/80")
  "SpO2": number,      // Oxygen Saturation (%) - 0-100
  "RR": number,        // Respiratory Rate (breaths/min) - 0-60
  "waveform": string   // ECG waveform type (must end with "_ecg")
}
```

### Recommended Fields (SHOULD HAVE)
```javascript
{
  "Temp": number,      // Temperature (°C) - 32.0-42.0
  "EtCO2": number      // End-tidal CO2 (mmHg) - 0-99
}
```

### Waveform Naming Rules
1. ✅ MUST end with `_ecg` suffix
2. ✅ MUST match canonical list exactly (case-sensitive)
3. ✅ Use underscore for multi-word names (e.g., `sinus_tachy_ecg`)
4. ❌ NO spaces or hyphens
5. ❌ NO concatenated words (e.g., `peapulseless_ecg` → `pea_ecg`)

---

## Apps Script Prompt Update

### Current OpenAI API Prompt Issues

The Apps Script sends scenario HTML/Word data to OpenAI API to generate vitals JSON. The prompt must be updated to enforce these requirements:

**Required Prompt Changes**:

1. **Always Include RR Field**:
```javascript
// Add to system prompt
"CRITICAL: Every vitals JSON object MUST include the RR (Respiratory Rate) field.
Never omit RR, even if not explicitly mentioned in the scenario.
Use clinically appropriate defaults based on context:
- Normal adult: RR = 12-20
- Tachypneic (respiratory distress): RR = 24-40
- Bradypneic (sedated/neurological): RR = 6-10"
```

2. **Use Exact Waveform Names**:
```javascript
// Add canonical list to prompt
"Use ONLY these exact waveform names (case-sensitive, must end with _ecg):
Normal/Rate: sinus_ecg, sinus_brady_ecg, sinus_tachy_ecg
Atrial: afib_ecg, aflutter_ecg, svt_ecg, pac_ecg
Ventricular: vtach_ecg, vfib_ecg, pea_ecg, asystole_ecg
Blocks: avblock1_ecg, avblock2_type1_ecg, avblock3_ecg
MI: stemi_ecg, stemi_inferior_ecg, nstemi_ecg

NEVER create custom waveform names.
NEVER concatenate words (e.g., 'peapulseless_ecg' is WRONG, use 'pea_ecg')."
```

3. **Handle Empty States Correctly**:
```javascript
// Add to Apps Script Code.gs
// When OpenAI returns "N/A" or "Not applicable" for a state:
if (stateVitals === 'N/A' || stateVitals === null || stateVitals === 'Not applicable') {
  outputRow[State4_VitalsCol] = '';  // Write empty string, NOT "N/A"
  outputRow[State5_VitalsCol] = '';
}
```

4. **Always Include Temp and EtCO2**:
```javascript
// Add to prompt
"RECOMMENDED: Include Temp and EtCO2 in all vitals objects when clinically relevant:
- Temp: Normal = 36.5-37.5°C, Fever >38°C, Hypothermia <35°C
- EtCO2: Normal = 35-45 mmHg, adjust based on respiratory status"
```

---

## Validation Process

### Before Every Batch Processing Run

```bash
# 1. Process rows
npm run run-batch-http "4,5,6"

# 2. Validate output
node scripts/validateVitalsJSON.cjs

# 3. Check for critical issues
# If any ❌ errors appear, fix Apps Script prompt and reprocess
```

### Automated Validation (Future)

Consider adding validation to Apps Script itself:

```javascript
function validateVitalsJSON(vitalsObj) {
  const required = ['HR', 'BP', 'SpO2', 'RR', 'waveform'];
  const missing = required.filter(field => !(field in vitalsObj));

  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`);
  }

  if (!vitalsObj.waveform.endsWith('_ecg')) {
    throw new Error(`Invalid waveform: ${vitalsObj.waveform} (must end with _ecg)`);
  }

  return true;
}
```

---

## Example Perfect JSON Output

```json
{
  "Initial_Vitals": {
    "HR": 122,
    "BP": "95/60",
    "RR": 28,
    "SpO2": 94,
    "Temp": 39.2,
    "EtCO2": 38,
    "waveform": "sinus_ecg"
  },
  "State1_Vitals": {
    "HR": 120,
    "BP": "95/60",
    "RR": 28,
    "SpO2": 94,
    "Temp": 39.1,
    "EtCO2": 38,
    "waveform": "sinus_ecg"
  },
  "State2_Vitals": {
    "HR": 130,
    "BP": "80/50",
    "RR": 32,
    "SpO2": 90,
    "Temp": 39.5,
    "EtCO2": 32,
    "waveform": "sinus_tachy_ecg"
  },
  "State3_Vitals": {
    "HR": 0,
    "BP": "0/0",
    "RR": 0,
    "SpO2": 0,
    "waveform": "asystole_ecg"
  },
  "State4_Vitals": "",
  "State5_Vitals": ""
}
```

---

## Adaptive Salience Audio Integration

**Why These Fields Matter**:

The Monitor component uses vitals to trigger [Adaptive Salience audio alerts](/docs/ADAPTIVE_SALIENCE_ARCHITECTURE.md):

```javascript
// Critical thresholds that depend on RR field
RR >= 30:   → Tachypnea warning
RR <= 8:    → Bradypnea critical alarm
RR == 0:    → Respiratory arrest (asystole_ecg)

// Waveform-specific alarms
'vtach_ecg':     → Critical shockable rhythm
'vfib_ecg':      → Critical shockable rhythm
'pea_ecg':       → Critical unstable rhythm
'asystole_ecg':  → Flatline alarm + CPR prompt
```

**Impact of Missing RR**: Adaptive Salience cannot detect respiratory distress, breaking clinical realism.

**Impact of Wrong Waveform**: Wrong alarm profile (e.g., `peapulseless_ecg` won't trigger CPR prompt).

---

## Action Items

### Immediate (Before Processing More Rows)

- [ ] Update OpenAI API system prompt with RR requirement
- [ ] Add canonical waveform list to prompt
- [ ] Fix "N/A" handling in Apps Script (write empty string instead)
- [ ] Add waveform name validation function

### Future Enhancements

- [ ] Add server-side validation before writing to sheet
- [ ] Create waveform auto-correction (e.g., `peapulseless` → `pea_ecg`)
- [ ] Add default RR value based on HR/scenario context
- [ ] Generate EtCO2/Temp automatically for respiratory/fever cases

---

## Summary

**Current State**: 26 critical issues across 7 processed rows
**Root Cause**: OpenAI API prompt doesn't enforce Monitor.js requirements
**Fix Location**: Apps Script `Code.gs` - update OpenAI API system prompt
**Validation**: `node scripts/validateVitalsJSON.cjs`

**Next Steps**: Fix Apps Script prompt → Reprocess existing rows → Validate → Continue batch processing

---

**Validation Script**: [scripts/validateVitalsJSON.cjs](scripts/validateVitalsJSON.cjs)
**Monitor Requirements**: [components/Monitor.js:23-69](components/Monitor.js)
**Canonical Waveforms**: [components/canonicalWaveformList.js](components/canonicalWaveformList.js)
**Adaptive Salience Docs**: [docs/ADAPTIVE_SALIENCE_ARCHITECTURE.md](docs/ADAPTIVE_SALIENCE_ARCHITECTURE.md)
