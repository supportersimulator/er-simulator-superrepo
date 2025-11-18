/**
 * Categories & Pathways - Phase 2: Interactive Pathway Chain Builder
 *
 * Holistic AI-powered pathway design system with:
 * - Bird's eye view of entire case library
 * - Pre-computed holistic analysis (cached)
 * - Horizontal chain builder UI
 * - Alternative selection with prominence system
 * - AI rationale generation
 * - Drag-and-drop reordering
 * - Pathway persistence
 *
 * Phase 2A: Holistic Analysis Engine + Bird's Eye View
 */

// ========== HELPER FUNCTIONS ==========

function getSafeUi_() {
  try {
    return SpreadsheetApp.getUi();
  } catch (e) {
    return null;
  }
}

function pickMasterSheet_() {
  const ss = SpreadsheetApp.getActive();
  // Prefer sheet named like Master Scenario CSV
  const m = ss.getSheets().find(function(sh) {
    return /master scenario csv/i.test(sh.getName());
  });
  return m || ss.getActiveSheet();
}

// ========== DYNAMIC HEADER RESOLUTION ==========

/**
 * Refresh header mappings and cache them in document properties
 * Call this at the start of any discovery/analysis function to ensure
 * column indices are current even if columns have been inserted/deleted
 */
function refreshHeaders() {
  Logger.log('🔄 Refreshing header mappings...');

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = pickMasterSheet_();

  if (!sheet) {
    Logger.log('⚠️  Could not find Master sheet for header refresh');
    return null;
  }

  // Get headers from row 2 (Tier2)
  const data = sheet.getDataRange().getValues();

  if (data.length < 2) {
    Logger.log('⚠️  Sheet does not have header rows');
    return null;
  }

  const tier2Headers = data[1];

  // Create mapping object: headerName -> columnIndex
  const headerMap = {};
  tier2Headers.forEach(function(header, index) {
    if (header && typeof header === 'string' && header.trim()) {
      headerMap[header.trim()] = index;
    }
  });

  // Cache in document properties
  const props = PropertiesService.getDocumentProperties();
  props.setProperty('CACHED_HEADER2', JSON.stringify({
    timestamp: new Date().toISOString(),
    headers: tier2Headers,
    map: headerMap,
    totalColumns: tier2Headers.length
  }));

  Logger.log(`✅ Refreshed ${Object.keys(headerMap).length} header mappings`);

  return {
    headers: tier2Headers,
    map: headerMap,
    totalColumns: tier2Headers.length
  };
}

/**
 * Get column index by header name with fallback to static index
 * Uses cached header mappings from refreshHeaders()
 *
 * @param {string} headerName - The Tier2 header name to look up
 * @param {number} fallbackIndex - Fallback index if header not found
 * @returns {number} Column index
 */
function getColumnIndexByHeader_(headerName, fallbackIndex) {
  // Try to get cached header map
  const props = PropertiesService.getDocumentProperties();
  const cachedJson = props.getProperty('CACHED_HEADER2');

  if (cachedJson) {
    try {
      const cached = JSON.parse(cachedJson);

      // Check if header exists in map
      if (cached.map && cached.map[headerName] !== undefined) {
        const index = cached.map[headerName];

        // Log if column moved
        if (index !== fallbackIndex) {
          Logger.log(`   🔄 Header "${headerName}" moved: ${fallbackIndex} → ${index}`);
        }

        return index;
      }
    } catch (e) {
      Logger.log(`⚠️  Could not parse cached headers: ${e.message}`);
    }
  }

  // Fallback: use static index
  Logger.log(`   ⚠️  Header "${headerName}" not found in cache, using fallback index ${fallbackIndex}`);
  return fallbackIndex;
}

/**
 * Get multiple column indices with dynamic resolution
 *
 * @param {Object} fieldMap - Object mapping field names to header names and fallback indices
 *   Example: { caseId: { header: 'Case_Organization_Case_ID', fallback: 0 } }
 * @returns {Object} Object mapping field names to resolved column indices
 */
function resolveColumnIndices_(fieldMap) {
  const resolved = {};

  Object.keys(fieldMap).forEach(function(fieldName) {
    const config = fieldMap[fieldName];
    resolved[fieldName] = getColumnIndexByHeader_(config.header, config.fallback);
  });

  return resolved;
}



// ========== MAIN PANEL LAUNCHER ==========

function runPathwayChainBuilder() {
  const ui = getSafeUi_();
  if (!ui) {
    Logger.log('No UI context available');
    return;
  }

  try {
    // Get or create holistic analysis (cached)
    const analysis = getOrCreateHolisticAnalysis_();

    const html = buildBirdEyeViewUI_(analysis);
    const htmlOutput = HtmlService.createHtmlOutput(html)
      .setWidth(1920)
      .setHeight(1000);

    ui.showModalDialog(htmlOutput, '🧩 Pathway Chain Builder - AI-Powered Design System');
  } catch (error) {
    ui.alert('Error loading Pathway Chain Builder: ' + error.toString());
    Logger.log('Pathway Chain Builder Error: ' + error.toString());
  }
}

// ========== HOLISTIC ANALYSIS ENGINE ==========

function getOrCreateHolisticAnalysis_(forceRefresh) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let cacheSheet = ss.getSheetByName('Pathway_Analysis_Cache');

  // Create cache sheet if doesn't exist
  if (!cacheSheet) {
    cacheSheet = ss.insertSheet('Pathway_Analysis_Cache');
    cacheSheet.hideSheet();
    cacheSheet.appendRow(['timestamp', 'analysis_json']);
  }

  // Check if we have cached analysis (less than 24 hours old)
  const data = cacheSheet.getDataRange().getValues();
  if (!forceRefresh && data.length > 1) {
    const cachedTimestamp = new Date(data[1][0]);
    const now = new Date();
    const hoursDiff = (now - cachedTimestamp) / (1000 * 60 * 60);

    if (hoursDiff < 24) {
      // Use cached analysis
      Logger.log('Using cached holistic analysis (' + hoursDiff.toFixed(1) + ' hours old)');
      return JSON.parse(data[1][1]);
    }
  }

  // Refresh headers before generating fresh analysis
  Logger.log('');
  Logger.log('╔═══════════════════════════════════════════════════════════════╗');
  Logger.log('║           🔄 PHASE 1: REFRESHING HEADER CACHE                ║');
  Logger.log('╚═══════════════════════════════════════════════════════════════╝');
  Logger.log('');
  Logger.log('🎯 Purpose: Map all 23-26 column indices dynamically');
  Logger.log('🔑 Cache Key: CACHED_HEADER2');
  Logger.log('');
  try {
    refreshHeaders();
    Logger.log('✅ PHASE 1 COMPLETE: Headers refreshed successfully');
  } catch (e) {
    Logger.log('❌ PHASE 1 FAILED: Could not refresh headers');
    Logger.log('⚠️  Error: ' + e.message);
  }
  Logger.log('');

  // Generate fresh analysis
  Logger.log('Generating fresh holistic analysis...');
  const analysis = performHolisticAnalysis_();

  // Cache the results
  if (data.length > 1) {
    // Update existing row
    cacheSheet.getRange(2, 1, 1, 2).setValues([
      [new Date(), JSON.stringify(analysis)]
    ]);
  } else {
    // Create new row
    cacheSheet.appendRow([new Date(), JSON.stringify(analysis)]);
  }

  return analysis;
}

function performHolisticAnalysis_() {
  const sheet = pickMasterSheet_();
  const data = sheet.getDataRange().getValues();

  // Defensive: Ensure we have enough rows
  if (!data || data.length < 3) {
    throw new Error('Sheet does not have enough data rows');
  }

  // Row 2 (index 1) contains the flattened merged headers like "Case_Organization_Case_ID"
  const rawHeaders = data[1];

  // Defensive: Ensure headers exist and is an array
  if (!rawHeaders || !Array.isArray(rawHeaders)) {
    throw new Error('Could not find valid header row at row 2 (index 1)');
  }

  // Trim all headers to remove whitespace
  const headers = rawHeaders.map(function(h) {
    return typeof h === 'string' ? h.trim() : h;
  });

  // Get column indices using dynamic resolution
  const fieldMap = {
    caseId: { header: 'Case_Organization_Case_ID', fallback: 0 },
    spark: { header: 'Case_Organization_Spark_Title', fallback: 1 },
    pathway: { header: 'Case_Organization_Pathway_or_Course_Name', fallback: 5 },
    diagnosis: { header: 'Case_Orientation_Chief_Diagnosis', fallback: 7 },
    learningOutcomes: { header: 'Case_Orientation_Actual_Learning_Outcomes', fallback: 8 }
  };

  const indices = resolveColumnIndices_(fieldMap);
  const caseIdIdx = indices.caseId;
  const sparkIdx = indices.spark;
  const pathwayIdx = indices.pathway;
  const diagnosisIdx = indices.diagnosis;
  const learningOutcomesIdx = indices.learningOutcomes;

  // Try to find a category column - it might have a different name
  let categoryIdx = headers.indexOf('Case_Organization_Category');
  if (categoryIdx === -1) {
    // Look for any column with "category" in it
    for (let i = 0; i < headers.length; i++) {
      if (headers[i] && headers[i].toString().toUpperCase().indexOf('CATEGORY') !== -1) {
        categoryIdx = i;
        break;
      }
    }
  }

  // Defensive: Check if critical columns were found
  if (caseIdIdx === -1 || sparkIdx === -1) {
    throw new Error('Could not find required columns. Looking for Case_Organization_Case_ID, Case_Organization_Spark_Title. Found headers: ' + headers.slice(0, 15).join(', ') + '. CaseID idx: ' + caseIdIdx + ', Spark idx: ' + sparkIdx + ', Category idx: ' + categoryIdx);
  }

  // Collect all cases with full metadata
  const allCases = [];
  const systemDistribution = {};
  const pathwayDistribution = {};
  let unassignedCount = 0;

  // Data starts at row 3 (index 2) since row 1 is tier1, row 2 is merged headers
  for (let i = 2; i < data.length; i++) {
    const caseItem = {
      row: i + 1,
      caseId: data[i][caseIdIdx] || '',
      sparkTitle: data[i][sparkIdx] || '',
      category: data[i][categoryIdx] || '',
      pathway: data[i][pathwayIdx] || '',
      diagnosis: data[i][diagnosisIdx] || '',
      learningOutcomes: data[i][learningOutcomesIdx] || ''
    };

    allCases.push(caseItem);

    // Track system distribution
    const system = extractPrimarySystem_(caseItem.category);
    systemDistribution[system] = (systemDistribution[system] || 0) + 1;

    // Track pathway assignment
    if (caseItem.pathway && caseItem.pathway.trim() !== '') {
      pathwayDistribution[caseItem.pathway] = (pathwayDistribution[caseItem.pathway] || 0) + 1;
    } else {
      unassignedCount++;
    }
  }

  // Identify high-value pathway opportunities
  const pathwayOpportunities = identifyPathwayOpportunities_(allCases, systemDistribution);

  // Generate insights
  const insights = generateHolisticInsights_(allCases, systemDistribution, pathwayDistribution, unassignedCount);

  return {
    timestamp: new Date().toISOString(),
    totalCases: allCases.length,
    systemDistribution: systemDistribution,
    pathwayDistribution: pathwayDistribution,
    unassignedCount: unassignedCount,
    topPathways: pathwayOpportunities,
    insights: insights,
    batchMetadata: {
      totalBatches: Math.ceil(allCases.length / 25),
      casesPerBatch: 25,
      note: 'Detailed case data cached separately in 25-row batches'
    }
    // allCases removed to avoid 50K character limit
  };
}

function extractPrimarySystem_(category) {
  const systems = ['CARD', 'RESP', 'NEUR', 'GI', 'ENDO', 'RENAL', 'ORTHO', 'PSYCH', 'SKIN'];
  const catUpper = category.toUpperCase();

  for (let i = 0; i < systems.length; i++) {
    if (catUpper.indexOf(systems[i]) !== -1) {
      return systems[i];
    }
  }

  return 'OTHER';
}

function identifyPathwayOpportunities_(cases, systemDist) {
  const opportunities = [];

  // ACLS Pathway Opportunity
  const aclsCases = cases.filter(function(c) {
    const combined = (c.sparkTitle + ' ' + c.diagnosis + ' ' + c.category).toUpperCase();
    return combined.indexOf('CARDIAC') !== -1 ||
           combined.indexOf('ARREST') !== -1 ||
           combined.indexOf('ARRHYTHMIA') !== -1 ||
           combined.indexOf('VTACH') !== -1 ||
           combined.indexOf('VFIB') !== -1 ||
           combined.indexOf('AFIB') !== -1;
  });

  if (aclsCases.length >= 5) {
    opportunities.push({
      id: 'acls_protocol_001',
      name: 'ACLS Protocol Series',
      logicType: 'protocol',
      icon: '💓',
      confidence: aclsCases.length >= 12 ? 0.95 : 0.75,
      caseCount: aclsCases.length,
      rationale: 'Strong concentration of cardiac arrest and arrhythmia cases with clear ACLS protocol applications',
      suggestedCases: aclsCases.slice(0, 12).map(function(c) { return c.caseId; })
    });
  }

  // Cardiovascular System Pathway
  if (systemDist['CARD'] && systemDist['CARD'] >= 8) {
    opportunities.push({
      id: 'card_system_001',
      name: 'Cardiovascular System Mastery',
      logicType: 'system',
      icon: '❤️',
      confidence: 0.90,
      caseCount: systemDist['CARD'],
      rationale: 'Sufficient cardiac cases to build comprehensive system-based learning pathway',
      suggestedCases: cases.filter(function(c) { return c.category.toUpperCase().indexOf('CARD') !== -1; })
                           .slice(0, 12)
                           .map(function(c) { return c.caseId; })
    });
  }

  // Respiratory System Pathway
  if (systemDist['RESP'] && systemDist['RESP'] >= 8) {
    opportunities.push({
      id: 'resp_system_001',
      name: 'Respiratory System Mastery',
      logicType: 'system',
      icon: '🫁',
      confidence: 0.88,
      caseCount: systemDist['RESP'],
      rationale: 'Strong respiratory case collection for airway management and ventilation training',
      suggestedCases: cases.filter(function(c) { return c.category.toUpperCase().indexOf('RESP') !== -1; })
                           .slice(0, 12)
                           .map(function(c) { return c.caseId; })
    });
  }

  // Pediatric Pathway
  const pedsCases = cases.filter(function(c) {
    const combined = (c.sparkTitle + ' ' + c.diagnosis + ' ' + c.category).toUpperCase();
    return combined.indexOf('PEDIATRIC') !== -1 ||
           combined.indexOf('CHILD') !== -1 ||
           combined.indexOf('INFANT') !== -1 ||
           combined.indexOf('PEDS') !== -1;
  });

  if (pedsCases.length >= 5) {
    opportunities.push({
      id: 'peds_specialty_001',
      name: 'Pediatric Emergency Medicine',
      logicType: 'specialty',
      icon: '🧸',
      confidence: pedsCases.length >= 10 ? 0.85 : 0.70,
      caseCount: pedsCases.length,
      rationale: 'Pediatric cases suitable for PALS and age-specific emergency training',
      suggestedCases: pedsCases.slice(0, 12).map(function(c) { return c.caseId; })
    });
  }

  // Sort by confidence
  opportunities.sort(function(a, b) { return b.confidence - a.confidence; });

  return opportunities.slice(0, 6); // Top 6 opportunities
}

function generateHolisticInsights_(cases, systemDist, pathwayDist, unassignedCount) {
  const insights = [];

  // Insight 1: Top system
  const topSystem = Object.keys(systemDist).reduce(function(a, b) {
    return systemDist[a] > systemDist[b] ? a : b;
  });
  insights.push(systemDist[topSystem] + ' ' + topSystem + ' cases form largest system group - strong pathway potential');

  // Insight 2: Unassigned cases
  if (unassignedCount > 0) {
    const pct = ((unassignedCount / cases.length) * 100).toFixed(0);
    insights.push(unassignedCount + ' cases unassigned (' + pct + '%) - opportunity to create new pathways');
  }

  // Insight 3: Protocol opportunities
  const aclsCount = cases.filter(function(c) {
    return (c.sparkTitle + c.diagnosis).toUpperCase().indexOf('CARDIAC') !== -1;
  }).length;

  if (aclsCount >= 8) {
    insights.push('Strong ACLS pathway opportunity with ' + aclsCount + ' cardiac cases');
  }

  // Insight 4: Complexity balance
  const simpleCount = cases.filter(function(c) { return c.diagnosis.length <= 25; }).length;
  const complexCount = cases.filter(function(c) { return c.diagnosis.length > 50; }).length;
  const simplePct = ((simpleCount / cases.length) * 100).toFixed(0);
  const complexPct = ((complexCount / cases.length) * 100).toFixed(0);

  insights.push('Case complexity: ' + simplePct + '% foundational, ' + complexPct + '% advanced - good balance for progression pathways');

  // Insight 5: Multi-system cases
  const multiSystemCount = cases.filter(function(c) {
    return c.category.indexOf(',') !== -1 || c.category.indexOf('/') !== -1;
  }).length;

  if (multiSystemCount > 5) {
    insights.push(multiSystemCount + ' multi-system cases identified - consider complexity-based pathway');
  }

  return insights;
}
/**
 * Cache detailed case data in batches of 25 rows
 * This avoids the 50,000 character limit per property
 */
