import {
  buildBusinessMonth,
  defaultStoreCalendar,
  type CalendarDay,
  type StoreCalendar,
} from "@omische/model";
import type { CalendarGateway } from "../gateway/calendar-gateway";
export class CalendarInteractor {
  public constructor(private readonly gateway: CalendarGateway) {}
  public load(): StoreCalendar {
    return this.gateway.load() ?? defaultStoreCalendar();
  }
  public save(calendar: StoreCalendar): StoreCalendar {
    this.gateway.save(calendar);
    return calendar;
  }
  public setExceptionRange(
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
          : calendar.rules.specialOpenDates.filter(
              (date) => !selected.has(date),
            ),
      specialClosedDates:
        kind === "closed"
          ? [...new Set([...calendar.rules.specialClosedDates, ...dates])]
          : calendar.rules.specialClosedDates.filter(
              (date) => !selected.has(date),
            ),
    } as StoreCalendar["rules"];
    return this.save({ ...calendar, rules });
  }
  public month(
    calendar: StoreCalendar,
    year: number,
    month: number,
  ): readonly CalendarDay[] {
    return buildBusinessMonth(
      calendar,
      year,
      month,
      this.gateway.holidays(year),
    );
  }
}
