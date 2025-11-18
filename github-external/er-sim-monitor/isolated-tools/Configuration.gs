/**
 * Configuration Module
 *
 * Isolated single-purpose module containing 1 functions
 * for configuration
 *
 * Generated: 2025-11-04T18:29:36.066Z
 * Source: Code_ULTIMATE_ATSR.gs (monolithic, preserved in Legacy Code)
 */

/**
 * Dependencies:
 * - Utilities.gs
 */

function setProp(key, value) {
  PropertiesService.getDocumentProperties().setProperty(key, value);
}