# ECG-to-SVG Conversion Workflow Guide

**Last Updated:** 2025-11-15
**Purpose:** Complete guide for converting ECG strip images to production-ready SVG waveforms using the built-in converter tool

---

## 🎯 Overview

This workflow allows you to convert raw ECG strip images (PNG/JPG) into medically accurate SVG waveforms that are ready for production use in the ER Simulator Monitor app.

**What You Get:**
- ✅ Perfect 1:1 pixel preservation (no QRS distortion)
- ✅ Auto-tiling for seamless looping
- ✅ Dual-format export (SVG + PNG simultaneously)
- ✅ Automatic integration into waveforms.js registry
- ✅ Instant app hot-reload with new waveform

**Current Progress:**
- **Completed:** 2 waveforms (afib_ecg, vfib_ecg)
- **Remaining:** 65+ waveforms to convert
- **Total Target:** 67 waveforms

---

## 🏗️ System Architecture

### Components

**1. ECG-to-SVG Converter Tool**
- **File:** [ecg-to-svg-converter.html](../simulator-core/er-sim-monitor/ecg-to-svg-converter.html)
- **Type:** Standalone HTML tool (no dependencies)
- **Location:** `/Users/aarontjomsland/Documents/er-simulator-superrepo/simulator-core/er-sim-monitor/ecg-to-svg-converter.html`
- **Browser:** Open directly in any modern browser (Chrome, Firefox, Safari)

**2. ECG Save Server**
- **File:** [ecg-save-server.cjs](../simulator-core/er-sim-monitor/ecg-save-server.cjs)
- **Type:** Node.js HTTP server
- **Port:** 3456
- **Purpose:** Receives exports from converter tool and saves to project folders

**3. Waveforms Registry**
- **File:** [assets/waveforms/svg/waveforms.js](../simulator-core/er-sim-monitor/assets/waveforms/svg/waveforms.js)
- **Type:** JavaScript module with SVG path data
- **Auto-Updated:** Yes (by save server)

---

## 🚀 Quick Start

### Step 1: Start the Save Server

```bash
cd /Users/aarontjomsland/Documents/er-simulator-superrepo/simulator-core/er-sim-monitor
npm run ecg-save-server
```

**Expected Output:**
```
🚀 ECG Save Server Started
═══════════════════════════════════════════════
📡 Server running at: http://localhost:3456
📁 Exports saved to: /Users/.../er-sim-monitor/exports
═══════════════════════════════════════════════

✨ Ready to receive ECG exports!
   Open ecg-to-svg-converter.html in your browser
   and click "Save to Project Folder" buttons

Press Ctrl+C to stop
```

**Server Endpoints:**
- `POST /save` - Saves exported waveforms
- `GET /status` - Health check
- `GET /list-waveforms` - Lists completed waveforms
- `GET /check-exists/{waveform_key}` - Checks if waveform already exists

### Step 2: Open the Converter Tool

**Option A: Direct File Open**
```bash
open /Users/aarontjomsland/Documents/er-simulator-superrepo/simulator-core/er-sim-monitor/ecg-to-svg-converter.html
```

**Option B: Browser Address Bar**
```
file:///Users/aarontjomsland/Documents/er-simulator-superrepo/simulator-core/er-sim-monitor/ecg-to-svg-converter.html
```

**Tool Features:**
- 📋 Progress bulletin board (shows 2/67 completed, 65 remaining)
- 🔄 Server status indicator (green when connected)
- 📊 Real-time waveform tracking
- 🎨 Multi-step conversion pipeline

### Step 3: Convert an ECG Strip

**The Conversion Pipeline:**

