import type { CalendarGateway } from "../../gateway/calendar-gateway";

export const hasHolidayData = (gateway: CalendarGateway, year: number) =>
  gateway.supportedHolidayYears().includes(year);
