import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SPACES } from "./data/spaces";
import { EQUIPMENT } from "./data/equipment";
import { isSupabaseConfigured, supabase } from "./lib/supabase";
import AnimatedGridPattern from "./components/AnimatedGridPattern";
import LoginScreen from "./components/LoginScreen";
import WelcomeScreen from "./components/WelcomeScreen";
import CalendarPanel from "./components/CalendarPanel";
import BookingPanel from "./components/BookingPanel";
import AppHeader from "./components/AppHeader";
import NotificationCenter from "./components/NotificationCenter";
import SpaceSelector from "./components/SpaceSelector";
import SpaceDetailScreen from "./components/SpaceDetailScreen";
import EquipmentPanel from "./components/EquipmentPanel";
import BookingSummaryScreen from "./components/BookingSummaryScreen";
import ReservationsPanel from "./components/ReservationsPanel";
import SuccessScreen from "./components/SuccessScreen";
import AdminDashboard from "./components/AdminDashboard";
import AccountManagementPanel from "./components/AccountManagementPanel";
import StaffNavigation from "./components/StaffNavigation";

const pad = (number) => String(number).padStart(2, "0");
const key = (year, month, day) => `${year}-${pad(month + 1)}-${pad(day)}`;
const today = new Date();
const todayKey = key(today.getFullYear(), today.getMonth(), today.getDate());
const START_HOUR = "07:00";
const END_HOUR = "21:00";
const isProductionBuild = import.meta.env.PROD;
const EMPTY_BOOKINGS = [];
const PROFESSOR_ROLE = "professor";
const SUPPORT_ROLE = "support";
const ADMIN_ROLE = "admin";

const groupBy = (items, getKey) =>
  items.reduce((groups, item) => {
    const itemKey = getKey(item);
    if (!groups[itemKey]) groups[itemKey] = [];
    groups[itemKey].push(item);
    return groups;
  }, {});

const normalizeEquipmentValue = (value) =>
  String(value || "")
    .trim()
    .toLocaleLowerCase();

