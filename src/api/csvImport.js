import apiClient from "api/axios";

// Unit 51 Stage F — the 3 download helpers below all previously ignored the
// server's actual Content-Disposition filename, synthesizing their own
// client-side name instead (e.g. downloadResultsWorkbook hardcoded
// `import_${jobId}_results.xlsx`, silently discarding the date-stamped name
// the backend generates). Now used everywhere a filename fallback is needed.
function extractFilenameFromResponse(response, fallback) {
  const disposition = response.headers?.["content-disposition"] || "";
  const match = disposition.match(/filename="([^"]+)"/);
  return match ? match[1] : fallback;
}

// MDU-014 (Lead decision 2026-09-26) — one market per upload. Tells the
// Upload screen's Step 1 whether to show a fixed label (mode: "fixed", one
// accessible market) or a required dropdown (mode: "choose").
export async function getMyUploadMarkets() {
  const { data } = await apiClient.get("/csv-import/my-markets/");
  return data;
}

// Unit 51 Stage F — read-only preview: validates every row, never commits,
// never creates an ImportJob (csv_import Stage C.2). marketCode (MDU-014) is
// only actually required server-side for a multi/no-market user — harmless
// to always send when known.
export async function inspectWorkbook(file, marketCode) {
  const form = new FormData();
  form.append("file", file);
  if (marketCode) form.append("market_code", marketCode);
  const { data } = await apiClient.post("/csv-import/inspect/", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

// Unit 51 Stage F — commits a workbook. perSheetActions is a plain object
// {domain: "upsert"|"create"|"skip-existing"|"skip"}, reshaped here into the
// backend's {domain: {action: ...}} contract (csv_import Stage D). marketCode
// (MDU-014) must be the SAME one sent to inspectWorkbook for this file.
export async function commitWorkbook(
  file,
  { perSheetActions, saveMode = "commit", approverId, attachment, marketCode } = {}
) {
  const form = new FormData();
  form.append("file", file);
  if (marketCode) form.append("market_code", marketCode);
  if (perSheetActions && Object.keys(perSheetActions).length) {
    const shaped = {};
    Object.entries(perSheetActions).forEach(([domain, action]) => {
      shaped[domain] = { action };
    });
    form.append("per_sheet_actions", JSON.stringify(shaped));
  }
  if (saveMode) form.append("save_mode", saveMode);
  if (approverId) form.append("approver_id", approverId);
  if (attachment) form.append("attachment", attachment);
  const { data } = await apiClient.post("/imports/workbook/", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

// Unit 51 Stage E — downloads the original workbook annotated with a
// "PalengkePro Results" sheet. Only available for .xlsx-sourced jobs.
export async function downloadResultsWorkbook(jobId) {
  const res = await apiClient.get(`/csv-import/jobs/${jobId}/results-workbook/`, {
    responseType: "blob",
  });
  const url = window.URL.createObjectURL(res.data);
  const a = document.createElement("a");
  a.href = url;
  a.download = extractFilenameFromResponse(res, `import_${jobId}_results.xlsx`);
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

// Unit 51 Track A — JSON inventory of per-domain upload templates.
export async function listTemplates() {
  const { data } = await apiClient.get("/csv-import/templates/");
  return data;
}

// Unit 51 Track A — downloads one domain's primary upload template. `filename`
// is only the CLIENT-SIDE fallback if the server's Content-Disposition is
// somehow missing; the server itself now names it "{MARKET}_{Template}.xlsx"
// (MDU-014, Lead decision 2026-09-26) when marketCode is known/resolvable.
export async function downloadDomainTemplate(domain, filename, marketCode) {
  const res = await apiClient.get(`/csv-import/templates/${domain}/`, {
    responseType: "blob",
    params: marketCode ? { market: marketCode } : undefined,
  });
  const url = window.URL.createObjectURL(res.data);
  const a = document.createElement("a");
  a.href = url;
  a.download = extractFilenameFromResponse(res, filename || `${domain}_template.xlsx`);
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

// Backend Phase 5 — staff roster export. marketCode is the Market.code (e.g.
// "ECM"), not a numeric id; the endpoint requires it as a query param.
export async function downloadStaffRosterExport(marketCode) {
  const res = await apiClient.get("/csv-import/staff/roster/export/", {
    params: { market: marketCode },
    responseType: "blob",
  });
  const url = window.URL.createObjectURL(res.data);
  const a = document.createElement("a");
  a.href = url;
  a.download = extractFilenameFromResponse(res, `${marketCode}_staff_roster.xlsx`);
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

export async function getImportJobs({ page = 1, page_size = 50 } = {}) {
  const { data } = await apiClient.get("/csv-import/jobs/", { params: { page, page_size } });
  return data;
}

// Unit 27: scope selects which pack of sheets/columns the master workbook contains.
//   "full"       — Tenants/Stalls/Leases/Collections (default; legacy behavior)
//   "crm-golive" — Stalls/Tenants/Leases, no action column (one-shot bulk load)
//   "crm-crud"   — Stalls/Tenants/Leases, action column kept (day-to-day changes)
const MASTER_SCOPES = {
  full:           "palengkepro_master_template.xlsx",
  "crm-golive":   "palengkepro_crm_golive_template.xlsx",
  "crm-crud":     "palengkepro_crm_crud_template.xlsx",
};

export async function downloadMasterTemplate(scope = "full") {
  const params = scope && scope !== "full" ? { scope } : {};
  const res = await apiClient.get("/templates/master/", { responseType: "blob", params });
  const url = window.URL.createObjectURL(res.data);
  const a = document.createElement("a");
  a.href = url;
  a.download = extractFilenameFromResponse(res, MASTER_SCOPES[scope] || MASTER_SCOPES.full);
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}
