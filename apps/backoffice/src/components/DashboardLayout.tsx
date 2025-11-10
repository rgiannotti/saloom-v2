import React, { ReactNode, useState } from "react";

import { useAuth } from "../auth/AuthProvider";

import { Sidebar } from "./Sidebar";
import { ThemeToggle } from "./ThemeToggle";

interface DashboardLayoutProps {
  children: ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const { logout } = useAuth();

  return (
    <div className="dashboard-layout">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((prev) => !prev)} />
      <div className="dashboard-layout__main">
        <header className="topbar">
          <div className="topbar__actions">
            <ThemeToggle />
            <button type="button" className="primary-button" onClick={logout}>
              Cerrar sesión
            </button>
          </div>
        </header>
        <main>{children}</main>
      </div>
    </div>
  );
};
