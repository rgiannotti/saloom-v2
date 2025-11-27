import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View
} from "react-native";

import { useAuth } from "../auth/AuthContext";
import { API_BASE_URL } from "../config";

interface StatCard {
  title: string;
  value: string;
  subtitle: string;
  icon: string;
}

interface Appointment {
  name: string;
  service: string;
  time: string;
  status: string;
}

interface SummaryItem {
  label: string;
  value: string;
  icon: string;
}

interface DashboardResponse {
  todayAppointments: number;
  weekRevenue: number;
  availableStaff: number;
  upcomingAppointments: Array<{
    id: string;
    clientName: string;
    serviceName: string;
    time: string;
    status: string;
    price: number;
  }>;
  clients: number;
  monthAppointments: number;
  monthNewClients: number;
}

export const DashboardScreen = () => {
  const {
    session: { tokens }
  } = useAuth();
  const token = tokens.accessToken;

  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { width } = useWindowDimensions();
  const isMobile = width < 1024;

  useEffect(() => {
    const fetchData = async () => {
      if (!token) {
        setError("Sesión inválida");
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const resp = await fetch(`${API_BASE_URL}/client/dashboard`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        if (!resp.ok) {
          throw new Error("No se pudo cargar el dashboard");
        }
        const json = (await resp.json()) as DashboardResponse;
        setData(json);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  const formattedStats: StatCard[] = useMemo(
    () => [
      {
        title: "Citas Hoy",
        value: formatNumber(data?.todayAppointments),
        subtitle: "Citas programadas para hoy",
        icon: "📅"
      },
      {
        title: "Ingresos Semana",
        value: data ? `$${formatNumber(data.weekRevenue, 0)}` : "—",
        subtitle: "Ingresos de esta semana",
        icon: "💵"
      },
      {
        title: "Personal Disponible",
        value: formatNumber(data?.availableStaff),
        subtitle: "Miembros del personal activos",
        icon: "🧑‍🤝‍🧑"
      },
      {
        title: "Próximas Citas",
        value: formatNumber(data?.upcomingAppointments?.length),
        subtitle: "Citas pendientes hoy",
        icon: "⏱️"
      }
    ],
    [data]
  );

  const appointments: Appointment[] = useMemo(
    () =>
      (data?.upcomingAppointments ?? []).map((appt) => ({
        name: appt.clientName || "Cliente",
        service: appt.serviceName || "Servicio",
        time: appt.time,
        status: appt.status ?? "Programada"
      })),
    [data]
  );

  const summary: SummaryItem[] = useMemo(
    () => [
      { label: "Total Clientes", value: formatNumber(data?.clients), icon: "👥" },
      { label: "Citas Este Mes", value: formatNumber(data?.monthAppointments), icon: "📅" },
      { label: "Nuevos Clientes Este Mes", value: formatNumber(data?.monthNewClients), icon: "📈" }
    ],
    [data]
  );

  return (
    <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{!isMobile ? "Dashboard" : null}</Text>
        <Text style={styles.datePill}>martes, 25 de noviembre de 2025</Text>
      </View>

      <View style={styles.statsRow}>
        {formattedStats.map((stat) => (
          <View key={stat.title} style={styles.statCard}>
            <View style={styles.statHeader}>
              <Text style={styles.statTitle}>{stat.title}</Text>
              <Text style={styles.statIcon}>{stat.icon}</Text>
            </View>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statSubtitle}>{stat.subtitle}</Text>
          </View>
        ))}
      </View>

      <View style={styles.columns}>
        <View style={styles.leftColumn}>
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Próximas Citas de Hoy</Text>
            <Text style={styles.sectionSubtitle}>
              Lista de citas programadas para el día de hoy
            </Text>
            {loading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color="#f43f5e" />
                <Text style={styles.loadingText}>Cargando...</Text>
              </View>
            ) : error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : (
              <View style={styles.appointmentList}>
                {appointments.length ? (
                  appointments.map((appt) => (
                    <View key={`${appt.name}-${appt.time}`} style={styles.appointmentCard}>
                      <View style={styles.appointmentInfo}>
                        <Text style={styles.appointmentName}>{appt.name}</Text>
                        <Text style={styles.appointmentService}>{appt.service}</Text>
                      </View>
                      <View style={styles.appointmentMeta}>
                        <Text style={styles.appointmentTime}>{appt.time}</Text>
                        <View style={styles.statusBadge}>
                          <Text style={styles.statusText}>{appt.status}</Text>
                        </View>
                      </View>
                    </View>
                  ))
                ) : (
                  <Text style={styles.mutedText}>Sin citas programadas para hoy</Text>
                )}
              </View>
            )}
          </View>
        </View>

        <View style={styles.rightColumn}>
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Resumen Rápido</Text>
            <Text style={styles.sectionSubtitle}>Estadísticas importantes del salón</Text>
            {loading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color="#f43f5e" />
                <Text style={styles.loadingText}>Cargando...</Text>
              </View>
            ) : error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : (
              <View style={styles.summaryList}>
                {summary.map((item) => (
                  <View key={item.label} style={styles.summaryRow}>
                    <View style={styles.summaryLeft}>
                      <Text style={styles.summaryIcon}>{item.icon}</Text>
                      <Text style={styles.summaryLabel}>{item.label}</Text>
                    </View>
                    <Text style={styles.summaryValue}>{item.value}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const formatNumber = (value?: number | null, minimumFractionDigits = 0) => {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return "—";
  }
  return new Intl.NumberFormat("es-ES", { minimumFractionDigits }).format(value);
};

const styles = StyleSheet.create({
  page: {
    gap: 16
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#0f172a"
  },
  datePill: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 13,
    fontWeight: "700",
    color: "#0f172a"
  },
  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12
  },
  statCard: {
    flexGrow: 1,
    flexBasis: "24%",
    minWidth: 220,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 14,
    padding: 16,
    gap: 6
  },
  statHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  statTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0f172a"
  },
  statIcon: {
    fontSize: 18
  },
  statValue: {
    fontSize: 26,
    fontWeight: "800",
    color: "#0f172a"
  },
  statSubtitle: {
    color: "#475569",
    fontWeight: "600",
    fontSize: 13
  },
  columns: {
    flexDirection: "row",
    gap: 16,
    flexWrap: "wrap"
  },
  leftColumn: {
    flex: 1,
    minWidth: 360
  },
  rightColumn: {
    flex: 1,
    minWidth: 360
  },
  sectionCard: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 14,
    padding: 16,
    gap: 12
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0f172a"
  },
  sectionSubtitle: {
    color: "#475569",
    fontSize: 14
  },
  appointmentList: {
    gap: 10
  },
  appointmentCard: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 14,
    backgroundColor: "#fff",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  appointmentInfo: {
    gap: 4,
    flex: 1
  },
  appointmentName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a"
  },
  appointmentService: {
    color: "#475569",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.2
  },
  appointmentMeta: {
    alignItems: "flex-end",
    gap: 6
  },
  appointmentTime: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0f172a"
  },
  statusBadge: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0f172a"
  },
  summaryList: {
    gap: 14
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  summaryLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  summaryIcon: {
    fontSize: 18
  },
  summaryLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0f172a"
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0f172a"
  }
});
