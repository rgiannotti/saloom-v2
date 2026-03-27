import React from "react";
import { MdPeople, MdMedicalServices, MdBarChart, MdSettings } from "react-icons/md";

const modules = [
  {
    title: "Usuarios",
    description: "Gestiona accesos, roles y estados de las cuentas.",
    icon: <MdPeople />
  },
  {
    title: "Profesionales",
    description: "Valida documentación y disponibilidad.",
    icon: <MdMedicalServices />
  },
  {
    title: "Reportes",
    description: "Monitorea métricas clave del negocio.",
    icon: <MdBarChart />
  },
  { title: "Configuración", description: "Actualiza catálogos, precios y campañas.", icon: <MdSettings /> }
];

export const DashboardPage = () => {
  return (
    <section className="cards-grid">
      {modules.map((module) => (
        <article key={module.title} className="module-card">
          <span className="module-card__icon">{module.icon}</span>
          <div>
            <h2>{module.title}</h2>
            <p>{module.description}</p>
          </div>
          <button type="button">Abrir módulo</button>
        </article>
      ))}
    </section>
  );
};
