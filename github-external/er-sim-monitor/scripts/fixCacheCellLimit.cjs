#!/usr/bin/env node

/**
 * FIX CACHE CELL LIMIT ERROR
 * Move analysis cache from sheet cells to DocumentProperties to avoid 50k char limit
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const PRODUCTION_PROJECT_ID = '12NihbVaaAIyRMCtzZ-aGjJ71CdL-HDjhmjxiD_S_EgIOuDOtrUH6M1l2';

async function authorize() {
  const credentialsPath = path.join(__dirname, '../config/credentials.json');
  const tokenPath = path.join(__dirname, '../config/token.json');
  const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
  const token = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
  const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
  oAuth2Client.setCredentials(token);
  return oAuth2Client;
}

async function fix() {
  try {
    const auth = await authorize();
    const script = google.script({ version: 'v1', auth });

    console.log('📥 Downloading current code...\n');

    const content = await script.projects.getContent({
      scriptId: PRODUCTION_PROJECT_ID
    });

    const codeFile = content.data.files.find(f => f.name === 'Code');
    const manifestFile = content.data.files.find(f => f.name === 'appsscript');

    let code = codeFile.source;

    console.log('🔧 Replacing sheet cache with DocumentProperties cache...\n');

    // Find the getOrCreateHolisticAnalysis_ function
    const funcStart = code.indexOf('function getOrCreateHolisticAnalysis_(forceRefresh) {');
    const funcEnd = code.indexOf('\nfunction performHolisticAnalysis_() {', funcStart);

    if (funcStart === -1 || funcEnd === -1) {
      console.log('❌ Could not find getOrCreateHolisticAnalysis_ function\n');
      return;
    }

    // Replace the entire function with DocumentProperties version
    const newFunction = `function getOrCreateHolisticAnalysis_(forceRefresh) {

  // Refresh headers before analysis
  refreshHeaders();

  const docProps = PropertiesService.getDocumentProperties();

  // Check if we have cached analysis (less than 24 hours old)
  const cachedTimestamp = docProps.getProperty('HOLISTIC_ANALYSIS_TIMESTAMP');
  const cachedAnalysis = docProps.getProperty('HOLISTIC_ANALYSIS_JSON');

  if (!forceRefresh && cachedTimestamp && cachedAnalysis) {
    const cached = new Date(cachedTimestamp);
    const now = new Date();
    const hoursDiff = (now - cached) / (1000 * 60 * 60);

    if (hoursDiff < 24) {
      // Use cached analysis
      Logger.log('Using cached holistic analysis (' + hoursDiff.toFixed(1) + ' hours old)');
      try {
        return JSON.parse(cachedAnalysis);
      } catch (parseError) {
        Logger.log('⚠️ Failed to parse cached analysis, regenerating...');
        // Fall through to regenerate
      }
    }
  }

  // Generate fresh analysis
  Logger.log('Generating fresh holistic analysis...');
  const analysis = performHolisticAnalysis_();

  // Cache the results in DocumentProperties
  try {
    const analysisJson = JSON.stringify(analysis);

    // Check if it fits in a single property (9KB limit = ~9000 chars)
    if (analysisJson.length < 9000) {
      docProps.setProperty('HOLISTIC_ANALYSIS_JSON', analysisJson);
      docProps.setProperty('HOLISTIC_ANALYSIS_TIMESTAMP', new Date().toISOString());
      Logger.log('✅ Cached analysis (' + analysisJson.length + ' chars) in DocumentProperties');
    } else {
      // Split across multiple properties (chunk into 8KB pieces)
      const chunkSize = 8000;
      const chunks = [];
      for (let i = 0; i < analysisJson.length; i += chunkSize) {
        chunks.push(analysisJson.substring(i, i + chunkSize));
      }

      // Save chunks
      docProps.setProperty('HOLISTIC_ANALYSIS_CHUNKS', chunks.length.toString());
      for (let i = 0; i < chunks.length; i++) {
        docProps.setProperty('HOLISTIC_ANALYSIS_CHUNK_' + i, chunks[i]);
      }
      docProps.setProperty('HOLISTIC_ANALYSIS_TIMESTAMP', new Date().toISOString());

      Logger.log('✅ Cached analysis (' + analysisJson.length + ' chars) in ' + chunks.length + ' chunks');
    }
  } catch (cacheError) {
    Logger.log('⚠️ Failed to cache analysis: ' + cacheError.toString());
    // Don't fail if caching fails - just return the analysis
  }

  return analysis;
}

`;

    code = code.substring(0, funcStart) + newFunction + code.substring(funcEnd);

    console.log('✅ Replaced cache logic\n');

    await script.projects.updateContent({
      scriptId: PRODUCTION_PROJECT_ID,
      requestBody: { files: [
        { name: 'Code', type: 'SERVER_JS', source: code },
        manifestFile
      ]}
    });

    console.log('✅ Deployed!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('✅ CACHE CELL LIMIT FIXED!\n');
    console.log('\nChanges:\n');
    console.log('  ❌ OLD: Saved analysis to sheet cell (50k char limit)');
    console.log('  ✅ NEW: Saves to DocumentProperties (supports chunking for large data)\n');
    console.log('Benefits:');
    console.log('  ✅ No more "50000 characters" error');
    console.log('  ✅ Automatically chunks large analysis across multiple properties');
    console.log('  ✅ No hidden cache sheet cluttering your spreadsheet');
    console.log('  ✅ Faster cache reads\n');
    console.log('Try "Categories & Pathways" again - it should work now!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

fix();
