import type { IsoDate, StoreCalendar } from "@omische/model";
import type { CalendarGateway } from "@omische/usecase";
const STORAGE_KEY = "omische.calendar.v1";
const FIXED_HOLIDAYS: ReadonlyArray<readonly [number, number, string]> = [
  [1, 1, "元日"],
  [2, 11, "建国記念の日"],
  [2, 23, "天皇誕生日"],
  [4, 29, "昭和の日"],
  [5, 3, "憲法記念日"],
  [5, 4, "みどりの日"],
  [5, 5, "こどもの日"],
  [8, 11, "山の日"],
  [11, 3, "文化の日"],
  [11, 23, "勤労感謝の日"],
];
const pad = (value: number) => String(value).padStart(2, "0");
const nthMonday = (year: number, month: number, nth: number) => {
  const first = new Date(year, month - 1, 1).getDay();
  return 1 + ((8 - first) % 7) + (nth - 1) * 7;
};
/** ブラウザ保存形式とDomain Model、日本の祝日データを相互変換します。 */
export class BrowserCalendarGateway implements CalendarGateway {
  public load(): StoreCalendar | undefined {
    const value = globalThis.localStorage?.getItem(STORAGE_KEY);
    if (value === null || value === undefined) return undefined;
    return JSON.parse(value) as StoreCalendar;
  }
  public save(calendar: StoreCalendar): void {
    globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(calendar));
  }
  public holidays(year: number): ReadonlyMap<IsoDate, string> {
    const entries: Array<readonly [IsoDate, string]> = FIXED_HOLIDAYS.map(
      ([month, day, name]) => [
        `${year}-${pad(month)}-${pad(day)}` as IsoDate,
        name,
      ],
    );
    const variable: ReadonlyArray<readonly [number, number, string]> = [
      [1, nthMonday(year, 1, 2), "成人の日"],
      [7, nthMonday(year, 7, 3), "海の日"],
      [9, nthMonday(year, 9, 3), "敬老の日"],
      [10, nthMonday(year, 10, 2), "スポーツの日"],
    ];
    for (const [month, day, name] of variable)
      entries.push([`${year}-${pad(month)}-${pad(day)}` as IsoDate, name]);
    return new Map(entries);
  }
}
