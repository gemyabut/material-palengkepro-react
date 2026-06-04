// src/layouts/tenants/components/TenantSummaryBand.js
// Tenant Dashboard — Tier 1 roster KPI band (counts only; no ₱ — doc 21 §6).
// See docs/build/TENANT_DASHBOARD_PHASE1_ROSTER.md.
import { useEffect, useState } from "react";
import Grid from "@mui/material/Grid";
import Alert from "@mui/material/Alert";
import MDBox from "components/MDBox";
import ComplexStatisticsCard from "examples/Cards/StatisticsCards/ComplexStatisticsCard";
import { getTenantSummary } from "../api/tenantSummary";

const pick = (arr, key, val) => (arr || []).find((x) => x[key] === val)?.count ?? 0;

export default function TenantSummaryBand() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    getTenantSummary({ period: "mtd" })
      .then((d) => mounted && setData(d))
      .catch(
        (e) =>
          mounted &&
          setError(e?.response?.data?.detail || e?.message || "Failed to load tenant summary")
      );
    return () => {
      mounted = false;
    };
  }, []);

  if (error) {
    return (
      <MDBox mb={3}>
        <Alert severity="warning">Tenant summary unavailable: {String(error)}</Alert>
      </MDBox>
    );
  }

  const dash = "—";
  const cards = [
    { color: "dark", icon: "groups", title: "Total tenants", count: data?.total ?? dash },
    { color: "success", icon: "how_to_reg", title: "Active", count: data ? pick(data.by_status, "status", "ACTIVE") : dash },
    { color: "error", icon: "report_problem", title: "Delinquent", count: data ? pick(data.by_status, "status", "DELINQUENT") : dash },
    { color: "warning", icon: "pending_actions", title: "Pending verification", count: data ? pick(data.by_verification, "verification_status", "PENDING") : dash },
    { color: "info", icon: "person_add", title: "New this month", count: data?.new_this_period ?? dash },
    { color: "secondary", icon: "home_work", title: "No active lease", count: data?.onboarded_but_unleased ?? dash },
  ];

  return (
    <MDBox mb={2}>
      <Grid container spacing={2}>
        {cards.map((c) => (
          <Grid item xs={12} sm={6} md={4} lg={2} key={c.title}>
            <MDBox mb={1}>
              <ComplexStatisticsCard color={c.color} icon={c.icon} title={c.title} count={c.count} />
            </MDBox>
          </Grid>
        ))}
      </Grid>
    </MDBox>
  );
}
