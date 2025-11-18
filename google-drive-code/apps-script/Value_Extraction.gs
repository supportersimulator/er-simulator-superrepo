/**
 * Value Extraction Module
 *
 * Isolated single-purpose module containing 1 functions
 * Generated: 2025-11-04T18:30:22.768Z
 * Source: Utilities.gs (refined from monolithic code)
 */

/**
 * Utilities Module
 *
 * Isolated single-purpose module containing 67 functions
 * for utilities
 *
 * Generated: 2025-11-04T18:29:36.065Z
 * Source: Code_ULTIMATE_ATSR.gs (monolithic, preserved in Legacy Code)
 */

/**
 * Dependencies:
 * - Utilities.gs
 */

/**
 * Extracts a value from AI JSON output, tolerant of tiered keys.
 * Handles formats like "Tier1:Tier2" or just "Tier2".
 */
function extractValueFromParsed_(parsed, mergedKey) {
  if (!parsed || typeof parsed !== 'object') return 'N/A';

  // Try exact full key match
  if (parsed.hasOwnProperty(mergedKey)) return parsed[mergedKey];

  // Try after colon (Tier 2 only)
  const parts = mergedKey.split(':');
  const shortKey = parts[1] || parts[0];
  if (parsed.hasOwnProperty(shortKey)) return parsed[shortKey];

  // Try case-insensitive match
  const lowerKey = shortKey.toLowerCase();
  for (const k in parsed) {
    if (k.toLowerCase() === lowerKey) return parsed[k];
  }

  // Try to find nested objects like { "Case_Organization": { "Spark_Title": "..." } }
  if (parts.length === 2 && parsed[parts[0]] && typeof parsed[parts[0]] === 'object') {
    const nested = parsed[parts[0]][parts[1]];
    if (nested !== undefined) return nested;
  }

  // If all else fails, return N/A
  return 'N/A';
}