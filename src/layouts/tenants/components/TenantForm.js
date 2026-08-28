// src/layouts/tenants/components/TenantForm.js

import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Autocomplete,
  Button,
  Typography,
  Grid,
  Divider,
} from "@mui/material";
import PropTypes from "prop-types";

import { debugLog } from "../../stalls/utils/debug";
import { canEdit } from "../../leases/utils/roleUtils";
import { searchMarkets, getMarket } from "../../../api/markets";

const VERIFICATION_STATUS_CHOICES = ["UNVERIFIED", "PENDING", "VERIFIED", "REJECTED"];
const TENANT_STATUS_CHOICES = ["ACTIVE", "INACTIVE", "DELINQUENT", "BLACKLISTED"];

// Explicit defaults for every field this form manages -- updateTenant() PUTs
// the whole object, so a field silently missing from state would blank out
// existing tenant data on save, not just leave it untouched (same class of
// silent-data-loss risk as PR #99's mobile/empire-pattern natural-key merge).
const DEFAULT_FORM = {
  full_name: "",
  business_name: "",
  mobile_phone: "",
  email_address: "",
  address: "",
  barangay: "",
  contact_person: "",
  contact_phone_number: "",
  preferred_market: null,
  verification_status: "UNVERIFIED",
  status: "ACTIVE",
  government_id: "",
  barangay_permit_number: "",
};

export default function TenantForm({
  open,
  initialValues = {},
  onSubmit,
  onClose,
  user,
  loading = false,
}) {
  const [form, setForm] = useState({ ...DEFAULT_FORM, ...initialValues });
  const [marketOptions, setMarketOptions] = useState([]);
  const [marketInput, setMarketInput] = useState("");

  useEffect(() => {
    if (open) {
      // Explicitly merge over DEFAULT_FORM (not just initialValues alone) so
      // every one of the 12 fields always has a defined value -- see
      // DEFAULT_FORM's comment on why this matters for the PUT payload.
      setForm({ ...DEFAULT_FORM, ...initialValues });
    }
  }, [initialValues, open]);

  // preferred_market is stored as a plain market id (matches what the API
  // reads/writes); resolve it to a {id, code, name} option for the
  // Autocomplete's display once the current tenant's market is known.
  useEffect(() => {
    if (!open) return;
    const marketId = initialValues?.preferred_market;
    if (!marketId) return;
    getMarket(marketId)
      .then((market) => {
        setMarketOptions((prev) =>
          prev.some((m) => m.id === market.id) ? prev : [...prev, market],
        );
      })
      .catch(() => {}); // best-effort preload -- typing in the field re-fetches anyway
  }, [open, initialValues?.preferred_market]);

  useEffect(() => {
    if (!open) return undefined;
    const handle = setTimeout(() => {
      searchMarkets(marketInput)
        .then((results) => setMarketOptions(results))
        .catch(() => {});
    }, 250);
    return () => clearTimeout(handle);
  }, [marketInput, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      preferred_market: form.preferred_market?.id ?? form.preferred_market ?? null,
    };
    debugLog("[TenantForm] Submit:", payload);
    onSubmit(payload);
  };

  const editable = canEdit(user);
  const selectedMarket =
    typeof form.preferred_market === "object"
      ? form.preferred_market
      : marketOptions.find((m) => m.id === form.preferred_market) || null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{form?.id ? "Edit Tenant" : "Add Tenant"}</DialogTitle>
      <DialogContent>
        <form id="tenant-form" onSubmit={handleSubmit}>
          <Typography variant="overline" color="text.secondary">
            Basic Info
          </Typography>
          <Grid container spacing={2} sx={{ mb: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Full Name"
                name="full_name"
                value={form.full_name || ""}
                onChange={handleChange}
                margin="dense"
                fullWidth
                required
                disabled={!editable || loading}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Business Name"
                name="business_name"
                value={form.business_name || ""}
                onChange={handleChange}
                margin="dense"
                fullWidth
                disabled={!editable || loading}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Mobile Phone"
                name="mobile_phone"
                value={form.mobile_phone || ""}
                onChange={handleChange}
                margin="dense"
                fullWidth
                required
                disabled={!editable || loading}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Email Address"
                name="email_address"
                type="email"
                value={form.email_address || ""}
                onChange={handleChange}
                margin="dense"
                fullWidth
                disabled={!editable || loading}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 1.5 }} />
          <Typography variant="overline" color="text.secondary">
            Address
          </Typography>
          <Grid container spacing={2} sx={{ mb: 1 }}>
            <Grid item xs={12} sm={8}>
              <TextField
                label="Address"
                name="address"
                value={form.address || ""}
                onChange={handleChange}
                margin="dense"
                fullWidth
                multiline
                minRows={2}
                disabled={!editable || loading}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Barangay"
                name="barangay"
                value={form.barangay || ""}
                onChange={handleChange}
                margin="dense"
                fullWidth
                disabled={!editable || loading}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 1.5 }} />
          <Typography variant="overline" color="text.secondary">
            Delegate
          </Typography>
          <Grid container spacing={2} sx={{ mb: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Contact Person"
                name="contact_person"
                value={form.contact_person || ""}
                onChange={handleChange}
                margin="dense"
                fullWidth
                helperText="Delegate: spouse, family, or trusted neighbor"
                disabled={!editable || loading}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Contact Phone Number"
                name="contact_phone_number"
                value={form.contact_phone_number || ""}
                onChange={handleChange}
                margin="dense"
                fullWidth
                disabled={!editable || loading}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 1.5 }} />
          <Typography variant="overline" color="text.secondary">
            Admin
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Autocomplete
                options={marketOptions}
                value={selectedMarket}
                onChange={(e, newValue) =>
                  setForm((prev) => ({ ...prev, preferred_market: newValue }))
                }
                onInputChange={(e, newInput) => setMarketInput(newInput)}
                getOptionLabel={(m) => (m ? `${m.code} — ${m.name}` : "")}
                isOptionEqualToValue={(a, b) => a?.id === b?.id}
                disabled={!editable || loading}
                renderInput={(params) => (
                  <TextField {...params} label="Preferred Market" margin="dense" fullWidth />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                label="Verification Status"
                name="verification_status"
                value={form.verification_status || "UNVERIFIED"}
                onChange={handleChange}
                margin="dense"
                fullWidth
                disabled={!editable || loading}
              >
                {VERIFICATION_STATUS_CHOICES.map((v) => (
                  <MenuItem key={v} value={v}>
                    {v}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                label="Status"
                name="status"
                value={form.status || "ACTIVE"}
                onChange={handleChange}
                margin="dense"
                fullWidth
                disabled={!editable || loading}
              >
                {TENANT_STATUS_CHOICES.map((s) => (
                  <MenuItem key={s} value={s}>
                    {s}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Government ID"
                name="government_id"
                value={form.government_id || ""}
                onChange={handleChange}
                margin="dense"
                fullWidth
                disabled={!editable || loading}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Barangay Permit Number"
                name="barangay_permit_number"
                value={form.barangay_permit_number || ""}
                onChange={handleChange}
                margin="dense"
                fullWidth
                disabled={!editable || loading}
              />
            </Grid>
          </Grid>
        </form>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        {editable && (
          <Button type="submit" form="tenant-form" variant="contained" disabled={loading}>
            Save
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

TenantForm.propTypes = {
  open: PropTypes.bool,
  initialValues: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  onClose: PropTypes.func,
  user: PropTypes.object,
  loading: PropTypes.bool,
};

TenantForm.defaultProps = {
  open: false,
  initialValues: {},
  loading: false,
};
