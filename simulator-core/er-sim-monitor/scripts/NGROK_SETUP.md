# ngrok Setup Guide

## Step 1: Create ngrok Account

1. Go to https://dashboard.ngrok.com/signup
2. Sign up with your email or GitHub account (it's free)
3. Verify your email if required

## Step 2: Get Your Authtoken

1. Once logged in, go to https://dashboard.ngrok.com/get-started/your-authtoken
2. You'll see an authtoken that looks like: `2aB3cD4eF5gH6iJ7kL8mN9oP0qR1sT2uV3wX4yZ5`
3. Copy this token

## Step 3: Configure ngrok

Run this command in your terminal (replace `<YOUR_TOKEN>` with the token from step 2):

```bash
ngrok config add-authtoken <YOUR_TOKEN>
```

You should see:
```
Authtoken saved to configuration file: /Users/yourusername/.ngrok2/ngrok.yml
```

## Step 4: Start ngrok Tunnel

```bash
npx ngrok http 3333
```

You should see output like:
```
ngrok                                                          (Ctrl+C to quit)

Session Status                online
Account                       Your Name (Plan: Free)
Version                       3.x.x
Region                        United States (us)
Latency                       -
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://abc123def456.ngrok-free.app -> http://localhost:3333

Connections                   ttl     opn     rt1     rt5     p50     p90
                              0       0       0.00    0.00    0.00    0.00
```

**Copy the HTTPS URL** (e.g., `https://abc123def456.ngrok-free.app`)

## Step 5: Update Apps Script

1. Open your Google Sheet: **Convert_Master_Sim_CSV_Template_with_Input**
2. Go to **Extensions → Apps Script**
3. Find line 316:
   ```javascript
   const LIVE_SYNC_URL = "https://YOUR_NGROK_URL_HERE/vitals-update";
   ```
4. Replace with your ngrok URL:
   ```javascript
   const LIVE_SYNC_URL = "https://abc123def456.ngrok-free.app/vitals-update";
   ```
5. **Save** (Ctrl/Cmd + S)
6. Close Apps Script

## Step 6: Test Live Sync

**Keep THREE terminals open:**

**Terminal 1** - Live Sync Server:
```bash
npm run live-sync
```

**Terminal 2** - ngrok:
```bash
npx ngrok http 3333
```

**Terminal 3** - Monitor App (optional):
```bash
npm start
```

**Test it:**
1. Open your Google Sheet
2. Go to "Master Scenario Convert" tab
3. Edit any vitals JSON in a cell (row 3 or below)
4. Press Enter

**You should see:**
- Terminal 1: `🔄 Updated [Case_ID] from webhook`
- File `data/vitals.json` updates automatically
- Monitor UI receives WebSocket update (if connected)

---

## Important Notes

### ngrok URL Changes
The free ngrok URL changes **every time you restart ngrok**. If you restart, you'll need to update the Apps Script again.

### Permanent URL (Optional)
For a permanent URL that doesn't change:
1. Sign up for ngrok's free static domain
2. Run: `ngrok http 3333 --domain=your-domain.ngrok-free.app`
3. Update Apps Script once with the permanent URL

### Troubleshooting

**"Invalid authtoken"**
- Make sure you copied the full token
- Try running `ngrok config add-authtoken` again

**"Address already in use"**
- Your live-sync server might not be running
- Run `npm run live-sync` first, then start ngrok in a separate terminal

**Webhook not triggering**
- Check that ngrok URL is correct in Apps Script (include `/vitals-update`)
- Make sure you're editing row 3 or below
- Check Terminal 1 for any errors

---

## Quick Reference

```bash
# 1. Start live sync server (Terminal 1)
npm run live-sync

# 2. Start ngrok tunnel (Terminal 2)
npx ngrok http 3333

# 3. Copy the HTTPS URL from ngrok output

# 4. Update Apps Script with:
# https://YOUR-NGROK-URL/vitals-update

# 5. Test by editing vitals in Google Sheet
```

---

## Next Steps

Once ngrok is running and Apps Script is updated:
1. Edit any vitals in your Google Sheet
2. Watch the magic happen ✨
3. Your Monitor UI will update in real-time!
