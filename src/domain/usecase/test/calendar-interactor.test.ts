import { describe, expect, it } from "vitest";
import { defaultStoreCalendar, type StoreCalendar } from "@omische/model";
import { CalendarInteractor, type CalendarGateway } from "../src";

class MemoryGateway implements CalendarGateway {
  public saved?: StoreCalendar;
  public load() {
    return undefined;
  }
  public save(calendar: StoreCalendar) {
    this.saved = calendar;
  }
  public holidays() {
    return new Map();
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
