
/**
 * ATSR Title Generator Feature - Complete
 *
 * Everything for ATSR (Automated Titles, Summary & Review Generator):
 * - Complete ATSR UI with selection interface
 * - ALL GOLDEN PROMPTS PRESERVED CHARACTER-FOR-CHARACTER
 * - OpenAI API integration
 * - Response parsing and validation
 * - User selection and memory tracking
 *
 * Common Utility Goal: Adjust all ATSR features
 *
 * External Dependencies:
 * - Core_Processing_Engine.gs (for tryParseJSON)
 *
 * Generated: 2025-11-04T18:48:41.621Z
 * Source: Code_ULTIMATE_ATSR.gs (complete feature extraction)
 */

// ==================== ATSR FEATURE ====================

// Custom menu - unified Sim Builder
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  const menu = ui.createMenu('🧠 Sim Builder');

  // Core Tools
  menu.addItem('🎨 ATSR Titles Optimizer', 'runATSRTitleGenerator');
  menu.addItem('🧩 Categories & Pathways', 'runCategoriesPathwaysPanel');

  // Future tools
  menu.addSeparator();
  // menu.addItem('🚀 Batch Processing', 'openSimSidebar');

  menu.addToUi();
}

// ========== ATSR HELPER FUNCTIONS & CONSTANTS ==========

const SP_KEYS = {
  USED_MEMORY_ANCHORS: 'used_memory_anchors',
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

function getSafeUi_() {
  try {
    return SpreadsheetApp.getUi();
  } catch (e) {
    return null;
  }
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

function getProp(key, fallback) {
  const v = PropertiesService.getDocumentProperties().getProperty(key);
  return (v === null || v === undefined) ? fallback : v;
}

function setProp(key, val) {
  PropertiesService.getDocumentProperties().setProperty(key, val);
}

// Constants for OpenAI API
const DEFAULT_MODEL = 'gpt-4o';
const DEFAULT_TEMP_SINGLE = 0.7;
const MAX_TOKENS = 16000;

// API Key Management
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
  return null;
}

// OpenAI API Calls
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

  // Limit context to avoid token overflow
  const usedMemory = getProp(SP_KEYS.USED_MOTIFS,'').substring(0, 300);

  // Extract only essential fields for ATSR generation
  const age = data['Patient_Demographics_and_Clinical_Data_Age'] || '';
  const gender = data['Patient_Demographics_and_Clinical_Data_Gender'] || '';
  const presenting = data['Patient_Demographics_and_Clinical_Data_Presenting_Complaint'] || '';
  const vignette = data['Set_the_Stage_Context_Clinical_Vignette'] || '';
  const why = data['Set_the_Stage_Context_Why_It_Matters'] || '';
  const goal = data['Set_the_Stage_Context_Educational_Goal'] || '';

  const caseDataFormatted = `
Age: ${age}
Gender: ${gender}
Chief Complaint: ${presenting}
Clinical Vignette: ${vignette}
Educational Goal: ${goal}
Why It Matters: ${why}`.trim();

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



### 3. **Memory Anchors** (10 unique, unforgettable patient identifiers)

**Purpose**: Help clinicians remember patients the way ED doctors naturally do - by distinctive, memorable details.

**Philosophy**: ED doctors don't remember patients by medical details. They remember:
- "The tall skinny guy in overalls"
- "Lady who doesn't like to shave her legs"
- "SVT patient who's actually the sleep medicine doctor at our hospital"
- "Methadone patient with facial tattoos"
- "Kind lady holding a book"
- "Pleasant spouse who stood when I came in"

**Memory Anchor Categories & Examples**:

**A) Visual Appearance**:
- Very sweaty face, pale complexion
- Faded grey shirt with coffee stain
- Unkempt appearance with bag of clothes
- Unusual hair color/style
- Distinctive facial features
- Visible tattoos (location/theme)
- Piercings or jewelry

**B) Apparel & Accessories**:
- AC/DC "Thunderstruck" concert t-shirt
- BYU baseball cap (clearly a die-hard fan)
- Sports team jersey (Lakers, Yankees, etc.)
- Medical scrubs (works in healthcare)
- Business suit (professional)
- Vintage band t-shirt
- Designer purse/bag
- Small dog in carrier

**C) Olfactory (Smell)**:
- Pungent body odor
- Heavy perfume/cologne
- Cigarette smoke smell
- Alcohol on breath
- Fresh coffee smell

**D) Behavioral/Personality**:
- Annoyingly loud 3-year-old screaming in corner
- Quiet and withdrawn, avoiding eye contact
- Extremely talkative
- Constantly on phone
- Reading a specific book
- Doing crossword puzzle
- Nervous hand-wringing

**E) Family/Social Context**:
- Twin kids with patient
- Huge family of 8 in the room
- Daughter is an ER nurse (specify specialty)
- Son translating (language barrier)
- Service dog present
- Worried spouse holding hand
- Teenager rolling eyes

**F) Occupation Clues**:
- Carpenter (sawdust on clothes)
- Teacher (grading papers)
- Chef (kitchen burns on hands)
- Nurse (works at same hospital)
- Construction worker (hard hat)

**G) Contextual/Situational**:
- Came directly from gym
- Still in pajamas at 3pm
- Wearing hiking gear
- Wedding ring tan line (divorced)
- Military uniform/veteran

**Rules for Memory Anchors**:
1. **Highly specific**: "BYU baseball cap" not "wearing a hat"
2. **Memorable**: Strong visual/sensory detail
3. **Diverse**: Mix categories (visual, smell, behavior, context)
4. **Stereotype-aware**: Use stereotypes clinicians naturally use (tall, unkempt, loud, etc.)
5. **Personality-focused**: Adds human dimension to medical encounter
6. **Personality-rich**: Kind, pleasant, annoying, withdrawn, talkative
7. **Unique per patient**: NO reuse of anchors across cases
8. **Culturally varied**: Different ethnicities, backgrounds, professions
9. **Medically neutral**: NOT about the diagnosis itself
10. **Unforgettable**: Would make you say "Oh yeah, I remember that patient!"

**Examples of STRONG Memory Anchors**:
✅ "Very sweaty face, pale complexion, looks terrified"
✅ "Wearing AC/DC 'Thunderstruck' concert t-shirt, vintage 1990"
✅ "Annoyingly loud 3-year-old screaming in corner (mom looks exhausted)"
✅ "Pleasant elderly man who stood up to shake my hand with firm grip"
✅ "Strong smell of cigarette smoke, yellow-stained fingers, smoker's voice"
✅ "Daughter is an ICU nurse at University Hospital (asking detailed questions)"
✅ "Huge family of 8 people crowding tiny room (all talking at once)"
✅ "Small yappy Chihuahua in designer Louis Vuitton purse (won't stop barking)"
✅ "Wearing faded grey 'World's Best Grandpa' shirt with coffee stain"
✅ "BYU baseball cap (clearly die-hard fan, keeps talking about last game)"

**Examples of WEAK Memory Anchors** (avoid these):
❌ "Middle-aged male"
❌ "Overweight"
❌ "Has diabetes"
❌ "Chest pain patient"
❌ "Anxious"

**Output Format**:
Provide 10 Memory Anchors that:
- Are ALL different categories/types
- Are ALL unforgettable
- Are ALL specific and vivid
- Avoid reusing any motifs from: ${usedMemory}
- Create unique, case-appropriate memory anchors based on the case data above

**Quality Check**:
- Would an ED doctor remember this patient by this detail? ✅
- Is it vivid enough to picture in your mind? ✅
- Is it different from the other 9 anchors? ✅
- Does it add personality to the encounter? ✅

---
### 4. **Case Summary** (Structured narrative)
**Purpose**: Concise, compelling summary that sells the value and humanizes the patient

**Components**:

**A) Patient_Summary** (3 sentences - CLINICAL HANDOFF STYLE):
- Write like an ED doctor admitting to a hospitalist
- GET TO THE POINT - diagnosis, presentation, key findings, disposition
- NO mystery, NO drama - just the clinical facts
- Include: chief complaint, vitals/exam findings, workup/diagnosis, management/disposition

**Examples**:
✅ "55M presents with acute substernal chest pain while shoveling snow. EKG shows STEMI, troponin elevated. Cath lab activated, given aspirin/heparin, admitted to CCU."
✅ "8M with anaphylaxis after peanut exposure at birthday party. Presented with facial swelling, stridor, hypotension. IM epi given x2, improved, admitted for observation."
✅ "72F fell at home, hip pain, unable to bear weight. X-ray confirms femoral neck fracture. Orthopedics consulted, scheduled for ORIF in AM."

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

**Case Data** (Header: Value pairs from Google Sheet):
${caseDataFormatted}

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
  "Memory_Anchors": [
    "Unforgettable patient detail #1",
    "Unforgettable patient detail #2",
    "Unforgettable patient detail #3",
    "Unforgettable patient detail #4",
    "Unforgettable patient detail #5",
    "Unforgettable patient detail #6",
    "Unforgettable patient detail #7",
    "Unforgettable patient detail #8",
    "Unforgettable patient detail #9",
    "Unforgettable patient detail #10"
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

  Logger.log('📊 Prompt length: ' + prompt.length + ' characters');
  Logger.log('📊 Case data length: ' + caseDataFormatted.length + ' characters');

  const ai = callOpenAI(prompt, 0.7); // Temperature 0.7 for creative but consistent output
  Logger.log('📝 AI response length: ' + ai.length + ' characters');
  Logger.log('📝 AI response preview: ' + ai.substring(0, 500));

  const parsed = parseATSRResponse_(ai);
  if (!parsed) {
    Logger.log('❌ Failed to parse AI response');
    ui.alert('⚠️ ATSR parse error:\n'+ai.substring(0, 1000));
    return;
  }

  Logger.log('✅ Parsed keys: ' + Object.keys(parsed).join(', '));

  const html = buildATSRUltimateUI_(row, parsed, keepSelections, data);
  ui.showModalDialog(HtmlService.createHtmlOutput(html).setWidth(1920).setHeight(1000), '🎨 ATSR Titles Optimizer (v2 - TEST)');
}



// ATSR-specific JSON parser that handles markdown code fences
function parseATSRResponse_(text) {
  if (!text) return null;

  // Strip markdown code fences if present
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/,'');
  }

  try { return JSON.parse(cleaned); } catch(e) {
    const m = cleaned.match(/\{[\s\S]*\}/);
    if (m) { try { return JSON.parse(m[0]); } catch(_) {} }
    return null;
  }
}