function cacheDetailedCaseBatches_() {
  const BATCH_SIZE = 25;
  const sheet = pickMasterSheet_();
  const data = sheet.getDataRange().getValues();
  const headers = data[1]; // Row 2 = Tier2 headers

  // Resolve column indices dynamically
  const fieldMap = {
    caseId: { header: 'Case_Organization_Case_ID', fallback: 0 },
    spark: { header: 'Case_Organization_Spark_Title', fallback: 1 },
    category: { header: 'Case_Organization_Category', fallback: 2 },
    pathway: { header: 'Case_Organization_Pathway_or_Course_Name', fallback: 5 },
    diagnosis: { header: 'Case_Orientation_Chief_Diagnosis', fallback: 7 },
    learningOutcomes: { header: 'Case_Orientation_Actual_Learning_Outcomes', fallback: 8 }
  };

  const indices = resolveColumnIndices_(fieldMap);

  const totalRows = data.length - 2; // Minus header rows
  const totalBatches = Math.ceil(totalRows / BATCH_SIZE);

  Logger.log('');
  Logger.log('╔═══════════════════════════════════════════════════════════════╗');
  Logger.log('║            📦 BATCH CACHING DETAILED CASE DATA               ║');
  Logger.log('╚═══════════════════════════════════════════════════════════════╝');
  Logger.log('');
  Logger.log('🎯 Configuration:');
  Logger.log('   • Total Cases: ' + totalRows);
  Logger.log('   • Total Batches: ' + totalBatches);
  Logger.log('   • Cases per Batch: ' + BATCH_SIZE);
  Logger.log('   • Character Limit: 50,000 per batch');
  Logger.log('   • Expected Size: ~' + Math.round((totalRows / BATCH_SIZE) * 4) + ' KB total');
  Logger.log('');

  const props = PropertiesService.getScriptProperties();

  // Clear old batches first
  clearOldCaseBatches_();

  for (let batchNum = 0; batchNum < totalBatches; batchNum++) {
    const batchStartTime = new Date();
    const startRow = 2 + (batchNum * BATCH_SIZE); // Data starts at row 3 (index 2)
    const endRow = Math.min(startRow + BATCH_SIZE, data.length);

    Logger.log('');
    Logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    Logger.log('📦 BATCH ' + (batchNum + 1) + '/' + totalBatches);
    Logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    Logger.log('📍 Row Range: ' + (startRow + 1) + ' → ' + endRow);
    Logger.log('⏱️  Start Time: ' + batchStartTime.toISOString());

    const batchCases = [];
    for (let i = startRow; i < endRow; i++) {
      const caseData = {
        row: i + 1,
        caseId: data[i][indices.caseId] || '',
        sparkTitle: data[i][indices.spark] || '',
        category: data[i][indices.category] || '',
        pathway: data[i][indices.pathway] || '',
        diagnosis: data[i][indices.diagnosis] || '',
        learningOutcomes: data[i][indices.learningOutcomes] || ''
      };
      batchCases.push(caseData);

      // Log first and last case of each batch for verification
      if (i === startRow || i === endRow - 1) {
        Logger.log('   ' + (i === startRow ? '⬆️  First' : '⬇️  Last') + ' case: ' + caseData.caseId + ' - ' + caseData.sparkTitle.substring(0, 40));
      }
    }

    // Cache this batch
    const batchKey = 'CASE_BATCH_' + batchNum;
    const batchJson = JSON.stringify(batchCases);
    const batchSize = batchJson.length;

    Logger.log('📏 Batch Size: ' + batchCases.length + ' cases');
    Logger.log('💾 JSON Size: ' + batchSize + ' characters (' + Math.round(batchSize / 1024) + ' KB)');

    if (batchSize > 50000) {
      Logger.log('⚠️  WARNING: Batch exceeds 50K limit! (' + batchSize + ' chars)');
      Logger.log('   Consider reducing BATCH_SIZE below 25');
    } else if (batchSize > 40000) {
      Logger.log('⚠️  CAUTION: Batch approaching limit (' + batchSize + '/50000 chars)');
    } else {
      Logger.log('✅ Size OK: ' + Math.round((batchSize / 50000) * 100) + '% of limit');
    }

    props.setProperty(batchKey, batchJson);

    const batchEndTime = new Date();
    const batchDuration = batchEndTime - batchStartTime;

    Logger.log('🔑 Cache Key: ' + batchKey);
    Logger.log('⏱️  Duration: ' + batchDuration + 'ms');
    Logger.log('✅ BATCH ' + (batchNum + 1) + '/' + totalBatches + ' CACHED SUCCESSFULLY');

    // Progress indicator
    const percentComplete = Math.round(((batchNum + 1) / totalBatches) * 100);
    const progressBar = '█'.repeat(Math.floor(percentComplete / 5)) + '░'.repeat(20 - Math.floor(percentComplete / 5));
    Logger.log('📊 Progress: [' + progressBar + '] ' + percentComplete + '%');
  }

  // Store batch metadata
  props.setProperty('CASE_BATCH_METADATA', JSON.stringify({
    totalBatches: totalBatches,
    batchSize: BATCH_SIZE,
    totalCases: totalRows,
    timestamp: new Date().toISOString()
  }));

  Logger.log('');
  Logger.log('╔═══════════════════════════════════════════════════════════════╗');
  Logger.log('║                  🎉 BATCH CACHING COMPLETE                   ║');
  Logger.log('╚═══════════════════════════════════════════════════════════════╝');
  Logger.log('');
  Logger.log('📊 Summary:');
  Logger.log('   ✅ Total Cases Cached: ' + totalRows);
  Logger.log('   ✅ Total Batches: ' + totalBatches);
  Logger.log('   ✅ Batch Size: ' + BATCH_SIZE + ' cases per batch');
  Logger.log('   ✅ Cache Keys: CASE_BATCH_0 through CASE_BATCH_' + (totalBatches - 1));
  Logger.log('');
  Logger.log('🔍 To retrieve data:');
  Logger.log('   • All cases: getAllCasesFromBatchCache_()');
  Logger.log('   • Single batch: getCasesFromBatch_(batchNumber)');
  Logger.log('   • Metadata: PropertiesService.getScriptProperties().getProperty("CASE_BATCH_METADATA")');
  Logger.log('');

  return {
    totalBatches: totalBatches,
    totalCases: totalRows,
    batchSize: BATCH_SIZE
  };
}

/**
 * Clear old case batch caches
 */
function clearOldCaseBatches_() {
  const props = PropertiesService.getScriptProperties();
  const allKeys = props.getKeys();

  let clearedCount = 0;
  for (let i = 0; i < allKeys.length; i++) {
    if (allKeys[i].indexOf('CASE_BATCH_') === 0) {
      props.deleteProperty(allKeys[i]);
      clearedCount++;
    }
  }

  if (clearedCount > 0) {
    Logger.log('🧹 Cleared ' + clearedCount + ' old batch cache(s)');
  }
}

/**
 * Retrieve all cases from batched cache
 * Only use this when you need ALL cases (expensive operation)
 */
function getAllCasesFromBatchCache_() {
  const props = PropertiesService.getScriptProperties();
  const metadataJson = props.getProperty('CASE_BATCH_METADATA');

  if (!metadataJson) {
    Logger.log('⚠️  No batch metadata found - cache may not be initialized');
    return [];
  }

  const metadata = JSON.parse(metadataJson);
  const allCases = [];

  for (let batchNum = 0; batchNum < metadata.totalBatches; batchNum++) {
    const batchKey = 'CASE_BATCH_' + batchNum;
    const batchJson = props.getProperty(batchKey);

    if (batchJson) {
      const batchCases = JSON.parse(batchJson);
      allCases.push.apply(allCases, batchCases);
    }
  }

  return allCases;
}

/**
 * Get cases from a specific batch (more efficient)
 */
function getCasesFromBatch_(batchNumber) {
  const props = PropertiesService.getScriptProperties();
  const batchKey = 'CASE_BATCH_' + batchNumber;
  const batchJson = props.getProperty(batchKey);

  if (!batchJson) {
    return [];
  }

  return JSON.parse(batchJson);
}


// ========== BIRD'S EYE VIEW UI ==========

// Build Categories tab content
function buildCategoriesTabHTML_(analysis) {
  const systemCards = Object.keys(analysis.systemDistribution)
    .sort(function(a, b) { return analysis.systemDistribution[b] - analysis.systemDistribution[a]; })
    .map(function(sys) {
      const count = analysis.systemDistribution[sys];
      const icon = sys === 'CARD' ? '🫀' :
                   sys === 'RESP' ? '🫁' :
                   sys === 'NEUR' ? '🧠' :
                   sys === 'GI' ? '🍽️' :
                   sys === 'ENDO' ? '🔬' :
                   sys === 'PSYCH' ? '🧘' :
                   sys === 'TRAUMA' ? '🚑' :
                   sys === 'PEDS' ? '👶' : '📁';

      return '<div class="category-card" onclick="alert(\'Category view coming soon! Will show all ' + sys + ' cases.\')">' +
             '  <div class="category-icon">' + icon + '</div>' +
             '  <div class="category-name">' + sys + '</div>' +
             '  <div class="category-count">' + count + ' cases</div>' +
             '</div>';
    }).join('');

  return '<div class="tab-content" id="categories-tab" style="display: none;">' +
         '  <div class="section">' +
         '    <div class="section-title">📁 System-Based Organization</div>' +
         '    <div class="category-grid">' + systemCards + '</div>' +
         '  </div>' +
         '</div>';
}

// Build Pathways tab content
function buildPathwaysTabHTML_(analysis) {
  const pathwayCards = analysis.topPathways.map(function(pw) {
    const stars = Math.round(pw.confidence * 5);
    const starStr = Array(stars + 1).join('⭐');
    const confidencePct = (pw.confidence * 100).toFixed(0);

    return '<div class="pathway-card" style="cursor: pointer;" onclick="' +
           '  document.body.innerHTML = \'<div style=&quot;text-align:center; padding:100px;&quot;><h2>⚙️ Loading chain builder...</h2><p style=&quot;color: #8b92a0;&quot;>Pathway: ' + pw.name + '</p></div>\';' +
           '  google.script.run' +
           '    .withSuccessHandler(function(html) { document.documentElement.innerHTML = html; })' +
           '    .withFailureHandler(function(error) { document.body.innerHTML = \'<div style=&quot;text-align:center; padding:100px;&quot;><h2 style=&quot;color: #ff4444;&quot;>❌ Error</h2><p>\' + error.message + \'</p></div>\'; })' +
           '    .buildChainBuilderUI(\'' + pw.id + '\', \'complexity_gradient\');' +
           '">' +
           '  <div class="pathway-header">' +
           '    <span class="pathway-icon">' + pw.icon + '</span>' +
           '    <div class="pathway-title">' + pw.name + '</div>' +
           '  </div>' +
           '  <div class="pathway-stats">' +
           '    <span class="pathway-count">' + pw.caseCount + ' cases</span>' +
           '    <span class="pathway-confidence">' + starStr + ' ' + confidencePct + '%</span>' +
           '  </div>' +
           '  <div class="pathway-rationale">' + pw.rationale + '</div>' +
           '</div>';
  }).join('');

  const insightsList = analysis.insights.map(function(insight) {
    return '<li class="insight-item">💡 ' + insight + '</li>';
  }).join('');

  // Get cache status
  const cacheStatus = getCacheStatus();
  const statusColor = cacheStatus.status === 'valid' ? '#00c853' :
                      cacheStatus.status === 'stale' ? '#ff9800' : '#f44336';
  const cacheIndicator = '<span id="cache-status" style="font-size: 11px; padding: 4px 8px; background: ' + statusColor + '; color: #fff; border-radius: 4px; font-weight: 600; margin-left: 8px;">' +
                        cacheStatus.icon + ' ' + cacheStatus.message +
                        (cacheStatus.cases ? ' (' + cacheStatus.cases + ' cases)' : '') +
                        '</span>';

  return '<div class="tab-content active" id="pathways-tab" style="display: block;">' +
         '  <div class="insights-box">' +
         '    <h3>🎯 Holistic Insights</h3>' +
         '    <ul class="insights-list">' + insightsList + '</ul>' +
         '  </div>' +
         '  <div class="section">' +
         '    <div class="section-title" style="display: flex; justify-content: space-between; align-items: center;">' +
         '      <div><span>🧩 Intelligent Pathway Opportunities</span>' + cacheIndicator + '</div>' +
         '      <div style="display: flex; gap: 12px; align-items: center;">' +
         '        <button class="precache-btn" onclick="google.script.run.preCacheRichData();" style="background: linear-gradient(135deg, #00c853 0%, #00a040 100%); border: none; color: #fff; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 600; transition: all 0.2s ease; display: flex; align-items: center; gap: 6px; box-shadow: 0 0 12px rgba(0, 200, 83, 0.3);">💾 Pre-Cache Rich Data</button>' +
         '        <button class="ai-discover-btn" onclick="google.script.run.showAIPathwaysStandardWithLogs();" style="background: linear-gradient(135deg, #2357ff 0%, #1a47cc 100%); border: none; color: #fff; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 600; transition: all 0.2s ease; display: flex; align-items: center; gap: 6px;">🤖 AI: Discover Novel Pathways</button>' +
         '        <button class="ai-radical-btn" onclick="google.script.run.showAIPathwaysRadicalWithLogs();" style="background: linear-gradient(135deg, #ff6b00 0%, #cc5500 100%); border: none; color: #fff; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 600; transition: all 0.2s ease; display: flex; align-items: center; gap: 6px; box-shadow: 0 0 12px rgba(255, 107, 0, 0.3);">🔥 AI: Radical Mode</button>' +
         '      </div>' +
         '    </div>' +
         '    <div class="pathway-grid">' + pathwayCards + '</div>' +
         '  </div>' +
         '</div>';
}

