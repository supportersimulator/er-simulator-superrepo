# Web App Setup Instructions

## Current Status
✅ Web app endpoint code added to Apps Script
✅ Deployment created programmatically
⚠️  Needs one-time manual authorization

## Deployment Details
- **Deployment ID**: `AKfycbxUG6Dvljf2ObdLFqRF3HqkY6GbJLq9C1GJx99SpkKmAX8ZKxsQC82IzMD4Sfikrizs`
- **Web App URL**: `https://script.google.com/macros/s/AKfycbxUG6Dvljf2ObdLFqRF3HqkY6GbJLq9C1GJx99SpkKmAX8ZKxsQC82IzMD4Sfikrizs/exec`

## Setup Steps

### Step 1: Open Apps Script Project
Visit: https://script.google.com/home/projects/1NXjFvH2Wo117saCyqmNDfCqZ1iQ9vykxa0-kHUhFAYDuhthgql5Ru_P6/edit

### Step 2: Configure Deployment Permissions
1. Click **"Deploy"** → **"Manage deployments"**
2. Find the deployment: "Web App - ER Simulator Batch Processor API"
3. Click the pencil icon (✏️) to edit
4. Configure:
   - **Execute as**: Me (aarontjomsland@gmail.com)
   - **Who has access**: Anyone
5. Click **"Deploy"**
6. **Authorize** when prompted (this is the critical step!)
7. Copy the Web App URL (should match the URL above)

### Step 3: Test the Endpoint
Once authorized, test with curl:

```bash
curl "https://script.google.com/macros/s/AKfycbxUG6Dvljf2ObdLFqRF3HqkY6GbJLq9C1GJx99SpkKmAX8ZKxsQC82IzMD4Sfikrizs/exec?action=status"
```

Expected response:
```json
{
  "status": "ok",
  "message": "ER Simulator Batch Processor API",
  "timestamp": "2025-01-01T12:00:00.000Z",
  "endpoints": {
    "status": "GET ?action=status",
    "startBatch": "POST with JSON body",
    "stepBatch": "POST with JSON body",
    "finishBatch": "POST with JSON body"
  }
}
```

### Step 4: Run Batch Processing
Once working, trigger batch processing programmatically:

```bash
npm run run-batch-http "2,3"
```

## API Endpoints

### GET /exec?action=status
Check API health

### POST /exec
**Action: runAll** - Process complete batch end-to-end (blocking)
```json
{
  "action": "runAll",
  "inputSheet": "Input",
  "outputSheet": "Master Scenario Convert",
  "mode": "RUN_25",
  "spec": ""
}
```

**Action: startBatch** - Initialize batch
```json
{
  "action": "startBatch",
  "inputSheet": "Input",
  "outputSheet": "Master Scenario Convert",
  "mode": "specific",
  "spec": "2,3"
}
```

**Action: stepBatch** - Process one row
```json
{
  "action": "stepBatch"
}
```

**Action: finishBatch** - Complete and get report
```json
{
  "action": "finishBatch"
}
```

## Troubleshooting

### "Page Not Found" Error
- Web app needs initial authorization through Google's consent screen
- Follow Step 2 above to authorize

### "Unauthorized" Error
- Check "Execute as" is set to "Me"
- Check "Who has access" is set to "Anyone"

### "Script function not found" Error
- Verify WebAppEndpoint.gs file exists in project
- Check `doGet()` and `doPost()` functions are present

## Security Note
Setting "Who has access" to "Anyone" means the web app can be called without authentication. The duplicate detection system prevents accidental reprocessing, but consider using "Anyone with Google account" for additional security if needed.
