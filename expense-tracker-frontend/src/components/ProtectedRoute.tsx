import { Navigate, Outlet, useLocation } from "react-router-dom";
import { isAuthenticated } from "../utils/authToken";

export default function ProtectedRoute() {
  const location = useLocation();
  if (!isAuthenticated()) {
    return (
      <Navigate
        to={`/login?redirect=${encodeURIComponent(location.pathname)}`}
        replace
      />
    );
  }

  return <Outlet />;
}
