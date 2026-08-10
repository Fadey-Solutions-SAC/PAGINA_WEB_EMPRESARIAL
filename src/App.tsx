import { RouterProvider } from "react-router-dom";
import { AuthProvider } from "./lib/auth";
import { ThemeProvider } from "./lib/theme";
import { router } from "./router";

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </ThemeProvider>
  );
}
