import { describe, expect, it } from "vitest";

import { TemplateItemId, TemplateItemTitle } from "../src";

describe("TemplateItem values", () => {
  it("trims surrounding whitespace", () => {
    expect(new TemplateItemId(" item-id ").value).toBe("item-id");
    expect(new TemplateItemTitle(" Dummy item ").value).toBe("Dummy item");
  });

  it("rejects empty text", () => {
    expect(() => new TemplateItemId(" ")).toThrow();
    expect(() => new TemplateItemTitle(" ")).toThrow();
  });
});
