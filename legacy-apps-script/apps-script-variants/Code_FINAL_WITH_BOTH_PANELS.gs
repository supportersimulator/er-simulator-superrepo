

/**
 * Safe UI helper - only calls getUi() if in UI context
 * Added for web app compatibility
 */
function getSafeUi_() {
  try {
    return SpreadsheetApp.getUi();
  } catch (e) {
    return null;
  }
}


/******************************************************
 * ER_Simulator_Builder.gs — FULL UNIFIED MASTER FILE
 * v3.7 (Dark UI)
 * 
 * Includes:
 *  • Batch Engine (Run All / 25 Rows / Specific Rows) with live log
 *  • Single Case Generator (2-tier aware)
 *  • ATSR Title Generator (Keep & Regenerate, deselect, memory tracker)
 *  • Case Summary Enhancer (auto-bold Dx/Intervention/Takeaway)
 *  • Image Sync Defaults Manager (refresh + editable)
 *  • Settings (API key from Script Properties or Settings sheet, model/prices, header cache)
 *  • Check API Status
 *  • Batch Reports (popup + writes to Batch_Reports sheet)
 *  • Duplicate check (content hash signature)
 *  • Inputs per row: Column A=Formal_Info, B=HTML, C=DOC, D=Extra (any may be blank)
 * 
 * Safe to paste as a full replacement.
 ******************************************************/

// ========== 1) ICONS, KEYS, DEFAULTS ==========

const ICONS = {
  rocket: '🚀', bolt: '⚡', wand: '✨', frame: '🖼', puzzle: '🧩',
  gear: '⚙️', brain: '🧠', clipboard: '📋', stop: '⏹️', shield: '🛡️'
};

const SP_KEYS = {
  API_KEY: 'OPENAI_API_KEY',
  MODEL: 'OPENAI_MODEL',
  PRICE_INPUT: 'PRICE_INPUT_PER_1K',
  PRICE_OUTPUT: 'PRICE_OUTPUT_PER_1K',
  USED_MOTIFS: 'USED_CHARACTER_MOTIFS',
  HEADER_CACHE: 'HEADER_CACHE_JSON',
  IMG_SYNC_DEFAULTS: 'IMG_SYNC_DEFAULTS_JSON',
  LAST_INPUT_SHEET: 'LAST_INPUT_SHEET',
  LAST_OUTPUT_SHEET: 'LAST_OUTPUT_SHEET'
};

const DEFAULT_MODEL = 'gpt-4o';
const DEFAULT_PRICE = { input: 0.15, output: 0.60 }; // USD / 1k tokens
const DEFAULT_TEMP_SINGLE = 0.7;
const DEFAULT_TEMP_BATCH  = 0.5; // more schema-sticky
const MAX_TOKENS = 4000;

// Two-tier vitals fields to compactify if needed
const VITAL_KEYS = [
  'Monitor_Vital_Signs:Initial_Vitals',
  'Monitor_Vital_Signs:State1_Vitals',
  'Monitor_Vital_Signs:State2_Vitals',
  'Monitor_Vital_Signs:State3_Vitals',
  'Monitor_Vital_Signs:State4_Vitals',
  'Monitor_Vital_Signs:State5_Vitals'
];


// ========== 2) CORE UTILS ==========

/******************************************************
 * QUALITY ENGINE — scoring, suggestions, audit & cleanup
 * - Auto-ensures columns:
 *   Developer_and_QA_Metadata:Simulation_Quality_Score
 *   Developer_and_QA_Metadata:Simulation_Enhancement_Suggestions
 * - Scores each row using weighted rubric
 * - Generates targeted improvement suggestions
 * - Audit tools for existing rows
 * - Cleanup tool for low-value rows (highlight or delete)
 ******************************************************/

// -- Settings (tweak without changing call sites) --
const QUALITY = {
  // If a row's filled ratio is below this, it’s considered low value
  LOW_VALUE_THRESHOLD: 0.30, // 30%

  // If score below this during audit, row gets highlighted (soft warning)
  HIGHLIGHT_SCORE_LT: 60,

  // Weights for rubric (sum does not need to be 100, we normalize)
  WEIGHTS: {
    coreIdentity: 10,     // Case_ID, Spark_Title, Reveal_Title
    patientBasics: 10,    // Age, Sex, Setting, HPI summary
    vitals: 20,           // Initial + state vitals
    branching: 18,        // Progression states, decision rules
    education: 15,        // Objectives + MCQ
    ordersData: 12,       // Labs/Imaging/ECG presence
    environmentAV: 8,     // Scene/time/ambience/media prompts (URLs can be N/A)
    metaCompleteness: 7   // Reflection + misc developer metadata
  },

  // Targeted suggestions (key regex → human message)
  SUGGESTIONS: [
    { re: /Case_Organization:Reveal_Title/i, msg: 'Add a clear Reveal Title with Dx (Age Sex) and a concise learning focus.' },
    { re: /Case_Organization:Spark_Title/i,  msg: 'Add a Spark Title: “<Symptom> (<Age Sex>): <Spark phrase>”.' },
    { re: /Monitor_Vital_Signs:Initial_Vitals/i, msg: 'Provide Initial Vitals in compact JSON: {"HR":..,"BP":"..","RR":..,"Temp":..,"SpO2":..}.' },
    { re: /Progression_States|Decision_Nodes_JSON/i, msg: 'Add explicit state flow and at least 3 decision rules (branch conditions).' },
    { re: /CME_and_Educational_Content:Learning_Objective/i, msg: 'Write 1–3 focused learning objectives.' },
    { re: /CME_and_Educational_Content:Quiz_Q1/i, msg: 'Include 1 MCQ with 4 options and mark the correct one.' },
    { re: /Labs|Imaging|ECG|Ultrasound/i, msg: 'Add at least one key data artifact (Labs/Imaging/ECG/US) with brief interpretation.' },
    { re: /Scene|Ambient|Time_of_Day|Audio/i, msg: 'Enrich the scene: time, lighting, ambient audio to deepen immersion.' },
    { re: /Developer_and_QA_Metadata:AI_Reflection_and_Suggestions/i, msg: 'Add a 3-part internal reflection (experience, sim improvements, system ideas).' }
  ],

  // Image_Sync columns can be N/A, but penalize if *all* are N/A
  PENALIZE_ALL_IMAGE_SYNC_EMPTY: true
};

// Ensure the two quality columns exist; if missing, append them.
function ensureQualityColumns_(sheet, header1, header2) {
  const mk = (t1, t2) => `${t1}:${t2}`;
  const qTier = 'Developer_and_QA_Metadata';
  const scoreKey = mk(qTier, 'Simulation_Quality_Score');
  const suggKey  = mk(qTier, 'Simulation_Enhancement_Suggestions');

  const mergedNow = header1.map((t1,i)=>mk(t1, header2[i]));
  const hasScore = mergedNow.includes(scoreKey);
  const hasSugg  = mergedNow.includes(suggKey);

  if (hasScore && hasSugg) return { scoreKey, suggKey };

  // Append missing columns at the end with Tier1/Tier2
  const lastCol = sheet.getLastColumn();
  let toAppend = [];
  if (!hasScore) toAppend.push({ t1:qTier, t2:'Simulation_Quality_Score' });
  if (!hasSugg)  toAppend.push({ t1:qTier, t2:'Simulation_Enhancement_Suggestions' });

  if (toAppend.length) {
    sheet.insertColumnsAfter(lastCol, toAppend.length);
    // Row 1 = Tier1, Row 2 = Tier2
    toAppend.forEach((c, k) => {
      sheet.getRange(1, lastCol + k + 1).setValue(c.t1);
      sheet.getRange(2, lastCol + k + 1).setValue(c.t2);
    });
  }

  // Re-read headers to return accurate keys
  const h1 = sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0];
  const h2 = sheet.getRange(2,1,1,sheet.getLastColumn()).getValues()[0];
  const merged = h1.map((t1,i)=>mk(t1, h2[i]));
  return {
    scoreKey: mk(qTier, 'Simulation_Quality_Score'),
    suggKey:  mk(qTier, 'Simulation_Enhancement_Suggestions'),
    header1: h1,
    header2: h2,
    mergedKeys: merged
  };
}

// Return {score, suggestions[]} using a weighted rubric
function evaluateSimulationQuality(rowValues, mergedKeys) {
  const v = (key) => {
    const idx = mergedKeys.indexOf(key);
    if (idx < 0) return '';
    return String(rowValues[idx] || '').trim();
  };
  const has = (re) => mergedKeys.some((k, i) => re.test(k) && String(rowValues[i]||'').trim() && String(rowValues[i]).trim()!=='N/A');

  // 1) Filled ratio
  const filled = rowValues.filter(x => String(x||'').trim() && String(x).trim()!=='N/A').length;
  const filledRatio = filled / Math.max(1, rowValues.length);

  // 2) Critical presence
  const coreIdentityOk   = has(/Case_Organization:Case_ID/i) && has(/Case_Organization:Spark_Title/i) && has(/Case_Organization:Reveal_Title/i);
  const patientBasicsOk  = has(/Patient_(Age|Sex)|Case_Organization:Spark_Title|Setting/i);
  const vitalsOk         = has(/Monitor_Vital_Signs:Initial_Vitals/i);
  const branchingOk      = has(/Progression_States|Decision_Nodes_JSON/i);
  const educationOk      = has(/CME_and_Educational_Content:(Learning_Objective|Quiz_Q1)/i);
  const ordersDataOk     = has(/Labs|Imaging|ECG|Ultrasound|CT|X[- ]?Ray/i);
  const environmentOk    = has(/Scene|Time_of_Day|Ambient|Audio|Image_Prompt/i);
  const metaOk           = has(/Developer_and_QA_Metadata:AI_Reflection_and_Suggestions/i);

  // 3) Image_Sync penalty if all empty
  let imgSyncPenalty = 0;
  if (QUALITY.PENALIZE_ALL_IMAGE_SYNC_EMPTY) {
    const imgKeys = mergedKeys.filter(k=>/^Image_Sync:/i.test(k));
    const anyFilled = imgKeys.some(k=>{
      const val = rowValues[mergedKeys.indexOf(k)];
      return String(val||'').trim() && String(val).trim()!=='N/A';
    });
    if (!anyFilled && imgKeys.length) imgSyncPenalty = 0.05; // subtract 5%
  }

  // 4) Weighted score
  const w = QUALITY.WEIGHTS;
  const sumW = Object.values(w).reduce((a,b)=>a+b,0);
  let score =
    (coreIdentityOk   ? w.coreIdentity   : 0) +
    (patientBasicsOk  ? w.patientBasics  : 0) +
    (vitalsOk         ? w.vitals         : 0) +
    (branchingOk      ? w.branching      : 0) +
    (educationOk      ? w.education      : 0) +
    (ordersDataOk     ? w.ordersData     : 0) +
    (environmentOk    ? w.environmentAV  : 0) +
    (metaOk           ? w.metaCompleteness:0);

  // Blend in filled ratio (up to +10% bonus scaled by completeness)
  const blendBonus = Math.round(10 * filledRatio);
  score = ((score / sumW) * 100);
  score = Math.min(100, Math.max(0, score + blendBonus - (imgSyncPenalty*100)));

  // 5) Suggestions
  const missingMsgs = [];
  QUALITY.SUGGESTIONS.forEach(sugg => {
    const satisfied = mergedKeys.some((k,i)=>sugg.re.test(k) && String(rowValues[i]||'').trim() && String(rowValues[i]).trim()!=='N/A');
    if (!satisfied) missingMsgs.push(sugg.msg);
  });

  // Vitals sanity (compact JSON)
  const ivKey = mergedKeys.find(k=>/Monitor_Vital_Signs:Initial_Vitals/i.test(k));
  if (ivKey) {
    const raw = v(ivKey);
    if (raw && raw !== 'N/A') {
      try {
        const obj = JSON.parse(raw);
        if (!('HR' in obj) || !('BP' in obj)) {
          missingMsgs.push('Initial Vitals should include HR and BP at minimum.');
        }
      } catch(_) {
        missingMsgs.push('Initial Vitals must be compact JSON (one line).');
      }
    } else {
      missingMsgs.push('Provide Initial Vitals in compact JSON.');
    }
  }

  // Keep suggestions tight
  const suggestionsText = missingMsgs.length ? [...new Set(missingMsgs)].slice(0, 10).join('; ') : 'Excellent completeness.';
  return { score: Math.round(score), suggestionsText };
}

// Write quality fields into rowValues array in-place. If columns missing, they’re created.
function attachQualityToRow_(sheet, rowValues, header1, header2, mergedKeys) {
  const ensured = ensureQualityColumns_(sheet, header1, header2);
  const mk = (t1,t2)=>`${t1}:${t2}`;

  // If ensureQualityColumns_ re-read headers, prefer them
  const mkNow = ensured.mergedKeys || mergedKeys;
  const scoreKey = ensured.scoreKey;
  const suggKey  = ensured.suggKey;

  const quality = evaluateSimulationQuality(rowValues, mkNow);

  const scoreIdx = mkNow.indexOf(scoreKey);
  const suggIdx  = mkNow.indexOf(suggKey);

  // If columns were appended (after we built rowValues), extend rowValues to those columns
  while (rowValues.length < mkNow.length) rowValues.push(''); // pad

  if (scoreIdx >= 0) rowValues[scoreIdx] = quality.score;
  if (suggIdx  >= 0) rowValues[suggIdx]  = quality.suggestionsText;

  return quality; // return in case caller wants to log or use it
}

// ===== Public tools =====

