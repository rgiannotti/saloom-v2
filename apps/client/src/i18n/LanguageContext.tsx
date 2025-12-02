import React, { createContext, useContext, useMemo, useState } from "react";
import { Platform } from "react-native";

type Language = "es" | "en";

type TranslationMap = Record<
  Language,
  {
    menu: {
      dashboard: string;
      appointments: string;
      staff: string;
      clients: string;
      overview: string;
      clientReport: string;
      messages: string;
      settings: string;
    };
    logout: string;
    common: {
      loading: string;
    };
    settings: {
      title: string;
      tabs: {
        profile: string;
        users: string;
      };
      profile: {
        title: string;
        subtitle: string;
        name: string;
        phone: string;
        email: string;
        namePlaceholder: string;
        phonePlaceholder: string;
        emailPlaceholder: string;
        save: string;
        saving: string;
        errors: {
          load: string;
          save: string;
        };
      };
      users: {
        title: string;
        subtitle: string;
        add: string;
        loading: string;
        errorLoad: string;
        empty: string;
        noEmail: string;
        editTitle: string;
        newTitle: string;
        name: string;
        email: string;
        phone: string;
        password: string;
        passwordPlaceholder: string;
        cancel: string;
        save: string;
        saving: string;
        errors: {
          nameRequired: string;
          phoneRequired: string;
          invalidSession: string;
          save: string;
          delete: string;
        };
        deleteConfirmTitle: string;
        deleteConfirm: (name: string) => string;
      };
    };
    reports: {
      title: string;
      subtitle: string;
      countLabel: string;
      filters: {
        month: string;
        year: string;
        professional: string;
        status: string;
        search: string;
        searchPlaceholder: string;
        showFilters: string;
        hideFilters: string;
        all: string;
      };
      months: string[];
      loading: string;
      errorLoad: string;
      totals: string;
      totalByProfessional: string;
      totalByStatus: string;
      statuses: {
        scheduled: string;
        confirmed: string;
        show: string;
        no_show: string;
        canceled: string;
        completed: string;
      };
      unassigned: string;
      table: {
        id: string;
        date: string;
        professional: string;
        service: string;
        client: string;
        phone: string;
        status: string;
      };
      empty: string;
    };
    reportsClients: {
      title: string;
      subtitle: string;
      searchPlaceholder: string;
      loading: string;
      errorLoad: string;
      empty: string;
      table: {
        client: string;
        phone: string;
        total: string;
        scheduled: string;
        confirmed: string;
        show: string;
        no_show: string;
        canceled: string;
        completed: string;
      };
      statuses: {
        scheduled: string;
        confirmed: string;
        show: string;
        no_show: string;
        canceled: string;
        completed: string;
      };
    };
    appointments: {
      titleNew: string;
      loadingCalendar: string;
      noAppointments: string;
      searchPlaceholder: string;
      save: string;
      cancel: string;
      delete: string;
      statusLabel: string;
      statusLabels: {
        scheduled: string;
        confirmed: string;
        show: string;
        no_show: string;
        canceled: string;
        completed: string;
      };
      notesPlaceholder: string;
      personalTitle: string;
      personalAll: string;
      calendarTitle: string;
      calendarSubtitle: string;
      viewMonth: string;
      viewWeek: string;
      viewDay: string;
      defaultAppointmentTitle: string;
      selectProfessional: string;
      noSlots: string;
      selectTime: string;
      createNewCustomer: string;
      changeCustomer: string;
      newCustomerTitle: string;
      newCustomerName: string;
      newCustomerPhone: string;
      newCustomerEmail: string;
      createCustomerButton: string;
      smsHistoryTitle: string;
      loadingSms: string;
      noMessages: string;
      smsSent: string;
      smsReceived: string;
      smsPlaceholder: string;
      smsSendConfirmation: string;
      smsSendReminder: string;
      errors: {
        confirmDeleteTitle: string;
        confirmDelete: string;
        loadProfessionals: string;
        loadAppointments: string;
        loadClients: string;
        createClient: string;
        createAppointment: string;
        deleteAppointment: string;
        loadSms: string;
        sendSms: string;
        sendConfirmation: string;
        sendReminder: string;
        missingClient: string;
        missingProfessional: string;
        missingService: string;
        invalidService: string;
        missingTime: string;
        noSlotsDay: string;
        invalidTime: string;
        missingLocation: string;
        noClientFound: string;
      };
      labels: {
        client: string;
        service: string;
        date: string;
        time: string;
        notes: string;
      };
    };
    clients: {
      title: string;
      subtitle: string;
      searchPlaceholder: string;
      addButton: string;
      editTitle: string;
      newTitle: string;
      name: string;
      phone: string;
      email: string;
      save: string;
      cancel: string;
      delete: string;
      confirmDelete: string;
      confirmDeleteTitle: string;
      errors: {
        load: string;
        save: string;
        delete: string;
        nameRequired: string;
        phoneRequired: string;
        invalidSession: string;
      };
      noEmail: string;
      registered: string;
      retry: string;
      empty: string;
    };
    staff: {
      title: string;
      subtitle: string;
      addButton: string;
      loading: string;
      errorLoad: string;
      errorSave: string;
      errorDelete: string;
      errorNameRequired: string;
      empty: string;
      editTitle: string;
      newTitle: string;
      name: string;
      email: string;
      phone: string;
      namePlaceholder: string;
      phonePlaceholder: string;
      emailPlaceholder: string;
      tabInfo: string;
      tabServices: string;
      tabSchedule: string;
      save: string;
      cancel: string;
      delete: string;
      saving: string;
      confirmDeleteTitle: string;
      confirmDelete: string;
      serviceTitle: string;
      selectService: string;
      price: string;
      pricePlaceholder: string;
      duration: string;
      minutesSuffix: string;
      addService: string;
      addAction: string;
      addedServices: string;
      minutesLabel: string;
      priceLabel: string;
      noServices: string;
      servicesLabel: string;
      workingDaysLabel: string;
      noSchedule: string;
      startLabel: string;
      endLabel: string;
      scheduleTitle: string;
      daysFull: Record<string, string>;
      daysShort: Record<string, string>;
    };
    dashboard: {
      todayAppointments: string;
      todaySubtitle: string;
      weekRevenue: string;
      weekSubtitle: string;
      availableStaff: string;
      availableSubtitle: string;
      upcoming: string;
      upcomingSubtitle: string;
      defaultClient: string;
      defaultService: string;
      statusScheduled: string;
      totalClients: string;
      monthAppointments: string;
      monthNewClients: string;
      nextToday: string;
      nextTodaySubtitle: string;
      noAppointments: string;
      quickSummary: string;
      quickSummarySubtitle: string;
      fakeDate: string;
    };
  }
