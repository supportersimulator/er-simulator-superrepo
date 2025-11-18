const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function createMappingSheet() {
  console.log('📝 Creating accronym_symptom_system_mapping sheet...\n');
  
  const token = JSON.parse(fs.readFileSync('./config/token.json', 'utf-8'));
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/oauth2callback'
  );
  oAuth2Client.setCredentials(token);
  
  const sheets = google.sheets({ version: 'v4', auth: oAuth2Client });
  const sheetId = process.env.SHEET_ID;
  
  // Create the sheet
  console.log('Creating sheet...');
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: sheetId,
    requestBody: {
      requests: [{
        addSheet: {
          properties: {
            title: 'accronym_symptom_system_mapping'
          }
        }
      }]
    }
  });
  
  console.log('✅ Sheet created\n');
  
  // Add symptom acronym data
  console.log('Adding symptom acronyms...');
  
  const symptomData = [
    ['Accronym', 'Full_Name', 'Description'],
    ['CP', 'Chest Pain', 'Patient presenting with chest pain'],
    ['SOB', 'Shortness of Breath', 'Patient presenting with difficulty breathing'],
    ['ABD', 'Abdominal Pain', 'Patient presenting with abdominal pain'],
    ['HA', 'Headache', 'Patient presenting with headache'],
    ['AMS', 'Altered Mental Status', 'Patient with confusion or altered consciousness'],
    ['SYNC', 'Syncope', 'Patient with loss of consciousness'],
    ['SZ', 'Seizure', 'Patient with seizure activity'],
    ['DIZZ', 'Dizziness', 'Patient presenting with dizziness'],
    ['WEAK', 'Weakness', 'Patient presenting with weakness'],
    ['NT', 'Nausea', 'Patient with nausea/vomiting'],
    ['GLF', 'General Feeling Bad', 'Non-specific malaise'],
    ['TR', 'Trauma', 'Traumatic injury'],
    ['MVC', 'Motor Vehicle Collision', 'MVCrelated trauma'],
    ['BURN', 'Burn', 'Burn injury'],
    ['FX', 'Fracture', 'Suspected fracture'],
    ['HEAD', 'Head Injury', 'Head trauma'],
    ['LAC', 'Laceration', 'Open wound'],
    ['GI', 'GI Bleed', 'Gastrointestinal bleeding'],
    ['GU', 'GU Problem', 'Genitourinary complaint'],
    ['GYN', 'Gynecologic', 'Gynecologic complaint'],
    ['OB', 'Obstetric', 'Pregnancy-related'],
    ['DERM', 'Dermatologic', 'Skin complaint'],
    ['EYE', 'Eye Problem', 'Eye complaint'],
    ['ENT', 'ENT Problem', 'Ear/nose/throat complaint'],
    ['PSY', 'Psychiatric', 'Psychiatric complaint'],
    ['SHOC', 'Shock', 'Patient in shock'],
    ['TOX', 'Toxicology', 'Poisoning or overdose'],
    ['ENV', 'Environmental', 'Environmental exposure'],
    ['END', 'Endocrine', 'Endocrine emergency'],
    ['HEM', 'Hematologic', 'Blood disorder'],
    ['INF', 'Infection', 'Infectious disease'],
    ['PCP', 'Pediatric CP', 'Pediatric chest pain'],
    ['PSOB', 'Pediatric SOB', 'Pediatric shortness of breath'],
    ['PABD', 'Pediatric ABD', 'Pediatric abdominal pain'],
    ['PFEV', 'Pediatric Fever', 'Pediatric fever'],
    ['PSZ', 'Pediatric Seizure', 'Pediatric seizure'],
    ['PTR', 'Pediatric Trauma', 'Pediatric trauma'],
    ['PGEN', 'Pediatric General', 'General pediatric complaint']
  ];
  
  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: 'accronym_symptom_system_mapping!A1',
    valueInputOption: 'RAW',
    requestBody: {
      values: symptomData
    }
  });
  
  console.log('✅ Added ' + (symptomData.length - 1) + ' symptom acronyms\n');
  
  console.log('✅ Mapping sheet created successfully!\n');
  console.log('Note: ACLS is intentionally NOT included in this list');
  console.log('      (filtered out by AI categorization code)');
}

createMappingSheet().catch(console.error);
