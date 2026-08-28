import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { parseJapaneseHolidayCsv } from "./japanese-holiday-csv.mjs";

describe("parseJapaneseHolidayCsv", () => {
  it("CP932のCSVを読み込み、日付と日本語祝日名を正規化する", async () => {
    const data = parseJapaneseHolidayCsv(
      await readFile(resolve("resources/syukujitsu.csv")),
    );

    expect(data.holidays["2026-01-01"]).toBe("元日");
    expect(data.holidays["2026-01-12"]).toBe("成人の日");
    expect(data.holidays["2027-01-01"]).toBe("元日");
    expect(data.years).toContain(2026);
    expect(data.years).toContain(2027);
    expect(data.years).not.toContain(2028);
  });

  it("不正なヘッダーを拒否する", () => {
    expect(() =>
      parseJapaneseHolidayCsv(Buffer.from("date,name\n2026/1/1,new year\n")),
    ).toThrow("CSVヘッダーが想定と異なります");
  });
});
