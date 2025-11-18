const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

async function searchDriveBackups() {
  const tokenPath = path.join(process.env.HOME, 'er-sim-monitor', 'config', 'token.json');
  
  if (!fs.existsSync(tokenPath)) {
    console.log('No token.json found');
    return;
  }

  const token = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials(token);

  const drive = google.drive({ version: 'v3', auth: oauth2Client });

  // Search for files/folders with "backup" or "Apps Script" in name, modified today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayISO = today.toISOString();

  const res = await drive.files.list({
    q: `(name contains 'backup' or name contains 'Apps Script' or name contains 'Apps_Script') and modifiedTime >= '${todayISO}'`,
    fields: 'files(id, name, modifiedTime, mimeType)',
    orderBy: 'modifiedTime desc',
    pageSize: 50
  });

  console.log('Backups from today (2025-11-12):');
  res.data.files.forEach(file => {
    console.log(`${file.modifiedTime} - ${file.name} (${file.id})`);
  });
}

searchDriveBackups().catch(console.error);
