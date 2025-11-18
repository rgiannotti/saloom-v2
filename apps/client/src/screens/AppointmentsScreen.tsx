import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  useWindowDimensions
} from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import dayjs from "dayjs";
import { Calendar, CalendarEvent } from "react-native-big-calendar";

import { useAuth } from "../auth/AuthContext";
import { API_BASE_URL } from "../config";
import {
  ClientPlace,
  CustomerOption,
  ProfessionalOption,
  ProfessionalServiceOption
} from "../types/appointments";

type AppointmentApi = {
  _id: string;
  startDate: string;
  endDate: string;
  status: string;
  notes?: string;
  client: string;
  clientName?: string;
  clientPhone?: string;
  professionalName?: string;
  serviceNames?: string[];
  servicePrices?: (number | null)[];
  serviceSlots?: (number | null)[];
  professional?: string;
  services: { service: string; price?: number }[];
};

const colors = ["#f43f5e", "#0ea5e9", "#10b981", "#f97316", "#8b5cf6", "#14b8a6", "#ec4899"];

const SLOT_MINUTES = 15;

const STATUS_OPTIONS = [
  { value: "scheduled", label: "Programada" },
  { value: "confirmed", label: "Confirmada" },
  { value: "show", label: "Presentado" },
  { value: "no_show", label: "No Presentado" },
  { value: "canceled", label: "Cancelada" },
  { value: "completed", label: "Completada" }
] as const;

const STATUS_LABELS = STATUS_OPTIONS.reduce<Record<string, string>>((acc, curr) => {
  acc[curr.value] = curr.label;
  return acc;
}, {});

const timeStringToMinutes = (value?: string | null) => {
  if (!value) {
    return null;
  }
  const [hoursStr, minutesStr] = value.split(":");
  const hours = Number.parseInt(hoursStr ?? "", 10);
  const minutes = Number.parseInt(minutesStr ?? "", 10);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return null;
  }
  return hours * 60 + minutes;
};

const buildTimeOptions = () => {
  const options: { label: string; value: string }[] = [];
  for (let hour = 0; hour < 24; hour += 1) {
    for (let minute = 0; minute < 60; minute += SLOT_MINUTES) {
      const time = dayjs().hour(hour).minute(minute).second(0).millisecond(0);
      options.push({
        label: time.format("hh:mm A"),
        value: time.format("HH:mm")
      });
    }
  }
  return options;
};

const timeOptions = buildTimeOptions();

const getNearestTimeValue = (date: Date) => {
  const roundedMinutes = Math.floor(date.getMinutes() / SLOT_MINUTES) * SLOT_MINUTES;
  return dayjs(date).minute(roundedMinutes).format("HH:mm");
};

const isPastSlot = (date: Date) => dayjs(date).isBefore(dayjs(), "minute");
const isDaySlot = (date: Date) => dayjs(date).isSame(dayjs(), "day");

