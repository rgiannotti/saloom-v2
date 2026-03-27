import React, { FormEvent, useEffect, useMemo, useState } from "react";
import { MdEdit, MdDelete, MdRefresh, MdClose } from "react-icons/md";

import { useAuth } from "../auth/AuthProvider";
import { API_BASE_URL } from "../config";
import "./services.css";

interface ServiceCategory {
  _id: string;
  name: string;
  description?: string;
  order?: number;
}

interface Service {
  _id: string;
  name: string;
  notes: string;
  order: number;
  home: boolean;
  category?: ServiceCategory | null;
  createdAt?: string;
  updatedAt?: string;
}

interface ServiceFormState {
  name: string;
  notes: string;
  order: string;
  home: boolean;
  categoryId: string;
}

const defaultForm: ServiceFormState = {
  name: "",
  notes: "",
  order: "",
  home: false,
  categoryId: ""
};

export const ServicesPage = () => {
  const { token } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ServiceFormState>(defaultForm);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [filterCategories, setFilterCategories] = useState<Set<string>>(new Set());
  const [filterHome, setFilterHome] = useState(false);

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

  const fetchCategories = async () => {
    if (!authHeaders) {
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/service-categories`, {
        headers: authHeaders
      });
      if (!response.ok) {
        throw new Error("No se pudieron cargar las categorías");
      }
      const data = (await response.json()) as ServiceCategory[];
      setCategories(data);
    } catch (err) {
      console.warn(err);
    }
  };

  useEffect(() => {
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authHeaders]);

  const filteredServices = useMemo(() => {
    return services.filter((service) => {
      if (filterHome && !service.home) return false;
      if (filterCategories.size > 0) {
        const catId = service.category && typeof service.category === "object"
          ? service.category._id
          : null;
        if (!catId || !filterCategories.has(catId)) return false;
      }
      return true;
    });
  }, [services, filterCategories, filterHome]);

  const toggleCategoryFilter = (id: string) => {
    setFilterCategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openModal = (service?: Service) => {
    if (service) {
      setEditingId(service._id);
      setForm({
        name: service.name,
        notes: service.notes ?? "",
        order: service.order?.toString() ?? "",
        home: Boolean(service.home),
        categoryId:
          typeof service.category === "string"
            ? service.category
            : service.category && service.category._id
              ? service.category._id
              : ""
      });
    } else {
      setEditingId(null);
      setForm(defaultForm);
    }
    setCategoryError(null);
    setShowCategoryForm(false);
    setNewCategoryName("");
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setForm(defaultForm);
    setEditingId(null);
    setError(null);
    setCategoryError(null);
    setShowCategoryForm(false);
    setNewCategoryName("");
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
      home: form.home,
      categoryId: form.categoryId || undefined
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

  const handleCreateCategory = async () => {
    if (!authHeaders) {
      setCategoryError("Sesión inválida, vuelve a ingresar.");
      return;
    }
    if (!newCategoryName.trim()) {
      setCategoryError("Ingresa un nombre para la categoría.");
      return;
    }
    setCreatingCategory(true);
    setCategoryError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/service-categories`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ name: newCategoryName.trim() })
      });
      if (!response.ok) {
        throw new Error("No se pudo crear la categoría");
      }
      const created = (await response.json()) as ServiceCategory;
      setCategories((prev) => [...prev, created]);
      setForm((prev) => ({ ...prev, categoryId: created._id }));
      setNewCategoryName("");
      setShowCategoryForm(false);
    } catch (err) {
      setCategoryError((err as Error).message);
    } finally {
      setCreatingCategory(false);
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
            {loading ? "…" : <MdRefresh />}
          </button>
        </div>
        {categories.length > 0 || true ? (
          <div className="filter-pills">
            <span className="filter-pills__label">Filtros:</span>
            <button
              type="button"
              className={`pill ${filterHome ? "pill--active" : ""}`}
              onClick={() => setFilterHome((prev) => !prev)}
            >
              A domicilio
            </button>
            {categories.map((cat) => (
              <button
                key={cat._id}
                type="button"
                className={`pill ${filterCategories.has(cat._id) ? "pill--active" : ""}`}
                onClick={() => toggleCategoryFilter(cat._id)}
              >
                {cat.name}
              </button>
            ))}
            {(filterHome || filterCategories.size > 0) ? (
              <button
                type="button"
                className="pill pill--clear"
                onClick={() => { setFilterHome(false); setFilterCategories(new Set()); }}
              >
                Limpiar filtros
              </button>
            ) : null}
          </div>
        ) : null}

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
                <th>Categoría</th>
                <th>Orden</th>
                <th>Domicilio</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredServices.length === 0 ? (
                <tr>
                  <td className="table-empty" colSpan={5}>
                    {services.length === 0 ? "Aún no hay servicios creados." : "No hay servicios con los filtros seleccionados."}
                  </td>
                </tr>
              ) : (
                filteredServices.map((service) => (
                  <tr key={service._id}>
                    <td>
                      <strong>{service.name}</strong>
                      {service.notes ? <p className="service-notes">{service.notes}</p> : null}
                    </td>
                    <td>
                      {service.category && typeof service.category === "object"
                        ? service.category.name
                        : "Sin categoría"}
                    </td>
                    <td>{service.order ?? 0}</td>
                    <td>{service.home ? "Sí" : "No"}</td>
                    <td className="table-actions">
                    <button
                      type="button"
                      className="icon-button icon-button--ghost"
                      onClick={() => openModal(service)}
                      aria-label={`Editar ${service.name}`}
                    >
                      <MdEdit />
                    </button>
                    <button
                      type="button"
                      className="icon-button icon-button--danger"
                      onClick={() => handleDelete(service._id)}
                      aria-label={`Eliminar ${service.name}`}
                    >
                      <MdDelete />
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
                <MdClose />
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

              <label htmlFor="service-category">Categoría</label>
              <div className="category-select-group category-select-wide">
                <select
                  id="service-category"
                  value={form.categoryId}
                  onChange={(event) => setForm((prev) => ({ ...prev, categoryId: event.target.value }))}
                >
                  <option value="">Sin categoría</option>
                  {categories.map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => {
                    setShowCategoryForm((prev) => !prev);
                    setCategoryError(null);
                  }}
                >
                  {showCategoryForm ? "Cancelar" : "Nueva categoría"}
                </button>
              </div>
              {showCategoryForm ? (
                <div className="category-inline">
                  <input
                    type="text"
                    placeholder="Nombre de la categoría"
                    value={newCategoryName}
                    onChange={(event) => setNewCategoryName(event.target.value)}
                  />
                  <button
                    type="button"
                    className="primary-button"
                    onClick={handleCreateCategory}
                    disabled={creatingCategory}
                  >
                    {creatingCategory ? "Creando..." : "Crear"}
                  </button>
                </div>
              ) : null}
              {categoryError ? (
                <p className="error" role="alert">
                  {categoryError}
                </p>
              ) : null}

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
