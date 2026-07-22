import { useEffect, useState } from "react";
import { Button, Menu, MenuItem, Divider } from "@mui/material";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import { listTemplates, downloadDomainTemplate, downloadMasterTemplate } from "api/csvImport";

// Unit 51 Stage F — "Need a template?" access point. Lives above FileDropzone
// (not inside ReviewScreen, which only renders after a file has already been
// inspected) — a blank template is most useful BEFORE the user has a file to
// drop, not after. Same Button+Menu interaction DomainPicker.js used for its
// now-deleted "Download template" button, so it's a familiar pattern.
function TemplatesDropdown() {
  const [templates, setTemplates] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);

  useEffect(() => {
    listTemplates()
      .then(setTemplates)
      .catch(() => setTemplates([])); // silently hide — this is a convenience, not critical path
  }, []);

  if (templates.length === 0) return null;

  const openMenu = (e) => setAnchorEl(e.currentTarget);
  const closeMenu = () => setAnchorEl(null);
  const handlePickDomain = (domain, filename) => {
    closeMenu();
    downloadDomainTemplate(domain, filename);
  };
  // "CRM Go-Live" scope explicitly, not downloadMasterTemplate's own "full"
  // default — this entry promises the Go-Live pack, not the full master set.
  const handlePickMaster = () => {
    closeMenu();
    downloadMasterTemplate("crm-golive");
  };

  return (
    <>
      <Button variant="outlined" color="info" size="small" endIcon={<ArrowDropDownIcon />} onClick={openMenu}>
        Need a template?
      </Button>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={closeMenu}>
        <MenuItem onClick={handlePickMaster}>Master template (CRM Go-Live)</MenuItem>
        <Divider />
        {templates.map(({ domain, filename, title }) => (
          <MenuItem key={domain} onClick={() => handlePickDomain(domain, filename)}>
            {title}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}

export default TemplatesDropdown;
