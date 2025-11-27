import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { useAuth } from "../auth/AuthContext";
import { DashboardLayout } from "../components/DashboardLayout";
import type { SidebarItem } from "../components/Sidebar";
import { AppointmentsScreen } from "./AppointmentsScreen";
import { ClientsScreen } from "./ClientsScreen";
import { DashboardScreen } from "./DashboardScreen";
import { SettingsScreen } from "./SettingsScreen";
import { StaffScreen } from "./StaffScreen";

const modules: SidebarItem[] = [
  { key: "dashboard", label: "Dashboard", icon: "🏠" },
  { key: "appointments", label: "Agenda", icon: "📅" },
  { key: "staff", label: "Personal", icon: "👤" },
  { key: "clients", label: "Clientes", icon: "👥" },
  { key: "overview", label: "Resumen", icon: "📊" },
  { key: "services", label: "Servicios", icon: "💈" },
  { key: "messages", label: "Mensajes", icon: "💬" },
  { key: "settings", label: "Configuración", icon: "⚙️" }
];

const moduleDescriptions: Record<string, string> = {
  overview:
    "Consulta indicadores rápidos de tu operación diaria y tareas pendientes para el cliente asignado.",
  clients: "Consulta y gestiona tu base de clientes registrados.",
  services:
    "Administra los servicios que ofreces, precios y disponibilidad por cada sede del cliente.",
  messages:
    "Centraliza la comunicación con el cliente y recibe alertas del backoffice en tiempo real.",
  settings: "Actualiza tu perfil profesional, credenciales y preferencias de notificación.",
  staff: "Administra los miembros de tu equipo, sus datos y servicios asignados.",
  dashboard: "Panel principal con indicadores y próximas citas."
};

export const HomeScreen = () => {
  const { session, logout } = useAuth();
  const [activeModule, setActiveModule] = useState("dashboard");

  if (!session) {
    return null;
  }

  const { user } = session;

  const headerLabels: Record<string, string> = {
    staff: "Gestión de Personal",
    clients: "Gestión de Clientes",
    appointments: "Gestión de Citas",
    dashboard: "Dashboard",
    settings: "Configuración"
  };
  const headerContent = headerLabels[activeModule] ? (
    <View style={styles.headerTextInline}>
      <Text style={styles.moduleTitle}>{headerLabels[activeModule]}</Text>
    </View>
  ) : null;

  return (
    <DashboardLayout
      userName={user.name || user.email}
      items={modules}
      activeItem={activeModule}
      onSelectItem={setActiveModule}
      headerContent={headerContent}
    >
      {activeModule === "dashboard" ? (
        <DashboardScreen />
      ) : activeModule === "appointments" ? (
        <AppointmentsScreen />
      ) : activeModule === "staff" ? (
        <StaffScreen />
      ) : activeModule === "clients" ? (
        <ClientsScreen />
      ) : activeModule === "settings" ? (
        <SettingsScreen />
      ) : (
        <>
          <View style={styles.moduleHeader}>
            <Text style={styles.badge}>Saloom Client</Text>
            <Text style={styles.moduleTitle}>
              {modules.find((m) => m.key === activeModule)?.label}
            </Text>
            <Text style={styles.moduleDescription}>
              {moduleDescriptions[activeModule] ?? moduleDescriptions.overview}
            </Text>
            <View style={styles.metaRow}>
              <View style={styles.metaCard}>
                <Text style={styles.metaLabel}>Cliente asignado</Text>
                <Text style={styles.metaValue}>{user.client ?? "Por confirmar"}</Text>
              </View>
              <View style={styles.metaCard}>
                <Text style={styles.metaLabel}>Rol</Text>
                <Text style={styles.metaValue}>PRO</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={logout}>
            <Text style={styles.logoutLabel}>Cerrar sesión</Text>
          </TouchableOpacity>
        </>
      )}
    </DashboardLayout>
  );
};

const styles = StyleSheet.create({
  moduleHeader: {
    gap: 12
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(234, 88, 12, 0.12)",
    color: "#9a3412",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: "600"
  },
  moduleTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#0f172a"
  },
  headerTextInline: {
    flexGrow: 1
  },
  moduleDescription: {
    color: "#475569",
    fontSize: 15,
    lineHeight: 22
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16
  },
  metaCard: {
    flexGrow: 1,
    minWidth: 140,
    backgroundColor: "#f8fafc",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0"
  },
  metaLabel: {
    color: "#475569",
    fontSize: 13
  },
  metaValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a"
  },
  logoutButton: {
    marginTop: 24,
    backgroundColor: "#0f172a",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center"
  },
  logoutLabel: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16
  }
});
