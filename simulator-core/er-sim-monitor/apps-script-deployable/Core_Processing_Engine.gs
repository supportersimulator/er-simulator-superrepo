/**
 * Core Processing Engine - Pure Business Logic
 *
 * Shared processing logic with NO UI dependencies.
 * Used by both ATSR and Batch Processing features.
 *
 * Functions:
 * - processOneInputRow_() - Main scenario processing
 * - validateVitalsFields_() - Input validation
 * - applyClinicalDefaults_() - Apply defaults
 * - tryParseJSON() - Safe JSON parsing
 *
 * No UI, no HTML - pure reusable logic.
 *
 * Generated: 2025-11-04T18:48:41.644Z
 * Source: Code_ULTIMATE_ATSR.gs (engine extraction)
 */

// ==================== CORE PROCESSING ENGINE ====================



// ==================== UTILITY FUNCTIONS ====================
// These functions are used by processOneInputRow_() and other core functions

function getProp(key, fallback) {
  const v = PropertiesService.getDocumentProperties().getProperty(key);
  return (v === null || v === undefined) ? fallback : v;
}

function setProp(key, val) {
  PropertiesService.getDocumentProperties().setProperty(key, val);
}

function hashText(text) {
  if (!text) return '';
  let hash = 0;
  for (let i=0; i<text.length; i++) {
    hash = (hash*31 + text.charCodeAt(i)) | 0;
  }
  return ('00000000' + (hash >>> 0).toString(16)).slice(-8);
}

function cleanDuplicateLines(text) {
  if (!text) return text;
  const lines = text.split('\n');
  const out = [];
  let last = '', count = 0;
  for (const l of lines) {
    const t = l.trim();
    if (t === last) {
      count++;
      if (count < 3) out.push(t);
    } else {
      out.push(t);
      last = t; count = 0;
    }
  }
  return out.join('\n');
}

function appendLogSafe(message) {
  try {
    const docProps = PropertiesService.getDocumentProperties();
    const oldLog = docProps.getProperty('Sidebar_Logs') || '';
    const newLog = `${oldLog}\n${new Date().toLocaleTimeString()} ${message}`.trim();
    docProps.setProperty('Sidebar_Logs', newLog);
  } catch (err) {
    Logger.log('appendLogSafe error: ' + err);
  }
}

// ==================== END UTILITY FUNCTIONS ====================

