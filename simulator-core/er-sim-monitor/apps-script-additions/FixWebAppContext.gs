/**
 * Fix for Web App Context
 *
 * Add this code to your Apps Script to fix the SpreadsheetApp.getUi() error
 *
 * The issue: Batch functions use SpreadsheetApp.getUi() for sidebar/toast notifications,
 * but this isn't available in web app context (doGet/doPost).
 *
 * Solution: Wrap all getUi() calls in a helper that checks context
 */

/**
 * Safe UI helper - only calls getUi() if in UI context
 */
function getSafeUi_() {
  try {
    return SpreadsheetApp.getUi();
  } catch (e) {
    // Not in UI context (web app), return null
    return null;
  }
}

/**
 * Safe toast notification
 */
function showToastSafe_(message, title, timeout) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    if (ss) {
      ss.toast(message, title || 'Notification', timeout || 3);
    }
  } catch (e) {
    // Not in UI context, log instead
    Logger.log(`TOAST: ${title || ''} - ${message}`);
  }
}

/**
 * Update all existing functions to use safe UI helpers
 *
 * FIND all instances of:
 *   SpreadsheetApp.getUi()
 *   .toast(
 *
 * REPLACE with:
 *   getSafeUi_()
 *   showToastSafe_(
 *
 * Example changes needed in Code.gs:
 *
 * OLD:
 *   const ui = SpreadsheetApp.getUi();
 *   ui.alert('Error');
 *
 * NEW:
 *   const ui = getSafeUi_();
 *   if (ui) ui.alert('Error');
 *
 * OLD:
 *   ss.toast('Processing...', 'Status', 3);
 *
 * NEW:
 *   showToastSafe_('Processing...', 'Status', 3);
 */

/**
 * CRITICAL FIX FOR LINE 2062:
 *
 * Find this line in Code.gs (around line 2062):
 *   const ui = SpreadsheetApp.getUi();
 *
 * Replace with:
 *   const ui = getSafeUi_();
 *   if (!ui) {
 *     // Web app context - log instead of showing UI
 *     Logger.log('Batch processing started (web app mode)');
 *     // Continue with batch processing...
 *   }
 */

/**
 * Alternative: Make batch functions web-app-safe
 *
 * Wrap the entire batch initialization in a context check:
 */
function startBatchFromSidebarWebSafe(inputSheetName, outputSheetName, mode, spec) {
  // Check if in web app context
  const isWebApp = !getSafeUi_();

  if (isWebApp) {
    Logger.log('Starting batch in web app mode');
    Logger.log(`Input: ${inputSheetName}, Output: ${outputSheetName}, Mode: ${mode}, Spec: ${spec}`);
  }

  // Call original function but with UI calls removed/wrapped
  return startBatchFromSidebar(inputSheetName, outputSheetName, mode, spec);
}
