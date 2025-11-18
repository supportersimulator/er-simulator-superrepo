#!/usr/bin/env node

/**
 * Run Batch Processing via HTTP
 *
 * Triggers batch processing through the web app endpoint
 *
 * Usage:
 *   node scripts/runBatchViaHTTP.cjs [rows]
 *   Example: node scripts/runBatchViaHTTP.cjs "2,3"
 */

const https = require('https');
require('dotenv').config();

const WEB_APP_URL = process.env.WEB_APP_URL;

/**
 * Make HTTPS POST request with redirect following
 */
function makePostRequest(url, data) {
  return new Promise((resolve, reject) => {
    const dataString = JSON.stringify(data);

    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': dataString.length
      },
      followAllRedirects: true
    };

    const req = https.request(options, (res) => {
      // Handle redirects
      if (res.statusCode === 302 || res.statusCode === 301) {
        const redirectUrl = res.headers.location;
        if (redirectUrl) {
          https.get(redirectUrl, (redirectRes) => {
            let responseData = '';
            redirectRes.on('data', (chunk) => {
              responseData += chunk;
            });
            redirectRes.on('end', () => {
              try {
                const parsed = JSON.parse(responseData);
                resolve({ statusCode: redirectRes.statusCode, body: parsed });
              } catch (e) {
                resolve({ statusCode: redirectRes.statusCode, body: responseData });
              }
            });
          }).on('error', reject);
          return;
        }
      }

      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({ statusCode: res.statusCode, body: parsed });
        } catch (e) {
          // Not JSON, return raw
          resolve({ statusCode: res.statusCode, body: responseData });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(dataString);
    req.end();
  });
}

/**
 * Make HTTPS GET request with redirect following
 */
function makeGetRequest(url, redirectCount = 0) {
  return new Promise((resolve, reject) => {
    if (redirectCount > 5) {
      reject(new Error('Too many redirects'));
      return;
    }

    https.get(url, (res) => {
      // Handle redirects
      if (res.statusCode === 302 || res.statusCode === 301) {
        const redirectUrl = res.headers.location;
        if (redirectUrl) {
          makeGetRequest(redirectUrl, redirectCount + 1).then(resolve).catch(reject);
          return;
        }
      }

      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({ statusCode: res.statusCode, body: parsed });
        } catch (e) {
          // Not JSON, return raw
          resolve({ statusCode: res.statusCode, body: responseData });
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

/**
 * Run batch processing
 */
async function runBatchViaHTTP(rowSpec) {
  console.log('');
  console.log('🚀 RUNNING BATCH PROCESSING VIA HTTP');
  console.log('════════════════════════════════════════════════════');
  console.log(`Web App URL: ${WEB_APP_URL}`);
  console.log(`Rows to process: ${rowSpec}`);
  console.log('════════════════════════════════════════════════════');
  console.log('');

  if (!WEB_APP_URL) {
    throw new Error('WEB_APP_URL not found in .env. Run npm run deploy-web-app first.');
  }

  try {
    // Step 1: Check status
    console.log('📊 STEP 1: Checking API status...');
    const statusResponse = await makeGetRequest(`${WEB_APP_URL}?action=status`);

    if (statusResponse.statusCode === 200 && typeof statusResponse.body === 'object') {
      console.log('✅ API is online');
      console.log(`   Status: ${statusResponse.body.status}`);
      console.log(`   Message: ${statusResponse.body.message}`);
    } else {
      console.log('⚠️  Unexpected status response:');
      console.log(JSON.stringify(statusResponse.body, null, 2).substring(0, 500));
    }
    console.log('');

    // Step 2: Run batch processing (end-to-end)
    console.log('⚡ STEP 2: Starting batch processing...');
    console.log('   Action: runAll (complete batch end-to-end)');
    console.log('');

    const batchResponse = await makePostRequest(WEB_APP_URL, {
      action: 'runAll',
      inputSheet: 'Input',
      outputSheet: 'Master Scenario Convert',
      mode: 'specific',
      spec: rowSpec
    });

    console.log('✅ Batch processing complete!');
    console.log('');

    if (typeof batchResponse.body === 'object') {
      console.log('📋 BATCH RESULTS:');
      console.log('════════════════════════════════════════════════════');
      console.log(JSON.stringify(batchResponse.body, null, 2));
      console.log('');
    } else {
      console.log('⚠️  Unexpected response format:');
      console.log(String(batchResponse.body).substring(0, 1000));
      console.log('');
    }

    console.log('════════════════════════════════════════════════════');
    console.log('✅ BATCH PROCESSING COMPLETE');
    console.log('════════════════════════════════════════════════════');
    console.log('');
    console.log('Next steps:');
    console.log('   1. Check Master Scenario Convert sheet for new rows');
    console.log('   2. Review Batch_Reports sheet for processing summary');
    console.log('');

  } catch (error) {
    console.error('');
    console.error('❌ BATCH PROCESSING FAILED');
    console.error('════════════════════════════════════════════════════');
    console.error(`Error: ${error.message}`);
    console.error('');

    if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
      console.error('💡 Network error - check your internet connection');
      console.error('');
    } else if (error.message.includes('WEB_APP_URL not found')) {
      console.error('💡 Run: npm run deploy-web-app');
      console.error('');
    } else {
      console.error('💡 The web app may need manual authorization');
      console.error('   See: WEB_APP_SETUP_INSTRUCTIONS.md');
      console.error('');
    }

    process.exit(1);
  }
}

// Run batch processing
const rowSpec = process.argv[2] || '2,3';
if (require.main === module) {
  runBatchViaHTTP(rowSpec).catch(console.error);
}

module.exports = { runBatchViaHTTP };
