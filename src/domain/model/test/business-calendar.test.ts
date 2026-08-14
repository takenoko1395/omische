import { describe, expect, it } from "vitest";
import { buildBusinessMonth, defaultStoreCalendar, type IsoDate } from "../src";
describe("buildBusinessMonth", () => {
  it("祝日営業の翌日を振替休業にする", () => {
    const holidays = new Map<IsoDate, string>([["2026-09-21", "敬老の日"]]);
    const days = buildBusinessMonth(defaultStoreCalendar(), 2026, 9, holidays);
    expect(days[20]).toMatchObject({ isOpen: true, kind: "open" });
    expect(days[21]).toMatchObject({
      isOpen: false,
      kind: "substitute-closed",
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
