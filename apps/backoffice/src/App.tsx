import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { AuthProvider } from "./auth/AuthProvider";
import { ProtectedRoute } from "./auth/ProtectedRoute";
import { DashboardPage } from "./pages/DashboardPage";
import { LoginPage } from "./pages/LoginPage";
import { ThemeProvider } from "./theme/ThemeProvider";
import { BackofficeShell } from "./components/BackofficeShell";
import { BackofficeUsersPage } from "./pages/BackofficeUsersPage";
import { AppUsersPage } from "./pages/AppUsersPage";
import { ServicesPage } from "./pages/ServicesPage";
import { ClientsPage } from "./pages/ClientsPage";

export const App = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <BackofficeShell />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardPage />} />
              <Route path="backoffice/users" element={<BackofficeUsersPage />} />
              <Route path="app/users" element={<AppUsersPage />} />
              <Route path="services" element={<ServicesPage />} />
              <Route path="clients" element={<ClientsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