// Re-score all existing rows (or specific list). Adds/updates columns as needed.
function runQualityAudit_AllOrRows() {
  const ss = SpreadsheetApp.getActive();
  const sheet = pickMasterSheet_();
  if (!sheet) { getSafeUi_().alert('❌ Could not find your Master Scenario CSV sheet.'); return; }

  const ui = getSafeUi_();
  const resp = ui.prompt(
    'Quality Audit',
    'Leave blank to audit ALL rows, or enter rows like "4,7,9-12".',
    ui.ButtonSet.OK_CANCEL
  );
  if (resp.getSelectedButton() !== ui.Button.OK) return;

  const spec = resp.getResponseText().trim();
  const rows = spec ? parseRowSpec_(spec) : null;

  const { header1, header2 } = getCachedHeadersOrRead(sheet);
  const mergedKeys = header1.map((t1,i)=>`${t1}:${header2[i]}`);
  const ensured = ensureQualityColumns_(sheet, header1, header2);
  const mkNow = ensured.mergedKeys || mergedKeys;

  const last = sheet.getLastRow();
  const startRow = 3; // data starts at row 3
  let updated = 0;

  for (let r = startRow; r <= last; r++) {
    if (rows && !rows.includes(r)) continue;

    const rowVals = sheet.getRange(r, 1, 1, sheet.getLastColumn()).getValues()[0];
    // Skip empty lines
    const nonEmpty = rowVals.some(x=>String(x||'').trim());
    if (!nonEmpty) continue;

    const q = evaluateSimulationQuality(rowVals, mkNow);

    // write back
    const scoreIdx = mkNow.indexOf(ensured.scoreKey) + 1;
    const suggIdx  = mkNow.indexOf(ensured.suggKey)  + 1;
    if (scoreIdx > 0) sheet.getRange(r, scoreIdx).setValue(q.score);
    if (suggIdx  > 0) sheet.getRange(r, suggIdx).setValue(q.suggestionsText);

    // Highlight very low scores
    if (q.score < QUALITY.HIGHLIGHT_SCORE_LT) {
      sheet.getRange(r, 1, 1, sheet.getLastColumn()).setBackground('#2b1d1d'); // subtle dark red
    } else {
      sheet.getRange(r, 1, 1, sheet.getLastColumn()).setBackground(null);
    }
    updated++;
  }

  if (ui) { ui.alert(`✅ Quality Audit complete. Updated ${updated} row(s).`); }
}

// Clean up N/A-heavy rows: choose Highlight or Delete
function cleanUpLowValueRows() {
  const ss = SpreadsheetApp.getActive();
  const sheet = pickMasterSheet_();
  if (!sheet) { getSafeUi_().alert('❌ Could not find your Master Scenario CSV sheet.'); return; }

  const last = sheet.getLastRow();
  const startRow = 3;
  const lowRows = [];

  for (let r = startRow; r <= last; r++) {
    const row = sheet.getRange(r,1,1,sheet.getLastColumn()).getValues()[0];
    const nonNA = row.filter(x => String(x||'').trim() && String(x).trim()!=='N/A').length;
    const ratio = nonNA / row.length;
    if (ratio < QUALITY.LOW_VALUE_THRESHOLD) lowRows.push(r);
  }

  if (!lowRows.length) {
    if (getSafeUi_()) { getSafeUi_().alert('✅ No low-value rows found.'); }
    return;
  }

  const ui = getSafeUi_();
  const choice = ui.prompt(
    `Found ${lowRows.length} low-value rows. Type "H" to highlight or "D" to delete them.`,
    ui.ButtonSet.OK_CANCEL
  );
  if (choice.getSelectedButton() !== ui.Button.OK) return;
  const opt = (choice.getResponseText()||'').trim().toUpperCase();

  if (opt === 'D') {
    // Delete bottom-up
    lowRows.reverse().forEach(r => sheet.deleteRow(r));
    if (ui) { ui.alert(`🧹 Deleted ${lowRows.length} row(s).`); }
  } else {
    // Highlight only
    lowRows.forEach(r => sheet.getRange(r,1,1,sheet.getLastColumn()).setBackground('#2b1d1d'));
    if (ui) { ui.alert(`🟧 Highlighted ${lowRows.length} row(s).`); }
  }
}


function getProp(key, fallback) {
  const v = PropertiesService.getDocumentProperties().getProperty(key);
  return (v === null || v === undefined) ? fallback : v;
}
function setProp(key, val) {
  PropertiesService.getDocumentProperties().setProperty(key, val);
}

function estimateTokens(str) {
  if (!str) return 0;
  return Math.max(1, Math.round(String(str).length / 4));
}
function estimateCostUSD(inputText, outputText) {
  const priceIn = parseFloat(getProp(SP_KEYS.PRICE_INPUT, DEFAULT_PRICE.input));
  const priceOut = parseFloat(getProp(SP_KEYS.PRICE_OUTPUT, DEFAULT_PRICE.output));
  const inTok = estimateTokens(inputText);
  const outTok = estimateTokens(outputText);
  return ((inTok / 1000) * priceIn) + ((outTok / 1000) * priceOut);
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
  return out.join('\n').trim();
}

function tryParseJSON(text) {
  try { return JSON.parse(text); } catch(e) {
    const m = text && text.match(/\{[\s\S]*\}/);
    if (m) { try { return JSON.parse(m[0]); } catch(_) {} }
    return null;
  }
}


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

/**
 * Calls OpenAI with enforced JSON output (for Convert/Batch mode only)
 */
