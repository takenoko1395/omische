import type { StoreCalendar } from "@omische/model";
import type { CalendarGateway } from "../../gateway/calendar-gateway";

export function saveCalendar(
  gateway: CalendarGateway,
  calendar: StoreCalendar,
): StoreCalendar {
  gateway.save(calendar);
  return calendar;
}