```
Step 1: Upload ECG Strip
  ↓ (Upload PNG/JPG image of ECG strip)

Step 2: Extract Black Line
  ↓ (Adjust threshold slider to isolate waveform)

Step 3: Convert to Green SVG
  ↓ (Optional smoothing adjustment)

Step 3.5: Crop Region Selector
  ↓ (Drag brackets to select waveform portion)
  ↓ (Shift+drag to pan waveform)
  ↓ (Auto-tiles if waveform shorter than bracket)

Step 3.75: Final Baseline Adjustment
  ↓ (Fine-tune spacing: -50 to +50 segments)

Step 4: Export
  ↓ Click "💾 AUTO-SAVE: SVG + PNG (Both Formats)"
  ↓ Enter waveform key (e.g., "vtach_ecg")
  ↓ Server saves to project folders
  ↓ waveforms.js registry auto-updated
  ↓ App hot-reloads with new waveform
```

---

## 📁 File Locations (Auto-Managed by Server)

When you export a waveform (e.g., `vtach_ecg`), the save server automatically saves to **three locations**:

### 1. Exports Folder (Backup/Reference)
```
/Users/aarontjomsland/Documents/er-simulator-superrepo/simulator-core/er-sim-monitor/exports/
├── vtach_ecg.svg  ← Backup copy
└── vtach_ecg.png  ← Backup copy
```

### 2. Production SVG (Active Monitor Use)
```
/Users/aarontjomsland/Documents/er-simulator-superrepo/simulator-core/er-sim-monitor/assets/waveforms/svg/
├── afib_ecg.svg   ← ✅ Already completed
├── vfib_ecg.svg   ← ✅ Already completed
├── vtach_ecg.svg  ← 🆕 Your new waveform
├── waveforms.js   ← Auto-updated with vtach_ecg path data
└── ...
```

### 3. Legacy PNG (Backward Compatibility)
```
/Users/aarontjomsland/Documents/er-simulator-superrepo/simulator-core/er-sim-monitor/assets/waveforms/png/
├── afib_ecg.png   ← ✅ Already completed
├── vfib_ecg.png   ← ✅ Already completed
├── vtach_ecg.png  ← 🆕 Your new waveform
└── ...
```

**Note:** You don't manually manage these folders - the save server handles everything automatically.

---

## 🔧 Server Automation Features

### 1. Auto-Update waveforms.js Registry

**Before Export:** `waveforms.js` contains:
```javascript
export const WAVEFORM_DATA = {
  afib_ecg: {
    path: "M 0.00 54.87 L 1.00...",
    width: 1000,
    height: 60,
    peaks: 6
  },
  vfib_ecg: {
    path: "M 0.00 15.56 L 1.00...",
    width: 999,
    height: 60,
    peaks: 0
  }
};
```

**After Exporting `vtach_ecg`:** Server automatically adds:
```javascript
export const WAVEFORM_DATA = {
  afib_ecg: { ... },
  vfib_ecg: { ... },
  vtach_ecg: {  // 🆕 Auto-added by server
    path: "M 0.00 30.12 L 1.00...",
    width: 1000,
    height: 60,
    peaks: 8
  }
};
```

**Server Output:**
```
🔄 AUTO-UPDATING WAVEFORMS.JS REGISTRY...
➕ Added new "vtach_ecg" entry to waveforms.js
✅ Registry updated successfully!
   Variant: vtach_ecg
   Dimensions: 1000x60px
   R-waves: 8 peaks
   Path length: 45231 characters
```

### 2. Auto-Reload Expo App

**After saving to registry, server triggers:**
```
🔄 REFRESHING EXPO APP...
✅ Metro bundler cache cleared
📱 App will hot-reload automatically with new waveform data
```

**What Happens:**
1. Server kills Metro bundler cache (`pkill -f "react-native"`)
2. Expo detects file change in `waveforms.js`
3. App hot-reloads with new waveform available
4. Monitor component can now use `variant="vtach_ecg"`

### 3. R-Wave Position Tracking

**If you mark R-wave positions in converter tool:**

