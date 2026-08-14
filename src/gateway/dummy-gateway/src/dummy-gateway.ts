import type { TemplateItem } from "@template/model";
import type { ItemGateway } from "@template/usecase";

/** メモリ上の固定データを返す、開発・テスト用のGatewayです。 */
export class DummyGateway implements ItemGateway {
  readonly #items: readonly TemplateItem[];

  constructor(initialItems: readonly TemplateItem[] = []) {
    this.#items = [...initialItems];
  }

  async findAll(): Promise<readonly TemplateItem[]> {
    return [...this.#items];
  }
}
