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
import { useLanguage } from "../i18n/LanguageContext";

type AppointmentRow = {
  _id: string;
  startDate: string;
  clientName?: string;
  clientPhone?: string;
  status?: string;
};

type ClientGroup = {
  clientName: string;
  clientPhone: string;
  total: number;
  scheduled: number;
  confirmed: number;
  show: number;
  no_show: number;
  canceled: number;
  completed: number;
};

const STATUS_KEYS: Array<keyof ClientGroup> = [
  "scheduled",
  "confirmed",
  "show",
  "no_show",
  "canceled",
  "completed"
];

export const ClientReportScreen = () => {
  const {
    session: { tokens }
  } = useAuth();
  const { t } = useLanguage();
  const [appointments, setAppointments] = useState<AppointmentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const { width } = useWindowDimensions();
  const isMobile = width < 1024;
  const [sortKey, setSortKey] = useState<keyof ClientGroup>("total");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    const load = async () => {
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
          throw new Error(t.reportsClients.errorLoad);
        }
        const data = (await resp.json()) as AppointmentRow[];
        setAppointments(data);
      } catch (err) {
        setError((err as Error).message);
        setAppointments([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [t.reportsClients.errorLoad, tokens.accessToken]);

  const grouped = useMemo(() => {
    const map = new Map<string, ClientGroup>();
    appointments.forEach((appt) => {
      const clientName = appt.clientName || "Sin nombre";
      const clientPhone = appt.clientPhone || "";
      const key = `${clientName}|${clientPhone}`;
      const group =
        map.get(key) ||
        ({
          clientName,
          clientPhone,
          total: 0,
          scheduled: 0,
          confirmed: 0,
          show: 0,
          no_show: 0,
          canceled: 0,
          completed: 0
        } as ClientGroup);
      group.total += 1;
      const st = (appt.status as keyof ClientGroup) || "scheduled";
      if (group[st] !== undefined) {
        // @ts-expect-error dynamic
        group[st] += 1;
      }
      map.set(key, group);
    });

    let list = Array.from(map.values());
    if (search.trim()) {
      const term = search.trim().toLowerCase();
      list = list.filter(
        (g) =>
          g.clientName.toLowerCase().includes(term) || g.clientPhone.toLowerCase().includes(term)
      );
    }
    list.sort((a, b) => {
      const aVal = a[sortKey] ?? 0;
      const bVal = b[sortKey] ?? 0;
      if (aVal === bVal) return 0;
      return sortDir === "asc" ? aVal - bVal : bVal - aVal;
    });
    return list;
  }, [appointments, search, sortDir, sortKey]);

  const toggleSort = (key: keyof ClientGroup) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "total" ? "desc" : "asc");
    }
  };

  const renderSortableHeader = (label: string, key: keyof ClientGroup, widthStyle: object) => (
    <TouchableOpacity
      style={[styles.sortableHeader, widthStyle]}
      onPress={() => toggleSort(key)}
      activeOpacity={0.7}
    >
      <Text style={[styles.headerText, styles.cellText]}>{label}</Text>
      <Text style={styles.sortIcon}>{sortKey === key ? (sortDir === "asc" ? "▲" : "▼") : " "}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={{}}>
      {!isMobile ? (
        <View style={styles.headerTitle}>
          <Text style={styles.title}>{t.reportsClients.title}</Text>
          <Text style={styles.subtitle}>{t.reportsClients.subtitle}</Text>
        </View>
      ) : null}

      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          placeholder={t.reportsClients.searchPlaceholder}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <ScrollView
        horizontal={isMobile}
        style={isMobile ? styles.tableScroll : styles.tableScrollDesktop}
        contentContainerStyle={
          isMobile ? styles.tableScrollContent : styles.tableScrollContentDesktop
        }
      >
        <View style={[styles.table, !isMobile && styles.tableFullWidth]}>
          <View style={[styles.row, styles.header]}>
            <Text style={[styles.cell, styles.cellClient]}>{t.reportsClients.table.client}</Text>
            <Text style={[styles.cell, styles.cellPhone]}>{t.reportsClients.table.phone}</Text>
            {renderSortableHeader(t.reportsClients.table.total, "total", styles.cellTotal)}
            {renderSortableHeader(t.reportsClients.table.scheduled, "scheduled", styles.cellStatus)}
            {renderSortableHeader(t.reportsClients.table.confirmed, "confirmed", styles.cellStatus)}
            {renderSortableHeader(t.reportsClients.table.show, "show", styles.cellStatus)}
            {renderSortableHeader(t.reportsClients.table.no_show, "no_show", styles.cellStatus)}
            {renderSortableHeader(t.reportsClients.table.canceled, "canceled", styles.cellStatus)}
            {renderSortableHeader(t.reportsClients.table.completed, "completed", styles.cellStatus)}
          </View>
          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color="#f43f5e" />
              <Text style={styles.loadingText}>{t.reportsClients.loading}</Text>
            </View>
          ) : error ? (
            <View style={styles.loadingRow}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : grouped.length === 0 ? (
            <View style={styles.loadingRow}>
              <Text style={styles.muted}>{t.reportsClients.empty}</Text>
            </View>
          ) : (
            grouped.map((g, idx) => (
              <View key={`${g.clientName}-${g.clientPhone}-${idx}`} style={styles.row}>
                <Text style={[styles.cell, styles.cellClient]} numberOfLines={1}>
                  {g.clientName}
                </Text>
                <Text style={[styles.cell, styles.cellPhone]} numberOfLines={1}>
                  {g.clientPhone || "—"}
                </Text>
                <Text style={[styles.cell, styles.cellTotal, styles.bold]}>{g.total}</Text>
                <Text style={[styles.cell, styles.cellStatus]}>{g.scheduled}</Text>
                <Text style={[styles.cell, styles.cellStatus]}>{g.confirmed}</Text>
                <Text style={[styles.cell, styles.cellStatus]}>{g.show}</Text>
                <Text style={[styles.cell, styles.cellStatus]}>{g.no_show}</Text>
                <Text style={[styles.cell, styles.cellStatus]}>{g.canceled}</Text>
                <Text style={[styles.cell, styles.cellStatus]}>{g.completed}</Text>
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
  searchBar: {
    marginBottom: 12
  },
  searchInput: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: "#fff"
  },
  tableScroll: {
    marginBottom: 12
  },
  tableScrollDesktop: {
    width: "100%"
  },
  tableScrollContent: {
    minWidth: 800
  },
  tableScrollContentDesktop: {
    width: "100%"
  },
  table: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    overflow: "hidden",
    minWidth: 800
  },
  tableFullWidth: {
    width: "100%"
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0"
  },
  header: {
    backgroundColor: "#f1f5f9"
  },
  cell: {
    fontSize: 13,
    color: "#0f172a"
  },
  headerTitle: {
    gap: 4,
    marginBottom: 12
  },
  headerText: {
    fontWeight: "700",
    color: "#0f172a"
  },
  cellClient: {
    width: 180,
    fontWeight: "700"
  },
  cellPhone: {
    width: 140
  },
  cellTotal: {
    width: 70,
    textAlign: "center"
  },
  cellStatus: {
    width: 110,
    textAlign: "center"
  },
  sortableHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    justifyContent: "center",
    paddingVertical: 4
  },
  bold: {
    fontWeight: "800"
  },
  sortIcon: {
    fontSize: 10,
    color: "#0f172a"
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
