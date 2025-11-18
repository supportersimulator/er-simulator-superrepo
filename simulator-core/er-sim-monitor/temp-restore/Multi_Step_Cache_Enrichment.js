/**
 * Multi-Step Cache Enrichment System for AI Pathway Discovery
 *
 * Architecture: 7 independent cache layers that can be enriched progressively
 * Each layer caches a subset of the 26 required fields for AI discovery
 * Layers combine during AI discovery via merger logic
 *
 * Benefits:
 * - No execution timeouts (each layer completes quickly)
 * - Progressive enhancement (AI quality improves as layers cache)
 * - Independent scheduling (cache different layers at different times)
 * - Graceful degradation (works even if some layers missing)
 */

// ============================================================================
// LAYER DEFINITIONS
// ============================================================================

/**
 * Returns field mapping configuration for all 7 cache layers
 */
function getCacheLayerDefinitions_() {
  return {
    basic: {
      sheetName: 'Pathway_Analysis_Cache_Basic',
      fields: {
        caseId: 0,  // Case_Organization_Case_ID
        sparkTitle: 1,  // Case_Organization_Spark_Title
        pathway: 5  // Case_Organization_Pathway_or_Course_Name
      },
      priority: 1,
      estimatedTime: '<1s'
    },

    learning: {
      sheetName: 'Pathway_Analysis_Cache_Learning',
      fields: {
        preSimOverview: 9,  // Case_Organization_Pre_Sim_Overview
        postSimOverview: 10,  // Case_Organization_Post_Sim_Overview
        learningOutcomes: 191,  // CME_and_Educational_Content_CME_Learning_Objective
        learningObjectives: 34  // Set_the_Stage_Context_Educational_Goal
      },
      priority: 2,
      estimatedTime: '~30s',
      truncate: {
        preSimOverview: 300,
        postSimOverview: 300
      }
    },

    metadata: {
      sheetName: 'Pathway_Analysis_Cache_Metadata',
      fields: {
        category: 11,  // Case_Organization_Medical_Category
        difficulty: 6,  // Case_Organization_Difficulty_Level
        setting: 38,  // Set_the_Stage_Context_Environment_Type
        chiefComplaint: 66  // Patient_Demographics_and_Clinical_Data_Presenting_Complaint
      },
      priority: 3,
      estimatedTime: '~5s'
    },

    demographics: {
      sheetName: 'Pathway_Analysis_Cache_Demographics',
      fields: {
        age: 62,  // Patient_Demographics_and_Clinical_Data_Age
        gender: 63,  // Patient_Demographics_and_Clinical_Data_Gender
        patientName: 61  // Patient_Demographics_and_Clinical_Data_Patient_Name
      },
      priority: 4,
      estimatedTime: '~3s'
    },

    vitals: {
      sheetName: 'Pathway_Analysis_Cache_Vitals',
      fields: {
        initialVitals: 55  // Monitor_Vital_Signs_Initial_Vitals (JSON)
      },
      priority: 5,
      estimatedTime: '~15s',
      parseJSON: ['initialVitals'],
      extractFromJSON: {
        initialVitals: ['hr', 'bp.sys', 'bp.dia', 'rr', 'spo2']
      }
    },

    clinical: {
      sheetName: 'Pathway_Analysis_Cache_Clinical',
      fields: {
        examFindings: 73,  // Patient_Demographics_and_Clinical_Data_Exam_Positive_Findings
        medications: 68,  // Patient_Demographics_and_Clinical_Data_Current_Medications
        pastMedicalHistory: 67,  // Patient_Demographics_and_Clinical_Data_Past_Medical_History
        allergies: 69  // Patient_Demographics_and_Clinical_Data_Allergies
      },
      priority: 6,
      estimatedTime: '~10s',
      truncate: {
        examFindings: 200,
        medications: 150,
        pastMedicalHistory: 200
      }
    },

    environment: {
      sheetName: 'Pathway_Analysis_Cache_Environment',
      fields: {
        environmentType: 38,  // Set_the_Stage_Context_Environment_Type
        dispositionPlan: 48,  // Situation_and_Environment_Details_Disposition_Plan
        context: 36  // Set_the_Stage_Context_Clinical_Vignette
      },
      priority: 7,
      estimatedTime: '~8s',
      truncate: {
        context: 300
      }
    }
  };
}


