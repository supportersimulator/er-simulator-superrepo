# ER Simulator - Quick Reference Guide

**AI-Enhanced Case Organization System**
Version 1.0 | Last Updated: November 2025

---

## 📊 Google Sheet Structure

### Key Columns

| Column | Name | Content | Format |
|--------|------|---------|--------|
| **A** | Case_ID | Unique identifier | `CARD0001`, `RESP0012`, `PEDNE05` |
| **J** | Pre_Sim_Overview | SBAR + mystery teaser | JSON string |
| **K** | Post_Sim_Overview | Clinical pearls + victory | JSON string |
| **L** | Medical_Category | System classification | `Cardiac`, `Respiratory`, etc. |

### Column Organization
- **Columns A-L**: Case_Organization (with rainbow color-coding)
- **Columns M+**: Patient Demographics, Monitor Vitals, etc.

---

## 🚀 Quick Commands

### Most Used Commands
```bash
# Interactive case organization tool
npm run categories-pathways

# Interactive analytics dashboard (NEW!)
npm run dashboard-interactive

# Sync AI overviews to Google Sheet
npm run sync-overviews

# Check pathway naming quality
npm run analyze-pathways

# Validate system integrity
npm run validate-system

# Auto-flag foundational cases (NEW!)
npm run auto-flag-foundational
```

### AI-Enhanced Commands
```bash
# Run full AI discovery system
npm run ai-enhanced

# Generate case overviews (standalone)
npm run generate-overviews

# Create system analytics dashboard
npm run dashboard
```

### Data Management
```bash
# Backup current metadata
npm run backup-metadata

# Restore from backup
npm run restore-metadata

# Compare two backups (NEW!)
npm run compare-backups

# Add category column (one-time setup)
npm run add-category-column

# Consolidate small pathways (NEW!)
npm run consolidate-pathways
```

---

## 📂 Medical Categories (18 Systems)

| Code | Full Name | Example Cases |
|------|-----------|---------------|
| **CARD** | Cardiac | MI, Arrhythmias, Heart Failure |
| **RESP** | Respiratory | Asthma, COPD, Pneumonia, PE |
| **NEUR** | Neurological | Stroke, Seizures, Meningitis |
| **GAST** | Gastrointestinal | Appendicitis, GI Bleed, Bowel Obstruction |
| **TRAU** | Trauma | MVA, Falls, Penetrating Trauma |
| **MULT** | Multisystem | Sepsis, Multi-organ Failure |
| **RENA** | Renal | AKI, Urinary Retention |
| **ENDO** | Endocrine | DKA, Hypoglycemia, Thyroid Storm |
| **HEME** | Hematology | Anemia, Coagulopathy, Sickle Cell |
| **MUSC** | Musculoskeletal | Fractures, Compartment Syndrome |
| **DERM** | Dermatology | Cellulitis, Abscess, Rashes |
| **INFD** | Infectious Disease | Sepsis, Meningitis, Infections |
| **IMMU** | Immunology | Anaphylaxis, Allergic Reactions |
| **OBST** | Obstetrics | Eclampsia, Hemorrhage, Labor |
| **GYNE** | Gynecology | Ectopic, Ovarian Torsion |
| **TOXI** | Toxicology | Overdose, Poisoning |
| **PSYC** | Psychiatry | Psychosis, Suicidal Ideation |
| **ENVI** | Environmental | Hypothermia, Heat Stroke |

---

## 🧩 Learning Pathways (16 Total)

### Foundational Pathways (High Priority)
- **Cardiac Mastery Foundations** (57 cases) - Core cardiac emergencies
- **Airway & Breathing Mastery** (44 cases) - Essential airway skills
- **Stroke & Neuro Foundations** (43 cases) - Neurological basics
- **Multi-System Foundations** (15 cases) - Complex presentations
- **ATLS Mastery** (10 cases) - Trauma assessment

### Specialized Pathways
- **Allergic Emergency Mastery** (3 cases)
- **Endocrine Emergency Mastery** (3 cases)
- **Acute Abdomen Mastery** (2 cases)
- **OB Emergency Foundations** (1 case)
- ... and 7 more specialized pathways

---

## 📊 System Statistics

- **Total Cases**: 189 simulation scenarios
- **Pathways**: 16 learning progressions
- **Categories**: 18 medical systems
- **AI-Enhanced**: 100% of cases researched
- **Overviews Generated**: 189 pre-sim + 189 post-sim
- **Category Coverage**: 100% populated

---

## 🎯 Case Overview Formats

### Pre-Sim Overview (Column J)
**Purpose**: Sell the learning value WITHOUT spoiling the mystery

**Structure** (JSON):
```json
{
  "sbarHandoff": "Clinical handoff (SBAR format)",
  "theStakes": "Why this matters NOW",
  "mysteryHook": "Intrigue without diagnosis",
  "whatYouWillLearn": ["Skill 1", "Skill 2", "Skill 3"],
  "estimatedTime": "5-10 minutes"
}
```

**Philosophy**: Like an escape room preview - inspire curiosity, don't spoil the mystery.

### Post-Sim Overview (Column K)
**Purpose**: Reinforce learning with clinical pearls

