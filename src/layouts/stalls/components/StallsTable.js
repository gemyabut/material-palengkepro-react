// src/layouts/stalls/components/StallsTable.js

import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
  Tooltip,
  TableSortLabel,
  Stack,
  CircularProgress,
} from "@mui/material";
import MDTypography from "components/MDTypography";
import { Edit, Delete } from "@mui/icons-material";
import statusColor from "../utils/StatusColor";
import { debugLog } from "layouts/stalls/utils/debug";
import MDBox from "components/MDBox"; // For layout box
import IconButton from "@mui/material/IconButton"; // For icon buttons
import VisibilityIcon from "@mui/icons-material/Visibility"; // For eye icon
import { STATUS_CHOICES, STALL_TYPE_CHOICES } from "layouts/stalls/data/choices";

import PropTypes from "prop-types";

StallsTable.propTypes = {
  stalls: PropTypes.array,
  loading: PropTypes.bool,
  canEdit: PropTypes.bool,
  canDelete: PropTypes.bool,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  onView: PropTypes.func,
  userRole: PropTypes.string,
  page: PropTypes.number,
  pageSize: PropTypes.number,
};

export default function StallsTable({
  stalls = [],
  loading,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
  onView,
  userRole,
  page,
  pageSize,
}) {
  debugLog("StallsTable received stalls:", stalls);

  const getLabel = (choices, value) => choices.find((opt) => opt.value === value)?.label || value;

  // Sorting (only for current page—backend should do real sorting)
  const [orderBy, setOrderBy] = React.useState("stall_number");
  const [order, setOrder] = React.useState("asc");
  const sortedStalls = React.useMemo(() => {
    if (!stalls) return [];
    return [...stalls].sort((a, b) => {
      const vA = (a[orderBy] || "").toString().toLowerCase();
      const vB = (b[orderBy] || "").toString().toLowerCase();
      if (vA < vB) return order === "asc" ? -1 : 1;
      if (vA > vB) return order === "asc" ? 1 : -1;
      return 0;
    });
  }, [stalls, orderBy, order]);

  return (
    <TableContainer component={Paper} sx={{ maxHeight: 540 }}>
      <Table stickyHeader size="small" sx={{ tableLayout: "fixed" }}>
        <TableHead>
          <TableRow>
            {[
              { id: "stall_number", label: "Stall #", width: 100 },
              { id: "location", label: "Location", width: 120 },
              { id: "size_sqm", label: "Size (sqm)" },
              { id: "current_rate", label: "Rate" },
              { id: "status", label: "Status" },
              { id: "stall_type", label: "Type" },
              { id: "section", label: "Section" },
              { id: "classification", label: "Classification" },
              { id: "remarks", label: "Remarks" },
              { id: "actions", label: "Actions", sortable: false },
            ].map((col) => (
              <TableCell
                key={col.id}
                align={col.id === "actions" ? "center" : "left"}
                sx={col.width ? { width: col.width, minWidth: col.width } : {}}
              >
                {col.sortable === false ? (
                  <MDTypography variant="button">{col.label}</MDTypography>
                ) : (
                  <TableSortLabel
                    active={orderBy === col.id}
                    direction={orderBy === col.id ? order : "asc"}
                    onClick={() =>
                      setOrderBy(col.id) ||
                      setOrder(orderBy === col.id && order === "asc" ? "desc" : "asc")
                    }
                  >
                    <MDTypography variant="button">{col.label}</MDTypography>
                  </TableSortLabel>
                )}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={10} align="center">
                <CircularProgress size={32} />
                <MDTypography variant="button" ml={2}>
                  Loading...
                </MDTypography>
              </TableCell>
            </TableRow>
          ) : !sortedStalls.length ? (
            <TableRow>
              <TableCell colSpan={10} align="center">
                <MDTypography variant="button">No stalls found.</MDTypography>
              </TableCell>
            </TableRow>
          ) : (
            sortedStalls.map((stall) => (
              <TableRow key={stall.id} hover>
                <TableCell sx={{ width: 100, minWidth: 100 }}>
                  <MDBox display="flex" alignItems="center">
                    <Tooltip title={stall.stall_number || ""} placement="top" arrow>
                      <MDTypography
                        variant="body2"
                        sx={{
                          overflow: "hidden",
                          whiteSpace: "nowrap",
                          textOverflow: "ellipsis",
                          display: "block",
                          width: 90,
                          minWidth: 90,
                        }}
                      >
                        {stall.stall_number && stall.stall_number.length > 8
                          ? stall.stall_number.slice(0, 8) + "…"
                          : stall.stall_number}
                      </MDTypography>
                    </Tooltip>
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => onView(stall)}
                      sx={{ ml: 0.5 }}
                      aria-label="View stall details"
                    >
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                  </MDBox>
                </TableCell>
                <TableCell sx={{ width: 120, minWidth: 120 }}>
                  <MDTypography
                    variant="body2"
                    sx={{
                      overflow: "hidden",
                      whiteSpace: "nowrap",
                      textOverflow: "ellipsis",
                      display: "block",
                    }}
                  >
                    {stall.location}
                  </MDTypography>
                </TableCell>
                <TableCell>
                  <MDTypography variant="body2">{stall.size_sqm}</MDTypography>
                </TableCell>
                <TableCell>
                  <MDTypography variant="body2">{stall.current_rate}</MDTypography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={getLabel(STATUS_CHOICES, stall.status)}
                    color={statusColor(stall.status)} // Your statusColor should map to a MUI color ("success", "warning", etc)
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <MDTypography variant="body2">
                    {getLabel(STALL_TYPE_CHOICES, stall.stall_type)}
                  </MDTypography>
                </TableCell>
                <TableCell>
                  <MDTypography variant="body2">{stall.section}</MDTypography>
                </TableCell>
                <TableCell>
                  <MDTypography variant="body2">{stall.classification}</MDTypography>
                </TableCell>
                <TableCell>
                  <MDTypography variant="body2">{stall.remarks}</MDTypography>
                </TableCell>
                <TableCell align="center">
                  {canEdit && (
                    <Stack direction="row" spacing={1} justifyContent="center">
                      <Button
                        variant="contained"
                        size="small"
                        color="info"
                        startIcon={<Edit />}
                        onClick={() => onEdit(stall)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="contained"
                        size="small"
                        color="error"
                        startIcon={<Delete />}
                        onClick={() => onDelete(stall)}
                        disabled={stall.status === "INACTIVE"}
                      >
                        Deactivate
                      </Button>
                    </Stack>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
