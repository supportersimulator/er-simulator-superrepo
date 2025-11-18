# Environment Setup Guide

This document explains all environment variables used in the ER Simulator project and how to configure them.

## 📋 Environment Variables Reference

### Core Configuration

**`DOTENV_CONFIG_SILENT=true`**
- **Purpose:** Suppresses dotenv logging noise in console
- **Required:** No (optional convenience)
- **Default:** false

---

### Google Cloud Authentication

**`GOOGLE_CLIENT_ID`**
- **Purpose:** OAuth 2.0 client ID from Google Cloud Console
- **Required:** Yes
- **Format:** `[project-number]-[hash].apps.googleusercontent.com`
- **Where to get it:**
  1. Go to [Google Cloud Console](https://console.cloud.google.com)
  2. Navigate to APIs & Services → Credentials
  3. Create OAuth 2.0 Client ID (Desktop app type)
  4. Copy the Client ID

**`GOOGLE_CLIENT_SECRET`**
- **Purpose:** OAuth 2.0 client secret paired with client ID
- **Required:** Yes
- **Format:** `GOCSPX-[secret-string]`
- **Where to get it:** Same location as Client ID above

---

### Google Sheets Integration

**`SHEET_ID` / `GOOGLE_SHEET_ID`**
- **Purpose:** Unique identifier for "Convert_Master_Sim_CSV_Template_with_Input" spreadsheet
- **Required:** Yes
- **Format:** Long alphanumeric string (e.g., `1EVSC6j7zUeNw_D7dOV3dx7eRyMd3T6PVrVVazKYIkaM`)
- **Where to get it:**
  - Open your Google Sheet
  - Look in the URL: `https://docs.google.com/spreadsheets/d/[SHEET_ID]/edit`
  - Copy the ID portion

**Why two variables?**
- Historical reasons - both point to same sheet
- `GOOGLE_SHEET_ID` is preferred going forward
- Kept both for backward compatibility

**`TOKEN_PATH`**
- **Purpose:** Path to stored OAuth token for Google APIs
- **Required:** Yes
- **Default:** `./config/token.json`
- **Note:** Token is generated automatically on first auth

---

### Google Apps Script

**`APPS_SCRIPT_ID`**
- **Purpose:** Unique identifier for "Sim Builder (Production)" Apps Script project
- **Required:** Yes (for Apps Script API access)
- **Format:** Long alphanumeric string with dashes
- **Where to get it:**
  1. Open your Apps Script project
  2. Click Project Settings (gear icon)
  3. Copy the Script ID

**`DEPLOYMENT_ID`**
- **Purpose:** Deployment ID for web app endpoint
- **Required:** No (only if using web app deployment)
- **Format:** `AKfycb[...]` (long string)
- **Where to get it:**
  1. In Apps Script editor, click Deploy → Manage Deployments
  2. Copy the Deployment ID

**`WEB_APP_URL`**
- **Purpose:** Direct URL to deployed Apps Script web app
- **Required:** No (only if using web app endpoint)
- **Format:** `https://script.google.com/macros/s/[DEPLOYMENT_ID]/exec`

**`ATSR_SCRIPT_ID`**
- **Purpose:** Standalone ATSR (title generator) project ID
- **Required:** No (only if using ATSR standalone)
- **Format:** Long alphanumeric string with dashes

---

### AI Services

**`OPENAI_API_KEY`**
- **Purpose:** API key for OpenAI GPT models (used in scenario processing)
- **Required:** Yes (for batch processing features)
- **Format:** `sk-proj-[secret-key-string]`
- **Where to get it:**
  1. Go to [OpenAI Platform](https://platform.openai.com)
  2. Navigate to API Keys
  3. Create new secret key
  4. Copy immediately (only shown once)

---

### Local Development

**`LIVE_SYNC_PORT`**
- **Purpose:** Port for live sync server (real-time Sheets ↔ Monitor updates)
- **Required:** No (only if using live sync feature)
- **Default:** 3333
- **Format:** Any available port number

---

## 🚀 Initial Setup Instructions

### Step 1: Copy Environment Template

```bash
cd /Users/aarontjomsland/Documents/er-simulator-superrepo/simulator-core/er-sim-monitor
cp .env.example .env
```

### Step 2: Fill in Google Cloud Credentials

1. Create Google Cloud Project (if not exists):
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create new project or select existing
   - Enable APIs:
     - Google Drive API
     - Google Sheets API
     - Google Apps Script API

2. Create OAuth 2.0 Credentials:
   - APIs & Services → Credentials → Create Credentials → OAuth client ID
   - Application type: **Desktop app**
   - Copy `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to `.env`

### Step 3: Add Sheet and Script IDs

1. Open your Google Sheet
2. Copy Sheet ID from URL → paste as `GOOGLE_SHEET_ID`
3. Open Apps Script project → Settings → copy Script ID → paste as `APPS_SCRIPT_ID`

### Step 4: Add OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create new API key
3. Copy key → paste as `OPENAI_API_KEY` in `.env`

### Step 5: Authenticate Google APIs

```bash
npm run auth-google
```

This will:
- Open browser for Google OAuth consent
- Save token to `./config/token.json`
- Enable Drive, Sheets, and Apps Script API access

### Step 6: Test Configuration

```bash
# Test all API access
node scripts/testAllAPIs.cjs

# Expected output:
# ✅ Drive API: WORKING
# ✅ Sheets API: WORKING
# ✅ Apps Script API: WORKING
```

---

## 🔒 Security Best Practices

### Never Commit Secrets

The `.env` file is git-ignored. **Never**:
- Commit `.env` to version control
- Share `.env` contents in chat/email
- Hardcode API keys in source code

### Rotate Keys Regularly

If you suspect key exposure:
1. **Google OAuth:** Revoke and regenerate in Cloud Console
2. **OpenAI API:** Revoke and create new key in OpenAI Platform
3. Update `.env` with new values
4. Re-run `npm run auth-google` for Google services

### Token Refresh

OAuth tokens expire automatically. If you see auth errors:
```bash
rm config/token.json
npm run auth-google
```

---

## 🛠️ Troubleshooting

### "Invalid credentials" errors

**Cause:** Missing or incorrect `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`

**Fix:**
1. Verify credentials in Google Cloud Console
2. Ensure they match Desktop app type (not Web app)
3. Update `.env` with correct values

### "Spreadsheet not found" errors

**Cause:** Incorrect `GOOGLE_SHEET_ID` or missing permissions

**Fix:**
1. Verify Sheet ID in `.env`
2. Ensure Google account has access to sheet
3. Re-authenticate: `npm run auth-google`

### "API key invalid" errors (OpenAI)

**Cause:** Expired, revoked, or incorrect API key

**Fix:**
1. Generate new key in OpenAI Platform
2. Update `OPENAI_API_KEY` in `.env`
3. Test: `node -e "console.log(process.env.OPENAI_API_KEY)"`

---

## 📚 Related Documentation

- [Google Cloud OAuth 2.0 Setup](https://developers.google.com/identity/protocols/oauth2)
- [Google Sheets API Quickstart](https://developers.google.com/sheets/api/quickstart/nodejs)
- [OpenAI API Documentation](https://platform.openai.com/docs/api-reference)
- [Apps Script API Reference](https://developers.google.com/apps-script/api/reference/rest)

---

## 📝 Changelog

- **2025-11-14:** Initial documentation created during super-repo consolidation
- Added all environment variables from working `.env`
- Created comprehensive setup guide
