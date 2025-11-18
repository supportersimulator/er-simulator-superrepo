# Media URL Uniqueness Check

**Feature:** Smart Duplicate Detection via Source Material Validation
**Phase:** II.A - Quality Control Mechanisms
**Priority:** ⚠️ HIGH
**Status:** Designed, ready for implementation

---

## 🎯 Purpose

Validate scenario uniqueness by checking if scenarios reference different source materials (URLs), even when text appears similar. This prevents false-positive duplicate detection for scenarios that are actually educationally distinct.

---

## 📊 The Problem

**Discovery:** Rows 194-199 showed 77-89% text similarity but were flagged as potential duplicates.

**Question:** Are these true duplicates, or are they unique scenarios that happen to use similar language?

**Solution:** Check media URLs - if each scenario references different source material, they're likely valid distinct scenarios.

---

## ✅ The Solution: Media URL Uniqueness Check

### Algorithm

```javascript
function checkMediaURLUniqueness(rows) {
  // 1. Extract all URLs from media columns
  const contentURLs = rows.map(row => extractContentURLs(row));

  // 2. Filter out non-content URLs (licenses, etc.)
  const filteredURLs = contentURLs.map(urls =>
    urls.filter(url => !url.includes('creativecommons.org'))
  );

  // 3. Check for duplicates
  const allURLs = filteredURLs.flat();
  const uniqueURLs = [...new Set(allURLs)];

  // 4. Return verdict
  if (allURLs.length === uniqueURLs.length) {
    return {
      verdict: 'UNIQUE',
      message: 'All scenarios have different source materials - likely valid'
    };
  } else {
    return {
      verdict: 'DUPLICATE',
      duplicates: findDuplicateURLs(allURLs)
    };
  }
}
```

### Column Location

Media URLs are typically stored in columns after vitals data:
- **Tier 1:** Media
- **Tier 2:** Img_PreSim, Img_Vitals_1-5, Img_PostSim, Audio_PreSim, Audio_PostSim
- **Range:** Approximately columns V-AE (21-35 in array indexing)

### URL Filtering Strategy

**Exclude:**
- `creativecommons.org` (license URLs - same across many rows)
- `license` in URL path
- Generic stock photo sites

**Include:**
- `emsimcases.com` URLs (primary source)
- `resusmonitor.com` URLs
- Other educational case study URLs
- Media hosting with unique identifiers

---

## 📋 Case Study: Rows 194-199

### Initial Concern
- 77-89% text similarity
- All acute MI cases
- 5/6 same demographics (52M)
- 90%+ overlapping learning objectives

### Media URL Analysis

```
Row 194: https://emsimcases.com/2023/01/28/cardiac-emergencies-ami/
Row 195: https://emsimcases.com/2023/01/20/acute-myocardial-infarction/
Row 196: https://emsimcases.com/2023/11/04/heart-attack-management/
Row 197: https://emsimcases.com/2023/01/20/ami-management/
Row 198: https://emsimcases.com/2023/05/10/cardiac-case-4-ami/
Row 199: https://emsimcases.com/2025/02/12/cardiac-case-3-mi/
```

**Result:**
- ✅ 6 unique URLs
- ✅ 0 duplicates
- ✅ Different source dates (2023/01/20 to 2025/02/12)
- ✅ Different case identifiers

### Verdict

**NOT duplicates** - Each scenario is based on a different emsimcases.com case study. Text similarity is due to:
1. Same diagnosis family (all MI variants)
2. Template-based AI generation for cardiac cases
3. Medical terminology overlap
4. Similar learning objective structures

**Action:** Keep all scenarios, but enhance differentiation (add subtypes, vary demographics, emphasize unique EKG findings).

---

## 🔄 Integration into Smart Duplicate Detection

### Priority Order

1. **Media URL Check** (FIRST - definitive test)
   - Unique URLs → Likely valid, proceed with caution
   - Duplicate URLs → Likely true duplicate, flag immediately

2. **Title Similarity** (if URLs unique)
   - If media URLs differ but titles >95% similar → Warning
   - Suggest title differentiation

3. **Text Similarity** (if URLs unique)
   - If media URLs differ but text >90% similar → Info only
   - Note: May be template-based, check for unique clinical details

4. **Demographics/Diagnosis Patterns** (if URLs unique)
   - If media URLs differ → Suggest variation, don't block
   - Context: Valid to have similar demos if source material differs

### Decision Matrix

| Media URLs | Text Similarity | Action |
|------------|----------------|--------|
| Duplicate | Any | 🚫 **BLOCK** - True duplicate |
| Unique | <70% | ✅ **PASS** - Clearly distinct |
| Unique | 70-90% | ⚠️ **WARN** - Similar but valid, suggest differentiation |
| Unique | >90% | ⚠️ **INFO** - Template-based, recommend unique details |

---

## 💻 Implementation

### Phase II.A Scripts

**Created:**
- `scripts/checkMediaURLs.cjs` - Basic URL extraction and comparison
- `scripts/analyzeMediaURLsDetailed.cjs` - Detailed analysis with exclusions

**To Create:**
```
scripts/
├── smartDuplicateDetection.cjs
│   ├── checkMediaURLs()
│   ├── checkTitleSimilarity()
│   ├── checkTextSimilarity()
│   ├── checkDemographicsPatterns()
│   └── generateReport()
```

### Apps Script Integration

