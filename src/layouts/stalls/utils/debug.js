// src/layouts/stalls/utils/debug.js

// Set to false in production to silence all debug logs.
export const DEBUG = true;

/**
 * Use instead of console.log for quick, conditional debug output.
 * Adds a [STALLS DEBUG] tag to make logs easy to filter in DevTools.
 */
export function debugLog(...args) {
  if (DEBUG) {
    console.log("%c[DEBUG]", "color: #2196f3; font-weight:bold;", ...args);
  }
}
