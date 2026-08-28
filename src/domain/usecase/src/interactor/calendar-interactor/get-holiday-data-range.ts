import type { CalendarGateway } from "../../gateway/calendar-gateway";

export type HolidayDataRange = Readonly<{
  oldestYear: number;
  newestYear: number;
}>;

export function getHolidayDataRange(
  gateway: CalendarGateway,
): HolidayDataRange | undefined {
  const years = gateway.supportedHolidayYears();
  if (years.length === 0) return undefined;
  return {
    oldestYear: Math.min(...years),
    newestYear: Math.max(...years),
  };
}