```javascript
// In Code_QUALITY_ANALYSIS.gs

function detectSmartDuplicates_(outputSheet, startRow, endRow) {
  const rows = outputSheet.getRange(startRow, 1, endRow - startRow + 1, 50).getValues();

  const results = {
    trueDuplicates: [],
    similarButValid: [],
    recommendations: []
  };

  // 1. Media URL check (primary)
  const mediaCheck = checkMediaURLUniqueness_(rows);

  for (let i = 0; i < rows.length; i++) {
    for (let j = i + 1; j < rows.length; j++) {
      const rowA = rows[i];
      const rowB = rows[j];

      // Check media URLs
      const urlsMatch = mediaCheck.duplicates.some(dup =>
        dup.rows.includes(i) && dup.rows.includes(j)
      );

      if (urlsMatch) {
        // TRUE DUPLICATE - same source material
        results.trueDuplicates.push({
          rows: [startRow + i, startRow + j],
          reason: 'Same media URLs (identical source material)',
          action: 'DELETE one or differentiate significantly'
        });
      } else {
        // Different source material - check text similarity
        const textSim = calculateTextSimilarity_(rowA[2], rowB[2]);

        if (textSim > 0.9) {
          results.similarButValid.push({
            rows: [startRow + i, startRow + j],
            similarity: textSim,
            reason: 'High text similarity but different source materials',
            action: 'KEEP but enhance differentiation (add subtypes, vary demos)'
          });
        }
      }
    }
  }

  return results;
}

function checkMediaURLUniqueness_(rows) {
  const contentURLs = {};
  const urlToRows = {};

  rows.forEach((row, idx) => {
    // Extract URLs from media columns (adjust column indices as needed)
    const urls = extractContentURLs_(row);
    contentURLs[idx] = urls;

    urls.forEach(url => {
      if (!urlToRows[url]) urlToRows[url] = [];
      urlToRows[url].push(idx);
    });
  });

  // Find duplicated URLs
  const duplicates = Object.entries(urlToRows)
    .filter(([url, rows]) => rows.length > 1)
    .map(([url, rows]) => ({ url, rows }));

  return { contentURLs, duplicates };
}

function extractContentURLs_(row) {
  // Media columns are approximately 21-35 (V-AE)
  const mediaColumns = row.slice(21, 35);

  return mediaColumns
    .filter(cell => cell && cell.toString().includes('http'))
    .map(url => url.toString())
    .filter(url =>
      !url.includes('creativecommons.org') &&
      !url.includes('license')
    );
}
```

---

## 📊 Expected Outcomes

### Benefits

1. **Reduces False Positives**
   - Scenarios with unique source materials won't be incorrectly flagged as duplicates
   - Text similarity due to template-based generation is acceptable

2. **Catches True Duplicates**
   - Scenarios reusing same source material are immediately identified
   - Prevents wasted processing time and API costs

3. **Improves Quality Control**
   - Validates uniqueness at the source material level
   - Provides confidence in scenario library diversity

4. **Guides Differentiation**
   - For valid similar scenarios, suggests specific improvements
   - Maintains educational value while reducing confusion

### Success Metrics

- ✅ Zero false-positive duplicate flags for scenarios with unique media URLs
- ✅ 100% detection of scenarios sharing same source material
- ✅ Clear differentiation recommendations for 70-90% similar scenarios
- ✅ User confidence in smart duplicate detection accuracy

---

## 🔧 Future Enhancements

### Phase III

1. **Automatic Source Fetch**
   - Fetch actual content from media URLs
   - Compare source material directly (not just URLs)
   - Detect if different URLs link to same content

2. **Media URL Validation**
   - Check if URLs are still active (404 detection)
   - Verify media loads correctly
   - Flag broken/outdated sources

3. **Cross-Reference Database**
   - Build database of known case studies
   - Map URLs to canonical case identifiers
   - Detect alternate URLs for same case

### Phase IV

4. **AI-Powered Source Analysis**
   - Use AI to read source material
   - Extract key differentiating facts
   - Auto-generate differentiation suggestions based on source content

---

## 📝 Key Insights

### Medical Education Principle

**Similar ≠ Duplicate** when teaching medical nuances:
- Anterior STEMI vs Inferior STEMI → Similar presentation, different EKG
- NSTEMI vs STEMI → Similar symptoms, different treatment urgency
- Posterior MI vs Inferior MI → Easily confused, critical to differentiate

**Valid Use Case:** Multiple MI scenarios with different source materials teaching different subtypes and EKG patterns.

### Template-Based Generation

AI systems naturally use similar language for similar conditions. This is **expected behavior**, not a bug. The key is ensuring underlying source material (and thus clinical details) differ.

### Quality vs Uniqueness

A scenario can have:
- ✅ High quality (100% complete, accurate vitals, educational)
- ⚠️ High text similarity (template-based generation)
- ✅ Unique source material (different emsimcases.com URL)
- ✅ Educational distinctness (different EKG findings, subtypes)

**Verdict:** Keep it, enhance differentiation.

---

## 🤝 Team Notes

### For Aaron

Use this check when reviewing "duplicate" flags. If media URLs are unique, scenarios are likely valid - just need better differentiation in titles/summaries.

### For GPT-5

When reviewing quality analysis code, ensure media URL check runs FIRST before text similarity. Prevents false positives and improves user trust.

### For Claude

Implement media URL check as the primary filter in smart duplicate detection. Text similarity is secondary when source materials differ.

---

**Document Version:** 1.0
**Created:** 2025-11-03
**Next Review:** After Phase II.A implementation
