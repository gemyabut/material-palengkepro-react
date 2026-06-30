import { useRef, useState } from "react";
import PropTypes from "prop-types";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import "../spreadsheet-upload.css";

const MAX_BYTES = 25 * 1024 * 1024; // 25 MB per D2

function FileDropzone({ file, onChange }) {
  const inputRef = useRef(null);
  const [dragover, setDragover] = useState(false);

  const accept = (f) => {
    if (f.size > MAX_BYTES) {
      // eslint-disable-next-line no-alert
      window.alert(`File too large — max 25 MB. (${(f.size / 1024 / 1024).toFixed(1)} MB selected)`);
      return;
    }
    onChange(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragover(false);
    const f = e.dataTransfer.files?.[0];
    if (f) accept(f);
  };

  const handleInput = (e) => {
    const f = e.target.files?.[0];
    if (f) accept(f);
  };

  const cls = ["dropzone", dragover && "dragover", file && "has-file"].filter(Boolean).join(" ");

  return (
    <MDBox
      className={cls}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragover(true); }}
      onDragLeave={() => setDragover(false)}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        hidden
        type="file"
        accept=".csv,.xlsx,.xls"
        onChange={handleInput}
      />
      {file ? (
        <>
          <MDTypography variant="h6" color="success">
            {file.name}
          </MDTypography>
          <MDTypography variant="caption" color="text">
            {(file.size / 1024 / 1024).toFixed(2)} MB &mdash; click or drag to replace
          </MDTypography>
        </>
      ) : (
        <>
          <MDTypography variant="h6" color="secondary">
            Drag spreadsheet here, or click to browse
          </MDTypography>
          <MDTypography variant="caption" color="text">
            Supported: .csv, .xlsx, .xls &middot; max 25 MB
          </MDTypography>
        </>
      )}
    </MDBox>
  );
}

FileDropzone.propTypes = {
  file: PropTypes.object,
  onChange: PropTypes.func.isRequired,
};
FileDropzone.defaultProps = { file: null };

export default FileDropzone;