// ============================================================================
// DYNAMIC HEADER RESOLUTION
// ============================================================================

/**
 * Get column index by Tier2 header name with fallback to static index
 *
 * @param {string} tier2Name - The Tier2 header name to search for
 * @param {number} fallbackIndex - Static index to use if header not found
 * @returns {number} Column index
 */
function getColumnIndexByHeader_(tier2Name, fallbackIndex) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Find master sheet
  const masterSheet = ss.getSheets().find(function(sh) {
    return /master.*scenario.*convert/i.test(sh.getName());
  });

  if (!masterSheet) {
    Logger.log(`   ⚠️  Master sheet not found, using fallback index ${fallbackIndex}`);
    return fallbackIndex;
  }

  // Get fresh headers (row 2 = Tier2)
  const data = masterSheet.getDataRange().getValues();
  const tier2Headers = data[1];

  // Search for exact match
  const foundIndex = tier2Headers.indexOf(tier2Name);

  if (foundIndex !== -1) {
    return foundIndex;
  }

  // Not found, use fallback
  Logger.log(`   ⚠️  Header "${tier2Name}" not found, using fallback index ${fallbackIndex}`);
  return fallbackIndex;
}

// ============================================================================
// CORE ENRICHMENT ENGINE
// ============================================================================

/**
 * Enrich a single cache layer with field data
 *
 * @param {string} layerKey - Key from getCacheLayerDefinitions_() (e.g., 'learning')
 * @returns {Object} Result object with success status and metadata
 */
