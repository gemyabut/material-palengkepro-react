import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Button, Menu, MenuItem, Divider } from "@mui/material";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import DownloadIcon from "@mui/icons-material/Download";
import { listTemplates, downloadDomainTemplate, downloadMasterTemplate } from "api/csvImport";

// Unit 51 Stage F — "Need a template?" access point. Lives above FileDropzone
// (not inside ReviewScreen, which only renders after a file has already been
// inspected) — a blank template is most useful BEFORE the user has a file to
// drop, not after. Same Button+Menu interaction DomainPicker.js used for its
// now-deleted "Download template" button, so it's a familiar pattern.
//
// marketCode (MDU-014, Lead decision 2026-09-26; MDU-016 follow-up for the
// master workbook): when known (this user's fixed market, or whatever
// they've picked in Step 1), the server names the download
// "{MARKET}_{Template}.xlsx" instead of the old numbered catalog filename —
// passed straight through to downloadDomainTemplate and downloadMasterTemplate.
function TemplatesDropdown({ marketCode }) {
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
    downloadDomainTemplate(domain, filename, marketCode);
  };
  // "CRM Go-Live" scope explicitly, not downloadMasterTemplate's own "full"
  // default — this entry promises the Go-Live pack, not the full master set.
  // MDU-016 follow-up (Lead decision 2026-09-26): marketCode passed through
  // same as handlePickDomain, so this download is market-aware too.
  const handlePickMaster = () => {
    closeMenu();
    downloadMasterTemplate("crm-golive", marketCode);
  };

  return (
    <>
      <Button
        variant="contained"
        color="info"
        size="small"
        startIcon={<DownloadIcon />}
        endIcon={<ArrowDropDownIcon />}
        onClick={openMenu}
      >
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

TemplatesDropdown.propTypes = {
  marketCode: PropTypes.string,
};
TemplatesDropdown.defaultProps = { marketCode: null };

export default TemplatesDropdown;
