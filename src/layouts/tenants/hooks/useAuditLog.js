// src/layouts/tenants/hooks/useAuditLog.js

import { useCallback } from "react";
import { getAuditLog } from "../api/tenants"; // must accept (tenantId, params)
import usePaginatedResource from "../../../hooks/usePaginatedResource";

/**
 * useAuditLog
 * Fetch and manage a tenant's audit log with optional pagination/sorting.
 *
 * @param {number|string} tenantId - Tenant ID to fetch audit entries for.
 * @param {object} initialParams - Optional query params (page, page_size, ordering, search, etc.)
 *
 * Returns:
 *  - logs: Array of audit entries
 *  - loading: boolean
 *  - error: any
 *  - total: number (from the API's `count` when paginated, else logs.length — BUG-56)
 *  - page, pageSize, ordering: local state for UI controls
 *  - setPage, setPageSize, setOrdering: setters for UI controls
 *  - refetch: function to refetch with current params
 */
export default function useAuditLog(tenantId, initialParams = {}) {
  const fetchFn = useCallback((params) => getAuditLog(tenantId, params), [tenantId]);

  const {
    items: logs,
    total,
    loading,
    error,
    page,
    pageSize,
    filters,
    setPage,
    setPageSize,
    updateFilters,
    refresh: refetch,
  } = usePaginatedResource(fetchFn, {
    initialPage: initialParams.page || 1,
    initialPageSize: initialParams.page_size || 10,
    initialFilters: { ordering: initialParams.ordering || "-timestamp", ...initialParams },
    enabled: Boolean(tenantId),
  });

  const ordering = filters.ordering || "-timestamp";
  const setOrdering = useCallback((val) => updateFilters({ ordering: val }), [updateFilters]);

  return {
    logs,
    total,
    loading,
    error,
    // expose for UI controls
    page,
    pageSize,
    ordering,
    setPage,
    setPageSize,
    setOrdering,
    refetch,
  };
}
