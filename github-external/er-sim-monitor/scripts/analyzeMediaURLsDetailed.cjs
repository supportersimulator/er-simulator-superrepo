#!/usr/bin/env node

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const TOKEN_PATH = path.join(__dirname, '../config/token.json');
const CREDS_PATH = path.join(__dirname, '../config/credentials.json');

async function analyzeMediaURLsDetailed() {
  const credentials = JSON.parse(fs.readFileSync(CREDS_PATH, 'utf8'));
  const { client_id, client_secret } = credentials.installed || credentials.web;
  const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));

  const oauth2Client = new google.auth.OAuth2(client_id, client_secret, 'http://localhost');
  oauth2Client.setCredentials(token);

  const sheets = google.sheets({ version: 'v4', auth: oauth2Client });

  console.log('\n📊 DETAILED MEDIA URL ANALYSIS - ROWS 194-199\n');
  console.log('='.repeat(80) + '\n');

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: "'Master Scenario Convert'!A194:AO199",
  });

  const rows = response.data.values || [];

  const contentURLs = {};

  rows.forEach((row, idx) => {
    const rowNum = 194 + idx;
    const caseId = row[0] || 'N/A';
    const title = row[1] || 'N/A';

    console.log(`Row ${rowNum}: ${caseId}`);
    console.log(`  Title: ${title}`);

    const mediaColumns = row.slice(21, 35);

    // Filter out license URLs, focus on content URLs
    const urls = mediaColumns
      .filter(cell => cell && cell.toString().includes('http'))
      .map(url => url.toString())
      .filter(url => !url.includes('creativecommons.org')); // Exclude license URLs

    if (urls.length > 0) {
      console.log(`  📸 Content URLs:`);
      urls.forEach(url => {
        console.log(`      ${url}`);
      });
      contentURLs[rowNum] = urls;
    } else {
      console.log(`  📸 Content URLs: NONE (only license URLs found)`);
      contentURLs[rowNum] = [];
    }

    console.log('');
  });

  console.log('='.repeat(80));
  console.log('🎯 CONTENT URL UNIQUENESS ANALYSIS\n');

  // Flatten all content URLs
  const allContentURLs = Object.values(contentURLs).flat();
  const uniqueContentURLs = [...new Set(allContentURLs)];

  console.log(`Total content URLs: ${allContentURLs.length}`);
  console.log(`Unique content URLs: ${uniqueContentURLs.length}`);
  console.log(`Duplicate content URLs: ${allContentURLs.length - uniqueContentURLs.length}\n`);

  if (allContentURLs.length === uniqueContentURLs.length) {
    console.log('✅ ALL CONTENT URLs ARE UNIQUE!');
    console.log('   → Each row references DIFFERENT source material');
    console.log('   → Rows 194-199 are based on distinct cases from emsimcases.com\n');
    console.log('📋 CONCLUSION:');
    console.log('   Despite similar text (77-89% similarity), these scenarios have');
    console.log('   different source materials. The similarity may be because:');
    console.log('   - All cases are MI variants (same diagnosis family)');
    console.log('   - AI used similar phrasing for similar conditions');
    console.log('   - Template-based generation for cardiac cases\n');
    console.log('   RECOMMENDATION: Keep all scenarios, but consider:');
    console.log('   - Adding subtype specificity (Anterior vs Inferior STEMI)');
    console.log('   - Varying demographics (not all 52M)');
    console.log('   - Emphasizing unique EKG findings from each source');
  } else {
    console.log('⚠️  DUPLICATE CONTENT URLs DETECTED');
    console.log('   → Some rows share the same source material\n');

    // Find duplicates
    const urlCounts = {};
    allContentURLs.forEach(url => {
      urlCounts[url] = (urlCounts[url] || 0) + 1;
    });

    const duplicatedURLs = Object.entries(urlCounts)
      .filter(([url, count]) => count > 1);

    console.log('Duplicated content URLs:');
    duplicatedURLs.forEach(([url, count]) => {
      console.log(`  ${count}x: ${url}`);

      const usingRows = Object.entries(contentURLs)
        .filter(([rowNum, urls]) => urls.includes(url))
        .map(([rowNum]) => rowNum);

      console.log(`      Used in rows: ${usingRows.join(', ')}`);
    });
  }

  console.log('\n' + '='.repeat(80));
  console.log('📝 DETAILED ROW COMPARISON\n');

  Object.entries(contentURLs).forEach(([rowNum, urls]) => {
    console.log(`Row ${rowNum}: ${urls.length} content URL(s)`);
    if (urls.length > 0) {
      urls.forEach(url => {
        // Extract case identifier from URL
        const match = url.match(/\/(\d{4}\/\d{2}\/\d{2})\/([^\/]+)/);
        if (match) {
          console.log(`  Date: ${match[1]}, Case: ${match[2]}`);
        }
      });
    }
  });

  console.log('\n' + '='.repeat(80) + '\n');
}

analyzeMediaURLsDetailed().catch(console.error);
