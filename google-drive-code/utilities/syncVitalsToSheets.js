import fs from "fs";
import path from "path";
import { google } from "googleapis";
import dotenv from "dotenv";

dotenv.config();

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];
const TOKEN_PATH = path.resolve("./config/token.json");
const SHEET_ID = process.env.SHEET_ID;
const TAB_NAME = "Master Scenario Convert";
const OUTPUT_FILE = path.resolve("./data/vitals.json");

// Check for --force flag
const FORCE_REMAP = process.argv.includes("--force");

async function main() {
  if (FORCE_REMAP) {
    console.log("🔄 FORCE RE-MAP MODE: Will intelligently re-assign all waveforms\n");
  }
  const auth = await authorize();
  await syncVitals(auth);
}

async function authorize() {
  const credentials = {
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    redirect_uris: ["http://localhost"],
  };

  const oAuth2Client = new google.auth.OAuth2(
    credentials.client_id,
    credentials.client_secret,
    credentials.redirect_uris[0]
  );

  if (!fs.existsSync(TOKEN_PATH)) {
    throw new Error("❌ Token not found. Please run `npm run auth-google` first.");
  }

  const token = JSON.parse(fs.readFileSync(TOKEN_PATH, "utf8"));
  oAuth2Client.setCredentials(token);
  return oAuth2Client;
}

function detectWaveformForState(entry, stateName, stateIndex) {
  // Gather clinical context
  const caseTitle = (entry["Case_Organization:Reveal_Title"] || entry["Case_Organization:Spark_Title"] || "").toLowerCase();
  const initialRhythm = (entry["Patient_Demographics_and_Clinical_Data:Initial_Rhythm"] || "").toLowerCase();
  const dispositionPlan = (entry["Situation_and_Environment_Details:Disposition_Plan"] || "").toLowerCase();
  const stateNames = (entry["image sync:Default_Patient_States"] || "Baseline,Worsening,Arrest,Recovery").split(",");

  // Determine current state type
  const currentState = stateNames[stateIndex] || stateName || "";
  const isArrest = currentState.toLowerCase().includes("arrest") || currentState.toLowerCase().includes("critical");
  const isWorsening = currentState.toLowerCase().includes("worsening") || currentState.toLowerCase().includes("deteriorat");

  // Check for specific rhythms mentioned in case
  const contextText = `${caseTitle} ${initialRhythm} ${dispositionPlan}`.toLowerCase();

  // Arrest state mapping
  if (isArrest) {
    if (contextText.includes("pea") || contextText.includes("pulseless electrical")) return "peapulseless_ecg";
    if (contextText.includes("asystole") || contextText.includes("flatline")) return "asystole_ecg";
    if (contextText.includes("vfib") || contextText.includes("ventricular fibrillation")) return "vfib_ecg";
    if (contextText.includes("vtach") || contextText.includes("ventricular tachycardia")) return "vtach_ecg";
    if (contextText.includes("torsades")) return "torsades_ecg";
    // Default arrest if no specific rhythm mentioned
    return "asystole_ecg";
  }

  // Worsening/deterioration state - check for specific arrhythmias
  if (isWorsening) {
    if (contextText.includes("vtach") || contextText.includes("ventricular tachycardia")) return "vtach_ecg";
    if (contextText.includes("svt") || contextText.includes("supraventricular")) return "svt_ecg";
    if (contextText.includes("aflutter") || contextText.includes("atrial flutter")) return "aflutter_ecg";
  }

  // Baseline/stable states - check for underlying rhythms
  if (contextText.includes("afib") || contextText.includes("atrial fibrillation")) return "afib_ecg";
  if (contextText.includes("aflutter") || contextText.includes("atrial flutter")) return "aflutter_ecg";
  if (contextText.includes("paced") || contextText.includes("pacemaker")) return "paced_ecg";
  if (contextText.includes("junctional")) return "junctional_ecg";
  if (contextText.includes("bigeminy")) return "bigeminy_ecg";
  if (contextText.includes("trigeminy")) return "trigeminy_ecg";

  // Default: sinus rhythm
  return "sinus_ecg";
}

