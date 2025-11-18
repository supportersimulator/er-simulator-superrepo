const { google } = require('googleapis');
const fs = require('fs');
require('dotenv').config();

async function extractRetryLogic() {
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

  // Extract the full retry function
  const retryFunc = codeFile.source.match(/function retryFailedCategorization\(\)[^{]*\{([\s\S]*?)^}/m);

  if (retryFunc) {
    const funcBody = retryFunc[0];

    console.log('🔍 RETRY FUNCTION ANALYSIS\n');
    console.log('='.repeat(60));

    // 1. Check how it identifies failed cases
    console.log('\n1️⃣ HOW FAILED CASES ARE IDENTIFIED:\n');
    const identifyMatch = funcBody.match(/for\s*\([^)]*i\s*=\s*2[^}]*?\{[\s\S]*?if\s*\([^)]*empty[^)]*\)[^}]*?\{([\s\S]*?)\}/);
    if (identifyMatch) {
      console.log(identifyMatch[0].substring(0, 400));
    }

    // 2. Check the batch processing
    console.log('\n2️⃣ BATCH PROCESSING LOGIC:\n');
    const batchMatch = funcBody.match(/for\s*\([^)]*batchNum[\s\S]*?categorizeBatchWithAI[\s\S]{0,500}/);
    if (batchMatch) {
      console.log(batchMatch[0]);
    }

    // 3. Check how results are written back
    console.log('\n3️⃣ RESULTS WRITE-BACK LOGIC:\n');
    const writeMatch = funcBody.match(/retryResults\.forEach[\s\S]{0,800}/);
    if (writeMatch) {
      console.log(writeMatch[0]);
    }

    // 4. Check the return statement
    console.log('\n4️⃣ RETURN VALUE:\n');
    const returnMatch = funcBody.match(/return\s+\{[\s\S]*?\};/);
    if (returnMatch) {
      console.log(returnMatch[0]);
    }

    // Save full function to file for inspection
    fs.writeFileSync('./scripts/extracted_retry_function.gs', funcBody);
    console.log('\n✅ Full function saved to: ./scripts/extracted_retry_function.gs');
  } else {
    console.log('❌ Could not extract retry function');
  }
}

extractRetryLogic().catch(console.error);
