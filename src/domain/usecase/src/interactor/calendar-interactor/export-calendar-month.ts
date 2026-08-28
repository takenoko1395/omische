import { buildBusinessMonth, type StoreCalendar } from "@omische/model";
import type { CalendarGateway } from "../../gateway/calendar-gateway";
import type { CalendarImageGateway } from "../../gateway/calendar-image-gateway";

export type ExportCalendarMonthInput = Readonly<{
  calendar: StoreCalendar;
  year: number;
  month: number;
}>;

export const exportCalendarMonth = async (
  calendarGateway: CalendarGateway,
  imageGateway: CalendarImageGateway,
  { calendar, year, month }: ExportCalendarMonthInput,
): Promise<void> =>
  imageGateway.downloadPng({
    calendar,
    year,
    month,
    days: buildBusinessMonth(
      calendar,
      year,
      month,
      calendarGateway.holidays(year),
    ),
  });
