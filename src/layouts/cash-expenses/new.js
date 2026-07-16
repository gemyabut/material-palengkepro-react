import React, { useState, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import FormControl from "@mui/material/FormControl";
import InputAdornment from "@mui/material/InputAdornment";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import TextField from "@mui/material/TextField";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import { createCashExpense } from "api/deductions";
import { listExpenseCategories } from "api/expenseCategories";
import { getMarket, searchMarkets } from "api/markets";
import useProfile from "layouts/profile/hooks/useProfile";

// Unit 52 Stage E — Request Cash Expense. Batch-independent create via the
// flat POST /api/deductions/ endpoint (Stage C): no batch id, market + date
// supplied directly. Receipt-image validation (JPEG/PNG, 5MB) and expense
// category fetch mirror deposit-batches/components/DeductionCreateModal.js.

const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/jpg", "image/png"];

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function RequestCashExpensePage() {
  const navigate = useNavigate();
  const { userProfile, loading: profileLoading, capabilities } = useProfile();
  const role = userProfile?.role || "";
  const isExec = role === "executive";

  const [marketId, setMarketId] = useState(null);
  const [marketCode, setMarketCode] = useState("");
  const [marketErr, setMarketErr] = useState("");
  const [resolvingMarket, setResolvingMarket] = useState(false);

  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [expenseCategoryId, setExpenseCategoryId] = useState("");
  const [date, setDate] = useState(todayStr());
  const [reason, setReason] = useState("");
  const [file, setFile] = useState(null);
  const [fileErr, setFileErr] = useState("");

  const [categories, setCategories] = useState([]);
  const [catLoading, setCatLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiErr, setApiErr] = useState(null);

  useEffect(() => {
    const id = userProfile?.primary_market ?? userProfile?.primary_market_id;
    if (!id) return;
    getMarket(id)
      .then((m) => {
        setMarketId(m.id);
        setMarketCode(m.code || "");
      })
      .catch(() => {});
  }, [userProfile]);

  useEffect(() => {
    setCatLoading(true);
    listExpenseCategories({ is_active: true })
      .then((data) => setCategories(Array.isArray(data) ? data : data.results || []))
      .catch(() => setCategories([]))
      .finally(() => setCatLoading(false));
  }, []);

  const resolveMarket = async () => {
    if (!marketCode.trim()) return;
    setResolvingMarket(true);
    setMarketErr("");
    try {
      const matches = await searchMarkets(marketCode.trim());
      const exact = matches.find(
        (m) => m.code.toUpperCase() === marketCode.trim().toUpperCase()
      );
      if (!exact) {
        setMarketId(null);
        setMarketErr("No market found with that code.");
      } else {
        setMarketId(exact.id);
        setMarketCode(exact.code);
      }
    } catch {
      setMarketErr("Failed to look up market.");
    } finally {
      setResolvingMarket(false);
    }
  };

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) {
      setFile(null);
      setFileErr("");
      return;
    }
    if (!ALLOWED.includes(f.type)) {
      setFileErr("JPEG or PNG only.");
      setFile(null);
      return;
    }
    if (f.size > MAX_SIZE) {
      setFileErr("File must be under 5 MB.");
      setFile(null);
      return;
    }
    setFile(f);
    setFileErr("");
  };

  const validate = () => {
    const e = {};
    if (!marketId) e.market = "A valid market is required.";
    if (!date) e.date = "Date is required.";
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0)
      e.amount = "Enter a positive amount.";
    if (!description.trim()) e.description = "Description is required.";
    if (!recipientName.trim()) e.recipient_name = "Recipient name is required.";
    if (!expenseCategoryId) e.expense_category_id = "Select an expense category.";
    if (!file && !reason.trim())
      e.reason = "Either a receipt image or a reason is required.";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    setSubmitting(true);
    setApiErr(null);
    const fd = new FormData();
    fd.append("market", marketId);
    fd.append("date", date);
    fd.append("amount", amount);
    fd.append("description", description.trim());
    fd.append("recipient_name", recipientName.trim());
    fd.append("expense_category_id", expenseCategoryId);
    if (reason.trim()) fd.append("reason", reason.trim());
    if (file) fd.append("receipt_image", file);
    try {
      await createCashExpense(fd);
      navigate("/accounts-receivable/cash-expenses", {
        state: { successMessage: "Cash expense request submitted for approval." },
      });
    } catch (err) {
      const d = err?.response?.data;
      if (d && typeof d === "object" && !d.detail) {
        setErrors(
          Object.fromEntries(Object.entries(d).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]))
        );
      } else {
        setApiErr(d?.detail || "Submission failed.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!profileLoading && !capabilities.canCreateDeduction) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3} maxWidth="600px">
        <MDTypography variant="h4" fontWeight="bold" mb={3}>
          Request Cash Expense
        </MDTypography>

        {apiErr && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {apiErr}
          </Alert>
        )}

        <MDBox display="flex" flexDirection="column" gap={2}>
          <TextField
            label="Market Code"
            value={marketCode}
            onChange={(e) => setMarketCode(e.target.value.toUpperCase())}
            onBlur={resolveMarket}
            onKeyDown={(e) => {
              if (e.key === "Enter") resolveMarket();
            }}
            disabled={!isExec || submitting}
            size="small"
            error={!!errors.market || !!marketErr}
            helperText={
              errors.market || marketErr || (!isExec ? "Your assigned market." : "Owner may pick any market.")
            }
            InputProps={{
              endAdornment: resolvingMarket ? (
                <InputAdornment position="end">
                  <CircularProgress size={16} />
                </InputAdornment>
              ) : undefined,
            }}
          />

          <TextField
            label="Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            size="small"
            InputLabelProps={{ shrink: true }}
            disabled={submitting}
            error={!!errors.date}
            helperText={errors.date}
          />

          <TextField
            label="Amount"
            type="number"
            inputProps={{ min: 0.01, step: 0.01 }}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={submitting}
            error={!!errors.amount}
            helperText={errors.amount}
            InputProps={{
              startAdornment: <InputAdornment position="start">₱</InputAdornment>,
            }}
          />

          <FormControl fullWidth error={!!errors.expense_category_id}>
            <InputLabel>Expense category</InputLabel>
            <Select
              value={expenseCategoryId}
              label="Expense category"
              onChange={(e) => setExpenseCategoryId(e.target.value)}
              disabled={submitting || catLoading}
            >
              {catLoading && (
                <MenuItem value="">
                  <em>Loading…</em>
                </MenuItem>
              )}
              {categories.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.display_name}
                </MenuItem>
              ))}
            </Select>
            {errors.expense_category_id && (
              <MDTypography variant="caption" color="error" ml={1.5}>
                {errors.expense_category_id}
              </MDTypography>
            )}
          </FormControl>

          <TextField
            label="Recipient name"
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
            disabled={submitting}
            error={!!errors.recipient_name}
            helperText={errors.recipient_name}
          />

          <TextField
            label="Description"
            multiline
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={submitting}
            error={!!errors.description}
            helperText={errors.description}
          />

          <MDBox>
            <MDTypography variant="caption" color="secondary" display="block" mb={0.5}>
              Receipt image (optional — JPEG/PNG, max 5 MB)
            </MDTypography>
            <input
              type="file"
              accept="image/jpeg,image/png"
              onChange={handleFile}
              disabled={submitting}
            />
            {fileErr && (
              <MDTypography variant="caption" color="error" display="block" mt={0.5}>
                {fileErr}
              </MDTypography>
            )}
            {file && (
              <MDTypography variant="caption" color="success" display="block" mt={0.5}>
                {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </MDTypography>
            )}
          </MDBox>

          <TextField
            label="Reason (required if no receipt)"
            multiline
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={submitting}
            error={!!errors.reason}
            helperText={errors.reason}
          />

          <MDBox display="flex" gap={2}>
            <Button
              variant="contained"
              color="info"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? <CircularProgress size={18} sx={{ color: "white" }} /> : "Submit Request"}
            </Button>
            <Button onClick={() => navigate("/accounts-receivable/cash-expenses")} disabled={submitting}>
              Cancel
            </Button>
          </MDBox>
        </MDBox>
      </MDBox>
    </DashboardLayout>
  );
}
