import React, { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  MdEdit,
  MdDelete,
  MdRefresh,
  MdClose,
  MdContentCut,
  MdSpa,
  MdFace,
  MdFaceRetouchingNatural,
  MdBrush,
  MdColorLens,
  MdLocalFlorist,
  MdFitnessCenter,
  MdSelfImprovement,
  MdAccessibility,
  MdHealthAndSafety,
  MdMedicalServices,
  MdLocalHospital,
  MdNaturePeople,
  MdYard,
  MdHouse,
  MdCleaningServices,
  MdPlumbing,
  MdElectricalServices,
  MdHandyman,
  MdBuild,
  MdConstruction,
  MdFormatPaint,
  MdCarpenter,
  MdOutdoorGrill,
  MdKitchen,
  MdDining,
  MdLocalCafe,
  MdLocalDining,
  MdPets,
  MdDirectionsCar,
  MdCarRepair,
  MdLocalCarWash,
  MdPhotoCamera,
  MdVideocam,
  MdMusicNote,
  MdSchool,
  MdMenuBook,
  MdComputer,
  MdPhoneIphone,
  MdDesignServices,
  MdBusinessCenter,
  MdAccountBalance,
  MdGavel,
  MdLocalShipping,
  MdFlight,
  MdHotel,
  MdSportsEsports,
  MdSportsTennis,
  MdSportsFootball,
  MdSportsMartialArts,
  MdPool,
  MdStar,
  MdFavorite,
  MdCategory
} from "react-icons/md";

import { useAuth } from "../auth/AuthProvider";
import { API_BASE_URL } from "../config";
import "./categories.css";

const ICON_OPTIONS: { name: string; label: string; Component: React.ElementType }[] = [
  { name: "MdContentCut", label: "Tijeras / Cabello", Component: MdContentCut },
  { name: "MdSpa", label: "Spa", Component: MdSpa },
  { name: "MdFace", label: "Rostro", Component: MdFace },
  { name: "MdFaceRetouchingNatural", label: "Maquillaje", Component: MdFaceRetouchingNatural },
  { name: "MdBrush", label: "Pincel", Component: MdBrush },
  { name: "MdColorLens", label: "Color / Tintura", Component: MdColorLens },
  { name: "MdLocalFlorist", label: "Flores / Estética", Component: MdLocalFlorist },
  { name: "MdFitnessCenter", label: "Gimnasio", Component: MdFitnessCenter },
  { name: "MdSelfImprovement", label: "Meditación / Yoga", Component: MdSelfImprovement },
  { name: "MdAccessibility", label: "Masajes / Cuerpo", Component: MdAccessibility },
  { name: "MdHealthAndSafety", label: "Salud", Component: MdHealthAndSafety },
  { name: "MdMedicalServices", label: "Médico", Component: MdMedicalServices },
  { name: "MdLocalHospital", label: "Hospital / Clínica", Component: MdLocalHospital },
  { name: "MdNaturePeople", label: "Naturaleza / Bienestar", Component: MdNaturePeople },
  { name: "MdYard", label: "Jardín / Patio", Component: MdYard },
  { name: "MdHouse", label: "Hogar", Component: MdHouse },
  { name: "MdCleaningServices", label: "Limpieza", Component: MdCleaningServices },
  { name: "MdPlumbing", label: "Plomería", Component: MdPlumbing },
  { name: "MdElectricalServices", label: "Electricidad", Component: MdElectricalServices },
  { name: "MdHandyman", label: "Mantenimiento", Component: MdHandyman },
  { name: "MdBuild", label: "Herramientas", Component: MdBuild },
  { name: "MdConstruction", label: "Construcción", Component: MdConstruction },
  { name: "MdFormatPaint", label: "Pintura", Component: MdFormatPaint },
  { name: "MdCarpenter", label: "Carpintería", Component: MdCarpenter },
  { name: "MdOutdoorGrill", label: "Parrilla / Chef", Component: MdOutdoorGrill },
  { name: "MdKitchen", label: "Cocina", Component: MdKitchen },
  { name: "MdDining", label: "Comedor", Component: MdDining },
  { name: "MdLocalCafe", label: "Café", Component: MdLocalCafe },
  { name: "MdLocalDining", label: "Restaurante", Component: MdLocalDining },
  { name: "MdPets", label: "Mascotas", Component: MdPets },
  { name: "MdDirectionsCar", label: "Auto", Component: MdDirectionsCar },
  { name: "MdCarRepair", label: "Mecánica", Component: MdCarRepair },
  { name: "MdLocalCarWash", label: "Lavado de auto", Component: MdLocalCarWash },
  { name: "MdPhotoCamera", label: "Fotografía", Component: MdPhotoCamera },
  { name: "MdVideocam", label: "Video", Component: MdVideocam },
  { name: "MdMusicNote", label: "Música", Component: MdMusicNote },
  { name: "MdSchool", label: "Educación", Component: MdSchool },
  { name: "MdMenuBook", label: "Clases / Cursos", Component: MdMenuBook },
  { name: "MdComputer", label: "Tecnología / PC", Component: MdComputer },
  { name: "MdPhoneIphone", label: "Celular / Móvil", Component: MdPhoneIphone },
  { name: "MdDesignServices", label: "Diseño", Component: MdDesignServices },
  { name: "MdBusinessCenter", label: "Negocios", Component: MdBusinessCenter },
  { name: "MdAccountBalance", label: "Finanzas / Banco", Component: MdAccountBalance },
  { name: "MdGavel", label: "Legal / Abogados", Component: MdGavel },
  { name: "MdLocalShipping", label: "Envíos / Delivery", Component: MdLocalShipping },
  { name: "MdFlight", label: "Viajes / Turismo", Component: MdFlight },
  { name: "MdHotel", label: "Hotel / Alojamiento", Component: MdHotel },
  { name: "MdSportsEsports", label: "Gaming", Component: MdSportsEsports },
  { name: "MdSportsTennis", label: "Tenis / Deportes", Component: MdSportsTennis },
  { name: "MdSportsFootball", label: "Fútbol", Component: MdSportsFootball },
  { name: "MdSportsMartialArts", label: "Artes Marciales", Component: MdSportsMartialArts },
  { name: "MdPool", label: "Natación / Piscina", Component: MdPool },
  { name: "MdStar", label: "Destacado", Component: MdStar },
  { name: "MdFavorite", label: "Favorito", Component: MdFavorite },
  { name: "MdCategory", label: "Categoría general", Component: MdCategory }
];

