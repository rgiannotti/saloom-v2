import React, { useMemo } from "react";
import { NavLink } from "react-router-dom";

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
  icon: string;
  to?: string;
};

const navItems: NavItem[] = [
  { label: "Dashboard", icon: "🏠", to: "/" },
  { label: "Usuarios Backoffice", icon: "👥", to: "/backoffice/users" },
  { label: "Servicios", icon: "💈", to: "/services" },
  { label: "Clientes", icon: "🏢", to: "/clients" },
  { label: "Profesionales", icon: "🧑‍⚕️" },
  { label: "Reportes", icon: "📊" },
  { label: "Configuración", icon: "⚙️" }
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
          {collapsed ? "⤢" : "⤡"}
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
