// src/layouts/tenants/hooks/useTenantForm.js

import { useState, useEffect } from "react";
import { addTenant, updateTenant } from "../api/tenants";
import { debugLog } from "../../stalls/utils/debug";

/**
 * useTenantForm - logic for add/edit tenant forms
 * @param {object} initialValues - tenant to edit, or {} for add
 * @param {function} onSuccess - called after successful save
 */
export default function useTenantForm(initialValues = {}, onSuccess) {
  const [form, setForm] = useState(initialValues);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Keep form in sync if editing a different tenant
  useEffect(() => {
    setForm(initialValues || {});
  }, [initialValues]);

  // Field change handler
  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  // Submit (add or edit)
  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // TODO: validation here (or before submit)

    const apiCall = form.id
      ? updateTenant(form.id, form)
      : addTenant(form);

    apiCall
      .then((saved) => {
        debugLog("Tenant saved:", saved);
        if (onSuccess) onSuccess(saved);
      })
      .catch((err) => {
        debugLog("Tenant form error:", err);
        setError(err);
      })
      .finally(() => setLoading(false));
  };

  return {
    form,
    setForm,
    loading,
    error,
    handleChange,
    handleSubmit,
  };
}
