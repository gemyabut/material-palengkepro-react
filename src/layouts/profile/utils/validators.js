export const isValidEmail = (value) => /^\S+@\S+\.\S+$/.test(value);
export const isValidMobile = (value) => /^09\d{9}$/.test(value);
export const isValidAddress = (value) => value.length <= 255;
export const isValidGovID = (value) => /^[a-zA-Z0-9\- ]+$/.test(value);
export const isValidEmergencyContact = (value) => value.length >= 5;
export const isValidBarangayPermit = (value) => /^[A-Za-z0-9\-]+$/.test(value);
export const isValidSocialMedia = (value) => /^[A-Za-z0-9_.@/]+$/.test(value);
export const isValidNotes = (value) => value.length <= 1000;
export const isValidOtherDetails = (value) => value.length <= 500;
export const validatePhoto = (file) => {
  const allowedTypes = ["image/jpeg", "image/png"];
  const maxSize = 5 * 1024 * 1024;
  if (!allowedTypes.includes(file.type)) return "Only JPG and PNG formats are supported.";
  if (file.size > maxSize) return "Photo must be under 5MB.";
  return "";
};
