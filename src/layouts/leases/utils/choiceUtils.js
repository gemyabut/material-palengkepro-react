// /src/layouts/leases/utils/choiceUtils.js

import { debugLog } from '../../stalls/utils/debug';

/**
 * Get label for a value from a choices array.
 * @param {Array} choices - Array of {value, label}
 * @param {string|number} value - The value to look up
 * @returns {string} label or original value if not found
 */
export function getLabel(choices, value) {
  if (!value) return '';
  const found = choices.find(opt => String(opt.value).toLowerCase() === String(value).toLowerCase());
  debugLog('[choiceUtils] getLabel:', value, '→', found ? found.label : value);
  return found ? found.label : value;
}
