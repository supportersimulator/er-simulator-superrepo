#!/usr/bin/env node

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const TOKEN_PATH = path.join(__dirname, '../config/token.json');
const CREDS_PATH = path.join(__dirname, '../config/credentials.json');

async function analyzeRows() {
  const credentials = JSON.parse(fs.readFileSync(CREDS_PATH, 'utf8'));
  const { client_id, client_secret } = credentials.installed || credentials.web;
  const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
  
  const oauth2Client = new google.auth.OAuth2(client_id, client_secret, 'http://localhost');
  oauth2Client.setCredentials(token);
  
  const sheets = google.sheets({ version: 'v4', auth: oauth2Client });
  
  console.log('\n🔍 DETAILED ANALYSIS: Rows 191-193\n');
  console.log('='.repeat(80) + '\n');
  
  // Fetch headers
  const headerResponse = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: "'Master Scenario Convert'!1:2",
  });
  
  const headers = headerResponse.data.values || [];
  const tier1 = headers[0] || [];
  const tier2 = headers[1] || [];
  
  // Fetch rows 191-193
  const dataResponse = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: "'Master Scenario Convert'!192:194",
  });
  
  const rows = dataResponse.data.values || [];
  
  // Key field indices (based on your 2-tier header structure)
  const indices = {
    caseId: 0,
    sparkTitle: 1,
    revealTitle: 2,
    caseSeries: 3,
    pathway: 5,
    difficulty: 6,
    originalTitle: 7,
    category: 11,
    patientAge: 40, // Approximate
    chiefComplaint: 42, // Approximate
    learningObjectives: 40,
    clinicalPearl: 44
  };
  
  rows.forEach((row, idx) => {
    const rowNum = 191 + idx;
    
    console.log(`ROW ${rowNum}:`);
    console.log('─'.repeat(80));
    console.log(`Case ID: ${row[0]}`);
    console.log(`Spark Title: ${row[1]}`);
    console.log(`Reveal Title: ${row[2]}`);
    console.log(`\nCase Organization:`);
    console.log(`  Series: ${row[3]}`);
    console.log(`  Pathway: ${row[5]}`);
    console.log(`  Difficulty: ${row[6]}`);
    console.log(`  Original Title: ${row[7]}`);
    console.log(`  Category: ${row[11]}`);
    
    console.log(`\nClinical Context:`);
    console.log(`  Chief Complaint: ${row[42] ? row[42].substring(0, 150) : 'N/A'}...`);
    console.log(`  Learning Objective: ${row[40] ? row[40].substring(0, 150) : 'N/A'}...`);
    console.log(`  Clinical Context: ${row[41] ? row[41].substring(0, 150) : 'N/A'}...`);
    
    // Parse Pre-Sim Overview to get the clinical hook
    const preSimOverview = row[9];
    if (preSimOverview && preSimOverview.length > 0) {
      try {
        const preSimData = JSON.parse(preSimOverview);
        console.log(`\nPre-Sim Hook:`);
        console.log(`  SBAR Handoff: ${preSimData.sbarHandoff ? preSimData.sbarHandoff.substring(0, 200) : 'N/A'}...`);
        console.log(`  The Stakes: ${preSimData.theStakes || 'N/A'}`);
        console.log(`  Mystery Hook: ${preSimData.mysteryHook || 'N/A'}`);
      } catch (e) {
        console.log(`\nPre-Sim Hook: (Could not parse JSON)`);
      }
    }
    
    // Parse Post-Sim Overview to get learning outcomes
    const postSimOverview = row[10];
    if (postSimOverview && postSimOverview.length > 0) {
      try {
        const postSimData = JSON.parse(postSimOverview);
        console.log(`\nPost-Sim Learning Outcomes:`);
        console.log(`  Victory Headline: ${postSimData.victoryHeadline || 'N/A'}`);
        console.log(`  Critical Pearl: ${postSimData.theCriticalPearl?.content || 'N/A'}`);
        if (postSimData.whatYouMastered && postSimData.whatYouMastered.length > 0) {
          console.log(`  What You Mastered:`);
          postSimData.whatYouMastered.forEach((item, i) => {
            console.log(`    ${i+1}. ${item}`);
          });
        }
      } catch (e) {
        console.log(`\nPost-Sim Learning: (Could not parse JSON)`);
      }
    }
    
    console.log('\n' + '='.repeat(80) + '\n');
  });
  
  // Compare for similarities
  console.log('\n🔍 SIMILARITY ANALYSIS:\n');
  console.log('Comparing Case IDs:');
  rows.forEach((row, idx) => {
    console.log(`  Row ${191 + idx}: ${row[0]} (${row[11]})`);
  });
  
  console.log('\nComparing Reveal Titles:');
  rows.forEach((row, idx) => {
    console.log(`  Row ${191 + idx}: ${row[2]}`);
  });
  
  console.log('\nComparing Original Titles:');
  rows.forEach((row, idx) => {
    console.log(`  Row ${191 + idx}: ${row[7]}`);
  });
  
  // Check if they're all the same category
  const categories = rows.map(r => r[11]);
  const allSameCategory = categories.every(cat => cat === categories[0]);
  
  console.log(`\n${allSameCategory ? '⚠️' : '✅'} All same medical category? ${allSameCategory ? 'YES' : 'NO'}`);
  if (allSameCategory) {
    console.log(`   All rows are: ${categories[0]}`);
  }
  
  // Check if reveal titles are similar
  const revealTitles = rows.map(r => r[2]);
  const similarTitles = revealTitles.filter(title => 
    title.includes('Myocardial Infarction') || 
    title.includes('Cardiac Arrest') ||
    title.includes('Subarachnoid')
  );
  
  if (similarTitles.length > 1) {
    console.log(`\n⚠️ Found ${similarTitles.length} rows with similar cardiac themes`);
  }
}

analyzeRows().catch(console.error);
