// src/layouts/tenants/hooks/useTenants.js

import { useState, useEffect, useCallback } from "react";
import { getTenants } from "../api/tenants";
import { debugLog } from "../../stalls/utils/debug";

/**
 * useTenants - React hook for tenant data
 * @param {object} queryParams - search/filter/pagination params
 * @param {object} user - current user (for role-based filtering)
 */
export default function useTenants(queryParams = {}, user = null) {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState(null);

  const fetchTenants = useCallback(() => {
    setLoading(true);
    setError(null);

    // Optionally adjust params by role
    let params = { ...queryParams };
    if (user) {
      if (user.role === "leasing_officer") params.assigned_to = user.id;
      if (user.role === "collector") params.assigned_collector = user.id;
      if (user.role === "tenant") params.tenant_id = user.id;
      // ...other role filters as needed
    }

    getTenants(params)
      .then((data) => {
        setTenants(data.results || data); // API paginated or not
        setTotal(data.count || (data.results ? data.results.length : data.length));
        debugLog("Fetched tenants (hook):", data);
      })
      .catch((err) => {
        setError(err);
        debugLog("useTenants error:", err);
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line
  }, [JSON.stringify(queryParams), user?.id, user?.role]);

  // Fetch on mount or query/user change
  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  return { tenants, loading, total, error, refetch: fetchTenants };
}
