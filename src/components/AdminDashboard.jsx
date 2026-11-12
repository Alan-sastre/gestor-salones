import { Fragment, useMemo, useState } from "react";
import {
  FaBan,
  FaCalendarAlt,
  FaChalkboardTeacher,
  FaClock,
  FaEdit,
  FaFileExcel,
  FaLaptop,
  FaPlus,
  FaSyncAlt,
  FaTools,
  FaUniversity,
} from "react-icons/fa";

const MAX_UPCOMING = 10;
const normalizeSearch = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase()
    .trim();

const toMinutes = (time) => {
  const [hours, minutes] = String(time || "00:00")
    .slice(0, 5)
    .split(":")
    .map(Number);
  return (hours || 0) * 60 + (minutes || 0);
};

const durationInHours = (reservation) =>
  Math.max(0, (toMinutes(reservation.end) - toMinutes(reservation.start)) / 60);

const formatTime = (value) => {
  const [hoursText, minutes = "00"] = String(value || "")
    .slice(0, 5)
    .split(":");
  const hour = Number.parseInt(hoursText, 10);
  if (!Number.isFinite(hour)) return value;
  const suffix = hour < 12 ? "AM" : "PM";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}:${minutes} ${suffix}`;
};

const formatDate = (value) => {
  const [year, month, day] = String(value).split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("es", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
};

const formatLongDate = (date) => {
  const text = date.toLocaleDateString("es", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return text.charAt(0).toUpperCase() + text.slice(1);
};

const escapeXml = (value) =>
  String(value ?? "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const createWorksheet = (name, rows) => `
  <Worksheet ss:Name="${escapeXml(name)}">
    <Table>
      ${rows
        .map(
          (row, rowIndex) => `
            <Row>
              ${row
                .map((value) => {
                  const isNumber =
                    typeof value === "number" && Number.isFinite(value);
                  return `<Cell${rowIndex === 0 ? ' ss:StyleID="Header"' : ""}><Data ss:Type="${isNumber ? "Number" : "String"}">${escapeXml(value)}</Data></Cell>`;
                })
                .join("")}
            </Row>
          `,
        )
        .join("")}
    </Table>
  </Worksheet>
