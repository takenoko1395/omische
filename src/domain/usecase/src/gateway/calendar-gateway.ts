import type { IsoDate, StoreCalendar } from "@omische/model";
export interface CalendarGateway {
  /** 保存済みの店舗カレンダーを取得します。 */
  load(): StoreCalendar | undefined;
  /** 店舗カレンダーを保存します。 */
  save(calendar: StoreCalendar): void;
  /** 指定年の祝日を取得します。 */
  holidays(year: number): ReadonlyMap<IsoDate, string>;
  /** 祝日データを収録している年を取得します。 */
  supportedHolidayYears(): readonly number[];
}
