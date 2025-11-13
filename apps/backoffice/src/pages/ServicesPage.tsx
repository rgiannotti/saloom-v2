import React, { FormEvent, useEffect, useMemo, useState } from "react";

import { useAuth } from "../auth/AuthProvider";
import { API_BASE_URL } from "../config";
import "./services.css";

interface Service {
  _id: string;
  name: string;
  notes: string;
  order: number;
  home: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface ServiceFormState {
  name: string;
  notes: string;
  order: string;
  home: boolean;
}

const defaultForm: ServiceFormState = {
  name: "",
  notes: "",
  order: "",
  home: false
};

export const ServicesPage = () => {
  const { token } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ServiceFormState>(defaultForm);

  const authHeaders = useMemo(() => {
    if (!token) {
      return null;
    }
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    };
  }, [token]);

  const fetchServices = async () => {
    if (!authHeaders) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/services`, {
        headers: authHeaders
      });
      if (!response.ok) {
        throw new Error("No se pudieron cargar los servicios");
      }
      const data = (await response.json()) as Service[];
      setServices(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authHeaders]);

  const openModal = (service?: Service) => {
    if (service) {
      setEditingId(service._id);
      setForm({
        name: service.name,
        notes: service.notes ?? "",
        order: service.order?.toString() ?? "",
        home: Boolean(service.home)
      });
    } else {
      setEditingId(null);
      setForm(defaultForm);
    }
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setForm(defaultForm);
    setEditingId(null);
    setError(null);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!authHeaders) {
      setError("Sesión inválida, vuelve a ingresar.");
      return;
    }
    setSubmitting(true);
    setError(null);

    const payload = {
      name: form.name,
      notes: form.notes,
      order: form.order ? Number(form.order) : 0,
      home: form.home
    };

    try {
      const url = editingId ? `${API_BASE_URL}/services/${editingId}` : `${API_BASE_URL}/services`;
      const method = editingId ? "PATCH" : "POST";
      const response = await fetch(url, {
        method,
        headers: authHeaders,
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        throw new Error("No se pudo guardar el servicio");
      }
      await fetchServices();
      closeModal();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!authHeaders || !window.confirm("¿Eliminar este servicio?")) {
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/services/${id}`, {
        method: "DELETE",
        headers: authHeaders
      });
      if (!response.ok) {
        throw new Error("No se pudo eliminar el servicio");
      }
      setServices((prev) => prev.filter((service) => service._id !== id));
    } catch (err) {
      setError((err as Error).message);
    }
  };

  if (!token) {
    return <p>Inicia sesión para gestionar servicios.</p>;
  }

  return (
    <div className="services-page">
      <header className="services-page__header">
        <div>
          <h1>Servicios</h1>
          <p>Administra los servicios disponibles en la plataforma.</p>
        </div>
        <button className="primary-button" type="button" onClick={() => openModal()}>
          Nuevo servicio
        </button>
      </header>

      <section className="services-page__table">
        <div className="table-header">
          <h2>Listado</h2>
          <button
            type="button"
            className="icon-button icon-button--ghost"
            onClick={fetchServices}
            disabled={loading}
            aria-label="Refrescar lista de servicios"
          >
            {loading ? "…" : "⟳"}
          </button>
        </div>
        {error ? (
          <p className="error" role="alert">
            {error}
          </p>
        ) : null}
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Orden</th>
                <th>Domicilio</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {services.length === 0 ? (
                <tr>
                  <td className="table-empty" colSpan={4}>
                    Aún no hay servicios creados.
                  </td>
                </tr>
              ) : (
                services.map((service) => (
                  <tr key={service._id}>
                    <td>
                      <strong>{service.name}</strong>
                      {service.notes ? <p className="service-notes">{service.notes}</p> : null}
                    </td>
                    <td>{service.order}</td>
                    <td>{service.home ? "Sí" : "No"}</td>
                  <td className="table-actions">
                    <button
                      type="button"
                      className="icon-button icon-button--ghost"
                      onClick={() => openModal(service)}
                      aria-label={`Editar ${service.name}`}
                    >
                      ✏️
                    </button>
                    <button
                      type="button"
                      className="icon-button icon-button--danger"
                      onClick={() => handleDelete(service._id)}
                      aria-label={`Eliminar ${service.name}`}
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

      {modalOpen ? (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal">
            <header className="modal__header">
              <div>
                <h2>{editingId ? "Editar servicio" : "Nuevo servicio"}</h2>
                <p className="modal__subtitle">
                  Completa la información para {editingId ? "actualizar" : "crear"} un servicio.
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
            <form className="services-form" onSubmit={handleSubmit}>
              <label htmlFor="service-name">Nombre</label>
              <input
                id="service-name"
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                required
              />

              <label htmlFor="service-order">Orden</label>
              <input
                id="service-order"
                type="number"
                min="0"
                value={form.order}
                onChange={(event) => setForm((prev) => ({ ...prev, order: event.target.value }))}
              />

              <label htmlFor="service-notes">Notas</label>
              <textarea
                id="service-notes"
                rows={3}
                value={form.notes}
                onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
              />

              <div className="toggle-row">
                <label htmlFor="service-home">Servicio a domicilio</label>
                <input
                  id="service-home"
                  type="checkbox"
                  checked={form.home}
                  onChange={(event) => setForm((prev) => ({ ...prev, home: event.target.checked }))}
                />
              </div>

              {error ? (
                <p className="error" role="alert">
                  {error}
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
    </div>
  );
};
