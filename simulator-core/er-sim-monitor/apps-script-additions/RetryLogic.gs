/**
 * Retry Logic with Exponential Backoff
 *
 * Handles transient failures in OpenAI API calls and Google Sheets operations
 * Implements exponential backoff with jitter to prevent thundering herd
 *
 * Usage in Code.gs:
 *   const response = retryWithBackoff(() =>
 *     UrlFetchApp.fetch(url, options),
 *     {maxRetries: 3, baseDelay: 1000}
 *   );
 */

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {Object} options - Retry configuration
 * @param {number} options.maxRetries - Maximum retry attempts (default: 3)
 * @param {number} options.baseDelay - Base delay in ms (default: 1000)
 * @param {number} options.maxDelay - Maximum delay in ms (default: 30000)
 * @param {Function} options.shouldRetry - Function to determine if error is retryable
 * @returns {*} Result of successful function call
 */
function retryWithBackoff(fn, options = {}) {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 30000,
    shouldRetry = isRetryableError
  } = options;

  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return fn();
    } catch (error) {
      lastError = error;

      // Don't retry if this is the last attempt or error is not retryable
      if (attempt === maxRetries || !shouldRetry(error)) {
        throw error;
      }

      // Calculate delay with exponential backoff and jitter
      const exponentialDelay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
      const jitter = Math.random() * exponentialDelay * 0.1; // 10% jitter
      const delay = exponentialDelay + jitter;

      Logger.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${Math.round(delay)}ms. Error: ${error.message}`);

      // Sleep before retry
      Utilities.sleep(delay);
    }
  }

  throw lastError;
}

/**
 * Determine if an error is retryable
 * @param {Error} error - Error object
 * @returns {boolean} True if error should be retried
 */
function isRetryableError(error) {
  const errorMessage = error.message ? error.message.toLowerCase() : '';

  // Retryable HTTP status codes
  const retryableStatusCodes = [
    408, // Request Timeout
    429, // Too Many Requests
    500, // Internal Server Error
    502, // Bad Gateway
    503, // Service Unavailable
    504  // Gateway Timeout
  ];

  // Retryable error patterns
  const retryablePatterns = [
    'timeout',
    'timed out',
    'rate limit',
    'quota exceeded',
    'service unavailable',
    'temporarily unavailable',
    'connection reset',
    'econnreset',
    'network error',
    'socket hang up',
    'ehostunreach'
  ];

  // Check for retryable status codes
  if (error.code && retryableStatusCodes.includes(error.code)) {
    return true;
  }

  // Check for retryable error messages
  for (const pattern of retryablePatterns) {
    if (errorMessage.includes(pattern)) {
      return true;
    }
  }

  return false;
}

/**
 * Retry OpenAI API call with automatic backoff
 * Specialized wrapper for OpenAI API calls
 * @param {string} url - OpenAI API endpoint
 * @param {Object} options - UrlFetchApp options
 * @returns {Object} Parsed JSON response
 */
function fetchOpenAIWithRetry(url, options) {
  return retryWithBackoff(() => {
    const response = UrlFetchApp.fetch(url, options);
    const responseCode = response.getResponseCode();

    // Handle rate limiting explicitly
    if (responseCode === 429) {
      const retryAfter = response.getHeaders()['Retry-After'];
      if (retryAfter) {
        const waitMs = parseInt(retryAfter) * 1000;
        Logger.log(`Rate limited. Waiting ${waitMs}ms as specified by Retry-After header`);
        Utilities.sleep(waitMs);
        throw new Error('Rate limit exceeded - retry after sleep');
      }
    }

    // Non-200 responses should throw
    if (responseCode < 200 || responseCode >= 300) {
      throw new Error(`HTTP ${responseCode}: ${response.getContentText()}`);
    }

    return JSON.parse(response.getContentText());
  }, {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 60000, // Longer max delay for API rate limits
    shouldRetry: (error) => {
      // Always retry rate limits
      if (error.message.includes('429') || error.message.includes('Rate limit')) {
        return true;
      }
      return isRetryableError(error);
    }
  });
}

/**
 * Retry Google Sheets batch operation
 * @param {Function} fn - Sheets API function
 * @returns {*} Result of successful call
 */
function retrySheetsOperation(fn) {
  return retryWithBackoff(fn, {
    maxRetries: 5, // More retries for Sheets API
    baseDelay: 500,
    maxDelay: 10000
  });
}

/**
 * Test retry logic
 */
function testRetryLogic() {
  let attempts = 0;

  try {
    const result = retryWithBackoff(() => {
      attempts++;
      Logger.log(`Attempt ${attempts}`);

      if (attempts < 3) {
        throw new Error('Simulated network timeout');
      }

      return 'Success!';
    }, {
      maxRetries: 5,
      baseDelay: 500
    });

    Logger.log(`Test passed! Result: ${result} (took ${attempts} attempts)`);
  } catch (error) {
    Logger.log(`Test failed: ${error.message}`);
  }
}
