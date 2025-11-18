#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('\n🏆 ANALYZING GOLDEN STANDARD DATA\n');
console.log('━'.repeat(70) + '\n');

// Load golden standard vitals
const vitalsPath = path.join(__dirname, '../../backups/pre-aws-migration/data/vitals-only-2025-11-03T05-24-08.json');
const vitals = JSON.parse(fs.readFileSync(vitalsPath, 'utf8'));

console.log(`📊 Total Records: ${vitals.length}\n`);

// Analyze golden standard characteristics
const analysis = {
  metadata: {
    timestamp: '2025-11-03T05:24:08',
    totalRecords: vitals.length,
    source: 'Pre-AWS Migration Backup',
    purpose: 'Golden Standard Baseline for Quality Verification'
  },
  waveforms: {},
  bpFormats: { object: 0, string: 0, null: 0 },
  keyFormats: { lowercase: 0, uppercase: 0, mixed: 0 },
  requiredFields: {
    hr: 0, spo2: 0, bp: 0, rr: 0, temp: 0, waveform: 0, etco2: 0, lastupdated: 0
  },
  nullValues: { spo2: 0, bp: 0, hr: 0 },
  sampleRecords: {},
  qualityMetrics: {
    allLowercaseKeys: 0,
    allBPObjects: 0,
    allWaveformsValid: 0,
    allRequiredPresent: 0
  }
};

const validWaveforms = [
  'sinus_ecg', 'afib_ecg', 'vtach_ecg', 'vfib_ecg',
  'asystole_ecg', 'nsr_ecg', 'stemi_ecg', 'nstemi_ecg'
];

vitals.forEach(record => {
  const v = record.vitals;

  // Waveform distribution
  analysis.waveforms[v.waveform] = (analysis.waveforms[v.waveform] || 0) + 1;

  // BP format
  if (v.bp && typeof v.bp === 'object' && v.bp.sys !== undefined) {
    analysis.bpFormats.object++;
  } else if (typeof v.bp === 'string') {
    analysis.bpFormats.string++;
  } else if (v.bp === null) {
    analysis.bpFormats.null++;
  }

  // Key format analysis
  const keys = Object.keys(v);
  const allLower = keys.every(k => k === k.toLowerCase());
  const allUpper = keys.every(k => k === k.toUpperCase());

  if (allLower) {
    analysis.keyFormats.lowercase++;
    analysis.qualityMetrics.allLowercaseKeys++;
  } else if (allUpper) {
    analysis.keyFormats.uppercase++;
  } else {
    analysis.keyFormats.mixed++;
  }

  // Required fields
  if (v.hr !== undefined) analysis.requiredFields.hr++;
  if (v.spo2 !== undefined) analysis.requiredFields.spo2++;
  if (v.bp !== undefined) analysis.requiredFields.bp++;
  if (v.rr !== undefined) analysis.requiredFields.rr++;
  if (v.temp !== undefined) analysis.requiredFields.temp++;
  if (v.waveform !== undefined) analysis.requiredFields.waveform++;
  if (v.etco2 !== undefined) analysis.requiredFields.etco2++;
  if (v.lastupdated !== undefined) analysis.requiredFields.lastupdated++;

  // Null values (medically valid for asystole)
  if (v.spo2 === null) analysis.nullValues.spo2++;
  if (v.bp === null || (v.bp && v.bp.sys === null)) analysis.nullValues.bp++;
  if (v.hr === 0) analysis.nullValues.hr++;

  // Quality metrics
  if (v.bp && typeof v.bp === 'object') {
    analysis.qualityMetrics.allBPObjects++;
  }

  if (validWaveforms.includes(v.waveform)) {
    analysis.qualityMetrics.allWaveformsValid++;
  }

  const hasAllRequired = v.hr !== undefined && v.spo2 !== undefined &&
                          v.bp !== undefined && v.rr !== undefined &&
                          v.waveform !== undefined;
  if (hasAllRequired) {
    analysis.qualityMetrics.allRequiredPresent++;
  }

  // Save sample for each waveform type
  if (!analysis.sampleRecords[v.waveform]) {
    analysis.sampleRecords[v.waveform] = {
      rowNum: record.rowNum,
      caseId: record.caseId,
      vitals: record.vitals
    };
  }
});

// Calculate quality percentages
const total = vitals.length;
analysis.qualityScores = {
  lowercaseKeys: ((analysis.qualityMetrics.allLowercaseKeys / total) * 100).toFixed(2) + '%',
  bpObjects: ((analysis.qualityMetrics.allBPObjects / total) * 100).toFixed(2) + '%',
  validWaveforms: ((analysis.qualityMetrics.allWaveformsValid / total) * 100).toFixed(2) + '%',
  requiredFields: ((analysis.qualityMetrics.allRequiredPresent / total) * 100).toFixed(2) + '%'
};

// Save golden standard baseline
const outputPath = path.join(__dirname, '../golden-standards/data-quality-baseline.json');
fs.writeFileSync(outputPath, JSON.stringify(analysis, null, 2));

// Display results
console.log('📋 Waveform Distribution:');
Object.entries(analysis.waveforms).forEach(([waveform, count]) => {
  console.log(`   ${waveform}: ${count} records`);
});
console.log('');

console.log('🔑 Key Format Analysis:');
console.log(`   Lowercase: ${analysis.keyFormats.lowercase} (${((analysis.keyFormats.lowercase/total)*100).toFixed(1)}%)`);
console.log(`   Uppercase: ${analysis.keyFormats.uppercase}`);
console.log(`   Mixed: ${analysis.keyFormats.mixed}`);
console.log('');

console.log('💊 BP Format Analysis:');
console.log(`   Objects {sys, dia}: ${analysis.bpFormats.object} (${((analysis.bpFormats.object/total)*100).toFixed(1)}%)`);
console.log(`   Strings: ${analysis.bpFormats.string}`);
console.log(`   Null: ${analysis.bpFormats.null}`);
console.log('');

console.log('🎯 Quality Scores:');
console.log(`   Lowercase Keys: ${analysis.qualityScores.lowercaseKeys}`);
console.log(`   BP Objects: ${analysis.qualityScores.bpObjects}`);
console.log(`   Valid Waveforms: ${analysis.qualityScores.validWaveforms}`);
console.log(`   Required Fields: ${analysis.qualityScores.requiredFields}`);
console.log('');

console.log('━'.repeat(70));
console.log('✅ GOLDEN STANDARD BASELINE SAVED\n');
console.log(`📁 ${outputPath}\n`);
console.log('This baseline will be used to verify all future data operations.');
console.log('━'.repeat(70) + '\n');

module.exports = { analysis };
