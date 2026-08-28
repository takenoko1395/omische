import type { StoreCalendar } from "@omische/model";
import type { CalendarGateway } from "../../gateway/calendar-gateway";
import { saveCalendar } from "./save-calendar";

export function setExceptionRange(
  gateway: CalendarGateway,
  calendar: StoreCalendar,
  kind: "open" | "closed",
  start: string,
  end: string,
): StoreCalendar {
  const dates: string[] = [];
  const current = new Date(`${start}T00:00:00`);
  const last = new Date(`${end}T00:00:00`);
  if (Number.isNaN(current.valueOf()) || current > last) return calendar;
  while (current <= last) {
    dates.push(
      `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}-${String(current.getDate()).padStart(2, "0")}`,
    );
    current.setDate(current.getDate() + 1);
  }
  const selected = new Set(dates);
  const rules = {
    ...calendar.rules,
    specialOpenDates:
      kind === "open"
        ? [...new Set([...calendar.rules.specialOpenDates, ...dates])]
        : calendar.rules.specialOpenDates.filter((date) => !selected.has(date)),
    specialClosedDates:
      kind === "closed"
        ? [...new Set([...calendar.rules.specialClosedDates, ...dates])]
        : calendar.rules.specialClosedDates.filter(
            (date) => !selected.has(date),
          ),
  } as StoreCalendar["rules"];
  return saveCalendar(gateway, { ...calendar, rules });
}
