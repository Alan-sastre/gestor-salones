import ExcelJS from "exceljs";
import {
  CHART_COLORS,
  chartToBase64,
  renderBarChart,
  renderDonutChart,
  renderHorizontalBarChart,
  renderLineChart,
} from "./excelCharts";

const C = {
  ink: "FF0F172A",
  inkSoft: "FF334155",
  muted: "FF64748B",
  faint: "FF94A3B8",
  border: "FFE2E8F0",
  borderStrong: "FFCBD5E1",
  white: "FFFFFFFF",
  primary: "FF075985",
  primaryDark: "FF0C4A6E",
  accent: "FF0284C7",
  accentSoft: "FFE0F2FE",
  accentSofter: "FFF0F9FF",
  zebra: "FFF8FAFC",
  green: "FF047857",
  greenSoft: "FFECFDF5",
  amber: "FFB45309",
  amberSoft: "FFFFFBEB",
  rose: "FFBE123C",
  roseSoft: "FFFFF1F2",
  violet: "FF6D28D9",
  violetSoft: "FFF5F3FF",
  slateSoft: "FFF1F5F9",
};

const FONT_NAME = "Calibri";
const WEEKDAY_NAMES = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];
const MONTH_SHORT = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];
const HOUR_BANDS = [
  { label: "07:00 – 09:00", start: 7 },
  { label: "09:00 – 11:00", start: 9 },
  { label: "11:00 – 13:00", start: 11 },
  { label: "13:00 – 15:00", start: 13 },
  { label: "15:00 – 17:00", start: 15 },
  { label: "17:00 – 19:00", start: 17 },
  { label: "19:00 – 21:00", start: 19 },
];
const RESERVATION_COLUMNS = 14;

const pad = (value) => String(value).padStart(2, "0");

const normalizeSearch = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase()
    .trim();

const solid = (color) => ({ type: "pattern", pattern: "solid", fgColor: { argb: color } });

const thinBorder = (color = C.border) => ({
  bottom: { style: "thin", color: { argb: color } },
});

const allBorders = (color = C.border) => ({
  top: { style: "thin", color: { argb: color } },
  left: { style: "thin", color: { argb: color } },
  bottom: { style: "thin", color: { argb: color } },
  right: { style: "thin", color: { argb: color } },
});

const todayKey = () => {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};

const parseDateKey = (value) => {
  const [year, month, day] = String(value || "")
    .slice(0, 10)
    .split("-")
    .map(Number);
  if (!year || !month || !day) return null;
  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? null : date;
};

const addDays = (date, days) => {
  const copy = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  copy.setDate(copy.getDate() + days);
  return copy;
};

