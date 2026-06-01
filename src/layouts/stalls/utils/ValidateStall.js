// src/layouts/stalls/utils/validateStall.js

/**
 * Validates a stall object for required fields and allowed values.
 * @param {object} stall - The stall object to validate
 * @param {object[]} [existingStalls] - Optional array to check for duplicate stall_number
 * @returns {object} - { valid: boolean, errors: { field: errorString, ... } }
 */
export function validateStall(stall, existingStalls = []) {
  const errors = {};

  if (!stall.stall_number || stall.stall_number.trim() === "")
    errors.stall_number = "Stall number is required.";

  if (existingStalls.length > 0 && existingStalls.some(s => s.stall_number === stall.stall_number))
    errors.stall_number = "Stall number already exists.";

  if (!stall.zone || stall.zone.trim() === "")
    errors.zone = "Zone is required.";

  if (!stall.size_sqm || isNaN(stall.size_sqm) || stall.size_sqm <= 0)
    errors.size_sqm = "Size (sqm) must be a positive number.";

  if (!stall.current_rate || isNaN(stall.current_rate) || stall.current_rate < 0)
    errors.current_rate = "Rate must be a non-negative number.";

  const allowedStatuses = ["AVAILABLE", "OCCUPIED", "RESERVED", "UNDER_MAINTENANCE", "INACTIVE"];
  if (!allowedStatuses.includes((stall.status || "").toUpperCase()))
    errors.status = "Invalid status value.";

  const allowedTypes = [
    "WET", "DRY", "FOOD", "TIANGGE", "AMBULANT", "SUNDAY", "NIGHT",
    "RESTROOM", "PARKING", "TERMINAL", "OTHERS"
  ];
  if (!allowedTypes.includes((stall.stall_type || "").toUpperCase()))
    errors.stall_type = "Invalid stall type.";

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}