function App() {
  const [currentMonth, setCurrentMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [selectedSpaceId, setSelectedSpaceId] = useState(null);
  const [selectedDay, setSelectedDay] = useState(todayKey);
  const [isDemoLoggedIn, setIsDemoLoggedIn] = useState(false);
  const [loggedProfessorEmail, setLoggedProfessorEmail] = useState("");
  const [dataLoading, setDataLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [userName, setUserName] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [spaces, setSpaces] = useState(SPACES);
  const [equipment, setEquipment] = useState(EQUIPMENT);
  const [reason, setReason] = useState("");
  const [startTime, setStartTime] = useState("07:00");
  const [endTime, setEndTime] = useState("09:00");
  const [message, setMessage] = useState({ text: "", type: "" });
  const [notifications, setNotifications] = useState([]);
  const [bookings, setBookings] = useState({});
  const [equipmentBookings, setEquipmentBookings] = useState({});
  const [availabilityBookings, setAvailabilityBookings] = useState({});
  const [equipmentAvailability, setEquipmentAvailability] = useState({});
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [activeView, setActiveView] = useState("agenda");
  const [role, setRole] = useState(PROFESSOR_ROLE);
  const [adminReservations, setAdminReservations] = useState([]);
  const [realtimeStatus, setRealtimeStatus] = useState("polling");
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);
  const [equipmentDay, setEquipmentDay] = useState(todayKey);
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState("forward");
  const [transitioning, setTransitioning] = useState(false);
  const timeoutRef = useRef(null);
  const realtimeRefreshTimeoutRef = useRef(null);
  const lastLoadErrorRef = useRef("");

  const isAdmin = role === ADMIN_ROLE;
  const isSupport = role === SUPPORT_ROLE;
  const isStaff = isAdmin || isSupport;
  const selectedSpace =
    spaces.find((space) => space.id === selectedSpaceId) || null;
  const displayName = userName;

  const pushNotification = useCallback((text, type = "info") => {
    const id = `${Date.now()}-${Math.random()}`;
    setNotifications((previous) => [...previous, { id, text, type }]);
  }, []);

  const dismissNotification = useCallback((id) => {
    setNotifications((previous) =>
      previous.filter((notification) => notification.id !== id),
    );
  }, []);

  useEffect(
    () => () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    },
    [],
  );

  useEffect(() => {
    if (!isDemoLoggedIn || !loggedProfessorEmail || !supabase) return undefined;

    let active = true;
    const monthStart = key(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      1,
    );
    const lastDayOfMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + 1,
      0,
    ).getDate();
    const monthEnd = key(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      lastDayOfMonth,
    );
    // El administrador consulta un rango amplio para calcular estadísticas históricas y próximas.
    const rangeStart = isStaff
      ? key(today.getFullYear() - 1, 0, 1)
      : monthStart;
    const rangeEnd = isStaff ? key(today.getFullYear() + 1, 11, 31) : monthEnd;
    const asTime = (value) => String(value).slice(0, 5);
    const asText = (value) =>
      value === null || value === undefined ? "" : String(value);

    const loadReservations = async () => {
      setDataLoading(true);
      const [spacesResult, equipmentResult, reservationsResult, detailsResult] =
        await Promise.all([
          supabase
            .from("spaces")
            .select("id, name, capacity, description")
            .order("id"),
          supabase
            .from("equipment")
            .select("id, name, type, description, total_units, space_number")
            .in(
              "id",
              EQUIPMENT.map((item) => item.id),
            )
            .order("id"),
          isStaff
            ? Promise.resolve({ data: [], error: null })
            : supabase.rpc("get_test_reservations", {
                p_professor_email: loggedProfessorEmail,
              }),
          supabase.rpc("get_reservation_availability_details", {
            p_start_date: rangeStart,
            p_end_date: rangeEnd,
          }),
        ]);

      // La función con nombres de docentes es opcional: si no está desplegada, usamos la versión anterior.
      let availabilityResult = detailsResult;
      if (availabilityResult.error) {
        availabilityResult = await supabase.rpc(
          "get_reservation_availability",
          {
            p_start_date: rangeStart,
            p_end_date: rangeEnd,
          },
        );
      }

      if (spacesResult.error) throw spacesResult.error;
      if (!active) return;

      const loadedSpaces = spacesResult.data.map((row) => {
        const localSpace = SPACES.find((item) => item.id === Number(row.id));
        return {
          ...row,
          id: Number(row.id),
          capacidad: row.capacity,
          desc: row.description,
          features: localSpace?.features || [],
          inventoryNumber: localSpace?.inventoryNumber,
          img: localSpace?.img || "",
        };
      });
      setSpaces(loadedSpaces);

      const failed = [
        equipmentResult,
        reservationsResult,
        availabilityResult,
      ].find((result) => result.error);
      if (failed) throw failed.error;

      const loadedEquipment = equipmentResult.data.map((row) => {
        const localEquipment =
          EQUIPMENT.find(
            (item) =>
              normalizeEquipmentValue(item.id) ===
              normalizeEquipmentValue(row.id),
          ) ||
          EQUIPMENT.find(
            (item) =>
              item.spaceNumber === Number(row.space_number) &&
              normalizeEquipmentValue(item.type) ===
                normalizeEquipmentValue(row.type),
          );
        return {
          ...row,
          id: String(row.id),
          desc: row.description,
          total: row.total_units,
          img: localEquipment?.img || "",
          spaceNumber: row.space_number,
        };
      });
      const ownReservations = (reservationsResult.data || []).map((row) => ({
        id: row.reservation_id,
        kind: row.resource_type,
        resourceId:
          row.resource_type === "space"
            ? Number(row.resource_id)
            : row.resource_id,
        spaceId:
          row.resource_type === "space" ? Number(row.resource_id) : undefined,
        date: row.reservation_date,
        a: asTime(row.start_time),
        b: asTime(row.end_time),
        r: row.usability || row.reason || "",
        usability: row.usability || row.reason || "",
        t: userName,
        owned: true,
      }));
      const ownReservationIds = new Set(
        ownReservations.map((reservation) => reservation.id),
      );
      const availability = (availabilityResult.data || []).map((row) => {
        const resourceId =
          row.resource_type === "space"
            ? Number(row.resource_id)
            : row.resource_id;
        const professorName = asText(row.professor_name || row.professor || "");
        return {
          id: row.reservation_id,
          kind: row.resource_type,
          resourceId,
          spaceId: row.resource_type === "space" ? resourceId : undefined,
          date: row.reservation_date,
          a: asTime(row.start_time),
          b: asTime(row.end_time),
          r: row.reason || "",
          usability: row.resource_type === "equipment" ? row.reason || "" : "",
          t: professorName || "Otro docente",
          professorEmail: asText(row.professor_email),
          professorName,
          status: row.status || "confirmed",
          owned: ownReservationIds.has(row.reservation_id),
        };
      });
      const availabilityById = new Map(
        availability.map((reservation) => [reservation.id, reservation]),
      );
      ownReservations.forEach((reservation) => {
        reservation.r ||= availabilityById.get(reservation.id)?.r || "";
        reservation.usability ||=
          availabilityById.get(reservation.id)?.usability || "";
      });

      setEquipment(loadedEquipment);
      setBookings(
        groupBy(
          ownReservations.filter((item) => item.kind === "space"),
          (item) => item.resourceId,
        ),
      );
      setEquipmentBookings(
        groupBy(
          ownReservations.filter((item) => item.kind === "equipment"),
          (item) => item.resourceId,
        ),
      );
      const activeAvailability = availability.filter(
        (item) => item.status === "confirmed",
      );
      setAvailabilityBookings(
        groupBy(
          activeAvailability.filter((item) => item.kind === "space"),
          (item) => item.spaceId,
        ),
      );
      setEquipmentAvailability(
        groupBy(
          activeAvailability.filter((item) => item.kind === "equipment"),
          (item) => item.resourceId,
        ),
      );
      setAdminReservations(
        isStaff
          ? availability.map((item) => ({
              ...item,
              start: item.a,
              end: item.b,
              reason: item.r,
            }))
          : [],
      );
      lastLoadErrorRef.current = "";
      setLastUpdatedAt(new Date());
    };

    loadReservations()
      .catch((error) => {
        if (active && lastLoadErrorRef.current !== error.message) {
          lastLoadErrorRef.current = error.message;
          pushNotification(
            `Error al cargar la base de prueba: ${error.message}. Verifica la configuración y el esquema de Supabase.`,
            "error",
          );
        }
      })
      .finally(() => {
        if (active) setDataLoading(false);
      });

    return () => {
      active = false;
    };
  }, [
    isDemoLoggedIn,
    loggedProfessorEmail,
    currentMonth,
    refreshVersion,
    pushNotification,
    userName,
    isStaff,
  ]);

  useEffect(() => {
    if (!isDemoLoggedIn || !isStaff || !supabase) {
      setRealtimeStatus("polling");
      return undefined;
    }

    const refreshFromRealtime = () => {
      if (realtimeRefreshTimeoutRef.current) {
        window.clearTimeout(realtimeRefreshTimeoutRef.current);
      }
      realtimeRefreshTimeoutRef.current = window.setTimeout(() => {
        setRefreshVersion((version) => version + 1);
      }, 250);
    };
    const tables = [
      "reservations",
      "equipment_reservations",
      "spaces",
      "equipment",
    ];
    const channel = supabase.channel("admin-dashboard-live");
    tables.forEach((table) => {
      channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        refreshFromRealtime,
      );
    });
    channel.subscribe((status) => {
      setRealtimeStatus(status === "SUBSCRIBED" ? "connected" : "polling");
    });

    const fallbackInterval = window.setInterval(() => {
      setRefreshVersion((version) => version + 1);
    }, 15000);

    return () => {
      window.clearInterval(fallbackInterval);
      if (realtimeRefreshTimeoutRef.current) {
        window.clearTimeout(realtimeRefreshTimeoutRef.current);
        realtimeRefreshTimeoutRef.current = null;
      }
      supabase.removeChannel(channel);
    };
  }, [isDemoLoggedIn, isStaff, loggedProfessorEmail]);

  useEffect(() => {
    setMessage({ text: "", type: "" });
  }, [selectedDay, selectedSpaceId]);

  const selectedDateBookings = useMemo(
    () =>
      selectedSpaceId === null
        ? []
        : (availabilityBookings[selectedSpaceId] || []).filter(
            (booking) => booking.date === selectedDay,
          ),
    [availabilityBookings, selectedSpaceId, selectedDay],
  );

  const dayTitle = (() => {
    const [year, month, day] = selectedDay.split("-").map(Number);
    return new Date(year, month - 1, day).toLocaleDateString("es", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  })();

  const goToStep = (newStep, nextDirection) => {
    if (transitioning) return;
    setDirection(nextDirection);
    setTransitioning(true);
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => {
      setStep(newStep);
      setTransitioning(false);
    }, 300);
  };

  const handleSelectSpace = (id) => {
    setSelectedSpaceId(id);
    goToStep(2, "forward");
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoginError("");
    if (isProductionBuild && !isSupabaseConfigured) {
      setLoginError(
        "La conexión con la base de datos no está configurada. Configura las variables de Supabase en Netlify y vuelve a publicar el sitio.",
      );
      return;
    }

    const email = loginEmail.trim().toLocaleLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setLoginError("Ingresa un correo electrónico válido.");
      return;
    }

    let name = email.split("@")[0];
    let nextRole = PROFESSOR_ROLE;

    if (isSupabaseConfigured && supabase) {
      try {
        let account = null;

        const { data: admins, error: adminError } = await supabase.rpc(
          "lookup_test_admin",
          { p_email: email },
        );
        let lookupError = adminError;
        if (!adminError && admins?.length) {
          const admin = admins[0];
          account = {
            ...admin,
            role: ADMIN_ROLE,
            name: admin.name || email.split("@")[0],
          };
        }

        if (!account) {
          const { data: supportAccounts, error: supportError } =
            await supabase.rpc("lookup_test_support", { p_email: email });
          lookupError ||= supportError;
          if (!supportError && supportAccounts?.length) {
            account = { ...supportAccounts[0], role: SUPPORT_ROLE };
          }
        }

        if (!account) {
          const { data: professors, error: professorError } =
            await supabase.rpc("lookup_test_professor", { p_email: email });
          lookupError ||= professorError;
          if (!professorError && professors?.length) {
            const professor = professors[0];
            account = { ...professor, role: PROFESSOR_ROLE };
          }
        }

        if (!account) {
          setLoginError(
            lookupError
              ? "Supabase aún no tiene las funciones de acceso por correo. Ejecuta supabase/email-identity.sql y vuelve a intentar."
              : "No encontramos una cuenta registrada con ese correo.",
          );
          return;
        }

        name = account.name || account.full_name || email.split("@")[0];
        nextRole =
          account.role === ADMIN_ROLE
            ? ADMIN_ROLE
            : account.role === SUPPORT_ROLE
              ? SUPPORT_ROLE
              : PROFESSOR_ROLE;
        const professorEmail = account.email || email;
        if (nextRole === PROFESSOR_ROLE && !professorEmail) {
          setLoginError("La cuenta no tiene un correo asociado en Supabase.");
          return;
        }
        setLoggedProfessorEmail(professorEmail);
      } catch (error) {
        setLoginError(`No se pudo conectar con Supabase: ${error.message}`);
        return;
      }
    } else {
      name = `Docente ${name}`;
      setLoggedProfessorEmail(email);
    }

    setRole(nextRole);
    setUserName(name);
    setLoginEmail("");
    setIsDemoLoggedIn(true);
    setShowWelcome(true);
    setActiveView(nextRole === PROFESSOR_ROLE ? "agenda" : "dashboard-summary");
  };

  const handleContinue = () => setShowWelcome(false);

  const handleLogout = () => {
    setIsDemoLoggedIn(false);
    setLoggedProfessorEmail("");
    setUserName("");
    setRole(PROFESSOR_ROLE);
    setBookings({});
    setEquipmentBookings({});
    setAvailabilityBookings({});
    setEquipmentAvailability({});
    setAdminReservations([]);
    setEquipmentDay(todayKey);
    setActiveView("agenda");
    setStep(1);
    setSelectedSpaceId(null);
  };

  const handleMonthChange = useCallback((monthOffset) => {
    setCurrentMonth(
      (previous) =>
        new Date(previous.getFullYear(), previous.getMonth() + monthOffset, 1),
    );
  }, []);

  const handleBook = async () => {
    const showBookingError = (text) => {
      setMessage({ text, type: "error" });
      pushNotification(text, "error");
    };
    const trimmedReason = reason.trim();
    if (!trimmedReason) {
      showBookingError("Escribe el nombre de la escuela para agendar.");
      return;
    }
    if (!startTime || !endTime || startTime >= endTime) {
      showBookingError("La hora de fin debe ser posterior al inicio.");
      return;
    }
    if (startTime < START_HOUR || endTime > END_HOUR) {
      showBookingError("La reserva debe estar entre las 07:00 y las 21:00.");
      return;
    }

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.rpc("save_test_space_reservation", {
        p_professor_email: loggedProfessorEmail,
        p_id: null,
        p_space_id: selectedSpaceId,
        p_date: selectedDay,
        p_start: startTime,
        p_end: endTime,
        p_reason: trimmedReason,
      });
      if (error) {
        showBookingError(
          error.message.includes("occupied")
            ? "Ese horario ya está ocupado en este salón."
            : error.message,
        );
        return;
      }
      setRefreshVersion((version) => version + 1);
      setReason(trimmedReason);
      setMessage({ text: "Préstamo realizado con éxito.", type: "success" });
      pushNotification("Tu préstamo de espacio quedó registrado.", "success");
      goToStep(4, "forward");
      return;
    }

    {
      const localBooking = {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        date: selectedDay,
        a: startTime,
        b: endTime,
        t: displayName,
        r: trimmedReason,
        spaceId: selectedSpaceId,
        owned: true,
        kind: "space",
      };
      setBookings((previous) => ({
        ...previous,
        [selectedSpaceId]: [...(previous[selectedSpaceId] || []), localBooking],
      }));
      setAvailabilityBookings((previous) => ({
        ...previous,
        [selectedSpaceId]: [...(previous[selectedSpaceId] || []), localBooking],
      }));
      setReason(trimmedReason);
      setMessage({
        text: "Reserva registrada en esta sesión de prueba.",
        type: "success",
      });
      pushNotification(
        "Tu reserva de prueba quedó registrada temporalmente.",
        "success",
      );
      goToStep(4, "forward");
      return;
    }
  };

  const handleAdminAssignSpace = async ({
    professorEmail,
    spaceId,
    date,
    start,
    end,
    reason: bookingReason,
  }) => {
    if (
      !professorEmail.trim() ||
      !bookingReason.trim() ||
      !date ||
      start < START_HOUR ||
      end > END_HOUR ||
      start >= end
    ) {
      pushNotification(
        "Completa los datos y verifica que el horario esté entre las 07:00 y las 21:00.",
        "error",
      );
      return false;
    }

    const { error } = await supabase.rpc("save_test_space_reservation", {
      p_professor_email: professorEmail.trim().toLocaleLowerCase(),
      p_id: null,
      p_space_id: Number(spaceId),
      p_date: date,
      p_start: start,
      p_end: end,
      p_reason: bookingReason.trim(),
    });
    if (error) {
      pushNotification(
        error.message.includes("occupied")
          ? "Ese horario ya está ocupado en este salón."
          : `No se pudo asignar el salón: ${error.message}`,
        "error",
      );
      return false;
    }

    setRefreshVersion((version) => version + 1);
    pushNotification("Salón asignado al docente correctamente.", "success");
    return true;
  };

  const handleStaffCancelReservation = async (reservation) => {
    if (!reservation.professorEmail) {
      pushNotification(
        "No se puede cancelar: falta el correo del docente asociado al préstamo.",
        "error",
      );
      return false;
    }
    const resourceType = reservation.kind === "equipment" ? "equipment" : "space";
    const resourceLabel = resourceType === "equipment" ? "préstamo de equipo" : "reserva de salón";
    const { data, error } = await supabase.rpc("cancel_test_reservation", {
      p_professor_email: reservation.professorEmail,
      p_id: reservation.id,
      p_resource_type: resourceType,
    });
    if (error || !data) {
      pushNotification(
        `No se pudo cancelar el ${resourceLabel}${error ? `: ${error.message}` : "."}`,
        "error",
      );
      return false;
    }

    setRefreshVersion((version) => version + 1);
    pushNotification(`${resourceLabel.charAt(0).toUpperCase()}${resourceLabel.slice(1)} cancelado.`, "success");
    return true;
  };

  const handleCancelRoomBooking = async (bookingId) => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.rpc("cancel_test_reservation", {
        p_professor_email: loggedProfessorEmail,
        p_id: bookingId,
        p_resource_type: "space",
      });
      if (error || !data) {
        pushNotification(
          `No se pudo cancelar el préstamo${error ? `: ${error.message}` : "."}`,
          "error",
        );
        return false;
      }
      setRefreshVersion((version) => version + 1);
      pushNotification("Préstamo cancelado.", "success");
      return true;
    }

    {
      const filterBooking = (groups) =>
        Object.fromEntries(
          Object.entries(groups).map(([resourceId, items]) => [
            resourceId,
            items.filter((booking) => booking.id !== bookingId),
          ]),
        );
      setBookings(filterBooking);
      setAvailabilityBookings(filterBooking);
      pushNotification("Reserva de prueba cancelada.", "success");
      return true;
    }
  };

  const handleBookEquipment = async (
    equipmentId,
    start,
    end,
    date = selectedDay,
    usability = "",
  ) => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.rpc(
        "save_test_equipment_reservation",
        {
          p_professor_email: loggedProfessorEmail,
          p_id: null,
          p_equipment_id: equipmentId,
          p_date: date,
          p_start: start,
          p_end: end,
        },
      );
      if (error) {
        pushNotification(
          error.message.includes("available")
            ? "No hay unidades disponibles en ese horario."
            : `No se pudo guardar el préstamo: ${error.message}`,
          "error",
        );
        return false;
      }
      if (equipment.find((item) => item.id === equipmentId)?.type === "Gafas") {
        const reservationId =
          typeof data === "string" &&
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
            data,
          )
            ? data
            : null;
        const { error: usabilityError } = await supabase.rpc(
          "save_test_equipment_usability",
          {
            p_professor_email: loggedProfessorEmail,
            p_id: reservationId,
            p_equipment_id: equipmentId,
            p_date: date,
            p_start: start,
            p_end: end,
            p_usability: usability.trim(),
          },
        );
        if (usabilityError) {
          setRefreshVersion((version) => version + 1);
          pushNotification(
            `El préstamo se guardó, pero no se pudo guardar el uso de las gafas: ${usabilityError.message}. Puedes completar el dato desde Tus reservas.`,
            "error",
          );
          return false;
        }
      }
      setRefreshVersion((version) => version + 1);
      pushNotification(
        `Préstamo de equipo guardado: ${start}–${end}.`,
        "success",
      );
      return true;
    }

    {
      const booking = {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        date,
        a: start,
        b: end,
        t: displayName,
        equipmentId,
        r: usability,
      };
      setEquipmentBookings((previous) => ({
        ...previous,
        [equipmentId]: [...(previous[equipmentId] || []), booking],
      }));
      setEquipmentAvailability((previous) => ({
        ...previous,
        [equipmentId]: [...(previous[equipmentId] || []), booking],
      }));
      pushNotification(
        `Equipo reservado de ${start} a ${end} en esta sesión de prueba.`,
        "success",
      );
      return true;
    }
  };

  const handleUpdateReservation = async (reservation, form) => {
    const trimmedReason = form.reason.trim();
    if (reservation.kind === "space" && !trimmedReason) {
      pushNotification(
        "La escuela es obligatoria para guardar una reserva de espacio.",
        "error",
      );
      return false;
    }

    if (!isSupabaseConfigured || !supabase) {
      if (reservation.kind === "space") {
        const updateBookings = (groups) => {
          const next = Object.fromEntries(
            Object.entries(groups).map(([resourceId, items]) => [
              resourceId,
              items.filter((item) => item.id !== reservation.id),
            ]),
          );
          const updated = {
            ...reservation,
            spaceId: Number(form.resourceId),
            date: form.date,
            a: form.start,
            b: form.end,
            r: trimmedReason,
            resourceId: Number(form.resourceId),
            owned: true,
            kind: "space",
          };
          next[updated.spaceId] = [...(next[updated.spaceId] || []), updated];
          return next;
        };
        setBookings(updateBookings);
        setAvailabilityBookings(updateBookings);
      } else {
        const updated = {
          ...reservation,
          resourceId: form.resourceId,
          date: form.date,
          a: form.start,
          b: form.end,
          r:
            equipment.find((item) => item.id === form.resourceId)?.type ===
            "Gafas"
              ? form.usability.trim()
              : "",
        };
        const updateBookings = (groups) => {
          const next = Object.fromEntries(
            Object.entries(groups).map(([resourceId, items]) => [
              resourceId,
              items.filter((item) => item.id !== reservation.id),
            ]),
          );
          next[form.resourceId] = [...(next[form.resourceId] || []), updated];
          return next;
        };
        setEquipmentBookings(updateBookings);
        setEquipmentAvailability(updateBookings);
      }
      pushNotification("Cambios guardados en la reserva temporal.", "success");
      return true;
    }
    const isSpace = reservation.kind === "space";
    const { error } = await supabase.rpc(
      isSpace
        ? "save_test_space_reservation"
        : "save_test_equipment_reservation",
      isSpace
        ? {
            p_professor_email: loggedProfessorEmail,
            p_id: reservation.id,
            p_space_id: Number(form.resourceId),
            p_date: form.date,
            p_start: form.start,
            p_end: form.end,
            p_reason: trimmedReason,
          }
        : {
            p_professor_email: loggedProfessorEmail,
            p_id: reservation.id,
            p_equipment_id: form.resourceId,
            p_date: form.date,
            p_start: form.start,
            p_end: form.end,
          },
    );
    if (error) {
      pushNotification(
        `No se pudieron guardar los cambios: ${error.message}`,
        "error",
      );
      return false;
    }
    if (!isSpace) {
      const { error: usabilityError } = await supabase.rpc(
        "save_test_equipment_usability",
        {
          p_professor_email: loggedProfessorEmail,
          p_id: reservation.id,
          p_equipment_id: form.resourceId,
          p_date: form.date,
          p_start: form.start,
          p_end: form.end,
          p_usability:
            equipment.find((item) => item.id === form.resourceId)?.type ===
            "Gafas"
              ? form.usability.trim()
              : "",
        },
      );
      if (usabilityError) {
        pushNotification(
          `Se guardaron los datos de la reserva, pero no se pudo actualizar el uso de las gafas: ${usabilityError.message}`,
          "error",
        );
        return false;
      }
    }
    setRefreshVersion((version) => version + 1);
    pushNotification("Cambios guardados en tu reserva.", "success");
    return true;
  };

  const handleCancelReservation = async (reservation) => {
    if (!isSupabaseConfigured || !supabase) {
      if (reservation.kind === "space") {
        const filterReservation = (groups) =>
          Object.fromEntries(
            Object.entries(groups).map(([resourceId, items]) => [
              resourceId,
              items.filter((item) => item.id !== reservation.id),
            ]),
          );
        setBookings(filterReservation);
        setAvailabilityBookings(filterReservation);
      } else {
        const filterReservation = (groups) =>
          Object.fromEntries(
            Object.entries(groups).map(([resourceId, items]) => [
              resourceId,
              items.filter((item) => item.id !== reservation.id),
            ]),
          );
        setEquipmentBookings(filterReservation);
        setEquipmentAvailability(filterReservation);
      }
      pushNotification("Reserva de prueba cancelada.", "success");
      return;
    }
    const { data, error } = await supabase.rpc("cancel_test_reservation", {
      p_professor_email: loggedProfessorEmail,
      p_id: reservation.id,
      p_resource_type: reservation.kind,
    });
    if (error || !data) {
      pushNotification(
        `No se pudo cancelar la reserva${error ? `: ${error.message}` : "."}`,
        "error",
      );
      return;
    }
    setRefreshVersion((version) => version + 1);
    pushNotification("Reserva cancelada correctamente.", "success");
  };

  const handleConfirmBooking = () => {
    if (!reason.trim()) {
      pushNotification(
        "La escuela es obligatoria para confirmar la reserva.",
        "error",
      );
      goToStep(3, "back");
      return;
    }
    pushNotification("¡Reserva confirmada exitosamente!", "success");
    goToStep(6, "forward");
  };

  const handleFinish = () => {
    setSelectedSpaceId(null);
    setStep(1);
    setReason("");
    setStartTime("07:00");
    setEndTime("09:00");
    setSelectedDay(todayKey);
    setDirection("forward");
    setTransitioning(false);
    setRefreshVersion((version) => version + 1);
  };

  const handleEquipmentContinue = () => {
    const hasEquipmentForDay = Object.values(equipmentBookings).some(
      (bookingList) =>
        bookingList.some((booking) => booking.date === selectedDay),
    );
    if (!hasEquipmentForDay)
      pushNotification("Puedes continuar sin reservar equipos.", "info");
    goToStep(5, "forward");
  };

  const reservations = useMemo(
    () =>
      [
        ...Object.values(bookings)
          .flat()
          .map((booking) => ({
            id: booking.id,
            kind: "space",
            resourceId: booking.spaceId ?? booking.resourceId,
            date: booking.date,
            start: booking.a,
            end: booking.b,
            reason: booking.r,
          })),
        ...Object.entries(equipmentBookings).flatMap(
          ([equipmentId, bookingList]) =>
            bookingList.map((booking) => ({
              id: booking.id,
              kind: "equipment",
              resourceId: equipmentId,
              date: booking.date,
              start: booking.a,
              end: booking.b,
              usability: booking.r || "",
            })),
        ),
      ].sort(
        (first, second) =>
          first.date.localeCompare(second.date) ||
          first.start.localeCompare(second.start),
      ),
    [bookings, equipmentBookings],
  );

  if (!isDemoLoggedIn) {
    return (
      <>
        <NotificationCenter
          notifications={notifications}
          onDismiss={dismissNotification}
        />
        <LoginScreen
          email={loginEmail}
          loginError={loginError}
          onEmailChange={setLoginEmail}
          onSubmit={handleLogin}
          isSupabaseConfigured={isSupabaseConfigured}
          isProductionBuild={isProductionBuild}
        />
      </>
    );
  }

  if (showWelcome)
    return <WelcomeScreen userName={displayName} onContinue={handleContinue} />;

  const stepAnimClass = direction === "back" ? "step-enter-back" : "step-enter";

  return (
    <div className="app-gradient-background relative min-h-screen overflow-clip text-slate-900">
      <AnimatedGridPattern />
      <div className="relative z-10 min-h-screen">
        <NotificationCenter
          notifications={notifications}
          onDismiss={dismissNotification}
        />
        <AppHeader
          userName={displayName}
          onLogout={handleLogout}
          activeView={activeView}
          onViewChange={setActiveView}
          role={role}
        />

        <main
          className={`mx-auto ${isStaff ? "max-w-screen-2xl" : "max-w-7xl"} px-4 py-6 sm:px-6 sm:py-8`}
        >
          {isStaff ? (
            <div className="grid items-start gap-5 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-8">
              <StaffNavigation
                role={role}
                activeView={activeView}
                onViewChange={setActiveView}
              />
              <div className="min-w-0">
                {activeView === "accounts" && isAdmin ? (
                  <AccountManagementPanel adminEmail={loggedProfessorEmail} />
                ) : (
                  <AdminDashboard
                    activeSection={activeView}
                    reservations={adminReservations}
                    spaces={spaces}
                    equipment={equipment}
                    role={role}
                    loading={dataLoading}
                    realtimeStatus={realtimeStatus}
                    lastUpdatedAt={lastUpdatedAt}
                    onRefresh={() =>
                      setRefreshVersion((version) => version + 1)
                    }
                    onAssignSpace={handleAdminAssignSpace}
                    onCancelReservation={handleStaffCancelReservation}
                  />
                )}
              </div>
            </div>
          ) : activeView === "reservations" ? (
            <ReservationsPanel
              reservations={reservations}
              spaces={spaces}
              equipment={equipment}
              loading={dataLoading}
              onUpdate={handleUpdateReservation}
              onCancel={handleCancelReservation}
            />
          ) : activeView === "equipment" ? (
            <>
              {dataLoading && (
                <p className="mb-4 text-xs font-medium text-slate-500">
                  Sincronizando con Supabase…
                </p>
              )}
              <EquipmentPanel
                equipment={equipment}
                selectedDay={equipmentDay}
                equipmentBookings={equipmentAvailability}
                onBookEquipment={handleBookEquipment}
                onDayChange={setEquipmentDay}
                onViewAgenda={() => {
                  setSelectedSpaceId(null);
                  setStep(1);
                  setActiveView("agenda");
                }}
                onViewReservations={() => setActiveView("reservations")}
                isStandalone
                direction={direction}
              />
            </>
          ) : (
            <>
              {dataLoading && (
                <p className="mb-4 text-xs font-medium text-slate-500">
                  Sincronizando con Supabase…
                </p>
              )}
              {!transitioning && step === 1 && (
                <SpaceSelector
                  spaces={spaces}
                  onSelectSpace={handleSelectSpace}
                  onBookEquipmentOnly={() => setActiveView("equipment")}
                  direction={direction}
                />
              )}

              {!transitioning && step === 2 && selectedSpace && (
                <SpaceDetailScreen
                  space={selectedSpace}
                  direction={direction}
                  onContinue={() => goToStep(3, "forward")}
                  onBack={() => {
                    setSelectedSpaceId(null);
                    goToStep(1, "back");
                  }}
                />
              )}

              {!transitioning && step === 3 && (
                <div className={stepAnimClass}>
                  <section className="grid gap-6 lg:grid-cols-3">
                    <CalendarPanel
                      currentMonth={currentMonth}
                      selectedSpace={selectedSpace}
                      selectedDay={selectedDay}
                      bookings={
                        availabilityBookings[selectedSpaceId] || EMPTY_BOOKINGS
                      }
                      onMonthChange={handleMonthChange}
                      onDateSelect={setSelectedDay}
                      todayKey={todayKey}
                    />
                    <BookingPanel
                      dayTitle={dayTitle}
                      selectedDateBookings={selectedDateBookings}
                      reason={reason}
                      startTime={startTime}
                      endTime={endTime}
                      message={message}
                      onReasonChange={setReason}
                      onStartTimeChange={setStartTime}
                      onEndTimeChange={setEndTime}
                      onBook={handleBook}
                      onCancelBooking={handleCancelRoomBooking}
                    />
                  </section>
                  <div className="mt-6 flex gap-3">
                    <button
                      type="button"
                      onClick={() => goToStep(2, "back")}
                      className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 active:scale-95"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15 19l-7-7 7-7"
                        />
                      </svg>
                      Atrás
                    </button>
                  </div>
                </div>
              )}

              {!transitioning && step === 4 && (
                <EquipmentPanel
                  equipment={equipment}
                  selectedSpace={selectedSpace}
                  selectedDay={selectedDay}
                  equipmentBookings={equipmentAvailability}
                  onBookEquipment={handleBookEquipment}
                  onBack={() => goToStep(3, "back")}
                  onContinue={handleEquipmentContinue}
                  direction={direction}
                />
              )}

              {!transitioning && step === 5 && (
                <BookingSummaryScreen
                  direction={direction}
                  userName={displayName}
                  space={selectedSpace}
                  selectedDay={selectedDay}
                  startTime={startTime}
                  endTime={endTime}
                  reason={reason}
                  equipmentBookings={equipmentBookings}
                  equipment={equipment}
                  onEditSpace={() => {
                    setSelectedSpaceId(null);
                    goToStep(1, "back");
                  }}
                  onEditCalendar={() => goToStep(3, "back")}
                  onEditEquipment={() => goToStep(4, "back")}
                  onConfirm={handleConfirmBooking}
                  onBack={() => goToStep(4, "back")}
                />
              )}

              {!transitioning && step === 6 && (
                <SuccessScreen onFinish={handleFinish} />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
