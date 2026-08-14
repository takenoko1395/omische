import type { IsoDate, StoreCalendar } from "@omische/model";
export interface CalendarGateway {
  load(): StoreCalendar | undefined;
  save(calendar: StoreCalendar): void;
  holidays(year: number): ReadonlyMap<IsoDate, string>;
}
