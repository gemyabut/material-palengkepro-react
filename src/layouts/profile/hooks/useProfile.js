// src/layouts/profile/hooks/useProfile.js
// Extended in-place per A2 decision (Unit 26 / DEC-055).
// All existing callers receive the same shape — capabilities object is additive.

import { useAuth } from "context/AuthContext";
import useUploadDomains from "hooks/useUploadDomains";
import { debugLog } from "../../stalls/utils/debug";
import {
  isTopTier,
  isAdminStaffOrAbove,
  isOperationalUser,
  isMobileOnly,
  canAccessAdminModule,
  canManageMasterData,
  canManageChargeTypes,
  canManageExpenseCategories,
  canSignMonthlyClose,
  canViewCashAccountability,
  canSignMarketAdmin,
  canSignAR,
  canSignOwner,
  canReopenPeriodClose,
  canViewReports,
  canViewCash,
  canCreateDeduction,
  canApproveDeduction,
  canViewDailyVerification,
} from "../../../utils/permissions";

export default function useProfile() {
  const context = useAuth();
  debugLog("[useProfile] (via context) Profile loaded:", context.userProfile);

  const role = context.userProfile?.role || null;
  const staff = context.userProfile?.is_staff || false;

  const { domains: uploadDomains } = useUploadDomains();

  const capabilities = {
    // Tier classification
    isTopTier: staff || isTopTier(role),
    isAdminStaffOrAbove: staff || isAdminStaffOrAbove(role),
    isOperational: staff || isOperationalUser(role),
    isMobileOnly: !staff && isMobileOnly(role),

    // Module access
    canAccessAdmin: canAccessAdminModule(role, staff),
    canManageMasterData: canManageMasterData(role, staff),
    canViewReports: staff || canViewReports(role),
    canViewCash: staff || canViewCash(role),

    // Cash Accountability + Monthly Close (DEC-051 / Unit 22)
    canViewCashAccountability: staff || canViewCashAccountability(role),
    canSignMonthlyClose: staff || canSignMonthlyClose(role),
    canSignMarketAdmin: canSignMarketAdmin(role),
    canSignAR: canSignAR(role),
    canSignOwner: canSignOwner(role),
    canReopenPeriodClose: staff || canReopenPeriodClose(role),

    // Settings / master data
    canManageChargeTypes: staff || canManageChargeTypes(role),
    canManageExpenseCategories: staff || canManageExpenseCategories(role),

    // Operations
    canCreateDeduction: canCreateDeduction(role),
    canApproveDeduction: staff || canApproveDeduction(role),
    canViewDailyVerification: staff || canViewDailyVerification(role),

    // Spreadsheet Upload domains: served by the server (GET /csv-import/my-domains/),
    // which already applies the platform-admin bypass.
    allowedUploadDomains: uploadDomains,
  };

  return { ...context, capabilities };
}