Server saves to `assets/waveforms/r-wave-positions.json`:
```json
{
  "afib_ecg": [0.08, 0.16, 0.38, 0.54, 0.72, 0.88],
  "vfib_ecg": [],
  "vtach_ecg": [0.05, 0.15, 0.25, 0.35, 0.45, 0.55, 0.65, 0.75]
}
```

**Used By:**
- `WaveformPleth.js` - Syncs SpO2 peaks with ECG R-waves (Pulse Transit Time: 200-300ms)

---

## 🎨 Converter Tool Features

### Feature 1: Perfect 1:1 Pixel Preservation

**Problem Solved:** Previous tools distorted QRS complexes during extraction.

**How It Works:**
- No horizontal scaling or compression
- Every pixel in original ECG strip maps 1:1 to output SVG
- QRS width, R-wave angles, timing intervals remain exact

**Clinical Accuracy:** Medical reviewers can verify waveforms match source images perfectly.

### Feature 2: Auto-Tiling with Stitch Marks

**Problem Solved:** Short ECG strips don't fill entire monitor width.

**How It Works:**
- Converter calculates how many tiles needed to fill bracket width
- Waveform repeats seamlessly
- Red dashed lines mark loop connection points
- Preview shows exactly what will display on monitor

**Example:**
```
Original ECG strip: 400px wide
Monitor bracket: 1200px wide
Auto-tiles: 3 copies (400px × 3 = 1200px)
Stitch marks at: 400px, 800px
```

### Feature 3: Dual Independent Drag System

**Two Drag Modes:**

1. **Bracket Dragging** (Default)
   - Click and drag left/right brackets
   - Left bracket auto-aligns to waveform start (QRS detection)
   - Right bracket free-drag
   - Selects portion of waveform to export

2. **Waveform Panning** (Shift+Drag)
   - Hold Shift key
   - Click and drag waveform
   - Brackets stay fixed, waveform moves underneath
   - Useful for centering specific QRS complex

### Feature 4: Vertical-Only Auto-Fit

**Problem Solved:** Amplitude varies between ECG strips (different gain settings).

**How It Works:**
- Amplitude scales to monitor height (60px standard)
- Horizontal spacing NEVER changes (preserves 1:1 pixel timing)
- QRS complexes remain sharp and accurate

**Before Auto-Fit:**
```
Waveform amplitude: 20px (too small)
Monitor height: 60px
```

**After Auto-Fit:**
```
Waveform amplitude: 60px (scaled 3x vertically)
Horizontal spacing: UNCHANGED (still 1:1 pixels)
```

### Feature 5: Baseline Adjustment (-50 to +50 segments)

**Problem Solved:** Fine-tune vertical positioning after auto-fit.

**How It Works:**
- Slider adjusts baseline offset in 1-segment increments
- Range: -50 segments (move down) to +50 segments (move up)
- Live preview shows adjustment
- Use to center waveform perfectly in 60px canvas

**Use Cases:**
- Waveform too high → Move down with negative adjustment
- Waveform too low → Move up with positive adjustment
- Baseline drift → Compensate with fine adjustment

### Feature 6: Dual-Format Export

**Why Both Formats?**

**SVG (Production - Future-Ready):**
- ✅ Infinite scalability without quality loss
- ✅ Dynamic monitor sizing (resize without re-exporting)
- ✅ Smaller file sizes (path data vs pixel data)
- ✅ Programmatic manipulation (color, stroke, animations)
- ✅ Medical accuracy preserved at any scale

**PNG (Legacy - Backward Compatibility):**
- ✅ Current system uses PNG waveforms
- ✅ Drop-in replacement for existing PNGs
- ✅ No code changes needed immediately
- ✅ Maintains working system during transition

**Migration Path:**
1. **Now:** Export both SVG + PNG (one click)
2. **Current:** Monitor uses PNG from `assets/waveforms/png/`
3. **Future:** Swap PNG imports for SVG imports in `WaveformECG.js`
4. **Benefit:** No need to re-convert waveforms - already have both formats!

---

