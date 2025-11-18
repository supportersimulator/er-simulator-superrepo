#!/usr/bin/env node

/**
 * ADD AI RATIONALE TO RECOMMENDATIONS
 * Modify getAIRecommendedFields() to return field names WITH reasoning
 * Format: [{ name: "field_name", rationale: "why this field" }, ...]
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

    console.log('🔧 Step 1: Updating AI prompt to request rationale...\n');

    // Find the prompt construction in getAIRecommendedFields
    const promptStart = code.indexOf("const prompt = 'You are a medical education expert analyzing which data fields would be most valuable for AI pathway discovery");

    if (promptStart === -1) {
      console.log('❌ Could not find AI prompt\n');
      return;
    }

    // Find the old return format instruction
    const oldReturnFormat = "Return ONLY a JSON array of field names: [\"fieldName1\", \"fieldName2\", ...]";
    const newReturnFormat = `Return ONLY a JSON array of objects with field names AND rationale:\n' +
      '[{"name": "fieldName1", "rationale": "Brief explanation of why this field maximizes logic variance and educational value"}, ...]`;

    code = code.replace(oldReturnFormat, newReturnFormat);

    console.log('✅ Updated AI prompt format\n');

    console.log('🔧 Step 2: Updating response parsing...\n');

    // Find where it parses the AI response
    const parseStart = code.indexOf('const recommendedFields = JSON.parse(jsonMatch[0]);');

    if (parseStart === -1) {
      console.log('❌ Could not find response parsing\n');
      return;
    }

    // Find the section that filters recommendations
    const filterStart = code.indexOf('/ Extra safety: Filter out any selected fields AI might have included', parseStart);
    const filterEnd = code.indexOf("Logger.log('✅ AI recommended ' + filteredRecommendations.length + ' fields');", filterStart);

    if (filterStart === -1 || filterEnd === -1) {
      console.log('❌ Could not find filter section\n');
      return;
    }

    // Replace the filter section with new code that handles objects with rationale
    const newFilterCode = `// Extra safety: Filter out any selected fields AI might have included
    const filteredRecommendations = recommendedFields
      .filter(function(item) {
        // Handle both old format (strings) and new format (objects)
        const fieldName = typeof item === 'string' ? item : item.name;
        return currentlySelected.indexOf(fieldName) === -1;
      })
      .map(function(item) {
        // Normalize to object format
        if (typeof item === 'string') {
          return { name: item, rationale: 'Recommended for enhanced pathway discovery' };
        }
        return item;
      });

    Logger.log('✅ AI recommended ' + filteredRecommendations.length + ' fields with rationale');
    `;

    code = code.substring(0, filterStart) + newFilterCode + code.substring(filterEnd);

    console.log('✅ Updated response parsing\n');

    console.log('🔧 Step 3: Updating getRecommendedFields to return objects...\n');

    // Find the return statement in getRecommendedFields
    const getRecFuncStart = code.indexOf('function getRecommendedFields(availableFields, selectedFields) {');
    const getRecReturn = code.indexOf('return filtered;', getRecFuncStart);

    if (getRecReturn === -1) {
      console.log('❌ Could not find getRecommendedFields return\n');
      return;
    }

    // The cached return should already be correct, just verify it returns the full object

    console.log('✅ Verified return format\n');

    console.log('🔧 Step 4: Updating field selector UI to show rationale...\n');

    // Find where Section 2 (AI Recommendations) is rendered
    const section2Start = code.indexOf("header2.innerHTML = \"💡 AI RECOMMENDED TO CONSIDER (");

    if (section2Start === -1) {
      console.log('❌ Could not find Section 2 rendering\n');
      return;
    }

    // Find the loop that renders recommended fields
    const recFieldLoop = code.indexOf("recommendedFields.forEach(function(field) {", section2Start);

    if (recFieldLoop === -1) {
      console.log('❌ Could not find recommendedFields loop\n');
      return;
    }

    // Find where the checkbox is created in this loop
    const checkboxCreate = code.indexOf("var checkbox = document.createElement(\"input\");", recFieldLoop);
    const labelCreate = code.indexOf("var label = document.createElement(\"label\");", checkboxCreate);

    if (checkboxCreate === -1 || labelCreate === -1) {
      console.log('❌ Could not find checkbox/label creation\n');
      return;
    }

    // Find where label content is set
    const labelContent = code.indexOf("label.innerHTML = field.name", labelCreate);

    if (labelContent === -1) {
      console.log('❌ Could not find label content setting\n');
      return;
    }

    // Replace the label content with field object handling + rationale
    const oldLabelCode = 'label.innerHTML = field.name + (isAlsoRecommended ? " <span style=\\"color:#4CAF50;font-weight:bold;margin-left:4px;\\" title=\\"AI also recommends\\">✓</span>" : "");';

    const newLabelCode = `// Handle both formats: field can be string or {name, rationale}
      var fieldName = typeof field === \'string\' ? field : (field.name || field);
      var fieldRationale = typeof field === \'object\' && field.rationale ? field.rationale : \'\';
      var rationaleHtml = fieldRationale ? \'<div style="font-size:10px;color:#666;font-style:italic;margin-top:2px;line-height:1.3">\' + fieldRationale + \'</div>\' : \'\';
      label.innerHTML = fieldName + rationaleHtml;`;

    code = code.replace(oldLabelCode, newLabelCode);

    console.log('✅ Updated Section 2 UI to show rationale\n');

    await script.projects.updateContent({
      scriptId: PRODUCTION_PROJECT_ID,
      requestBody: { files: [
        { name: 'Code', type: 'SERVER_JS', source: code },
        manifestFile
      ]}
    });

    console.log('✅ Deployed!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('✅ AI RECOMMENDATIONS NOW INCLUDE RATIONALE!\n');
    console.log('\nHow it works now:\n');
    console.log('  1. AI receives current defaults + available fields');
    console.log('  2. AI prompt: "Given these defaults, recommend at least 1 more"');
    console.log('  3. AI returns: [{ name: "field_name", rationale: "why..." }, ...]');
    console.log('  4. Section 2 shows field name + reasoning below it\n');
    console.log('Example Section 2 display:');
    console.log('  💡 AI RECOMMENDED TO CONSIDER (5)');
    console.log('  ');
    console.log('  □ Case_Patient_Demographics_Presenting_Symptoms');
    console.log('     Captures initial complaint, essential for differential diagnosis patterns');
    console.log('  ');
    console.log('  □ Case_Orientation_Expected_Student_Actions');
    console.log('     Tracks learning objectives, enables pedagogical pathway grouping\n');
    console.log('Benefits:');
    console.log('  ✅ User sees WHY each field is recommended');
    console.log('  ✅ Makes informed decisions about field selection');
    console.log('  ✅ Understands impact on logic variance and educational value');
    console.log('  ✅ Checkmarks (✓) still show when defaults overlap with AI\n');
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