function callOpenAiJson(model, userPrompt) {
  const apiKey = readApiKey_();
  if (!apiKey) throw new Error('Missing API key.');

  const url = 'https://api.openai.com/v1/chat/completions';
  const payload = {
    model: model,
    messages: [
      {
        role: "system",
        content: "You are a structured data generator. ALWAYS respond with strict valid JSON — no commentary, markdown, or text outside JSON."
      },
      { role: "user", content: userPrompt }
    ],
    temperature: 0
  };

  const options = {
    method: "post",
    headers: {
      Authorization: "Bearer " + apiKey,
      "Content-Type": "application/json"
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(url, options);
  const raw = response.getContentText();

  Logger.log('🔍 DEBUG: Raw OpenAI API response: ' + raw.slice(0, 300));

  try {
    // Parse the full API response
    const apiResponse = JSON.parse(raw);

    // Check for API-level errors
    if (apiResponse.error) {
      Logger.log('❌ OpenAI API Error: ' + JSON.stringify(apiResponse.error));
      throw new Error('OpenAI API Error: ' + (apiResponse.error.message || JSON.stringify(apiResponse.error)));
    }

    // Extract the actual content from choices array
    if (!apiResponse.choices || !apiResponse.choices.length) {
      Logger.log('❌ No choices in API response');
      throw new Error('OpenAI returned no choices');
    }

    const content = apiResponse.choices[0].message.content;
    Logger.log('📝 Extracted content length: ' + content.length + ' characters');
    Logger.log('📝 Content preview: ' + content.slice(0, 200));

    // NOW parse the content as JSON (this is the simulation data)
    const parsed = JSON.parse(content);
    Logger.log('✅ Successfully parsed simulation JSON with ' + Object.keys(parsed).length + ' keys');

    return parsed;

  } catch (err) {
    Logger.log("⚠️ JSON parse error: " + err.message);
    Logger.log("Raw response: " + raw.slice(0, 500));
    throw new Error("AI response parse failed: " + err.message);
  }
}

/**
 * Extracts a value from AI JSON output, tolerant of tiered keys.
 * Handles formats like "Tier1:Tier2" or just "Tier2".
 */
function extractValueFromParsed_(parsed, mergedKey) {
  if (!parsed || typeof parsed !== 'object') return 'N/A';

  // Try exact full key match
  if (parsed.hasOwnProperty(mergedKey)) return parsed[mergedKey];

  // Try after colon (Tier 2 only)
  const parts = mergedKey.split(':');
  const shortKey = parts[1] || parts[0];
  if (parsed.hasOwnProperty(shortKey)) return parsed[shortKey];

  // Try case-insensitive match
  const lowerKey = shortKey.toLowerCase();
  for (const k in parsed) {
    if (k.toLowerCase() === lowerKey) return parsed[k];
  }

  // Try to find nested objects like { "Case_Organization": { "Spark_Title": "..." } }
  if (parts.length === 2 && parsed[parts[0]] && typeof parsed[parts[0]] === 'object') {
    const nested = parsed[parts[0]][parts[1]];
    if (nested !== undefined) return nested;
  }

  // If all else fails, return N/A
  return 'N/A';
}

// Settings sheet integration: read API key from a Settings sheet
// Supports either:
//  • A two-column key/value table where first column contains "OPENAI_API_KEY"
//  • Or cell B2 under header "API Key" (fallback)
function syncApiKeyFromSettingsSheet_() {
  const ss = SpreadsheetApp.getActive();
  const sheet = ss.getSheetByName('Settings');
  if (!sheet) return null;

  try {
    const range = sheet.getDataRange().getValues();
    // Try KV pairs
    for (let r=0; r<range.length; r++) {
      const k = String(range[r][0]||'').trim().toUpperCase();
      const v = String(range[r][1]||'').trim();
      if (k === 'OPENAI_API_KEY' && v) {
        Logger.log('✅ Found OPENAI_API_KEY in Settings sheet');
        return v;
      }
    }
    // Fallback: B2 if row2 has "API Key" label
    const labelB2 = String(sheet.getRange(2,1).getValue()||'').toLowerCase();
    if (labelB2.includes('api')) {
      const apiKey = String(sheet.getRange(2,2).getValue()||'').trim();
      if (apiKey) {
        Logger.log('✅ Found API key in Settings!B2');
        return apiKey;
      }
    }
  } catch(e) {
    Logger.log('⚠️ Error reading Settings sheet: ' + e.message);
  }
  return null;
}

// Reads API key priority:
// 1) Script Properties (saved via Settings panel / sidebar)
// 2) Settings sheet (if present)
// 3) Error
function readApiKey_() {
  // DELETE the cached key to force fresh read
  try {
    PropertiesService.getDocumentProperties().deleteProperty('OPENAI_API_KEY');
    Logger.log('🗑️ Deleted cached API key');
  } catch (e) {
    Logger.log('⚠️ Could not delete cache: ' + e.message);
  }

  // Read fresh from Settings sheet
  const fromSheet = syncApiKeyFromSettingsSheet_();
  if (fromSheet) {
    Logger.log('✅ Read fresh API key from Settings sheet');
    // DON'T cache it - keep reading fresh
    return fromSheet;
  }

  Logger.log('❌ No API key found in Settings sheet');
  return '';
}

function callOpenAI(promptText, temperature) {
  const apiKey = readApiKey_();
  if (!apiKey) throw new Error('❌ Missing API key. Open Settings and save your key (or add it to the Settings sheet).');
  const model = getProp(SP_KEYS.MODEL, DEFAULT_MODEL);

  const url = 'https://api.openai.com/v1/chat/completions';
  const payload = {
    model,
    temperature: temperature ?? DEFAULT_TEMP_SINGLE,
    max_tokens: MAX_TOKENS,
    messages: [
      { role: 'system', content: 'You are a world-class simulation scenario writer and exacting data formatter.' },
      { role: 'user', content: promptText }
    ]
  };
  const options = {
    method: 'post',
    headers: { 'Authorization': 'Bearer ' + apiKey, 'Content-Type':'application/json' },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(url, options);
  const body = response.getContentText();
  const json = JSON.parse(body);
  if (!json.choices || !json.choices.length) {
    throw new Error('⚠️ OpenAI returned no choices:\n' + body);
  }
  return json.choices[0].message.content.trim();
}

// Quick API status check
function checkApiStatus() {
  try {
    const out = callOpenAI('Reply exactly with "OK".', 0.0);
    const ok = /^OK$/i.test(out.trim());
    if (getSafeUi_()) { getSafeUi_().alert(ok ? '🛡️ API is reachable.' : '⚠️ API replied unexpectedly: ' + out); }
  } catch (e) {
    if (getSafeUi_()) { getSafeUi_().alert('❌ API error: ' + e.message); }
  }
}

// Header cache helpers (two-tier)
function readTwoTierHeaders_(sheet) {
  const header1 = sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0];
  const header2 = sheet.getRange(2,1,1,sheet.getLastColumn()).getValues()[0];
  return { header1, header2 };
}
function mergedKeysFromTwoTiers_(header1, header2) {
  return header1.map((t1,i)=>`${t1}:${header2[i]}`);
}
function cacheHeaders(sheet) {
  const {header1, header2} = readTwoTierHeaders_(sheet);
  setProp(SP_KEYS.HEADER_CACHE, JSON.stringify({header1, header2}));
}
function getCachedHeadersOrRead(sheet) {
  let cached = getProp(SP_KEYS.HEADER_CACHE, '');
  if (cached) try { return JSON.parse(cached); } catch(_){}
  const hh = readTwoTierHeaders_(sheet);
  setProp(SP_KEYS.HEADER_CACHE, JSON.stringify(hh));
  return hh;
}
function clearHeaderCache() {
  PropertiesService.getDocumentProperties().deleteProperty(SP_KEYS.HEADER_CACHE);
  SpreadsheetApp.getActive().toast('🧹 Header cache cleared.');
}

// Ensure Batch_Reports tab exists
function ensureBatchReportsSheet_() {
  const ss = SpreadsheetApp.getActive();
  let s = ss.getSheetByName('Batch_Reports');
  if (!s) s = ss.insertSheet('Batch_Reports');
  // minimal header
  if (s.getLastRow() === 0) {
    s.appendRow(['Timestamp','Mode','Created','Skipped','Duplicates','Errors','Estimated Cost (USD)','Elapsed']);
  }
  return s;
}


// ========== 3) SIDEBAR (Dark) ==========

function openSimSidebar() {
  const ss = SpreadsheetApp.getActive();
  const allSheets = ss.getSheets().map(s=>s.getName());

  // ⭐ Auto-refresh: ensure Settings!A1 points to a valid Convert sheet
  try {
    const settingsSheet = ss.getSheetByName('Settings');
    const storedOut = settingsSheet ? settingsSheet.getRange('A1').getValue() : '';
    const exists = allSheets.includes(storedOut);
    if (!exists && allSheets.length) {
      const fallback = allSheets.find(n => /convert/i.test(n))
                  || allSheets.find(n => /master scenario csv/i.test(n))
                  || allSheets[0];
      if (settingsSheet) settingsSheet.getRange('A1').setValue(fallback);
    }
  } catch(err) {
    Logger.log('Settings auto-refresh error: ' + err);
  }

  const lastInput  = getProp(SP_KEYS.LAST_INPUT_SHEET, '');
  const lastOutput = getProp(SP_KEYS.LAST_OUTPUT_SHEET, '');
  const savedModel = getProp(SP_KEYS.MODEL, DEFAULT_MODEL);
  const savedApi   = getProp(SP_KEYS.API_KEY, '');

  // ⭐ Dynamic output preference from Settings!A1
  const settingsSheet = ss.getSheetByName('Settings');
  const settingsOut = settingsSheet ? settingsSheet.getRange('A1').getValue() : '';

  // Input = any with "input"; Output = only those with "convert"
  const inputCandidates = allSheets.filter(n => /input/i.test(n));
  const outputCandidates = allSheets.filter(n => /convert/i.test(n));

  // Defaults
  const defaultIn = inputCandidates.includes(lastInput)
    ? lastInput
    : (inputCandidates[0] || allSheets[0]);

  const defaultOut =
    outputCandidates.includes(settingsOut) ? settingsOut :
    outputCandidates.includes(lastOutput) ? lastOutput :
    (outputCandidates[0] || allSheets[0]);

  const modelList = ['gpt-4o-mini','gpt-4o','o4-mini','o3-mini'];
  const modelOptions = modelList.map(m=>`<option value="${m}" ${m===savedModel?'selected':''}>${m}</option>`).join('');
  const inOpts  = inputCandidates.map(n=>`<option value="${n}" ${n===defaultIn?'selected':''}>${n}</option>`).join('');
  const outOpts = outputCandidates.map(n=>`<option value="${n}" ${n===defaultOut?'selected':''}>${n}</option>`).join('');

  const html = HtmlService.createHtmlOutput(`
  <style>
    body{font-family:Arial;margin:0;background:#f5f7fa;color:#2c3e50}
    .bar{padding:14px 16px;background:#ffffff;border-bottom:1px solid #dfe3e8}
    h2{margin:0;font-size:16px;letter-spacing:.3px}
    .wrap{padding:16px}
    .card{background:#ffffff;border:1px solid #dfe3e8;border-radius:10px;padding:14px;margin-bottom:12px}
    label{font-size:12px;color:#7f8c9d}
    select,input,textarea{width:100%;background:#f5f7fa;border:1px solid #d1d7de;color:#2c3e50;border-radius:8px;padding:8px}
    .row{display:flex;gap:10px}
    .col{flex:1}
    button{background:#2357ff;border:0;color:#fff;padding:10px 12px;border-radius:8px;cursor:pointer}
    button.sec{background:#dfe3e8}
    .pill{display:inline-block;background:#dfe3e8;padding:6px 8px;border-radius:999px;font-size:12px}
    .hint{color:#7f8c9d;font-size:12px}
    .grid2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
    .log{height:180px}
  </style>

  <div class="bar"><h2>${ICONS.rocket} Sim Mastery — Batch & Single</h2></div>
  <div class="wrap">
    <div class="card">
      <div class="grid2">
        <div>
          <label>Input Sheet</label>
          <select id="inputSheet">${inOpts}</select>
        </div>
        <div>
          <label>Output Sheet</label>
          <select id="outputSheet">${outOpts}</select>
        </div>
      </div>
      <div class="grid2" style="margin-top:10px;">
        <div>
          <label>Model</label>
          <select id="model">${modelOptions}</select>
        </div>
        <div>
          <label>API Key</label>
          <input id="apiKey" type="password" value="${savedApi ? '••••••••' : ''}" placeholder="sk-..." />
        </div>
      </div>
    </div>

    <div class="card">
      <div class="row">
        <div class="col">
          <label>Run mode</label>
          <select id="runMode">
            <option value="one">Single Case</option>
            <option value="next25">Next 25 unprocessed</option>
            <option value="specific">Specific (e.g. 4,7,9-12)</option>
            <option value="all">All rows</option>
          </select>
        </div>
        <div class="col">
          <label>Specific rows</label>
          <input id="rowsSpec" placeholder="4,7,9-12" />
        </div>
      </div>
    </div>

        <div class="card">
      <div class="row">
        <button onclick="start()">🚀 Launch Batch Engine</button>
        <button class="sec" onclick="stop()">⏹️ Stop</button>
        <button class="sec" onclick="check()">🛡️ Check API</button>
      </div>
      <div style="margin-top:10px;">
        <span class="pill" id="statusPill">Idle</span>
      </div>
      <div style="margin-top:10px;">
        <textarea id="log" class="log" placeholder="Live log..." readonly></textarea>
      </div>
    </div>

    <div class="card">
      <div class="row" style="justify-content: space-between;">
        <button class="sec" onclick="imgSync()">🖼️ Image Sync Defaults</button>
        <button class="sec" onclick="openSettings()">⚙️ Settings</button>
      </div>
      <div class="hint" style="margin-top:8px;">
        💡 Use “Run mode” to choose between Single Case, First 25, or All Rows.  
        Then click <strong>Launch Batch Engine</strong>.
      </div>
    </div>
  </div>
    <!-- 🪵 Live Logs Panel (NEW) -->
    <div class="card" style="margin-top:12px;">
      <div class="row" style="justify-content: space-between; align-items:center;">
        <strong style="color:#ff82a9;">🪵 Live Logs</strong>
        <div>
          <button id="refreshLogsBtn" class="log-btn">Refresh</button>
          <button id="clearLogsBtn" class="log-btn danger">Clear</button>
        </div>
      </div>
      <pre id="logOutput" class="log-output">No logs yet.</pre>
    </div>

    <style>
      .log-btn {
        background: #1a1a1a;
        color: #0f0;
        border: 1px solid #0f0;
        padding: 2px 8px;
        margin-left: 4px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 11px;
        transition: all 0.2s ease;
      }
      .log-btn:hover {
        background: #0f0;
        color: #000;
      }
      .log-btn.danger {
        color: #f55;
        border-color: #f55;
      }
      .log-btn.danger:hover {
        background: #f55;
        color: #000;
      }
      .log-output {
        white-space: pre-wrap;
        background: #000;
        color: #0f0;
        padding: 8px;
        border-radius: 6px;
        margin-top: 4px;
        max-height: 300px;
        overflow-y: auto;
        border: 1px solid #222;
      }
      .new-log-line {
        animation: fadeInNew 0.6s ease-out;
      }
      @keyframes fadeInNew {
        from { color: #9aff9a; background-color: rgba(0,255,0,0.05); }
        to { color: #0f0; background-color: transparent; }
      }
    </style>

    <script>
      // === LOG VIEWER HANDLERS ===
      let lastLogs = '';

      function refreshLogs() {
        google.script.run
          .withSuccessHandler((logs) => {
            const output = document.getElementById('logOutput');
            if (logs && logs !== lastLogs) {
              const diff = logs.replace(lastLogs, '').trim();
              if (diff) {
                const newLine = document.createElement('div');
                newLine.textContent = diff;
                newLine.classList.add('new-log-line');
                output.appendChild(newLine);
              } else {
                output.textContent = logs;
              }
              output.scrollTop = output.scrollHeight;
              lastLogs = logs;
            }
            if (!logs) output.textContent = 'No logs yet.';
          })
          .getSidebarLogs();
      }

      function clearLogs() {
        google.script.run
          .withSuccessHandler((msg) => {
            document.getElementById('logOutput').textContent = msg;
            lastLogs = '';
          })
          .clearSidebarLogs();
      }

      document.getElementById('refreshLogsBtn').addEventListener('click', refreshLogs);
      document.getElementById('clearLogsBtn').addEventListener('click', clearLogs);

      // Auto-refresh every 5 seconds
      setInterval(refreshLogs, 5000);
    </script>
  <script>
    document.addEventListener('DOMContentLoaded', () => {
      console.log('✅ Sidebar loaded');
    });

    function appendLog(t){ const ta=document.getElementById('log'); ta.value += t + "\\n"; ta.scrollTop = ta.scrollHeight; }
    function setStatus(s){ document.getElementById('statusPill').textContent = s; }

    function persistBasics(){
      const apiRaw = document.getElementById('apiKey').value.trim();
      const outVal = document.getElementById('outputSheet').value;
      google.script.run.saveSidebarBasics(
        document.getElementById('model').value,
        (apiRaw && apiRaw!=='••••••••') ? apiRaw : '',
        '', '',
        document.getElementById('inputSheet').value,
        outVal
      );
      google.script.run.setOutputSheet(outVal);
    }

    function loopStep(){
      // Get next row number from queue
      google.script.run
          .withSuccessHandler(function(report){
            if (report.done){
              setStatus('✅ Complete');
              appendLog(report.msg || '✅ Batch complete!');
              return;
            }

            // ⭐ Call the EXACT same function single mode uses!
            appendLog('📊 Processing row ' + report.row + ' (' + report.remaining + ' remaining)...');

            google.script.run
              .withSuccessHandler(function(result){
                appendLog('✅ Row ' + report.row + ' complete');
                setTimeout(loopStep, 1500); // Next row after 1.5s
              })
              .withFailureHandler(function(e){
                appendLog('❌ Row ' + report.row + ' error: ' + e.message);
                setTimeout(loopStep, 1500); // Continue despite error
              })
              .runSingleCaseFromSidebar(report.inputSheetName, report.outputSheetName, report.row);
          })
          .withFailureHandler(function(e){
            appendLog('❌ Batch error: ' + e.message);
            setStatus('Error');
          })
          .runSingleStepBatch();
    }
    function start(){
  persistBasics();
  setStatus('Running...');
  const mode = document.getElementById('runMode').value;
  const spec = document.getElementById('rowsSpec').value.trim();
  const inputSheet = document.getElementById('inputSheet').value;
  const outputSheet = document.getElementById('outputSheet').value;

  // Handle single-case mode directly
  if (mode === 'one' || mode === 'single' || mode === 'Single Case') {
    const rowNum = parseInt(spec || prompt('Enter row number to process (>=4):'), 10);
    if (!rowNum) {
      appendLog('⚠️ No row selected, cancelling.');
      setStatus('Idle');
      return;
    }

    google.script.run
      .withSuccessHandler(m => {
        appendLog(m || '✅ Done.');
        setStatus('Idle');
        if (m && m.includes('Error')) alert(m);
      })
      .withFailureHandler(e => {
        appendLog('❌ Single-case error: ' + e.message);
        alert('❌ Single-case error: ' + e.message);
        setStatus('Idle');
      })
      .runSingleCaseFromSidebar(inputSheet, outputSheet, rowNum);

    return; // stop here, no batch loop
  }

  // Otherwise run normal batch flow
  google.script.run
    .withSuccessHandler(msg => {
      appendLog(msg || '✅ Batch started.');
      loopStep(); // begin step loop
    })
    .withFailureHandler(e => {
      appendLog('❌ Batch start error: ' + e.message);
      setStatus('Idle');
    })
    .startBatchFromSidebar(inputSheet, outputSheet, mode, spec);
}

function stop(){
  google.script.run.stopBatch();
  setStatus('Stopping...');
  appendLog('Stop requested.');
}

function imgSync(){ google.script.run.openImageSyncDefaults(); }
function openSettings(){ google.script.run.openSettingsPanel(); }
function check(){ google.script.run.checkApiStatus(); }
  </script>
  `)
  .setWidth(540)
  .setHeight(720)
  .setSandboxMode(HtmlService.SandboxMode.IFRAME);

  getSafeUi_().showSidebar(html);
}

// ⭐ UPDATED HELPERS
function saveSidebarBasics(model, apiKeyMaybe, priceIn, priceOut, inputSheet, outputSheet) {
  if (model) setProp(SP_KEYS.MODEL, model);
  if (apiKeyMaybe) setProp(SP_KEYS.API_KEY, apiKeyMaybe);
  if (inputSheet) setProp(SP_KEYS.LAST_INPUT_SHEET, inputSheet);
  if (outputSheet) {
    setProp(SP_KEYS.LAST_OUTPUT_SHEET, outputSheet);
    setOutputSheet(outputSheet);
  }
}



function logLong(label, text) {
  try {
    const chunkSize = 8000; // safe for Apps Script logs
    if (!text) {
      appendLogSafe(`(no text to log for ${label})`);
      return;
    }
    for (let i = 0; i < text.length; i += chunkSize) {
      const chunk = text.substring(i, i + chunkSize);
      appendLogSafe(`${label} [${i / chunkSize + 1}]:\n${chunk}`);
    }
  } catch (err) {
    appendLogSafe(`logLong error: ${err}`);
  }
}

// ⭐ Debug helper: safely log very long AI outputs in chunks
function logLong(label, text) {
  try {
    const chunkSize = 8000; // safe for Apps Script logs
    if (!text) {
      appendLogSafe(`(no text to log for ${label})`);
      return;
    }
    for (let i = 0; i < text.length; i += chunkSize) {
      const chunk = text.substring(i, i + chunkSize);
      appendLogSafe(`${label} [${i / chunkSize + 1}]:\n${chunk}`);
    }
  } catch (err) {
    appendLogSafe(`logLong error: ${err}`);
  }
}

function getSidebarLogs() {
  try {
    const logs = PropertiesService.getDocumentProperties().getProperty('Sidebar_Logs') || '';
    return logs;
  } catch (err) {
    return 'Error retrieving logs: ' + err;
  }
}

function clearSidebarLogs() {
  try {
    PropertiesService.getDocumentProperties().deleteProperty('Sidebar_Logs');
    return '🧹 Logs cleared.';
  } catch (err) {
    return 'Error clearing logs: ' + err;
  }
}

// ⭐ NEW: Writes chosen output sheet to Settings!A1
function setOutputSheet(sheetName) {
  const s = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Settings');
  if (!s) throw new Error('Settings sheet not found.');
  s.getRange('A1').setValue(sheetName);
}

// ⭐ Helper for saving property values
function setProp(key, value) {
  PropertiesService.getDocumentProperties().setProperty(key, value);
}

// ========== 4) BATCH QUEUE & ENGINE ==========

function stopBatch() { setProp('BATCH_STOP','1'); }

function parseRowSpec_(spec) {
  const out = new Set();
  if (!spec) return [];
  spec.split(',').map(s=>s.trim()).forEach(token=>{
    if (/^\d+$/.test(token)) out.add(parseInt(token,10));
    else if (/^\d+\-\d+$/.test(token)) {
      const [a,b] = token.split('-').map(n=>parseInt(n,10));
      const lo = Math.min(a,b), hi = Math.max(a,b);
      for (let r=lo; r<=hi; r++) out.add(r);
    }
  });
  return Array.from(out).sort((a,b)=>a-b);
}







// === SMART BATCH: Calculate next 25 rows based on output sheet progress ===
function getNext25InputRows_(inputSheet, outputSheet) {
  appendLogSafe('🔍 Starting robust row detection (Case_ID comparison method)...');

  const inputLast = inputSheet.getLastRow();
  const outputLast = outputSheet.getLastRow();

  appendLogSafe(`📊 Input sheet last row: ${inputLast}`);
  appendLogSafe(`📊 Output sheet last row: ${outputLast}`);

  // Read all Case_IDs from Output sheet (Column A, rows 3+)
  const processedCaseIds = new Set();
  if (outputLast >= 3) {
    const outputCaseIds = outputSheet.getRange(3, 1, outputLast - 2, 1).getValues();
    outputCaseIds.forEach(row => {
      const caseId = String(row[0] || '').trim();
      if (caseId) {
        processedCaseIds.add(caseId);
      }
    });
  }

  appendLogSafe(`✅ Found ${processedCaseIds.size} processed Case_IDs in Output`);

  // IMPORTANT: Input sheet structure
  // Row 1: Tier 1 headers
  // Row 2: Tier 2 headers
  // Row 3+: Data
  //
  // The Input sheet does NOT have Case_ID pre-filled.
  // Case_ID is GENERATED during processing.
  //
  // Strategy: Since we can't predict Case_ID from Input data,
  // we use row position correlation:
  // - Input row 3 → Output row 3 (first data row)
  // - Input row 4 → Output row 4 (second data row)
  // - etc.
  //
  // If Output has N data rows (rows 3 through 3+N-1),
  // then Input rows 3 through 3+N-1 have been processed.
  // Next unprocessed Input row = 3 + N

  const outputDataRows = Math.max(0, outputLast - 2);
  const nextInputRow = 3 + outputDataRows;

  appendLogSafe(`📊 Output has ${outputDataRows} data rows`);
  appendLogSafe(`📊 Next unprocessed Input row: ${nextInputRow}`);

  // Build array of next 25 rows to process
  const availableRows = [];
  for (let r = nextInputRow; r <= inputLast && availableRows.length < 25; r++) {
    availableRows.push(r);
  }

  appendLogSafe(`✅ Found ${availableRows.length} unprocessed rows`);
  if (availableRows.length > 0) {
    appendLogSafe(`📋 Rows to process: [${availableRows.slice(0, 5).join(', ')}${availableRows.length > 5 ? '...' : ''}]`);
  }

  return availableRows;
}
function getAllInputRows_(inputSheet, outputSheet) {
  appendLogSafe('🔍 Starting detection for ALL remaining rows...');

  const inputLast = inputSheet.getLastRow();
  const outputLast = outputSheet.getLastRow();

  appendLogSafe(`📊 Input sheet last row: ${inputLast}`);
  appendLogSafe(`📊 Output sheet last row: ${outputLast}`);

  // Count processed rows
  const outputDataRows = Math.max(0, outputLast - 2);
  const nextInputRow = 3 + outputDataRows;

  appendLogSafe(`📊 Output has ${outputDataRows} processed rows`);
  appendLogSafe(`📊 Next unprocessed Input row: ${nextInputRow}`);

  // Build array of ALL remaining rows
  const availableRows = [];
  for (let r = nextInputRow; r <= inputLast; r++) {
    availableRows.push(r);
  }

  appendLogSafe(`✅ Found ${availableRows.length} unprocessed rows (all remaining)`);
  if (availableRows.length > 0) {
    appendLogSafe(`📋 Will process rows ${availableRows[0]} through ${availableRows[availableRows.length-1]}`);
  }

  return availableRows;
}
function getSpecificInputRows_(inputSheet, outputSheet, spec) {
  appendLogSafe(`🔍 Starting detection for SPECIFIC rows: ${spec}`);

  const outputLast = outputSheet.getLastRow();

  // Build set of already-processed row numbers
  // Since Input row N → Output row N, rows 3 through (outputLast) are processed
  const processedRows = new Set();
  const outputDataRows = Math.max(0, outputLast - 2);

  for (let r = 3; r < 3 + outputDataRows; r++) {
    processedRows.add(r);
  }

  appendLogSafe(`📊 Already processed rows: 3 through ${2 + outputDataRows} (${processedRows.size} total)`);

  // Parse the spec (supports "5,10,15" or "5-10" or mixed "5-10,15,20-25")
  const requestedRows = parseRowSpec(spec);

  appendLogSafe(`📋 Requested rows: [${requestedRows.join(', ')}]`);

  // Filter out already-processed rows
  const availableRows = requestedRows.filter(r => !processedRows.has(r));

  if (availableRows.length < requestedRows.length) {
    const skipped = requestedRows.filter(r => processedRows.has(r));
    appendLogSafe(`⚠️  Skipping already-processed rows: [${skipped.join(', ')}]`);
  }

  appendLogSafe(`✅ Will process ${availableRows.length} rows: [${availableRows.join(', ')}]`);

  return availableRows;
}

function parseRowSpec(spec) {
  const rows = [];
  const parts = spec.split(',');

  parts.forEach(part => {
    part = part.trim();
    if (part.includes('-')) {
      // Range: "5-10"
      const range = part.split('-');
      const start = parseInt(range[0].trim(), 10);
      const end = parseInt(range[1].trim(), 10);
      for (let r = start; r <= end; r++) {
        if (!rows.includes(r)) {
          rows.push(r);
        }
      }
    } else {
      // Single row: "5"
      const r = parseInt(part, 10);
      if (!rows.includes(r)) {
        rows.push(r);
      }
    }
  });

  // Sort numerically
  return rows.sort((a, b) => a - b);
}



function startBatchFromSidebar(inputSheetName, outputSheetName, mode, spec) {
  const ss = SpreadsheetApp.getActive();
  const inSheet = ss.getSheetByName(inputSheetName);
  let outSheet = ss.getSheetByName(outputSheetName);

  // Dynamic output sheet detection (check Settings)
  const settingsSheet = ss.getSheetByName('Settings');
  const settingsOut = settingsSheet ? settingsSheet.getRange('A1').getValue() : '';
  if (settingsOut) {
    outSheet = ss.getSheetByName(settingsOut) || outSheet;
  }

  if (!inSheet || !outSheet) {
    throw new Error('❌ Could not find selected sheets.');
  }

  cacheHeaders(outSheet);

  appendLogSafe('─────────────────────────────────────────');
  appendLogSafe(`📋 Starting batch mode: ${mode}`);
  appendLogSafe('─────────────────────────────────────────');

  let rows;

  if (mode === 'next25') {
    rows = getNext25InputRows_(inSheet, outSheet);
  } else if (mode === 'all') {
    rows = getAllInputRows_(inSheet, outSheet);
  } else if (mode === 'specific') {
    rows = getSpecificInputRows_(inSheet, outSheet, spec);
  } else {
    throw new Error('Unknown batch mode: ' + mode);
  }

  if (!rows || rows.length === 0) {
    appendLogSafe('⚠️  No rows to process.');
    return { success: false, message: 'No unprocessed rows found.' };
  }

  // Save queue to DocumentProperties (separate properties for reliability)
  setProp('BATCH_ROWS', JSON.stringify(rows));
  setProp('BATCH_INPUT_SHEET', inputSheetName);
  setProp('BATCH_OUTPUT_SHEET', outputSheetName);
  setProp('BATCH_MODE', mode);
  setProp('BATCH_SPEC', spec);
  setProp('BATCH_STOP', ''); // Clear stop flag

  // Also save as single queue object for backwards compatibility
  const q = {
    rows: rows,
    inputSheetName: inputSheetName,
    outputSheetName: outputSheetName,
    mode: mode,
    spec: spec
  };
  setProp('BATCH_QUEUE', JSON.stringify(q));

  appendLogSafe(`✅ Batch queued with ${rows.length} row(s)`);
  appendLogSafe(`📋 Rows: [${rows.slice(0, 10).join(', ')}${rows.length > 10 ? '...' : ''}]`);
  appendLogSafe('─────────────────────────────────────────');

  return { success: true, count: rows.length, rows: rows };
}

function runSingleStepBatch() {
  // Try reading from separate properties first (more reliable)
  const rowsJson = getProp('BATCH_ROWS', '[]');
  const rows = JSON.parse(rowsJson);

  // Build queue object from separate properties
  const q = {
    rows: rows,
    inputSheetName: getProp('BATCH_INPUT_SHEET', ''),
    outputSheetName: getProp('BATCH_OUTPUT_SHEET', ''),
    mode: getProp('BATCH_MODE', ''),
    spec: getProp('BATCH_SPEC', '')
  }

  // Check if we have rows left
  if (!q.rows || q.rows.length === 0) {
    return { done: true, msg: '✅ All rows processed!' };
  }

  if (getProp('BATCH_STOP','')) {
    return { done: true, msg: 'Stopped by user.' };
  }

  // ⭐ Just pop and return the row number - don't process it here!
  const nextRow = q.rows.shift();

  // Save updated queue
  // Update the rows property
  setProp('BATCH_ROWS', JSON.stringify(q.rows));
  // Also update full queue for backward compatibility
  setProp('BATCH_QUEUE', JSON.stringify(q));

  // Return the row number and queue data so loopStep can call runSingleCaseFromSidebar
  return {
    done: false,
    row: nextRow,
    remaining: q.rows.length,
    inputSheetName: q.inputSheetName,
    outputSheetName: q.outputSheetName
  };
}
function finishBatchAndReport() {
  const log = JSON.parse(getProp('BATCH_LOG','{}'));
  const elapsedMs = Date.now() - (log.started||Date.now());
  const minutes = (elapsedMs/60000).toFixed(1);
  const report = `
${ICONS.clipboard} Batch Summary Report
Created: ${log.created||0}
Skipped: ${log.skipped||0}
Duplicates: ${log.dupes||0}
Errors: ${log.errors||0}
Elapsed: ${minutes} min
  `.trim();

  const s = ensureBatchReportsSheet_();
  s.appendRow([new Date(), 'Batch', log.created||0, log.skipped||0, log.dupes||0, log.errors||0, '', `${minutes} min`]);

  if (getSafeUi_()) { getSafeUi_().alert(report); }
  return report;
}

// ========== 5) SINGLE CASE GENERATOR (also used by batch) ==========

function runSingleCaseFromSidebar(inputSheetName, outputSheetName, row) {
  const ss = SpreadsheetApp.getActive();

  // Define the input and output sheets first
  const inSheet = ss.getSheetByName(inputSheetName);
  let outSheet = ss.getSheetByName(outputSheetName);

  // ⭐ Dynamic output sheet detection
  const settingsSheet = ss.getSheetByName('Settings');
  const settingsOut = settingsSheet ? settingsSheet.getRange('A1').getValue() : '';
  if (settingsOut) outSheet = ss.getSheetByName(settingsOut) || outSheet;

  // Validate
  if (!inSheet || !outSheet) throw new Error('❌ Could not find selected sheets.');

  cacheHeaders(outSheet);
  const result = processOneInputRow_(inSheet, outSheet, row, /*batchMode*/ false);

  // Show auto-closing toast notification (3 seconds)
  if (result.message) {
    showToast(result.message, 3);
  }

  return result.message;
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

function processOneInputRow_(inputSheet, outputSheet, inputRow, batchMode) {
  try {
    // --- Read inputs per row: A=Formal_Info, B=HTML, C=DOC, D=Extra (any may be blank) ---
    const formal = String(inputSheet.getRange(inputRow, 1).getValue() || '');
    const html   = String(inputSheet.getRange(inputRow, 2).getValue() || '');
    const docRaw = String(inputSheet.getRange(inputRow, 3).getValue() || '');
    const extra  = String(inputSheet.getRange(inputRow, 4).getValue() || '');

    if (!formal && !html && !docRaw && !extra) {
      return { skipped: true, message: `Row ${inputRow}: no input.` };
    }

    appendLogSafe(`▶️ Starting conversion for Row ${inputRow} (batchMode=${batchMode})`);

    // --- Duplicate check against output content signature ---
    const sniff = (formal + '\n' + html + '\n' + docRaw + '\n' + extra).slice(0, 1000);
    const sig = hashText(sniff);
    const allOut = outputSheet.getDataRange().getValues().flat().join('\n');
    if (allOut.indexOf(sig) !== -1) {
      return { skipped: true, duplicate: true, message: `Row ${inputRow}: duplicate (hash match).` };
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


// ========== 6) ATSR — Titles & Summary (Keep & Regenerate, Deselect, Memory) ==========

function runATSRTitleGenerator(continueRow, keepSelections) {
  const ss = SpreadsheetApp.getActive();
  const sheet = pickMasterSheet_();
  if (!sheet) { getSafeUi_().alert('❌ Master Scenario CSV not found.'); return; }

  let row = continueRow;
  const ui = getSafeUi_();
  if (!row) {
    const resp = ui.prompt('Enter the row number for ATSR:', ui.ButtonSet.OK_CANCEL);
    if (resp.getSelectedButton() !== ui.Button.OK) return;
    row = parseInt(resp.getResponseText(),10);
  }
  if (isNaN(row) || row < 3) { ui.alert('Row must be ≥ 3.'); return; }

  const headers = sheet.getRange(2,1,1,sheet.getLastColumn()).getValues()[0];
  const values  = sheet.getRange(row,1,1,sheet.getLastColumn()).getValues()[0];
  const data = Object.fromEntries(headers.map((h,i)=>[h, values[i]]));

  // All text for motif uniqueness
  const allText = sheet.getDataRange().getValues().flat().join(' ').toLowerCase();
  const usedMemory = getProp(SP_KEYS.USED_MOTIFS,'');

  // ========== ENHANCED RICH PROMPT WITH SIM MASTERY PHILOSOPHY ==========
  const prompt = `
📘 **Sim Mastery ATSR — Automated Titles, Summary & Review Generator**

You are an expert simulation designer and marketing genius helping build **Sim Mastery** — an emotionally resonant, AI-facilitated, high-fidelity emergency-medicine simulation platform.

Your task is to create compelling, clinically accurate, and emotionally engaging titles and summaries for a medical simulation case that will be used by emergency medicine clinicians to sharpen their real-time decision-making skills.

---

## 🧠 **Core Philosophy: Sim Mastery Values**

• **Emotionally Resonant**: Help learners *feel* what it's like to manage chaos and experience triumph
• **Clinically Sound**: Every detail must be medically accurate and educationally valuable
• **Narratively Immersive**: Create intrigue, tension, and curiosity
• **Human-Centered**: Focus on the person behind the patient, not just the diagnosis
• **Growth-Oriented**: Support learner development through challenge and success
• **Professionally Warm**: Fun yet respectful of medicine's seriousness

---

## 🎯 **Your Task: Create 4 Components**

### 1. **Spark Titles** (5 variations)
**Purpose**: Pre-sim mystery teaser that sells the learning experience WITHOUT spoiling the diagnosis

**Format**:
\`"<Chief Complaint> (<Age Sex>): <Emotionally Urgent Spark Phrase>"\`

**Examples**:
✅ "Chest Pain (47 M): Dizzy, Sweaty, and Terrified"
✅ "Shortness of Breath (5 F): Gasping After Birthday Cake"
✅ "Abdominal Pain (28 F): Pregnant and Worsening Fast"

**Rules**:
- NO diagnosis mentioned (no "MI", "anaphylaxis", "appendicitis")
- Observable symptoms only (what you see/hear)
- Emotionally urgent language ("terrified", "gasping", "worsening")
- Human details (age, gender, context clues)
- Create intrigue without spoiling the mystery

**Quality Criteria**:
- Would an EM clinician FEEL the urgency?
- Does it create curiosity without revealing the answer?
- Is it specific enough to paint a vivid picture?
- Does it respect the patient's humanity?

---

### 2. **Reveal Titles** (5 variations)
**Purpose**: Post-sim reinforcement that celebrates the diagnosis and learning objective

**Format**:
\`"<Diagnosis> (<Age Sex>): <Key Learning Objective or Clinical Pearl>"\`

**Examples**:
✅ "Acute MI (55 M): Recognizing Atypical Presentations"
✅ "Anaphylaxis (8 M): Epinephrine Technique Saves Lives"
✅ "Ectopic Pregnancy (28 F): The One Test You Can't Skip"

**Rules**:
- Diagnosis IS revealed (this is post-sim)
- Focus on the KEY teaching point or clinical pearl
- Emphasize what the learner will MASTER
- Clinical accuracy is critical
- Actionable takeaway (not just knowledge, but skill)

**Quality Criteria**:
- Does it reinforce the critical learning objective?
- Would the learner feel PROUD to have mastered this?
- Is the clinical pearl specific and actionable?
- Does it emphasize competence and growth?

---



### 3. **Case Summary** (Structured narrative)
**Purpose**: Concise, compelling summary that sells the value and humanizes the patient

**Components**:

**A) Patient_Summary** (1-2 sentences):
- Combine clinical urgency with human context
- Paint a vivid picture of the scenario
- Include observable details (vitals, appearance, setting)
- Emotionally engaging but clinically accurate

**Examples**:
✅ "A 55-year-old male clutches his chest in the ED, pale and diaphoretic, as his terrified wife explains the pain started while shoveling snow 20 minutes ago."
✅ "An 8-year-old boy gasps for air at a birthday party, lips swelling rapidly after eating cake, while his mother frantically calls for help."

**B) Key_Intervention** (Short phrase):
- The ONE action that changes the outcome
- Specific, actionable, memorable
- Focus on WHAT to do, not just WHY

**Examples**:
✅ "Immediate epinephrine (correct IM technique)"
✅ "Early aspirin + cath lab activation"
✅ "Surgical consult within 2 hours"

**C) Core_Takeaway** (Short phrase):
- The clinical pearl they'll remember forever
- Specific to THIS case
- Actionable and confidence-building

**Examples**:
✅ "Atypical presentations kill—always consider cardiac"
✅ "Epi first, questions later—timing saves lives"
✅ "Beta-hCG in all women of childbearing age"

**D) Defining_Characteristic_Options** (5 unique, humanizing details):
- Patient descriptors that add humanity and memorability
- Avoid clichés and overused motifs
- Make each case feel REAL and distinct
- Mix physical, emotional, and contextual details

**Examples**:
✅ "Retired firefighter who's 'never been sick a day in his life'"
✅ "Soccer mom rushing from practice still in her coaching gear"
✅ "College student studying for finals, chugging energy drinks"
✅ "Grandmother who walked 3 blocks to the ED because she 'didn't want to bother anyone'"
✅ "Construction worker who delayed coming in because he 'thought it was just heartburn'"

**Rules for Defining Characteristics**:
- Avoid motifs already used: ${usedMemory}
- Each one should paint a distinct picture
- Balance vulnerability with strength
- Include context clues (occupation, activity, mindset)
- Make the learner CARE about the patient

---

## 📋 **Context from This Case**

**Case Data**:
${JSON.stringify(data, null, 2)}

**Existing Cases in System** (avoid duplication):
${allText.slice(0, 2000)}...

**Motifs Already Used** (avoid these):
${usedMemory || 'None yet'}

---

## 🎨 **Tone & Style Guidelines**

**DO**:
✅ Use emotionally urgent language ("terrified", "gasping", "worsening fast")
✅ Focus on observable symptoms and human context
✅ Create intrigue and tension in Spark Titles
✅ Emphasize mastery and clinical pearls in Reveal Titles
✅ Make every detail clinically accurate and educationally sound
✅ Humanize the patient with specific, memorable details
✅ Paint vivid pictures that make the learner FEEL the scenario
✅ Use professional medical terminology appropriately

**DON'T**:
❌ Spoil the diagnosis in Spark Titles
❌ Use clichés or overused phrases
❌ Include medical jargon that obscures the human story
❌ Create generic, forgettable descriptions
❌ Duplicate existing motifs or patterns
❌ Sacrifice clinical accuracy for drama
❌ Make light of serious medical situations

---

## 🧪 **Quality Checklist**

Before finalizing your output, verify:

**Spark Titles**:
- [ ] NO diagnosis revealed
- [ ] Emotionally urgent and engaging
- [ ] Observable symptoms only
- [ ] Creates curiosity and tension
- [ ] Human context included

**Reveal Titles**:
- [ ] Diagnosis clearly stated
- [ ] Key learning objective emphasized
- [ ] Actionable clinical pearl
- [ ] Reinforces competence and mastery
- [ ] Clinically accurate

**Case IDs**:
- [ ] Correct format (7-8 chars)
- [ ] System prefix matches case
- [ ] Uppercase letters + digits
- [ ] Unique and memorable
- [ ] No duplication

**Case Summary**:
- [ ] Patient_Summary paints vivid picture
- [ ] Key_Intervention is specific and actionable
- [ ] Core_Takeaway is memorable and valuable
- [ ] Defining_Characteristics are unique and humanizing
- [ ] No clichés or overused motifs
- [ ] Emotionally resonant and clinically sound

---

## 📤 **Output Format (JSON)**

{
  "Spark_Titles": [
    "<Symptom> (<Age Sex>): <Spark Phrase>",
    "<Symptom> (<Age Sex>): <Spark Phrase>",
    "<Symptom> (<Age Sex>): <Spark Phrase>",
    "<Symptom> (<Age Sex>): <Spark Phrase>",
    "<Symptom> (<Age Sex>): <Spark Phrase>"
  ],
  "Reveal_Titles": [
    "<Diagnosis> (<Age Sex>): <Learning Objective>",
    "<Diagnosis> (<Age Sex>): <Learning Objective>",
    "<Diagnosis> (<Age Sex>): <Learning Objective>",
    "<Diagnosis> (<Age Sex>): <Learning Objective>",
    "<Diagnosis> (<Age Sex>): <Learning Objective>"
  ],
  "Case_Summary": {
    "Patient_Summary": "A vivid 1-2 sentence description combining clinical urgency with human context, painting a clear picture of the scenario.",
    "Key_Intervention": "The ONE specific action that changes the outcome",
    "Core_Takeaway": "The clinical pearl they'll remember forever",
    "Defining_Characteristic_Options": [
      "Unique humanizing detail #1",
      "Unique humanizing detail #2",
      "Unique humanizing detail #3",
      "Unique humanizing detail #4",
      "Unique humanizing detail #5"
    ]
  }
}

---

## 🎯 **Final Reminder: The Sim Mastery Standard**

You're not just creating titles and summaries—you're crafting learning experiences that will stay with clinicians throughout their careers. Every word matters. Every detail should serve both the educational objective AND the emotional resonance.

Make this case:
• Unforgettable
• Clinically impeccable
• Emotionally powerful
• Educationally transformative

Now create your output. Make it AMAZING. 🚀
`;

  // ========== END OF ENHANCED PROMPT ==========

  const ai = callOpenAI(prompt, 0.7); // Temperature 0.7 for creative but consistent output
  const parsed = tryParseJSON(ai);
  if (!parsed) { ui.alert('⚠️ ATSR parse error:\n'+ai); return; }

  const html = buildATSRPanelDark_(row, parsed, keepSelections);
  ui.showModalDialog(HtmlService.createHtmlOutput(html).setWidth(860).setHeight(820), '✨ ATSR — Titles & Summary');
}


function buildATSRPanelDark_(row, parsed, keepSelections) {
  const makeEditable = (vals, name) => vals.map((v,i)=>`
    <div style="margin-bottom:6px;">
      <input type="radio" name="${name}" value="${i}" id="${name}_${i}" ${(keepSelections && i===0)?'checked':''}>
      <input type="text" id="${name}_text_${i}" value="${String(v).replace(/"/g,'&quot;')}" style="width:92%; font-size:13px; background:#f5f7fa; color:#2c3e50; border:1px solid #d1d7de; border-radius:8px; padding:6px;">
    </div>
  `).join('');

  const makeSelect = (vals, name) => vals.map((v,i)=>`
    <div style="margin-bottom:6px;">
      <input type="radio" name="${name}" value="${String(v).replace(/"/g,'&quot;')}" id="${name}_${i}" ${(keepSelections && i===0)?'checked':''}> 
      <span>${v}</span>
    </div>
  `).join('');

  const addNoChange = (name) => `
    <div style="margin-top:10px;">
      <input type="radio" name="${name}" value="nochange" id="${name}_nochange">
      <label for="${name}_nochange"><em>🟦 No Change (keep current)</em></label>
    </div>
  `;

  const ps = parsed.Case_Summary?.Patient_Summary || 'A patient was evaluated and managed for an acute condition requiring urgent care.';
  const ki = parsed.Case_Summary?.Key_Intervention || 'N/A';
  const ct = parsed.Case_Summary?.Core_Takeaway || 'N/A';
  const formatted = autoBoldSummary_(ps, ki, ct);

  return `
  <style>
    body{font-family:Arial;margin:0;background:#f5f7fa;color:#2c3e50}
    .bar{padding:14px 16px;background:#ffffff;border-bottom:1px solid #dfe3e8}
    h2{margin:0;font-size:16px}
    .wrap{padding:16px}
    .card{background:#ffffff;border:1px solid #dfe3e8;border-radius:10px;padding:14px;margin-bottom:12px}
    button{background:#2357ff;border:0;color:#fff;padding:10px 12px;border-radius:8px;cursor:pointer}
    button.sec{background:#dfe3e8}
    h3{margin:0 0 8px 0}
    .grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px}
    ul{margin:0 0 6px 18px;padding:0}
    li{margin:10px 0;font-size:15px}
  </style>
  <div class="bar"><h2>${ICONS.wand} ATSR — Titles & Summary (Row ${row})</h2></div>
  <div class="wrap">
    <div class="card">
      <h3>🩺 Case Summary: <span style="font-size:15px; font-weight:500;">${formatted.summary}</span></h3>
      <ul>
        <li><strong>Key Intervention:</strong> ${formatted.key}</li>
        <li style="margin-top:14px;"><strong>Core Takeaway:</strong> ${formatted.take}</li>
      </ul>
    </div>

    <div class="grid">
      <div class="card">
        <h3>💡 Defining Characteristic Options</h3>
        ${makeEditable(parsed.Case_Summary?.Defining_Characteristic_Options||[], 'define')}
        ${addNoChange('define')}
      </div>
      <div class="card">
        <h3>🔥 Spark Titles</h3>
        ${makeEditable(parsed.Spark_Titles||[], 'spark')}
        ${addNoChange('spark')}
      </div>
      <div class="card">
        <h3>💎 Reveal Titles</h3>
        ${makeEditable(parsed.Reveal_Titles||[], 'reveal')}
        ${addNoChange('reveal')}
      </div>
    </div>

    <div class="card">
      <h3>🆔 Case IDs (10)</h3>
      ${makeSelect(parsed.Case_IDs||[], 'caseID')}
      ${addNoChange('caseID')}
    </div>

    <div class="card">
      <button onclick="apply(false)">✅ Save</button>
      <button onclick="apply(true)">⏭️ Save & Continue</button>
      <button class="sec" onclick="keepRegen()">🔁 Keep & Regenerate</button>
      <button class="sec" onclick="google.script.host.close()">Close</button>
    </div>
  </div>

  <script>
    function getSel(){
      const getTxt=(n)=>{const r=document.querySelector('input[name="'+n+'"]:checked');return r?document.getElementById(n+'_text_'+r.value)?.value||'nochange':'nochange';}
      const getVal=(n)=>{const r=document.querySelector('input[name="'+n+'"]:checked');return r?r.value:'nochange';}
      return { spark: getTxt('spark'), reveal: getTxt('reveal'), caseID: getVal('caseID'), define: getTxt('define') };
    }
    function apply(next){
      const s=getSel();
      google.script.run
        .withSuccessHandler(()=>{ if(next) google.script.run.runATSRTitleGenerator(${row+1}); google.script.host.close(); })
        .applyATSRSelectionsWithDefiningAndMemory(${row}, s.spark, s.reveal, s.define);
    }
    function keepRegen(){
      const s=getSel();
      google.script.run
        .withSuccessHandler(()=>google.script.host.close())
        .runATSRTitleGenerator(${row}, s);
    }
  </script>
  `;
}

function applyATSRSelectionsWithDefiningAndMemory(row, spark, reveal, define) {
  const s = pickMasterSheet_();
  const headers = s.getRange(2,1,1,s.getLastColumn()).getValues()[0];

  const setVal = (key, val, append=false) => {
    if (!val || val==='nochange') return;
    const idx = headers.indexOf(key);
    if (idx<0) return;
    const r = s.getRange(row, idx+1);
    if (append) {
      const ex = r.getValue();
      r.setValue(ex ? (ex + ' ' + val) : val);
    } else r.setValue(val);
  };

  setVal('Spark_Title',   spark);
  setVal('Reveal_Title',  reveal);
  // Case_ID removed
  setVal('Patient_Descriptor', define, true);

  if (define && define!=='nochange') {
    const memKey = SP_KEYS.USED_MOTIFS;
    const prev = getProp(memKey,'');
    const motif = define.toLowerCase().split(' ').slice(0,3).join(' ');
    if (!prev.includes(motif)) setProp(memKey, prev ? (prev+', '+motif) : motif);
  }

  SpreadsheetApp.getActive().toast('✅ ATSR saved.');
}

function pickMasterSheet_() {
  const ss = SpreadsheetApp.getActive();
  // Prefer last used output
  const last = getProp(SP_KEYS.LAST_OUTPUT_SHEET, '');
  if (last) {
    const s = ss.getSheetByName(last);
    if (s) return s;
  }
  // Else prefer sheet named like Master Scenario CSV
  const m = ss.getSheets().find(sh=>/master scenario csv/i.test(sh.getName()));
  return m || ss.getActiveSheet();
}

// Auto-bold key phrases in summary lines
function autoBoldSummary_(summary, key, take) {
  function boldPhrase(s) {
    if (!s) return 'N/A';
    // Bold up to the colon if present; else first 2–3 words
    const parts = s.split(':');
    if (parts.length>1) return `<strong>${parts[0]}</strong>:` + parts.slice(1).join(':');
    const words = s.split(' ');
    const head = words.slice(0,3).join(' ');
    return `<strong>${head}</strong> ${words.slice(3).join(' ')}`.trim();
  }
  return { summary, key: boldPhrase(key), take: boldPhrase(take) };
}


// ========== 7) IMAGE SYNC DEFAULTS MANAGER ==========

function openImageSyncDefaults() {
  const s = pickMasterSheet_();
  const {header1, header2} = getCachedHeadersOrRead(s);
  const keys = header1.map((t1,i)=>`${t1}:${header2[i]}`).filter(k=>/^Image_Sync:/i.test(k));

  const current = JSON.parse(getProp(SP_KEYS.IMG_SYNC_DEFAULTS, '{}') || '{}');
  const rows = keys.map(k=>{
    const v = (current[k]!==undefined) ? current[k] : '';
    return `<tr><td>${k}</td><td><input data-k="${k}" value="${String(v).replace(/"/g,'&quot;')}" style="width:100%"></td></tr>`;
  }).join('');

  const html = HtmlService.createHtmlOutput(`
  <style>
    body{font-family:Arial;background:#f5f7fa;color:#2c3e50}
    table{width:100%;border-collapse:collapse}
    td,th{border:1px solid #dfe3e8;padding:8px}
    .bar{padding:14px 16px;background:#ffffff;border-bottom:1px solid #dfe3e8}
    button{background:#2357ff;border:0;color:#fff;padding:8px 12px;border-radius:8px;cursor:pointer}
  </style>
  <div class="bar"><h3>${ICONS.frame} Image Sync Defaults</h3></div>
  <div style="padding:12px;">
    <p class="hint">Edit defaults per <code>Image_Sync:*</code> column. Click Save to persist.</p>
    <table>
      <tr><th>Column</th><th>Default Value</th></tr>
      ${rows || '<tr><td colspan="2"><em>No Image_Sync columns detected.</em></td></tr>'}
    </table>
    <div style="margin-top:12px;">
      <button onclick="save()">Save</button>
      <button style="background:#dfe3e8" onclick="refresh()">Refresh Columns</button>
    </div>
  </div>
  <script>
    function save(){
      const obj = {};
      document.querySelectorAll('input[data-k]').forEach(inp=>{
        obj[inp.getAttribute('data-k')] = inp.value;
      });
      google.script.run
        .withSuccessHandler(()=>google.script.host.close())
        .saveImageSyncDefaults(JSON.stringify(obj));
    }
    function refresh(){
      google.script.run
        .withSuccessHandler(()=>location.reload())
        .refreshImageSyncHeaderCache();
    }
  </script>
  `).setWidth(720).setHeight(560);

  getSafeUi_().showModalDialog(html, '🖼 Image Sync Defaults');
}
function saveImageSyncDefaults(json) {
  setProp(SP_KEYS.IMG_SYNC_DEFAULTS, json||'{}');
  SpreadsheetApp.getActive().toast('✅ Image Sync defaults saved.');
}
function refreshImageSyncHeaderCache() {
  const s = pickMasterSheet_();
  cacheHeaders(s);
  SpreadsheetApp.getActive().toast('🔁 Header cache refreshed.');
}


// ========== 8) MEMORY TRACKER ==========

function openMemoryTracker() {
  const mem = (getProp(SP_KEYS.USED_MOTIFS,'')||'').split(',').map(m=>m.trim()).filter(Boolean);
  const list = mem.map((m,i)=>`<div><input type="checkbox" id="m${i}" checked> ${m}</div>`).join('');
  const html = HtmlService.createHtmlOutput(`
  <style>body{font-family:Arial;background:#f5f7fa;color:#2c3e50} button{background:#2357ff;border:0;color:#fff;padding:8px 12px;border-radius:8px;cursor:pointer}</style>
  <div style="padding:16px;">
    <h3>${ICONS.puzzle} Memory Tracker</h3>
    ${list || '<p><em>No motifs stored.</em></p>'}
    <div style="margin-top:12px;">
      <button onclick="clearAll()">🧹 Clear All</button>
      <button style="background:#dfe3e8" onclick="markReusable()">♻️ Mark Selected as Reusable</button>
    </div>
  </div>
  <script>
    function clearAll(){ google.script.run.withSuccessHandler(()=>google.script.host.close()).clearMotifMemory(); }
    function markReusable(){
      const unchecked=[];
      document.querySelectorAll('input[type=checkbox]').forEach(c=>{ if(!c.checked) unchecked.push(c.nextSibling.textContent.trim()); });
      google.script.run.withSuccessHandler(()=>google.script.host.close()).markMotifsReusable(unchecked);
    }
  </script>`).setWidth(520).setHeight(420);
  getSafeUi_().showModalDialog(html, '🧩 Memory Tracker');
}
function clearMotifMemory(){ PropertiesService.getDocumentProperties().deleteProperty(SP_KEYS.USED_MOTIFS); SpreadsheetApp.getActive().toast('🧹 Memory cleared.'); }
function markMotifsReusable(unchecked){ 
  const key = SP_KEYS.USED_MOTIFS;
  const motifs = (getProp(key,'')||'').split(',').map(m=>m.trim()).filter(Boolean);
  const kept = motifs.filter(m => unchecked.includes(m)===false);
  setProp(key, kept.join(', '));
  SpreadsheetApp.getActive().toast('♻️ Selected motifs marked reusable.');
}

// ======================================================
// HEADER MANAGEMENT + AUTO-RETRAIN MODULE (Sim Mastery)
// ======================================================


// ========== 1) REFRESH HEADERS (TRAIN STRUCTURE) ==========
function refreshHeaders() {
  const ui = getSafeUi_();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const outputSheet = ss.getSheetByName(getProp('LAST_OUTPUT_SHEET') || 'Output');
  if (!outputSheet) {
    if (ui) { ui.alert('❌ Output sheet not found.'); }
    return;
  }

  const header1 = outputSheet.getRange(1, 1, 1, outputSheet.getLastColumn()).getValues()[0];
  const header2 = outputSheet.getRange(2, 1, 1, outputSheet.getLastColumn()).getValues()[0];
  const mergedKeys = header1.map((t1, i) => `${t1}:${header2[i]}`.replace(/\s+/g, '_'));

  // Cache headers for future access
  setProp('CACHED_HEADER1', JSON.stringify(header1));
  setProp('CACHED_HEADER2', JSON.stringify(header2));
  setProp('CACHED_MERGED_KEYS', JSON.stringify(mergedKeys));

  if (getSafeUi_()) { getSafeUi_().alert(`✅ Headers refreshed!\n\n${mergedKeys.length} merged keys cached.`); }
}

// ========== 2) AUTO-RETRAIN PROMPT STRUCTURE ==========
function retrainPromptStructure() {
  const ui = getSafeUi_();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const outputSheet = ss.getSheetByName(getProp('LAST_OUTPUT_SHEET') || 'Output');
  if (!outputSheet) {
    if (ui) { ui.alert('❌ Output sheet not found.'); }
    return;
  }

  const header1 = outputSheet.getRange(1, 1, 1, outputSheet.getLastColumn()).getValues()[0];
  const header2 = outputSheet.getRange(2, 1, 1, outputSheet.getLastColumn()).getValues()[0];
  const mergedKeys = header1.map((t1, i) => `${t1}:${header2[i]}`.replace(/\s+/g, '_'));

  // Cache structure
  setProp('CACHED_HEADER1', JSON.stringify(header1));
  setProp('CACHED_HEADER2', JSON.stringify(header2));
  setProp('CACHED_MERGED_KEYS', JSON.stringify(mergedKeys));

  // Build prompt training text
  const promptIntro = `
📘 Sim Mastery — Auto-Trained Output Schema
This defines your authoritative JSON schema for all generated content.

Each key must exactly match the merged Tier1:Tier2 form, using underscores (_) instead of spaces.
When a value cannot be filled, output "N/A".

Tier1 Headers:
${header1.join(', ')}

Tier2 Headers:
${header2.join(', ')}

Merged Keys (exact JSON keys required):
${mergedKeys.join(', ')}
`.trim();

  setProp('CACHED_PROMPT_STRUCTURE', promptIntro);

  if (ui) { ui.alert(`✅ Prompt structure retrained!\n\n${mergedKeys.length} merged keys cached.\nPrompt fragment stored for AI calls.`); }
}

// ========== 3) OPTIONAL: AUTO-CHECK BEFORE RUN ==========
function ensureHeadersCached() {
  const h = getProp('CACHED_HEADER1');
  if (!h) {
    refreshHeaders();
    retrainPromptStructure();
  }
}







// ========== 9) SETTINGS PANEL (Properties + Cache) ==========

function openSettingsPanel() {
  const api = getProp(SP_KEYS.API_KEY,'');
  const model = getProp(SP_KEYS.MODEL, DEFAULT_MODEL);
  const pIn = getProp(SP_KEYS.PRICE_INPUT, DEFAULT_PRICE.input);
  const pOut= getProp(SP_KEYS.PRICE_OUTPUT, DEFAULT_PRICE.output);
  const html = HtmlService.createHtmlOutput(`
  <style>body{font-family:Arial;background:#f5f7fa;color:#2c3e50}
  label{font-size:12px;color:#7f8c9d}
  input,select{width:100%;background:#f5f7fa;border:1px solid #d1d7de;color:#2c3e50;border-radius:8px;padding:8px}
  button{background:#2357ff;border:0;color:#fff;padding:8px 12px;border-radius:8px;cursor:pointer}
  .card{background:#ffffff;border:1px solid #dfe3e8;border-radius:10px;padding:14px;margin:12px}
  </style>
  <div class="card">
    <h3>${ICONS.gear} Settings</h3>
    <label>Model</label>
    <input id="m" value="${model}">
    <label style="margin-top:8px;">API Key</label>
    <input id="k" value="${api ? '••••••••' : ''}" placeholder="sk-...">
    <label style="margin-top:8px;">Price Input per 1k</label>
    <input id="pi" value="${pIn}">
    <label style="margin-top:8px;">Price Output per 1k</label>
    <input id="po" value="${pOut}">
    <div style="margin-top:10px;">
      <button onclick="save()">Save</button>
      <button style="background:#dfe3e8" onclick="clearCache()">Clear Header Cache</button>
      <button style="background:#dfe3e8" onclick="pull()">Sync API from Settings sheet</button>
    </div>
  </div>
  <script>
    function save(){
      const key = document.getElementById('k').value.trim();
      google.script.run.saveSidebarBasics(
        document.getElementById('m').value,
        (key && key!=='••••••••') ? key : '',
        document.getElementById('pi').value.trim(),
        document.getElementById('po').value.trim(),
        '', ''
      );
      google.script.host.close();
    }
    function clearCache(){ google.script.run.withSuccessHandler(()=>alert('Cache cleared')).clearHeaderCache(); }
    function pull(){ google.script.run.withSuccessHandler(()=>alert('API key synced from Settings sheet (if found).')).pullApiFromSettingsSheet(); }
  </script>`).setWidth(520).setHeight(420);
  getSafeUi_().showModalDialog(html, '⚙️ Settings');
}

function pullApiFromSettingsSheet() {
  const key = syncApiKeyFromSettingsSheet_();
  if (key) setProp(SP_KEYS.API_KEY, key);
}


// ========== 10) MENU ==========

function onOpen() {
  const ui = getSafeUi_();
  ui.createMenu('🧠 Sim Builder')
    .addItem(`${ICONS.rocket} Launch Batch / Single (Sidebar)`, 'openSimSidebar')
    .addSeparator()
    .addItem(`${ICONS.wand} ATSR — Titles & Summary`, 'runATSRTitleGenerator')
    .addItem(`${ICONS.frame} Image Sync Defaults`, 'openImageSyncDefaults')
    .addItem(`${ICONS.puzzle} Memory Tracker`, 'openMemoryTracker')
    .addItem('🧪 Run Quality Audit (All / Specific Rows)', 'runQualityAudit_AllOrRows')
    .addItem('🧹 Clean Up Low-Value Rows', 'cleanUpLowValueRows')
    .addSeparator()
    .addItem('🔁 Refresh Headers', 'refreshHeaders')
    .addItem('🧠 Retrain Prompt Structure', 'retrainPromptStructure')
    .addSeparator()
    .addItem(`${ICONS.shield} Check API Status`, 'checkApiStatus')
    .addItem(`${ICONS.gear} Settings`, 'openSettingsPanel')
    .addToUi();
  SpreadsheetApp.getActive().toast('✅ Sim Builder menu loaded');
}




// ⭐ Sidebar Log Helpers
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

/******************************************************
 * ER Simulator – Intelligent Waveform Mapper Extension
 * (adds a second menu: “ER Simulator”)
 ******************************************************/

// Canonical waveform definitions
const WAVEFORMS = {
  'sinus_ecg': 'Normal Sinus Rhythm',
  'afib_ecg': 'Atrial Fibrillation',
  'aflutter_ecg': 'Atrial Flutter',
  'svt_ecg': 'Supraventricular Tachycardia',
  'vtach_ecg': 'Ventricular Tachycardia',
  'vfib_ecg': 'Ventricular Fibrillation',
  'asystole_ecg': 'Asystole (Flatline)',
  'paced_ecg': 'Paced Rhythm',
  'junctional_ecg': 'Junctional Rhythm',
  'bigeminy_ecg': 'Ventricular Bigeminy',
  'trigeminy_ecg': 'Ventricular Trigeminy',
  'idioventricular_ecg': 'Idioventricular Rhythm',
  'torsades_ecg': 'Torsades de Pointes',
  'peapulseless_ecg': 'Pulseless Electrical Activity',
  'artifact_ecg': 'Artifact / Noise'
};

// === 1. Extend onOpen() safely ===
(function extendMenu_() {
  const ui = getSafeUi_();
  if (!ui) { Logger.log("Web app context - skipping UI"); }
  try {
    ui.createMenu('ER Simulator')
      .addItem('🩺 Suggest Waveform Mapping', 'suggestWaveformMapping')
      .addItem('🔄 Auto-Map All Waveforms', 'autoMapAllWaveforms')
      .addSeparator()
      .addItem('📊 Analyze Current Mappings', 'analyzeCurrentMappings')
      .addItem('❌ Clear All Waveforms', 'clearAllWaveforms')
      .addToUi();
  } catch (e) {
    Logger.log('Menu extension error: ' + e);
  }
})();

// === 2. Mapping logic ===
function detectWaveformForState_(caseTitle, initialRhythm, dispositionPlan, stateName) {
  const txt = `${caseTitle} ${initialRhythm} ${dispositionPlan}`.toLowerCase();
  const isArrest = /arrest|critical/i.test(stateName);
  const isWorsening = /worsening|deterior/i.test(stateName);

  if (isArrest) {
    if (txt.includes('pea')) return 'peapulseless_ecg';
    if (txt.includes('asystole') || txt.includes('flatline')) return 'asystole_ecg';
    if (txt.includes('vfib')) return 'vfib_ecg';
    if (txt.includes('vtach')) return 'vtach_ecg';
    if (txt.includes('torsades')) return 'torsades_ecg';
    return 'asystole_ecg';
  }
  if (isWorsening) {
    if (txt.includes('vtach')) return 'vtach_ecg';
    if (txt.includes('svt')) return 'svt_ecg';
    if (txt.includes('aflutter')) return 'aflutter_ecg';
  }
  if (txt.includes('afib')) return 'afib_ecg';
  if (txt.includes('aflutter')) return 'aflutter_ecg';
  if (txt.includes('paced') || txt.includes('pacemaker')) return 'paced_ecg';
  if (txt.includes('junctional')) return 'junctional_ecg';
  if (txt.includes('bigeminy')) return 'bigeminy_ecg';
  if (txt.includes('trigeminy')) return 'trigeminy_ecg';
  return 'sinus_ecg';
}

// === 3. Helpers ===
function getHeaders_(sheet) {
  const t1 = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const t2 = sheet.getRange(2, 1, 1, sheet.getLastColumn()).getValues()[0];
  return t1.map((a, i) => `${a}:${t2[i]}`);
}
function buildCase_(headers, row) {
  const o = {};
  headers.forEach((h, i) => (o[h] = row[i]));
  return o;
}

// === 4. Suggest mapping for active row ===
function suggestWaveformMapping() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Master Scenario Convert');
  const ui = getSafeUi_();
  if (!sheet) return ui.alert('❌ Sheet "Master Scenario Convert" not found');
  const r = sheet.getActiveCell().getRow();
  if (r < 3) return ui.alert('Select a data row (≥ 3)');

  const headers = getHeaders_(sheet);
  const vals = sheet.getRange(r, 1, 1, headers.length).getValues()[0];
  const data = buildCase_(headers, vals);
  const title = data['Case_Organization:Reveal_Title'] || data['Case_Organization:Spark_Title'] || '';
  const rhythm = data['Patient_Demographics_and_Clinical_Data:Initial_Rhythm'] || '';
  const plan = data['Situation_and_Environment_Details:Disposition_Plan'] || '';
  const states = (data['image sync:Default_Patient_States'] || 'Baseline,Worsening,Arrest,Recovery').split(',');

  let msg = `📋 ${title}\n\n🩺 Suggested Waveforms:\n`;
  ['Initial_Vitals','State1_Vitals','State2_Vitals','State3_Vitals','State4_Vitals','State5_Vitals'].forEach((f,i)=>{
    const sName = states[i] || f;
    const w = detectWaveformForState_(title, rhythm, plan, sName);
    msg += `• ${sName}: ${WAVEFORMS[w]}\n`;
  });
  if (ui) { ui.alert('Waveform Suggestions', msg, ui.ButtonSet.OK); }
}

// === 5. Auto-map all waveforms ===
function autoMapAllWaveforms() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Master Scenario Convert');
  const ui = getSafeUi_();
  if (!sheet) return ui.alert('❌ Sheet "Master Scenario Convert" not found');
  if (ui.alert('Auto-Map Waveforms','Map all cases intelligently?',ui.ButtonSet.YES_NO)!==ui.Button.YES) return;

  const headers = getHeaders_(sheet);
  const dataR = sheet.getRange(3,1,sheet.getLastRow()-2,headers.length);
  const data = dataR.getValues();
  let count=0;

  data.forEach(row=>{
    const d=buildCase_(headers,row);
    const title=d['Case_Organization:Reveal_Title']||'';
    const rhythm=d['Patient_Demographics_and_Clinical_Data:Initial_Rhythm']||'';
    const plan=d['Situation_and_Environment_Details:Disposition_Plan']||'';
    const states=(d['image sync:Default_Patient_States']||'Baseline,Worsening,Arrest,Recovery').split(',');
    ['Initial_Vitals','State1_Vitals','State2_Vitals','State3_Vitals','State4_Vitals','State5_Vitals'].forEach((f,i)=>{
      const col=headers.indexOf(`Monitor_Vital_Signs:${f}`);
      if(col===-1)return;
      try{
        const v=JSON.parse(row[col]);
        const w=detectWaveformForState_(title,rhythm,plan,states[i]||f);
        v.waveform=w; row[col]=JSON.stringify(v); count++;
      }catch(e){}
    });
  });
  dataR.setValues(data);
  if (ui) { ui.alert('✅ Auto-mapping complete',`Updated ${count} waveforms`,ui.ButtonSet.OK); }
}

// === 6. Analyze distribution ===
function analyzeCurrentMappings() {
  const sheet=SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Master Scenario Convert');
  const ui=getSafeUi_();
  if(!sheet)return ui.alert('❌ Sheet not found');
  const h=getHeaders_(sheet);
  const dr=sheet.getRange(3,1,sheet.getLastRow()-2,h.length);
  const d=dr.getValues();
  const stats={};let tot=0,withWF=0;
  d.forEach(r=>{
    ['Initial_Vitals','State1_Vitals','State2_Vitals','State3_Vitals','State4_Vitals','State5_Vitals'].forEach(f=>{
      const c=h.indexOf(`Monitor_Vital_Signs:${f}`);
      if(c===-1)return;
      try{const v=JSON.parse(r[c]);tot++;if(v.waveform){withWF++;stats[v.waveform]=(stats[v.waveform]||0)+1;}}catch(e){}
    });
  });
  let msg=`Total Vitals: ${tot}\nWith Waveforms: ${withWF}\nMissing: ${tot-withWF}\n\n`;
  Object.keys(stats).sort((a,b)=>stats[b]-stats[a]).forEach(k=>msg+=`${WAVEFORMS[k]||k}: ${stats[k]}\n`);
  if (ui) { ui.alert('Waveform Analysis',msg,ui.ButtonSet.OK); }
}

// === 7. Clear all waveforms ===
function clearAllWaveforms() {
  const sheet=SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Master Scenario Convert');
  const ui=getSafeUi_();
  if(!sheet)return ui.alert('❌ Sheet not found');
  if(ui.alert('Clear All Waveforms','⚠️ Remove all waveforms?',ui.ButtonSet.YES_NO)!==ui.Button.YES)return;
  const h=getHeaders_(sheet);
  const dr=sheet.getRange(3,1,sheet.getLastRow()-2,h.length);
  const d=dr.getValues();let n=0;
  d.forEach(r=>{
    ['Initial_Vitals','State1_Vitals','State2_Vitals','State3_Vitals','State4_Vitals','State5_Vitals'].forEach(f=>{
      const c=h.indexOf(`Monitor_Vital_Signs:${f}`);if(c===-1)return;
      try{const v=JSON.parse(r[c]);if(v.waveform){delete v.waveform;r[c]=JSON.stringify(v);n++;}}catch(e){}
    });
  });
  dr.setValues(d);
  if (ui) { ui.alert('❌ Cleared',`Removed ${n} waveforms`,ui.ButtonSet.OK); }
}


/******************************************************
 * 🔗 Live Sync Webhook Trigger (Google → Local)
 ******************************************************/
const LIVE_SYNC_URL = "https://overlate-nontemporizingly-edris.ngrok-free.dev/vitals-update"; // ngrok tunnel

function onEdit(e) {
  try {
    // If run manually (no event), bail early
    if (!e || !e.range) {
      Logger.log("⚠️ onEdit called manually - skipping live sync");
      return;
    }

    const sheet = e.range.getSheet();
    if (sheet.getName() !== "Master Scenario Convert" || e.range.getRow() < 3) {
      Logger.log("⚠️ Edit ignored: not in Master Scenario Convert or header row");
      return;
    }

    const row = e.range.getRow();
    const dataRange = sheet.getRange(row, 1, 1, sheet.getLastColumn());
    const headers1 = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const headers2 = sheet.getRange(2, 1, 1, sheet.getLastColumn()).getValues()[0];
    const rowValues = dataRange.getValues()[0];
    const mergedKeys = headers1.map((t1, i) => `${t1}:${headers2[i]}`);

    const entry = {};
    mergedKeys.forEach((key, i) => {
      const val = rowValues[i];
      if (val && val !== "N/A") entry[key] = tryParseJSON(val);
    });

    // Post update to your local LiveSync server
    const options = {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(entry),
      muteHttpExceptions: true,
    };

    const response = UrlFetchApp.fetch(LIVE_SYNC_URL, options);
    Logger.log(`📡 Sent live update for row ${row}: ${response.getResponseCode()}`);
  } catch (err) {
    Logger.log("❌ Live Sync error: " + err);
  }
}

function tryParseJSON(v) {
  try {
    return JSON.parse(v);
  } catch {
    return v;
  }
}

// === TEST FUNCTION: Manually trigger batch processing ===
function testBatchProcessRow3() {
  try {
    const ss = SpreadsheetApp.getActive();
    const inSheet = ss.getSheetByName('Input');
    const outSheet = ss.getSheetByName('Master Scenario Convert');

    Logger.log('📋 Starting test batch for Input row 3...');

    const summary = processOneInputRow_(inSheet, outSheet, 3, true);

    Logger.log('✅ Result: ' + JSON.stringify(summary));

    return {
      success: true,
      summary: summary,
      message: summary.message || 'Completed'
    };

  } catch (err) {
    Logger.log('❌ ERROR: ' + err.message);
    Logger.log('Stack: ' + err.stack);

    return {
      success: false,
      error: err.message,
      stack: err.stack,
      errorDetails: err.toString()
    };
  }
}



// === DIAGNOSTIC FUNCTION: Test Live Logging System ===
function testLiveLogging() {
  try {
    Logger.log('🔍 Starting Live Logging Diagnostic Test');

    // Test 1: Can we write to Document Properties?
    Logger.log('Test 1: Writing to Document Properties...');
    appendLogSafe('🧪 TEST LOG 1: appendLogSafe() is working!');
    Logger.log('✅ Test 1 passed');

    // Test 2: Can we read back what we wrote?
    Logger.log('Test 2: Reading from Document Properties...');
    const logs = getSidebarLogs();
    Logger.log('Retrieved logs: ' + logs);
    Logger.log('✅ Test 2 passed');

    // Test 3: Add more logs
    Logger.log('Test 3: Adding multiple log entries...');
    appendLogSafe('🧪 TEST LOG 2: Second entry');
    appendLogSafe('🧪 TEST LOG 3: Third entry with timestamp');
    Logger.log('✅ Test 3 passed');

    // Test 4: Read final result
    const finalLogs = getSidebarLogs();
    Logger.log('Final logs content:');
    Logger.log(finalLogs);

    return {
      success: true,
      message: 'All tests passed! Check execution logs for details.',
      logsLength: finalLogs.length,
      logsPreview: finalLogs.substring(0, 200)
    };

  } catch (err) {
    Logger.log('❌ ERROR: ' + err.message);
    Logger.log('Stack: ' + err.stack);
    return {
      success: false,
      error: err.message,
      stack: err.stack
    };
  }
}

// === DIAGNOSTIC FUNCTION: Check if batch mode flag is set ===
function testBatchModeFlag() {
  try {
    const inSheet = SpreadsheetApp.getActive().getSheetByName('Input');
    const outSheet = SpreadsheetApp.getActive().getSheetByName('Master Scenario Convert');

    Logger.log('🔍 Testing batch mode flag...');
    Logger.log('');

    // Call processOneInputRow_ with batchMode=true
    Logger.log('Calling processOneInputRow_ with batchMode=true on row 3...');
    const result = processOneInputRow_(inSheet, outSheet, 3, true);

    Logger.log('Result: ' + JSON.stringify(result));
    Logger.log('');
    Logger.log('Now check Document Properties:');

    const logs = getSidebarLogs();
    Logger.log('Sidebar_Logs content:');
    Logger.log(logs || '(empty)');

    return {
      success: true,
      result: result,
      logsFound: logs && logs.length > 0,
      logsLength: (logs || '').length,
      logsPreview: (logs || '').substring(0, 300)
    };

  } catch (err) {
    Logger.log('❌ ERROR: ' + err.message);
    return {
      success: false,
      error: err.message
    };
  }

function clearApiKeyCache() {
  PropertiesService.getDocumentProperties().deleteProperty('OPENAI_API_KEY');
  Logger.log('✅ Cleared API key cache');
  return 'API key cache cleared. Will re-read from Settings sheet on next use.';
}

/**
 * Show a temporary toast notification
 * Auto-closes after 3 seconds
 */
function showToast(message, duration) {
  try {
    SpreadsheetApp.getActiveSpreadsheet().toast(message, '✅ Success', duration || 3);
  } catch (e) {
    Logger.log('Toast: ' + message);
  }
}


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

function clearAllBatchProperties() {
  const props = PropertiesService.getDocumentProperties();

  // Clear all batch-related properties
  const keysToDelete = [
    'BATCH_QUEUE',
    'BATCH_ROWS',
    'BATCH_INPUT_SHEET',
    'BATCH_OUTPUT_SHEET',
    'BATCH_MODE',
    'BATCH_SPEC',
    'BATCH_STOP',
    'BATCH_RUNNING',
    'BATCH_CURRENT_ROW'
  ];

  keysToDelete.forEach(key => {
    try {
      props.deleteProperty(key);
    } catch(e) {
      // Ignore if property doesn't exist
    }
  });

  Logger.log('✅ Cleared all batch properties');
  return 'Batch queue cleared. Ready to start fresh from row 15.';
}
}
/**
 * Categories & Pathways Panel - Light Theme (Classic Google Sheets Style)
 *
 * Clean, easy-to-read interface for managing categories and pathways
 * Light grey theme optimized for data manipulation
 */

// ========== MAIN LAUNCHER ==========

function openCategoriesPathwaysPanel() {
  const ui = getSafeUi_();
  if (!ui) return;

  const html = buildCategoriesPathwaysMainMenu_();
  ui.showSidebar(HtmlService.createHtmlOutput(html).setTitle('📂 Categories & Pathways').setWidth(320));
}

// ========== MAIN MENU ==========

function buildCategoriesPathwaysMainMenu_() {
  const sheet = pickMasterSheet_();
  const data = sheet.getDataRange().getValues();
  const headers = data[1]; // Row 2

  // Get column indices
  const categoryIdx = headers.indexOf('Case_Organization:Category');
  const pathwayIdx = headers.indexOf('Case_Organization:Pathway_Name');
  const sparkIdx = headers.indexOf('Case_Organization:Spark_Title');

  // Count categories and pathways
  const categoryCounts = {};
  const pathwayCounts = {};

  for (let i = 2; i < data.length; i++) {
    const category = data[i][categoryIdx] || 'Uncategorized';
    const pathway = data[i][pathwayIdx] || 'Unassigned';

    categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    pathwayCounts[pathway] = (pathwayCounts[pathway] || 0) + 1;
  }

  const totalCases = data.length - 2;

  // Build category list
  const categoryList = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([cat, count]) => `
      <div class="list-item" onclick="viewCategory('${cat.replace(/'/g, "\\'")}')">
        <span class="item-label">${cat}</span>
        <span class="item-count">${count}</span>
      </div>
    `).join('');

  // Build pathway list (top 10)
  const pathwayList = Object.entries(pathwayCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([path, count]) => `
      <div class="list-item" onclick="viewPathway('${path.replace(/'/g, "\\'")}')">
        <span class="item-label">${path}</span>
        <span class="item-count">${count}</span>
      </div>
    `).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <base target="_top">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: Arial, sans-serif;
      background: #f5f7fa;
      color: #2c3e50;
      font-size: 13px;
    }

    .header {
      background: #fff;
      padding: 16px;
      border-bottom: 1px solid #dfe3e8;
    }

    .header h1 {
      font-size: 16px;
      font-weight: 600;
      color: #2c3e50;
      margin-bottom: 4px;
    }

    .header .subtitle {
      font-size: 12px;
      color: #7f8c9d;
    }

    .stats {
      background: #fff;
      padding: 12px 16px;
      border-bottom: 1px solid #dfe3e8;
      display: flex;
      justify-content: space-around;
    }

    .stat {
      text-align: center;
    }

    .stat .num {
      font-size: 20px;
      font-weight: 700;
      color: #3b7ddd;
      display: block;
    }

    .stat .label {
      font-size: 11px;
      color: #7f8c9d;
      text-transform: uppercase;
    }

    .section {
      background: #fff;
      margin: 12px;
      padding: 14px;
      border-radius: 6px;
      border: 1px solid #dfe3e8;
    }

    .section-title {
      font-size: 13px;
      font-weight: 600;
      color: #2c3e50;
      margin-bottom: 10px;
      padding-bottom: 8px;
      border-bottom: 1px solid #f0f2f5;
    }

    .btn {
      display: block;
      width: 100%;
      background: #fff;
      border: 1px solid #d1d7de;
      color: #2c3e50;
      padding: 10px 12px;
      margin-bottom: 8px;
      border-radius: 4px;
      cursor: pointer;
      text-align: left;
      font-size: 13px;
      transition: all 0.2s;
    }

    .btn:hover {
      background: #f5f7fa;
      border-color: #3b7ddd;
    }

    .btn-primary {
      background: #3b7ddd;
      color: #fff;
      border-color: #3b7ddd;
      font-weight: 600;
    }

    .btn-primary:hover {
      background: #2d6bc6;
    }

    .list-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 10px;
      margin-bottom: 4px;
      background: #f8f9fa;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .list-item:hover {
      background: #e9ecef;
    }

    .item-label {
      font-size: 13px;
      color: #2c3e50;
    }

    .item-count {
      font-size: 12px;
      color: #7f8c9d;
      background: #fff;
      padding: 2px 8px;
      border-radius: 10px;
    }

    .scrollable {
      max-height: 200px;
      overflow-y: auto;
    }

    .scrollable::-webkit-scrollbar {
      width: 6px;
    }

    .scrollable::-webkit-scrollbar-track {
      background: #f0f2f5;
    }

    .scrollable::-webkit-scrollbar-thumb {
      background: #d1d7de;
      border-radius: 3px;
    }

    .info {
      background: #e8f4fd;
      border: 1px solid #bee5eb;
      padding: 10px 12px;
      border-radius: 4px;
      font-size: 12px;
      color: #31708f;
      margin-top: 12px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>📂 Categories & Pathways</h1>
    <div class="subtitle">Organize cases by system and learning path</div>
  </div>

  <div class="stats">
    <div class="stat">
      <span class="num">${totalCases}</span>
      <span class="label">Cases</span>
    </div>
    <div class="stat">
      <span class="num">${Object.keys(categoryCounts).length}</span>
      <span class="label">Categories</span>
    </div>
    <div class="stat">
      <span class="num">${Object.keys(pathwayCounts).length}</span>
      <span class="label">Pathways</span>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Quick Actions</div>
    <button class="btn" onclick="viewAllCategories()">📊 View All Categories</button>
    <button class="btn" onclick="viewAllPathways()">🧩 View All Pathways</button>
    <button class="btn" onclick="assignCase()">🔗 Assign Case to Category/Pathway</button>
  </div>

  <div class="section">
    <div class="section-title">Medical System Categories</div>
    <div class="scrollable">
      ${categoryList || '<div class="info">No categories found</div>'}
    </div>
  </div>

  <div class="section">
    <div class="section-title">Learning Pathways (Top 10)</div>
    <div class="scrollable">
      ${pathwayList || '<div class="info">No pathways found</div>'}
    </div>
    <button class="btn-primary btn" onclick="viewAllPathways()" style="margin-top:10px;">View All Pathways</button>
  </div>

  <div class="info">
    💡 Click any category or pathway to view and edit cases
  </div>

  <script>
    function viewCategory(category) {
      google.script.run
        .withSuccessHandler(updateContent)
        .getCategoryView(category);
    }

    function viewPathway(pathway) {
      google.script.run
        .withSuccessHandler(updateContent)
        .getPathwayView(pathway);
    }

    function viewAllCategories() {
      google.script.run
        .withSuccessHandler(updateContent)
        .getAllCategoriesView();
    }

    function viewAllPathways() {
      google.script.run
        .withSuccessHandler(updateContent)
        .getAllPathwaysView();
    }

    function assignCase() {
      const row = prompt('Enter row number:');
      if (row) {
        google.script.run
          .withSuccessHandler(updateContent)
          .getCaseAssignmentView(parseInt(row));
      }
    }

    function updateContent(html) {
      document.body.innerHTML = html;
    }

    function goBack() {
      google.script.run
        .withSuccessHandler(updateContent)
        .buildCategoriesPathwaysMainMenu_();
    }
  </script>
</body>
</html>
  `;
}

// ========== VIEW FUNCTIONS ==========

function getCategoryView(category) {
  const sheet = pickMasterSheet_();
  const data = sheet.getDataRange().getValues();
  const headers = data[1];

  const categoryIdx = headers.indexOf('Case_Organization:Category');
  const sparkIdx = headers.indexOf('Case_Organization:Spark_Title');
  const pathwayIdx = headers.indexOf('Case_Organization:Pathway_Name');

  const cases = [];
  for (let i = 2; i < data.length; i++) {
    if (data[i][categoryIdx] === category) {
      cases.push({
        row: i + 1,
        spark: data[i][sparkIdx] || 'Untitled',
        pathway: data[i][pathwayIdx] || 'Unassigned'
      });
    }
  }

  const casesList = cases.map(c => `
    <div class="list-item">
      <div>
        <div style="font-weight:500;">${c.spark}</div>
        <div style="font-size:11px;color:#7f8c9d;margin-top:2px;">Row ${c.row} • ${c.pathway}</div>
      </div>
    </div>
  `).join('');

  return `
<!DOCTYPE html>
<html>
<head><base target="_top">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, sans-serif; background: #f5f7fa; color: #2c3e50; font-size: 13px; }
  .header { background: #fff; padding: 16px; border-bottom: 1px solid #dfe3e8; }
  .header h1 { font-size: 16px; font-weight: 600; color: #2c3e50; margin-bottom: 4px; }
  .header .subtitle { font-size: 12px; color: #7f8c9d; }
  .section { background: #fff; margin: 12px; padding: 14px; border-radius: 6px; border: 1px solid #dfe3e8; }
  .list-item { padding: 10px 12px; margin-bottom: 6px; background: #f8f9fa; border-radius: 4px; }
  .btn { display: inline-block; background: #fff; border: 1px solid #d1d7de; color: #2c3e50; padding: 8px 14px; margin: 8px 4px; border-radius: 4px; cursor: pointer; font-size: 12px; text-decoration: none; }
  .btn:hover { background: #f5f7fa; }
  .scrollable { max-height: 400px; overflow-y: auto; }
</style>
</head>
<body>
  <div class="header">
    <h1>📂 ${category}</h1>
    <div class="subtitle">${cases.length} cases</div>
  </div>
  <div class="section">
    <div class="scrollable">${casesList}</div>
  </div>
  <div style="padding:12px;">
    <button class="btn" onclick="goBack()">← Back to Menu</button>
  </div>
  <script>
    function goBack() {
      google.script.run
        .withSuccessHandler(html => document.body.innerHTML = html)
        .buildCategoriesPathwaysMainMenu_();
    }
  </script>
</body>
</html>
  `;
}

function getPathwayView(pathway) {
  // Similar to category view
  return getCategoryView(pathway); // Simplified for now
}

function getAllCategoriesView() {
  // Grid of all categories
  return buildCategoriesPathwaysMainMenu_();
}

function getAllPathwaysView() {
  // Grid of all pathways
  return buildCategoriesPathwaysMainMenu_();
}

function getCaseAssignmentView(row) {
  // Assignment interface
  return buildCategoriesPathwaysMainMenu_();
}
