import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions
} from "react-native";

import { useAuth } from "../auth/AuthContext";
import { API_BASE_URL } from "../config";
import { User } from "../types/user";

const PAGE_CHUNK = 20;

export const ClientsScreen = () => {
  const {
    session: { tokens }
  } = useAuth();
  const token = tokens.accessToken;
  const { width } = useWindowDimensions();
  const isMobile = width < 1024;

  const [clients, setClients] = useState<User[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [loadingInitial, setLoadingInitial] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [displayCount, setDisplayCount] = useState(PAGE_CHUNK);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const endReachedLock = useRef(true);

  const loadClients = useCallback(async () => {
    if (!token) {
      return;
    }
    setLoadingInitial(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/client/users`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error("No se pudieron cargar los clientes");
      }
      const data = (await response.json()) as User[];
      const sortedData = [...data].sort((a, b) =>
        (a.name ?? "").localeCompare(b.name ?? "", "es", { sensitivity: "base" })
      );
      setClients(sortedData);
      setDisplayCount(Math.min(PAGE_CHUNK, data.length));
      endReachedLock.current = false;
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoadingInitial(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  const handleRefresh = () => {
    if (loadingInitial) {
      return;
    }
    setRefreshing(true);
    loadClients();
  };

  const columns = isMobile ? 1 : 3;

  const openCreateModal = () => {
    setEditingUser(null);
    setForm({ name: "", email: "", phone: "" });
    setFormError(null);
    setModalVisible(true);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setForm({
      name: user.name ?? "",
      email: user.email ?? "",
      phone: user.phone ?? ""
    });
    setFormError(null);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSaving(false);
    setFormError(null);
  };

  const handleSaveClient = async () => {
    if (!form.name.trim()) {
      setFormError("El nombre es obligatorio.");
      return;
    }
    if (!form.phone.trim()) {
      setFormError("El teléfono es obligatorio.");
      return;
    }
    if (!token) {
      setFormError("Sesión inválida. Inicia sesión nuevamente.");
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const payload = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        ...(form.email.trim() ? { email: form.email.trim() } : {})
      };
      const method = editingUser ? "PATCH" : "POST";
      const url = editingUser
        ? `${API_BASE_URL}/client/users/${editingUser._id}`
        : `${API_BASE_URL}/client/users`;
      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        throw new Error("No se pudo guardar el cliente.");
      }
      await loadClients();
      closeModal();
    } catch (err) {
      setFormError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClient = async () => {
    if (!editingUser || !token) {
      return;
    }
    const confirmed =
      Platform.OS === "web"
        ? window.confirm("¿Eliminar este cliente?")
        : await new Promise<boolean>((resolve) => {
            Alert.alert("Eliminar", "¿Eliminar este cliente?", [
              { text: "Cancelar", style: "cancel", onPress: () => resolve(false) },
              { text: "Eliminar", style: "destructive", onPress: () => resolve(true) }
            ]);
          });
    if (!confirmed) {
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/client/users/${editingUser._id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error("No se pudo eliminar el cliente.");
      }
      await loadClients();
      closeModal();
    } catch (err) {
      setFormError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const renderItem = ({ item }: { item: User }) => (
    <TouchableOpacity
      style={[styles.card, isMobile ? styles.cardFull : styles.cardThird]}
      onPress={() => openEditModal(item)}
      activeOpacity={0.85}
    >
      <Text style={styles.cardName}>{item.name}</Text>
      {item.email ? (
        <View style={styles.contactRow}>
          <Text style={styles.contactIcon}>✉️</Text>
          <Text style={styles.cardDetail}>{item.email}</Text>
        </View>
      ) : (
        <View style={styles.contactRow}>
          <Text style={styles.contactIconMuted}>✉️</Text>
          <Text style={styles.cardDetailMuted}>Sin correo</Text>
        </View>
      )}
      {item.phone ? (
        <View style={styles.contactRow}>
          <Text style={styles.contactIcon}>📞</Text>
          <Text style={styles.cardDetail}>{item.phone}</Text>
        </View>
      ) : null}
      <Text style={styles.registeredText}>
        Registrado:{" "}
        {new Date(item.createdAt ?? item.updatedAt ?? Date.now()).toLocaleDateString("es-ES", {
          day: "2-digit",
          month: "short",
          year: "numeric"
        })}
      </Text>
    </TouchableOpacity>
  );

  const filteredClients = useMemo(() => {
    if (!searchInput.trim()) {
      return clients;
    }
    const query = searchInput.trim().toLowerCase();
    return clients.filter((client) => {
      const haystack =
        `${client.name ?? ""} ${client.email ?? ""} ${client.phone ?? ""}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [clients, searchInput]);

  const handleLoadMore = () => {
    if (displayCount >= filteredClients.length) {
      endReachedLock.current = true;
      return;
    }

    endReachedLock.current = true;
    setLoadingMore(true);

    setTimeout(() => {
      setDisplayCount((prev) => {
        const newCount = Math.min(prev + PAGE_CHUNK, filteredClients.length);
        return newCount;
      });
      setLoadingMore(false);
    }, 300);
  };

  useEffect(() => {
    setDisplayCount(Math.min(PAGE_CHUNK, filteredClients.length || PAGE_CHUNK));
    endReachedLock.current = false;
  }, [filteredClients.length]);

  const visibleClients = useMemo(
    () => filteredClients.slice(0, Math.min(displayCount, filteredClients.length)),
    [filteredClients, displayCount]
  );

  const listEmpty = useMemo(() => {
    if (loadingInitial) {
      return (
        <View style={styles.stateView}>
          <ActivityIndicator color="#f43f5e" />
          <Text style={styles.stateText}>Cargando clientes…</Text>
        </View>
      );
    }
    if (error) {
      return (
        <View style={styles.stateView}>
          <Text style={[styles.stateText, styles.errorText]}>Error: {error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => loadClients()}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <View style={styles.stateView}>
        <Text style={styles.stateText}>Sin clientes para mostrar</Text>
      </View>
    );
  }, [loadingInitial, error, loadClients]);

  return (
    <View style={styles.container}>
      <View style={[styles.headerRow, isMobile && styles.headerRowMobile]}>
        {!isMobile ? (
          <View style={styles.headerText}>
            <Text style={styles.title}>Gestión de Clientes</Text>
            <Text style={styles.subtitle}>Gestiona tu lista de clientes</Text>
          </View>
        ) : null}
        <TouchableOpacity
          style={[styles.addButton, isMobile && styles.addButtonMobile]}
          onPress={openCreateModal}
        >
          <Text style={styles.addButtonText}>+ Nuevo Cliente</Text>
        </TouchableOpacity>
      </View>
      <View
        style={[
          styles.searchContainer,
          styles.searchBelow,
          isMobile && styles.searchContainerMobile
        ]}
      >
        <TextInput
          placeholder="Buscar por nombre, email o teléfono"
          value={searchInput}
          onChangeText={setSearchInput}
          style={styles.searchInput}
        />
        {searchInput ? (
          <TouchableOpacity onPress={() => setSearchInput("")} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>✕</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <FlatList
        data={visibleClients}
        key={columns}
        numColumns={columns}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={!isMobile ? styles.columnWrapper : undefined}
        renderItem={renderItem}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        scrollEnabled={true}
        onMomentumScrollBegin={() => {
          endReachedLock.current = false;
        }}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.footerLoading}>
              <ActivityIndicator color="#f43f5e" />
            </View>
          ) : null
        }
        ListEmptyComponent={listEmpty}
        style={{ height: 300 }}
      />

      <Modal transparent visible={modalVisible} animationType="fade" onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, isMobile && styles.modalCardMobile]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingUser ? "Editar Cliente" : "Nuevo Cliente"}
              </Text>
              <TouchableOpacity onPress={closeModal}>
                <Text style={styles.closeIcon}>✕</Text>
              </TouchableOpacity>
            </View>
            {formError ? <Text style={styles.modalError}>{formError}</Text> : null}
            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>Nombre *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Nombre completo"
                value={form.name}
                onChangeText={(text) => setForm((prev) => ({ ...prev, name: text }))}
              />
              <Text style={styles.inputLabel}>Teléfono *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="+58 000 000 0000"
                value={form.phone}
                onChangeText={(text) => setForm((prev) => ({ ...prev, phone: text }))}
              />
              <Text style={styles.inputLabel}>Email (opcional)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="correo@cliente.com"
                autoCapitalize="none"
                keyboardType="email-address"
                value={form.email}
                onChangeText={(text) => setForm((prev) => ({ ...prev, email: text }))}
              />
            </View>
            <View style={styles.modalFooter}>
              {editingUser ? (
                <TouchableOpacity
                  style={[styles.secondaryButton, styles.dangerOutline]}
                  onPress={handleDeleteClient}
                  disabled={saving}
                >
                  <Text style={[styles.secondaryButtonText, styles.dangerText]}>Eliminar</Text>
                </TouchableOpacity>
              ) : (
                <View />
              )}
              <View style={styles.modalFooterActions}>
                <TouchableOpacity style={styles.secondaryButton} onPress={closeModal}>
                  <Text style={styles.secondaryButtonText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.primaryButton, saving && styles.primaryButtonDisabled]}
                  onPress={handleSaveClient}
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  headerText: {
    gap: 4
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12
  },
  headerRowMobile: {
    flexDirection: "column"
  },
  addButton: {
    backgroundColor: "#f43f5e",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12
  },
  addButtonMobile: {
    marginTop: 12,
    alignSelf: "stretch",
    alignItems: "center"
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "700"
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
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    minWidth: 280
  },
  searchContainerMobile: {
    width: "100%"
  },
  searchBelow: {
    marginTop: 12,
    marginBottom: 12,
    width: "100%"
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16
  },
  modalCard: {
    width: 520,
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
    justifyContent: "space-between",
    alignItems: "center"
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0f172a"
  },
  closeIcon: {
    fontSize: 20,
    color: "#475569"
  },
  modalError: {
    color: "#ef4444",
    fontWeight: "600"
  },
  modalBody: {
    gap: 12
  },
  inputLabel: {
    fontWeight: "700",
    color: "#334155"
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#fff"
  },
  modalFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8
  },
  modalFooterActions: {
    flexDirection: "row",
    gap: 10
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    borderWidth: 0,
    outlineStyle: "none"
  },
  clearButton: {
    padding: 4
  },
  clearButtonText: {
    fontSize: 14,
    color: "#475569"
  },
  listContent: {
    paddingBottom: 40,
    gap: 16
  },
  columnWrapper: {
    gap: 16,
    justifyContent: "flex-start"
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    gap: 6
  },
  cardFull: {
    width: "100%"
  },
  cardThird: {
    width: "32%"
  },
  cardName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a"
  },
  cardDetail: {
    color: "#334155",
    fontWeight: "600"
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  contactIcon: {
    fontSize: 14
  },
  contactIconMuted: {
    fontSize: 14,
    color: "#94a3b8"
  },
  cardDetailMuted: {
    color: "#94a3b8",
    fontWeight: "600"
  },
  cardBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(244,63,94,0.1)",
    marginTop: 6
  },
  cardBadgeText: {
    color: "#be123c",
    fontWeight: "700",
    fontSize: 12
  },
  registeredText: {
    marginTop: 6,
    color: "#475569",
    fontSize: 13,
    fontWeight: "600"
  },
  stateView: {
    paddingVertical: 40,
    alignItems: "center",
    justifyContent: "center",
    gap: 8
  },
  stateText: {
    color: "#475569",
    fontWeight: "600"
  },
  errorText: {
    color: "#ef4444"
  },
  retryButton: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8
  },
  retryText: {
    color: "#0f172a",
    fontWeight: "600"
  },
  footerLoading: {
    paddingVertical: 16
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10
  },
  secondaryButtonText: {
    color: "#0f172a",
    fontWeight: "600"
  },
  primaryButton: {
    backgroundColor: "#f43f5e",
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12
  },
  primaryButtonDisabled: {
    opacity: 0.6
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "700"
  },
  dangerOutline: {
    borderColor: "#ef4444",
    borderWidth: 1
  },
  dangerText: {
    color: "#ef4444",
    fontWeight: "700"
  }
});
