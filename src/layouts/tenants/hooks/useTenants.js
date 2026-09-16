// src/layouts/tenants/hooks/useTenants.js
//
// BUG-67/MDU-002 follow-up — Tenant list previously hand-rolled its own
// page/page_size fetch inline in MasterTenantList.js (and sent the wrong
// param names entirely, the original bug). Now built on the same shared
// core as useStalls/useLeases, matching that pattern for consistency.
import { useCallback } from "react";
import { getTenants } from "../api/tenants";
import usePaginatedResource from "../../../hooks/usePaginatedResource";

export default function useTenants({ initialPageSize = 20, initialOrdering = "full_name" } = {}) {
  const {
    items: tenants,
    total: totalCount,
    loading,
    error,
    page,
    pageSize: rowsPerPage,
    filters,
    setPage,
    setPageSize: setRowsPerPage,
    updateFilters,
    refresh: fetchTenants,
  } = usePaginatedResource(getTenants, {
    initialPageSize,
    initialFilters: { ordering: initialOrdering },
  });

  const search = filters.search || "";
  const ordering = filters.ordering || initialOrdering;

  // Original only sent `search` when truthy — clearing it drops the key
  // (axios omits undefined params) rather than sending an empty string.
  const setSearch = useCallback(
    (val) => updateFilters({ search: val || undefined }),
    [updateFilters]
  );
  const setOrdering = useCallback((val) => updateFilters({ ordering: val }), [updateFilters]);

  return {
    tenants,
    totalCount,
    loading,
    error,
    page,
    rowsPerPage,
    search,
    ordering,
    setPage,
    setRowsPerPage,
    setSearch,
    setOrdering,
    fetchTenants,
  };
}
