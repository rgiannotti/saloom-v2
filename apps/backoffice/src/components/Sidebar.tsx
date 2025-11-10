import React from "react";
import { NavLink } from "react-router-dom";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

type NavItem = {
  label: string;
  icon: string;
  to?: string;
};

const navItems: NavItem[] = [
  { label: "Dashboard", icon: "🏠", to: "/" },
  { label: "Usuarios Backoffice", icon: "👥", to: "/backoffice/users" },
  { label: "Profesionales", icon: "🧑‍⚕️" },
  { label: "Reportes", icon: "📊" },
  { label: "Configuración", icon: "⚙️" }
];

export const Sidebar = ({ collapsed, onToggle }: SidebarProps) => {
  return (
    <aside className={`sidebar ${collapsed ? "sidebar--collapsed" : ""}`}>
      <div className="sidebar__brand">
        <span>Saloom</span>
        <button
          type="button"
          className="ghost-button"
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
