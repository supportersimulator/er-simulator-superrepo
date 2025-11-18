# Archived Scripts

This directory contains legacy, experimental, and one-time-use scripts that have been archived for reference.

## Directory Structure

### `/debug/`
Diagnostic and debugging scripts used during development:
- `check*.cjs` - Scripts for checking various system states
- `debug*.cjs` - Debugging utilities
- `diagnose*.cjs` - System diagnostic tools

Total: 17 scripts

### `/fixes/`
One-time fix scripts that resolved specific issues:
- `fixAlertToToast.cjs` - Converted alert() to toast UI pattern
- `fixBatch*.cjs` - Various batch processing fixes
- `fixChainedUIcalls.cjs` - Fixed chained UI method calls
- `fixOpenAIResponseExtraction.cjs` - Fixed API response parsing
- And 15 more one-time fixes

Total: 19 scripts

### `/batch-processing/`
Experimental batch processing implementations (superseded by production system):
- `addBatchLiveLogging.cjs`
- `enhanceBatchLiveLogging.cjs`
- `executeBatchDirect.cjs`
- `implementSmartBatch.cjs`
- `parallelBatchProcessor.cjs`
- And more batch experiments

Total: ~20 scripts

### `/experimental/`
Experimental features and prototypes:
- `add*.cjs` - Feature addition experiments
- `implement*.cjs` - Implementation prototypes
- `verify*.cjs` - Verification experiments

Total: ~12 scripts

## Why Archived?

These scripts were archived to:
1. **Reduce clutter** - Keep `/scripts/` focused on production tools
2. **Preserve history** - Maintain record of development process
3. **Improve navigation** - Make it easier to find active scripts
4. **Document evolution** - Show how the system evolved

## Can I Delete These?

**No, keep them for now.** They provide valuable reference for:
- Understanding historical decisions
- Debugging similar issues in the future
- Learning what approaches were tried
- Audit trail for system evolution

After 6 months of stable operation, consider permanent deletion.

## Restoration

To restore a script to active use:
```bash
mv scripts/archive/{category}/{script-name}.cjs scripts/
```

## Production Scripts

All production scripts remain in `/scripts/` root directory. See parent README for current tooling.

---

**Archive Date**: November 2, 2025
**Total Archived**: 68 scripts
**Production Scripts Remaining**: ~30
