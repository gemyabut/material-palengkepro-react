// src/layouts/tenants/utils/validators.js

export const isValidEmail = (v = "") =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v).trim());

// PH mobile formats: +639XXXXXXXXX or 09XXXXXXXXX
export const isValidPHMobile = (v = "") =>
  /^(\+?63|0)9\d{9}$/.test(String(v).replace(/[\s-]/g, ""));

// Simple required
export const isRequired = (v) => v !== null && v !== undefined && String(v).trim() !== "";
