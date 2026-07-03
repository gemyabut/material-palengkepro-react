// src/layouts/help/index.js — Unit 26 / F1.2
import { useState } from "react";
import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Icon from "@mui/material/Icon";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";

const FAQ = [
  {
    q: "How do I record a daily collection?",
    a: "Go to EOD Cash Count → Submit EOD Count. Enter the physical cash count per denomination, then submit for cashier intake.",
  },
  {
    q: "How do I upload tenant or stall data in bulk?",
    a: "Use Spreadsheet Upload. Download the master template, fill in the data, then upload the file. Validate first (dry run), then publish.",
  },
  {
    q: "How do I close the monthly period?",
    a: "Go to Monthly Close. The Market Administrator and AR Officer must each sign off. The Owner can then mark the period Closed.",
  },
  {
    q: "Why is my cash accountability showing CRITICAL?",
    a: "A variance exists between collected cash and deposited + deductions + in-transit. Go to Cash Accountability to see the breakdown.",
  },
  {
    q: "Who can approve cash deductions?",
    a: "Deductions created by Cashiers must be approved by the Finance Manager, Market Administrator, or Executive.",
  },
  {
    q: "I forgot my password. What do I do?",
    a: "Click 'Forgot Password' on the sign-in page and enter your email. A reset link will be sent.",
  },
];

export default function Help() {
  const [expanded, setExpanded] = useState(false);

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>
        <Grid container justifyContent="center">
          <Grid item xs={12} md={8}>
            <Card>
              <MDBox p={3}>
                <MDTypography variant="h5" fontWeight="bold" mb={0.5}>
                  Help Center
                </MDTypography>
                <MDTypography variant="body2" color="text" mb={3}>
                  Frequently asked questions about PalengkeProPH Tier 1.
                </MDTypography>
                {FAQ.map((item, i) => (
                  <Accordion
                    key={i}
                    expanded={expanded === i}
                    onChange={() => setExpanded(expanded === i ? false : i)}
                    disableGutters
                    elevation={0}
                    sx={{ border: "1px solid rgba(0,0,0,0.08)", mb: 1, borderRadius: "8px !important" }}
                  >
                    <AccordionSummary expandIcon={<Icon>expand_more</Icon>}>
                      <MDTypography variant="body2" fontWeight="medium">
                        {item.q}
                      </MDTypography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <MDTypography variant="body2" color="text">
                        {item.a}
                      </MDTypography>
                    </AccordionDetails>
                  </Accordion>
                ))}
              </MDBox>
            </Card>
          </Grid>
        </Grid>
      </MDBox>
    </DashboardLayout>
  );
}
