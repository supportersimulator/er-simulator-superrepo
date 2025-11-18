/**
 * Web App Endpoint for Programmatic Batch Processing
 *
 * Add this code to your Apps Script project to enable HTTP-triggered batch processing
 *
 * Deployment:
 * 1. Copy this code into your Apps Script project
 * 2. Deploy as Web App: Deploy → New deployment
 * 3. Set "Execute as": Me
 * 4. Set "Who has access": Anyone (or "Anyone with Google account" for more security)
 * 5. Deploy and copy the Web App URL
 */

/**
 * Handle HTTP GET requests
 * Test URL format: https://script.google.com/macros/s/{DEPLOYMENT_ID}/exec?action=status
 */
function doGet(e) {
  const params = e.parameter || {};
  const action = params.action || 'status';

  try {
    if (action === 'status') {
      return respondJSON_({
        status: 'ok',
        message: 'ER Simulator Batch Processor API',
        timestamp: new Date().toISOString(),
        endpoints: {
          status: 'GET ?action=status',
          startBatch: 'POST with JSON body',
          stepBatch: 'POST with JSON body',
          finishBatch: 'POST with JSON body'
        }
      });
    }

    return respondJSON_({ error: 'Unknown action. Use POST for batch operations.' }, 400);

  } catch (error) {
    return respondJSON_({ error: error.message, stack: error.stack }, 500);
  }
}

/**
 * Handle HTTP POST requests
 *
 * Supported actions:
 * - startBatch: Initialize batch processing
 * - stepBatch: Process one row (call repeatedly)
 * - finishBatch: Complete batch and get report
 * - runAll: Run complete batch end-to-end (blocking)
 */
function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents || '{}');
    const action = payload.action;

    Logger.log(`📡 doPost received: ${action}`);
    Logger.log(`   Payload: ${JSON.stringify(payload, null, 2)}`);

    switch (action) {
      case 'startBatch':
        return handleStartBatch_(payload);

      case 'stepBatch':
        return handleStepBatch_(payload);

      case 'finishBatch':
        return handleFinishBatch_(payload);

      case 'runAll':
        return handleRunAll_(payload);

      default:
        return respondJSON_({ error: `Unknown action: ${action}` }, 400);
    }

  } catch (error) {
    Logger.log(`❌ doPost error: ${error.message}`);
    return respondJSON_({ error: error.message, stack: error.stack }, 500);
  }
}

/**
 * Start batch processing
 *
 * Payload:
 * {
 *   "action": "startBatch",
 *   "inputSheet": "Input",
 *   "outputSheet": "Master Scenario Convert",
 *   "mode": "specific",
 *   "spec": "2,3"
 * }
 */
function handleStartBatch_(payload) {
  const inputSheet = payload.inputSheet || 'Input';
  const outputSheet = payload.outputSheet || 'Master Scenario Convert';
  const mode = payload.mode || 'RUN_ALL';
  const spec = payload.spec || '';

  Logger.log(`🚀 Starting batch: ${mode} - ${spec}`);

  const result = startBatchFromSidebar(inputSheet, outputSheet, mode, spec);

  return respondJSON_({
    success: true,
    message: 'Batch initialized',
    mode: mode,
    spec: spec,
    result: result
  });
}

/**
 * Process one batch step
 *
 * Payload:
 * {
 *   "action": "stepBatch"
 * }
 */
function handleStepBatch_(payload) {
  Logger.log(`⏭️  Processing batch step`);

  const result = runSingleStepBatch();

  return respondJSON_({
    success: true,
    done: result.done || false,
    row: result.row,
    remaining: result.remaining,
    message: result.msg,
    result: result
  });
}

/**
 * Finish batch and get report
 *
 * Payload:
 * {
 *   "action": "finishBatch"
 * }
 */
function handleFinishBatch_(payload) {
  Logger.log(`✅ Finishing batch`);

  const report = finishBatchAndReport();

  return respondJSON_({
    success: true,
    message: 'Batch completed',
    report: report
  });
}

/**
 * Run complete batch end-to-end (blocking)
 * WARNING: May timeout for large batches (6-minute Apps Script limit)
 *
 * Payload:
 * {
 *   "action": "runAll",
 *   "inputSheet": "Input",
 *   "outputSheet": "Master Scenario Convert",
 *   "mode": "RUN_25",
 *   "spec": ""
 * }
 */
function handleRunAll_(payload) {
  const inputSheet = payload.inputSheet || 'Input';
  const outputSheet = payload.outputSheet || 'Master Scenario Convert';
  const mode = payload.mode || 'RUN_25';
  const spec = payload.spec || '';

  Logger.log(`🚀 Running complete batch: ${mode}`);

  // Start batch
  startBatchFromSidebar(inputSheet, outputSheet, mode, spec);

  // Process all steps
  let stepCount = 0;
  let maxSteps = 100; // Safety limit
  let lastResult = {};

  while (stepCount < maxSteps) {
    lastResult = runSingleStepBatch();
    stepCount++;

    if (lastResult.done) {
      break;
    }

    // Brief pause between steps
    Utilities.sleep(500);
  }

  // Finish and get report
  const report = finishBatchAndReport();

  return respondJSON_({
    success: true,
    message: 'Batch completed',
    stepsProcessed: stepCount,
    report: report
  });
}

/**
 * Helper: Return JSON response
 */
function respondJSON_(data, statusCode) {
  statusCode = statusCode || 200;

  const output = ContentService.createTextOutput(JSON.stringify(data, null, 2));
  output.setMimeType(ContentService.MimeType.JSON);

  // Note: Can't set HTTP status code in Apps Script web apps
  // All responses return 200, so include status in body
  if (statusCode !== 200) {
    data.httpStatus = statusCode;
  }

  return output;
}
