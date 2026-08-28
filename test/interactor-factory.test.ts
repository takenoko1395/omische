import { expect, it } from "vitest";
import { buildCalendarInteractor } from "../src/wire/interactor-factory";
it("カレンダーInteractorを構築する", () => {
  expect(buildCalendarInteractor().load().storeName).toBe("わたしのお店");
});
