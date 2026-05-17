import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import GlobalLoader from "./components/loaders/GlobalLoader";
import Layout from "./components/layouts/Layout";

const Home = lazy(() => import("./pages/Home"));
const Blueprints = lazy(() => import("./pages/Blueprints"));
const GameData = lazy(() => import("./pages/GameData"));
const Calculator = lazy(() => import("./pages/Calculator"));
const NotFound = lazy(() => import("./pages/NotFound"));

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<GlobalLoader />}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/blueprints" element={<Blueprints />} />
            <Route path="/gamedata" element={<GameData />} />
            <Route path="/calculator" element={<Calculator />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
