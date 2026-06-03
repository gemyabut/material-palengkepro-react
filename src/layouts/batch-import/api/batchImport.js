import apiClient from "api/axios";

/**
 * Upload a master workbook (or single CSV) to the stateless import engine.
 * @param {File} file
 * @param {{dryRun?: boolean, domain?: string, attachment?: File}} opts
 *   dryRun=true -> validate only (persists nothing). domain -> hint for single CSV.
 *   attachment -> a single scan (deposit slips) attached to every row in the upload.
 * @returns {Promise<object>} per-sheet artifacts
 */
export async function uploadWorkbook(file, { dryRun = false, domain, attachment } = {}) {
  const form = new FormData();
  form.append("file", file);
  if (domain) form.append("domain", domain);
  if (attachment) form.append("attachment", attachment);
  const res = await apiClient.post(
    `/imports/workbook/${dryRun ? "?dry_run=true" : ""}`,
    form,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return res.data;
}

/** Download the master-workbook .xlsx template (README manifest + domain sheets). */
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

export default { uploadWorkbook, downloadMasterTemplate };
