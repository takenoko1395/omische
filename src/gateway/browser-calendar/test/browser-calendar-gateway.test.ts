import { afterEach, describe, expect, it, vi } from "vitest";
import { BrowserCalendarGateway } from "../src";

afterEach(() => vi.unstubAllGlobals());

describe("BrowserCalendarGateway.holidays", () => {
  it("春分・秋分と振替休日を含む日本の休日を返す", () => {
    const holidays = new BrowserCalendarGateway().holidays(2026);

    expect(holidays.get("2026-03-20")).toBe("春分の日");
    expect(holidays.get("2026-09-23")).toBe("秋分の日");
    expect(holidays.get("2026-05-06")).toBe("振替休日");
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
