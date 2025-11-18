#!/usr/bin/env node

/**
 * Analyze Output Sheet for Simulation_ID Column
 *
 * Find where Simulation_ID is stored in the Output sheet
 * This will help us implement robust row detection
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const TOKEN_PATH = path.join(__dirname, '..', 'config', 'token.json');
const SCRIPT_ID = process.env.APPS_SCRIPT_ID;

async function analyzeOutputSheetForSimulationId() {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('  ANALYZE OUTPUT SHEET FOR SIMULATION_ID');
  console.log('═══════════════════════════════════════════════════');
  console.log('');

  const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/oauth2callback'
  );
  oauth2Client.setCredentials(token);

  const script = google.script({ version: 'v1', auth: oauth2Client });

  console.log('📖 Reading Apps Script to find output sheet name...');
  console.log('');

  // Execute a function to get output sheet headers and sample data
  const analyzeCode = `
function analyzeOutputSheetStructure() {
  const ss = SpreadsheetApp.getActive();

  // Get output sheet name from Settings
  const settingsSheet = ss.getSheetByName('Settings');
  let outputSheetName = 'Master Scenario Convert';
  if (settingsSheet) {
    const settingsOut = settingsSheet.getRange('A1').getValue();
    if (settingsOut) outputSheetName = settingsOut;
  }

  const outSheet = ss.getSheetByName(outputSheetName);
  if (!outSheet) return { error: 'Output sheet not found: ' + outputSheetName };

  const lastRow = outSheet.getLastRow();
  const lastCol = outSheet.getLastColumn();

  // Get headers (row 1 and row 2)
  const tier1Headers = outSheet.getRange(1, 1, 1, lastCol).getValues()[0];
  const tier2Headers = outSheet.getRange(2, 1, 1, lastCol).getValues()[0];

  // Get a few sample data rows
  const sampleRows = [];
  const sampleStart = Math.max(3, lastRow - 2); // Last 3 data rows
  if (lastRow >= 3) {
    const sampleData = outSheet.getRange(sampleStart, 1, lastRow - sampleStart + 1, lastCol).getValues();
    sampleRows.push(...sampleData);
  }

  return {
    sheetName: outputSheetName,
    lastRow: lastRow,
    lastCol: lastCol,
    tier1Headers: tier1Headers,
    tier2Headers: tier2Headers,
    sampleRows: sampleRows,
    sampleStartRow: sampleStart
  };
}
`;

  // First get the script content
  const response = await script.projects.getContent({ scriptId: SCRIPT_ID });
  const files = response.data.files;
  const codeFile = files.find(f => f.name === 'Code');
  let source = codeFile.source;

  // Add the analysis function if it doesn't exist
  if (!source.includes('function analyzeOutputSheetStructure()')) {
    const lastBrace = source.lastIndexOf('}');
    source = source.substring(0, lastBrace) + analyzeCode + source.substring(lastBrace);

    const updatedFiles = files.map(f => {
      if (f.name === 'Code') {
        return { ...f, source };
      }
      return f;
    });

    await script.projects.updateContent({
      scriptId: SCRIPT_ID,
      requestBody: { files: updatedFiles }
    });

    console.log('✅ Added analysis function to Apps Script');
    console.log('');
  }

  // Execute the analysis function
  console.log('🔍 Analyzing Output sheet structure...');
  console.log('');

  try {
    const execResponse = await script.scripts.run({
      scriptId: SCRIPT_ID,
      requestBody: {
        function: 'analyzeOutputSheetStructure',
        devMode: false
      }
    });

    if (execResponse.data.error) {
      console.log('❌ Error executing function:');
      console.log(JSON.stringify(execResponse.data.error, null, 2));
      return;
    }

    const result = execResponse.data.response.result;

    if (result.error) {
      console.log('❌ Error:', result.error);
      return;
    }

    console.log('📊 OUTPUT SHEET STRUCTURE');
    console.log('═══════════════════════════════════════════════════');
    console.log(`Sheet Name: ${result.sheetName}`);
    console.log(`Last Row: ${result.lastRow}`);
    console.log(`Last Column: ${result.lastCol}`);
    console.log('');

    console.log('TIER 1 HEADERS:');
    console.log('─────────────────────────────────────────────────');
    result.tier1Headers.forEach((header, idx) => {
      if (header) console.log(`  Col ${String.fromCharCode(65 + idx)} (${idx + 1}): ${header}`);
    });
    console.log('');

    console.log('TIER 2 HEADERS:');
    console.log('─────────────────────────────────────────────────');
    result.tier2Headers.forEach((header, idx) => {
      if (header) console.log(`  Col ${String.fromCharCode(65 + idx)} (${idx + 1}): ${header}`);
    });
    console.log('');

    // Look for Simulation_ID
    let simulationIdCol = -1;
    let simulationIdHeader = '';

    // Check tier 1
    for (let i = 0; i < result.tier1Headers.length; i++) {
      const header = String(result.tier1Headers[i] || '').toLowerCase();
      if (header.includes('simulation') && header.includes('id')) {
        simulationIdCol = i;
        simulationIdHeader = result.tier1Headers[i];
        break;
      }
    }

    // Check tier 2 if not found
    if (simulationIdCol === -1) {
      for (let i = 0; i < result.tier2Headers.length; i++) {
        const header = String(result.tier2Headers[i] || '').toLowerCase();
        if (header.includes('simulation') && header.includes('id')) {
          simulationIdCol = i;
          simulationIdHeader = result.tier2Headers[i];
          break;
        }
      }
    }

    if (simulationIdCol !== -1) {
      console.log('✅ FOUND SIMULATION_ID COLUMN!');
      console.log('─────────────────────────────────────────────────');
      console.log(`  Column: ${String.fromCharCode(65 + simulationIdCol)} (${simulationIdCol + 1})`);
      console.log(`  Header: ${simulationIdHeader}`);
      console.log('');

      console.log('SAMPLE VALUES:');
      console.log('─────────────────────────────────────────────────');
      result.sampleRows.forEach((row, idx) => {
        const rowNum = result.sampleStartRow + idx;
        const simId = row[simulationIdCol];
        console.log(`  Row ${rowNum}: ${simId}`);
      });
      console.log('');
    } else {
      console.log('⚠️  Could not find Simulation_ID column');
      console.log('');
      console.log('SAMPLE DATA (First 5 columns, last 3 rows):');
      console.log('─────────────────────────────────────────────────');
      result.sampleRows.forEach((row, idx) => {
        const rowNum = result.sampleStartRow + idx;
        console.log(`Row ${rowNum}:`);
        row.slice(0, 5).forEach((val, colIdx) => {
          console.log(`  Col ${String.fromCharCode(65 + colIdx)}: ${val}`);
        });
        console.log('');
      });
    }

    console.log('═══════════════════════════════════════════════════');

    // Save analysis result
    const analysisPath = path.join(__dirname, '..', 'data', 'output-sheet-analysis.json');
    fs.writeFileSync(analysisPath, JSON.stringify({
      ...result,
      simulationIdCol,
      simulationIdHeader,
      analyzedAt: new Date().toISOString()
    }, null, 2));

    console.log('');
    console.log(`💾 Analysis saved to: ${analysisPath}`);
    console.log('');

  } catch (error) {
    console.log('❌ Error executing analysis:', error.message);
    if (error.stack) console.log(error.stack);
  }
}

if (require.main === module) {
  analyzeOutputSheetForSimulationId().catch(error => {
    console.error('');
    console.error('❌ FAILED');
    console.error('════════════════════════════════════════════════════');
    console.error(`Error: ${error.message}`);
    console.error('');
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  });
}

module.exports = { analyzeOutputSheetForSimulationId };
