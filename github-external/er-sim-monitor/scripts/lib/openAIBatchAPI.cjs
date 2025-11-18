#!/usr/bin/env node

/**
 * OpenAI Batch API Integration
 *
 * Uses OpenAI's Batch API for 50% cost reduction and 24-hour processing window
 * Perfect for processing hundreds/thousands of scenarios overnight
 *
 * Benefits:
 * - 50% cheaper than standard API ($0.075/1k input vs $0.15/1k)
 * - No rate limits (process thousands at once)
 * - Automatic retry on failures
 * - Results available within 24 hours
 *
 * Process:
 * 1. Create batch file (JSONL format)
 * 2. Upload to OpenAI
 * 3. Submit batch job
 * 4. Poll for completion
 * 5. Download and process results
 *
 * API Reference: https://platform.openai.com/docs/api-reference/batch
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_BASE = 'https://api.openai.com/v1';

/**
 * Make OpenAI API request
 */
function makeOpenAIRequest(endpoint, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, OPENAI_API_BASE);

    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method,
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          }
        } catch (e) {
          reject(new Error(`Failed to parse response: ${data}`));
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

/**
 * Upload file to OpenAI
 */
async function uploadFile(filePath, purpose = 'batch') {
  return new Promise((resolve, reject) => {
    const FormData = require('form-data');
    const form = new FormData();

    form.append('purpose', purpose);
    form.append('file', fs.createReadStream(filePath));

    const options = {
      hostname: 'api.openai.com',
      path: '/v1/files',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        ...form.getHeaders()
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          }
        } catch (e) {
          reject(new Error(`Failed to parse response: ${data}`));
        }
      });
    });

    req.on('error', reject);
    form.pipe(req);
  });
}

/**
 * Create batch input file in JSONL format
 *
 * @param {Array} requests - Array of {custom_id, prompt} objects
 * @param {Object} options - Batch options
 * @returns {string} Path to created JSONL file
 */
function createBatchFile(requests, options = {}) {
  const {
    model = 'gpt-4o-mini',
    temperature = 0.7,
    maxTokens = 3000,
    outputPath = null
  } = options;

  const batchId = `batch_${Date.now()}`;
  const filePath = outputPath || path.join(__dirname, '..', '..', 'temp', `${batchId}.jsonl`);

  // Ensure temp directory exists
  const tempDir = path.dirname(filePath);
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  // Create JSONL file (one JSON object per line)
  const lines = requests.map(req => {
    const batchRequest = {
      custom_id: req.custom_id,
      method: 'POST',
      url: '/v1/chat/completions',
      body: {
        model,
        messages: req.messages,
        temperature,
        max_tokens: maxTokens
      }
    };
    return JSON.stringify(batchRequest);
  });

  fs.writeFileSync(filePath, lines.join('\n'));

  return filePath;
}

/**
 * Submit batch job to OpenAI
 *
 * @param {string} inputFileId - File ID from upload
 * @param {Object} options - Batch options
 * @returns {Object} Batch job details
 */
async function createBatch(inputFileId, options = {}) {
  const {
    endpoint = '/v1/chat/completions',
    completionWindow = '24h',
    metadata = {}
  } = options;

  const response = await makeOpenAIRequest('/batches', 'POST', {
    input_file_id: inputFileId,
    endpoint,
    completion_window: completionWindow,
    metadata
  });

  return response;
}

/**
 * Check batch status
 *
 * @param {string} batchId - Batch ID
 * @returns {Object} Batch status
 */
async function getBatchStatus(batchId) {
  return await makeOpenAIRequest(`/batches/${batchId}`);
}

/**
 * List all batches
 *
 * @param {number} limit - Max batches to return
 * @returns {Object} List of batches
 */
async function listBatches(limit = 20) {
  return await makeOpenAIRequest(`/batches?limit=${limit}`);
}

/**
 * Cancel batch
 *
 * @param {string} batchId - Batch ID
 * @returns {Object} Cancellation response
 */
async function cancelBatch(batchId) {
  return await makeOpenAIRequest(`/batches/${batchId}/cancel`, 'POST');
}

/**
 * Download batch results
 *
 * @param {string} fileId - Output file ID from completed batch
 * @param {string} outputPath - Where to save results
 * @returns {Array} Parsed results
 */