`;

const todayKey = (() => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
})();

function KpiCard({ icon: Icon, label, value, detail, tone }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div
        className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}
      >
        <Icon />
      </div>
      <p className="text-2xl font-bold leading-none text-slate-900">{value}</p>
      <p className="mt-1 text-sm font-semibold text-slate-700">{label}</p>
      <p className="mt-0.5 text-xs text-slate-500">{detail}</p>
    </div>
  );
}

function Bar({ value, max, tone = "bg-sky-500" }) {
  const width =
    value > 0 && max > 0 ? Math.max(3, Math.round((value / max) * 100)) : 0;
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
      <div
        className={`h-full rounded-full ${tone}`}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

function ReservationEditForm({
  reservation,
  form,
  setForm,
  spaces,
  equipment,
  loading,
  onSave,
  onCancel,
}) {
  const isSpace = reservation.kind === "space";
  const selectedEquipment = equipment.find(
    (item) => item.id === form.resourceId,
  );
  const canSave =
    form.date &&
    form.resourceId &&
    form.start >= "07:00" &&
    form.start <= "20:00" &&
    form.end >= "08:00" &&
    form.end <= "21:00" &&
    form.start < form.end &&
    (isSpace ? form.reason.trim() : true) &&
    (isSpace || selectedEquipment?.type !== "Gafas" || form.usability.trim());

  return (
    <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
      <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {isSpace ? "Salón" : "Equipo"}
        <select
          required
          value={form.resourceId}
          onChange={(event) =>
            setForm((previous) => ({
              ...previous,
              resourceId: event.target.value,
            }))
          }
          className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal normal-case text-slate-800"
        >
          {(isSpace ? spaces : equipment).map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
              {!isSpace && item.spaceNumber
                ? ` · Salón ${item.spaceNumber}`
                : ""}
            </option>
          ))}
        </select>
      </label>
      <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        Fecha
        <input
          type="date"
          required
          min={todayKey}
          value={form.date}
          onChange={(event) =>
            setForm((previous) => ({ ...previous, date: event.target.value }))
          }
          className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-800"
        />
      </label>
      <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        Inicio
        <input
          type="time"
          required
          min="07:00"
          max="20:00"
          value={form.start}
          onChange={(event) =>
            setForm((previous) => ({ ...previous, start: event.target.value }))
          }
          className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-800"
        />
      </label>
      <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        Fin
        <input
          type="time"
          required
          min="08:00"
          max="21:00"
          value={form.end}
          onChange={(event) =>
            setForm((previous) => ({ ...previous, end: event.target.value }))
          }
          className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-800"
        />
      </label>
      {isSpace ? (
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Escuela o motivo
          <input
            required
            maxLength={160}
            value={form.reason}
            onChange={(event) =>
              setForm((previous) => ({
                ...previous,
                reason: event.target.value,
              }))
            }
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal normal-case text-slate-800"
          />
        </label>
      ) : selectedEquipment?.type === "Gafas" ? (
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Uso de las gafas
          <input
            maxLength={500}
            required
            value={form.usability}
            onChange={(event) =>
              setForm((previous) => ({
                ...previous,
                usability: event.target.value,
              }))
            }
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal normal-case text-slate-800"
          />
        </label>
      ) : null}
      <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-3">
        <button
          type="button"
          disabled={loading || !canSave}
          onClick={onSave}
          className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Guardar cambios
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={onCancel}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white disabled:opacity-50"
        >
          Cancelar edición
        </button>
      </div>
    </div>
  );
}

export default function AdminDashboard({
  role = "admin",
  activeSection = "dashboard-summary",
  reservations = [],
  spaces = [],
  equipment = [],
  loading,
  realtimeStatus,
  lastUpdatedAt,
  onRefresh,
  onAssignSpace,
  onAssignEquipment,
  onUpdateReservation,
  onCancelReservation,
}) {
  const [assignment, setAssignment] = useState({
    professorEmail: "",
    spaceId: String(spaces[0]?.id ?? ""),
    date: todayKey,
    start: "07:00",
    end: "09:00",
    reason: "",
  });
  const [equipmentAssignment, setEquipmentAssignment] = useState({
    professorEmail: "",
    equipmentId: String(equipment[0]?.id ?? ""),
    date: todayKey,
    start: "07:00",
    end: "09:00",
    usability: "",
  });
  const [editingReservationId, setEditingReservationId] = useState(null);
  const [reservationEditForm, setReservationEditForm] = useState(null);
  const [reservationSearch, setReservationSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showCancelled, setShowCancelled] = useState(true);
  const [cancelledPage, setCancelledPage] = useState(1);
  const CANCELLED_PER_PAGE = 10;
  const filteredReservations = useMemo(() => {
    const query = normalizeSearch(reservationSearch);
    return reservations.filter((reservation) => {
      const owner = normalizeSearch(
        `${reservation.professorName || ""} ${reservation.professorEmail || ""}`,
      );
      return (
        (!query || owner.includes(query)) &&
        (!dateFrom || reservation.date >= dateFrom) &&
        (!dateTo || reservation.date <= dateTo)
      );
    });
  }, [reservations, reservationSearch, dateFrom, dateTo]);

  const stats = useMemo(() => {
    const monthPrefix = todayKey.slice(0, 7);
    const activeReservations = filteredReservations.filter(
      (reservation) =>
        !reservation.status || reservation.status === "confirmed",
    );
    const cancelledSpaceReservations = filteredReservations
      .filter(
        (reservation) =>
          reservation.kind === "space" &&
          ["cancelled", "canceled"].includes(
            String(reservation.status || "").toLowerCase(),
          ),
      )
      .sort(
        (first, second) =>
          second.date.localeCompare(first.date) ||
          second.start.localeCompare(first.start),
      );
    const spaceReservationsForManagement = activeReservations
      .filter(
        (reservation) =>
          reservation.kind === "space" && reservation.date >= todayKey,
      )
      .sort(
        (first, second) =>
          first.date.localeCompare(second.date) ||
          first.start.localeCompare(second.start),
      );
    const monthReservations = activeReservations.filter((reservation) =>
      reservation.date?.startsWith(monthPrefix),
    );
    const spaceReservations = monthReservations.filter(
      (reservation) => reservation.kind === "space",
    );
    const equipmentReservations = monthReservations.filter(
      (reservation) => reservation.kind === "equipment",
    );

    const resolveName = (reservation) => {
      if (reservation.kind === "space") {
        return (
          spaces.find(
            (space) => Number(space.id) === Number(reservation.resourceId),
          )?.name || `Salón ${reservation.resourceId}`
        );
      }
      const equipmentItem = equipment.find(
        (item) => item.id === reservation.resourceId,
      );
      return equipmentItem
        ? `${equipmentItem.name} · Salón ${equipmentItem.spaceNumber}`
        : `Equipo ${reservation.resourceId}`;
    };

    const equipmentReservationsForManagement = activeReservations
      .filter(
        (reservation) =>
          reservation.kind === "equipment" && reservation.date >= todayKey,
      )
      .sort(
        (first, second) =>
          first.date.localeCompare(second.date) ||
          first.start.localeCompare(second.start),
      )
      .map((reservation) => ({
        ...reservation,
        resourceName: resolveName(reservation),
      }));

    const spaceUsage = spaces
      .map((space) => {
        const items = spaceReservations.filter(
          (reservation) => Number(reservation.resourceId) === Number(space.id),
        );
        const hours = items.reduce(
          (total, reservation) => total + durationInHours(reservation),
          0,
        );
        return { space, count: items.length, hours };
      })
      .sort(
        (first, second) =>
          second.count - first.count || second.hours - first.hours,
      );

    const equipmentUsage = equipment
      .map((item) => {
        const items = equipmentReservations.filter(
          (reservation) => reservation.resourceId === item.id,
        );
        return { equipment: item, count: items.length };
      })
      .sort((first, second) => second.count - first.count);

    const schoolMap = new Map();
    spaceReservations.forEach((reservation) => {
      const label =
        (reservation.reason || "").trim() || "Sin escuela especificada";
      const current = schoolMap.get(label) || { label, count: 0, hours: 0 };
      current.count += 1;
      current.hours += durationInHours(reservation);
      schoolMap.set(label, current);
    });
    const schoolStats = [...schoolMap.values()].sort(
      (first, second) => second.count - first.count,
    );

    const professorMap = new Map();
    monthReservations.forEach((reservation) => {
      const key = reservation.professorEmail || reservation.professorName;
      if (!key) return;
      const label = reservation.professorName || reservation.professorEmail;
      const current = professorMap.get(key) || { label, count: 0, hours: 0 };
      current.count += 1;
      current.hours += durationInHours(reservation);
      professorMap.set(key, current);
    });
    const professorStats = [...professorMap.values()].sort(
      (first, second) => second.count - first.count,
    );

    const occupiedSpaceHours = spaceReservations.reduce(
      (total, reservation) => total + durationInHours(reservation),
      0,
    );

    const upcomingReservations = activeReservations
      .filter((reservation) => reservation.date >= todayKey)
      .sort(
        (first, second) =>
          first.date.localeCompare(second.date) ||
          first.start.localeCompare(second.start),
      )
      .map((reservation) => ({
        ...reservation,
        resourceName: resolveName(reservation),
      }));
    const upcomingSpaceReservations = upcomingReservations
      .filter((reservation) => reservation.kind === "space")
      .slice(0, MAX_UPCOMING);
    const upcomingEquipmentReservations = upcomingReservations
      .filter((reservation) => reservation.kind === "equipment")
      .slice(0, MAX_UPCOMING);

    return {
      monthReservations,
      activeReservations,
      cancelledSpaceReservations,
      spaceReservationsForManagement,
      equipmentReservationsForManagement,
      spaceReservations,
      equipmentReservations,
      spaceUsage,
      equipmentUsage,
      schoolStats,
      professorStats,
      occupiedSpaceHours,
      upcomingSpaceReservations,
      upcomingEquipmentReservations,
    };
  }, [filteredReservations, spaces, equipment]);

  const submitAssignment = async (event) => {
    event.preventDefault();
    const saved = await onAssignSpace(assignment);
    if (saved) {
      setAssignment((previous) => ({
        ...previous,
        professorEmail: "",
        reason: "",
      }));
    }
  };

  const submitEquipmentAssignment = async (event) => {
    event.preventDefault();
    const saved = await onAssignEquipment(equipmentAssignment);
    if (saved) {
      setEquipmentAssignment((previous) => ({
        ...previous,
        professorEmail: "",
        usability: "",
      }));
    }
  };

  const beginReservationEdit = (reservation) => {
    setEditingReservationId(`${reservation.kind}-${reservation.id}`);
    setReservationEditForm({
      resourceId: String(reservation.resourceId),
      date: reservation.date,
      start: reservation.start,
      end: reservation.end,
      reason: reservation.kind === "space" ? reservation.reason || "" : "",
      usability: reservation.usability || reservation.reason || "",
    });
  };

  const saveReservationEdit = async (reservation) => {
    if (!reservationEditForm) return;
    const saved = await onUpdateReservation(reservation, reservationEditForm);
    if (saved) {
      setEditingReservationId(null);
      setReservationEditForm(null);
    }
  };

  const cancelSpace = async (reservation) => {
    const resourceName =
      spaces.find(
        (space) => Number(space.id) === Number(reservation.resourceId),
      )?.name || `Salón ${reservation.resourceId}`;
    if (
      !window.confirm(
        `¿Cancelar la reserva de ${resourceName} del ${formatDate(reservation.date)}?`,
      )
    )
      return;
    await onCancelReservation(reservation);
  };

  const cancelEquipment = async (reservation) => {
    const equipmentName =
      equipment.find((item) => item.id === reservation.resourceId)?.name ||
      `equipo ${reservation.resourceId}`;
    if (
      !window.confirm(
        `¿Cancelar el préstamo de ${equipmentName} del ${formatDate(reservation.date)}?`,
      )
    )
      return;
    await onCancelReservation(reservation);
  };

  const maxSchool = Math.max(1, ...stats.schoolStats.map((item) => item.count));
  const maxSpace = Math.max(1, ...stats.spaceUsage.map((item) => item.count));
  const maxEquipment = Math.max(
    1,
    ...stats.equipmentUsage.map((item) => item.count),
  );
  const maxProfessor = Math.max(
    1,
    ...stats.professorStats.map((item) => item.count),
  );
  const spacesInUse = stats.spaceUsage.filter((item) => item.count > 0).length;
  const exportStatistics = () => {
    const workbook = `<?xml version="1.0" encoding="UTF-8"?>
      <?mso-application progid="Excel.Sheet"?>
      <Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
        xmlns:o="urn:schemas-microsoft-com:office:office"
        xmlns:x="urn:schemas-microsoft-com:office:excel"
        xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
        <Styles>
          <Style ss:ID="Header">
            <Font ss:Bold="1" ss:Color="#FFFFFF"/>
            <Interior ss:Color="#0284C7" ss:Pattern="Solid"/>
          </Style>
        </Styles>
        ${createWorksheet("Resumen", [
          ["Indicador", "Valor"],
          ["Fecha de exportación", new Date().toLocaleString("es")],
          [
            "Mes de las estadísticas",
            new Date().toLocaleDateString("es", {
              month: "long",
              year: "numeric",
            }),
          ],
          ["Reservas activas", stats.activeReservations.length],
          ["Reservas del mes", stats.monthReservations.length],
          ["Reservas de salones del mes", stats.spaceReservations.length],
          ["Préstamos de equipos del mes", stats.equipmentReservations.length],
          ["Horas de salón reservadas", stats.occupiedSpaceHours],
          ["Salones con reservas", spacesInUse],
          [
            "Equipos con préstamos",
            stats.equipmentUsage.filter((item) => item.count > 0).length,
          ],
          ["Docentes con reservas", stats.professorStats.length],
          ["Búsqueda aplicada", reservationSearch || "Ninguna"],
          ["Fecha desde", dateFrom || "Sin límite"],
          ["Fecha hasta", dateTo || "Sin límite"],
        ])}
        ${createWorksheet("Salones", [
          ["Salón", "Reservas del mes", "Horas reservadas"],
          ...stats.spaceUsage.map(({ space, count, hours }) => [
            space.name,
            count,
            hours,
          ]),
        ])}
        ${createWorksheet("Equipos", [
          ["Equipo", "Salón", "Préstamos del mes"],
          ...stats.equipmentUsage.map(({ equipment: item, count }) => [
            item.name,
            item.spaceNumber ?? "—",
            count,
          ]),
        ])}
        ${createWorksheet("Escuelas y motivos", [
          ["Escuela o motivo", "Reservas del mes", "Horas reservadas"],
          ...stats.schoolStats.map(({ label, count, hours }) => [
            label,
            count,
            hours,
          ]),
        ])}
        ${createWorksheet("Docentes", [
          ["Docente", "Reservas del mes", "Horas reservadas"],
          ...stats.professorStats.map(({ label, count, hours }) => [
            label,
            count,
            hours,
          ]),
        ])}
      </Workbook>`;
    const blob = new Blob([`\uFEFF${workbook}`], {
      type: "application/vnd.ms-excel;charset=utf-8",
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `estadisticas-${todayKey}.xls`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);
  };
  const sectionTitles = {
    "dashboard-summary": "Resumen de actividad",
    "dashboard-assign": "Asignar salón",
    "dashboard-assign-equipment": "Asignar equipo",
    "dashboard-reservations": "Reservas por gestionar",
    "dashboard-equipment-reservations": "Préstamos de equipos",
    "dashboard-cancelled": "Cancelaciones",
    "dashboard-analytics": "Estadísticas",
    "dashboard-upcoming": "Próximas reservas",
  };

  return (
    <section className="admin-dashboard space-y-6">
      <div className="relative overflow-hidden rounded-3xl border border-sky-100 bg-gradient-to-br from-white via-white to-sky-50 p-5 shadow-xl shadow-slate-900/5 sm:p-7">
        <div className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-sky-100/70 blur-3xl" />
        <div>
          <div className="relative flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-700">
                {role === "support"
                  ? "Panel de soporte"
                  : "Panel administrativo"}
              </p>
              <h2 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
                {sectionTitles[activeSection] || "Resumen de actividad"}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {formatLongDate(new Date())}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-sky-100 bg-white/80 px-4 py-2 text-sm font-semibold text-sky-800 shadow-sm">
                {stats.activeReservations.length}{" "}
                {stats.activeReservations.length === 1
                  ? "reserva activa"
                  : "reservas activas"}
              </span>
              <span
                className={`rounded-full border px-3 py-2 text-xs font-semibold ${
                  realtimeStatus === "connected"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-amber-200 bg-amber-50 text-amber-700"
                }`}
              >
                {realtimeStatus === "connected"
                  ? "En vivo"
                  : "Sin conexión en vivo · respaldo cada 15 s"}
              </span>
              <button
                type="button"
                onClick={onRefresh}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-sky-200 hover:bg-sky-50 active:scale-95"
              >
                <FaSyncAlt className={loading ? "animate-spin" : ""} />
                Actualizar
              </button>
              {activeSection === "dashboard-analytics" && (
                <button
                  type="button"
                  onClick={exportStatistics}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-95"
                >
                  <FaFileExcel />
                  Exportar Excel
                </button>
              )}
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-400" aria-live="polite">
            {lastUpdatedAt
              ? `Última actualización: ${new Date(lastUpdatedAt).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`
              : "Esperando la primera sincronización…"}
          </p>
        </div>
      </div>

      <section
        hidden={["dashboard-assign", "dashboard-assign-equipment"].includes(
          activeSection,
        )}
        className="grid gap-3 border-b border-slate-200 pb-5 sm:grid-cols-2 lg:grid-cols-[minmax(220px,1fr)_170px_170px_auto] lg:items-end"
        aria-label="Filtros de datos"
      >
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Nombre o correo
          <input
            type="search"
            value={reservationSearch}
            onChange={(event) => setReservationSearch(event.target.value)}
            placeholder="Buscar docente"
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal normal-case text-slate-800 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
          />
        </label>
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Desde
          <input
            type="date"
            value={dateFrom}
            max={dateTo || undefined}
            onChange={(event) => setDateFrom(event.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-800 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
          />
        </label>
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Hasta
          <input
            type="date"
            value={dateTo}
            min={dateFrom || undefined}
            onChange={(event) => setDateTo(event.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-800 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
          />
        </label>
        <div className="flex items-center justify-between gap-3 lg:justify-end">
          <p className="text-xs text-slate-500" aria-live="polite">
            {filteredReservations.length} de {reservations.length} registros
          </p>
          <button
            type="button"
            onClick={() => {
              setReservationSearch("");
              setDateFrom("");
              setDateTo("");
            }}
            disabled={!reservationSearch && !dateFrom && !dateTo}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Limpiar
          </button>
        </div>
      </section>

      <div className="admin-dashboard-content">
        <section
          hidden={activeSection !== "dashboard-assign"}
          className="admin-dashboard-management admin-dashboard-assignment rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
        >
          <div className="mb-4">
            <h3 className="text-lg font-bold text-slate-900">
              Asignar salón a un docente
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              La asignación queda registrada como una reserva del docente.
            </p>
          </div>
          <form
            onSubmit={submitAssignment}
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
          >
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Correo del docente
              <input
                type="email"
                required
                value={assignment.professorEmail}
                onChange={(event) =>
                  setAssignment({
                    ...assignment,
                    professorEmail: event.target.value,
                  })
                }
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-normal normal-case text-slate-800"
                placeholder="docente@universidad.edu"
              />
            </label>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Salón
              <select
                required
                value={assignment.spaceId}
                onChange={(event) =>
                  setAssignment({ ...assignment, spaceId: event.target.value })
                }
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-normal normal-case text-slate-800"
              >
                {spaces.map((space) => (
                  <option key={space.id} value={space.id}>
                    {space.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Fecha
              <input
                type="date"
                required
                min={todayKey}
                value={assignment.date}
                onChange={(event) =>
                  setAssignment({ ...assignment, date: event.target.value })
                }
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-normal normal-case text-slate-800"
              />
            </label>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Hora de inicio
              <input
                type="time"
                required
                min="07:00"
                max="20:00"
                value={assignment.start}
                onChange={(event) =>
                  setAssignment({ ...assignment, start: event.target.value })
                }
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-normal normal-case text-slate-800"
              />
            </label>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Hora de fin
              <input
                type="time"
                required
                min="08:00"
                max="21:00"
                value={assignment.end}
                onChange={(event) =>
                  setAssignment({ ...assignment, end: event.target.value })
                }
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-normal normal-case text-slate-800"
              />
            </label>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 sm:col-span-2 lg:col-span-1">
              Escuela o motivo
              <input
                type="text"
                required
                value={assignment.reason}
                onChange={(event) =>
                  setAssignment({ ...assignment, reason: event.target.value })
                }
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-normal normal-case text-slate-800"
                placeholder="Motivo de la reserva"
              />
            </label>
            <div className="sm:col-span-2 lg:col-span-3">
              <button
                type="submit"
                disabled={loading || spaces.length === 0}
                className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FaPlus />
                Asignar salón
              </button>
            </div>
          </form>
        </section>

        <section
          hidden={activeSection !== "dashboard-assign-equipment"}
          className="admin-dashboard-management rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
        >
          <div className="mb-4">
            <h3 className="text-lg font-bold text-slate-900">
              Asignar equipo a un docente
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Registra un préstamo para el docente; la disponibilidad del
              equipo se valida al guardar.
            </p>
          </div>
          <form
            onSubmit={submitEquipmentAssignment}
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
          >
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Correo del docente
              <input
                type="email"
                required
                value={equipmentAssignment.professorEmail}
                onChange={(event) =>
                  setEquipmentAssignment({
                    ...equipmentAssignment,
                    professorEmail: event.target.value,
                  })
                }
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-normal normal-case text-slate-800"
                placeholder="docente@universidad.edu"
              />
            </label>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Equipo
              <select
                required
                value={equipmentAssignment.equipmentId}
                onChange={(event) =>
                  setEquipmentAssignment({
                    ...equipmentAssignment,
                    equipmentId: event.target.value,
                  })
                }
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-normal normal-case text-slate-800"
              >
                {equipment.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                    {item.spaceNumber ? ` · Salón ${item.spaceNumber}` : ""}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Fecha
              <input
                type="date"
                required
                min={todayKey}
                value={equipmentAssignment.date}
                onChange={(event) =>
                  setEquipmentAssignment({
                    ...equipmentAssignment,
                    date: event.target.value,
                  })
                }
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-normal normal-case text-slate-800"
              />
            </label>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Hora de inicio
              <input
                type="time"
                required
                min="07:00"
                max="20:00"
                value={equipmentAssignment.start}
                onChange={(event) =>
                  setEquipmentAssignment({
                    ...equipmentAssignment,
                    start: event.target.value,
                  })
                }
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-normal normal-case text-slate-800"
              />
            </label>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Hora de fin
              <input
                type="time"
                required
                min="08:00"
                max="21:00"
                value={equipmentAssignment.end}
                onChange={(event) =>
                  setEquipmentAssignment({
                    ...equipmentAssignment,
                    end: event.target.value,
                  })
                }
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-normal normal-case text-slate-800"
              />
            </label>
            {equipment.find(
              (item) => item.id === equipmentAssignment.equipmentId,
            )?.type === "Gafas" && (
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 sm:col-span-2 lg:col-span-1">
                Uso de las gafas
                <input
                  type="text"
                  required
                  maxLength={500}
                  value={equipmentAssignment.usability}
                  onChange={(event) =>
                    setEquipmentAssignment({
                      ...equipmentAssignment,
                      usability: event.target.value,
                    })
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-normal normal-case text-slate-800"
                  placeholder="Propósito del préstamo"
                />
              </label>
            )}
            <div className="sm:col-span-2 lg:col-span-3">
              <button
                type="submit"
                disabled={loading || equipment.length === 0}
                className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FaPlus />
                Asignar equipo
              </button>
            </div>
          </form>
        </section>

        <section
          hidden={activeSection !== "dashboard-reservations"}
          className="admin-dashboard-management admin-dashboard-reservations overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
        >
          <div className="border-b border-slate-100 px-5 py-4">
            <h3 className="text-lg font-bold text-slate-900">
              Reservas de salones por gestionar
            </h3>
            <p className="text-sm text-slate-500">
              Edita o cancela las reservas futuras de los docentes.
            </p>
          </div>
          {loading ? (
            <p className="px-5 py-6 text-sm text-slate-500">
              Cargando reservas…
            </p>
          ) : stats.spaceReservationsForManagement.length === 0 ? (
            <p className="px-5 py-6 text-sm text-slate-500">
              No hay reservas futuras de salones.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Fecha</th>
                    <th className="px-5 py-3 font-semibold">Horario</th>
                    <th className="px-5 py-3 font-semibold">Salón</th>
                    <th className="px-5 py-3 font-semibold">Docente</th>
                    <th className="px-5 py-3 font-semibold">Motivo</th>
                    <th className="px-5 py-3 font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stats.spaceReservationsForManagement.map((reservation) => {
                    const editKey = `${reservation.kind}-${reservation.id}`;
                    const editing =
                      editingReservationId === editKey && reservationEditForm;
                    return (
                      <Fragment key={editKey}>
                        <tr>
                          <td className="whitespace-nowrap px-5 py-3 capitalize text-slate-700">
                            {formatDate(reservation.date)}
                          </td>
                          <td className="whitespace-nowrap px-5 py-3 text-slate-600">
                            {formatTime(reservation.start)} –{" "}
                            {formatTime(reservation.end)}
                          </td>
                          <td className="px-5 py-3 font-semibold text-slate-800">
                            {spaces.find(
                              (space) =>
                                Number(space.id) ===
                                Number(reservation.resourceId),
                            )?.name || `Salón ${reservation.resourceId}`}
                          </td>
                          <td className="whitespace-nowrap px-5 py-3 text-slate-600">
                            {reservation.professorName ||
                              reservation.professorEmail ||
                              "Docente no identificado"}
                          </td>
                          <td className="px-5 py-3 text-slate-600">
                            {reservation.reason || "—"}
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                disabled={loading}
                                onClick={() => {
                                  if (editing) {
                                    setEditingReservationId(null);
                                    setReservationEditForm(null);
                                  } else {
                                    beginReservationEdit(reservation);
                                  }
                                }}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-sky-200 px-3 py-1.5 text-xs font-semibold text-sky-700 transition hover:bg-sky-50 disabled:opacity-50"
                              >
                                <FaEdit aria-hidden="true" />
                                {editing ? "Cerrar" : "Editar"}
                              </button>
                              <button
                                type="button"
                                disabled={loading}
                                onClick={() => cancelSpace(reservation)}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:opacity-50"
                              >
                                <FaBan aria-hidden="true" />
                                Cancelar
                              </button>
                            </div>
                          </td>
                        </tr>
                        {editing && (
                          <tr className="bg-sky-50/60">
                            <td colSpan={6} className="p-0">
                              <ReservationEditForm
                                reservation={reservation}
                                form={reservationEditForm}
                                setForm={setReservationEditForm}
                                spaces={spaces}
                                equipment={equipment}
                                loading={loading}
                                onSave={() => saveReservationEdit(reservation)}
                                onCancel={() => {
                                  setEditingReservationId(null);
                                  setReservationEditForm(null);
                                }}
                              />
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section
          hidden={activeSection !== "dashboard-equipment-reservations"}
          className="admin-dashboard-management overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
        >
          <div className="border-b border-slate-100 px-5 py-4">
            <h3 className="text-lg font-bold text-slate-900">
              Préstamos de equipos por gestionar
            </h3>
            <p className="text-sm text-slate-500">
              Edita o cancela los préstamos próximos de los docentes.
            </p>
          </div>
          {loading ? (
            <p className="px-5 py-6 text-sm text-slate-500">
              Cargando préstamos…
            </p>
          ) : stats.equipmentReservationsForManagement.length === 0 ? (
            <p className="px-5 py-6 text-sm text-slate-500">
              No hay préstamos futuros de equipos para estos filtros.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Fecha</th>
                    <th className="px-5 py-3 font-semibold">Horario</th>
                    <th className="px-5 py-3 font-semibold">Equipo</th>
                    <th className="px-5 py-3 font-semibold">Docente</th>
                    <th className="px-5 py-3 font-semibold">Uso</th>
                    <th className="px-5 py-3 font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stats.equipmentReservationsForManagement.map(
                    (reservation) => {
                      const editKey = `${reservation.kind}-${reservation.id}`;
                      const editing =
                        editingReservationId === editKey &&
                        reservationEditForm;
                      return (
                        <Fragment key={editKey}>
                          <tr>
                            <td className="whitespace-nowrap px-5 py-3 capitalize text-slate-700">
                              {formatDate(reservation.date)}
                            </td>
                            <td className="whitespace-nowrap px-5 py-3 text-slate-600">
                              {formatTime(reservation.start)} –{" "}
                              {formatTime(reservation.end)}
                            </td>
                            <td className="px-5 py-3 font-semibold text-slate-800">
                              {reservation.resourceName}
                            </td>
                            <td className="whitespace-nowrap px-5 py-3 text-slate-600">
                              {reservation.professorName ||
                                reservation.professorEmail ||
                                "Docente no identificado"}
                            </td>
                            <td className="px-5 py-3 text-slate-600">
                              {reservation.reason || "—"}
                            </td>
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  disabled={loading}
                                  onClick={() => {
                                    if (editing) {
                                      setEditingReservationId(null);
                                      setReservationEditForm(null);
                                    } else {
                                      beginReservationEdit(reservation);
                                    }
                                  }}
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-sky-200 px-3 py-1.5 text-xs font-semibold text-sky-700 transition hover:bg-sky-50 disabled:opacity-50"
                                >
                                  <FaEdit aria-hidden="true" />
                                  {editing ? "Cerrar" : "Editar"}
                                </button>
                                <button
                                  type="button"
                                  disabled={loading}
                                  onClick={() => cancelEquipment(reservation)}
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:opacity-50"
                                >
                                  <FaBan aria-hidden="true" />
                                  Cancelar
                                </button>
                              </div>
                            </td>
                          </tr>
                          {editing && (
                            <tr className="bg-sky-50/60">
                              <td colSpan={6} className="p-0">
                                <ReservationEditForm
                                  reservation={reservation}
                                  form={reservationEditForm}
                                  setForm={setReservationEditForm}
                                  spaces={spaces}
                                  equipment={equipment}
                                  loading={loading}
                                  onSave={() =>
                                    saveReservationEdit(reservation)
                                  }
                                  onCancel={() => {
                                    setEditingReservationId(null);
                                    setReservationEditForm(null);
                                  }}
                                />
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    },
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section
          hidden={activeSection !== "dashboard-cancelled" || !showCancelled}
          className="admin-dashboard-management admin-dashboard-cancelled overflow-hidden rounded-3xl border border-amber-200 bg-white shadow-sm"
        >
          <div className="flex items-center justify-between border-b border-amber-100 px-5 py-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Salones cancelados
              </h3>
              <p className="text-sm text-slate-500">
                Historial de reservas de salón que fueron canceladas.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
                {stats.cancelledSpaceReservations.length}
              </span>
              <button
                type="button"
                onClick={() => {
                  setShowCancelled(false);
                }}
                className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-amber-50 hover:text-amber-700"
                title="Dejar de ver cancelaciones"
              >
                ✕
              </button>
            </div>
          </div>
          {stats.cancelledSpaceReservations.length === 0 ? (
            <p className="px-5 py-6 text-sm text-slate-500">
              No hay cancelaciones disponibles. Para consultar el historial,
              ejecuta la versión actualizada del script de Supabase.
            </p>
          ) : (
            <Fragment>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
                  <thead className="bg-amber-50/60 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-5 py-3 font-semibold">Fecha</th>
                      <th className="px-5 py-3 font-semibold">Horario</th>
                      <th className="px-5 py-3 font-semibold">Salón</th>
                      <th className="px-5 py-3 font-semibold">Docente</th>
                      <th className="px-5 py-3 font-semibold">Motivo</th>
                      <th className="px-5 py-3 font-semibold">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {stats.cancelledSpaceReservations
                      .slice(
                        (cancelledPage - 1) * CANCELLED_PER_PAGE,
                        cancelledPage * CANCELLED_PER_PAGE,
                      )
                      .map((reservation) => (
                        <tr key={reservation.id}>
                          <td className="whitespace-nowrap px-5 py-3 capitalize text-slate-700">
                            {formatDate(reservation.date)}
                          </td>
                          <td className="whitespace-nowrap px-5 py-3 text-slate-600">
                            {formatTime(reservation.start)} –{" "}
                            {formatTime(reservation.end)}
                          </td>
                          <td className="px-5 py-3 font-semibold text-slate-800">
                            {spaces.find(
                              (space) =>
                                Number(space.id) === Number(reservation.resourceId),
                            )?.name || `Salón ${reservation.resourceId}`}
                          </td>
                          <td className="whitespace-nowrap px-5 py-3 text-slate-600">
                            {reservation.professorName ||
                              reservation.professorEmail ||
                              "Docente no identificado"}
                          </td>
                          <td className="px-5 py-3 text-slate-600">
                            {reservation.reason || "—"}
                          </td>
                          <td className="px-5 py-3">
                            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
                              Cancelada
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              {stats.cancelledSpaceReservations.length > CANCELLED_PER_PAGE && (
                <div className="flex items-center justify-between border-t border-amber-100 px-5 py-3">
                  <p className="text-xs text-slate-500">
                    Mostrando{" "}
                    {(cancelledPage - 1) * CANCELLED_PER_PAGE + 1}–
                    {Math.min(cancelledPage * CANCELLED_PER_PAGE, stats.cancelledSpaceReservations.length)}{" "}
                    de {stats.cancelledSpaceReservations.length}
                  </p>
                  <nav className="flex items-center gap-1" aria-label="Paginación de cancelaciones">
                    <button
                      type="button"
                      disabled={cancelledPage === 1}
                      onClick={() => setCancelledPage((p) => Math.max(1, p - 1))}
                      className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      ‹ Anterior
                    </button>
                    {(() => {
                      const totalPages = Math.ceil(
                        stats.cancelledSpaceReservations.length / CANCELLED_PER_PAGE,
                      );
                      const pages = [];
                      const maxVisible = 5;
                      let start = Math.max(1, cancelledPage - Math.floor(maxVisible / 2));
                      let end = Math.min(totalPages, start + maxVisible - 1);
                      if (end - start + 1 < maxVisible) {
                        start = Math.max(1, end - maxVisible + 1);
                      }
                      for (let i = start; i <= end; i++) {
                        pages.push(i);
                      }
                      return pages.map((page) => (
                        <button
                          key={page}
                          type="button"
                          onClick={() => setCancelledPage(page)}
                          className={`min-w-[2rem] rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                            page === cancelledPage
                              ? "bg-amber-600 text-white"
                              : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          {page}
                        </button>
                      ));
                    })()}
                    <button
                      type="button"
                      disabled={cancelledPage === Math.ceil(stats.cancelledSpaceReservations.length / CANCELLED_PER_PAGE)}
                      onClick={() => setCancelledPage((p) => p + 1)}
                      className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Siguiente ›
                    </button>
                  </nav>
                </div>
              )}
            </Fragment>
          )}
        </section>

        <div
          hidden={activeSection !== "dashboard-summary"}
          className="admin-dashboard-kpis grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          <KpiCard
            icon={FaCalendarAlt}
            label="Reservas este mes"
            value={stats.monthReservations.length}
            detail={`${stats.spaceReservations.length} de salón · ${stats.equipmentReservations.length} de equipos`}
            tone="bg-sky-100 text-sky-700"
          />
          <KpiCard
            icon={FaClock}
            label="Horas de salón reservadas"
            value={`${stats.occupiedSpaceHours} h`}
            detail="Acumulado en el mes actual"
            tone="bg-violet-100 text-violet-700"
          />
          <KpiCard
            icon={FaTools}
            label="Equipos prestados"
            value={stats.equipmentReservations.length}
            detail={`${stats.equipmentUsage.filter((item) => item.count > 0).length} de ${equipment.length} equipos con movimiento`}
            tone="bg-amber-100 text-amber-700"
          />
          <KpiCard
            icon={FaChalkboardTeacher}
            label="Docentes activos"
            value={
              stats.professorStats.length > 0
                ? stats.professorStats.length
                : "—"
            }
            detail={`${spacesInUse} de ${spaces.length} salones con reservas`}
            tone="bg-emerald-100 text-emerald-700"
          />
        </div>

        {stats.activeReservations.length === 0 ? (
          <div
            hidden={
              ![
                "dashboard-summary",
                "dashboard-analytics",
                "dashboard-upcoming",
              ].includes(activeSection)
            }
            className="admin-dashboard-empty rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 p-10 text-center"
          >
            <FaUniversity className="mx-auto mb-3 text-3xl text-sky-500" />
            <p className="font-semibold text-slate-800">
              Todavía no hay reservas registradas
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Las estadísticas aparecerán cuando los docentes reserven salones o
              equipos.
            </p>
          </div>
        ) : (
          <>
            <div
              hidden={activeSection !== "dashboard-analytics"}
              className="admin-dashboard-analytics grid gap-6 lg:grid-cols-3"
            >
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      Reservas por escuela
                    </h3>
                    <p className="text-sm text-slate-500">
                      Distribución de los salones reservados según la escuela o
                      motivo.
                    </p>
                  </div>
                  <FaUniversity className="text-xl text-sky-600" />
                </div>
                {stats.schoolStats.length === 0 ? (
                  <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
                    Sin reservas de salón este mes.
                  </p>
                ) : (
                  <ul className="space-y-4">
                    {stats.schoolStats.slice(0, 6).map((item) => (
                      <li key={item.label}>
                        <div className="mb-1.5 flex items-baseline justify-between gap-3">
                          <span className="truncate text-sm font-semibold text-slate-700">
                            {item.label}
                          </span>
                          <span className="shrink-0 text-xs font-semibold text-slate-500">
                            {item.count}{" "}
                            {item.count === 1 ? "reserva" : "reservas"} ·{" "}
                            {item.hours} h
                          </span>
                        </div>
                        <Bar value={item.count} max={maxSchool} />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div
              hidden={activeSection !== "dashboard-analytics"}
              className="admin-dashboard-analytics grid gap-6 lg:grid-cols-3"
            >
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      Salones más usados
                    </h3>
                    <p className="text-sm text-slate-500">
                      Reservas y horas del mes
                    </p>
                  </div>
                  <FaUniversity className="text-xl text-sky-600" />
                </div>
                <ul className="space-y-4">
                  {stats.spaceUsage.map(({ space, count, hours }) => (
                    <li key={space.id} className="flex items-center gap-3">
                      <div className="h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
                        {space.img ? (
                          <img
                            src={space.img}
                            alt={space.name}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-slate-300">
                            <FaUniversity />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="truncate text-sm font-semibold text-slate-800">
                            {space.name}
                          </span>
                          <span className="shrink-0 text-xs font-semibold text-slate-500">
                            {count} · {hours} h
                          </span>
                        </div>
                        <div className="mt-1.5">
                          <Bar value={count} max={maxSpace} />
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      Equipos más prestados
                    </h3>
                    <p className="text-sm text-slate-500">Préstamos del mes</p>
                  </div>
                  <FaLaptop className="text-xl text-sky-600" />
                </div>
                <ul className="space-y-4">
                  {stats.equipmentUsage.map(({ equipment: item, count }) => (
                    <li key={item.id} className="flex items-center gap-3">
                      <div className="h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
                        {item.img ? (
                          <img
                            src={item.img}
                            alt={item.name}
                            className="h-full w-full object-contain"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-slate-300">
                            <FaTools />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="truncate text-sm font-semibold text-slate-800">
                            {item.name}
                          </span>
                          <span className="shrink-0 text-xs font-semibold text-slate-500">
                            {count} préstamo{count === 1 ? "" : "s"}
                          </span>
                        </div>
                        <div className="mt-1.5">
                          <Bar
                            value={count}
                            max={maxEquipment}
                            tone="bg-violet-500"
                          />
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      Docentes con más reservas
                    </h3>
                    <p className="text-sm text-slate-500">Actividad del mes</p>
                  </div>
                  <FaChalkboardTeacher className="text-xl text-sky-600" />
                </div>
                {stats.professorStats.length === 0 ? (
                  <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
                    Sin docentes identificados este mes.
                  </p>
                ) : (
                  <ul className="space-y-4">
                    {stats.professorStats.slice(0, 6).map((item) => (
                      <li key={item.label}>
                        <div className="mb-1.5 flex items-baseline justify-between gap-2">
                          <span className="truncate text-sm font-semibold text-slate-800">
                            {item.label}
                          </span>
                          <span className="shrink-0 text-xs font-semibold text-slate-500">
                            {item.count} · {item.hours} h
                          </span>
                        </div>
                        <Bar
                          value={item.count}
                          max={maxProfessor}
                          tone="bg-emerald-500"
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div
              hidden={activeSection !== "dashboard-upcoming"}
              className="admin-dashboard-upcoming overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
            >
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Reservas próximas
                  </h3>
                  <p className="text-sm text-slate-500">
                    Separadas por tipo de recurso.
                  </p>
                </div>
                <FaCalendarAlt className="text-xl text-sky-600" />
              </div>
              <div className="grid gap-5 p-5">
                {[
                  {
                    title: "Reservas de salones",
                    resourceLabel: "Salón",
                    reservations: stats.upcomingSpaceReservations,
                    emptyMessage: "No hay reservas próximas de salones.",
                    reasonLabel: "Escuela / motivo",
                    getReason: (reservation) => reservation.reason || "—",
                  },
                  {
                    title: "Reservas de equipos",
                    resourceLabel: "Equipo",
                    reservations: stats.upcomingEquipmentReservations,
                    emptyMessage: "No hay reservas próximas de equipos.",
                    reasonLabel: "Tipo",
                    getReason: () => "Préstamo de equipo",
                  },
                ].map(
                  ({
                    title,
                    resourceLabel,
                    reservations: upcoming,
                    emptyMessage,
                    reasonLabel,
                    getReason,
                  }) => (
                    <section
                      key={title}
                      className="overflow-hidden rounded-2xl border border-slate-200"
                    >
                      <div className="border-b border-slate-100 bg-slate-50/70 px-4 py-3">
                        <h4 className="font-semibold text-slate-800">
                          {title}
                        </h4>
                      </div>
                      {upcoming.length === 0 ? (
                        <p className="px-4 py-6 text-center text-sm text-slate-500">
                          {emptyMessage}
                        </p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
                            <thead className="text-xs uppercase tracking-wide text-slate-500">
                              <tr>
                                <th className="px-4 py-3 font-semibold">
                                  Fecha
                                </th>
                                <th className="px-4 py-3 font-semibold">
                                  Horario
                                </th>
                                <th className="px-4 py-3 font-semibold">
                                  {resourceLabel}
                                </th>
                                <th className="px-4 py-3 font-semibold">
                                  Docente
                                </th>
                                <th className="px-4 py-3 font-semibold">
                                  {reasonLabel}
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {upcoming.map((reservation) => (
                                <tr
                                  key={`${reservation.kind}-${reservation.id}`}
                                  className="hover:bg-slate-50/70"
                                >
                                  <td className="whitespace-nowrap px-4 py-3 font-medium capitalize text-slate-700">
                                    {formatDate(reservation.date)}
                                  </td>
                                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                                    {formatTime(reservation.start)} –{" "}
                                    {formatTime(reservation.end)}
                                  </td>
                                  <td className="px-4 py-3 font-semibold text-slate-800">
                                    {reservation.resourceName}
                                  </td>
                                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                                    {reservation.professorName ||
                                      reservation.professorEmail ||
                                      "Docente no identificado"}
                                  </td>
                                  <td className="px-4 py-3 text-slate-600">
                                    {getReason(reservation)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </section>
                  ),
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
