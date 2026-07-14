import { useParams } from "react-router-dom";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

// Unit 21.5 F1b-1: routing placeholder so /cashier-intake/:id resolves.
// Real Phase D review UI (CashierIntakeHeader, PaymentList, FlagDialog, etc.)
// lands in F1b-2.
export default function CashierIntakeDetailPage() {
  const { id } = useParams();

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>
        <MDTypography variant="h5">Cashier Intake #{id}</MDTypography>
        <MDTypography variant="body2" color="text">
          Phase D review UI coming in F1b-2.
        </MDTypography>
      </MDBox>
      <Footer />
    </DashboardLayout>
  );
}
