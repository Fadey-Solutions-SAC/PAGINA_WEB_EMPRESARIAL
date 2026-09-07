import { createBrowserRouter } from "react-router-dom";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { AdminPage } from "./pages/AdminPage";
import { AcademiaPage } from "./pages/AcademiaPage";
import { LibroReclamacionesPage } from "./pages/LibroReclamacionesPage";
import { ProtectedRoute } from "./components/ProtectedRoute";

export const router = createBrowserRouter([
  { path: "/", element: <LandingPage /> },
  { path: "/login", element: <LoginPage /> },
  { path: "/libro-de-reclamaciones", element: <LibroReclamacionesPage /> },
  {
    path: "/admin",
    element: (
      <ProtectedRoute role="admin">
        <AdminPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/academia",
    element: (
      <ProtectedRoute role="client">
        <AcademiaPage />
      </ProtectedRoute>
    ),
  },
]);
