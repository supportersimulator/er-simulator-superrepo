/**
 * QualityScoring Module
 *
 * Isolated single-purpose module containing 1 functions
 * for quality scoring
 *
 * Generated: 2025-11-04T18:29:36.068Z
 * Source: Code_ULTIMATE_ATSR.gs (monolithic, preserved in Legacy Code)
 */

/**
 * Dependencies:
 * - Utilities.gs
 */

function retrainPromptStructure() {
  const ui = getSafeUi_();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const outputSheet = ss.getSheetByName(getProp('LAST_OUTPUT_SHEET') || 'Output');
  if (!outputSheet) {
    if (ui) { ui.alert('❌ Output sheet not found.'); }
    return;
  }

  const header1 = outputSheet.getRange(1, 1, 1, outputSheet.getLastColumn()).getValues()[0];
  const header2 = outputSheet.getRange(2, 1, 1, outputSheet.getLastColumn()).getValues()[0];
  const mergedKeys = header1.map((t1, i) => `${t1}:${header2[i]}`.replace(/\s+/g, '_'));

  // Cache structure
  setProp('CACHED_HEADER1', JSON.stringify(header1));
  setProp('CACHED_HEADER2', JSON.stringify(header2));
  setProp('CACHED_MERGED_KEYS', JSON.stringify(mergedKeys));

  // Build prompt training text
  const promptIntro = `
📘 Sim Mastery — Auto-Trained Output Schema
This defines your authoritative JSON schema for all generated content.

Each key must exactly match the merged Tier1:Tier2 form, using underscores (_) instead of spaces.
When a value cannot be filled, output "N/A".

Tier1 Headers:
${header1.join(', ')}

Tier2 Headers:
${header2.join(', ')}

Merged Keys (exact JSON keys required):
${mergedKeys.join(', ')}
`.trim();

  setProp('CACHED_PROMPT_STRUCTURE', promptIntro);

  if (ui) { ui.alert(`✅ Prompt structure retrained!\n\n${mergedKeys.length} merged keys cached.\nPrompt fragment stored for AI calls.`); }
}