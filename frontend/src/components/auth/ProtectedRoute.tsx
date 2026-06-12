import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { PageLoader } from "@/components/ui/Spinner";
import { useEffect } from "react";

export function ProtectedRoute() {
  const { isAuthenticated, user, checkAuth } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    if (!user && sessionStorage.getItem("accessToken")) {
      checkAuth();
    }
  }, []);

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!user && sessionStorage.getItem("accessToken")) {
    return <PageLoader />;
  }

  return <Outlet />;
}
