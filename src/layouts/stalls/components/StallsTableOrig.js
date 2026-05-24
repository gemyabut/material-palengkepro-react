// src/layouts/stalls/components/StallsTable.js

import React, { useState, useMemo } from "react";
import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableSortLabel,
  TableContainer,
  Paper,
  Button,
  Chip,
  TextField,
  MenuItem,
  Stack,
  useMediaQuery,
} from "@mui/material";
import { Edit, Delete } from "@mui/icons-material";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";

import PropTypes from "prop-types";
StallsTable.propTypes = {
  stalls: PropTypes.array.isRequired,
  loading: PropTypes.bool,
  onEdit: PropTypes.func,
  onDeactivate: PropTypes.func,
  userRole: PropTypes.string,
};

// Helper to map status to color
const statusColor = (status) => {
  switch (status) {
    case "AVAILABLE":
      return "success";
    case "OCCUPIED":
      return "error";
    case "RESERVED":
      return "warning";
    case "UNDER_MAINTENANCE":
      return "info";
    case "INACTIVE":
      return "default";
    default:
      return "default";
  }
};

const typeOptions = [
  "WET",
  "DRY",
  "FOOD",
  "TIANGGE",
  "AMBULANT",
  "SUNDAY",
  "NIGHT",
  "RESTROOM",
  "PARKING",
  "TERMINAL",
  "OTHERS",
];
const statusOptions = ["AVAILABLE", "OCCUPIED", "RESERVED", "UNDER_MAINTENANCE", "INACTIVE"];

export default function StallsTable({
  stalls = [],
  loading,
  onEdit,
  onDeactivate,
  userRole, // string, e.g. "admin", "leasing_officer", etc.
}) {
  // Sorting state
  const [orderBy, setOrderBy] = useState("location");
  const [order, setOrder] = useState("asc");
  // Filter/Search state
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterSection, setFilterSection] = useState("");
  // Responsive logic
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down("sm"));

  // Role-based UI: show actions for admin & leasing officer
  const canEdit = ["admin", "leasing_officer"].includes(userRole);

  // Filtering, searching, and sorting
  const filteredStalls = useMemo(() => {
    let data = stalls;
    if (search)
      data = data.filter(
        (s) =>
          s.stall_number?.toLowerCase().includes(search.toLowerCase()) ||
          (s.location && s.location.toLowerCase().includes(search.toLowerCase()))
      );
    if (filterStatus) data = data.filter((s) => s.status === filterStatus);
    if (filterType) data = data.filter((s) => s.stall_type === filterType);
    if (filterSection) data = data.filter((s) => (s.section || "") === filterSection);

    // Sort
    return [...data].sort((a, b) => {
      const vA = (a[orderBy] || "").toString().toLowerCase();
      const vB = (b[orderBy] || "").toString().toLowerCase();
      if (vA < vB) return order === "asc" ? -1 : 1;
      if (vA > vB) return order === "asc" ? 1 : -1;
      return 0;
    });
  }, [stalls, search, filterStatus, filterType, filterSection, orderBy, order]);

  // Unique section options
  const sectionOptions = Array.from(new Set(stalls.map((s) => s.section).filter(Boolean)));

  return (
    <MDBox>
      {/* Search and Filter Bar */}
      <Stack direction={isMobile ? "column" : "row"} spacing={2} mb={2} alignItems="center">
        <TextField
          label="Search"
          placeholder="Stall # or Location"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
        />
        <TextField
          label="Status"
          select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          size="small"
          sx={{ minWidth: 120 }}
        >
          <MenuItem value="">All</MenuItem>
          {statusOptions.map((opt) => (
            <MenuItem value={opt} key={opt}>
              {opt.replace("_", " ")}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label="Type"
          select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          size="small"
          sx={{ minWidth: 120 }}
        >
          <MenuItem value="">All</MenuItem>
          {typeOptions.map((opt) => (
            <MenuItem value={opt} key={opt}>
              {opt}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label="Section"
          select
          value={filterSection}
          onChange={(e) => setFilterSection(e.target.value)}
          size="small"
          sx={{ minWidth: 120 }}
        >
          <MenuItem value="">All</MenuItem>
          {sectionOptions.map((opt) => (
            <MenuItem value={opt} key={opt}>
              {opt}
            </MenuItem>
          ))}
        </TextField>
      </Stack>

      <TableContainer component={Paper} sx={{ maxHeight: 540 }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              {[
                { id: "stall_number", label: "Stall #" },
                { id: "location", label: "Location" },
                { id: "size_sqm", label: "Size (sqm)" },
                { id: "current_rate", label: "Rate" },
                { id: "status", label: "Status" },
                { id: "stall_type", label: "Type" },
                { id: "section", label: "Section" },
                { id: "classification", label: "Classification" },
                { id: "remarks", label: "Remarks" },
                { id: "actions", label: "Actions", sortable: false },
              ].map((col) => (
                <TableCell key={col.id} align={col.id === "actions" ? "center" : "left"}>
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
                  <MDTypography variant="button">Loading...</MDTypography>
                </TableCell>
              </TableRow>
            ) : filteredStalls.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} align="center">
                  <MDTypography variant="button">No stalls found.</MDTypography>
                </TableCell>
              </TableRow>
            ) : (
              filteredStalls.map((stall) => (
                <TableRow key={stall.id}>
                  <TableCell>
                    <MDTypography variant="body2">{stall.stall_number}</MDTypography>
                  </TableCell>
                  <TableCell>
                    <MDTypography variant="body2">{stall.location}</MDTypography>
                  </TableCell>
                  <TableCell>
                    <MDTypography variant="body2">{stall.size_sqm}</MDTypography>
                  </TableCell>
                  <TableCell>
                    <MDTypography variant="body2">{stall.current_rate}</MDTypography>
                  </TableCell>
                  <TableCell>
                    <Chip label={stall.status} color={statusColor(stall.status)} size="small" />
                  </TableCell>
                  <TableCell>
                    <MDTypography variant="body2">{stall.stall_type}</MDTypography>
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
                      <>
                        <Button
                          variant="outlined"
                          size="small"
                          color="info"
                          startIcon={<Edit />}
                          sx={{ mr: 1, minWidth: 80 }}
                          onClick={() => {
                            debugLog("[DEBUG] Edit button clicked", stall);
                            onEdit(stall);
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outlined"
                          size="small"
                          color="error"
                          startIcon={<Delete />}
                          onClick={() => onDeactivate(stall)}
                          disabled={stall.status === "INACTIVE"}
                          sx={{ minWidth: 100 }}
                        >
                          Deactivate
                        </Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </MDBox>
  );
}
