import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions
} from "react-native";

import { useAuth } from "../auth/AuthContext";
import { API_BASE_URL } from "../config";
import {
  ProfessionalOption,
  ProfessionalSchedule,
  ProfessionalServiceOption
} from "../types/appointments";

const dayLabels: Record<string, string> = {
  monday: "Lun",
  tuesday: "Mar",
  wednesday: "Mié",
  thursday: "Jue",
  friday: "Vie",
  saturday: "Sáb",
  sunday: "Dom",
  lunes: "Lun",
  martes: "Mar",
  miercoles: "Mié",
  miércoles: "Mié",
  jueves: "Jue",
  viernes: "Vie",
  sabado: "Sáb",
  sábado: "Sáb",
  domingo: "Dom"
};

const formatDays = (schedule?: ProfessionalOption["schedule"]) => {
  if (!schedule?.length) return "Sin horario asignado";
  const uniques = Array.from(
    new Set(
      schedule
        .map((entry) => entry?.day?.toLowerCase?.() ?? "")
        .filter(Boolean)
        .map((d) => dayLabels[d] ?? d.slice(0, 3))
    )
  );
  return uniques.join(", ");
};

export const StaffScreen = () => {
  const {
    session: { tokens, user }
  } = useAuth();
  const { width } = useWindowDimensions();
  const isMobile = width < 1024;
  const clientId = user.client;
  const [staff, setStaff] = useState<ProfessionalOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<ProfessionalOption | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [formServices, setFormServices] = useState<ProfessionalServiceOption[]>([]);
  const [activeTab, setActiveTab] = useState<"info" | "services" | "schedule">("info");
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [servicePrice, setServicePrice] = useState<string>("");
  const [serviceDropdownOpen, setServiceDropdownOpen] = useState(false);
  const [slotDropdownOpen, setSlotDropdownOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<number>(1); // each slot = 15min
  const dayTemplate: { key: string; label: string }[] = [
    { key: "monday", label: "Lunes" },
    { key: "tuesday", label: "Martes" },
    { key: "wednesday", label: "Miércoles" },
    { key: "thursday", label: "Jueves" },
    { key: "friday", label: "Viernes" },
    { key: "saturday", label: "Sábado" },
    { key: "sunday", label: "Domingo" }
  ];
  const [scheduleRows, setScheduleRows] = useState<
    { day: string; label: string; active: boolean; start: string; end: string }[]
  >(
    dayTemplate.map((d) => ({
      ...d,
      day: d.key,
      active: false,
      start: "06:00",
      end: "20:00"
    }))
  );
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const headers = useMemo(
    () => ({
      Authorization: `Bearer ${tokens.accessToken}`,
      "Content-Type": "application/json"
    }),
    [tokens.accessToken]
  );

  useEffect(() => {
    const load = async () => {
      if (!clientId) {
        setStaff([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_BASE_URL}/app/clients/${clientId}/professionals`, {
          headers
        });
        if (!response.ok) {
          throw new Error("No se pudo cargar el personal.");
        }
        const data = (await response.json()) as { professionals?: ProfessionalOption[] };
        setStaff(data.professionals ?? []);
      } catch (err) {
        setError((err as Error).message);
        setStaff([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [clientId, headers]);

  const openCreateModal = () => {
    setEditing(null);
    setForm({ name: "", email: "", phone: "" });
    setFormServices([]);
    setActiveTab("info");
    setSelectedServiceId(null);
    setServicePrice("");
    setSelectedSlot(1);
    setServiceDropdownOpen(false);
    setSlotDropdownOpen(false);
    setScheduleRows(
      dayTemplate.map((d) => ({
        ...d,
        day: d.key,
        active: false,
        start: "06:00",
        end: "20:00"
      }))
    );
    setModalVisible(true);
  };

  const openEditModal = (pro: ProfessionalOption) => {
    setEditing(pro);
    setForm({
      name: pro.name ?? "",
      email: pro.email ?? "",
      phone: pro.phone ?? ""
    });
    setFormServices(pro.services ?? []);
    setActiveTab("info");
    setSelectedServiceId(null);
    setServicePrice("");
    setSelectedSlot(1);
    setServiceDropdownOpen(false);
    setSlotDropdownOpen(false);
    const scheduleMap = new Map<string, ProfessionalSchedule>(
      (pro.schedule ?? []).map((s) => [s.day?.toLowerCase?.() ?? "", s])
    );
    setScheduleRows(
      dayTemplate.map((d) => {
        const found = scheduleMap.get(d.key);
        return {
          ...d,
          day: d.key,
          active: Boolean(found),
          start: found?.start ?? "06:00",
          end: found?.end ?? "20:00"
        };
      })
    );
    setModalVisible(true);
  };

  const closeModal = () => {
    setSaveError(null);
    setSaving(false);
    setModalVisible(false);
  };

  const aggregatedServiceOptions = useMemo(() => {
    const all = staff.flatMap((p) => p.services ?? []);
    const uniqueMap = new Map<string, ProfessionalServiceOption>();
    all.forEach((s) => {
      if (s?._id && !uniqueMap.has(s._id)) {
        uniqueMap.set(s._id, s);
      }
    });
    return Array.from(uniqueMap.values());
  }, [staff]);

  const handleAddService = () => {
    if (!selectedServiceId) return;
    const existing = formServices.find((s) => s._id === selectedServiceId);
    if (existing) return;
    const base = aggregatedServiceOptions.find((s) => s._id === selectedServiceId);
    if (!base) return;
    const priceNumber = Number.parseFloat(servicePrice || "0");
    setFormServices((prev) => [...prev, { ...base, price: priceNumber, slot: selectedSlot }]);
    setSelectedServiceId(null);
    setServicePrice("");
    setServiceDropdownOpen(false);
    setSlotDropdownOpen(false);
    setSelectedSlot(1);
  };

  const handleDeleteProfessional = async () => {
    if (!editing?._id) {
      return;
    }
    const confirmed =
      Platform.OS === "web"
        ? window.confirm("¿Estás seguro de eliminar este profesional?")
        : await new Promise<boolean>((resolve) => {
            Alert.alert("Eliminar", "¿Estás seguro de eliminar este profesional?", [
              { text: "Cancelar", style: "cancel", onPress: () => resolve(false) },
              { text: "Eliminar", style: "destructive", onPress: () => resolve(true) }
            ]);
          });
    if (!confirmed) {
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      const response = await fetch(
        `${API_BASE_URL}/app/clients/${clientId}/professionals/${editing._id}`,
        {
          method: "DELETE",
          headers
        }
      );
      if (!response.ok) {
        throw new Error("No se pudo eliminar el profesional.");
      }
      setStaff((prev) => prev.filter((pro) => pro._id !== editing._id));
      closeModal();
    } catch (err) {
      setSaveError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveProfessional = async () => {
    if (!form.name.trim()) {
      setSaveError("El nombre es requerido.");
      setActiveTab("info");
      return;
    }
    const schedule: ProfessionalSchedule[] = scheduleRows
      .filter((row) => row.active)
      .map((row) => ({
        day: row.day,
        start: row.start,
        end: row.end
      }));
    const professionalPayload: ProfessionalOption = {
      _id: editing?._id ?? `temp-${Date.now()}`,
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      services: formServices,
      schedule
    };
    setSaving(true);
    setSaveError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/app/clients/${clientId}/professionals`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          professionalId: editing?._id,
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          services: formServices.map((service) => ({
            serviceId: service._id,
            price: Number(service.price ?? 0),
            slot: service.slot ?? 1
          })),
          schedule
        })
      });
      if (!response.ok) {
        throw new Error("No se pudo guardar el profesional.");
      }
      const data = await response.json();
      const newStaff = (data?.professionals as ProfessionalOption[]) ?? [professionalPayload];
      setStaff(newStaff);
      closeModal();
    } catch (err) {
      setSaveError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveService = (id: string) => {
    setFormServices((prev) => prev.filter((s) => s._id !== id));
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {!isMobile ? (
        <View style={styles.headerRow}>
          <View style={styles.headerText}>
            <Text style={styles.title}>Gestión de Personal</Text>
            <Text style={styles.subtitle}>Administra el equipo del salón</Text>
          </View>
        </View>
      ) : null}
      <View style={styles.headerActions}>
        <TouchableOpacity style={styles.newButton} onPress={openCreateModal}>
          <Text style={styles.newButtonIcon}>＋</Text>
          <Text style={styles.newButtonLabel}>Nuevo Personal</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator color="#f43f5e" />
          <Text style={styles.loadingText}>Cargando personal…</Text>
        </View>
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <View style={[styles.grid, isMobile && { flexDirection: "column", gap: 16 }]}>
          {staff.map((pro) => (
            <View
              key={pro._id}
              style={[styles.card, !isMobile && { maxWidth: "32%", minWidth: "32%" }]}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.name}>{pro.name}</Text>
                <View style={styles.cardActions}>
                  <TouchableOpacity onPress={() => openEditModal(pro)}>
                    <Text style={styles.actionIcon}>✏️</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {pro.email ? (
                <View style={styles.infoRow}>
                  <Text style={styles.infoIcon}>✉️</Text>
                  <Text style={styles.infoText}>{pro.email}</Text>
                </View>
              ) : null}
              {pro.phone ? (
                <View style={styles.infoRow}>
                  <Text style={styles.infoIcon}>📞</Text>
                  <Text style={styles.infoText}>{pro.phone}</Text>
                </View>
              ) : null}

              <Text style={styles.sectionLabel}>Servicios:</Text>
              <View style={styles.tagsRow}>
                {(pro.services ?? []).map((service) => (
                  <View key={service._id} style={styles.tag}>
                    <Text style={styles.tagText}>{service.name}</Text>
                  </View>
                ))}
              </View>

              <Text style={styles.sectionLabel}>Días laborales:</Text>
              <Text style={styles.infoText}>{formatDays(pro.schedule)}</Text>
            </View>
          ))}
        </View>
      )}

      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, isMobile && styles.modalCardMobile]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editing ? "Editar personal" : "Nuevo personal"}
              </Text>
              <TouchableOpacity onPress={closeModal}>
                <Text style={styles.closeIcon}>✕</Text>
              </TouchableOpacity>
            </View>
            {saveError ? <Text style={styles.errorText}>{saveError}</Text> : null}

            <View style={styles.tabBar}>
              <TouchableOpacity
                style={[styles.tabButton, activeTab === "info" && styles.tabButtonActive]}
                onPress={() => setActiveTab("info")}
              >
                <Text style={[styles.tabLabel, activeTab === "info" && styles.tabLabelActive]}>
                  Información Personal
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tabButton, activeTab === "services" && styles.tabButtonActive]}
                onPress={() => setActiveTab("services")}
              >
                <Text style={[styles.tabLabel, activeTab === "services" && styles.tabLabelActive]}>
                  Servicios
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tabButton, activeTab === "schedule" && styles.tabButtonActive]}
                onPress={() => setActiveTab("schedule")}
              >
                <Text style={[styles.tabLabel, activeTab === "schedule" && styles.tabLabelActive]}>
                  Horarios
                </Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.modalBody, { zIndex: 10 }]}>
              {activeTab === "info" ? (
                <>
                  <View
                    style={[styles.fieldRow, isMobile && styles.fieldRowMobile, styles.serviceRow]}
                  >
                    <View style={[styles.fieldColumn, styles.fieldColumnHalf]}>
                      <Text style={styles.inputLabel}>Nombre</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Nombre completo"
                        value={form.name}
                        onChangeText={(text) => setForm((prev) => ({ ...prev, name: text }))}
                      />
                    </View>
                    <View style={[styles.fieldColumn, styles.fieldColumnHalf]}>
                      <Text style={styles.inputLabel}>Teléfono</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="+1 555 555 5555"
                        value={form.phone}
                        onChangeText={(text) => setForm((prev) => ({ ...prev, phone: text }))}
                      />
                    </View>
                  </View>

                  <View style={styles.fieldColumn}>
                    <Text style={styles.inputLabel}>Email</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="correo@correo.com"
                      value={form.email}
                      onChangeText={(text) => setForm((prev) => ({ ...prev, email: text }))}
                    />
                  </View>
                </>
              ) : null}

              {activeTab === "services" ? (
                <>
                  <View style={[{ gap: 24 }]}>
                    <View style={[!isMobile ? styles.fieldColumn : { gap: 6 }, { zIndex: 20 }]}>
                      <Text style={styles.inputLabel}>Agregar servicio</Text>
                      <View
                        style={[
                          styles.fieldRow,
                          isMobile && styles.fieldRowMobile,
                          styles.serviceRow
                        ]}
                      >
                        <View
                          style={[
                            !isMobile && styles.fieldColumn,
                            !isMobile && styles.fieldColumnGrow2,
                            { zIndex: 30 }
                          ]}
                        >
                          <View style={styles.dropdownField}>
                            <TouchableOpacity
                              style={styles.dropdownButton}
                              onPress={() => setServiceDropdownOpen((prev) => !prev)}
                            >
                              <Text style={styles.dropdownButtonText}>
                                {aggregatedServiceOptions.find((s) => s._id === selectedServiceId)
                                  ?.name ?? "Selecciona servicio"}
                              </Text>
                              <Text style={styles.dropdownButtonIcon}>
                                {serviceDropdownOpen ? "▲" : "▼"}
                              </Text>
                            </TouchableOpacity>
                            {serviceDropdownOpen ? (
                              <View style={styles.dropdownList}>
                                <ScrollView style={styles.dropdownScroll}>
                                  {aggregatedServiceOptions.map((service) => (
                                    <TouchableOpacity
                                      key={service._id}
                                      style={styles.dropdownItemInline}
                                      onPress={() => {
                                        setSelectedServiceId(service._id);
                                        setServiceDropdownOpen(false);
                                      }}
                                    >
                                      <Text style={styles.dropdownItemText}>{service.name}</Text>
                                    </TouchableOpacity>
                                  ))}
                                </ScrollView>
                              </View>
                            ) : null}
                          </View>
                        </View>
                        <View
                          style={[
                            !isMobile && styles.fieldColumn,
                            !isMobile && styles.fieldColumnQuarter,
                            { zIndex: 25 }
                          ]}
                        >
                          <View style={styles.dropdownField}>
                            <TouchableOpacity
                              style={styles.dropdownButton}
                              onPress={() => setSlotDropdownOpen((prev) => !prev)}
                            >
                              <Text style={styles.dropdownButtonText}>{selectedSlot * 15} min</Text>
                              <Text style={styles.dropdownButtonIcon}>
                                {slotDropdownOpen ? "▲" : "▼"}
                              </Text>
                            </TouchableOpacity>
                            {slotDropdownOpen ? (
                              <View style={styles.dropdownList}>
                                <ScrollView style={styles.dropdownScroll}>
                                  {Array.from({ length: 32 }).map((_, idx) => {
                                    const slot = idx + 1;
                                    const minutes = slot * 15;
                                    return (
                                      <TouchableOpacity
                                        key={slot}
                                        style={styles.dropdownItemInline}
                                        onPress={() => {
                                          setSelectedSlot(slot);
                                          setSlotDropdownOpen(false);
                                        }}
                                      >
                                        <Text style={styles.dropdownItemText}>{minutes} min</Text>
                                      </TouchableOpacity>
                                    );
                                  })}
                                </ScrollView>
                              </View>
                            ) : null}
                          </View>
                        </View>
                        <View
                          style={[
                            !isMobile && styles.fieldColumn,
                            !isMobile && styles.fieldColumnQuarter
                          ]}
                        >
                          <TextInput
                            style={styles.input}
                            placeholder="Precio"
                            keyboardType="numeric"
                            value={servicePrice}
                            onChangeText={setServicePrice}
                          />
                        </View>
                        <View style={[styles.fieldColumn, styles.fieldColumnQuarter]}>
                          <TouchableOpacity
                            style={[styles.primaryButton, styles.addButton]}
                            onPress={handleAddService}
                          >
                            <Text style={styles.primaryButtonText}>Agregar</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                    <View style={[styles.fieldColumn]}>
                      <Text style={styles.inputLabel}>Servicios agregados</Text>
                      <View style={styles.tagsRow}>
                        {formServices.length === 0 ? (
                          <Text style={styles.infoText}>Sin servicios asignados</Text>
                        ) : (
                          formServices.map((service) => (
                            <View key={service._id} style={styles.serviceChip}>
                              <Text style={styles.tagText}>
                                {service.name}{" "}
                                {service.price ? `- $${Number(service.price).toFixed(2)}` : ""}{" "}
                                {service.slot ? `· ${service.slot * 15} min` : ""}
                              </Text>
                              <TouchableOpacity onPress={() => handleRemoveService(service._id)}>
                                <Text style={styles.removeIcon}>✕</Text>
                              </TouchableOpacity>
                            </View>
                          ))
                        )}
                      </View>
                    </View>
                  </View>
                </>
              ) : null}

              {activeTab === "schedule" ? (
                <ScrollView
                  style={styles.scheduleScroll}
                  contentContainerStyle={styles.scheduleList}
                >
                  {scheduleRows.map((row, idx) => (
                    <View key={`${row.day || row.label}-${idx}`} style={styles.scheduleCard}>
                      <View style={styles.scheduleHeader}>
                        <TouchableOpacity
                          style={[styles.checkBox, row.active && styles.checkBoxActive]}
                          onPress={() =>
                            setScheduleRows((prev) =>
                              prev.map((r, i) => (i === idx ? { ...r, active: !r.active } : r))
                            )
                          }
                        >
                          {row.active ? <Text style={styles.checkIcon}>✔</Text> : null}
                        </TouchableOpacity>
                        <Text style={styles.scheduleDay}>{row.label}</Text>
                      </View>
                      <View style={[styles.fieldRow]}>
                        <View style={[styles.fieldColumn, styles.fieldColumnHalf]}>
                          <Text style={styles.inputLabel}>Inicio</Text>
                          <TextInput
                            style={styles.input}
                            value={row.start}
                            onChangeText={(text) =>
                              setScheduleRows((prev) =>
                                prev.map((r, i) => (i === idx ? { ...r, start: text } : r))
                              )
                            }
                            placeholder="06:00"
                          />
                        </View>
                        <View style={[styles.fieldColumn, styles.fieldColumnHalf]}>
                          <Text style={styles.inputLabel}>Fin</Text>
                          <TextInput
                            style={styles.input}
                            value={row.end}
                            onChangeText={(text) =>
                              setScheduleRows((prev) =>
                                prev.map((r, i) => (i === idx ? { ...r, end: text } : r))
                              )
                            }
                            placeholder="20:00"
                          />
                        </View>
                      </View>
                    </View>
                  ))}
                </ScrollView>
              ) : null}
            </View>

            <View style={styles.modalFooter}>
              {editing ? (
                <View style={styles.footerLeft}>
                  <TouchableOpacity
                    style={[styles.secondaryButton, styles.dangerOutline, styles.fullWidth]}
                    onPress={handleDeleteProfessional}
                    disabled={saving}
                  >
                    <Text style={[styles.secondaryButtonText, styles.dangerOutlineText]}>
                      Eliminar
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : null}
              <View style={styles.footerRight}>
                <TouchableOpacity style={styles.secondaryButton} onPress={closeModal}>
                  <Text style={styles.secondaryButtonText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.primaryButton, saving && styles.primaryButtonDisabled]}
                  onPress={handleSaveProfessional}
                  disabled={saving}
                >
                  <Text style={styles.primaryButtonText}>
                    {saving ? "Guardando..." : "Guardar"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  content: {
    paddingBottom: 32
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12
  },
  headerText: {
    gap: 4
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
  headerActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 20
  },
  newButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#f43f5e",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12
  },
  newButtonIcon: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700"
  },
  newButtonLabel: {
    color: "#fff",
    fontWeight: "700"
  },
  loadingState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
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
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16
  },
  card: {
    flexGrow: 1,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    gap: 10
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start"
  },
  name: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0f172a",
    flexShrink: 1
  },
  cardActions: {
    flexDirection: "row",
    gap: 10
  },
  actionIcon: {
    fontSize: 16,
    color: "#0f172a"
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  infoIcon: {
    fontSize: 14,
    color: "#475569"
  },
  infoText: {
    color: "#334155",
    fontWeight: "600"
  },
  sectionLabel: {
    marginTop: 4,
    color: "#334155",
    fontWeight: "700"
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  tag: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999
  },
  tagText: {
    color: "#0f172a",
    fontWeight: "700",
    fontSize: 12
  },
  serviceChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999
  },
  removeIcon: {
    color: "#ef4444",
    fontWeight: "700"
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16
  },
  modalCard: {
    width: 640,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    gap: 12
  },
  modalCardMobile: {
    width: "100%"
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0f172a"
  },
  closeIcon: {
    fontSize: 18,
    color: "#475569"
  },
  modalBody: {
    gap: 10
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 4,
    gap: 6
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    textAlign: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 10
  },
  tabButtonActive: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0"
  },
  tabLabel: {
    color: "#475569",
    fontWeight: "700"
  },
  tabLabelActive: {
    color: "#0f172a"
  },
  fieldRow: {
    flexDirection: "row",
    gap: 12
  },
  fieldRowMobile: {
    flexDirection: "column"
  },
  serviceRow: {
    position: "relative",
    zIndex: 30
  },
  fieldColumn: {
    flex: 1,
    gap: 6
  },
  fieldColumnHalf: {
    flexBasis: "50%"
  },
  fieldColumnGrow2: {
    flexBasis: "50%"
  },
  fieldColumnQuarter: {
    flexBasis: "25%",
    justifyContent: "flex-end"
  },
  dropdownField: {
    position: "relative"
  },
  dropdownButton: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8
  },
  dropdownButtonText: {
    color: "#0f172a",
    fontWeight: "600"
  },
  dropdownButtonIcon: {
    color: "#475569",
    fontSize: 14
  },
  dropdownList: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    marginTop: 6,
    shadowColor: "#0f172a",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
    zIndex: 20
  },
  dropdownScroll: {
    maxHeight: 180
  },
  dropdownItemInline: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderColor: "#f1f5f9"
  },
  dropdownItemText: {
    color: "#0f172a",
    fontWeight: "600"
  },
  inputLabel: {
    fontWeight: "700",
    color: "#334155"
  },
  input: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 12,
    backgroundColor: "#fff"
  },
  modalFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    marginTop: 8
  },
  footerLeft: {
    alignItems: "flex-start"
  },
  footerRight: {
    flexDirection: "row",
    gap: 10
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20
  },
  secondaryButtonText: {
    fontWeight: "700",
    color: "#0f172a"
  },
  primaryButton: {
    backgroundColor: "#f43f5e",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "700",
    textAlign: "center"
  },
  dangerOutline: {
    borderColor: "#ef4444",
    borderWidth: 1,
    backgroundColor: "#fff"
  },
  dangerOutlineText: {
    color: "#ef4444",
    fontWeight: "700"
  },
  fullWidth: {
    width: "100%"
  },
  addButton: {
    width: "100%",
    alignItems: "center"
  },
  scheduleList: {
    gap: 12
  },
  scheduleScroll: {
    maxHeight: 420
  },
  scheduleCard: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 12,
    backgroundColor: "#fff",
    gap: 10
  },
  scheduleHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  checkBox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "#f87171",
    alignItems: "center",
    justifyContent: "center"
  },
  checkBoxActive: {
    backgroundColor: "#f87171"
  },
  checkIcon: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700"
  },
  scheduleDay: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a"
  }
});
