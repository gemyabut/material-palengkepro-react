import { useState } from "react";
import PropTypes from "prop-types";
import { jwtDecode } from "jwt-decode";
import {
  Card,
  CardContent,
  Grid,
  Stack,
  Button,
  LinearProgress,
  Chip,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Divider,
} from "@mui/material";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";

import { canUpload, uploadableDomains } from "utils/permissions";
import { uploadWorkbook, downloadMasterTemplate } from "./api/batchImport";

const DOMAIN_LABELS = {
  tenant: "Tenant",
  stall: "Stall",
  lease: "Lease",
  payment: "Payment / Collection",
  receipt_book: "Receipt Book",
  deposit_slip: "Deposit Slip",
};

function getRole() {
  const t = localStorage.getItem("access_token") || sessionStorage.getItem("access_token");
  try {
    return (jwtDecode(t).role || "").toLowerCase();
  } catch (e) {
    return "";
  }
}

function SheetCard({ sheet }) {
  const pct = Number(sheet.acceptance_rate) || 0;
  return (
    <Card sx={{ height: "100%" }}>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
          <MDTypography variant="h6" textTransform="capitalize">
            {DOMAIN_LABELS[sheet.domain] || sheet.domain}
          </MDTypography>
          <Chip
            size="small"
            label={sheet.gate_met ? "PASS (≥95%)" : "BELOW GATE"}
            color={sheet.gate_met ? "success" : "error"}
          />
        </Stack>
        <MDTypography variant="button" color="text">
          {sheet.total_rows} rows &middot; ✓ {sheet.accepted} ok &middot; ✕ {sheet.rejected} rejected
          {sheet.warnings?.length ? ` · ⚠ ${sheet.warnings.length} warn` : ""}
        </MDTypography>
        <MDBox mt={1} mb={0.5}>
          <LinearProgress variant="determinate" value={pct} color={pct >= 95 ? "success" : "error"} />
        </MDBox>
        <MDTypography variant="caption" color="text">
          {`created ${sheet.created} · updated ${sheet.updated} · acceptance ${pct}%`}
        </MDTypography>

        {sheet.errors?.length > 0 && (
          <MDBox mt={1.5}>
            <MDTypography variant="caption" fontWeight="bold" color="error">
              Rejected rows
            </MDTypography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Row</TableCell>
                  <TableCell>Field</TableCell>
                  <TableCell>Reason</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sheet.errors.slice(0, 25).map((e, i) => (
                  <TableRow key={i}>
                    <TableCell>{e.row}</TableCell>
                    <TableCell>{e.field}</TableCell>
                    <TableCell>{e.message}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </MDBox>
        )}
      </CardContent>
    </Card>
  );
}

SheetCard.propTypes = {
  sheet: PropTypes.object.isRequired, // eslint-disable-line react/forbid-prop-types
};

// Manifest (README tab) summary + cross-checks — only relevant for the master workbook.
function ManifestPanel({ manifest, checks }) {
  if (!manifest && (!checks || checks.length === 0)) return null;
  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <MDTypography variant="h6" gutterBottom>
          Manifest (README)
        </MDTypography>
        {manifest && (
          <MDTypography variant="caption" color="text" display="block" mb={1}>
            {manifest.market_code ? `Market: ${manifest.market_code}` : "Market: —"}
            {manifest.upload_date ? ` · Upload date: ${manifest.upload_date}` : ""}
          </MDTypography>
        )}
        {checks?.length > 0 && (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Check</TableCell>
                <TableCell align="right">Expected</TableCell>
                <TableCell align="right">Actual</TableCell>
                <TableCell align="right">Result</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {checks.map((c, i) => (
                <TableRow key={i}>
                  <TableCell>{c.check}</TableCell>
                  <TableCell align="right">{c.expected}</TableCell>
                  <TableCell align="right">{c.actual}</TableCell>
                  <TableCell align="right">
                    <Chip
                      size="small"
                      label={c.ok ? "OK" : "MISMATCH"}
                      color={c.ok ? "success" : "error"}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

ManifestPanel.propTypes = {
  manifest: PropTypes.object, // eslint-disable-line react/forbid-prop-types
  checks: PropTypes.array, // eslint-disable-line react/forbid-prop-types
};
ManifestPanel.defaultProps = { manifest: null, checks: [] };

// Result block shared by both tiles.
function ResultPanel({ result }) {
  if (!result) return null;
  return (
    <MDBox mt={2}>
      <Alert severity={result._mode === "validate" ? "info" : "success"} sx={{ mb: 2 }}>
        {result._mode === "validate"
          ? "Validation only — nothing was saved."
          : "Published — rows that passed were committed."}
        {"  Overall acceptance: "}
        {result.overall_acceptance_rate}%
      </Alert>
      <ManifestPanel manifest={result.manifest} checks={result.manifest_checks} />
      <Grid container spacing={2}>
        {(result.sheets || []).map((s) => (
          <Grid item xs={12} md={6} key={s.domain}>
            <SheetCard sheet={s} />
          </Grid>
        ))}
      </Grid>
      {result.unrecognized_sheets?.length > 0 && (
        <>
          <Divider sx={{ my: 2 }} />
          <MDTypography variant="caption" color="text">
            Ignored sheets (not a recognized domain): {result.unrecognized_sheets.join(", ")}
          </MDTypography>
        </>
      )}
    </MDBox>
  );
}

ResultPanel.propTypes = {
  result: PropTypes.object, // eslint-disable-line react/forbid-prop-types
};
ResultPanel.defaultProps = { result: null };

// One self-contained upload tile (own file + result state).
// fixedDomain === null => master workbook (no domain sent; sheet names route).
function UploadTile({ title, description, accept, fixedDomain, allowAttachment }) {
  const [file, setFile] = useState(null);
  const [attachment, setAttachment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const run = async (dryRun) => {
    setError(null);
    if (!file) {
      setError("Please choose a file first.");
      return;
    }
    setLoading(true);
    try {
      const data = await uploadWorkbook(file, {
        dryRun,
        domain: fixedDomain || undefined,
        attachment: allowAttachment ? attachment || undefined : undefined,
      });
      setResult({ ...data, _mode: dryRun ? "validate" : "publish" });
    } catch (err) {
      setError(err?.response?.data?.error || err.message || "Upload failed.");
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card sx={{ height: "100%" }}>
      <CardContent>
        <MDTypography variant="h5" gutterBottom>
          {title}
        </MDTypography>
        <MDTypography variant="button" color="text" display="block" mb={2}>
          {description}
        </MDTypography>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center">
          <Button variant="outlined" component="label">
            {file ? file.name : "Choose file"}
            <input
              hidden
              type="file"
              accept={accept}
              onChange={(e) => {
                setFile(e.target.files?.[0] || null);
                setResult(null);
                setError(null);
              }}
            />
          </Button>
          {allowAttachment && (
            <Button variant="outlined" color="secondary" component="label">
              {attachment ? attachment.name : "Attach scan"}
              <input
                hidden
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setAttachment(e.target.files?.[0] || null)}
              />
            </Button>
          )}
        </Stack>

        <Stack direction="row" spacing={2} mt={2}>
          <Button variant="outlined" disabled={loading} onClick={() => run(true)}>
            Validate
          </Button>
          <Button variant="contained" color="success" disabled={loading} onClick={() => run(false)}>
            Publish
          </Button>
        </Stack>

        {loading && (
          <MDBox mt={2}>
            <LinearProgress color="info" />
          </MDBox>
        )}
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {String(error)}
          </Alert>
        )}
        <ResultPanel result={result} />
      </CardContent>
    </Card>
  );
}

UploadTile.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  accept: PropTypes.string.isRequired,
  fixedDomain: PropTypes.string, // null => master tile
  allowAttachment: PropTypes.bool, // deposit slips: a single scan for the batch
};
UploadTile.defaultProps = { fixedDomain: null, allowAttachment: false };

// Per-domain single-sheet tiles (shown only for domains the role may upload).
const DOMAIN_TILES = {
  tenant: {
    title: "Tenants",
    description: "One .csv / .xlsx of tenants. The action column drives create/update per row.",
  },
  stall: {
    title: "Stalls",
    description: "One .csv / .xlsx of stalls. The action column supports create/update/delete/restore.",
  },
  lease: {
    title: "Leases",
    description: "One .csv / .xlsx of leases (tenants + stalls must already exist). Supports terminate.",
  },
  payment: {
    title: "Collections",
    description: "One .csv / .xlsx of daily collections / payments against existing leases.",
  },
  receipt_book: {
    title: "Receipt Books",
    description:
      "One .csv / .xlsx of OR/AR receipt books (market, type, series start/end, issued date, assigned collector).",
  },
  deposit_slip: {
    title: "Deposit Slips",
    description:
      "One .csv / .xlsx of bank deposit slips attached to an existing remittance batch (batch_id or market + date). Include a reference_number column; optionally attach one scan that applies to the whole sheet.",
    allowAttachment: true,
  },
};

function BatchImport() {
  const role = getRole();
  const allowed = canUpload(role);
  const myDomains = uploadableDomains(role);

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>
        <MDBox mb={2}>
          <MDTypography variant="h4">Upload Center</MDTypography>
          <MDTypography variant="button" color="text">
            &ldquo;Validate&rdquo; checks without saving; &ldquo;Publish&rdquo; commits the rows that
            pass the 95% gate.
          </MDTypography>
        </MDBox>

        {!allowed ? (
          <Alert severity="warning">You don&apos;t have permission to upload market data.</Alert>
        ) : (
          <>
            <MDBox mb={1}>
              <MDTypography variant="h6" color="text">
                Day-to-day, per domain
              </MDTypography>
            </MDBox>
            <Grid container spacing={3} alignItems="flex-start">
              {myDomains.map((d) => (
                <Grid item xs={12} md={6} key={d}>
                  <UploadTile
                    title={DOMAIN_TILES[d].title}
                    description={DOMAIN_TILES[d].description}
                    accept=".csv,.xlsx"
                    fixedDomain={d}
                    allowAttachment={Boolean(DOMAIN_TILES[d].allowAttachment)}
                  />
                </Grid>
              ))}
            </Grid>

            <Divider sx={{ my: 2 }} />
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
              <MDTypography variant="h6" color="text">
                Initial bulk load
              </MDTypography>
              <Button variant="outlined" onClick={downloadMasterTemplate}>
                Download master template
              </Button>
            </Stack>
            <Grid container spacing={3} alignItems="flex-start">
              <Grid item xs={12}>
                <UploadTile
                  title="Master Workbook"
                  description="One .xlsx with a README tab plus Stalls, Tenants, and Leases tabs (Collections optional). The README is read as a manifest and cross-checked; tabs route by name and load in order (Stalls + Tenants → Leases → Payments)."
                  accept=".xlsx"
                />
              </Grid>
            </Grid>
          </>
        )}
      </MDBox>
    </DashboardLayout>
  );
}

export default BatchImport;