function buildBirdEyeViewUI_(analysis) {
  // Build tab content
  const categoriesTabHTML = buildCategoriesTabHTML_(analysis);
  const pathwaysTabHTML = buildPathwaysTabHTML_(analysis);

  return '<!DOCTYPE html>' +
'<html>' +
'<head>' +
'  <base target="_top">' +
'  <style>' +
'    * { margin: 0; padding: 0; box-sizing: border-box; }' +
'' +
'    body {' +
'      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;' +
'      background: linear-gradient(135deg, #0f1115 0%, #1a1d26 100%);' +
'      color: #e7eaf0;' +
'      overflow-x: hidden;' +
'      height: 1000px;' +
'    }' +
'' +
'    .header {' +
'      background: linear-gradient(135deg, #1b1f2a 0%, #141824 100%);' +
'      padding: 20px 32px 0 32px;' +
'      border-bottom: 2px solid #2a3040;' +
'    }' +
'' +
'    .header-top {' +
'      display: flex;' +
'      justify-content: space-between;' +
'      align-items: center;' +
'      margin-bottom: 16px;' +
'    }' +
'' +
'    .header h1 {' +
'      font-size: 28px;' +
'      font-weight: 700;' +
'    }' +
'' +
'    .btn-reanalyze {' +
'      background: linear-gradient(135deg, #2a3040 0%, #1e2533 100%);' +
'      border: 1px solid #3a4458;' +
'      color: #e7eaf0;' +
'      padding: 10px 18px;' +
'      border-radius: 8px;' +
'      cursor: pointer;' +
'      font-size: 13px;' +
'      font-weight: 600;' +
'      transition: all 0.2s;' +
'    }' +
'' +
'    .btn-reanalyze:hover {' +
'      background: linear-gradient(135deg, #3a4458 0%, #2a3040 100%);' +
'      border-color: #2357ff;' +
'    }' +
'' +
'    .stats-bar {' +
'      display: flex;' +
'      gap: 16px;' +
'      margin-bottom: 12px;' +
'    }' +
'' +
'    .stat-badge {' +
'      background: #0f1115;' +
'      border: 1px solid #2a3040;' +
'      padding: 6px 14px;' +
'      border-radius: 8px;' +
'      font-size: 12px;' +
'      color: #8b92a0;' +
'    }' +
'' +
'    .stat-badge .value {' +
'      color: #2357ff;' +
'      font-weight: 700;' +
'      margin-right: 4px;' +
'    }' +
'' +
'    /* Browser-style tabs */' +
'    .tab-switcher {' +
'      display: flex;' +
'      gap: 4px;' +
'      border-bottom: none;' +
'    }' +
'' +
'    .tab {' +
'      background: #141824;' +
'      border: 1px solid #2a3040;' +
'      border-bottom: none;' +
'      color: #8b92a0;' +
'      padding: 12px 24px;' +
'      border-radius: 10px 10px 0 0;' +
'      cursor: pointer;' +
'      font-size: 14px;' +
'      font-weight: 600;' +
'      transition: all 0.2s;' +
'      position: relative;' +
'      bottom: -1px;' +
'    }' +
'' +
'    .tab:hover {' +
'      background: #1b1f2a;' +
'      color: #e7eaf0;' +
'    }' +
'' +
'    .tab.active {' +
'      background: linear-gradient(135deg, #0f1115 0%, #1a1d26 100%);' +
'      border-color: #2a3040;' +
'      border-bottom: 2px solid transparent;' +
'      color: #2357ff;' +
'      box-shadow: 0 -2px 8px rgba(35, 87, 255, 0.1);' +
'    }' +
'' +
'    /* Tab content */' +
'    .tab-content {' +
'      display: none;' +
'      padding: 32px;' +
'      overflow-y: auto;' +
'      height: calc(1000px - 180px);' +
'    }' +
'' +
'    .tab-content.active {' +
'      display: block;' +
'    }' +
'' +
'    .tab-content::-webkit-scrollbar {' +
'      width: 10px;' +
'    }' +
'' +
'    .tab-content::-webkit-scrollbar-track {' +
'      background: #0f1115;' +
'    }' +
'' +
'    .tab-content::-webkit-scrollbar-thumb {' +
'      background: #2a3040;' +
'      border-radius: 5px;' +
'    }' +
'' +
'    .section {' +
'      margin-bottom: 32px;' +
'    }' +
'' +
'    .section-title {' +
'      font-size: 18px;' +
'      font-weight: 600;' +
'      margin-bottom: 20px;' +
'      color: #e7eaf0;' +
'      display: flex;' +
'      align-items: center;' +
'      gap: 10px;' +
'    }' +
'' +
'    /* Category cards (for Categories tab) */' +
'    .category-grid {' +
'      display: grid;' +
'      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));' +
'      gap: 20px;' +
'    }' +
'' +
'    .category-card {' +
'      background: linear-gradient(135deg, #1e2533 0%, #181d28 100%);' +
'      border: 2px solid #2a3040;' +
'      border-radius: 16px;' +
'      padding: 28px 24px;' +
'      text-align: center;' +
'      cursor: pointer;' +
'      transition: all 0.3s ease;' +
'    }' +
'' +
'    .category-card:hover {' +
'      background: linear-gradient(135deg, #252b3a 0%, #1f2430 100%);' +
'      border-color: #2357ff;' +
'      transform: translateY(-6px);' +
'      box-shadow: 0 12px 32px rgba(35, 87, 255, 0.25);' +
'    }' +
'' +
'    .category-icon {' +
'      font-size: 52px;' +
'      margin-bottom: 16px;' +
'      filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));' +
'    }' +
'' +
'    .category-name {' +
'      font-size: 20px;' +
'      font-weight: 700;' +
'      color: #e7eaf0;' +
'      margin-bottom: 8px;' +
'      letter-spacing: 0.5px;' +
'    }' +
'' +
'    .category-count {' +
'      font-size: 14px;' +
'      color: #8b92a0;' +
'      font-weight: 500;' +
'    }' +
'' +
'    /* Insights box */' +
'    .insights-box {' +
'      background: linear-gradient(135deg, #1e2533 0%, #181d28 100%);' +
'      border: 1px solid #2a3040;' +
'      border-left: 3px solid #2357ff;' +
'      padding: 20px 24px;' +
'      border-radius: 10px;' +
'      margin-bottom: 32px;' +
'    }' +
'' +
'    .insights-box h3 {' +
'      font-size: 16px;' +
'      font-weight: 600;' +
'      margin-bottom: 12px;' +
'      color: #2357ff;' +
'    }' +
'' +
'    .insights-list {' +
'      list-style: none;' +
'      padding: 0;' +
'    }' +
'' +
'    .insight-item {' +
'      font-size: 14px;' +
'      color: #8b92a0;' +
'      line-height: 1.6;' +
'      margin-bottom: 10px;' +
'    }' +
'' +
'    /* Pathway cards (for Pathways tab) */' +
'    .pathway-grid {' +
'      display: grid;' +
'      grid-template-columns: repeat(auto-fill, minmax(450px, 1fr));' +
'      gap: 20px;' +
'    }' +
'' +
'    .pathway-card {' +
'      background: linear-gradient(135deg, #1e2533 0%, #181d28 100%);' +
'      border: 1px solid #2a3040;' +
'      padding: 20px;' +
'      border-radius: 12px;' +
'      cursor: pointer;' +
'      transition: all 0.3s;' +
'    }' +
'' +
'    .pathway-card:hover {' +
'      background: linear-gradient(135deg, #252b3a 0%, #1f2430 100%);' +
'      border-color: #2357ff;' +
'      transform: translateY(-3px);' +
'      box-shadow: 0 8px 24px rgba(35, 87, 255, 0.2);' +
'    }' +
'' +
'    .pathway-header {' +
'      display: flex;' +
'      align-items: center;' +
'      gap: 12px;' +
'      margin-bottom: 12px;' +
'    }' +
'' +
'    .pathway-icon {' +
'      font-size: 32px;' +
'    }' +
'' +
'    .pathway-title {' +
'      font-size: 18px;' +
'      font-weight: 600;' +
'      color: #e7eaf0;' +
'    }' +
'' +
'    .pathway-stats {' +
'      display: flex;' +
'      justify-content: space-between;' +
'      align-items: center;' +
'      margin-bottom: 12px;' +
'    }' +
'' +
'    .pathway-count {' +
'      font-size: 13px;' +
'      color: #2357ff;' +
'      font-weight: 600;' +
'    }' +
'' +
'    .pathway-confidence {' +
'      font-size: 12px;' +
'      color: #8b92a0;' +
'    }' +
'' +
'    .pathway-rationale {' +
'      font-size: 13px;' +
'      color: #8b92a0;' +
'      line-height: 1.5;' +
'      margin-bottom: 16px;' +
'    }' +
'' +
'    .btn-build {' +
'      width: 100%;' +
'      background: linear-gradient(135deg, #2357ff 0%, #1a47d9 100%);' +
'      border: none;' +
'      color: #fff;' +
'      padding: 10px 16px;' +
'      border-radius: 8px;' +
'      cursor: pointer;' +
'      font-size: 14px;' +
'      font-weight: 600;' +
'      transition: all 0.2s;' +
'    }' +
'' +
'    .btn-build:hover {' +
'      background: linear-gradient(135deg, #1a47d9 0%, #1538b8 100%);' +
'      transform: translateY(-1px);' +
'    }' +
'  </style>' +
'</head>' +
'<body>' +
'  <div class="header">' +
'    <div class="header-top">' +
'      <h1>🧩 Pathway Chain Builder</h1>' +
'      <button class="btn-reanalyze" onclick="reAnalyze()">🔄 Re-analyze</button>' +
'    </div>' +
'    <div class="stats-bar">' +
'      <div class="stat-badge"><span class="value">' + analysis.totalCases + '</span> Total Cases</div>' +
'      <div class="stat-badge"><span class="value">' + Object.keys(analysis.systemDistribution).length + '</span> Systems</div>' +
'      <div class="stat-badge"><span class="value">' + analysis.topPathways.length + '</span> Opportunities</div>' +
'      <div class="stat-badge"><span class="value">' + analysis.unassignedCount + '</span> Unassigned</div>' +
'    </div>' +
'    <div class="tab-switcher">' +
'      <button class="tab" id="categories-tab-btn" onclick="' +
'        document.getElementById(\'categories-tab-btn\').classList.add(\'active\');' +
'        document.getElementById(\'pathways-tab-btn\').classList.remove(\'active\');' +
'        document.getElementById(\'categories-tab\').style.display = \'block\';' +
'        document.getElementById(\'pathways-tab\').style.display = \'none\';' +
'      ">📁 Categories</button>' +
'      <button class="tab active" id="pathways-tab-btn" onclick="' +
'        document.getElementById(\'categories-tab-btn\').classList.remove(\'active\');' +
'        document.getElementById(\'pathways-tab-btn\').classList.add(\'active\');' +
'        document.getElementById(\'categories-tab\').style.display = \'none\';' +
'        document.getElementById(\'pathways-tab\').style.display = \'block\';' +
'      ">🧩 Pathways</button>' +
'    </div>' +
'  </div>' +
'' +
'  ' + categoriesTabHTML +
'  ' + pathwaysTabHTML +
'' +
'  <script>' +
'    function showCategories() {' +
'      // Update tab buttons' +
'      var categoriesBtn = document.getElementById(\'categories-tab-btn\');' +
'      var pathwaysBtn = document.getElementById(\'pathways-tab-btn\');' +
'      if (categoriesBtn) categoriesBtn.classList.add(\'active\');' +
'      if (pathwaysBtn) pathwaysBtn.classList.remove(\'active\');' +
'      ' +
'      // Update tab content' +
'      var categoriesTab = document.getElementById(\'categories-tab\');' +
'      var pathwaysTab = document.getElementById(\'pathways-tab\');' +
'      if (categoriesTab) categoriesTab.style.display = \'block\';' +
'      if (pathwaysTab) pathwaysTab.style.display = \'none\';' +
'    }' +
'' +
'    function showPathways() {' +
'      // Update tab buttons' +
'      var categoriesBtn = document.getElementById(\'categories-tab-btn\');' +
'      var pathwaysBtn = document.getElementById(\'pathways-tab-btn\');' +
'      if (categoriesBtn) categoriesBtn.classList.remove(\'active\');' +
'      if (pathwaysBtn) pathwaysBtn.classList.add(\'active\');' +
'      ' +
'      // Update tab content' +
'      var categoriesTab = document.getElementById(\'categories-tab\');' +
'      var pathwaysTab = document.getElementById(\'pathways-tab\');' +
'      if (categoriesTab) categoriesTab.style.display = \'none\';' +
'      if (pathwaysTab) pathwaysTab.style.display = \'block\';' +
'    }' +
'' +
'    function viewCategory(categoryName) {' +
'      console.log("🗂️ View category:", categoryName);' +
'      alert("Category view coming soon! Will show all " + categoryName + " cases.");' +
'    }' +
'' +
'    function buildPathway(pathwayId) {' +
'      console.log("🎯 buildPathway called with ID:", pathwayId);' +
'      try {' +
'        document.body.innerHTML = "<div style=\\"text-align:center; padding:100px;\\"><h2>⚙️ Loading chain builder...</h2><p style=\\"color: #8b92a0;\\">Pathway ID: " + pathwayId + "</p></div>";' +
'        console.log("📞 Calling google.script.run.buildChainBuilderUI");' +
'        google.script.run' +
'          .withSuccessHandler(function(html) {' +
'            console.log("✅ buildChainBuilderUI returned successfully");' +
'            console.log("📄 HTML length:", html.length);' +
'            document.documentElement.innerHTML = html;' +
'          })' +
'          .withFailureHandler(function(error) {' +
'            console.error("❌ buildChainBuilderUI failed:", error);' +
'            document.body.innerHTML = "<div style=\\"text-align:center; padding:100px;\\"><h2 style=\\"color: #ff4444;\\">❌ Error Loading Chain Builder</h2><p style=\\"color: #8b92a0;\\">Error: " + error.message + "</p><p style=\\"color: #8b92a0;\\">See console for details (F12)</p></div>";' +
'          })' +
'          .buildChainBuilderUI(pathwayId);' +
'      } catch (e) {' +
'        console.error("❌ Exception in buildPathway:", e);' +
'        document.body.innerHTML = "<div style=\\"text-align:center; padding:100px;\\"><h2 style=\\"color: #ff4444;\\">❌ Exception</h2><p style=\\"color: #8b92a0;\\">Exception: " + e.message + "</p></div>";' +
'      }' +
'    }' +
'' +
'    function reAnalyze() {' +
'      if (confirm("Re-analyze entire case library?\\n\\nThis will invalidate the cache and take 30-60 seconds.")) {' +
'        document.body.innerHTML = "<div style=\\"text-align:center; padding:100px;\\"><h2>⚙️ Re-analyzing...</h2><p>Please wait...</p></div>";' +
'        google.script.run' +
'          .withSuccessHandler(function() {' +
'            google.script.host.close();' +
'          })' +
'          .reAnalyzeLibrary();' +
'      }' +
'    }' +
'  </script>' +
'</body>' +
'</html>';
}

// ========== RE-ANALYZE FUNCTION ==========

function reAnalyzeLibrary() {
  // Force refresh of holistic analysis
  getOrCreateHolisticAnalysis_(true);
}

// ========== LOGIC TYPE REGISTRY ==========

function getAllLogicTypes_() {
  return [
    {
      id: 'complexity_gradient',
      name: 'Complexity Gradient',
      icon: '📊',
      description: 'Simple → Complex progression based on diagnosis length and symptom count',
      explanation: 'This logic type orders cases from simplest to most complex, allowing learners to build confidence with straightforward presentations before tackling multi-system cases.',
      targetAudience: 'Medical students, new residents, general learners',
      whenToUse: 'When building foundational knowledge and pattern recognition skills'
    },
    {
      id: 'acuity_escalation',
      name: 'Acuity Escalation',
      icon: '🚨',
      description: 'Stable → Critical based on vital signs severity and time-sensitivity',
      explanation: 'Orders cases from stable presentations to life-threatening emergencies, teaching triage prioritization and escalation recognition.',
      targetAudience: 'ER residents, triage nurses, emergency responders',
      whenToUse: 'When teaching emergency prioritization and critical decision-making under pressure'
    },
    {
      id: 'diagnostic_mimicry',
      name: 'Diagnostic Mimicry',
      icon: '🎭',
      description: 'Similar presentations with different diagnoses - teaches differential reasoning',
      explanation: 'Groups cases with similar chief complaints but different underlying diagnoses, forcing learners to differentiate between look-alike conditions.',
      targetAudience: 'Advanced students, residents preparing for boards, diagnosticians',
      whenToUse: 'When teaching differential diagnosis and avoiding cognitive anchoring bias'
    },
    {
      id: 'protocol_mastery',
      name: 'Protocol Mastery',
      icon: '📋',
      description: 'Algorithm-driven sequence (ACLS, ATLS, PALS protocols)',
      explanation: 'Follows established clinical protocols step-by-step, reinforcing algorithmic decision trees and standardized care pathways.',
      targetAudience: 'Certification candidates (ACLS/ATLS/PALS), protocol-driven teams',
      whenToUse: 'When preparing for certification exams or standardizing team responses'
    },
    {
      id: 'organ_system_journey',
      name: 'Organ System Journey',
      icon: '🫀',
      description: 'Deep dive into single system (Cardiology, Neurology, etc.)',
      explanation: 'Focuses exclusively on one organ system, progressing through all severity levels and subtypes within that specialty.',
      targetAudience: 'Specialty residents, fellows, focused learners',
      whenToUse: 'When developing deep expertise in a specific medical specialty'
    },
    {
      id: 'age_spectrum',
      name: 'Age Spectrum',
      icon: '👶👴',
      description: 'Pediatric → Geriatric presentations of similar conditions',
      explanation: 'Shows how the same condition presents differently across age groups, teaching age-specific assessment and treatment modifications.',
      targetAudience: 'Family medicine, pediatricians, geriatricians',
      whenToUse: 'When teaching lifespan considerations and age-adapted care'
    },
    {
      id: 'rare_zebras',
      name: 'Rare Zebras',
      icon: '🦓',
      description: 'Uncommon diagnoses that mimic common conditions',
      explanation: 'Highlights rare but important diagnoses that can be missed, teaching "when to think zebra not horse."',
      targetAudience: 'Experienced clinicians, academic medicine, diagnosticians',
      whenToUse: 'When teaching pattern interruption and avoiding premature closure'
    },
    {
      id: 'comorbidity_complexity',
      name: 'Comorbidity Complexity',
      icon: '🧩',
      description: 'Single-system → Multi-system with medication interactions',
      explanation: 'Progressively adds comorbidities and polypharmacy, teaching complex patient management and interaction awareness.',
      targetAudience: 'Internists, hospitalists, chronic disease managers',
      whenToUse: 'When teaching management of medically complex patients'
    },
    {
      id: 'time_pressure',
      name: 'Time-Pressure Triage',
      icon: '⏱️',
      description: 'Door-to-decision time constraints (minutes → hours)',
      explanation: 'Orders cases by acceptable decision timeframe, teaching when rapid action is critical versus when observation is safe.',
      targetAudience: 'ER physicians, trauma teams, acute care providers',
      whenToUse: 'When teaching time-critical decision making and triage skills'
    },
    {
      id: 'cognitive_traps',
      name: 'Cognitive Trap Awareness',
      icon: '🧠',
      description: 'Cases designed to expose common diagnostic biases',
      explanation: 'Presents cases that trigger anchoring, availability, confirmation bias - then reveals the correct diagnosis to teach metacognition.',
      targetAudience: 'All levels - teaches self-awareness and bias recognition',
      whenToUse: 'When teaching clinical reasoning and diagnostic error prevention'
    },
    {
      id: 'resource_constrained',
      name: 'Resource-Constrained Care',
      icon: '🏕️',
      description: 'Full-resource → Limited-resource management',
      explanation: 'Shows how to adapt diagnosis and treatment when advanced imaging, labs, or specialists are unavailable.',
      targetAudience: 'Rural providers, austere medicine, international health workers',
      whenToUse: 'When teaching clinical reasoning without high-tech dependencies'
    },
    {
      id: 'handoff_continuity',
      name: 'Handoff & Continuity',
      icon: '🔄',
      description: 'Cases that span multiple shifts and care transitions',
      explanation: 'Teaches safe handoffs, information synthesis across time, and recognizing evolving presentations.',
      targetAudience: 'Hospitalists, shift workers, care coordinators',
      whenToUse: 'When teaching communication and longitudinal thinking'
    }
  ];
}

