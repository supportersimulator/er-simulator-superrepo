const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function main() {
  console.log('🔧 Fixing Quote Escaping\n');

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
  const panelFile = project.data.files.find(f => f.name === 'Phase2_Enhanced_Categories_With_AI');

  let source = panelFile.source;

  const BEFORE = '.replace(/\'/g, "\\\\\'"';
  const AFTER = '.replace(/\'/g, \'&apos;\')';

  const count = (source.match(new RegExp(BEFORE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;

  console.log('Found', count, 'instances to fix\n');

  source = source.split(BEFORE).join(AFTER);

  panelFile.source = source;

  console.log('🚀 Deploying...\n');

  await script.projects.updateContent({
    scriptId: scriptId,
    requestBody: { files: project.data.files }
  });

  console.log('✅ Done! Hard refresh and test.\n');
}

main().catch(console.error);
