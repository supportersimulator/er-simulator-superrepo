/**
 * Sheet Operations Module
 *
 * Isolated single-purpose module containing 1 functions
 * Generated: 2025-11-04T18:30:22.773Z
 * Source: Utilities.gs (refined from monolithic code)
 */

function ensureBatchReportsSheet_() {
  const ss = SpreadsheetApp.getActive();
  let s = ss.getSheetByName('Batch_Reports');
  if (!s) s = ss.insertSheet('Batch_Reports');
  // minimal header
  if (s.getLastRow() === 0) {
    s.appendRow(['Timestamp','Mode','Created','Skipped','Duplicates','Errors','Estimated Cost (USD)','Elapsed']);
  }
  return s;
}