import {
  buildBusinessMonth,
  type CalendarDay,
  type StoreCalendar,
} from "@omische/model";
import type { CalendarGateway } from "../../gateway/calendar-gateway";

export const buildCalendarMonth = (
  gateway: CalendarGateway,
  calendar: StoreCalendar,
  year: number,
  month: number,
): readonly CalendarDay[] =>
  buildBusinessMonth(calendar, year, month, gateway.holidays(year));
