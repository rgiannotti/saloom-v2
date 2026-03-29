import React, { useMemo } from "react";
import { NavLink } from "react-router-dom";
import {
  MdDashboard,
  MdBusiness,
  MdContentCut,
  MdCategory,
  MdPeople,
  MdManageAccounts,
  MdBarChart,
  MdSettings,
  MdChevronLeft,
  MdChevronRight
} from "react-icons/md";

import redFullLogo from "../assets/logo/rojo-saloom.svg";
import redIconLogo from "../assets/logo/rojo-icon.svg";
import whiteFullLogo from "../assets/logo/blanco-saloom.svg";
import whiteIconLogo from "../assets/logo/blanco-icon.svg";
import { useTheme } from "../theme/ThemeProvider";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onNavigate?: () => void;
}

type NavItem = {
  label: string;
  icon: React.ReactNode;
  to?: string;
};

const navItems: NavItem[] = [
  { label: "Dashboard", icon: <MdDashboard />, to: "/" },
  { label: "Profesionales", icon: <MdBusiness />, to: "/clients" },
  { label: "Servicios", icon: <MdContentCut />, to: "/services" },
  { label: "Categorías", icon: <MdCategory />, to: "/categories" },
  { label: "Usuarios", icon: <MdPeople />, to: "/app/users" },
  { label: "Usuarios Saloom", icon: <MdManageAccounts />, to: "/backoffice/users" },
  { label: "Reportes", icon: <MdBarChart /> },
  { label: "Configuración", icon: <MdSettings />, to: "/settings" }
];

export const Sidebar = ({ collapsed, onToggle, mobileOpen, onNavigate }: SidebarProps) => {
  const { theme } = useTheme();

  const className = [
    "sidebar",
    collapsed ? "sidebar--collapsed" : "",
    mobileOpen ? "sidebar--mobile-open" : "sidebar--mobile-closed"
  ]
    .filter(Boolean)
    .join(" ");

  const logoSrc = useMemo(() => {
    if (theme === "dark") {
      return collapsed ? whiteIconLogo : whiteFullLogo;
    }
    return collapsed ? redIconLogo : redFullLogo;
  }, [theme, collapsed]);

  const logoAlt = useMemo(() => {
    if (theme === "dark") {
      return collapsed ? "Saloom ícono (modo oscuro)" : "Saloom (modo oscuro)";
    }
    return collapsed ? "Saloom ícono" : "Saloom";
  }, [theme, collapsed]);

  const handleNavigate = () => {
    if (onNavigate) {
      onNavigate();
    }
  };

  return (
    <aside className={className}>
      <div className="sidebar__brand">
        <img
          src={logoSrc}
          alt={logoAlt}
          className={`sidebar__logo ${collapsed ? "sidebar__logo--collapsed" : ""}`}
          draggable={false}
        />
        <button
          type="button"
          className="ghost-button sidebar__collapse-button"
          onClick={onToggle}
          aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
          aria-pressed={collapsed}
        >
          {collapsed ? <MdChevronRight /> : <MdChevronLeft />}
        </button>
      </div>
      <nav className="sidebar__nav">
        {navItems.map((item) =>
          item.to ? (
            <NavLink
              key={item.label}
              to={item.to}
              className={({ isActive }) =>
                `sidebar__link ${isActive ? "sidebar__link--active" : ""}`
              }
              onClick={handleNavigate}
            >
              <span className="sidebar__icon" aria-hidden="true">
                {item.icon}
              </span>
              <span className="sidebar__label">{item.label}</span>
            </NavLink>
          ) : (
            <button key={item.label} type="button" className="sidebar__link sidebar__link--disabled" disabled>
              <span className="sidebar__icon" aria-hidden="true">
                {item.icon}
              </span>
              <span className="sidebar__label">{item.label}</span>
            </button>
          )
        )}
      </nav>
    </aside>
  );
};
