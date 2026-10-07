import apiClient from "api/axios";

/** Platform-admin: onboard a company + first market + subscription + Market Admin (IAM-2). */
export const onboardCompany = (data) =>
  apiClient.post("/billing/signup/", data).then((r) => r.data);

/** Market Admin: create a staff account in their own market/company (IAM-2). */
export const createStaff = (data) =>
  apiClient.post("/billing/staff/", data).then((r) => r.data);

/** MDU-024: the roles THIS creator may add — the backend's one staff role list. */
export const getStaffRoles = () =>
  apiClient.get("/billing/staff/").then((r) => r.data.roles || []);

export default { onboardCompany, createStaff, getStaffRoles };
