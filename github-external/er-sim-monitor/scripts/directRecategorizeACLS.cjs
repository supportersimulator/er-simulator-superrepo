/**
 * Direct Re-Categorization of 19 ACLS Cases
 *
 * Directly calls OpenAI API to re-categorize the 19 cases,
 * then writes updated categories back to AI_Categorization_Results sheet.
 */

const { google } = require('googleapis');
const OpenAI = require('openai');
require('dotenv').config();
const fs = require('fs');

async function main() {
  console.log('🔄 Direct Re-Categorization of 19 ACLS Cases\n');
  console.log('══════════════════════════════════════════════════════════════\n');

  const token = JSON.parse(fs.readFileSync('./config/token.json', 'utf-8'));
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/oauth2callback'
  );
  oAuth2Client.setCredentials(token);

  const sheets = google.sheets({ version: 'v4', auth: oAuth2Client });

  // Get OpenAI key from Settings sheet
  console.log('🔑 Getting OpenAI API key from Settings sheet...\n');
  const settingsResponse = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.SHEET_ID,
    range: 'Settings!B2'
  });
  const apiKey = settingsResponse.data.values?.[0]?.[0];

  if (!apiKey || !apiKey.startsWith('sk-')) {
    console.log('❌ No valid OpenAI API key in Settings!B2\n');
    return;
  }

  const openai = new OpenAI({ apiKey: apiKey });

  // Load cases to re-categorize
  const caseIDs = JSON.parse(fs.readFileSync('./data/acls_recategorize_list.json', 'utf-8'));

  console.log('📋 Cases to Re-Categorize: ' + caseIDs.length + '\n');

  // Get mapping for valid symptoms/systems
  console.log('📥 Loading symptom/system mappings...\n');
  const mappingResponse = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.SHEET_ID,
    range: 'accronym_symptom_system_mapping!A2:C100'
  });
  const mappingData = mappingResponse.data.values || [];

  const accronymMapping = {};
  mappingData.forEach(row => {
    const accronym = row[0];
    const symptomName = row[1];
    const systemName = row[2];
    if (accronym && symptomName && systemName) {
      accronymMapping[accronym] = { symptomName, systemName };
    }
  });

  // Remove ACLS from valid options
  delete accronymMapping['ACLS'];

  const validSymptoms = Object.keys(accronymMapping).join(', ');
  const validSystems = [...new Set(Object.values(accronymMapping).map(v => v.systemName))].join(', ');

  console.log('✅ Loaded ' + Object.keys(accronymMapping).length + ' valid symptoms (ACLS removed)\n');

  // Get Input sheet data for these cases
  console.log('📥 Loading case data from Input sheet...\n');
  const inputResponse = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.SHEET_ID,
    range: 'Input!A3:C300'
  });
  const inputData = inputResponse.data.values || [];

  // Get AI_Categorization_Results to find row numbers
  const resultsResponse = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.SHEET_ID,
    range: 'AI_Categorization_Results!A2:O300'
  });
  const resultsData = resultsResponse.data.values || [];

  const updates = [];

  for (const caseID of caseIDs) {
    // Find in Input sheet
    const inputRow = inputData.find(row => row[0] === caseID);
    if (!inputRow) {
      console.log('⚠️  ' + caseID + ' - not found in Input sheet');
      continue;
    }

    const htmlSource = inputRow[1] || '';
    const wordText = inputRow[2] || '';

    // Find in Results sheet to get row number
    const resultsRowIdx = resultsData.findIndex(row => row[0] === caseID);
    if (resultsRowIdx === -1) {
      console.log('⚠️  ' + caseID + ' - not found in Results sheet');
      continue;
    }

    const actualRow = resultsRowIdx + 2; // Results data starts at row 2

    console.log('🤖 Re-categorizing ' + caseID + ' (Row ' + actualRow + ')...');

    // Call OpenAI API
    const prompt = `You are a medical simulation expert analyzing emergency medicine scenarios.

INPUT DATA:
HTML Source: ${htmlSource.substring(0, 2000)}
Case Text: ${wordText.substring(0, 2000)}

TASK: Extract and categorize:
1. Primary presenting SYMPTOM (acronym)
2. Primary medical SYSTEM

Valid symptom acronyms: ${validSymptoms}

Valid systems: ${validSystems}

⚠️ CRITICAL ACLS RULE:
ACLS (Advanced Cardiac Life Support) should ONLY be used for:
- Actual cardiac arrest (patient is unresponsive, pulseless, not breathing)
- Requires CPR or defibrillation
- "Code Blue" situations

Do NOT use ACLS for:
- Chest pain with a pulse (use CP - Chest Pain or AMIN - Acute MI)
- Shortness of breath but breathing (use SOB or PE)
- Conscious patients in distress (use appropriate symptom)
- Any patient who is alert and talking

If the scenario does not explicitly state "cardiac arrest," "unresponsive," "no pulse," or "CPR," then DO NOT choose ACLS.

Return ONLY valid JSON:
{
  "symptom": "ACRONYM",
  "system": "System Name"
}`;

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3
      });

      const responseText = completion.choices[0].message.content.trim();
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        console.log('   ❌ Invalid AI response format');
        continue;
      }

      const result = JSON.parse(jsonMatch[0]);
      const symptomAcronym = result.symptom;
      const systemName = result.system;

      if (!accronymMapping[symptomAcronym]) {
        console.log('   ❌ Invalid symptom: ' + symptomAcronym);
        continue;
      }

      const symptomFullName = accronymMapping[symptomAcronym].symptomName;

      console.log('   ✅ ' + symptomAcronym + ' (' + symptomFullName + ') / ' + systemName);

      // Update Results sheet - columns M, N, O (indices 12, 13, 14)
      updates.push({
        row: actualRow,
        caseID: caseID,
        symptom: symptomAcronym,
        system: systemName,
        symptomName: symptomFullName
      });

    } catch (error) {
      console.log('   ❌ Error: ' + error.message);
    }

    // Rate limit (avoid hitting OpenAI rate limits)
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n══════════════════════════════════════════════════════════════\n');
  console.log('💾 Writing ' + updates.length + ' updates to AI_Categorization_Results...\n');

  for (const update of updates) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.SHEET_ID,
      range: `AI_Categorization_Results!M${update.row}:O${update.row}`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [[update.symptom, update.system, update.symptomName]]
      }
    });

    console.log('  ✅ Updated ' + update.caseID + ': ' + update.symptom + ' / ' + update.system);
  }

  console.log('\n✅ Re-Categorization Complete!\n');
  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('📋 Next Steps:\n');
  console.log('  1. Refresh Google Sheet (F5)');
  console.log('  2. Open Categories & Pathways panel');
  console.log('  3. Click "Apply Selected Categories to Master"');
  console.log('  4. Verify all 207 cases now have correct categories\n');
  console.log('Expected: 0 ACLS cases (all changed to AMIN, PE, etc.)\n');
}

main().catch(console.error);
