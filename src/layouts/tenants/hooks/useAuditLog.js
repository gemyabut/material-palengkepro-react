// src/layouts/tenants/hooks/useAuditLog.js

import { useState, useEffect, useCallback } from "react";
import { getAuditLog } from "../api/tenants"; // must accept (tenantId, params)
import { debugLog } from "../../stalls/utils/debug";

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
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(Boolean(tenantId));
  const [error, setError] = useState(null);

  // UI state for pagination/sorting
  const [page, setPage] = useState(initialParams.page || 1);
  const [pageSize, setPageSize] = useState(initialParams.page_size || 10);
  const [ordering, setOrdering] = useState(
    initialParams.ordering || "-timestamp"
  );

  const fetchLogs = useCallback(() => {
    if (!tenantId) {
      setLogs([]);
      setLoading(false);
      return;
    }

    const params = {
      page,
      page_size: pageSize,
      ordering,
      ...initialParams, // allow extra filters like search if you pass them in
    };

    debugLog("useAuditLog: fetching", { tenantId, params });
    setLoading(true);
    setError(null);

    getAuditLog(tenantId, params)
      .then((data) => {
        // Support both paginated and non-paginated responses
        const results = data?.results ?? data ?? [];
        setLogs(results);
        setTotal(Array.isArray(data) ? data.length : (data?.count ?? results.length));
        debugLog("useAuditLog: fetched", data);
      })
      .catch((err) => {
        setError(err);
        debugLog("useAuditLog: error", err);
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId, page, pageSize, ordering, JSON.stringify(initialParams)]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

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
    refetch: fetchLogs,
  };
}
