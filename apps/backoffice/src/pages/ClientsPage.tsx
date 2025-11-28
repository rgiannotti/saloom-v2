import React, { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useAuth } from "../auth/AuthProvider";
import { API_BASE_URL, GOOGLE_MAPS_API_KEY, GOOGLE_MAPS_COUNTRY } from "../config";
import { useGooglePlaces } from "../hooks/useGooglePlaces";
import "./clients.css";

interface ServiceCategoryOption {
  _id: string;
  name: string;
  description?: string;
}

interface Client {
  _id: string;
  code: number;
  denomination: string;
  rif: string;
  fiscalAddress?: string;
  name: string;
  email: string;
  phone: string;
  person: string;
  blocked: boolean;
  home: boolean;
  useGoogleMap?: boolean;
  website?: string;
  address?: AddressState;
  location?: { coordinates?: [number, number] };
  professionals?: Array<{
    professional: { _id: string; name: string } | string;
    services: Array<{
      service: { _id: string; name: string } | string;
      price: number;
      slot: number;
    }>;
    schedule: Array<{ day: string; start: string; end: string }>;
  }>;
  categories?: Array<{ _id: string; name: string } | string>;
}

interface ClientFormState {
  rif: string;
  denomination: string;
  fiscalAddress: string;
  name: string;
  person: string;
  email: string;
  phone: string;
  website: string;
  useGoogleMap: boolean;
  home: boolean;
  blocked: boolean;
  categories: string[];
  communicationChannels: string[];
}

interface AddressState {
  full: string;
  street: string;
  number: string;
  comunity: string;
  province: string;
  city: string;
  postal: string;
  placeId: string;
  coordinates: [number, number];
}

interface ProfessionalServiceForm {
  serviceId: string;
  serviceName: string;
  price: string;
  slot: string;
}

interface ProfessionalScheduleForm {
  day: string;
  start: string;
  end: string;
}

interface ClientProfessionalForm {
  id: string;
  name: string;
  services: ProfessionalServiceForm[];
  schedule: ProfessionalScheduleForm[];
  uiExpanded?: boolean;
}

interface ProfessionalOption {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  roles?: string[];
}

interface ServiceOption {
  _id: string;
  name: string;
  home?: boolean;
  order?: number;
}

const defaultForm: ClientFormState = {
  rif: "",
  denomination: "",
  fiscalAddress: "",
  name: "",
  person: "",
  email: "",
  phone: "",
  website: "",
  useGoogleMap: true,
  home: false,
  blocked: false,
  categories: [],
  communicationChannels: []
};

const defaultAddress: AddressState = {
  full: "",
  street: "",
  number: "",
  comunity: "",
  province: "",
  city: "",
  postal: "",
  placeId: "",
  coordinates: [0, 0]
};

const daysOfWeek = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

const createEmptyService = (): ProfessionalServiceForm => ({
  serviceId: "",
  serviceName: "",
  price: "",
  slot: "1"
});

const createEmptySchedule = (): ProfessionalScheduleForm => ({
  day: daysOfWeek[0],
  start: "09:00",
  end: "18:00"
});

const createEmptyProfessional = (): ClientProfessionalForm => ({
  id: "",
  name: "",
  services: [],
  schedule: [],
  uiExpanded: false
});

