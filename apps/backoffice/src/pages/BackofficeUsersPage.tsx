import React, { FormEvent, useEffect, useMemo, useState } from "react";

import { useAuth } from "../auth/AuthProvider";
import { API_BASE_URL } from "../config";
import "./backoffice-users.css";

interface BackofficeUser {
  _id: string;
  name: string;
  email: string;
  phone: string;
  roles: string[];
  createdAt?: string;
}

interface UserFormState {
  name: string;
  email: string;
  phone: string;
  password: string;
}

const defaultForm: UserFormState = {
  name: "",
  email: "",
  phone: "",
  password: ""
};

export const BackofficeUsersPage = () => {
  const { token } = useAuth();
  const [users, setUsers] = useState<BackofficeUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [listInfo, setListInfo] = useState<string | null>(null);
  const [form, setForm] = useState<UserFormState>(defaultForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetTarget, setResetTarget] = useState<BackofficeUser | null>(null);
  const [resetPasswordForm, setResetPasswordForm] = useState({ password: "", confirm: "" });
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [hasFetchedOnce, setHasFetchedOnce] = useState(false);
  const showEmptyState = hasFetchedOnce && !loading && users.length === 0;

  const authHeaders = useMemo(() => {
    if (!token) {
      return undefined;
    }
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    } as const;
  }, [token]);

  const fetchUsers = async () => {
    if (!authHeaders) {
      return;
    }
    setLoading(true);
    setListError(null);
    setListInfo(null);
    try {
      const response = await fetch(`${API_BASE_URL}/backoffice/users`, {
        headers: authHeaders
      });
      if (!response.ok) {
        throw new Error("No se pudieron cargar los usuarios");
      }
      const data = (await response.json()) as BackofficeUser[];
      setUsers(data);
    } catch (err) {
      setListError((err as Error).message);
    } finally {
      setLoading(false);
      setHasFetchedOnce(true);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authHeaders]);

  const resetUserForm = () => {
    setForm(defaultForm);
    setEditingId(null);
  };

  const closeModal = () => {
    setIsEditorOpen(false);
    resetUserForm();
    setFormError(null);
  };

  const openCreateModal = () => {
    resetUserForm();
    setFormError(null);
    setIsEditorOpen(true);
  };

  const openEditModal = (user: BackofficeUser) => {
    setEditingId(user._id);
    setForm({
      name: user.name,
      email: user.email,
      phone: user.phone,
      password: ""
    });
    setFormError(null);
    setIsEditorOpen(true);
  };

  const closeResetModal = () => {
    setIsResetModalOpen(false);
    setResetTarget(null);
    setResetPasswordForm({ password: "", confirm: "" });
    setResetError(null);
  };

  const openResetModal = (user: BackofficeUser) => {
    setResetTarget(user);
    setResetPasswordForm({ password: "", confirm: "" });
    setResetError(null);
    setIsResetModalOpen(true);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!authHeaders) {
      setFormError("Sesión inválida, vuelve a ingresar.");
      return;
    }
    setSubmitting(true);
    setFormError(null);

    const payload: Record<string, unknown> = {
      name: form.name,
      email: form.email,
      phone: form.phone,
      roles: ["admin"]
    };
    if (!editingId && form.password.trim()) {
      payload.password = form.password;
    }

    try {
      const url = editingId
        ? `${API_BASE_URL}/backoffice/users/${editingId}`
        : `${API_BASE_URL}/backoffice/users`;
      const method = editingId ? "PATCH" : "POST";
      const response = await fetch(url, {
        method,
        headers: authHeaders,
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error("No se pudo guardar el usuario");
      }

      await fetchUsers();
      closeModal();
    } catch (err) {
      setFormError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!authHeaders || !window.confirm("¿Eliminar este usuario?")) {
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/backoffice/users/${id}`, {
        method: "DELETE",
        headers: authHeaders
      });
      if (!response.ok) {
        throw new Error("No se pudo eliminar");
      }
      setUsers((prev) => prev.filter((user) => user._id !== id));
      if (editingId === id) {
        closeModal();
      }
    } catch (err) {
      setListError((err as Error).message);
    }
  };

  const handleResetSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!authHeaders || !resetTarget) {
      setResetError("Sesión inválida, vuelve a ingresar.");
      return;
    }
    if (!resetPasswordForm.password.trim()) {
      setResetError("La nueva contraseña es obligatoria.");
      return;
    }
    if (resetPasswordForm.password !== resetPasswordForm.confirm) {
      setResetError("Las contraseñas no coinciden.");
      return;
    }
    try {
      setResetSubmitting(true);
      setResetError(null);
      setListInfo(null);
      const response = await fetch(
        `${API_BASE_URL}/backoffice/users/${resetTarget._id}/reset-password`,
        {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify({ password: resetPasswordForm.password })
        }
      );
      if (!response.ok) {
        throw new Error("No se pudo resetear la contraseña");
      }
      setListInfo("Contraseña actualizada correctamente.");
      closeResetModal();
    } catch (err) {
      setResetError((err as Error).message);
    } finally {
      setResetSubmitting(false);
    }
  };

  if (!token) {
    return <p>Inicia sesión para gestionar usuarios.</p>;
  }

  return (
    <div className="backoffice-users">
      <header className="backoffice-users__header">
        <div>
          <h1>Usuarios administrativos</h1>
          <p>Gestiona accesos y roles del backoffice.</p>
        </div>
        <button type="button" className="primary-button" onClick={openCreateModal}>
          Nuevo usuario
        </button>
      </header>

      <div className="backoffice-users__content">
        <section className="backoffice-users__table">
          <div className="table-header">
            <div>
              <h2>Listado</h2>
              {listError ? (
                <p className="error" role="alert">
                  {listError}
                </p>
              ) : null}
              {listInfo ? (
                <p className="success" role="status">
                  {listInfo}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              className="icon-button icon-button--ghost"
              onClick={fetchUsers}
              disabled={loading}
              aria-label="Refrescar lista de usuarios"
            >
              {loading ? "…" : "⟳"}
            </button>
          </div>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Teléfono</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {showEmptyState ? (
                  <tr>
                    <td className="table-empty" colSpan={4}>
                    No hay usuarios creados todavía.
                  </td>
                </tr>
              ) : (
                [...users]
                  .sort((a, b) => (a.name || "").localeCompare(b.name || "", "es", { sensitivity: "base" }))
                  .map((user) => (
                  <tr key={user._id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>{user.phone}</td>
                    <td className="table-actions">
                      <button
                        type="button"
                        className="icon-button icon-button--ghost"
                        onClick={() => openEditModal(user)}
                        aria-label={`Editar ${user.name}`}
                      >
                        ✏️
                      </button>
                      <button
                        type="button"
                        className="icon-button"
                        onClick={() => openResetModal(user)}
                        title="Resetear contraseña"
                        aria-label={`Resetear contraseña de ${user.name}`}
                      >
                        🔑
                      </button>
                      <button
                        type="button"
                        className="icon-button icon-button--danger"
                        onClick={() => handleDelete(user._id)}
                        title="Eliminar"
                        aria-label={`Eliminar ${user.name}`}
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            </table>
          </div>
        </section>
      </div>

      {isEditorOpen ? (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal">
            <header className="modal__header">
              <div>
                <h2>{editingId ? "Editar usuario" : "Nuevo usuario"}</h2>
                <p className="modal__subtitle">
                  Completa la información para {editingId ? "actualizar" : "crear"} un usuario.
                </p>
              </div>
              <button
                type="button"
                className="ghost-button"
                onClick={closeModal}
                aria-label="Cerrar modal"
              >
                ✕
              </button>
            </header>
            <form onSubmit={handleSubmit} className="backoffice-users__form">
              <label htmlFor="name">Nombre</label>
              <input
                id="name"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                required
              />

              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                required
              />

              <label htmlFor="phone">Teléfono</label>
              <input
                id="phone"
                value={form.phone}
                onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                required
              />

              {!editingId ? (
                <>
                  <label htmlFor="password">Contraseña</label>
                  <input
                    id="password"
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                    minLength={8}
                    required
                  />
                </>
              ) : null}

              {formError ? (
                <p className="error" role="alert">
                  {formError}
                </p>
              ) : null}

              <div className="form-actions">
                <button type="submit" disabled={submitting}>
                  {submitting ? "Guardando..." : editingId ? "Actualizar" : "Crear"}
                </button>
                <button type="button" className="ghost-button" onClick={closeModal}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {isResetModalOpen ? (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal">
            <header className="modal__header">
              <div>
                <h2>Resetear contraseña</h2>
                <p className="modal__subtitle">
                  Define una nueva contraseña para {resetTarget?.name ?? "el usuario"}.
                </p>
              </div>
              <button
                type="button"
                className="ghost-button"
                onClick={closeResetModal}
                aria-label="Cerrar modal"
              >
                ✕
              </button>
            </header>
            <form onSubmit={handleResetSubmit} className="backoffice-users__form">
              <label htmlFor="reset-password">Nueva contraseña</label>
              <input
                id="reset-password"
                type="password"
                value={resetPasswordForm.password}
                onChange={(e) =>
                  setResetPasswordForm((prev) => ({ ...prev, password: e.target.value }))
                }
                required
              />

              <label htmlFor="reset-confirm">Confirmar contraseña</label>
              <input
                id="reset-confirm"
                type="password"
                value={resetPasswordForm.confirm}
                onChange={(e) =>
                  setResetPasswordForm((prev) => ({ ...prev, confirm: e.target.value }))
                }
                required
              />

              {resetError ? (
                <p className="error" role="alert">
                  {resetError}
                </p>
              ) : null}

              <div className="form-actions">
                <button type="submit" disabled={resetSubmitting}>
                  {resetSubmitting ? "Actualizando..." : "Guardar"}
                </button>
                <button type="button" className="ghost-button" onClick={closeResetModal}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
};
