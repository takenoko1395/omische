import {
  defaultStoreCalendar,
  type IsoDate,
  type StoreCalendar,
} from "@omische/model";
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
const isoDate = (year: number, month: number, day: number) =>
  `${year}-${pad(month)}-${pad(day)}` as IsoDate;
const nthMonday = (year: number, month: number, nth: number) => {
  const first = new Date(year, month - 1, 1).getDay();
  return 1 + ((8 - first) % 7) + (nth - 1) * 7;
};
const equinoxDay = (year: number, season: "spring" | "autumn") =>
  Math.floor(
    (season === "spring" ? 20.8431 : 23.2488) +
      0.242194 * (year - 1980) -
      Math.floor((year - 1980) / 4),
  );
const followingDate = (date: IsoDate) => {
  const [year = 0, month = 0, day = 0] = date.split("-").map(Number);
  const next = new Date(year, month - 1, day + 1);
  return isoDate(next.getFullYear(), next.getMonth() + 1, next.getDate());
};
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
    const holidays = new Map<IsoDate, string>(
      FIXED_HOLIDAYS.map(([month, day, name]) => [
        isoDate(year, month, day),
        name,
      ]),
    );
    // 法律で「第N月曜日」と定められている、年によって日付が動く祝日です。
    const mondayHolidays: ReadonlyArray<readonly [number, number, string]> = [
      [1, nthMonday(year, 1, 2), "成人の日"],
      [7, nthMonday(year, 7, 3), "海の日"],
      [9, nthMonday(year, 9, 3), "敬老の日"],
      [10, nthMonday(year, 10, 2), "スポーツの日"],
    ];
    for (const [month, day, name] of mondayHolidays)
      holidays.set(isoDate(year, month, day), name);
    holidays.set(isoDate(year, 3, equinoxDay(year, "spring")), "春分の日");
    holidays.set(isoDate(year, 9, equinoxDay(year, "autumn")), "秋分の日");

    // 祝日に挟まれた平日を国民の休日として扱います。
    for (let month = 1; month <= 12; month += 1) {
      const days = new Date(year, month, 0).getDate();
      for (let day = 2; day < days; day += 1) {
        const date = isoDate(year, month, day);
        if (
          !holidays.has(date) &&
          holidays.has(isoDate(year, month, day - 1)) &&
          holidays.has(isoDate(year, month, day + 1))
        )
          holidays.set(date, "国民の休日");
      }
    }

    // 日曜日の祝日は、次に現れる祝日でない日を振替休日にします。
    for (const date of [...holidays.keys()].sort()) {
      const [holidayYear = 0, month = 0, day = 0] = date.split("-").map(Number);
      if (new Date(holidayYear, month - 1, day).getDay() !== 0) continue;
      let substitute = followingDate(date);
      while (holidays.has(substitute)) substitute = followingDate(substitute);
      if (substitute.startsWith(`${year}-`))
        holidays.set(substitute, "振替休日");
    }
    return holidays;
  }
}
