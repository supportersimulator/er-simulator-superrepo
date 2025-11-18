#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
require('dotenv').config();

const SHEET_NAME = 'Master Scenario Convert';

async function auditAllTools() {
  console.log('🔍 COMPREHENSIVE TOOL & DATA AUDIT\n');
  console.log('Goal: Achieve 100% ideal state before AWS migration\n');
  console.log('━'.repeat(70) + '\n');

  // Auth setup
  const credentialsPath = path.join(__dirname, '../config/credentials.json');
  const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
  const {client_id, client_secret, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  const tokenPath = path.join(__dirname, '../config/token.json');
  const token = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
  oAuth2Client.setCredentials(token);

  const sheets = google.sheets({version: 'v4', auth: oAuth2Client});

  // Get all data
  const headerResponse = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: `${SHEET_NAME}!2:2`
  });

  const headers = headerResponse.data.values[0];

  const dataResponse = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: `${SHEET_NAME}!3:1000`
  });

  const rows = dataResponse.data.values || [];

  console.log(`📊 Total rows: ${rows.length}\n`);

  // Find column indices - using exact header names
  const caseIdIdx = headers.findIndex(h => h === 'Case_Organization_Case_ID');
  const vitalsIdx = headers.findIndex(h => h === 'Monitor_Vital_Signs_Initial_Vitals');
  const sparkTitleIdx = headers.findIndex(h => h === 'Case_Organization_Spark_Title');
  const revealTitleIdx = headers.findIndex(h => h === 'Case_Organization_Reveal_Title');
  const preSimOverviewIdx = headers.findIndex(h => h === 'Case_Organization_Pre_Sim_Overview');
  const postSimOverviewIdx = headers.findIndex(h => h === 'Case_Organization_Post_Sim_Overview');
  const categoryIdx = headers.findIndex(h => h === 'Case_Organization_Medical_Category');
  const pathwayIdx = headers.findIndex(h => h === 'Case_Organization_Pathway_or_Course_Name');

  console.log('📋 Column Indices:');
  console.log(`   Case_ID: ${caseIdIdx + 1}`);
  console.log(`   Vitals: ${vitalsIdx + 1}`);
  console.log(`   Spark_Title: ${sparkTitleIdx + 1}`);
  console.log(`   Reveal_Title: ${revealTitleIdx + 1}`);
  console.log(`   Pre_Sim_Overview: ${preSimOverviewIdx + 1}`);
  console.log(`   Post_Sim_Overview: ${postSimOverviewIdx + 1}`);
  console.log(`   Medical_Category: ${categoryIdx + 1}`);
  console.log(`   Pathway: ${pathwayIdx + 1}\n`);

  // Audit results
  const issues = {
    missingCaseId: [],
    invalidCaseId: [],
    missingVitals: [],
    invalidVitals: [],
    missingSparkTitle: [],
    missingRevealTitle: [],
    missingPreSimOverview: [],
    missingPostSimOverview: [],
    missingCategory: [],
    missingPathway: [],
    invalidWaveform: []
  };

  const validWaveforms = [
    'sinus_ecg', 'afib_ecg', 'vtach_ecg', 'vfib_ecg',
    'asystole_ecg', 'nsr_ecg', 'stemi_ecg', 'nstemi_ecg'
  ];

  console.log('🔍 AUDITING DATA QUALITY...\n');

  rows.forEach((row, i) => {
    const rowNum = i + 3; // Actual sheet row number

    // Case_ID validation
    const caseId = row[caseIdIdx];
    if (!caseId || caseId.trim() === '') {
      issues.missingCaseId.push(rowNum);
    } else if (!/^[A-Z]{2}\d{5}$/.test(caseId)) {
      issues.invalidCaseId.push({row: rowNum, value: caseId});
    }

    // Vitals validation
    const vitals = row[vitalsIdx];
    if (!vitals || vitals.trim() === '') {
      issues.missingVitals.push(rowNum);
    } else {
      try {
        const vitalsObj = JSON.parse(vitals);
        if (!vitalsObj.waveform || !validWaveforms.includes(vitalsObj.waveform)) {
          issues.invalidWaveform.push({row: rowNum, waveform: vitalsObj.waveform});
        }
        // Check required vitals fields
        if (!vitalsObj.hr || !vitalsObj.spo2 || !vitalsObj.bp || !vitalsObj.rr) {
          issues.invalidVitals.push({row: rowNum, reason: 'Missing required fields'});
        }
      } catch (e) {
        issues.invalidVitals.push({row: rowNum, reason: 'Invalid JSON'});
      }
    }

    // ATSR fields validation
    if (!row[sparkTitleIdx] || row[sparkTitleIdx].trim() === '') {
      issues.missingSparkTitle.push(rowNum);
    }
    if (!row[revealTitleIdx] || row[revealTitleIdx].trim() === '') {
      issues.missingRevealTitle.push(rowNum);
    }

    // Overview validation
    if (preSimOverviewIdx !== -1 && (!row[preSimOverviewIdx] || row[preSimOverviewIdx].trim() === '')) {
      issues.missingPreSimOverview.push(rowNum);
    }
    if (postSimOverviewIdx !== -1 && (!row[postSimOverviewIdx] || row[postSimOverviewIdx].trim() === '')) {
      issues.missingPostSimOverview.push(rowNum);
    }

    // Category/Pathway validation
    if (categoryIdx !== -1 && (!row[categoryIdx] || row[categoryIdx].trim() === '')) {
      issues.missingCategory.push(rowNum);
    }
    if (pathwayIdx !== -1 && (!row[pathwayIdx] || row[pathwayIdx].trim() === '')) {
      issues.missingPathway.push(rowNum);
    }
  });

  // Report results
  console.log('━'.repeat(70));
  console.log('📊 AUDIT RESULTS\n');

  let totalIssues = 0;

  const reportIssue = (title, issueList, showValue = false) => {
    if (issueList.length > 0) {
      totalIssues += issueList.length;
      console.log(`❌ ${title}: ${issueList.length} issues`);
      if (showValue && issueList.length <= 10) {
        issueList.forEach(item => {
          if (typeof item === 'object') {
            console.log(`   Row ${item.row}: ${JSON.stringify(item)}`);
          } else {
            console.log(`   Row ${item}`);
          }
        });
      } else if (issueList.length <= 10) {
        console.log(`   Rows: ${issueList.join(', ')}`);
      } else {
        console.log(`   First 10 rows: ${issueList.slice(0, 10).join(', ')}...`);
      }
      console.log('');
    } else {
      console.log(`✅ ${title}: All good`);
    }
  };

  reportIssue('Missing Case_ID', issues.missingCaseId);
  reportIssue('Invalid Case_ID format', issues.invalidCaseId, true);
  reportIssue('Missing Vitals', issues.missingVitals);
  reportIssue('Invalid Vitals JSON', issues.invalidVitals, true);
  reportIssue('Invalid Waveform', issues.invalidWaveform, true);
  reportIssue('Missing Spark Titles', issues.missingSparkTitle);
  reportIssue('Missing Reveal Titles', issues.missingRevealTitle);
  reportIssue('Missing Pre-Sim Overviews', issues.missingPreSimOverview);
  reportIssue('Missing Post-Sim Overviews', issues.missingPostSimOverview);
  reportIssue('Missing Medical Categories', issues.missingCategory);
  reportIssue('Missing Pathways', issues.missingPathway);

  console.log('━'.repeat(70));

  if (totalIssues === 0) {
    console.log('🎉 100% IDEAL STATE ACHIEVED!\n');
    console.log('All data is perfect and ready for AWS migration.\n');
  } else {
    console.log(`⚠️  TOTAL ISSUES: ${totalIssues}\n`);
    console.log('🔧 AUTO-FIX PLAN:\n');

    if (issues.missingVitals.length > 0) {
      console.log('1. Apply clinical defaults to rows with missing vitals');
    }
    if (issues.invalidVitals.length > 0) {
      console.log('2. Fix invalid vitals JSON structures');
    }
    if (issues.missingSparkTitle.length > 0 || issues.missingRevealTitle.length > 0) {
      console.log('3. Generate ATSR content for missing titles');
    }
    if (issues.missingPreSimOverview.length > 0 || issues.missingPostSimOverview.length > 0) {
      console.log('4. Generate overviews for all cases');
    }
    if (issues.missingCategory.length > 0 || issues.missingPathway.length > 0) {
      console.log('5. Assign categories and pathways');
    }
    if (issues.invalidWaveform.length > 0) {
      console.log('6. Fix invalid waveform assignments');
    }
    if (issues.invalidCaseId.length > 0) {
      console.log('7. Standardize Case_ID format');
    }

    console.log('');
  }

  console.log('━'.repeat(70) + '\n');

  // Save detailed report
  const reportPath = path.join(__dirname, '../docs/DATA_AUDIT_REPORT.md');
  const report = `# Data Quality Audit Report
Generated: ${new Date().toISOString()}

## Summary
- Total Rows: ${rows.length}
- Total Issues: ${totalIssues}
- Completion: ${((1 - totalIssues / (rows.length * 10)) * 100).toFixed(1)}%

## Issues Found

### Case_ID Issues
- Missing: ${issues.missingCaseId.length}
- Invalid Format: ${issues.invalidCaseId.length}

### Vitals Issues
- Missing: ${issues.missingVitals.length}
- Invalid JSON: ${issues.invalidVitals.length}
- Invalid Waveform: ${issues.invalidWaveform.length}

### ATSR Content Issues
- Missing Spark Titles: ${issues.missingSparkTitle.length}
- Missing Reveal Titles: ${issues.missingRevealTitle.length}

### Content Issues
- Missing Pre-Sim Overviews: ${issues.missingPreSimOverview.length}
- Missing Post-Sim Overviews: ${issues.missingPostSimOverview.length}
- Missing Medical Categories: ${issues.missingCategory.length}
- Missing Pathways: ${issues.missingPathway.length}

## Detailed Issue List

${JSON.stringify(issues, null, 2)}

## Next Steps

${totalIssues === 0 ?
  '✅ Data is ready for AWS migration!' :
  `Auto-fix scripts will resolve ${totalIssues} issues autonomously.`}
`;

  fs.writeFileSync(reportPath, report);
  console.log(`📄 Detailed report saved: docs/DATA_AUDIT_REPORT.md\n`);

  return {totalIssues, issues, rows: rows.length};
}

auditAllTools().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