function processOneInputRow_(inputSheet, outputSheet, inputRow, batchMode) {
  try {
    // --- Read inputs per row: A=Formal_Info, B=HTML, C=DOC, D=Extra (any may be blank) ---
    const formal = String(inputSheet.getRange(inputRow, 1).getValue() || '').trim();
    const html   = String(inputSheet.getRange(inputRow, 2).getValue() || '').trim();
    const docRaw = String(inputSheet.getRange(inputRow, 3).getValue() || '').trim();
    const extra  = String(inputSheet.getRange(inputRow, 4).getValue() || '').trim();

    // --- STRICT INPUT VALIDATION: Require non-empty input data ---
    if (!formal && !html && !docRaw && !extra) {
      appendLogSafe(`⚠️ Row ${inputRow}: SKIPPED - No input data found (all columns empty)`);
      return {
        skipped: true,
        emptyInput: true,
        message: `Row ${inputRow}: EMPTY INPUT - Please provide source data before processing.`
      };
    }

    // Check for N/A-only input (common when rows are placeholders)
    const allNA = [formal, html, docRaw, extra].every(val =>
      !val || val === 'N/A' || val.toUpperCase() === 'N/A'
    );
    if (allNA) {
      appendLogSafe(`⚠️ Row ${inputRow}: SKIPPED - Input contains only 'N/A' placeholders`);
      return {
        skipped: true,
        emptyInput: true,
        message: `Row ${inputRow}: PLACEHOLDER INPUT - Replace 'N/A' with actual scenario data.`
      };
    }

    appendLogSafe(`▶️ Starting conversion for Row ${inputRow} (batchMode=${batchMode})`);

    // --- Calculate content signature (always needed for writing) ---
    const sniff = (formal + '\n' + html + '\n' + docRaw + '\n' + extra).slice(0, 1000);
    const sig = hashText(sniff);

    // --- Duplicate check against output content signature (unless force reprocess enabled) ---
    const forceReprocess = getProp('FORCE_REPROCESS', '0') === '1';
    if (!forceReprocess) {
      const allOut = outputSheet.getDataRange().getValues().flat().join('\n');
      if (allOut.indexOf(sig) !== -1) {
        return { skipped: true, duplicate: true, message: `Row ${inputRow}: duplicate (hash match).` };
      }
    } else {
      appendLogSafe(`🔄 Force reprocess enabled - skipping duplicate check for Row ${inputRow}`);
    }

    // --- Clean + setup ---
    const cleanedDoc = cleanDuplicateLines(docRaw);
    const { header1, header2 } = getCachedHeadersOrRead(outputSheet);
    const mergedKeys = mergedKeysFromTwoTiers_(header1, header2);
    const exampleRow = outputSheet.getRange(3, 1, 1, outputSheet.getLastColumn()).getValues()[0];

    const hardReq = `Hard requirement: You must include every key exactly as listed in the header pairs. Use "N/A" only when truly unknown or not applicable. Avoid inventing URLs.`;
        // --- Build AI example context from Rows 3 & 4 (distinct complete simulations) ---
    function buildExampleJSON(rowValues) {
      const obj = {};
      mergedKeys.forEach((key, i) => {
        const val = rowValues[i];
        if (val && val !== 'N/A' && String(val).trim() !== '') {
          obj[key] = val;
        }
      });
      return obj;
    }

    let exampleJson1 = '{}';
    let exampleJson2 = '{}';

    try {
      const exampleRow1 = outputSheet.getRange(3, 1, 1, outputSheet.getLastColumn()).getValues()[0];
      const exampleRow2 = outputSheet.getRange(4, 1, 1, outputSheet.getLastColumn()).getValues()[0];

      const data1 = buildExampleJSON(exampleRow1);
      const data2 = buildExampleJSON(exampleRow2);

      // --- Fallback demo if both are nearly empty ---
      const isEmpty = (obj) => Object.keys(obj).length < 5;
      const demoCase = {
        "Case_Organization:Case_ID": "DEMO001",
        "Case_Organization:Spark_Title": "Chest Pain (45 M): Sudden Tightness",
        "Monitor_Vital_Signs:Initial_Vitals": {"HR":118,"BP":"92/58","RR":28,"Temp":37.9,"SpO2":93},
        "Progression_States": ["Arrival","Oxygen","Stabilization"],
        "Decision_Nodes_JSON": [
          {
            "at_state": "Arrival",
            "decision": "Administer oxygen?",
            "options": [
              {"choice":"Yes","next_state":"Oxygen","rationale":"Improves hypoxia"},
              {"choice":"No","next_state":"Worsening","rationale":"SpO2 continues to drop"}
            ]
          }
        ]
      };

      if (isEmpty(data1)) exampleJson1 = JSON.stringify(demoCase, null, 2);
      else exampleJson1 = JSON.stringify(data1, null, 2);

      if (isEmpty(data2)) exampleJson2 = JSON.stringify(demoCase, null, 2);
      else exampleJson2 = JSON.stringify(data2, null, 2);

    } catch (err) {
      Logger.log('⚠️ Example-row build error: ' + err);
      exampleJson1 = JSON.stringify({
        "Case_Organization:Case_ID": "DEMO_FALLBACK",
        "Monitor_Vital_Signs:Initial_Vitals": {"HR":100,"BP":"110/70","RR":18,"Temp":36.8,"SpO2":98}
      }, null, 2);
      exampleJson2 = exampleJson1;
    }
    const systemPrompt = `
📘 **Sim Mastery AI Prompt for Google Sheet CSV Row Generation**

You are an expert simulation designer helping build **Sim Mastery** — an emotionally resonant, AI-facilitated, high-fidelity emergency-medicine simulation platform.  
This tool is used by clinicians to sharpen real-time decision-making and learn through immersive, branching, lifelike emergencies.

---

💡 **Objective**
Create a **one-row Google Sheet simulation case** that is:
• Unique to the given content  
• Clinically sound  
• Narratively immersive  
• Technically compatible with the Sim Mastery CSV  
• Valuable to the learner both intellectually and emotionally  

---

🧠 **Philosophy**
• Help the learner *feel* what it’s like to manage chaos  
• Give just enough guidance — do not spoon-feed  
• Reflect real-world uncertainty and triumph  
• Be emotionally anchored, educationally sound, and uplifting  

---

🩺 **Vitals Format (Compact JSON)**
\`{"HR":120, "BP":"95/60", "RR":28, "Temp":39.2, "SpO2":94}\`

---

🪄 **Tone & Style**
• Professional but warm  
• Support learner growth through tension and curiosity  
• Fun yet respectful of medicine’s seriousness  
• Use best practices of professional simulation facilitators  

---

🧪 **You Will Output**
• A single JSON object mapping directly to columns of the Google Sheet  
• Use the header1 and header2 context to align structure  
• If a cell value is missing, use "N/A" (especially for any Media_URL field)  
• Do **not** copy prior case content  
Generate a completely new simulation inspired by the HTML and DOC input  

---

✨ **Inputs Provided**
• header1 (Tier-1 categories)  
• header2 (Tier-2 column labels)  
• Example rows for structure only (Rows 3 and 4)  
• New HTML & DOC text as inspiration  

---

🔭 **Simulation Semantics & Branching (Read Carefully)**

1️⃣ **Row-level semantics**  
- Treat this row as ONE complete simulation case.  
- Each row is independent and self-contained (**rows = semantics**).  
- Columns define structure (**headers = schema**).  
- All content must form a single, coherent story for this row.  

2️⃣ **Branching model (state machine)**  
- Define ordered Progression_States and Decision_Nodes_JSON with clinician decisions and outcomes.  
- Each state updates the clinical picture and **vitals** (compact JSON).  
- Example: \`{"HR":110,"BP":"112/68","RR":24,"Temp":38.2,"SpO2":93}\`  

3️⃣ **Coherence & consequences**  
- Decisions must have meaningful effects.  
- Ensure logical paths and realistic values.  

4️⃣ **Data discipline**  
- Use exact merged keys \`Tier1:Tier2\`.  
- Use "N/A" only when truly not applicable.  
- Never invent URLs.  
- Prefer structured JSON for vitals/monitor/decision fields.  

5️⃣ **Inputs to respect**  
- Use only FORMAL INFO, HTML, DOC, and EXTRA NOTES.  
- Anchor physiology and logic to those inputs.  

6️⃣ **Quality guardrails**  
- Pre-diagnosis: exploratory, hypothesis-driven.  
- Post-diagnosis: clear, educational, learning-point focused.  
- Quiz/education columns must align with decision logic and outcomes.  

---

### 🧩 **Example Completed Cases**

Below are two example cases showing the complete structure and style of finished simulations.  
Each is unique and represents its own independent case.

**Example Case 1 (Row 3):**  
${exampleJson1}

**Example Case 2 (Row 4):**  
${exampleJson2}

---

### 🤖 **FUTURE USE CONTEXT (VERY IMPORTANT)**

The data you generate will be consumed by two systems working together:

1. **Sim Mastery Engine**  
   - The core platform that converts this CSV into an interactive, voice-responsive simulation.  
   - It interprets each field as part of a larger, branching clinical scenario.  
   - Clinicians will interact via mobile or desktop, speaking or selecting real-time decisions (e.g., "push epi", "order CT", "intubate").  
   - The system will narrate, animate, and respond dynamically based on your structured output.

2. **ResusVitals API**  
   - A specialized vitals engine that dynamically updates the patient’s physiological parameters during simulation.  
   - It reads from any field containing “Vitals” or “Monitor” and interprets your compact nested JSON (e.g., {"HR":120,"BP":"95/60","RR":28,"Temp":39.2,"SpO2":94}).  
   - Vitals change as states and decisions progress (State0 → State1 → State2, etc.).

Your role:  
• Treat this output as a **modular simulation blueprint**.  
• Each “row” is a self-contained scenario that future AI systems can reconstruct and run dynamically.  
• Each column is a structured data node used for narration, decision trees, vitals, scoring, and learning objectives.  
• Prioritize **machine-readability**, **coherence**, and **educational realism**.  

---
Return your response **strictly as valid JSON** following this structure.  
Do not include commentary, markdown, or text outside the JSON object.  
`.trim();

// --- Generate (force-JSON) & validate ---
const model = getProp(SP_KEYS.MODEL, DEFAULT_MODEL);
appendLogSafe('🤖 Calling OpenAI to generate scenario...');
const aiResp = batchMode
  ? callOpenAiJson(model, systemPrompt)
  : callOpenAI(systemPrompt, DEFAULT_TEMP_SINGLE);
appendLogSafe('✅ Received OpenAI response, processing...');

// --- Extract and sanitize JSON text ---
let aiText = '';

if (batchMode) {
  aiText = JSON.stringify(aiResp);
} else {
  // callOpenAI() returns raw text
  aiText = typeof aiResp === 'string'
    ? aiResp.trim()
    : aiResp?.choices?.[0]?.message?.content?.trim() || '';
}

// Remove markdown fences or stray text before/after JSON
aiText = aiText
  .replace(/^```(?:json)?/i, '')  // remove ```json or ```
  .replace(/```$/i, '')           // remove trailing ```
  .replace(/^[^{[]+/, '')         // remove anything before { or [
  .replace(/[^}\]]+$/, '');       // remove anything after } or ]

const parsed = tryParseJSON(aiText);
appendLogSafe('📝 Parsing AI response and extracting fields...');

// --- Debug helper: split long AI responses safely for logging ---
function logLong_(label, text) {
  const chunkSize = 9000; // avoid truncation in Apps Script logs
  for (let i = 0; i < text.length; i += chunkSize) {
    Logger.log(`${label} [${i / chunkSize + 1}]:\n` + text.slice(i, i + chunkSize));
  }
}

if (!parsed || typeof parsed !== 'object') {
  logLong(`❌ Row ${inputRow} — AI raw output`, typeof aiResp === 'string' ? aiResp : JSON.stringify(aiResp, null, 2));
  appendLogSafe(`❌ Row ${inputRow}: AI JSON parse fail. See full output above.`);
  return { error: true, message: `Row ${inputRow}: AI JSON parse fail.` };
}

appendLogSafe(`🤖 AI response parsed successfully for Row ${inputRow}`);

// --- Validate/normalize vitals across any key containing 'vitals' or 'monitor' ---
const vitalsCheck = validateVitalsFields_(parsed, mergedKeys);
if (!vitalsCheck.valid) {
  const warnText = vitalsCheck.warnings.join(' | ');
  Logger.log('⚠️ Vitals/Monitor validation: ' + warnText);
  appendLogSafe('⚠️ ' + warnText);
}

// Log parsed field count for transparency
Logger.log(`✅ Parsed ${Object.keys(parsed).length} keys for Row ${inputRow}`);

  // --- Apply clinical defaults for missing vitals ---
  applyClinicalDefaults_(parsed, mergedKeys);

  // --- Compact vitals if needed (object -> one-line JSON) ---
mergedKeys.forEach(k => {
  if (/vitals|monitor/i.test(k)) {
    if (parsed[k] && typeof parsed[k] === 'object') parsed[k] = JSON.stringify(parsed[k]);
    if (typeof parsed[k] === 'string') parsed[k] = parsed[k].trim();
  }
});
    // --- Inject Image Sync defaults if empty ---
    const imgDefaults = JSON.parse(getProp(SP_KEYS.IMG_SYNC_DEFAULTS, '{}') || '{}');
    Object.keys(parsed).forEach(k => {
      if (/^Image_Sync:/i.test(k)) {
        const v = parsed[k];
        if (v === undefined || v === null || v === '') {
          if (imgDefaults[k] !== undefined) parsed[k] = imgDefaults[k];
        }
      }
    });

// --- Build output row (intelligent tiered matching) ---
const rowValues = mergedKeys.map(k => {
  const val = extractValueFromParsed_(parsed, k);
  return (val !== undefined && val !== null && String(val).trim() !== '') ? val : 'N/A';
});

// --- Store signature in meta column (if Conversion_Status exists) ---
const metaIdx = header2.indexOf('Conversion_Status');
if (metaIdx > -1) {
  const k = `${header1[metaIdx]}:${header2[metaIdx]}`;
  const idx = mergedKeys.indexOf(k);
  if (idx > -1) {
    rowValues[idx] = (rowValues[idx] && rowValues[idx] !== 'N/A') ? `${rowValues[idx]} | ${sig}` : sig;
  }
}





// --- Append row ---
appendLogSafe(`📤 Writing results for Row ${inputRow} to "${outputSheet.getName()}"`);
appendLogSafe('💾 Writing scenario to Master Scenario Convert...');
outputSheet.appendRow(rowValues);
appendLogSafe('✅ Row created successfully');
appendLogSafe(`✅ Row ${inputRow} successfully written to sheet.`);
// --- Always log parsed keys to sidebar for transparency ---
try {
  const keys = Object.keys(parsed || {});
  const naCount = rowValues.filter(v => v === 'N/A').length;
  const naRatio = naCount / (rowValues.length || 1);
  const missingKeys = mergedKeys.filter(k => !keys.includes(k));
  const preview = JSON.stringify(parsed, null, 2).slice(0, 400); // short snippet

  let message = `📄 Row ${inputRow} summary:\n`;
  message += `Detected keys: ${keys.join(', ') || 'none'}\n`;
  message += missingKeys.length ? `Missing keys: ${missingKeys.join(', ')}\n` : '';
  message += `N/A ratio: ${(naRatio * 100).toFixed(0)}%\n`;
  message += `Preview:\n${preview}`;

  if (typeof appendLog === 'function') appendLog(message);
  Logger.log(message);
} catch (debugErr) {
  Logger.log('Debug logging failed: ' + debugErr);
}

// --- Skip quality scoring if row is empty or all N/A ---
if (!rowValues || rowValues.every(v => v === 'N/A')) {
  Logger.log(`⚠️ Skipping quality scoring for Row ${inputRow}: all N/A`);
  return { created: true, message: `Row ${inputRow}: Created (all N/A)` };
}

    // --- Quality scoring + suggestions ---
    try {
      const { header1, header2 } = getCachedHeadersOrRead(outputSheet);
      const mergedKeys = mergedKeysFromTwoTiers_(header1, header2);
      const newRowIndex = outputSheet.getLastRow();
      const quality = evaluateSimulationQuality(rowValues, mergedKeys);
      attachQualityToRow_(outputSheet, newRowIndex, mergedKeys, rowValues, quality);
    } catch (_) {
      // Non-fatal: quality write is best-effort
    }

    // --- Cost estimate ---
    const cost = estimateCostUSD(systemPrompt, aiText);
    return { created: true, message: `Row ${inputRow}: Created. (~$${cost.toFixed(2)})`, cost };

  } catch (e) {
    return { error: true, message: `Row ${inputRow}: Error — ${e.message}` };
  }
} // closes processOneInputRow_()




