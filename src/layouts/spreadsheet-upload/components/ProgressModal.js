import PropTypes from "prop-types";
import { Dialog, DialogContent, LinearProgress } from "@mui/material";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";

// Unit 51 Stage F — commit is a single POST -> single response (no server-side
// progress streaming exists), so this is deliberately an indeterminate spinner,
// not a real progress bar. disableEscapeKeyDown + a no-op onClose keep it from
// being dismissed while a save is in flight.
function ProgressModal({ open }) {
  return (
    <Dialog open={open} disableEscapeKeyDown onClose={() => {}}>
      <DialogContent sx={{ minWidth: 320, textAlign: "center", py: 4 }}>
        <MDTypography variant="h6" mb={2}>
          Saving your workbook…
        </MDTypography>
        <LinearProgress color="info" />
        <MDBox mt={2}>
          <MDTypography variant="caption" color="text">
            This may take a moment for large workbooks.
          </MDTypography>
        </MDBox>
      </DialogContent>
    </Dialog>
  );
}

ProgressModal.propTypes = {
  open: PropTypes.bool.isRequired,
};

export default ProgressModal;