export const ClientsPage = () => {
  const { token } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ClientFormState>(defaultForm);
  const [addressState, setAddressState] = useState<AddressState>(defaultAddress);
  const [professionals, setProfessionals] = useState<ClientProfessionalForm[]>([]);
  const [activeTab, setActiveTab] = useState<"general" | "personal">("general");
  const [catalogs, setCatalogs] = useState<{
    professionals: ProfessionalOption[];
    services: ServiceOption[];
    categories: ServiceCategoryOption[];
  }>({ professionals: [], services: [], categories: [] });
  const [catalogStatus, setCatalogStatus] = useState<{ loading: boolean; error: string | null }>({
    loading: false,
    error: null
  });
  const catalogsFetchedRef = useRef(false);
  const [professionalPickerOpen, setProfessionalPickerOpen] = useState(false);
  const [selectedProfessionalId, setSelectedProfessionalId] = useState("");
  const [professionalPickerError, setProfessionalPickerError] = useState<string | null>(null);
  const [newProModalOpen, setNewProModalOpen] = useState(false);
  const [newProForm, setNewProForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "pro"
  });
  const [newProError, setNewProError] = useState<string | null>(null);
  const [newProSubmitting, setNewProSubmitting] = useState(false);
  const professionalsEndRef = useRef<HTMLDivElement | null>(null);
  const toggleProfessionalExpanded = (index: number) => {
    setProfessionals((prev) =>
      prev.map((pro, i) => (i === index ? { ...pro, uiExpanded: !pro.uiExpanded } : pro))
    );
  };
  const googleInputRef = useRef<HTMLInputElement | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const { loaded: placesLoaded, error: placesError } = useGooglePlaces(
    GOOGLE_MAPS_API_KEY,
    form.useGoogleMap,
    GOOGLE_MAPS_COUNTRY
  );
  const professionalLookup = useMemo(() => {
    const map = new Map<string, ProfessionalOption>();
    catalogs.professionals.forEach((pro) => map.set(pro._id, pro));
    return map;
  }, [catalogs.professionals]);
  const serviceLookup = useMemo(() => {
    const map = new Map<string, ServiceOption>();
    catalogs.services.forEach((service) => map.set(service._id, service));
    return map;
  }, [catalogs.services]);

  const getServiceCategoryId = useCallback((service: ServiceOption | undefined) => {
    if (!service) {
      return null;
    }
    if (typeof service.category === "string") {
      return service.category;
    }
    return service.category?._id ?? null;
  }, []);

  const filteredServicesByCategory = useMemo(() => {
    if (!form.categories.length) {
      return catalogs.services;
    }
    const allowed = new Set(form.categories);
    return catalogs.services.filter((service) => {
      const categoryId = getServiceCategoryId(service);
      return categoryId ? allowed.has(categoryId) : false;
    });
  }, [catalogs.services, form.categories, getServiceCategoryId]);

  const getServiceOptionsForSelect = useCallback(
    (serviceId?: string) => {
      if (!form.categories.length) {
        return catalogs.services;
      }
      const allowed = filteredServicesByCategory;
      if (serviceId && !allowed.some((option) => option._id === serviceId)) {
        const selected = catalogs.services.find((option) => option._id === serviceId);
        return selected ? [...allowed, selected] : allowed;
      }
      return allowed;
    },
    [catalogs.services, filteredServicesByCategory, form.categories.length]
  );
  const availableProfessionalOptions = useMemo(
    () =>
      catalogs.professionals.filter(
        (option) => !professionals.some((assignment) => assignment.id === option._id)
      ),
    [catalogs.professionals, professionals]
  );

  const removeProfessional = (index: number) => {
    setProfessionals((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleCategorySelection = (categoryId: string) => {
    setForm((prev) => {
      const exists = prev.categories.includes(categoryId);
      return {
        ...prev,
        categories: exists
          ? prev.categories.filter((id) => id !== categoryId)
          : [...prev.categories, categoryId]
      };
    });
  };

  const updateProfessionalField = (index: number, field: "id" | "name", value: string) => {
    setProfessionals((prev) =>
      prev.map((pro, i) => {
        if (i !== index) {
          return pro;
        }
        if (field === "id") {
          const selected = professionalLookup.get(value);
          return {
            ...pro,
            id: value,
            name: selected?.name ?? (value ? pro.name : "")
          };
        }
        return { ...pro, [field]: value };
      })
    );
  };

  const openProfessionalPicker = () => {
    setActiveTab("personal");
    setProfessionalPickerError(null);
    setSelectedProfessionalId(availableProfessionalOptions[0]?._id ?? "");
    setProfessionalPickerOpen(true);
  };

  const closeProfessionalPicker = () => {
    setProfessionalPickerOpen(false);
    setProfessionalPickerError(null);
    setSelectedProfessionalId("");
  };

  const confirmProfessionalSelection = () => {
    if (!selectedProfessionalId) {
      setProfessionalPickerError("Selecciona un usuario profesional.");
      return;
    }
    const selected = professionalLookup.get(selectedProfessionalId);
    setProfessionals((prev) => [
      ...prev,
      {
        ...createEmptyProfessional(),
        id: selectedProfessionalId,
        name: selected?.name ?? ""
      }
    ]);
    closeProfessionalPicker();
  };

  const addProfessionalService = (index: number) => {
    setProfessionals((prev) =>
      prev.map((pro, i) =>
        i === index ? { ...pro, services: [...pro.services, createEmptyService()] } : pro
      )
    );
  };

  const updateProfessionalService = (
    proIndex: number,
    serviceIndex: number,
    field: keyof ProfessionalServiceForm,
    value: string
  ) => {
    setProfessionals((prev) =>
      prev.map((pro, i) =>
        i === proIndex
          ? {
              ...pro,
              services: pro.services.map((service, sIdx) => {
                if (sIdx !== serviceIndex) {
                  return service;
                }
                if (field === "serviceId") {
                  const selected = serviceLookup.get(value);
                  return {
                    ...service,
                    serviceId: value,
                    serviceName: selected?.name ?? (value ? service.serviceName : "")
                  };
                }
                return { ...service, [field]: value };
              })
            }
          : pro
      )
    );
  };

  const removeProfessionalService = (proIndex: number, serviceIndex: number) => {
    setProfessionals((prev) =>
      prev.map((pro, i) => {
        if (i !== proIndex) {
          return pro;
        }
        const nextServices = pro.services.filter((_, sIdx) => sIdx !== serviceIndex);
        return {
          ...pro,
          services: nextServices.length ? nextServices : [createEmptyService()]
        };
      })
    );
  };

  const addProfessionalSchedule = (index: number) => {
    setProfessionals((prev) =>
      prev.map((pro, i) =>
        i === index ? { ...pro, schedule: [...pro.schedule, createEmptySchedule()] } : pro
      )
    );
  };

  const updateProfessionalSchedule = (
    proIndex: number,
    scheduleIndex: number,
    field: keyof ProfessionalScheduleForm,
    value: string
  ) => {
    setProfessionals((prev) =>
      prev.map((pro, i) =>
        i === proIndex
          ? {
              ...pro,
              schedule: pro.schedule.map((entry, eIdx) =>
                eIdx === scheduleIndex ? { ...entry, [field]: value } : entry
              )
            }
          : pro
      )
    );
  };

  const removeProfessionalSchedule = (proIndex: number, scheduleIndex: number) => {
    setProfessionals((prev) =>
      prev.map((pro, i) =>
        i === proIndex
          ? { ...pro, schedule: pro.schedule.filter((_, eIdx) => eIdx !== scheduleIndex) }
          : pro
      )
    );
  };

  const authHeaders = useMemo(() => {
    if (!token) {
      return null;
    }
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    };
  }, [token]);

  const loadCatalogs = useCallback(
    async (force = false) => {
      if (!authHeaders) {
        return;
      }
      if (!force && catalogsFetchedRef.current) {
        return;
      }
      setCatalogStatus((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const usersUrl = new URL(`${API_BASE_URL}/app/users`);
        usersUrl.searchParams.set("roles", "pro,staff");
        if (editingId) {
          usersUrl.searchParams.set("clientId", editingId);
        }
        const [professionalsResponse, servicesResponse, categoriesResponse] = await Promise.all([
          fetch(usersUrl.toString(), {
            headers: authHeaders
          }),
          fetch(`${API_BASE_URL}/services`, {
            headers: authHeaders
          }),
          fetch(`${API_BASE_URL}/service-categories`, {
            headers: authHeaders
          })
        ]);
        if (!professionalsResponse.ok || !servicesResponse.ok || !categoriesResponse.ok) {
          throw new Error(
            "No se pudieron cargar los catálogos de profesionales, servicios y categorías."
          );
        }
        const professionalsData = (await professionalsResponse.json()) as ProfessionalOption[];
        const serviceData = (await servicesResponse.json()) as ServiceOption[];
        const categoryData = (await categoriesResponse.json()) as ServiceCategoryOption[];
        const prosOnly = professionalsData.filter((user) =>
          user.roles?.some((role) => {
            const normalized = role.toLowerCase();
            return normalized === "pro" || normalized === "staff";
          })
        );
        setCatalogs({
          professionals: prosOnly,
          services: serviceData,
          categories: categoryData
        });
        catalogsFetchedRef.current = true;
        setCatalogStatus({ loading: false, error: null });
      } catch (err) {
        setCatalogStatus({ loading: false, error: (err as Error).message });
      }
    },
    [authHeaders, editingId]
  );

  useEffect(() => {
    catalogsFetchedRef.current = false;
  }, [authHeaders, editingId]);

  useEffect(() => {
    loadCatalogs();
  }, [loadCatalogs]);

  useEffect(() => {
    if (!catalogs.professionals.length) {
      return;
    }
    setProfessionals((prev) => {
      let changed = false;
      const next = prev.map((assignment) => {
        if (!assignment.id) {
          return assignment;
        }
        const match = catalogs.professionals.find((pro) => pro._id === assignment.id);
        if (match && assignment.name !== match.name) {
          changed = true;
          return { ...assignment, name: match.name };
        }
        return assignment;
      });
      return changed ? next : prev;
    });
  }, [catalogs.professionals]);

  useEffect(() => {
    if (!catalogs.services.length) {
      return;
    }
    setProfessionals((prev) => {
      let changed = false;
      const next = prev.map((assignment) => ({
        ...assignment,
        services: assignment.services.map((service) => {
          if (!service.serviceId) {
            return service;
          }
          const match = catalogs.services.find((option) => option._id === service.serviceId);
          if (match && service.serviceName !== match.name) {
            changed = true;
            return { ...service, serviceName: match.name };
          }
          return service;
        })
      }));
      return changed ? next : prev;
    });
  }, [catalogs.services]);

  useEffect(() => {
    if (!form.useGoogleMap) {
      setAddressState(defaultAddress);
      return;
    }
    if (!editorOpen) {
      return;
    }
    if (typeof window === "undefined") {
      return;
    }
    const googleObj = (window as typeof window & { google?: typeof google }).google;
    if (!placesLoaded || !googleInputRef.current || !googleObj?.maps?.places) {
      return;
    }
    const countries = (GOOGLE_MAPS_COUNTRY || "")
      .split(",")
      .map((code) => code.trim())
      .filter(Boolean);
    const componentRestrictions: google.maps.places.ComponentRestrictions | undefined =
      countries.length === 0
        ? undefined
        : {
            country: countries.length === 1 ? countries[0] : countries
          };
    const autocompleteOptions: google.maps.places.AutocompleteOptions = {
      types: ["geocode", "establishment"]
    };
    autocompleteOptions.fields = [
      "address_components",
      "formatted_address",
      "geometry",
      "place_id"
    ];
    if (componentRestrictions) {
      autocompleteOptions.componentRestrictions = componentRestrictions;
    }
    const autocomplete = new googleObj.maps.places.Autocomplete(
      googleInputRef.current,
      autocompleteOptions
    );
    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (!place || !place.address_components || !place.place_id) {
        return;
      }
      const getComponent = (types: string[]) =>
        place.address_components?.find((component) =>
          component.types.some((type) => types.includes(type))
        )?.long_name ?? "";
      const location = place.geometry?.location;
      setAddressState({
        full: place.formatted_address ?? "",
        street: getComponent(["route"]),
        number: getComponent(["street_number"]),
        comunity: getComponent(["administrative_area_level_2", "sublocality"]),
        province: getComponent(["administrative_area_level_1"]),
        city:
          getComponent(["locality"]) ||
          getComponent(["administrative_area_level_3"]) ||
          getComponent(["administrative_area_level_2"]),
        postal: getComponent(["postal_code"]),
        placeId: place.place_id ?? "",
        coordinates: location ? [location.lng(), location.lat()] : [0, 0]
      });
    });
    autocompleteRef.current = autocomplete;
    return () => {
      if (autocompleteRef.current) {
        googleObj?.maps?.event?.clearInstanceListeners(autocompleteRef.current);
        autocompleteRef.current = null;
      }
    };
  }, [form.useGoogleMap, placesLoaded, GOOGLE_MAPS_COUNTRY, editorOpen]);

  useEffect(() => {
    if (!editorOpen || !googleInputRef.current) {
      return;
    }
    if (form.useGoogleMap) {
      googleInputRef.current.value = addressState.full ?? "";
    } else {
      googleInputRef.current.value = "";
    }
  }, [editorOpen, form.useGoogleMap, addressState.full]);

  useEffect(() => {
    if (!professionalPickerOpen) {
      return;
    }
    if (!availableProfessionalOptions.length) {
      setSelectedProfessionalId("");
      return;
    }
    if (!availableProfessionalOptions.some((option) => option._id === selectedProfessionalId)) {
      setSelectedProfessionalId(availableProfessionalOptions[0]._id);
    }
  }, [professionalPickerOpen, availableProfessionalOptions, selectedProfessionalId]);

  const fetchClients = async () => {
    if (!authHeaders) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/backoffice/clients`, {
        headers: authHeaders
      });
      if (!response.ok) {
        throw new Error("No se pudieron cargar los clientes");
      }
      const data = (await response.json()) as Client[];
      setClients(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authHeaders]);

  const openEditor = (client?: Client) => {
    if (client) {
      setEditingId(client._id);
      const categoryIds = (client.categories ?? [])
        .map((category) =>
          typeof category === "string" ? category : category?._id ?? ""
        )
        .filter(Boolean);
      setForm({
        rif: client.rif,
        denomination: client.denomination,
        fiscalAddress: client.fiscalAddress ?? "",
        name: client.name,
        person: client.person,
        email: client.email,
        phone: client.phone,
        website: client.website ?? "",
        useGoogleMap: Boolean(client.useGoogleMap && client.address?.placeId),
        home: client.home,
        blocked: client.blocked,
        categories: categoryIds,
        communicationChannels: client.communicationChannels ?? []
      });
      setAddressState(
        client.useGoogleMap && client.address?.placeId
          ? {
              full: client.address.full,
              street: client.address.street,
              number: client.address.number,
              comunity: client.address.comunity,
              province: client.address.province,
              city: client.address.city,
              postal: client.address.postal,
              placeId: client.address.placeId,
              coordinates:
                Array.isArray(client.location?.coordinates) &&
                client.location?.coordinates.length === 2
                  ? (client.location?.coordinates as [number, number])
                  : [0, 0]
            }
          : defaultAddress
      );
      setProfessionals(
        (client.professionals ?? []).map((assignment) => {
          const servicesList =
            assignment.services && assignment.services.length
              ? assignment.services.map((service) => ({
                  serviceId:
                    typeof service.service === "string"
                      ? service.service
                      : (service.service?._id ?? ""),
                  serviceName:
                    typeof service.service === "string"
                      ? service.service
                      : (service.service?.name ?? "Servicio"),
                  price: service.price.toString(),
                  slot: service.slot.toString()
                }))
              : [createEmptyService()];
          return {
            id:
              typeof assignment.professional === "string"
                ? assignment.professional
                : (assignment.professional?._id ?? ""),
            name:
              typeof assignment.professional === "string"
                ? ""
                : (assignment.professional?.name ?? ""),
            services: servicesList,
            schedule: (assignment.schedule ?? []).map((entry) => ({
              day: entry.day,
              start: entry.start,
              end: entry.end
            })),
            uiExpanded: false
          };
        })
      );
    } else {
      setEditingId(null);
      setForm(defaultForm);
      setAddressState(defaultAddress);
      setProfessionals([]);
    }
    setActiveTab("general");
    setEditorOpen(true);
  };

  const closeEditor = () => {
    setEditorOpen(false);
    setEditingId(null);
    setForm(defaultForm);
    setAddressState(defaultAddress);
    setProfessionals([]);
    setError(null);
    setActiveTab("general");
    setProfessionalPickerOpen(false);
    setProfessionalPickerError(null);
    setSelectedProfessionalId("");
    setNewProModalOpen(false);
    setNewProError(null);
    setNewProSubmitting(false);
  };

  const validateProfessionalAssignments = () => {
    if (!professionals.length) {
      return null;
    }
    for (let index = 0; index < professionals.length; index += 1) {
      const assignment = professionals[index];
      const label = assignment.name || `Profesional ${index + 1}`;
      if (!assignment.id.trim()) {
        return `Selecciona un profesional para ${label}.`;
      }
      const validServices = assignment.services.filter((service) => service.serviceId.trim());
      const invalidPrice = validServices.find((service) => {
        if (!service.price.trim()) {
          return true;
        }
        const priceValue = Number(service.price);
        return Number.isNaN(priceValue) || priceValue < 0;
      });
      if (invalidPrice) {
        return `El servicio ${
          invalidPrice.serviceName || invalidPrice.serviceId || "sin nombre"
        } de ${label} necesita un precio válido.`;
      }
      const invalidSlot = validServices.find((service) => {
        if (!service.slot.trim()) {
          return true;
        }
        const slotValue = Number(service.slot);
        return Number.isNaN(slotValue) || slotValue <= 0;
      });
      if (invalidSlot) {
        return `El servicio ${
          invalidSlot.serviceName || invalidSlot.serviceId || "sin nombre"
        } de ${label} debe tener al menos 1 slot.`;
      }
      const invalidSchedule = assignment.schedule.find(
        (entry) => !entry.day || !entry.start || !entry.end
      );
      if (invalidSchedule) {
        return `Completa las horas de los días configurados para ${label} o elimina las filas incompletas.`;
      }
    }
    return null;
  };

  const buildProfessionalPayload = () =>
    professionals
      .map((assignment) => {
        const servicesPayload = assignment.services
          .filter((service) => service.serviceId.trim())
          .map((service) => ({
            service: service.serviceId.trim(),
            price: Number(service.price),
            slot: Number(service.slot)
          }));
        const schedulePayload = assignment.schedule
          .filter((entry) => entry.day && entry.start && entry.end)
          .map((entry) => ({
            day: entry.day,
            start: entry.start,
            end: entry.end
          }));
        return {
          professional: assignment.id.trim(),
          services: servicesPayload,
          schedule: schedulePayload
        };
      })
      .filter((assignment) => assignment.professional);

  const openNewProModal = () => {
    setNewProForm({ name: "", email: "", phone: "", password: "", role: "pro" });
    setNewProError(null);
    setNewProModalOpen(true);
  };

  const closeNewProModal = () => {
    setNewProModalOpen(false);
    setNewProError(null);
    setNewProSubmitting(false);
  };

  const handleCreateProUserSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!authHeaders) {
      setNewProError("Sesión inválida, vuelve a ingresar.");
      return;
    }
    if (!editingId) {
      setNewProError("Guarda el cliente antes de crear profesionales.");
      return;
    }
    if (newProForm.password.trim().length < 8) {
      setNewProError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    setNewProSubmitting(true);
    setNewProError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/app/users`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          name: newProForm.name,
          email: newProForm.email,
          phone: newProForm.phone,
          password: newProForm.password,
          roles: [newProForm.role],
          client: editingId
        })
      });
      if (!response.ok) {
        throw new Error("No se pudo crear el usuario");
      }
      const created = (await response.json()) as ProfessionalOption;
      setCatalogs((prev) => ({
        ...prev,
        professionals: [...prev.professionals, created]
      }));
      setProfessionals((prev) => [
        ...prev.map((pro) => ({ ...pro, uiExpanded: false })),
        {
          ...createEmptyProfessional(),
          id: created._id,
          name: created.name,
          uiExpanded: true
        }
      ]);
      setActiveTab("personal");
      closeNewProModal();
      closeProfessionalPicker();
      setTimeout(() => {
        professionalsEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 0);
    } catch (err) {
      setNewProError((err as Error).message);
    } finally {
      setNewProSubmitting(false);
    }
  };

  const updateNewProForm = (field: keyof typeof newProForm, value: string) => {
    setNewProForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!authHeaders) {
      setError("Sesión inválida, vuelve a ingresar.");
      return;
    }
    setSubmitting(true);
    setError(null);

    const validationError = validateProfessionalAssignments();
    if (validationError) {
      setError(validationError);
      setSubmitting(false);
      return;
    }

    const addressPayload = form.useGoogleMap
      ? {
          full: addressState.full,
          street: addressState.street,
          number: addressState.number,
          comunity: addressState.comunity,
          province: addressState.province,
          city: addressState.city,
          postal: addressState.postal,
          placeId: addressState.placeId
        }
      : {
          full: form.denomination,
          street: "",
          number: "",
          comunity: "",
          province: "",
          city: "",
          postal: "",
          placeId: ""
        };

    const payload = {
      ...form,
      address: addressPayload,
      location: form.useGoogleMap
        ? { type: "Point", coordinates: addressState.coordinates }
        : { type: "Point", coordinates: [0, 0] },
      professionals: buildProfessionalPayload(),
      payments: [],
      communicationChannels: form.communicationChannels
    };

    try {
      const url = editingId
        ? `${API_BASE_URL}/backoffice/clients/${editingId}`
        : `${API_BASE_URL}/backoffice/clients`;
      const method = editingId ? "PATCH" : "POST";
      const response = await fetch(url, {
        method,
        headers: authHeaders,
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        throw new Error("No se pudo guardar el cliente");
      }
      await fetchClients();
      closeEditor();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!authHeaders || !window.confirm("¿Eliminar este cliente?")) {
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/backoffice/clients/${id}`, {
        method: "DELETE",
        headers: authHeaders
      });
      if (!response.ok) {
        throw new Error("No se pudo eliminar el cliente");
      }
      setClients((prev) => prev.filter((client) => client._id !== id));
    } catch (err) {
      setError((err as Error).message);
    }
  };

  if (!token) {
    return <p>Inicia sesión para gestionar clientes.</p>;
  }

  if (!editorOpen) {
    return (
      <div className="clients-page">
        <header className="clients-page__header">
          <div>
            <h1>Profesionales</h1>
            <p>Administra los clientes registrados en la plataforma.</p>
          </div>
          <button type="button" className="primary-button" onClick={() => openEditor()}>
            Nuevo cliente
          </button>
        </header>

        <section className="clients-page__table">
          <div className="table-header">
            <h2>Listado</h2>
            <button
              type="button"
              className="icon-button icon-button--ghost"
              onClick={fetchClients}
              disabled={loading}
              aria-label="Refrescar clientes"
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
                  <th>Código</th>
                  <th>Cliente</th>
                  <th>Contacto</th>
                  <th>Estado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {clients.length === 0 ? (
                  <tr>
                    <td className="table-empty" colSpan={5}>
                      No hay clientes registrados todavía.
                    </td>
                  </tr>
                ) : (
                  clients.map((client) => (
                    <tr key={client._id}>
                      <td>#{client.code.toString().padStart(4, "0")}</td>
                      <td>
                        <div className="client-info">
                          <strong>{client.denomination}</strong>
                          <span>{client.rif}</span>
                        </div>
                      </td>
                      <td>
                        <div className="client-info">
                          <strong>{client.person}</strong>
                          <span>{client.email}</span>
                          <span>{client.phone}</span>
                        </div>
                      </td>
                      <td>
                        <div className="client-status">
                          <span className={client.home ? "pill pill--success" : "pill"}>
                            Domicilio
                          </span>
                          <span className={client.blocked ? "pill pill--danger" : "pill"}>
                            {client.blocked ? "Bloqueado" : "Activo"}
                          </span>
                        </div>
                      </td>
                      <td className="table-actions">
                        <button
                          type="button"
                          className="icon-button icon-button--ghost"
                          onClick={() => openEditor(client)}
                          aria-label={`Editar ${client.denomination}`}
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          className="icon-button icon-button--danger"
                          onClick={() => handleDelete(client._id)}
                          aria-label={`Eliminar ${client.denomination}`}
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
    );
  }

  return (
    <div className="clients-page">
      <header className="clients-page__header clients-page__header--form">
        <div>
          <button type="button" className="ghost-button" onClick={closeEditor}>
            {"<- Volver al listado"}
          </button>
          <h1 style={{ marginTop: "0.5rem" }}>{editingId ? "Editar cliente" : "Nuevo cliente"}</h1>
          <p>Completa la información y guarda los cambios.</p>
        </div>
        <button type="button" className="ghost-button" onClick={closeEditor}>
          Cancelar
        </button>
      </header>

      <section className="clients-form-page" aria-live="polite">
        <div className="clients-editor__panel">
          <form className="clients-form" onSubmit={handleSubmit}>
            <div className="clients-tabs" role="tablist">
              <button
                type="button"
                className={`clients-tabs__button ${
                  activeTab === "general" ? "clients-tabs__button--active" : ""
                }`}
                onClick={() => setActiveTab("general")}
              >
                General
              </button>
              <button
                type="button"
                className={`clients-tabs__button ${
                  activeTab === "personal" ? "clients-tabs__button--active" : ""
                }`}
                onClick={() => setActiveTab("personal")}
              >
                Personal
              </button>
            </div>

            {activeTab === "general" ? (
              <>
                <div className="form-grid">
                  <div className="form-field">
                    <label htmlFor="client-rif">RIF / Fiscal</label>
                    <input
                      id="client-rif"
                      value={form.rif}
                      onChange={(e) => setForm((prev) => ({ ...prev, rif: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="client-denomination">Denominación fiscal</label>
                    <input
                      id="client-denomination"
                      value={form.denomination}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, denomination: e.target.value }))
                      }
                      required
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="client-fiscal-address">Dirección fiscal</label>
                    <input
                      id="client-fiscal-address"
                      value={form.fiscalAddress}
                      onChange={(e) => setForm((prev) => ({ ...prev, fiscalAddress: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="client-name">Nombre Comercial</label>
                    <input
                      id="client-name"
                      value={form.name}
                      onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="client-person">Contacto</label>
                    <input
                      id="client-person"
                      value={form.person}
                      onChange={(e) => setForm((prev) => ({ ...prev, person: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="client-email">Email</label>
                    <input
                      id="client-email"
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="client-phone">Teléfono</label>
                    <input
                      id="client-phone"
                      value={form.phone}
                      onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="client-website">Website</label>
                    <input
                      id="client-website"
                      value={form.website}
                      onChange={(e) => setForm((prev) => ({ ...prev, website: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="switches-grid">
                  <label>
                    <input
                      type="checkbox"
                      checked={form.home}
                      onChange={(e) => setForm((prev) => ({ ...prev, home: e.target.checked }))}
                    />
                    Servicios a domicilio
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={form.blocked}
                      onChange={(e) => setForm((prev) => ({ ...prev, blocked: e.target.checked }))}
                    />
                    Bloqueado
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={form.useGoogleMap}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, useGoogleMap: e.target.checked }))
                      }
                    />
                    Usar Google Maps
                  </label>
                </div>

                {form.useGoogleMap ? (
                  <div className="google-maps-field">
                    <label htmlFor="client-map">Dirección (Google Maps)</label>
                    <input
                      id="client-map"
                      ref={googleInputRef}
                      placeholder="Buscar dirección..."
                      disabled={!placesLoaded}
                    />
                    {placesError ? (
                      <p className="error">{placesError}</p>
                    ) : (
                      <small>{addressState.full || "Selecciona una dirección sugerida."}</small>
                    )}
                  </div>
                ) : null}

                <div className="clients-category-section">
                  <div className="clients-category-section__header">
                    <div>
                      <p className="clients-category-section__title">Comunicación con usuarios</p>
                      <p className="clients-category-section__subtitle">
                        Selecciona uno o varios canales para usuarios rol "user".
                      </p>
                    </div>
                  </div>
                  <div className="clients-category-grid">
                    {[
                      { value: "whatsapp", label: "WhatsApp" },
                      { value: "sms", label: "SMS" },
                      { value: "email", label: "Email" }
                    ].map((option) => {
                      const checked = form.communicationChannels.includes(option.value);
                      return (
                        <label
                          key={option.value}
                          className={`clients-category-chip ${
                            checked ? "clients-category-chip--active" : ""
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              const isChecked = e.target.checked;
                              setForm((prev) => {
                                const next = new Set(prev.communicationChannels);
                                if (isChecked) {
                                  next.add(option.value);
                                } else {
                                  next.delete(option.value);
                                }
                                return { ...prev, communicationChannels: Array.from(next) };
                              });
                            }}
                          />
                          <span>{option.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="clients-category-section">
                  <div className="clients-category-section__header">
                    <div>
                      <h4>Categorías del cliente</h4>
                      <p className="muted-text">Asigna las categorías relevantes para este cliente.</p>
                    </div>
                    <button
                      type="button"
                      className="icon-button icon-button--ghost"
                      onClick={() => loadCatalogs(true)}
                      aria-label="Actualizar categorías"
                      disabled={catalogStatus.loading}
                    >
                      {catalogStatus.loading ? "…" : "⟳"}
                    </button>
                  </div>
                  {catalogStatus.error ? (
                    <p className="error" role="alert">
                      {catalogStatus.error}
                    </p>
                  ) : null}
                  <div className="clients-category-grid">
                    {catalogs.categories.length === 0 ? (
                      <p className="muted-text">No hay categorías disponibles.</p>
                    ) : (
                      catalogs.categories.map((category) => (
                        <label
                          key={category._id}
                          className={`clients-category-chip ${
                            form.categories.includes(category._id)
                              ? "clients-category-chip--active"
                              : ""
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={form.categories.includes(category._id)}
                            onChange={() => toggleCategorySelection(category._id)}
                          />
                          {category.name}
                        </label>
                      ))
                    )}
                  </div>
                  <small className="muted-text">
                    {"Administra las categorías desde el módulo de Servicios."}
                  </small>
                </div>
              </>
            ) : (
              <div className="clients-personal-tab">
                <div className="clients-personal__header">
                  <div>
                    <h3>Profesionales asignados</h3>
                    <p className="muted-text">
                      Vincula profesionales (usuarios con rol Pro), sus servicios y horarios por
                      día.
                    </p>
                    <div className="clients-personal__catalog">
                      {catalogStatus.loading
                        ? "Actualizando catálogos..."
                        : catalogs.professionals.length ||
                            catalogs.services.length ||
                            catalogs.categories.length
                          ? `${catalogs.professionals.length} profesionales · ${catalogs.services.length} servicios · ${catalogs.categories.length} categorías`
                          : "Catálogos sin datos cargados"}
                    </div>
                  </div>
                  <div className="clients-personal__actions">
                    <button
                      type="button"
                      className="icon-button icon-button--ghost"
                      onClick={() => loadCatalogs(true)}
                      aria-label="Actualizar catálogos"
                      disabled={catalogStatus.loading}
                    >
                      {catalogStatus.loading ? "…" : "⟳"}
                    </button>
                    <button type="button" className="ghost-button" onClick={openProfessionalPicker}>
                      + Profesional
                    </button>
                  </div>
                </div>
                {catalogStatus.error ? (
                  <p className="error" role="alert">
                    {catalogStatus.error}
                  </p>
                ) : null}
                {professionalPickerOpen ? (
                  <div className="clients-professional-picker">
                    <label htmlFor="clients-professional-select">
                      Selecciona un usuario PRO existente
                    </label>
                    {availableProfessionalOptions.length ? (
                      <select
                        id="clients-professional-select"
                        value={selectedProfessionalId}
                        onChange={(e) => {
                          setSelectedProfessionalId(e.target.value);
                          setProfessionalPickerError(null);
                        }}
                      >
                        {availableProfessionalOptions.map((option) => (
                          <option key={option._id} value={option._id}>
                            {option.name} · {option.email}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <p className="muted-text">
                        No hay usuarios PRO disponibles. Crea uno nuevo para asignarlo al cliente.
                      </p>
                    )}
                    {professionalPickerError ? (
                      <p className="error" role="alert">
                        {professionalPickerError}
                      </p>
                    ) : null}
                    <div className="clients-professional-picker__actions">
                      <button
                        type="button"
                        className="primary-button"
                        onClick={confirmProfessionalSelection}
                        disabled={!availableProfessionalOptions.length}
                      >
                        Agregar
                      </button>
                      <button
                        type="button"
                        className="ghost-button"
                        onClick={closeProfessionalPicker}
                      >
                        Cancelar
                      </button>
                      <button type="button" className="ghost-button" onClick={openNewProModal}>
                        + Usuario
                      </button>
                    </div>
                  </div>
                ) : null}
                {professionals.length === 0 ? (
                  <div className="clients-no-professionals">
                    <p className="muted-text">
                      Aún no se han agregado profesionales. Usa el botón “+ Profesional” para elegir
                      uno existente o crea un nuevo usuario PRO.
                    </p>
                    <div className="clients-professional-picker__actions">
                      <button
                        type="button"
                        className="primary-button"
                        onClick={openProfessionalPicker}
                      >
                        + Profesional
                      </button>
                      <button type="button" className="ghost-button" onClick={openNewProModal}>
                        Crear usuario PRO
                      </button>
                    </div>
                  </div>
                ) : (
                  professionals.map((pro, proIndex) => {
                    const selectedProfessional = professionalLookup.get(pro.id);
                    return (
                      <div className="professional-card" key={`professional-${proIndex}`}>
                        <div className="professional-card__header">
                          <div>
                            <h4>
                              {selectedProfessional?.name ||
                                pro.name ||
                                `Profesional ${proIndex + 1}`}
                            </h4>
                            <p className="professional-card__meta">
                              {selectedProfessional ? (
                                <>
                                  {selectedProfessional.email || "Sin email"}
                                  {selectedProfessional.phone
                                    ? ` · ${selectedProfessional.phone}`
                                    : ""}
                                </>
                              ) : pro.name ? (
                                pro.name
                              ) : (
                                "Sin datos seleccionados"
                              )}
                            </p>
                          </div>
                          <div className="professional-card__header-actions">
                            <button
                              type="button"
                              className={`icon-button ${
                                pro.uiExpanded ? "" : "icon-button--ghost"
                              }`}
                              onClick={() => toggleProfessionalExpanded(proIndex)}
                              aria-label={`${
                                pro.uiExpanded ? "Colapsar" : "Expandir"
                              } profesional ${pro.name || proIndex + 1}`}
                            >
                              {pro.uiExpanded ? "−" : "+"}
                            </button>
                            <button
                              type="button"
                              className="icon-button icon-button--danger"
                              onClick={() => removeProfessional(proIndex)}
                              aria-label={`Eliminar profesional ${pro.name || proIndex + 1}`}
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                        {pro.uiExpanded ? (
                          <div className="professional-card__body">
                            <div className="professional-fields">
                              <label className="professional-field">
                                <span>Seleccionar del catálogo</span>
                                <select
                                  value={professionalLookup.has(pro.id) ? pro.id : ""}
                                  onChange={(e) =>
                                    updateProfessionalField(proIndex, "id", e.target.value)
                                  }
                                >
                                  <option value="">Selecciona un profesional</option>
                                  {catalogs.professionals.map((option) => (
                                    <option key={option._id} value={option._id}>
                                      {option.name}
                                    </option>
                                  ))}
                                </select>
                              </label>
                            </div>

                            <section className="professional-section">
                              <div className="professional-section__header">
                                <h5>Servicios</h5>
                                <button
                                  type="button"
                                  className="ghost-button"
                                  onClick={() => addProfessionalService(proIndex)}
                                >
                                  + Servicio
                                </button>
                              </div>
                              {pro.services.length === 0 ? (
                                <p className="muted-text">Sin servicios configurados.</p>
                              ) : (
                                pro.services.map((service, serviceIndex) => {
                                  const serviceOptions = getServiceOptionsForSelect(service.serviceId);
                                  return (
                                    <div
                                      className="professional-service-row"
                                      key={`pro-${proIndex}-service-${serviceIndex}`}
                                    >
                                      <label className="professional-field">
                                        <span>Servicio</span>
                                        <select
                                          value={
                                            serviceLookup.has(service.serviceId)
                                              ? service.serviceId
                                              : ""
                                          }
                                          onChange={(e) =>
                                            updateProfessionalService(
                                              proIndex,
                                              serviceIndex,
                                              "serviceId",
                                              e.target.value
                                            )
                                          }
                                        >
                                          <option value="">Selecciona un servicio</option>
                                            {serviceOptions.map((option) => (
                                              <option key={option._id} value={option._id}>
                                                {option.name}
                                              </option>
                                            ))}
                                        </select>
                                    </label>
                                    <label className="professional-field professional-field--compact">
                                      <span>Precio</span>
                                      <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={service.price}
                                        onChange={(e) =>
                                          updateProfessionalService(
                                            proIndex,
                                            serviceIndex,
                                            "price",
                                            e.target.value
                                          )
                                        }
                                      />
                                    </label>
                                    <label className="professional-field professional-field--compact">
                                      <span>Slots</span>
                                      <input
                                        type="number"
                                        min="1"
                                        value={service.slot}
                                        onChange={(e) =>
                                          updateProfessionalService(
                                            proIndex,
                                            serviceIndex,
                                            "slot",
                                            e.target.value
                                          )
                                        }
                                      />
                                    </label>
                                    <button
                                      type="button"
                                      className="icon-button icon-button--danger"
                                      onClick={() =>
                                        removeProfessionalService(proIndex, serviceIndex)
                                      }
                                      aria-label="Eliminar servicio profesional"
                                    >
                                      🗑️
                                    </button>
                                  </div>
                                  );
                                })
                              )}
                            </section>

                            <section className="professional-section">
                              <div className="professional-section__header">
                                <h5>Horario semanal</h5>
                                <button
                                  type="button"
                                  className="ghost-button"
                                  onClick={() => addProfessionalSchedule(proIndex)}
                                >
                                  + Día
                                </button>
                              </div>
                              {pro.schedule.length === 0 ? (
                                <p className="muted-text">Sin horario definido.</p>
                              ) : (
                                pro.schedule.map((entry, scheduleIndex) => (
                                  <div
                                    className="professional-schedule-row"
                                    key={`pro-${proIndex}-schedule-${scheduleIndex}`}
                                  >
                                    <label className="professional-field">
                                      <span>Día</span>
                                      <select
                                        value={entry.day}
                                        onChange={(e) =>
                                          updateProfessionalSchedule(
                                            proIndex,
                                            scheduleIndex,
                                            "day",
                                            e.target.value
                                          )
                                        }
                                      >
                                        {daysOfWeek.map((dayOption) => (
                                          <option key={dayOption} value={dayOption}>
                                            {dayOption.charAt(0).toUpperCase() + dayOption.slice(1)}
                                          </option>
                                        ))}
                                      </select>
                                    </label>
                                    <label className="professional-field professional-field--compact">
                                      <span>Inicio</span>
                                      <input
                                        type="time"
                                        value={entry.start}
                                        onChange={(e) =>
                                          updateProfessionalSchedule(
                                            proIndex,
                                            scheduleIndex,
                                            "start",
                                            e.target.value
                                          )
                                        }
                                      />
                                    </label>
                                    <label className="professional-field professional-field--compact">
                                      <span>Fin</span>
                                      <input
                                        type="time"
                                        value={entry.end}
                                        onChange={(e) =>
                                          updateProfessionalSchedule(
                                            proIndex,
                                            scheduleIndex,
                                            "end",
                                            e.target.value
                                          )
                                        }
                                      />
                                    </label>
                                    <button
                                      type="button"
                                      className="icon-button icon-button--danger"
                                      onClick={() =>
                                        removeProfessionalSchedule(proIndex, scheduleIndex)
                                      }
                                      aria-label="Eliminar día"
                                    >
                                      🗑️
                                    </button>
                                  </div>
                                ))
                              )}
                            </section>
                          </div>
                        ) : null}
                      </div>
                    );
                  })
                )}
                <div ref={professionalsEndRef} />
              </div>
            )}

            {error ? (
              <p className="error" role="alert">
                {error}
              </p>
            ) : null}

            <div className="form-actions">
              <button type="submit" disabled={submitting}>
                {submitting ? "Guardando..." : editingId ? "Actualizar" : "Crear"}
              </button>
              <button type="button" className="ghost-button" onClick={closeEditor}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </section>

      {newProModalOpen ? (
        <div className="clients-modal-overlay" role="dialog" aria-modal="true">
          <div className="clients-modal">
            <header className="clients-modal__header">
              <div>
                <h3>Crear usuario PRO</h3>
                <p className="clients-modal__subtitle">
                  Registra un profesional y quedará disponible para este cliente.
                </p>
              </div>
              <button type="button" className="ghost-button" onClick={closeNewProModal}>
                ✕
              </button>
            </header>
            <form className="clients-modal__form" onSubmit={handleCreateProUserSubmit}>
              <label>
                Nombre completo
                <input
                  value={newProForm.name}
                  onChange={(e) => updateNewProForm("name", e.target.value)}
                  required
                />
              </label>
              <label>
                Email
                <input
                  type="email"
                  value={newProForm.email}
                  onChange={(e) => updateNewProForm("email", e.target.value)}
                  required
                />
              </label>
              <label>
                Teléfono
                <input
                  value={newProForm.phone}
                  onChange={(e) => updateNewProForm("phone", e.target.value)}
                  required
                />
              </label>
              <label>
                Contraseña
                <input
                  type="password"
                  minLength={8}
                  value={newProForm.password}
                  onChange={(e) => updateNewProForm("password", e.target.value)}
                  required
                />
              </label>
              <label>
                Rol
                <select
                  value={newProForm.role}
                  onChange={(e) => updateNewProForm("role", e.target.value)}
                >
                  <option value="pro">Administrador</option>
                  <option value="staff">Staff</option>
                </select>
              </label>
              {newProError ? (
                <p className="error" role="alert">
                  {newProError}
                </p>
              ) : null}
              <div className="clients-modal__actions">
                <button type="submit" disabled={newProSubmitting}>
                  {newProSubmitting ? "Creando..." : "Crear usuario"}
                </button>
                <button type="button" className="ghost-button" onClick={closeNewProModal}>
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
