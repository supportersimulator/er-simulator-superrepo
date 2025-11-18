# ATSR Trimming Guide

## Current Status
✅ Standalone ATSR project created
✅ Full monolithic code deployed and working
✅ Local trimming workspace ready

## Script ID
1Bkbm2MNA-YmXQEoMsIlC-VgEgHiQHO2EuMXR-yyxy9lYWl3eNcEHk_S-

## Project URL
https://script.google.com/d/1Bkbm2MNA-YmXQEoMsIlC-VgEgHiQHO2EuMXR-yyxy9lYWl3eNcEHk_S-/edit

## Trimming Workflow

### 1. Test Current State (Should Work)
- Open Google Sheet
- Extensions → Apps Script → Select "ER Sim - ATSR Tool (Standalone)"
- Run `generateATSR()` on a row
- Should work perfectly (it's the full code)

### 2. Start Trimming (Edit Code_ATSR_Trimmed.gs)

**Functions to REMOVE (batch processing - ATSR doesn't need these):**
- [ ] processOneInputRow_()
- [ ] validateVitalsFields_()
- [ ] applyClinicalDefaults_()
- [ ] processAllInputRows()
- [ ] Any batch processing UI functions

**Functions to KEEP (ATSR needs these):**
- [x] parseATSRResponse_()
- [x] generateATSR()
- [x] callOpenAI()
- [x] tryParseJSON()
- [x] onOpen() (for menu)

### 3. Deploy & Test After Each Removal
```bash
node scripts/deployATSR.cjs
```

Then test ATSR in Google Sheet.

### 4. If It Breaks
- Undo the last deletion in Code_ATSR_Trimmed.gs
- That function was needed - keep it
- Continue trimming other functions

### 5. Final State
You'll end up with ~800-1000 lines (down from 3,880)
- All ATSR functionality intact
- All batch processing removed
- Completely independent tool

## Quick Commands

Deploy ATSR:
```bash
npm run deploy-atsr
```

Check line count:
```bash
wc -l scripts/Code_ATSR_Trimmed.gs
```
