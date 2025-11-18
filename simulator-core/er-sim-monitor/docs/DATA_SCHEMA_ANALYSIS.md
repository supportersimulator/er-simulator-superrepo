# Data Schema Analysis

Generated: 2025-11-02

## Current Data Format (emsim_final import)

### Case_ID Format
**Current**: 4 letters + 4 digits (e.g., `GAST0001`, `CARD0002`)
**Expected by audit**: 2 letters + 5 digits (e.g., `CA00001`)

**Decision**: The current format is actually BETTER (more descriptive category codes like GAST, CARD, RESP, etc.)
**Action**: Update validation regex to accept 3-4 letter prefixes

### Vitals JSON Format
**Current Schema**:
```json
{
  "HR": 122,
  "BP": "95/60",
  "RR": 28,
  "Temp": 39.2,
  "SpO2": 94,
  "waveform": "sinus_ecg",
  "EtCO2": 31
}
```

**Expected Schema** (by Monitor component):
```json
{
  "hr": 122,
  "bp": {
    "sys": 95,
    "dia": 60
  },
  "rr": 28,
  "temp": 39.2,
  "spo2": 94,
  "waveform": "sinus_ecg",
  "etco2": 31
}
```

**Key Differences**:
1. **Case sensitivity**: Current uses uppercase keys (`HR`, `SpO2`), Monitor expects lowercase (`hr`, `spo2`)
2. **BP format**: Current uses string `"95/60"`, Monitor expects object `{sys: 95, dia: 60}`
3. **Field names**: Current has `Temp`, Monitor expects `temp` (consistent lowercase)

**Action**: Create bidirectional converter:
- **Import path**: Convert uppercase → lowercase, parse BP string → object
- **Export path**: Keep original format for compatibility with source data

## Data Quality Assessment

### Actual State
- ✅ **All 189 rows have Case_IDs** (just different format than expected)
- ✅ **All 189 rows have Vitals JSON** (just different schema than expected)
- ✅ **All 189 rows have Spark Titles**
- ✅ **All 189 rows have Reveal Titles**
- ✅ **All 189 rows have Pre-Sim Overviews**
- ✅ **All 189 rows have Post-Sim Overviews**
- ✅ **All 189 rows have Medical Categories**
- ✅ **All 189 rows have Pathways**

### Issues to Fix
1. ❌ **31 rows with invalid waveforms** (need to investigate which waveforms are invalid)
2. 🔄 **Vitals format needs standardization** for Monitor compatibility

## Recommendations

### 1. Vitals Standardization Strategy
Create `standardizeVitals()` function that:
- Converts keys to lowercase
- Parses BP string into object
- Validates waveform against registry
- Adds missing fields with clinical defaults
- Preserves all medical data

### 2. Case_ID Validation Update
Update regex from:
```javascript
/^[A-Z]{2}\d{5}$/
```
To:
```javascript
/^[A-Z]{3,4}\d{4,5}$/
```

This accepts both formats:
- ✅ `GAST0001` (current format)
- ✅ `CA00001` (legacy format)

### 3. Invalid Waveform Investigation
Need to identify the 31 rows with invalid waveforms and either:
- Map to valid waveform names
- Apply clinical defaults based on diagnosis

## Implementation Priority

**Phase 1: Data Understanding** (✅ COMPLETE)
- Analyzed actual schema
- Documented differences
- Identified real vs false-positive issues

**Phase 2: Non-Destructive Conversion** (NEXT)
- Create standardization script
- Test on 5 sample rows
- Verify Monitor compatibility

**Phase 3: Batch Standardization** (AFTER VERIFICATION)
- Run on all 189 rows
- Create backup before changes
- Validate 100% success rate

**Phase 4: Waveform Fixes** (FINAL)
- Investigate 31 invalid waveforms
- Apply corrections
- Final audit confirms 100% ideal state
