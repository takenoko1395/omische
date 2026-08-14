import type { TemplateItem } from "@template/model";

import type { ItemGateway } from "../../gateway/item-gateway";

export const listItems = (
  gateway: ItemGateway,
): Promise<readonly TemplateItem[]> => gateway.findAll();
