#!/usr/bin/env node

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const TOKEN_PATH = path.join(__dirname, '../config/token.json');
const CREDS_PATH = path.join(__dirname, '../config/credentials.json');

async function analyzeQuality() {
  const credentials = JSON.parse(fs.readFileSync(CREDS_PATH, 'utf8'));
  const { client_id, client_secret } = credentials.installed || credentials.web;
  const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
  
  const oauth2Client = new google.auth.OAuth2(client_id, client_secret, 'http://localhost');
  oauth2Client.setCredentials(token);
  
  const sheets = google.sheets({ version: 'v4', auth: oauth2Client });
  
  console.log('\n📊 QUALITY PROGRESSION ANALYSIS: Early vs Recent Rows\n');
  console.log('='.repeat(80) + '\n');
  
  // Fetch sample of early rows (10-12) and recent rows (191-193)
  const earlyResponse = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: "'Master Scenario Convert'!11:13",
  });
  
  const recentResponse = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: "'Master Scenario Convert'!192:194",
  });
  
  const earlyRows = earlyResponse.data.values || [];
  const recentRows = recentResponse.data.values || [];
  
  console.log('📋 COMPARISON: Early Rows (10-12) vs Recent Rows (191-193)\n');
  
  function analyzeRow(row, rowNum, label) {
    // Count filled fields
    const totalFields = row.length;
    const filledFields = row.filter(cell => cell && cell.trim().length > 0).length;
    const fillRate = ((filledFields / totalFields) * 100).toFixed(1);
    
    // Check Pre-Sim quality
    const preSimOverview = row[9] || '';
    let preSimQuality = { exists: false, length: 0, parsed: false, hasStakes: false, hasMystery: false, hasWhatYouLearn: false };
    
    if (preSimOverview.length > 0) {
      preSimQuality.exists = true;
      preSimQuality.length = preSimOverview.length;
      try {
        const preSimData = JSON.parse(preSimOverview);
        preSimQuality.parsed = true;
        preSimQuality.hasStakes = !!preSimData.theStakes;
        preSimQuality.hasMystery = !!preSimData.mysteryHook;
        preSimQuality.hasWhatYouLearn = !!(preSimData.whatYouWillLearn && preSimData.whatYouWillLearn.length > 0);
      } catch (e) {
        // Could not parse
      }
    }
    
    // Check Post-Sim quality
    const postSimOverview = row[10] || '';
    let postSimQuality = { exists: false, length: 0, parsed: false, hasPearl: false, hasMastered: false, hasTraps: false, hasImpact: false };
    
    if (postSimOverview.length > 0) {
      postSimQuality.exists = true;
      postSimQuality.length = postSimOverview.length;
      try {
        const postSimData = JSON.parse(postSimOverview);
        postSimQuality.parsed = true;
        postSimQuality.hasPearl = !!(postSimData.theCriticalPearl && postSimData.theCriticalPearl.content);
        postSimQuality.hasMastered = !!(postSimData.whatYouMastered && postSimData.whatYouMastered.length > 0);
        postSimQuality.hasTraps = !!(postSimData.avoidTheseTraps && postSimData.avoidTheseTraps.length > 0);
        postSimQuality.hasImpact = !!(postSimData.realWorldImpact);
      } catch (e) {
        // Could not parse
      }
    }
    
    // Check vitals completeness
    const vitals = [
      row[24] || '', // Initial
      row[25] || '', // State1
      row[26] || '', // State2
      row[27] || '', // State3
      row[28] || '', // State4
      row[29] || ''  // State5
    ];
    const vitalsCount = vitals.filter(v => v.length > 10).length;
    
    console.log(`${label} (Row ${rowNum}): ${row[0] || 'N/A'}`);
    console.log(`  Total Fields: ${totalFields} | Filled: ${filledFields} (${fillRate}%)`);
    console.log(`  Title: ${(row[1] || 'N/A').substring(0, 50)}...`);
    console.log(`  \n  Pre-Sim Overview:`);
    console.log(`    Exists: ${preSimQuality.exists ? '✅' : '❌'} | Length: ${preSimQuality.length} chars`);
    console.log(`    Valid JSON: ${preSimQuality.parsed ? '✅' : '❌'}`);
    console.log(`    Has Stakes: ${preSimQuality.hasStakes ? '✅' : '❌'}`);
    console.log(`    Has Mystery Hook: ${preSimQuality.hasMystery ? '✅' : '❌'}`);
    console.log(`    Has "What You'll Learn": ${preSimQuality.hasWhatYouLearn ? '✅' : '❌'}`);
    console.log(`  \n  Post-Sim Overview:`);
    console.log(`    Exists: ${postSimQuality.exists ? '✅' : '❌'} | Length: ${postSimQuality.length} chars`);
    console.log(`    Valid JSON: ${postSimQuality.parsed ? '✅' : '❌'}`);
    console.log(`    Has Critical Pearl: ${postSimQuality.hasPearl ? '✅' : '❌'}`);
    console.log(`    Has "What You Mastered": ${postSimQuality.hasMastered ? '✅' : '❌'}`);
    console.log(`    Has "Avoid These Traps": ${postSimQuality.hasTraps ? '✅' : '❌'}`);
    console.log(`    Has Real-World Impact: ${postSimQuality.hasImpact ? '✅' : '❌'}`);
    console.log(`  \n  Vitals Completeness: ${vitalsCount}/6 states filled`);
    console.log('');
    
    return {
      totalFields,
      filledFields,
      fillRate: parseFloat(fillRate),
      preSimQuality,
      postSimQuality,
      vitalsCount
    };
  }
  
  console.log('━'.repeat(80));
  console.log('EARLY ROWS (Baseline - 4K token era)');
  console.log('━'.repeat(80) + '\n');
  
  const earlyMetrics = earlyRows.map((row, idx) => 
    analyzeRow(row, 10 + idx, `Early ${idx + 1}`)
  );
  
  console.log('━'.repeat(80));
  console.log('RECENT ROWS (Premium - 16K token era)');
  console.log('━'.repeat(80) + '\n');
  
  const recentMetrics = recentRows.map((row, idx) => 
    analyzeRow(row, 191 + idx, `Recent ${idx + 1}`)
  );
  
  // Calculate averages
  console.log('━'.repeat(80));
  console.log('📈 AGGREGATE COMPARISON');
  console.log('━'.repeat(80) + '\n');
  
  const earlyAvg = {
    fillRate: (earlyMetrics.reduce((sum, m) => sum + m.fillRate, 0) / earlyMetrics.length).toFixed(1),
    vitals: (earlyMetrics.reduce((sum, m) => sum + m.vitalsCount, 0) / earlyMetrics.length).toFixed(1),
    preSimLength: (earlyMetrics.reduce((sum, m) => sum + m.preSimQuality.length, 0) / earlyMetrics.length).toFixed(0),
    postSimLength: (earlyMetrics.reduce((sum, m) => sum + m.postSimQuality.length, 0) / earlyMetrics.length).toFixed(0)
  };
  
  const recentAvg = {
    fillRate: (recentMetrics.reduce((sum, m) => sum + m.fillRate, 0) / recentMetrics.length).toFixed(1),
    vitals: (recentMetrics.reduce((sum, m) => sum + m.vitalsCount, 0) / recentMetrics.length).toFixed(1),
    preSimLength: (recentMetrics.reduce((sum, m) => sum + m.preSimQuality.length, 0) / recentMetrics.length).toFixed(0),
    postSimLength: (recentMetrics.reduce((sum, m) => sum + m.postSimQuality.length, 0) / recentMetrics.length).toFixed(0)
  };
  
  console.log('EARLY ROWS (4K tokens):');
  console.log(`  Avg Fill Rate: ${earlyAvg.fillRate}%`);
  console.log(`  Avg Vitals States: ${earlyAvg.vitals}/6`);
  console.log(`  Avg Pre-Sim Length: ${earlyAvg.preSimLength} chars`);
  console.log(`  Avg Post-Sim Length: ${earlyAvg.postSimLength} chars`);
  
  console.log('\nRECENT ROWS (16K tokens):');
  console.log(`  Avg Fill Rate: ${recentAvg.fillRate}%`);
  console.log(`  Avg Vitals States: ${recentAvg.vitals}/6`);
  console.log(`  Avg Pre-Sim Length: ${recentAvg.preSimLength} chars`);
  console.log(`  Avg Post-Sim Length: ${recentAvg.postSimLength} chars`);
  
  console.log('\n📊 IMPROVEMENT:');
  console.log(`  Fill Rate: ${(recentAvg.fillRate - earlyAvg.fillRate).toFixed(1)}% ${recentAvg.fillRate > earlyAvg.fillRate ? '📈' : '📉'}`);
  console.log(`  Vitals: +${(recentAvg.vitals - earlyAvg.vitals).toFixed(1)} states ${recentAvg.vitals > earlyAvg.vitals ? '📈' : '📉'}`);
  console.log(`  Pre-Sim Depth: ${(((recentAvg.preSimLength - earlyAvg.preSimLength) / earlyAvg.preSimLength) * 100).toFixed(1)}% ${recentAvg.preSimLength > earlyAvg.preSimLength ? '📈' : '📉'}`);
  console.log(`  Post-Sim Depth: ${(((recentAvg.postSimLength - earlyAvg.postSimLength) / earlyAvg.postSimLength) * 100).toFixed(1)}% ${recentAvg.postSimLength > earlyAvg.postSimLength ? '📈' : '📉'}`);
  
  console.log('\n💡 VERDICT:');
  const fillRateImproved = recentAvg.fillRate > earlyAvg.fillRate;
  const vitalsImproved = recentAvg.vitals > earlyAvg.vitals;
  const contentDepthImproved = recentAvg.preSimLength > earlyAvg.preSimLength && recentAvg.postSimLength > earlyAvg.postSimLength;
  
  if (fillRateImproved && vitalsImproved && contentDepthImproved) {
    console.log('✅ SIGNIFICANT IMPROVEMENT - Recent rows are measurably better');
    console.log('   The 16K token upgrade and system refinements are paying off!');
  } else if (fillRateImproved || vitalsImproved || contentDepthImproved) {
    console.log('⚠️  MODERATE IMPROVEMENT - Some metrics improved');
    console.log('   Mixed results, some areas better than others');
  } else {
    console.log('❌ NO CLEAR IMPROVEMENT - Quality is similar');
    console.log('   Early and recent rows are comparable in quality');
  }
}

analyzeQuality().catch(console.error);