function enrichCacheLayer_(layerKey) {
  const layerDef = getCacheLayerDefinitions_()[layerKey];

  if (!layerDef) {
    throw new Error(`Unknown cache layer: ${layerKey}`);
  }

  Logger.log(`🗄️  [LAYER ${layerDef.priority}/${Object.keys(getCacheLayerDefinitions_()).length}] Enriching ${layerKey} cache...`);
  Logger.log(`   Sheet: ${layerDef.sheetName}`);
  Logger.log(`   Fields: ${Object.keys(layerDef.fields).length}`);
  Logger.log(`   Estimated time: ${layerDef.estimatedTime}`);

  const startTime = new Date().getTime();
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Find master sheet
  const masterSheet = ss.getSheets().find(function(sh) {
    return /master.*scenario.*convert/i.test(sh.properties.title);
  });

  if (!masterSheet) {
    throw new Error('Master Scenario Convert sheet not found');
  }

  Logger.log(`   Reading data from: ${masterSheet.getName()}`);
  const data = masterSheet.getDataRange().getValues();
  const tier2Headers = data[1];

  // Validate field mappings with dynamic header resolution
  const validatedIndices = {};
  Object.keys(layerDef.fields).forEach(function(fieldName) {
    const fallbackIndex = layerDef.fields[fieldName];

    // Resolve column index dynamically from refreshed headers
    let columnIndex;

    if (typeof fallbackIndex === 'number' && fallbackIndex >= 0) {
      // Get the actual tier2 header name for this column
      const tier2Name = tier2Headers[fallbackIndex];

      if (tier2Name) {
        // Use dynamic resolution with fallback
        columnIndex = getColumnIndexByHeader_(tier2Name, fallbackIndex);

        if (columnIndex !== fallbackIndex) {
          Logger.log(`   🔄 Field ${fieldName}: Column moved from ${fallbackIndex} to ${columnIndex} (${tier2Name})`);
        }
      } else {
        columnIndex = fallbackIndex;
      }
    } else {
      Logger.log(`   ⚠️  Invalid column index for field ${fieldName}: ${fallbackIndex}`);
      return;
    }

    if (typeof columnIndex !== 'number' || columnIndex < 0) {
      Logger.log(`   ⚠️  Could not resolve column for field ${fieldName}`);
      return;
    }

    if (columnIndex >= tier2Headers.length) {
      Logger.log(`   ⚠️  Field ${fieldName} index ${columnIndex} out of range (max: ${tier2Headers.length - 1})`);
    } else {
      validatedIndices[fieldName] = columnIndex;
      Logger.log(`   ✅ ${fieldName} → Column ${columnIndex} (${tier2Headers[columnIndex]})`);
    }
  });

  // Extract field data for all cases
  const enrichedCases = [];
  const caseIdIndex = 0;  // Case_Organization_Case_ID always at index 0

  for (let i = 2; i < data.length; i++) {
    const caseId = data[i][caseIdIndex];
    if (!caseId) continue;  // Skip rows without case ID

    const caseData = { caseId: caseId, row: i + 1 };

    Object.keys(validatedIndices).forEach(function(fieldName) {
      const columnIndex = validatedIndices[fieldName];
      let value = data[i][columnIndex] || '';

      // Apply truncation if specified
      if (layerDef.truncate && layerDef.truncate[fieldName]) {
        const maxLength = layerDef.truncate[fieldName];
        if (value.length > maxLength) {
          value = value.substring(0, maxLength);
        }
      }

      // Parse JSON if specified
      if (layerDef.parseJSON && layerDef.parseJSON.indexOf(fieldName) !== -1) {
        try {
          const parsed = JSON.parse(value);

          // Extract nested fields if specified
          if (layerDef.extractFromJSON && layerDef.extractFromJSON[fieldName]) {
            const extractFields = layerDef.extractFromJSON[fieldName];
            extractFields.forEach(function(extractPath) {
              const parts = extractPath.split('.');
              let extractedValue = parsed;

              for (let p = 0; p < parts.length; p++) {
                extractedValue = extractedValue[parts[p]];
                if (extractedValue === undefined) break;
              }

              const extractFieldName = 'initial' + extractPath.charAt(0).toUpperCase() + extractPath.slice(1).replace('.', '');
              caseData[extractFieldName] = extractedValue || '';
            });
          } else {
            caseData[fieldName] = parsed;
          }
        } catch (e) {
          Logger.log(`   ⚠️  Failed to parse JSON for ${fieldName} in case ${caseId}: ${e.message}`);
          caseData[fieldName] = value;  // Store raw value as fallback
        }
      } else {
        caseData[fieldName] = value;
      }
    });

    enrichedCases.push(caseData);
  }

  Logger.log(`   ✅ Enriched ${enrichedCases.length} cases`);

  // Create or update cache sheet
  let cacheSheet = ss.getSheetByName(layerDef.sheetName);

  if (!cacheSheet) {
    Logger.log(`   📄 Creating new cache sheet: ${layerDef.sheetName}`);
    cacheSheet = ss.insertSheet(layerDef.sheetName);
    cacheSheet.setHiddenGridlines(true);
  } else {
    Logger.log(`   📄 Updating existing cache sheet: ${layerDef.sheetName}`);
    cacheSheet.clear();
  }

  // Write cache data: [timestamp, jsonData]
  const cacheData = {
    timestamp: new Date().toISOString(),
    layerKey: layerKey,
    totalCases: enrichedCases.length,
    fields: Object.keys(layerDef.fields),
    allCases: enrichedCases
  };

  cacheSheet.getRange(1, 1).setValue('Timestamp');
  cacheSheet.getRange(1, 2).setValue('Cache Data (JSON)');
  cacheSheet.getRange(2, 1).setValue(new Date());
  cacheSheet.getRange(2, 2).setValue(JSON.stringify(cacheData));

  // Format sheet
  cacheSheet.getRange(1, 1, 1, 2).setFontWeight('bold').setBackground('#4285f4').setFontColor('#ffffff');
  cacheSheet.autoResizeColumns(1, 2);

  const elapsed = new Date().getTime() - startTime;
  Logger.log(`   ⏱️  Completed in ${(elapsed / 1000).toFixed(1)}s`);

  return {
    success: true,
    layerKey: layerKey,
    sheetName: layerDef.sheetName,
    casesEnriched: enrichedCases.length,
    fieldsEnriched: Object.keys(layerDef.fields).length,
    elapsedMs: elapsed
  };
}

/**
 * Enrich all cache layers sequentially
 *
 * @returns {Object} Summary of enrichment results
 */
