const FONT =
  'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

const INK = "#0f172a";
const MUTED = "#64748b";
const GRID = "#e2e8f0";
const TRACK = "#f1f5f9";

export const CHART_COLORS = [
  "#0284c7",
  "#7c3aed",
  "#059669",
  "#d97706",
  "#db2777",
  "#0891b2",
  "#65a30d",
  "#dc2626",
];

const PIXEL_RATIO = 2;

function createSurface(width, height) {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width * PIXEL_RATIO);
  canvas.height = Math.round(height * PIXEL_RATIO);
  const context = canvas.getContext("2d");
  if (!context) return null;
  context.scale(PIXEL_RATIO, PIXEL_RATIO);
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.textBaseline = "middle";
  return { canvas, context };
}

function setFont(context, size, weight = "400", color = INK) {
  context.font = `${weight} ${size}px ${FONT}`;
  context.fillStyle = color;
}

function clipText(context, text, maxWidth) {
  const value = String(text ?? "");
  if (context.measureText(value).width <= maxWidth) return value;
  let result = value;
  while (result.length > 1 && context.measureText(`${result}…`).width > maxWidth) {
    result = result.slice(0, -1);
  }
  return `${result}…`;
}

function formatNumber(value) {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded)
    ? String(rounded)
    : rounded.toFixed(1).replace(".", ",");
}

