// src/layouts/tenants/components/TenantDetail.js

import React from "react";
import { Card, CardContent, Typography, Button, Grid, Divider } from "@mui/material";
import PropTypes from "prop-types";
import { debugLog } from "../../stalls/utils/debug";
import { canEdit } from "../../leases/utils/roleUtils";

export default function TenantDetail({ tenant, user, onEdit, onRequestUpdate, showEdit = true }) {
  debugLog("TenantDetail render", tenant);
  if (!tenant) {
    return (
      <Card>
        <CardContent>
          <Typography color="error">Tenant not found.</Typography>
        </CardContent>
      </Card>
    );
  }

  const editable = canEdit(user);

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Grid container spacing={2}>
          <Grid item xs={12} md={8}>
            <Typography variant="h5" gutterBottom>
              {tenant.full_name}
            </Typography>
            <Typography variant="subtitle1">{tenant.business_name}</Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              <b>Mobile:</b> {tenant.mobile_phone}
            </Typography>
            <Typography variant="body2">
              <b>Email:</b> {tenant.email_address}
            </Typography>
            <Typography variant="body2">
              <b>Address:</b> {tenant.address}
            </Typography>
            <Typography variant="body2">
              <b>Status:</b> {tenant.status}
            </Typography>
          </Grid>
          <Grid item xs={12} md={4} align="right">
            {/* TODO: photo / document preview */}
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle2" gutterBottom>
          Analytics
        </Typography>
        <Typography variant="body2">
          <b>Lifetime Payment Total:</b> ₱{tenant.lifetime_payment_total ?? "0.00"}
        </Typography>
        <Typography variant="body2">
          <b>Late Payments:</b> {tenant.number_of_late_payments ?? 0}
        </Typography>
        <Typography variant="body2">
          <b>Lease Duration (avg):</b> {tenant.lease_duration_average ?? 0} months
        </Typography>

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle2" gutterBottom>
          Quick Contact
        </Typography>
        <Grid container spacing={1} sx={{ mb: 2 }}>
          <Grid item>
            <Button
              size="small"
              href={tenant.mobile_phone ? `tel:${tenant.mobile_phone}` : undefined}
              disabled={!tenant.mobile_phone}
              variant="outlined"
            >
              Call
            </Button>
          </Grid>
          <Grid item>
            <Button
              size="small"
              href={tenant.email_address ? `mailto:${tenant.email_address}` : undefined}
              disabled={!tenant.email_address}
              variant="outlined"
            >
              Email
            </Button>
          </Grid>
        </Grid>

        <Grid container spacing={1}>
          {editable && showEdit && (
            <Grid item>
              <Button variant="outlined" onClick={() => onEdit?.(tenant.id)}>
                Edit
              </Button>
            </Grid>
          )}
          {user?.role === "tenant" && (
            <Grid item>
              <Button variant="contained" onClick={() => onRequestUpdate?.(tenant.id)}>
                Request Update
              </Button>
            </Grid>
          )}
        </Grid>
      </CardContent>
    </Card>
  );
}

TenantDetail.propTypes = {
  tenant: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    full_name: PropTypes.string,
    business_name: PropTypes.string,
    address: PropTypes.string,
    mobile_phone: PropTypes.string,
    email_address: PropTypes.string,
    barangay: PropTypes.string,
    status: PropTypes.string,
    photograph: PropTypes.string,
    uploaded_documents: PropTypes.string,
    lifetime_payment_total: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    number_of_late_payments: PropTypes.number,
    lease_duration_average: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    leases: PropTypes.array,
    stalls: PropTypes.array,
    payments: PropTypes.array,
  }),
  user: PropTypes.object,
  showEdit: PropTypes.bool,
  onEdit: PropTypes.func,
  onRequestUpdate: PropTypes.func,
};
