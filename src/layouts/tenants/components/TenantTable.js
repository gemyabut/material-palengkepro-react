// src/layouts/tenants/components/TenantTable.js

import React from "react";
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Paper,
  Button,
} from "@mui/material";
import PropTypes from "prop-types";
import { canEdit, canBulk } from "../../leases/utils/roleUtils";
import { debugLog } from "../../stalls/utils/debug";

export default function TenantTable({
  tenants = [],
  user,
  onEdit,
  onDeactivate,
  onView,
  selectedIds = [],
  onSelect,
  onSelectAll,
  showCheckbox = false,
}) {
  debugLog("TenantTable render", { count: tenants.length });

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            {showCheckbox && (
              <TableCell padding="checkbox">
                <input
                  type="checkbox"
                  checked={tenants.length > 0 && selectedIds.length === tenants.length}
                  onChange={(e) => onSelectAll?.(e.target.checked)}
                />
              </TableCell>
            )}
            <TableCell>Name</TableCell>
            <TableCell>Contact</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {tenants.map((t) => (
            <TableRow key={t.id} hover>
              {showCheckbox && (
                <TableCell padding="checkbox">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(t.id)}
                    onChange={(e) =>
                      onSelect?.(
                        e.target.checked
                          ? [...selectedIds, t.id]
                          : selectedIds.filter((id) => id !== t.id)
                      )
                    }
                  />
                </TableCell>
              )}
              <TableCell>{t.full_name}</TableCell>
              <TableCell>{t.mobile_phone}</TableCell>
              <TableCell>
                <span
                  style={{ color: t.status === "active" ? "#388e3c" : "#888", fontWeight: 600 }}
                >
                  {t.status}
                </span>
              </TableCell>
              <TableCell>
                <Button size="small" onClick={() => onView?.(t.id)}>
                  View
                </Button>
                {canEdit(user) && (
                  <Button size="small" onClick={() => onEdit?.(t.id)}>
                    Edit
                  </Button>
                )}
                {canBulk(user) && (
                  <Button size="small" color="error" onClick={() => onDeactivate?.(t.id)}>
                    Deactivate
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}

          {tenants.length === 0 && (
            <TableRow>
              <TableCell colSpan={showCheckbox ? 5 : 4} align="center">
                No tenants found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

TenantTable.propTypes = {
  tenants: PropTypes.arrayOf(PropTypes.object).isRequired,
  user: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    role: PropTypes.string,
  }),
  showCheckbox: PropTypes.bool,
  selectedIds: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.number, PropTypes.string])),
  onSelect: PropTypes.func,
  onSelectAll: PropTypes.func,
  onEdit: PropTypes.func,
  onView: PropTypes.func,
  onDeactivate: PropTypes.func,
};

TenantTable.defaultProps = {
  tenants: [],
  showCheckbox: false,
  selectedIds: [],
};
