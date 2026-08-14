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
