# ER Simulator Architecture Overview

**Last Updated:** 2025-11-14

---

## 🧩 System Components

The ER Simulator project consists of **two major subsystems** that work together:

### 1. **React Native Vitals Monitor** (Local App)
- **Purpose:** Real-time patient monitor simulation
- **Technology:** React Native + Expo SDK 54
- **Location:** `simulator-core/er-sim-monitor/`
- **Platform:** iOS, Android, Web

### 2. **Google Apps Script Batch Processing** (Cloud-Based)
- **Purpose:** Automated scenario conversion and enrichment
- **Technology:** Google Apps Script + Google Sheets
- **Location:** `google-drive-code/sim-builder-production/`
- **Platform:** Google Cloud

---

## 🏗️ Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     ER SIMULATOR ECOSYSTEM                      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  COMPONENT 1: REACT NATIVE VITALS MONITOR (Local)              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐     ┌──────────────┐     ┌─────────────────┐ │
│  │   Monitor   │────▶│  Waveforms   │────▶│  Audio System   │ │
│  │  Component  │     │   (SVG/PNG)  │     │   (Adaptive     │ │
│  │             │     │              │     │    Salience)    │ │
│  └──────┬──────┘     └──────────────┘     └─────────────────┘ │
│         │                                                       │
│         ▼                                                       │
│  ┌─────────────┐     ┌──────────────┐                         │
│  │ Vital Signs │────▶│   Engines    │                         │
│  │  (vitals.   │     │ (Adaptive    │                         │
│  │   json)     │     │  Salience)   │                         │
│  └─────────────┘     └──────────────┘                         │
│         ▲                                                       │
│         │ Google Sheets API                                    │
│         │ (fetchVitalsFromSheetsOAuth.js)                     │
└─────────┼───────────────────────────────────────────────────────┘
          │
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│  COMPONENT 2: GOOGLE APPS SCRIPT BATCH PROCESSING (Cloud)      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐     ┌──────────────┐     ┌─────────────────┐ │
│  │  Input Tab  │────▶│ Batch Engine │────▶│  Master Output  │ │
│  │  (Raw CSV)  │     │  (OpenAI +   │     │     Tab         │ │
│  │             │     │   Scripts)   │     │  (Structured    │ │
│  │             │     │              │     │    JSON)        │ │
│  └─────────────┘     └──────┬───────┘     └─────────────────┘ │
│                             │                                   │
│                             ▼                                   │
│                      ┌──────────────┐                          │
│                      │  AI Features │                          │
│                      │  - ATSR      │                          │
│                      │  - Categories│                          │
│                      │  - Pathways  │                          │
│                      └──────────────┘                          │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  Google Sheet: "Convert_Master_Sim_CSV_Template..."    │  │
│  │  - 13 tabs (Input, Output, Cache, Reports, etc.)       │  │
│  └─────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘

          │
          │ Future Integration (Planned)
          ▼
┌─────────────────────────────────────────────────────────────────┐
│  FUTURE: AWS + NEXT.JS + DJANGO (Planned - Phase V)           │
├─────────────────────────────────────────────────────────────────┤
│  - Supabase PostgreSQL (scenario database)                     │
│  - Next.js frontend (instructor dashboard)                     │
│  - Django REST API (scenario delivery)                         │
│  - AWS Amplify (hosting)                                       │
│  - ElevenLabs (voice AI)                                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow

### Scenario Creation Flow

```
1. Raw Scenario Input
   ↓
   Google Sheets "Input" tab
   ↓
2. Batch Processing
   ↓
   Apps Script Engine
   ├─ OpenAI API (parsing + enhancement)
   ├─ ATSR (title generation)
   ├─ Categories (symptom→system mapping)
   └─ Pathways (clinical logic flows)
   ↓
3. Structured Output
   ↓
   Google Sheets "Master Scenario Convert" tab
   ├─ Standardized JSON format
   ├─ Vitals (HR, SpO2, BP, RR, Temp, EtCO2)
   ├─ Waveform assignments
   └─ Metadata (Case_ID, titles, categories)
   ↓
4. Export to Monitor (Manual/Automated)
   ↓
   fetchVitalsFromSheetsOAuth.js
   ↓
   simulator-core/er-sim-monitor/data/vitals.json
   ↓
5. Monitor Display
   ↓
   React Native Monitor Component
   ├─ Real-time vital display
   ├─ Animated waveforms
   └─ Adaptive audio alerts
```

