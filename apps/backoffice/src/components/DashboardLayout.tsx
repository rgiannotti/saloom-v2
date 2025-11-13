import React, { ReactNode, useEffect, useState } from "react";

import { useAuth } from "../auth/AuthProvider";

import { Sidebar } from "./Sidebar";
import { ThemeToggle } from "./ThemeToggle";

interface DashboardLayoutProps {
  children: ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { logout } = useAuth();

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 720 && mobileSidebarOpen) {
        setMobileSidebarOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [mobileSidebarOpen]);

  return (
    <div className="dashboard-layout">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((prev) => !prev)}
        mobileOpen={mobileSidebarOpen}
        onNavigate={() => setMobileSidebarOpen(false)}
      />
      {mobileSidebarOpen ? (
        <div className="sidebar-backdrop" onClick={() => setMobileSidebarOpen(false)} aria-hidden />
      ) : null}
      <div className="dashboard-layout__main">
        <header className="topbar">
          <button
            type="button"
            className="ghost-button mobile-menu-button"
            onClick={() => setMobileSidebarOpen((prev) => !prev)}
            aria-label={mobileSidebarOpen ? "Cerrar menú" : "Abrir menú"}
          >
            ☰
          </button>
          <div className="topbar__actions">
            <ThemeToggle />
            <button
              type="button"
              className="icon-button icon-button--danger"
              onClick={logout}
              aria-label="Cerrar sesión"
            >
              ⎋
            </button>
          </div>
        </header>
        <main>{children}</main>
      </div>
    </div>
  );
};
