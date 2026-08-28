import type { CalendarDay, StoreCalendar } from "@omische/model";
import type { CalendarGateway } from "../gateway/calendar-gateway";
import type { CalendarImageGateway } from "../gateway/calendar-image-gateway";
import { buildCalendarMonth } from "./calendar-interactor/build-calendar-month";
import {
  exportCalendarMonth,
  type ExportCalendarMonthInput,
} from "./calendar-interactor/export-calendar-month";
import {
  getHolidayDataRange,
  type HolidayDataRange,
} from "./calendar-interactor/get-holiday-data-range";
import {
  getSubstituteClosureWarnings,
  type SubstituteClosureWarning,
} from "./calendar-interactor/get-substitute-closure-warnings";
import { hasHolidayData } from "./calendar-interactor/has-holiday-data";
import { loadCalendar } from "./calendar-interactor/load-calendar";
import { saveCalendar } from "./calendar-interactor/save-calendar";
import { setExceptionRange } from "./calendar-interactor/set-exception-range";

export type {
  ExportCalendarMonthInput,
  HolidayDataRange,
  SubstituteClosureWarning,
};

export class CalendarInteractor {
  public constructor(
    private readonly calendarGateway: CalendarGateway,
    private readonly imageGateway: CalendarImageGateway,
  ) {}

  /** 保存済み設定、または初期設定を取得します。 */
  public load(): StoreCalendar {
    return loadCalendar(this.calendarGateway);
  }

  /** 店舗カレンダー設定を保存します。 */
  public save(calendar: StoreCalendar): StoreCalendar {
    return saveCalendar(this.calendarGateway, calendar);
  }

  /** 指定範囲を臨時営業日または臨時休業日として保存します。 */
  public setExceptionRange(
    calendar: StoreCalendar,
    kind: "open" | "closed",
    start: string,
    end: string,
  ): StoreCalendar {
    return setExceptionRange(this.calendarGateway, calendar, kind, start, end);
  }

  /** 指定月の営業日と休業日を取得します。 */
  public month(
    calendar: StoreCalendar,
    year: number,
    month: number,
  ): readonly CalendarDay[] {
    return buildCalendarMonth(this.calendarGateway, calendar, year, month);
  }

  /** 祝日データの最古年と最新年を取得します。 */
  public holidayDataRange(): HolidayDataRange | undefined {
    return getHolidayDataRange(this.calendarGateway);
  }

  /** 指定年の祝日データが存在するか判定します。 */
  public hasHolidayData(year: number): boolean {
    return hasHolidayData(this.calendarGateway, year);
  }

  /** 祝日によって繰り延べられる振替休業を取得します。 */
  public substituteClosureWarnings(
    calendar: StoreCalendar,
    from: Date,
    monthsAhead = 11,
  ): readonly SubstituteClosureWarning[] {
    return getSubstituteClosureWarnings(
      this.calendarGateway,
      calendar,
      from,
      monthsAhead,
    );
  }

  /** 指定月の営業日カレンダーをPNG画像として保存します。 */
  public async exportMonth(input: ExportCalendarMonthInput): Promise<void> {
    await exportCalendarMonth(this.calendarGateway, this.imageGateway, input);
  }
}
