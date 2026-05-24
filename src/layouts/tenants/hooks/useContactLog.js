// src/layouts/tenants/hooks/useContactLog.js

import { useState, useEffect, useCallback } from "react";
import { getContactLog, addContactLog } from "../api/tenants";
import { debugLog } from "../../stalls/utils/debug";

/**
 * useContactLog - Fetch and manage a tenant's contact log
 * @param {number|string} tenantId - The ID of the tenant
 */
export default function useContactLog(tenantId) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch logs
  const fetchLogs = useCallback(() => {
    if (!tenantId) return;
    setLoading(true);
    setError(null);
    getContactLog(tenantId)
      .then((data) => {
        setLogs(data);
        debugLog("Fetched contact log:", data);
      })
      .catch((err) => {
        setError(err);
        debugLog("Contact log fetch error:", err);
      })
      .finally(() => setLoading(false));
  }, [tenantId]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs, tenantId]);

  // Add a new log entry
  const handleAddLog = (logData) => {
    if (!tenantId) return;
    setLoading(true);
    setError(null);
    addContactLog(tenantId, logData)
      .then((newLog) => {
        setLogs((prev) => [newLog, ...prev]);
        debugLog("Added contact log entry:", newLog);
      })
      .catch((err) => {
        setError(err);
        debugLog("Add contact log error:", err);
      })
      .finally(() => setLoading(false));
  };

  return {
    logs,
    loading,
    error,
    fetchLogs,
    handleAddLog,
  };
}
