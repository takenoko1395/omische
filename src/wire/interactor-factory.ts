import { DummyGateway } from "@template/dummy-gateway";
import {
  TemplateItem,
  TemplateItemId,
  TemplateItemTitle,
} from "@template/model";
import { ItemInteractor } from "@template/usecase";

export const buildItemInteractor = (): ItemInteractor =>
  new ItemInteractor(
    new DummyGateway([
      new TemplateItem(
        new TemplateItemId("first-item"),
        new TemplateItemTitle("Dummy item"),
      ),
    ]),
  );