---

## 📦 Component Details

### Component 1: React Native Vitals Monitor

**Location:** `simulator-core/er-sim-monitor/`

#### Core Modules

| Module | Purpose | Key Files |
|--------|---------|-----------|
| **Monitor Component** | Main UI for vitals display | `components/Monitor.js` |
| **Waveform Renderer** | ECG/SpO2/EtCO2 waveform rendering | `components/WaveformECG.js` |
| **Adaptive Salience** | Context-aware audio alert system | `engines/AdaptiveSalienceEngine.js`, `hooks/useAdaptiveSalience.js` |
| **Sound Manager** | Audio playback engine | `engines/SoundManager.js` |
| **Vitals Sync** | Google Sheets ↔ Monitor sync | `scripts/fetchVitalsFromSheetsOAuth.js`, `scripts/syncVitalsToSheets.js` |
| **Live Sync Server** | Real-time Sheets → Monitor updates | `scripts/liveSyncServer.js` |

#### Technology Stack

- **Framework:** React Native (Expo SDK 54)
- **Routing:** Expo Router (file-based)
- **Graphics:** `@shopify/react-native-skia` + SVG
- **Audio:** `expo-av`
- **State:** React hooks + context
- **Platform:** iOS, Android, Web (Expo compatible)

#### Key Features

1. **Real-time Vital Sign Display**
   - Heart Rate (HR)
   - Oxygen Saturation (SpO2)
   - Blood Pressure (BP - systolic/diastolic)
   - Respiratory Rate (RR)
   - Temperature (Temp)
   - End-tidal CO2 (EtCO2)

2. **Dynamic Waveform Rendering**
   - Normal Sinus Rhythm (NSR)
   - Atrial Fibrillation (AFib)
   - Ventricular Tachycardia (VTach)
   - Ventricular Fibrillation (VFib)
   - Asystole (flatline)
   - Pulseless Electrical Activity (PEA)

3. **Adaptive Salience Audio System** (Sacred Architecture)
   - Event-driven (not beat-driven)
   - Three-phase escalation: Awareness → Persistence → Neglect
   - Medical accuracy (clinically accurate thresholds)
   - Voice integration ready (smart ducking)
   - Performance: <1% CPU, <50ms latency

---

### Component 2: Google Apps Script Batch Processing

**Location:** `google-drive-code/sim-builder-production/`

#### Core Modules

| Module | Purpose | Key Files |
|--------|---------|-----------|
| **Batch Engine** | Orchestrates batch processing | `Code.gs` |
| **Ultimate Tool** | AI-powered categorization + pathways | `Ultimate_Categorization_Tool_Complete.gs` |
| **ATSR** | Automatic Title & Summary Refinement | `ATSR_Title_Generator_Feature.gs` (in variants) |
| **Categories & Pathways** | Symptom→System mapping + logic flows | `Phase2_Enhanced_Categories_*.gs` |
| **Input Validation** | Data quality checks | Various utility functions |
| **Cache System** | Field caching for performance | `Field_Cache_Incremental` sheet tab |

#### Technology Stack

- **Runtime:** Google Apps Script (V8 engine)
- **Storage:** Google Sheets API
- **AI:** OpenAI GPT-4 (via REST API)
- **Triggers:** Manual (sidebar UI) + Time-based (optional)

#### Batch Processing Modes

1. **Next 25 Unprocessed** - Incremental processing
2. **All Remaining** - Complete entire backlog
3. **Specific Rows** - Reprocess failed/targeted rows

#### Processing Pipeline

```
Input Row (raw scenario)
  ↓
1. Validation
   - Required fields check
   - Data format validation
  ↓
2. OpenAI Enrichment
   - Parse unstructured text
   - Extract vitals, symptoms, history
   - Generate structured JSON
  ↓
3. ATSR Title Generation
   - Auto-generate concise titles
   - Summarize presenting complaint
  ↓
4. Category Mapping
   - Symptom → Body System
   - Primary + Secondary categories
  ↓
5. Pathway Discovery
   - Clinical logic pathways
   - Decision tree analysis
  ↓
6. Quality Scoring
   - Completeness check
   - Clinical realism score
  ↓
Output Row (Master Scenario Convert tab)
   - Fully structured JSON
   - Ready for Monitor import
```

