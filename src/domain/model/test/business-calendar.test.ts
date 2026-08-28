import { describe, expect, it } from "vitest";
import { buildBusinessMonth, defaultStoreCalendar, type IsoDate } from "../src";
describe("buildBusinessMonth", () => {
  const holidayRuleDays = (
    holidaysRule: "open" | "closed",
    regularClosureOnHoliday: "open" | "closed",
  ) => {
    const base = defaultStoreCalendar();
    const calendar = {
      ...base,
      rules: {
        ...base.rules,
        holidays: holidaysRule,
        regularClosureOnHoliday,
        substituteClosure: "none" as const,
      },
    };
    const holidays = new Map<IsoDate, string>([
      ["2026-09-21", "敬老の日"],
      ["2026-09-23", "秋分の日"],
    ]);
    const days = buildBusinessMonth(calendar, 2026, 9, holidays);
    return { regularClosure: days[20], regularOpenDay: days[22] };
  };

  it("祝日をいつもの曜日どおり営業する", () => {
    const days = holidayRuleDays("open", "closed");

    expect(days.regularClosure.isOpen).toBe(false);
    expect(days.regularOpenDay.isOpen).toBe(true);
  });

  it("定休日と重なった祝日も営業する", () => {
    const days = holidayRuleDays("open", "open");

    expect(days.regularClosure.isOpen).toBe(true);
    expect(days.regularOpenDay.isOpen).toBe(true);
  });

  it("通常の営業曜日と重なった祝日も休業する", () => {
    const days = holidayRuleDays("closed", "closed");

    expect(days.regularClosure.isOpen).toBe(false);
    expect(days.regularOpenDay.isOpen).toBe(false);
  });

  it("祝日営業の翌日を振替休業にする", () => {
    const holidays = new Map<IsoDate, string>([["2026-09-21", "敬老の日"]]);
    const base = defaultStoreCalendar();
    const calendar = {
      ...base,
      rules: { ...base.rules, substituteClosure: "next-day" as const },
    };
    const days = buildBusinessMonth(calendar, 2026, 9, holidays);
    expect(days[20]).toMatchObject({ isOpen: true, kind: "open" });
    expect(days[21]).toMatchObject({
      isOpen: false,
      kind: "substitute-closed",
    });
  });
  it("振替休業を自分で設定する場合は翌日を自動で休業にしない", () => {
    const holidays = new Map<IsoDate, string>([["2026-09-21", "敬老の日"]]);
    const days = buildBusinessMonth(defaultStoreCalendar(), 2026, 9, holidays);

    expect(days[21]).toMatchObject({ isOpen: true, kind: "open" });
  });
  it("振替休業の翌日も祝日なら次の平日まで繰り延べる", () => {
    const base = defaultStoreCalendar();
    const calendar = {
      ...base,
      rules: { ...base.rules, substituteClosure: "next-day" as const },
    };
    const holidays = new Map<IsoDate, string>([
      ["2026-09-21", "敬老の日"],
      ["2026-09-22", "国民の休日"],
    ]);
    const days = buildBusinessMonth(calendar, 2026, 9, holidays);

    expect(days[20]).toMatchObject({ isOpen: true, kind: "open" });
    expect(days[21]).toMatchObject({ isOpen: true, kind: "open" });
    expect(days[22]).toMatchObject({
      date: "2026-09-23",
      isOpen: false,
      kind: "substitute-closed",
      substitutionFor: "2026-09-21",
      deferredByHolidays: ["国民の休日"],
    });
  });
  it("個別指定を最優先する", () => {
    const base = defaultStoreCalendar();
    const calendar = {
      ...base,
      rules: {
        ...base.rules,
        specialOpenDates: ["2026-09-22" as const],
        specialClosedDates: ["2026-09-21" as const],
      },
    };
    const holidays = new Map<IsoDate, string>([["2026-09-21", "敬老の日"]]);
    const days = buildBusinessMonth(calendar, 2026, 9, holidays);
    expect(days[20].kind).toBe("special-closed");
    expect(days[21].kind).toBe("special-open");
  });
  it("第N曜日休業を判定する", () => {
    const base = defaultStoreCalendar();
    const calendar = {
      ...base,
      rules: {
        ...base.rules,
        weeklyClosures: [],
        ordinalClosures: [{ ordinal: 3 as const, weekday: 2 as const }],
      },
    };
    expect(buildBusinessMonth(calendar, 2026, 8, new Map())[17].kind).toBe(
      "regular-closed",
    );
  });
});