function getLogicTypeById_(logicTypeId) {
  const allTypes = getAllLogicTypes_();
  for (let i = 0; i < allTypes.length; i++) {
    if (allTypes[i].id === logicTypeId) {
      return allTypes[i];
    }
  }
  return allTypes[0]; // Default to complexity_gradient
}

function sortByLogicType_(cases, logicTypeId) {
  switch(logicTypeId) {
    case 'complexity_gradient':
      // Simple → Complex (by diagnosis length)
      cases.sort(function(a, b) {
        return a.diagnosis.length - b.diagnosis.length;
      });
      break;

    case 'acuity_escalation':
      // Stable → Critical (by diagnosis severity keywords)
      cases.sort(function(a, b) {
        const acuityA = getAcuityScore_(a.diagnosis + ' ' + a.sparkTitle);
        const acuityB = getAcuityScore_(b.diagnosis + ' ' + b.sparkTitle);
        return acuityA - acuityB;
      });
      break;

    case 'diagnostic_mimicry':
      // Group by similar chief complaints (first word of spark title)
      cases.sort(function(a, b) {
        const chiefA = a.sparkTitle.split(' ')[0].toUpperCase();
        const chiefB = b.sparkTitle.split(' ')[0].toUpperCase();
        if (chiefA === chiefB) {
          return a.diagnosis.length - b.diagnosis.length; // Within group, simple → complex
        }
        return chiefA.localeCompare(chiefB);
      });
      break;

    case 'protocol_mastery':
      // Protocol order (ACLS: VFib → VTach → Asystole → PEA)
      cases.sort(function(a, b) {
        const protocolA = getProtocolPriority_(a.diagnosis);
        const protocolB = getProtocolPriority_(b.diagnosis);
        return protocolA - protocolB;
      });
      break;

    case 'organ_system_journey':
      // Group by system, then severity within system
      cases.sort(function(a, b) {
        if (a.category === b.category) {
          return a.diagnosis.length - b.diagnosis.length;
        }
        return a.category.localeCompare(b.category);
      });
      break;

    case 'age_spectrum':
      // Pediatric → Adult → Geriatric (by age keywords in diagnosis/spark)
      cases.sort(function(a, b) {
        const ageA = getAgeCategory_(a.diagnosis + ' ' + a.sparkTitle);
        const ageB = getAgeCategory_(b.diagnosis + ' ' + b.sparkTitle);
        return ageA - ageB;
      });
      break;

    case 'rare_zebras':
      // Rare/uncommon diagnoses first (by rarity keywords)
      cases.sort(function(a, b) {
        const rarityA = getRarityScore_(a.diagnosis);
        const rarityB = getRarityScore_(b.diagnosis);
        return rarityB - rarityA; // Descending (rare first)
      });
      break;

    case 'comorbidity_complexity':
      // Single-system → Multi-system (count commas, "and", "&")
      cases.sort(function(a, b) {
        const comorbidA = getComorbidityCount_(a.diagnosis);
        const comorbidB = getComorbidityCount_(b.diagnosis);
        return comorbidA - comorbidB;
      });
      break;

    case 'time_pressure':
      // By urgency (minutes → hours → days)
      cases.sort(function(a, b) {
        const urgencyA = getTimeUrgency_(a.diagnosis + ' ' + a.sparkTitle);
        const urgencyB = getTimeUrgency_(b.diagnosis + ' ' + a.sparkTitle);
        return urgencyB - urgencyA; // Descending (most urgent first)
      });
      break;

    case 'cognitive_traps':
      // Cases likely to trigger bias (by keywords like "classic", "typical")
      cases.sort(function(a, b) {
        const trapA = getCognitiveTrapScore_(a.diagnosis + ' ' + a.sparkTitle);
        const trapB = getCognitiveTrapScore_(b.diagnosis + ' ' + b.sparkTitle);
        return trapB - trapA;
      });
      break;

    case 'resource_constrained':
      // Full resource → Limited resource (by diagnostic dependency)
      cases.sort(function(a, b) {
        const resourceA = getResourceDependency_(a.diagnosis);
        const resourceB = getResourceDependency_(b.diagnosis);
        return resourceB - resourceA; // High-resource first, then low-resource
      });
      break;

    case 'handoff_continuity':
      // Cases that evolve over time (keywords: "progressive", "evolving")
      cases.sort(function(a, b) {
        const evolutionA = getEvolutionScore_(a.diagnosis + ' ' + a.sparkTitle);
        const evolutionB = getEvolutionScore_(b.diagnosis + ' ' + b.sparkTitle);
        return evolutionB - evolutionA;
      });
      break;

    default:
      // Fallback to complexity gradient
      cases.sort(function(a, b) {
        return a.diagnosis.length - b.diagnosis.length;
      });
  }
}

// Helper scoring functions for logic types
function getAcuityScore_(text) {
  const criticalWords = ['arrest', 'shock', 'hemorrhage', 'stroke', 'mi', 'infarction', 'critical', 'severe'];
  const urgentWords = ['acute', 'emergency', 'unstable', 'crisis'];
  let score = 0;
  const upper = text.toUpperCase();
  for (let i = 0; i < criticalWords.length; i++) {
    if (upper.indexOf(criticalWords[i].toUpperCase()) !== -1) score += 3;
  }
  for (let i = 0; i < urgentWords.length; i++) {
    if (upper.indexOf(urgentWords[i].toUpperCase()) !== -1) score += 1;
  }
  return score;
}

function getProtocolPriority_(diagnosis) {
  const upper = diagnosis.toUpperCase();
  if (upper.indexOf('VFIB') !== -1 || upper.indexOf('V FIB') !== -1) return 1;
  if (upper.indexOf('VTACH') !== -1 || upper.indexOf('V TACH') !== -1) return 2;
  if (upper.indexOf('ASYSTOLE') !== -1) return 3;
  if (upper.indexOf('PEA') !== -1) return 4;
  if (upper.indexOf('BRADYCARD') !== -1) return 5;
  if (upper.indexOf('SVT') !== -1 || upper.indexOf('TACHYCARD') !== -1) return 6;
  return 7;
}

function getAgeCategory_(text) {
  const upper = text.toUpperCase();
  if (upper.indexOf('PEDIATRIC') !== -1 || upper.indexOf('CHILD') !== -1 || upper.indexOf('INFANT') !== -1) return 1;
  if (upper.indexOf('ADOLESCENT') !== -1 || upper.indexOf('TEEN') !== -1) return 2;
  if (upper.indexOf('GERIATRIC') !== -1 || upper.indexOf('ELDERLY') !== -1 || upper.indexOf('SENIOR') !== -1) return 4;
  return 3; // Adult default
}

function getRarityScore_(diagnosis) {
  const rareWords = ['rare', 'uncommon', 'unusual', 'atypical', 'zebra'];
  let score = 0;
  const upper = diagnosis.toUpperCase();
  for (let i = 0; i < rareWords.length; i++) {
    if (upper.indexOf(rareWords[i].toUpperCase()) !== -1) score += 2;
  }
  return score;
}

function getComorbidityCount_(diagnosis) {
  let count = 0;
  count += (diagnosis.match(/,/g) || []).length;
  count += (diagnosis.match(/\band\b/gi) || []).length;
  count += (diagnosis.match(/\bwith\b/gi) || []).length;
  count += (diagnosis.match(/&/g) || []).length;
  return count;
}

function getTimeUrgency_(text) {
  const immediateWords = ['emergent', 'stat', 'immediate', 'critical', 'arrest'];
  const urgentWords = ['urgent', 'acute', 'minutes'];
  let score = 0;
  const upper = text.toUpperCase();
  for (let i = 0; i < immediateWords.length; i++) {
    if (upper.indexOf(immediateWords[i].toUpperCase()) !== -1) score += 3;
  }
  for (let i = 0; i < urgentWords.length; i++) {
    if (upper.indexOf(urgentWords[i].toUpperCase()) !== -1) score += 1;
  }
  return score;
}

function getCognitiveTrapScore_(text) {
  const trapWords = ['classic', 'typical', 'textbook', 'obvious', 'clear'];
  let score = 0;
  const upper = text.toUpperCase();
  for (let i = 0; i < trapWords.length; i++) {
    if (upper.indexOf(trapWords[i].toUpperCase()) !== -1) score += 1;
  }
  return score;
}

function getResourceDependency_(diagnosis) {
  const highResourceWords = ['ct', 'mri', 'angiography', 'catheterization', 'specialist'];
  let score = 0;
  const upper = diagnosis.toUpperCase();
  for (let i = 0; i < highResourceWords.length; i++) {
    if (upper.indexOf(highResourceWords[i].toUpperCase()) !== -1) score += 1;
  }
  return score;
}

function getEvolutionScore_(text) {
  const evolutionWords = ['progressive', 'evolving', 'worsening', 'deteriorating', 'chronic'];
  let score = 0;
  const upper = text.toUpperCase();
  for (let i = 0; i < evolutionWords.length; i++) {
    if (upper.indexOf(evolutionWords[i].toUpperCase()) !== -1) score += 1;
  }
  return score;
}

// ========== AI-POWERED LOGIC TYPE GENERATION ==========

function generateLogicTypeWithAI(pathwayId) {
  Logger.log('🤖 AI generating new logic type for pathway: ' + pathwayId);

  try {
    const analysis = getOrCreateHolisticAnalysis_();

    // Find the pathway
    let pathway = null;
    for (let i = 0; i < analysis.topPathways.length; i++) {
      if (analysis.topPathways[i].id === pathwayId) {
        pathway = analysis.topPathways[i];
        break;
      }
    }

    if (!pathway) {
      throw new Error('Pathway not found: ' + pathwayId);
    }

    // Get cases for this pathway
    const pathwayCases = [];
    for (let i = 0; i < analysis.allCases.length; i++) {
      for (let j = 0; j < pathway.suggestedCases.length; j++) {
        if (analysis.allCases[i].caseId === pathway.suggestedCases[j]) {
          pathwayCases.push(analysis.allCases[i]);
          break;
        }
      }
    }

    // Create context for ChatGPT
    const casesSummary = pathwayCases.map(function(c) {
      return c.caseId + ': ' + c.sparkTitle + ' | ' + c.diagnosis;
    }).join('\\n');

    const existingLogicTypes = getAllLogicTypes_().map(function(lt) {
      return lt.name + ': ' + lt.description;
    }).join('\\n');

    const prompt = 'You are an expert medical educator analyzing a case library for pathway building.\\n\\n' +
      'PATHWAY: ' + pathway.name + '\\n' +
      'CASES (' + pathwayCases.length + ' total):\\n' + casesSummary + '\\n\\n' +
      'EXISTING LOGIC TYPES:\\n' + existingLogicTypes + '\\n\\n' +
      'Task: Analyze these cases and suggest ONE innovative logic type for ordering them that is DIFFERENT from the existing types. ' +
      'Consider unique pedagogical approaches, clinical reasoning patterns, or educational objectives that aren\'t covered yet.\\n\\n' +
      'Respond ONLY with valid JSON in this exact format:\\n' +
      '{\\n' +
      '  "id": "ai_generated_[unique_slug]",\\n' +
      '  "name": "Your Logic Type Name",\\n' +
      '  "icon": "📌",\\n' +
      '  "description": "Brief one-line description",\\n' +
      '  "explanation": "Detailed explanation of how this orders cases and why it\'s valuable",\\n' +
      '  "targetAudience": "Who should use this approach",\\n' +
      '  "whenToUse": "When this approach is most appropriate",\\n' +
      '  "sortingCriteria": "Detailed instructions for how to sort cases (e.g., analyze X, then prioritize by Y)"\\n' +
      '}';

    // Get OpenAI API key from Settings sheet cell B2
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const settingsSheet = ss.getSheetByName('Settings');
    let apiKey = '';

    if (settingsSheet) {
      apiKey = settingsSheet.getRange('B2').getValue();
      Logger.log('🔑 Retrieved API key from Settings!B2');
    }

    if (!apiKey) {
      // Return demo logic type if no API key
      Logger.log('⚠️ No OpenAI API key found in Settings!B2, returning demo logic type');
      return {
        id: 'ai_demo_' + new Date().getTime(),
        name: 'Misdiagnosis Risk Gradient',
        icon: '⚠️',
        description: 'Orders cases by likelihood of misdiagnosis - from commonly missed to obvious',
        explanation: 'This AI-generated logic type analyzes cases for cognitive bias triggers, atypical presentations, and diagnostic pitfalls. Cases with high misdiagnosis risk come first to train pattern interruption, while clear-cut cases come last.',
        targetAudience: 'Advanced practitioners, quality improvement teams, patient safety officers',
        whenToUse: 'When teaching diagnostic error prevention and developing meta-cognitive awareness',
        sortingCriteria: 'Analyze diagnosis complexity, symptom overlap with common conditions, and presence of red herrings'
      };
    }

    const response = UrlFetchApp.fetch('https://api.openai.com/v1/chat/completions', {
      method: 'post',
      contentType: 'application/json',
      headers: {
        'Authorization': 'Bearer ' + apiKey
      },
      payload: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'You are an expert medical educator who designs innovative case sequencing logic.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.8,
        max_tokens: 500
      })
    });

    const result = JSON.parse(response.getContentText());
    const aiResponse = result.choices[0].message.content;

    // Parse JSON from AI response
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('AI did not return valid JSON');
    }

    const newLogicType = JSON.parse(jsonMatch[0]);
    Logger.log('✅ AI generated logic type: ' + newLogicType.name);

    return newLogicType;

  } catch (error) {
    Logger.log('❌ Error generating logic type with AI: ' + error.toString());
    throw error;
  }
}

function interpretCustomLogicDescription(description, pathwayId) {
  Logger.log('✨ Interpreting custom logic description: ' + description);

  try {
    const analysis = getOrCreateHolisticAnalysis_();

    // Find the pathway
    let pathway = null;
    for (let i = 0; i < analysis.topPathways.length; i++) {
      if (analysis.topPathways[i].id === pathwayId) {
        pathway = analysis.topPathways[i];
        break;
      }
    }

    const prompt = 'Convert this user\'s logic type idea into a structured logic type definition:\\n\\n' +
      'User Input: "' + description + '"\\n\\n' +
      'Respond ONLY with valid JSON in this exact format:\\n' +
      '{\\n' +
      '  "id": "custom_[unique_slug_based_on_description]",\\n' +
      '  "name": "Clear Name for This Logic",\\n' +
      '  "icon": "📌",\\n' +
      '  "description": "Brief one-line description",\\n' +
      '  "explanation": "How this orders cases and why",\\n' +
      '  "targetAudience": "Who should use this",\\n' +
      '  "whenToUse": "When to use this approach",\\n' +
      '  "sortingCriteria": "Detailed sorting instructions"\\n' +
      '}';

    // Get OpenAI API key from Settings sheet cell B2
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const settingsSheet = ss.getSheetByName('Settings');
    let apiKey = '';

    if (settingsSheet) {
      apiKey = settingsSheet.getRange('B2').getValue();
      Logger.log('🔑 Retrieved API key from Settings!B2');
    }

    if (!apiKey) {
      // Create basic custom logic type without AI
      Logger.log('⚠️ No OpenAI API key found in Settings!B2, creating basic custom logic type');
      const slug = description.toLowerCase().replace(/[^a-z0-9]+/g, '_').substring(0, 30);
      return {
        id: 'custom_' + slug + '_' + new Date().getTime(),
        name: description.substring(0, 50),
        icon: '✨',
        description: description,
        explanation: 'Custom ordering logic: ' + description,
        targetAudience: 'Custom use case',
        whenToUse: 'When ' + description.toLowerCase(),
        sortingCriteria: 'Cases ordered according to: ' + description
      };
    }

    const response = UrlFetchApp.fetch('https://api.openai.com/v1/chat/completions', {
      method: 'post',
      contentType: 'application/json',
      headers: {
        'Authorization': 'Bearer ' + apiKey
      },
      payload: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'You convert user ideas into structured logic type definitions.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 400
      })
    });

    const result = JSON.parse(response.getContentText());
    const aiResponse = result.choices[0].message.content;

    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    const customLogicType = JSON.parse(jsonMatch[0]);

    Logger.log('✅ Custom logic type created: ' + customLogicType.name);
    return customLogicType;

  } catch (error) {
    Logger.log('❌ Error interpreting custom logic: ' + error.toString());
    throw error;
  }
}

function applyDynamicLogicType(pathwayId, logicType) {
  Logger.log('🔄 Applying dynamic logic type: ' + logicType.name + ' to pathway: ' + pathwayId);

  // This function will use the sortingCriteria from the logic type
  // For now, we'll use complexity gradient as fallback, but you can extend this
  // to interpret the sorting Criteria using AI or custom rules

  return buildChainBuilderUI(pathwayId, 'complexity_gradient');
}

