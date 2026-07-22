import { useState } from "react";
import { jwtDecode } from "jwt-decode";
import {
  Card,
  CardContent,
  Grid,
  Stack,
  TextField,
  Button,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";

import { canOnboard, canManageStaff, canUseSpreadsheetUpload } from "utils/permissions";
import { onboardCompany, createStaff } from "./api/administration";
import TemplatesSection from "./components/TemplatesSection";

function getRole() {
  const t = localStorage.getItem("access_token") || sessionStorage.getItem("access_token");
  try {
    return (jwtDecode(t).role || "").toLowerCase();
  } catch (e) {
    return "";
  }
}

const STAFF_ROLES = [
  "leasing_officer",
  "collector",
  "cashier",
  "accounts_receivable",
  "accounting_staff",
  "market_manager",
];

function ResultBox({ result }) {
  if (!result) return null;
  const cred = result.admin || result; // onboard nests under .admin; staff is flat
  return (
    <Alert severity="success" sx={{ mt: 2 }}>
      Created <strong>{cred.username}</strong> ({cred.user_id_number})
      {result.market ? ` · market ${result.market.code || result.market}` : ""}
      {cred.temp_password ? (
        <>
          {" "}
          · temp password: <strong>{cred.temp_password}</strong> (change on first login)
        </>
      ) : null}
    </Alert>
  );
}

// Onboard a market (platform admin → POST /billing/signup/)
function OnboardCard() {
  const [form, setForm] = useState({ code: "", name: "", admin_email: "", admin_mobile: "", admin_name: "" });
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async () => {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      setResult(await onboardCompany(form));
    } catch (e) {
      setError(e?.response?.data?.error || e.message || "Onboarding failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card sx={{ height: "100%" }}>
      <CardContent>
        <MDTypography variant="h6" gutterBottom>
          Onboard a market
        </MDTypography>
        <MDTypography variant="caption" color="text">
          Creates the company, its first market, a Community subscription, and the Market Administrator.
        </MDTypography>
        <Stack spacing={2} mt={2}>
          <TextField size="small" label="Market code (e.g. ECM)" value={form.code} onChange={set("code")} />
          <TextField size="small" label="Company / market name" value={form.name} onChange={set("name")} />
          <TextField size="small" label="Admin email" value={form.admin_email} onChange={set("admin_email")} />
          <TextField size="small" label="Admin mobile" value={form.admin_mobile} onChange={set("admin_mobile")} />
          <TextField size="small" label="Admin name" value={form.admin_name} onChange={set("admin_name")} />
          <Button variant="contained" color="success" disabled={busy || !form.code || !form.name} onClick={submit}>
            Onboard
          </Button>
        </Stack>
        {error && <Alert severity="error" sx={{ mt: 2 }}>{String(error)}</Alert>}
        <ResultBox result={result} />
      </CardContent>
    </Card>
  );
}

// Add staff (market admin → POST /billing/staff/)
function StaffCard() {
  const [form, setForm] = useState({ full_name: "", role: "collector", email: "", mobile: "" });
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async () => {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      setResult(await createStaff(form));
    } catch (e) {
      setError(e?.response?.data?.error || e.message || "Create staff failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card sx={{ height: "100%" }}>
      <CardContent>
        <MDTypography variant="h6" gutterBottom>
          Add market staff
        </MDTypography>
        <MDTypography variant="caption" color="text">
          Creates a staff account in your market (collector, leasing officer, cashier, AR, etc.).
        </MDTypography>
        <Stack spacing={2} mt={2}>
          <TextField size="small" label="Full name" value={form.full_name} onChange={set("full_name")} />
          <FormControl size="small">
            <InputLabel>Role</InputLabel>
            <Select value={form.role} label="Role" onChange={set("role")}>
              {STAFF_ROLES.map((r) => (
                <MenuItem key={r} value={r} sx={{ textTransform: "capitalize" }}>
                  {r.replace(/_/g, " ")}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField size="small" label="Email" value={form.email} onChange={set("email")} />
          <TextField size="small" label="Mobile" value={form.mobile} onChange={set("mobile")} />
          <Button variant="contained" disabled={busy || !form.full_name} onClick={submit}>
            Create staff
          </Button>
        </Stack>
        {error && <Alert severity="error" sx={{ mt: 2 }}>{String(error)}</Alert>}
        <ResultBox result={result} />
      </CardContent>
    </Card>
  );
}

export default function Administration() {
  const role = getRole();
  const showOnboard = canOnboard(role);
  const showStaff = canManageStaff(role);
  const showTemplates = canUseSpreadsheetUpload(role);

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>
        <MDTypography variant="h4" mb={2}>
          Administration
        </MDTypography>
        {!showOnboard && !showStaff && !showTemplates ? (
          <Alert severity="warning">You don&apos;t have access to administration.</Alert>
        ) : (
          <Grid container spacing={3} alignItems="flex-start">
            {showOnboard && (
              <Grid item xs={12} md={6}>
                <OnboardCard />
              </Grid>
            )}
            {showStaff && (
              <Grid item xs={12} md={6}>
                <StaffCard />
              </Grid>
            )}
            {showTemplates && (
              <Grid item xs={12} md={6}>
                <TemplatesSection />
              </Grid>
            )}
          </Grid>
        )}
      </MDBox>
    </DashboardLayout>
  );
}
