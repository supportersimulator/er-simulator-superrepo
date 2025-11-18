# Apps Script Project URLs Reference

**Date Created**: November 6, 2025
**Purpose**: Quick access links to all active Apps Script projects

---

## 🔗 Active Project URLs

### 1. Core Batch Processing & Quality Engine
**URL**: https://script.google.com/home/projects/1Bkbm2MNA-YmXQEoMsIlC-VgEgHiQHO2EuMXR-yyxy9lYWl3eNcEHk_S-/edit
**Project ID**: `1Bkbm2MNA-YmXQEoMsIlC-VgEgHiQHO2EuMXR-yyxy9lYWl3eNcEHk_S-`

**Contains**:
- ✅ Batch Engine (Run All / 25 / Specific rows)
- ✅ Quality Scoring & Audit System
- ✅ Settings Management
- ✅ Image Sync Defaults
- ✅ Dark UI Sidebar
- ✅ Clinical Defaults Application
- ❌ NO ATSR code (use Title Optimizer instead)
- ❌ NO Pathways code (use Advanced Cache System instead)

**Key Functions**:
- `startBatchFromSidebar()` - Main batch processor
- `runSingleStepBatch()` - Single row processor
- `calculateQualityScore()` - Quality scoring engine
- `applyImageSyncDefaults()` - Image synchronization

---

### 2. Title Optimizer (ATSR)
**URL**: https://script.google.com/u/0/home/projects/1HIw4Ok4G88YzHsECb5e_GvJH9XYefEY59pHXalFstiddLciyHXC06zNf/edit
**Project ID**: `1HIw4Ok4G88YzHsECb5e_GvJH9XYefEY59pHXalFstiddLciyHXC06zNf`

**Contains**:
- ✅ Complete ATSR Title Generator
- ✅ Spark/Reveal title generation
- ✅ Mystery regeneration system
- ✅ Memory Anchor tracking

**Key Functions**:
- `runATSRTitleGenerator()` - Main ATSR workflow
- `generateMysteriousSparkTitles()` - Mystery regeneration
- `saveATSRData()` - Save title selections

---

### 3. Advanced Cache System
**URL**: https://script.google.com/u/0/home/projects/1kkPZU3GsCCuu5IhTEOufmDT1Cb2rSQVB3Y3u1DPf87yoSV4WVtoNvd6i/edit
**Project ID**: `1kkPZU3GsCCuu5IhTEOufmDT1Cb2rSQVB3Y3u1DPf87yoSV4WVtoNvd6i`

**Contains**:
- ✅ Pathways & Categories Panel
- ✅ Multi-Step Cache Enrichment (7 layers)
- ✅ Pre-Cache functionality
- ✅ Field Selector with AI recommendations

**Key Functions**:
- `getCacheLayerDefinitions_()` - Defines 7 cache layers
- `enrichCacheLayer_(layer)` - Populates cache layer
- `analyzeCatalogWithMultiLayerCache_()` - 3-tier fallback strategy
- `runPathwayChainBuilder()` - AI pathway discovery

---

### 4. GPT Formatter (Production Monolithic)
**URL**: https://script.google.com/u/0/home/projects/1orJ__UUViG-gdSOHXt2VSGzo--ASib9XdVLVCApccKujWnqTuxq7wHIw/edit
**Project ID**: `1orJ__UUViG-gdSOHXt2VSGzo--ASib9XdVLVCApccKujWnqTuxq7wHIw`

**Contains**:
- ✅ Original monolithic baseline (Code.gs - 133 KB)
- All features in one file (reference implementation)
- 🔴 **BOUND TO MAIN PRODUCTION CSV** (not test environment)

**Purpose**:
- Production data processing for main CSV
- Historical reference and comparison baseline
- Fallback if microservices have issues

**⚠️ IMPORTANT**: This is connected to your MAIN production spreadsheet, not the test environment. Handle with care!

---

## 📦 Quick Access Dashboard

**Apps Script Home**: https://script.google.com/home

**Backup Locations**:
- **Google Drive Backup**: https://drive.google.com/drive/folders/13WO4iP-iaNFZH8n1pJlCsRPjfjjqSt-I
- **Local Backup**: `/Users/aarontjomsland/er-sim-monitor/backups/all-projects-2025-11-06/`

---

## 🔄 Update Instructions

When you get URLs for the other projects, update this file:

1. Open this file: `/Users/aarontjomsland/er-sim-monitor/docs/APPS_SCRIPT_PROJECT_URLS.md`
2. Add the URLs and Project IDs under each section
3. Save the file
4. Optionally push to GitHub for sync with GPT-5

---

## 🎯 Project Purposes Summary

| Project | Primary Function | Use When |
|---------|------------------|----------|
| **Core Batch Processing** | Process rows, score quality | Running simulations through workflow |
| **Title Optimizer** | Generate Spark/Reveal titles | Creating engaging case titles |
| **Advanced Cache System** | Pathway discovery | Building clinical pathways + categories |
| **GPT Formatter** | Reference baseline | Comparing with original implementation |

---

**Last Updated**: November 6, 2025
**Maintained By**: Aaron Tjomsland + Claude Code
