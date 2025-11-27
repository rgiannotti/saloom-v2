import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Switch,
  useWindowDimensions
} from "react-native";

import { useAuth } from "../auth/AuthContext";
import { API_BASE_URL } from "../config";

type ProUser = {
  _id: string;
  name: string;
  email?: string;
  phone: string;
  roles: string[];
};

type SubSection = "profile" | "users";

type ClientInfo = {
  _id: string;
  rif: string;
  denomination: string;
  name: string;
  person: string;
  email: string;
  phone: string;
  website?: string;
  useGoogleMap?: boolean;
  home?: boolean;
  blocked?: boolean;
  address?: { full?: string };
};

export const SettingsScreen = () => {
  const {
    session: { user, tokens },
    updateSessionUser
  } = useAuth();
  const { width } = useWindowDimensions();
  const isMobile = width < 1024;
  const clientId = user.client;

  const [activeSection, setActiveSection] = useState<SubSection>("profile");

  const [proUsers, setProUsers] = useState<ProUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<ProUser | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [profileForm, setProfileForm] = useState({
    name: user.name ?? "",
    email: user.email ?? "",
    phone: user.phone ?? ""
  });
  const [clientForm, setClientForm] = useState<ClientInfo | null>(null);

  const headers = useMemo(
    () => ({
      Authorization: `Bearer ${tokens.accessToken}`,
      "Content-Type": "application/json"
    }),
    [tokens.accessToken]
  );

  const loadProfileData = useCallback(async () => {
    setProfileError(null);
    try {
      const resp = await fetch(`${API_BASE_URL}/app/clients/me`, { headers });
      if (!resp.ok) {
        throw new Error("No se pudo cargar la información del cliente");
      }
      const data = (await resp.json()) as ClientInfo;
      setClientForm(data);
      setProfileForm({
        name: user.name ?? "",
        email: user.email ?? "",
        phone: user.phone ?? ""
      });
    } catch (err) {
      setProfileError((err as Error).message);
    }
  }, [API_BASE_URL, headers, user.email, user.name, user.phone]);

  const loadProUsers = useCallback(async () => {
    if (!clientId) {
      setProUsers([]);
      return;
    }
    setLoadingUsers(true);
    setUsersError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/app/users?clientId=${clientId}&roles=pro`, {
        headers
      });
      if (!response.ok) {
        throw new Error("No se pudieron cargar los usuarios PRO");
      }
      const data = (await response.json()) as ProUser[];
      setProUsers(data);
    } catch (err) {
      setUsersError((err as Error).message);
      setProUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  }, [clientId, headers]);

  useEffect(() => {
    if (activeSection === "users") {
      loadProUsers();
    } else {
      loadProfileData();
    }
  }, [activeSection, loadProUsers, loadProfileData]);

  const openCreateModal = () => {
    setEditingUser(null);
    setForm({ name: "", email: "", phone: "", password: "" });
    setFormError(null);
    setModalVisible(true);
  };

  const openEditModal = (userToEdit: ProUser) => {
    setEditingUser(userToEdit);
    setForm({
      name: userToEdit.name ?? "",
      email: userToEdit.email ?? "",
      phone: userToEdit.phone ?? "",
      password: ""
    });
    setFormError(null);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSaving(false);
    setFormError(null);
  };

  const handleSaveUser = async () => {
    if (!form.name.trim()) {
      setFormError("El nombre es obligatorio.");
      return;
    }
    if (!form.phone.trim()) {
      setFormError("El teléfono es obligatorio.");
      return;
    }
    if (!clientId) {
      setFormError("Sesión inválida: cliente no encontrado.");
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const payload: Record<string, unknown> = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        roles: ["pro"],
        client: clientId
      };
      if (form.email.trim()) {
        payload.email = form.email.trim();
      }
      if (form.password.trim()) {
        payload.password = form.password.trim();
      }
      const method = editingUser ? "PATCH" : "POST";
      const url = editingUser
        ? `${API_BASE_URL}/app/users/${editingUser._id}`
        : `${API_BASE_URL}/app/users`;
      const resp = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(payload)
      });
      if (!resp.ok) {
        throw new Error("No se pudo guardar el usuario.");
      }
      await loadProUsers();
      closeModal();
    } catch (err) {
      setFormError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (userToDelete: ProUser) => {
    const confirmed = await new Promise<boolean>((resolve) => {
      Alert.alert(
        "Eliminar usuario",
        `¿Eliminar a ${userToDelete.name}?`,
        [
          { text: "Cancelar", style: "cancel", onPress: () => resolve(false) },
          { text: "Eliminar", style: "destructive", onPress: () => resolve(true) }
        ],
        { cancelable: true }
      );
    });
    if (!confirmed) return;

    try {
      const resp = await fetch(`${API_BASE_URL}/app/users/${userToDelete._id}`, {
        method: "DELETE",
        headers
      });
      if (!resp.ok) {
        throw new Error("No se pudo eliminar el usuario.");
      }
      await loadProUsers();
    } catch (err) {
      Alert.alert("Error", (err as Error).message);
    }
  };

  const renderProfile = () => (
    <View style={[styles.card, styles.section]}>
      <Text style={styles.sectionTitle}>Perfil</Text>
      <Text style={styles.sectionSubtitle}>Actualiza tu información personal.</Text>
      {profileError ? <Text style={styles.errorText}>{profileError}</Text> : null}
      <View style={[styles.infoGrid, { rowGap: 12 }]}>
        <View style={[styles.infoItem, styles.infoItemHalf]}>
          <Text style={styles.infoLabel}>Tu nombre</Text>
          <TextInput
            style={styles.input}
            value={profileForm.name}
            onChangeText={(text) => setProfileForm((prev) => ({ ...prev, name: text }))}
            placeholder="Nombre completo"
          />
        </View>
        <View style={[styles.infoItem, styles.infoItemHalf]}>
          <Text style={styles.infoLabel}>Tu teléfono</Text>
          <TextInput
            style={styles.input}
            value={profileForm.phone}
            onChangeText={(text) => setProfileForm((prev) => ({ ...prev, phone: text }))}
            placeholder="+58 000 0000000"
          />
        </View>
        <View style={[styles.infoItem, styles.infoItemFull]}>
          <Text style={styles.infoLabel}>Tu correo</Text>
          <TextInput
            style={styles.input}
            value={profileForm.email}
            onChangeText={(text) => setProfileForm((prev) => ({ ...prev, email: text }))}
            placeholder="correo@correo.com"
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>
      </View>
      <View style={styles.profileActions}>
        <TouchableOpacity
          style={[styles.primaryButton, savingProfile && styles.primaryButtonDisabled]}
          onPress={async () => {
            setSavingProfile(true);
            setProfileError(null);
            try {
              const userPayload: Record<string, unknown> = {
                name: profileForm.name.trim(),
                phone: profileForm.phone.trim(),
                email: profileForm.email.trim()
              };
              await fetch(`${API_BASE_URL}/app/users/${user._id}`, {
                method: "PATCH",
                headers,
                body: JSON.stringify(userPayload)
              });
              await updateSessionUser(userPayload);
              loadProfileData();
            } catch (err) {
              setProfileError((err as Error).message);
            } finally {
              setSavingProfile(false);
            }
          }}
          disabled={savingProfile}
        >
          <Text style={styles.primaryButtonText}>
            {savingProfile ? "Guardando..." : "Guardar cambios"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderUsers = () => (
    <View style={[styles.card, styles.section]}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionHeaderText}>
          <Text style={styles.sectionTitle}>Usuarios Administrativos</Text>
          <Text style={styles.sectionSubtitle}>
            Administra los usuarios con rol PRO asociados a este cliente.
          </Text>
          {isMobile ? (
            <TouchableOpacity
              style={[styles.primaryButton, styles.primaryButtonFull]}
              onPress={openCreateModal}
            >
              <Text style={styles.primaryButtonText}>+ Nuevo usuario</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        {!isMobile ? (
          <TouchableOpacity style={styles.primaryButton} onPress={openCreateModal}>
            <Text style={styles.primaryButtonText}>+ Nuevo usuario</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      {loadingUsers ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator color="#f43f5e" />
          <Text style={styles.loadingText}>Cargando usuarios...</Text>
        </View>
      ) : usersError ? (
        <Text style={styles.errorText}>{usersError}</Text>
      ) : proUsers.length ? (
        <View style={styles.userList}>
          {proUsers.map((item) => (
            <View key={item._id} style={styles.userCard}>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{item.name}</Text>
                <Text style={styles.userDetail}>{item.email || "Sin correo"}</Text>
                <Text style={styles.userDetail}>{item.phone}</Text>
              </View>
              <View style={[styles.userActions, isMobile && styles.userActionsMobile]}>
                <TouchableOpacity
                  style={[styles.iconButton, styles.secondaryButton]}
                  onPress={() => openEditModal(item)}
                  accessibilityLabel={`Editar ${item.name}`}
                >
                  <Text style={styles.actionIcon}>✏️</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.iconButton, styles.secondaryButton]}
                  onPress={() => handleDeleteUser(item)}
                  accessibilityLabel={`Eliminar ${item.name}`}
                >
                  <Text style={[styles.actionIcon, styles.dangerText]}>🗑️</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.mutedText}>No hay usuarios PRO registrados.</Text>
      )}
    </View>
  );

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {!isMobile ? (
        <View style={styles.headerRow}>
          <Text style={styles.title}>Configuración</Text>
        </View>
      ) : null}

      <View style={[styles.subnav, isMobile && styles.subnavMobile]}>
        <TouchableOpacity
          style={[styles.subnavItem, activeSection === "profile" && styles.subnavItemActive]}
          onPress={() => setActiveSection("profile")}
        >
          <Text
            style={[styles.subnavLabel, activeSection === "profile" && styles.subnavLabelActive]}
          >
            Perfil
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.subnavItem, activeSection === "users" && styles.subnavItemActive]}
          onPress={() => setActiveSection("users")}
        >
          <Text style={[styles.subnavLabel, activeSection === "users" && styles.subnavLabelActive]}>
            Usuarios
          </Text>
        </TouchableOpacity>
      </View>

      {activeSection === "profile" ? renderProfile() : renderUsers()}

      <Modal transparent visible={modalVisible} animationType="fade" onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, isMobile && styles.modalCardMobile]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingUser ? "Editar usuario PRO" : "Nuevo usuario PRO"}
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
              <Text style={styles.inputLabel}>Correo</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="correo@empresa.com"
                value={form.email}
                autoCapitalize="none"
                keyboardType="email-address"
                onChangeText={(text) => setForm((prev) => ({ ...prev, email: text }))}
              />
              <Text style={styles.inputLabel}>Teléfono *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="+58 000 000 0000"
                value={form.phone}
                onChangeText={(text) => setForm((prev) => ({ ...prev, phone: text }))}
              />
              <Text style={styles.inputLabel}>Contraseña</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Deja en blanco para mantener"
                secureTextEntry
                value={form.password}
                onChangeText={(text) => setForm((prev) => ({ ...prev, password: text }))}
              />
            </View>
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.secondaryButton} onPress={closeModal}>
                <Text style={styles.secondaryButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryButton, saving && styles.primaryButtonDisabled]}
                onPress={handleSaveUser}
                disabled={saving}
              >
                <Text style={styles.primaryButtonText}>{saving ? "Guardando..." : "Guardar"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 16
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#0f172a"
  },
  subnav: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 6,
    borderWidth: 1,
    borderColor: "#e2e8f0"
  },
  subnavMobile: {
    flexDirection: "column"
  },
  subnavItem: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: "center"
  },
  subnavItemActive: {
    backgroundColor: "rgba(244,63,94,0.08)"
  },
  subnavLabel: {
    fontWeight: "700",
    color: "#475569"
  },
  subnavLabelActive: {
    color: "#be123c"
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 16,
    gap: 12
  },
  section: {
    gap: 16
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12
  },
  sectionHeaderText: {
    flex: 1,
    gap: 6
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0f172a"
  },
  sectionSubtitle: {
    color: "#475569",
    fontSize: 14
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16
  },
  infoItem: {
    minWidth: 220,
    flex: 1,
    backgroundColor: "#f8fafc",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0"
  },
  infoItemHalf: {
    flexBasis: "48%",
    minWidth: 220
  },
  infoItemFull: {
    flexBasis: "100%"
  },
  infoLabel: {
    fontSize: 13,
    color: "#475569",
    marginBottom: 4
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a"
  },
  helperText: {
    color: "#475569",
    fontSize: 12,
    marginTop: 4
  },
  userList: {
    gap: 10
  },
  userCard: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 14,
    backgroundColor: "#fff",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12
  },
  userInfo: {
    gap: 6,
    flex: 1
  },
  userName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a"
  },
  userDetail: {
    fontSize: 14,
    color: "#475569"
  },
  userActions: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center"
  },
  userActionsMobile: {
    flexDirection: "column",
    alignItems: "flex-start",
    justifyContent: "center"
  },
  primaryButton: {
    backgroundColor: "#f43f5e",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10
  },
  primaryButtonFull: {
    marginTop: 8,
    alignSelf: "stretch",
    alignItems: "center"
  },
  primaryButtonDisabled: {
    opacity: 0.7
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "700"
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  smallButton: {
    paddingVertical: 8,
    paddingHorizontal: 10
  },
  iconButton: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 44
  },
  secondaryButtonText: {
    color: "#0f172a",
    fontWeight: "700"
  },
  dangerText: {
    color: "#ef4444"
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  loadingText: {
    color: "#475569",
    fontWeight: "600"
  },
  mutedText: {
    color: "#94a3b8",
    fontWeight: "600"
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
    fontWeight: "800",
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
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 10
  },
  switchRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    alignItems: "center"
  },
  switchItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  switchLabel: {
    color: "#0f172a",
    fontWeight: "700"
  },
  profileActions: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "flex-end"
  }
});
