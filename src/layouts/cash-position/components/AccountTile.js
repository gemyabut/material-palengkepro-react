import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Divider from "@mui/material/Divider";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";

const peso = (v) =>
  `₱${Number(v ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

function fmtActivity(iso) {
  if (!iso) return "No activity";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function AccountTile({ account }) {
  const { name, owner_full_name, balance, last_activity } = account;

  return (
    <Card variant="outlined" sx={{ height: "100%" }}>
      <CardContent>
        <MDTypography variant="h6" fontWeight="medium" noWrap title={name}>
          {name}
        </MDTypography>
        {owner_full_name && (
          <MDTypography variant="caption" color="text" display="block">
            {owner_full_name}
          </MDTypography>
        )}
        <Divider sx={{ my: 1 }} />
        <MDTypography variant="h5" fontWeight="bold" color="text">
          {peso(balance)}
        </MDTypography>
        <MDBox mt={1}>
          <MDTypography variant="caption" color="secondary">
            Last activity: {fmtActivity(last_activity)}
          </MDTypography>
        </MDBox>
      </CardContent>
    </Card>
  );
}