## 🎯 Waveform Naming Convention

### Universal Standard: `{waveform}_ecg` Suffix

**CRITICAL:** All waveforms MUST use the `_ecg` suffix pattern. No exceptions.

**✅ Correct Naming:**
- `vfib_ecg` (ventricular fibrillation)
- `vtach_ecg` (ventricular tachycardia)
- `afib_ecg` (atrial fibrillation)
- `sinus_ecg` (normal sinus rhythm)
- `asystole_ecg` (flatline)
- `pea_ecg` (pulseless electrical activity)
- `sinus_brady_ecg` (sinus bradycardia)
- `sinus_tachy_ecg` (sinus tachycardia)

**❌ Incorrect Naming:**
- `vfib` (missing suffix)
- `vtach` (missing suffix)
- `afib` (missing suffix)
- `vfib_waveform` (wrong suffix)
- `vfib.ecg` (dot instead of underscore)

### Why This Matters

**The Bug We Fixed:**
- Old system: Files named `vfib_ecg.svg`, registry used key `vfib`, Monitor used `vfib_ecg`
- Result: VFib waveform failed to load, fell back to mathematical NSR generator
- Patient in VFib displayed normal sinus rhythm (dangerous clinical inaccuracy!)

**Current System:**
- ✅ File: `vfib_ecg.svg`
- ✅ Registry key: `vfib_ecg`
- ✅ Monitor prop: `variant="vfib_ecg"`
- ✅ No transformations anywhere in codebase
- ✅ Waveform loads correctly every time

**Rule:** Name it once, use it everywhere - no suffix stripping, no normalization, no transformations.

---

## 📊 Progress Tracking

### Current Status (2/67 Completed)

**✅ Completed Waveforms (2):**
1. `afib_ecg` - Atrial Fibrillation
   - SVG: ✅ `/assets/waveforms/svg/afib_ecg.svg`
   - PNG: ✅ `/assets/waveforms/png/afib_ecg.png`
   - Registry: ✅ `waveforms.js` (1000x60px, 6 peaks)
   - R-waves: ✅ `[0.08, 0.16, 0.38, 0.54, 0.72, 0.88]`

2. `vfib_ecg` - Ventricular Fibrillation
   - SVG: ✅ `/assets/waveforms/svg/vfib_ecg.svg`
   - PNG: ✅ `/assets/waveforms/png/vfib_ecg.png`
   - Registry: ✅ `waveforms.js` (999x60px, 0 peaks - chaotic)
   - R-waves: ✅ `[]` (no organized R-waves in VFib)

**🔲 High-Priority Remaining Waveforms:**
- `vtach_ecg` - Ventricular Tachycardia (critical rhythm)
- `asystole_ecg` - Asystole / Flatline (critical rhythm)
- `pea_ecg` - Pulseless Electrical Activity (critical rhythm)
- `sinus_ecg` - Normal Sinus Rhythm (most common)
- `sinus_brady_ecg` - Sinus Bradycardia
- `sinus_tachy_ecg` - Sinus Tachycardia

**🔲 Medium-Priority Waveforms:**
- `stemi_anterior_ecg` - STEMI (Anterior)
- `stemi_inferior_ecg` - STEMI (Inferior)
- `stemi_lateral_ecg` - STEMI (Lateral)
- `complete_heart_block_ecg` - Complete Heart Block
- `2nd_degree_av_block_type1_ecg` - 2nd Degree AV Block Type I (Wenckebach)
- `2nd_degree_av_block_type2_ecg` - 2nd Degree AV Block Type II

**Total Target:** 67 waveforms (exact list available in converter tool bulletin board)

### Checking Progress Programmatically

**Via Save Server API:**
```bash
# List all completed waveforms
curl http://localhost:3456/list-waveforms

# Check if specific waveform exists
curl http://localhost:3456/check-exists/vtach_ecg
```

