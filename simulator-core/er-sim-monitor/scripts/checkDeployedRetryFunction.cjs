const { google } = require('googleapis');
const fs = require('fs');
require('dotenv').config();

async function checkDeployedCode() {
  const token = JSON.parse(fs.readFileSync('./config/token.json', 'utf-8'));
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/oauth2callback'
  );
  oAuth2Client.setCredentials(token);

  const script = google.script({ version: 'v1', auth: oAuth2Client });
  const scriptId = process.env.APPS_SCRIPT_ID;

  console.log('📥 Fetching deployed Code.gs...\n');

  const project = await script.projects.getContent({ scriptId });
  const codeFile = project.data.files.find(f => f.name === 'Code');

  if (!codeFile) {
    console.log('❌ Code.gs not found');
    return;
  }

  // Check if retryFailedCategorization exists
  const hasRetryFunction = codeFile.source.includes('function retryFailedCategorization');
  console.log('✅ retryFailedCategorization exists:', hasRetryFunction);

  // Check max_tokens value in categorizeBatchWithAI
  const maxTokensMatches = [...codeFile.source.matchAll(/max_tokens:\s*(\d+)/g)];
  console.log('📊 max_tokens values found:', maxTokensMatches.map(m => m[1]));

  // Extract retry function to check for parseInt calls
  const retryFuncMatch = codeFile.source.match(/function retryFailedCategorization\(\)[^{]*\{([\s\S]*?)^}/m);

  if (retryFuncMatch) {
    const funcBody = retryFuncMatch[0];

    // Count parseInt calls
    const parseIntCalls = (funcBody.match(/parseInt\(/g) || []).length;
    console.log('🔢 parseInt() calls in retry function:', parseIntCalls);

    // Check if clearing logic exists
    const hasClearing = funcBody.includes('Clearing failed rows');
    console.log('🧹 Has clearing logic:', hasClearing);

    // Check if validation exists
    const hasValidation = funcBody.includes('Validate resultRow');
    console.log('✅ Has validation logic:', hasValidation);

    // Check how results are written back
    const hasSetValues = funcBody.includes('setValues');
    console.log('📝 Has setValues for write-back:', hasSetValues);

    // Look for any try-catch blocks
    const hasTryCatch = funcBody.includes('try {') && funcBody.includes('catch');
    console.log('🛡️  Has try-catch error handling:', hasTryCatch);

    // Extract Logger.log statements to understand flow
    const logStatements = funcBody.match(/Logger\.log\([^)]+\)/g) || [];
    console.log('\n📋 Logger statements count:', logStatements.length);
    console.log('\n📋 Key logging points:');
    logStatements.slice(0, 5).forEach(log => {
      const cleaned = log.replace(/Logger\.log\(/, '').replace(/\)$/, '');
      console.log('   -', cleaned.substring(0, 80));
    });

    // Check the return statement
    const returnMatch = funcBody.match(/return\s+\{[\s\S]*?\};/);
    if (returnMatch) {
      console.log('\n🔄 Function returns:', returnMatch[0].substring(0, 150).replace(/\n/g, ' '));
    }

    // Check if there's error handling in batch processing
    const batchCallMatch = funcBody.match(/categorizeBatchWithAI\([^)]+\)/);
    if (batchCallMatch) {
      console.log('\n📦 Batch call found:', batchCallMatch[0]);

      // Look for what happens after batch call
      const afterBatchMatch = funcBody.match(/categorizeBatchWithAI\([^)]+\);\s*([\s\S]{0,300})/);
      if (afterBatchMatch) {
        console.log('\n📊 After batch processing:');
        console.log(afterBatchMatch[1].substring(0, 200).replace(/\n/g, '\n   '));
      }
    }
  } else {
    console.log('❌ Could not extract retry function body');
  }

  console.log('\n' + '='.repeat(60));
  console.log('💡 Next Step: Check Apps Script execution logs manually');
  console.log('   1. Open: https://script.google.com');
  console.log('   2. Click: "Executions" in left sidebar');
  console.log('   3. Find: Most recent retryFailedCategorization');
  console.log('   4. Check: Status and any error messages');
  console.log('='.repeat(60));
}

checkDeployedCode().catch(console.error);
