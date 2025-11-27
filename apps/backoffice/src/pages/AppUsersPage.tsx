import React, { FormEvent, useEffect, useMemo, useState } from "react";

import { useAuth } from "../auth/AuthProvider";
import { API_BASE_URL } from "../config";
import "./app-users.css";

interface AppUser {
  _id: string;
  name: string;
  email: string;
  phone: string;
  client?: string | { _id?: string; name?: string };
  createdAt?: string;
}

interface AppUserForm {
  name: string;
  email: string;
  phone: string;
  password: string;
  clientId: string;
}

interface ClientOption {
  _id: string;
  name: string;
}

const defaultForm: AppUserForm = {
  name: "",
  email: "",
  phone: "",
  password: "",
  clientId: ""
};

export const AppUsersPage = () => {
  const { token } = useAuth();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AppUserForm>(defaultForm);
  const [listError, setListError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  const showEmptyState = hasFetched && !loading && users.length === 0;

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
    try {
      const response = await fetch(`${API_BASE_URL}/app/users`, {
        headers: authHeaders
      });
      if (!response.ok) {
        throw new Error("No se pudieron cargar los usuarios");
      }
      const data = (await response.json()) as AppUser[];
      setUsers(data);
    } catch (error) {
      setListError((error as Error).message);
    } finally {
      setLoading(false);
      setHasFetched(true);
    }
  };

  const fetchClients = async () => {
    if (!authHeaders) {
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/backoffice/clients`, {
        headers: authHeaders
      });
      if (!response.ok) {
        throw new Error("No se pudieron cargar los clientes");
      }
      const data = (await response.json()) as { _id: string; name: string }[];
      setClients(
        data
          .filter((client) => client.active !== false)
          .map((client) => ({
            _id: client._id,
            name: client.name
          }))
      );
    } catch (error) {
      console.warn("No se pudieron cargar los clientes", error);
      setClients([]);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchClients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authHeaders]);

  const openCreateModal = () => {
    setEditingId(null);
    setForm(defaultForm);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (user: AppUser) => {
    setEditingId(user._id);
    setForm({
      name: user.name,
      email: user.email,
      phone: user.phone,
      password: "",
      clientId:
        typeof user.client === "object"
          ? (user.client?._id ?? "")
          : typeof user.client === "string"
            ? user.client
            : ""
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setForm(defaultForm);
    setEditingId(null);
    setFormError(null);
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
      roles: ["user"],
      ...(form.clientId ? { client: form.clientId } : {})
    };

    if (!editingId && !form.password.trim()) {
      setFormError("Debes definir una contraseña para el nuevo usuario.");
      setSubmitting(false);
      return;
    }
    if (form.password.trim()) {
      payload.password = form.password.trim();
    }

    try {
      const url = editingId
        ? `${API_BASE_URL}/app/users/${editingId}`
        : `${API_BASE_URL}/app/users`;
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
    } catch (error) {
      setFormError((error as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!authHeaders) {
      setListError("Sesión inválida.");
      return;
    }
    if (!window.confirm("¿Eliminar este usuario?")) {
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/app/users/${id}`, {
        method: "DELETE",
        headers: authHeaders
      });
      if (!response.ok) {
        throw new Error("No se pudo eliminar el usuario");
      }
      setUsers((prev) => prev.filter((user) => user._id !== id));
    } catch (error) {
      setListError((error as Error).message);
    }
  };

  const clientName = (user: AppUser) => {
    if (!user.client) {
      return "Sin asignar";
    }
    if (typeof user.client === "string") {
      return clients.find((client) => client._id === user.client)?.name ?? "Sin asignar";
    }
    return user.client.name ?? "Sin asignar";
  };

  return (
    <section className="app-users">
      <header className="app-users__header">
        <div>
          <h1>Usuarios</h1>
          <p>Gestiona las cuentas de clientes finales (rol usuario).</p>
        </div>
        <button type="button" className="primary-button" onClick={openCreateModal}>
          + Nuevo usuario
        </button>
      </header>

      <div className="app-users__content">
        {listError ? (
          <p className="error" role="alert">
            {listError}
          </p>
        ) : null}
        <div className="app-users__table">
          <div className="table-header">
            <h2>Listado</h2>
            <button
              type="button"
              className="icon-button icon-button--ghost"
              onClick={fetchUsers}
              disabled={loading}
              aria-label="Actualizar usuarios"
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
                  <th>Cliente</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {showEmptyState ? (
                  <tr>
                    <td className="table-empty" colSpan={5}>
                      No hay usuarios registrados aún.
                    </td>
                  </tr>
                ) : (
                  [...users]
                    .sort((a, b) =>
                      (a.name || "").localeCompare(b.name || "", "es", { sensitivity: "base" })
                    )
                    .map((user) => (
                    <tr key={user._id}>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>{user.phone}</td>
                      <td>{clientName(user)}</td>
                      <td className="table-actions">
                        <button
                          type="button"
                          className="ghost-button"
                          onClick={() => openEditModal(user)}
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          className="ghost-button ghost-button--danger"
                          onClick={() => handleDelete(user._id)}
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
        </div>
      </div>

      {isModalOpen ? (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal__header">
              <h3>{editingId ? "Editar usuario" : "Nuevo usuario"}</h3>
              <button type="button" className="ghost-button" onClick={closeModal}>
                ✕
              </button>
            </div>
            <form className="app-users__form" onSubmit={handleSubmit}>
              {formError ? (
                <p className="error" role="alert">
                  {formError}
                </p>
              ) : null}
              <label>
                Nombre *
                <input
                  value={form.name}
                  onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                  required
                />
              </label>
              <label>
                Email *
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                  required
                />
              </label>
              <label>
                Teléfono *
                <input
                  value={form.phone}
                  onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
                  required
                />
              </label>
              <label>
                Contraseña {editingId ? "(opcional)" : "*"}
                <input
                  type="password"
                  value={form.password}
                  placeholder={editingId ? "Dejar vacío para no cambiar" : ""}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, password: event.target.value }))
                  }
                  required={!editingId}
                  minLength={editingId ? undefined : 6}
                />
              </label>
              <label>
                Cliente asignado
                <select
                  value={form.clientId}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, clientId: event.target.value }))
                  }
                >
                  <option value="">Sin asignar</option>
                  {clients.map((client) => (
                    <option key={client._id} value={client._id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="form-actions">
                <button type="submit" disabled={submitting}>
                  {submitting ? "Guardando..." : "Guardar"}
                </button>
                <button type="button" className="ghost-button" onClick={closeModal}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
};
