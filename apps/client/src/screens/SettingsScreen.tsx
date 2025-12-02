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
import { useLanguage } from "../i18n/LanguageContext";

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
  const { t } = useLanguage();
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
        throw new Error(t.settings.profile.errors.load);
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
  }, [headers, t.settings.profile.errors.load, user.email, user.name, user.phone]);

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
        throw new Error(t.settings.users.errorLoad);
      }
      const data = (await response.json()) as ProUser[];
      setProUsers(data);
    } catch (err) {
      setUsersError((err as Error).message);
      setProUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  }, [clientId, headers, t.settings.users.errorLoad]);

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
      setFormError(t.settings.users.errors.nameRequired);
      return;
    }
    if (!form.phone.trim()) {
      setFormError(t.settings.users.errors.phoneRequired);
      return;
    }
    if (!clientId) {
      setFormError(t.settings.users.errors.invalidSession);
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
        throw new Error(t.settings.users.errors.save);
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
        t.settings.users.deleteConfirmTitle,
        t.settings.users.deleteConfirm(userToDelete.name),
        [
          { text: t.settings.users.cancel, style: "cancel", onPress: () => resolve(false) },
          { text: t.settings.users.deleteConfirmTitle, style: "destructive", onPress: () => resolve(true) }
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
        throw new Error(t.settings.users.errors.delete);
      }
      await loadProUsers();
    } catch (err) {
      Alert.alert("Error", (err as Error).message);
    }
  };

  const renderProfile = () => (
    <View style={[styles.card, styles.section]}>
      <Text style={styles.sectionTitle}>{t.settings.profile.title}</Text>
      <Text style={styles.sectionSubtitle}>{t.settings.profile.subtitle}</Text>
      {profileError ? <Text style={styles.errorText}>{profileError}</Text> : null}
      <View style={[styles.infoGrid, { rowGap: 12 }]}>
        <View style={[styles.infoItem, styles.infoItemHalf]}>
          <Text style={styles.infoLabel}>{t.settings.profile.name}</Text>
          <TextInput
            style={styles.input}
            value={profileForm.name}
            onChangeText={(text) => setProfileForm((prev) => ({ ...prev, name: text }))}
            placeholder={t.settings.profile.namePlaceholder}
          />
        </View>
        <View style={[styles.infoItem, styles.infoItemHalf]}>
          <Text style={styles.infoLabel}>{t.settings.profile.phone}</Text>
          <TextInput
            style={styles.input}
            value={profileForm.phone}
            onChangeText={(text) => setProfileForm((prev) => ({ ...prev, phone: text }))}
            placeholder={t.settings.profile.phonePlaceholder}
          />
        </View>
        <View style={[styles.infoItem, styles.infoItemFull]}>
          <Text style={styles.infoLabel}>{t.settings.profile.email}</Text>
          <TextInput
            style={styles.input}
            value={profileForm.email}
            onChangeText={(text) => setProfileForm((prev) => ({ ...prev, email: text }))}
            placeholder={t.settings.profile.emailPlaceholder}
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
              setProfileError(t.settings.profile.errors.save);
            } finally {
              setSavingProfile(false);
            }
          }}
          disabled={savingProfile}
        >
          <Text style={styles.primaryButtonText}>
            {savingProfile ? t.settings.profile.saving : t.settings.profile.save}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderUsers = () => (
    <View style={[styles.card, styles.section]}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionHeaderText}>
          <Text style={styles.sectionTitle}>{t.settings.users.title}</Text>
          <Text style={styles.sectionSubtitle}>{t.settings.users.subtitle}</Text>
          {isMobile ? (
            <TouchableOpacity
              style={[styles.primaryButton, styles.primaryButtonFull]}
              onPress={openCreateModal}
            >
              <Text style={styles.primaryButtonText}>{t.settings.users.add}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        {!isMobile ? (
          <TouchableOpacity style={styles.primaryButton} onPress={openCreateModal}>
            <Text style={styles.primaryButtonText}>{t.settings.users.add}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      {loadingUsers ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator color="#f43f5e" />
          <Text style={styles.loadingText}>{t.settings.users.loading}</Text>
        </View>
      ) : usersError ? (
        <Text style={styles.errorText}>{usersError}</Text>
      ) : proUsers.length ? (
        <View style={styles.userList}>
          {proUsers.map((item) => (
            <View key={item._id} style={styles.userCard}>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{item.name}</Text>
                <Text style={styles.userDetail}>{item.email || t.settings.users.noEmail}</Text>
                <Text style={styles.userDetail}>{item.phone}</Text>
              </View>
              <View style={[styles.userActions, isMobile && styles.userActionsMobile]}>
                <TouchableOpacity
                  style={[styles.iconButton, styles.secondaryButton]}
                  onPress={() => openEditModal(item)}
                  accessibilityLabel={`${t.settings.users.editTitle} ${item.name}`}
                >
                  <Text style={styles.actionIcon}>✏️</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.iconButton, styles.secondaryButton]}
                  onPress={() => handleDeleteUser(item)}
                  accessibilityLabel={`${t.settings.users.deleteConfirmTitle} ${item.name}`}
                >
                  <Text style={[styles.actionIcon, styles.dangerText]}>🗑️</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.mutedText}>{t.settings.users.empty}</Text>
      )}
    </View>
  );

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {!isMobile ? (
        <View style={styles.headerRow}>
          <Text style={styles.title}>{t.settings.title}</Text>
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
            {t.settings.tabs.profile}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.subnavItem, activeSection === "users" && styles.subnavItemActive]}
          onPress={() => setActiveSection("users")}
        >
          <Text style={[styles.subnavLabel, activeSection === "users" && styles.subnavLabelActive]}>
            {t.settings.tabs.users}
          </Text>
        </TouchableOpacity>
      </View>

      {activeSection === "profile" ? renderProfile() : renderUsers()}

      <Modal transparent visible={modalVisible} animationType="fade" onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, isMobile && styles.modalCardMobile]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingUser ? t.settings.users.editTitle : t.settings.users.newTitle}
              </Text>
              <TouchableOpacity onPress={closeModal}>
                <Text style={styles.closeIcon}>✕</Text>
              </TouchableOpacity>
            </View>
            {formError ? <Text style={styles.modalError}>{formError}</Text> : null}
            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>{t.settings.users.name}</Text>
              <TextInput
                style={styles.modalInput}
                placeholder={t.settings.profile.namePlaceholder}
                value={form.name}
                onChangeText={(text) => setForm((prev) => ({ ...prev, name: text }))}
              />
              <Text style={styles.inputLabel}>{t.settings.users.email}</Text>
              <TextInput
                style={styles.modalInput}
                placeholder={t.settings.profile.emailPlaceholder}
                value={form.email}
                autoCapitalize="none"
                keyboardType="email-address"
                onChangeText={(text) => setForm((prev) => ({ ...prev, email: text }))}
              />
              <Text style={styles.inputLabel}>{t.settings.users.phone}</Text>
              <TextInput
                style={styles.modalInput}
                placeholder={t.settings.profile.phonePlaceholder}
                value={form.phone}
                onChangeText={(text) => setForm((prev) => ({ ...prev, phone: text }))}
              />
              <Text style={styles.inputLabel}>{t.settings.users.password}</Text>
              <TextInput
                style={styles.modalInput}
                placeholder={t.settings.users.passwordPlaceholder}
                secureTextEntry
                value={form.password}
                onChangeText={(text) => setForm((prev) => ({ ...prev, password: text }))}
              />
            </View>
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.secondaryButton} onPress={closeModal}>
                <Text style={styles.secondaryButtonText}>{t.settings.users.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryButton, saving && styles.primaryButtonDisabled]}
                onPress={handleSaveUser}
                disabled={saving}
              >
                <Text style={styles.primaryButtonText}>
                  {saving ? t.settings.users.saving : t.settings.users.save}
                </Text>
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
