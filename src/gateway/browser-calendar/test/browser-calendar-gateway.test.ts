import { afterEach, describe, expect, it, vi } from "vitest";
import { buildBusinessMonth, defaultStoreCalendar } from "@omische/model";
import { BrowserCalendarGateway } from "../src";

afterEach(() => vi.unstubAllGlobals());

describe("BrowserCalendarGateway.holidays", () => {
  it("生成済みデータから春分・秋分と休日を返す", () => {
    const holidays = new BrowserCalendarGateway().holidays(2026);

    expect(holidays.get("2026-03-20")).toBe("春分の日");
    expect(holidays.get("2026-09-23")).toBe("秋分の日");
    expect(holidays.get("2026-05-06")).toBe("休日");
  });

  it("CSVに含まれる年だけを対応年として扱う", () => {
    const gateway = new BrowserCalendarGateway();

    expect(gateway.supportedHolidayYears().at(0)).toBe(1955);
    expect(gateway.supportedHolidayYears().at(-1)).toBe(2027);
    expect(gateway.supportedHolidayYears()).toContain(2026);
    expect(gateway.supportedHolidayYears()).toContain(2027);
    expect(gateway.supportedHolidayYears()).not.toContain(2028);
    expect(gateway.holidays(2028)).toEqual(new Map());
  });

  it("CSVの祝日を既存の祝日営業・休業ルールへ渡せる", () => {
    const gateway = new BrowserCalendarGateway();
    const base = defaultStoreCalendar();
    const closedCalendar = {
      ...base,
      rules: { ...base.rules, holidays: "closed" as const },
    };

    expect(
      buildBusinessMonth(base, 2026, 1, gateway.holidays(2026))[0],
    ).toMatchObject({
      date: "2026-01-01",
      holidayName: "元日",
      isOpen: true,
    });
    expect(
      buildBusinessMonth(closedCalendar, 2026, 1, gateway.holidays(2026))[0],
    ).toMatchObject({
      date: "2026-01-01",
      holidayName: "元日",
      isOpen: false,
      kind: "holiday-closed",
    });
  });

  it("以前の営業時間の保存形式を平日・土日祝の設定へ移行する", () => {
    vi.stubGlobal("localStorage", {
      getItem: () =>
        JSON.stringify({ storeName: "喫茶店", businessHours: "09:00 – 17:00" }),
    });

    expect(new BrowserCalendarGateway().load()?.businessHours).toEqual({
      weekday: { open: "09:00", close: "17:00" },
      weekendHoliday: { open: "09:00", close: "17:00" },
    });
  });
});