function saveCustomLogicType(logicType) {
  Logger.log('💾 Saving custom logic type: ' + logicType.name);

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let customLogicSheet = ss.getSheetByName('Custom_Logic_Types');

    // Create sheet if it doesn't exist
    if (!customLogicSheet) {
      customLogicSheet = ss.insertSheet('Custom_Logic_Types');
      customLogicSheet.appendRow(['ID', 'Name', 'Icon', 'Description', 'Explanation', 'Target Audience', 'When To Use', 'Sorting Criteria', 'Created']);
    }

    // Add the custom logic type
    customLogicSheet.appendRow([
      logicType.id,
      logicType.name,
      logicType.icon,
      logicType.description,
      logicType.explanation,
      logicType.targetAudience,
      logicType.whenToUse,
      logicType.sortingCriteria || '',
      new Date().toISOString()
    ]);

    Logger.log('✅ Custom logic type saved to sheet');

  } catch (error) {
    Logger.log('❌ Error saving custom logic type: ' + error.toString());
    throw error;
  }
}

// ========== PHASE 2B: HORIZONTAL CHAIN BUILDER ==========

function buildChainBuilderUI(pathwayId, logicTypeId) {
  // Default to complexity_gradient if not specified
  if (!logicTypeId) {
    logicTypeId = 'complexity_gradient';
  }
  Logger.log('🎯 buildChainBuilderUI called with pathwayId: ' + pathwayId);

  try {
    const analysis = getOrCreateHolisticAnalysis_();
    Logger.log('📊 Got analysis with ' + analysis.topPathways.length + ' pathways');

    // Find the pathway from analysis
    let pathway = null;
    for (let i = 0; i < analysis.topPathways.length; i++) {
      Logger.log('  Checking pathway: ' + analysis.topPathways[i].id + ' (looking for: ' + pathwayId + ')');
      if (analysis.topPathways[i].id === pathwayId) {
        pathway = analysis.topPathways[i];
        Logger.log('  ✅ Found matching pathway: ' + pathway.name);
        break;
      }
    }

    if (!pathway) {
      Logger.log('❌ Pathway not found: ' + pathwayId);
      Logger.log('Available pathway IDs: ' + analysis.topPathways.map(function(p) { return p.id; }).join(', '));
      return '<html><body style="font-family: system-ui; padding: 40px; text-align: center;"><h2>Pathway not found</h2><p>ID: ' + pathwayId + '</p><p>Available IDs: ' + analysis.topPathways.map(function(p) { return p.id; }).join(', ') + '</p></body></html>';
    }

    Logger.log('🔨 Building initial chain with logic type: ' + logicTypeId);
    // Build initial chain with suggested cases using selected logic type
    const logicType = getLogicTypeById_(logicTypeId);
    const initialChain = buildInitialChain_(pathway, analysis.allCases, logicTypeId);
    Logger.log('✅ Built chain with ' + initialChain.length + ' positions');

    Logger.log('🎨 Building HTML...');
    const html = buildChainBuilderHTML_(pathway, initialChain, logicType);
    Logger.log('✅ HTML built, length: ' + html.length + ' chars');

    return html;
  } catch (e) {
    Logger.log('❌ Exception in buildChainBuilderUI: ' + e.message);
    Logger.log('Stack trace: ' + e.stack);
    return '<html><body style="font-family: system-ui; padding: 40px; text-align: center;"><h2 style="color: #ff4444;">Error</h2><p>' + e.message + '</p><pre style="text-align: left; background: #f5f5f5; padding: 20px; border-radius: 8px;">' + e.stack + '</pre></body></html>';
  }
}

function buildInitialChain_(pathway, allCases, logicTypeId) {
  // Get cases for this pathway
  const pathwayCases = [];
  for (let i = 0; i < allCases.length; i++) {
    for (let j = 0; j < pathway.suggestedCases.length; j++) {
      if (allCases[i].caseId === pathway.suggestedCases[j]) {
        pathwayCases.push(allCases[i]);
        break;
      }
    }
  }

  // Sort based on logic type
  sortByLogicType_(pathwayCases, logicTypeId || 'complexity_gradient');

  // Build chain: first 10 cases as positions, rest as alternatives
  const chain = [];
  const maxPositions = Math.min(10, pathwayCases.length);

  for (let i = 0; i < maxPositions; i++) {
    const caseData = pathwayCases[i];
    const position = {
      position: i + 1,
      primary: caseData,
      alternatives: [],
      rationale: generatePositionRationale_(i + 1, caseData, pathwayCases, pathway)
    };

    // Add 3 alternatives (or fewer if not enough cases)
    const alternativeStartIndex = maxPositions;
    for (let j = 0; j < 3 && (alternativeStartIndex + j) < pathwayCases.length; j++) {
      position.alternatives.push(pathwayCases[alternativeStartIndex + j]);
    }

    chain.push(position);
  }

  return chain;
}

function generatePositionRationale_(position, caseData, allCases, pathway) {
  const totalPositions = Math.min(10, allCases.length);
  const diagnosisLength = caseData.diagnosis.length;
  const sparkTitle = caseData.sparkTitle;

  // Position-based pedagogical reasoning
  if (position === 1) {
    return '🎯 Foundation: Clear presentation with straightforward diagnosis - builds confidence and establishes pattern recognition baseline';
  } else if (position === 2) {
    return '📚 Early Learning: Slightly more complex than opener - introduces key concepts while maintaining accessibility';
  } else if (position === 3) {
    return '🔄 Pattern Building: Familiar symptoms with subtle variation - reinforces recognition while adding nuance';
  } else if (position <= Math.ceil(totalPositions * 0.4)) {
    return '🧩 Skill Development: Moderate complexity - challenges learner to apply foundational knowledge in new contexts';
  } else if (position <= Math.ceil(totalPositions * 0.6)) {
    return '⚡ Critical Thinking: Intermediate difficulty - requires synthesis of multiple concepts and differential diagnosis';
  } else if (position <= Math.ceil(totalPositions * 0.8)) {
    return '🎓 Advanced Application: Complex presentation - tests mastery through atypical symptoms or comorbidities';
  } else if (position === totalPositions) {
    return '🏆 Mastery Challenge: Most complex case - demonstrates full competency through comprehensive clinical reasoning';
  } else {
    return '💡 Advanced Integration: High complexity - requires expert-level pattern recognition and multi-system thinking';
  }
}

