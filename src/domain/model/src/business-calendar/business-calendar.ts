export type IsoDate = `${number}-${number}-${number}`;
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type CalendarTheme = "minimal" | "natural" | "japanese";
export type OrdinalClosure = Readonly<{
  ordinal: 1 | 2 | 3 | 4 | 5;
  weekday: Weekday;
}>;
export type BusinessRules = Readonly<{
  weeklyClosures: readonly Weekday[];
  ordinalClosures: readonly OrdinalClosure[];
  holidays: "open" | "closed";
  regularClosureOnHoliday: "open" | "closed";
  substituteClosure: "none" | "next-day";
  specialOpenDates: readonly IsoDate[];
  specialClosedDates: readonly IsoDate[];
}>;
export type BusinessHours = Readonly<{
  open: string;
  close: string;
  breakTime?: Readonly<{ start: string; end: string }>;
}>;
export type StoreCalendar = Readonly<{
  storeName: string;
  businessHours: Readonly<{
    weekday: BusinessHours;
    weekendHoliday: BusinessHours;
  }>;
  note: string;
  theme: CalendarTheme;
  mainColor: string;
  rules: BusinessRules;
}>;
export type DayKind =
  | "open"
  | "regular-closed"
  | "holiday-closed"
  | "substitute-closed"
  | "special-open"
  | "special-closed";
export type CalendarDay = Readonly<{
  date: IsoDate;
  day: number;
  weekday: Weekday;
  isHoliday: boolean;
  holidayName?: string;
  isOpen: boolean;
  kind: DayKind;
  reason: string;
}>;

export const defaultStoreCalendar = (): StoreCalendar => ({
  storeName: "わたしのお店",
  businessHours: {
    weekday: { open: "10:00", close: "18:00" },
    weekendHoliday: { open: "10:00", close: "18:00" },
  },
  note: "営業時間は変更になる場合があります",
  theme: "natural",
  mainColor: "#a55233",
  rules: {
    weeklyClosures: [1],
    ordinalClosures: [],
    holidays: "open",
    regularClosureOnHoliday: "open",
    substituteClosure: "next-day",
    specialOpenDates: [],
    specialClosedDates: [],
  },
});
const pad = (value: number) => String(value).padStart(2, "0");
export const toIsoDate = (year: number, month: number, day: number): IsoDate =>
  `${year}-${pad(month)}-${pad(day)}` as IsoDate;
const isRegularClosure = (date: Date, rules: BusinessRules) =>
  rules.weeklyClosures.includes(date.getDay() as Weekday) ||
  rules.ordinalClosures.some(
    (closure) =>
      closure.weekday === date.getDay() &&
      closure.ordinal === Math.ceil(date.getDate() / 7),
  );

/** 明示指定、振替、祝日、定休、通常営業の順で一月分を判定します。 */
export function buildBusinessMonth(
  calendar: StoreCalendar,
  year: number,
  month: number,
  holidays: ReadonlyMap<IsoDate, string>,
): readonly CalendarDay[] {
  const daysInMonth = new Date(year, month, 0).getDate();
  const substitutions = new Map<IsoDate, IsoDate>();
  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, month - 1, day);
    const isoDate = toIsoDate(year, month, day);
    if (
      holidays.has(isoDate) &&
      isRegularClosure(date, calendar.rules) &&
      calendar.rules.regularClosureOnHoliday === "open" &&
      calendar.rules.substituteClosure === "next-day"
    ) {
      const following = new Date(year, month - 1, day + 1);
      substitutions.set(
        toIsoDate(
          following.getFullYear(),
          following.getMonth() + 1,
          following.getDate(),
        ),
        isoDate,
      );
    }
  }
  return Array.from({ length: daysInMonth }, (_, index): CalendarDay => {
    const day = index + 1;
    const date = new Date(year, month - 1, day);
    const isoDate = toIsoDate(year, month, day);
    const weekday = date.getDay() as Weekday;
    const holidayName = holidays.get(isoDate);
    const base = {
      date: isoDate,
      day,
      weekday,
      isHoliday: holidayName !== undefined,
      ...(holidayName === undefined ? {} : { holidayName }),
    };
    if (calendar.rules.specialOpenDates.includes(isoDate))
      return {
        ...base,
        isOpen: true,
        kind: "special-open",
        reason: "臨時営業日として指定されています。",
      };
    if (calendar.rules.specialClosedDates.includes(isoDate))
      return {
        ...base,
        isOpen: false,
        kind: "special-closed",
        reason: "臨時休業日として指定されています。",
      };
    const substitutionFor = substitutions.get(isoDate);
    if (substitutionFor !== undefined)
      return {
        ...base,
        isOpen: false,
        kind: "substitute-closed",
        reason: `${substitutionFor}の祝日営業による振替休業です。`,
      };
    const regularClosure = isRegularClosure(date, calendar.rules);
    if (holidayName !== undefined) {
      if (regularClosure && calendar.rules.regularClosureOnHoliday === "closed")
        return {
          ...base,
          isOpen: false,
          kind: "regular-closed",
          reason: "定休日のため休業します。",
        };
      if (!regularClosure && calendar.rules.holidays === "closed")
        return {
          ...base,
          isOpen: false,
          kind: "holiday-closed",
          reason: `${holidayName}のため休業します。`,
        };
      return {
        ...base,
        isOpen: true,
        kind: "open",
        reason: regularClosure
          ? "通常は定休日ですが、祝日のため営業します。"
          : `${holidayName}も営業します。`,
      };
    }
    if (regularClosure)
      return {
        ...base,
        isOpen: false,
        kind: "regular-closed",
        reason: "定休日のため休業します。",
      };
    return { ...base, isOpen: true, kind: "open", reason: "通常営業日です。" };
  });
}
