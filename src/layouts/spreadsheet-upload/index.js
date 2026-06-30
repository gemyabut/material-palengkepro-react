import { useState } from "react";
import { jwtDecode } from "jwt-decode";
import { Alert, Button, Card, CardContent, Divider, Grid, Stack } from "@mui/material";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";

import {
  canUseSpreadsheetUpload,
  canSeeAllImportJobs,
  canUseGraceMode,
  spreadsheetUploadDomains,
} from "utils/permissions";
import { uploadWorkbook, downloadMasterTemplate } from "api/csvImport";

import DomainPicker from "./components/DomainPicker";
import ActionPicker from "./components/ActionPicker";
import FileDropzone from "./components/FileDropzone";
import GraceModeToggle from "./components/GraceModeToggle";
import UploadProgress from "./components/UploadProgress";
import ImportPreview from "./components/ImportPreview";
import ImportResultPanel from "./components/ImportResultPanel";
import ImportHistoryTable from "./components/ImportHistoryTable";

import "./spreadsheet-upload.css";

function getRole() {
  const t = localStorage.getItem("access_token") || sessionStorage.getItem("access_token");
  try { return (jwtDecode(t).role || "").toLowerCase(); } catch { return ""; }
}

function SpreadsheetUpload() {
  const role       = getRole();
  const allowed    = canUseSpreadsheetUpload(role);
  const myDomains  = spreadsheetUploadDomains(role);
  const showGrace  = canUseGraceMode(role);
  const seeAll     = canSeeAllImportJobs(role);

  const [domain,           setDomain]           = useState(myDomains[0] || "");
  const [mode,             setMode]             = useState("upsert");
  const [graceMode,        setGraceMode]        = useState(false);
  const [file,             setFile]             = useState(null);
  const [validating,       setValidating]       = useState(false);
  const [publishing,       setPublishing]       = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [publishResult,    setPublishResult]    = useState(null);
  const [error,            setError]            = useState(null);
  const [historyKey,       setHistoryKey]       = useState(0);

  const loading = validating || publishing;

  const loadingMsg = validating
    ? "Validating — this may take 10–15 seconds..."
    : "Committing rows to database...";

  const handleFileChange = (f) => {
    setFile(f);
    setValidationResult(null);
    setPublishResult(null);
    setError(null);
  };

  const handleClear = () => {
    setValidationResult(null);
    setPublishResult(null);
    setError(null);
  };

  const handleValidate = async () => {
    if (!file) { setError("Please choose a file first."); return; }
    setError(null);
    setValidating(true);
    setValidationResult(null);
    setPublishResult(null);
    try {
      const data = await uploadWorkbook(file, {
        dryRun: true,
        domain: domain || undefined,
        mode,
        graceMode,
      });
      setValidationResult(data);
    } catch (err) {
      setError(err?.response?.data?.error || err.message || "Validation failed.");
    } finally {
      setValidating(false);
    }
  };

  const handlePublish = async () => {
    if (!file) { setError("Please choose a file first."); return; }
    setError(null);
    setPublishing(true);
    try {
      const data = await uploadWorkbook(file, {
        dryRun: false,
        domain: domain || undefined,
        mode,
        graceMode,
      });
      setPublishResult(data);
      setValidationResult(null);
      setHistoryKey((k) => k + 1); // refresh history after successful publish
    } catch (err) {
      setError(err?.response?.data?.error || err.message || "Import failed.");
    } finally {
      setPublishing(false);
    }
  };

  const handleUploadAnother = () => {
    setFile(null);
    setValidationResult(null);
    setPublishResult(null);
    setError(null);
    // domain + mode intentionally preserved
  };

  if (!allowed) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <MDBox py={3}>
          <Alert severity="warning">You don&apos;t have permission to use the spreadsheet uploader.</Alert>
        </MDBox>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>
        <MDBox mb={3}>
          <MDTypography variant="h4">Spreadsheet Upload</MDTypography>
          <MDTypography variant="button" color="text">
            Validate first — fix errors in your spreadsheet — then Publish. Domain and action selections persist
            across re-uploads.
          </MDTypography>
        </MDBox>

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <MDTypography variant="h6" mb={1}>
                  1. Select domain
                </MDTypography>
                <DomainPicker
                  domain={domain}
                  allowedDomains={myDomains}
                  onChange={setDomain}
                  onDownloadTemplate={downloadMasterTemplate}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <MDTypography variant="h6" mb={1}>
                  2. Select action
                </MDTypography>
                <ActionPicker value={mode} onChange={setMode} />
              </Grid>

              <Grid item xs={12}>
                <MDTypography variant="h6" mb={1}>
                  3. Upload file
                </MDTypography>
                <FileDropzone file={file} onChange={handleFileChange} />
              </Grid>

              {showGrace && (
                <Grid item xs={12}>
                  <GraceModeToggle value={graceMode} onChange={setGraceMode} />
                </Grid>
              )}

              <Grid item xs={12}>
                <Stack direction="row" spacing={2}>
                  <Button
                    variant="outlined"
                    color="info"
                    onClick={handleValidate}
                    disabled={loading || !file}
                  >
                    Validate
                  </Button>
                  <Button
                    variant="contained"
                    color="success"
                    onClick={handlePublish}
                    disabled={loading || !file}
                  >
                    Publish
                  </Button>
                </Stack>
              </Grid>
            </Grid>

            {loading && <UploadProgress message={loadingMsg} />}

            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {String(error)}
              </Alert>
            )}

            <ImportPreview
              result={validationResult}
              onClear={handleClear}
              onPublish={handlePublish}
              publishing={publishing}
            />

            <ImportResultPanel result={publishResult} onUploadAnother={handleUploadAnother} />
          </CardContent>
        </Card>

        <Divider sx={{ my: 2 }} />

        <ImportHistoryTable canSeeAll={seeAll} refreshKey={historyKey} />
      </MDBox>
    </DashboardLayout>
  );
}

export default SpreadsheetUpload;
