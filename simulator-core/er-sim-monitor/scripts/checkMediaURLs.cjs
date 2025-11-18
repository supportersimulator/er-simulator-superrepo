#!/usr/bin/env node

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const TOKEN_PATH = path.join(__dirname, '../config/token.json');
const CREDS_PATH = path.join(__dirname, '../config/credentials.json');

async function checkMediaURLs() {
  const credentials = JSON.parse(fs.readFileSync(CREDS_PATH, 'utf8'));
  const { client_id, client_secret } = credentials.installed || credentials.web;
  const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));

  const oauth2Client = new google.auth.OAuth2(client_id, client_secret, 'http://localhost');
  oauth2Client.setCredentials(token);

  const sheets = google.sheets({ version: 'v4', auth: oauth2Client });

  console.log('\n📊 MEDIA URL ANALYSIS - ROWS 194-199\n');
  console.log('='.repeat(80) + '\n');

  // Get rows 194-199 from Master Scenario Convert
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: "'Master Scenario Convert'!A194:AO199",
  });

  const rows = response.data.values || [];

  // Media URL columns (based on two-tier header structure)
  // Tier1: Media, Tier2: Img_PreSim, Img_Vitals_1-5, Img_PostSim, Audio_PreSim, Audio_PostSim
  // These are typically in columns after the vitals (around columns V-AE)

  console.log('🔍 Checking for media URL patterns...\n');

  rows.forEach((row, idx) => {
    const rowNum = 194 + idx;
    const caseId = row[0] || 'N/A';
    const title = row[1] || 'N/A';

    console.log(`Row ${rowNum}: ${caseId}`);
    console.log(`  Title: ${title.substring(0, 60)}...`);

    // Check various media columns
    // Column V onwards typically contains media fields
    const mediaColumns = row.slice(21, 35); // Approximate range for media columns

    const hasMedia = mediaColumns.some(cell =>
      cell && cell.toString().includes('http')
    );

    if (hasMedia) {
      console.log(`  📸 Media: PRESENT`);

      // Extract URLs
      const urls = mediaColumns
        .filter(cell => cell && cell.toString().includes('http'))
        .map(url => url.toString().substring(0, 80) + '...');

      urls.forEach(url => {
        console.log(`      ${url}`);
      });
    } else {
      console.log(`  📸 Media: NONE FOUND`);
    }

    console.log('');
  });

  console.log('='.repeat(80));
  console.log('🎯 MEDIA URL UNIQUENESS ANALYSIS\n');

  // Collect all media URLs across these rows
  const allMediaURLs = [];
  const rowMediaMap = {};

  rows.forEach((row, idx) => {
    const rowNum = 194 + idx;
    const mediaColumns = row.slice(21, 35);
    const urls = mediaColumns
      .filter(cell => cell && cell.toString().includes('http'))
      .map(url => url.toString());

    rowMediaMap[rowNum] = urls;
    allMediaURLs.push(...urls);
  });

  // Check for duplicates
  const uniqueURLs = [...new Set(allMediaURLs)];
  const totalURLs = allMediaURLs.length;
  const duplicateCount = totalURLs - uniqueURLs.length;

  console.log(`Total media URLs: ${totalURLs}`);
  console.log(`Unique media URLs: ${uniqueURLs.length}`);
  console.log(`Duplicate URLs: ${duplicateCount}\n`);

  if (duplicateCount > 0) {
    console.log('⚠️  DUPLICATE MEDIA URLs DETECTED');
    console.log('   This suggests rows may be using same source material\n');

    // Find which URLs are duplicated
    const urlCounts = {};
    allMediaURLs.forEach(url => {
      urlCounts[url] = (urlCounts[url] || 0) + 1;
    });

    const duplicatedURLs = Object.entries(urlCounts)
      .filter(([url, count]) => count > 1);

    console.log('Duplicated media URLs:');
    duplicatedURLs.forEach(([url, count]) => {
      console.log(`  ${count}x: ${url.substring(0, 80)}...`);

      // Find which rows use this URL
      const usingRows = Object.entries(rowMediaMap)
        .filter(([rowNum, urls]) => urls.includes(url))
        .map(([rowNum]) => rowNum);

      console.log(`      Used in rows: ${usingRows.join(', ')}`);
    });
  } else {
    console.log('✅ ALL MEDIA URLs ARE UNIQUE');
    console.log('   Each row has different source material\n');
  }

  console.log('\n' + '='.repeat(80));
  console.log('📋 VERDICT\n');

  if (duplicateCount === 0 && totalURLs > 0) {
    console.log('✅ Rows 194-199 have UNIQUE media URLs');
    console.log('   → Different source material for each scenario');
    console.log('   → Similar text may be coincidental or template-based');
    console.log('   → These are likely VALID distinct scenarios\n');
  } else if (duplicateCount > 0) {
    console.log('⚠️  Rows 194-199 share DUPLICATE media URLs');
    console.log('   → Same source material reused across rows');
    console.log('   → Likely TRUE duplicates (not just similar)\n');
  } else {
    console.log('⚠️  NO MEDIA URLs FOUND in rows 194-199');
    console.log('   → Cannot verify uniqueness via media');
    console.log('   → Need to rely on text similarity analysis\n');
  }

  console.log('='.repeat(80) + '\n');
}

checkMediaURLs().catch(console.error);
