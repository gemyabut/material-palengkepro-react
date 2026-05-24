// /src/layouts/leases/components/common/PaymentSummary.js
import React from 'react';
import PropTypes from 'prop-types';
import { Card, CardContent, Typography, Grid } from '@mui/material';
import { debugLog } from '../../../stalls/utils/debug';

function PaymentSummary({ payments = [] }) {
  // Sample calculation logic
  const total = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const paid = payments.filter(p => p.status === "paid").reduce((sum, p) => sum + (p.amount || 0), 0);
  const overdue = payments.filter(p => p.status === "overdue").reduce((sum, p) => sum + (p.amount || 0), 0);
  const unpaid = total - paid;

  debugLog('[PaymentSummary] Calculated:', { total, paid, overdue, unpaid });

  return (
    <Grid container spacing={2}>
      <Grid item xs={6} sm={3}>
        <Card><CardContent>
          <Typography variant="subtitle2">Total</Typography>
          <Typography variant="h6">{total.toLocaleString()}</Typography>
        </CardContent></Card>
      </Grid>
      <Grid item xs={6} sm={3}>
        <Card><CardContent>
          <Typography variant="subtitle2">Paid</Typography>
          <Typography color="success.main" variant="h6">{paid.toLocaleString()}</Typography>
        </CardContent></Card>
      </Grid>
      <Grid item xs={6} sm={3}>
        <Card><CardContent>
          <Typography variant="subtitle2">Overdue</Typography>
          <Typography color="error.main" variant="h6">{overdue.toLocaleString()}</Typography>
        </CardContent></Card>
      </Grid>
      <Grid item xs={6} sm={3}>
        <Card><CardContent>
          <Typography variant="subtitle2">Unpaid</Typography>
          <Typography color="warning.main" variant="h6">{unpaid.toLocaleString()}</Typography>
        </CardContent></Card>
      </Grid>
    </Grid>
  );
}

PaymentSummary.propTypes = {
  payments: PropTypes.array,
};

export default PaymentSummary;
