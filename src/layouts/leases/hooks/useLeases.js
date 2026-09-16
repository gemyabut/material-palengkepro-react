//
import { useState, useCallback } from "react";
import {
  getLeases,
  addLease,
  updateLease,
  deleteLease,
  fetchActiveLeases,
  fetchInactiveLeases,
  fetchExpiredLeases,
  fetchLeasesByTenant,
  fetchLeasesByStall,
  exportLeasesXLSX,
} from "../api/leases";
import { debugLog } from "../../stalls/utils/debug";
import usePaginatedResource from "../../../hooks/usePaginatedResource";

// Utility: summary count by status/type/etc.
function summarizeLeases(leases) {
  const summary = {};
  leases.forEach((l) => {
    const status = l.status ? l.status.toLowerCase() : "unknown";
    summary[status] = (summary[status] || 0) + 1;
  });
  return summary;
}

const STATUSES = ["ACTIVE", "PENDING", "EXPIRED", "TERMINATED"];

// Maps the UI filter shape ({status, tenant, stall, lease_type,
// payment_status, full_name|search}) to the actual DRF query params —
// same mapping loadLeases used to do inline.
function toApiParams({
  page,
  page_size,
  status,
  tenant,
  stall,
  lease_type,
  payment_status,
  full_name,
  search,
}) {
  const params = { page, page_size };
  if (status) params.status = status;
  if (tenant) params.tenant = tenant;
  if (stall) params.stall = stall;
  if (lease_type) params.lease_type = lease_type;
  if (payment_status) params.payment_status = payment_status;
  if (full_name) params.search = full_name;
  else if (search) params.search = search;
  return params;
}

export function useLeases({ filter = {}, page = 1, limit = 10, autoLoad = true, onLoaded } = {}) {
  const [summary, setSummary] = useState({});

  const fetchFn = useCallback(
    async (rawParams) => {
      const params = toApiParams(rawParams);
      debugLog("[useLeases] Loading leases", params);
      const response = await getLeases(params);
      const results = Array.isArray(response)
        ? response
        : Array.isArray(response?.results)
        ? response.results
        : [];
      if (onLoaded) onLoaded(results, results);

      // Summary: server-side per-status counts (independent of current
      // filter/search), so the widget shows true totals across all leases.
      try {
        const summaryResponses = await Promise.all(
          STATUSES.map((s) => getLeases({ status: s, page: 1, page_size: 1 }))
        );
        const summaryObj = {};
        STATUSES.forEach((s, i) => {
          summaryObj[s.toLowerCase()] = summaryResponses[i]?.count ?? 0;
        });
        setSummary(summaryObj);
      } catch (summaryErr) {
        debugLog("[useLeases] Error loading summary counts", summaryErr);
        setSummary({});
      }

      return response;
    },
    [onLoaded]
  );

  const {
    items: leases,
    total,
    loading,
    error,
    page: currentPage,
    setPage,
    filters: currentFilter,
    setFilters,
    refresh,
  } = usePaginatedResource(fetchFn, {
    initialPage: page,
    initialPageSize: limit,
    initialFilters: filter,
    enabled: autoLoad,
  });

  // BUG-67/MDU-002 follow-up fix: filter changes now reset to page 1 (the
  // pre-consolidation hook left the page wherever it was, so a new filter
  // could land on an empty out-of-range page). Original setFilter was a
  // raw replace (not a merge), preserved here — just with the page reset
  // added.
  const setFilter = useCallback(
    (newFilter) => {
      setFilters(newFilter);
      setPage(1);
    },
    [setFilters, setPage]
  );

  const setCurrentPage = setPage;

  // Pagination controls
  const nextPage = useCallback(() => {
    setCurrentPage((p) => p + 1);
  }, [setCurrentPage]);
  const prevPage = useCallback(() => {
    setCurrentPage((p) => Math.max(1, p - 1));
  }, [setCurrentPage]);

  // CRUD and other actions
  const createLease = useCallback(
    async (leaseData) => {
      debugLog("[useLeases] createLease called", leaseData);
      const res = await addLease(leaseData);
      refresh();
      return res;
    },
    [refresh]
  );

  const editLease = useCallback(
    async (id, updateFields) => {
      debugLog("[useLeases] editLease called", id, updateFields);
      const res = await updateLease(id, updateFields);
      refresh();
      return res;
    },
    [refresh]
  );

  const deactivateLease = useCallback(
    async (id) => {
      debugLog("[useLeases] deactivateLease called", id);
      const res = await updateLease(id, { status: "INACTIVE" });
      refresh();
      return res;
    },
    [refresh]
  );

  // Export function — BUG-72/MDU-001: server-side full-ledger XLSX export.
  // Previously built a workbook client-side from the in-memory `leases`
  // array, which was only ever the current paginated page (page_size=20) —
  // silent truncation. Now hits the backend's export_excel action, which
  // returns the FULL market-scoped ledger.
  const exportXLS = useCallback(async () => {
    debugLog("[useLeases] exportXLS called");
    try {
      const blob = await exportLeasesXLSX();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "leases.xlsx";
      link.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      debugLog("[useLeases] exportXLS error", e);
    }
  }, []);

  // Direct lease setter (for admin UI, etc.)
  const setLease = useCallback((updater) => {
    // Note: this used to mutate the hook's internal `leases` state
    // directly. That state now lives inside usePaginatedResource and isn't
    // externally settable — no caller currently uses setLease, so this is
    // kept as a documented no-op rather than removed outright pending
    // confirmation nothing depends on it.
    debugLog("[useLeases] setLease called but is a no-op post-consolidation", updater);
  }, []);

  // Return API
  return {
    leases,
    summary,
    total,
    loading,
    error,
    currentPage,
    setCurrentPage,
    setFilter,
    nextPage,
    prevPage,
    refresh,
    createLease,
    editLease,
    deactivateLease,
    setLease,
    exportXLS,
    // for UI: raw filter state and more
    filter: currentFilter,
  };
}
