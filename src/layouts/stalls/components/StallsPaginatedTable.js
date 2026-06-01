// src/layouts/stalls/components/StallsPaginatedTable.js

import React from "react";
import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableSortLabel,
  TableContainer,
  Paper,
  Chip,
  TextField,
  MenuItem,
  Stack,
  Pagination,
} from "@mui/material";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";

// ...statusColor, typeOptions, statusOptions as before...

export default function StallsPaginatedTable({
  stalls = [],
  loading,
  orderBy,
  order,
  onSort,
  search,
  onSearch,
  filterStatus,
  onFilterStatus,
  filterType,
  onFilterType,
  filterSection,
  onFilterSection,
  sectionOptions,
  page,
  pageSize,
  total,
  onPageChange,
  canEdit,
  onEdit,
  onDeactivate,
}) {
  const totalPages = Math.ceil(total / pageSize);

  return (
    <MDBox>
      {/* Filters/Search */}
      <Stack direction={{ xs: "column", md: "row" }} spacing={2} mb={2} alignItems="center">
        <TextField
          label="Search"
          placeholder="Stall # or Location"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          size="small"
        />
        <TextField
          label="Status"
          select
          value={filterStatus}
          onChange={(e) => onFilterStatus(e.target.value)}
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
          onChange={(e) => onFilterType(e.target.value)}
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
          onChange={(e) => onFilterSection(e.target.value)}
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

      {/* Table */}
      <TableContainer component={Paper} sx={{ maxHeight: 540 }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              {[
                { id: "stall_number", label: "Stall #" },
                { id: "zone", label: "Zone" },
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
                      onClick={() => onSort(col.id)}
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
            ) : stalls.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} align="center">
                  <MDTypography variant="button">No stalls found.</MDTypography>
                </TableCell>
              </TableRow>
            ) : (
              stalls.map((stall) => (
                <TableRow key={stall.id}>
                  <TableCell>
                    <MDTypography variant="body2">{stall.stall_number}</MDTypography>
                  </TableCell>
                  <TableCell>
                    <MDTypography variant="body2">{stall.zone}</MDTypography>
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
                          sx={{ mr: 1, minWidth: 80 }}
                          onClick={() => onEdit(stall)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outlined"
                          size="small"
                          color="error"
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

      {/* Pagination */}
      <MDBox display="flex" justifyContent="flex-end" mt={2}>
        <Pagination
          count={totalPages}
          page={page}
          onChange={(e, value) => onPageChange(value)}
          color="primary"
          shape="rounded"
          siblingCount={1}
          boundaryCount={1}
        />
      </MDBox>
    </MDBox>
  );
}
