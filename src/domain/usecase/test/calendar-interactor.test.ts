import { describe, expect, it } from "vitest";
import {
  defaultStoreCalendar,
  type IsoDate,
  type StoreCalendar,
} from "@omische/model";
import { CalendarInteractor, type CalendarGateway } from "../src";

class MemoryGateway implements CalendarGateway {
  public saved?: StoreCalendar;
  public holidayData: ReadonlyMap<IsoDate, string> = new Map<IsoDate, string>([
    ["2026-09-21", "敬老の日"],
    ["2026-09-22", "国民の休日"],
  ]);
  public load() {
    return undefined;
  }
  public save(calendar: StoreCalendar) {
    this.saved = calendar;
  }
  public holidays(year: number) {
    return year === 2026 ? this.holidayData : new Map<IsoDate, string>();
  }
}

describe("CalendarInteractor.setExceptionRange", () => {
  it("範囲内の全日を追加し、反対の個別指定を解除する", () => {
    const gateway = new MemoryGateway();
    const interactor = new CalendarInteractor(gateway);
    const base = defaultStoreCalendar();
    const calendar = {
      ...base,
      rules: { ...base.rules, specialOpenDates: ["2026-08-15" as const] },
    };

    const result = interactor.setExceptionRange(
      calendar,
      "closed",
      "2026-08-14",
      "2026-08-16",
    );

    expect(result.rules.specialClosedDates).toEqual([
      "2026-08-14",
      "2026-08-15",
      "2026-08-16",
    ]);
    expect(result.rules.specialOpenDates).toEqual([]);
    expect(gateway.saved).toBe(result);
  });
});

describe("CalendarInteractor.substituteClosureWarnings", () => {
  it("自動振替休業が祝日と重なる日を11カ月後まで通知する", () => {
    const interactor = new CalendarInteractor(new MemoryGateway());
    const base = defaultStoreCalendar();
    const calendar = {
      ...base,
      rules: {
        ...base.rules,
        weeklyClosures: [1 as const],
        substituteClosure: "next-day" as const,
      },
    };

    expect(
      interactor.substituteClosureWarnings(calendar, new Date(2026, 7, 14)),
    ).toEqual([
      expect.objectContaining({
        date: "2026-09-23",
        holidayNames: ["国民の休日"],
      }),
    ]);
  });

  it("手動で休業期間を決める場合は通知しない", () => {
    const interactor = new CalendarInteractor(new MemoryGateway());

    expect(
      interactor.substituteClosureWarnings(
        defaultStoreCalendar(),
        new Date(2026, 7, 14),
      ),
    ).toEqual([]);
  });

  it("翌日が祝日でなければ自動振替休業でも通知しない", () => {
    const gateway = new MemoryGateway();
    gateway.holidayData = new Map<IsoDate, string>([
      ["2026-09-21", "敬老の日"],
    ]);
    const interactor = new CalendarInteractor(gateway);
    const base = defaultStoreCalendar();
    const calendar = {
      ...base,
      rules: { ...base.rules, substituteClosure: "next-day" as const },
    };

    expect(
      interactor.substituteClosureWarnings(calendar, new Date(2026, 7, 14)),
    ).toEqual([]);
  });

  it("探索開始日より前にある競合は通知しない", () => {
    const interactor = new CalendarInteractor(new MemoryGateway());
    const base = defaultStoreCalendar();
    const calendar = {
      ...base,
      rules: { ...base.rules, substituteClosure: "next-day" as const },
    };

    expect(
      interactor.substituteClosureWarnings(calendar, new Date(2026, 9, 1)),
    ).toEqual([]);
  });
});
