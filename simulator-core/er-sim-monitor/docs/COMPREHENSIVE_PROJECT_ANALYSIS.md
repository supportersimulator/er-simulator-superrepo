# COMPREHENSIVE MICROSERVICES ARCHITECTURE ANALYSIS

Generated: 11/6/2025, 10:44:09 AM

## Project Inventory


### TEST Integration (Project #2)
- **ID**: 1HIw4Ok4G88YzHsECb5e_GvJH9XYefEY59pHXalFstiddLciyHXC06zNf
- **Purpose**: Integration test + active working environment
- **Has Menu**: YES (in Code.gs)
- **Files**: 3
  - Code.gs (42 KB)
  - Categories_Pathways_Feature_Phase2.gs (49 KB)
  - ATSR_Title_Generator_Feature.gs (42 KB)
- **Total Functions**: 68


### Pathways Panel (Project #4)
- **ID**: 1kkPZU3GsCCuu5IhTEOufmDT1Cb2rSQVB3Y3u1DPf87yoSV4WVtoNvd6i
- **Purpose**: Categories/Pathways + cache isolation
- **Has Menu**: NO
- **Files**: 2
  - Categories_Pathways_Feature_Phase2.gs (118 KB)
  - Multi_Step_Cache_Enrichment.gs (19 KB)
- **Total Functions**: 80


### ATSR Panel (Project #5)
- **ID**: 1KBkujOTXGDmmhWOFm-ifxoMjXM5pRwwM5FpFBtPWK8eoE99fr4lla1OE
- **Purpose**: ATSR title generation isolation
- **Has Menu**: NO
- **Files**: 3
  - ATSR_Title_Generator_Feature.gs (26 KB)
  - Batch_Processing_Sidebar_Feature.gs (19 KB)
  - Core_Processing_Engine.gs (23 KB)
- **Total Functions**: 41


## Key Function Locations

### preCacheRichData()
- Found in: TEST Integration (Project #2), Pathways Panel (Project #4)
- ⚠️ **DUPLICATED** across multiple projects

### showFieldSelector()
- Found in: TEST Integration (Project #2)


### runPathwayChainBuilder()
- Found in: Pathways Panel (Project #4)


### getRecommendedFields_()
- Found in: TEST Integration (Project #2)


### readApiKey_()
- Found in: TEST Integration (Project #2), ATSR Panel (Project #5)
- ⚠️ **DUPLICATED** across multiple projects

### processOneInputRow_()
- Found in: ATSR Panel (Project #5)



## Current Architecture Issues

1. **Menu Location**: Currently in TEST Integration (Project #2)
2. **Function Duplication**: Multiple projects contain the same functions
3. **Incomplete Isolation**: ATSR Panel contains batch processing code
4. **No Batch Panel**: Batch processing not yet isolated into Project #6

## Recommended Next Steps

1. Verify menu location and functionality
2. Create/update CentralOrchestration structure
3. Extract and isolate ATSR-only functions
4. Create dedicated Batch Processing Panel
5. Remove duplicated code across projects
6. Test each isolated panel independently