/**
 * Validate and normalize any "Vitals" or "Monitor" JSON fields.
 * Used after the AI JSON response is parsed.
 */
function validateVitalsFields_(parsedOutput, headers) {
  if (!parsedOutput || typeof parsedOutput !== 'object') return { valid: false, warnings: [] };

  const warnings = [];
  headers.forEach(h => {
    const headerName = h.toLowerCase();
    if (headerName.includes('vitals') || headerName.includes('monitor')) {
      const value = parsedOutput[h] || parsedOutput[headerName];
      if (value) {
        // If it's a string, try to parse it as JSON
        if (typeof value === 'string') {
          const parsed = tryParseJSON(value);
          if (parsed) parsedOutput[h] = parsed;
          else warnings.push(`⚠️ ${h} field not valid JSON.`);
        }
        // If it's not an object after parse, warn
        else if (typeof value !== 'object') {
          warnings.push(`⚠️ ${h} field expected JSON object, got ${typeof value}.`);
        }
      } else {
        warnings.push(`⚠️ Missing ${h} field.`);
      }
    }
  });

  return { valid: warnings.length === 0, warnings, data: parsedOutput };
}






// === CLINICAL DEFAULTS: Fill missing vitals with medically realistic values ===
/**
 * Applies clinical defaults to any missing Monitor_Vital_Signs fields.
 * Called during batch processing to ensure every scenario has complete vitals.
 *
 * Strategy:
 * - Baseline vitals: HR 75, BP 120/80, RR 16, Temp 37.0, SpO2 98, EtCO2 35
 * - Critical scenarios (detected by keywords): Elevated baseline
 * - State progression: Gradual improvement from State1 → State5
 * - Metadata: Standard monitoring setup
 */
