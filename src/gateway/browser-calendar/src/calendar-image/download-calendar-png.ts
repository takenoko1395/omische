import type { CalendarImage } from "@omische/usecase";
import type { BusinessHours } from "@omische/model";

const IMAGE_SIZE = 1080;
const HOLIDAY_COLOR = "#c43d3d";
const DEFAULT_BODY_FONT = '"Noto Sans JP", sans-serif';
const DEFAULT_HEADING_FONT = '"Shippori Mincho", serif';
const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"] as const;

export async function downloadCalendarPng({
  calendar,
  year,
  month,
  days,
}: CalendarImage) {
  const bodyFont = DEFAULT_BODY_FONT;
  const headingFont = DEFAULT_HEADING_FONT;
  await loadCalendarFonts(bodyFont, headingFont);

  const canvas = document.createElement("canvas");
  canvas.width = IMAGE_SIZE;
  canvas.height = IMAGE_SIZE;
  const context = canvas.getContext("2d");
  if (!context) return;

  const background =
    calendar.theme === "minimal"
      ? "#ffffff"
      : calendar.theme === "japanese"
        ? "#f8f4eb"
        : "#fbf8f1";
  context.fillStyle = background;
  context.fillRect(0, 0, IMAGE_SIZE, IMAGE_SIZE);
  if (calendar.theme === "japanese") {
    context.strokeStyle = "#3f4439";
    context.lineWidth = 4;
    context.strokeRect(10, 10, IMAGE_SIZE - 20, IMAGE_SIZE - 20);
    context.lineWidth = 2;
    context.strokeRect(20, 20, IMAGE_SIZE - 40, IMAGE_SIZE - 40);
  }

  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillStyle = calendar.mainColor;
  context.font = `500 15px ${bodyFont}`;
  drawSpacedText(context, "BUSINESS CALENDAR", IMAGE_SIZE / 2, 65, 4);
  context.fillStyle = "#29251f";
  context.textAlign = "center";
  setFittedFont(context, calendar.storeName, 58, 600, headingFont, 720);
  context.fillText(calendar.storeName, IMAGE_SIZE / 2, 132);
  context.textAlign = "right";
  context.font = `400 21px ${bodyFont}`;
  context.fillText(`${year} / ${String(month).padStart(2, "0")}`, 1015, 190);
  context.strokeStyle = "#d8d1c5";
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(65, 218);
  context.lineTo(1015, 218);
  context.stroke();

  const gridLeft = 65;
  const gridRight = 1015;
  const gridTop = 285;
  const gridBottom = 850;
  const columnWidth = (gridRight - gridLeft) / 7;
  const start = new Date(year, month - 1, 1).getDay();
  const rowCount = Math.ceil((start + days.length) / 7);
  const rowHeight = (gridBottom - gridTop) / rowCount;
  WEEKDAYS.forEach((weekday, index) => {
    context.textAlign = "center";
    context.fillStyle = "#857b6e";
    context.font = `600 18px ${bodyFont}`;
    context.fillText(weekday, gridLeft + columnWidth * (index + 0.5), 252);
  });

  days.forEach((day) => {
    const cell = start + day.day - 1;
    const column = cell % 7;
    const row = Math.floor(cell / 7);
    const x = gridLeft + column * columnWidth + 6;
    const y = gridTop + row * rowHeight + 4;
    const width = columnWidth - 12;
    const height = rowHeight - 8;
    if (!day.isOpen) {
      context.fillStyle = mixWithWhite(calendar.mainColor, 0.12);
      roundedRect(context, x, y, width, height, 16);
      context.fill();
    }
    if (day.kind === "special-open") {
      context.strokeStyle = calendar.mainColor;
      context.lineWidth = 3;
      roundedRect(context, x, y, width, height, 16);
      context.stroke();
    }

    const labels = [
      ...(day.isHoliday && day.holidayName ? [day.holidayName] : []),
      ...(!day.isOpen ? ["休"] : []),
      ...(day.kind === "special-open" ? ["営"] : []),
    ];
    const centerX = x + width / 2;
    const centerY = y + height / 2;
    const dayY = labels.length === 0 ? centerY : centerY - 18;
    context.textAlign = "center";
    context.fillStyle = day.isHoliday
      ? HOLIDAY_COLOR
      : day.isOpen
        ? "#29251f"
        : calendar.mainColor;
    context.font = `600 30px ${bodyFont}`;
    context.fillText(String(day.day), centerX, dayY);
    labels.forEach((label, index) => {
      context.fillStyle =
        day.isHoliday && index === 0 ? HOLIDAY_COLOR : calendar.mainColor;
      setFittedFont(context, label, 14, 500, bodyFont, width - 10);
      context.fillText(label, centerX, dayY + 25 + index * 18);
    });
  });

  drawLegend(context, calendar.mainColor, bodyFont, 895);
  context.strokeStyle = "#d8d1c5";
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(65, 930);
  context.lineTo(1015, 930);
  context.stroke();
  context.textBaseline = "top";
  context.textAlign = "left";
  context.fillStyle = "#776f65";
  const weekdayHours = `平日 ${formatBusinessHours(calendar.businessHours.weekday)}`;
  const weekendHours = `土日祝 ${formatBusinessHours(calendar.businessHours.weekendHoliday)}`;
  setFittedFont(context, weekdayHours, 16, 600, bodyFont, 480);
  context.fillText(weekdayHours, 65, 960);
  setFittedFont(context, weekendHours, 16, 600, bodyFont, 480);
  context.fillText(weekendHours, 65, 990);
  context.textAlign = "right";
  context.font = `400 16px ${bodyFont}`;
  drawRightAlignedLines(context, calendar.note, 1015, 960, 420, 24);

  const link = document.createElement("a");
  link.download = `business-calendar-${year}-${month}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

function formatBusinessHours(hours: BusinessHours) {
  const base = `${hours.open}–${hours.close}`;
  return hours.breakTime
    ? `${base}（休 ${hours.breakTime.start}–${hours.breakTime.end}）`
    : base;
}

async function loadCalendarFonts(bodyFont: string, headingFont: string) {
  if (document.fonts === undefined) return;
  await Promise.allSettled([
    document.fonts.load(`600 30px ${bodyFont}`),
    document.fonts.load(`600 58px ${headingFont}`),
  ]);
  await document.fonts.ready;
}

function setFittedFont(
  context: CanvasRenderingContext2D,
  text: string,
  initialSize: number,
  weight: number,
  family: string,
  maxWidth: number,
) {
  let size = initialSize;
  context.font = `${weight} ${size}px ${family}`;
  while (size > 10 && context.measureText(text).width > maxWidth) {
    size -= 1;
    context.font = `${weight} ${size}px ${family}`;
  }
}

function drawSpacedText(
  context: CanvasRenderingContext2D,
  text: string,
  centerX: number,
  y: number,
  spacing: number,
) {
  const widths = [...text].map(
    (character) => context.measureText(character).width,
  );
  const totalWidth =
    widths.reduce((total, width) => total + width, 0) +
    spacing * (widths.length - 1);
  let x = centerX - totalWidth / 2;
  context.textAlign = "left";
  [...text].forEach((character, index) => {
    context.fillText(character, x, y);
    x += (widths[index] ?? 0) + spacing;
  });
}

function roundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
}

function mixWithWhite(color: string, ratio: number) {
  const normalized = color.replace("#", "");
  const expanded =
    normalized.length === 3
      ? [...normalized].map((value) => `${value}${value}`).join("")
      : normalized;
  const value = Number.parseInt(expanded, 16);
  if (expanded.length !== 6 || Number.isNaN(value)) return "#f4ebe7";
  const channel = (shift: number) =>
    Math.round(255 + (((value >> shift) & 0xff) - 255) * ratio);
  return `rgb(${channel(16)}, ${channel(8)}, ${channel(0)})`;
}

function drawLegend(
  context: CanvasRenderingContext2D,
  accent: string,
  font: string,
  y: number,
) {
  const items = [
    { label: "営業日", fill: "#aaaaaa", stroke: "#aaaaaa" },
    { label: "休業日", fill: accent, stroke: accent },
    { label: "臨時変更", fill: "#ffffff", stroke: accent },
  ];
  context.font = `400 14px ${font}`;
  const widths = items.map(
    (item) => 16 + context.measureText(item.label).width,
  );
  const gap = 28;
  const totalWidth =
    widths.reduce((total, width) => total + width, 0) + gap * 2;
  let x = (IMAGE_SIZE - totalWidth) / 2;
  context.textAlign = "left";
  context.textBaseline = "middle";
  for (const [index, item] of items.entries()) {
    context.beginPath();
    context.arc(x + 5, y, 5, 0, Math.PI * 2);
    context.fillStyle = item.fill;
    context.fill();
    context.strokeStyle = item.stroke;
    context.lineWidth = 2;
    context.stroke();
    context.fillStyle = "#776f65";
    context.fillText(item.label, x + 16, y);
    x += (widths[index] ?? 0) + gap;
  }
}

function drawRightAlignedLines(
  context: CanvasRenderingContext2D,
  text: string,
  right: number,
  top: number,
  maxWidth: number,
  lineHeight: number,
) {
  const lines: string[] = [];
  let current = "";
  for (const character of text) {
    const candidate = `${current}${character}`;
    if (current && context.measureText(candidate).width > maxWidth) {
      lines.push(current);
      current = character;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  lines
    .slice(0, 3)
    .forEach((line, index) =>
      context.fillText(line, right, top + index * lineHeight),
    );
}
