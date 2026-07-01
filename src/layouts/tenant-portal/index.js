/**
 * D9 (Unit 15, DEC-042): IAM-3 unauthenticated inquiry portal removed.
 * Old /tenant-portal route redirects to the JWT-authenticated /tenant/login.
 */
import { Navigate } from "react-router-dom";

export default function TenantPortalRedirect() {
  return <Navigate to="/tenant/login" replace />;
}
