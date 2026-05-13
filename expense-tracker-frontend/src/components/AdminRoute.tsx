import { Navigate, Outlet, useLocation } from "react-router-dom";
import { isAdmin, isAuthenticated } from "../utils/authToken";

export default function AdminRoute() {
  const location = useLocation();

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!isAdmin()) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