**Structure** (JSON):
```json
{
  "victoryHeadline": "🎉 Achievement unlocked",
  "patientStoryAnchor": "Memory aid character description",
  "celebrationOpening": "Celebrate their success",
  "theCriticalPearl": {
    "title": "Key takeaway",
    "content": "Clinical pearl",
    "memoryAid": "Mnemonic"
  },
  "whatYouMastered": ["Skill 1", "Skill 2", "Skill 3"],
  "avoidTheseTraps": ["Common mistake 1", "Common mistake 2"],
  "realWorldImpact": {
    "patientSafety": "How this saves lives",
    "careerProtection": "Litigation prevention",
    "clinicalConfidence": "Expertise building"
  },
  "nextSteps": {
    "inThisPathway": "Next case recommendation",
    "toReinforce": "Practice suggestions"
  },
  "rememberForever": "Ultimate takeaway"
}
```

---

## 🛠️ Categories & Pathways Tool

### Main Menu Options

**📂 Category Management:**
1. View Cases by Medical Category
2. Move Case to Different Category

**🧩 Pathway Management:**
3. View/Edit Pathway Case Sequence
4. Generate Alternative Pathway Names (AI)
5. Analyze Case Fit for Alternative Pathways (AI)
6. Recommend Optimal Case Sequence (AI)
7. Move Case to Different Pathway

**💾 Data Management:**
8. Export Updated Pathway & Category Metadata
9. Exit

### Usage Example
```bash
npm run categories-pathways

# Select Option 4: Generate Alternative Pathway Names
# Choose pathway that needs refinement
# Review 10 AI-generated alternatives
# Select best option
```

---

## 🔍 Validation & Quality

### System Integrity Checks
```bash
npm run validate-system
```

**Validates**:
- All 189 cases have overviews
- Categories match Case_ID prefixes
- Pathways contain expected cases
- JSON structure is valid
- No orphaned or duplicate cases

### Backup Before Major Changes
```bash
# Always backup first
npm run backup-metadata

# Make changes in Categories & Pathways Tool

# If needed, restore
npm run restore-metadata
```

---

## 📈 Analytics Dashboard

```bash
npm run dashboard
```

**Generates**:
- Pathway distribution chart
- Category breakdown
- Complexity vs Priority matrix
- Foundational case percentages
- Coverage gaps analysis

---

## 💡 Common Workflows

### Add New Cases
1. Add row to Google Sheet with all required fields
2. Run `npm run ai-enhanced` to research and classify
3. Run `npm run generate-overviews` to create pre/post-sim
4. Run `npm run sync-overviews` to populate sheet
5. Run `npm run validate-system` to verify

### Reorganize Pathways
1. Run `npm run categories-pathways`
2. Use Option 3 to view current sequence
3. Use Option 6 for AI sequencing recommendations
4. Use Option 7 to move cases between pathways
5. Use Option 8 to export changes

### Refine Pathway Names
1. Run `npm run analyze-pathways` to identify issues
2. Run `npm run categories-pathways`
3. Select Option 4: Generate Alternative Names
4. Review AI suggestions (10 options per pathway)
5. Select best name and export

---

## 🚨 Troubleshooting

### "Category column not found"
```bash
npm run add-category-column
```

### "Overviews file missing"
```bash
npm run generate-overviews
```

### "Auth error accessing Google Sheets"
```bash
npm run auth-google
```

### "System integrity errors"
```bash
# Check what's wrong
npm run validate-system

# Restore from backup if needed
npm run restore-metadata
```

---

## 📚 File Locations

### Data Files
- `/AI_ENHANCED_CASE_ID_MAPPING.json` - Case metadata (237KB)
- `/AI_ENHANCED_PATHWAY_METADATA.json` - Pathway data (53KB)
- `/AI_CASE_OVERVIEWS.json` - Pre/post-sim overviews (840KB)
- `/backups/` - Timestamped backups

### Scripts
- `/scripts/categoriesAndPathwaysTool.cjs` - Interactive tool
- `/scripts/syncOverviewsToSheet.cjs` - Sheet sync
- `/scripts/validateSystemIntegrity.cjs` - Validation
- `/scripts/generateDashboard.cjs` - Analytics

---

## 🎓 Best Practices

### Naming Guidelines
- ✅ Use "Mastery" ONLY for foundational/basics-focused pathways
- ✅ Use clinical/educational language (Foundations, Essentials, Proficiency)
- ❌ DON'T use "Bulletproof" or "Lawsuit" (unless legal medicine/trauma)
- ❌ DON'T use tactical/military language
- ❌ DON'T overuse "Mastery" for advanced pathways

### Category Assignment
- Cases automatically categorized by AI based on clinical content
- Use Categories & Pathways Tool to manually adjust if needed
- Category determines Case_ID prefix (CARD, RESP, etc.)

### Pathway Organization
- Start with foundational concepts (lower complexity, high priority)
- Build progressively (prerequisites before dependent skills)
- Group related clinical pearls together
- End with complex synthesis cases

---

## 📞 Quick Help

**Need to...**
- **Organize cases**: `npm run categories-pathways`
- **Update sheet**: `npm run sync-overviews`
- **Check quality**: `npm run validate-system`
- **See stats**: `npm run dashboard`
- **Fix names**: `npm run analyze-pathways`
- **Backup data**: `npm run backup-metadata`

---

**For detailed documentation, see:**
- `/docs/SIMULATION_CONVERSION_SYSTEM.md`
- `/docs/AI_CASE_OVERVIEWS_SYSTEM.md`
- `/CLAUDE.md` (project guidelines)

---

*Last updated: November 2025 | ER Simulator v1.0*
