// src/layouts/stalls/hooks/useStalls.js

import { useState, useEffect, useCallback } from "react";
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

// Default page size for pagination
const DEFAULT_PAGE_SIZE = 20;

export default function useStalls(initialFilters = {}) {
  // Core state
  const [stalls, setStalls] = useState([]);
  const [summary, setSummary] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Pagination & filters
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [filters, setFilters] = useState(initialFilters); // { search, status, type, section, ... }

  // Advanced: track if server has next/prev page
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPrevPage, setHasPrevPage] = useState(false);

  // Main fetcher
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Pass pagination and filters as params
      const params = {
        page,
        page_size: pageSize,
        ...filters,
      };
      console.log("[DEBUG][useStalls] Loading stalls with params:", params);

      const [stallsRes, summaryRes] = await Promise.all([
        fetchStalls(params),
        fetchStallsSummary(),
      ]);

      console.log("[DEBUG][useStalls] fetchStalls returned:", stallsRes);
      console.log("[DEBUG][useStalls] fetchStallsSummary returned:", summaryRes);

      // Universal pattern to support both axios (real) and direct mock
      const response = stallsRes.data || stallsRes;
      const { results, count, next, previous } = response;

      setStalls(results || response); // If paginated, use results; if not, use full array
      setTotal(count || (results ? results.length : response.length));
      setHasNextPage(Boolean(next));
      setHasPrevPage(Boolean(previous));

      const summaryResponse = summaryRes.data || summaryRes;
      setSummary(summaryResponse.summary || []);
    } catch (err) {
      setError(err?.response?.data?.detail || err.message || "Error loading stalls.");
      console.error("[DEBUG][useStalls] ERROR loading stalls:", err);
    }
    setLoading(false);
  }, [page, pageSize, filters]);

  // Load on mount & whenever page/filters change
  useEffect(() => {
    load();
  }, [load]);

  // Exposed API helpers for forms/components (optional)
  const create = async (data) => {
    setLoading(true);
    try {
      await createStall(data);
      await load();
    } catch (err) {
      setError(err?.response?.data?.detail || err.message || "Error creating stall.");
      throw err;
    }
    setLoading(false);
  };

  const update = async (id, data) => {
    setLoading(true);
    try {
      await updateStall(id, data);
      await load();
    } catch (err) {
      setError(err?.response?.data?.detail || err.message || "Error updating stall.");
      throw err;
    }
    setLoading(false);
  };

  const deactivate = async (id) => {
    setLoading(true);
    try {
      await deactivateStall(id);
      await load();
    } catch (err) {
      setError(err?.response?.data?.detail || err.message || "Error deactivating stall.");
      throw err;
    }
    setLoading(false);
  };

  // Pagination & filters API
  const goToPage = (n) => setPage(n);
  const changePageSize = (sz) => setPageSize(sz);
  const updateFilters = (newFilters) => {
    setFilters((f) => ({ ...f, ...newFilters }));
    setPage(1); // reset to page 1 when filters change
  };

  // Export actions (returns blob, you handle download in component)
  const exportCSV = async () => {
    try {
      return await exportCsv();
    } catch (err) {
      setError("Export failed: " + (err?.message || "Unknown error"));
      throw err;
    }
  };
  const exportXLSX = async () => {
    try {
      return await exportExcel();
    } catch (err) {
      setError("Export failed: " + (err?.message || "Unknown error"));
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
    refresh: load,
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
