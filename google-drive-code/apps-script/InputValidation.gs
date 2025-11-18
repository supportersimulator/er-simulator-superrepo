/**
 * InputValidation Module
 *
 * Isolated single-purpose module containing 1 functions
 * for input validation
 *
 * Generated: 2025-11-04T18:29:36.064Z
 * Source: Code_ULTIMATE_ATSR.gs (monolithic, preserved in Legacy Code)
 */

/**
 * Dependencies:
 * - Utilities.gs
 */

/******************************************************
 * ER_Simulator_Builder.gs — FULL UNIFIED MASTER FILE
 * v3.7 (Dark UI)
 * 
 * Includes:
 *  • Batch Engine (Run All / 25 Rows / Specific Rows) with live log
 *  • Single Case Generator (2-tier aware)
 *  • ATSR Title Generator (Keep & Regenerate, deselect, memory tracker)
 *  • Case Summary Enhancer (auto-bold Dx/Intervention/Takeaway)
 *  • Image Sync Defaults Manager (refresh + editable)
 *  • Settings (API key from Script Properties or Settings sheet, model/prices, header cache)
 *  • Check API Status
 *  • Batch Reports (popup + writes to Batch_Reports sheet)
 *  • Duplicate check (content hash signature)
 *  • Inputs per row: Column A=Formal_Info, B=HTML, C=DOC, D=Extra (any may be blank)
 * 
 * Safe to paste as a full replacement.
 ******************************************************/

// ========== 1) ICONS, KEYS, DEFAULTS ==========

const ICONS = {
  rocket: '🚀', bolt: '⚡', wand: '✨', frame: '🖼', puzzle: '🧩',
  gear: '⚙️', brain: '🧠', clipboard: '📋', stop: '⏹️', shield: '🛡️'
}