#!/usr/bin/env node

/**
 * POPULATE 7 INITIAL LOGIC TYPES
 *
 * Adds the 7 intelligence-type logic types to Logic_Type_Library
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const LOGIC_TYPES = [
  {
    id: 'LT001',
    name: 'Visual-Spatial Intelligence',
    description: 'Waveform/imaging pattern recognition pathways',
    persona: 'Dr. Elena Rodriguez, expert in visual pattern recognition in emergency medicine',
    intelligence: 'Visual-Spatial',
    status: 'active'
  },
  {
    id: 'LT002',
    name: 'Logical-Mathematical Intelligence',
    description: 'Diagnostic algorithm and decision tree pathways',
    persona: 'Dr. Marcus Chen, Harvard-trained emergency physician specializing in clinical decision algorithms',
    intelligence: 'Logical-Mathematical',
    status: 'active'
  },
  {
    id: 'LT003',
    name: 'Interpersonal Intelligence',
    description: 'Team dynamics, communication, and leadership pathways',
    persona: 'Dr. Keisha Williams, national expert in crisis resource management (CRM)',
    intelligence: 'Interpersonal',
    status: 'active'
  },
  {
    id: 'LT004',
    name: 'Cognitive Bias Exposure',
    description: 'Diagnostic traps and cognitive bias awareness pathways',
    persona: 'Dr. Daniel Kahneman Jr., cognitive psychologist specializing in medical decision-making errors',
    intelligence: 'Intrapersonal',
    status: 'active'
  },
  {
    id: 'LT005',
    name: 'The Great Mimickers',
    description: 'Cross-system disease mimicry pathways',
    persona: 'Dr. Lisa House, diagnostic genius specializing in zebras and presentation paradoxes',
    intelligence: 'Naturalist',
    status: 'active'
  },
  {
    id: 'LT006',
    name: 'The Contrarian Collection',
    description: 'Challenge conventional medical education wisdom with surprising high-value pathways',
    persona: 'Dr. Atul Gawande meets Malcolm Gladwell - contrarian thinker questioning medical orthodoxy',
    intelligence: 'Multiple',
    status: 'active'
  },
  {
    id: 'LT007',
    name: 'Multi-Intelligence Hybrid',
    description: 'Pathways engaging 2-3 intelligence types simultaneously',
    persona: 'Dr. Howard Gardner, psychologist who created Multiple Intelligences theory',
    intelligence: 'Multiple',
    status: 'active'
  }
];

async function populate7LogicTypes() {
  try {
    console.log('📚 Populating 7 Initial Logic Types\n');

    // Load credentials
    const credPath = path.join(__dirname, '../config/credentials.json');
    const tokenPath = path.join(__dirname, '../config/token.json');

    const credentials = JSON.parse(fs.readFileSync(credPath, 'utf8'));
    const token = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));

    const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
    oAuth2Client.setCredentials(token);

    const sheets = google.sheets({ version: 'v4', auth: oAuth2Client });

    // Get spreadsheet ID from .env
    const envPath = path.join(__dirname, '../.env');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const sheetIdMatch = envContent.match(/GOOGLE_SHEET_ID=(.+)/);
    const spreadsheetId = sheetIdMatch ? sheetIdMatch[1].trim() : null;

    const today = new Date().toISOString().split('T')[0];

    // Build rows
    const rows = LOGIC_TYPES.map(lt => [
      lt.id,
      lt.name,
      lt.description,
      lt.persona,
      '[See PATHWAY_PROMPT_LIBRARY.md for full prompt]',
      lt.intelligence,
      today,
      '0', // Times used
      'N/A', // Avg quality
      lt.status
    ]);

    // Append to Logic_Type_Library
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Logic_Type_Library!A2',
      valueInputOption: 'RAW',
      requestBody: {
        values: rows
      }
    });

    console.log('✅ Populated 7 Logic Types:\n');
    LOGIC_TYPES.forEach((lt, i) => {
      console.log(`${i + 1}. ${lt.name}`);
      console.log(`   Persona: ${lt.persona}`);
      console.log(`   Intelligence: ${lt.intelligence}\n`);
    });

    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('🎉 LOGIC TYPE LIBRARY READY!\n');
    console.log('Next Steps:');
    console.log('1. Build dynamic dropdown UI (loads from this sheet)');
    console.log('2. Add "Create New Logic Type" button');
    console.log('3. Test discovery with first logic type\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

populate7LogicTypes();
