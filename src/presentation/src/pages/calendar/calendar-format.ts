import type { BusinessHours } from "@omische/model";

export const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"] as const;

export function formatBusinessHours(hours: BusinessHours) {
  const base = `${hours.open}–${hours.close}`;
  return hours.breakTime
    ? `${base}（休 ${hours.breakTime.start}–${hours.breakTime.end}）`
    : base;
}
