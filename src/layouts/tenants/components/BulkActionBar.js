// src/layouts/tenants/components/BulkActionBar.js

import React from "react";
import PropTypes from "prop-types";
import { Toolbar, Button } from "@mui/material";
import { canBulk } from "../../leases/utils/roleUtils";
import { debugLog } from "../../stalls/utils/debug";

export default function BulkActionBar({
  selectedIds = [],
  user,
  onBulkDeactivate,
  onBulkExport,
  onOpenComm,
  loading = false,
}) {
  const allowed = canBulk(user);
  debugLog("BulkActionBar render", { selectedCount: selectedIds.length, role: user?.role });

  if (!allowed || !selectedIds.length) return null;

  return (
    <Toolbar sx={{ gap: 1, pl: 0 }}>
      <Button color="error" onClick={onBulkDeactivate} disabled={loading}>
        Bulk Deactivate
      </Button>
      <Button onClick={onBulkExport} disabled={loading}>
        Export CSV
      </Button>
      <Button color="info" onClick={onOpenComm} disabled={loading}>
        Communicate (SMS/Email)
      </Button>
    </Toolbar>
  );
}

BulkActionBar.propTypes = {
  selectedIds: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.number, PropTypes.string]))
    .isRequired,
  user: PropTypes.object,
  onBulkDeactivate: PropTypes.func.isRequired,
  onBulkExport: PropTypes.func.isRequired,
  onOpenComm: PropTypes.func.isRequired,
  loading: PropTypes.bool,
};

BulkActionBar.defaultProps = { selectedIds: [], loading: false };
