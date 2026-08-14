import { describe, expect, it } from "vitest";

import { buildItemInteractor } from "../src/wire/interactor-factory";

describe("interactor factory", () => {
  it("connects DummyGateway to ItemInteractor", async () => {
    const items = await buildItemInteractor().listItems();

    expect(items).toHaveLength(1);
    expect(items[0]?.title.value).toBe("Dummy item");
  });
});
