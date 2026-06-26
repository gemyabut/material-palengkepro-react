import React from "react";
import VerticalBarChart from "examples/Charts/BarCharts/VerticalBarChart";

export default function AgingBarChart({ byBucket }) {
  if (!byBucket) return null;

  const chart = {
    labels: ["Current", "31–60 Days", "61–90 Days", "90+ Days"],
    datasets: [
      {
        label: "Outstanding Balance (₱)",
        color: "info",
        data: [
          Number(byBucket.current  ?? 0),
          Number(byBucket.d31_60   ?? 0),
          Number(byBucket.d61_90   ?? 0),
          Number(byBucket.d90_plus ?? 0),
        ],
      },
    ],
  };

  return (
    <VerticalBarChart
      icon={{ component: "bar_chart", color: "info" }}
      title="AR by Aging Bucket"
      description="Outstanding balances grouped by days past due"
      height="14rem"
      chart={chart}
    />
  );
}
