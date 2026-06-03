//
import { useState, useEffect, useCallback } from "react";
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
} from "../api/leases";
import { debugLog } from "../../stalls/utils/debug";
import Papa from "papaparse";
import * as XLSX from "xlsx";

// Utility: summary count by status/type/etc.
function summarizeLeases(leases) {
  const summary = {};
  leases.forEach((l) => {
    const status = l.status ? l.status.toLowerCase() : "unknown";
    summary[status] = (summary[status] || 0) + 1;
  });
  return summary;
}

export function useLeases({ filter = {}, page = 1, limit = 10, autoLoad = true, onLoaded } = {}) {
  const [leases, setLeases] = useState([]);
  const [summary, setSummary] = useState({});
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState();
  const [currentPage, setCurrentPage] = useState(page);
  const [currentFilter, setCurrentFilter] = useState(filter);

  // Load leases (with filter, pagination)
  const loadLeases = useCallback(
    async (opt = {}) => {
      setLoading(true);
      setError(undefined);

      try {
        const pageNum = opt.page || currentPage || 1;
        const perPage = opt.limit || limit;
        const f = opt.filter || currentFilter || {};

        // Build server params (DRF DjangoFilterBackend + SearchFilter)
        const params = { page: pageNum, page_size: perPage };
        if (f.status) params.status = f.status;
        if (f.tenant) params.tenant = f.tenant;
        if (f.stall) params.stall = f.stall;
        if (f.lease_type) params.lease_type = f.lease_type;
        if (f.payment_status) params.payment_status = f.payment_status;
        // Map UI "full_name" search to DRF SearchFilter ?search=
        if (f.full_name) params.search = f.full_name;
        else if (f.search) params.search = f.search;

        debugLog("[useLeases] Loading leases", params);
        const response = await getLeases(params);

        // DRF paginated { count, next, previous, results } or plain array
        const results = Array.isArray(response)
          ? response
          : Array.isArray(response?.results)
          ? response.results
          : [];
        const totalCount = Array.isArray(response)
          ? response.length
          : response?.count ?? results.length;

        setLeases(results);
        setTotal(totalCount);
        setCurrentPage(pageNum);

        // Summary: server-side per-status counts (independent of current filter/search),
        // so the dashboard widget shows true totals across all leases.
        try {
          const STATUSES = ["ACTIVE", "PENDING", "EXPIRED", "TERMINATED"];
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

        if (onLoaded) onLoaded(results, results);
      } catch (e) {
        debugLog("[useLeases] Error loading leases", e);
        setError(e);
      } finally {
        setLoading(false);
      }
    },
    [currentFilter, currentPage, limit, onLoaded]
  );

  useEffect(() => {
    if (autoLoad) loadLeases({ filter: currentFilter, page: currentPage });
    // eslint-disable-next-line
  }, [currentFilter, currentPage, autoLoad]);

  // Pagination controls
  const nextPage = useCallback(() => {
    setCurrentPage((p) => p + 1);
  }, []);
  const prevPage = useCallback(() => {
    setCurrentPage((p) => Math.max(1, p - 1));
  }, []);
  const refresh = useCallback(() => {
    loadLeases({ filter: currentFilter, page: currentPage });
  }, [loadLeases, currentFilter, currentPage]);

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

  // Export functions
  const exportCSV = useCallback(() => {
    debugLog("[useLeases] exportCSV called");
    try {
      const csv = Papa.unparse(leases);
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "leases.csv";
      link.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      debugLog("[useLeases] exportCSV error", e);
    }
  }, [leases]);

  const exportXLS = useCallback(() => {
    debugLog("[useLeases] exportXLS called");
    try {
      const ws = XLSX.utils.json_to_sheet(leases);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Leases");
      XLSX.writeFile(wb, "leases.xlsx");
    } catch (e) {
      debugLog("[useLeases] exportXLS error", e);
    }
  }, [leases]);

  // Direct lease setter (for admin UI, etc.)
  const setLease = useCallback((updater) => {
    setLeases((prev) => (typeof updater === "function" ? updater(prev) : updater));
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
    setFilter: setCurrentFilter,
    nextPage,
    prevPage,
    refresh,
    createLease,
    editLease,
    deactivateLease,
    setLease,
    exportCSV,
    exportXLS,
    // for UI: raw filter state and more
    filter: currentFilter,
  };
}
