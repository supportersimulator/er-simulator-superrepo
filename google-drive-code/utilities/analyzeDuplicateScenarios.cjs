#!/usr/bin/env node

/**
 * Analyze Duplicate Case_IDs for Actual Scenario Duplicates
 *
 * Purpose: Determine if duplicate Case_IDs represent:
 * 1. Identical scenarios (same content, should merge/delete)
 * 2. Similar scenarios from different sources (need unique IDs)
 * 3. Different scenarios that accidentally got same ID (need new IDs)
 *
 * Analysis approach:
 * - Compare titles (Spark_Title and Reveal_Title)
 * - Compare patient demographics (age, sex)
 * - Compare chief complaints
 * - Calculate similarity scores
 * - Flag truly duplicate content vs unique scenarios
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const TOKEN_PATH = path.join(__dirname, '..', 'config', 'token.json');
const SHEET_ID = process.env.GOOGLE_SHEET_ID;

function createGoogleClient() {
  const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/oauth2callback'
  );
  oauth2Client.setCredentials(token);
  return oauth2Client;
}

function calculateSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;

  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  if (s1 === s2) return 1.0;

  // Levenshtein distance (simple version)
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;

  if (longer.length === 0) return 1.0;

  const editDistance = levenshteinDistance(s1, s2);
  return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(str1, str2) {
  const matrix = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

async function analyzeDuplicates() {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('  DUPLICATE SCENARIO ANALYSIS');
  console.log('═══════════════════════════════════════════════════');
  console.log('');

  const auth = createGoogleClient();
  const sheets = google.sheets({ version: 'v4', auth });

  console.log('📖 Reading Master Scenario Convert...');

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'Master Scenario Convert!A1:J250'
  });

  const rows = response.data.values || [];
  const humanLabels = rows[0] || [];
  const flattenedHeaders = rows[1] || [];
  const dataRows = rows.slice(2);

  console.log(`✅ Read ${dataRows.length} scenarios`);
  console.log('');

  // Find header indices
  const caseIdIdx = 0; // Case_ID is always first
  const sparkTitleIdx = 1; // Spark_Title is second
  const revealTitleIdx = 2; // Reveal_Title is third

  console.log('🔍 Finding duplicate Case_IDs...');
  console.log('');

  // Group by Case_ID
  const caseIdGroups = new Map();

  dataRows.forEach((row, idx) => {
    const caseId = (row[caseIdIdx] || '').trim();
    if (!caseId) return;

    if (!caseIdGroups.has(caseId)) {
      caseIdGroups.set(caseId, []);
    }

    caseIdGroups.get(caseId).push({
      rowNum: idx + 3, // Row number in sheet (1-indexed + 2 header rows)
      caseId: caseId,
      sparkTitle: row[sparkTitleIdx] || '',
      revealTitle: row[revealTitleIdx] || '',
      fullRow: row
    });
  });

  // Filter for duplicates only
  const duplicates = Array.from(caseIdGroups.entries())
    .filter(([_, scenarios]) => scenarios.length > 1)
    .map(([caseId, scenarios]) => ({ caseId, scenarios }));

  console.log(`📊 Found ${duplicates.length} Case_IDs with duplicates`);
  console.log(`📊 Affected scenarios: ${duplicates.reduce((sum, d) => sum + d.scenarios.length, 0)}`);
  console.log('');

  if (duplicates.length === 0) {
    console.log('✅ No duplicates found!');
    return;
  }

  // Analyze each duplicate group
  console.log('═══════════════════════════════════════════════════');
  console.log('  DETAILED DUPLICATE ANALYSIS');
  console.log('═══════════════════════════════════════════════════');
  console.log('');

  const analysis = [];

  for (const { caseId, scenarios } of duplicates.slice(0, 20)) { // Analyze first 20
    console.log(`\n━━━ Case_ID: ${caseId} (${scenarios.length} occurrences) ━━━\n`);

    for (let i = 0; i < scenarios.length; i++) {
      const s = scenarios[i];
      console.log(`  [${i + 1}] Row ${s.rowNum}`);
      console.log(`      Spark: ${s.sparkTitle.substring(0, 80)}${s.sparkTitle.length > 80 ? '...' : ''}`);
      console.log(`      Reveal: ${s.revealTitle.substring(0, 80)}${s.revealTitle.length > 80 ? '...' : ''}`);
      console.log('');
    }

    // Calculate pairwise similarity
    if (scenarios.length === 2) {
      const sparkSim = calculateSimilarity(scenarios[0].sparkTitle, scenarios[1].sparkTitle);
      const revealSim = calculateSimilarity(scenarios[0].revealTitle, scenarios[1].revealTitle);
      const avgSim = (sparkSim + revealSim) / 2;

      console.log(`  📊 Similarity Analysis:`);
      console.log(`      Spark Title: ${(sparkSim * 100).toFixed(1)}%`);
      console.log(`      Reveal Title: ${(revealSim * 100).toFixed(1)}%`);
      console.log(`      Average: ${(avgSim * 100).toFixed(1)}%`);
      console.log('');

      let verdict = '';
      if (avgSim > 0.9) {
        verdict = '🔴 LIKELY IDENTICAL - Consider deleting one';
      } else if (avgSim > 0.7) {
        verdict = '🟡 SIMILAR - Different sources, need unique IDs';
      } else {
        verdict = '🟢 DIFFERENT - Just need unique IDs';
      }

      console.log(`  ✅ Verdict: ${verdict}`);
      console.log('');

      analysis.push({
        caseId,
        occurrences: scenarios.length,
        rows: scenarios.map(s => s.rowNum),
        similarity: avgSim,
        verdict: verdict.split(' - ')[0].substring(2)
      });
    } else {
      // Multiple duplicates - just flag for manual review
      console.log(`  ⚠️  Multiple duplicates (${scenarios.length}) - Manual review needed`);
      console.log('');

      analysis.push({
        caseId,
        occurrences: scenarios.length,
        rows: scenarios.map(s => s.rowNum),
        similarity: null,
        verdict: 'MANUAL REVIEW'
      });
    }
  }

  // Summary
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('  SUMMARY');
  console.log('═══════════════════════════════════════════════════');
  console.log('');

  const identical = analysis.filter(a => a.verdict === 'LIKELY IDENTICAL').length;
  const similar = analysis.filter(a => a.verdict === 'SIMILAR').length;
  const different = analysis.filter(a => a.verdict === 'DIFFERENT').length;
  const manual = analysis.filter(a => a.verdict === 'MANUAL REVIEW').length;

  console.log(`🔴 Likely Identical (>90% similar): ${identical}`);
  console.log(`   → Action: Delete duplicate row, keep one`);
  console.log('');
  console.log(`🟡 Similar (70-90% similar): ${similar}`);
  console.log(`   → Action: Keep both, generate unique IDs`);
  console.log('');
  console.log(`🟢 Different (<70% similar): ${different}`);
  console.log(`   → Action: Keep both, generate unique IDs`);
  console.log('');
  console.log(`⚪ Manual Review Needed: ${manual}`);
  console.log(`   → Action: Manual inspection required`);
  console.log('');

  // Save detailed report
  const reportPath = path.join(__dirname, '..', 'DUPLICATE_ANALYSIS_REPORT.json');
  fs.writeFileSync(reportPath, JSON.stringify({
    totalDuplicates: duplicates.length,
    analyzedFirst20: analysis,
    summary: { identical, similar, different, manual }
  }, null, 2));

  console.log(`📄 Detailed report saved: DUPLICATE_ANALYSIS_REPORT.json`);
  console.log('');

  console.log('═══════════════════════════════════════════════════');
  console.log('✅ ANALYSIS COMPLETE');
  console.log('═══════════════════════════════════════════════════');
  console.log('');
  console.log('Next Steps:');
  console.log('  1. Review DUPLICATE_ANALYSIS_REPORT.json for details');
  console.log('  2. Delete truly identical scenarios (🔴)');
  console.log('  3. Generate unique IDs for similar/different scenarios (🟡🟢)');
  console.log('  4. Design smart Case_ID naming system');
  console.log('');
}

if (require.main === module) {
  analyzeDuplicates().catch(error => {
    console.error('');
    console.error('❌ ANALYSIS FAILED');
    console.error('════════════════════════════════════════════════════');
    console.error(error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  });
}

module.exports = { analyzeDuplicates };
