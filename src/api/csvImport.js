import apiClient from "api/axios";

export async function uploadWorkbook(
  file,
  { dryRun = false, domain, mode = "upsert", graceMode = false, attachment } = {}
) {
  // Unit 27 F4: optional attachment (deposit-slip scan) applies to every row in the upload.
  const form = new FormData();
  form.append("file", file);
  if (domain) form.append("domain", domain);
  if (mode) form.append("mode", mode);
  if (graceMode) form.append("grace_mode", "true");
  if (attachment) form.append("attachment", attachment);
  const url = `/imports/workbook/${dryRun ? "?dry_run=true" : ""}`;
  const { data } = await apiClient.post(url, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
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
  a.download = MASTER_SCOPES[scope] || MASTER_SCOPES.full;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}