**Via Converter Tool:**
- Open tool in browser
- Check bulletin board at top
- Click "🔄 Refresh Status" button
- Displays: Completed count, Remaining count, Progress percentage

---

## 🛠️ Troubleshooting

### Issue 1: Server Not Running

**Symptom:** Converter tool shows "❌ Server offline" in red.

**Fix:**
```bash
cd /Users/aarontjomsland/Documents/er-simulator-superrepo/simulator-core/er-sim-monitor
npm run ecg-save-server
```

**Verify:**
```bash
curl http://localhost:3456/status
# Should return: {"status":"running","exports_dir":"..."}
```

### Issue 2: Port 3456 Already in Use

**Symptom:** `❌ Port 3456 is already in use`

**Fix Option A - Kill Existing Server:**
```bash
lsof -ti:3456 | xargs kill -9
npm run ecg-save-server
```

**Fix Option B - Change Port:**
1. Edit `ecg-save-server.cjs`
2. Change `const PORT = 3456;` to `const PORT = 3457;`
3. Edit `ecg-to-svg-converter.html`
4. Change fetch URLs from `http://localhost:3456` to `http://localhost:3457`

### Issue 3: Export Fails with CORS Error

**Symptom:** Browser console shows CORS error when clicking save.

**Cause:** Server not running or wrong port.

**Fix:**
1. Verify server running: `curl http://localhost:3456/status`
2. Check browser console for exact error
3. Ensure converter tool fetching correct URL: `http://localhost:3456/save`

### Issue 4: Waveform Not Appearing in Monitor

**Symptom:** Exported waveform, but Monitor still uses mathematical generator.

**Check:**
1. Verify `waveforms.js` updated:
   ```bash
   grep "vtach_ecg" /Users/aarontjomsland/Documents/er-simulator-superrepo/simulator-core/er-sim-monitor/assets/waveforms/svg/waveforms.js
   ```
2. Verify naming convention (must have `_ecg` suffix)
3. Check Monitor component prop: `variant="vtach_ecg"` (not `"vtach"`)
4. Restart Expo app if hot-reload didn't trigger

### Issue 5: App Not Hot-Reloading After Export

**Symptom:** Server saved file, but app didn't refresh.

**Manual Fix:**
```bash
# Clear Metro bundler cache
rm -rf /tmp/metro-*
rm -rf /tmp/haste-map-*

# Restart Expo
cd /Users/aarontjomsland/Documents/er-simulator-superrepo/simulator-core/er-sim-monitor
npx expo start -c
```

**Or press `R` in Expo terminal to reload**

---

## 🔄 Complete Workflow Example

### Converting VTach ECG (Step-by-Step)

**Preparation:**
```bash
# Terminal 1: Start save server
cd /Users/aarontjomsland/Documents/er-simulator-superrepo/simulator-core/er-sim-monitor
npm run ecg-save-server
```

**Conversion:**
1. **Open Converter Tool**
   ```bash
   open ecg-to-svg-converter.html
   ```

2. **Upload ECG Strip**
   - Click "Choose File" in Step 1
   - Select `vtach_strip.png` (your ECG image)
   - Image appears in preview canvas

3. **Extract Black Line**
   - Adjust "Threshold" slider (typically 128-180)
   - Watch preview until only waveform line remains
   - Click "Extract Black Line" when satisfied

4. **Convert to Green SVG**
   - Optionally adjust "Smoothing" slider (0 = sharp peaks, 10 = smoother)
   - Click "Convert to Green SVG"
   - Green waveform appears

5. **Crop Region Selector**
   - Left bracket auto-aligns to first QRS
   - Drag right bracket to include 5-10 complexes
   - Shift+drag waveform to center if needed
   - Red dashed lines show auto-tile loop points

6. **Final Baseline Adjustment**
   - Slider adjusts vertical position (-50 to +50)
   - Center waveform in 60px canvas
   - Click "Apply Adjustment" when satisfied