---

## 🔗 Integration Points

### Current Integrations

| Integration | Direction | Protocol | Status |
|-------------|-----------|----------|--------|
| **Sheets → Monitor** | Sheets → Local | OAuth 2.0 + Sheets API | ✅ Active |
| **Monitor → Sheets** | Local → Sheets | OAuth 2.0 + Sheets API | ✅ Active |
| **Apps Script → OpenAI** | Cloud → Cloud | REST API (OpenAI) | ✅ Active |
| **Live Sync** | Sheets ↔ Monitor | Webhook + WebSocket | 🔧 Optional |

### Planned Integrations (Phase V)

| Integration | Direction | Protocol | Status |
|-------------|-----------|----------|--------|
| **Supabase Database** | Cloud → Local | PostgreSQL + Realtime | 📅 Planned |
| **Next.js Dashboard** | Web → Cloud | REST API | 📅 Planned |
| **Django Backend** | Cloud → Cloud | REST API | 📅 Planned |
| **ElevenLabs Voice** | Local → Cloud | REST API (TTS) | 📅 Planned |
| **AWS Amplify** | Hosting | CDN + S3 | 📅 Planned |

---

## 📂 Single Source of Truth Mapping

| Asset Type | Current Source of Truth | Location |
|------------|------------------------|----------|
| **Live Working Code** | `simulator-core/er-sim-monitor/` | Super-repo (local) |
| **GitHub Reference** | `github-external/er-sim-monitor/` | Super-repo (read-only) |
| **Apps Script Production** | Google Apps Script | `google-drive-code/sim-builder-production/` (exported copy) |
| **Apps Script Variants** | Google Drive | `google-drive-code/` + `legacy-apps-script/` |
| **Scenario Data** | Google Sheets | `scenario-csv-raw/sheets-exports/` (static export) |
| **Documentation** | Super-repo `docs/` | Local filesystem |
| **Environment Config** | `.env` (local) | `simulator-core/er-sim-monitor/.env` (git-ignored) |

---

## 🚧 Technical Debt & Known Issues

### Current Challenges

1. **Duplicate Code**
   - Multiple versions of same files in Drive
   - Need deduplication strategy

2. **Apps Script Monolith**
   - Large monolithic `Code.gs` files
   - Difficult to test/maintain
   - Migration to Node.js/TS planned

3. **CSV ↔ JSON Conversion**
   - Manual export from Sheets → `vitals.json`
   - Should be automated pipeline

4. **No Automated Testing**
   - Apps Script has no unit tests
   - Monitor has no E2E tests

5. **Version Control Gap**
   - Apps Script not in git by default
   - Manual backups to Drive
   - Clasp integration needed

### Planned Improvements

See [migration_next_steps.md](migration_next_steps.md) for:
- Node.js migration roadmap
- Testing strategy
- CI/CD pipeline
- Database migration (Sheets → Supabase)

---

## 🎯 Architecture Principles

### Current (Phase I-II)

- **Offline-first:** Monitor works without internet
- **Local dev:** Expo + hot reload for rapid iteration
- **Cloud processing:** Heavy lifting (AI) in Apps Script
- **Manual sync:** Developer-controlled data flow

### Future (Phase III-V)

- **Real-time sync:** Supabase Realtime for instant updates
- **Multi-tenant:** Instructor dashboard for multiple users
- **Scalable backend:** Django REST + AWS for production
- **Voice AI:** ElevenLabs integration for audio guidance
- **Database-driven:** PostgreSQL replaces Sheets for scenarios

---

## 📚 Related Documentation

- [superrepo_inventory.md](superrepo_inventory.md) - Complete file inventory
- [env-setup.md](env-setup.md) - Environment variable guide
- [migration_next_steps.md](migration_next_steps.md) - Refactor roadmap
- [ADAPTIVE_SALIENCE_ARCHITECTURE.md](../simulator-core/er-sim-monitor/docs/ADAPTIVE_SALIENCE_ARCHITECTURE.md) - Audio system spec

---

## 📝 Changelog

- **2025-11-14:** Initial architecture documentation created
- Documented two-component system (Monitor + Apps Script)
- Mapped data flows and integration points
- Identified technical debt and migration path
