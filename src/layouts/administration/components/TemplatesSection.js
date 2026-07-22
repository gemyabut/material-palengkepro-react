import { useEffect, useState } from "react";
import { Button, Card, CardContent, Table, TableBody, TableCell, TableHead, TableRow } from "@mui/material";
import MDTypography from "components/MDTypography";
import { listTemplates, downloadDomainTemplate } from "api/csvImport";

// Unit 51 Stage F — full-page browser for the per-domain upload templates
// (Unit 51 Track A backend). Gated on canUseSpreadsheetUpload in
// administration/index.js, not canOnboard/canManageStaff — those gate
// unrelated company-onboarding / staff-provisioning concerns, and the
// backend's own template endpoints are IsAuthenticated-only (blank
// templates carry no real data), so this section follows "who actually
// uploads workbooks", not "who administers the platform/market".
function TemplatesSection() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listTemplates()
      .then(setTemplates)
      .catch(() => setTemplates([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Card sx={{ height: "100%" }}>
      <CardContent>
        <MDTypography variant="h6" gutterBottom>
          Upload templates
        </MDTypography>
        <MDTypography variant="caption" color="text">
          Blank spreadsheets for each data type — column headers and dropdowns match what the
          importer expects.
        </MDTypography>
        {loading ? (
          <MDTypography variant="caption" color="text" display="block" mt={2}>
            Loading...
          </MDTypography>
        ) : templates.length === 0 ? (
          <MDTypography variant="caption" color="text" display="block" mt={2}>
            No templates available.
          </MDTypography>
        ) : (
          <Table size="small" sx={{ mt: 2 }}>
            <TableHead>
              <TableRow>
                <TableCell>Template</TableCell>
                <TableCell>Filename</TableCell>
                <TableCell align="right">Download</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {templates.map(({ domain, filename, title }) => (
                <TableRow key={domain}>
                  <TableCell>{title}</TableCell>
                  <TableCell>{filename}</TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      variant="outlined"
                      color="info"
                      onClick={() => downloadDomainTemplate(domain, filename)}
                    >
                      Download
                    </Button>
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

export default TemplatesSection;