export const AppointmentsScreen = () => {
  const {
    session: { tokens, user }
  } = useAuth();
  const isWeb = Platform.OS === "web";
  const { width } = useWindowDimensions();
  const isMobile = width < 1024;
  const [viewMode, setViewMode] = useState<"week" | "day" | "month">("week");
  const [calendarDate, setCalendarDate] = useState<Date>(new Date());
  const [professionals, setProfessionals] = useState<ProfessionalOption[]>([]);
  const [appointments, setAppointments] = useState<AppointmentApi[]>([]);
  const [editingAppointment, setEditingAppointment] = useState<AppointmentApi | null>(null);
  const [clientPlace, setClientPlace] = useState<ClientPlace | null>(null);
  const [selectedProfessional, setSelectedProfessional] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [calendarHeight, setCalendarHeight] = useState(600);
  const [mobileSelectorOpen, setMobileSelectorOpen] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalDate, setModalDate] = useState<Date>(new Date());
  const [modalTime, setModalTime] = useState<string>("");
  const [modalProfessional, setModalProfessional] = useState<string | null>(null);
  const [modalService, setModalService] = useState<string | null>(null);
  const [modalStatus, setModalStatus] = useState<string>("scheduled");
  const [notes, setNotes] = useState("");
  const [professionalSelectorOpen, setProfessionalSelectorOpen] = useState(false);
  const [serviceSelectorOpen, setServiceSelectorOpen] = useState(false);
  const [timeSelectorOpen, setTimeSelectorOpen] = useState(false);
  const [statusSelectorOpen, setStatusSelectorOpen] = useState(false);

  const [customerQuery, setCustomerQuery] = useState("");
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerOption | null>(null);
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: "", phone: "", email: "" });
  const [savingCustomer, setSavingCustomer] = useState(false);
  const [customerDropdownOpen, setCustomerDropdownOpen] = useState(false);
  const [creatingAppointment, setCreatingAppointment] = useState(false);
  const [appointmentError, setAppointmentError] = useState<string | null>(null);

  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [webDateCursor, setWebDateCursor] = useState(() => dayjs());
  const clientId = user.client;

  const clearAppointmentError = useCallback(() => {
    setAppointmentError(null);
  }, []);

  const closeDropdowns = useCallback(() => {
    setProfessionalSelectorOpen(false);
    setServiceSelectorOpen(false);
    setCustomerDropdownOpen(false);
    setTimeSelectorOpen(false);
  }, []);

  const resetModalForm = useCallback(() => {
    setSelectedCustomer(null);
    setCustomerQuery("");
    setShowNewCustomerForm(false);
    setNewCustomer({ name: "", phone: "", email: "" });
    setModalProfessional(null);
    setModalService(null);
    setModalTime("");
    setModalStatus("scheduled");
    setNotes("");
    setAppointmentError(null);
    setCreatingAppointment(false);
    setModalDate(new Date());
    setDatePickerVisible(false);
    setEditingAppointment(null);
  }, []);

  const headers = useMemo(
    () => ({
      Authorization: `Bearer ${tokens.accessToken}`,
      "Content-Type": "application/json"
    }),
    [tokens.accessToken]
  );

  useEffect(() => {
    if (!modalVisible) {
      closeDropdowns();
      setShowNewCustomerForm(false);
      setCustomerDropdownOpen(false);
      setStatusSelectorOpen(false);
    }
  }, [modalVisible, closeDropdowns]);

  const fetchProfessionals = useCallback(async () => {
    if (!clientId) {
      setProfessionals([]);
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/app/clients/${clientId}/professionals`, {
        headers
      });
      if (!response.ok) {
        throw new Error("No se pudieron cargar los profesionales.");
      }
      const data = (await response.json()) as {
        professionals?: ProfessionalOption[];
        place?: ClientPlace | null;
      };
      setProfessionals(data.professionals ?? []);
      setClientPlace(data.place ?? null);
    } catch (error) {
      console.warn(error);
      setProfessionals([]);
      setClientPlace(null);
    }
  }, [clientId, headers]);

  const fetchAppointments = useCallback(async () => {
    if (!clientId) {
      setAppointments([]);
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/appointments?client=${clientId}`, {
        headers
      });
      if (!response.ok) {
        throw new Error("No se pudieron cargar las citas.");
      }
      const data = await response.json();
      setAppointments(data);
    } catch (error) {
      console.warn(error);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, [clientId, headers]);

  const searchCustomers = useCallback(
    async (query: string) => {
      if (!clientId) {
        return;
      }
      try {
        const response = await fetch(
          `${API_BASE_URL}/client/users?search=${encodeURIComponent(query)}`,
          {
            headers
          }
        );
        if (!response.ok) {
          throw new Error("No se pudieron cargar los clientes.");
        }
        const data = (await response.json()) as CustomerOption[];
        setCustomers(data);
      } catch (error) {
        console.warn(error);
        setCustomers([]);
      }
    },
    [clientId, headers]
  );

  const handleCreateCustomer = useCallback(async () => {
    if (!newCustomer.name || !newCustomer.phone) {
      return;
    }
    setSavingCustomer(true);
    try {
      const response = await fetch(`${API_BASE_URL}/client/users`, {
        method: "POST",
        headers,
        body: JSON.stringify(newCustomer)
      });
      if (!response.ok) {
        throw new Error("No se pudo crear el cliente.");
      }
      const created = (await response.json()) as CustomerOption;
      setSelectedCustomer(created);
      setShowNewCustomerForm(false);
      setCustomerQuery(created.name);
      setCustomerDropdownOpen(false);
      clearAppointmentError();
    } catch (error) {
      console.warn(error);
    } finally {
      setSavingCustomer(false);
    }
  }, [headers, newCustomer]);

  useEffect(() => {
    fetchProfessionals();
  }, [fetchProfessionals]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  useEffect(() => {
    if (customerQuery.trim().length >= 2 && !showNewCustomerForm) {
      searchCustomers(customerQuery.trim());
    } else {
      setCustomers([]);
    }
    setStatusSelectorOpen(false);
  }, [customerQuery, searchCustomers, showNewCustomerForm]);

  const events: CalendarEvent<AppointmentApi>[] = useMemo(() => {
    return appointments
      .filter((appointment) =>
        selectedProfessional ? appointment.professional === selectedProfessional : true
      )
      .map((appointment, index) => {
        const start = dayjs(appointment.startDate);
        const end = dayjs(appointment.endDate);
        const durationMinutes = Math.max(end.diff(start, "minute"), SLOT_MINUTES);
        const serviceName =
          appointment.serviceNames?.[0] ??
          (appointment.services?.[0] as any)?.name ??
          (appointment.services?.[0]?.service as any)?.name ??
          (typeof appointment.services?.[0]?.service === "string"
            ? appointment.services?.[0]?.service
            : "");
        const clientName = appointment.clientName ?? (appointment as any)?.customerName ?? "Cita";
        return {
          id: appointment._id,
          start: start.toDate(),
          end: end.toDate(),
          title: clientName,
          children: appointment.notes,
          color: colors[index % colors.length],
          data: appointment
        };
      });
  }, [appointments, selectedProfessional]);

  const isEditing = Boolean(editingAppointment);

  const handlePressEvent = (event: CalendarEvent<AppointmentApi>) => {
    const appt = event.data;
    if (!appt) {
      return;
    }
    clearAppointmentError();
    setEditingAppointment(appt);
    setModalDate(new Date(appt.startDate));
    setModalTime(dayjs(appt.startDate).format("HH:mm"));
    setModalProfessional(appt.professional ?? null);
    setModalService(appt.services?.[0]?.service ?? null);
    setModalStatus(appt.status ?? "scheduled");
    setNotes(appt.notes ?? "");
    setSelectedCustomer(null);
    setCustomerQuery(appt.clientName ?? "");
    setCustomerDropdownOpen(false);
    setServiceSelectorOpen(false);
    setProfessionalSelectorOpen(false);
    setTimeSelectorOpen(false);
    setStatusSelectorOpen(false);
    setShowNewCustomerForm(false);
    setModalVisible(true);
  };

  const handleSelectProfessional = (professionalId: string | null) => {
    setSelectedProfessional(professionalId);
  };

  const handlePressCell = (date: Date) => {
    if (isPastSlot(date)) {
      return;
    }
    clearAppointmentError();
    setEditingAppointment(null);
    setModalDate(date);
    setModalTime(getNearestTimeValue(date));
    const professionalId = selectedProfessional ?? null;
    setModalProfessional(professionalId);
    const defaultService = professionalId
      ? (professionals.find((pro) => pro._id === professionalId)?.services?.[0]?._id ?? null)
      : null;
    setModalService(defaultService);
    setModalStatus("scheduled");
    setSelectedCustomer(null);
    setCustomerQuery("");
    setCustomerDropdownOpen(false);
    setTimeSelectorOpen(false);
    setStatusSelectorOpen(false);
    setShowNewCustomerForm(false);
    setNotes("");
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    if (creatingAppointment) {
      return;
    }
    setModalVisible(false);
    closeDropdowns();
    resetModalForm();
  };

  const handleOpenDatePicker = () => {
    clearAppointmentError();
    if (isWeb) {
      setWebDateCursor(dayjs(modalDate));
      setDatePickerVisible(true);
      return;
    }
    setDatePickerVisible(true);
  };

  const buildAvailableTimes = useCallback(
    (professionalId: string | null, date: Date, serviceSlots = 1) => {
      if (!professionalId) {
        return [];
      }
      const targetDay = dayjs(date);
      const today = dayjs();
      const skipPastFilter = Boolean(editingAppointment);
      if (!skipPastFilter && targetDay.isBefore(today, "day")) {
        return [];
      }
      const nowMinutes =
        !skipPastFilter &&
        targetDay.isSame(today, "day") &&
        !isNaN(today.diff(today.startOf("day"), "minute"))
          ? today.diff(today.startOf("day"), "minute")
          : null;
      if (professionalId && professionalId?._id) professionalId = professionalId._id;
      const professional = professionals.find((pro) => pro._id === professionalId);
      if (!professional) {
        return [];
      }
      const normalizedSlots = Math.max(serviceSlots, 1);
      const slotDurationMinutes = normalizedSlots * SLOT_MINUTES;
      const dayKey = dayjs(date).format("dddd").toLowerCase();
      const dayKeyEn = [
        "sunday",
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday"
      ][targetDay.day()];
      const scheduleEntries =
        professional.schedule?.filter(
          (entry) =>
            Boolean(entry?.start) &&
            Boolean(entry?.end) &&
            (entry?.day?.toLowerCase() === dayKey || entry?.day?.toLowerCase() === dayKeyEn)
        ) ?? [];
      if (!scheduleEntries.length) {
        return [];
      }
      const busyAppointments = appointments.filter(
        (appointment) =>
          appointment.professional === professionalId &&
          dayjs(appointment.startDate).isSame(date, "day") &&
          (!editingAppointment || appointment._id !== editingAppointment._id)
      );
      return timeOptions.filter((option) => {
        const optionMinutes = timeStringToMinutes(option.value);
        if (optionMinutes === null) {
          return false;
        }
        if (nowMinutes !== null && optionMinutes <= nowMinutes) {
          return false;
        }
        const isWithinSchedule = scheduleEntries.some((entry) => {
          const startMinutes = timeStringToMinutes(entry.start);
          const endMinutes = timeStringToMinutes(entry.end);
          if (startMinutes === null || endMinutes === null) {
            return false;
          }
          return optionMinutes >= startMinutes && optionMinutes + slotDurationMinutes <= endMinutes;
        });
        if (!isWithinSchedule) {
          return false;
        }
        const slotStart = dayjs(date)
          .hour(Math.floor(optionMinutes / 60))
          .minute(optionMinutes % 60)
          .second(0)
          .millisecond(0);
        const slotEnd = slotStart.add(slotDurationMinutes, "minute");
        const overlapsExisting = busyAppointments.some((appointment) => {
          const appointmentStart = dayjs(appointment.startDate);
          const appointmentEnd = dayjs(appointment.endDate);
          return slotStart.isBefore(appointmentEnd) && slotEnd.isAfter(appointmentStart);
        });
        return !overlapsExisting;
      });
    },
    [appointments, professionals, editingAppointment]
  );

  const professionalServices = useMemo(() => {
    if (!modalProfessional) {
      return [];
    }
    return professionals.find((pro) => pro._id === modalProfessional)?.services ?? [];
  }, [modalProfessional, professionals]);

  const selectedServiceOption = useMemo(() => {
    if (!modalService) {
      return null;
    }
    return professionalServices.find((service) => service._id === modalService) ?? null;
  }, [modalService, professionalServices]);

  const serviceSlotCount = selectedServiceOption?.slot ?? editingAppointment?.slots ?? 1;

  const availableTimeOptions = useMemo(() => {
    const base = buildAvailableTimes(modalProfessional, modalDate, serviceSlotCount);
    if (editingAppointment && modalTime && !base.some((opt) => opt.value === modalTime)) {
      const match = timeOptions.find((opt) => opt.value === modalTime);
      if (match) {
        return [match, ...base];
      }
    }
    return base;
  }, [
    buildAvailableTimes,
    modalProfessional,
    modalDate,
    serviceSlotCount,
    editingAppointment,
    modalTime
  ]);

  useEffect(() => {
    if (!modalVisible) {
      return;
    }
    if (modalProfessional || !selectedProfessional) {
      return;
    }
    setModalProfessional(selectedProfessional);
    const selectedPro = professionals.find((pro) => pro._id === selectedProfessional);
    const defaultServiceId = selectedPro?.services?.[0]?._id ?? null;
    const defaultServiceSlot = selectedPro?.services?.[0]?.slot ?? 1;
    setModalService(defaultServiceId);
    const initialTimes = buildAvailableTimes(selectedProfessional, modalDate, defaultServiceSlot);
    setModalTime(initialTimes[0]?.value ?? "");
  }, [
    buildAvailableTimes,
    modalDate,
    modalProfessional,
    modalVisible,
    professionals,
    selectedProfessional
  ]);

  useEffect(() => {
    if (!modalProfessional) {
      setModalTime("");
      setTimeSelectorOpen(false);
      return;
    }
    if (!availableTimeOptions.length) {
      setModalTime("");
      setTimeSelectorOpen(false);
      return;
    }
    const hasCurrentTime = availableTimeOptions.some((option) => option.value === modalTime);
    if (!hasCurrentTime) {
      setModalTime(availableTimeOptions[0].value);
    }
  }, [availableTimeOptions, modalProfessional, modalTime]);

  const selectedTimeLabel = useMemo(() => {
    if (!modalProfessional) {
      return "Selecciona personal";
    }
    if (!availableTimeOptions.length) {
      return "Sin horarios disponibles";
    }
    if (!modalTime) {
      return "Selecciona hora";
    }
    const match = availableTimeOptions.find((option) => option.value === modalTime);
    return match ? match.label : "Selecciona hora";
  }, [availableTimeOptions, modalProfessional, modalTime]);

  const canSubmitAppointment = useMemo(
    () =>
      Boolean(
        modalProfessional &&
          modalService &&
          (isEditing || (selectedCustomer && selectedServiceOption)) &&
          modalTime &&
          availableTimeOptions.length
      ),
    [
      availableTimeOptions.length,
      modalProfessional,
      modalService,
      modalTime,
      selectedCustomer,
      selectedServiceOption,
      isEditing
    ]
  );

  const handleSubmitAppointment = async () => {
    if (creatingAppointment) {
      return;
    }
    clearAppointmentError();
    if (!clientId) {
      setAppointmentError("No se encontró el cliente asociado.");
      return;
    }
    if (!isEditing && !selectedCustomer) {
      setAppointmentError("Selecciona un cliente para la cita.");
      return;
    }
    if (!modalProfessional) {
      setAppointmentError("Selecciona el personal que atenderá la cita.");
      return;
    }
    if (!modalService) {
      setAppointmentError("Selecciona el servicio de la cita.");
      return;
    }
    if (!isEditing && !selectedServiceOption) {
      setAppointmentError("Selecciona un servicio válido.");
      return;
    }
    if (!modalTime) {
      setAppointmentError("Selecciona una hora disponible.");
      return;
    }
    if (!availableTimeOptions.length) {
      setAppointmentError("No hay horarios disponibles para este día.");
      return;
    }
    const startMinutes = timeStringToMinutes(modalTime);
    if (startMinutes === null) {
      setAppointmentError("Selecciona una hora válida.");
      return;
    }
    const location = clientPlace?.location;
    if (!location || !Array.isArray(location.coordinates) || location.coordinates.length < 2) {
      setAppointmentError("Configura la ubicación del cliente antes de crear una cita.");
      return;
    }
    const serviceSlots = Math.max(selectedServiceOption?.slot ?? editingAppointment?.slots ?? 1, 1);
    const slotDurationMinutes = serviceSlots * SLOT_MINUTES;
    const startDate = dayjs(modalDate)
      .hour(Math.floor(startMinutes / 60))
      .minute(startMinutes % 60)
      .second(0)
      .millisecond(0);
    const endDate = startDate.add(slotDurationMinutes, "minute");
    const slotStartIndex = Math.floor(startMinutes / SLOT_MINUTES);
    const slotEndIndex = slotStartIndex + serviceSlots;
    const payload = isEditing
      ? {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          slotStart: slotStartIndex,
          slotEnd: slotEndIndex,
          slots: serviceSlots,
          status: modalStatus,
          notes: notes.trim() ? notes.trim() : undefined
        }
      : {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          services: [
            {
              service: modalService,
              price: selectedServiceOption?.price
            }
          ],
          slots: serviceSlots,
          slotStart: slotStartIndex,
          slotEnd: slotEndIndex,
          status: modalStatus || "scheduled",
          amount: selectedServiceOption?.price,
          notes: notes.trim() ? notes.trim() : undefined,
          client: clientId,
          professional: modalProfessional,
          user: selectedCustomer?._id,
          place: {
            address: clientPlace?.address,
            location: {
              type: location.type ?? "Point",
              coordinates: location.coordinates
            }
          },
          type: clientPlace?.address ? "local" : undefined
        };
    try {
      setCreatingAppointment(true);
      const url = isEditing
        ? `${API_BASE_URL}/appointments/${editingAppointment?._id}`
        : `${API_BASE_URL}/appointments`;
      const method = isEditing ? "PATCH" : "POST";
      const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        let message = "No se pudo crear la cita.";
        try {
          const errorData = await response.json();
          const responseMessage = Array.isArray(errorData?.message)
            ? errorData.message[0]
            : errorData?.message;
          if (responseMessage) {
            message = responseMessage;
          }
        } catch {
          // ignore secondary errors
        }
        throw new Error(message);
      }
      const saved = (await response.json()) as AppointmentApi;
      if (isEditing) {
        setAppointments((prev) =>
          prev
            .map((appt) => (appt._id === saved._id ? saved : appt))
            .sort((a, b) => dayjs(a.startDate).valueOf() - dayjs(b.startDate).valueOf())
        );
      } else {
        setAppointments((prev) =>
          [...prev, saved].sort(
            (a, b) => dayjs(a.startDate).valueOf() - dayjs(b.startDate).valueOf()
          )
        );
      }
      setModalVisible(false);
      closeDropdowns();
      resetModalForm();
    } catch (error) {
      setAppointmentError((error as Error).message);
    } finally {
      setCreatingAppointment(false);
    }
  };

  const handleDeleteAppointment = async () => {
    if (!editingAppointment?._id) {
      return;
    }
    try {
      setCreatingAppointment(true);
      const response = await fetch(`${API_BASE_URL}/appointments/${editingAppointment._id}`, {
        method: "DELETE",
        headers
      });
      if (!response.ok) {
        throw new Error("No se pudo eliminar la cita.");
      }
      setAppointments((prev) => prev.filter((appt) => appt._id !== editingAppointment._id));
      setModalVisible(false);
      closeDropdowns();
      resetModalForm();
    } catch (error) {
      setAppointmentError((error as Error).message);
    } finally {
      setCreatingAppointment(false);
    }
  };

  const anyDropdownOpen =
    customerDropdownOpen || professionalSelectorOpen || serviceSelectorOpen || timeSelectorOpen;

  const scrollOffsetMinutes = useMemo(() => {
    if (viewMode === "month") {
      return 0;
    }
    const minutesFromMidnight = dayjs().diff(dayjs().startOf("day"), "minute");
    return Math.max(minutesFromMidnight - 180, 0);
  }, [viewMode]);

  const calendarMode = isMobile && viewMode === "week" ? "3days" : viewMode;

  const handleNavigate = (direction: "prev" | "next") => {
    const multiplier = direction === "next" ? 1 : -1;
    let newDate: Date;
    switch (viewMode) {
      case "month":
        newDate = dayjs(calendarDate).add(multiplier, "month").toDate();
        break;
      case "day":
        newDate = dayjs(calendarDate).add(multiplier, "day").toDate();
        break;
      case "week":
      default:
        newDate = dayjs(calendarDate)
          .add(multiplier * (isMobile ? 3 : 7), "day")
          .toDate();
        break;
    }
    setCalendarDate(newDate);
  };

  useEffect(() => {
    setCalendarDate(new Date());
  }, [viewMode]);

  useEffect(() => {
    if (!isMobile) {
      setMobileSelectorOpen(false);
    }
  }, [isMobile]);

  return (
    <View style={[styles.container, isMobile && styles.containerMobile]}>
      {isMobile ? (
        <View style={styles.mobileSelectorWrapper}>
          <Text style={styles.sectionTitle}>Personal</Text>
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => setMobileSelectorOpen((prev) => !prev)}
          >
            <Text style={styles.dropdownButtonText}>
              {selectedProfessional
                ? (professionals.find((pro) => pro._id === selectedProfessional)?.name ??
                  "Seleccionar personal")
                : "Todo el personal"}
            </Text>
            <Text style={styles.dropdownButtonIcon}>{mobileSelectorOpen ? "▲" : "▼"}</Text>
          </TouchableOpacity>
          {mobileSelectorOpen ? (
            <View style={styles.dropdownList}>
              <TouchableOpacity
                style={[styles.dropdownItem, !selectedProfessional && styles.dropdownItemActive]}
                onPress={() => {
                  handleSelectProfessional(null);
                  setMobileSelectorOpen(false);
                }}
              >
                <Text
                  style={[
                    styles.dropdownItemText,
                    !selectedProfessional && styles.dropdownItemTextActive
                  ]}
                >
                  Todo el personal
                </Text>
              </TouchableOpacity>
              {professionals.map((professional) => (
                <TouchableOpacity
                  key={professional._id}
                  style={[
                    styles.dropdownItem,
                    selectedProfessional === professional._id && styles.dropdownItemActive
                  ]}
                  onPress={() => {
                    handleSelectProfessional(professional._id);
                    setMobileSelectorOpen(false);
                  }}
                >
                  <Text
                    style={[
                      styles.dropdownItemText,
                      selectedProfessional === professional._id && styles.dropdownItemTextActive
                    ]}
                  >
                    {professional.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}
        </View>
      ) : (
        <View style={[styles.sidebar, isMobile && styles.sidebarMobile]}>
          <Text style={styles.sectionTitle}>Personal</Text>
          <ScrollView style={styles.professionalList}>
            <TouchableOpacity
              style={[
                styles.professionalItem,
                !selectedProfessional && styles.professionalItemActive
              ]}
              onPress={() => handleSelectProfessional(null)}
            >
              <Text style={styles.allStaffIcon}>👥</Text>
              <Text
                style={[
                  styles.professionalName,
                  !selectedProfessional && styles.professionalNameActive
                ]}
              >
                Todo el personal
              </Text>
            </TouchableOpacity>
            {professionals.map((professional) => (
              <TouchableOpacity
                key={professional._id}
                style={[
                  styles.professionalItem,
                  selectedProfessional === professional._id && styles.professionalItemActive
                ]}
                onPress={() => handleSelectProfessional(professional._id)}
              >
                <View style={styles.professionalDot} />
                <Text
                  style={[
                    styles.professionalName,
                    selectedProfessional === professional._id && styles.professionalNameActive
                  ]}
                >
                  {professional.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <View style={[styles.calendarWrapper, isMobile && styles.calendarWrapperMobile]}>
        <View style={styles.calendarHeader}>
          <View>
            {!isMobile ? (
              <>
                <Text style={styles.calendarTitle}>Gestión de Citas</Text>
                <Text style={styles.calendarSubtitle}>Administra las citas del salón</Text>
              </>
            ) : null}
          </View>
          <View style={styles.headerControls}>
            <View style={styles.navControls}>
              <TouchableOpacity style={styles.navButton} onPress={() => handleNavigate("prev")}>
                <Text style={styles.navButtonText}>‹</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.navButton} onPress={() => handleNavigate("next")}>
                <Text style={styles.navButtonText}>›</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.viewSwitcher}>
              {(["month", "week", "day"] as const).map((mode) => (
                <TouchableOpacity
                  key={mode}
                  style={[styles.switchButton, viewMode === mode && styles.switchButtonActive]}
                  onPress={() => setViewMode(mode)}
                >
                  <Text
                    style={[
                      styles.switchButtonText,
                      viewMode === mode && styles.switchButtonTextActive
                    ]}
                  >
                    {mode === "month" ? "Mes" : mode === "week" ? "Semana" : "Día"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
        <View
          style={styles.calendarContainer}
          onLayout={(event) => {
            const { height } = event.nativeEvent.layout;
            if (height > 0) {
              setCalendarHeight(height);
            }
          }}
        >
          {loading ? (
            <View style={styles.loadingState}>
              <ActivityIndicator color="#f43f5e" />
              <Text style={styles.loadingText}>Cargando citas…</Text>
            </View>
          ) : (
            <Calendar
              events={events}
              height={calendarHeight}
              mode={calendarMode as "week" | "month" | "day" | "3days"}
              weekStartsOn={1}
              date={calendarDate}
              swipeEnabled
              ampm
              hourRowHeight={SLOT_MINUTES * 4}
              overlapOffset={8}
              onPressCell={handlePressCell}
              onPressEvent={handlePressEvent}
              onChangeDate={(range) => {
                if (Array.isArray(range) && range[0]) {
                  setCalendarDate(dayjs(range[0]).toDate());
                }
              }}
              renderEvent={(event, touchableOpacityProps) => {
                const start = dayjs(event.start);
                const end = dayjs(event.end);
                const durationMinutes = Math.max(end.diff(start, "minute"), SLOT_MINUTES);
                const serviceName =
                  event.data?.serviceNames?.[0] ??
                  ((event.data?.services?.[0] as any)?.name as string | undefined) ??
                  ((event.data?.services?.[0]?.service as any)?.name as string | undefined) ??
                  (typeof event.data?.services?.[0]?.service === "string"
                    ? (event.data?.services?.[0]?.service as string)
                    : undefined) ??
                  "Servicio";
                const clientName =
                  event.data?.clientName ?? (event.data as any)?.customerName ?? "";
                const cardBackground = { backgroundColor: event.color ?? "#f8fafc" };
                return (
                  <TouchableOpacity
                    {...touchableOpacityProps}
                    style={[styles.eventCard, cardBackground, touchableOpacityProps?.style]}
                    activeOpacity={0.9}
                  >
                    <Text style={styles.eventTitle} numberOfLines={1} ellipsizeMode="tail">
                      {clientName || "Cita"}
                    </Text>
                    <Text style={styles.eventSubtitle} numberOfLines={1} ellipsizeMode="tail">
                      {serviceName}
                    </Text>
                    <Text style={styles.eventMeta}>
                      {start.format("hh:mm A")} - {durationMinutes} min
                    </Text>
                  </TouchableOpacity>
                );
              }}
              calendarCellStyle={(date) => ({
                ...styles.calendarCell,
                ...(isDaySlot(date!) ? styles.calendarCellPast : {})
              })}
              bodyContainerStyle={styles.bodyContainer}
              headerContainerStyle={styles.headerContainerStyle}
              headerContentStyle={styles.headerContentStyle}
              scrollOffsetMinutes={scrollOffsetMinutes}
              showAllDayEventCell={false}
            />
          )}
        </View>
      </View>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCloseModal}
        presentationStyle="overFullScreen"
      >
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback
            onPress={() => {
              if (anyDropdownOpen) {
                closeDropdowns();
              }
            }}
            disabled={!anyDropdownOpen}
          >
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Nueva Cita</Text>
                <TouchableOpacity onPress={handleCloseModal}>
                  <Text style={styles.modalClose}>✕</Text>
                </TouchableOpacity>
              </View>
              {isEditing ? (
                <ScrollView
                  style={styles.modalScroll}
                  contentContainerStyle={styles.modalScrollContent}
                  keyboardShouldPersistTap="handled"
                >
                  <View
                    style={[
                      !isMobile ? styles.editHeaderRow : styles.editHeaderRowMobile,
                      styles.modalRowElevated
                    ]}
                  >
                    <View style={styles.editInfo}>
                      <Text style={styles.editCustomer}>
                        {editingAppointment?.clientName ?? "Cliente"}
                      </Text>
                      {editingAppointment?.clientPhone ? (
                        <Text style={styles.editCustomerInfo}>
                          {editingAppointment.clientPhone}
                        </Text>
                      ) : null}
                      <Text style={styles.editService}>
                        {editingAppointment?.serviceNames?.[0] ?? "Servicio"}
                      </Text>
                      <Text style={styles.editCustomerInfo}>
                        {serviceSlotCount * SLOT_MINUTES} min
                        {(() => {
                          const price =
                            selectedServiceOption?.price ??
                            editingAppointment?.servicePrices?.[0] ??
                            null;
                          return price ? ` - $${price}` : "";
                        })()}
                      </Text>
                      {editingAppointment?.professionalName ? (
                        <Text style={styles.editCustomerInfo}>
                          {editingAppointment.professionalName}
                        </Text>
                      ) : null}
                    </View>
                    <View style={styles.editDateTime}>
                      <TouchableOpacity style={styles.input} onPress={handleOpenDatePicker}>
                        <Text>{dayjs(modalDate).format("DD/MM/YYYY")}</Text>
                      </TouchableOpacity>
                      <View style={styles.dropdownField}>
                        <TouchableOpacity
                          style={[
                            styles.dropdownButton,
                            !modalProfessional && styles.dropdownButtonDisabled
                          ]}
                          onPress={() => {
                            if (!modalProfessional) {
                              return;
                            }
                            setProfessionalSelectorOpen(false);
                            setServiceSelectorOpen(false);
                            setCustomerDropdownOpen(false);
                            setTimeSelectorOpen((prev) => !prev);
                          }}
                          disabled={!modalProfessional}
                        >
                          <Text style={styles.dropdownButtonText}>{selectedTimeLabel}</Text>
                          <Text style={styles.dropdownButtonIcon}>
                            {timeSelectorOpen ? "▲" : "▼"}
                          </Text>
                        </TouchableOpacity>
                        {timeSelectorOpen ? (
                          <View style={styles.autocompleteDropdown}>
                            {availableTimeOptions.length ? (
                              <ScrollView style={styles.dropdownScroll}>
                                {availableTimeOptions.map((option) => (
                                  <TouchableOpacity
                                    key={option.value}
                                    style={styles.dropdownItemInline}
                                    onPress={() => {
                                      setModalTime(option.value);
                                      setTimeSelectorOpen(false);
                                      clearAppointmentError();
                                    }}
                                  >
                                    <Text style={styles.dropdownItemText}>{option.label}</Text>
                                  </TouchableOpacity>
                                ))}
                              </ScrollView>
                            ) : (
                              <Text style={styles.emptyHint}>Sin horarios disponibles</Text>
                            )}
                          </View>
                        ) : null}
                      </View>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.modalSectionNoFlex,
                      { flexDirection: "row", alignItems: "center", marginBottom: 16 },
                      isMobile && styles.fullWidth
                    ]}
                  >
                    <Text style={styles.fieldLabel}>Estado actual:</Text>
                    <View style={styles.statusBadge}>
                      <Text style={styles.statusBadgeText}>
                        {STATUS_LABELS[modalStatus] || "Programada"}
                      </Text>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.modalSectionNoFlex,
                      styles.modalRowLower,
                      isMobile && styles.fullWidth
                    ]}
                  >
                    <Text style={styles.fieldLabel}>Estado de la Cita *</Text>
                    <View
                      style={[
                        styles.dropdownField,
                        statusSelectorOpen && styles.dropdownFieldRaised
                      ]}
                    >
                      <TouchableOpacity
                        style={styles.dropdownButton}
                        onPress={() => {
                          setServiceSelectorOpen(false);
                          setProfessionalSelectorOpen(false);
                          setCustomerDropdownOpen(false);
                          setTimeSelectorOpen(false);
                          setStatusSelectorOpen((prev) => !prev);
                        }}
                      >
                        <Text style={styles.dropdownButtonText}>
                          {STATUS_LABELS[modalStatus] ?? "Selecciona estado"}
                        </Text>
                        <Text style={styles.dropdownButtonIcon}>
                          {statusSelectorOpen ? "▲" : "▼"}
                        </Text>
                      </TouchableOpacity>
                      {statusSelectorOpen ? (
                        <View style={styles.autocompleteDropdown}>
                          {STATUS_OPTIONS.map((option) => (
                            <TouchableOpacity
                              key={option.value}
                              style={styles.dropdownItemInline}
                              onPress={() => {
                                setModalStatus(option.value);
                                setStatusSelectorOpen(false);
                              }}
                            >
                              <Text style={styles.dropdownItemText}>{option.label}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      ) : null}
                    </View>
                  </View>

                  <View style={styles.modalSection}>
                    <Text style={styles.fieldLabel}>Notas</Text>
                    <TextInput
                      style={[styles.input, styles.notesInput]}
                      multiline
                      value={notes}
                      onChangeText={(value) => {
                        setNotes(value);
                        clearAppointmentError();
                      }}
                      placeholder="Notas adicionales sobre la cita..."
                    />
                  </View>

                  {appointmentError ? (
                    <Text style={styles.errorText}>{appointmentError}</Text>
                  ) : null}
                  <View style={styles.editFooter}>
                    <TouchableOpacity
                      style={[
                        styles.dangerButton,
                        creatingAppointment && styles.secondaryButtonDisabled
                      ]}
                      onPress={handleDeleteAppointment}
                      disabled={creatingAppointment}
                    >
                      <Text style={styles.dangerButtonText}>Eliminar Cita</Text>
                    </TouchableOpacity>
                    <View style={styles.editFooterActions}>
                      <TouchableOpacity
                        style={[
                          styles.secondaryButton,
                          creatingAppointment && styles.secondaryButtonDisabled
                        ]}
                        onPress={handleCloseModal}
                        disabled={creatingAppointment}
                      >
                        <Text style={styles.secondaryButtonText}>Cancelar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.primaryButton,
                          (creatingAppointment || !canSubmitAppointment) &&
                            styles.primaryButtonDisabled
                        ]}
                        onPress={handleSubmitAppointment}
                        disabled={creatingAppointment || !canSubmitAppointment}
                      >
                        <Text style={styles.primaryButtonText}>
                          {creatingAppointment ? "Guardando..." : "Guardar Cambios"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </ScrollView>
              ) : (
                <ScrollView
                  style={styles.modalScroll}
                  contentContainerStyle={styles.modalScrollContent}
                  keyboardShouldPersistTap="handled"
                >
                  <View style={[styles.modalSectionNoFlex, styles.modalSectionElevated]}>
                    <Text style={styles.fieldLabel}>Cliente *</Text>
                    <View style={styles.autocompleteContainer}>
                      <TextInput
                        style={styles.input}
                        placeholder="Buscar por nombre, teléfono o email..."
                        value={selectedCustomer ? selectedCustomer.name : customerQuery}
                        editable={!selectedCustomer && !isEditing}
                        onFocus={() => {
                          if (isEditing) {
                            return;
                          }
                          setCustomerDropdownOpen(true);
                          setShowNewCustomerForm(false);
                          clearAppointmentError();
                        }}
                        onChangeText={(text) => {
                          if (isEditing) {
                            return;
                          }
                          setCustomerQuery(text);
                          setSelectedCustomer(null);
                          setShowNewCustomerForm(false);
                          setCustomerDropdownOpen(true);
                          clearAppointmentError();
                        }}
                      />
                      {!selectedCustomer &&
                      customerDropdownOpen &&
                      (customers.length > 0 || !showNewCustomerForm) &&
                      !isEditing ? (
                        <View style={styles.autocompleteDropdown}>
                          <ScrollView style={styles.dropdownScroll}>
                            {customers.map((customer) => (
                              <TouchableOpacity
                                key={customer._id}
                                style={styles.dropdownItemInline}
                                onPress={() => {
                                  setSelectedCustomer(customer);
                                  setCustomerQuery(customer.name);
                                  setCustomerDropdownOpen(false);
                                  setShowNewCustomerForm(false);
                                  clearAppointmentError();
                                }}
                              >
                                <Text style={styles.dropdownItemText}>{customer.name}</Text>
                                <Text style={styles.dropdownItemSub}>
                                  {customer.email || customer.phone}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </ScrollView>
                          <TouchableOpacity
                            style={styles.dropdownCreateButton}
                            onPress={() => {
                              setShowNewCustomerForm(true);
                              setCustomerDropdownOpen(false);
                              clearAppointmentError();
                            }}
                          >
                            <Text style={styles.dropdownCreateText}>+ Crear nuevo cliente</Text>
                          </TouchableOpacity>
                        </View>
                      ) : null}
                    </View>
                    {selectedCustomer ? (
                      <View style={styles.selectedCustomerCard}>
                        <View>
                          <Text style={styles.selectedCustomerName}>{selectedCustomer.name}</Text>
                          <Text style={styles.selectedCustomerContact}>
                            {selectedCustomer.phone}
                          </Text>
                          <Text style={styles.selectedCustomerContact}>
                            {selectedCustomer.email}
                          </Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => {
                            setSelectedCustomer(null);
                            setShowNewCustomerForm(false);
                            setCustomerDropdownOpen(true);
                            clearAppointmentError();
                          }}
                        >
                          <Text style={styles.changeLink}>Cambiar</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <>
                        {showNewCustomerForm ? (
                          <View style={styles.newCustomerCard}>
                            <View style={styles.modalRow}>
                              <Text style={styles.newCustomerTitle}>Nuevo Cliente</Text>
                              <TouchableOpacity
                                onPress={() => {
                                  setShowNewCustomerForm(false);
                                  setCustomerDropdownOpen(true);
                                  clearAppointmentError();
                                }}
                              >
                                <Text style={styles.modalClose}>✕</Text>
                              </TouchableOpacity>
                            </View>
                            <TextInput
                              style={styles.input}
                              placeholder="Nombre completo"
                              value={newCustomer.name}
                              onChangeText={(text) =>
                                setNewCustomer((prev) => ({ ...prev, name: text }))
                              }
                            />
                            <TextInput
                              style={styles.input}
                              placeholder="Teléfono"
                              value={newCustomer.phone}
                              onChangeText={(text) =>
                                setNewCustomer((prev) => ({ ...prev, phone: text }))
                              }
                            />
                            <TextInput
                              style={styles.input}
                              placeholder="Email (Opcional)"
                              value={newCustomer.email}
                              onChangeText={(text) =>
                                setNewCustomer((prev) => ({ ...prev, email: text }))
                              }
                            />
                            <TouchableOpacity
                              style={styles.primaryButton}
                              onPress={handleCreateCustomer}
                              disabled={savingCustomer}
                            >
                              <Text style={styles.primaryButtonText}>
                                {savingCustomer ? "Guardando..." : "Crear Cliente"}
                              </Text>
                            </TouchableOpacity>
                          </View>
                        ) : null}
                      </>
                    )}
                  </View>

                  <View
                    style={[
                      styles.modalRow,
                      styles.modalRowElevated,
                      isMobile && styles.modalColumn
                    ]}
                  >
                    <View
                      style={[
                        styles.modalSection,
                        styles.modalRowElevated,
                        isMobile && styles.fullWidth
                      ]}
                    >
                      <Text style={styles.fieldLabel}>Personal *</Text>
                      <View
                        style={[
                          styles.dropdownField,
                          professionalSelectorOpen && styles.dropdownFieldRaised
                        ]}
                      >
                        <TouchableOpacity
                          style={styles.dropdownButton}
                          onPress={() => {
                            if (isEditing) {
                              return;
                            }
                            setServiceSelectorOpen(false);
                            setCustomerDropdownOpen(false);
                            setTimeSelectorOpen(false);
                            setProfessionalSelectorOpen((prev) => !prev);
                          }}
                          disabled={isEditing}
                        >
                          <Text style={styles.dropdownButtonText}>
                            {modalProfessional
                              ? (professionals.find((pro) => pro._id === modalProfessional)?.name ??
                                "Selecciona personal")
                              : "Selecciona personal"}
                          </Text>
                          <Text style={styles.dropdownButtonIcon}>
                            {professionalSelectorOpen ? "▲" : "▼"}
                          </Text>
                        </TouchableOpacity>
                        {professionalSelectorOpen ? (
                          <View style={styles.autocompleteDropdown}>
                            <ScrollView style={styles.dropdownScroll}>
                              {professionals.map((professional) => (
                                <TouchableOpacity
                                  key={professional._id}
                                  style={styles.dropdownItemInline}
                                  onPress={() => {
                                    setModalProfessional(professional._id);
                                    setModalService(professional.services?.[0]?._id ?? null);
                                    setProfessionalSelectorOpen(false);
                                    setServiceSelectorOpen(false);
                                    setTimeSelectorOpen(false);
                                    clearAppointmentError();
                                  }}
                                >
                                  <Text style={styles.dropdownItemText}>{professional.name}</Text>
                                  <Text style={styles.dropdownItemSub}>
                                    {professional.services?.length ?? 0} servicios
                                  </Text>
                                </TouchableOpacity>
                              ))}
                            </ScrollView>
                          </View>
                        ) : null}
                      </View>
                    </View>
                    <View
                      style={[
                        styles.modalSection,
                        styles.modalRowLower,
                        isMobile && styles.fullWidth
                      ]}
                    >
                      <Text style={styles.fieldLabel}>Servicio *</Text>
                      <View
                        style={[
                          styles.dropdownField,
                          serviceSelectorOpen && styles.dropdownFieldRaised
                        ]}
                      >
                        <TouchableOpacity
                          style={styles.dropdownButton}
                          onPress={() => {
                            if (isEditing || !modalProfessional) {
                              return;
                            }
                            setProfessionalSelectorOpen(false);
                            setCustomerDropdownOpen(false);
                            setTimeSelectorOpen(false);
                            setServiceSelectorOpen((prev) => !prev);
                          }}
                          disabled={!modalProfessional || isEditing}
                        >
                          <Text style={styles.dropdownButtonText}>
                            {modalService
                              ? (selectedServiceOption?.name ?? "Selecciona servicio")
                              : "Selecciona servicio"}
                          </Text>
                          <Text style={styles.dropdownButtonIcon}>
                            {serviceSelectorOpen ? "▲" : "▼"}
                          </Text>
                        </TouchableOpacity>
                        {serviceSelectorOpen ? (
                          professionalServices.length === 0 ? (
                            <Text style={styles.emptyHint}>Selecciona personal</Text>
                          ) : (
                            <View style={styles.autocompleteDropdown}>
                              <ScrollView style={styles.dropdownScroll}>
                                {professionalServices.map((service: ProfessionalServiceOption) => (
                                  <TouchableOpacity
                                    key={service._id}
                                    style={styles.dropdownItemInline}
                                    onPress={() => {
                                      setModalService(service._id);
                                      setServiceSelectorOpen(false);
                                      setTimeSelectorOpen(false);
                                      clearAppointmentError();
                                    }}
                                  >
                                    <Text style={styles.dropdownItemText}>{service.name}</Text>
                                    <Text style={styles.dropdownItemSub}>
                                      {service.price ? `$${service.price}` : ""}
                                    </Text>
                                  </TouchableOpacity>
                                ))}
                              </ScrollView>
                            </View>
                          )
                        ) : null}
                      </View>
                    </View>
                  </View>

                  <View
                    style={[styles.modalRow, styles.modalRowLower, isMobile && styles.modalColumn]}
                  >
                    <View style={[styles.modalSection, isMobile && styles.fullWidth]}>
                      <Text style={styles.fieldLabel}>Fecha *</Text>
                      <TouchableOpacity style={styles.input} onPress={handleOpenDatePicker}>
                        <Text>{dayjs(modalDate).format("DD/MM/YYYY")}</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={[styles.modalSection, isMobile && styles.fullWidth]}>
                      <Text style={styles.fieldLabel}>Hora *</Text>
                      <View style={styles.dropdownField}>
                        <TouchableOpacity
                          style={[
                            styles.dropdownButton,
                            !modalProfessional && styles.dropdownButtonDisabled
                          ]}
                          onPress={() => {
                            if (!modalProfessional) {
                              return;
                            }
                            setProfessionalSelectorOpen(false);
                            setServiceSelectorOpen(false);
                            setCustomerDropdownOpen(false);
                            setTimeSelectorOpen((prev) => !prev);
                          }}
                          disabled={!modalProfessional}
                        >
                          <Text style={styles.dropdownButtonText}>{selectedTimeLabel}</Text>
                          <Text style={styles.dropdownButtonIcon}>
                            {timeSelectorOpen ? "▲" : "▼"}
                          </Text>
                        </TouchableOpacity>
                        {timeSelectorOpen ? (
                          <View style={styles.autocompleteDropdown}>
                            {availableTimeOptions.length ? (
                              <ScrollView style={styles.dropdownScroll}>
                                {availableTimeOptions.map((option) => (
                                  <TouchableOpacity
                                    key={option.value}
                                    style={styles.dropdownItemInline}
                                    onPress={() => {
                                      setModalTime(option.value);
                                      setTimeSelectorOpen(false);
                                      clearAppointmentError();
                                    }}
                                  >
                                    <Text style={styles.dropdownItemText}>{option.label}</Text>
                                  </TouchableOpacity>
                                ))}
                              </ScrollView>
                            ) : (
                              <Text style={styles.emptyHint}>Sin horarios disponibles</Text>
                            )}
                          </View>
                        ) : null}
                      </View>
                    </View>
                  </View>

                  {isEditing ? (
                    <View style={[styles.modalSection, isMobile && styles.fullWidth]}>
                      <Text style={styles.fieldLabel}>Status *</Text>
                      <TextInput
                        style={styles.input}
                        value={modalStatus}
                        onChangeText={setModalStatus}
                      />
                    </View>
                  ) : null}

                  <View style={styles.modalSection}>
                    <Text style={styles.fieldLabel}>Notas (Opcional)</Text>
                    <TextInput
                      style={[styles.input, styles.notesInput]}
                      multiline
                      value={notes}
                      onChangeText={(value) => {
                        setNotes(value);
                        clearAppointmentError();
                      }}
                      placeholder="Notas adicionales sobre la cita..."
                    />
                  </View>

                  {appointmentError ? (
                    <Text style={styles.errorText}>{appointmentError}</Text>
                  ) : null}
                  <View style={styles.modalFooter}>
                    <TouchableOpacity
                      style={[
                        styles.secondaryButton,
                        creatingAppointment && styles.secondaryButtonDisabled
                      ]}
                      onPress={handleCloseModal}
                      disabled={creatingAppointment}
                    >
                      <Text style={styles.secondaryButtonText}>Cancelar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.primaryButton,
                        (creatingAppointment || !canSubmitAppointment) &&
                          styles.primaryButtonDisabled
                      ]}
                      onPress={handleSubmitAppointment}
                      disabled={creatingAppointment || !canSubmitAppointment}
                    >
                      <Text style={styles.primaryButtonText}>
                        {creatingAppointment ? "Creando..." : "Crear Cita"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              )}
            </View>
          </TouchableWithoutFeedback>
          {isWeb && datePickerVisible ? (
            <View style={styles.webDatePickerOverlay} pointerEvents="box-none">
              <TouchableOpacity
                style={styles.webDatePickerBackdrop}
                activeOpacity={1}
                onPress={() => setDatePickerVisible(false)}
              >
                <View style={styles.webDatePickerCard}>
                  <View style={styles.webDatePickerHeader}>
                    <TouchableOpacity
                      onPress={() => setWebDateCursor((prev) => prev.subtract(1, "month"))}
                      style={styles.webDatePickerNav}
                    >
                      <Text style={styles.webDatePickerNavText}>‹</Text>
                    </TouchableOpacity>
                    <Text style={styles.webDatePickerTitle}>
                      {webDateCursor.format("MMMM YYYY")}
                    </Text>
                    <TouchableOpacity
                      onPress={() => setWebDateCursor((prev) => prev.add(1, "month"))}
                      style={styles.webDatePickerNav}
                    >
                      <Text style={styles.webDatePickerNavText}>›</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.webDatePickerWeek}>
                    {["L", "M", "M", "J", "V", "S", "D"].map((d, idx) => (
                      <Text key={`weekday-${idx}`} style={styles.webDatePickerWeekday}>
                        {d}
                      </Text>
                    ))}
                  </View>
                  <View style={styles.webDatePickerGrid}>
                    {Array.from({
                      length: (webDateCursor.startOf("month").day() + 6) % 7
                    }).map((_, idx) => (
                      <View key={`empty-${idx}`} style={styles.webDatePickerCell} />
                    ))}
                    {Array.from({ length: webDateCursor.daysInMonth() }).map((_, idx) => {
                      const day = webDateCursor.date(idx + 1);
                      const isToday = day.isSame(dayjs(), "day");
                      const isSelected = day.isSame(modalDate, "day");
                      return (
                        <TouchableOpacity
                          key={day.format("YYYY-MM-DD")}
                          style={[
                            styles.webDatePickerCell,
                            isSelected && styles.webDatePickerCellSelected,
                            isToday && styles.webDatePickerCellToday
                          ]}
                          onPress={() => {
                            setModalDate(day.toDate());
                            setDatePickerVisible(false);
                            clearAppointmentError();
                          }}
                        >
                          <Text
                            style={[
                              styles.webDatePickerCellText,
                              isSelected && styles.webDatePickerCellTextSelected
                            ]}
                          >
                            {idx + 1}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  <TouchableOpacity
                    style={styles.webDatePickerClose}
                    onPress={() => setDatePickerVisible(false)}
                  >
                    <Text style={styles.webDatePickerCloseText}>Cerrar</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      </Modal>

      {Platform.OS !== "web" ? (
        <DateTimePickerModal
          isVisible={datePickerVisible}
          mode="date"
          date={modalDate}
          onConfirm={(date) => {
            clearAppointmentError();
            setModalDate(date);
            setDatePickerVisible(false);
          }}
          onCancel={() => setDatePickerVisible(false)}
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
    gap: 12
  },
  containerMobile: {
    flexDirection: "column"
  },
  sidebar: {
    width: 260,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0"
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12
  },
  professionalList: {
    flexGrow: 0
  },
  professionalItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 10
  },
  professionalItemActive: {
    backgroundColor: "rgba(244,63,94,0.12)",
    borderColor: "#f43f5e"
  },
  professionalName: {
    fontSize: 15,
    color: "#0f172a"
  },
  professionalNameActive: {
    color: "#f43f5e",
    fontWeight: "600"
  },
  professionalDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#2563eb"
  },
  allStaffIcon: {
    fontSize: 16
  },
  mobileSelectorWrapper: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 8,
    gap: 10
  },
  dropdownButton: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  dropdownButtonDisabled: {
    opacity: 0.5
  },
  dropdownButtonText: {
    fontWeight: "600",
    color: "#0f172a"
  },
  dropdownButtonIcon: {
    fontSize: 16,
    color: "#475569"
  },
  dropdownField: {
    position: "relative"
  },
  dropdownFieldRaised: {
    zIndex: 100
  },
  dropdownList: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    overflow: "hidden"
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderColor: "#f1f5f9"
  },
  dropdownItemActive: {
    backgroundColor: "rgba(244,63,94,0.1)"
  },
  dropdownItemText: {
    color: "#0f172a",
    fontWeight: "500"
  },
  dropdownItemTextActive: {
    color: "#f43f5e",
    fontWeight: "600"
  },
  editHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 12
  },
  editHeaderRowMobile: {
    flexDirection: "column",
    justifyContent: "flex-start",
    gap: 8,
    marginBottom: 12
  },
  editInfo: {
    flex: 1,
    gap: 4
  },
  editCustomer: {
    fontWeight: "700",
    fontSize: 16,
    color: "#0f172a"
  },
  editCustomerInfo: {
    color: "#334155",
    fontWeight: "600"
  },
  editService: {
    fontWeight: "700",
    fontSize: 16,
    color: "#334155"
  },
  editDateTime: {
    width: 240,
    gap: 10
  },
  statusBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#e0ecff",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999
  },
  statusBadgeText: {
    color: "#1d4ed8",
    fontWeight: "700",
    fontSize: 12
  },
  editFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginTop: 12
  },
  editFooterActions: {
    flexDirection: "row",
    gap: 10
  },
  dangerButton: {
    backgroundColor: "#ef4444",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20
  },
  dangerButtonText: {
    color: "#fff",
    fontWeight: "700"
  },
  calendarWrapper: {
    flex: 1,
    // maxWidth: 960,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignSelf: "stretch"
  },
  calendarHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16
  },
  headerControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  calendarTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0f172a"
  },
  calendarSubtitle: {
    color: "#64748b"
  },
  viewSwitcher: {
    flexDirection: "row",
    gap: 8
  },
  navControls: {
    flexDirection: "row",
    gap: 6
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center"
  },
  navButtonText: {
    fontSize: 18,
    color: "#0f172a",
    fontWeight: "600"
  },
  switchButton: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 16
  },
  switchButtonActive: {
    backgroundColor: "#f43f5e",
    borderColor: "#f43f5e"
  },
  switchButtonText: {
    color: "#0f172a",
    fontWeight: "600"
  },
  switchButtonTextActive: {
    color: "#fff"
  },
  calendarContainer: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 20,
    overflow: "hidden"
  },
  calendarWrapperMobile: {
    width: "100%"
  },
  bodyContainer: {
    backgroundColor: "#fff"
  },
  headerContainerStyle: {
    paddingVertical: 12,
    borderBottomColor: "#e2e8f0",
    borderBottomWidth: 0.4
    // paddingHorizontal: 12
  },
  headerContentStyle: {
    marginHorizontal: 12
  },
  calendarCell: Platform.select({
    web: {
      backgroundImage:
        "repeating-linear-gradient(180deg, rgba(226,232,240,0.7) 0, rgba(226,232,240,0.7) 0.5px, transparent 0.5px, transparent 15px)"
    },
    default: {
      borderBottomWidth: 0.4,
      borderColor: "#e2e8f0"
    }
  }),
  calendarCellPast: {
    backgroundColor: "rgba(226,232,240,0.2)"
  },
  eventCard: {
    paddingVertical: 3,
    paddingHorizontal: 4,
    gap: 2,
    borderRadius: 10
  },
  eventTitle: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 12
  },
  eventSubtitle: {
    color: "#f8fafc",
    fontWeight: "600",
    fontSize: 11
  },
  eventMeta: {
    color: "#e2e8f0",
    fontSize: 11
  },
  loadingState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8
  },
  loadingText: {
    color: "#64748b"
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.55)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 24,
    gap: 8,
    position: "relative",
    zIndex: 1,
    maxWidth: 720,
    width: "90%",
    maxHeight: "90%"
  },
  modalScroll: {
    width: "100%"
  },
  modalScrollContent: {
    paddingBottom: 8
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "700"
  },
  modalClose: {
    fontSize: 18
  },
  modalSectionNoFlex: {
    gap: 8,
    marginBottom: 8
  },
  modalSection: {
    flex: 1,
    gap: 8,
    marginBottom: 8
  },
  fullWidth: {
    width: "100%"
  },
  modalSectionElevated: {
    position: "relative",
    zIndex: 30
  },
  fieldLabel: {
    fontWeight: "600",
    color: "#0f172a"
  },
  input: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12
  },
  notesInput: {
    height: 100,
    textAlignVertical: "top"
  },
  modalRow: {
    flexDirection: "row",
    gap: 8,
    position: "relative",
    zIndex: 5
  },
  modalColumn: {
    flexDirection: "column"
  },
  modalRowElevated: {
    zIndex: 20
  },
  modalRowLower: {
    zIndex: 1
  },
  modalFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24
  },
  secondaryButtonDisabled: {
    opacity: 0.6
  },
  secondaryButtonText: {
    fontWeight: "600",
    color: "#0f172a"
  },
  primaryButton: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: "#f87171"
  },
  primaryButtonDisabled: {
    opacity: 0.6
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "700"
  },
  errorText: {
    color: "#dc2626",
    fontWeight: "600",
    marginBottom: 4,
    alignSelf: "flex-end"
  },
  autocompleteContainer: {
    position: "relative"
  },
  autocompleteDropdown: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#0f172a",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    zIndex: 2000
  },
  dropdownScroll: {
    maxHeight: 160
  },
  dropdownItemInline: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderColor: "#f1f5f9"
  },
  dropdownItemText: {
    fontWeight: "600",
    color: "#0f172a"
  },
  dropdownItemSub: {
    fontSize: 12,
    color: "#475569"
  },
  dropdownCreateButton: {
    paddingVertical: 10,
    alignItems: "center"
  },
  dropdownCreateText: {
    color: "#f43f5e",
    fontWeight: "600"
  },
  newCustomerCard: {
    marginTop: 0,
    backgroundColor: "rgba(16,185,129,0.08)",
    borderRadius: 16,
    padding: 16,
    gap: 8
  },
  newCustomerTitle: {
    fontWeight: "700",
    color: "#047857"
  },
  selectedCustomerCard: {
    marginTop: 0,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#bfdbfe",
    backgroundColor: "#dbeafe",
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between"
  },
  selectedCustomerName: {
    fontWeight: "700"
  },
  selectedCustomerContact: {
    color: "#3b82f6"
  },
  changeLink: {
    color: "#f43f5e",
    fontWeight: "600"
  },
  inlineList: {
    flexGrow: 0
  },
  emptyHint: {
    color: "#94a3b8",
    paddingVertical: 8
  },
  webDatePickerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 5000
  },
  webDatePickerBackdrop: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center"
  },
  webDatePickerCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    width: 320,
    elevation: 6,
    gap: 12,
    zIndex: 5001
  },
  webDatePickerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  webDatePickerTitle: {
    fontWeight: "700",
    fontSize: 16,
    color: "#0f172a"
  },
  webDatePickerNav: {
    padding: 8
  },
  webDatePickerNavText: {
    fontSize: 18,
    color: "#0f172a"
  },
  webDatePickerWeek: {
    flexDirection: "row",
    justifyContent: "space-between"
  },
  webDatePickerWeekday: {
    width: 32,
    textAlign: "center",
    fontWeight: "700",
    color: "#475569"
  },
  webDatePickerGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4
  },
  webDatePickerCell: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10
  },
  webDatePickerCellSelected: {
    backgroundColor: "#f43f5e"
  },
  webDatePickerCellToday: {
    borderWidth: 1,
    borderColor: "#e2e8f0"
  },
  webDatePickerCellText: {
    color: "#0f172a",
    fontWeight: "600"
  },
  webDatePickerCellTextSelected: {
    color: "#fff"
  },
  webDatePickerClose: {
    alignSelf: "flex-end",
    paddingVertical: 8,
    paddingHorizontal: 12
  },
  webDatePickerCloseText: {
    color: "#f43f5e",
    fontWeight: "700"
  }
});