7. **Export (AUTO-SAVE)**
   - Click "💾 AUTO-SAVE: SVG + PNG (Both Formats)"
   - Enter waveform key: `vtach_ecg`
   - Click "Save Both Formats"

**Server Output:**
```
📦 Backup: vtach_ecg.svg → /exports/ (23.45 KB)
🚀 PRODUCTION SVG: vtach_ecg.svg → /assets/waveforms/svg/ (23.45 KB)

🔄 AUTO-UPDATING WAVEFORMS.JS REGISTRY...
➕ Added new "vtach_ecg" entry to waveforms.js
✅ Registry updated successfully!
   Variant: vtach_ecg
   Dimensions: 1000x60px
   R-waves: 8 peaks
   Path length: 45231 characters

🔄 REFRESHING EXPO APP...
✅ Metro bundler cache cleared
📱 App will hot-reload automatically with new waveform data
═════════════════════════════════════════════════════════
```

**Verification:**
```bash
# Check files created
ls -lh assets/waveforms/svg/vtach_ecg.svg
ls -lh assets/waveforms/png/vtach_ecg.png
ls -lh exports/vtach_ecg.svg
ls -lh exports/vtach_ecg.png

# Check registry updated
grep "vtach_ecg" assets/waveforms/svg/waveforms.js
```

**Test in Monitor:**
```javascript
// In Monitor.js or test component
<WaveformECG variant="vtach_ecg" hr={180} />
```

**Result:** VTach waveform displays with perfect fidelity, sharp QRS complexes, correct timing!

---

## 📚 Related Documentation

**Architecture:**
- [architecture_overview.md](architecture_overview.md) - Full system architecture
- [ADAPTIVE_SALIENCE_ARCHITECTURE.md](../simulator-core/er-sim-monitor/docs/ADAPTIVE_SALIENCE_ARCHITECTURE.md) - Audio system spec

**Environment Setup:**
- [env-setup.md](env-setup.md) - Environment variables guide

**Migration Plans:**
- [migration_next_steps.md](migration_next_steps.md) - Future SVG migration roadmap

**Source Code:**
- [ecg-to-svg-converter.html](../simulator-core/er-sim-monitor/ecg-to-svg-converter.html) - Converter tool source
- [ecg-save-server.cjs](../simulator-core/er-sim-monitor/ecg-save-server.cjs) - Save server source
- [waveforms.js](../simulator-core/er-sim-monitor/assets/waveforms/svg/waveforms.js) - Waveforms registry
- [WaveformECG.js](../simulator-core/er-sim-monitor/components/WaveformECG.js) - ECG renderer

---

## 🎯 Next Steps

**To Complete All 67 Waveforms:**

1. **Gather ECG Strip Images**
   - Collect 65 remaining ECG images (PNG/JPG)
   - Organize by priority (critical rhythms first)
   - Name files clearly: `vtach.png`, `asystole.png`, etc.

2. **Batch Conversion Sessions**
   - Start save server: `npm run ecg-save-server`
   - Open converter tool in browser
   - Convert 5-10 waveforms per session
   - Verify each in Monitor before moving to next

3. **Track Progress**
   - Use bulletin board in converter tool
   - Watch completed count increase
   - Celebrate milestones: 10/67, 25/67, 50/67, 67/67!

4. **Test Each Waveform**
   - Create test scenario in vitals.json
   - Set `"waveform": "vtach_ecg"`
   - Verify Monitor displays correctly
   - Check Adaptive Salience triggers appropriate alerts

5. **Document Clinical Scenarios**
   - Map waveforms to medical conditions
   - Create scenario library using new waveforms
   - Update Google Sheets with waveform assignments

**Goal:** 67/67 waveforms completed = 100% SVG coverage = Production-ready monitor!

---

**END OF ECG-TO-SVG WORKFLOW GUIDE**

**Current Status:** 2/67 completed (3% progress)
**Next Priority:** VTach, Asystole, PEA (critical rhythms)
