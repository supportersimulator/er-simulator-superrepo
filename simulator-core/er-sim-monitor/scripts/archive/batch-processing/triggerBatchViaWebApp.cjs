#!/usr/bin/env node

/**
 * Trigger Batch Processing via Web App
 *
 * Uses the deployed web app URL to trigger batch processing
 *
 * Usage:
 *   node scripts/triggerBatchViaWebApp.cjs [rows]
 */

const https = require('https');
require('dotenv').config();

const DEPLOYMENT_ID = process.env.DEPLOYMENT_ID;

/**
 * Make HTTP request to web app
 */
function makeRequest(url, params) {
  return new Promise((resolve, reject) => {
    const queryString = new URLSearchParams(params).toString();
    const fullUrl = `${url}?${queryString}`;

    console.log(`📡 Requesting: ${fullUrl.substring(0, 100)}...`);
    console.log('');

    https.get(fullUrl, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log(`✅ Status: ${res.statusCode}`);
        console.log('');
        resolve({ statusCode: res.statusCode, body: data });
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Trigger batch processing
 */
async function triggerBatch(rowSpec) {
  console.log('');
  console.log('🚀 TRIGGERING BATCH PROCESSING VIA WEB APP');
  console.log('════════════════════════════════════════════════════');
  console.log(`Deployment ID: ${DEPLOYMENT_ID}`);
  console.log(`Rows to process: ${rowSpec}`);
  console.log('════════════════════════════════════════════════════');
  console.log('');

  try {
    const webAppUrl = `https://script.google.com/macros/s/${DEPLOYMENT_ID}/exec`;

    // Step 1: Initialize batch
    console.log('⚡ STEP 1: Initializing batch processing...');
    const initResponse = await makeRequest(webAppUrl, {
      action: 'startBatch',
      inputSheet: 'Input',
      outputSheet: 'Master Scenario Convert',
      mode: 'specific',
      spec: rowSpec
    });

    console.log('Response:');
    console.log(initResponse.body.substring(0, 500));
    console.log('');

    console.log('════════════════════════════════════════════════════');
    console.log('✅ BATCH PROCESSING TRIGGERED');
    console.log('════════════════════════════════════════════════════');
    console.log('');
    console.log('The batch is now running in Google Sheets.');
    console.log('Monitor progress in the Batch_Reports sheet.');
    console.log('');

  } catch (error) {
    console.error('');
    console.error('❌ TRIGGER FAILED');
    console.error('════════════════════════════════════════════════════');
    console.error(`Error: ${error.message}`);
    console.error('');
    process.exit(1);
  }
}

// Run trigger
const rowSpec = process.argv[2] || '2,3';
if (require.main === module) {
  triggerBatch(rowSpec).catch(console.error);
}

module.exports = { triggerBatch };
