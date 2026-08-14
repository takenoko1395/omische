import type { TemplateItem } from "@template/model";

import type { ItemGateway } from "../gateway/item-gateway";
import { listItems } from "./item-interactor/list-items";

export class ItemInteractor {
  constructor(private readonly itemGateway: ItemGateway) {}

  /** 一覧表示に使うテンプレート項目を取得します。 */
  listItems(): Promise<readonly TemplateItem[]> {
    return listItems(this.itemGateway);
  }
}