function buildChainBuilderHTML_(pathway, chain, logicType) {
  // Build logic type dropdown options
  const allLogicTypes = getAllLogicTypes_();
  const logicTypeOptionsHTML = allLogicTypes.map(function(lt) {
    const selected = lt.id === logicType.id ? 'selected' : '';
    return '<option value="' + lt.id + '" ' + selected + '>' + lt.icon + ' ' + lt.name + '</option>';
  }).join('');

  const chainPositionsHTML = chain.map(function(pos) {
    const primaryHTML =
      '<div class="case-primary" data-case-id="' + pos.primary.caseId + '" data-position="' + pos.position + '" data-rationale="' + pos.rationale.replace(/"/g, '&quot;') + '">' +
      '  <div class="case-header">' +
      '    <span class="case-id">' + pos.primary.caseId + '</span>' +
      '    <span class="case-row">Row ' + pos.primary.row + '</span>' +
      '  </div>' +
      '  <div class="case-title">' + pos.primary.sparkTitle + '</div>' +
      '  <div class="case-diagnosis">Dx: ' + ((pos.primary.diagnosis || '').substring(0, 30) + ((pos.primary.diagnosis || '').length > 30 ? '...' : '')) + '</div>' +
      '  <div class="case-learning">Learning: ' + ((pos.primary.learningOutcomes || '').substring(0, 40) + ((pos.primary.learningOutcomes || '').length > 40 ? '...' : '')) + '</div>' +
      '  <div class="case-rationale">' + pos.rationale + '</div>' +
      '</div>';

    const alternativesHTML = pos.alternatives.map(function(alt) {
      return '<div class="case-alternative" data-case-id="' + alt.caseId + '" onclick="swapCase(' + pos.position + ', \'' + alt.caseId + '\')">' +
             '  <div class="alt-title">' + alt.sparkTitle.substring(0, 40) + (alt.sparkTitle.length > 40 ? '...' : '') + '</div>' +
             '  <div class="alt-id">' + alt.caseId + '</div>' +
             '</div>';
    }).join('');

    return '<div class="chain-position" data-position="' + pos.position + '">' +
           primaryHTML +
           '  <div class="case-alternatives">' +
           alternativesHTML +
           '  </div>' +
           '</div>';
  }).join('<div class="chain-arrow">→</div>');

  return '<!DOCTYPE html>' +
'<html>' +
'<head>' +
'  <base target="_top">' +
'  <style>' +
'    * { margin: 0; padding: 0; box-sizing: border-box; }' +
'' +
'    body {' +
'      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;' +
'      background: linear-gradient(135deg, #0f1115 0%, #1a1d26 100%);' +
'      color: #e7eaf0;' +
'      overflow-x: hidden;' +
'      height: 1000px;' +
'    }' +
'' +
'    .header {' +
'      background: linear-gradient(135deg, #1b1f2a 0%, #141824 100%);' +
'      padding: 20px 32px;' +
'      border-bottom: 2px solid #2a3040;' +
'      display: flex;' +
'      justify-content: space-between;' +
'      align-items: center;' +
'    }' +
'' +
'    .header-left {' +
'      display: flex;' +
'      align-items: center;' +
'      gap: 16px;' +
'    }' +
'' +
'    .btn-back {' +
'      background: #141824;' +
'      border: 1px solid #2a3040;' +
'      color: #e7eaf0;' +
'      padding: 10px 16px;' +
'      border-radius: 8px;' +
'      cursor: pointer;' +
'      font-size: 14px;' +
'      font-weight: 600;' +
'      transition: all 0.2s;' +
'    }' +
'' +
'    .btn-back:hover {' +
'      background: #1b1f2a;' +
'      border-color: #3a4458;' +
'    }' +
'' +
'    .pathway-info h1 {' +
'      font-size: 24px;' +
'      font-weight: 700;' +
'      margin-bottom: 4px;' +
'    }' +
'' +
'    .pathway-info .meta {' +
'      font-size: 13px;' +
'      color: #8b92a0;' +
'    }' +
'' +
'    .header-right {' +
'      display: flex;' +
'      gap: 12px;' +
'    }' +
'' +
'    .btn-save {' +
'      background: linear-gradient(135deg, #2357ff 0%, #1a47d9 100%);' +
'      border: none;' +
'      color: #fff;' +
'      padding: 10px 20px;' +
'      border-radius: 8px;' +
'      cursor: pointer;' +
'      font-size: 14px;' +
'      font-weight: 600;' +
'      transition: all 0.2s;' +
'    }' +
'' +
'    .btn-save:hover {' +
'      background: linear-gradient(135deg, #1a47d9 0%, #1538b8 100%);' +
'      transform: translateY(-1px);' +
'    }' +
'' +
'    /* Logic Type Selector */' +
'    .logic-type-bar {' +
'      background: #0f1115;' +
'      border-bottom: 1px solid #2a3040;' +
'      padding: 16px 32px;' +
'      display: flex;' +
'      gap: 20px;' +
'      align-items: flex-start;' +
'    }' +
'' +
'    .logic-type-selector {' +
'      display: flex;' +
'      flex-direction: column;' +
'      gap: 8px;' +
'      min-width: 320px;' +
'    }' +
'' +
'    .logic-type-label {' +
'      font-size: 12px;' +
'      font-weight: 600;' +
'      color: #8b92a0;' +
'      text-transform: uppercase;' +
'      letter-spacing: 0.5px;' +
'    }' +
'' +
'    .logic-type-dropdown {' +
'      background: #141824;' +
'      border: 1px solid #2a3040;' +
'      color: #e7eaf0;' +
'      padding: 10px 14px;' +
'      border-radius: 8px;' +
'      font-size: 14px;' +
'      font-weight: 600;' +
'      cursor: pointer;' +
'      transition: all 0.2s;' +
'      appearance: none;' +
'      background-image: url("data:image/svg+xml,%3Csvg width=\'12\' height=\'8\' viewBox=\'0 0 12 8\' fill=\'none\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M1 1L6 6L11 1\' stroke=\'%238b92a0\' stroke-width=\'2\' stroke-linecap=\'round\'/%3E%3C/svg%3E");' +
'      background-repeat: no-repeat;' +
'      background-position: right 12px center;' +
'      padding-right: 36px;' +
'    }' +
'' +
'    .logic-type-dropdown:hover {' +
'      background: #1b1f2a;' +
'      border-color: #3a4458;' +
'    }' +
'' +
'    .logic-type-dropdown:focus {' +
'      outline: none;' +
'      border-color: #2357ff;' +
'      box-shadow: 0 0 0 3px rgba(35, 87, 255, 0.1);' +
'    }' +
'' +
'    .logic-type-explanation {' +
'      flex: 1;' +
'      background: linear-gradient(135deg, #1e2533 0%, #181d28 100%);' +
'      border: 1px solid #2a3040;' +
'      border-left: 3px solid #2357ff;' +
'      padding: 12px 16px;' +
'      border-radius: 8px;' +
'    }' +
'' +
'    .logic-type-explanation h4 {' +
'      font-size: 13px;' +
'      font-weight: 700;' +
'      color: #2357ff;' +
'      margin-bottom: 6px;' +
'    }' +
'' +
'    .logic-type-explanation p {' +
'      font-size: 12px;' +
'      color: #8b92a0;' +
'      line-height: 1.5;' +
'      margin: 0;' +
'    }' +
'' +
'    .logic-type-meta {' +
'      display: flex;' +
'      gap: 16px;' +
'      margin-top: 8px;' +
'      font-size: 11px;' +
'    }' +
'' +
'    .logic-type-meta span {' +
'      color: #6b7280;' +
'    }' +
'' +
'    .logic-type-meta .audience {' +
'      color: #2357ff;' +
'    }' +
'' +
'    /* AI Generator and Custom Input */' +
'    .logic-type-actions {' +
'      display: flex;' +
'      gap: 12px;' +
'      margin-top: 12px;' +
'      padding-top: 12px;' +
'      border-top: 1px solid #2a3040;' +
'    }' +
'' +
'    .btn-generate-logic {' +
'      background: linear-gradient(135deg, #10b981 0%, #059669 100%);' +
'      border: none;' +
'      color: #fff;' +
'      padding: 8px 16px;' +
'      border-radius: 6px;' +
'      cursor: pointer;' +
'      font-size: 12px;' +
'      font-weight: 600;' +
'      transition: all 0.2s;' +
'      display: flex;' +
'      align-items: center;' +
'      gap: 6px;' +
'    }' +
'' +
'    .btn-generate-logic:hover {' +
'      background: linear-gradient(135deg, #059669 0%, #047857 100%);' +
'      transform: translateY(-1px);' +
'    }' +
'' +
'    .custom-logic-input {' +
'      flex: 1;' +
'      background: #141824;' +
'      border: 1px solid #2a3040;' +
'      color: #e7eaf0;' +
'      padding: 8px 12px;' +
'      border-radius: 6px;' +
'      font-size: 12px;' +
'      transition: all 0.2s;' +
'    }' +
'' +
'    .custom-logic-input::placeholder {' +
'      color: #6b7280;' +
'      font-style: italic;' +
'    }' +
'' +
'    .custom-logic-input:focus {' +
'      outline: none;' +
'      border-color: #2357ff;' +
'      box-shadow: 0 0 0 3px rgba(35, 87, 255, 0.1);' +
'    }' +
'' +
'    .btn-apply-custom {' +
'      background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);' +
'      border: none;' +
'      color: #fff;' +
'      padding: 8px 16px;' +
'      border-radius: 6px;' +
'      cursor: pointer;' +
'      font-size: 12px;' +
'      font-weight: 600;' +
'      transition: all 0.2s;' +
'    }' +
'' +
'    .btn-apply-custom:hover {' +
'      background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);' +
'      transform: translateY(-1px);' +
'    }' +
'' +
'    .btn-save-logic {' +
'      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);' +
'      border: none;' +
'      color: #fff;' +
'      padding: 8px 16px;' +
'      border-radius: 6px;' +
'      cursor: pointer;' +
'      font-size: 12px;' +
'      font-weight: 600;' +
'      transition: all 0.2s;' +
'    }' +
'' +
'    .btn-save-logic:hover {' +
'      background: linear-gradient(135deg, #d97706 0%, #b45309 100%);' +
'      transform: translateY(-1px);' +
'    }' +
'' +
'    .chain-container {' +
'      display: flex;' +
'      flex-direction: row;' +
'      gap: 6px;' +
'      padding: 12px 4px;' +
'      overflow-x: auto;' +
'      overflow-y: hidden;' +
'      height: calc(1000px - 120px);' +
'      align-items: flex-start;' +
'    }' +
'' +
'    .chain-container::-webkit-scrollbar {' +
'      height: 10px;' +
'    }' +
'' +
'    .chain-container::-webkit-scrollbar-track {' +
'      background: #0f1115;' +
'    }' +
'' +
'    .chain-container::-webkit-scrollbar-thumb {' +
'      background: #2a3040;' +
'      border-radius: 5px;' +
'    }' +
'' +
'    .chain-position {' +
'      display: flex;' +
'      flex-direction: column;' +
'      align-items: center;' +
'      min-width: 140px;' +
'      flex-shrink: 0;' +
'    }' +
'' +
'    .case-primary {' +
'      width: 140px;' +
'      min-height: 90px;' +
'      background: linear-gradient(135deg, #1e2533 0%, #181d28 100%);' +
'      border: 2px solid #2357ff;' +
'      border-radius: 8px;' +
'      padding: 8px;' +
'      cursor: grab;' +
'      transition: all 0.3s ease;' +
'      box-shadow: 0 4px 16px rgba(35, 87, 255, 0.4);' +
'      opacity: 1.0;' +
'      transform: scale(1.0);' +
'      position: relative;' +
'      font-size: 11px;' +
'    }' +
'' +
'    .case-primary:active {' +
'      cursor: grabbing;' +
'      transform: scale(1.05);' +
'    }' +
'' +
'    .case-header {' +
'      display: flex;' +
'      justify-content: space-between;' +
'      align-items: center;' +
'      margin-bottom: 12px;' +
'    }' +
'' +
'    .case-id {' +
'      font-size: 12px;' +
'      font-weight: 700;' +
'      color: #2357ff;' +
'      background: #0f1115;' +
'      padding: 4px 10px;' +
'      border-radius: 6px;' +
'    }' +
'' +
'    .case-row {' +
'      font-size: 11px;' +
'      color: #8b92a0;' +
'    }' +
'' +
'    .case-title {' +
'      font-size: 14px;' +
'      font-weight: 600;' +
'      color: #e7eaf0;' +
'      margin-bottom: 8px;' +
'      line-height: 1.4;' +
'    }' +
'' +
'    .case-diagnosis {' +
'      font-size: 9px;' +
'      color: #ff9500;' +
'      margin-top: 2px;' +
'      font-weight: 600;' +
'    }' +
'' +
'    .case-learning {' +
'      font-size: 8px;' +
'      color: #00d4ff;' +
'      margin-top: 2px;' +
'      line-height: 1.2;' +
'    }' +
'' +
'    .case-rationale {' +
'      display: none;' +
'    }' +
'' +
'    .case-primary {' +
'      position: relative;' +
'    }' +
'' +
'    .case-primary:hover::after {' +
'      content: attr(data-rationale);' +
'      position: absolute;' +
'      bottom: 100%;' +
'      left: 50%;' +
'      transform: translateX(-50%);' +
'      background: rgba(35, 87, 255, 0.95);' +
'      color: #ffffff;' +
'      padding: 8px 12px;' +
'      border-radius: 6px;' +
'      font-size: 11px;' +
'      line-height: 1.3;' +
'      white-space: normal;' +
'      max-width: 280px;' +
'      width: max-content;' +
'      z-index: 1000;' +
'      margin-bottom: 8px;' +
'      box-shadow: 0 4px 12px rgba(0,0,0,0.3);' +
'      pointer-events: none;' +
'    }' +
'' +
'    .case-alternatives {' +
'      display: flex;' +
'      flex-direction: column;' +
'      gap: 8px;' +
'      margin-top: 16px;' +
'      width: 280px;' +
'    }' +
'' +
'    .case-alternative {' +
'      width: 100%;' +
'      min-height: 60px;' +
'      background: #0f1115;' +
'      border: 1px solid #2a3040;' +
'      border-radius: 8px;' +
'      padding: 10px 12px;' +
'      cursor: pointer;' +
'      transition: all 0.3s ease;' +
'      opacity: 0.5;' +
'      transform: scale(0.92);' +
'    }' +
'' +
'    .case-alternative:hover {' +
'      opacity: 0.85;' +
'      transform: scale(0.96);' +
'      border-color: #2357ff;' +
'      background: #141824;' +
'    }' +
'' +
'    .alt-title {' +
'      font-size: 13px;' +
'      color: #e7eaf0;' +
'      margin-bottom: 4px;' +
'      font-weight: 500;' +
'    }' +
'' +
'    .alt-id {' +
'      font-size: 11px;' +
'      color: #8b92a0;' +
'    }' +
'' +
'    .chain-arrow {' +
'      font-size: 32px;' +
'      color: #2357ff;' +
'      align-self: center;' +
'      margin-top: 60px;' +
'      flex-shrink: 0;' +
'    }' +
'' +
'    .btn-add-case {' +
'      width: 280px;' +
'      height: 180px;' +
'      background: #141824;' +
'      border: 2px dashed #2a3040;' +
'      border-radius: 12px;' +
'      display: flex;' +
'      flex-direction: column;' +
'      align-items: center;' +
'      justify-content: center;' +
'      cursor: pointer;' +
'      transition: all 0.3s;' +
'      flex-shrink: 0;' +
'      margin-top: 0;' +
'      align-self: flex-start;' +
'    }' +
'' +
'    .btn-add-case:hover {' +
'      background: #1b1f2a;' +
'      border-color: #2357ff;' +
'    }' +
'' +
'    .btn-add-case .icon {' +
'      font-size: 48px;' +
'      margin-bottom: 12px;' +
'      opacity: 0.5;' +
'    }' +
'' +
'    .btn-add-case .text {' +
'      font-size: 14px;' +
'      color: #8b92a0;' +
'      font-weight: 600;' +
'    }' +
'  </style>' +
'</head>' +
'<body>' +
'  <div class="header">' +
'    <div class="header-left">' +
'      <button class="btn-back" onclick="goBack()">← Back</button>' +
'      <div class="pathway-info">' +
'        <h1>' + pathway.icon + ' ' + pathway.name + '</h1>' +
'        <div class="meta">' + chain.length + ' cases in sequence • ' + pathway.logicType + ' pathway</div>' +
'      </div>' +
'    </div>' +
'    <div class="header-right">' +
'      <button class="btn-save" onclick="savePathway()">💾 Save Pathway</button>' +
'    </div>' +
'  </div>' +
'' +
'  <div class="logic-type-bar">' +
'    <div class="logic-type-selector">' +
'      <div class="logic-type-label">🧠 Intelligent Ordering Logic</div>' +
'      <select class="logic-type-dropdown" id="logicTypeSelector" onchange="changeLogicType()">' +
'        ' + logicTypeOptionsHTML +
'      </select>' +
'    </div>' +
'    <div class="logic-type-explanation" id="logicTypeExplanation">' +
'      <h4>' + logicType.icon + ' ' + logicType.name + '</h4>' +
'      <p>' + logicType.explanation + '</p>' +
'      <div class="logic-type-meta">' +
'        <span>👥 <span class="audience">' + logicType.targetAudience + '</span></span>' +
'        <span>• ' + logicType.whenToUse + '</span>' +
'      </div>' +
'      <div class="logic-type-actions">' +
'        <button class="btn-generate-logic" onclick="generateNewLogicType()">' +
'          <span>🤖</span>' +
'          <span>AI: Generate New Logic Type</span>' +
'        </button>' +
'        <input type="text" class="custom-logic-input" id="customLogicInput" ' +
'          placeholder="✨ Or describe your own logic type (e.g., \'Order by likelihood of misdiagnosis\')..." />' +
'        <button class="btn-apply-custom" onclick="applyCustomLogic()">Apply</button>' +
'        <button class="btn-save-logic" onclick="saveCurrentLogic()" title="Save this logic type for future use">' +
'          💾 Save' +
'        </button>' +
'      </div>' +
'    </div>' +
'  </div>' +
'' +
'  <div class="chain-container" id="chainContainer">' +
'    ' + chainPositionsHTML +
'    <div class="chain-arrow">→</div>' +
'    <button class="btn-add-case" onclick="addCase()">' +
'      <div class="icon">+</div>' +
'      <div class="text">Add Case</div>' +
'    </button>' +
'  </div>' +
'' +
'  <script>' +
'    let pathwayData = ' + JSON.stringify({id: pathway.id, name: pathway.name, chain: chain, logicType: logicType}) + ';' +
'    let allLogicTypes = ' + JSON.stringify(allLogicTypes) + ';' +
'' +
'    function changeLogicType() {' +
'      const newLogicTypeId = document.getElementById("logicTypeSelector").value;' +
'      console.log("🔄 Changing logic type to:", newLogicTypeId);' +
'      ' +
'      // Show loading state' +
'      document.getElementById("chainContainer").innerHTML = ' +
'        \'<div style="text-align:center; padding:100px; width:100%;"><h2>⚙️ Reordering chain...</h2><p style="color: #8b92a0;">Applying new logic type</p></div>\';' +
'      ' +
'      // Reload with new logic type' +
'      google.script.run' +
'        .withSuccessHandler(function(html) {' +
'          document.documentElement.innerHTML = html;' +
'        })' +
'        .withFailureHandler(function(error) {' +
'          alert("Error changing logic type: " + error.message);' +
'          location.reload();' +
'        })' +
'        .buildChainBuilderUI(\'' + pathway.id + '\', newLogicTypeId);' +
'    }' +
'' +
'    function generateNewLogicType() {' +
'      console.log("🤖 Generating new logic type using AI...");' +
'      ' +
'      // Show loading state' +
'      const btn = event.target.closest(".btn-generate-logic");' +
'      const originalHTML = btn.innerHTML;' +
'      btn.innerHTML = "<span>⏳</span><span>AI is analyzing cases...</span>";' +
'      btn.disabled = true;' +
'      ' +
'      // Call server-side ChatGPT integration' +
'      google.script.run' +
'        .withSuccessHandler(function(newLogicType) {' +
'          console.log("✅ AI generated new logic type:", newLogicType);' +
'          ' +
'          // Show preview dialog' +
'          const useIt = confirm(' +
'            "🤖 AI GENERATED NEW LOGIC TYPE\\n\\n" +' +
'            "Name: " + newLogicType.name + "\\n" +' +
'            "Icon: " + newLogicType.icon + "\\n\\n" +' +
'            "Description: " + newLogicType.description + "\\n\\n" +' +
'            "Explanation: " + newLogicType.explanation + "\\n\\n" +' +
'            "Target Audience: " + newLogicType.targetAudience + "\\n\\n" +' +
'            "Would you like to apply this logic type to your chain?"' +
'          );' +
'          ' +
'          btn.innerHTML = originalHTML;' +
'          btn.disabled = false;' +
'          ' +
'          if (useIt) {' +
'            // Add to temporary logic types and apply' +
'            allLogicTypes.push(newLogicType);' +
'            applyDynamicLogic(newLogicType);' +
'          }' +
'        })' +
'        .withFailureHandler(function(error) {' +
'          console.error("❌ AI logic generation failed:", error);' +
'          alert("Error generating logic type: " + error.message);' +
'          btn.innerHTML = originalHTML;' +
'          btn.disabled = false;' +
'        })' +
'        .generateLogicTypeWithAI(\'' + pathway.id + '\');' +
'    }' +
'' +
'    function applyCustomLogic() {' +
'      const customDescription = document.getElementById("customLogicInput").value.trim();' +
'      if (!customDescription) {' +
'        alert("Please describe your desired logic type first!");' +
'        return;' +
'      }' +
'      ' +
'      console.log("✨ Applying custom logic:", customDescription);' +
'      ' +
'      // Show loading' +
'      const btn = event.target;' +
'      btn.innerHTML = "⏳ Analyzing...";' +
'      btn.disabled = true;' +
'      ' +
'      // Have AI interpret the custom description and create logic type' +
'      google.script.run' +
'        .withSuccessHandler(function(customLogicType) {' +
'          console.log("✅ Custom logic type created:", customLogicType);' +
'          ' +
'          // Add to temporary logic types and apply' +
'          allLogicTypes.push(customLogicType);' +
'          applyDynamicLogic(customLogicType);' +
'          ' +
'          btn.innerHTML = "Apply";' +
'          btn.disabled = false;' +
'          document.getElementById("customLogicInput").value = "";' +
'        })' +
'        .withFailureHandler(function(error) {' +
'          alert("Error creating custom logic: " + error.message);' +
'          btn.innerHTML = "Apply";' +
'          btn.disabled = false;' +
'        })' +
'        .interpretCustomLogicDescription(customDescription, \'' + pathway.id + '\');' +
'    }' +
'' +
'    function applyDynamicLogic(logicType) {' +
'      console.log("🔄 Applying dynamic logic type:", logicType.id);' +
'      ' +
'      // Show loading state' +
'      document.getElementById("chainContainer").innerHTML = ' +
'        \'<div style="text-align:center; padding:100px; width:100%;"><h2>⚙️ Reordering with custom logic...</h2><p style="color: #8b92a0;">Applying: \' + logicType.name + \'</p></div>\';' +
'      ' +
'      // Apply the dynamic logic type' +
'      google.script.run' +
'        .withSuccessHandler(function(html) {' +
'          document.documentElement.innerHTML = html;' +
'        })' +
'        .withFailureHandler(function(error) {' +
'          alert("Error applying dynamic logic: " + error.message);' +
'          location.reload();' +
'        })' +
'        .applyDynamicLogicType(\'' + pathway.id + '\', logicType);' +
'    }' +
'' +
'    function saveCurrentLogic() {' +
'      const currentLogicTypeId = document.getElementById("logicTypeSelector").value;' +
'      const currentLogic = allLogicTypes.find(function(lt) { return lt.id === currentLogicTypeId; });' +
'      ' +
'      if (!currentLogic) {' +
'        alert("No logic type selected!");' +
'        return;' +
'      }' +
'      ' +
'      // Check if it\'s a custom/dynamic logic type (not in the original 12)' +
'      const isCustom = currentLogic.id.startsWith("custom_") || currentLogic.id.startsWith("ai_");' +
'      ' +
'      if (!isCustom) {' +
'        alert("This is a built-in logic type - already saved!");' +
'        return;' +
'      }' +
'      ' +
'      const logicName = prompt("Save this logic type as:", currentLogic.name);' +
'      if (!logicName) return;' +
'      ' +
'      console.log("💾 Saving custom logic type:", logicName);' +
'      ' +
'      google.script.run' +
'        .withSuccessHandler(function() {' +
'          alert("✅ Logic type \\"" + logicName + "\\" saved successfully!\\n\\nIt will now appear in the dropdown for all future sessions.");' +
'        })' +
'        .withFailureHandler(function(error) {' +
'          alert("Error saving logic type: " + error.message);' +
'        })' +
'        .saveCustomLogicType(Object.assign({}, currentLogic, { name: logicName }));' +
'    }' +
'' +
'    function goBack() {' +
'      google.script.host.close();' +
'      google.script.run.runPathwayChainBuilder();' +
'    }' +
'' +
'    function swapCase(position, newCaseId) {' +
'      console.log("Swapping position " + position + " with case " + newCaseId);' +
'      ' +
'      // Find current primary and alternative' +
'      const positionData = pathwayData.chain[position - 1];' +
'      const currentPrimary = positionData.primary;' +
'      ' +
'      // Find the alternative being clicked' +
'      let clickedAlt = null;' +
'      let altIndex = -1;' +
'      for (let i = 0; i < positionData.alternatives.length; i++) {' +
'        if (positionData.alternatives[i].caseId === newCaseId) {' +
'          clickedAlt = positionData.alternatives[i];' +
'          altIndex = i;' +
'          break;' +
'        }' +
'      }' +
'      ' +
'      if (!clickedAlt) return;' +
'      ' +
'      // Swap' +
'      pathwayData.chain[position - 1].primary = clickedAlt;' +
'      pathwayData.chain[position - 1].alternatives[altIndex] = currentPrimary;' +
'      ' +
'      // Re-render (for now, just reload)' +
'      alert("Swapped! Full re-render coming in Phase 2C...");' +
'    }' +
'' +
'    function savePathway() {' +
'      alert("Save functionality coming in Phase 2F (Persistence)!");' +
'    }' +
'' +
'    function addCase() {' +
'      alert("Add case functionality coming in Phase 2C!");' +
'    }' +
'  </script>' +
'</body>' +
'</html>';
}

// ========== AI PATHWAY DISCOVERY SYSTEM (DUAL MODE) ==========

/**
 * Generate AI-discovered pathways with two creativity levels
 * creativityMode: 'standard' or 'radical'
 */
function discoverNovelPathwaysWithAI_(creativityMode) {
  creativityMode = creativityMode || 'standard';

  // Refresh headers first to ensure column mappings are current
  Logger.log('🔄 Refreshing headers before AI pathway discovery...');
  try {
    refreshHeaders();
  } catch (e) {
    Logger.log('⚠️  Could not refresh headers: ' + e.message);
  }

  // Get API key from Settings sheet
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const settingsSheet = ss.getSheetByName('Settings');
  let apiKey = '';

  if (settingsSheet) {
    apiKey = settingsSheet.getRange('B2').getValue();
    Logger.log('API key retrieved for ' + creativityMode + ' mode pathway discovery');
  }

  if (!apiKey) {
    return {
      success: false,
      error: 'No OpenAI API key found in Settings!B2',
      pathways: []
    };
  }

  const analysis = analyzeCatalog_();
  const cases = analysis.allCases;

  const caseSummaries = cases.map(function(c) {
    return {
      id: c.caseId,
      title: c.sparkTitle,
      diagnosis: c.diagnosis || 'Not specified',
      learning: (c.learningOutcomes || 'Not specified').substring(0, 100),
      category: c.category
    };
  });

  let temperature = creativityMode === 'radical' ? 1.0 : 0.7;
  let prompt = creativityMode === 'radical'
    ? 'You are Dr. Zara Blackwood, a visionary medical educator. Create pathway groupings so creative they border on experimental. RADICAL CONCEPTS: The Gambler\'s Fallacy, Method Actor\'s Toolkit, Butterfly Effect, Jazz Improvisation. Requirements: Novelty 8-10/10, psychological/cognitive science backing. ANALYZE ' + cases.length + ' CASES. INVENT 5-8 RADICALLY CREATIVE PATHWAYS with pathway_name, pathway_icon, grouping_logic_type, why_this_matters, learning_outcomes, best_for, unique_value, case_ids (min 3), novelty_score (8-10), estimated_learning_time, difficulty_curve, scientific_rationale. Return ONLY valid JSON array.'
    : 'You are Dr. Maria Rodriguez, award-winning medical educator. Create novel pathways beyond traditional categories. FORBIDDEN: Body systems, simple age/acuity. ENCOURAGED: Cognitive biases, emotional journeys, narrative arcs, skill scaffolding, pattern interrupts. EXAMPLES: The Imposter Syndrome Destroyer, The Puzzle Master Series, The 90-Second Saves. ANALYZE ' + cases.length + ' CASES. INVENT 5-8 PATHWAYS with pathway_name, pathway_icon, grouping_logic_type, why_this_matters, learning_outcomes, best_for, unique_value, case_ids (min 3), novelty_score (7+), estimated_learning_time, difficulty_curve. Return ONLY valid JSON array.';

  try {
    const response = UrlFetchApp.fetch('https://api.openai.com/v1/chat/completions', {
      method: 'post',
      headers: {
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: creativityMode === 'radical'
              ? 'You are an experimental medical educator applying cognitive science to education.'
              : 'You are an expert medical educator specializing in innovative curriculum design.'
          },
          {
            role: 'user',
            content: prompt + '\n\nCASES:\n' + JSON.stringify(caseSummaries, null, 2)
          }
        ],
        temperature: temperature,
        max_tokens: 2500
      }),
      muteHttpExceptions: true
    });

    const responseCode = response.getResponseCode();
    if (responseCode !== 200) {
      return { success: false, error: 'OpenAI API error: ' + responseCode, pathways: [] };
    }

    const data = JSON.parse(response.getContentText());
    const aiResponse = data.choices[0].message.content;

    let pathways = [];
    const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
    pathways = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(aiResponse);

    const formattedPathways = pathways.map(function(pw, index) {
      return {
        id: 'ai_' + creativityMode + '_' + (index + 1),
        name: pw.pathway_name || 'Unnamed Pathway',
        logicType: pw.grouping_logic_type || 'ai_discovered',
        icon: pw.pathway_icon || '🤖',
        confidence: (pw.novelty_score || 5) / 10,
        caseCount: (pw.case_ids || []).length,
        pitch: pw.why_this_matters || '',
        learningOutcomes: pw.learning_outcomes || [],
        bestFor: pw.best_for || '',
        uniqueValue: pw.unique_value || '',
        noveltyScore: pw.novelty_score || 5,
        estimatedTime: pw.estimated_learning_time || 'Not specified',
        difficultyCurve: pw.difficulty_curve || 'Unknown',
        scientificRationale: pw.scientific_rationale || '',
        creativityMode: creativityMode,
        suggestedCases: pw.case_ids || []
      };
    });

    return { success: true, pathways: formattedPathways };
  } catch (e) {
    return { success: false, error: e.message, pathways: [] };
  }
}

