/**
 * Tenant Portal — Upload Document page (Task #115 item 5 + extension).
 *
 * Kiosk camera capture: two independent sections —
 *   1. "Your Photo" (Tenant.photograph)
 *   2. "Documents (Permits, IDs, etc.)" (Tenant.uploaded_documents)
 * Both single-file fields — multi-doc deferred to Tier 1.x per Task #126.
 *
 * Flow per section: current status -> Take Photo/Replace -> preview ->
 * Retake/Submit -> success (auto-return to dashboard after a few seconds).
 */
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Card, CardContent, Typography, Alert, CircularProgress,
  Button, Stack, Grid,
} from "@mui/material";
import PortraitIcon from "@mui/icons-material/Portrait";
import DescriptionIcon from "@mui/icons-material/Description";
import ReplayIcon from "@mui/icons-material/Replay";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

import PortalLayout from "./PortalLayout";
import { tenantPortalApi } from "api/tenantPortal";
import { getTenantToken, clearTenantSession } from "utils/tenantPortalAuth";

const AUTO_RETURN_MS = 4000;

/**
 * One independent upload section: status -> capture -> preview -> submit.
 * All state here is local to this instance, so "Your Photo" and
 * "Documents" operate fully independently of each other.
 */
function UploadSection({
  icon, title, currentUrl, statusLoading, onCaptured, previewUrl, submitting,
  onRetake, onSubmit, captureLabel, replaceLabel, showThumbnail,
}) {
  return (
    <Card sx={{ height: "100%" }}>
      <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
        <Stack direction="row" alignItems="center" spacing={1} mb={2}>
          {icon}
          <Typography variant="h6" fontWeight={700}>{title}</Typography>
        </Stack>

        {statusLoading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : previewUrl ? (
          <Stack spacing={3} alignItems="center">
            <Typography variant="subtitle2" fontWeight={600}>Review your photo</Typography>
            <Box
              component="img"
              src={previewUrl}
              alt={`${title} preview`}
              sx={{ maxWidth: "100%", maxHeight: 320, borderRadius: 2, boxShadow: 3 }}
            />
            <Stack direction="row" spacing={2} width="100%">
              <Button
                fullWidth
                variant="outlined"
                size="large"
                startIcon={<ReplayIcon />}
                onClick={onRetake}
                disabled={submitting}
                sx={{ minHeight: 60, fontSize: "1.05rem", borderColor: "#1a237e", color: "#1a237e" }}
              >
                Retake
              </Button>
              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={onSubmit}
                disabled={submitting}
                sx={{
                  minHeight: 60, fontSize: "1.05rem", fontWeight: 700,
                  bgcolor: "#1a237e", "&:hover": { bgcolor: "#283593" },
                }}
              >
                {submitting ? <CircularProgress size={24} sx={{ color: "white" }} /> : "Submit"}
              </Button>
            </Stack>
          </Stack>
        ) : (
          <Stack spacing={3} alignItems="center">
            <Box textAlign="center">
              {currentUrl ? (
                <>
                  <Typography variant="body2" fontWeight={600} gutterBottom>On file</Typography>
                  {showThumbnail ? (
                    <Stack direction="row" alignItems="center" justifyContent="center" spacing={1.5}>
                      <Box
                        component="img"
                        src={currentUrl}
                        alt="Current tenant photograph"
                        sx={{ maxWidth: 120, maxHeight: 120, borderRadius: 2, objectFit: "cover" }}
                      />
                      <Box
                        component="a"
                        href={currentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{ color: "#1a237e", fontSize: "0.9rem" }}
                      >
                        View full-size
                      </Box>
                    </Stack>
                  ) : (
                    <Box
                      component="a"
                      href={currentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ color: "#1a237e", fontSize: "0.9rem" }}
                    >
                      View current
                    </Box>
                  )}
                </>
              ) : (
                <Typography variant="body2" color="text.secondary">Nothing uploaded yet.</Typography>
              )}
            </Box>

            <Button
              component="label"
              variant="contained"
              size="large"
              fullWidth
              sx={{
                minHeight: 60, fontSize: "1rem", fontWeight: 700,
                bgcolor: "#1a237e", "&:hover": { bgcolor: "#283593" },
              }}
            >
              {currentUrl ? replaceLabel : captureLabel}
              <input hidden type="file" accept="image/*" capture="environment" onChange={onCaptured} />
            </Button>
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}

// urlKey is a plain string (e.g. "photograph_url"), not a closure — string
// primitives compare equal by value in a dependency array, so loadStatus's
// identity stays stable across renders. (An earlier version took extractor
// *functions* here; those were recreated inline on every render, which
// made loadStatus's useCallback identity change every render too, which
// re-fired the effect below every render — an infinite GET loop.)
function useUploadSection({ statusFetcher, uploadFn, urlKey, onSuccess, onAuthError }) {
  const [currentUrl, setCurrentUrl]     = useState(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [capturedFile, setCapturedFile] = useState(null);
  const [previewUrl, setPreviewUrl]     = useState(null);
  const [submitting, setSubmitting]     = useState(false);

  const loadStatus = useCallback(async () => {
    setStatusLoading(true);
    try {
      const resp = await statusFetcher();
      setCurrentUrl(resp[urlKey]);
    } catch (err) {
      if (err.status === 401 || err.status === 403) onAuthError();
      // else: silent — status display is a convenience, not critical path
    } finally {
      setStatusLoading(false);
    }
  }, [statusFetcher, urlKey, onAuthError]);

  useEffect(() => { loadStatus(); }, [loadStatus]);

  const onCaptured = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setCapturedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const onRetake = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setCapturedFile(null);
    setPreviewUrl(null);
  };

  const onSubmit = async () => {
    if (!capturedFile) return;
    setSubmitting(true);
    try {
      const resp = await uploadFn(capturedFile);
      setCurrentUrl(resp[urlKey]);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setCapturedFile(null);
      setPreviewUrl(null);
      onSuccess();
    } catch (err) {
      if (err.status === 401 || err.status === 403) onAuthError();
      else onSuccess(err.message || "Upload failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return { currentUrl, statusLoading, previewUrl, submitting, onCaptured, onRetake, onSubmit };
}

export default function TenantDocumentUpload() {
  const navigate = useNavigate();
  const [success, setSuccess] = useState(false);
  const [error, setError]     = useState(null);

  useEffect(() => {
    if (!getTenantToken()) navigate("/tenant/login", { replace: true });
  }, [navigate]);

  const handleAuthError = useCallback(() => {
    clearTenantSession();
    navigate("/tenant/login", { replace: true });
  }, [navigate]);

  const handleUploadResult = (errMessage) => {
    if (errMessage) setError(errMessage);
    else { setError(null); setSuccess(true); }
  };

  const photo = useUploadSection({
    statusFetcher: tenantPortalApi.photographStatus,
    uploadFn: tenantPortalApi.uploadPhotograph,
    urlKey: "photograph_url",
    onSuccess: handleUploadResult,
    onAuthError: handleAuthError,
  });

  const doc = useUploadSection({
    statusFetcher: tenantPortalApi.documentStatus,
    uploadFn: tenantPortalApi.uploadDocument,
    urlKey: "uploaded_documents",
    onSuccess: handleUploadResult,
    onAuthError: handleAuthError,
  });

  // Auto-return to dashboard after a successful upload
  useEffect(() => {
    if (!success) return undefined;
    const t = setTimeout(() => navigate("/tenant/dashboard", { replace: true }), AUTO_RETURN_MS);
    return () => clearTimeout(t);
  }, [success, navigate]);

  return (
    <PortalLayout>
      <Stack spacing={3}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate("/tenant/dashboard")} sx={{ color: "#1a237e" }}>
            Dashboard
          </Button>
          <Typography variant="h5" fontWeight={700} flex={1}>
            Upload Document
          </Typography>
        </Stack>

        {success && (
          <Alert severity="success" icon={<CheckCircleIcon fontSize="inherit" />}>
            Uploaded successfully. Returning to dashboard…
          </Alert>
        )}

        {error && <Alert severity="error">{error}</Alert>}

        {!success && (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <UploadSection
                icon={<PortraitIcon sx={{ color: "#1a237e" }} />}
                title="Your Photo"
                captureLabel="Take My Photo"
                replaceLabel="Retake My Photo"
                showThumbnail
                {...photo}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <UploadSection
                icon={<DescriptionIcon sx={{ color: "#1a237e" }} />}
                title="Documents (Permits, IDs, etc.)"
                captureLabel="Take Photo of Document"
                replaceLabel="Replace Document Photo"
                {...doc}
              />
            </Grid>
          </Grid>
        )}
      </Stack>
    </PortalLayout>
  );
}