const toKey = (date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const diffDays = (start, end) =>
  Math.round(
    (new Date(end.getFullYear(), end.getMonth(), end.getDate()) -
      new Date(start.getFullYear(), start.getMonth(), start.getDate())) /
      86400000,
  );

const countBusinessDays = (start, end) => {
  let total = 0;
  const cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  while (cursor <= end) {
    const day = cursor.getDay();
    if (day !== 0 && day !== 6) total += 1;
    cursor.setDate(cursor.getDate() + 1);
  }
  return total;
};

const formatDate = (date) =>
  date ? `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}` : "—";

const formatDateKey = (key) => formatDate(parseDateKey(key));

const formatDateTime = (date) =>
  `${formatDate(date)} ${pad(date.getHours())}:${pad(date.getMinutes())}`;

const formatMonthKey = (key) => {
  const [year, month] = key.split("-").map(Number);
  return `${MONTH_SHORT[month - 1] || ""} ${year}`;
};

const asTime = (value) => {
  const match = String(value || "").match(/^(\d{1,2}):(\d{2})/);
  if (!match) return "00:00";
  return `${pad(Number(match[1]))}:${match[2]}`;
};

const toMinutes = (time) => {
  const [hours, minutes] = asTime(time).split(":").map(Number);
  return hours * 60 + minutes;
};

const hoursBetween = (start, end) =>
  Math.max(0, (toMinutes(end) - toMinutes(start)) / 60);

const round = (value, decimals = 1) => {
  const factor = 10 ** decimals;
  return Math.round((Number(value) || 0) * factor) / factor;
};

const normalizeName = (reservation) =>
  reservation.professorName || reservation.professorEmail || "Docente no identificado";

const columnLetter = (index) => {
  let letter = "";
  let cursor = index;
  while (cursor > 0) {
    const remainder = (cursor - 1) % 26;
    letter = String.fromCharCode(65 + remainder) + letter;
    cursor = Math.floor((cursor - 1) / 26);
  }
  return letter;
};

const setWidths = (sheet, widths) => {
  widths.forEach((width, index) => {
    sheet.getColumn(index + 1).width = width;
  });
};

function addTitleBlock(sheet, { title, subtitle, columns }) {
  sheet.mergeCells(1, 1, 1, columns);
  const titleCell = sheet.getCell(1, 1);
  titleCell.value = title;
  titleCell.font = { name: FONT_NAME, size: 19, bold: true, color: { argb: C.white } };
  titleCell.fill = solid(C.primaryDark);
  titleCell.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  sheet.getRow(1).height = 40;

  sheet.mergeCells(2, 1, 2, columns);
  const subtitleCell = sheet.getCell(2, 1);
  subtitleCell.value = subtitle;
  subtitleCell.font = { name: FONT_NAME, size: 10.5, color: { argb: C.primaryDark } };
  subtitleCell.fill = solid(C.accentSoft);
  subtitleCell.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  sheet.getRow(2).height = 24;

  sheet.getRow(3).height = 6;
}

function addSectionTitle(sheet, row, columns, title) {
  sheet.mergeCells(row, 1, row, columns);
  const cell = sheet.getCell(row, 1);
  cell.value = title;
  cell.font = { name: FONT_NAME, size: 11.5, bold: true, color: { argb: C.primaryDark } };
  cell.fill = solid(C.accentSoft);
  cell.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  cell.border = { bottom: { style: "medium", color: { argb: C.accent } } };
  sheet.getRow(row).height = 26;
}

function addNote(sheet, row, columns, text) {
  sheet.mergeCells(row, 1, row, columns);
  const cell = sheet.getCell(row, 1);
  cell.value = text;
  cell.font = { name: FONT_NAME, size: 9.5, italic: true, color: { argb: C.muted } };
  cell.alignment = { vertical: "middle", horizontal: "left", indent: 1, wrapText: true };
  sheet.getRow(row).height = 20;
}

function styleHeaderRow(sheet, row, headers, startColumn = 1) {
  headers.forEach((header, index) => {
    const cell = sheet.getCell(row, startColumn + index);
    cell.value = header;
    cell.font = { name: FONT_NAME, size: 10.5, bold: true, color: { argb: C.white } };
    cell.fill = solid(C.primary);
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    cell.border = allBorders(C.primaryDark);
  });
  sheet.getRow(row).height = 32;
}

function styleBodyCell(cell, { align = "left", numFmt, zebra = false, bold = false } = {}) {
  cell.font = {
    name: FONT_NAME,
    size: 10.5,
    bold,
    color: { argb: C.inkSoft },
  };
  cell.alignment = { vertical: "middle", horizontal: align, wrapText: false };
  cell.border = thinBorder();
  if (zebra) cell.fill = solid(C.zebra);
  if (numFmt) cell.numFmt = numFmt;
}

function writeTable(sheet, startRow, columns, rows, options = {}) {
  const {
    autofilter = true,
    freeze = true,
    freezeColumns = 0,
    zebra = true,
    rowHeight = 19,
    dataBar = null,
    emptyMessage = "Sin datos para los filtros seleccionados.",
  } = options;

  setWidths(
    sheet,
    columns.map((column) => column.width || 16),
  );
  styleHeaderRow(
    sheet,
    startRow,
    columns.map((column) => column.header),
  );

  if (!rows.length) {
    const messageRow = startRow + 1;
    sheet.mergeCells(messageRow, 1, messageRow, columns.length);
    const cell = sheet.getCell(messageRow, 1);
    cell.value = emptyMessage;
    cell.font = { name: FONT_NAME, size: 10.5, italic: true, color: { argb: C.muted } };
    cell.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
    cell.fill = solid(C.accentSofter);
    sheet.getRow(messageRow).height = 24;
    return { headerRow: startRow, firstDataRow: startRow + 1, lastDataRow: startRow + 1, nextRow: startRow + 2 };
  }

  rows.forEach((row, rowIndex) => {
    const excelRow = startRow + 1 + rowIndex;
    columns.forEach((column, columnIndex) => {
      const cell = sheet.getCell(excelRow, columnIndex + 1);
      const value = row[column.key];
      cell.value = value ?? null;
      styleBodyCell(cell, {
        align: column.align || (column.type === "number" ? "right" : "left"),
        numFmt: column.numFmt,
        zebra: zebra && rowIndex % 2 === 1,
        bold: column.bold,
      });
      if (column.key === "status" && row.statusKey) {
        const cancelled = row.statusKey === "cancelled";
        cell.font = {
          name: FONT_NAME,
          size: 10,
          bold: true,
          color: { argb: cancelled ? C.rose : C.green },
        };
        cell.fill = solid(cancelled ? C.roseSoft : C.greenSoft);
        cell.alignment = { vertical: "middle", horizontal: "center" };
      }
      if (column.wrap) {
        cell.alignment = { ...cell.alignment, wrapText: true };
      }
    });
    sheet.getRow(excelRow).height = rowHeight;
  });

  const firstDataRow = startRow + 1;
  const lastDataRow = startRow + rows.length;

  if (autofilter) {
    sheet.autoFilter = {
      from: { row: startRow, column: 1 },
      to: { row: lastDataRow, column: columns.length },
    };
  }

  if (freeze) {
    sheet.views = [
      {
        state: "frozen",
        xSplit: freezeColumns,
        ySplit: startRow,
        activeCell: sheet.getCell(firstDataRow, 1).address,
      },
    ];
  }

  if (dataBar) {
    const columnIndex = columns.findIndex((column) => column.key === dataBar.key) + 1;
    if (columnIndex > 0) {
      const letter = columnLetter(columnIndex);
      sheet.addConditionalFormatting({
        ref: `${letter}${firstDataRow}:${letter}${lastDataRow}`,
        rules: [
          {
            type: "dataBar",
            cfvo: [{ type: "num", value: 0 }, { type: "max" }],
            color: { argb: dataBar.color || C.accent },
            gradient: true,
            border: false,
          },
        ],
      });
    }
  }

  return { headerRow: startRow, firstDataRow, lastDataRow, nextRow: lastDataRow + 1 };
}

function writeTotalsRow(sheet, row, columns, valuesByKey, label = "TOTAL") {
  columns.forEach((column, index) => {
    const cell = sheet.getCell(row, index + 1);
    const value = index === 0 ? label : valuesByKey[column.key];
    cell.value = value ?? null;
    cell.font = { name: FONT_NAME, size: 10.5, bold: true, color: { argb: C.primaryDark } };
    cell.fill = solid(C.accentSoft);
    cell.alignment = {
      vertical: "middle",
      horizontal: index === 0 || typeof value === "string" ? "left" : "right",
      indent: index === 0 ? 1 : 0,
    };
    cell.border = {
      top: { style: "medium", color: { argb: C.accent } },
      bottom: { style: "thin", color: { argb: C.borderStrong } },
    };
    if (column.numFmt) cell.numFmt = column.numFmt;
  });
  sheet.getRow(row).height = 22;
}

function writeMiniTable(
  sheet,
  startRow,
  headers,
  rows,
  numericColumns = [],
  startColumn = 1,
) {
  styleHeaderRow(sheet, startRow, headers, startColumn);
  rows.forEach((row, rowIndex) => {
    const excelRow = startRow + 1 + rowIndex;
    row.forEach((value, columnIndex) => {
      const cell = sheet.getCell(excelRow, startColumn + columnIndex);
      cell.value = value ?? null;
      styleBodyCell(cell, {
        align: numericColumns.includes(columnIndex) ? "right" : "left",
        zebra: rowIndex % 2 === 1,
      });
    });
    sheet.getRow(excelRow).height = 19;
  });
  return startRow + rows.length + 1;
}

function writeKeyValueRow(sheet, row, label, value, detail) {
  const labelCell = sheet.getCell(row, 1);
  labelCell.value = label;
  labelCell.font = { name: FONT_NAME, size: 10, bold: true, color: { argb: C.muted } };
  labelCell.alignment = { vertical: "middle", horizontal: "left" };
  labelCell.border = thinBorder();

  const valueCell = sheet.getCell(row, 2);
  valueCell.value = value ?? "—";
  valueCell.font = { name: FONT_NAME, size: 10.5, bold: true, color: { argb: C.ink } };
  valueCell.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  valueCell.border = thinBorder();

  if (detail !== undefined) {
    sheet.mergeCells(row, 3, row, 6);
    const detailCell = sheet.getCell(row, 3);
    detailCell.value = detail;
    detailCell.font = { name: FONT_NAME, size: 10, color: { argb: C.muted } };
    detailCell.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
    detailCell.border = thinBorder();
  }
}

function normalizeReservation(reservation, spacesById, equipmentById) {
  const isSpace = reservation.kind === "space";
  const space = isSpace ? spacesById.get(Number(reservation.resourceId)) : null;
  const item = isSpace ? null : equipmentById.get(String(reservation.resourceId));
  const date = String(reservation.date || "").slice(0, 10);
  const parsed = parseDateKey(date);
  const start = asTime(reservation.start || reservation.a);
  const end = asTime(reservation.end || reservation.b);
  const statusKey = ["cancelled", "canceled"].includes(
    String(reservation.status || "").toLocaleLowerCase(),
  )
    ? "cancelled"
    : "confirmed";

  const resourceName = isSpace
    ? space?.name || `Salón ${reservation.resourceId}`
    : item?.name || `Equipo ${reservation.resourceId}`;
  const location = isSpace
    ? space?.name?.split(" - ")[0] || "—"
    : item?.spaceNumber
      ? `Salón ${item.spaceNumber}`
      : "—";

  return {
    id: reservation.id,
    kind: isSpace ? "space" : "equipment",
    kindLabel: isSpace ? "Salón" : "Equipo",
    resourceId: reservation.resourceId,
    resourceName,
    location,
    capacity: isSpace ? space?.capacidad ?? null : item?.total ?? null,
    date,
    dateValue: parsed,
    weekdayIndex: parsed ? (parsed.getDay() + 6) % 7 : 0,
    weekday: parsed ? WEEKDAY_NAMES[(parsed.getDay() + 6) % 7] : "—",
    start,
    end,
    hours: hoursBetween(start, end),
    professorName: (reservation.professorName || "").trim(),
    professorEmail: (reservation.professorEmail || "").trim(),
    professorLabel: normalizeName(reservation),
    reason: (reservation.reason || reservation.usability || "").trim(),
    usability: (reservation.usability || "").trim(),
    statusKey,
    status: statusKey === "cancelled" ? "Cancelada" : "Confirmada",
  };
}

function buildMonthlyHistory(allReservations, endKey) {
  const endDate = parseDateKey(endKey) || new Date();
  const months = [];
  for (let offset = 11; offset >= 0; offset -= 1) {
    const date = new Date(endDate.getFullYear(), endDate.getMonth() - offset, 1);
    months.push({
      key: `${date.getFullYear()}-${pad(date.getMonth() + 1)}`,
      label: `${MONTH_SHORT[date.getMonth()]} ${date.getFullYear()}`,
    });
  }

  const rows = months.map((month) => {
    const items = allReservations.filter((reservation) =>
      reservation.date.startsWith(month.key),
    );
    const active = items.filter((reservation) => reservation.statusKey !== "cancelled");
    const spaces = active.filter((reservation) => reservation.kind === "space");
    const equipment = active.filter((reservation) => reservation.kind === "equipment");
    return {
      month: month.label,
      key: month.key,
      total: active.length,
      spaces: spaces.length,
      equipment: equipment.length,
      cancelled: items.length - active.length,
      spaceHours: round(spaces.reduce((total, reservation) => total + reservation.hours, 0)),
      equipmentHours: round(equipment.reduce((total, reservation) => total + reservation.hours, 0)),
      professors: new Set(active.map((reservation) => reservation.professorEmail || reservation.professorLabel)).size,
    };
  });

  return rows.map((row, index) => {
    const previous = rows[index - 1]?.total ?? 0;
    const delta = row.total - previous;
    return {
      ...row,
      delta,
      deltaPercent: previous > 0 ? delta / previous : null,
    };
  });
}

function computeStats({ reservations, filtered, spaces, equipment, filters, role, userEmail }) {
  const spacesById = new Map(spaces.map((space) => [Number(space.id), space]));
  const equipmentById = new Map(equipment.map((item) => [String(item.id), item]));

  const all = reservations
    .map((reservation) => normalizeReservation(reservation, spacesById, equipmentById))
    .filter((reservation) => reservation.dateValue);
  const period = filtered
    .map((reservation) => normalizeReservation(reservation, spacesById, equipmentById))
    .filter((reservation) => reservation.dateValue);

  const sortedDates = period.map((reservation) => reservation.date).sort();
  const startKey = filters.dateFrom || sortedDates[0] || todayKey();
  const endKey = filters.dateTo || sortedDates[sortedDates.length - 1] || todayKey();
  const startDate = parseDateKey(startKey) || new Date();
  const endDate = parseDateKey(endKey) || new Date();
  const totalDays = Math.max(1, diffDays(startDate, endDate) + 1);
  const businessDays = Math.max(1, countBusinessDays(startDate, endDate));

  const active = period.filter((reservation) => reservation.statusKey !== "cancelled");
  const cancelled = period.filter((reservation) => reservation.statusKey === "cancelled");
  const spaceActive = active.filter((reservation) => reservation.kind === "space");
  const equipmentActive = active.filter((reservation) => reservation.kind === "equipment");
  const spaceCancelled = cancelled.filter((reservation) => reservation.kind === "space");
  const equipmentCancelled = cancelled.filter((reservation) => reservation.kind === "equipment");

  const totalSpaceHours = spaceActive.reduce((total, reservation) => total + reservation.hours, 0);
  const totalEquipmentHours = equipmentActive.reduce((total, reservation) => total + reservation.hours, 0);
  const totalActiveHours = totalSpaceHours + totalEquipmentHours;
  const reservationCapacity = 14 * businessDays;

  const spaceUsage = spaces
    .map((space) => {
      const items = spaceActive.filter(
        (reservation) => Number(reservation.resourceId) === Number(space.id),
      );
      const hours = items.reduce((total, reservation) => total + reservation.hours, 0);
      const reasonMap = new Map();
      items.forEach((reservation) => {
        const label = reservation.reason || "Sin escuela especificada";
        reasonMap.set(label, (reasonMap.get(label) || 0) + 1);
      });
      const topReason = [...reasonMap.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || "—";
      const last = items.map((reservation) => reservation.date).sort().pop();
      return {
        id: space.id,
        name: space.name,
        capacity: space.capacidad ?? null,
        count: items.length,
        hours: round(hours),
        average: items.length ? round(hours / items.length) : 0,
        occupancy: reservationCapacity > 0 ? hours / reservationCapacity : 0,
        share: totalSpaceHours > 0 ? hours / totalSpaceHours : 0,
        professors: new Set(items.map((reservation) => reservation.professorEmail || reservation.professorLabel)).size,
        topReason,
        cancelled: spaceCancelled.filter(
          (reservation) => Number(reservation.resourceId) === Number(space.id),
        ).length,
        lastDate: last ? formatDateKey(last) : "—",
      };
    })
    .sort((first, second) => second.count - first.count || second.hours - first.hours);

  const equipmentUsage = equipment
    .map((item) => {
      const items = equipmentActive.filter(
        (reservation) => String(reservation.resourceId) === String(item.id),
      );
      const hours = items.reduce((total, reservation) => total + reservation.hours, 0);
      const units = Math.max(1, Number(item.total) || 1);
      const last = items.map((reservation) => reservation.date).sort().pop();
      return {
        id: item.id,
        name: item.name,
        type: item.type || "—",
        location: item.spaceNumber ? `Salón ${item.spaceNumber}` : "—",
        units: item.total ?? 1,
        count: items.length,
        hours: round(hours),
        average: items.length ? round(hours / items.length) : 0,
        utilization: hours / (reservationCapacity * units),
        professors: new Set(items.map((reservation) => reservation.professorEmail || reservation.professorLabel)).size,
        cancelled: equipmentCancelled.filter(
          (reservation) => String(reservation.resourceId) === String(item.id),
        ).length,
        lastDate: last ? formatDateKey(last) : "—",
      };
    })
    .sort((first, second) => second.count - first.count || second.hours - first.hours);

  const professorMap = new Map();
  period.forEach((reservation) => {
    const key = reservation.professorEmail || reservation.professorLabel;
    const current = professorMap.get(key) || {
      name: reservation.professorName || "Docente no identificado",
      email: reservation.professorEmail,
      total: 0,
      spaces: 0,
      equipment: 0,
      hours: 0,
      cancelled: 0,
      first: reservation.date,
      last: reservation.date,
      resources: new Map(),
    };
    current.total += reservation.statusKey === "cancelled" ? 0 : 1;
    if (reservation.statusKey === "cancelled") current.cancelled += 1;
    if (reservation.statusKey !== "cancelled") {
      if (reservation.kind === "space") current.spaces += 1;
      else current.equipment += 1;
      current.hours += reservation.hours;
      current.resources.set(
        reservation.resourceName,
        (current.resources.get(reservation.resourceName) || 0) + 1,
      );
    }
    if (reservation.date < current.first) current.first = reservation.date;
    if (reservation.date > current.last) current.last = reservation.date;
    professorMap.set(key, current);
  });

  const professorStats = [...professorMap.values()]
    .map((professor) => ({
      ...professor,
      hours: round(professor.hours),
      average: professor.total ? round(professor.hours / professor.total) : 0,
      favorite:
        [...professor.resources.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || "—",
      first: formatDateKey(professor.first),
      last: formatDateKey(professor.last),
    }))
    .sort((first, second) => second.total - first.total || second.hours - first.hours);

  const schoolMap = new Map();
  spaceActive.forEach((reservation) => {
    const label = reservation.reason || "Sin escuela especificada";
    const current = schoolMap.get(label) || {
      label,
      count: 0,
      hours: 0,
      professors: new Set(),
      spaces: new Map(),
    };
    current.count += 1;
    current.hours += reservation.hours;
    current.professors.add(reservation.professorEmail || reservation.professorLabel);
    current.spaces.set(
      reservation.resourceName,
      (current.spaces.get(reservation.resourceName) || 0) + 1,
    );
    schoolMap.set(label, current);
  });

  const schoolStats = [...schoolMap.values()]
    .map((school) => ({
      label: school.label,
      count: school.count,
      hours: round(school.hours),
      share: spaceActive.length > 0 ? school.count / spaceActive.length : 0,
      professors: school.professors.size,
      topSpace: [...school.spaces.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || "—",
      average: school.count ? round(school.hours / school.count) : 0,
    }))
    .sort((first, second) => second.count - first.count || second.hours - first.hours);

  const weekdayStats = WEEKDAY_NAMES.map((label, index) => {
    const items = active.filter((reservation) => reservation.weekdayIndex === index);
    const hours = items.reduce((total, reservation) => total + reservation.hours, 0);
    return {
      label,
      count: items.length,
      hours: round(hours),
      share: active.length > 0 ? items.length / active.length : 0,
      hourShare: totalActiveHours > 0 ? hours / totalActiveHours : 0,
    };
  });

  const bandStats = HOUR_BANDS.map((band, index) => {
    const items = active.filter((reservation) => {
      const hour = Number(reservation.start.slice(0, 2));
      return Math.min(6, Math.max(0, Math.floor((hour - 7) / 2))) === index;
    });
    return {
      label: band.label,
      count: items.length,
      hours: round(items.reduce((total, reservation) => total + reservation.hours, 0)),
      spaces: items.filter((reservation) => reservation.kind === "space").length,
      equipment: items.filter((reservation) => reservation.kind === "equipment").length,
      share: active.length > 0 ? items.length / active.length : 0,
    };
  });

  const heatmap = WEEKDAY_NAMES.map((label, weekdayIndex) => {
    const cells = HOUR_BANDS.map((band, bandIndex) =>
      active.filter((reservation) => {
        const hour = Number(reservation.start.slice(0, 2));
        return (
          reservation.weekdayIndex === weekdayIndex &&
          Math.min(6, Math.max(0, Math.floor((hour - 7) / 2))) === bandIndex
        );
      }).length,
    );
    return { label, cells, total: cells.reduce((sum, value) => sum + value, 0) };
  });

  const startHourStats = Array.from({ length: 14 }, (_, index) => {
    const hour = 7 + index;
    const count = active.filter(
      (reservation) => Number(reservation.start.slice(0, 2)) === hour,
    ).length;
    return {
      hour: `${pad(hour)}:00`,
      count,
      share: active.length > 0 ? count / active.length : 0,
    };
  });

  const previousEnd = addDays(startDate, -1);
  const previousStart = addDays(previousEnd, -(totalDays - 1));
  const query = normalizeSearch(filters.search);
  const previousItems = all.filter((reservation) => {
    if (reservation.statusKey === "cancelled") return false;
    if (reservation.date < toKey(previousStart) || reservation.date > toKey(previousEnd)) return false;
    if (!query) return true;
    return normalizeSearch(`${reservation.professorName} ${reservation.professorEmail}`).includes(query);
  });

  const currentComparison = {
    total: active.length,
    hours: round(totalActiveHours),
    spaces: spaceActive.length,
    equipment: equipmentActive.length,
    professors: new Set(active.map((reservation) => reservation.professorEmail || reservation.professorLabel)).size,
  };
  const previousComparison = {
    total: previousItems.length,
    hours: round(previousItems.reduce((total, reservation) => total + reservation.hours, 0)),
    spaces: previousItems.filter((reservation) => reservation.kind === "space").length,
    equipment: previousItems.filter((reservation) => reservation.kind === "equipment").length,
    professors: new Set(
      previousItems.map((reservation) => reservation.professorEmail || reservation.professorLabel),
    ).size,
  };

  const monthlyHistory = buildMonthlyHistory(all, endKey);
  const spacesInUse = spaceUsage.filter((space) => space.count > 0).length;
  const equipmentInUse = equipmentUsage.filter((item) => item.count > 0).length;
  const cancellationRate = period.length > 0 ? cancelled.length / period.length : 0;
  const averageOccupancy =
    reservationCapacity * Math.max(1, spaces.length) > 0
      ? totalSpaceHours / (reservationCapacity * Math.max(1, spaces.length))
      : 0;

  const busiestWeekday = [...weekdayStats].sort((a, b) => b.count - a.count)[0];
  const busiestBand = [...bandStats].sort((a, b) => b.count - a.count)[0];
  const busiestStart = [...startHourStats].sort((a, b) => b.count - a.count)[0];
  const topSpace = spaceUsage[0];
  const topEquipment = equipmentUsage[0];
  const topProfessor = professorStats[0];
  const unusedSpaces = spaceUsage.filter((space) => space.count === 0);

  return {
    spaces,
    equipment,
    period,
    active,
    cancelled,
    spaceActive,
    equipmentActive,
    spaceCancelled,
    equipmentCancelled,
    startKey,
    endKey,
    startDate,
    endDate,
    totalDays,
    businessDays,
    totalSpaceHours: round(totalSpaceHours),
    totalEquipmentHours: round(totalEquipmentHours),
    totalActiveHours: round(totalActiveHours),
    reservationCapacity,
    spaceUsage,
    equipmentUsage,
    professorStats,
    schoolStats,
    weekdayStats,
    bandStats,
    heatmap,
    startHourStats,
    monthlyHistory,
    currentComparison,
    previousComparison,
    previousPeriod: {
      start: formatDate(previousStart),
      end: formatDate(previousEnd),
    },
    spacesInUse,
    equipmentInUse,
    cancellationRate,
    averageOccupancy,
    busiestWeekday,
    busiestBand,
    busiestStart,
    topSpace,
    topEquipment,
    topProfessor,
    unusedSpaces,
    periodLabel:
      filters.dateFrom || filters.dateTo
        ? `${formatDate(startDate)} — ${formatDate(endDate)}`
        : period.length > 0
          ? `Historial filtrado (${formatDate(startDate)} — ${formatDate(endDate)})`
          : "Sin reservas en el periodo",
    filters: {
      search: filters.search || "",
      dateFrom: filters.dateFrom || "",
      dateTo: filters.dateTo || "",
    },
    role: role === "support" ? "Soporte" : role === "admin" ? "Administrador" : role || "—",
    userEmail: userEmail || "—",
    generatedAt: new Date(),
    allCount: all.length,
  };
}

function buildSummarySheet(workbook, stats) {
  const sheet = workbook.addWorksheet("Resumen", {
    properties: { tabColor: { argb: C.primary } },
    views: [{ showGridLines: false }],
  });
  setWidths(sheet, [38, 20, 18, 16, 16, 22]);
  addTitleBlock(sheet, {
    title: "Informe de reservas · Gestor de Salones",
    subtitle: `Periodo analizado: ${stats.periodLabel} · Generado el ${formatDateTime(stats.generatedAt)}`,
    columns: 6,
  });

  addSectionTitle(sheet, 4, 6, "Contexto del informe");
  writeKeyValueRow(sheet, 5, "Periodo analizado", stats.periodLabel);
  writeKeyValueRow(sheet, 6, "Días del periodo", stats.totalDays);
  writeKeyValueRow(sheet, 7, "Días hábiles", stats.businessDays);
  writeKeyValueRow(sheet, 8, "Reservas en el periodo", `${stats.period.length} registros`);
  writeKeyValueRow(sheet, 9, "Registros históricos en la base", `${stats.allCount} registros`);

  const filterParts = [];
  if (stats.filters.search) filterParts.push(`búsqueda “${stats.filters.search}”`);
  if (stats.filters.dateFrom) filterParts.push(`desde ${formatDateKey(stats.filters.dateFrom)}`);
  if (stats.filters.dateTo) filterParts.push(`hasta ${formatDateKey(stats.filters.dateTo)}`);
  writeKeyValueRow(
    sheet,
    10,
    "Filtros aplicados",
    filterParts.length ? filterParts.join(" · ") : "Sin filtros (periodo completo)",
  );
  writeKeyValueRow(sheet, 11, "Generado por", stats.userEmail);
  writeKeyValueRow(sheet, 12, "Rol del informe", stats.role);

  addNote(
    sheet,
    13,
    6,
    "La hoja «Reservas» y los indicadores respetan los filtros de la pantalla. La hoja «Histórico mensual» y la de «Gráficos» usan la serie completa de la base para mostrar tendencias.",
  );

  addSectionTitle(sheet, 15, 6, "Indicadores del periodo");
  styleHeaderRow(sheet, 16, ["Indicador", "Valor", "Detalle"]);
  sheet.mergeCells(16, 3, 16, 6);
  sheet.getCell(16, 3).value = "Detalle";

  const kpis = [
    ["Reservas totales", stats.period.length, "Incluye reservas activas y canceladas"],
    ["Reservas activas", stats.active.length, "Confirmadas dentro del periodo"],
    ["Cancelaciones", stats.cancelled.length, `Tasa de cancelación: ${round(stats.cancellationRate * 100, 1)} %`],
    ["Reservas de salón", stats.spaceActive.length, `${round(stats.spaceActive.length / Math.max(1, stats.active.length) * 100, 1)} % del total activo`],
    ["Préstamos de equipos", stats.equipmentActive.length, `${round(stats.equipmentActive.length / Math.max(1, stats.active.length) * 100, 1)} % del total activo`],
    ["Horas de salón", stats.totalSpaceHours, "Horas acumuladas de reservas activas"],
    ["Horas de equipos", stats.totalEquipmentHours, "Horas acumuladas de préstamos activos"],
    ["Horas totales", stats.totalActiveHours, "Salones + equipos"],
    ["Duración media por reserva", round(stats.totalActiveHours / Math.max(1, stats.active.length)), "Horas por reserva activa"],
    ["Docentes distintos", stats.currentComparison.professors, "Con al menos una reserva activa"],
    ["Salones utilizados", `${stats.spacesInUse} de ${stats.spaces.length}`, `${round(stats.spacesInUse / Math.max(1, stats.spaces.length) * 100, 1)} % del inventario`],
    ["Equipos utilizados", `${stats.equipmentInUse} de ${stats.equipment.length}`, `${round(stats.equipmentInUse / Math.max(1, stats.equipment.length) * 100, 1)} % del inventario`],
    ["Ocupación media de salones", stats.averageOccupancy, `Capacidad: 14 h/día × ${stats.businessDays} días hábiles`],
    ["Reservas por día hábil", round(stats.active.length / stats.businessDays), "Promedio del periodo"],
    ["Día con más actividad", stats.busiestWeekday?.count ? `${stats.busiestWeekday.label} (${stats.busiestWeekday.count})` : "—", "Cantidad de reservas activas"],
    ["Franja más solicitada", stats.busiestBand?.count ? `${stats.busiestBand.label} (${stats.busiestBand.count})` : "—", "Según hora de inicio"],
    ["Hora de inicio más frecuente", stats.busiestStart?.count ? `${stats.busiestStart.hour} (${stats.busiestStart.count})` : "—", "Registros que inician a esa hora"],
  ];

  kpis.forEach(([label, value, detail], index) => {
    const row = 17 + index;
    const labelCell = sheet.getCell(row, 1);
    labelCell.value = label;
    labelCell.font = { name: FONT_NAME, size: 10.5, bold: true, color: { argb: C.inkSoft } };
    labelCell.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
    labelCell.border = thinBorder();
    if (index % 2 === 1) labelCell.fill = solid(C.zebra);

    const valueCell = sheet.getCell(row, 2);
    valueCell.value = value;
    valueCell.font = {
      name: FONT_NAME,
      size: 10.5,
      bold: true,
      color: { argb: C.primaryDark },
    };
    valueCell.alignment = { vertical: "middle", horizontal: "right", indent: 1 };
    valueCell.border = thinBorder();
    if (index % 2 === 1) valueCell.fill = solid(C.zebra);
    if (typeof value === "number") {
      if (label.includes("Ocupación")) {
        valueCell.numFmt = "0.0%";
      } else if (Number.isInteger(value)) {
        valueCell.numFmt = "0";
      } else {
        valueCell.numFmt = "0.0";
      }
    }

    sheet.mergeCells(row, 3, row, 6);
    const detailCell = sheet.getCell(row, 3);
    detailCell.value = detail;
    detailCell.font = { name: FONT_NAME, size: 9.5, color: { argb: C.muted } };
    detailCell.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
    detailCell.border = thinBorder();
    if (index % 2 === 1) detailCell.fill = solid(C.zebra);
    sheet.getRow(row).height = 21;
  });

  const comparisonStart = 17 + kpis.length + 1;
  addSectionTitle(sheet, comparisonStart, 6, "Comparativa con el periodo anterior");
  addNote(
    sheet,
    comparisonStart + 1,
    6,
    `Periodo anterior equivalente: ${stats.previousPeriod.start} — ${stats.previousPeriod.end} (${stats.totalDays} días).`,
  );
  const comparisonHeader = comparisonStart + 2;
  styleHeaderRow(sheet, comparisonHeader, [
    "Indicador",
    "Periodo actual",
    "Periodo anterior",
    "Variación",
    "Variación %",
    "Lectura",
  ]);

  const comparisonRows = [
    ["Reservas activas", stats.currentComparison.total, stats.previousComparison.total],
    ["Horas totales", stats.currentComparison.hours, stats.previousComparison.hours],
    ["Reservas de salón", stats.currentComparison.spaces, stats.previousComparison.spaces],
    ["Préstamos de equipos", stats.currentComparison.equipment, stats.previousComparison.equipment],
    ["Docentes distintos", stats.currentComparison.professors, stats.previousComparison.professors],
  ];

  comparisonRows.forEach(([label, current, previous], index) => {
    const row = comparisonHeader + 1 + index;
    const delta = current - previous;
    const percent = previous > 0 ? delta / previous : null;
    [label, current, previous, delta, percent === null ? "—" : percent].forEach(
      (value, columnIndex) => {
        const cell = sheet.getCell(row, columnIndex + 1);
        cell.value = value;
        cell.font = {
          name: FONT_NAME,
          size: 10.5,
          bold: columnIndex === 0,
          color: {
            argb:
              columnIndex === 3 || columnIndex === 4
                ? delta > 0
                  ? C.green
                  : delta < 0
                    ? C.rose
                    : C.muted
                : columnIndex === 0
                  ? C.inkSoft
                  : C.ink,
          },
        };
        cell.alignment = {
          vertical: "middle",
          horizontal: columnIndex === 0 ? "left" : columnIndex === 4 ? "center" : "right",
          indent: columnIndex === 0 ? 1 : 0,
        };
        cell.border = thinBorder();
        if (index % 2 === 1) cell.fill = solid(C.zebra);
        if ([1, 2].includes(columnIndex)) cell.numFmt = "0.0";
        if (columnIndex === 3) cell.numFmt = "+0.0;-0.0;0.0";
        if (columnIndex === 4 && percent !== null) cell.numFmt = "+0.0%;-0.0%;0.0%";
      },
    );
    const reading = sheet.getCell(row, 6);
    reading.value = delta > 0 ? "Mejora" : delta < 0 ? "Descenso" : "Sin cambio";
    reading.font = { name: FONT_NAME, size: 9.5, color: { argb: C.muted } };
    reading.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
    reading.border = thinBorder();
    if (index % 2 === 1) reading.fill = solid(C.zebra);
    sheet.getRow(row).height = 21;
  });

  const findingsStart = comparisonHeader + comparisonRows.length + 2;
  addSectionTitle(sheet, findingsStart, 6, "Hallazgos automáticos");
  const findings = [];
  if (stats.busiestWeekday?.count) {
    findings.push(
      `El día con más reservas es ${stats.busiestWeekday.label}, con ${stats.busiestWeekday.count} reservas (${round(stats.busiestWeekday.share * 100, 1)} % del total).`,
    );
  }
  if (stats.busiestBand?.count) {
    findings.push(
      `La franja horaria más solicitada es ${stats.busiestBand.label}, con ${stats.busiestBand.count} reservas (${round(stats.busiestBand.share * 100, 1)} %).`,
    );
  }
  if (stats.busiestStart?.count) {
    findings.push(
      `La hora de inicio más frecuente es ${stats.busiestStart.hour}, con ${stats.busiestStart.count} reservas.`,
    );
  }
  if (stats.topSpace?.count) {
    findings.push(
      `El salón más reservado es ${stats.topSpace.name}, con ${stats.topSpace.count} reservas y ${stats.topSpace.hours} horas.`,
    );
  }
  if (stats.topEquipment?.count) {
    findings.push(
      `El equipo más prestado es ${stats.topEquipment.name}, con ${stats.topEquipment.count} préstamos.`,
    );
  }
  if (stats.topProfessor) {
    findings.push(
      `El docente con más reservas es ${stats.topProfessor.name}, con ${stats.topProfessor.total} reservas y ${stats.topProfessor.hours} horas.`,
    );
  }
  findings.push(
    `La ocupación media de los salones es ${round(stats.averageOccupancy * 100, 1)} % respecto a la capacidad disponible (14 horas por día hábil).`,
  );
  findings.push(
    `Las cancelaciones representan ${round(stats.cancellationRate * 100, 1)} % de los registros del periodo (${stats.cancelled.length} de ${stats.period.length}).`,
  );
  if (stats.unusedSpaces.length) {
    findings.push(
      `${stats.unusedSpaces.length} salón(es) no registraron reservas: ${stats.unusedSpaces.map((space) => space.name).join(", ")}.`,
    );
  }

  findings.forEach((finding, index) => {
    const row = findingsStart + 1 + index;
    sheet.mergeCells(row, 1, row, 6);
    const cell = sheet.getCell(row, 1);
    cell.value = `•  ${finding}`;
    cell.font = { name: FONT_NAME, size: 10, color: { argb: C.inkSoft } };
    cell.alignment = { vertical: "middle", horizontal: "left", indent: 1, wrapText: true };
    cell.fill = solid(index % 2 === 1 ? C.zebra : C.accentSofter);
    cell.border = thinBorder();
    sheet.getRow(row).height = 21;
  });

  let row = findingsStart + findings.length + 2;
  addSectionTitle(sheet, row, 6, "Rankings del periodo");
  row += 1;

  sheet.mergeCells(row, 1, row, 6);
  const topSpaceTitle = sheet.getCell(row, 1);
  topSpaceTitle.value = "Top 5 salones por reservas";
  topSpaceTitle.font = { name: FONT_NAME, size: 10.5, bold: true, color: { argb: C.ink } };
  topSpaceTitle.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  row += 1;
  row = writeMiniTable(
    sheet,
    row,
    ["Salón", "Reservas", "Horas", "Ocupación"],
    stats.spaceUsage.slice(0, 5).map((space) => [
      space.name,
      space.count,
      space.hours,
      `${round(space.occupancy * 100, 1)} %`,
    ]),
    [1, 2, 3],
  );

  row += 1;
  sheet.mergeCells(row, 1, row, 6);
  const topProfessorTitle = sheet.getCell(row, 1);
  topProfessorTitle.value = "Top 5 docentes por reservas";
  topProfessorTitle.font = { name: FONT_NAME, size: 10.5, bold: true, color: { argb: C.ink } };
  topProfessorTitle.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  row += 1;
  row = writeMiniTable(
    sheet,
    row,
    ["Docente", "Total", "Salones", "Equipos"],
    stats.professorStats.slice(0, 5).map((professor) => [
      professor.name,
      professor.total,
      professor.spaces,
      professor.equipment,
    ]),
    [1, 2, 3],
  );

  row += 1;
  sheet.mergeCells(row, 1, row, 6);
  const topSchoolTitle = sheet.getCell(row, 1);
  topSchoolTitle.value = "Top 5 escuelas o motivos";
  topSchoolTitle.font = { name: FONT_NAME, size: 10.5, bold: true, color: { argb: C.ink } };
  topSchoolTitle.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  row += 1;
  writeMiniTable(
    sheet,
    row,
    ["Escuela o motivo", "Reservas", "Horas", "% del total"],
    stats.schoolStats.slice(0, 5).map((school) => [
      school.label,
      school.count,
      school.hours,
      `${round(school.share * 100, 1)} %`,
    ]),
    [1, 2, 3],
  );

  sheet.headerFooter = {
    oddFooter: `&LInforme generado con Gestor de Salones&C&Página &P de &N&R${formatDate(stats.generatedAt)}`,
  };
  sheet.pageSetup = {
    paperSize: 9,
    orientation: "landscape",
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    margins: { left: 0.3, right: 0.3, top: 0.4, bottom: 0.4, header: 0.2, footer: 0.2 },
  };
  return sheet;
}

function buildHistorySheet(workbook, stats) {
  const sheet = workbook.addWorksheet("Histórico mensual", {
    properties: { tabColor: { argb: C.violet } },
  });
  addTitleBlock(sheet, {
    title: "Histórico mensual de reservas",
    subtitle: "Serie completa de la base · últimos 12 meses · incluye salones, equipos y cancelaciones",
    columns: 10,
  });
  addNote(
    sheet,
    4,
    10,
    "Esta hoja no depende de los filtros de búsqueda ni del rango de fechas de la pantalla: muestra la evolución completa del sistema.",
  );

  const columns = [
    { header: "Mes", key: "month", width: 16 },
    { header: "Reservas activas", key: "total", width: 13, type: "number", numFmt: "0" },
    { header: "Reservas de salón", key: "spaces", width: 13, type: "number", numFmt: "0" },
    { header: "Préstamos de equipos", key: "equipment", width: 13, type: "number", numFmt: "0" },
    { header: "Canceladas", key: "cancelled", width: 11, type: "number", numFmt: "0" },
    { header: "Horas de salón", key: "spaceHours", width: 12, type: "number", numFmt: "0.0" },
    { header: "Horas de equipos", key: "equipmentHours", width: 12, type: "number", numFmt: "0.0" },
    { header: "Docentes", key: "professors", width: 10, type: "number", numFmt: "0" },
    { header: "Variación", key: "delta", width: 11, type: "number", numFmt: "+0;-0;0" },
    { header: "Variación %", key: "deltaPercent", width: 11, type: "number", numFmt: "+0.0%;-0.0%;0.0%" },
  ];

  const result = writeTable(sheet, 6, columns, stats.monthlyHistory, {
    autofilter: false,
    freeze: true,
    dataBar: { key: "total", color: C.accent },
    rowHeight: 21,
  });

  writeTotalsRow(sheet, result.nextRow, columns, {
    total: stats.monthlyHistory.reduce((sum, row) => sum + row.total, 0),
    spaces: stats.monthlyHistory.reduce((sum, row) => sum + row.spaces, 0),
    equipment: stats.monthlyHistory.reduce((sum, row) => sum + row.equipment, 0),
    cancelled: stats.monthlyHistory.reduce((sum, row) => sum + row.cancelled, 0),
    spaceHours: round(stats.monthlyHistory.reduce((sum, row) => sum + row.spaceHours, 0)),
    equipmentHours: round(stats.monthlyHistory.reduce((sum, row) => sum + row.equipmentHours, 0)),
  });

  sheet.pageSetup = { paperSize: 9, orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0 };
  return sheet;
}

function buildReservationsSheet(workbook, stats) {
  const sheet = workbook.addWorksheet("Reservas", {
    properties: { tabColor: { argb: C.accent } },
  });
  addTitleBlock(sheet, {
    title: "Detalle de reservas del periodo",
    subtitle: `${stats.period.length} registros · filtros: ${stats.filters.search ? `“${stats.filters.search}”` : "sin búsqueda"} · ${stats.periodLabel}`,
    columns: RESERVATION_COLUMNS,
  });
  addNote(
    sheet,
    RESERVATION_COLUMNS,
    4,
    "Cada fila corresponde a una reserva o préstamo. Usa los filtros del encabezado para segmentar por fecha, docente, recurso o estado.",
  );

  const columns = [
    { header: "#", key: "index", width: 5, type: "number", align: "center" },
    { header: "Fecha", key: "dateValue", width: 11, numFmt: "dd/mm/yyyy", align: "center" },
    { header: "Día", key: "weekday", width: 10 },
    { header: "Inicio", key: "start", width: 8, align: "center" },
    { header: "Fin", key: "end", width: 8, align: "center" },
    { header: "Horas", key: "hours", width: 7, type: "number", numFmt: "0.0", align: "center" },
    { header: "Tipo", key: "kindLabel", width: 9, align: "center" },
    { header: "Recurso", key: "resourceName", width: 28 },
    { header: "Ubicación", key: "location", width: 14 },
    { header: "Capacidad / unidades", key: "capacity", width: 11, type: "number", numFmt: "0", align: "center" },
    { header: "Docente", key: "professorLabel", width: 26 },
    { header: "Correo", key: "professorEmail", width: 28 },
    { header: "Motivo / uso", key: "reason", width: 34, wrap: true },
    { header: "Estado", key: "status", width: 11, align: "center" },
  ];

  const rows = [...stats.period]
    .sort(
      (first, second) =>
        second.date.localeCompare(first.date) ||
        second.start.localeCompare(first.start),
    )
    .map((reservation, index) => ({
      ...reservation,
      index: index + 1,
      capacity: reservation.capacity ?? "—",
      professorEmail: reservation.professorEmail || "—",
      reason: reservation.reason || "—",
    }));

  const result = writeTable(sheet, 6, columns, rows, {
    freeze: true,
    freezeColumns: 2,
    rowHeight: 21,
    emptyMessage: "No hay reservas que coincidan con los filtros aplicados.",
  });

  if (rows.length) {
    sheet.addConditionalFormatting({
      ref: `A${result.firstDataRow}:N${result.lastDataRow}`,
      rules: [
        {
          type: "expression",
          formulae: [`$N${result.firstDataRow}="Cancelada"`],
          style: { fill: solid(C.roseSoft) },
        },
      ],
    });
  }

  sheet.pageSetup = {
    paperSize: 9,
    orientation: "landscape",
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    printTitlesRow: "6:6",
  };
  return sheet;
}

function buildSpacesSheet(workbook, stats) {
  const sheet = workbook.addWorksheet("Salones", {
    properties: { tabColor: { argb: C.accent } },
  });
  addTitleBlock(sheet, {
    title: "Estadísticas por salón",
    subtitle: `Periodo: ${stats.periodLabel} · ${stats.spacesInUse} de ${stats.spaces.length} salones con reservas`,
    columns: 11,
  });

  const columns = [
    { header: "Salón", key: "name", width: 30 },
    { header: "Capacidad", key: "capacity", width: 10, type: "number", numFmt: "0", align: "center" },
    { header: "Reservas", key: "count", width: 10, type: "number", numFmt: "0" },
    { header: "Horas", key: "hours", width: 9, type: "number", numFmt: "0.0" },
    { header: "% de horas", key: "share", width: 10, type: "number", numFmt: "0.0%" },
    { header: "Duración media", key: "average", width: 11, type: "number", numFmt: "0.0" },
    { header: "Ocupación", key: "occupancy", width: 10, type: "number", numFmt: "0.0%" },
    { header: "Docentes", key: "professors", width: 10, type: "number", numFmt: "0" },
    { header: "Motivo principal", key: "topReason", width: 30 },
    { header: "Canceladas", key: "cancelled", width: 10, type: "number", numFmt: "0" },
    { header: "Última reserva", key: "lastDate", width: 13, align: "center" },
  ];

  const result = writeTable(sheet, 6, columns, stats.spaceUsage, {
    dataBar: { key: "count", color: C.accent },
    rowHeight: 21,
    emptyMessage: "No hay salones registrados.",
  });

  writeTotalsRow(sheet, result.nextRow, columns, {
    count: stats.spaceUsage.reduce((sum, space) => sum + space.count, 0),
    hours: round(stats.spaceUsage.reduce((sum, space) => sum + space.hours, 0)),
    share: 1,
    average: round(
      stats.totalSpaceHours / Math.max(1, stats.spaceActive.length),
    ),
    occupancy: stats.averageOccupancy,
    professors: stats.currentComparison.professors,
    cancelled: stats.spaceCancelled.length,
  });

  sheet.addConditionalFormatting({
    ref: `G${result.firstDataRow}:G${result.lastDataRow}`,
    rules: [
      {
        type: "colorScale",
        cfvo: [{ type: "min" }, { type: "percentile", value: 50 }, { type: "max" }],
        color: [{ argb: "FFFFFFFF" }, { argb: "FFBAE6FD" }, { argb: "FF0369A1" }],
      },
    ],
  });

  sheet.pageSetup = { paperSize: 9, orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0 };
  return sheet;
}

function buildEquipmentSheet(workbook, stats) {
  const sheet = workbook.addWorksheet("Equipos", {
    properties: { tabColor: { argb: C.amber } },
  });
  addTitleBlock(sheet, {
    title: "Estadísticas por equipo",
    subtitle: `Periodo: ${stats.periodLabel} · ${stats.equipmentInUse} de ${stats.equipment.length} equipos con movimiento`,
    columns: 11,
  });

  const columns = [
    { header: "Equipo", key: "name", width: 30 },
    { header: "Tipo", key: "type", width: 12 },
    { header: "Ubicación", key: "location", width: 12 },
    { header: "Unidades", key: "units", width: 10, type: "number", numFmt: "0", align: "center" },
    { header: "Préstamos", key: "count", width: 10, type: "number", numFmt: "0" },
    { header: "Horas", key: "hours", width: 9, type: "number", numFmt: "0.0" },
    { header: "Duración media", key: "average", width: 11, type: "number", numFmt: "0.0" },
    { header: "Utilización", key: "utilization", width: 11, type: "number", numFmt: "0.0%" },
    { header: "Docentes", key: "professors", width: 10, type: "number", numFmt: "0" },
    { header: "Cancelados", key: "cancelled", width: 10, type: "number", numFmt: "0" },
    { header: "Último préstamo", key: "lastDate", width: 13, align: "center" },
  ];

  const result = writeTable(sheet, 6, columns, stats.equipmentUsage, {
    dataBar: { key: "count", color: C.violet },
    rowHeight: 21,
    emptyMessage: "No hay equipos registrados.",
  });

  writeTotalsRow(sheet, result.nextRow, columns, {
    count: stats.equipmentUsage.reduce((sum, item) => sum + item.count, 0),
    hours: round(stats.equipmentUsage.reduce((sum, item) => sum + item.hours, 0)),
    average: round(stats.totalEquipmentHours / Math.max(1, stats.equipmentActive.length)),
    utilization:
      stats.equipmentUsage.reduce(
        (sum, item) => sum + item.utilization * Math.max(1, item.units),
        0,
      ) / Math.max(1, stats.equipment.reduce((sum, item) => sum + Math.max(1, Number(item.total) || 1), 0)),
    professors: stats.currentComparison.professors,
    cancelled: stats.equipmentCancelled.length,
  });

  sheet.addConditionalFormatting({
    ref: `H${result.firstDataRow}:H${result.lastDataRow}`,
    rules: [
      {
        type: "colorScale",
        cfvo: [{ type: "min" }, { type: "percentile", value: 50 }, { type: "max" }],
        color: [{ argb: "FFFFFFFF" }, { argb: "FFEDE9FE" }, { argb: "FF6D28D9" }],
      },
    ],
  });

  sheet.pageSetup = { paperSize: 9, orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0 };
  return sheet;
}

function buildProfessorsSheet(workbook, stats) {
  const sheet = workbook.addWorksheet("Docentes", {
    properties: { tabColor: { argb: C.green } },
  });
  addTitleBlock(sheet, {
    title: "Actividad por docente",
    subtitle: `${stats.professorStats.length} docentes con registros en el periodo · ordenados por cantidad de reservas`,
    columns: 11,
  });

  const columns = [
    { header: "Docente", key: "name", width: 28 },
    { header: "Correo", key: "email", width: 30 },
    { header: "Total", key: "total", width: 8, type: "number", numFmt: "0" },
    { header: "Salones", key: "spaces", width: 8, type: "number", numFmt: "0" },
    { header: "Equipos", key: "equipment", width: 8, type: "number", numFmt: "0" },
    { header: "Horas", key: "hours", width: 9, type: "number", numFmt: "0.0" },
    { header: "Duración media", key: "average", width: 11, type: "number", numFmt: "0.0" },
    { header: "Primer registro", key: "first", width: 12, align: "center" },
    { header: "Último registro", key: "last", width: 12, align: "center" },
    { header: "Recurso favorito", key: "favorite", width: 30 },
    { header: "Canceladas", key: "cancelled", width: 10, type: "number", numFmt: "0" },
  ];

  const rows = stats.professorStats.map((professor) => ({
    ...professor,
    email: professor.email || "—",
  }));

  const result = writeTable(sheet, 6, columns, rows, {
    dataBar: { key: "total", color: C.green },
    rowHeight: 21,
    emptyMessage: "No hay docentes identificados en el periodo.",
  });

  writeTotalsRow(sheet, result.nextRow, columns, {
    total: stats.active.length,
    spaces: stats.spaceActive.length,
    equipment: stats.equipmentActive.length,
    hours: stats.totalActiveHours,
    cancelled: stats.cancelled.length,
  });

  sheet.pageSetup = { paperSize: 9, orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0 };
  return sheet;
}

function buildSchoolsSheet(workbook, stats) {
  const sheet = workbook.addWorksheet("Escuelas y motivos", {
    properties: { tabColor: { argb: C.primary } },
  });
  addTitleBlock(sheet, {
    title: "Reservas por escuela o motivo",
    subtitle: `Periodo: ${stats.periodLabel} · ${stats.schoolStats.length} agrupaciones · ${stats.spaceActive.length} reservas de salón`,
    columns: 7,
  });

  const columns = [
    { header: "Escuela o motivo", key: "label", width: 38 },
    { header: "Reservas", key: "count", width: 10, type: "number", numFmt: "0" },
    { header: "Horas", key: "hours", width: 9, type: "number", numFmt: "0.0" },
    { header: "% del total", key: "share", width: 10, type: "number", numFmt: "0.0%" },
    { header: "Docentes distintos", key: "professors", width: 12, type: "number", numFmt: "0" },
    { header: "Salón más usado", key: "topSpace", width: 30 },
    { header: "Duración media", key: "average", width: 11, type: "number", numFmt: "0.0" },
  ];

  const result = writeTable(sheet, 6, columns, stats.schoolStats, {
    dataBar: { key: "count", color: C.primary },
    rowHeight: 21,
    emptyMessage: "No hay reservas de salón con motivo en el periodo.",
  });

  writeTotalsRow(sheet, result.nextRow, columns, {
    count: stats.spaceActive.length,
    hours: stats.totalSpaceHours,
    share: 1,
    professors: stats.currentComparison.professors,
  });

  sheet.pageSetup = { paperSize: 9, orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0 };
  return sheet;
}

function buildTimeSheet(workbook, stats) {
  const sheet = workbook.addWorksheet("Días y horas", {
    properties: { tabColor: { argb: C.violet } },
  });
  setWidths(sheet, [24, 14, 14, 14, 14, 14, 14, 14, 14]);
  addTitleBlock(sheet, {
    title: "Distribución por día y franja horaria",
    subtitle: `Periodo: ${stats.periodLabel} · ${stats.active.length} reservas activas analizadas`,
    columns: 9,
  });

  addSectionTitle(sheet, 4, 9, "Distribución por día de la semana");
  styleHeaderRow(sheet, 5, ["Día", "Reservas", "Horas", "% reservas", "% horas"]);
  stats.weekdayStats.forEach((day, index) => {
    const row = 6 + index;
    [day.label, day.count, day.hours, day.share, day.hourShare].forEach((value, column) => {
      const cell = sheet.getCell(row, column + 1);
      cell.value = value;
      styleBodyCell(cell, {
        align: column === 0 ? "left" : "right",
        zebra: index % 2 === 1,
      });
      if (column >= 3) cell.numFmt = "0.0%";
      if (column === 1 || column === 2) cell.numFmt = "0.0";
    });
    sheet.getRow(row).height = 20;
  });
  const weekdayTotalRow = 6 + stats.weekdayStats.length;
  writeTotalsRow(
    sheet,
    weekdayTotalRow,
    [
      { key: "label" },
      { key: "count", numFmt: "0" },
      { key: "hours", numFmt: "0.0" },
      { key: "share", numFmt: "0.0%" },
      { key: "hourShare", numFmt: "0.0%" },
    ],
    {
      count: stats.active.length,
      hours: stats.totalActiveHours,
      share: 1,
      hourShare: 1,
    },
  );
  sheet.addConditionalFormatting({
    ref: `B6:B${weekdayTotalRow - 1}`,
    rules: [
      {
        type: "dataBar",
        cfvo: [{ type: "num", value: 0 }, { type: "max" }],
        color: { argb: C.accent },
        gradient: true,
        border: false,
      },
    ],
  });

  const bandStart = weekdayTotalRow + 2;
  addSectionTitle(sheet, bandStart, 9, "Distribución por franja horaria");
  styleHeaderRow(sheet, bandStart + 1, [
    "Franja",
    "Reservas",
    "Horas",
    "% reservas",
    "Salones",
    "Equipos",
  ]);
  stats.bandStats.forEach((band, index) => {
    const row = bandStart + 2 + index;
    [band.label, band.count, band.hours, band.share, band.spaces, band.equipment].forEach(
      (value, column) => {
        const cell = sheet.getCell(row, column + 1);
        cell.value = value;
        styleBodyCell(cell, {
          align: column === 0 ? "left" : "right",
          zebra: index % 2 === 1,
        });
        if (column === 3) cell.numFmt = "0.0%";
        if (column !== 0 && column !== 3) cell.numFmt = "0.0";
      },
    );
    sheet.getRow(row).height = 20;
  });
  const bandTotalRow = bandStart + 2 + stats.bandStats.length;
  writeTotalsRow(
    sheet,
    bandTotalRow,
    [
      { key: "label" },
      { key: "count", numFmt: "0" },
      { key: "hours", numFmt: "0.0" },
      { key: "share", numFmt: "0.0%" },
      { key: "spaces", numFmt: "0" },
      { key: "equipment", numFmt: "0" },
    ],
    {
      count: stats.active.length,
      hours: stats.totalActiveHours,
      share: 1,
      spaces: stats.spaceActive.length,
      equipment: stats.equipmentActive.length,
    },
  );

  const heatStart = bandTotalRow + 2;
  addSectionTitle(sheet, heatStart, 9, "Mapa de calor: día × franja horaria");
  styleHeaderRow(sheet, heatStart + 1, [
    "Día",
    ...HOUR_BANDS.map((band) => band.label.replace(" – ", "–")),
  ]);
  sheet.getCell(heatStart + 1, 9).value = "Total";
  stats.heatmap.forEach((day, index) => {
    const row = heatStart + 2 + index;
    [day.label, ...day.cells, day.total].forEach((value, column) => {
      const cell = sheet.getCell(row, column + 1);
      cell.value = value;
      styleBodyCell(cell, {
        align: "center",
        zebra: index % 2 === 1,
        bold: column === 8,
      });
      cell.numFmt = "0";
    });
    sheet.getRow(row).height = 22;
  });
  const heatEnd = heatStart + 1 + stats.heatmap.length;
  sheet.addConditionalFormatting({
    ref: `B${heatStart + 2}:H${heatEnd}`,
    rules: [
      {
        type: "colorScale",
        cfvo: [{ type: "num", value: 0 }, { type: "percentile", value: 50 }, { type: "max" }],
        color: [{ argb: "FFFFFFFF" }, { argb: "FFBAE6FD" }, { argb: "FF075985" }],
      },
    ],
  });

  const hourStart = heatEnd + 2;
  addSectionTitle(sheet, hourStart, 9, "Horas de inicio más solicitadas");
  styleHeaderRow(sheet, hourStart + 1, ["Hora", "Reservas", "% del total"]);
  stats.startHourStats.forEach((hour, index) => {
    const row = hourStart + 2 + index;
    [hour.hour, hour.count, hour.share].forEach((value, column) => {
      const cell = sheet.getCell(row, column + 1);
      cell.value = value;
      styleBodyCell(cell, { align: column === 0 ? "left" : "right", zebra: index % 2 === 1 });
      if (column === 2) cell.numFmt = "0.0%";
      if (column === 1) cell.numFmt = "0.0";
    });
    sheet.getRow(row).height = 19;
  });

  sheet.pageSetup = { paperSize: 9, orientation: "portrait", fitToPage: true, fitToWidth: 1, fitToHeight: 0 };
  return sheet;
}

function buildCancellationsSheet(workbook, stats) {
  const sheet = workbook.addWorksheet("Cancelaciones", {
    properties: { tabColor: { argb: C.rose } },
  });
  addTitleBlock(sheet, {
    title: "Cancelaciones del periodo",
    subtitle: `${stats.cancelled.length} cancelaciones de ${stats.period.length} registros · tasa: ${round(stats.cancellationRate * 100, 1)} %`,
    columns: 10,
  });

  addSectionTitle(sheet, 4, 10, "Resumen");
  writeKeyValueRow(sheet, 5, "Cancelaciones totales", stats.cancelled.length, "Registros en estado cancelado");
  writeKeyValueRow(sheet, 6, "Cancelaciones de salón", stats.spaceCancelled.length, "Salones liberados");
  writeKeyValueRow(sheet, 7, "Cancelaciones de equipos", stats.equipmentCancelled.length, "Préstamos liberados");
  writeKeyValueRow(
    sheet,
    8,
    "Tasa de cancelación",
    `${round(stats.cancellationRate * 100, 1)} %`,
    "Canceladas ÷ total de registros del periodo",
  );

  addSectionTitle(sheet, 10, 10, "Detalle de cancelaciones");
  const columns = [
    { header: "Fecha", key: "dateValue", width: 11, numFmt: "dd/mm/yyyy", align: "center" },
    { header: "Día", key: "weekday", width: 10 },
    { header: "Inicio", key: "start", width: 8, align: "center" },
    { header: "Fin", key: "end", width: 8, align: "center" },
    { header: "Horas", key: "hours", width: 7, type: "number", numFmt: "0.0", align: "center" },
    { header: "Tipo", key: "kindLabel", width: 9, align: "center" },
    { header: "Recurso", key: "resourceName", width: 28 },
    { header: "Docente", key: "professorLabel", width: 26 },
    { header: "Correo", key: "professorEmail", width: 28 },
    { header: "Motivo / uso", key: "reason", width: 32 },
  ];

  const rows = [...stats.cancelled]
    .sort(
      (first, second) =>
        second.date.localeCompare(first.date) || second.start.localeCompare(first.start),
    )
    .map((reservation) => ({
      ...reservation,
      professorEmail: reservation.professorEmail || "—",
      reason: reservation.reason || "—",
    }));

  const result = writeTable(sheet, 12, columns, rows, {
    rowHeight: 21,
    emptyMessage: "No se registraron cancelaciones en el periodo.",
  });

  const byResourceStart = result.nextRow + 2;
  addSectionTitle(sheet, byResourceStart, 10, "Cancelaciones por recurso");
  const counts = new Map();
  stats.cancelled.forEach((reservation) => {
    const key = `${reservation.kind}|${reservation.resourceId}`;
    const current = counts.get(key) || {
      resource: reservation.resourceName,
      type: reservation.kindLabel,
      count: 0,
    };
    current.count += 1;
    counts.set(key, current);
  });
  const byResource = [...counts.values()].sort((first, second) => second.count - first.count);
  writeMiniTable(
    sheet,
    byResourceStart + 1,
    ["Recurso", "Tipo", "Cancelaciones", "% del total"],
    byResource.map((row) => [
      row.resource,
      row.type,
      row.count,
      `${round((row.count / Math.max(1, stats.cancelled.length)) * 100, 1)} %`,
    ]),
    [2, 3],
    7,
  );

  sheet.pageSetup = { paperSize: 9, orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0 };
  return sheet;
}

function buildChartsSheet(workbook, stats) {
  const sheet = workbook.addWorksheet("Gráficos", {
    properties: { tabColor: { argb: C.violet } },
    views: [{ showGridLines: false }],
  });
  setWidths(sheet, Array.from({ length: 20 }, () => 8.5));
  addTitleBlock(sheet, {
    title: "Panel visual de reservas",
    subtitle: `Periodo: ${stats.periodLabel} · gráficos generados a partir de los datos del informe`,
    columns: 20,
  });
  addNote(
    sheet,
    4,
    20,
    "Los gráficos son imágenes de alta resolución incrustadas en el archivo. Las hojas de estadísticas contienen los datos editables que los respaldan.",
  );

  const topSpaces = stats.spaceUsage.filter((space) => space.count > 0).slice(0, 8);
  const topEquipment = stats.equipmentUsage.filter((item) => item.count > 0).slice(0, 8);
  const topProfessors = stats.professorStats.filter((item) => item.total > 0).slice(0, 8);
  const topSchools = stats.schoolStats.slice(0, 8);

  const charts = [
    [
      renderBarChart({
        title: "Reservas por salón",
        subtitle: `Top ${topSpaces.length} del periodo`,
        labels: topSpaces.map((space) => space.name.replace(/^A /, "")),
        values: topSpaces.map((space) => space.count),
        color: CHART_COLORS[0],
      }),
      renderLineChart({
        title: "Evolución mensual",
        subtitle: "Reservas activas · últimos 12 meses",
        labels: stats.monthlyHistory.map((row) => row.month),
        values: stats.monthlyHistory.map((row) => row.total),
        color: CHART_COLORS[5],
      }),
    ],
    [
      renderBarChart({
        title: "Reservas por día de la semana",
        subtitle: "Total del periodo analizado",
        labels: stats.weekdayStats.map((day) => day.label.slice(0, 3)),
        values: stats.weekdayStats.map((day) => day.count),
        color: CHART_COLORS[2],
      }),
      renderBarChart({
        title: "Reservas por franja horaria",
        subtitle: "Según hora de inicio",
        labels: stats.bandStats.map((band) => band.label.replace(" – ", "–")),
        values: stats.bandStats.map((band) => band.count),
        color: CHART_COLORS[3],
        height: 340,
      }),
    ],
    [
      renderDonutChart({
        title: "Tipo de recurso reservado",
        subtitle: "Salones frente a equipos",
        labels: ["Salones", "Equipos"],
        values: [stats.spaceActive.length, stats.equipmentActive.length],
      }),
      renderHorizontalBarChart({
        title: "Docentes con más reservas",
        subtitle: `Top ${topProfessors.length} del periodo`,
        labels: topProfessors.map((professor) => professor.name),
        values: topProfessors.map((professor) => professor.total),
        color: CHART_COLORS[4],
        height: 360,
      }),
    ],
    [
      renderHorizontalBarChart({
        title: "Escuelas o motivos con más reservas",
        subtitle: `Top ${topSchools.length} del periodo`,
        labels: topSchools.map((school) => school.label),
        values: topSchools.map((school) => school.count),
        color: CHART_COLORS[0],
        height: 360,
      }),
      renderHorizontalBarChart({
        title: "Equipos más prestados",
        subtitle: `Top ${topEquipment.length} del periodo`,
        labels: topEquipment.map((item) => item.name),
        values: topEquipment.map((item) => item.count),
        color: CHART_COLORS[6],
        height: 360,
      }),
    ],
    [
      renderBarChart({
        title: "Horas de inicio más solicitadas",
        subtitle: "Distribución de reservas por hora",
        labels: stats.startHourStats.map((hour) => hour.hour.slice(0, 2)),
        values: stats.startHourStats.map((hour) => hour.count),
        color: CHART_COLORS[5],
        height: 340,
      }),
    ],
  ];

  const anchors = [
    [0, 5],
    [0, 29],
    [0, 53],
    [0, 77],
    [0, 101],
  ];

  let renderedCharts = 0;
  charts.forEach((pair, rowIndex) => {
    pair.forEach((chart, columnIndex) => {
      if (!chart) return;
      const base64 = chartToBase64(chart);
      if (!base64) return;
      try {
        const imageId = workbook.addImage({ base64, extension: "png" });
        const [startColumn, startRow] = anchors[rowIndex];
        sheet.addImage(imageId, {
          tl: { col: startColumn + columnIndex * 10, row: startRow },
          ext: { width: chart.width, height: chart.height },
          editAs: "oneCell",
        });
        renderedCharts += 1;
      } catch {
        // Si el navegador no permite incrustar la imagen, el resto del informe sigue siendo válido.
      }
    });
  });

  if (renderedCharts === 0) {
    sheet.mergeCells(6, 1, 6, 20);
    const message = sheet.getCell(6, 1);
    message.value =
      "No hay suficientes datos en el periodo para generar los gráficos. Consulta las hojas de estadísticas para ver el detalle.";
    message.font = { name: FONT_NAME, size: 10, italic: true, color: { argb: C.muted } };
    message.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
    message.fill = solid(C.accentSofter);
  }

  sheet.pageSetup = { paperSize: 9, orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0 };
  return sheet;
}

export async function buildReservationWorkbook(input) {
  const stats = computeStats(input);
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Gestor de Salones";
  workbook.lastModifiedBy = "Gestor de Salones";
  workbook.created = stats.generatedAt;
  workbook.modified = stats.generatedAt;
  workbook.company = "Gestor de Salones";
  workbook.subject = `Informe de reservas ${stats.periodLabel}`;
  workbook.title = "Informe de reservas · Gestor de Salones";
  workbook.description =
    "Informe detallado de reservas de salones y préstamos de equipos con estadísticas, histórico y gráficos.";

  buildSummarySheet(workbook, stats);
  buildHistorySheet(workbook, stats);
  buildReservationsSheet(workbook, stats);
  buildSpacesSheet(workbook, stats);
  buildEquipmentSheet(workbook, stats);
  buildProfessorsSheet(workbook, stats);
  buildSchoolsSheet(workbook, stats);
  buildTimeSheet(workbook, stats);
  buildCancellationsSheet(workbook, stats);
  buildChartsSheet(workbook, stats);

  return { workbook, stats };
}

export async function downloadReservationReport(input) {
  const { workbook } = await buildReservationWorkbook(input);
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([new Uint8Array(buffer)], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `informe-reservas-${todayKey()}.xlsx`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
  return link.download;
}