/**
 * Show AI-discovered pathways
 */
function showAIDiscoveredPathways(creativityMode) {
  creativityMode = creativityMode || 'standard';
  const result = discoverNovelPathwaysWithAI_(creativityMode);

  if (!result.success) {
    SpreadsheetApp.getUi().alert('AI Pathway Discovery Failed', result.error, SpreadsheetApp.getUi().ButtonSet.OK);
    return;
  }

  const modeLabel = creativityMode === 'radical' ? '🔥 RADICAL EXPERIMENTAL' : '🤖 CREATIVE';
  const modeColor = creativityMode === 'radical' ? '#ff6b00' : '#2357ff';

  let html = '<style>body{font-family:Arial;background:#0a0b0e;color:#fff;padding:24px;margin:0}.header{text-align:center;margin-bottom:32px}.header h1{font-size:28px;background:linear-gradient(135deg,' + modeColor + ',#00d4ff);-webkit-background-clip:text;-webkit-text-fill-color:transparent}.pathway-card{background:linear-gradient(135deg,#1a1f2e,#141824);border:2px solid transparent;border-radius:16px;padding:24px;margin-bottom:24px;position:relative;overflow:hidden;transition:all .3s}.pathway-card:hover{transform:translateY(-4px);box-shadow:0 12px 32px rgba(' + (creativityMode === 'radical' ? '255,107,0' : '35,87,255') + ',.3)}.pathway-icon{font-size:42px}.pathway-name{font-size:22px;font-weight:700}.pitch-title{font-size:13px;font-weight:600;color:#ff9500;text-transform:uppercase;margin:12px 0 8px}.pitch-text{font-size:15px;line-height:1.7;color:#e0e0e0}.stars{color:#ffd700;margin-left:8px}.create-btn{background:linear-gradient(135deg,' + modeColor + ',' + (creativityMode === 'radical' ? '#cc5500' : '#1a47cc') + ');color:#fff;border:none;padding:12px 20px;border-radius:8px;cursor:pointer;font-size:15px;font-weight:600;margin-top:16px}</style>';

  html += '<div class="header"><h1>' + modeLabel + ' AI-Discovered Pathways</h1><p>' +
    (creativityMode === 'radical' ? 'Experimental groupings pushing educational boundaries' : 'Creative pathways for maximum learning impact') +
    '</p></div>';

  result.pathways.forEach(function(pw) {
    const stars = '⭐'.repeat(Math.min(5, Math.round(pw.noveltyScore / 2)));
    html += '<div class="pathway-card">';
    html += '<div class="pathway-icon">' + pw.icon + '</div>';
    html += '<div class="pathway-name">' + pw.name + '<span class="stars">' + stars + '</span></div>';
    html += '<div class="pitch-title">🎯 Why This Matters</div>';
    html += '<div class="pitch-text">' + pw.pitch + '</div>';
    html += '<button class="create-btn" onclick="alert(\'Coming soon!\')">🚀 Build This Pathway Now</button>';
    html += '</div>';
  });

  const htmlOutput = HtmlService.createHtmlOutput(html).setWidth(800).setHeight(600);
  SpreadsheetApp.getUi().showModalDialog(htmlOutput, modeLabel + ' AI-Discovered Pathways');
}

function showAIPathwaysStandard() {
  showAIDiscoveredPathways('standard');
}

function showAIPathwaysRadical() {
  showAIDiscoveredPathways('radical');
}
/**
 * AI PATHWAY DISCOVERY - STREAMING LOGS (No Background Execution)
 * Uses server-side logging with client polling
 */

// Global log storage
var AI_DISCOVERY_LOGS = [];

/**
 * Main entry point - shows log window and triggers discovery
 */
function showAIPathwaysStandardWithLogs() {
  showAIDiscoveryWithStreamingLogs_('standard');
}

function showAIPathwaysRadicalWithLogs() {
  showAIDiscoveryWithStreamingLogs_('radical');
}

/**
 * PRE-CACHE RICH DATA WITH LIVE PROGRESS
 * Shows live progress window as it caches all 210+ cases with 23 fields each
 */
function preCacheRichData() {
  const html = '<style>' +
    'body{font-family:monospace;background:#0a0b0e;color:#0f0;padding:20px;margin:0}' +
    '.header{color:#00c853;font-size:18px;font-weight:bold;margin-bottom:20px;border-bottom:2px solid #00c853;padding-bottom:10px}' +
    '.status{background:#1a1a1a;border:1px solid #00c853;padding:15px;border-radius:8px;margin-bottom:15px}' +
    '.progress-bar{background:#1a1a1a;border:1px solid #00c853;height:30px;border-radius:6px;overflow:hidden;margin:10px 0}' +
    '.progress-fill{background:linear-gradient(90deg,#00c853,#00ff6a);height:100%;transition:width 0.3s ease;display:flex;align-items:center;justify-content:center;color:#000;font-weight:bold}' +
    '.log-container{background:#000;border:1px solid #00c853;padding:15px;border-radius:8px;max-height:300px;overflow-y:auto;font-size:13px;line-height:1.8}' +
    '.log-line{margin:3px 0;padding:3px;color:#0ff}' +
    '.log-line.success{color:#0f0}' +
    '.log-line.warning{color:#ff0}' +
    '.timestamp{color:#666;margin-right:8px;font-size:11px}' +
    '</style>' +
    '<div class="header">💾 PRE-CACHING RICH CLINICAL DATA</div>' +
    '<div class="status" id="status">🚀 Initializing cache process...</div>' +
    '<div class="progress-bar"><div class="progress-fill" id="progress" style="width:0%">0%</div></div>' +
    '<div class="log-container" id="logs"></div>' +
    '<script>' +
    'var startTime = Date.now();' +
    'function addLog(message, type) {' +
    '  var logs = document.getElementById("logs");' +
    '  var elapsed = Math.floor((Date.now() - startTime) / 1000);' +
    '  var mins = Math.floor(elapsed / 60);' +
    '  var secs = elapsed % 60;' +
    '  var timestamp = mins.toString().padStart(2, "0") + ":" + secs.toString().padStart(2, "0");' +
    '  var line = document.createElement("div");' +
    '  line.className = "log-line " + (type || "");' +
    '  line.innerHTML = "<span class=\\"timestamp\\">[" + timestamp + "]</span>" + message;' +
    '  logs.appendChild(line);' +
    '  logs.scrollTop = logs.scrollHeight;' +
    '}' +
    'function updateStatus(text) {' +
    '  document.getElementById("status").textContent = text;' +
    '}' +
    'function updateProgress(percent, cases) {' +
    '  var progress = document.getElementById("progress");' +
    '  progress.style.width = percent + "%";' +
    '  progress.textContent = percent + "% (" + cases + " cases)";' +
    '}' +
    'addLog("🔧 Starting holistic analysis engine...", "");' +
    'updateStatus("⏳ Processing all cases with full clinical context...");' +
    'google.script.run' +
    '  .withSuccessHandler(function(result) {' +
    '    if (result.success) {' +
    '      updateProgress(100, result.casesProcessed);' +
    '      addLog("✅ SUCCESS! Processed " + result.casesProcessed + " cases", "success");' +
    '      addLog("💾 Cache stored in Pathway_Analysis_Cache sheet", "success");' +
    '      addLog("📊 All 23 fields per case cached (demographics + vitals + clinical context)", "success");' +
    '      addLog("⚡ Valid for 24 hours", "success");' +
    '      addLog("🎯 AI discovery will now be INSTANT!", "success");' +
    '      updateStatus("✅ COMPLETE! Cache ready for instant AI discovery");' +
    '      setTimeout(function() { google.script.host.close(); }, 3000);' +
    '    } else {' +
    '      addLog("❌ ERROR: " + result.error, "warning");' +
    '      updateStatus("❌ Cache failed - check logs");' +
    '    }' +
    '  })' +
    '  .withFailureHandler(function(error) {' +
    '    addLog("❌ FAILED: " + error.message, "warning");' +
    '    updateStatus("❌ Cache process failed");' +
    '  })' +
    '  .performCacheWithProgress();' +
    '</script>';

  const htmlOutput = HtmlService.createHtmlOutput(html).setWidth(900).setHeight(500);
  SpreadsheetApp.getUi().showModalDialog(htmlOutput, '💾 Pre-Caching Rich Clinical Data');

  // Note: After user closes this modal, we can't automatically reopen the panel
  // because Apps Script doesn't support chaining modal dialogs.
  // Instead, we'll add a "Return to Panel" button in the completion UI
}

/**
 * Backend function to perform caching with progress updates
 */
function performCacheWithProgress() {
  try {
    Logger.log('Starting performHolisticAnalysis_()...');
    const startTime = new Date().getTime();

    // Force fresh analysis (forceRefresh = true)
    const analysis = getOrCreateHolisticAnalysis_(true);

    const elapsed = ((new Date().getTime() - startTime) / 1000).toFixed(1);
    const casesProcessed = analysis.allCases ? analysis.allCases.length : 0;

    Logger.log('✅ Analysis complete in ' + elapsed + 's - ' + casesProcessed + ' cases processed');

    return {
      success: true,
      casesProcessed: casesProcessed,
      elapsed: elapsed,
      fieldsPerCase: 23
    };
  } catch (e) {
    Logger.log('❌ Error in performCacheWithProgress: ' + e.message);
    return {
      success: false,
      error: e.message
    };
  }
}

/**
 * Get cache status for UI indicator
 * Returns: { status: 'valid'|'stale'|'missing', hoursOld, expiresIn, cases }
 */
function getCacheStatus() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const cacheSheet = ss.getSheetByName('Pathway_Analysis_Cache');

    if (!cacheSheet) {
      return {
        status: 'missing',
        message: 'Not cached',
        icon: '❌'
      };
    }

    const data = cacheSheet.getDataRange().getValues();
    if (data.length < 2) {
      return {
        status: 'missing',
        message: 'Cache empty',
        icon: '⚠️'
      };
    }

    const cachedTimestamp = new Date(data[1][0]);
    const now = new Date();
    const hoursDiff = (now - cachedTimestamp) / (1000 * 60 * 60);
    const hoursRemaining = 24 - hoursDiff;

    // Parse JSON to get case count
    let caseCount = 0;
    try {
      const parsed = JSON.parse(data[1][1]);
      caseCount = parsed.allCases ? parsed.allCases.length : 0;
    } catch (e) {
      // Ignore parse errors
    }

    if (hoursDiff < 24) {
      return {
        status: 'valid',
        hoursOld: hoursDiff.toFixed(1),
        expiresIn: hoursRemaining.toFixed(1),
        cases: caseCount,
        message: 'Cached ' + hoursDiff.toFixed(0) + 'h ago',
        icon: '✅'
      };
    } else {
      return {
        status: 'stale',
        hoursOld: hoursDiff.toFixed(1),
        cases: caseCount,
        message: 'Cache expired',
        icon: '⚠️'
      };
    }
  } catch (e) {
    return {
      status: 'error',
      message: 'Error checking cache',
      icon: '❌'
    };
  }
}

/**
 * Show live log window that polls for updates
 */
function showAIDiscoveryWithStreamingLogs_(creativityMode) {
  AI_DISCOVERY_LOGS = []; // Reset

  const modeLabel = creativityMode === 'radical' ? '🔥 RADICAL MODE' : '🤖 STANDARD MODE';

  const html = '<style>' +
    'body{font-family:monospace;background:#0a0b0e;color:#0f0;padding:20px;margin:0}' +
    '.header{color:#0ff;font-size:18px;font-weight:bold;margin-bottom:20px;border-bottom:2px solid #0ff;padding-bottom:10px}' +
    '.log-container{background:#000;border:1px solid #0f0;padding:15px;border-radius:8px;max-height:500px;overflow-y:auto;font-size:13px;line-height:1.6}' +
    '.log-line{margin:5px 0;padding:5px;border-left:3px solid #0f0}' +
    '.log-line.info{border-left-color:#0ff;color:#0ff}' +
    '.log-line.success{border-left-color:#0f0;color:#0f0}' +
    '.log-line.warning{border-left-color:#ff0;color:#ff0}' +
    '.log-line.error{border-left-color:#f00;color:#f00}' +
    '.timestamp{color:#666;margin-right:10px;font-size:11px}' +
    '.status{margin-top:15px;padding:10px;background:#1a1a1a;border-radius:6px;text-align:center;color:#0ff}' +
    '</style>' +
    '<div class="header">🤖 AI PATHWAY DISCOVERY - LIVE LOGS (' + modeLabel + ')</div>' +
    '<div class="status" id="status">▶️ Starting discovery...</div>' +
    '<div class="log-container" id="logs"></div>' +
    '<script>' +
    'var mode = "' + creativityMode + '";' +
    'var logIndex = 0;' +
    'var pollInterval = null;' +
    'var startTime = Date.now();' +
    'function addLog(message, type) {' +
    '  var logs = document.getElementById("logs");' +
    '  var elapsed = Math.floor((Date.now() - startTime) / 1000);' +
    '  var mins = Math.floor(elapsed / 60);' +
    '  var secs = elapsed % 60;' +
    '  var timestamp = mins.toString().padStart(2, "0") + ":" + secs.toString().padStart(2, "0");' +
    '  var line = document.createElement("div");' +
    '  line.className = "log-line " + type;' +
    '  line.innerHTML = "<span class=\\"timestamp\\">[" + timestamp + "]</span>" + message;' +
    '  logs.appendChild(line);' +
    '  logs.scrollTop = logs.scrollHeight;' +
    '}' +
    'function updateStatus(text) {' +
    '  document.getElementById("status").textContent = text;' +
    '}' +
    'function pollLogs() {' +
    '  google.script.run' +
    '    .withSuccessHandler(function(result) {' +
    '      if (result.logs && result.logs.length > logIndex) {' +
    '        for (var i = logIndex; i < result.logs.length; i++) {' +
    '          addLog(result.logs[i].message, result.logs[i].type);' +
    '        }' +
    '        logIndex = result.logs.length;' +
    '      }' +
    '      if (result.status) {' +
    '        updateStatus(result.status);' +
    '      }' +
    '      if (result.complete) {' +
    '        clearInterval(pollInterval);' +
    '        updateStatus("✅ Complete! Showing results...");' +
    '        if (result.pathways && result.pathways.length > 0) {' +
    '          setTimeout(function() {' +
    '            google.script.host.close();' +
    '            google.script.run.showAIPathwayResults(result.pathways, mode);' +
    '          }, 2000);' +
    '        }' +
    '      }' +
    '    })' +
    '    .withFailureHandler(function(error) {' +
    '      addLog("❌ ERROR: " + error.message, "error");' +
    '      clearInterval(pollInterval);' +
    '      updateStatus("❌ Failed");' +
    '    })' +
    '    .getAIDiscoveryStatus();' +
    '}' +
    'addLog("🚀 Initializing AI discovery in " + mode + " mode...", "info");' +
    'updateStatus("⏳ Calling OpenAI API...");' +
    'pollInterval = setInterval(pollLogs, 300);' +
    'google.script.run' +
    '  .withSuccessHandler(function() { addLog("✅ Discovery started", "success"); })' +
    '  .withFailureHandler(function(error) { addLog("❌ Start failed: " + error.message, "error"); })' +
    '  .startAIDiscovery(mode);' +
    '</script>';

  const htmlOutput = HtmlService.createHtmlOutput(html).setWidth(900).setHeight(600);
  SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'AI Pathway Discovery - Live Progress');
}

