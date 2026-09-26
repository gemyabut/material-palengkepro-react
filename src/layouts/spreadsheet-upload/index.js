import { useEffect, useRef, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { Alert, Card, CardContent, Divider } from "@mui/material";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";

import { canUseSpreadsheetUpload, canSeeAllImportJobs } from "utils/permissions";
import { inspectWorkbook, commitWorkbook, getMyUploadMarkets } from "api/csvImport";

import FileDropzone from "./components/FileDropzone";
import MarketStep from "./components/MarketStep";
import ReviewScreen from "./components/ReviewScreen";
import SavePanel from "./components/SavePanel";
import ProgressModal from "./components/ProgressModal";
import ResultsScreen from "./components/ResultsScreen";
import ImportHistoryTable from "./components/ImportHistoryTable";
import TemplatesDropdown from "./components/TemplatesDropdown";

import "./spreadsheet-upload.css";

function getRole() {
  const t = localStorage.getItem("access_token") || sessionStorage.getItem("access_token");
  try { return (jwtDecode(t).role || "").toLowerCase(); } catch { return ""; }
}

// Unit 51 Stage F — 3-screen controller (Review -> Save -> Finished), replacing
// the old single-domain/single-action Validate-then-Publish flow. SAVING is
// rendered as a non-dismissible modal overlay on top of REVIEW rather than a
// full screen swap, since the underlying commit is a single POST -> single
// response (no server-side progress to show mid-flight).
const SCREEN = { REVIEW: "REVIEW", SAVING: "SAVING", FINISHED: "FINISHED" };

function SpreadsheetUpload() {
  const role    = getRole();
  const allowed = canUseSpreadsheetUpload(role);
  const seeAll  = canSeeAllImportJobs(role);

  const [screen,           setScreen]           = useState(SCREEN.REVIEW);
  const [file,              setFile]            = useState(null);
  const [inspecting,        setInspecting]      = useState(false);
  const [inspectResult,     setInspectResult]   = useState(null);
  const [perSheetActions,   setPerSheetActions] = useState({});
  const [saveMode,          setSaveMode]        = useState("commit");
  const [approverId,        setApproverId]      = useState("");
  const [attachment,        setAttachment]      = useState(null); // Unit 27 F4: deposit-slip scan
  const [commitResult,      setCommitResult]    = useState(null);
  const [sourceWasXlsx,     setSourceWasXlsx]   = useState(false);
  const [error,             setError]           = useState(null);
  const [historyKey,        setHistoryKey]      = useState(0);

  // MDU-014 (Lead decision 2026-09-26) — one market per upload, set once in
  // Step 1: marketsInfo.mode is "fixed" (one accessible market, no choice
  // needed) or "choose" (several/none — a required dropdown). marketCode
  // only matters in "choose" mode; the market picker locks once a file has
  // been reviewed, matching "set once".
  const [marketsInfo,       setMarketsInfo]     = useState(null);
  const [marketsLoading,    setMarketsLoading]  = useState(true);
  const [marketCode,        setMarketCode]      = useState("");

  const historyRef = useRef(null);

  useEffect(() => {
    getMyUploadMarkets()
      .then((data) => {
        setMarketsInfo(data);
        if (data?.mode === "fixed" && data.market) setMarketCode(data.market.code);
      })
      .catch(() => setMarketsInfo(null))
      .finally(() => setMarketsLoading(false));
  }, []);

  const effectiveMarket =
    marketsInfo?.mode === "fixed"
      ? marketsInfo.market
      : marketsInfo?.markets?.find((m) => m.code === marketCode) || null;

  const handleActionChange = (domain, action) => {
    setPerSheetActions((prev) => ({ ...prev, [domain]: action }));
  };

  const runInspect = async (f) => {
    setError(null);
    setInspecting(true);
    setInspectResult(null);
    try {
      const data = await inspectWorkbook(f, marketCode);
      setInspectResult(data);
      setPerSheetActions({}); // fresh file -> per-sheet actions default back to "upsert"
    } catch (err) {
      setError(err?.response?.data?.error || err.message || "Could not read this workbook.");
    } finally {
      setInspecting(false);
    }
  };

  const handleFileAccepted = (f) => {
    // MDU-014: market is set once, before the file — a multi/no-market user
    // must pick one first (mirrors the backend's own resolve_upload_market
    // requirement, so this is UX guidance, not the real enforcement).
    if (marketsInfo?.mode === "choose" && !marketCode) {
      setError("Select a market above before uploading a file.");
      return;
    }
    if (marketsInfo?.mode === "blocked") {
      setError(marketsInfo.message || "Your account has no assigned market — ask an administrator.");
      return;
    }
    setFile(f);
    setCommitResult(null);
    if (f) runInspect(f);
  };

  const handleSave = async () => {
    if (!file) return;
    setError(null);
    setScreen(SCREEN.SAVING);
    try {
      const data = await commitWorkbook(file, {
        perSheetActions,
        saveMode,
        approverId: saveMode === "all_with_warnings" ? approverId : undefined,
        attachment,
        marketCode,
      });
      setCommitResult(data);
      setSourceWasXlsx(file.name.toLowerCase().endsWith(".xlsx"));
      setHistoryKey((k) => k + 1); // refresh history after a commit attempt
      setScreen(SCREEN.FINISHED);
    } catch (err) {
      setError(err?.response?.data?.error || err.message || "Save failed.");
      setScreen(SCREEN.REVIEW);
    }
  };

  const handleTryAgain = () => {
    setCommitResult(null);
    setScreen(SCREEN.REVIEW);
    // file + perSheetActions + saveMode intentionally preserved
  };

  const handleUploadAnother = () => {
    setFile(null);
    setInspectResult(null);
    setPerSheetActions({});
    setSaveMode("commit");
    setApproverId("");
    setAttachment(null);
    setCommitResult(null);
    setSourceWasXlsx(false);
    setError(null);
    setScreen(SCREEN.REVIEW);
    // marketCode intentionally preserved — "upload another" to the same market
  };

  const handleViewHistory = () => {
    historyRef.current?.scrollIntoView({ behavior: "smooth" });
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
            Drop a workbook to review each sheet, choose an action per sheet, then save.
          </MDTypography>
        </MDBox>

        <Card sx={{ mb: 3 }}>
          <CardContent>
            {screen !== SCREEN.FINISHED && (
              <>
                <MDBox mb={2}>
                  <TemplatesDropdown marketCode={effectiveMarket?.code} />
                </MDBox>

                <MarketStep
                  loading={marketsLoading}
                  mode={marketsInfo?.mode}
                  fixedMarket={marketsInfo?.mode === "fixed" ? marketsInfo.market : null}
                  markets={marketsInfo?.markets || []}
                  marketCode={marketCode}
                  onMarketCodeChange={setMarketCode}
                  locked={Boolean(inspectResult)}
                  blockedMessage={marketsInfo?.mode === "blocked" ? marketsInfo.message : ""}
                />

                <MDTypography variant="h6" mb={1}>
                  2. Upload file
                </MDTypography>
                <FileDropzone file={file} onChange={handleFileAccepted} />

                {inspecting && (
                  <MDTypography variant="caption" color="text" display="block" mt={1}>
                    Reading workbook…
                  </MDTypography>
                )}

                {error && (
                  <Alert severity="error" sx={{ mt: 2 }}>
                    {String(error)}
                  </Alert>
                )}

                {inspectResult && (
                  <>
                    <ReviewScreen
                      inspectResult={inspectResult}
                      perSheetActions={perSheetActions}
                      onActionChange={handleActionChange}
                      attachment={attachment}
                      onAttachmentChange={setAttachment}
                      market={effectiveMarket}
                    />
                    <SavePanel
                      saveMode={saveMode}
                      onSaveModeChange={setSaveMode}
                      approverId={approverId}
                      onApproverIdChange={setApproverId}
                      onSave={handleSave}
                      saving={screen === SCREEN.SAVING}
                      marketCode={effectiveMarket?.code}
                    />
                  </>
                )}
              </>
            )}

            {screen === SCREEN.FINISHED && (
              <ResultsScreen
                result={commitResult}
                sourceWasXlsx={sourceWasXlsx}
                onTryAgain={handleTryAgain}
                onUploadAnother={handleUploadAnother}
                onViewHistory={handleViewHistory}
              />
            )}
          </CardContent>
        </Card>

        <ProgressModal open={screen === SCREEN.SAVING} />

        <Divider sx={{ my: 2 }} />

        <MDBox ref={historyRef}>
          <ImportHistoryTable canSeeAll={seeAll} refreshKey={historyKey} />
        </MDBox>
      </MDBox>
    </DashboardLayout>
  );
}

export default SpreadsheetUpload;
