// src/layouts/stalls/hooks/useStalls.js

import { useState, useCallback } from "react";
import {
  fetchStalls,
  fetchStallsSummary,
  createStall,
  updateStall,
  deactivateStall,
  exportCsv,
  exportExcel,
  // ...any other API functions you want to expose
} from "../api/stalls";

import { debugLog } from "layouts/stalls/utils/debug";
import usePaginatedResource from "../../../hooks/usePaginatedResource";

// Default page size for pagination
const DEFAULT_PAGE_SIZE = 20;

export default function useStalls(initialFilters = {}) {
  const [summary, setSummary] = useState([]);
  // CRUD-originated errors share the same displayed error slot as list-load
  // errors, matching the pre-consolidation behavior exactly.
  const [crudError, setCrudError] = useState(null);

  // Summary is fetched alongside the main list on every load — same
  // cadence as before this hook was consolidated onto the shared core.
  const fetchFn = useCallback(async (params) => {
    debugLog(" [useStalls] Loading stalls with params:", params);
    const [stallsRes, summaryRes] = await Promise.all([fetchStalls(params), fetchStallsSummary()]);
    const summaryResponse = summaryRes.data || summaryRes;
    setSummary(summaryResponse.summary || []);
    return stallsRes.data || stallsRes;
  }, []);

  const {
    items: stalls,
    total,
    loading,
    error: rawError,
    hasNextPage,
    hasPrevPage,
    page,
    pageSize,
    filters,
    setPage: goToPage,
    setPageSize: changePageSize,
    updateFilters,
    refresh,
  } = usePaginatedResource(fetchFn, {
    initialPageSize: DEFAULT_PAGE_SIZE,
    initialFilters,
  });

  // Preserve the original string-error shape (error message text, not an
  // Error/axios-error object) that StallsPage renders directly in an Alert.
  const error = crudError
    ? crudError
    : rawError
    ? rawError?.response?.data?.detail || rawError.message || "Error loading stalls."
    : null;

  // Exposed API helpers for forms/components (optional)
  const create = async (data) => {
    try {
      await createStall(data);
      await refresh();
    } catch (err) {
      setCrudError(err?.response?.data?.detail || err.message || "Error creating stall.");
      throw err;
    }
  };

  const update = async (id, data) => {
    try {
      await updateStall(id, data);
      await refresh();
    } catch (err) {
      setCrudError(err?.response?.data?.detail || err.message || "Error updating stall.");
      throw err;
    }
  };

  const deactivate = async (id) => {
    try {
      await deactivateStall(id);
      await refresh();
    } catch (err) {
      setCrudError(err?.response?.data?.detail || err.message || "Error deactivating stall.");
      throw err;
    }
  };

  // Export actions (returns blob, you handle download in component)
  const exportCSV = async () => {
    try {
      return await exportCsv();
    } catch (err) {
      debugLog("[useStalls] Export CSV error:", err);
      throw err;
    }
  };
  const exportXLSX = async () => {
    try {
      return await exportExcel();
    } catch (err) {
      debugLog("[useStalls] Export XLSX error:", err);
      throw err;
    }
  };

  return {
    stalls,
    summary,
    total,
    loading,
    error,
    page,
    pageSize,
    hasNextPage,
    hasPrevPage,
    filters,
    refresh,
    goToPage,
    changePageSize,
    updateFilters,
    createStall: create,
    updateStall: update,
    deactivateStall: deactivate,
    exportCSV,
    exportXLSX,
  };
}