/**
 * Start AI discovery (called from client)
 */
function startAIDiscovery(creativityMode) {
  AI_DISCOVERY_LOGS = [];
  AI_DISCOVERY_LOGS.push({ message: '🔧 Server-side execution started', type: 'info', timestamp: new Date().toISOString() });

  // Run discovery synchronously
  discoverPathwaysSync_(creativityMode);
}

/**
 * Get current status (called by polling)
 */
function getAIDiscoveryStatus() {
  return {
    logs: AI_DISCOVERY_LOGS,
    status: AI_DISCOVERY_LOGS.length > 0 ? AI_DISCOVERY_LOGS[AI_DISCOVERY_LOGS.length - 1].message : 'Starting...',
    complete: AI_DISCOVERY_LOGS.some(function(log) { return log.message.indexOf('🎉 COMPLETE') !== -1; }),
    pathways: PropertiesService.getScriptProperties().getProperty('AI_PATHWAYS') ? JSON.parse(PropertiesService.getScriptProperties().getProperty('AI_PATHWAYS')) : []
  };
}

/**
 * Analyze case catalog - SMART CACHING VERSION
 *
 * Three-tier strategy for maximum reliability + rich data:
 * 1. CACHE HIT (instant): Use cached holistic analysis if < 24 hours old
 * 2. FRESH ANALYSIS (slow but rich): Try performHolisticAnalysis_() with 4min timeout
 * 3. LIGHTWEIGHT FALLBACK (fast but basic): Direct sheet read if timeout
 *
 * This preserves all rich clinical context (demographics, vitals, exam findings, etc.)
 */
function analyzeCatalog_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // TIER 1: Try cached analysis first (instant, full rich data - 23 fields per case)
  let cacheSheet = ss.getSheetByName('Pathway_Analysis_Cache');

  if (cacheSheet) {
    const data = cacheSheet.getDataRange().getValues();
    if (data.length > 1) {
      const cachedTimestamp = new Date(data[1][0]);
      const now = new Date();
      const hoursDiff = (now - cachedTimestamp) / (1000 * 60 * 60);

      if (hoursDiff < 24) {
        // Cache hit! Return full rich data instantly
        Logger.log('✅ Using cached holistic analysis (' + hoursDiff.toFixed(1) + ' hours old)');
        return JSON.parse(data[1][1]);
      }
    }
  }

  // TIER 2: No cache or stale - try fresh analysis with timeout protection
  Logger.log('📊 Cache miss or stale - attempting fresh holistic analysis');
  const startTime = new Date().getTime();
  const MAX_TIME = 4 * 60 * 1000; // 4 minutes (leave 2min buffer for 6min timeout)

  try {
    const analysis = performHolisticAnalysis_();
    const elapsed = new Date().getTime() - startTime;

    Logger.log('✅ Fresh analysis completed in ' + (elapsed / 1000).toFixed(1) + 's');

    if (elapsed < MAX_TIME) {
      return analysis; // Success! Got all the rich data + auto-cached for next time
    } else {
      Logger.log('⚠️  Analysis took too long, falling back to lightweight mode');
    }
  } catch (e) {
    Logger.log('⚠️  Error in performHolisticAnalysis_(): ' + e.message);
  }

  // TIER 3: Last resort - lightweight fallback (6 basic fields only)
  Logger.log('📉 Using lightweight analysis fallback');
  const sheet = ss.getSheets().find(function(sh) {
    return /master scenario csv/i.test(sh.getName());
  }) || ss.getActiveSheet();

  const data = sheet.getDataRange().getValues();
  const headers = data[1];

  // Use dynamic header resolution for lightweight fallback
  const fieldMap = {
    caseId: { header: 'Case_Organization_Case_ID', fallback: 0 },
    spark: { header: 'Case_Organization_Spark_Title', fallback: 1 },
    diagnosis: { header: 'Case_Orientation_Chief_Diagnosis', fallback: 7 },
    learning: { header: 'Case_Orientation_Actual_Learning_Outcomes', fallback: 8 },
    category: { header: 'Case_Organization_Category', fallback: 11 },
    pathway: { header: 'Case_Organization_Pathway_or_Course_Name', fallback: 5 }
  };

  const indices = resolveColumnIndices_(fieldMap);
  const caseIdIdx = indices.caseId;
  const sparkIdx = indices.spark;
  const diagnosisIdx = indices.diagnosis;
  const learningIdx = indices.learning;
  const categoryIdx = indices.category;
  const pathwayIdx = indices.pathway;

  const allCases = [];
  for (let i = 2; i < data.length; i++) {
    allCases.push({
      caseId: data[i][caseIdIdx] || '',
      sparkTitle: data[i][sparkIdx] || '',
      diagnosis: data[i][diagnosisIdx] || '',
      learningOutcomes: data[i][learningIdx] || '',
      category: data[i][categoryIdx] || '',
      pathway: data[i][pathwayIdx] || ''
    });
  }

  return { allCases: allCases };
}

/**
 * Helper: Extract vital value from vitals JSON string
 */
function extractVital_(vitalsStr, field) {
  if (!vitalsStr) return '';
  try {
    const vitals = typeof vitalsStr === 'string' ? JSON.parse(vitalsStr) : vitalsStr;
    if (field === 'bp' && vitals.bp) {
      return vitals.bp.sys + '/' + vitals.bp.dia;
    }
    return vitals[field] || '';
  } catch (e) {
    return '';
  }
}

/**
 * Synchronous discovery with logging
 */
function discoverPathwaysSync_(creativityMode) {
  function log(msg, type) {
    AI_DISCOVERY_LOGS.push({ message: msg, type: type || 'info', timestamp: new Date().toISOString() });
  }

  try {
    log('Step 1/6: Getting API key', 'info');
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const settingsSheet = ss.getSheetByName('Settings');

    if (!settingsSheet) {
      log('❌ Settings sheet not found', 'error');
      return;
    }

    const apiKey = settingsSheet.getRange('B2').getValue();
    if (!apiKey) {
      log('❌ No API key in Settings!B2', 'error');
      return;
    }

    log('✅ API key found', 'success');

    log('Step 1.5/6: Refreshing header mappings', 'info');
    try {
      refreshHeaders();
      log('✅ Headers refreshed', 'success');
    } catch (e) {
      log('⚠️  Could not refresh headers: ' + e.message, 'warning');
    }

    log('Step 2/6: Analyzing case catalog', 'info');
    const analysis = analyzeCatalog_();
    const cases = analysis.allCases;
    log('✅ Found ' + cases.length + ' cases', 'success');

    log('Step 3/6: Building rich case summaries with clinical context', 'info');
    // Send ALL cases with maximum context for AI pattern discovery
    const summaries = cases.map(function(c) {
      return {
        // Core identification
        id: c.caseId,
        title: c.sparkTitle || '',
        diagnosis: c.diagnosis || '',

        // Learning context
        preSim: (c.preSimOverview || '').substring(0, 300),
        postSim: (c.postSimOverview || '').substring(0, 300),
        learning: c.learningOutcomes || '',
        objectives: c.learningObjectives || '',

        // Case metadata
        category: c.category || '',
        difficulty: c.difficulty || '',
        duration: c.estimatedDuration || '',
        setting: c.setting || '',
        presentation: c.chiefComplaint || '',

        // ENHANCED: Patient demographics (unlocks age/gender pathways)
        age: c.age || c.patientAge || '',
        gender: c.gender || c.patientGender || '',

        // ENHANCED: Initial vitals (pattern recognition goldmine)
        initialHR: extractVital_(c.initialVitals || c.Initial_Vitals, 'hr'),
        initialBP: extractVital_(c.initialVitals || c.Initial_Vitals, 'bp'),
        initialRR: extractVital_(c.initialVitals || c.Initial_Vitals, 'rr'),
        initialSpO2: extractVital_(c.initialVitals || c.Initial_Vitals, 'spo2'),

        // ENHANCED: Clinical findings (physical exam pathways)
        examFindings: (c.examFindings || '').substring(0, 200),

        // ENHANCED: Medical context (complexity pathways)
        medications: (c.medications || c.pastMedications || '').substring(0, 150),
        pmh: (c.pastMedicalHistory || c.pmh || '').substring(0, 200),
        allergies: c.allergies || '',

        // ENHANCED: Environment (situational training)
        environment: c.environmentType || c.setting || '',
        disposition: c.dispositionPlan || c.disposition || ''
      };
    });
    log('✅ Prepared ' + summaries.length + ' enhanced case summaries (demographics + vitals + clinical context)', 'success');

    log('Step 4/6: Building prompt', 'info');
    const temp = creativityMode === 'radical' ? 1.0 : 0.7;
    const prompt = creativityMode === 'radical'
      ? 'ANALYZE ALL ' + summaries.length + ' EMERGENCY MEDICINE CASES. TARGET AUDIENCE: Emergency physicians, EM residents, simulation educators. PRIORITY: Clinical value > novelty. Create 5-8 RADICALLY CREATIVE pathways that address REAL EM physician pain points. PRIORITIZE by clinical impact: (1) High-stakes/time-critical scenarios, (2) Diagnostic pitfalls/misses, (3) Disease mimics - TWO TYPES: (a) Cross-category mimics: similar symptoms but dramatically different pathophysiology (MI vs panic, meningitis vs migraine), (b) Within-category mimics: related diseases where subtle distinctions matter (STEMI vs Wellens, bacterial vs viral meningitis, DKA vs HHS), (4) Procedural mastery, (5) Complex decision-making, (6) Communication under pressure. Push boundaries with psychological, narrative, game-design approaches but ALWAYS tie to clinical outcomes. PATHWAY NAMES MUST BE IRRESISTIBLY CLICK-WORTHY: Make ED clinicians think "I NEED this!" Use emotionally resonant language (trigger curiosity, urgency, fear-of-missing-out), action-oriented promises (transformation, not just info), Netflix series vibes (make them want to binge). Examples: "The 3am Nightmare Cases", "Death By Anchoring", "The Great Pretenders", "The Deadly Doppelgangers", "When Experts Get Fooled". Avoid generic academic titles. SORT results by clinical_value_score (1-10). Return ONLY a JSON array with pathway_name (CLICK-WORTHY, emotionally compelling), pathway_icon, grouping_logic_type, why_this_matters (emphasize EM physician value + make them feel this is unmissable), learning_outcomes (EM-specific), best_for (EM audience), unique_value (clinical impact - why THIS pathway vs any other), case_ids (array of at least 3), novelty_score (8-10), clinical_value_score (1-10, rate clinical utility), estimated_learning_time, difficulty_curve, scientific_rationale. NO markdown, NO explanation.'
      : 'ANALYZE ALL ' + summaries.length + ' EMERGENCY MEDICINE CASES. TARGET AUDIENCE: Emergency physicians, EM residents, simulation educators. PRIORITY: Clinical value > novelty. Create 5-8 CREATIVE pathways that solve REAL EM training needs. PRIORITIZE by clinical impact: (1) Can\'t-miss diagnoses, (2) Time-sensitive interventions, (3) Disease mimics - TWO TYPES: (a) Cross-category mimics: similar symptoms, dramatically different diseases (MI vs dissection vs esophageal rupture, PE vs pneumonia vs pneumothorax), (b) Within-category mimics: closely related diseases where subtle distinctions are essential (STEMI vs Wellens vs Takotsubo, bacterial vs viral vs fungal meningitis, DKA vs HHS vs euglycemic DKA), (4) High-risk populations (peds/geriatrics), (5) Undifferentiated patients, (6) Cognitive errors/biases. Discover patterns in clinical reasoning, diagnostic challenges, or critical actions. PATHWAY NAMES MUST BE IRRESISTIBLY CLICK-WORTHY: Make ED clinicians think "I NEED this!" Use emotionally resonant language (trigger curiosity, urgency, professional pride), action-oriented promises (mastery, confidence), specific enough to visualize. Examples: "The Great Pretenders", "The Deadly Doppelgangers", "When Similar Kills Different", "The Subtle Distinction Series", "Evil Twins: Life-or-Death Differences". Avoid boring academic titles like "Cardiovascular Pathology Module". SORT results by clinical_value_score (1-10). Return ONLY a JSON array with pathway_name (CLICK-WORTHY, emotionally compelling), pathway_icon, grouping_logic_type, why_this_matters (emphasize EM physician value + make them feel this is unmissable), learning_outcomes (EM-specific), best_for (EM audience), unique_value (clinical impact - why THIS pathway vs any other), case_ids (array of at least 3), novelty_score (7+), clinical_value_score (1-10, rate clinical utility), estimated_learning_time, difficulty_curve. NO markdown, NO explanation.';

    log('✅ Prompt ready (' + temp + ' temp, ' + summaries.length + ' cases)', 'success');

    log('Step 5/6: Calling OpenAI GPT-4', 'info');
    log('⏳ Analyzing ' + summaries.length + ' cases - may take 15-45 seconds...', 'warning');

    const start = new Date().getTime();
    const response = UrlFetchApp.fetch('https://api.openai.com/v1/chat/completions', {
      method: 'post',
      headers: {
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: creativityMode === 'radical' ? 'You are an experimental medical educator applying cognitive science and game design to create revolutionary learning pathways.' : 'You are an expert medical educator discovering novel patterns across medical cases to create innovative learning pathways.' },
          { role: 'user', content: prompt + '\n\nCASES:\n' + JSON.stringify(summaries) }
        ],
        temperature: temp,
        max_tokens: 2500
      }),
      muteHttpExceptions: true
    });

    const elapsed = ((new Date().getTime() - start) / 1000).toFixed(1);
    const code = response.getResponseCode();

    log('✅ OpenAI responded in ' + elapsed + 's', 'success');
    log('📊 Status: ' + code, 'info');

    if (code !== 200) {
      log('❌ API error: ' + response.getContentText(), 'error');
      return;
    }

    log('Step 6/6: Parsing response', 'info');
    const data = JSON.parse(response.getContentText());
    const aiText = data.choices[0].message.content;

    let pathways = [];
    const match = aiText.match(/\[[\s\S]*\]/);
    pathways = match ? JSON.parse(match[0]) : JSON.parse(aiText);

    log('✅ Parsed ' + pathways.length + ' pathways', 'success');

    pathways.forEach(function(pw, i) {
      log((i+1) + '. ' + (pw.pathway_icon || '🤖') + ' ' + (pw.pathway_name || 'Unnamed'), 'info');
    });

    log('🎉 COMPLETE! Discovery finished', 'success');

    // Store pathways for retrieval
    PropertiesService.getScriptProperties().setProperty('AI_PATHWAYS', JSON.stringify(pathways));
    PropertiesService.getScriptProperties().setProperty('AI_MODE', creativityMode);

  } catch (e) {
    log('❌ EXCEPTION: ' + e.message, 'error');
  }
}

/**
 * Show results (called after discovery completes)
 */
function showAIPathwayResults(pathways, creativityMode) {
  const modeLabel = creativityMode === 'radical' ? '🔥 RADICAL' : '🤖 CREATIVE';

  let html = '<style>body{font-family:Arial;background:#0a0b0e;color:#fff;padding:24px}.pathway{background:#1a1f2e;padding:20px;margin:15px 0;border-radius:12px;border-left:4px solid ' + (creativityMode === 'radical' ? '#ff6b00' : '#2357ff') + '}.name{font-size:20px;font-weight:bold;margin-bottom:10px}.pitch{color:#ccc;line-height:1.6}</style>';

  html += '<h1>' + modeLabel + ' AI-Discovered Pathways</h1>';
  html += '<p>Found ' + pathways.length + ' novel groupings</p>';

  pathways.forEach(function(pw) {
    html += '<div class="pathway">';
    html += '<div class="name">' + (pw.pathway_icon || '🤖') + ' ' + (pw.pathway_name || 'Unnamed') + '</div>';
    html += '<div class="pitch">' + (pw.why_this_matters || 'No description') + '</div>';
    html += '</div>';
  });

  const htmlOutput = HtmlService.createHtmlOutput(html).setWidth(800).setHeight(600);
  SpreadsheetApp.getUi().showModalDialog(htmlOutput, modeLabel + ' Pathways');
}