function niceMax(value) {
  if (!Number.isFinite(value) || value <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalized = value / magnitude;
  const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return step * magnitude;
}

function roundedRect(context, x, y, width, height, radius) {
  const r = Math.max(0, Math.min(radius, width / 2, height / 2));
  context.beginPath();
  context.moveTo(x + r, y);
  context.lineTo(x + width - r, y);
  context.quadraticCurveTo(x + width, y, x + width, y + r);
  context.lineTo(x + width, y + height - r);
  context.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  context.lineTo(x + r, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - r);
  context.lineTo(x, y + r);
  context.quadraticCurveTo(x, y, x + r, y);
  context.closePath();
}

function drawHeader(context, title, subtitle, width) {
  setFont(context, 16, "600", INK);
  context.fillText(clipText(context, title, width - 48), 24, 26);
  if (subtitle) {
    setFont(context, 11.5, "400", MUTED);
    context.fillText(clipText(context, subtitle, width - 48), 24, 46);
  }
}

function toImage(canvas, width, height) {
  return {
    dataUrl: canvas.toDataURL("image/png"),
    width,
    height,
  };
}

const hasValues = (values) => values.some((value) => Number(value) > 0);

export function renderBarChart({
  title,
  subtitle = "",
  labels,
  values,
  color = CHART_COLORS[0],
  width = 620,
  height = 330,
  valueSuffix = "",
}) {
  if (!labels.length || !hasValues(values)) return null;
  const surface = createSurface(width, height);
  if (!surface) return null;
  const { canvas, context } = surface;

  drawHeader(context, title, subtitle, width);

  const plot = {
    left: 52,
    right: width - 22,
    top: subtitle ? 72 : 58,
    bottom: height - 52,
  };
  const plotWidth = plot.right - plot.left;
  const plotHeight = plot.bottom - plot.top;
  const max = niceMax(Math.max(...values));
  const ticks = 4;

  for (let tick = 0; tick <= ticks; tick += 1) {
    const value = (max / ticks) * tick;
    const y = plot.bottom - (value / max) * plotHeight;
    context.strokeStyle = GRID;
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(plot.left, Math.round(y) + 0.5);
    context.lineTo(plot.right, Math.round(y) + 0.5);
    context.stroke();
    setFont(context, 10, "400", MUTED);
    context.textAlign = "right";
    context.fillText(formatNumber(value), plot.left - 8, y);
    context.textAlign = "left";
  }

  const slot = plotWidth / labels.length;
  const barWidth = Math.max(8, Math.min(46, slot * 0.56));

  let rotate = false;
  context.font = `500 10.5px ${FONT}`;
  labels.forEach((label) => {
    if (context.measureText(String(label)).width > slot - 6) rotate = true;
  });

  labels.forEach((label, index) => {
    const value = Number(values[index]) || 0;
    const barHeight = max > 0 ? (value / max) * plotHeight : 0;
    const x = plot.left + slot * index + (slot - barWidth) / 2;
    const y = plot.bottom - barHeight;

    if (barHeight > 0) {
      const gradient = context.createLinearGradient(0, y, 0, plot.bottom);
      gradient.addColorStop(0, color);
      gradient.addColorStop(1, `${color}b3`);
      context.fillStyle = gradient;
      roundedRect(context, x, y, barWidth, barHeight, 4);
      context.fill();
    }

    if (value > 0) {
      setFont(context, 10, "600", INK);
      context.textAlign = "center";
      context.fillText(
        `${formatNumber(value)}${valueSuffix}`,
        x + barWidth / 2,
        y - 10,
      );
      context.textAlign = "left";
    }

    setFont(context, 10, "500", MUTED);
    if (rotate) {
      context.save();
      context.translate(x + barWidth / 2, plot.bottom + 10);
      context.rotate(-Math.PI / 6);
      context.textAlign = "right";
      context.fillText(clipText(context, label, 72), 0, 0);
      context.restore();
    } else {
      context.textAlign = "center";
      context.fillText(clipText(context, label, slot - 4), x + barWidth / 2, plot.bottom + 16);
      context.textAlign = "left";
    }
  });

  return toImage(canvas, width, height);
}

export function renderHorizontalBarChart({
  title,
  subtitle = "",
  labels,
  values,
  color = CHART_COLORS[0],
  width = 620,
  height,
  valueSuffix = "",
}) {
  if (!labels.length || !hasValues(values)) return null;
  const chartHeight = height || Math.max(230, 74 + labels.length * 30);
  const surface = createSurface(width, chartHeight);
  if (!surface) return null;
  const { canvas, context } = surface;

  drawHeader(context, title, subtitle, width);

  const plot = {
    left: 178,
    right: width - 62,
    top: subtitle ? 66 : 54,
    bottom: chartHeight - 18,
  };
  const rowHeight = (plot.bottom - plot.top) / labels.length;
  const barHeight = Math.min(16, rowHeight * 0.56);
  const max = niceMax(Math.max(...values));

  labels.forEach((label, index) => {
    const value = Number(values[index]) || 0;
    const centerY = plot.top + rowHeight * index + rowHeight / 2;
    const y = centerY - barHeight / 2;

    setFont(context, 10.5, "500", INK);
    context.textAlign = "right";
    context.fillText(clipText(context, label, plot.left - 18), plot.left - 12, centerY);
    context.textAlign = "left";

    context.fillStyle = TRACK;
    roundedRect(context, plot.left, y, plot.right - plot.left, barHeight, 4);
    context.fill();

    const barWidth = max > 0 ? ((value / max) * (plot.right - plot.left)) : 0;
    if (barWidth > 0) {
      context.fillStyle = color;
      roundedRect(context, plot.left, y, Math.max(barWidth, 2), barHeight, 4);
      context.fill();
    }

    setFont(context, 10, "600", value > 0 ? INK : MUTED);
    context.fillText(
      `${formatNumber(value)}${valueSuffix}`,
      plot.left + barWidth + 8,
      centerY,
    );
  });

  return toImage(canvas, width, chartHeight);
}

export function renderDonutChart({
  title,
  subtitle = "",
  labels,
  values,
  width = 620,
  height = 330,
}) {
  const total = values.reduce((sum, value) => sum + (Number(value) || 0), 0);
  if (total <= 0) return null;
  const surface = createSurface(width, height);
  if (!surface) return null;
  const { canvas, context } = surface;

  drawHeader(context, title, subtitle, width);

  const centerX = 188;
  const centerY = height / 2 + 18;
  const radius = 88;
  const thickness = 34;
  let start = -Math.PI / 2;

  values.forEach((rawValue, index) => {
    const value = Number(rawValue) || 0;
    if (value <= 0) return;
    const angle = (value / total) * Math.PI * 2;
    context.strokeStyle = CHART_COLORS[index % CHART_COLORS.length];
    context.lineWidth = thickness;
    context.beginPath();
    context.arc(centerX, centerY, radius, start + 0.012, start + angle - 0.012);
    context.stroke();
    start += angle;
  });

  setFont(context, 22, "700", INK);
  context.textAlign = "center";
  context.fillText(formatNumber(total), centerX, centerY - 6);
  setFont(context, 10, "500", MUTED);
  context.fillText("reservas", centerX, centerY + 16);
  context.textAlign = "left";

  const legendX = 330;
  const rowGap = 34;
  const legendStart = centerY - ((labels.length - 1) * rowGap) / 2;

  labels.forEach((label, index) => {
    const value = Number(values[index]) || 0;
    const y = legendStart + index * rowGap;
    context.fillStyle = CHART_COLORS[index % CHART_COLORS.length];
    roundedRect(context, legendX, y - 6, 12, 12, 3);
    context.fill();

    setFont(context, 11, "500", INK);
    context.fillText(clipText(context, label, width - legendX - 120), legendX + 20, y - 2);
    setFont(context, 10, "400", MUTED);
    const percent = total > 0 ? Math.round((value / total) * 100) : 0;
    context.fillText(
      `${formatNumber(value)} · ${percent} %`,
      legendX + 20,
      y + 13,
    );
  });

  return toImage(canvas, width, height);
}

export function renderLineChart({
  title,
  subtitle = "",
  labels,
  values,
  color = CHART_COLORS[0],
  width = 620,
  height = 330,
}) {
  if (!labels.length || !hasValues(values)) return null;
  const surface = createSurface(width, height);
  if (!surface) return null;
  const { canvas, context } = surface;

  drawHeader(context, title, subtitle, width);

  const plot = {
    left: 52,
    right: width - 22,
    top: subtitle ? 72 : 58,
    bottom: height - 46,
  };
  const plotWidth = plot.right - plot.left;
  const plotHeight = plot.bottom - plot.top;
  const max = niceMax(Math.max(...values));
  const ticks = 4;

  for (let tick = 0; tick <= ticks; tick += 1) {
    const value = (max / ticks) * tick;
    const y = plot.bottom - (value / max) * plotHeight;
    context.strokeStyle = GRID;
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(plot.left, Math.round(y) + 0.5);
    context.lineTo(plot.right, Math.round(y) + 0.5);
    context.stroke();
    setFont(context, 10, "400", MUTED);
    context.textAlign = "right";
    context.fillText(formatNumber(value), plot.left - 8, y);
    context.textAlign = "left";
  }

  const stepX = labels.length > 1 ? plotWidth / (labels.length - 1) : plotWidth;
  const points = values.map((value, index) => ({
    x: plot.left + stepX * index,
    y: plot.bottom - (Number(value) / max) * plotHeight,
    value: Number(value) || 0,
  }));

  const area = context.createLinearGradient(0, plot.top, 0, plot.bottom);
  area.addColorStop(0, `${color}38`);
  area.addColorStop(1, `${color}00`);
  context.beginPath();
  context.moveTo(points[0].x, plot.bottom);
  points.forEach((point) => context.lineTo(point.x, point.y));
  context.lineTo(points[points.length - 1].x, plot.bottom);
  context.closePath();
  context.fillStyle = area;
  context.fill();

  context.strokeStyle = color;
  context.lineWidth = 2.5;
  context.lineJoin = "round";
  context.beginPath();
  points.forEach((point, index) => {
    if (index === 0) context.moveTo(point.x, point.y);
    else context.lineTo(point.x, point.y);
  });
  context.stroke();

  points.forEach((point, index) => {
    context.beginPath();
    context.fillStyle = "#ffffff";
    context.arc(point.x, point.y, 3.6, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = color;
    context.lineWidth = 2;
    context.stroke();

    if (labels.length <= 9) {
      setFont(context, 9.5, "600", INK);
      context.textAlign = "center";
      context.fillText(formatNumber(point.value), point.x, point.y - 13);
    }

    setFont(context, 10, "500", MUTED);
    if (labels.length <= 12 || index % 2 === 0) {
      if (index === 0) context.textAlign = "left";
      else if (index === points.length - 1) context.textAlign = "right";
      else context.textAlign = "center";
      context.fillText(clipText(context, labels[index], 58), point.x, plot.bottom + 15);
    }
    context.textAlign = "left";
  });

  return toImage(canvas, width, height);
}

export function chartToBase64(chart) {
  if (!chart?.dataUrl) return null;
  return chart.dataUrl.split(",")[1];
}