async function downloadBatchResults(fileId, outputPath = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.openai.com',
      path: `/v1/files/${fileId}/content`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          // Parse JSONL (one JSON per line)
          const results = data.split('\n')
            .filter(line => line.trim())
            .map(line => JSON.parse(line));

          // Save to file if requested
          if (outputPath) {
            fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
          }

          resolve(results);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

/**
 * Poll batch until completion
 *
 * @param {string} batchId - Batch ID
 * @param {Object} options - Polling options
 * @returns {Object} Final batch status
 */
async function pollBatchCompletion(batchId, options = {}) {
  const {
    pollInterval = 60000, // 60 seconds
    maxWaitTime = 86400000, // 24 hours
    onProgress = null
  } = options;

  const startTime = Date.now();

  while (true) {
    const status = await getBatchStatus(batchId);

    if (onProgress) {
      onProgress(status);
    }

    // Check if complete
    if (status.status === 'completed') {
      return status;
    }

    // Check if failed
    if (status.status === 'failed' || status.status === 'expired' || status.status === 'cancelled') {
      throw new Error(`Batch ${status.status}: ${JSON.stringify(status.errors || {})}`);
    }

    // Check timeout
    if (Date.now() - startTime > maxWaitTime) {
      throw new Error(`Batch polling timeout after ${maxWaitTime}ms`);
    }

    // Wait before next poll
    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }
}

/**
 * Process batch end-to-end
 *
 * @param {Array} requests - Array of {custom_id, messages} objects
 * @param {Object} options - Processing options
 * @returns {Array} Results
 */
async function processBatch(requests, options = {}) {
  const {
    batchOptions = {},
    pollOptions = {},
    saveBatchFile = true,
    saveResults = true
  } = options;

  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('           OPENAI BATCH API PROCESSING');
  console.log('═══════════════════════════════════════════════════');
  console.log('');

  // Step 1: Create batch file
  console.log(`📝 Creating batch file with ${requests.length} requests...`);
  const batchFilePath = createBatchFile(requests, batchOptions);
  console.log(`✅ Batch file created: ${batchFilePath}`);
  console.log('');

  // Step 2: Upload to OpenAI
  console.log('☁️  Uploading batch file to OpenAI...');
  const fileUpload = await uploadFile(batchFilePath);
  console.log(`✅ File uploaded: ${fileUpload.id}`);
  console.log('');

  // Step 3: Create batch job
  console.log('🚀 Submitting batch job...');
  const batch = await createBatch(fileUpload.id, batchOptions);
  console.log(`✅ Batch created: ${batch.id}`);
  console.log(`   Status: ${batch.status}`);
  console.log(`   Completion window: ${batch.completion_window}`);
  console.log('');

  // Step 4: Poll for completion
  console.log('⏳ Waiting for batch to complete...');
  console.log('   (This may take up to 24 hours for large batches)');
  console.log('');

  const completedBatch = await pollBatchCompletion(batch.id, {
    ...pollOptions,
    onProgress: (status) => {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] Status: ${status.status} | Progress: ${status.request_counts?.completed || 0}/${status.request_counts?.total || 0}`);
    }
  });

  console.log('');
  console.log('✅ Batch completed!');
  console.log(`   Total: ${completedBatch.request_counts.total}`);
  console.log(`   Completed: ${completedBatch.request_counts.completed}`);
  console.log(`   Failed: ${completedBatch.request_counts.failed}`);
  console.log('');

  // Step 5: Download results
  console.log('📥 Downloading results...');
  const resultsPath = saveResults
    ? path.join(__dirname, '..', '..', 'temp', `batch_${batch.id}_results.json`)
    : null;

  const results = await downloadBatchResults(completedBatch.output_file_id, resultsPath);

  if (resultsPath) {
    console.log(`✅ Results saved: ${resultsPath}`);
  }
  console.log('');

  // Cleanup batch file if requested
  if (!saveBatchFile && fs.existsSync(batchFilePath)) {
    fs.unlinkSync(batchFilePath);
  }

  console.log('═══════════════════════════════════════════════════');
  console.log('✅ BATCH PROCESSING COMPLETE');
  console.log('═══════════════════════════════════════════════════');
  console.log('');

  return results;
}

/**
 * Calculate batch cost estimate
 */
function estimateBatchCost(numRequests, avgInputTokens = 2500, avgOutputTokens = 1500) {
  // Batch API pricing (50% off standard)
  const inputCostPer1k = 0.075;  // $0.075/1k (was $0.15)
  const outputCostPer1k = 0.30;  // $0.30/1k (was $0.60)

  const inputCost = (numRequests * avgInputTokens / 1000) * inputCostPer1k;
  const outputCost = (numRequests * avgOutputTokens / 1000) * outputCostPer1k;
  const totalCost = inputCost + outputCost;

  return {
    inputCost: Math.round(inputCost * 100) / 100,
    outputCost: Math.round(outputCost * 100) / 100,
    totalCost: Math.round(totalCost * 100) / 100,
    costPerRequest: Math.round((totalCost / numRequests) * 10000) / 10000
  };
}

module.exports = {
  createBatchFile,
  uploadFile,
  createBatch,
  getBatchStatus,
  listBatches,
  cancelBatch,
  downloadBatchResults,
  pollBatchCompletion,
  processBatch,
  estimateBatchCost
};
