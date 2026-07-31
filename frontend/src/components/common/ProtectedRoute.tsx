import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/context/useAuth";
import GlobalLoader from "@/components/loaders/GlobalLoader";

/**
 * Guards routes that require authentication. A-04 made plans & blueprints
 * auth-mandatory on the API; this stops unauthenticated users from landing on
 * those pages (which would only 401) and sends them to /login instead,
 * preserving the attempted path so they can be returned after signing in.
 *
 * While the initial /auth/me revalidation is in flight (isHydrating), render
 * the loader rather than flashing a redirect for a session that is still valid.
 */
export default function ProtectedRoute() {
  const { isAuthenticated, isHydrating } = useAuth();
  const location = useLocation();

  if (isHydrating) return <GlobalLoader />;
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <Outlet />;
}
