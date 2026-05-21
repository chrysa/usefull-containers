import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import GlobalLoader from "./components/loaders/GlobalLoader";
import Layout from "./components/layouts/Layout";

const Home = lazy(() => import("./pages/Home"));
const Blueprints = lazy(() => import("./pages/Blueprints"));
const BlueprintDetail = lazy(() => import("./pages/BlueprintDetail"));
const GameData = lazy(() => import("./pages/GameData"));
const Calculator = lazy(() => import("./pages/Calculator"));
const Plans = lazy(() => import("./pages/Plans"));
const PlanDetail = lazy(() => import("./pages/PlanDetail"));
const NotFound = lazy(() => import("./pages/NotFound"));

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<GlobalLoader />}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/blueprints" element={<Blueprints />} />
            <Route path="/blueprints/:name" element={<BlueprintDetail />} />
            <Route path="/gamedata" element={<GameData />} />
            <Route path="/calculator" element={<Calculator />} />
            <Route path="/plans" element={<Plans />} />
            <Route path="/plans/:id" element={<PlanDetail />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
