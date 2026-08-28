import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import GlobalLoader from "./components/loaders/GlobalLoader";
import Layout from "./components/layouts/Layout";
import ProtectedRoute from "./components/common/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import { FactoryProvider } from "./context/FactoryContext";
import AuthCallback from "./pages/AuthCallback";

const Home = lazy(() => import("./pages/Home"));
const Blueprints = lazy(() => import("./pages/Blueprints"));
const BlueprintDetail = lazy(() => import("./pages/BlueprintDetail"));
const GameData = lazy(() => import("./pages/GameData"));
const Calculator = lazy(() => import("./pages/Calculator"));
const Plans = lazy(() => import("./pages/Plans"));
const PlanDetail = lazy(() => import("./pages/PlanDetail"));
const Snapshots = lazy(() => import("./pages/Snapshots"));
const Diff = lazy(() => import("./pages/Diff"));
const Assistant = lazy(() => import("./pages/Assistant"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Login = lazy(() => import("./pages/Login"));

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<GlobalLoader />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route
              element={
                <FactoryProvider>
                  <Layout />
                </FactoryProvider>
              }
            >
              {/* Public: browsing tools that hold no per-user data. */}
              <Route path="/" element={<Home />} />
              <Route path="/gamedata" element={<GameData />} />
              <Route path="/calculator" element={<Calculator />} />
              {/* Protected: per-user data, auth-mandatory since A-04. */}
              <Route element={<ProtectedRoute />}>
                <Route path="/blueprints" element={<Blueprints />} />
                <Route path="/blueprints/:name" element={<BlueprintDetail />} />
                <Route path="/plans" element={<Plans />} />
                <Route path="/plans/:id" element={<PlanDetail />} />
                <Route path="/snapshots" element={<Snapshots />} />
                <Route path="/diff" element={<Diff />} />
                <Route path="/assistant" element={<Assistant />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}