function enrichAllCacheLayers() {
  const startTime = new Date().getTime();

  // Refresh headers before enrichment (ensures up-to-date column mappings)
  Logger.log('\n🔄 REFRESHING HEADERS\n');
  try {
    if (typeof refreshHeaders === 'function') {
      refreshHeaders();
      Logger.log('✅ Headers refreshed successfully\n');
    } else {
      Logger.log('⚠️  refreshHeaders() function not found, skipping\n');
    }
  } catch (e) {
    Logger.log(`⚠️  Could not refresh headers: ${e.message}\n`);
  }

  const layers = getCacheLayerDefinitions_();
  const results = [];

  Logger.log('\n🚀 STARTING MULTI-LAYER CACHE ENRICHMENT\n');
  Logger.log('═══════════════════════════════════════════════════════════════\n');

  // Sort layers by priority
  const layerKeys = Object.keys(layers).sort(function(a, b) {
    return layers[a].priority - layers[b].priority;
  });

  layerKeys.forEach(function(layerKey) {
    try {
      const result = enrichCacheLayer_(layerKey);
      results.push(result);
      Logger.log('');
    } catch (e) {
      Logger.log(`   ❌ Error enriching ${layerKey}: ${e.message}\n`);
      results.push({
        success: false,
        layerKey: layerKey,
        error: e.message
      });
    }
  });

  const totalElapsed = new Date().getTime() - startTime;
  const successCount = results.filter(function(r) { return r.success; }).length;

  Logger.log('═══════════════════════════════════════════════════════════════');
  Logger.log(`✅ ENRICHMENT COMPLETE: ${successCount}/${results.length} layers successful`);
  Logger.log(`⏱️  Total time: ${(totalElapsed / 1000).toFixed(1)}s\n`);

  return {
    success: successCount === results.length,
    totalLayers: results.length,
    successfulLayers: successCount,
    totalElapsedMs: totalElapsed,
    results: results
  };
}

// ============================================================================
// CACHE READER & MERGER
// ============================================================================

/**
 * Read a single cache layer
 *
 * @param {string} sheetName - Name of cache sheet
 * @returns {Object|null} Cached data or null if not found/stale
 */
function readCacheLayer_(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const cacheSheet = ss.getSheetByName(sheetName);

  if (!cacheSheet) {
    return null;
  }

  try {
    const data = cacheSheet.getDataRange().getValues();

    if (data.length < 2) {
      return null;
    }

    const cachedTimestamp = new Date(data[1][0]);
    const now = new Date();
    const hoursDiff = (now - cachedTimestamp) / (1000 * 60 * 60);

    // 24-hour expiry
    if (hoursDiff >= 24) {
      Logger.log(`⚠️  Cache layer ${sheetName} is stale (${hoursDiff.toFixed(1)}h old)`);
      return null;
    }

    const jsonData = data[1][1];
    const parsed = JSON.parse(jsonData);

    Logger.log(`✅ Cache layer ${sheetName} is fresh (${hoursDiff.toFixed(1)}h old, ${parsed.allCases.length} cases)`);

    return parsed;
  } catch (e) {
    Logger.log(`❌ Error reading cache layer ${sheetName}: ${e.message}`);
    return null;
  }
}

/**
 * Merge all available cache layers into single enriched dataset
 *
 * @returns {Object} Merged cache data with all available fields
 */
