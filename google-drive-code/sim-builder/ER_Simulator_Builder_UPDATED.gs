while i'm at it.. considering the scope of this project and where it will be headed, can you give me a list of potential api's you think we might possibly use?

/******************************************************
 * ER_Simulator_Builder.gs — FULL UNIFIED MASTER FILE
 * v3.7.1 (Dark UI + Universal Waveform Naming)
 *
 * ✅ UPDATED: Universal waveform naming standard (_ecg suffix)
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

const DEFAULT_MODEL = 'gpt-4o-mini';
const DEFAULT_PRICE = { input: 0.15, output: 0.60 }; // USD / 1k tokens
const DEFAULT_TEMP_SINGLE = 0.7;
const DEFAULT_TEMP_BATCH  = 0.5; // more schema-sticky
const MAX_TOKENS = 3000;

// Two-tier vitals fields to compactify if needed
const VITAL_KEYS = [
  'Monitor_Vital_Signs:Initial_Vitals',
  'Monitor_Vital_Signs:State1_Vitals',
  'Monitor_Vital_Signs:State2_Vitals',
  'Monitor_Vital_Signs:State3_Vitals',
  'Monitor_Vital_Signs:State4_Vitals',
  'Monitor_Vital_Signs:State5_Vitals'
];

// 🌐 UNIVERSAL WAVEFORM NAMING STANDARD
// All waveform identifiers MUST use the {waveform}_ecg suffix pattern.
// This ensures consistency across: SVG files, waveforms.js registry, Monitor.js, Google Sheets, Apps Script
// Examples: 'sinus_ecg', 'afib_ecg', 'vfib_ecg', 'vtach_ecg', 'asystole_ecg'
// ❌ DO NOT use: 'sinus', 'afib', 'vfib' (missing suffix)
// ✅ ALWAYS use: 'sinus_ecg', 'afib_ecg', 'vfib_ecg' (with suffix)
const VALID_WAVEFORMS = [
  'sinus_ecg',
  'sinus_brady_ecg',
  'sinus_tachy_ecg',
  'afib_ecg',
  'aflutter_ecg',
  'vfib_ecg',
  'vtach_ecg',
  'svt_ecg',
  'asystole_ecg',
  'pea_ecg',
  'artifact_ecg'
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
  // If a row's filled ratio is below this, it's considered low value
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
    { re: /Case_Organization:Spark_Title/i,  msg: 'Add a Spark Title: "<Symptom> (<Age Sex>): <Spark phrase>".' },
    { re: /Monitor_Vital_Signs:Initial_Vitals/i, msg: 'Provide Initial Vitals in compact JSON: {"HR":..,"BP":"..","RR":..,"Temp":..,"SpO2":..,"waveform":"sinus_ecg"}.' },
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

  // Vitals sanity (compact JSON) + waveform validation
  const ivKey = mergedKeys.find(k=>/Monitor_Vital_Signs:Initial_Vitals/i.test(k));
  if (ivKey) {
    const raw = v(ivKey);
    if (raw && raw !== 'N/A') {
      try {
        const obj = JSON.parse(raw);
        if (!('HR' in obj) || !('BP' in obj)) {
          missingMsgs.push('Initial Vitals should include HR and BP at minimum.');
        }
        // 🌐 Validate waveform field uses _ecg suffix
        if ('waveform' in obj) {
          const wf = obj.waveform;
          if (!wf.endsWith('_ecg')) {
            missingMsgs.push(`Waveform "${wf}" must use _ecg suffix (e.g., "sinus_ecg", "afib_ecg", "vfib_ecg").`);
          }
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

// Write quality fields into rowValues array in-place. If columns missing, they're created.
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
  if (!sheet) { SpreadsheetApp.getUi().alert('❌ Could not find your Master Scenario CSV sheet.'); return; }

  const ui = SpreadsheetApp.getUi();
  const resp = ui.prompt(
    'Quality Audit',
    'Leave blank to audit ALL rows, or enter rows like "4,7,9-12".',
    ui.ButtonSet.OK_CANCEL
  );
  if (resp.getSelectedButton() !== ui.Button.OK) return;

  const spec = resp.getResponseText().trim();
  const rows = spec ? parseRowSpec_(spec) : null;

  const { header1, header2 } = getCachedHeadersOrRead(sheet);
  const mergedKeys = header1.map((t1,i)=>`${t1}:${t2[i]}`);
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

  ui.alert(`✅ Quality Audit complete. Updated ${updated} row(s).`);
}

// Clean up N/A-heavy rows: choose Highlight or Delete
function cleanUpLowValueRows() {
  const ss = SpreadsheetApp.getActive();
  const sheet = pickMasterSheet_();
  if (!sheet) { SpreadsheetApp.getUi().alert('❌ Could not find your Master Scenario CSV sheet.'); return; }

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
    SpreadsheetApp.getUi().alert('✅ No low-value rows found.');
    return;
  }

  const ui = SpreadsheetApp.getUi();
  const choice = ui.prompt(
    `Found ${lowRows.length} low-value rows. Type "H" to highlight or "D" to delete them.`,
    ui.ButtonSet.OK_CANCEL
  );
  if (choice.getSelectedButton() !== ui.Button.OK) return;
  const opt = (choice.getResponseText()||'').trim().toUpperCase();

  if (opt === 'D') {
    // Delete bottom-up
    lowRows.reverse().forEach(r => sheet.deleteRow(r));
    ui.alert(`🧹 Deleted ${lowRows.length} row(s).`);
  } else {
    // Highlight only
    lowRows.forEach(r => sheet.getRange(r,1,1,sheet.getLastColumn()).setBackground('#2b1d1d'));
    ui.alert(`🟧 Highlighted ${lowRows.length} row(s).`);
  }
}


function getProp(key, fallback) {
  const v = PropertiesService.getScriptProperties().getProperty(key);
  return (v === null || v === undefined) ? fallback : v;
}
function setProp(key, val) {
  PropertiesService.getScriptProperties().setProperty(key, val);
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
 * 🌐 UPDATED: Validates waveform field uses _ecg suffix
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
          if (parsed) {
            parsedOutput[h] = parsed;
            // 🌐 Validate waveform field
            if (parsed.waveform && !parsed.waveform.endsWith('_ecg')) {
              warnings.push(`⚠️ ${h}.waveform "${parsed.waveform}" should use _ecg suffix (e.g., "sinus_ecg").`);
            }
          }
          else warnings.push(`⚠️ ${h} field not valid JSON.`);
        }
        // If it's not an object after parse, warn
        else if (typeof value !== 'object') {
          warnings.push(`⚠️ ${h} field expected JSON object, got ${typeof value}.`);
        } else {
          // Validate waveform in object
          if (value.waveform && !value.waveform.endsWith('_ecg')) {
            warnings.push(`⚠️ ${h}.waveform "${value.waveform}" should use _ecg suffix (e.g., "sinus_ecg").`);
          }
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
  const apiKey = PropertiesService.getDocumentProperties().getProperty(SP_KEYS.API_KEY);
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

  try {
    return JSON.parse(raw);
  } catch (err) {
    Logger.log("⚠️ JSON parse error: " + err + "\nRaw AI output:\n" + raw);
    throw new Error("AI JSON parse fail.");
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
      if (k === 'OPENAI_API_KEY' && v) return v;
    }
    // Fallback: B2 if row1 has "API Key"
    const hA = String(sheet.getRange(1,1).getValue()||'').toLowerCase();
    const hB = String(sheet.getRange(1,2).getValue()||'').toLowerCase();
    if (hA.includes('api') || hB.includes('api')) {
      const maybe = String(sheet.getRange(2,2).getValue()||'').trim();
      if (maybe) return maybe;
    }
  } catch(e) {
    // ignore
  }
  return null;
}

// Reads API key priority:
// 1) Script Properties (saved via Settings panel / sidebar)
// 2) Settings sheet (if present)
// 3) Error
function readApiKey_() {
  let key = getProp(SP_KEYS.API_KEY, '').trim();
  if (key) return key;
  const fromSheet = syncApiKeyFromSettingsSheet_();
  if (fromSheet) {
    setProp(SP_KEYS.API_KEY, fromSheet);
    return fromSheet;
  }
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
    SpreadsheetApp.getUi().alert(ok ? '🛡️ API is reachable.' : '⚠️ API replied unexpectedly: ' + out);
  } catch (e) {
    SpreadsheetApp.getUi().alert('❌ API error: ' + e.message);
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
  PropertiesService.getScriptProperties().deleteProperty(SP_KEYS.HEADER_CACHE);
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


// ========== [Continue with rest of script - sidebar, batch engine, etc.] ==========
// ... (I'll continue in next message due to length)
