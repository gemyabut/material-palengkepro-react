import apiClient from "api/axios";

export async function uploadWorkbook(
  file,
  { dryRun = false, domain, mode = "upsert", graceMode = false } = {}
) {
  const form = new FormData();
  form.append("file", file);
  if (domain) form.append("domain", domain);
  if (mode) form.append("mode", mode);
  if (graceMode) form.append("grace_mode", "true");
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

export async function downloadMasterTemplate() {
  const res = await apiClient.get("/templates/master/", { responseType: "blob" });
  const url = window.URL.createObjectURL(res.data);
  const a = document.createElement("a");
  a.href = url;
  a.download = "palengkepro_master_template.xlsx";
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}
