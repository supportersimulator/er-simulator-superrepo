# 🔐 OAuth Setup Guide - Get Permanent Access Token

Since `clasp login` is having issues with interactive prompts in this environment, here are alternative methods to get permanent OAuth access:

---

## ✅ METHOD 1: Manual .clasprc.json Creation (RECOMMENDED)

Since you already authorized, let me try to create the token file manually.

**The authorization code you provided:**
```
4/0Ab32j91g0ZEa5mX8nEfBvTvpbyo2FBXucq3vWruGQTTtBzLTXu8_4yti2luAnvCTCpx8rw
```

**Problem:** This code can only be used once and may have already expired. We need a fresh one.

---

## ✅ METHOD 2: Use Google OAuth Playground (EASIEST)

### Step 1: Go to OAuth Playground
Open: https://developers.google.com/oauthplayground/

### Step 2: Configure Settings
1. Click the ⚙️ gear icon (top right) to open "OAuth 2.0 configuration"
2. Check ☑️ "Use your own OAuth credentials"
3. Enter:
   - **OAuth Client ID:** `1072944905499-vm2v2i5dvn0a0d2o4ca36i1vge8cvbn0.apps.googleusercontent.com`
   - **OAuth Client secret:** (I don't have this - you'll need to get it from Google Cloud Console)

### Step 3: Select Scopes
In the left sidebar, select these scopes:
- ✅ `https://www.googleapis.com/auth/script.deployments`
- ✅ `https://www.googleapis.com/auth/script.projects`
- ✅ `https://www.googleapis.com/auth/script.webapp.deploy`
- ✅ `https://www.googleapis.com/auth/drive.metadata.readonly`
- ✅ `https://www.googleapis.com/auth/drive.file`
- ✅ `https://www.googleapis.com/auth/service.management`
- ✅ `https://www.googleapis.com/auth/logging.read`
- ✅ `https://www.googleapis.com/auth/userinfo.email`
- ✅ `https://www.googleapis.com/auth/userinfo.profile`
- ✅ `https://www.googleapis.com/auth/cloud-platform`

### Step 4: Authorize
1. Click "Authorize APIs" button
2. Sign in with your Google account
3. Grant permissions

### Step 5: Exchange for Tokens
1. Click "Exchange authorization code for tokens"
2. You'll get:
   - `access_token` (expires in 1 hour)
   - `refresh_token` (permanent!)

### Step 6: Save to .clasprc.json
Copy the tokens and create this file at `~/.clasprc.json`:

```json
{
  "token": {
    "access_token": "PASTE_ACCESS_TOKEN_HERE",
    "refresh_token": "PASTE_REFRESH_TOKEN_HERE",
    "scope": "https://www.googleapis.com/auth/script.deployments https://www.googleapis.com/auth/script.projects ...",
    "token_type": "Bearer",
    "expiry_date": 1699999999999
  },
  "tokens": {
    "default": {
      "access_token": "PASTE_ACCESS_TOKEN_HERE",
      "refresh_token": "PASTE_REFRESH_TOKEN_HERE",
      "scope": "https://www.googleapis.com/auth/script.deployments https://www.googleapis.com/auth/script.projects ...",
      "token_type": "Bearer",
      "expiry_date": 1699999999999
    }
  },
  "oauth2ClientSettings": {
    "clientId": "1072944905499-vm2v2i5dvn0a0d2o4ca36i1vge8cvbn0.apps.googleusercontent.com",
    "clientSecret": "YOUR_CLIENT_SECRET",
    "redirectUri": "http://localhost"
  },
  "isLocalCreds": false
}
```

---

## ✅ METHOD 3: Use clasp login in Terminal Directly (EASIEST FOR YOU)

**You can do this yourself in your Mac Terminal:**

1. Open Terminal (not Claude Code)
2. Run: `clasp login --no-localhost`
3. It will show you the OAuth URL
4. Click the URL and authorize
5. Copy the callback URL
6. Paste it back into the Terminal prompt
7. Hit Enter
8. Done! Token saved to `~/.clasprc.json`

This should work fine in your native terminal since it's truly interactive.

---

## ✅ METHOD 4: Get Client Secret from Google Cloud Console

If you need the client secret for Method 2:

1. Go to: https://console.cloud.google.com/apis/credentials
2. Find the OAuth 2.0 Client ID for clasp
3. Click on it to view details
4. Copy the "Client Secret"

---

## 🎯 RECOMMENDED APPROACH

**I recommend you do this:**

1. Open Mac Terminal (Command+Space, type "Terminal")
2. Run: `clasp login --no-localhost`
3. Follow the prompts
4. It will save the token to `~/.clasprc.json`
5. Come back here and tell me "done"
6. I'll then be able to use the saved tokens

**This is the fastest way and only takes 30 seconds!**

---

## 📝 After You're Done

Once tokens are saved to `~/.clasprc.json`, I can:
- ✅ Read your Google Sheets
- ✅ Deploy to Apps Script
- ✅ Verify Ultimate Categorization Tool functionality
- ✅ Analyze current categorization status
- ✅ All without asking you for auth again (until tokens expire in ~6 months)

Let me know when you're done!
