// src/layouts/profile/components/EditableFields/index.js

// src/layouts/profile/components/EditableFields/index.js
import React, { useRef, useState } from "react";
import PropTypes from "prop-types";
import { TextField, Button, Box, Avatar, Grid, Card, CardContent } from "@mui/material";
import MDTypography from "components/MDTypography";
import * as validators from "../../utils/validators";
import { debugLog } from "../../../stalls/utils/debug";

function EditableFields({ profile, setProfile }) {
  const fileInputRef = useRef(null);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;

    let error = "";
    if (name === "email" && !validators.isValidEmail(value)) error = "Invalid email format.";
    if (name === "mobile_number" && !validators.isValidMobile(value))
      error = "Invalid mobile number.";
    if (name === "other_details" && !validators.isValidOtherDetails(value))
      error = "Max 500 characters.";
    if (name === "account_notes" && !validators.isValidNotes(value)) error = "Max 1000 characters.";

    setErrors((prev) => ({ ...prev, [name]: error }));
    setProfile((prev) => ({ ...prev, [name]: value }));

    debugLog("[EditableFields] handleChange:", name, value, "error:", error);
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const error = validators.validatePhoto(file);
      if (error) {
        setErrors((prev) => ({ ...prev, photo: error }));
        debugLog("[EditableFields] Photo validation failed:", error);
      } else {
        setErrors((prev) => ({ ...prev, photo: "" }));
        setProfile((prev) => ({
          ...prev,
          photo: file,
          photo_preview: URL.createObjectURL(file),
        }));
        debugLog("[EditableFields] Photo updated:", file.name);
      }
    }
  };

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
      debugLog("[EditableFields] Trigger file picker");
    }
  };

  return (
    <Card sx={{ mt: 3 }}>
      <CardContent>
        <MDTypography variant="h6" mb={2}>
          Contact Information
        </MDTypography>

        <Grid container spacing={2} alignItems="center">
          <Grid item>
            <Avatar
              src={profile.photo_preview || profile.photo || ""}
              sx={{ width: 64, height: 64 }}
              alt="Profile Photo"
            />
          </Grid>
          <Grid item>
            <Button onClick={handleUploadClick} variant="outlined">
              Upload Photo
            </Button>
            {errors.photo && (
              <MDTypography color="error" fontSize="small">
                {errors.photo}
              </MDTypography>
            )}
            <input
              type="file"
              hidden
              ref={fileInputRef}
              onChange={handlePhotoChange}
              accept="image/*"
              tabIndex={-1}
            />
          </Grid>
        </Grid>

        <TextField
          fullWidth
          label="Email"
          name="email"
          value={profile.email || ""}
          onChange={handleChange}
          margin="normal"
          error={!!errors.email}
          helperText={errors.email}
        />

        <TextField
          fullWidth
          label="Mobile Number"
          name="mobile_number"
          value={profile.mobile_number || ""}
          onChange={handleChange}
          margin="normal"
          error={!!errors.mobile_number}
          helperText={errors.mobile_number}
        />

        <TextField
          fullWidth
          label="Other Details"
          name="other_details"
          value={profile.other_details || ""}
          onChange={handleChange}
          margin="normal"
          multiline
          rows={2}
          error={!!errors.other_details}
          helperText={errors.other_details}
        />

        <TextField
          fullWidth
          label="Account Notes"
          name="account_notes"
          value={profile.account_notes || ""}
          onChange={handleChange}
          margin="normal"
          multiline
          rows={3}
          error={!!errors.account_notes}
          helperText={errors.account_notes}
        />
      </CardContent>
    </Card>
  );
}

EditableFields.propTypes = {
  profile: PropTypes.shape({
    email: PropTypes.string,
    mobile_number: PropTypes.string,
    other_details: PropTypes.string,
    account_notes: PropTypes.string,
    photo: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    photo_preview: PropTypes.string,
  }).isRequired,
  setProfile: PropTypes.func.isRequired,
};

export default EditableFields;
