// /src/layouts/leases/components/admin/AdminLeaseDetail.js
import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Typography,
} from "@mui/material";
import {
  LEASE_TYPE_CHOICES,
  LEASE_STATUS_CHOICES,
  PAYMENT_SCHEDULE_CHOICES,
} from "../../data/choices";
import { debugLog } from "../../../stalls/utils/debug";
import PropTypes from "prop-types";

function getLabel(choices, value) {
  if (!value) return "";
  const found = choices.find(
    (opt) => String(opt.value).toLowerCase() === String(value).toLowerCase()
  );
  return found ? found.label : value;
}

function AdminLeaseDetail({ open, lease, onClose }) {
  if (!lease) return null;

  debugLog("[AdminLeaseDetail] Showing", lease);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Lease Details</DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={6}>
            <Typography variant="subtitle2">Lease ID</Typography>
            <Typography>{lease.id}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="subtitle2">Tenant</Typography>
            <Typography>{lease.tenant?.full_name || lease.tenant_id}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="subtitle2">Stall</Typography>
            <Typography>{lease.stall?.stall_number || lease.stall_id}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="subtitle2">Lease Type</Typography>
            <Typography>{getLabel(LEASE_TYPE_CHOICES, lease.lease_type)}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="subtitle2">Start Date</Typography>
            <Typography>{lease.start_date}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="subtitle2">End Date</Typography>
            <Typography>{lease.end_date}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="subtitle2">Payment Schedule</Typography>
            <Typography>{getLabel(PAYMENT_SCHEDULE_CHOICES, lease.payment_schedule)}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="subtitle2">Lease Amount</Typography>
            <Typography>{lease.lease_amount}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="subtitle2">Annual Rights Fee</Typography>
            <Typography>{lease.annual_rights_fee || "0.00"}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="subtitle2">Status</Typography>
            <Typography>{getLabel(LEASE_STATUS_CHOICES, lease.status)}</Typography>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

AdminLeaseDetail.propTypes = {
  open: PropTypes.bool.isRequired,
  lease: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    tenant: PropTypes.shape({
      full_name: PropTypes.string,
    }),
    tenant_id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    stall: PropTypes.shape({
      stall_number: PropTypes.string,
    }),
    stall_id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    lease_type: PropTypes.string,
    start_date: PropTypes.string,
    end_date: PropTypes.string,
    payment_schedule: PropTypes.string,
    lease_amount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    annual_rights_fee: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    status: PropTypes.string,
  }),
  onClose: PropTypes.func.isRequired,
};

export default AdminLeaseDetail;
