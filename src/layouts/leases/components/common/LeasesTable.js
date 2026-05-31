import React from "react";
import PropTypes from "prop-types";
import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Paper,
  IconButton,
  CircularProgress,
  Typography,
  Box,
  TableFooter,
  TablePagination,
} from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { LEASE_STATUS_CHOICES, LEASE_TYPE_CHOICES } from "../../data/choices";
import { debugLog } from "../../../stalls/utils/debug";

function getLabel(choices, value) {
  if (!value) return "";
  const found = choices.find(
    (opt) => String(opt.value).toLowerCase() === String(value).toLowerCase()
  );
  return found ? found.label : value;
}

const LeaseTable = ({
  leases = [],
  loading = false,
  error,
  onEdit,
  onView,
  onDeactivate,
  page = 1,
  limit = 10,
  total = 0,
  onPageChange,
  canEdit = false,
  canDeactivate = false,
  userRole,
  ...props
}) => {
  // Pagination handler
  const handleChangePage = (event, newPage) => {
    if (onPageChange) onPageChange(event, newPage + 1);
    debugLog("[LeaseTable] Page changed:", newPage + 1);
  };

  if (loading) {
    debugLog("[LeaseTable] Loading...");
    return (
      <Box display="flex" justifyContent="center" alignItems="center" py={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    debugLog("[LeaseTable] Error:", error);
    return (
      <Paper sx={{ p: 2, my: 2 }}>
        <Typography color="error">Error loading leases: {String(error)}</Typography>
      </Paper>
    );
  }

  if (!leases.length) {
    debugLog("[LeaseTable] No leases found");
    return (
      <Paper sx={{ p: 2, my: 2 }}>
        <Typography>No leases found.</Typography>
      </Paper>
    );
  }

  return (
    <TableContainer component={Paper} sx={{ minWidth: 900, my: 1 }}>
      <Table size="small">
        <TableHead sx={{ display: "table-header-group" }}>
          <TableRow>
            <TableCell>ID</TableCell>
            <TableCell>Tenant</TableCell>
            <TableCell>Stall</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Start</TableCell>
            <TableCell>End</TableCell>
            <TableCell>Status</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {leases.map((lease) => (
            <TableRow key={lease.id}>
              <TableCell>{lease.id}</TableCell>
              <TableCell>{lease.tenant?.full_name || ""}</TableCell>
              <TableCell>{lease.stall?.stall_number || ""}</TableCell>
              <TableCell>
                {lease.leaseTypeLabel || getLabel(LEASE_TYPE_CHOICES, lease.lease_type)}
              </TableCell>
              <TableCell>{lease.start_date}</TableCell>
              <TableCell>{lease.end_date}</TableCell>
              <TableCell>
                {lease.statusLabel || getLabel(LEASE_STATUS_CHOICES, lease.status)}
              </TableCell>
              <TableCell align="right">
                {onView && (
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={() => {
                      debugLog("[LeaseTable] View clicked", lease);
                      onView(lease);
                    }}
                    aria-label="View Lease"
                  >
                    <InfoIcon />
                  </IconButton>
                )}
                {canEdit && onEdit && (
                  <IconButton
                    size="small"
                    color="secondary"
                    onClick={() => {
                      debugLog("[LeaseTable] Edit clicked", lease);
                      onEdit(lease);
                    }}
                    aria-label="Edit Lease"
                  >
                    <EditIcon />
                  </IconButton>
                )}
                {canDeactivate && onDeactivate && (
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => {
                      debugLog("[LeaseTable] Deactivate clicked", lease);
                      onDeactivate(lease);
                    }}
                    aria-label="Deactivate Lease"
                  >
                    <DeleteIcon />
                  </IconButton>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          {onPageChange && (
            <TableRow>
              <TableCell colSpan={8}>
                <TablePagination
                  rowsPerPageOptions={[limit]}
                  count={total}
                  rowsPerPage={limit}
                  page={page - 1}
                  onPageChange={handleChangePage}
                  component="div"
                  labelRowsPerPage=""
                  showFirstButton
                  showLastButton
                />
              </TableCell>
            </TableRow>
          )}
        </TableFooter>
      </Table>
    </TableContainer>
  );
};

LeaseTable.propTypes = {
  leases: PropTypes.array.isRequired,
  loading: PropTypes.bool,
  error: PropTypes.any,
  onEdit: PropTypes.func,
  onView: PropTypes.func,
  onDeactivate: PropTypes.func,
  page: PropTypes.number,
  limit: PropTypes.number,
  total: PropTypes.number,
  onPageChange: PropTypes.func,
  canEdit: PropTypes.bool,
  canDeactivate: PropTypes.bool,
  userRole: PropTypes.string,
};

export default LeaseTable;