function buildATSRUltimateUI_(row, parsed, keepSelections, data) {
  // Helper: Create editable radio options with text input + show current value first
  const makeEditable = (vals, name, label, currentValue, showMysteryButton = false) => `
    <div class="section">
      <div class="section-header">
        <h3>${label}</h3>
        ${showMysteryButton ? `
        <button class="btn-mystery" onclick="regenerateMoreMysterious()" title="Generate even more mysterious titles that hide the diagnosis">
          🎭 Make More Mysterious
        </button>
        ` : ''}
      </div>
      <div class="options">
        ${currentValue ? `
        <div class="option-row">
          <input type="radio" name="${name}" value="current" id="${name}_current" checked>
          <input type="text" id="${name}_text_current" value="${String(currentValue).replace(/"/g,'&quot;')}" class="edit-field">
        </div>
        <div class="current-label">
          <em>No change, keep current version</em>
        </div>
        ` : ''}
        ${vals.map((v,i)=>`
          <div class="option-row">
            <input type="radio" name="${name}" value="${i}" id="${name}_${i}">
            <input type="text" id="${name}_text_${i}" value="${String(v).replace(/"/g,'&quot;')}" class="edit-field">
          </div>
        `).join('')}
      </div>
    </div>
  `;

  const ps = parsed.Case_Summary?.Patient_Summary || 'A patient was evaluated and managed for an acute condition requiring urgent care.';
  const ki = parsed.Case_Summary?.Key_Intervention || 'N/A';
  const ct = parsed.Case_Summary?.Core_Takeaway || 'N/A';

  // Extract diagnosis from Reveal_Title (before the colon)
  let diagnosis = 'Diagnosis Unknown';
  const revealTitle = data['Case_Organization_Reveal_Title'];
  if (revealTitle) {
    // Format: "Severe Asthma Exacerbation (8 M): Swift Action Required"
    // Extract: "Severe Asthma Exacerbation"
    const match = revealTitle.match(/^([^(]+)/);
    if (match) {
      diagnosis = match[1].trim();
    }
  }

  // Create specific learning outcome from diagnosis and key intervention
  const learningOutcome = ki !== 'N/A'
    ? `Master ${ki.toLowerCase()} as critical decision for ${diagnosis.toLowerCase()}`
    : `Master rapid recognition and treatment of ${diagnosis.toLowerCase()}`;

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <!-- Cache bust: v7_demographic_format_${Date.now()} -->
    <style>
      * { box-sizing: border-box; }
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
        margin: 0;
        background: #f5f7fa;
        color: #2c3e50;
        font-size: 14px;
      }
      .container {
        padding: 6px 16px 10px 16px;
        max-width: 1900px;
        margin: 0 auto;
      }
      .summary-card {
        background: #ffffff;
        border: 1px solid #cbd5e0;
        border-radius: 6px;
        padding: 8px 12px;
        margin-bottom: 6px;
        box-shadow: none;
        max-width: 700px;
      }
      .summary-card h2 {
        margin: 0 0 4px 0;
        font-size: 15px;
        color: #1a202c;
        font-weight: 600;
      }
      .summary-text {
        font-size: 13px;
        line-height: 1.4;
        color: #2d3748;
        margin-bottom: 6px;
      }
      .summary-details {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
        padding: 6px 8px;
        background: #f7fafc;
        border-radius: 4px;
        border-left: 3px solid #3b82f6;
      }
      .detail-item {
        font-size: 11px;
      }
      .detail-item strong {
        color: #1a202c;
        display: block;
        margin-bottom: 2px;
      }
      .grid-3 {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 8px;
        margin-bottom: 8px;
        align-items: start;
      }
      .section {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 4px;
        padding: 6px;
        height: 100%;
      }
      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 4px;
        padding-bottom: 3px;
        border-bottom: 1px solid #e2e8f0;
      }
      .section h3 {
        margin: 0;
        font-size: 13px;
        font-weight: 600;
        color: #1a202c;
      }
      .btn-mystery {
        padding: 4px 8px;
        font-size: 10px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-weight: 600;
        transition: all 0.2s;
        box-shadow: 0 2px 4px rgba(102, 126, 234, 0.3);
      }
      .btn-mystery:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 8px rgba(102, 126, 234, 0.4);
        background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
      }
      .btn-mystery:active {
        transform: translateY(0);
      }
      .options {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .option-row {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 1px 2px;
        border-radius: 2px;
        transition: background 0.2s;
      }
      .option-row:hover {
        background: #f7fafc;
      }
      .option-row.no-change {
        margin-top: 2px;
        padding-top: 3px;
        border-top: 1px solid #e2e8f0;
      }
      .option-row input[type="radio"] {
        flex-shrink: 0;
        width: 14px;
        height: 14px;
        cursor: pointer;
      }
      .edit-field {
        flex: 1;
        padding: 4px 6px;
        border: 1px solid #e2e8f0;
        border-radius: 3px;
        font-size: 13px;
        background: #ffffff;
        color: #2c3e50;
        transition: border-color 0.2s;
        word-wrap: break-word;
        white-space: normal;
        overflow-wrap: break-word;
        min-height: 24px;
        line-height: 1.3;
      }
      .edit-field:focus {
        outline: none;
        border-color: #3b82f6;
      }
      .current-label {
        padding: 2px 0 4px 18px;
        font-size: 11px;
        color: #64748b;
        font-style: italic;
      }
      .actions {
        background: #ffffff;
        border: 1px solid #cbd5e0;
        border-radius: 8px;
        padding: 20px;
        display: flex;
        gap: 12px;
        justify-content: center;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      }
      button {
        padding: 12px 24px;
        border: none;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
      }
      .btn-primary {
        background: #3b82f6;
        color: white;
      }
      .btn-primary:hover {
        background: #2563eb;
        transform: translateY(-1px);
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      }
      .btn-secondary {
        background: #10b981;
        color: white;
      }
      .btn-secondary:hover {
        background: #059669;
        transform: translateY(-1px);
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      }
      .btn-tertiary {
        background: #6366f1;
        color: white;
      }
      .btn-tertiary:hover {
        background: #4f46e5;
        transform: translateY(-1px);
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      }
      .btn-close {
        background: #e2e8f0;
        color: #475569;
      }
      .btn-close:hover {
        background: #cbd5e0;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="summary-card">
        <div style="margin-bottom: 4px; font-size: 13px; color: #64748b; font-weight: 500;">Case Summary:</div>
        <div style="font-size: 26px; font-weight: 700; color: #1a202c; margin-bottom: 16px; line-height: 1.2;">${diagnosis}</div>
        <ul style="list-style-type: disc; margin: 0; padding-left: 20px; line-height: 1.7;">
          <li style="margin-bottom: 10px; color: #2d3748; font-size: 14px;">${ps}</li>
          <li style="color: #2d3748; font-size: 14px; font-weight: 600;"><strong>Learning Objective:</strong> ${learningOutcome}</li>
        </ul>
      </div>

      <div class="grid-3">
        ${makeEditable(parsed.Spark_Titles||[], 'spark', '🔥 Spark Titles (Pre-Sim Mystery)', data['Case_Organization_Spark_Title'], true)}
        ${makeEditable(parsed.Reveal_Titles||[], 'reveal', '💎 Reveal Titles (Post-Sim Learning)', data['Case_Organization_Reveal_Title'])}
        ${makeEditable(parsed.Memory_Anchors||[], 'anchor', '🎭 Memory Anchors (Unforgettable Patient Details)', data['Case_Organization_Memory_Anchor'])}
      </div>

      <div class="actions">
        <button class="btn-primary" onclick="apply(false)">✅ Save & Close</button>
        <button class="btn-secondary" onclick="apply(true)">⏭️ Save & Continue</button>
        <button class="btn-tertiary" onclick="keepRegen()">🔁 Keep & Regenerate</button>
        <button class="btn-close" onclick="google.script.host.close()">❌ Close</button>
      </div>
    </div>

    <script>
      function getTxt(name) {
        const selected = document.querySelector('input[name="'+name+'"]:checked');
        if (!selected || selected.value === 'nochange') return 'nochange';
        const idx = selected.value;
        const textField = document.getElementById(name+'_text_'+idx);
        return textField ? textField.value : 'nochange';
      }

      function apply(continueNext) {
        const data = {
          spark: getTxt('spark'),
          reveal: getTxt('reveal'),
          anchor: getTxt('anchor'),
          continueNext: continueNext
        };
        google.script.run
          .withSuccessHandler(()=>{
            if(continueNext) {
              google.script.run.runATSRTitleGenerator(${row+1}, true);
            } else {
              google.script.host.close();
            }
          })
          .saveATSRData(${row}, data);
      }

      function keepRegen() {
        google.script.host.close();
        google.script.run.runATSRTitleGenerator(${row}, true);
      }

      let mysteryLevel = 1; // Track how mysterious we're getting

      function regenerateMoreMysterious() {
        // Show loading state
        const btn = event.target;
        const originalText = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '🔄 Level ' + mysteryLevel + '...';

        // Collect current titles from the text inputs
        const sparkContainer = document.querySelector('[name="spark"]').closest('.section').querySelector('.options');
        const textInputs = sparkContainer.querySelectorAll('.edit-field');
        const currentTitles = Array.from(textInputs).map(input => input.value);

        google.script.run
          .withSuccessHandler((newTitles) => {
            // Replace the Spark Titles options with new ultra-mysterious ones
            const sparkContainer = document.querySelector('[name="spark"]').closest('.section').querySelector('.options');

            // Keep the current value option if it exists
            const currentOption = sparkContainer.querySelector('.option-row:first-child');
            const hasCurrentValue = currentOption && currentOption.querySelector('[id$="_current"]');

            // Build new options HTML
            let newHTML = '';
            if (hasCurrentValue) {
              newHTML += currentOption.outerHTML;
              newHTML += sparkContainer.querySelector('.current-label').outerHTML;
            }

            // Add new mysterious titles
            newTitles.forEach((title, i) => {
              newHTML += '<div class="option-row">' +
                '<input type="radio" name="spark" value="' + i + '" id="spark_' + i + '">' +
                '<input type="text" id="spark_text_' + i + '" value="' + title.replace(/"/g,'&quot;') + '" class="edit-field">' +
                '</div>';
            });

            sparkContainer.innerHTML = newHTML;

            // Increment mystery level for next click
            mysteryLevel++;

            // Update button text to show we're going deeper
            const levelEmojis = ['🎭', '🕵️', '❓', '🌫️', '👻'];
            const emoji = levelEmojis[Math.min(mysteryLevel - 1, levelEmojis.length - 1)];
            btn.innerHTML = emoji + ' Even More Mysterious';
            btn.disabled = false;
          })
          .withFailureHandler((error) => {
            alert('Error generating mysterious titles: ' + error);
            btn.disabled = false;
            btn.innerHTML = originalText;
          })
          .generateMysteriousSparkTitles(${row}, mysteryLevel, currentTitles);
      }
    </script>
  </body>
  </html>
  `;
}



// Generate ultra-mysterious Spark Titles that completely hide the diagnosis
function generateMysteriousSparkTitles(row, mysteryLevel, currentTitles) {
  const s = pickMasterSheet_();
  const headers = s.getRange(2,1,1,s.getLastColumn()).getValues()[0];
  const rowData = s.getRange(row, 1, 1, headers.length).getValues()[0];

  // Build data object
  const data = {};
  headers.forEach((h,i) => { data[h] = rowData[i]; });

  // Extract the diagnosis from Reveal Title
  const revealTitle = data['Case_Organization_Reveal_Title'] || '';
  const diagnosisMatch = revealTitle.match(/^([^(]+)/);
  const diagnosis = diagnosisMatch ? diagnosisMatch[1].trim() : 'Unknown';

  // Extract age/gender from current Spark Title (e.g., "Title (58 M): Description")
  const currentSparkTitle = data['Case_Organization_Spark_Title'] || '';
  const demographicMatch = currentSparkTitle.match(/\((\d+\s+[MF])\)/);
  const demographic = demographicMatch ? demographicMatch[1] : null;

  // Get patient summary
  const patientSummary = data['Case_Summary_Patient_Summary'] || 'A patient presents with concerning symptoms.';

  // Adjust mystery level instructions
  const level = mysteryLevel || 1;
  let mysteryInstructions = '';

  if (level === 1) {
    mysteryInstructions = '**MYSTERY LEVEL 1 (Moderate Mystery):**\n' +
      '- Use vague family observations\n' +
      '- Avoid medical terms but can hint at general concern\n' +
      '- Example: "Grandpa\'s Not Acting Right"\n\n';
  } else if (level === 2) {
    mysteryInstructions = '**MYSTERY LEVEL 2 (High Mystery):**\n' +
      '- Even more vague and indirect\n' +
      '- Focus on pure behavioral changes\n' +
      '- Example: "Something\'s Different Today"\n\n';
  } else if (level === 3) {
    mysteryInstructions = '**MYSTERY LEVEL 3 (Maximum Mystery):**\n' +
      '- Extremely vague, almost cryptic\n' +
      '- Pure emotion and concern only\n' +
      '- Example: "I\'m Worried"\n\n';
  } else {
    mysteryInstructions = '**MYSTERY LEVEL ' + level + ' (ULTRA Maximum):**\n' +
      '- Absolutely NO specifics whatsoever\n' +
      '- Pure gut feeling and unease\n' +
      '- Example: "Something\'s Not Right"\n\n';
  }

  // Build the prompt based on whether we have current titles to iterate on
  let prompt = '';

  if (currentTitles && currentTitles.length > 0) {
    // ITERATIVE MODE: Make existing titles MORE mysterious
    const formatInstruction = demographic
      ? '**FORMAT REQUIREMENT:**\nEach title MUST follow this exact format:\n"Title (' + demographic + '): Brief description"\n\nExample: "Grandpa\'s Not Acting Right (' + demographic + '): Family Concerned"\n\n'
      : '';

    prompt = 'You are making existing pre-simulation titles EVEN MORE MYSTERIOUS to completely hide the diagnosis.\n\n' +
      mysteryInstructions +
      '**YOUR TASK:**\n' +
      'Take each of these titles and make them MORE vague, MORE mysterious, and LESS revealing.\n' +
      'Remove any remaining hints about the condition. Make them more cryptic and indirect.\n' +
      'Keep the human context and emotional tone, but be even more subtle.\n\n' +
      '**Current Titles to Make More Mysterious:**\n' +
      JSON.stringify(currentTitles, null, 2) + '\n\n' +
      formatInstruction +
      '**Patient Context (to maintain relevance):**\n' +
      patientSummary + '\n\n' +
      '**Actual Diagnosis (HIDE THIS COMPLETELY):**\n' +
      diagnosis + '\n\n' +
      '**CRITICAL RULES:**\n' +
      '- NEVER mention the diagnosis (' + diagnosis + ')\n' +
      '- NEVER use medical terminology\n' +
      '- Remove any remaining clinical hints\n' +
      '- Make each title LESS specific than before\n' +
      '- Use even vaguer language\n' +
      '- Focus on pure emotion and concern\n' +
      '- Keep titles grounded in the patient context (age, setting, etc.)\n' +
      '- Maintain human perspective (family member, concerned observer)\n' +
      (demographic ? '- ALWAYS include (' + demographic + ') in each title\n' : '') +
      '\n' +
      'Return ONLY a JSON array of the same number of titles, now more mysterious:\n' +
      '["More mysterious version of title 1", "More mysterious version of title 2", ...]';
  } else {
    // INITIAL MODE: Generate from scratch
    const formatInstruction = demographic
      ? '**FORMAT REQUIREMENT:**\nEach title MUST follow this exact format:\n"Title (' + demographic + '): Brief description"\n\nExample: "Grandpa\'s Not Acting Right (' + demographic + '): Family Concerned"\n\n'
      : '';

    const exampleSuffix = demographic ? ' (' + demographic + ')' : '';

    prompt = 'You are creating ULTRA-MYSTERIOUS pre-simulation titles that COMPLETELY HIDE the diagnosis from learners.\n\n' +
      mysteryInstructions +
      formatInstruction +
      '**CRITICAL RULES:**\n' +
      '- NEVER mention the diagnosis (' + diagnosis + ')\n' +
      '- NEVER use medical terminology that reveals the condition\n' +
      '- NEVER hint at the organ system or pathophysiology\n' +
      '- Focus on vague, concerning observations\n' +
      '- Use layperson language and indirect descriptions\n' +
      '- Create curiosity and mystery without clinical clues\n' +
      (demographic ? '- ALWAYS include (' + demographic + ') in each title\n' : '') +
      '\n' +
      '**Patient Context:**\n' +
      patientSummary + '\n\n' +
      '**Actual Diagnosis (HIDE THIS COMPLETELY):**\n' +
      diagnosis + '\n\n' +
      '**Examples of Ultra-Mysterious Titles:**\n' +
      '- "Grandpa\'s Not Acting Right' + exampleSuffix + ': Family Concerned"\n' +
      '- "She Just Doesn\'t Look Right' + exampleSuffix + ': Something\'s Wrong"\n' +
      '- "Something\'s Off with Dad Today' + exampleSuffix + ': Can\'t Put My Finger on It"\n' +
      '- "The Kid Who Won\'t Stop Crying' + exampleSuffix + ': Parents Worried"\n' +
      '- "Mom Says He\'s Not Himself' + exampleSuffix + ': Acting Strange"\n\n' +
      '**Generate 5 ultra-mysterious Spark Titles that:**\n' +
      '1. Use concerned family member observations\n' +
      '2. Describe behavioral/emotional changes only\n' +
      '3. Avoid ANY medical symptoms or terms\n' +
      '4. Create urgency through human context\n' +
      '5. Make learners think "I need to assess this"\n' +
      (demographic ? '6. Include (' + demographic + ') in EVERY title\n' : '') +
      '\n' +
      'Return ONLY a JSON array of 5 title strings, no explanation:\n' +
      '["Title 1", "Title 2", "Title 3", "Title 4", "Title 5"]';
  }

  Logger.log('🎭 Generating ultra-mysterious Spark Titles (Level ' + level + ')');
  Logger.log('   For diagnosis: ' + diagnosis);
  if (currentTitles && currentTitles.length > 0) {
    Logger.log('   Iterating on ' + currentTitles.length + ' existing titles');
  } else {
    Logger.log('   Generating fresh titles from scratch');
  }

  const response = callOpenAI(prompt, 0.9); // High temperature for creativity
  Logger.log('📝 OpenAI response: ' + response);

  // Parse the JSON array
  const cleanResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const titles = JSON.parse(cleanResponse);

  Logger.log('✅ Generated ' + titles.length + ' mysterious titles');
  return titles;
}

// New save function that handles data from the UI
function saveATSRData(row, data) {
  const s = pickMasterSheet_();
  const headers = s.getRange(2,1,1,s.getLastColumn()).getValues()[0];

  const setVal = (key, val) => {
    if (!val || val==='nochange') return;
    const idx = headers.indexOf(key);
    if (idx<0) {
      Logger.log('⚠️ Column not found: ' + key);
      return;
    }
    const r = s.getRange(row, idx+1);
    r.setValue(val);
  };

  Logger.log('💾 Saving ATSR data for row ' + row);
  Logger.log('   Spark: ' + data.spark);
  Logger.log('   Reveal: ' + data.reveal);
  Logger.log('   Anchor: ' + data.anchor);

  setVal('Case_Organization_Spark_Title', data.spark);
  setVal('Case_Organization_Reveal_Title', data.reveal);
  setVal('Case_Organization_Memory_Anchor', data.anchor);

  SpreadsheetApp.getActive().toast('✅ ATSR saved successfully!');
}

// Legacy function kept for compatibility
function applyATSRSelectionsWithDefiningAndMemory(row, spark, reveal, caseID, define) {
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
  setVal('Patient_Descriptor', define, true);

  if (define && define!=='nochange') {
    const memKey = SP_KEYS.USED_MOTIFS;
    const prev = getProp(memKey,'');
    const motif = define.toLowerCase().split(' ').slice(0,3).join(' ');
    if (!prev.includes(motif)) setProp(memKey, prev ? (prev+', '+motif) : motif);
  }

  SpreadsheetApp.getActive().toast('✅ ATSR saved.');
}


// ==================== CATEGORIES & PATHWAYS FEATURE ====================


/**
 * Get AI-recommended fields based on pathway discovery potential
 * Asks OpenAI which fields would maximize clinical reasoning pathways
 * Only recommends from unselected fields (excludes currently selected)
 */
function getRecommendedFields_() {
  // Try to get AI recommendations, fall back to static if API unavailable
  try {
    const apiKey = readApiKey_();
    if (!apiKey) {
      Logger.log('⚠️ No API key - using static recommendations');
      return getStaticRecommendedFields_();
    }

    const availableFields = getAvailableFields();
    const currentlySelected = loadFieldSelection(); // Get saved or default fields

    // Filter to only unselected fields
    const unselectedFields = availableFields.filter(function(f) {
      return currentlySelected.indexOf(f.name) === -1;
    });

    const fieldDescriptions = unselectedFields.map(function(f) {
      return {
        name: f.name,
        header: f.header,
        category: f.tier1
      };
    });

    const prompt = 'You are a medical education expert analyzing which data fields would be most valuable for AI pathway discovery in emergency medicine simulation cases.\n\n' +
      'CURRENTLY SELECTED FIELDS (already chosen, DO NOT recommend these):\n' +
      JSON.stringify(currentlySelected, null, 2) + '\n\n' +
      'AVAILABLE UNSELECTED FIELDS (choose from these ONLY):\n' +
      JSON.stringify(fieldDescriptions, null, 2) + '\n\n' +
      'PATHWAY DISCOVERY GOALS:\n' +
      '- Clinical reasoning pathways (differential diagnosis, pattern recognition)\n' +
      '- Risk stratification pathways (high-risk → low-risk)\n' +
      '- Time-critical decision pathways (STEMI, stroke, sepsis)\n' +
      '- Cognitive bias awareness pathways (anchoring, premature closure)\n' +
      '- Skill progression pathways (novice → expert)\n' +
      '- Patient complexity pathways (single-system → multi-system)\n\n' +
      'TASK: From the UNSELECTED fields only, select 8-12 that would maximize pathway discovery potential.\n\n' +
      'PRIORITIZE fields that:\n' +
      '- Enable differential diagnosis logic\n' +
      '- Support risk stratification\n' +
      '- Reveal clinical reasoning patterns\n' +
      '- Identify time-critical cases\n' +
      '- Show patient complexity\n\n' +
      'IMPORTANT: Only recommend from UNSELECTED fields. Do NOT include any currently selected fields.\n\n' +
      'Return ONLY a JSON array of field names: ["fieldName1", "fieldName2", ...]';

    const url = 'https://api.openai.com/v1/chat/completions';
    const payload = {
      model: 'gpt-4o-mini',  // Fast and cheap for recommendations
      messages: [
        {
          role: 'system',
          content: 'You are an expert in medical education and clinical reasoning. Respond ONLY with valid JSON. NEVER recommend fields that are already selected.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,  // Low temperature for consistent recommendations
      max_tokens: 500
    };

    const response = UrlFetchApp.fetch(url, {
      method: 'post',
      headers: {
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });

    const responseCode = response.getResponseCode();
    if (responseCode !== 200) {
      Logger.log('⚠️ OpenAI API error: ' + responseCode + ' - using static recommendations');
      return getStaticRecommendedFields_();
    }

    const data = JSON.parse(response.getContentText());
    const aiResponse = data.choices[0].message.content.trim();

    // Extract JSON array from response
    const jsonMatch = aiResponse.match(/\[[\"\w\s,]+\]/);
    if (!jsonMatch) {
      Logger.log('⚠️ Could not parse AI response - using static recommendations');
      return getStaticRecommendedFields_();
    }

    const recommendedFields = JSON.parse(jsonMatch[0]);

    // Extra safety: Filter out any selected fields AI might have included
    const filteredRecommendations = recommendedFields.filter(function(field) {
      return currentlySelected.indexOf(field) === -1;
    });

    Logger.log('✅ AI recommended ' + filteredRecommendations.length + ' fields from unselected pool');
    Logger.log('   Fields: ' + filteredRecommendations.join(', '));

    return filteredRecommendations;
  } catch (e) {
    Logger.log('⚠️ Error getting AI recommendations: ' + e.message);
    return getStaticRecommendedFields_();
  }
}

/**
 * Static fallback recommendations (used when API unavailable)
 */
function getStaticRecommendedFields_() {
  // HIGH PRIORITY: Core clinical decision drivers
  const highPriority = [
    'diagnosticResults',   // Lab/imaging → confirms diagnosis
    'physicalExam',        // Detailed exam → refines differential
    'symptoms',            // Symptom details → pathway refinement
    'vitalSigns',          // Expanded vitals → trend analysis
    'socialHistory',       // Social context → discharge planning
    'familyHistory'        // Family Hx → risk factors
  ];

  // MEDIUM PRIORITY: Valuable contextual information
  const mediumPriority = [
    'proceduresPlan',      // Planned procedures → treatment path
    'labResults',          // Lab values → diagnostic confirmation
    'imagingResults',      // Imaging findings → visual confirmation
    'nursingNotes',        // Nursing observations → patient status
    'providerNotes'        // Provider documentation → decision rationale
  ];

  return [].concat(highPriority, mediumPriority);
}

/**
 * Load saved field selection from DocumentProperties
 * Returns saved array or defaults if none saved
 */
function loadFieldSelection() {
  const docProps = PropertiesService.getDocumentProperties();
  const saved = docProps.getProperty('SELECTED_CACHE_FIELDS');

  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      Logger.log('⚠️ Error parsing saved field selection: ' + e.message);
    }
  }

  // Return default 27 fields
  return getDefaultFieldNames_();
}

/**
 * Show dynamic field selector modal
 * Reads all available columns and lets user select which to cache
 */
function showFieldSelector() {
  // Get all available fields from spreadsheet
  // Ensure header cache is fresh before reading fields
  refreshHeaders();

  const availableFields = getAvailableFields();

  // Get saved selection or defaults
  const selectedFields = loadFieldSelection();

  // Group fields by Tier1 category
  const grouped = {};
  availableFields.forEach(function(field) {
    const category = field.tier1;
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(field);
  });

  // Sort fields within each category: three-tier system
  // Tier 1: Selected fields (top)
  // Tier 2: Recommended fields (middle)
  // Tier 3: All other fields (bottom)
  const recommendedFields = getRecommendedFields_();

  Object.keys(grouped).forEach(function(category) {
    grouped[category].sort(function(a, b) {
      const aSelected = selectedFields.indexOf(a.name) !== -1;
      const bSelected = selectedFields.indexOf(b.name) !== -1;
      const aRecommended = recommendedFields.indexOf(a.name) !== -1;
      const bRecommended = recommendedFields.indexOf(b.name) !== -1;

      // Tier 1: Selected fields come first
      if (aSelected && !bSelected) return -1;
      if (!aSelected && bSelected) return 1;

      // Tier 2: Among unselected, recommended fields come next
      if (!aSelected && !bSelected) {
        if (aRecommended && !bRecommended) return -1;
        if (!aRecommended && bRecommended) return 1;
      }

      // Within same tier, keep alphabetical order
      return a.name.localeCompare(b.name);
    });
  });

  // Build categories JSON for modal
  const categoriesJson = JSON.stringify(grouped);
  const selectedJson = JSON.stringify(selectedFields);
  const totalFields = availableFields.length;

  const html =
    '<!DOCTYPE html>' +
    '<html>' +
    '<head>' +
    '<style>' +
    'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; padding: 20px; background: #f5f5f5; margin: 0; }' +
    '.header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }' +
    '.header h2 { margin: 0 0 10px 0; }' +
    '.header p { margin: 0; opacity: 0.9; font-size: 14px; }' +
    '.categories-container { max-height: 500px; overflow-y: auto; padding-right: 10px; }' +
    '.category { background: white; border-radius: 8px; padding: 15px; margin-bottom: 15px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }' +
    '.category-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; padding-bottom: 10px; border-bottom: 2px solid #e0e0e0; }' +
    '.category-title { font-weight: bold; font-size: 16px; color: #333; }' +
    '.category-count { color: #667eea; font-size: 14px; margin-left: 8px; }' +
    '.category-actions button { font-size: 11px; padding: 4px 8px; margin-left: 5px; cursor: pointer; border: 1px solid #ddd; background: white; border-radius: 4px; }' +
    '.category-actions button:hover { background: #f0f0f0; }' +
    '.field-item { padding: 8px; margin: 5px 0; background: #f9f9f9; border-radius: 4px; display: flex; align-items: flex-start; }' +
    '.field-item:hover { background: #f0f0f0; }' +
    '.field-item input { margin-right: 10px; margin-top: 3px; cursor: pointer; }' +
    '.field-item label { cursor: pointer; flex: 1; font-size: 14px; }' +
    '.field-name { font-weight: 500; color: #333; }' +
    '.field-header { color: #666; font-size: 12px; display: block; margin-top: 2px; }' +
    '.footer { position: sticky; bottom: 0; background: white; padding: 15px 20px; border-top: 2px solid #e0e0e0; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 -2px 10px rgba(0,0,0,0.1); margin: 0 -20px -20px -20px; }' +
    '.field-count { font-weight: bold; color: #667eea; font-size: 16px; }' +
    '.btn-continue { background: linear-gradient(135deg, #667eea, #764ba2); color: white; border: none; padding: 12px 24px; border-radius: 6px; font-size: 16px; font-weight: bold; cursor: pointer; transition: all 0.2s; }' +
    '.btn-continue:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4); }' +
    '.btn-continue:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }' +
    '.btn-reset { background: white; color: #667eea; border: 2px solid #667eea; padding: 10px 20px; border-radius: 6px; font-size: 14px; font-weight: bold; cursor: pointer; transition: all 0.2s; margin-right: 10px; }' +
    '.btn-reset:hover { background: #f0f0ff; transform: translateY(-1px); }' +
    '</style>' +
    '</head>' +
    '<body>' +
    '<div class="header">' +
    '  <h2>🎯 Select Fields to Cache</h2>' +
    '  <p>Choose which fields the AI will analyze for pathway discovery</p>' +
    '</div>' +
    '<div class="categories-container" id="categories"></div>' +
    '<div class="footer">' +
    '  <span class="field-count" id="count">Loading...</span>' +
    '  <div style="display: flex; gap: 10px;"><button class="btn-reset" onclick="resetToDefault27()">🔄 Reset to Default 27</button><button class="btn-continue" onclick="continueToCache()">Continue to Cache →</button></div>' +
    '</div>' +
    '<script>' +
    'const categoriesData = ' + categoriesJson + ';' +
    'const selectedFields = ' + selectedJson + ';' +
    'const recommendedFieldNames = ' + JSON.stringify(getRecommendedFields_()) + ';' +
    'const totalFields = ' + totalFields + ';' +
    'function renderCategories() {' +
    '  const container = document.getElementById("categories");' +
    '  container.innerHTML = "";' +
    '  for (const [category, fields] of Object.entries(categoriesData)) {' +
    '    const categoryDiv = document.createElement("div");' +
    '    categoryDiv.className = "category";' +
    '    const headerDiv = document.createElement("div");' +
    '    headerDiv.className = "category-header";' +
    '    headerDiv.innerHTML = "<div><span class=\\"category-title\\">" + category + "</span><span class=\\"category-count\\">(" + fields.length + ")</span></div>";' +
    '    const actionsDiv = document.createElement("div");' +
    '    actionsDiv.className = "category-actions";' +
    '    const selectBtn = document.createElement("button");' +
    '    selectBtn.textContent = "Select All";' +
    '    selectBtn.onclick = function() { selectCategory(category, true); };' +
    '    const deselectBtn = document.createElement("button");' +
    '    deselectBtn.textContent = "Deselect All";' +
    '    deselectBtn.onclick = function() { selectCategory(category, false); };' +
    '    actionsDiv.appendChild(selectBtn);' +
    '    actionsDiv.appendChild(deselectBtn);' +
    '    headerDiv.appendChild(actionsDiv);' +
    '    categoryDiv.appendChild(headerDiv);' +
    '    let lastSection = null;' +
    '    fields.forEach((field, index) => {' +
    '      const isChecked = selectedFields.includes(field.name);' +
    '      const isRecommended = recommendedFieldNames.includes(field.name);' +
    '      ' +
    '      // Determine section: selected > recommended > other' +
    '      let currentSection = isChecked ? "selected" : (isRecommended ? "recommended" : "other");' +
    '      ' +
    '      // Insert section header if section changed' +
    '      if (currentSection !== lastSection) {' +
    '        const sectionDiv = document.createElement("div");' +
    '        sectionDiv.style.marginTop = lastSection ? "12px" : "5px";' +
    '        sectionDiv.style.marginBottom = "5px";' +
    '        sectionDiv.style.paddingTop = "5px";' +
    '        sectionDiv.style.paddingBottom = "3px";' +
    '        sectionDiv.style.borderTop = lastSection ? "1px solid #ddd" : "none";' +
    '        sectionDiv.style.fontWeight = "bold";' +
    '        sectionDiv.style.fontSize = "11px";' +
    '        sectionDiv.style.textTransform = "uppercase";' +
    '        sectionDiv.style.letterSpacing = "0.3px";' +
    '        ' +
    '        if (currentSection === "selected") {' +
    '          sectionDiv.style.color = "#4caf50";' +
    '          sectionDiv.innerHTML = "✅ Selected Fields";' +
    '        } else if (currentSection === "recommended") {' +
    '          sectionDiv.style.color = "#ff9800";' +
    '          sectionDiv.innerHTML = "💡 Recommended to Consider <span style=\\\"font-size: 10px; font-weight: normal; color: #888; text-transform: none;\\\">(AI suggests for pathway discovery)</span>";' +
    '        } else {' +
    '          sectionDiv.style.color = "#999";' +
    '          sectionDiv.innerHTML = "📋 All Other Fields";' +
    '        }' +
    '        ' +
    '        categoryDiv.appendChild(sectionDiv);' +
    '        lastSection = currentSection;' +
    '      }' +
    '      ' +
    '      const fieldDiv = document.createElement("div");' +
    '      fieldDiv.className = "field-item";' +
    '      const checkbox = document.createElement("input");' +
    '      checkbox.type = "checkbox";' +
    '      checkbox.id = field.name;' +
    '      checkbox.checked = isChecked;' +
    '      checkbox.onchange = updateCount;' +
    '      const label = document.createElement("label");' +
    '      label.htmlFor = field.name;' +
    '      label.innerHTML = "<span class=\\"field-name\\">" + field.name + "</span><span class=\\"field-header\\">→ " + field.header + "</span>";' +
    '      fieldDiv.appendChild(checkbox);' +
    '      fieldDiv.appendChild(label);' +
    '      categoryDiv.appendChild(fieldDiv);' +
    '    });' +
    '    container.appendChild(categoryDiv);' +
    '  }' +
    '  updateCount();' +
    '}' +
    'function selectCategory(category, select) {' +
    '  categoriesData[category].forEach(field => {' +
    '    const checkbox = document.getElementById(field.name);' +
    '    if (checkbox) checkbox.checked = select;' +
    '  });' +
    '  updateCount();' +
    '}' +
    'function updateCount() {' +
    '  let selected = 0;' +
    '  for (const fields of Object.values(categoriesData)) {' +
    '    fields.forEach(field => {' +
    '      const checkbox = document.getElementById(field.name);' +
    '      if (checkbox && checkbox.checked) selected++;' +
    '    });' +
    '  }' +
    '  document.getElementById("count").textContent = "Selected: " + selected + "/" + totalFields + " fields";' +
    '  document.querySelector(".btn-continue").disabled = selected === 0;' +
    '}' +
    'function resetToDefault27() {' +
    '  const defaultFields = ' + JSON.stringify(getDefaultFieldNames_()) + ';' +
    '  for (const fields of Object.values(categoriesData)) {' +
    '    fields.forEach(field => {' +
    '      const checkbox = document.getElementById(field.name);' +
    '      if (checkbox) {' +
    '        checkbox.checked = defaultFields.includes(field.name);' +
    '      }' +
    '    });' +
    '  }' +
    '  updateCount();' +
    '  alert("✅ Reset to original 27 default fields");' +
    '}' +
    'function continueToCache() {' +
    '  const selected = [];' +
    '  for (const fields of Object.values(categoriesData)) {' +
    '    fields.forEach(field => {' +
    '      const checkbox = document.getElementById(field.name);' +
    '      if (checkbox && checkbox.checked) {' +
    '        selected.push(field.name);' +
    '      }' +
    '    });' +
    '  }' +
    '  google.script.run' +
    '    .withSuccessHandler(function() {' +
    '      google.script.host.close();' +
    '    })' +
    '    .withFailureHandler(function(e) {' +
    '      alert("Error saving selection: " + e.message);' +
    '    })' +
    '    .saveFieldSelectionAndStartCache(selected);' +
    '}' +
    'renderCategories();' +
    '</script>' +
    '</body>' +
    '</html>';

  const htmlOutput = HtmlService.createHtmlOutput(html)
    .setWidth(800)
    .setHeight(700);
  SpreadsheetApp.getUi().showModalDialog(htmlOutput, '🎯 Select Fields to Cache');
}

/**
 * Save field selection and start cache
 * Called from field selector modal when user clicks Continue
 */
function saveFieldSelectionAndStartCache(selectedFields) {
  const docProps = PropertiesService.getDocumentProperties();
  docProps.setProperty('SELECTED_CACHE_FIELDS', JSON.stringify(selectedFields));

  Logger.log('✅ Saved field selection: ' + selectedFields.length + ' fields');
  Logger.log('Fields: ' + selectedFields.join(', '));

  // Start the cache process with selected fields
  preCacheRichDataAfterSelection();
}

// END DYNAMIC FIELD SELECTOR SYSTEM
// ═══════════════════════════════════════════════════════════════


/**
 * Pre-Cache Rich Data - Entry Point
 * Shows field selector modal FIRST, then starts cache with selected fields
 */
function preCacheRichData() {
  showFieldSelector();
}

function preCacheRichDataAfterSelection() {
  const html =
    '<!DOCTYPE html>' +
    '<html>' +
    '<head>' +
    '<style>' +
    'body { font-family: monospace; padding: 20px; background: #1a1a1a; color: #00ff00; }' +
    'button { padding: 10px 20px; margin: 10px; font-size: 16px; cursor: pointer; }' +
    '#status { margin: 20px 0; padding: 10px; background: #000; border: 1px solid #00ff00; }' +
    '</style>' +
    '</head>' +
    '<body>' +
    '<h3>🧪 Test Modal</h3>' +
    '<div id="status">Ready to test...</div>' +
    '<button onclick="testHello()">Test Hello</button>' +
    '<button onclick="startCache()">Start Cache</button>' +
    '<script>' +
    'function testHello() {' +
    '  document.getElementById("status").textContent = "Calling testHello()...";' +
    '  google.script.run' +
    '    .withSuccessHandler(function(r) {' +
    '      document.getElementById("status").textContent = "SUCCESS: " + r.message + " at " + r.timestamp;' +
    '    })' +
    '    .withFailureHandler(function(e) {' +
    '      document.getElementById("status").textContent = "FAILED: " + e.message;' +
    '    })' +
    '    .testHello();' +
    '}' +
    'function startCache() {' +
    '  document.getElementById("status").textContent = "Starting cache...";' +
    '  google.script.run' +
    '    .withSuccessHandler(function(r) {' +
    '      if (r.success) {' +
    '        document.getElementById("status").textContent = "CACHE SUCCESS: " + r.casesProcessed + " cases ✓ | " + r.fieldsPerCase + " fields cached ✓ | " + r.elapsed + "s";' +
    '      } else {' +
    '        document.getElementById("status").textContent = "CACHE FAILED: " + r.error;' +
    '      }' +
    '    })' +
    '    .withFailureHandler(function(e) {' +
    '      document.getElementById("status").textContent = "CACHE FAILED: " + e.message;' +
    '    })' +
    '    .performCacheWithProgress();' +
    '}' +
    '</script>' +
    '</body>' +
    '</html>';

  const htmlOutput = HtmlService.createHtmlOutput(html)
    .setWidth(400)
    .setHeight(200);
  SpreadsheetApp.getUi().showModelessDialog(htmlOutput, '🧪 Simple Cache Test');
}

/**
 * Backend function to perform caching with progress updates
 */
function performCacheWithProgress() {
  try {
    Logger.log('🚀 STEP 1: Starting cache process...');
    const startTime = new Date().getTime();

    Logger.log('🔄 STEP 2: Calling refreshHeaders() to map column indices...');
    refreshHeaders(); // Explicitly call to ensure headers are cached
    Logger.log('✅ STEP 2 COMPLETE: Headers refreshed');

    Logger.log('🔄 STEP 3: Starting holistic analysis (getOrCreateHolisticAnalysis_)...');
    // Force fresh analysis (forceRefresh = true)
    const analysis = getOrCreateHolisticAnalysis_(true);
    Logger.log('✅ STEP 3 COMPLETE: Analysis finished');

    const elapsed = ((new Date().getTime() - startTime) / 1000).toFixed(1);
    const casesProcessed = analysis.totalCases || 0;

    Logger.log('✅ Analysis complete in ' + elapsed + 's - ' + casesProcessed + ' cases processed');

    return {
      success: true,
      casesProcessed: casesProcessed,
      elapsed: elapsed,
      fieldsPerCase: loadFieldSelection().length
    };
  } catch (e) {
    Logger.log('❌ Error in performCacheWithProgress: ' + e.message);
    return {
      success: false,
      error: e.message
    };
  }
}

/**
 * SIMPLE TEST: Returns immediately to test if google.script.run works
 */
/**
 * ULTRA SIMPLE TEST: Returns immediately with timestamp
 */
function testHello() {
  Logger.log('👋 testHello() called');
  return {
    success: true,
    message: 'Hello from backend!',
    timestamp: new Date().toISOString()
  };
}

function testCacheSimple() {
  Logger.log('🧪 testCacheSimple() called');

  try {
    const sheet = pickMasterSheet_();
    const data = sheet.getDataRange().getValues();

    Logger.log('✅ Got data: ' + data.length + ' rows');

    return {
      success: true,
      message: 'Communication works!',
      rowCount: data.length,
      sheetName: sheet.getName()
    };
  } catch (e) {
    Logger.log('❌ Error: ' + e.message);
    return {
      success: false,
      error: e.message
    };
  }
}


/**
 * Get cache status for UI indicator
 * Returns: { status: 'valid'|'stale'|'missing', hoursOld, expiresIn, cases }
 */
function getCacheStatus() {
  try {
    const ss = SpreadsheetApp.openById(TEST_SPREADSHEET_ID);
    const cacheSheet = ss.getSheetByName('Pathway_Analysis_Cache');

    if (!cacheSheet) {
      return {
        status: 'missing',
        message: 'Not cached',
        icon: '❌'
      };
    }

    const data = cacheSheet.getDataRange().getValues();
    if (data.length < 2) {
      return {
        status: 'missing',
        message: 'Cache empty',
        icon: '⚠️'
      };
    }

    const cachedTimestamp = new Date(data[1][0]);
    const now = new Date();
    const hoursDiff = (now - cachedTimestamp) / (1000 * 60 * 60);
    const hoursRemaining = 24 - hoursDiff;

    // Parse JSON to get case count
    let caseCount = 0;
    try {
      const parsed = JSON.parse(data[1][1]);
      caseCount = parsed.allCases ? parsed.allCases.length : 0;
    } catch (e) {
      // Ignore parse errors
    }

    if (hoursDiff < 24) {
      return {
        status: 'valid',
        hoursOld: hoursDiff.toFixed(1),
        expiresIn: hoursRemaining.toFixed(1),
        cases: caseCount,
        message: 'Cached ' + hoursDiff.toFixed(0) + 'h ago',
        icon: '✅'
      };
    } else {
      return {
        status: 'stale',
        hoursOld: hoursDiff.toFixed(1),
        cases: caseCount,
        message: 'Cache expired',
        icon: '⚠️'
      };
    }
  } catch (e) {
    return {
      status: 'error',
      message: 'Error checking cache',
      icon: '❌'
    };
  }
}

/**
 * Show live log window that polls for updates
 */
function showAIDiscoveryWithStreamingLogs_(creativityMode) {
  AI_DISCOVERY_LOGS = []; // Reset

  const modeLabel = creativityMode === 'radical' ? '🔥 RADICAL MODE' : '🤖 STANDARD MODE';

  const html = '<style>' +
    'body{font-family:monospace;background:#0a0b0e;color:#0f0;padding:20px;margin:0}' +
    '.header{color:#0ff;font-size:18px;font-weight:bold;margin-bottom:20px;border-bottom:2px solid #0ff;padding-bottom:10px}' +
    '.log-container{background:#000;border:1px solid #0f0;padding:15px;border-radius:8px;max-height:500px;overflow-y:auto;font-size:13px;line-height:1.6}' +
    '.log-line{margin:5px 0;padding:5px;border-left:3px solid #0f0}' +
    '.log-line.info{border-left-color:#0ff;color:#0ff}' +
    '.log-line.success{border-left-color:#0f0;color:#0f0}' +
    '.log-line.warning{border-left-color:#ff0;color:#ff0}' +
    '.log-line.error{border-left-color:#f00;color:#f00}' +
    '.timestamp{color:#666;margin-right:10px;font-size:11px}' +
    '.status{margin-top:15px;padding:10px;background:#1a1a1a;border-radius:6px;text-align:center;color:#0ff}' +
    '</style>' +
    '<div class="header">🤖 AI PATHWAY DISCOVERY - LIVE LOGS (' + modeLabel + ')</div>' +
    '<div class="status" id="status">▶️ Starting discovery...</div>' +
    '<div class="log-container" id="logs"></div>' +
    '<script>' +
    'var mode = "' + creativityMode + '";' +
    'var logIndex = 0;' +
    'var pollInterval = null;' +
    'var startTime = Date.now();' +
    'function addLog(message, type) {' +
    '  var logs = document.getElementById("logs");' +
    '  var elapsed = Math.floor((Date.now() - startTime) / 1000);' +
    '  var mins = Math.floor(elapsed / 60);' +
    '  var secs = elapsed % 60;' +
    '  var timestamp = mins.toString().padStart(2, "0") + ":" + secs.toString().padStart(2, "0");' +
    '  var line = document.createElement("div");' +
    '  line.className = "log-line " + type;' +
    '  line.innerHTML = "<span class=\\"timestamp\\">[" + timestamp + "]</span>" + message;' +
    '  logs.appendChild(line);' +
    '  logs.scrollTop = logs.scrollHeight;' +
    '}' +
    'function updateStatus(text) {' +
    '  document.getElementById("status").textContent = text;' +
    '}' +
    'function pollLogs() {' +
    '  google.script.run' +
    '    .withSuccessHandler(function(result) {' +
    '      if (result.logs && result.logs.length > logIndex) {' +
    '        for (var i = logIndex; i < result.logs.length; i++) {' +
    '          addLog(result.logs[i].message, result.logs[i].type);' +
    '        }' +
    '        logIndex = result.logs.length;' +
    '      }' +
    '      if (result.status) {' +
    '        updateStatus(result.status);' +
    '      }' +
    '      if (result.complete) {' +
    '        clearInterval(pollInterval);' +
    '        updateStatus("✅ Complete! Showing results...");' +
    '        if (result.pathways && result.pathways.length > 0) {' +
    '          setTimeout(function() {' +
    '            google.script.host.close();' +
    '            google.script.run.showAIPathwayResults(result.pathways, mode);' +
    '          }, 2000);' +
    '        }' +
    '      }' +
    '    })' +
    '    .withFailureHandler(function(error) {' +
    '      addLog("❌ ERROR: " + error.message, "error");' +
    '      clearInterval(pollInterval);' +
    '      updateStatus("❌ Failed");' +
    '    })' +
    '    .getAIDiscoveryStatus();' +
    '}' +
    'addLog("🚀 Initializing AI discovery in " + mode + " mode...", "info");' +
    'updateStatus("⏳ Calling OpenAI API...");' +
    'pollInterval = setInterval(pollLogs, 300);' +
    'google.script.run' +
    '  .withSuccessHandler(function() { addLog("✅ Discovery started", "success"); })' +
    '  .withFailureHandler(function(error) { addLog("❌ Start failed: " + error.message, "error"); })' +
    '  .startAIDiscovery(mode);' +
    '</script>';

  const htmlOutput = HtmlService.createHtmlOutput(html).setWidth(900).setHeight(600);
  SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'AI Pathway Discovery - Live Progress');
}

/**
 * Start AI discovery (called from client)
 */
function startAIDiscovery(creativityMode) {
  AI_DISCOVERY_LOGS = [];
  AI_DISCOVERY_LOGS.push({ message: '🔧 Server-side execution started', type: 'info', timestamp: new Date().toISOString() });

  // Run discovery synchronously
  discoverPathwaysSync_(creativityMode);
}

/**
 * Get current status (called by polling)
 */
function getAIDiscoveryStatus() {
  return {
    logs: AI_DISCOVERY_LOGS,
    status: AI_DISCOVERY_LOGS.length > 0 ? AI_DISCOVERY_LOGS[AI_DISCOVERY_LOGS.length - 1].message : 'Starting...',
    complete: AI_DISCOVERY_LOGS.some(function(log) { return log.message.indexOf('🎉 COMPLETE') !== -1; }),
    pathways: PropertiesService.getScriptProperties().getProperty('AI_PATHWAYS') ? JSON.parse(PropertiesService.getScriptProperties().getProperty('AI_PATHWAYS')) : []
  };
}

/**
 * Analyze case catalog - SMART CACHING VERSION
 *
 * Three-tier strategy for maximum reliability + rich data:
 * 1. CACHE HIT (instant): Use cached holistic analysis if < 24 hours old
 * 2. FRESH ANALYSIS (slow but rich): Try performHolisticAnalysis_() with 4min timeout
 * 3. LIGHTWEIGHT FALLBACK (fast but basic): Direct sheet read if timeout
 *
 * This preserves all rich clinical context (demographics, vitals, exam findings, etc.)
 */
function analyzeCatalog_() {
  const ss = SpreadsheetApp.openById(TEST_SPREADSHEET_ID);

  // TIER 1: Try cached analysis first (instant, full rich data - 23 fields per case)
  let cacheSheet = ss.getSheetByName('Pathway_Analysis_Cache');

  if (cacheSheet) {
    const data = cacheSheet.getDataRange().getValues();
    if (data.length > 1) {
      const cachedTimestamp = new Date(data[1][0]);
      const now = new Date();
      const hoursDiff = (now - cachedTimestamp) / (1000 * 60 * 60);

      if (hoursDiff < 24) {
        // Cache hit! Return full rich data instantly
        Logger.log('✅ Using cached holistic analysis (' + hoursDiff.toFixed(1) + ' hours old)');
        return JSON.parse(data[1][1]);
      }
    }
  }

  // TIER 2: No cache or stale - try fresh analysis with timeout protection
  Logger.log('📊 Cache miss or stale - attempting fresh holistic analysis');
  const startTime = new Date().getTime();
  const MAX_TIME = 4 * 60 * 1000; // 4 minutes (leave 2min buffer for 6min timeout)

  try {
    const analysis = performHolisticAnalysis_();
    const elapsed = new Date().getTime() - startTime;

    Logger.log('✅ Fresh analysis completed in ' + (elapsed / 1000).toFixed(1) + 's');

    if (elapsed < MAX_TIME) {
      return analysis; // Success! Got all the rich data + auto-cached for next time
    } else {
      Logger.log('⚠️  Analysis took too long, falling back to lightweight mode');
    }
  } catch (e) {
    Logger.log('⚠️  Error in performHolisticAnalysis_(): ' + e.message);
  }

  // TIER 3: Last resort - lightweight fallback (6 basic fields only)
  Logger.log('📉 Using lightweight analysis fallback');
  const sheet = ss.getSheets().find(function(sh) {
    return /master scenario csv/i.test(sh.getName());
  }) || ss.getActiveSheet();

  const data = sheet.getDataRange().getValues();
  const headers = data[1];

  // Use dynamic header resolution for lightweight fallback
  const fieldMap = {
    caseId: { header: 'Case_Organization_Case_ID', fallback: 0 },
    spark: { header: 'Case_Organization_Spark_Title', fallback: 1 },
    diagnosis: { header: 'Case_Orientation_Chief_Diagnosis', fallback: 7 },
    learning: { header: 'Case_Orientation_Actual_Learning_Outcomes', fallback: 8 },
    category: { header: 'Case_Organization_Category', fallback: 11 },
    pathway: { header: 'Case_Organization_Pathway_or_Course_Name', fallback: 5 }
  };

  const indices = resolveColumnIndices_(fieldMap);
  const caseIdIdx = indices.caseId;
  const sparkIdx = indices.spark;
  const diagnosisIdx = indices.diagnosis;
  const learningIdx = indices.learning;
  const categoryIdx = indices.category;
  const pathwayIdx = indices.pathway;

  const allCases = [];
  for (let i = 2; i < data.length; i++) {
    allCases.push({
      caseId: data[i][caseIdIdx] || '',
      sparkTitle: data[i][sparkIdx] || '',
      diagnosis: data[i][diagnosisIdx] || '',
      learningOutcomes: data[i][learningIdx] || '',
      category: data[i][categoryIdx] || '',
      pathway: data[i][pathwayIdx] || ''
    });
  }

  return { allCases: allCases };
}

/**
 * Helper: Extract vital value from vitals JSON string
 */
function extractVital_(vitalsStr, field) {
  if (!vitalsStr) return '';
  try {
    const vitals = typeof vitalsStr === 'string' ? JSON.parse(vitalsStr) : vitalsStr;
    if (field === 'bp' && vitals.bp) {
      return vitals.bp.sys + '/' + vitals.bp.dia;
    }
    return vitals[field] || '';
  } catch (e) {
    return '';
  }
}

/**
 * Synchronous discovery with logging
 */
function discoverPathwaysSync_(creativityMode) {
  function log(msg, type) {
    AI_DISCOVERY_LOGS.push({ message: msg, type: type || 'info', timestamp: new Date().toISOString() });
  }

  try {
    log('Step 1/6: Getting API key', 'info');
    const ss = SpreadsheetApp.openById(TEST_SPREADSHEET_ID);
    const settingsSheet = ss.getSheetByName('Settings');

    if (!settingsSheet) {
      log('❌ Settings sheet not found', 'error');
      return;
    }

    const apiKey = settingsSheet.getRange('B2').getValue();
    if (!apiKey) {
      log('❌ No API key in Settings!B2', 'error');
      return;
    }

    log('✅ API key found', 'success');

    log('Step 1.5/6: Refreshing header mappings', 'info');
    try {
      refreshHeaders();
      log('✅ Headers refreshed', 'success');
    } catch (e) {
      log('⚠️  Could not refresh headers: ' + e.message, 'warning');
    }

    log('Step 2/6: Analyzing case catalog', 'info');
    const analysis = analyzeCatalog_();
    const cases = analysis.allCases;
    log('✅ Found ' + cases.length + ' cases', 'success');

    log('Step 3/6: Building rich case summaries with clinical context', 'info');
    // Send ALL cases with maximum context for AI pattern discovery
    const summaries = cases.map(function(c) {
      return {
        // Core identification
        id: c.caseId,
        title: c.sparkTitle || '',
        diagnosis: c.diagnosis || '',

        // Learning context
        preSim: (c.preSimOverview || '').substring(0, 300),
        postSim: (c.postSimOverview || '').substring(0, 300),
        learning: c.learningOutcomes || '',
        objectives: c.learningObjectives || '',

        // Case metadata
        category: c.category || '',
        difficulty: c.difficulty || '',
        duration: c.estimatedDuration || '',
        setting: c.setting || '',
        presentation: c.chiefComplaint || '',

        // ENHANCED: Patient demographics (unlocks age/gender pathways)
        age: c.age || c.patientAge || '',
        gender: c.gender || c.patientGender || '',

        // ENHANCED: Initial vitals (pattern recognition goldmine)
        initialHR: extractVital_(c.initialVitals || c.Initial_Vitals, 'hr'),
        initialBP: extractVital_(c.initialVitals || c.Initial_Vitals, 'bp'),
        initialRR: extractVital_(c.initialVitals || c.Initial_Vitals, 'rr'),
        initialSpO2: extractVital_(c.initialVitals || c.Initial_Vitals, 'spo2'),

        // ENHANCED: Clinical findings (physical exam pathways)
        examFindings: (c.examFindings || '').substring(0, 200),

        // ENHANCED: Medical context (complexity pathways)
        medications: (c.medications || c.pastMedications || '').substring(0, 150),
        pmh: (c.pastMedicalHistory || c.pmh || '').substring(0, 200),
        allergies: c.allergies || '',

        // ENHANCED: Environment (situational training)
        environment: c.environmentType || c.setting || '',
        disposition: c.dispositionPlan || c.disposition || ''
      };
    });
    log('✅ Prepared ' + summaries.length + ' enhanced case summaries (demographics + vitals + clinical context)', 'success');

    log('Step 4/6: Building prompt', 'info');
    const temp = creativityMode === 'radical' ? 1.0 : 0.7;
    const prompt = creativityMode === 'radical'
      ? 'ANALYZE ALL ' + summaries.length + ' EMERGENCY MEDICINE CASES. TARGET AUDIENCE: Emergency physicians, EM residents, simulation educators. PRIORITY: Clinical value > novelty. Create 5-8 RADICALLY CREATIVE pathways that address REAL EM physician pain points. PRIORITIZE by clinical impact: (1) High-stakes/time-critical scenarios, (2) Diagnostic pitfalls/misses, (3) Disease mimics - TWO TYPES: (a) Cross-category mimics: similar symptoms but dramatically different pathophysiology (MI vs panic, meningitis vs migraine), (b) Within-category mimics: related diseases where subtle distinctions matter (STEMI vs Wellens, bacterial vs viral meningitis, DKA vs HHS), (4) Procedural mastery, (5) Complex decision-making, (6) Communication under pressure. Push boundaries with psychological, narrative, game-design approaches but ALWAYS tie to clinical outcomes. PATHWAY NAMES MUST BE IRRESISTIBLY CLICK-WORTHY: Make ED clinicians think "I NEED this!" Use emotionally resonant language (trigger curiosity, urgency, fear-of-missing-out), action-oriented promises (transformation, not just info), Netflix series vibes (make them want to binge). Examples: "The 3am Nightmare Cases", "Death By Anchoring", "The Great Pretenders", "The Deadly Doppelgangers", "When Experts Get Fooled". Avoid generic academic titles. SORT results by clinical_value_score (1-10). Return ONLY a JSON array with pathway_name (CLICK-WORTHY, emotionally compelling), pathway_icon, grouping_logic_type, why_this_matters (emphasize EM physician value + make them feel this is unmissable), learning_outcomes (EM-specific), best_for (EM audience), unique_value (clinical impact - why THIS pathway vs any other), case_ids (array of at least 3), novelty_score (8-10), clinical_value_score (1-10, rate clinical utility), estimated_learning_time, difficulty_curve, scientific_rationale. NO markdown, NO explanation.'
      : 'ANALYZE ALL ' + summaries.length + ' EMERGENCY MEDICINE CASES. TARGET AUDIENCE: Emergency physicians, EM residents, simulation educators. PRIORITY: Clinical value > novelty. Create 5-8 CREATIVE pathways that solve REAL EM training needs. PRIORITIZE by clinical impact: (1) Can\'t-miss diagnoses, (2) Time-sensitive interventions, (3) Disease mimics - TWO TYPES: (a) Cross-category mimics: similar symptoms, dramatically different diseases (MI vs dissection vs esophageal rupture, PE vs pneumonia vs pneumothorax), (b) Within-category mimics: closely related diseases where subtle distinctions are essential (STEMI vs Wellens vs Takotsubo, bacterial vs viral vs fungal meningitis, DKA vs HHS vs euglycemic DKA), (4) High-risk populations (peds/geriatrics), (5) Undifferentiated patients, (6) Cognitive errors/biases. Discover patterns in clinical reasoning, diagnostic challenges, or critical actions. PATHWAY NAMES MUST BE IRRESISTIBLY CLICK-WORTHY: Make ED clinicians think "I NEED this!" Use emotionally resonant language (trigger curiosity, urgency, professional pride), action-oriented promises (mastery, confidence), specific enough to visualize. Examples: "The Great Pretenders", "The Deadly Doppelgangers", "When Similar Kills Different", "The Subtle Distinction Series", "Evil Twins: Life-or-Death Differences". Avoid boring academic titles like "Cardiovascular Pathology Module". SORT results by clinical_value_score (1-10). Return ONLY a JSON array with pathway_name (CLICK-WORTHY, emotionally compelling), pathway_icon, grouping_logic_type, why_this_matters (emphasize EM physician value + make them feel this is unmissable), learning_outcomes (EM-specific), best_for (EM audience), unique_value (clinical impact - why THIS pathway vs any other), case_ids (array of at least 3), novelty_score (7+), clinical_value_score (1-10, rate clinical utility), estimated_learning_time, difficulty_curve. NO markdown, NO explanation.';

    log('✅ Prompt ready (' + temp + ' temp, ' + summaries.length + ' cases)', 'success');

    log('Step 5/6: Calling OpenAI GPT-4', 'info');
    log('⏳ Analyzing ' + summaries.length + ' cases - may take 15-45 seconds...', 'warning');

    const start = new Date().getTime();
    const response = UrlFetchApp.fetch('https://api.openai.com/v1/chat/completions', {
      method: 'post',
      headers: {
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: creativityMode === 'radical' ? 'You are an experimental medical educator applying cognitive science and game design to create revolutionary learning pathways.' : 'You are an expert medical educator discovering novel patterns across medical cases to create innovative learning pathways.' },
          { role: 'user', content: prompt + '\n\nCASES:\n' + JSON.stringify(summaries) }
        ],
        temperature: temp,
        max_tokens: 2500
      }),
      muteHttpExceptions: true
    });

    const elapsed = ((new Date().getTime() - start) / 1000).toFixed(1);
    const code = response.getResponseCode();

    log('✅ OpenAI responded in ' + elapsed + 's', 'success');
    log('📊 Status: ' + code, 'info');

    if (code !== 200) {
      log('❌ API error: ' + response.getContentText(), 'error');
      return;
    }

    log('Step 6/6: Parsing response', 'info');
    const data = JSON.parse(response.getContentText());
    const aiText = data.choices[0].message.content;

    let pathways = [];
    const match = aiText.match(/\[[\s\S]*\]/);
    pathways = match ? JSON.parse(match[0]) : JSON.parse(aiText);

    log('✅ Parsed ' + pathways.length + ' pathways', 'success');

    pathways.forEach(function(pw, i) {
      log((i+1) + '. ' + (pw.pathway_icon || '🤖') + ' ' + (pw.pathway_name || 'Unnamed'), 'info');
    });

    log('🎉 COMPLETE! Discovery finished', 'success');

    // Store pathways for retrieval
    PropertiesService.getScriptProperties().setProperty('AI_PATHWAYS', JSON.stringify(pathways));
    PropertiesService.getScriptProperties().setProperty('AI_MODE', creativityMode);

  } catch (e) {
    log('❌ EXCEPTION: ' + e.message, 'error');
  }
}

/**
 * Show results (called after discovery completes)
 */
function showAIPathwayResults(pathways, creativityMode) {
  const modeLabel = creativityMode === 'radical' ? '🔥 RADICAL' : '🤖 CREATIVE';

  let html = '<style>body{font-family:Arial;background:#0a0b0e;color:#fff;padding:24px}.pathway{background:#1a1f2e;padding:20px;margin:15px 0;border-radius:12px;border-left:4px solid ' + (creativityMode === 'radical' ? '#ff6b00' : '#2357ff') + '}.name{font-size:20px;font-weight:bold;margin-bottom:10px}.pitch{color:#ccc;line-height:1.6}</style>';

  html += '<h1>' + modeLabel + ' AI-Discovered Pathways</h1>';
  html += '<p>Found ' + pathways.length + ' novel groupings</p>';

  pathways.forEach(function(pw) {
    html += '<div class="pathway">';
    html += '<div class="name">' + (pw.pathway_icon || '🤖') + ' ' + (pw.pathway_name || 'Unnamed') + '</div>';
    html += '<div class="pitch">' + (pw.why_this_matters || 'No description') + '</div>';
    html += '</div>';
  });

  const htmlOutput = HtmlService.createHtmlOutput(html).setWidth(800).setHeight(600);
  SpreadsheetApp.getUi().showModalDialog(htmlOutput, modeLabel + ' Pathways');
}


/**
 * COMPREHENSIVE CACHE DIAGNOSTIC
 * Tests each step of the cache process with detailed logging
 */
function testCacheDiagnostic() {
  const startTime = new Date().getTime();
  Logger.log('');
  Logger.log('╔═══════════════════════════════════════════════════════════════╗');
  Logger.log('║           🧪 CACHE DIAGNOSTIC TEST STARTED                   ║');
  Logger.log('╚═══════════════════════════════════════════════════════════════╝');
  Logger.log('');

  try {
    // STEP 1: Open TEST spreadsheet
    Logger.log('🧪 STEP 1: Opening TEST spreadsheet by ID...');
    const ss = SpreadsheetApp.openById('1t3qN8e537ghl38GTsXbVG8ML8OZtK2XyUpDiMQjnGAI');
    Logger.log('✅ STEP 1: Opened: ' + ss.getName());
    Logger.log('   Spreadsheet ID: ' + ss.getId());
    Logger.log('');

    // STEP 2: Get active sheet
    Logger.log('🧪 STEP 2: Getting active sheet...');
    const sheet = ss.getActiveSheet();
    Logger.log('✅ STEP 2: Sheet name: ' + sheet.getName());
    Logger.log('');

    // STEP 3: Get data
    Logger.log('🧪 STEP 3: Getting all data...');
    const data = sheet.getDataRange().getValues();
    Logger.log('✅ STEP 3: Got ' + data.length + ' total rows');
    Logger.log('   Data rows (excluding headers): ' + (data.length - 2));
    Logger.log('');

    // STEP 4: Check headers
    Logger.log('🧪 STEP 4: Checking headers...');
    if (data.length < 2) {
      throw new Error('Sheet does not have enough rows for headers');
    }
    const headers = data[1];
    Logger.log('✅ STEP 4: Headers row has ' + headers.length + ' columns');
    Logger.log('   First 10 headers: ' + headers.slice(0, 10).join(', '));
    Logger.log('');

    // STEP 5: Test refreshHeaders()
    Logger.log('🧪 STEP 5: Testing refreshHeaders()...');
    const headerResult = refreshHeaders();
    if (!headerResult) {
      throw new Error('refreshHeaders() returned null');
    }
    Logger.log('✅ STEP 5: refreshHeaders() succeeded');
    Logger.log('   Mapped columns: ' + Object.keys(headerResult.map).length);
    Logger.log('');

    // STEP 6: Test holistic analysis (this is the heavy operation)
    Logger.log('🧪 STEP 6: Testing performHolisticAnalysis_()...');
    Logger.log('   This processes ALL rows - may take time...');
    const analysisStart = new Date().getTime();
    const analysis = performHolisticAnalysis_();
    const analysisTime = ((new Date().getTime() - analysisStart) / 1000).toFixed(1);
    Logger.log('✅ STEP 6: performHolisticAnalysis_() completed in ' + analysisTime + 's');
    Logger.log('   Total cases: ' + analysis.totalCases);
    Logger.log('   Systems found: ' + Object.keys(analysis.systemDistribution).length);
    Logger.log('   Pathways found: ' + Object.keys(analysis.pathwayDistribution).length);
    Logger.log('   Unassigned: ' + analysis.unassignedCount);
    Logger.log('');

    // STEP 7: Test cache sheet creation/update
    Logger.log('🧪 STEP 7: Testing cache sheet access...');
    let cacheSheet = ss.getSheetByName('Pathway_Analysis_Cache');
    if (!cacheSheet) {
      Logger.log('   Creating Pathway_Analysis_Cache sheet...');
      cacheSheet = ss.insertSheet('Pathway_Analysis_Cache');
      cacheSheet.hideSheet();
      cacheSheet.appendRow(['timestamp', 'analysis_json']);
    }
    Logger.log('✅ STEP 7: Cache sheet ready');
    Logger.log('');

    const totalTime = ((new Date().getTime() - startTime) / 1000).toFixed(1);

    Logger.log('╔═══════════════════════════════════════════════════════════════╗');
    Logger.log('║           ✅ ALL DIAGNOSTICS PASSED                          ║');
    Logger.log('╚═══════════════════════════════════════════════════════════════╝');
    Logger.log('');
    Logger.log('📊 SUMMARY:');
    Logger.log('   • Total time: ' + totalTime + 's');
    Logger.log('   • Analysis time: ' + analysisTime + 's');
    Logger.log('   • Data rows: ' + (data.length - 2));
    Logger.log('   • Cases processed: ' + analysis.totalCases);
    Logger.log('');

    SpreadsheetApp.getUi().alert(
      '✅ Cache Diagnostic PASSED!\n\n' +
      'Total time: ' + totalTime + 's\n' +
      'Analysis time: ' + analysisTime + 's\n' +
      'Data rows: ' + (data.length - 2) + '\n' +
      'Cases processed: ' + analysis.totalCases + '\n\n' +
      'Check Execution Log (Ctrl+Enter) for full details'
    );

    return {
      success: true,
      totalTime: totalTime,
      analysisTime: analysisTime,
      dataRows: data.length - 2,
      casesProcessed: analysis.totalCases
    };

  } catch (e) {
    Logger.log('');
    Logger.log('╔═══════════════════════════════════════════════════════════════╗');
    Logger.log('║           ❌ DIAGNOSTIC FAILED                               ║');
    Logger.log('╚═══════════════════════════════════════════════════════════════╝');
    Logger.log('');
    Logger.log('❌ Error: ' + e.message);
    Logger.log('❌ Stack trace:');
    Logger.log(e.stack);
    Logger.log('');

    SpreadsheetApp.getUi().alert(
      '❌ Cache Diagnostic FAILED\n\n' +
      'Error: ' + e.message + '\n\n' +
      'Check Execution Log (Ctrl+Enter) for full stack trace'
    );

    return {
      success: false,
      error: e.message,
      stack: e.stack
    };
  }
}

/**
 * Try to parse vitals JSON and extract hr, bp, rr, spo2
 * @param {string} vitalsJson - JSON string from Monitor_Vital_Signs_Initial_Vitals column
 * @return {object|null} - Parsed vitals object with hr, bpSys, bpDia, rr, spo2, or null if parse fails
 */
function tryParseVitals_(vitalsJson) {
  if (!vitalsJson || typeof vitalsJson !== 'string') return null;

  try {
    const vitals = JSON.parse(vitalsJson);
    return {
      hr: vitals.hr || null,
      bpSys: vitals.bp && vitals.bp.sys ? vitals.bp.sys : null,
      bpDia: vitals.bp && vitals.bp.dia ? vitals.bp.dia : null,
      rr: vitals.rr || null,
      spo2: vitals.spo2 || null
    };
  } catch (e) {
    return null;
  }
}

/**
 * Truncate field to max length to avoid cache bloat
 * @param {string} value - Field value to truncate
 * @param {number} maxLength - Maximum length before truncation
 * @return {string} - Truncated string with '...' appended if truncated
 */
function truncateField_(value, maxLength) {
  if (!value || typeof value !== 'string') return '';
  if (value.length <= maxLength) return value;
  return value.substring(0, maxLength) + '...';
}
