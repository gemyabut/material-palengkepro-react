import { useEffect, useState } from "react";
import PropTypes from "prop-types";
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
  InputAdornment,
  IconButton,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";

import { canOnboard, canManageStaff, canUseSpreadsheetUpload } from "utils/permissions";
import { onboardCompany, createStaff, getStaffRoles } from "./api/administration";
import TemplatesSection from "./components/TemplatesSection";

function getRole() {
  const t = localStorage.getItem("access_token") || sessionStorage.getItem("access_token");
  try {
    return (jwtDecode(t).role || "").toLowerCase();
  } catch (e) {
    return "";
  }
}

// MDU-022 (Lead decision 2026-10-06): the person creating the account sets its
// temporary password — nothing is generated, emailed or shown back. The account
// holder must change it at first login.
function TempPasswordField({ label, value, onChange }) {
  const [show, setShow] = useState(false);
  return (
    <TextField
      size="small"
      required
      label={label}
      type={show ? "text" : "password"}
      value={value}
      onChange={onChange}
      autoComplete="new-password"
      helperText="You set it and hand it over in person. They must change it at first login."
      InputProps={{
        endAdornment: (
          <InputAdornment position="end">
            <IconButton
              size="small"
              edge="end"
              aria-label={show ? "Hide password" : "Show password"}
              onClick={() => setShow((v) => !v)}
            >
              {show ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
            </IconButton>
          </InputAdornment>
        ),
      }}
    />
  );
}

TempPasswordField.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
};

function ResultBox({ result }) {
  if (!result) return null;
  const cred = result.admin || result; // onboard nests under .admin; staff is flat
  return (
    <Alert severity="success" sx={{ mt: 2 }}>
      Created <strong>{cred.username}</strong> ({cred.user_id_number})
      {result.market ? ` · market ${result.market.code || result.market}` : ""}
      {" "}· they sign in with the temporary password you set and must change it at first login.
    </Alert>
  );
}

// markets.models.LicenseTier
const TIER_OPTIONS = ["community", "starter", "basic", "standard", "pro", "enterprise"];

// MDU-013 (Lead decision 2026-09-26): preview-only mirror of
// billing/onboarding.py::_default_company_code() — the backend is the
// source of truth and re-derives + validates this itself; this just shows
// the operator what to expect before they submit.
const COMPANY_CODE_SKIP_WORDS = new Set(["of", "the", "and", "&"]);

function defaultCompanyCode(name) {
  const words = (name || "").trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "";
  let significant = words.filter(
    (w) => !COMPANY_CODE_SKIP_WORDS.has(w.replace(/[.,]/g, "").toLowerCase())
  );
  if (significant.length === 0) significant = words;
  if (significant.length === 1) {
    return significant[0].toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10);
  }
  return significant.map((w) => (/[a-zA-Z0-9]/.test(w[0]) ? w[0].toUpperCase() : "")).join("");
}

// Onboard a market (platform admin → POST /billing/signup/)
function OnboardCard() {
  const [form, setForm] = useState({
    code: "", name: "", market_name: "", company_code: "",
    admin_email: "", admin_mobile: "", admin_name: "", admin_password: "", plan: "community",
  });
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
      setForm((f) => ({ ...f, admin_password: "" }));
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
          Creates the company, its first market, a subscription on the selected plan, and the Owner account.
        </MDTypography>
        <Stack spacing={2} mt={2}>
          <TextField size="small" label="Market code (e.g. ECM)" value={form.code} onChange={set("code")} />
          <TextField size="small" label="Company name" value={form.name} onChange={set("name")} />
          <TextField
            size="small"
            label="Market name (optional — defaults to company name)"
            value={form.market_name}
            onChange={set("market_name")}
          />
          <TextField
            size="small"
            label="Company code (optional)"
            value={form.company_code}
            onChange={set("company_code")}
            helperText={
              form.company_code
                ? " "
                : `Default: ${defaultCompanyCode(form.name) || "(enter a company name)"}`
            }
          />
          <TextField size="small" label="Owner email" value={form.admin_email} onChange={set("admin_email")} />
          <TextField size="small" label="Owner mobile" value={form.admin_mobile} onChange={set("admin_mobile")} />
          <TextField size="small" label="Owner name" value={form.admin_name} onChange={set("admin_name")} />
          <TempPasswordField
            label="Owner temporary password"
            value={form.admin_password}
            onChange={set("admin_password")}
          />
          <TextField select size="small" label="Plan" value={form.plan} onChange={set("plan")}>
            {TIER_OPTIONS.map((t) => (
              <MenuItem key={t} value={t}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </MenuItem>
            ))}
          </TextField>
          <Button variant="contained" color="success" disabled={busy || !form.code || !form.name || !form.admin_password} onClick={submit}>
            Onboard
          </Button>
        </Stack>
        {error && <Alert severity="error" sx={{ mt: 2 }}>{String(error)}</Alert>}
        <ResultBox result={result} />
      </CardContent>
    </Card>
  );
}

// Add staff (Owner/market admin → POST /billing/staff/)
function StaffCard({ role }) {
  // MDU-024: the dropdown shows what the backend says this creator may add
  // (billing/staff_roles.py) — no second copy of the role list here.
  const [roleOptions, setRoleOptions] = useState([]);
  const [form, setForm] = useState({
    full_name: "", role: "", email: "", mobile: "", temporary_password: "",
  });
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  useEffect(() => {
    let active = true;
    getStaffRoles()
      .then((roles) => {
        if (!active) return;
        setRoleOptions(roles);
        setForm((f) => ({ ...f, role: f.role || roles[0] || "" }));
      })
      .catch(() => active && setError("Could not load the list of roles."));
    return () => {
      active = false;
    };
  }, []);

  const submit = async () => {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      setResult(await createStaff(form));
      setForm((f) => ({ ...f, temporary_password: "" }));
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
              {roleOptions.map((r) => (
                <MenuItem key={r} value={r} sx={{ textTransform: "capitalize" }}>
                  {r.replace(/_/g, " ")}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField size="small" label="Email" value={form.email} onChange={set("email")} />
          <TextField size="small" label="Mobile" value={form.mobile} onChange={set("mobile")} />
          <TempPasswordField
            label="Temporary password"
            value={form.temporary_password}
            onChange={set("temporary_password")}
          />
          <Button
            variant="contained"
            disabled={busy || !form.full_name || !form.role || !form.temporary_password}
            onClick={submit}
          >
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
                <StaffCard role={role} />
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
