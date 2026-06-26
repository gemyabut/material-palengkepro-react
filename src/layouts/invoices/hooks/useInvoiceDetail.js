import { useState, useEffect } from "react";
import { getInvoiceById } from "../../../api/invoices";

export function useInvoiceDetail(id) {
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setNotFound(false);
    setInvoice(null);
    getInvoiceById(id)
      .then((data) => {
        if (!cancelled) setInvoice(data);
      })
      .catch((e) => {
        if (!cancelled) {
          if (e.response?.status === 404) setNotFound(true);
          else setError(e);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  return { invoice, loading, error, notFound };
}
