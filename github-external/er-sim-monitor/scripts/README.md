# Scripts Directory

## Google Sheets Bridge

### fetchVitalsFromSheetsSecure.js

This script securely syncs vitals data from a private Google Sheet to `/data/vitals.json`.

**Usage:**
```bash
node scripts/fetchVitalsFromSheetsSecure.js
```

**Setup:**

1. **Create a Google Service Account:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Enable the "Google Sheets API"
   - Navigate to "IAM & Admin" → "Service Accounts"
   - Click "Create Service Account"
   - Download the JSON key file

2. **Configure Environment Variables:**
   - Copy `.env.example` to `.env`
   - Fill in your credentials:
     ```
     GOOGLE_SHEET_ID=your_google_sheet_id_here
     GOOGLE_SERVICE_ACCOUNT_EMAIL=service-account@project-id.iam.gserviceaccount.com
     GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY_HERE\n-----END PRIVATE KEY-----\n"
     ```

3. **Share Your Google Sheet:**
   - Open your Google Sheet
   - Click "Share"
   - Add your service account email (from step 1)
   - Grant "Viewer" access

4. **Run the Script:**
   ```bash
   node scripts/fetchVitalsFromSheetsSecure.js
   ```

**Expected Sheet Format:**

| HR  | SpO2 | BP_Sys | BP_Dia | EtCO2 | Waveform      |
|-----|------|--------|--------|-------|---------------|
| 80  | 99   | 120    | 80     | 36    | sinus_ecg     |
| 150 | 90   | 80     | 40     | 20    | vtach_ecg     |
| 45  | 97   | 100    | 60     | 32    | junctional_ecg|

The script expects headers in row 1 and data starting from row 2 (range: `Sheet1!A2:F`).

**Security Notes:**
- Never commit `.env` or `config/google-service-account.json`
- These files are already in `.gitignore`
- Use `.env.example` as a template only