function applyClinicalDefaults_(parsed, mergedKeys) {
  Logger.log('🩺 Applying clinical defaults for missing vitals...');

  // Baseline vitals (stable adult)
  const BASELINE = {
    HR: 75,
    BP: '120/80',
    RR: 16,
    Temp: 37.0,
    SpO2: 98,
    EtCO2: 35
  };

  // Critical scenario baseline (elevated)
  const CRITICAL_BASELINE = {
    HR: 110,
    BP: '90/60',
    RR: 24,
    Temp: 37.0,
    SpO2: 92,
    EtCO2: 32
  };

  // Check if this is a critical scenario
  const title = (parsed['Case_Organization:Spark_Title'] || '').toLowerCase();
  const category = (parsed['Case_Organization:Category'] || '').toLowerCase();
  const desc = (parsed['Case_Organization:Formal_Description'] || '').toLowerCase();
  const context = title + ' ' + category + ' ' + desc;

  const isCritical = /cardiac|arrest|shock|trauma|sepsis|stroke|critical|emergency|unstable/i.test(context);

  const baseVitals = isCritical ? CRITICAL_BASELINE : BASELINE;

  if (isCritical) {
    Logger.log('  📊 Critical scenario detected - using elevated baseline');
  }

  // Metadata fields (always fill if missing)
  const metadata = {
    'Monitor_Vital_Signs:Vitals_Format': 'Compact JSON (HR, BP, RR, Temp, SpO2, EtCO2)',
    'Monitor_Vital_Signs:Vitals_API_Target': 'resusmonitor.com/api/vitals',
    'Monitor_Vital_Signs:Vitals_Update_Frequency': '5 seconds',
    'Situation_and_Environment_Details:Initial_Monitoring_Status': 'Standard 5-lead ECG, pulse oximetry, NIBP'
  };

  Object.keys(metadata).forEach(function(key) {
    if (!parsed[key] || parsed[key] === 'N/A' || parsed[key] === '') {
      parsed[key] = metadata[key];
      Logger.log('  ✅ Set ' + key);
    }
  });

  // Vitals states with progression
  const vitalsStates = [
    { key: 'Monitor_Vital_Signs:Initial_Vitals', multiplier: 1.0, desc: 'Initial' },
    { key: 'Monitor_Vital_Signs:State1_Vitals', multiplier: 1.1, desc: 'State 1 (worsening)' },
    { key: 'Monitor_Vital_Signs:State2_Vitals', multiplier: 1.05, desc: 'State 2 (stabilizing)' },
    { key: 'Monitor_Vital_Signs:State3_Vitals', multiplier: 0.95, desc: 'State 3 (improving)' },
    { key: 'Monitor_Vital_Signs:State4_Vitals', multiplier: 0.9, desc: 'State 4 (responding)' },
    { key: 'Monitor_Vital_Signs:State5_Vitals', multiplier: 0.85, desc: 'State 5 (resolving)' }
  ];

  vitalsStates.forEach(function(state) {
    if (!parsed[state.key] || parsed[state.key] === 'N/A' || parsed[state.key] === '') {
      // Create vitals object with progression
      var vitals = {
        HR: Math.round(baseVitals.HR * state.multiplier),
        BP: baseVitals.BP,
        RR: baseVitals.RR,
        Temp: baseVitals.Temp,
        SpO2: baseVitals.SpO2,
        EtCO2: baseVitals.EtCO2
      };

      // Adjust other vitals based on HR change
      if (state.multiplier > 1.0) {
        // Worsening: Lower SpO2, higher RR
        vitals.SpO2 = Math.max(88, baseVitals.SpO2 - Math.round((state.multiplier - 1) * 100));
        vitals.RR = baseVitals.RR + Math.round((state.multiplier - 1) * 20);
      } else if (state.multiplier < 1.0) {
        // Improving: Return to baseline
        vitals.SpO2 = Math.min(98, baseVitals.SpO2 + Math.round((1 - state.multiplier) * 20));
        vitals.BP = BASELINE.BP; // Return to normal BP
      }

      // Final state returns to true baseline
      if (state.key.includes('State5')) {
        vitals = {
          HR: BASELINE.HR,
          BP: BASELINE.BP,
          RR: BASELINE.RR,
          Temp: BASELINE.Temp,
          SpO2: BASELINE.SpO2,
          EtCO2: BASELINE.EtCO2
        };
      }

      parsed[state.key] = JSON.stringify(vitals);
      Logger.log('  ✅ Generated ' + state.desc + ': ' + parsed[state.key]);
    }
  });

  Logger.log('✅ Clinical defaults complete');
  return parsed;
}



function tryParseJSON(text) {
  try { return JSON.parse(text); } catch(e) {
    const m = text && text.match(/\{[\s\S]*\}/);
    if (m) { try { return JSON.parse(m[0]); } catch(_) {} }
    return null;
  }
}

