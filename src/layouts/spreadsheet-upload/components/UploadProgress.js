import PropTypes from "prop-types";
import { LinearProgress } from "@mui/material";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";

function UploadProgress({ message }) {
  return (
    <MDBox mt={2}>
      <MDTypography variant="caption" color="text" display="block" mb={0.5}>
        {message}
      </MDTypography>
      <LinearProgress color="info" />
    </MDBox>
  );
}

UploadProgress.propTypes = {
  message: PropTypes.string.isRequired,
};

export default UploadProgress;
