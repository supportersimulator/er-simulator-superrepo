# ER Simulator Documentation Hub

Welcome to the centralized documentation for the ER Simulator Monitor ecosystem.

## 📚 Core Documentation

### Architecture & Design
- **[ADAPTIVE_SALIENCE_ARCHITECTURE.md](ADAPTIVE_SALIENCE_ARCHITECTURE.md)** - Complete technical specification of the medical-grade audio system (SACRED - do not modify without consulting this doc)
- **[ADAPTIVE_SALIENCE_INTEGRATION_GUIDE.md](ADAPTIVE_SALIENCE_INTEGRATION_GUIDE.md)** - Safe modification patterns and integration guidelines

### Data Systems
- **[AI_CASE_OVERVIEWS_SYSTEM.md](AI_CASE_OVERVIEWS_SYSTEM.md)** - AI-generated pre/post-sim overview generation system
- **[SIMULATION_CONVERSION_SYSTEM.md](SIMULATION_CONVERSION_SYSTEM.md)** - Google Sheets ↔ JSON simulation data conversion
- **[WAVEFORM_SYSTEM_DEPLOYMENT_GUIDE.md](WAVEFORM_SYSTEM_DEPLOYMENT_GUIDE.md)** - AI-powered waveform management system deployment & usage guide

### Development
- **[BATCH_PROCESSING_SYSTEM.md](BATCH_PROCESSING_SYSTEM.md)** - Multi-phase batch processing architecture (Phases 1-3 complete)
- **[ECOSYSTEM_AUDIT.md](../ECOSYSTEM_AUDIT.md)** - Comprehensive system health assessment (A+ rating, Nov 2025)

### Quick Reference
- **[CLAUDE.md](../CLAUDE.md)** - AI agent guidelines and project overview
- **[QUICK_REFERENCE.md](../QUICK_REFERENCE.md)** - Fast lookup for common tasks and commands

## 🛠️ Interactive Tools

### Production Dashboards
```bash
npm run dashboard-v2           # Interactive Dashboard V2 (full execution)
npm run dashboard              # Static analytics dashboard
npm run monitor                # Real-time process monitoring
```

### Case Organization
```bash
npm run categories-pathways    # Categories & Pathways Tool
npm run auto-flag-foundational # Auto-flag foundational cases (Priority ≥8, Complexity ≤3)
npm run consolidate-pathways   # Consolidate small pathways
```

### Data Management
```bash
npm run ai-enhanced            # AI-enhanced case renaming
npm run generate-overviews     # Generate AI case overviews
npm run sync-foundational      # Sync foundational flags to Google Sheets
npm run sync-overviews         # Sync overviews to Google Sheets
```

### Validation & Testing
```bash
npm run test-suite             # Run 20 automated integration tests
npm run enhanced-validation    # Enhanced validation (complexity, priority, foundational logic)
npm run validate-system        # Standard system integrity validation
```

### Backup & Recovery
```bash
npm run backup-metadata        # Create timestamped backup
npm run compare-backups        # Compare two backup files
npm run restore-metadata       # Restore from backup
npm run history                # View operation history
npm run undo                   # Undo last operation
```

### Export & Analytics
```bash
npm run export-dashboard       # Export analytics (CSV + JSON)
npm run export-csv             # Export CSV only
npm run export-json            # Export JSON only
```

## 📊 System Statistics

- **Total Cases**: 189 simulation cases
- **Foundational Cases**: 163 (86.2%)
- **Advanced Cases**: 26 (13.8%)
- **Pathways**: 18 organized learning pathways
- **Case Overviews**: 189/189 (100% complete)
- **Test Coverage**: 20/20 tests passing
- **Data Integrity**: 0 errors, 0 warnings

## 🏗️ Architecture Overview

