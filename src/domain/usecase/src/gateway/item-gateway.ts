import type { TemplateItem } from "@template/model";

export interface ItemGateway {
  /** 保存されているテンプレート項目をすべて取得します。 */
  findAll(): Promise<readonly TemplateItem[]>;
}
