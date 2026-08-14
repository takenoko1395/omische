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
  substitutionFor?: IsoDate;
  deferredByHolidays?: readonly string[];
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
    substituteClosure: "none",
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
  const substitutions = new Map<
    IsoDate,
    Readonly<{ source: IsoDate; deferredByHolidays: readonly string[] }>
  >();
  for (const [isoDate] of [...holidays.entries()].sort(([a], [b]) =>
    a.localeCompare(b),
  )) {
    const [holidayYear = 0, holidayMonth = 0, holidayDay = 0] = isoDate
      .split("-")
      .map(Number);
    const date = new Date(holidayYear, holidayMonth - 1, holidayDay);
    if (
      isRegularClosure(date, calendar.rules) &&
      calendar.rules.regularClosureOnHoliday === "open" &&
      calendar.rules.substituteClosure === "next-day"
    ) {
      const following = new Date(holidayYear, holidayMonth - 1, holidayDay + 1);
      let target = toIsoDate(
        following.getFullYear(),
        following.getMonth() + 1,
        following.getDate(),
      );
      const deferredByHolidays: string[] = [];
      let deferredHoliday = holidays.get(target);
      while (deferredHoliday !== undefined) {
        deferredByHolidays.push(deferredHoliday);
        following.setDate(following.getDate() + 1);
        target = toIsoDate(
          following.getFullYear(),
          following.getMonth() + 1,
          following.getDate(),
        );
        deferredHoliday = holidays.get(target);
      }
      if (!substitutions.has(target))
        substitutions.set(target, { source: isoDate, deferredByHolidays });
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
    const substitution = substitutions.get(isoDate);
    if (substitution !== undefined)
      return {
        ...base,
        isOpen: false,
        kind: "substitute-closed",
        reason: `${substitution.source}の祝日営業による振替休業です。`,
        substitutionFor: substitution.source,
        deferredByHolidays: substitution.deferredByHolidays,
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
