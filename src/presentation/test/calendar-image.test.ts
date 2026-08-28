import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildBusinessMonth,
  defaultStoreCalendar,
  type IsoDate,
} from "@omische/model";
import { exportPng } from "../src/pages/calendar-page";

afterEach(() => vi.unstubAllGlobals());

describe("exportPng", () => {
  it("画面と同じ祝日名をPNGへ描画する", async () => {
    let storeNameAlignment: CanvasTextAlign | undefined;
    const fillText = vi.fn((text: string) => {
      if (text === "わたしのお店") storeNameAlignment = context.textAlign;
    });
    const click = vi.fn();
    const context = {
      fillStyle: "",
      strokeStyle: "",
      font: "",
      lineWidth: 1,
      textAlign: "center",
      textBaseline: "middle",
      fillRect: vi.fn(),
      strokeRect: vi.fn(),
      fillText,
      measureText: (text: string) => ({ width: text.length * 10 }),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      roundRect: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
    } as unknown as CanvasRenderingContext2D;
    const canvas = {
      width: 0,
      height: 0,
      getContext: () => context,
      toDataURL: () => "data:image/png;base64,test",
    };
    const anchor = { download: "", href: "", click };
    vi.stubGlobal("document", {
      createElement: (tag: string) => (tag === "canvas" ? canvas : anchor),
    });
    const calendar = defaultStoreCalendar();
    const days = buildBusinessMonth(
      calendar,
      2026,
      1,
      new Map<IsoDate, string>([["2026-01-01", "元日"]]),
    );

    await exportPng(null, calendar, new Date(2026, 0, 1), days);

    expect(fillText).toHaveBeenCalledWith(
      "元日",
      expect.any(Number),
      expect.any(Number),
    );
    expect(storeNameAlignment).toBe("center");
    expect(canvas.width).toBe(1080);
    expect(canvas.height).toBe(1080);
    expect(anchor.download).toBe("business-calendar-2026-1.png");
    expect(click).toHaveBeenCalledOnce();
  });
});