```
ER Simulator Monitor
├── Frontend (React Native + Expo)
│   ├── /components/Monitor.js          # Main monitor UI
│   ├── /engines/AdaptiveSalienceEngine.js  # SACRED ARCHITECTURE
│   ├── /engines/SoundManager.js        # Audio playback
│   └── /hooks/useAdaptiveSalience.js   # React integration
│
├── Backend Scripts (/scripts/)
│   ├── Production Tools (~30 scripts)  # Active production scripts
│   └── /archive/                       # Legacy/experimental (68 scripts)
│
├── Data Layer
│   ├── AI_ENHANCED_CASE_ID_MAPPING.json       # Case metadata (237KB)
│   ├── AI_ENHANCED_PATHWAY_METADATA.json      # Pathway organization (53KB)
│   ├── AI_CASE_OVERVIEWS.json                 # Pre/post overviews (840KB)
│   ├── /backups/                              # Timestamped backups
│   └── /operation-history/                    # Granular undo system
│
└── Integration
    ├── Google Sheets API (OAuth2)     # Case data sync
    └── OpenAI Batch API               # Overview generation
```

## 🔐 Security & Credentials

- **OAuth Credentials**: `config/credentials.json` (gitignored)
- **API Keys**: `.env` file (gitignored)
- **Token Storage**: `config/token.json` (gitignored)
- **Service Account**: `config/google-service-account.json` (gitignored)

See **`.env.example`** for required environment variables.

## 🧪 Testing Strategy

1. **Unit Tests**: N/A (data-focused system)
2. **Integration Tests**: `npm run test-suite` (20 tests)
3. **Enhanced Validation**: `npm run enhanced-validation` (5 checks)
4. **Manual Testing**: Interactive dashboard tools

## 📈 Performance Metrics

- **Test Suite**: <5 seconds
- **Dashboard Generation**: <2 seconds
- **Data Export**: <1 second (1.1MB)
- **Enhanced Validation**: <1 second (189 cases)
- **Backup Creation**: <500ms (1.1MB)

## 🚀 Getting Started

### First Time Setup
1. Clone repository
2. Copy `.env.example` to `.env` and fill in credentials
3. Run `npm install`
4. Run `npm run auth-google` (OAuth authentication)
5. Run `npm run test-suite` (verify installation)

### Daily Workflow
1. `npm run dashboard-v2` - Launch interactive dashboard
2. Select action from menu (validation, export, organization, etc.)
3. `npm run backup-metadata` - Backup before major changes
4. `npm run validate-system` - Verify integrity after changes

## 📝 Documentation Maintenance

- **Update After**: Major feature additions, architecture changes
- **Review Frequency**: Quarterly (every 3 months)
- **Version Control**: All docs in git, track with commits
- **Next Review**: February 2026

## 🆘 Support & Troubleshooting

### Common Issues

**OAuth Authentication Failed**
```bash
# Solution: Re-authenticate
npm run auth-google
```

**Data Validation Errors**
```bash
# Solution: Run enhanced validation for detailed diagnostics
npm run enhanced-validation
```

**Script Not Found**
```bash
# Check if script was archived
ls scripts/archive/*/*.cjs | grep {script-name}

# Restore if needed
mv scripts/archive/{category}/{script}.cjs scripts/
```

## 🎯 Roadmap

### Completed (2025)
- ✅ AI-enhanced case organization (189 cases)
- ✅ Adaptive Salience audio system (medical-grade)
- ✅ Comprehensive testing suite (20 tests)
- ✅ Backup/restore/undo systems
- ✅ Interactive dashboard tooling
- ✅ Google Sheets integration (OAuth)
- ✅ Batch processing system (Phases 1-3)

### Planned
- 🔄 React component modernization (hooks migration)
- 🔄 Supabase PostgreSQL migration
- 🔄 Multi-language support
- 🔄 Scenario expansion (100s of cases)

## 📜 Change Log

- **Nov 2, 2025**: Comprehensive ecosystem audit (A+ rating)
- **Nov 2, 2025**: Added 9 production enhancements (all passing tests)
- **Nov 2, 2025**: Script consolidation (68 scripts archived)
- **Nov 2, 2025**: Created centralized documentation hub

---

**Last Updated**: November 2, 2025
**System Health**: ⭐⭐⭐⭐⭐ Excellent (A+ Rating)
**Production Ready**: Yes
