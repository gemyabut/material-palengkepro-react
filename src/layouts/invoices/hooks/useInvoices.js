import { useState, useEffect, useCallback } from "react";
import { getInvoices } from "../../../api/invoices";

const DEFAULT_LIMIT = 20;

export function useInvoices({ filters = {}, page = 1, limit = DEFAULT_LIMIT } = {}) {
  const [invoices, setInvoices] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getInvoices({ page, page_size: limit, ...filters })
      .then((data) => {
        if (cancelled) return;
        const results = Array.isArray(data) ? data : (data?.results ?? []);
        const count = Array.isArray(data) ? data.length : (data?.count ?? results.length);
        setInvoices(results);
        setTotal(count);
      })
      .catch((e) => {
        if (!cancelled) setError(e);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, page, limit, refreshKey]);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  return { invoices, total, loading, error, refresh };
}
