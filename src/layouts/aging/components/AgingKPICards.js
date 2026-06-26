import React from "react";
import Grid from "@mui/material/Grid";
import ComplexStatisticsCard from "examples/Cards/StatisticsCards/ComplexStatisticsCard";

const peso = (v) =>
  `₱${Number(v ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

const BUCKET_CONFIG = [
  { key: "current",  label: "Current",     icon: "check_circle", color: "success" },
  { key: "d31_60",   label: "31–60 Days",  icon: "schedule",     color: "warning" },
  { key: "d61_90",   label: "61–90 Days",  icon: "warning",      color: "error"   },
  { key: "d90_plus", label: "90+ Days",    icon: "error",        color: "error"   },
];

export default function AgingKPICards({ byBucket }) {
  if (!byBucket) return null;

  const tenantCount = byBucket.tenant_count ?? 0;
  const pastDue = Number(byBucket.past_due_over_30 ?? 0);
  const total   = Number(byBucket.total ?? 0) || 1;
  const pastDuePct = total > 0 ? Math.round((pastDue / total) * 100) : 0;

  return (
    <Grid container spacing={3} mb={3}>
      {BUCKET_CONFIG.map(({ key, label, icon, color }) => (
        <Grid item xs={12} sm={6} xl={3} key={key}>
          <ComplexStatisticsCard
            color={color}
            icon={icon}
            title={label}
            count={peso(byBucket[key])}
            percentage={{
              color: "text",
              amount: `${tenantCount} tenant${tenantCount !== 1 ? "s" : ""}`,
              label: "with outstanding balance",
            }}
          />
        </Grid>
      ))}
      {/* Hero card — Past Due > 30 */}
      <Grid item xs={12} sm={6} xl={3}>
        <ComplexStatisticsCard
          color="error"
          icon="report_problem"
          title="Past Due > 30 Days"
          count={peso(byBucket.past_due_over_30)}
          percentage={{
            color: "error",
            amount: `${pastDuePct}% of AR`,
            label: "overdue beyond 30 days",
          }}
        />
      </Grid>
    </Grid>
  );
}