function mergeAllCacheLayers_() {
  Logger.log('\n🔀 MERGING CACHE LAYERS\n');
  Logger.log('═══════════════════════════════════════════════════════════════\n');

  const layers = getCacheLayerDefinitions_();
  const mergedByCase = {};

  // Sort layers by priority
  const layerKeys = Object.keys(layers).sort(function(a, b) {
    return layers[a].priority - layers[b].priority;
  });

  let totalLayersFound = 0;
  let totalFieldsAvailable = 0;

  layerKeys.forEach(function(layerKey) {
    const layerDef = layers[layerKey];
    const cacheData = readCacheLayer_(layerDef.sheetName);

    if (cacheData && cacheData.allCases) {
      totalLayersFound++;
      Logger.log(`📦 Layer ${layerDef.priority}: ${layerKey} (${cacheData.allCases.length} cases, ${Object.keys(layerDef.fields).length} fields)`);

      cacheData.allCases.forEach(function(caseData) {
        if (!mergedByCase[caseData.caseId]) {
          mergedByCase[caseData.caseId] = {};
        }

        // Merge fields (later layers override earlier ones if conflict)
        Object.keys(caseData).forEach(function(key) {
          mergedByCase[caseData.caseId][key] = caseData[key];
        });
      });

      totalFieldsAvailable += Object.keys(layerDef.fields).length;
    } else {
      Logger.log(`⏭️  Layer ${layerDef.priority}: ${layerKey} - not cached or stale`);
    }
  });

  const mergedCases = Object.values(mergedByCase);
  const fieldsPerCase = mergedCases.length > 0 ? Object.keys(mergedCases[0]).length : 0;

  Logger.log('\n═══════════════════════════════════════════════════════════════');
  Logger.log(`✅ MERGE COMPLETE:`);
  Logger.log(`   Layers merged: ${totalLayersFound}/${layerKeys.length}`);
  Logger.log(`   Total cases: ${mergedCases.length}`);
  Logger.log(`   Fields per case: ${fieldsPerCase}`);
  Logger.log(`   Field coverage: ${Math.round((fieldsPerCase / 26) * 100)}% of 26 required fields\n`);

  return {
    allCases: mergedCases,
    layersMerged: totalLayersFound,
    totalCases: mergedCases.length,
    fieldsPerCase: fieldsPerCase
  };
}

// ============================================================================
// MODIFIED analyzeCatalog_() WITH MULTI-LAYER SUPPORT
// ============================================================================

/**
 * Get case catalog for AI discovery with multi-layer cache support
 *
 * TIER 1: Try merged multi-layer cache
 * TIER 2: Try basic cache only
 * TIER 3: Fresh lightweight analysis
 */
function analyzeCatalogWithMultiLayerCache_() {
  Logger.log('\n🔍 ANALYZING CATALOG (Multi-Layer Cache Enabled)\n');
  Logger.log('═══════════════════════════════════════════════════════════════\n');

  // TIER 1: Try merged multi-layer cache first
  const mergedCache = mergeAllCacheLayers_();

  if (mergedCache && mergedCache.allCases && mergedCache.allCases.length > 0) {
    const fieldCount = mergedCache.fieldsPerCase;
    Logger.log(`✅ Using merged cache (${mergedCache.allCases.length} cases, ${fieldCount} fields per case)\n`);

    if (fieldCount < 10) {
      Logger.log(`⚠️  WARNING: Only ${fieldCount} fields available - consider running more cache enrichment layers\n`);
    }

    return mergedCache;
  }

  // TIER 2: Try basic cache only (fallback)
  const basicCache = readCacheLayer_('Pathway_Analysis_Cache_Basic');

  if (basicCache && basicCache.allCases && basicCache.allCases.length > 0) {
    Logger.log(`⚠️  Using basic cache only (${basicCache.allCases.length} cases, 3 fields)`);
    Logger.log('   Consider running progressive enrichment for better AI discovery results\n');
    return basicCache;
  }

  // TIER 3: Fresh lightweight analysis (original fallback)
  Logger.log('📊 No cache available - running fresh lightweight analysis\n');
  return performLightweightAnalysis_();
}

/**
 * Lightweight analysis fallback (simplified version of original)
 */
function performLightweightAnalysis_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheets().find(function(sh) {
    return /master.*scenario.*convert/i.test(sh.getName());
  }) || ss.getActiveSheet();

  const data = sheet.getDataRange().getValues();
  const headers = data[1];

  const caseIdIdx = 0;
  const sparkIdx = 1;
  const pathwayIdx = 5;

  const allCases = [];
  for (let i = 2; i < data.length; i++) {
    allCases.push({
      caseId: data[i][caseIdIdx] || '',
      sparkTitle: data[i][sparkIdx] || '',
      pathway: data[i][pathwayIdx] || ''
    });
  }

  return { allCases: allCases };
}