async function syncVitals(auth) {
  const sheets = google.sheets({ version: "v4", auth });
  console.log(`📡 Reading from: ${TAB_NAME}`);

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${TAB_NAME}!A1:ZZ1000`,
  });

  const rows = res.data.values;
  if (!rows || rows.length < 3) throw new Error("No valid data found in sheet.");

  const [tier1, tier2, ...dataRows] = rows;
  const mergedKeys = tier1.map((t1, i) => `${t1}:${tier2[i]}`);

  const updatedRows = [];
  const localData = [];

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    const entry = {};
    let needsUpdate = false;

    mergedKeys.forEach((key, j) => {
      const val = row[j];
      entry[key] = val && val !== "N/A" ? tryParseJSON(val) : null;
    });

    // Process vitals JSON fields to add intelligent waveform mapping
    const vitalsFields = [
      { field: "Monitor_Vital_Signs:Initial_Vitals", stateName: "Initial", stateIndex: 0 },
      { field: "Monitor_Vital_Signs:State1_Vitals", stateName: "State1", stateIndex: 0 },
      { field: "Monitor_Vital_Signs:State2_Vitals", stateName: "State2", stateIndex: 1 },
      { field: "Monitor_Vital_Signs:State3_Vitals", stateName: "State3", stateIndex: 2 },
      { field: "Monitor_Vital_Signs:State4_Vitals", stateName: "State4", stateIndex: 3 },
      { field: "Monitor_Vital_Signs:State5_Vitals", stateName: "State5", stateIndex: 4 },
      { field: "Monitor_Vital_Signs:Vitals_Format", stateName: "Format", stateIndex: 0 }
    ];

    vitalsFields.forEach(({ field, stateName, stateIndex }) => {
      const fieldIndex = mergedKeys.indexOf(field);
      if (fieldIndex === -1) return;

      const vitalsValue = entry[field];
      if (vitalsValue && typeof vitalsValue === "object") {
        const intelligentWaveform = detectWaveformForState(entry, stateName, stateIndex);

        // Update if: no waveform exists, or force mode is on, or waveform differs from intelligent one
        const shouldUpdate = !vitalsValue.waveform || FORCE_REMAP || (FORCE_REMAP && vitalsValue.waveform !== intelligentWaveform);

        if (shouldUpdate || !vitalsValue.waveform) {
          const oldWaveform = vitalsValue.waveform;
          vitalsValue.waveform = intelligentWaveform;
          row[fieldIndex] = JSON.stringify(vitalsValue);
          entry[field] = vitalsValue;
          needsUpdate = true;

          if (FORCE_REMAP && oldWaveform && oldWaveform !== intelligentWaveform) {
            console.log(`🔄 Row ${i + 3}: Changed ${field} from ${oldWaveform} → ${intelligentWaveform}`);
          } else {
            console.log(`🩺 Row ${i + 3}: Added ${intelligentWaveform} to ${field}`);
          }
        }
      }
    });

    if (needsUpdate) updatedRows.push({ rowIndex: i + 3, rowValues: row });
    localData.push(entry);
  }

  // Write local vitals.json
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(localData, null, 2));
  console.log(`✅ Local data synced → ${OUTPUT_FILE}`);

  // Push updates to Google Sheet
  for (const update of updatedRows) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `${TAB_NAME}!A${update.rowIndex}:ZZ${update.rowIndex}`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [update.rowValues] },
    });
    console.log(`☁️ Updated Google Sheet row ${update.rowIndex}`);
  }

  console.log(`🎯 ${updatedRows.length} rows updated in total.`);
}

function tryParseJSON(value) {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

main().catch((err) => console.error("❌ Error:", err));
