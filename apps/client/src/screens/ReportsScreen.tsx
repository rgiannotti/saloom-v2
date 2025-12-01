import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View
} from "react-native";
import dayjs from "dayjs";

import { useAuth } from "../auth/AuthContext";
import { API_BASE_URL } from "../config";

type ReportAppointment = {
  _id: string;
  code?: string;
  startDate: string;
  professionalName?: string;
  serviceNames?: string[];
  clientName?: string;
  clientPhone?: string;
  status?: string;
};

const MONTHS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre"
];

const STATUSES = [
  { value: "scheduled", label: "Programada" },
  { value: "confirmed", label: "Confirmada" },
  { value: "show", label: "Asistió" },
  { value: "no_show", label: "No asistió" },
  { value: "canceled", label: "Cancelada" },
  { value: "completed", label: "Completada" }
];

const currentYear = dayjs().year();
const YEAR_OPTIONS = Array.from({ length: 5 }).map((_, idx) => currentYear - 2 + idx);

export const ReportsScreen = () => {
  const {
    session: { tokens }
  } = useAuth();
  const [appointments, setAppointments] = useState<ReportAppointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [month, setMonth] = useState(dayjs().month());
  const [year, setYear] = useState(currentYear);
  const [professional, setProfessional] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [search, setSearch] = useState("");
  const { width } = useWindowDimensions();
  const isMobile = width < 1024;
  const [filtersOpen, setFiltersOpen] = useState(true);

  const [openDropdown, setOpenDropdown] = useState<
    null | "month" | "year" | "professional" | "status"
  >(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const resp = await fetch(`${API_BASE_URL}/appointments`, {
          headers: {
            Authorization: `Bearer ${tokens.accessToken}`,
            "Content-Type": "application/json"
          }
        });
        if (!resp.ok) {
          throw new Error("No se pudieron cargar las citas");
        }
        const data = (await resp.json()) as ReportAppointment[];
        setAppointments(data);
      } catch (err) {
        setError((err as Error).message);
        setAppointments([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [tokens.accessToken]);

  useEffect(() => {
    setFiltersOpen(true);
  }, [isMobile]);

  const professionals = useMemo(() => {
    const set = new Set<string>();
    appointments.forEach((a) => {
      if (a.professionalName) set.add(a.professionalName);
    });
    return Array.from(set);
  }, [appointments]);

  const filtered = useMemo(() => {
    return appointments
      .filter((a) => {
        const date = dayjs(a.startDate);
        if (date.month() !== month) return false;
        if (date.year() !== year) return false;
        if (professional !== "all" && a.professionalName !== professional) return false;
        if (status !== "all" && a.status !== status) return false;
        if (search.trim()) {
          const term = search.trim().toLowerCase();
          const matches =
            (a.clientName ?? "").toLowerCase().includes(term) ||
            (a.clientPhone ?? "").toLowerCase().includes(term) ||
            (a.serviceNames ?? []).some((s) => s?.toLowerCase().includes(term));
          if (!matches) return false;
        }
        return true;
      })
      .sort((a, b) => dayjs(a.startDate).valueOf() - dayjs(b.startDate).valueOf());
  }, [appointments, month, professional, search, status, year]);

  const totalByProfessional = useMemo(() => {
    const counts: Record<string, number> = {};
    filtered.forEach((a) => {
      const key = a.professionalName || "Sin asignar";
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }, [filtered]);

  const totalByStatus = useMemo(() => {
    const counts: Record<string, number> = {};
    filtered.forEach((a) => {
      const key = a.status || "sin_estado";
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }, [filtered]);

  const renderDropdown = (
    kind: "month" | "year" | "professional" | "status",
    options: { label: string; value: string | number }[],
    onSelect: (v: string | number) => void
  ) => {
    if (openDropdown !== kind) return null;
    return (
      <View style={styles.dropdown}>
        <ScrollView style={{ maxHeight: 200 }}>
          {options.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={styles.dropdownItem}
              onPress={() => {
                onSelect(opt.value);
                setOpenDropdown(null);
              }}
            >
              <Text style={styles.dropdownItemText}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{}}>
      {!isMobile ? (
        <View style={styles.headerText}>
          <Text style={styles.title}>Reporte de Citas</Text>
          <Text style={styles.subtitle}>Resumen de citas</Text>
        </View>
      ) : null}
      {isMobile ? (
        <TouchableOpacity
          style={styles.filterToggle}
          onPress={() => setFiltersOpen((prev) => !prev)}
        >
          <Text style={styles.filterToggleText}>
            {filtersOpen ? "Ocultar filtros" : "Mostrar filtros"}
          </Text>
        </TouchableOpacity>
      ) : null}
      {filtersOpen ? (
        <View style={styles.filters}>
          <View style={[styles.filterColumn, isMobile ? { zIndex: 3 } : {}]}>
            <Text style={styles.filterLabel}>Mes</Text>
            <TouchableOpacity
              style={styles.select}
              onPress={() => setOpenDropdown(openDropdown === "month" ? null : "month")}
            >
              <Text>{MONTHS[month]}</Text>
            </TouchableOpacity>
            {renderDropdown(
              "month",
              MONTHS.map((m, idx) => ({ label: m, value: idx })),
              (v) => setMonth(Number(v))
            )}
          </View>
          <View style={[styles.filterColumn, isMobile ? { zIndex: 3 } : {}]}>
            <Text style={styles.filterLabel}>Año</Text>
            <TouchableOpacity
              style={styles.select}
              onPress={() => setOpenDropdown(openDropdown === "year" ? null : "year")}
            >
              <Text>{year}</Text>
            </TouchableOpacity>
            {renderDropdown(
              "year",
              YEAR_OPTIONS.map((y) => ({ label: y.toString(), value: y })),
              (v) => setYear(Number(v))
            )}
          </View>
          <View style={[styles.filterColumn, isMobile ? { zIndex: 2 } : {}]}>
            <Text style={styles.filterLabel}>Personal</Text>
            <TouchableOpacity
              style={styles.select}
              onPress={() =>
                setOpenDropdown(openDropdown === "professional" ? null : "professional")
              }
            >
              <Text>{professional === "all" ? "Todos" : professional}</Text>
            </TouchableOpacity>
            {renderDropdown(
              "professional",
              [
                { label: "Todos", value: "all" },
                ...professionals.map((p) => ({ label: p, value: p }))
              ],
              (v) => setProfessional(String(v))
            )}
          </View>
          <View style={[styles.filterColumn, isMobile ? { zIndex: 2 } : {}]}>
            <Text style={styles.filterLabel}>Estado</Text>
            <TouchableOpacity
              style={styles.select}
              onPress={() => setOpenDropdown(openDropdown === "status" ? null : "status")}
            >
              <Text>
                {status === "all"
                  ? "Todos"
                  : (STATUSES.find((s) => s.value === status)?.label ?? status)}
              </Text>
            </TouchableOpacity>
            {renderDropdown(
              "status",
              [
                { label: "Todos", value: "all" },
                ...STATUSES.map((s) => ({ label: s.label, value: s.value }))
              ],
              (v) => setStatus(String(v))
            )}
          </View>
          <View style={[styles.filterColumn, styles.searchColumn, isMobile ? { zIndex: 1 } : {}]}>
            <Text style={styles.filterLabel}>Buscar</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar por nombre de cliente, teléfono o servicio..."
              value={search}
              onChangeText={setSearch}
            />
          </View>
        </View>
      ) : null}

      {filtered.length > 0 ? (
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total:</Text>
            <View style={styles.chipRow}>
              <View style={styles.chip}>
                <Text style={styles.chipText}>Citas: {filtered.length}</Text>
              </View>
            </View>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total por personal</Text>
            <View style={styles.chipRow}>
              {Object.entries(totalByProfessional).map(([name, count]) => (
                <View key={name} style={styles.chip}>
                  <Text style={styles.chipText}>
                    {name}: {count}
                  </Text>
                </View>
              ))}
            </View>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total por estado</Text>
            <View style={styles.chipRow}>
              {Object.entries(totalByStatus).map(([st, count]) => (
                <View key={st} style={[styles.chip, styles.statusChip]}>
                  <Text style={styles.chipText}>
                    {(STATUSES.find((s) => s.value === st)?.label ?? st) + ": " + count}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      ) : null}

      <ScrollView
        horizontal={isMobile}
        style={isMobile ? styles.tableScroll : undefined}
        contentContainerStyle={isMobile ? styles.tableScrollContent : undefined}
      >
        <View style={styles.table}>
          {!isMobile || filtered.length > 0 ? (
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={[styles.cell, styles.cellId]}>ID</Text>
              <Text style={[styles.cell, styles.cellDate]}>Fecha</Text>
              <Text style={[styles.cell, styles.cellProfessional]}>Personal</Text>
              <Text style={[styles.cell, styles.cellService]}>Servicio</Text>
              <Text style={[styles.cell, styles.cellClient]}>Cliente</Text>
              <Text style={[styles.cell, styles.cellPhone]}>Teléfono</Text>
              <Text style={[styles.cell, styles.cellStatus]}>Estado</Text>
            </View>
          ) : null}
          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color="#f43f5e" />
              <Text style={styles.loadingText}>Cargando citas…</Text>
            </View>
          ) : error ? (
            <View style={styles.loadingRow}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : filtered.length === 0 ? (
            <View style={styles.loadingRow}>
              <Text style={styles.muted}>Sin resultados para los filtros seleccionados.</Text>
            </View>
          ) : (
            filtered.map((a) => (
              <View key={a._id} style={styles.tableRow}>
                <Text style={[styles.cell, styles.cellId]} numberOfLines={1}>
                  {a.code ?? a._id.slice(-5).toUpperCase()}
                </Text>
                <Text style={[styles.cell, styles.cellDate]}>
                  {dayjs(a.startDate).format("YYYY-MM-DD HH:mm")}
                </Text>
                <Text style={[styles.cell, styles.cellProfessional]} numberOfLines={1}>
                  {a.professionalName || "—"}
                </Text>
                <Text style={[styles.cell, styles.cellService]} numberOfLines={1}>
                  {a.serviceNames?.[0] ?? "—"}
                </Text>
                <Text style={[styles.cell, styles.cellClient]} numberOfLines={1}>
                  {a.clientName || "—"}
                </Text>
                <Text style={[styles.cell, styles.cellPhone]} numberOfLines={1}>
                  {a.clientPhone || "—"}
                </Text>
                <Text style={[styles.cell, styles.cellStatus]} numberOfLines={1}>
                  {STATUSES.find((s) => s.value === a.status)?.label ?? a.status ?? "—"}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#0f172a"
  },
  subtitle: {
    color: "#475569",
    fontSize: 15
  },
  filterToggle: {
    alignSelf: "flex-end",
    marginBottom: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#fff"
  },
  filterToggleText: {
    fontWeight: "700",
    color: "#0f172a"
  },
  headerText: {
    gap: 4,
    marginBottom: 12
  },
  filters: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 14,
    borderColor: "#e2e8f0",
    borderWidth: 1,
    marginBottom: 14,
    zIndex: 20
  },
  filterColumn: {
    minWidth: 140,
    flexGrow: 1,
    position: "relative"
  },
  searchColumn: {
    minWidth: 280,
    flexGrow: 2
  },
  filterLabel: {
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: 6
  },
  select: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "#fff"
  },
  dropdown: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    marginTop: 4,
    zIndex: 10,
    shadowColor: "#0f172a",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 12
  },
  dropdownItemText: {
    color: "#0f172a",
    fontWeight: "600"
  },
  searchInput: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "#fff"
  },
  summaryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 14
  },
  summaryCard: {
    flexGrow: 1,
    minWidth: 240,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 12
  },
  summaryLabel: {
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 8
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  chip: {
    backgroundColor: "#e2e8f0",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999
  },
  statusChip: {
    backgroundColor: "#dcfce7"
  },
  chipText: {
    fontWeight: "700",
    color: "#0f172a"
  },
  tableScroll: {
    marginBottom: 12
  },
  tableScrollContent: {
    minWidth: "100%"
  },
  table: {
    width: "100%",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    overflow: "hidden"
  },
  tableHeader: {
    backgroundColor: "#f1f5f9"
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: "center",
    gap: 6
  },
  cell: {
    fontSize: 13,
    color: "#0f172a"
  },
  cellId: {
    width: 80,
    fontWeight: "700"
  },
  cellDate: {
    width: 140
  },
  cellProfessional: {
    width: 140
  },
  cellService: {
    width: 180
  },
  cellClient: {
    width: 160
  },
  cellPhone: {
    width: 120
  },
  cellStatus: {
    width: 100
  },
  loadingRow: {
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 8
  },
  loadingText: {
    color: "#475569",
    fontWeight: "600"
  },
  errorText: {
    color: "#dc2626",
    fontWeight: "700"
  },
  muted: {
    color: "#475569"
  }
});
