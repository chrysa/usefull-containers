import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/context/useAuth";
import { useHealthQuery } from "@/api/health/queries";
import GlobalLoader from "@/components/loaders/GlobalLoader";

/**
 * Guards routes that require authentication. A-04 made plans & blueprints
 * auth-mandatory on the API; this stops unauthenticated users from landing on
 * those pages (which would only 401) and sends them to /login instead,
 * preserving the attempted path so they can be returned after signing in.
 *
 * While the initial /auth/me revalidation is in flight (isHydrating), render
 * the loader rather than flashing a redirect for a session that is still valid.
 *
 * Demo mode is exempt: the backend serves fixtures and falls back to a demo
 * user on the auth-gated routers, so the whole app — blueprints & plans
 * included — is explorable without credentials. This mirrors DemoBanner's
 * detection (VITE_DEMO_MODE build flag OR the backend's /health demo_mode).
 */
export default function ProtectedRoute() {
  const { isAuthenticated, isHydrating } = useAuth();
  const { data: health } = useHealthQuery();
  const location = useLocation();

  const isDemo =
    import.meta.env.VITE_DEMO_MODE === "true" || health?.demo_mode === true;
  if (isDemo) return <Outlet />;

  if (isHydrating) return <GlobalLoader />;
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <Outlet />;
}
