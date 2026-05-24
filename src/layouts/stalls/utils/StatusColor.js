// src/layouts/stalls/utils/statusColor.js

/**
 * Returns MUI color for a given stall status.
 * @param {string} status - Stall status value
 * @returns {string} - MUI color name (success, error, info, warning, default)
 */
export default function statusColor(status) {
  switch ((status || "").toUpperCase()) {
    case "AVAILABLE":
      return "success";
    case "OCCUPIED":
      return "error";
    case "RESERVED":
      return "warning";
    case "UNDER_MAINTENANCE":
      return "info";
    case "INACTIVE":
      return "default";
    default:
      return "default";
  }
}
