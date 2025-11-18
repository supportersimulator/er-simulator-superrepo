/**
 * Remove ALL Duplicate applyCategorizationUpdates Functions
 * Keep only the one that writes to columns R, S (18, 19)
 */

const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function main() {
  console.log('🔧 Removing ALL Duplicate Apply Functions\n');

  const token = JSON.parse(fs.readFileSync('./config/token.json', 'utf-8'));
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/oauth2callback'
  );
  oAuth2Client.setCredentials(token);

  const script = google.script({ version: 'v1', auth: oAuth2Client });
  const scriptId = process.env.APPS_SCRIPT_ID;

  const project = await script.projects.getContent({ scriptId });
  const codeFile = project.data.files.find(f => f.name === 'Code');

  // Find ALL applyCategorizationUpdates functions
  const matches = [...codeFile.source.matchAll(/function applyCategorizationUpdates\([^)]*\)[\s\S]*?(?=\nfunction [a-z]|\n\/\*\*\*|$)/g)];

  console.log('Found ' + matches.length + ' applyCategorizationUpdates functions\n');

  // Check each version
  const versions = matches.map((match, i) => {
    const func = match[0];
    const usesRS = func.includes('masterSheet.getRange(row, 18)') && func.includes('masterSheet.getRange(row, 19)');
    const usesXY = func.includes('masterSheet.getRange(row, 24)') && func.includes('masterSheet.getRange(row, 25)');

    console.log('Version ' + (i + 1) + ' at position ' + match.index + ':');
    if (usesRS) {
      console.log('  ✅ Writes to R, S (18, 19) - Django-compatible - KEEP');
    } else if (usesXY) {
      console.log('  ❌ Writes to X, Y (24, 25) - OLD - DELETE');
    } else {
      console.log('  ❓ Unknown column usage - DELETE to be safe');
    }

    return { index: i, match: match, usesRS: usesRS, usesXY: usesXY };
  });

  console.log('');

  // Find the LAST version that uses R,S (Apps Script uses last defined)
  let keepIndex = -1;
  for (let i = versions.length - 1; i >= 0; i--) {
    if (versions[i].usesRS) {
      keepIndex = i;
      break;
    }
  }

  if (keepIndex === -1) {
    console.log('❌ ERROR: No version writes to R, S!');
    console.log('Cannot proceed - need at least one correct version.\n');
    return;
  }

  console.log('Keeping version ' + (keepIndex + 1) + ' (last R,S version)\n');

  // Remove all EXCEPT the one we want to keep
  let newCode = codeFile.source;

  // Remove from last to first (so indices don't shift)
  for (let i = versions.length - 1; i >= 0; i--) {
    if (i !== keepIndex) {
      console.log('Deleting version ' + (i + 1));
      const start = versions[i].match.index;
      const end = start + versions[i].match[0].length;
      newCode = newCode.substring(0, start) + newCode.substring(end);
    }
  }

  codeFile.source = newCode;

  console.log('');
  console.log('🚀 Deploying...\n');

  await script.projects.updateContent({
    scriptId: scriptId,
    requestBody: { files: project.data.files }
  });

  console.log('✅ Deployed!\n');
  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('✅ Now only ONE applyCategorizationUpdates exists!');
  console.log('   It writes to columns R, S (18, 19) - Django-compatible\n');
  console.log('Next steps:');
  console.log('  1. Clear old data from columns X, Y (optional)');
  console.log('  2. Re-run Apply to populate ALL 207 cases to R, S correctly\n');
}

main().catch(console.error);
