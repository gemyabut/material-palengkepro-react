// src/hooks/usePaginatedResource.js
//
// Shared DRF PageNumberPagination fetch/state core (BUG-67/MDU-002 follow-up).
//
// Before this, Tenant/Stall/Lease list pages each independently hand-rolled
// their own page/page_size fetch logic (three slightly-different
// implementations, one of them — MasterTenantList — sending the wrong param
// names entirely). This is the one shared implementation; domain hooks
// (useStalls, useLeases, useTenants, useAuditLog) wrap it for their own
// CRUD/export/summary methods and to keep their existing public API shape,
// so their consumer pages needed no changes.
import { useState, useEffect, useCallback } from "react";

/**
 * usePaginatedResource — shared core for uncontrolled (self-owning) DRF
 * PageNumberPagination hooks.
 *
 * Owns page/pageSize/filter/ordering state internally and exposes controls
 * (setPage, setPageSize, setFilters, ...) plus fetched data. Used by
 * useTenants, useStalls, useLeases, useAuditLog — encapsulated list widgets
 * whose consumers don't need to coordinate pagination with other concerns.
 *
 * NOT used by useInvoices, which is a controlled-fetch hook: the InvoicesPage
 * owns page/filters state locally (to coordinate with cross-widget concerns)
 * and passes them into the hook as props. Forcing a controlled hook onto this
 * uncontrolled core would require prop→state syncing (dual source of truth,
 * a well-known React antipattern) or a consumer-page rewrite. Two hook
 * patterns for two purposes is deliberate, not inconsistency to fix.
 */

/**
 * @param {function} fetchFn - (params) => Promise<{count,next,previous,results} | array>
 * @param {object} options
 *   - initialPage, initialPageSize, initialFilters
 *   - enabled: skip fetching while false (e.g. a required id isn't ready yet)
 *
 * updateFilters merges a partial patch into filters AND resets page to 1 —
 * the correct behavior when a filter/search value changes. setFilters
 * replaces the whole filters object without resetting page, for callers
 * that need to manage the reset themselves.
 */
export default function usePaginatedResource(
  fetchFn,
  { initialPage = 1, initialPageSize = 20, initialFilters = {}, enabled = true } = {}
) {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState(null);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPrevPage, setHasPrevPage] = useState(false);

  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [filters, setFilters] = useState(initialFilters);

  const load = useCallback(() => {
    if (!enabled) {
      setItems([]);
      setLoading(false);
      return Promise.resolve(null);
    }
    setLoading(true);
    setError(null);
    const params = { page, page_size: pageSize, ...filters };
    return Promise.resolve(fetchFn(params))
      .then((response) => {
        const data = response?.data ?? response; // axios response or already-unwrapped data
        const results = Array.isArray(data) ? data : data?.results ?? [];
        setItems(results);
        setTotal(Array.isArray(data) ? data.length : data?.count ?? results.length);
        setHasNextPage(Boolean(data?.next));
        setHasPrevPage(Boolean(data?.previous));
        return data;
      })
      .catch((err) => {
        setError(err);
        throw err;
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchFn, enabled, page, pageSize, JSON.stringify(filters)]);

  useEffect(() => {
    load();
  }, [load]);

  const updateFilters = useCallback((patch) => {
    setFilters((f) => ({ ...f, ...patch }));
    setPage(1);
  }, []);

  return {
    items,
    total,
    loading,
    error,
    hasNextPage,
    hasPrevPage,
    page,
    pageSize,
    filters,
    setPage,
    setPageSize,
    setFilters,
    updateFilters,
    refresh: load,
  };
}