>;

const translations: TranslationMap = {
  es: {
    menu: {
      dashboard: "Dashboard",
      appointments: "Agenda",
      staff: "Personal",
      clients: "Clientes",
      overview: "Reporte por citas",
      clientReport: "Reporte por Cliente",
      messages: "Mensajes",
      settings: "Configuración"
    },
    logout: "Cerrar sesión",
    common: {
      loading: "Cargando..."
    },
    settings: {
      title: "Configuración",
      tabs: {
        profile: "Perfil",
        users: "Usuarios"
      },
      profile: {
        title: "Perfil",
        subtitle: "Actualiza tu información personal.",
        name: "Tu nombre",
        phone: "Tu teléfono",
        email: "Tu correo",
        namePlaceholder: "Nombre completo",
        phonePlaceholder: "+58 000 0000000",
        emailPlaceholder: "correo@correo.com",
        save: "Guardar cambios",
        saving: "Guardando...",
        errors: {
          load: "No se pudo cargar la información del cliente",
          save: "No se pudo guardar tu perfil."
        }
      },
      users: {
        title: "Usuarios Administrativos",
        subtitle: "Administra los usuarios con rol PRO asociados a este cliente.",
        add: "+ Nuevo usuario",
        loading: "Cargando usuarios...",
        errorLoad: "No se pudieron cargar los usuarios PRO",
        empty: "No hay usuarios PRO registrados.",
        noEmail: "Sin correo",
        editTitle: "Editar usuario PRO",
        newTitle: "Nuevo usuario PRO",
        name: "Nombre *",
        email: "Correo",
        phone: "Teléfono *",
        password: "Contraseña",
        passwordPlaceholder: "Deja en blanco para mantener",
        cancel: "Cancelar",
        save: "Guardar",
        saving: "Guardando...",
        errors: {
          nameRequired: "El nombre es obligatorio.",
          phoneRequired: "El teléfono es obligatorio.",
          invalidSession: "Sesión inválida: cliente no encontrado.",
          save: "No se pudo guardar el usuario.",
          delete: "No se pudo eliminar el usuario."
        },
        deleteConfirmTitle: "Eliminar usuario",
        deleteConfirm: (name: string) => `¿Eliminar a ${name}?`
      }
    },
    reports: {
      title: "Reporte de Citas",
      subtitle: "Resumen de citas",
      countLabel: "Citas",
      filters: {
        month: "Mes",
        year: "Año",
        professional: "Personal",
        status: "Estado",
        search: "Buscar",
        searchPlaceholder: "Buscar por nombre de cliente, teléfono o servicio...",
        showFilters: "Mostrar filtros",
        hideFilters: "Ocultar filtros",
        all: "Todos"
      },
      months: [
        "Enero",
        "Febrero",
        "Marzo",
        "Abril",
        "Mayo",
        "Junio",
        "Julio",
        "Agosto",
        "Septiembre",
        "Octubre",
        "Noviembre",
        "Diciembre"
      ],
      loading: "Cargando citas…",
      errorLoad: "No se pudieron cargar las citas",
      totals: "Total:",
      totalByProfessional: "Total por personal",
      totalByStatus: "Total por estado",
      statuses: {
        scheduled: "Programada",
        confirmed: "Confirmada",
        show: "Asistió",
        no_show: "No asistió",
        canceled: "Cancelada",
        completed: "Completada"
      },
      unassigned: "Sin asignar",
      table: {
        id: "ID",
        date: "Fecha",
        professional: "Personal",
        service: "Servicio",
        client: "Cliente",
        phone: "Teléfono",
        status: "Estado"
      },
      empty: "Sin resultados para los filtros seleccionados."
    },
    reportsClients: {
      title: "Reporte de Clientes",
      subtitle: "Resumen de clientes",
      searchPlaceholder: "Buscar por nombre o teléfono...",
      loading: "Cargando...",
      errorLoad: "No se pudieron cargar las citas",
      empty: "Sin resultados",
      table: {
        client: "Cliente",
        phone: "Teléfono",
        total: "Total",
        scheduled: "Programada",
        confirmed: "Confirmada",
        show: "Presentado",
        no_show: "No Presentado",
        canceled: "Cancelada",
        completed: "Completada"
      },
      statuses: {
        scheduled: "Programada",
        confirmed: "Confirmada",
        show: "Presentado",
        no_show: "No Presentado",
        canceled: "Cancelada",
        completed: "Completada"
      }
    },
    appointments: {
      titleNew: "Nueva Cita",
      loadingCalendar: "Cargando citas…",
      noAppointments: "Sin citas programadas",
      searchPlaceholder: "Buscar por nombre, teléfono o email...",
      save: "Guardar Cambios",
      cancel: "Cancelar",
      delete: "Eliminar Cita",
      statusLabel: "Estado",
      statusLabels: {
        scheduled: "Programada",
        confirmed: "Confirmada",
        show: "Presentado",
        no_show: "No Presentado",
        canceled: "Cancelada",
        completed: "Completada"
      },
      notesPlaceholder: "Notas adicionales sobre la cita...",
      personalTitle: "Personal",
      personalAll: "Todo el personal",
      calendarTitle: "Gestión de Citas",
      calendarSubtitle: "Administra las citas del salón",
      viewMonth: "Mes",
      viewWeek: "Semana",
      viewDay: "Día",
      defaultAppointmentTitle: "Cita",
      selectProfessional: "Selecciona personal",
      noSlots: "Sin horarios disponibles",
      selectTime: "Selecciona hora",
      createNewCustomer: "Crear nuevo cliente",
      changeCustomer: "Cambiar",
      newCustomerTitle: "Nuevo Cliente",
      newCustomerName: "Nombre completo",
      newCustomerPhone: "Teléfono",
      newCustomerEmail: "Email (Opcional)",
      createCustomerButton: "Crear Cliente",
      smsHistoryTitle: "Historial de SMS",
      loadingSms: "Cargando SMS...",
      noMessages: "Sin mensajes",
      smsSent: "Enviado",
      smsReceived: "Recibido",
      smsPlaceholder: "Escribir un mensaje...",
      smsSendConfirmation: "Enviar confirmación",
      smsSendReminder: "Enviar recordatorio",
      errors: {
        confirmDeleteTitle: "Eliminar cita",
        confirmDelete: "¿Está seguro de que desea eliminar esta cita?",
        loadProfessionals: "No se pudieron cargar los profesionales.",
        loadAppointments: "No se pudieron cargar las citas.",
        loadClients: "No se pudieron cargar los clientes.",
        createClient: "No se pudo crear el cliente.",
        createAppointment: "No se pudo crear la cita.",
        deleteAppointment: "No se pudo eliminar la cita.",
        loadSms: "No se pudo cargar el historial de SMS",
        sendSms: "No se pudo enviar el SMS",
        sendConfirmation: "No se pudo enviar la confirmación",
        sendReminder: "No se pudo enviar el recordatorio",
        missingClient: "Selecciona un cliente para la cita.",
        missingProfessional: "Selecciona el personal que atenderá la cita.",
        missingService: "Selecciona el servicio de la cita.",
        invalidService: "Selecciona un servicio válido.",
        missingTime: "Selecciona una hora disponible.",
        noSlotsDay: "No hay horarios disponibles para este día.",
        invalidTime: "Selecciona una hora válida.",
        missingLocation: "Configura la ubicación del cliente antes de crear una cita.",
        noClientFound: "No se encontró el cliente asociado."
      },
      labels: {
        client: "Cliente",
        service: "Servicio",
        date: "Fecha",
        time: "Hora",
        notes: "Notas (Opcional)"
      }
    },
    clients: {
      title: "Clientes",
      subtitle: "Gestiona tu base de clientes",
      searchPlaceholder: "Buscar por nombre, correo o teléfono...",
      addButton: "+ Nuevo cliente",
      editTitle: "Editar cliente",
      newTitle: "Nuevo cliente",
      name: "Nombre",
      phone: "Teléfono",
      email: "Email",
      save: "Guardar",
      cancel: "Cancelar",
      delete: "Eliminar",
      confirmDeleteTitle: "Eliminar",
      confirmDelete: "¿Eliminar este cliente?",
      errors: {
        load: "No se pudieron cargar los clientes",
        save: "No se pudo guardar el cliente.",
        delete: "No se pudo eliminar el cliente.",
        nameRequired: "El nombre es obligatorio.",
        phoneRequired: "El teléfono es obligatorio.",
        invalidSession: "Sesión inválida. Inicia sesión nuevamente."
      },
      noEmail: "Sin correo",
      registered: "Registrado",
      retry: "Reintentar",
      empty: "Sin clientes para mostrar"
    },
    staff: {
      title: "Gestión de Personal",
      subtitle: "Administra el equipo del salón",
      addButton: "＋ Nuevo Personal",
      loading: "Cargando personal…",
      errorLoad: "No se pudo cargar el personal.",
      errorSave: "No se pudo guardar el profesional.",
      errorDelete: "No se pudo eliminar el profesional.",
      errorNameRequired: "El nombre es requerido.",
      empty: "Sin personal para mostrar",
      editTitle: "Editar personal",
      newTitle: "Nuevo personal",
      name: "Nombre",
      email: "Email",
      phone: "Teléfono",
      namePlaceholder: "Nombre completo",
      phonePlaceholder: "+1 555 555 5555",
      emailPlaceholder: "correo@correo.com",
      tabInfo: "Información Personal",
      tabServices: "Servicios",
      tabSchedule: "Horarios",
      save: "Guardar",
      cancel: "Cancelar",
      delete: "Eliminar",
      saving: "Guardando...",
      confirmDeleteTitle: "Eliminar",
      confirmDelete: "¿Estás seguro de eliminar este profesional?",
      serviceTitle: "Servicios",
      selectService: "Selecciona un servicio",
      price: "Precio",
      pricePlaceholder: "Precio",
      duration: "Duración",
      minutesSuffix: "min",
      addService: "Agregar servicio",
      addAction: "Agregar",
      addedServices: "Servicios agregados",
      minutesLabel: "Minutos",
      priceLabel: "Precio",
      noServices: "Sin servicios asignados",
      servicesLabel: "Servicios:",
      workingDaysLabel: "Días laborales:",
      noSchedule: "Sin horario asignado",
      startLabel: "Inicio",
      endLabel: "Fin",
      scheduleTitle: "Horarios",
      daysFull: {
        monday: "Lunes",
        tuesday: "Martes",
        wednesday: "Miércoles",
        thursday: "Jueves",
        friday: "Viernes",
        saturday: "Sábado",
        sunday: "Domingo"
      },
      daysShort: {
        monday: "Lun",
        tuesday: "Mar",
        wednesday: "Mié",
        thursday: "Jue",
        friday: "Vie",
        saturday: "Sáb",
        sunday: "Dom"
      }
    },
    dashboard: {
      todayAppointments: "Citas Hoy",
      todaySubtitle: "Citas programadas para hoy",
      weekRevenue: "Ingresos Semana",
      weekSubtitle: "Ingresos de esta semana",
      availableStaff: "Personal Disponible",
      availableSubtitle: "Miembros del personal activos",
      upcoming: "Próximas Citas",
      upcomingSubtitle: "Citas pendientes hoy",
      defaultClient: "Cliente",
      defaultService: "Servicio",
      statusScheduled: "Programada",
      totalClients: "Total Clientes",
      monthAppointments: "Citas Este Mes",
      monthNewClients: "Nuevos Clientes Este Mes",
      nextToday: "Próximas Citas de Hoy",
      nextTodaySubtitle: "Lista de citas programadas para el día de hoy",
      noAppointments: "Sin citas programadas para hoy",
      quickSummary: "Resumen Rápido",
      quickSummarySubtitle: "Estadísticas importantes del salón",
      fakeDate: "martes, 25 de noviembre de 2025"
    }
  },
  en: {
    menu: {
      dashboard: "Dashboard",
      appointments: "Appointments",
      staff: "Staff",
      clients: "Clients",
      overview: "Appointments Report",
      clientReport: "Client Report",
      messages: "Messages",
      settings: "Settings"
    },
    logout: "Log out",
    common: {
      loading: "Loading..."
    },
    settings: {
      title: "Settings",
      tabs: {
        profile: "Profile",
        users: "Users"
      },
      profile: {
        title: "Profile",
        subtitle: "Update your personal information.",
        name: "Your name",
        phone: "Your phone",
        email: "Your email",
        namePlaceholder: "Full name",
        phonePlaceholder: "+1 000 000 0000",
        emailPlaceholder: "email@example.com",
        save: "Save changes",
        saving: "Saving...",
        errors: {
          load: "Could not load client information",
          save: "Could not save your profile."
        }
      },
      users: {
        title: "Admin Users",
        subtitle: "Manage the PRO users associated with this client.",
        add: "+ New user",
        loading: "Loading users...",
        errorLoad: "Could not load PRO users",
        empty: "No PRO users registered.",
        noEmail: "No email",
        editTitle: "Edit PRO user",
        newTitle: "New PRO user",
        name: "Name *",
        email: "Email",
        phone: "Phone *",
        password: "Password",
        passwordPlaceholder: "Leave blank to keep",
        cancel: "Cancel",
        save: "Save",
        saving: "Saving...",
        errors: {
          nameRequired: "Name is required.",
          phoneRequired: "Phone is required.",
          invalidSession: "Invalid session: client not found.",
          save: "Could not save the user.",
          delete: "Could not delete the user."
        },
        deleteConfirmTitle: "Delete user",
        deleteConfirm: (name: string) => `Delete ${name}?`
      }
    },
    reports: {
      title: "Appointments Report",
      subtitle: "Appointments summary",
      countLabel: "Appointments",
      filters: {
        month: "Month",
        year: "Year",
        professional: "Staff",
        status: "Status",
        search: "Search",
        searchPlaceholder: "Search by client name, phone or service...",
        showFilters: "Show filters",
        hideFilters: "Hide filters",
        all: "All"
      },
      months: [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December"
      ],
      loading: "Loading appointments…",
      errorLoad: "Could not load appointments",
      totals: "Total:",
      totalByProfessional: "Total by staff",
      totalByStatus: "Total by status",
      statuses: {
        scheduled: "Scheduled",
        confirmed: "Confirmed",
        show: "Showed up",
        no_show: "No-show",
        canceled: "Canceled",
        completed: "Completed"
      },
      unassigned: "Unassigned",
      table: {
        id: "ID",
        date: "Date",
        professional: "Staff",
        service: "Service",
        client: "Client",
        phone: "Phone",
        status: "Status"
      },
      empty: "No results for the selected filters."
    },
    reportsClients: {
      title: "Client Report",
      subtitle: "Client summary",
      searchPlaceholder: "Search by name or phone...",
      loading: "Loading...",
      errorLoad: "Could not load appointments",
      empty: "No results",
      table: {
        client: "Client",
        phone: "Phone",
        total: "Total",
        scheduled: "Scheduled",
        confirmed: "Confirmed",
        show: "Showed up",
        no_show: "No-show",
        canceled: "Canceled",
        completed: "Completed"
      },
      statuses: {
        scheduled: "Scheduled",
        confirmed: "Confirmed",
        show: "Showed up",
        no_show: "No-show",
        canceled: "Canceled",
        completed: "Completed"
      }
    },
    appointments: {
      titleNew: "New Appointment",
      loadingCalendar: "Loading appointments…",
      noAppointments: "No appointments scheduled",
      searchPlaceholder: "Search by name, phone or email...",
      save: "Save Changes",
      cancel: "Cancel",
      delete: "Delete Appointment",
      statusLabel: "Status",
      statusLabels: {
        scheduled: "Scheduled",
        confirmed: "Confirmed",
        show: "Showed up",
        no_show: "No-show",
        canceled: "Canceled",
        completed: "Completed"
      },
      notesPlaceholder: "Additional notes about the appointment...",
      personalTitle: "Staff",
      personalAll: "All staff",
      calendarTitle: "Appointments Management",
      calendarSubtitle: "Manage your salon appointments",
      viewMonth: "Month",
      viewWeek: "Week",
      viewDay: "Day",
      defaultAppointmentTitle: "Appointment",
      selectProfessional: "Select staff",
      noSlots: "No available times",
      selectTime: "Select time",
      createNewCustomer: "Create new customer",
      changeCustomer: "Change",
      newCustomerTitle: "New Customer",
      newCustomerName: "Full name",
      newCustomerPhone: "Phone",
      newCustomerEmail: "Email (Optional)",
      createCustomerButton: "Create Customer",
      smsHistoryTitle: "SMS History",
      loadingSms: "Loading SMS...",
      noMessages: "No messages",
      smsSent: "Sent",
      smsReceived: "Received",
      smsPlaceholder: "Write a message...",
      smsSendConfirmation: "Send confirmation",
      smsSendReminder: "Send reminder",
      errors: {
        confirmDeleteTitle: "Delete appointment",
        confirmDelete: "Are you sure you want to delete this appointment?",
        loadProfessionals: "Could not load professionals.",
        loadAppointments: "Could not load appointments.",
        loadClients: "Could not load clients.",
        createClient: "Could not create the client.",
        createAppointment: "Could not create the appointment.",
        deleteAppointment: "Could not delete the appointment.",
        loadSms: "Could not load SMS history",
        sendSms: "Could not send the SMS",
        sendConfirmation: "Could not send the confirmation",
        sendReminder: "Could not send the reminder",
        missingClient: "Select a client for the appointment.",
        missingProfessional: "Select the staff for the appointment.",
        missingService: "Select the appointment service.",
        invalidService: "Select a valid service.",
        missingTime: "Select an available time.",
        noSlotsDay: "No available times for this day.",
        invalidTime: "Select a valid time.",
        missingLocation: "Set the client location before creating an appointment.",
        noClientFound: "The associated client was not found."
      },
      labels: {
        client: "Client",
        service: "Service",
        date: "Date",
        time: "Time",
        notes: "Notes (Optional)"
      }
    },
    clients: {
      title: "Clients",
      subtitle: "Manage your client base",
      searchPlaceholder: "Search by name, email or phone...",
      addButton: "+ New client",
      editTitle: "Edit client",
      newTitle: "New client",
      name: "Name",
      phone: "Phone",
      email: "Email",
      save: "Save",
      cancel: "Cancel",
      delete: "Delete",
      confirmDeleteTitle: "Delete",
      confirmDelete: "Delete this client?",
      errors: {
        load: "Could not load clients",
        save: "Could not save the client.",
        delete: "Could not delete the client.",
        nameRequired: "Name is required.",
        phoneRequired: "Phone is required.",
        invalidSession: "Invalid session. Please sign in again."
      },
      noEmail: "No email",
      registered: "Registered",
      retry: "Retry",
      empty: "No clients to show"
    },
    staff: {
      title: "Staff Management",
      subtitle: "Manage your team",
      addButton: "+ New Staff",
      loading: "Loading staff…",
      errorLoad: "Could not load staff.",
      errorSave: "Could not save the professional.",
      errorDelete: "Could not delete the professional.",
      errorNameRequired: "Name is required.",
      empty: "No staff to show",
      editTitle: "Edit staff",
      newTitle: "New staff",
      name: "Name",
      email: "Email",
      phone: "Phone",
      namePlaceholder: "Full name",
      phonePlaceholder: "+1 555 555 5555",
      emailPlaceholder: "email@example.com",
      tabInfo: "Personal Info",
      tabServices: "Services",
      tabSchedule: "Schedule",
      save: "Save",
      cancel: "Cancel",
      delete: "Delete",
      saving: "Saving...",
      confirmDeleteTitle: "Delete",
      confirmDelete: "Are you sure you want to delete this professional?",
      serviceTitle: "Services",
      selectService: "Select a service",
      price: "Price",
      pricePlaceholder: "Price",
      duration: "Duration",
      minutesSuffix: "min",
      addService: "Add service",
      addAction: "Add",
      addedServices: "Added services",
      minutesLabel: "Minutes",
      priceLabel: "Price",
      noServices: "No services assigned",
      servicesLabel: "Services:",
      workingDaysLabel: "Working days:",
      noSchedule: "No schedule assigned",
      startLabel: "Start",
      endLabel: "End",
      scheduleTitle: "Schedule",
      daysFull: {
        monday: "Monday",
        tuesday: "Tuesday",
        wednesday: "Wednesday",
        thursday: "Thursday",
        friday: "Friday",
        saturday: "Saturday",
        sunday: "Sunday"
      },
      daysShort: {
        monday: "Mon",
        tuesday: "Tue",
        wednesday: "Wed",
        thursday: "Thu",
        friday: "Fri",
        saturday: "Sat",
        sunday: "Sun"
      }
    },
    dashboard: {
      todayAppointments: "Today’s Appointments",
      todaySubtitle: "Appointments scheduled for today",
      weekRevenue: "Revenue This Week",
      weekSubtitle: "Income for this week",
      availableStaff: "Available Staff",
      availableSubtitle: "Active staff members",
      upcoming: "Upcoming Appointments",
      upcomingSubtitle: "Pending appointments today",
      defaultClient: "Client",
      defaultService: "Service",
      statusScheduled: "Scheduled",
      totalClients: "Total Clients",
      monthAppointments: "Appointments This Month",
      monthNewClients: "New Clients This Month",
      nextToday: "Today’s Upcoming Appointments",
      nextTodaySubtitle: "List of appointments scheduled for today",
      noAppointments: "No appointments scheduled for today",
      quickSummary: "Quick Summary",
      quickSummarySubtitle: "Key salon stats",
      fakeDate: "Tuesday, November 25, 2025"
    }
  }
};

const STORAGE_KEY = "saloom_lang";

const detectLanguage = (): Language => {
  if (Platform.OS === "web" && typeof navigator !== "undefined") {
    const lang = navigator.language?.toLowerCase() ?? "en";
    if (lang.startsWith("es")) return "es";
    return "en";
  }
  return "en";
};

const getInitialLanguage = (): Language => {
  if (Platform.OS === "web") {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === "es" || stored === "en") return stored;
    } catch {
      // ignore storage errors
    }
  }
  return detectLanguage();
};

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (typeof translations)["es"];
}

const LanguageContext = createContext<LanguageContextValue>({
  language: "es",
  setLanguage: () => {},
  t: translations.es
});

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage());

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (Platform.OS === "web") {
      try {
        window.localStorage.setItem(STORAGE_KEY, lang);
      } catch {
        // ignore storage errors
      }
    }
  };
  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t: translations[language] ?? translations.es
    }),
    [language]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => useContext(LanguageContext);
