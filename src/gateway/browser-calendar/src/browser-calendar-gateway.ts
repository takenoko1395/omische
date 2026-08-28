import {
  defaultStoreCalendar,
  type IsoDate,
  type StoreCalendar,
} from "@omische/model";
import type { CalendarGateway } from "@omische/usecase";
import holidayData from "./data/japanese-holidays.json";
const STORAGE_KEY = "omische.calendar.v1";
const HOLIDAYS_BY_YEAR = new Map<number, Map<IsoDate, string>>();
for (const [date, name] of Object.entries(holidayData.holidays)) {
  const year = Number(date.slice(0, 4));
  const holidays = HOLIDAYS_BY_YEAR.get(year) ?? new Map<IsoDate, string>();
  holidays.set(date as IsoDate, name);
  HOLIDAYS_BY_YEAR.set(year, holidays);
}
const SUPPORTED_HOLIDAY_YEARS = Object.freeze([...holidayData.years]);
/** ブラウザ保存形式とDomain Model、日本の祝日データを相互変換します。 */
export class BrowserCalendarGateway implements CalendarGateway {
  public load(): StoreCalendar | undefined {
    const value = globalThis.localStorage?.getItem(STORAGE_KEY);
    if (value === null || value === undefined) return undefined;
    const stored = JSON.parse(value) as Omit<
      Partial<StoreCalendar>,
      "businessHours"
    > & {
      businessHours?: StoreCalendar["businessHours"] | string;
    };
    if (typeof stored.businessHours === "string") {
      const [open = "10:00", close = "18:00"] = stored.businessHours
        .split(/[–-]/)
        .map((part) => part.trim());
      stored.businessHours = {
        weekday: { open, close },
        weekendHoliday: { open, close },
      };
    }
    return { ...defaultStoreCalendar(), ...stored } as StoreCalendar;
  }
  public save(calendar: StoreCalendar): void {
    globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(calendar));
  }
  public holidays(year: number): ReadonlyMap<IsoDate, string> {
    return HOLIDAYS_BY_YEAR.get(year) ?? new Map<IsoDate, string>();
  }
  public supportedHolidayYears(): readonly number[] {
    return SUPPORTED_HOLIDAY_YEARS;
  }
}
