import { Routes, Route } from "react-router-dom";
import { MainLayout } from "./components/layout/MainLayout";
import { CenteredLayout } from "./components/layout/CenteredLayout";
import { HomePage } from "./pages/HomePage";
import { WorkspacePage } from "./pages/WorkspacePage";
import "./App.css";

function App() {
  return (
    <Routes>
      <Route element={<CenteredLayout />}>
        <Route path="/" element={<HomePage />} />
      </Route>

      <Route element={<MainLayout />}>
        <Route path="/workspace" element={<WorkspacePage />} />
        {/* TODO : Add about page later */}
      </Route>
    </Routes>
  );
}

export default App;
