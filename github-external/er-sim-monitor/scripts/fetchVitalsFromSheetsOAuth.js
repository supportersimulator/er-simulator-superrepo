import fs from "fs";
import path from "path";
import { google } from "googleapis";
import dotenv from "dotenv";

dotenv.config();

const SCOPES = [
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/script.projects",
  "https://www.googleapis.com/auth/script.projects.readonly",
  "https://www.googleapis.com/auth/script.deployments",
  "https://www.googleapis.com/auth/drive.readonly"
];
const TOKEN_PATH = path.resolve("./config/token.json");

const credentials = {
  client_id: process.env.GOOGLE_CLIENT_ID,
  client_secret: process.env.GOOGLE_CLIENT_SECRET,
  redirect_uris: ["http://localhost:3000/oauth2callback"],
};

const SHEET_ID = process.env.SHEET_ID;
const TAB_NAME = "Master Scenario Convert";
const OUTPUT_FILE = path.resolve("./data/vitals.json");

async function main() {
  const auth = await authorize(credentials);
  await fetchVitals(auth);
}

async function authorize({ client_id, client_secret, redirect_uris }) {
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

  if (fs.existsSync(TOKEN_PATH)) {
    const token = JSON.parse(fs.readFileSync(TOKEN_PATH, "utf-8"));
    oAuth2Client.setCredentials(token);
    return oAuth2Client;
  }

  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
  });
  console.log("\n🔐 Authorize this app by visiting this URL:\n", authUrl);

  const readline = await import("readline");
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const code = await new Promise((resolve) =>
    rl.question("\nEnter the code from that page here: ", (code) => {
      rl.close();
      resolve(code);
    })
  );

  const { tokens } = await oAuth2Client.getToken(code);
  oAuth2Client.setCredentials(tokens);
  fs.mkdirSync(path.dirname(TOKEN_PATH), { recursive: true });
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
  console.log("✅ Token stored at", TOKEN_PATH);
  return oAuth2Client;
}

async function fetchVitals(auth) {
  const sheets = google.sheets({ version: "v4", auth });
  console.log("📡 Fetching data from:", TAB_NAME);

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${TAB_NAME}!A1:ZZ1000`,
  });

  const rows = res.data.values;
  if (!rows || rows.length < 3) throw new Error("Not enough data in sheet.");

  const tier1 = rows[0];
  const tier2 = rows[1];
  const mergedKeys = tier1.map((t1, i) => `${t1}:${tier2[i]}`);

  const data = rows.slice(2).map((row) => {
    const entry = {};
    mergedKeys.forEach((key, i) => {
      const val = row[i];
      if (val && val !== "N/A") entry[key] = tryParseJSON(val);
    });
    return entry;
  });

  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(data, null, 2));
  console.log(`✅ Wrote ${data.length} entries to ${OUTPUT_FILE}`);
}

function tryParseJSON(value) {
  if (typeof value !== "string") return value;
  try { return JSON.parse(value); } catch { return value; }
}

main().catch((err) => console.error("❌ Error:", err));