interface ServiceCategory {
  _id: string;
  name: string;
  description?: string;
  icon?: string;
  order?: number;
  active?: boolean;
}

interface CategoryFormState {
  name: string;
  description: string;
  icon: string;
  order: string;
}

const defaultForm: CategoryFormState = {
  name: "",
  description: "",
  icon: "",
  order: ""
};

const IconComponent = ({ iconName, size = 20 }: { iconName: string; size?: number }) => {
  const option = ICON_OPTIONS.find((o) => o.name === iconName);
  if (!option) return null;
  const { Component } = option;
  return <Component size={size} />;
};

const IconPicker = ({
  value,
  onChange
}: {
  value: string;
  onChange: (name: string) => void;
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return ICON_OPTIONS.filter(
      (o) => o.label.toLowerCase().includes(q) || o.name.toLowerCase().includes(q)
    );
  }, [search]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const selected = ICON_OPTIONS.find((o) => o.name === value);

  return (
    <div className="icon-picker" ref={containerRef}>
      <button
        type="button"
        className="icon-picker__trigger"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {selected ? (
          <>
            <span className="icon-picker__preview">
              <selected.Component size={20} />
            </span>
            <span className="icon-picker__label">{selected.label}</span>
          </>
        ) : (
          <span className="icon-picker__placeholder">Sin ícono</span>
        )}
        <MdContentCut className="icon-picker__chevron" size={14} style={{ opacity: 0.4 }} />
      </button>

      {open ? (
        <div className="icon-picker__dropdown" role="listbox">
          <div className="icon-picker__search-wrap">
            <input
              className="icon-picker__search"
              type="text"
              placeholder="Buscar ícono…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>
          <div className="icon-picker__grid">
            <button
              type="button"
              role="option"
              aria-selected={value === ""}
              className={`icon-picker__item icon-picker__item--none ${value === "" ? "icon-picker__item--selected" : ""}`}
              onClick={() => {
                onChange("");
                setOpen(false);
                setSearch("");
              }}
            >
              <span className="icon-picker__item-icon">—</span>
              <span className="icon-picker__item-label">Sin ícono</span>
            </button>
            {filtered.map((option) => (
              <button
                key={option.name}
                type="button"
                role="option"
                aria-selected={value === option.name}
                className={`icon-picker__item ${value === option.name ? "icon-picker__item--selected" : ""}`}
                onClick={() => {
                  onChange(option.name);
                  setOpen(false);
                  setSearch("");
                }}
                title={option.label}
              >
                <span className="icon-picker__item-icon">
                  <option.Component size={22} />
                </span>
                <span className="icon-picker__item-label">{option.label}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export const CategoriesPage = () => {
  const { token } = useAuth();
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CategoryFormState>(defaultForm);

  const authHeaders = useMemo(() => {
    if (!token) return null;
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    };
  }, [token]);

  const fetchCategories = async () => {
    if (!authHeaders) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/service-categories`, {
        headers: authHeaders
      });
      if (!response.ok) throw new Error("No se pudieron cargar las categorías");
      const data = (await response.json()) as ServiceCategory[];
      setCategories(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authHeaders]);

  const openModal = (category?: ServiceCategory) => {
    if (category) {
      setEditingId(category._id);
      setForm({
        name: category.name,
        description: category.description ?? "",
        icon: category.icon ?? "",
        order: category.order?.toString() ?? ""
      });
    } else {
      setEditingId(null);
      setForm(defaultForm);
    }
    setError(null);
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
      description: form.description,
      icon: form.icon || undefined,
      order: form.order ? Number(form.order) : 0
    };

    try {
      const url = editingId
        ? `${API_BASE_URL}/service-categories/${editingId}`
        : `${API_BASE_URL}/service-categories`;
      const method = editingId ? "PATCH" : "POST";
      const response = await fetch(url, {
        method,
        headers: authHeaders,
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error("No se pudo guardar la categoría");
      await fetchCategories();
      closeModal();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!authHeaders || !window.confirm("¿Eliminar esta categoría?")) return;
    try {
      const response = await fetch(`${API_BASE_URL}/service-categories/${id}`, {
        method: "DELETE",
        headers: authHeaders
      });
      if (!response.ok) throw new Error("No se pudo eliminar la categoría");
      setCategories((prev) => prev.filter((c) => c._id !== id));
    } catch (err) {
      setError((err as Error).message);
    }
  };

  if (!token) return <p>Inicia sesión para gestionar categorías.</p>;

  return (
    <div className="categories-page">
      <header className="categories-page__header">
        <div>
          <h1>Categorías</h1>
          <p>Administra las categorías de servicios de la plataforma.</p>
        </div>
        <button className="primary-button" type="button" onClick={() => openModal()}>
          Nueva categoría
        </button>
      </header>

      <section className="categories-page__table">
        <div className="table-header">
          <h2>Listado</h2>
          <button
            type="button"
            className="icon-button icon-button--ghost"
            onClick={fetchCategories}
            disabled={loading}
            aria-label="Refrescar lista de categorías"
          >
            {loading ? "…" : <MdRefresh />}
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
                <th>Ícono</th>
                <th>Nombre</th>
                <th>Descripción</th>
                <th>Orden</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {categories.length === 0 ? (
                <tr>
                  <td className="table-empty" colSpan={5}>
                    Aún no hay categorías creadas.
                  </td>
                </tr>
              ) : (
                categories.map((category) => (
                  <tr key={category._id}>
                    <td className="category-icon-cell">
                      {category.icon ? (
                        <span className="category-icon-badge">
                          <IconComponent iconName={category.icon} size={22} />
                        </span>
                      ) : (
                        <span className="category-icon-badge category-icon-badge--empty">—</span>
                      )}
                    </td>
                    <td>
                      <strong>{category.name}</strong>
                    </td>
                    <td className="category-description">{category.description || "—"}</td>
                    <td>{category.order ?? 0}</td>
                    <td className="table-actions">
                      <button
                        type="button"
                        className="icon-button icon-button--ghost"
                        onClick={() => openModal(category)}
                        aria-label={`Editar ${category.name}`}
                      >
                        <MdEdit />
                      </button>
                      <button
                        type="button"
                        className="icon-button icon-button--danger"
                        onClick={() => handleDelete(category._id)}
                        aria-label={`Eliminar ${category.name}`}
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
                <h2>{editingId ? "Editar categoría" : "Nueva categoría"}</h2>
                <p className="modal__subtitle">
                  Completa la información para {editingId ? "actualizar" : "crear"} la categoría.
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

            <form className="categories-form" onSubmit={handleSubmit}>
              <label htmlFor="category-name">Nombre</label>
              <input
                id="category-name"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                required
                minLength={2}
              />

              <label htmlFor="category-description">Descripción</label>
              <textarea
                id="category-description"
                rows={2}
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              />

              <label>Ícono</label>
              <IconPicker
                value={form.icon}
                onChange={(name) => setForm((prev) => ({ ...prev, icon: name }))}
              />

              <label htmlFor="category-order">Orden</label>
              <input
                id="category-order"
                type="number"
                min="0"
                value={form.order}
                onChange={(e) => setForm((prev) => ({ ...prev, order: e.target.value }))}
              />

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
