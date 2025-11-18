# Live Real-Time Sync Setup Guide

## 🎯 Overview
This guide walks you through setting up **real-time synchronization** between your Google Sheet and the ER Simulator Monitor UI.

When you edit vitals in the sheet → the Monitor app updates **instantly** via WebSocket.

---

## 📋 Prerequisites

- ✅ Google Sheet with "Master Scenario Convert" tab
- ✅ Apps Script already installed (with ER Simulator menu)
- ✅ Local development environment running

---

## 🚀 Step-by-Step Setup

### 1. Start the Live Sync Server

Open a terminal and run:

```bash
npm run live-sync
```

You should see:
```
📡 Live Sync Server listening on port 3333
```

**Keep this terminal open** - the server must stay running.

---

### 2. Expose Your Local Server to the Internet

In a **new terminal window**, run:

```bash
npx ngrok http 3333
```

You'll see output like:
```
Forwarding   https://abc123.ngrok.io -> http://localhost:3333
```

**Copy the `https://` URL** (e.g., `https://abc123.ngrok.io`)

> **Note:** This URL changes each time you restart ngrok. If you want a permanent URL, sign up for a free ngrok account and get a static domain.

---

### 3. Update Your Google Sheets Apps Script

1. Open your Google Sheet: **Convert_Master_Sim_CSV_Template_with_Input**
2. Go to **Extensions → Apps Script**
3. Find this line near the bottom:

```javascript
const LIVE_SYNC_URL = "https://YOUR_NGROK_URL_HERE/vitals-update";
```

4. Replace it with your ngrok URL:

```javascript
const LIVE_SYNC_URL = "https://abc123.ngrok.io/vitals-update";
```

5. **Save** (Ctrl/Cmd + S)
6. Close Apps Script and return to your sheet

---

### 4. Test the Live Sync

**Terminal 1** (Live Sync Server):
```bash
npm run live-sync
# Should show: 📡 Live Sync Server listening on port 3333
```

**Terminal 2** (ngrok):
```bash
npx ngrok http 3333
# Should show: Forwarding https://abc123.ngrok.io → http://localhost:3333
```

**Terminal 3** (optional - Monitor App):
```bash
npm start
# Opens Expo dev server
```

**In Google Sheet:**
1. Go to "Master Scenario Convert" tab
2. Edit any vitals JSON cell (e.g., change HR from 120 to 125)
3. Press Enter

**You should see:**
- Terminal 1 shows: `🔄 Updated GI01234 from webhook`
- File `/data/vitals.json` updates instantly
- Monitor UI receives WebSocket notification

---

## 🧪 Troubleshooting

### Server doesn't start
**Error:** `EADDRINUSE`
- Port 3333 is already in use
- Solution: Change port in `.env`:
  ```
  LIVE_SYNC_PORT=3334
  ```
- Restart server and ngrok with new port

### Webhook not triggering
**Check:**
1. ngrok URL is correct in Apps Script
2. ngrok is running (shows "Session Status: online")
3. Server is running (`npm run live-sync`)
4. You're editing the correct sheet tab ("Master Scenario Convert")
5. You're editing row 3 or below (rows 1-2 are headers)

### WebSocket not connecting
**Check:**
1. Live Sync Server is running
2. Monitor UI is using correct WebSocket URL:
   ```javascript
   const ws = new WebSocket("ws://localhost:3333");
   ```
3. No firewall blocking port 3333

---

## 🔧 Advanced Configuration

### Persistent ngrok URL

Sign up for free at https://ngrok.com and get a static domain:

```bash
ngrok http 3333 --domain=your-domain.ngrok-free.app
```

Update Apps Script once with permanent URL - no more changes needed!

### Custom Port

In `.env`:
```
LIVE_SYNC_PORT=8080
```

Restart server and ngrok:
```bash
npm run live-sync
npx ngrok http 8080
```

### Production Deployment

For production, replace ngrok with:
- Heroku
- AWS Lambda + API Gateway
- Digital Ocean App Platform
- Google Cloud Run

Update `LIVE_SYNC_URL` in Apps Script to point to your production server.

---

## ✅ Success Checklist

- [ ] Live Sync Server running on port 3333
- [ ] ngrok exposing server to internet
- [ ] Apps Script updated with ngrok URL
- [ ] Test edit in Google Sheet triggers webhook
- [ ] Terminal shows `🔄 Updated [Case ID]`
- [ ] `/data/vitals.json` updates automatically
- [ ] Monitor UI receives WebSocket update

---

## 🎉 You're Done!

Your ER Simulator Monitor now has **real-time synchronization** with Google Sheets!

Any edit in the sheet instantly updates the Monitor UI - perfect for live training scenarios, demonstrations, or collaborative case editing.

---

## 📚 Related Commands

```bash
npm run live-sync          # Start real-time sync server
npm run sync-vitals        # One-time manual sync
npm run remap-waveforms    # Force intelligent waveform re-mapping
npm run fetch-vitals       # Read-only pull from Sheets
```
